import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../app/src/main/assets/www/app.js',import.meta.url),'utf8');
const store=await readFile(new URL('../app/src/main/assets/www/store.js',import.meta.url),'utf8');
const match=source.match(/function toggleRow\(id,label,isRaw=false,art=''\)\{[^\n]+\}/);
assert.ok(match,'Detail checklist row renderer not found');
const seen=[];
const owned=new Set(['main:1:Male','coll:shiny:1']);
const checked=key=>{seen.push(key);return owned.has(key);};
const get=key=>key==='favorite:1';
const safe=x=>String(x);
const toggleRow=new Function('checked','get','safe',match[0]+';return toggleRow;')(checked,get,safe);

const male=toggleRow('main:1:Male','Male');
assert.ok(male.includes('switch on'),'Owned male Bulbasaur must show ON');
assert.ok(male.includes('data-check="main:1:Male"'));
assert.equal(seen.at(-1),'main:1:Male','Switch must not double-prefix saved key');
const female=toggleRow('main:1:Female','Female');
assert.ok(female.includes('switch '));
assert.ok(!female.includes('switch on'),'Unowned female Bulbasaur must show OFF');
assert.equal(seen.at(-1),'main:1:Female');
const shiny=toggleRow('coll:shiny:1','Shiny Pokémon');
assert.ok(shiny.includes('switch on'),'Owned shiny collection should show ON');
assert.equal(seen.at(-1),'coll:shiny:1');
const favorite=toggleRow('favorite:1','Favorite',true);
assert.ok(favorite.includes('switch on'),'Raw favorites should still work');
assert.equal(seen.length,3,'Raw favorite should not read through the checklist key helper');
assert.ok(source.includes('const yes=isRaw?Boolean(get(id)):checked(id);'));
assert.ok(store.includes("const LOCAL_KEY='pldt_v01_entries'"),'Save format must remain unchanged');
assert.ok(source.includes('checked(`main:${id}:${s}`)'),'Progress calculation must use same saved key');

console.log('✅ Living Dex detail switches match stored gender, Shiny and Favorite progress.');
