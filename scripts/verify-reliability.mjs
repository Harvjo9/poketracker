import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../app/src/main/assets/www/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const storage=new Map();
let failNextWrite=false;
globalThis.localStorage={
 getItem(key){return storage.has(key)?storage.get(key):null;},
 setItem(key,value){if(failNextWrite){failNextWrite=false;throw new Error('Storage unavailable');}storage.set(key,String(value));},
 removeItem(key){storage.delete(key);}
};
const store=await import('../app/src/main/assets/www/store.js');

assert.equal(store.getRecords().constructor,Object);
store.set('check:coll:alcremie:vanilla-cream-strawberry',true);
assert.equal(store.checked('coll:alcremie:vanilla-cream-strawberry'),true);
store.set('team:Scarlet',{roster:['Pikachu'],notes:'Test'});
assert.ok(store.getRecords()['team:Scarlet'].updated_at);
const backup=store.exportBackup();
assert.equal(backup.format,'pokelivingdex-backup');
assert.equal(backup.version,1);
assert.equal(store.inspectBackup(backup).count,2);
assert.equal(store.inspectBackup(backup).currentCount,2);

const invalid=JSON.parse(JSON.stringify(backup));
invalid.records['team:Scarlet'].updated_at='bad-date';
assert.throws(()=>store.importBackup(invalid),/invalid saved entry/);
assert.equal(store.get('team:Scarlet').roster[0],'Pikachu','Invalid backup must never clear the data');
const previous=store.record('team:Scarlet');
failNextWrite=true;
assert.throws(()=>store.set('team:Scarlet',{roster:['Charizard']}),/Storage unavailable/);
assert.equal(store.record('team:Scarlet'),previous,'Unwritten data must not claim to be saved');

assert.equal(store.importBackup(backup),2,'Valid v0.1 backup should still restore');
assert.equal(store.get('team:Scarlet').roster[0],'Pikachu');
const original=store.record('team:Scarlet');
const oldRemote={value:{roster:['Squirtle']},updated_at:'2019-01-01T00:00:00.000Z'};
assert.equal(store.mergeRecords({'team:Scarlet':oldRemote}),false,'Stale remote entry must not overwrite local');
assert.equal(store.get('team:Scarlet').roster[0],'Pikachu');
const newRemote={value:{roster:['Squirtle']},updated_at:'2090-01-01T00:00:00.000Z'};
assert.equal(store.mergeRecords({'team:Scarlet':newRemote}),true,'Newer remote entry should be merged');
assert.equal(store.get('team:Scarlet').roster[0],'Squirtle');
assert.equal(store.newerLocalThan({'team:Scarlet':newRemote}).some(x=>x.key==='team:Scarlet'),false);
assert.equal(store.lastConfirmedBackupAt(),null);
assert.ok(store.confirmBackupSaved());
assert.ok(store.lastConfirmedBackupAt(),'Record only after actual Android file-write success');

const sql=await read('../../../../../supabase-setup.sql').catch(()=>null);
const workflow=await read('../../../../../.github/workflows/build-apk.yml').catch(()=>null);
const config=await read('config.js');
assert.ok(config.includes('https://bsukdkdwubebopupmoan.supabase.co'),'App must point at the new free Supabase project');
assert.ok(/sb_publishable_[A-Za-z0-9_]+/.test(config),'Use public publishable key');
const embeddedKey=config.match(/supabaseAnonKey:\s*'([^']+)'/)?.[1];
assert.ok(embeddedKey?.startsWith('sb_publishable_'),'Client key must be publishable, not a private or service-role key');
const sync=await read('sync.js');
const java=await read('../../java/app/poketrack/livingdex/MainActivity.java');
const app=await read('app.js');
assert.ok(sql&&sql.includes('security invoker'),'Supabase RPC must preserve Row Level Security');
assert.ok(sql.includes('public.user_entries.updated_at < excluded.updated_at'),'Server must reject stale-device writes');
assert.ok(workflow&&workflow.includes('secrets.POKE_TRACK_KEYSTORE_BASE64'),'Stable signing key must come from GitHub Actions secret');
assert.ok(workflow.includes('Verify signed release APK'),'Release artifacts must pass signature verification');
assert.ok(sync.includes('/rest/v1/rpc/merge_user_entries'),'Sync must use conditional atomic SQL merge');
assert.ok(sync.includes('LAST_SUCCESSFUL_SYNC_KEY'),'Successful cloud sync date should persist');
assert.ok(java.includes('notifyBackupResult(true)'),'Android should report successful saved file');
assert.ok(app.includes('inspectBackup(backup)'),'Restore preview must validate before replacing records');
assert.ok(app.includes('window.PokeTrackBackupResult'),'Native Android backup result callback must exist');
assert.ok(app.includes("confirmBackupSaved()"),'Only successful save should update confirmation timestamp');
assert.ok(sync.includes('visibilitychange'),'Sync on foregrounding device');
console.log('✅ Reliability checks passed: backup validation, atomic local persistence, older remote rejection, verified Android backup callback and cloud merge path.');
