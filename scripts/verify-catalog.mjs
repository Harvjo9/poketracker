import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COLLECTIONS,collectionEntries,collectionById,FORM_CATALOG_COUNTS,slots} from '../app/src/main/assets/www/data.js';

const names=(await readFile(new URL('../app/src/main/assets/www/assets/names.txt',import.meta.url),'utf8')).trim().split(/[|\n]/);
assert.equal(names.length,1025,'National Dex must remain at 1,025 bundled species');
const species=names.map((slug,i)=>({id:i+1,name:slug.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ')}));
const expectedCounts={Alola:18,Galar:19,Hisui:17,Paldea:4};
assert.deepEqual(FORM_CATALOG_COUNTS.regions,expectedCounts);
assert.equal(FORM_CATALOG_COUNTS.variants,259);
assert.equal(FORM_CATALOG_COUNTS.variantFamilies,51);
assert.equal(FORM_CATALOG_COUNTS.gmax,32);
assert.equal(FORM_CATALOG_COUNTS.mega,97);
assert.equal(FORM_CATALOG_COUNTS.alphas,222);
for(const coll of COLLECTIONS){
 const entries=collectionEntries(coll,species);
 assert.equal(new Set(entries.map(i=>i.id)).size,entries.length,'duplicate '+coll.id);
 for(const item of entries){
  assert.equal(typeof item.name,'string',coll.id+' missing display name');
  if(item.speciesId!=null)assert.ok(item.speciesId>=1&&item.speciesId<=1025,coll.id+': '+item.name+' invalid species');
 }
}
for(const id of ['Lycanroc Midday','Oricorio Baile','Furfrou Heart']){
 assert.ok(collectionById('variants').items.some(item=>item.id===id),'lost old Variant id '+id);
}
for(const id of ['galarian-farfetch-d','paldean-tauros-combat','alolan-raichu']){
 assert.ok(collectionById('regional').items.some(item=>item.id===id),'lost old Regional id '+id);
}
assert.ok(collectionById('alpha').items.some(item=>item.id==='alpha-hisuian-braviary'),'lost prior Alpha Braviary target');
assert.ok(collectionById('gmax').items.some(item=>item.id==='gigantamax-charizard'),'lost prior Gmax Charizard target');
assert.deepEqual(slots(25),['Male','Female']);
assert.deepEqual(slots(81),['First','Second']);
assert.deepEqual(slots(32),['Male 1','Male 2']);
console.log('✅ Catalog validation: 1,025 species; 58 regional forms; 259 form variants; 32 Gmax, 97 Mega and 222 Alpha targets.');
