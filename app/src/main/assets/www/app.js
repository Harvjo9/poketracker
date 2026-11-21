import {loadSpecies,slots,sprite,MAX_DEX,GEN_NAMES,COLLECTIONS,SHINY_FORM_ITEMS,collectionById,collectionEntries,GAME_GROUPS,HOME_GAME_GROUPS} from './data.js';
import {SHINY_FORM_SOURCES,shinyFormExclusion} from './shiny-forms.js';
import {HOME_DEX_DEFINITIONS} from './home-game-dex.js';
import {checked,toggleCheck,get,set,subscribe,getCustomItems,addCustomItem,deleteCustomItem,exportBackup,inspectBackup,importBackup,lastConfirmedBackupAt,confirmBackupSaved,clearLocalData} from './store.js';
import {configured,sessionUser,syncStatus,onSyncChange,initializeSync,requestEmailCode,verifyMagicLink,signOut,syncNow,saveCloudConfig} from './sync.js';
import {entryArtSources,exactFormArtAvailable} from './entry-art.js';


// Local appearance preference only; Pokédex checklists and cloud sync remain untouched.
const THEME_KEY='poketrack_appearance_v1';
const THEMES=new Set(['adventure','classic','night']);
let selectedTheme='adventure';
try{
 const savedTheme=localStorage.getItem(THEME_KEY);
 if(THEMES.has(savedTheme))selectedTheme=savedTheme;
}catch(err){console.warn('Theme preference unavailable',err);}
document.documentElement.dataset.theme=selectedTheme;
function setAppearanceTheme(next){
 if(!THEMES.has(next))return;
 selectedTheme=next;
 document.documentElement.dataset.theme=next;
 try{localStorage.setItem(THEME_KEY,next)}catch(err){console.warn('Theme preference not saved',err);}
 render();
}
function themeSelector(){
 const options=[
  {id:'adventure',title:'Adventure',desc:'Bright Pokémon colors',colors:['#f44b64','#2c86eb','#ffcb36']},
  {id:'classic',title:'Classic Dex',desc:'Red · white · navy',colors:['#d92f45','#f8fafc','#172940']},
  {id:'night',title:'Trainer Night',desc:'Navy · electric blue',colors:['#172c51','#6b8af6','#ffcd54']}
 ];
 return `<div class="theme-grid" aria-label="Choose your Pokémon theme">${options.map(t=>`<button type="button" class="theme-choice ${selectedTheme===t.id?'selected':''}" data-theme-choice="${t.id}" aria-pressed="${selectedTheme===t.id}"><span class="theme-swatch" aria-hidden="true">${t.colors.map(color=>`<i style="background:${color}"></i>`).join('')}</span><strong>${t.title}</strong><small>${t.desc}</small><span class="theme-check" aria-hidden="true">${selectedTheme===t.id?'✓':''}</span></button>`).join('')}</div>`;
}

let species=[];
const state={view:'home',dexQuery:'',dexGen:0,dexFilter:'all',shown:60,detail:null,collection:null,collectionQuery:'',collectionFilter:'all',regionalRegion:'Alola',variantFamily:null,detailGroups:new Set(),collectionShown:72,alcremieCream:'All',shinySource:'All',distributionYear:'All',gameDex:null,teamGen:1,teamGame:'Red',authEmail:'',toast:''};
const root=document.getElementById('app');
const byId=(id)=>species[id-1];
const safe=(text)=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(id,small=false)=>`<img loading="lazy" alt="" class="mon-art ${small?'small':''}" src="${sprite(id)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-placeholder" style="display:none">●</span>`;

