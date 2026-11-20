import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../app/src/main/assets/www/',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const [html,js,css,store]=await Promise.all(['index.html','app.js','theme.css','store.js'].map(read));

assert.match(html,/href="\.\/theme\.css"/,'Theme stylesheet must load from bundled assets');
assert.match(js,/const THEME_KEY='poketrack_appearance_v1'/,'Theme preference must have its own storage key');
assert.match(js,/localStorage\.setItem\(THEME_KEY,next\)/,'Selected theme should persist on this device');
assert.match(js,/document\.documentElement\.dataset\.theme=next/,'Theme must apply immediately');
assert.match(js,/data-theme-choice/,'Settings must have working theme selection buttons');
assert.match(js,/aria-pressed=/,'Theme buttons should report selected state');
for(const name of ['adventure','classic','night']){
 assert.ok(js.includes("id:'"+name+"'"),'Theme missing from options: '+name);
 assert.ok(css.includes('data-theme="'+name+'"'),'CSS missing theme palette: '+name);
}
assert.match(css,/\.collection-card\[data-collection="shiny"\]/,'Shiny Dex should receive its own accent color');
assert.match(css,/\.collection-card\[data-collection="regional"\]/,'Regional Dex should receive its own accent color');
assert.match(css,/\.detail-sheet/,'Pokémon details need theme styling');
assert.match(css,/\.bottom-nav/,'Bottom navigation needs theme styling');
assert.match(css,/\.theme-choice/,'Theme selector needs styled buttons');
assert.match(store,/const LOCAL_KEY='pldt_v01_entries'/,'The original saved-progress key must remain intact');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Theme CSS braces are unbalanced');
console.log('✅ Trainer theme checks: three selectable palettes, saved choice, collection accents and unchanged progress key.');
