import {REGIONAL_FORMS,FORM_VARIANTS,GMAX_FORMS,MEGA_REGISTRATIONS,ALPHA_TARGETS,FORM_CATALOG_COUNTS} from './forms-catalog.js';
// Catalog snapshot: PokéAPI species IDs 1–1025, November 2026.
// Collection items marked 'starter' are illustrative starter requirements, NOT complete or verified HOME catalogs.
const noGender = new Set('81,82,100,101,120,121,132,137,144,145,146,150,151,201,233,243,244,245,249,250,251,292,337,338,343,344,374,375,376,377,378,379,382,383,384,385,386,436,437,462,474,479,480,481,482,483,484,486,487,489,490,491,492,493,494,599,600,601,615,622,623,638,639,640,643,644,646,647,648,649,703,716,717,718,719,720,721,772,773,774,781,785,786,787,788,789,790,791,792,793,794,795,796,797,798,799,800,801,802,803,804,805,806,807,808,809,854,855,870,880,881,882,883,888,889,890,893,894,895,896,897,898,924,925,984,985,986,987,988,989,990,991,992,993,994,995,999,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1012,1013,1020,1021,1022,1023,1025'.split(',').map(Number));
const maleOnly = new Set('32,33,34,106,107,128,236,237,313,381,414,475,538,539,627,628,641,642,645,859,860,861,916,1014,1015,1016'.split(',').map(Number));
const femaleOnly = new Set('29,30,31,113,115,124,238,241,242,314,380,413,416,440,478,488,548,549,629,630,669,670,671,758,761,762,763,856,857,858,868,869,905,957,958,959,1017'.split(',').map(Number));
const GENS = [151,251,386,493,649,721,809,905,1025];
export const MAX_DEX = 1025;
export const GEN_NAMES = ['Kanto','Johto','Hoenn','Sinnoh','Unova','Kalos','Alola','Galar / Hisui','Paldea'];
export function generation(id){return GENS.findIndex(n=>id<=n)+1;}
export function slots(id){return noGender.has(id)?['First','Second']:maleOnly.has(id)?['Male 1','Male 2']:femaleOnly.has(id)?['Female 1','Female 2']:['Male','Female'];}
export function prettyName(slug){return slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bMr Mime\b/,'Mr. Mime').replace(/\bMime Jr\b/,'Mime Jr.').replace(/\bFarfetchd\b/,"Farfetch’d").replace(/\bSirfetchd\b/,"Sirfetch’d").replace(/\bFlabebe\b/,'Flabébé').replace(/\bNidoran F\b/,'Nidoran ♀').replace(/\bNidoran M\b/,'Nidoran ♂').replace(/\bHo Oh\b/,'Ho-Oh').replace(/\bPorygon Z\b/,'Porygon-Z');}
export function sprite(id){return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;}
export async function loadSpecies(){const response=await fetch('./assets/names.txt');if(!response.ok)throw new Error('Could not load bundled Pokédex.');const names=(await response.text()).trim().split(/[|\n]/).filter(Boolean);if(names.length!==MAX_DEX)throw new Error(`Pokédex file mismatch: ${names.length}`);return names.map((slug,index)=>({id:index+1,slug,name:prettyName(slug),gen:generation(index+1)}));}
const labels = (str)=>str.split('|').map(s=>({id:s.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:s}));
const forms = (str)=>str.split('|').map(s=>{const [id,name]=s.split('~');return {id,name:name||id};});
const alcremieCreams='Vanilla Cream|Ruby Cream|Matcha Cream|Mint Cream|Lemon Cream|Salted Cream|Ruby Swirl|Caramel Swirl|Rainbow Swirl'.split('|');
const alcremieSweets='Strawberry|Love|Berry|Clover|Flower|Star|Ribbon'.split('|');
const alcremie=alcremieCreams.flatMap(cream=>alcremieSweets.map(sweet=>({id:(cream+'-'+sweet).toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:`${cream} · ${sweet} Sweet`,speciesId:869})));
const unown='ABCDEFGHIJKLMNOPQRSTUVWXYZ!?'.split('').map(char=>({id:char==='!'?'exclamation':char==='?'?'question':char.toLowerCase(),name:`Unown ${char}`,speciesId:201}));
const vivillon=labels('Archipelago|Continental|Elegant|Fancy|Garden|High Plains|Icy Snow|Jungle|Marine|Meadow|Modern|Monsoon|Ocean|Poké Ball|Polar|River|Sandstorm|Savanna|Sun|Tundra').map(item=>({...item,name:`${item.name} Pattern`,speciesId:666}));
export const GAME_GROUPS = [
 {gen:1,games:['Red','Blue','Yellow']},
 {gen:2,games:['Gold','Silver','Crystal']},
 {gen:3,games:['Ruby','Sapphire','Emerald','FireRed','LeafGreen']},
 {gen:4,games:['Diamond','Pearl','Platinum','HeartGold','SoulSilver']},
 {gen:5,games:['Black','White','Black 2','White 2']},
 {gen:6,games:['X','Y','Omega Ruby','Alpha Sapphire']},
 {gen:7,games:['Sun','Moon','Ultra Sun','Ultra Moon',"Let's Go, Pikachu!","Let's Go, Eevee!"]},
 {gen:8,games:['Sword','Shield','Brilliant Diamond','Shining Pearl','Legends: Arceus']},
 {gen:9,games:['Scarlet','Violet','Legends: Z-A']}
];
export const HOME_GAME_GROUPS = [
 {id:'lets-go',name:"Let's Go (Kanto)",subtitle:'Pokémon HOME reward checklist'},
 {id:'sword-shield',name:'Sword / Shield',subtitle:'Galar · Isle of Armor · Crown Tundra'},
 {id:'firered-leafgreen',name:'FireRed / LeafGreen',subtitle:'Kanto — Switch HOME reward group'},
 {id:'bdsp',name:'Brilliant Diamond / Shining Pearl',subtitle:'Sinnoh'},
 {id:'arceus',name:'Legends: Arceus',subtitle:'Hisui'},
 {id:'scarlet-violet',name:'Scarlet / Violet',subtitle:'Paldea · Kitakami · Blueberry'},
 {id:'za',name:'Legends: Z-A',subtitle:'Lumiose and expansion Pokédexes'}
];
// A 'starter' catalog deliberately does not claim to be the complete set of Pokémon HOME-eligible entries.
export const COLLECTIONS = [
 {id:'shiny',title:'Shiny Dex',emoji:'✨',group:'living',fullSpecies:true,complete:false,description:'Separate shiny checklist, one per National species. Shiny-lock exceptions still need review.'},
 {id:'variants',title:'Variant Forms',emoji:'🎭',group:'forms',complete:true,description:'259 HOME-oriented form entries from 51 Pokémon families. Select a Pokémon family to see its distinct forms. Regional forms are tracked separately.',items:FORM_VARIANTS},
 {id:'regional',title:'Regional Variants',emoji:'🌎',group:'forms',complete:true,description:'58 regional forms. Choose Alola, Galar, Hisui or Paldea; each region has its own progress.',items:REGIONAL_FORMS},
 {id:'vivillon',title:'Vivillon Dex',emoji:'🦋',group:'forms',complete:true,description:'20 named patterns; one of each.',items:vivillon},
 {id:'alcremie',title:'Alcremie Dex',emoji:'🍰',group:'forms',complete:true,description:'63 cream-and-sweet combinations; one of each.',items:alcremie},
 {id:'unown',title:'Unown Dex',emoji:'🔤',group:'forms',complete:true,description:'A–Z plus ! and ?; one of each.',items:unown},
 {id:'furfrou',title:'Furfrou Dex',emoji:'🐩',group:'forms',complete:true,description:'Natural coat and the nine named trims; one of each.',items:labels('Natural Form|Heart Trim|Star Trim|Diamond Trim|Debutante Trim|Matron Trim|Dandy Trim|La Reine Trim|Kabuki Trim|Pharaoh Trim').map(x=>({...x,speciesId:676}))},
 {id:'gmax',title:'Gigantamax Factor',emoji:'⚡',group:'special',complete:true,description:'32 eligible Pokémon species with Gigantamax Factor. One per species. Normal Dynamax is not a distinct stored form.',items:GMAX_FORMS},
 {id:'mega',title:'Mega Registrations',emoji:'Ⓜ️',group:'special',starter:true,description:'Mega Evolution HOME registration records, not storable Mega specimens. This list includes forms beyond official reward requirements; verify origin and Mega Stones separately.',items:MEGA_REGISTRATIONS},
 {id:'titan',title:'Titan Dex',emoji:'⛰️',group:'special',starter:true,description:'Special Titan Pokémon, one each. Confirm HOME-preserved status when finalizing.',items:labels('Klawf — Stony Cliff Titan|Bombirdier — Open Sky Titan|Orthworm — Lurking Steel Titan|Great Tusk — Quaking Earth Titan|Iron Treads — Quaking Earth Titan|Dondozo — False Dragon Titan|Tatsugiri — False Dragon Titan')},
 {id:'alpha',title:'Alpha Dex',emoji:'🔴',group:'special',complete:true,description:'222 species eligible for Alpha status in Legends: Arceus; Legendary/Mythical and unavailable gift species excluded. Track one each.',items:ALPHA_TARGETS},
 {id:'ride',title:'Ride Pokémon',emoji:'🏇',group:'special',starter:true,description:'Pokémon ridden in games, such as Gogoat or Legends: Arceus mounts. Starter targets.',items:labels('X/Y — Gogoat|X/Y — Rhyhorn|X/Y — Mamoswine|X/Y — Lapras|Legends: Arceus — Wyrdeer|Legends: Arceus — Ursaluna|Legends: Arceus — Basculegion|Legends: Arceus — Sneasler|Legends: Arceus — Hisuian Braviary|Scarlet/Violet — Koraidon|Scarlet/Violet — Miraidon')},
 {id:'trainer',title:'Trainer Trades',emoji:'🤝',group:'records',description:'In-game NPC trade Pokémon you want to collect. Add your own checklist targets.',items:[]},
 {id:'events',title:'Event Dex',emoji:'🎁',group:'records',description:'Distribution events. Add event-specific entries independently.',items:[]},
 {id:'worlds',title:'Worlds Distributions',emoji:'🏆',group:'records',description:'World Championships distribution Pokémon, tracked by event.',items:[]},
 {id:'balls',title:'Poké Ball Dex',emoji:'🔴',group:'records',starter:true,description:'One representative of each ball type, without needing to attach a Pokémon. Starter catalog.',items:labels('Poké Ball|Great Ball|Ultra Ball|Master Ball|Premier Ball|Cherish Ball|Luxury Ball|Heal Ball|Net Ball|Nest Ball|Dive Ball|Dusk Ball|Quick Ball|Repeat Ball|Timer Ball|Safari Ball|Sport Ball|Fast Ball|Level Ball|Lure Ball|Heavy Ball|Love Ball|Friend Ball|Moon Ball|Dream Ball|Beast Ball|Strange Ball|Feather Ball|Wing Ball|Jet Ball|Leaden Ball|Gigaton Ball|Origin Ball')},
 {id:'marks',title:'Mark Dex',emoji:'🎗️',group:'records',starter:true,description:'Marks as individual checklist items. Pokémon association is optional. Starter catalog.',items:labels('Lunchtime Mark|Sleepy-Time Mark|Dusk Mark|Dawn Mark|Cloudy Mark|Rainy Mark|Stormy Mark|Snowy Mark|Blizzard Mark|Dry Mark|Sandstorm Mark|Misty Mark|Destiny Mark|Fishing Mark|Curry Mark|Uncommon Mark|Rare Mark|Rowdy Mark|Calmness Mark|Jumbo Mark|Mini Mark|Mightiest Mark|Partner Mark')},
 {id:'ribbons',title:'Ribbon Dex',emoji:'🎀',group:'records',starter:true,description:'Ribbons preserved through HOME. One of each type; starter catalog.',items:labels('Champion Ribbon|Sinnoh Champion Ribbon|Kalos Champion Ribbon|Galar Champion Ribbon|Paldea Champion Ribbon|Best Friends Ribbon|Effort Ribbon|Artist Ribbon|Footprint Ribbon|Master Rank Ribbon|Tower Master Ribbon|Twinkling Star Ribbon|Contest Memory Ribbon|Battle Memory Ribbon')},
 {id:'eevee',title:'Eevee Dex',emoji:'🦊',group:'special',starter:true,description:'Each generation of Eevee, its evolutions, and selected variants. Expandable.',items:labels('Eevee — Gen I|Eevee — Gen II|Eevee — Gen III|Eevee — Gen IV|Eevee — Gen V|Eevee — Gen VI|Eevee — Gen VII|Eevee — Gen VIII|Eevee — Gen IX|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon|Gigantamax Eevee|Shiny Eevee')},
 {id:'pikachu',title:'Pikachu Dex',emoji:'⚡',group:'special',starter:true,description:'Pikachu forms and special variants. Starter targets, expandable.',items:labels('Pikachu|Shiny Pikachu|Gigantamax Pikachu|Original Cap Pikachu|Hoenn Cap Pikachu|Sinnoh Cap Pikachu|Unova Cap Pikachu|Kalos Cap Pikachu|Alola Cap Pikachu|Partner Cap Pikachu|World Cap Pikachu')}
];
function matchSpeciesId(name){const n=name.toLowerCase();if(n.startsWith('lycanroc'))return 745;if(n.startsWith('oricorio'))return 741;if(n.startsWith('rotom'))return 479;if(n.startsWith('toxtricity'))return 849;if(n.startsWith('furfrou'))return 676;return undefined;}
export function collectionById(id){return COLLECTIONS.find(x=>x.id===id);}
const ASSOCIATED_COLLECTIONS = new Set(['titan','ride','eevee','pikachu','trainer','events','worlds']);
function sidForEntry(name,species){
 const value=String(name).toLowerCase();
 const matches=species.filter(mon=>value.includes(mon.name.toLowerCase()));
 matches.sort((a,b)=>b.name.length-a.name.length);
 return matches[0]?.id;
}
export function collectionEntries(collection,species,custom=[]){
 if(!collection)return [];
 const raw=collection.fullSpecies?species.map(mon=>({id:String(mon.id),name:mon.name,speciesId:mon.id})):collection.items||[];
 const ids=new Set(raw.map(item=>item.id));
 const all=[...raw,...custom.filter(item=>!ids.has(item.id))];
 if(!ASSOCIATED_COLLECTIONS.has(collection.id))return all;
 return all.map(item=>item.speciesId?item:{...item,speciesId:sidForEntry(item.name,species)});
}
export {FORM_CATALOG_COUNTS};
export const CATALOG_VERSION='2026-11-prototype';
