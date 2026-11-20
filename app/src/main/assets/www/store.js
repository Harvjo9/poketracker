const LOCAL_KEY='pldt_v01_entries';
const OWNER_KEY='pldt_v01_owner';
const listeners=new Set();
let records={};
try{const saved=JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved;}catch(err){console.warn('Saved progress could not be loaded',err);}
let lastTime=0;
const stamp=()=>new Date(lastTime=Math.max(Date.now(),lastTime+1)).toISOString();
export const get=(key,fallback=false)=>records[key]?.value??fallback;
export const record=(key)=>records[key];
export const getRecords=()=>({...records});
export const subscribe=(handler)=>{listeners.add(handler);return()=>listeners.delete(handler)};
function changed(){localStorage.setItem(LOCAL_KEY,JSON.stringify(records));listeners.forEach(handler=>handler());}
export function set(key,value){records[key]={value,updated_at:stamp()};changed();}
export const checked=(key)=>get(`check:${key}`)===true;
export function toggleCheck(key){set(`check:${key}`,!checked(key));}
export function getCustomItems(id){const items=get(`items:${id}`,[]);return Array.isArray(items)?items:[];}
export function addCustomItem(id,name){const current=getCustomItems(id);const clean=name.trim().slice(0,100);if(!clean)return false;const code=`custom-${clean.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;if(current.some(x=>x.id===code))return false;set(`items:${id}`,[...current,{id:code,name:clean}]);return true;}
export function deleteCustomItem(id,code){set(`items:${id}`,getCustomItems(id).filter(x=>x.id!==code));}
export function mergeRecords(remote){let modified=false;for(const [key,row] of Object.entries(remote)){if(!row||typeof row.updated_at!=='string'||!Object.prototype.hasOwnProperty.call(row,'value'))continue;if(!records[key]||row.updated_at>records[key].updated_at){records[key]=row;modified=true;}}if(modified)changed();return modified;}
export function newerLocalThan(remote){return Object.entries(records).filter(([key,row])=>!remote[key]||row.updated_at>remote[key].updated_at).map(([key,row])=>({key,...row}));}
export function exportBackup(){return {format:'pokelivingdex-backup',version:1,exported_at:new Date().toISOString(),records:getRecords()};}
export function importBackup(backup){if(backup?.format!=='pokelivingdex-backup'||backup.version!==1||!backup.records||typeof backup.records!=='object'||Array.isArray(backup.records))throw new Error('Not a recognized v0.1 backup.');const entries=Object.entries(backup.records);if(entries.length>30000)throw new Error('Backup is larger than expected.');const next={};for(const [key,row] of entries){if(!key||key.length>256||!row||typeof row!=='object'||!Object.prototype.hasOwnProperty.call(row,'value'))continue;next[key]={value:row.value,updated_at:stamp()};}records=next;changed();return entries.length;}
export const owner=()=>localStorage.getItem(OWNER_KEY);
export function setOwner(id){if(!owner())localStorage.setItem(OWNER_KEY,id);}
export function clearLocalData(){records={};localStorage.removeItem(OWNER_KEY);changed();}
