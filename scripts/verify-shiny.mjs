import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COLLECTIONS,SHINY_FORM_ITEMS,collectionEntries} from '../app/src/main/assets/www/data.js';
import {SHINY_FORM_SOURCES,shinyFormExclusion,VERIFIED_LOCKED_FORM_REASONS} from '../app/src/main/assets/www/shiny-forms.js';
import {entryArtSources,shinyFormHasExactArtwork} from '../app/src/main/assets/www/entry-art.js';
import {SHINY_EXACT_SPRITES} from '../app/src/main/assets/www/shiny-art.js';

const root=new URL('../app/src/main/assets/www/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,styles,store]=await Promise.all(['app.js','entry-visual.css','store.js'].map(read));
const byId=id=>COLLECTIONS.find(x=>x.id===id);
assert.ok(byId('shiny'),'Original Shiny Species Dex must remain unchanged');
assert.ok(byId('shiny-forms'),'Shiny Forms Dex missing');
assert.equal(byId('shiny-forms').items,SHINY_FORM_ITEMS);
assert.ok(byId('shiny-forms').starter,'Shiny availability must not be described as a fully verified catalog');
assert.ok(SHINY_FORM_ITEMS.length>450,'Expected comprehensive set of shiny-form targets');
assert.equal(new Set(SHINY_FORM_ITEMS.map(x=>x.id)).size,SHINY_FORM_ITEMS.length,'Duplicate Shiny Form ID');
assert.ok(SHINY_FORM_SOURCES.some(x=>x.id==='alpha'));
for(const source of ['regional','variants','vivillon','alcremie','unown','furfrou','gmax','alpha']){
 assert.ok(SHINY_FORM_ITEMS.some(x=>x.sourceCollection===source),'Missing Shiny category: '+source);
}
const get=(coll,id)=>SHINY_FORM_ITEMS.find(x=>x.sourceCollection===coll&&x.originId===id);
const examples=[
 ['alcremie','ruby-cream-star','869-ruby-cream-star-sweet.png'],
 ['vivillon','archipelago','666-archipelago.png'],
 ['unown','question','201-question.png'],
 ['furfrou','heart-trim','676-heart.png'],
 ['regional','alolan-raichu','10100.png'],
 ['gmax','gigantamax-charizard','10196.png']
];
for(const [coll,id,file] of examples){
 const item=get(coll,id);assert.ok(item,'Missing shiny target '+coll+'/'+id);
 assert.equal(item.id,coll+'|'+id,'Shiny target stable ID changed');
 const urls=entryArtSources('shiny-forms',item);
 assert.equal(urls.length,1,'Shiny artwork needs verified single image fallback');
 assert.ok(urls[0].endsWith('/shiny/'+file),'Wrong shiny picture for '+coll+'/'+id+': '+urls[0]);
 assert.ok(shinyFormHasExactArtwork(item),'Exact shiny artwork flag absent: '+coll+'/'+id);
}
assert.equal(SHINY_FORM_ITEMS.filter(x=>x.sourceCollection==='alcremie').length,63);
assert.equal(SHINY_FORM_ITEMS.filter(x=>x.sourceCollection==='unown').length,28);
assert.equal(SHINY_FORM_ITEMS.filter(x=>x.sourceCollection==='furfrou').length,10);
assert.equal(SHINY_FORM_ITEMS.filter(x=>x.sourceCollection==='vivillon').length,19);
assert.equal(SHINY_FORM_ITEMS.filter(x=>x.sourceCollection==='regional').length,58);
assert.ok(!get('vivillon','pok-ball'),'Shiny locked Poké Ball Vivillon incorrectly collectible');
assert.ok(!get('gmax','gigantamax-melmetal'),'Shiny locked Gigantamax Melmetal incorrectly collectible');
assert.ok(!get('variants','801:original'),'Shiny locked original Magearna incorrectly collectible');
assert.ok(!get('variants','901:bloodmoon'),'Shiny locked Bloodmoon Ursaluna incorrectly collectible');
assert.ok(get('variants','647:ordinary'),'Shiny Keldeo must be available after 2025+ events');
assert.ok(get('variants','647:resolute'),'Shiny Keldeo Resolute must be available after 2025+ events');
assert.ok(SHINY_FORM_ITEMS.every(item=>item.independentlyTracked),'All forms require independent checkmarks');
assert.ok(app.includes("key('shiny-forms',shinyTarget.id)"),'Shiny toggle must use separate collection ownership key');
assert.ok(app.includes("shinySourceTabs(all)"),'Shiny category navigator is missing');
assert.ok(app.includes("alcremieTabs(all.filter(item=>item.sourceCollection==='alcremie'),true)"),'Shiny Alcremie filters must use shiny progress');
assert.ok(styles.includes('.shiny-mini-toggle'),'Shiny toggle style missing');
assert.ok(store.includes("const LOCAL_KEY='pldt_v01_entries'"),'Previous user save key changed');
console.log('✅ Shiny form collection passed: '+SHINY_FORM_ITEMS.length+' independently tracked entries, shiny art, exceptions and preserved save key.');
