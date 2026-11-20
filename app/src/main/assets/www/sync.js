import {getRecords,mergeRecords,newerLocalThan,owner,setOwner,subscribe} from './store.js';
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
const listeners=new Set();
let session=null;let running=false;let scheduled=null;let syncInterval=null;
export const configured=()=>Boolean(url&&key&&/^https:\/\//.test(url));
export const sessionUser=()=>session?.user||null;
export let syncStatus={mode:configured()?'signed-out':'unconfigured',message:configured()?'Sign in to sync':'Cloud setup required',lastSync:null};
export function onSyncChange(fn){listeners.add(fn);return()=>listeners.delete(fn)}
function status(mode,message,additional={}){syncStatus={...syncStatus,mode,message,...additional};listeners.forEach(fn=>fn(syncStatus));}
function headers(token,extra={}){return {'apikey':key,'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{}) ,...extra};}
async function request(path,method='GET',payload=null,access=null,extra={}){const res=await fetch(url+path,{method,headers:headers(access,extra),...(payload!==null?{body:JSON.stringify(payload)}:{})});if(!res.ok){const raw=(await res.text()).slice(0,500);let reason=raw;try{const data=JSON.parse(raw);reason=data.msg||data.message||data.error_description||data.error||raw;}catch{}throw new Error(`${reason} (${res.status})`);}const raw=await res.text();if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function saveSession(result){if(owner()&&owner()!==result.user?.id){status('error','This device has progress from another sync account. Export a backup, clear local data, then sign in again.');return false;}session={access_token:result.access_token,refresh_token:result.refresh_token,expires_at:Math.floor(Date.now()/1000)+(result.expires_in||3600),user:result.user};localStorage.setItem(SESSION_KEY,JSON.stringify(session));setOwner(session.user.id);status('connected',`Signed in as ${session.user.email||'your account'}`);queueSync(0);return true;}
async function refresh(){if(!session?.refresh_token)return false;try{const next=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:session.refresh_token});return saveSession(next);}catch(e){session=null;localStorage.removeItem(SESSION_KEY);status('signed-out','Session expired. Please sign in again.');return false}}
async function validToken(){if(!session)return null;if(session.expires_at<Math.floor(Date.now()/1000)+90){if(!await refresh())return null;}return session.access_token;}
export async function initializeSync(){if(!configured())return;try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{session=null;}if(session){if(owner()&&owner()!==session.user?.id){status('error','Local data belongs to another account.');return;}status('connected','Signed in. Sync starting…');queueSync(100)}else{status('signed-out','Sign in to sync across devices')}subscribe(()=>queueSync(1800));window.addEventListener('online',()=>queueSync(300));syncInterval=setInterval(()=>{if(session)queueSync(0)},30000)}
export async function requestEmailCode(email){if(!configured())throw new Error('Set up Supabase first.');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Enter a valid email address.');await request('/auth/v1/otp','POST',{email,create_user:true});status('signed-out','Check your email for the sign-in code.');}
export async function verifyEmailCode(email,code){const result=await request('/auth/v1/verify','POST',{email,token:code.trim(),type:'email'});if(!result?.access_token)throw new Error('No session returned. Check the email OTP template.');if(!saveSession(result))throw new Error('A different account already owns the local progress on this device.');return result.user;}
export async function signOut(){if(session?.access_token){try{await request('/auth/v1/logout','POST',{},session.access_token)}catch{}}session=null;localStorage.removeItem(SESSION_KEY);status('signed-out','Signed out. Local progress remains on this device.');}
export function queueSync(delay=900){if(!session||!configured())return;clearTimeout(scheduled);scheduled=setTimeout(()=>{syncNow().catch(e=>status('error',`Sync issue: ${e.message}`))},delay)}
export async function syncNow(){if(!configured()||!session||running)return; if(!navigator.onLine){status('offline','Offline — progress saved on this device.');return;}const token=await validToken();if(!token)return;running=true;status('syncing','Syncing changes…');try{
 const id=encodeURIComponent(session.user.id);
 const fetched=await request(`/rest/v1/user_entries?user_id=eq.${id}&select=entry_key,value,updated_at`,'GET',null,token);
 const remote={};for(const item of fetched||[]){remote[item.entry_key]={value:item.value,updated_at:item.updated_at}};
 const localNewer=newerLocalThan(remote);
 if(localNewer.length){for(let index=0;index<localNewer.length;index+=250){const rows=localNewer.slice(index,index+250).map(item=>({user_id:session.user.id,entry_key:item.key,value:item.value,updated_at:item.updated_at}));await request('/rest/v1/user_entries?on_conflict=user_id,entry_key','POST',rows,token,{'Prefer':'resolution=merge-duplicates,return=minimal'});}}
 mergeRecords(remote);
 status('connected','Cloud sync up to date',{lastSync:new Date().toISOString()});
 }catch(error){status('error',`Could not sync: ${error.message}`);throw error}finally{running=false}}
