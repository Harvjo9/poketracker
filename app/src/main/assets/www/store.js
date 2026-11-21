// Poké Track local-first record store.
// The v0.1 keys and backup format are intentionally unchanged for upgrades.
const LOCAL_KEY='pldt_v01_entries';
const OWNER_KEY='pldt_v01_owner';
const CONFIRMED_BACKUP_KEY='poketrack_backup_saved_at_v1';
const MAX_BACKUP_RECORDS=50000;
const listeners=new Set();
let records={};
try{
 const saved=JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}');
 if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved;
}catch(err){console.warn('Saved progress could not be loaded',err);}
let lastTime=0;
for(const row of Object.values(records)){
 const t=Date.parse(row?.updated_at);
 if(Number.isFinite(t))lastTime=Math.max(lastTime,t);
}
const stamp=()=>new Date(lastTime=Math.max(Date.now(),lastTime+1)).toISOString();
export const get=(key,fallback=false)=>records[key]?.value??fallback;
export const record=(key)=>records[key];
export const getRecords=()=>({...records});
export const subscribe=(handler)=>{listeners.add(handler);return()=>listeners.delete(handler)};
function persist(next){
 // Write first. If device storage fails, never pretend the new data was saved.
 localStorage.setItem(LOCAL_KEY,JSON.stringify(next));
 records=next;
 listeners.forEach(handler=>handler());
}
export function set(key,value){
 if(typeof key!=='string'||!key||key.length>256)throw new Error('Invalid checklist entry key.');
 persist({...records,[key]:{value,updated_at:stamp()}});
}
export const checked=(key)=>get(`check:${key}`)===true;
export function toggleCheck(key){set(`check:${key}`,!checked(key));}
export function getCustomItems(id){const items=get(`items:${id}`,[]);return Array.isArray(items)?items:[];}
export function addCustomItem(id,name){
 const current=getCustomItems(id),clean=name.trim().slice(0,100);
 if(!clean)return false;
 const code=`custom-${clean.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
 if(current.some(x=>x.id===code))return false;
 set(`items:${id}`,[...current,{id:code,name:clean}]);
 return true;
}
export function deleteCustomItem(id,code){set(`items:${id}`,getCustomItems(id).filter(x=>x.id!==code));}
export function mergeRecords(remote){
 let modified=false;
 const next={...records};
 for(const [key,row] of Object.entries(remote||{})){
  if(!row||typeof row.updated_at!=='string'||!Object.prototype.hasOwnProperty.call(row,'value'))continue;
  if(!next[key]||row.updated_at>next[key].updated_at){next[key]=row;modified=true;}
 }
 if(modified){
  persist(next);
  for(const row of Object.values(next)){const t=Date.parse(row?.updated_at);if(Number.isFinite(t))lastTime=Math.max(t,lastTime);}
 }
 return modified;
}
export function newerLocalThan(remote){
 return Object.entries(records).filter(([key,row])=>!remote[key]||row.updated_at>remote[key].updated_at).map(([key,row])=>({key,...row}));
}
export function exportBackup(){
 return {format:'pokelivingdex-backup',version:1,exported_at:new Date().toISOString(),records:getRecords()};
}
export function inspectBackup(backup){
 if(backup?.format!=='pokelivingdex-backup'||backup?.version!==1||!backup.records||typeof backup.records!=='object'||Array.isArray(backup.records)){
  throw new Error('Not a recognized Poké Track backup file.');
 }
 const entries=Object.entries(backup.records);
 if(entries.length>MAX_BACKUP_RECORDS)throw new Error('This backup contains more entries than expected.');
 for(const [key,row] of entries){
  if(!key||key.length>256||!row||typeof row!=='object'||Array.isArray(row)||!Object.prototype.hasOwnProperty.call(row,'value')||typeof row.updated_at!=='string'||!Number.isFinite(Date.parse(row.updated_at))){
   throw new Error('Backup has an invalid saved entry. Your current progress has not changed.');
  }
 }
 const exportedAt=typeof backup.exported_at==='string'&&Number.isFinite(Date.parse(backup.exported_at))?backup.exported_at:null;
 return {count:entries.length,exportedAt,currentCount:Object.keys(records).length};
}
export function importBackup(backup){
 const info=inspectBackup(backup);
 const next={};
 for(const [key,row] of Object.entries(backup.records))next[key]={value:row.value,updated_at:stamp()};
 // All entries are validated first. Local records only change after successful storage write.
 persist(next);
 return info.count;
}
export function lastConfirmedBackupAt(){
 try{return localStorage.getItem(CONFIRMED_BACKUP_KEY)||null}catch{return null}
}
export function confirmBackupSaved(){
 const at=new Date().toISOString();
 localStorage.setItem(CONFIRMED_BACKUP_KEY,at);
 return at;
}
export const owner=()=>localStorage.getItem(OWNER_KEY);
export function setOwner(id){if(!owner())localStorage.setItem(OWNER_KEY,id);}
export function clearLocalData(){
 persist({});
 localStorage.removeItem(OWNER_KEY);
}
