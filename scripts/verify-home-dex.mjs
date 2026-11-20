import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HOME_DEX_DEFINITIONS} from '../app/src/main/assets/www/home-game-dex.js';
const base=new URL('../app/src/main/assets/www/',import.meta.url);
const read=path=>readFile(new URL(path,base),'utf8');
const [app,html,css,oldStore,originalData]=await Promise.all(['app.js','index.html','home-game.css','store.js','data.js'].map(read));
const expected=new Map(Object.entries({
 'kanto-lg':150,'kanto-gba':150,'galar':400,'isle-armor':210,'crown-tundra':210,
 'sinnoh':150,'hisui':242,'paldea':400,'kitakami':200,'blueberry':240,
 'lumiose':230,'hyperspace':131,'mega':81
}));
assert.equal(HOME_DEX_DEFINITIONS.length,13,'Expected all 13 distinct game reward lists');
for(const dex of HOME_DEX_DEFINITIONS){
 assert.ok(expected.has(dex.id),'Unexpected HOME Dex '+dex.id);
 const required=dex.kind==='mega'?dex.rows.filter(x=>!x.optional):dex.rows;
 assert.equal(required.length,expected.get(dex.id),'Wrong reward requirement count for '+dex.id);
 assert.equal(dex.requiredCount,required.length,'Published HOME requirement count mismatch '+dex.id);
 assert.equal(new Set(dex.rows.map(x=>dex.kind==='mega'?x.id:x[1])).size,dex.rows.length,'Duplicate species/form in '+dex.id);
 assert.ok(dex.origin&&dex.reward&&dex.groupId,'Every game Dex needs an origin rule, reward, and group');
 if(dex.kind!=='mega'){
  assert.ok(dex.rows.every(([num,id])=>Number.isInteger(num)&&Number.isInteger(id)&&id>0&&id<=1025),'Invalid species entry in '+dex.id);
  assert.ok(dex.rows.every(([num],i)=>i===0||num>dex.rows[i-1][0]),'Entries not sorted in '+dex.id);
 }
}
const mega=HOME_DEX_DEFINITIONS.find(d=>d.id==='mega');
assert.equal(mega.rows.length,93,'HOME shows 93 total Mega Evolution entries');
assert.equal(mega.rows.filter(x=>x.optional).length,12,'HOME reward excludes 12 event/ranked Mega forms');
assert.ok(!HOME_DEX_DEFINITIONS.find(d=>d.id==='kanto-lg').rows.some(([num,sid])=>sid===151),'Lets Go Mew should not count');
assert.ok(!HOME_DEX_DEFINITIONS.find(d=>d.id==='isle-armor').rows.some(([num,sid])=>sid===893),'Isle of Armor Zarude should not count');
assert.ok(!HOME_DEX_DEFINITIONS.find(d=>d.id==='blueberry').rows.some(([num,sid])=>[1009,1010,1025].includes(sid)),'Blueberry special species count is wrong');
assert.ok(!HOME_DEX_DEFINITIONS.find(d=>d.id==='hyperspace').rows.some(([num,sid])=>sid===807),'Zeraora is not a required Hyperspace entry');
assert.ok(app.includes('gameGroupProgress'),'HOME game cards must display combined progress');
assert.ok(app.includes('gameTabs(coll)'),'HOME game groups must contain individual Dex tabs');
assert.ok(app.includes('data-game-dex'),'HOME game tabs must be clickable');
assert.ok(app.includes('coll.gameDex?items.filter(item=>item.required!==false'),'Optional mega entries must not inflate reward progress');
assert.ok(app.includes('gameDefinitions(id.slice(5))'),'Game selection must find corresponding Dex entries');
assert.ok(app.includes('toggleCheck(key(c.id,target.dataset.collectionEntry))'),'Tapping a game entry must update the right independent Dex');
assert.ok(originalData.includes("id:'firered-leafgreen'"),'Existing HOME game group ID changed');
assert.ok(oldStore.includes("const LOCAL_KEY='pldt_v01_entries'"),'Existing local progress format changed');
assert.ok(html.includes('home-game.css')&&css.includes('.game-dex-tab'),'Game tabs stylesheet not bundled');
console.log('✅ HOME game Dex tests: all 13 filled, origin-qualified, separated progress, 93 Mega entries (81 reward-required), preserved saves.');
