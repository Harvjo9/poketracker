// All 18 standard Pokémon types and the Stellar Terastal Type (Scarlet/Violet).
// Tera Types are attributes of individual Pokémon, not separate species or HOME reward Dexes.
// Collection progress is a voluntary one-example-per-type checklist, not HOME-verified progress.
export const TERA_TYPES = Object.freeze([
 {id:'normal', name:'Normal', icon:'⚪', color:'#9899a5'},
 {id:'fire', name:'Fire', icon:'🔥', color:'#e95a38'},
 {id:'water', name:'Water', icon:'💧', color:'#3c91d3'},
 {id:'electric', name:'Electric', icon:'⚡', color:'#dda915'},
 {id:'grass', name:'Grass', icon:'🍃', color:'#4caa63'},
 {id:'ice', name:'Ice', icon:'❄️', color:'#44abbb'},
 {id:'fighting', name:'Fighting', icon:'🥊', color:'#c36446'},
 {id:'poison', name:'Poison', icon:'☠️', color:'#a76bba'},
 {id:'ground', name:'Ground', icon:'🟤', color:'#bc9154'},
 {id:'flying', name:'Flying', icon:'🪽', color:'#8a98df'},
 {id:'psychic', name:'Psychic', icon:'🔮', color:'#d66791'},
 {id:'bug', name:'Bug', icon:'🐞', color:'#8ca93b'},
 {id:'rock', name:'Rock', icon:'🪨', color:'#a29668'},
 {id:'ghost', name:'Ghost', icon:'👻', color:'#7662b9'},
 {id:'dragon', name:'Dragon', icon:'🐉', color:'#6864d2'},
 {id:'dark', name:'Dark', icon:'🌑', color:'#656572'},
 {id:'steel', name:'Steel', icon:'⚙️', color:'#7b9fae'},
 {id:'fairy', name:'Fairy', icon:'🧚', color:'#d985b4'},
 {id:'stellar', name:'Stellar', icon:'✨', color:'#a78ff0'}
]);
export const teraTypeById = (id)=>TERA_TYPES.find(t=>t.id===id);
export const isTeraType = (id)=>Boolean(teraTypeById(id));
export const teraSlotKey = (speciesId,slot)=>`tera:slot:${speciesId}:${slot}`;
export const teraOwnedKey = (speciesId,typeId)=>`tera:owned:${speciesId}:${typeId}`;
export const TERA_TYPE_ENTRIES = TERA_TYPES.map(t=>({id:t.id,name:t.name+' Tera Type',icon:t.icon,color:t.color}));
export const TERA_NOTE='Personal checklist: one representative of each of the 19 Tera types, including Stellar. This is NOT an official Pokémon HOME reward Dex. Recorded Pokémon Tera types and this checklist are independent.';
