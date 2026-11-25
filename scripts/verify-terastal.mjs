import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TERA_TYPES,TERA_TYPE_ENTRIES,TERA_NOTE,teraTypeById,isTeraType,teraSlotKey,teraOwnedKey} from '../app/src/main/assets/www/terastal.js';
import {COLLECTIONS,slots,collectionEntries} from '../app/src/main/assets/www/data.js';

const allTypes=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy','stellar'];
assert.deepEqual(TERA_TYPES.map(t=>t.id),allTypes,'Must include 18 standard types and Stellar');
assert.equal(new Set(TERA_TYPES.map(t=>t.name)).size,19);
assert.ok(TERA_TYPES.every(t=>t.icon&&/^#[a-fA-F0-9]{6}$/.test(t.color)));
assert.equal(TERA_TYPES.length,19);
assert.equal(TERA_TYPE_ENTRIES.length,19);
assert.equal(teraTypeById('stellar').name,'Stellar');
assert.equal(isTeraType('???'),false);
assert.equal(isTeraType('stellar'),true);
assert.equal(teraSlotKey(1,'Male'),'tera:slot:1:Male');
assert.equal(teraSlotKey(1,'Female'),'tera:slot:1:Female');
assert.notEqual(teraSlotKey(1,'Male'),teraSlotKey(1,'Female'));
assert.notEqual(teraOwnedKey(1,'fire'),teraOwnedKey(2,'fire'));
assert.notEqual(teraOwnedKey(1,'fire'),'coll:tera-types:fire');

const coll=COLLECTIONS.find(c=>c.id==='tera-types');
assert.ok(coll&&coll.complete&&coll.group==='special');
assert.deepEqual(collectionEntries(coll,[]).map(x=>x.id),allTypes);
assert.ok(/NOT an official Pokémon HOME reward Dex/.test(TERA_NOTE));

const storage=new Map();
globalThis.localStorage={
 getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k)
};
const store=await import('../app/src/main/assets/www/store.js');
store.set(teraSlotKey(1,'Male'),'fire');
store.set(teraSlotKey(1,'Female'),'stellar');
store.toggleCheck(teraOwnedKey(1,'fire'));
store.toggleCheck('coll:tera-types:stellar');
assert.equal(store.get(teraSlotKey(1,'Male')),'fire');
assert.equal(store.get(teraSlotKey(1,'Female')),'stellar');
assert.ok(store.checked(teraOwnedKey(1,'fire')));
assert.ok(!store.checked(teraOwnedKey(2,'fire')));
assert.ok(store.checked('coll:tera-types:stellar'));
assert.ok(!store.checked('coll:tera-types:fire'),'Recording a fire specimen must not auto-complete global Fire');
assert.ok(!store.checked('main:1:Male'),'Recording a Tera type must not mark main Dex');
assert.ok(!store.checked('coll:shiny:1'),'Recording a Tera type must not mark Shiny Dex');
const backup=store.exportBackup();
assert.equal(store.inspectBackup(backup).count,4);
store.set(teraSlotKey(1,'Male'),'grass');
assert.equal(store.importBackup(backup),4);
assert.equal(store.get(teraSlotKey(1,'Male')),'fire');
assert.ok(store.checked(teraOwnedKey(1,'fire')),'Backup restore retains species Tera variants');
assert.ok(store.checked('coll:tera-types:stellar'),'Backup restore retains global Tera collection');

const root=new URL('../app/src/main/assets/www/',import.meta.url);
const app=await readFile(new URL('app.js',root),'utf8');
const css=await readFile(new URL('terastal.css',root),'utf8');
const html=await readFile(new URL('index.html',root),'utf8');
assert.ok(html.includes('terastal.css'),'Tera styles must be bundled in Android app');
assert.ok(css.includes('.tera-slot-fields')&&css.includes('.tera-owned-grid'));
const a=app.indexOf('function teraTracker(mon,options){'),b=app.indexOf('\nfunction detail(){',a);
assert.ok(a>=0&&b>a,'Terastal tracker must render within Pokémon detail');
const helper=app.slice(a,b);
const safe=s=>String(s);
const state={detailGroups:new Set(['tera-owned'])};
const mockTerastal=new Function('TERA_TYPES','checked','get','teraSlotKey','teraOwnedKey','isTeraType','state','safe',helper+';return teraTracker;')(
 TERA_TYPES,store.checked,store.get,teraSlotKey,teraOwnedKey,isTeraType,state,safe
);
const page=mockTerastal({id:1,name:'Bulbasaur'},slots(1));
assert.ok(page.includes('value="fire" selected'),'Owned male copy should render correct Tera type');
assert.ok(page.includes('value="stellar" selected'),'Owned female copy should render correct Tera type');
assert.ok(page.includes('data-tera-slot="Male"'));
assert.ok(page.includes('data-tera-slot="Female"'));
assert.ok(page.includes('data-check="tera:owned:1:fire"'),'Extra species types need independent checkbox');
assert.ok(page.includes('aria-label="Extra Tera types collected for Bulbasaur"'));
assert.ok(app.includes("coll.id==='tera-types'"),'Global Tera collection must show type cards');
assert.ok(app.includes("set(teraSlotKey(id,slot),type)"),'Dropdown must persist Tera field via synced records');
assert.ok(app.includes("slots(id).includes(slot)"),'Do not accept unexpected slot names');
assert.ok(app.includes("root.querySelector('.detail-sheet')?.scrollTop"),'Modal scroll must survive rerender');
assert.ok(app.includes("data-tera-expand"),'Species variants should be collapsible');
console.log('✅ 19 Terastal types, per-copy dropdowns, species optional variants, global collection, cloud/local backup keys and progress independence verified.');
