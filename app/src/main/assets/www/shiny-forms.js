// Shiny form ownership is separate from regular forms and from the National Shiny Dex.
// Stable IDs use sourceCollection|sourceItemId; NEVER copy another collection's checkmarks.
export const SHINY_FORM_SOURCES=[
 {id:'regional',label:'Regional Forms'},
 {id:'variants',label:'Alternate Forms'},
 {id:'vivillon',label:'Vivillon Patterns'},
 {id:'alcremie',label:'Alcremie Sweets'},
 {id:'unown',label:'Unown Letters'},
 {id:'furfrou',label:'Furfrou Trims'},
 {id:'gmax',label:'Gigantamax Factor'},
 {id:'alpha',label:'Shiny Alpha'}
];
export const SHINY_FORMS_CATALOG_NOTE='Shiny availability varies by game, date, distribution and form. This is a collectible-target catalog, not a guarantee of current availability. Verify unusual/event-only targets before trading.';
export const VERIFIED_LOCKED_FORM_REASONS=new Map([
 ['vivillon|poke-ball','Poké Ball Pattern Vivillon has not been released as Shiny.'],
 ['variants|801:original','Original Color Magearna has not been officially released as Shiny.'],
 ['variants|801:magearna','Magearna has not been officially released as Shiny.'],
 ['variants|893:zarude','Zarude has not been officially released as Shiny.'],
 ['variants|893:dada','Dada Zarude has not been officially released as Shiny.'],
 ['variants|901:bloodmoon','Bloodmoon Ursaluna is Shiny-locked.'],
 ['variants|720:confined','Hoopa is not officially obtainable as Shiny.'],
 ['variants|720:unbound','Hoopa is not officially obtainable as Shiny.'],
 ['variants|647:ordinary','Keldeo has not been officially obtainable as Shiny.'],
 ['variants|647:resolute','Keldeo has not been officially obtainable as Shiny.'],
 ['gmax|gigantamax-melmetal','Gigantamax Melmetal distribution has been Shiny-locked.'],
 ['variants|905:incarnate','Enamorus shiny availability needs verification.'],
 ['variants|905:therian','Enamorus shiny availability needs verification.']
]);
const specialDuplicateSpecies=new Set([201,666,676,869]);
const notDistinct=new Set([
 '25:pikachu', '801:magearna', '893:zarude', '901:ursaluna'
]);
// All Pikachu cap forms require an event-only shiny review. Do not count them toward completion.
const capPattern=/^25:.*-cap$/;
export function shinyFormExclusion(source,item){
 const key=source+'|'+item.id;
 if(VERIFIED_LOCKED_FORM_REASONS.has(key))return VERIFIED_LOCKED_FORM_REASONS.get(key);
 if(source==='variants'&&specialDuplicateSpecies.has(Number(item.speciesId)))return 'Tracked instead in the dedicated form collection.';
 if(source==='variants'&&notDistinct.has(String(item.id)))return 'This is the base species, already covered by the Shiny Dex.';
 if(source==='variants'&&capPattern.test(String(item.id)))return 'Cap Pikachu shiny rules are event-specific; not included in completion targets.';
 return null;
}
export function buildShinyFormEntries(collections){
 const byId=new Map(collections.map(coll=>[coll.id,coll]));
 const results=[];
 for(const source of SHINY_FORM_SOURCES){
  const coll=byId.get(source.id);
  if(!coll)continue;
  for(const item of coll.items||[]){
   if(shinyFormExclusion(source.id,item))continue;
   results.push({
    id:source.id+'|'+item.id,
    name:'Shiny '+item.name,
    speciesId:item.speciesId,
    sourceCollection:source.id,
    originId:String(item.id),
    sourceLabel:source.label,
    region:item.region,
    family:item.family,
    // The normal/form checkbox is never inferred from this flag.
    independentlyTracked:true
   });
  }
 }
 return results;
}
