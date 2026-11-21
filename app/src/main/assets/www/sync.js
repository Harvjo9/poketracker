import {mergeRecords,newerLocalThan,owner,setOwner,subscribe} from './store.js';
const conf=window.POKE_SYNC_CONFIG||{};
const SETUP_URL='pldt_v01_supabase_url';
const SETUP_KEY='pldt_v01_supabase_public_key';
const url=String(localStorage.getItem(SETUP_URL)||conf.supabaseUrl||'').trim().replace(/\/$/,'');
const key=String(localStorage.getItem(SETUP_KEY)||conf.supabaseAnonKey||'').trim();
export function saveCloudConfig(rawUrl,rawKey){
 let address;try{address=new URL(String(rawUrl).trim())}catch{throw new Error('Enter a valid Supabase project URL.')}
 if(address.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/i.test(address.hostname)||address.username||address.password||address.port||address.pathname!=='/'&&address.pathname!==''||address.search||address.hash)throw new Error('Use your project HTTPS URL ending in .supabase.co, with no extra path.');
 const publicKey=String(rawKey).trim();
 if(publicKey.length<20||!(/^[A-Za-z0-9_.-]+$/.test(publicKey)))throw new Error('Use the public publishable / anon key from Supabase.');
 localStorage.setItem(SETUP_URL,address.origin);localStorage.setItem(SETUP_KEY,publicKey);
}

const SESSION_KEY='pldt_v01_session';
const LAST_SUCCESSFUL_SYNC_KEY='poketrack_last_sync_at_v1';
const listeners=new Set();
let session=null;let running=false;let scheduled=null;let syncInterval=null;
export const configured=()=>Boolean(url&&key&&/^https:\/\//.test(url));
export const sessionUser=()=>session?.user||null;
export let syncStatus={mode:configured()?'signed-out':'unconfigured',message:configured()?'Sign in to sync':'Cloud setup required',lastSync:localStorage.getItem(LAST_SUCCESSFUL_SYNC_KEY)||null};
export function onSyncChange(fn){listeners.add(fn);return()=>listeners.delete(fn)}
function status(mode,message,additional={}){syncStatus={...syncStatus,mode,message,...additional};listeners.forEach(fn=>fn(syncStatus));}
function headers(token,extra={}){return {'apikey':key,'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{}) ,...extra};}
async function request(path,method='GET',payload=null,access=null,extra={}){const res=await fetch(url+path,{method,headers:headers(access,extra),...(payload!==null?{body:JSON.stringify(payload)}:{})});if(!res.ok){const raw=(await res.text()).slice(0,500);let reason=raw;try{const data=JSON.parse(raw);reason=data.msg||data.message||data.error_description||data.error||raw;}catch{}throw new Error(`${reason} (${res.status})`);}const raw=await res.text();if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function saveSession(result){if(owner()&&owner()!==result.user?.id){status('error','This device has progress from another sync account. Export a backup, clear local data, then sign in again.');return false;}session={access_token:result.access_token,refresh_token:result.refresh_token,expires_at:Math.floor(Date.now()/1000)+(result.expires_in||3600),user:result.user};localStorage.setItem(SESSION_KEY,JSON.stringify(session));setOwner(session.user.id);status('syncing',`Signed in as ${session.user.email||'your account'}; checking for changes…`);queueSync(0);return true;}
async function refresh(){if(!session?.refresh_token)return false;try{const next=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token});return saveSession(next);}catch(e){session=null;localStorage.removeItem(SESSION_KEY);status('signed-out','Session expired. Please sign in again.');return false}}
async function validToken(){if(!session)return null;if(session.expires_at<Math.floor(Date.now()/1000)+90){if(!await refresh())return null;}return session.access_token;}
export async function initializeSync(){if(!configured())return;try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{session=null;}if(session){if(owner()&&owner()!==session.user?.id){status('error','Local data belongs to another account.');return;}status('syncing','Signed in. Checking your cloud records…');queueSync(100)}else{status('signed-out','Sign in to sync across devices')}subscribe(()=>queueSync(1800));window.addEventListener('online',()=>queueSync(300));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueSync(500)});syncInterval=setInterval(()=>{if(session)queueSync(0)},30000)}
export async function requestEmailCode(email){if(!configured())throw new Error('Set up Supabase first.');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Enter a valid email address.');await request('/auth/v1/otp','POST',{email,create_user:true});status('signed-out','Check your email for the sign-in code.');}
export async function verifyEmailCode(email,code){const result=await request('/auth/v1/verify','POST',{email,token:code.trim(),type:'email'});if(!result?.access_token)throw new Error('No session returned. Check the email OTP template.');if(!saveSession(result))throw new Error('A different account already owns the local progress on this device.');return result.user;}
export async function signOut(){if(session?.access_token){try{await request('/auth/v1/logout','POST',{},session.access_token)}catch{}}session=null;localStorage.removeItem(SESSION_KEY);status('signed-out','Signed out. Local progress remains on this device.');}
export function queueSync(delay=900){if(!session||!configured())return;clearTimeout(scheduled);scheduled=setTimeout(()=>{syncNow().catch(e=>status('error',`Sync issue: ${e.message}`))},delay)}
export async function syncNow(){
 if(!configured()||!session||running)return;
 if(!navigator.onLine){status('offline','Offline — progress stays on this device and will sync when online.');return;}
 const token=await validToken();if(!token)return;
 running=true;
 status('syncing','Comparing device and cloud progress…');
 try{
  const id=encodeURIComponent(session.user.id);
  const path=`/rest/v1/user_entries?user_id=eq.${id}&select=entry_key,value,updated_at`;
  // Read the current cloud state before proposing any writes.
  const first=await request(path,'GET',null,token);
  const remote={};
  for(const item of first||[])remote[item.entry_key]={value:item.value,updated_at:item.updated_at};
  const updates=newerLocalThan(remote);
  for(let index=0;index<updates.length;index+=250){
   const batch=updates.slice(index,index+250).map(item=>({
    entry_key:item.key,value:item.value,updated_at:item.updated_at
   }));
   // The SQL function performs an atomic, timestamp-guarded UPSERT. A stale
   // device cannot overwrite a newer cloud entry after the first fetch.
   try{
    await request('/rest/v1/rpc/merge_user_entries','POST',{p_entries:batch},token);
   }catch(err){
    if(/merge_user_entries|PGRST202|schema cache|function.*not found/i.test(err.message)){
     throw new Error('Cloud setup needs the v0.3.3 Supabase SQL upgrade. Your local entries are still saved.');
    }
    throw err;
   }
  }
  // Re-read after uploads: another device may have written between both calls.
  const latest=await request(path,'GET',null,token);
  const finalRecords={};
  for(const item of latest||[])finalRecords[item.entry_key]={value:item.value,updated_at:item.updated_at};
  mergeRecords(finalRecords);
  const lastSync=new Date().toISOString();
  localStorage.setItem(LAST_SUCCESSFUL_SYNC_KEY,lastSync);
  status('connected','Cloud sync up to date',{lastSync});
 }catch(error){
  status('error',`Could not sync: ${error.message}`);
  throw error;
 }finally{running=false;}
}