function normalizedMonQuery(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/^#\s*/,'');}
function pokemonSuggestions(value,limit=6){
 const query=normalizedMonQuery(value);if(!query)return [];
 const found=species.filter(mon=>normalizedMonQuery(mon.name).includes(query)||String(mon.id).startsWith(query));
 const rank=mon=>{const name=normalizedMonQuery(mon.name),number=String(mon.id);return name===query||number===query?0:name.startsWith(query)?1:number.startsWith(query)?2:3;};
 return found.sort((a,b)=>rank(a)-rank(b)||a.id-b.id).slice(0,limit);
}
function suggestionButtons(value,kind='dex',slot=0){
 const matches=pokemonSuggestions(value);if(!matches.length)return '';
 return '<div class="pokemon-suggestions" role="listbox" aria-label="Suggested Pokémon">'+matches.map(mon=>
   '<button type="button" class="pokemon-suggestion" role="option" '+
   (kind==='team'?'data-team-select="'+slot+'" data-pokemon="'+mon.id+'"':'data-mon="'+mon.id+'"')+'>'+
   '<span class="suggest-picture">'+img(mon.id,true)+'</span><span class="suggest-name">'+safe(mon.name)+'</span><small>#'+String(mon.id).padStart(4,'0')+'</small></button>'
 ).join('')+'</div>';
}

const fmt=(number)=>number.toLocaleString('en-US');
const key=(collection,id)=>`coll:${collection}:${id}`;
const isChecked=(collection,id)=>checked(key(collection,id));
function dexProgress(){let complete=0,slotsOwned=0;for(const mon of species){const keys=slots(mon.id);const yes=keys.filter(slot=>checked(`main:${mon.id}:${slot}`)).length;slotsOwned+=yes;if(yes===keys.length)complete++;}return {done:complete,total:species.length,slotsOwned,slotsTotal:species.length*2,pct:Math.round(100*complete/species.length)};}
function monProgress(id){const sl=slots(id);const own=sl.filter(s=>checked(`main:${id}:${s}`)).length;return {own,total:sl.length,complete:own===sl.length};}
function collectionItems(coll){return collectionEntries(coll,species,getCustomItems(coll.id));}
function collectionProgress(coll){const items=collectionItems(coll);const eligible=coll.gameDex?items.filter(item=>item.required!==false&&!String(item.id).startsWith('custom-')):items;const done=eligible.filter(item=>isChecked(coll.id,item.id)).length;return {done,total:eligible.length,pct:eligible.length?(coll.id==='shiny-forms'?Math.round(1000*done/eligible.length)/10:Math.round(100*done/eligible.length)):null};}
function circleProgress(value,size='medium'){return `<span class="ring ${size}" style="--value:${Math.max(0,value??0)}"><span>${value==null?'—':`${value}%`}</span></span>`;}
function progressBar(pct){return `<div class="progress-track"><span style="width:${Math.max(0,pct||0)}%"></span></div>`;}
function tag(text,kind='muted'){return `<span class="pill ${kind}">${safe(text)}</span>`;}
const backBtn=(target='collections')=>`<button class="back-btn" type="button" data-go="${target}" aria-label="Go back">‹</button>`;
function nav(){return `<nav class="bottom-nav" aria-label="Main navigation"><button data-go="home" class="${state.view==='home'?'active':''}"><span aria-hidden="true">🏠</span><small>Home</small></button><button data-go="dex" class="${state.view==='dex'?'active':''}"><span aria-hidden="true">📕</span><small>National</small></button><button data-go="collections" class="${['collections','collection'].includes(state.view)?'active':''}"><span aria-hidden="true">🧩</span><small>Collections</small></button><button data-go="teams" class="${state.view==='teams'?'active':''}"><span aria-hidden="true">🏆</span><small>Teams</small></button><button data-go="settings" class="${state.view==='settings'?'active':''}"><span aria-hidden="true">⚙️</span><small>Settings</small></button></nav>`}
function topbar(){return `<header class="topbar"><button data-go="home" class="brand"><span class="pokeball-logo"><span></span></span><span><strong>POKÉ <em>TRACK</em></strong><small>LIVING DEX · v0.3.5</small></span></button><button class="sync-indicator ${syncStatus.mode==='connected'?'synced':syncStatus.mode==='error'?'error':''}" data-go="settings" title="Cloud sync status"><span class="status-dot"></span>${syncStatus.mode==='connected'?'Synced':syncStatus.mode==='syncing'?'Syncing':syncStatus.mode==='offline'?'Offline':'Local mode'}</button></header>`;}
function home(){const p=dexProgress();const collectionWithItems=COLLECTIONS.filter(c=>['shiny-forms','vivillon','alcremie','unown','shiny','alpha'].includes(c.id));const complete=COLLECTIONS.filter(c=>{const d=collectionProgress(c);return d.total>0&&d.done===d.total;}).length;return `<section class="home-page"><div class="hero"><div class="hero-spark" aria-hidden="true">✦ ✦</div><div class="hero-top"><div><p class="eyebrow">YOUR COLLECTION ADVENTURE</p><h1>Every Pokémon.<br><span>Every milestone.</span></h1><p class="hero-sub">Your Living Dex, one checkmark at a time.</p></div>${circleProgress(p.pct,'large')}</div><div class="hero-bottom"><div><strong>${fmt(p.done)}</strong><span>Species complete</span></div><div><strong>${fmt(p.slotsOwned)}</strong><span>Pokémon owned</span></div><div><strong>${fmt(p.total-p.done)}</strong><span>Species to finish</span></div></div></div><div class="section-heading"><div><p class="eyebrow">QUICK ACCESS</p><h2>Your adventure</h2></div></div><div class="quick-grid"><button data-go="dex" class="quick-card"><span class="quick-icon blue">📕</span><b>National Dex</b><small>All ${fmt(MAX_DEX)} Pokémon</small><span class="quick-arrow">→</span></button><button data-go="collections" class="quick-card"><span class="quick-icon orange">🧩</span><b>Collections</b><small>${COLLECTIONS.length} different trackers</small><span class="quick-arrow">→</span></button><button data-go="teams" class="quick-card"><span class="quick-icon yellow">🏆</span><b>Champion Teams</b><small>Remember your rosters</small><span class="quick-arrow">→</span></button><button data-go="favorites" class="quick-card"><span class="quick-icon pink">💛</span><b>Favorites</b><small>Your personal picks</small><span class="quick-arrow">→</span></button></div><div class="section-heading"><div><p class="eyebrow">INDEPENDENT PROGRESS</p><h2>Collection snapshots</h2></div><button class="text-link" data-go="collections">View all →</button></div><div class="snapshot-list">${collectionWithItems.map(c=>{const cp=collectionProgress(c);return `<button class="snapshot-card" data-collection="${c.id}"><span class="collection-icon">${c.emoji}</span><span class="snapshot-text"><b>${safe(c.title)}</b><small>${fmt(cp.done)} of ${fmt(cp.total)} ${c.complete?'':'· starter list'}</small>${progressBar(cp.pct)}</span><strong>${cp.pct??'—'}${cp.pct==null?'':'%'}</strong></button>`}).join('')}</div><p class="muted-notice">Starter lists are expandable; they are not official completion requirements. Your progress is saved on this device and syncs when connected.</p></section>`;}
function dex(){const q=state.dexQuery.toLowerCase().trim();const filtered=species.filter(mon=>(!q||mon.name.toLowerCase().includes(q)||String(mon.id).includes(q.replace('#','')))&&(!state.dexGen||mon.gen===state.dexGen)&&(state.dexFilter==='all'||(state.dexFilter==='complete'?monProgress(mon.id).complete:!monProgress(mon.id).complete)));const p=dexProgress();return `<section class="page"><div class="page-title"><div><p class="eyebrow">NATIONAL LIVING DEX</p><h1>Pokédex <span class="count-title">#0001–#${MAX_DEX}</span></h1><p class="page-sub">Two of each species. Track male + female, or two of the available gender.</p></div></div><div class="stat-strip"><div><strong>${fmt(p.done)} / ${fmt(p.total)}</strong><small>species complete</small></div>${circleProgress(p.pct,'small')}</div>${progressBar(p.pct)}<div class="dex-autocomplete"><label class="search-field"><span>⌕</span><input id="dex-search" data-input="dex-search" type="search" placeholder="Search Pokémon by name or number" value="${safe(state.dexQuery)}" autocomplete="off"></label>${suggestionButtons(state.dexQuery)}</div><div class="chips" aria-label="Generation filter"><button data-gen="0" class="${!state.dexGen?'selected':''}">All gens</button>${GEN_NAMES.map((g,i)=>`<button data-gen="${i+1}" class="${state.dexGen===i+1?'selected':''}">Gen ${i+1}</button>`).join('')}</div><div class="segmented"><button data-filter="all" class="${state.dexFilter==='all'?'active':''}">All</button><button data-filter="missing" class="${state.dexFilter==='missing'?'active':''}">Need</button><button data-filter="complete" class="${state.dexFilter==='complete'?'active':''}">Complete</button></div><div class="list-info"><b>${fmt(filtered.length)} Pokémon</b><span>Tap to update</span></div><div class="mon-list">${filtered.slice(0,state.shown).map(mon=>monRow(mon)).join('')||`<div class="empty">No Pokémon match these filters.</div>`}</div>${filtered.length>state.shown?`<button class="load-more" data-more="dex">Load more (${fmt(filtered.length-state.shown)} remaining)</button>`:''}</section>`;}
function monRow(mon){const p=monProgress(mon.id);return `<button class="mon-row" data-mon="${mon.id}"><span class="mon-picture">${img(mon.id,true)}</span><span class="mon-info"><small>#${String(mon.id).padStart(4,'0')} · Gen ${mon.gen}</small><strong>${safe(mon.name)}</strong></span><span class="owned-count ${p.complete?'complete':''}">${p.own}/2</span><span class="chevron">›</span></button>`;}
function collections(){const groups=[{key:'living',title:'Living & Shiny'},{key:'forms',title:'Forms & Regional'},{key:'special',title:'Special Pokémon'},{key:'records',title:'Records & Memorabilia'}];return `<section class="page"><div class="page-title"><p class="eyebrow">EVERY CHECKLIST COUNTS</p><h1>Collections</h1><p class="page-sub">Each Dex is completely independent. Checkmarks here never automatically change your National Dex.</p></div>${groups.map(group=>`<div class="collection-group"><div class="section-heading"><h2>${group.title}</h2></div><div class="collection-card-grid">${COLLECTIONS.filter(c=>c.group===group.key).map(c=>collectionCard(c)).join('')}</div></div>`).join('')}<div class="collection-group"><div class="section-heading"><h2>Pokémon HOME Rewards</h2></div><p class="muted-notice">Game-origin checklists are populated. Check only Pokémon that Pokémon HOME recognizes from that game. Each region and expansion keeps independent progress; your National Dex stays unchanged.</p><div class="collection-card-grid">${HOME_GAME_GROUPS.map(g=>collectionCard({id:`game-${g.id}`,title:g.name,emoji:'🎮',description:g.subtitle,items:[],group:'games',starter:false})).join('')}</div></div></section>`;}

function gameDefinitions(groupId){return HOME_DEX_DEFINITIONS.filter(def=>def.groupId===groupId);}
function gameCollection(def){
 if(!def)return null;
 const items=def.kind==='mega'
  ?def.rows.map(row=>({id:row.id,name:row.name,speciesId:row.sid,dexNo:row.num,required:!row.optional,mega:true}))
  :def.rows.map(([num,sid])=>({id:String(sid),name:byId(sid)?.name||`Pokémon #${sid}`,speciesId:sid,dexNo:num,required:true}));
 return {
  id:`game:${def.groupId}:${def.id}`,
  gameDex:true,
  groupId:def.groupId,
  homeDexId:def.id,
  title:def.title+' Pokédex',
  emoji:def.kind==='mega'?'Ⓜ️':'🎮',
  description:`Pokémon HOME ${def.title} targets. ${def.origin}. Tick only entries that HOME recognizes from this game. ${def.kind==='mega'?'Mega registrations also require the appropriate Mega Stone in your linked Z-A save.':''}`,
  origin:def.origin,reward:def.reward,
  items
 };
}
function gameGroupProgress(groupId){
 const progress=gameDefinitions(groupId).map(def=>collectionProgress(gameCollection(def)));
 const done=progress.reduce((sum,p)=>sum+p.done,0),total=progress.reduce((sum,p)=>sum+p.total,0);
 return {done,total,pct:total?Math.round(100*done/total):null};
}
function gameTabs(coll){
 if(!coll.gameDex)return '';
 const defs=gameDefinitions(coll.groupId);
 const all=gameGroupProgress(coll.groupId);
 return `<div class="game-collection-overview"><strong>Game-origin completion: ${fmt(all.done)} / ${fmt(all.total)} <span>${all.pct??0}%</span></strong>
  <p>Each game-region checklist is independent. This app records what you manually check; Pokémon HOME decides whether your Pokémon's origin qualifies.</p>
  ${progressBar(all.pct)}
 </div>
 <div class="form-filter-header"><strong>Choose a Pokédex</strong><small>${defs.length} independent checklist${defs.length===1?'':'s'}</small></div>
 <div class="game-dex-tabs">${defs.map(def=>{
  const p=collectionProgress(gameCollection(def));
  return `<button type="button" data-game-dex="${safe(def.id)}" class="game-dex-tab ${coll.homeDexId===def.id?'selected':''}" aria-pressed="${coll.homeDexId===def.id}"><b>${safe(def.title)}</b><small>${fmt(p.done)} / ${fmt(p.total)} · ${p.pct??0}%</small></button>`;
 }).join('')}</div>
 <div class="game-origin-note"><strong>✓ Correct origin needed:</strong> ${safe(coll.origin)}
 <small>Pokémon HOME reward: ${safe(coll.reward)}. The checklist is manual and does not verify HOME registration.</small></div>`;
}

function collectionCard(coll){const prog=coll.id?.startsWith('game-')?gameGroupProgress(coll.id.slice(5)):collectionProgress(coll);return `<button class="collection-card" data-collection="${coll.id}"><div class="collection-card-top"><span class="collection-icon">${coll.emoji}</span>${circleProgress(prog.pct,'tiny')}</div><b>${safe(coll.title)}</b><small>${prog.done} / ${prog.total} entries${coll.starter?' · starter list':''}</small>${progressBar(prog.pct)}</button>`;}
function getActiveCollection(){if(state.collection?.startsWith('game-')){const id=state.collection.slice(5);const defs=gameDefinitions(id);const def=defs.find(item=>item.id===state.gameDex)||defs[0];return gameCollection(def);}return collectionById(state.collection);}
function variantFamiliesPage(coll,items,stats){
 const families=[...new Set(items.map(item=>item.speciesId??'custom'))].sort((a,b)=>a==='custom'?1:b==='custom'?-1:a-b);
 const query=state.collectionQuery.toLowerCase().trim();
 const visible=families.filter(id=>{const mon=id==='custom'?null:byId(id);return !query||String(mon?.name||'Custom entries').toLowerCase().includes(query)||String(id).includes(query);});
 const cards=visible.map(id=>{const familyItems=items.filter(item=>(item.speciesId??'custom')===id),done=familyItems.filter(item=>isChecked(coll.id,item.id)).length,mon=id==='custom'?null:byId(id);const title=mon?.name||'Custom entries';
 return `<button type='button' class='collection-card form-family-card' data-variant-family='${id}'><div class='collection-card-top'><span class='form-family-art'>${mon?entryArt(familyItems[0],coll,true):'✦'}</span>${circleProgress(Math.round(100*done/familyItems.length),'tiny')}</div><b>${safe(title)}</b><small>${done} of ${familyItems.length} forms</small>${progressBar(100*done/familyItems.length)}</button>`;});
 return `<section class='page'><div class='page-title with-back'>${backBtn()}<div><p class='eyebrow'>SELECT A POKÉMON FAMILY</p><h1>🎭 Variant Forms</h1><p class='page-sub'>${stats.done} / ${stats.total} collected. Each family opens its own form checklist; this progress is separate from every other Dex.</p></div></div><div class='collection-progress-card'><div>${circleProgress(stats.pct,'large')}</div><div><strong>${stats.done} / ${stats.total}</strong><span>different forms collected</span><small>${items.length-stats.done} needed across ${families.length} Pokémon families</small></div></div>${progressBar(stats.pct)}<label class='search-field'><span>⌕</span><input id='collection-search' data-input='collection-search' type='search' placeholder='Find a Pokémon family' value='${safe(state.collectionQuery)}'></label><div class='collection-card-grid'>${cards.join('')||'<p>No Pokémon families match.</p>'}</div></section>`;
}

const GRID_COLLECTIONS=new Set(['shiny-forms','regional','variants','vivillon','alcremie','unown','furfrou','gmax','mega']);
const shinyFormsById=new Map(SHINY_FORM_ITEMS.map(item=>[item.id,item]));
function entryArt(item,coll,compact=false){
 const id=typeof coll==='string'?coll:coll.id;
 const sources=entryArtSources(id,item);
 const symbol=typeof coll==='string'?'◉':coll.emoji||'◉';
 const fallback=sources.slice(1).join('|');
 const visualClass=exactFormArtAvailable(id,item)?' exact-form':'';
 if(!sources.length)return `<span class="entry-art entry-art-empty${compact?' compact':''}" aria-hidden="true">${safe(symbol)}</span>`;
 return `<span class="entry-art${compact?' compact':''}${visualClass}"><img loading="lazy" decoding="async" alt="" src="${safe(sources[0])}" data-art-fallback="${safe(fallback)}"><span class="entry-art-fallback" style="display:none" aria-hidden="true">${safe(symbol)}</span></span>`;
}
function collectionEntryRow(coll,item){
 const yes=isChecked(coll.id,item.id),visual=GRID_COLLECTIONS.has(coll.id);
 const shinyTarget=coll.id==='shiny-forms'?null:shinyFormsById.get(coll.id+'|'+item.id);
 const shinyBlocked=['regional','variants','vivillon','alcremie','unown','furfrou','gmax','alpha'].includes(coll.id)?shinyFormExclusion(coll.id,item):null;
 const shinyOwned=shinyTarget?isChecked('shiny-forms',shinyTarget.id):false;
 const shinySwitch=shinyTarget?`<button type="button" class="shiny-mini-toggle${shinyOwned?' owned':''}" data-check="${safe(key('shiny-forms',shinyTarget.id))}" aria-pressed="${shinyOwned}" aria-label="${shinyOwned?'Remove':'Mark'} Shiny ${safe(item.name)}">${shinyOwned?'✨ Shiny ✓':'✨ Shiny'}</button>`:shinyBlocked&&!/Tracked instead|base species/i.test(shinyBlocked)?`<span class="shiny-mini-locked" title="${safe(shinyBlocked)}">Shiny locked / review</span>`:'';

 return `<div class="check-item${visual?' art-entry':''}${yes?' is-collected':''}">
  <button class="checkbox-tap${yes?' is-checked':''}" data-check="${safe(key(coll.id,item.id))}" aria-label="${yes?'Unmark':'Mark'} ${safe(item.name)} as owned" aria-pressed="${yes}"><span>${yes?'✓':''}</span></button>
  <button type="button" class="entry-art-action" data-collection-entry="${safe(item.id)}" aria-label="View ${safe(item.name)} details">${entryArt(item,coll)}</button>
  <button type="button" class="check-text" data-collection-entry="${safe(item.id)}">${safe(item.name)}${item.speciesId?`<small>${coll.gameDex?'Dex #'+String(item.dexNo).padStart(3,'0')+' · ':''}#${String(item.speciesId).padStart(4,'0')}${item.year?` · ${item.year}`:''} · ${coll.id==='shiny-forms'?(exactFormArtAvailable(coll.id,item)?'Shiny form artwork':'Shiny species preview'):(exactFormArtAvailable(coll.id,item)?'Form artwork':'Pokémon artwork')}</small>`:''}${item.sourceLabel?`<small class="shiny-source-label">${safe(item.sourceLabel)} · Independent Shiny target</small>`:''}${coll.gameDex?`<small class="game-origin-entry">${item.required===false?'Optional/event Mega Stone · not needed for reward':'Must count in Pokémon HOME from this game'}</small>`:''}${item.method?`<small class="distribution-method">${safe(item.method)} · ${safe(item.game||'')}</small>`:''}</button>
  ${shinySwitch}
  ${String(item.id).startsWith('custom-')?`<button class="delete-small" data-delete-custom="${safe(item.id)}" aria-label="Remove custom entry">×</button>`:''}
 </div>`;
}

function distributionYearTabs(items,coll){
 if(!['events','worlds'].includes(coll.id))return '';
 const years=[...new Set(items.map(item=>item.year).filter(Boolean))].sort((a,b)=>b-a).map(String);
 if(items.some(item=>!item.year))years.push('Custom');
 return `<div class="form-filter-header"><strong>Browse by year</strong><small>Verified starter records — not a complete archive</small></div><div class="chips distribution-year-tabs" aria-label="Distribution year filter">${['All',...years].map(year=>{
 const subset=items.filter(item=>year==='All'||String(item.year||'Custom')===year);
 const done=subset.filter(item=>isChecked(coll.id,item.id)).length;
 return `<button type="button" data-distribution-year="${safe(year)}" class="${state.distributionYear===year?'selected':''}" aria-pressed="${state.distributionYear===year}">${safe(year)} <small>${done}/${subset.length}</small></button>`;
 }).join('')}</div>`;
}


function shinySourceTabs(all){
 const names=[{id:'All',label:'All Forms'},...SHINY_FORM_SOURCES];
 return `<div class="form-filter-header"><strong>Choose a shiny collection</strong><small>Every shiny checkmark is independent.</small></div><div class="chips shiny-source-tabs" aria-label="Shiny form category">${names.map(source=>{
  const items=all.filter(item=>source.id==='All'||item.sourceCollection===source.id);
  const done=items.filter(item=>isChecked('shiny-forms',item.id)).length;
  return `<button type="button" data-shiny-source="${safe(source.id)}" class="${state.shinySource===source.id?'selected':''}" aria-pressed="${state.shinySource===source.id}">${safe(source.label)} <small>${done}/${items.length} · ${items.length?Math.round(1000*done/items.length)/10:0}%</small></button>`;
 }).join('')}</div>`;
}

function alcremieTabs(all,shiny=false){
 const creams=['All',...new Set(all.filter(item=>item.name.includes(' · ')).map(item=>item.name.replace(/^Shiny /,'').split(' · ')[0]))];
 return `<div class="form-filter-header"><strong>Choose a cream</strong><small>9 creams × 7 sweets = 63 combinations</small></div><div class="chips form-cream-tabs" aria-label="Alcremie cream filter">${creams.map(cream=>{
  const entries=all.filter(item=>cream==='All'||item.name.replace(/^Shiny /,'').startsWith(cream+' · '));
  const done=entries.filter(item=>isChecked(shiny?'shiny-forms':'alcremie',item.id)).length;
  return `<button type="button" data-cream="${safe(cream)}" class="${state.alcremieCream===cream?'selected':''}" aria-pressed="${state.alcremieCream===cream}">${safe(cream)} <small>${done}/${entries.length}</small></button>`;
 }).join('')}</div>`;
}

function collectionPage(){const coll=getActiveCollection();if(!coll)return collections();const stats=collectionProgress(coll);const query=state.collectionQuery.toLowerCase().trim();const all=collectionItems(coll);if(coll.id==='variants'&&!state.variantFamily)return variantFamiliesPage(coll,all,stats);const creamTabs=coll.id==='alcremie'?alcremieTabs(all):coll.id==='shiny-forms'&&state.shinySource==='alcremie'?alcremieTabs(all.filter(item=>item.sourceCollection==='alcremie'),true):'';const shinyTabs=coll.id==='shiny-forms'?shinySourceTabs(all):'';const eventTabs=['events','worlds'].includes(coll.id)?distributionYearTabs(all,coll):'';const gameDexTabs=gameTabs(coll);const regionTabs=coll.id==='regional'?`<div class='region-select'>${['Alola','Galar','Hisui','Paldea',...(all.some(item=>!item.region)?['Custom']:[])].map(region=>{const entries=all.filter(item=>(item.region||'Custom')===region),done=entries.filter(item=>isChecked(coll.id,item.id)).length;return `<button type='button' data-region='${region}' class='region-tab ${state.regionalRegion===region?'selected':''}'><b>${region}</b><small>${done}/${entries.length} · ${Math.round(100*done/entries.length)||0}%</small></button>`}).join('')}</div>`:'';const familyBack=coll.id==='variants'?`<button class='back-btn-form' data-variant-family='all'>‹ All Pokémon families</button>`:'';const filtered=all.filter(entry=>(coll.id!=='shiny-forms'||state.shinySource==='All'||entry.sourceCollection===state.shinySource)&&(coll.id!=='shiny-forms'||state.shinySource!=='alcremie'||state.alcremieCream==='All'||entry.name.startsWith('Shiny '+state.alcremieCream+' · '))&&(!['events','worlds'].includes(coll.id)||state.distributionYear==='All'||String(entry.year||'Custom')===state.distributionYear)&&(coll.id!=='alcremie'||state.alcremieCream==='All'||entry.name.startsWith(state.alcremieCream+' · '))&&(coll.id!=='regional'||(entry.region||'Custom')===state.regionalRegion)&&(coll.id!=='variants'||(entry.speciesId??'custom')===state.variantFamily)&&(!query||entry.name.toLowerCase().includes(query)||String(entry.speciesId||'').includes(query))&&(state.collectionFilter==='all'||(state.collectionFilter==='complete'?isChecked(coll.id,entry.id):!isChecked(coll.id,entry.id))));return `<section class="page"><div class="page-title with-back">${backBtn()}<div><p class="eyebrow">INDEPENDENT COLLECTION</p><h1>${coll.emoji} ${safe(coll.title)}</h1><p class="page-sub">${safe(coll.description)}</p></div></div><div class="collection-progress-card"><div>${circleProgress(stats.pct,'large')}</div><div><strong>${fmt(stats.done)} / ${fmt(stats.total)}</strong><span>collected items</span><small>${stats.total?fmt(stats.total-stats.done)+' still needed':'Add targets to begin tracking'}</small></div></div>${progressBar(stats.pct)}${gameDexTabs}${regionTabs}${shinyTabs}${creamTabs}${eventTabs}${familyBack}${coll.starter?`<div class="info-banner">⚠ This is a <b>starter list</b>, not a verified complete HOME collection. Its percentage covers only items currently listed.</div>`:''}${coll.complete?'':'<p class="small-note">You can add more checklist targets below. Existing progress will stay saved.</p>'}<label class="search-field"><span>⌕</span><input id="collection-search" data-input="collection-search" type="search" placeholder="Search this collection" value="${safe(state.collectionQuery)}"></label><div class="segmented"><button data-cfilter="all" class="${state.collectionFilter==='all'?'active':''}">All</button><button data-cfilter="missing" class="${state.collectionFilter==='missing'?'active':''}">Need</button><button data-cfilter="complete" class="${state.collectionFilter==='complete'?'active':''}">Have</button></div><div class="list-info"><b>${filtered.length} entries</b><small>Checked items save independently</small></div><div class="check-list ${GRID_COLLECTIONS.has(coll.id)?'visual-entry-grid':'picture-entry-list'}">${filtered.slice(0,state.collectionShown).map(item=>collectionEntryRow(coll,item)).join('')||'<div class="empty">No entries match. Try another filter.</div>'}</div>${filtered.length>state.collectionShown?`<button class="load-more" data-more="collection">Show more entries (${filtered.length-state.collectionShown} remaining)</button>`:''}<form class="add-form" id="add-entry-form"><label for="new-entry">Add a missing target or custom entry</label><div><input id="new-entry" maxlength="100" placeholder="e.g. a special form or event Pokémon" required><button type="submit">+ Add</button></div></form></section>`;}
function favorites(){const fav=species.filter(mon=>get(`favorite:${mon.id}`));return `<section class="page"><div class="page-title"><p class="eyebrow">YOUR PERSONAL PICKS</p><h1>♥ Favorites</h1><p class="page-sub">Favorite any Pokémon from its details page. This list doesn't affect Dex progress.</p></div><div class="mon-list">${fav.map(monRow).join('')||'<div class="empty">No favorites yet. Tap a Pokémon in the National Dex and select ♥ Favorite.</div>'}</div><button class="load-more" data-go="dex">Browse the National Dex →</button></section>`;}
function teams(){const group=GAME_GROUPS.find(g=>g.gen===state.teamGen);if(!group.games.includes(state.teamGame))state.teamGame=group.games[0];const team=get(`team:${state.teamGame}`,{roster:['','','','','',''],notes:''});return `<section class="page"><div class="page-title"><p class="eyebrow">HALL OF FAME</p><h1>🏆 Champion Teams</h1><p class="page-sub">Remember which six Pokémon beat each game. These rosters never change Dex progress.</p></div><div class="chips" aria-label="Team generation">${GAME_GROUPS.map(g=>`<button data-team-gen="${g.gen}" class="${state.teamGen===g.gen?'selected':''}">Gen ${g.gen}</button>`).join('')}</div><div class="team-games">${group.games.map(game=>`<button class="${state.teamGame===game?'selected':''}" data-game="${safe(game)}">${safe(game)}</button>`).join('')}</div><div class="team-panel"><p class="eyebrow">GENERATION ${state.teamGen}</p><h2>${safe(state.teamGame)}</h2><p class="page-sub">Enter the Pokémon you beat the game with. Saving happens as you type.</p><div class="roster-grid">${Array.from({length:6},(_,i)=>`<label class="roster-slot"><span>#${i+1}</span><div class="roster-autocomplete"><input data-team-slot="${i}" value="${safe(team.roster?.[i]||'')}" maxlength="60" placeholder="Pokémon name" autocomplete="off"><div class="roster-suggestion-host" data-team-options="${i}"></div></div></label>`).join('')}</div><label class="notes-label">Team notes<textarea data-team-note rows="3" maxlength="1000" placeholder="Remember your run, nicknames, or battle moments…">${safe(team.notes||'')}</textarea></label><p class="save-hint" id="team-save-hint">Changes save on this device automatically.</p></div></section>`;}
function settings(){const s=syncStatus;return `<section class="page"><div class="page-title"><p class="eyebrow">YOUR ADVENTURE, YOUR DATA</p><h1>Settings & Backup</h1></div><section class="setting-card theme-setting"><div class="setting-head"><span class="setting-icon">🎨</span><div><h2>Choose your trainer theme</h2><p>Make your Pokédex feel like yours. Appearance is stored on this device; collections stay independent.</p></div></div>${themeSelector()}</section><div class="setting-card"><div class="setting-head"><span class="setting-icon">☁</span><div><h2>Cloud synchronization</h2><p>${safe(s.message)}</p><p class="small-note">Poke Track is connected to your free Supabase project. Sign in using your email to synchronize between devices. Keep a separate JSON backup.</p><p><a class="guide-link" href="https://github.com/Harvjo9/poketracker/blob/main/docs/RELIABILITY_SETUP_V033.md" rel="noopener noreferrer">Free cloud setup and safe-update guide</a></p></div></div><div class="setting-status"><span class="status-dot ${s.mode==='connected'?'good':''}"></span>${safe(s.mode==='connected'?'Connected':s.mode==='syncing'?'Syncing':s.mode==='offline'?'Offline':s.mode==='error'?'Attention needed':s.mode==='unconfigured'?'Setup needed':'Not signed in')}</div>${s.lastSync?`<p class="small-note">Last sync: ${safe(new Date(s.lastSync).toLocaleString())}</p>`:''}${!configured()?`<div class="info-banner">Connect your free Supabase project below to enable syncing between your phone and tablet. Use only the public/anon key — never a service-role key.</div><form id="cloud-config-form" class="cloud-config-form"><label for="cloud-url">Supabase project URL</label><input id="cloud-url" type="url" placeholder="https://your-project.supabase.co" autocomplete="url" required><label for="cloud-key">Supabase publishable / anon key</label><input id="cloud-key" type="text" placeholder="sb_publishable_... or anon key" autocomplete="off" required><button class="primary-btn" type="submit">Save cloud settings</button></form>`:sessionUser()?`<div class="button-row"><button class="primary-btn" data-sync-now>Sync now</button><button class="outline-btn" data-signout>Sign out</button></div>`:`<div class="magic-login-guide"><b>Free email sign-in — no SMTP setup needed</b><p>1. Enter your account email and tap <b>Send link</b>.</p><p>2. Open the email titled <b>Your sign-in link</b>. <b>Long-press</b> the Sign in link and choose <b>Copy link address</b>. Do not open it first.</p><p>3. Paste the copied link below and tap <b>Sign in</b>.</p></div><form id="email-form"><label>Email for your account</label><div class="inline-field"><input type="email" id="auth-email" value="${safe(state.authEmail)}" placeholder="you@example.com" required><button type="submit">Send link</button></div></form><form id="magic-link-form"><label for="magic-link-field">Paste sign-in link address from your email</label><input type="password" id="magic-link-field" placeholder="https://…/auth/v1/verify?token=…" autocomplete="off" autocapitalize="off" spellcheck="false" required><button class="primary-btn" type="submit">Sign in with link</button></form><p class="small-note">Supabase’s free default email provider can send to project team members. The link is a one-time credential — never share it in screenshots, chats, or GitHub.</p>`}</div><div class="setting-card"><div class="setting-head"><span class="setting-icon">⬇</span><div><h2>Portable backups</h2><p>Export and restore all checkmarks, custom entries, favorites, and teams. Keep an extra copy somewhere off this phone.</p></div></div><div class="button-row"><button class="primary-btn" data-export>Save backup</button><button class="outline-btn" data-import>Restore backup</button></div><p class="small-note" id="last-backup-note">${lastConfirmedBackupAt()?`Last confirmed backup: ${safe(new Date(lastConfirmedBackupAt()).toLocaleString())}`:"No confirmed backup saved from this version yet."}</p><input type="file" id="backup-file" accept="application/json,.json" hidden></div><div class="setting-card"><div class="setting-head"><span class="setting-icon">🛠</span><div><h2>Tracker information</h2><p>Poké Track v0.3.5 · National Dex #0001–#1025</p></div></div><p class="small-note">Your primary Living Dex uses two slots for every species. All other checklists are independent. Starter collections and game-specific HOME reward requirements will be expanded and verified in future updates.</p><button class="danger-link" data-clear>Reset local progress</button></div><p class="credits">Fan-made personal tracker. Pokémon names and imagery belong to their respective owners. Pokémon artwork shown via PokéAPI sprite assets.</p></section>`;}
function detail(){
 const mon=byId(state.detail);if(!mon)return '';
 const options=slots(mon.id),p=monProgress(mon.id),faved=Boolean(get(`favorite:${mon.id}`));
 const groups=COLLECTIONS.filter(c=>!c.fullSpecies).map(c=>{const entries=collectionItems(c).filter(item=>item.speciesId===mon.id);return {c,entries,done:entries.filter(item=>isChecked(c.id,item.id)).length};}).filter(group=>group.entries.length);
 const shinyOwned=isChecked('shiny',String(mon.id));
 const labels=options[0]==='Male'?`♂ ${checked(`main:${mon.id}:Male`)?'✓':'○'} · ♀ ${checked(`main:${mon.id}:Female`)?'✓':'○'}`:options[0]==='First'?'Genderless · 2 copies':`Two ${options[0].startsWith('Male')?'male':'female'} copies`;
 const markers=`<span class='status-marker ${p.complete?'collected':''}'>${labels} · ${p.own}/2</span><span class='status-marker ${shinyOwned?'collected':''}'>✨ Shiny ${shinyOwned?'✓':'○'}</span>${groups.map(({c,entries,done})=>`<button type='button' data-detail-group='${c.id}' class='status-marker status-action ${done===entries.length?'collected':''}'>${c.emoji} ${safe(c.title)} <strong>${done}/${entries.length}</strong></button>`).join('')}`;
 const sections=groups.map(({c,entries,done})=>{const expanded=state.detailGroups.has(c.id);return `<div class='detail-collection'><button type='button' class='detail-collection-head' data-detail-group='${c.id}' aria-expanded='${expanded}'><span>${c.emoji} ${safe(c.title)}</span><strong>${done}/${entries.length} ${expanded?'▴':'▾'}</strong></button>${expanded?`<div class='detail-collection-rows'>${entries.map(item=>toggleRow(key(c.id,item.id),item.name,false,entryArt(item,c,true))).join('')}</div>`:''}</div>`;}).join('');
 const desc=options[0]==='Male'?'One male and one female are required.':options[0]==='First'?'Two copies are required for genderless Pokémon.':'Two copies of the available gender are required.';
 return `<div class='modal-backdrop' data-close-detail><div class='detail-sheet' role='dialog' aria-modal='true' aria-label='${safe(mon.name)} details'><div class='sheet-handle'></div><button class='sheet-close' data-close-detail aria-label='Close details'>×</button><div class='detail-intro'><span class='detail-art'>${img(mon.id)}</span><div><p class='eyebrow'>#${String(mon.id).padStart(4,'0')} · GENERATION ${mon.gen}</p><h2>${safe(mon.name)}</h2>${tag(`${p.own} of 2 collected`,p.complete?'good':'muted')}</div></div><div class='detail-body'><div class='detail-block'><h3>Applicable collection markers</h3><p class='small-note'>Tap a collection marker to expand its own checklist. No checklist auto-completes another.</p><div class='marker-grid'>${markers}</div></div><div class='detail-block'><h3>Main Living Dex <span>(${p.own}/2)</span></h3><p class='small-note'>${desc}</p>${options.map(slot=>toggleRow(`main:${mon.id}:${slot}`,slot)).join('')}</div><div class='detail-block'><h3>Shiny & Favorites</h3>${toggleRow(key('shiny',String(mon.id)),'✨ Shiny Pokémon')}${toggleRow(`favorite:${mon.id}`,'♥ Favorite',true)}</div><div class='detail-block'><h3>Applicable specialty collections</h3><p class='small-note'>Regional forms, variants, Alpha, Gigantamax and Mega registrations appear here only when relevant. Mega registrations are not stored Mega-form Pokémon.</p>${sections||'<p class="small-note">No additional form-specific collection targets are listed for this species.</p>'}<button class='outline-btn wide' data-go='collections'>Browse all collections →</button></div></div></div></div>`;
}
function toggleRow(id,label,isRaw=false,art=''){const yes=isRaw?Boolean(get(id)):checked(`check:${id}`);return `<button class="toggle-row" data-check="${safe(id)}" ${isRaw?'data-raw="1"':''}><span class="toggle-row-label">${art}<span>${safe(label)}</span></span><span class="switch ${yes?'on':''}"><i></i></span></button>`;}
function toast(){return state.toast?`<div class="toast" role="status">${safe(state.toast)}</div>`:''}
let toastTimer;
function notify(message){state.toast=message;clearTimeout(toastTimer);render();toastTimer=setTimeout(()=>{state.toast='';render()},3000)}
function render({preserve=true}={}){const scroll=document.querySelector('.scroll-body');const scrollY=preserve?scroll?.scrollTop||0:0;root.innerHTML=`<div class="app-shell">${topbar()}<main class="scroll-body" id="scroll-body">${state.view==='home'?home():state.view==='dex'?dex():state.view==='collections'?collections():state.view==='collection'?collectionPage():state.view==='favorites'?favorites():state.view==='teams'?teams():settings()}</main>${nav()}${state.detail?detail():''}${toast()}</div>`;document.querySelector('.scroll-body')?.scrollTo(0,scrollY);document.body.classList.toggle('modal-open',Boolean(state.detail));}
function go(view){state.view=view;state.detail=null;state.toast='';if(view==='collection'){state.collectionQuery='';state.collectionFilter='all';}render({preserve:false});}
function openCollection(id){state.collection=id;state.gameDex=id.startsWith('game-')?gameDefinitions(id.slice(5))[0]?.id||null:null;state.regionalRegion='Alola';state.variantFamily=null;state.alcremieCream='All';state.shinySource='All';state.distributionYear='All';state.collectionShown=72;go('collection');}
function openMon(id){state.detail=id;state.detailGroups=new Set();render();}
function changeInputAndRerender(input,newValue,which){state[which]=newValue;if(which==='dexQuery')state.shown=60;if(which==='collectionQuery')state.collectionShown=72;const position=input.selectionStart;render();const next=document.getElementById(input.id);next?.focus({preventScroll:true});try{next.setSelectionRange(position,position)}catch{}}
// Called by Android only after the system document picker successfully writes the JSON file.
window.PokeTrackBackupResult=function(success){
 if(success){try{confirmBackupSaved();notify('Backup saved successfully. Keep a second copy somewhere safe.');}catch(err){notify('File saved, but backup date could not be recorded.');}}
 else notify('Backup was cancelled or could not be saved. Your Pokémon progress is unchanged.');
};

root.addEventListener('click',async(e)=>{const target=e.target.closest('button,[data-close-detail]');if(!target)return;
 if(target.hasAttribute('data-close-detail')&&(!e.target.closest('.detail-sheet')||target.classList.contains('sheet-close'))){state.detail=null;render();return;}
 if(target.hasAttribute('data-theme-choice')){setAppearanceTheme(target.dataset.themeChoice);return;}
 if(target.dataset.go){go(target.dataset.go);return;}
 if(target.hasAttribute('data-team-select')){const mon=byId(Number(target.dataset.pokemon));const slot=Number(target.dataset.teamSelect);const input=root.querySelector('[data-team-slot="'+slot+'"]');if(mon&&input){input.value=mon.name;input.dispatchEvent(new Event('input',{bubbles:true}));const host=input.closest('.roster-slot')?.querySelector('[data-team-options]');if(host)host.innerHTML='';input.blur();}return;}
 if(target.hasAttribute('data-detail-group')){const group=target.dataset.detailGroup;if(state.detailGroups.has(group))state.detailGroups.delete(group);else state.detailGroups.add(group);render();return;}
 if(target.hasAttribute('data-game-dex')){state.gameDex=target.dataset.gameDex;state.collectionShown=72;state.collectionQuery='';state.collectionFilter='all';render({preserve:false});return;}
 if(target.hasAttribute('data-shiny-source')){state.shinySource=target.dataset.shinySource;state.alcremieCream='All';state.collectionShown=72;state.collectionQuery='';render({preserve:false});return;}
 if(target.hasAttribute('data-distribution-year')){state.distributionYear=target.dataset.distributionYear;state.collectionShown=72;state.collectionQuery='';render({preserve:false});return;}
 if(target.hasAttribute('data-cream')){state.alcremieCream=target.dataset.cream;state.collectionShown=72;state.collectionQuery='';render({preserve:false});return;}
 if(target.hasAttribute('data-region')){state.regionalRegion=target.dataset.region;state.collectionQuery='';render({preserve:false});return;}
 if(target.hasAttribute('data-variant-family')){const value=target.dataset.variantFamily;state.variantFamily=value==='all'?null:value==='custom'?'custom':Number(value);state.collectionQuery='';render({preserve:false});return;}
 if(target.dataset.mon){openMon(Number(target.dataset.mon));return;}
 if(target.dataset.collection){openCollection(target.dataset.collection);return;}
 if(target.dataset.collectionEntry){const c=getActiveCollection(),entry=collectionItems(c).find(i=>i.id===target.dataset.collectionEntry);if(c?.gameDex){toggleCheck(key(c.id,target.dataset.collectionEntry));render();}else if(entry?.speciesId){openMon(entry.speciesId);}else{toggleCheck(key(c.id,target.dataset.collectionEntry));render();}return;}
 if(target.dataset.check){const id=target.dataset.check;if(target.dataset.raw){set(id,!Boolean(get(id)));}else{toggleCheck(id);}
 if(id.startsWith('coll:alpha:')){const monId=Number(id.slice('coll:alpha:'.length));if(Number.isInteger(monId)&&byId(monId)){const coll=collectionById('alpha');if(!collectionItems(coll).some(i=>i.id===String(monId))){const name=byId(monId).name;const items=getCustomItems('alpha');set('items:alpha',[...items,{id:String(monId),name:`Alpha ${name}`,speciesId:monId}]);}}}render();return;}
 if(target.dataset.gen){state.dexGen=Number(target.dataset.gen);state.shown=60;render();return;}
 if(target.dataset.filter){state.dexFilter=target.dataset.filter;state.shown=60;render();return;}
 if(target.dataset.cfilter){state.collectionFilter=target.dataset.cfilter;state.collectionShown=72;render();return;}
 if(target.dataset.more){if(target.dataset.more==='collection')state.collectionShown+=72;else state.shown+=60;render();return;}
 if(target.dataset.teamGen){state.teamGen=Number(target.dataset.teamGen);state.teamGame=GAME_GROUPS.find(g=>g.gen===state.teamGen).games[0];render({preserve:false});return;}
 if(target.dataset.game){state.teamGame=target.dataset.game;render();return;}
 if(target.dataset.deleteCustom){const c=getActiveCollection(),item=collectionItems(c).find(i=>i.id===target.dataset.deleteCustom);if(confirm(`Remove “${item?.name||'this entry'}” from this collection? Its saved checkmark will be retained if you re-add it later.`)){deleteCustomItem(c.id,target.dataset.deleteCustom);render();}return;}
 if(target.hasAttribute('data-export')){if(window.PokeAndroid?.saveBackup){window.PokeAndroid.saveBackup(JSON.stringify(exportBackup(),null,2),`poke-track-backup-${new Date().toISOString().slice(0,10)}.json`);notify('Choose where to save your backup.');return;}const data=new Blob([JSON.stringify(exportBackup(),null,2)],{type:'application/json'});const ref=URL.createObjectURL(data);const a=document.createElement('a');a.href=ref;a.download=`poke-track-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(ref);notify('Backup download requested. Check your Downloads folder and keep a copy somewhere safe.');return;}
 if(target.hasAttribute('data-import')){document.getElementById('backup-file')?.click();return;}
 if(target.hasAttribute('data-clear')){if(sessionUser()){notify('Sign out before clearing local progress. Your cloud copy will remain safe.');return;}if(confirm('This removes all locally saved Pokémon progress on this device. Cloud data will not be deleted. Export a backup first. Continue?')){clearLocalData();notify('Local progress cleared.');}return;}
 if(target.hasAttribute('data-sync-now')){try{await syncNow();notify('Sync attempt complete.');}catch(err){notify(err.message)}return;}
 if(target.hasAttribute('data-signout')){await signOut();render();return;}
 });
root.addEventListener('submit',async e=>{if(e.target.id==='cloud-config-form'){e.preventDefault();try{saveCloudConfig(document.getElementById('cloud-url').value,document.getElementById('cloud-key').value);location.reload();}catch(err){notify(`Cloud setup issue: ${err.message}`)}return;}if(e.target.id==='add-entry-form'){e.preventDefault();const input=e.target.querySelector('#new-entry');const c=getActiveCollection();if(addCustomItem(c.id,input.value)){notify('New target added to this collection.')}else notify('Enter a new target name.');return;}
 if(e.target.id==='email-form'){e.preventDefault();const input=document.getElementById('auth-email');state.authEmail=input.value.trim();try{await requestEmailCode(state.authEmail);notify('Sign-in link requested. Check your email and copy the link address.')}catch(err){notify(`Email issue: ${err.message}`)}return;}
 if(e.target.id==='magic-link-form'){e.preventDefault();const link=document.getElementById('magic-link-field')?.value||'';try{await verifyMagicLink(link);notify('Signed in! Your progress is syncing.')}catch(err){notify(`Could not sign in: ${err.message}`)}return;}});
root.addEventListener('input',e=>{if(e.target.dataset.input==='dex-search'){changeInputAndRerender(e.target,e.target.value,'dexQuery');return;}if(e.target.dataset.input==='collection-search'){changeInputAndRerender(e.target,e.target.value,'collectionQuery');return;}
if(e.target.matches('[data-team-slot],[data-team-note]')){const team=get(`team:${state.teamGame}`,{roster:['','','','','',''],notes:''});const next={roster:Array.from({length:6},(_,i)=>team.roster?.[i]||''),notes:team.notes||''};if(e.target.hasAttribute('data-team-slot')){const slot=Number(e.target.dataset.teamSlot);next.roster[slot]=e.target.value;const host=e.target.closest('.roster-slot')?.querySelector('[data-team-options]');if(host)host.innerHTML=suggestionButtons(e.target.value,'team',slot);}else next.notes=e.target.value;set(`team:${state.teamGame}`,next);const hint=document.getElementById('team-save-hint');if(hint)hint.textContent='✓ Saved on this device.';return;}});
root.addEventListener('change',async e=>{if(e.target.id==='backup-file'){
  const f=e.target.files?.[0];if(!f)return;
  try{
   if(f.size>8000000)throw new Error('That backup file is too large to restore.');
   const backup=JSON.parse(await f.text());
   const details=inspectBackup(backup);
   const date=details.exportedAt?new Date(details.exportedAt).toLocaleString():'date unknown';
   const cloudNotice=sessionUser()?'\nCloud sync is connected. Old cloud records may merge back after this restore; use the same account and verify the result.':'';
   if(!confirm(`Restore backup from ${date}?\n\nBackup: ${details.count} entries\nCurrent device: ${details.currentCount} entries\n\nYour current device checkmarks will be replaced. Export your current progress first if needed.${cloudNotice}\n\nContinue?`))return;
   const count=importBackup(backup);
   notify(`Restored ${count} saved entries.`);
  }catch(err){notify(`Restore stopped: ${err.message}`);}
  finally{e.target.value='';}
 }});

root.addEventListener('error',event=>{
 const picture=event.target;
 if(!(picture instanceof HTMLImageElement)||!picture.hasAttribute('data-art-fallback'))return;
 const remaining=(picture.dataset.artFallback||'').split('|').filter(Boolean);
 const next=remaining.shift();
 picture.dataset.artFallback=remaining.join('|');
 if(next)picture.src=next;
 else{picture.style.display='none';const fallback=picture.nextElementSibling;if(fallback)fallback.style.display='grid';}
},true);

subscribe(()=>{if(state.view!=='teams')render()});onSyncChange(()=>render());
(async()=>{try{species=await loadSpecies();await initializeSync();render({preserve:false});}catch(err){root.innerHTML=`<div class="fatal"><h1>Pokédex couldn't load</h1><p>${safe(err.message)}</p><p>Run this as a hosted site or local web server, not directly as a file.</p></div>`}})();
// Native APK bundles app resources directly; don't register the web service worker here.
