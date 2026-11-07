// Historical migration tests compare combat/economy independently of newly added reports.
// Dedicated victory and gear-progression tests cover report migration, new equipment
// snapshots, boss essence and neutral v17/v18 raid defaults. Only these additions are projected out;
// existing currencies, stats, item affixes, actions and RNG remain in the trace hash.
// Project out summoning only for its exact v20 empty defaults; any progress stays.
// Use the narrower projection when comparing post-v15 engines: all original
// contribution rows, burn attribution, victory stages and currencies remain visible.
export function withoutResultLedger(value){
  const copy=structuredClone(value),r=copy.run||copy;
  for(const stats of [r.statistics,r.battle?.statistics])if(stats)delete stats.report;
  return copy;
}
export function withoutCombatReport(value){
  const copy=structuredClone(value);
  // Bonds and achievements are account-level metadata introduced after the
  // historical combat baselines. Legacy projections intentionally ignore it
  // so old action/RNG traces continue to compare the gameplay state only.
  delete copy.achievements;delete copy.bonds;
  delete copy.lockedGear;delete copy.gearPresets;if(JSON.stringify(copy.refining)===JSON.stringify({rolls:0,pending:null}))delete copy.refining;if(JSON.stringify(copy.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete copy.loginRewards;if(JSON.stringify(copy.bonds)==='{}')delete copy.bonds;if(JSON.stringify(copy.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete copy.season;
  function visit(node){if(!node||typeof node!=='object')return;
    // The marker alone has no combat effect. Real traits and elite rewards remain in hashes.
    if(node.eliteRules===1&&!node.battle?.enemies?.some(e=>e.elite)&&!node.lastReward?.eliteBonus)delete node.eliteRules;
    // Neutral opt-in only: real signatures and pending offers must stay in the trace.
    if(node.contractRules===1&&Array.isArray(node.contracts)&&node.contracts.length===0&&node.contractOffer===null&&node.phase!=='contract'){delete node.contractRules;delete node.contracts;delete node.contractOffer;}
    if(node.loadout){delete node.loadout.affixes;delete node.loadout.weaponRarity;}
    if(node.marks&&node.hunts)delete node.essence;
    if(node.huntReward){delete node.huntReward.essence;delete node.huntReward.legacyEssence;}
    if(node.summoning&&JSON.stringify(node.summoning)===JSON.stringify({target:null,guaranteed:{R:false,SR:false,SSR:false,UR:false,LR:false,MR:false,EX:false},exchanged:[]}))delete node.summoning;
    if(node.onboarding&&JSON.stringify(node.onboarding)===JSON.stringify({status:'available',completed:[],claimed:[],ssr:null}))delete node.onboarding;
    if(node.raid===null)delete node.raid;
    if(node.raids&&[17,18,19].some(version=>JSON.stringify(node.raids)===JSON.stringify({teams:Array.from({length:3},()=>[null,null,null]),fronts:[1,1,1],records:Array.from({length:3},()=>({clears:0,bestRounds:null,...(version>=18?{fullParty:false,claimed:[]}:{})})),...(version===19?{dragon:{records:Array.from({length:3},()=>({clears:0,bestRounds:null,fullParty:false,claimed:[]})),scales:0}}:{})})))delete node.raids;
    for(const key of Object.keys(node)){if(['statistics','victory','burnSource'].includes(key))delete node[key];else visit(node[key]);}}
  visit(copy);return copy;
}
