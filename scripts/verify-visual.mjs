import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COLLECTIONS,collectionEntries} from '../app/src/main/assets/www/data.js';
import {entryArtSources,exactFormArtAvailable,EXACT_FORM_IMAGES} from '../app/src/main/assets/www/entry-art.js';
import {EVENT_DISTRIBUTIONS,WORLDS_DISTRIBUTIONS} from '../app/src/main/assets/www/distributions.js';
const folder=new URL('../app/src/main/assets/www/',import.meta.url);
const read=async name=>readFile(new URL(name,folder),'utf8');
const js=await read('app.js'),html=await read('index.html'),visual=await read('entry-visual.css'),store=await read('store.js');
const get=id=>COLLECTIONS.find(x=>x.id===id);
const examples=[
 ['alcremie',get('alcremie').items.find(x=>x.id==='ruby-cream-star'),'869-ruby-cream-star-sweet.png'],
 ['vivillon',get('vivillon').items.find(x=>x.id==='archipelago'),'666-archipelago.png'],
 ['unown',get('unown').items.find(x=>x.id==='question'),'201-question.png'],
 ['furfrou',get('furfrou').items.find(x=>x.id==='heart-trim'),'676-heart.png'],
 ['regional',get('regional').items.find(x=>x.id==='alolan-raichu'),'10100.png'],
 ['gmax',get('gmax').items.find(x=>x.id==='gigantamax-charizard'),'10196.png'],
 ['mega',get('mega').items.find(x=>x.id==='mega:6:mega-x:charizard-mega-x'),'10034.png'],
];
for(const [coll,item,art] of examples){assert.ok(item,'Sample catalog entry missing: '+coll);const src=entryArtSources(coll,item);assert.ok(src[0].endsWith('/'+art),'Wrong artwork for '+coll+': '+src[0]);assert.ok(exactFormArtAvailable(coll,item),'Missing exact art metadata: '+coll);}
assert.equal(get('alcremie').items.length,63);
assert.equal(get('vivillon').items.length,20);
assert.equal(get('unown').items.length,28);
assert.equal(get('furfrou').items.length,10);
assert.equal(get('regional').items.length,58);
assert.equal(get('gmax').items.length,32);
assert.equal(get('mega').items.length,97);
assert.ok(Object.keys(EXACT_FORM_IMAGES).length>=400,'Expected mapped exact images');
assert.equal(EVENT_DISTRIBUTIONS.length,6);
assert.equal(WORLDS_DISTRIBUTIONS.length,5);
assert.ok(get('events').starter&&get('worlds').starter,'Distribution lists must not imply completeness');
assert.equal(get('events').items.length,6);
assert.equal(get('worlds').items.length,5);
assert.ok(html.includes('entry-visual.css'),'Stylesheet missing');
assert.ok(js.includes('collectionEntryRow(coll,item)'),'Collection image row not rendered');
assert.ok(js.includes('alcremieTabs(all)'),'Alcremie cream selector missing');
assert.ok(js.includes('data-distribution-year'),'Event year selector missing');
assert.ok(js.includes('data-more="collection"'),'Collection paging missing');
assert.ok(visual.includes('visual-entry-grid'),'Image grid styles missing');
assert.ok(store.includes("const LOCAL_KEY='pldt_v01_entries'"),'Saved progress key changed');
console.log('✅ Visual Dex tests: 63 Alcremie pictures, 20 Vivillon, 28 Unown, 10 Furfrou, mapped region/Mega/Gmax art; 11 documented distribution starter records.');
