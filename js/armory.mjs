import {HERO,GEAR_BASE,GEAR_SLOTS,GEAR_RARITY} from './data.mjs';
import {gearTraits,GEAR_TRAIT_CAPS} from './equipment.mjs';
import {GEAR_SET,SIGNATURES,HUNTS,HUNT,HUNT_TIERS} from './armory-data.mjs';
const int=(n,min=0,max=1e9)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const record=o=>o&&typeof o==='object'&&!Array.isArray(o);
export function starterArmory(){return {marks:Object.fromEntries(HUNTS.map(h=>[h.id,0])),hunts:Object.fromEntries(HUNTS.map(h=>[h.id,{best:0,clears:0}])),target:null,essence:0};}
export function gearLoadout(s,hero){
  const counts={},slots=s.equipped[hero]||{},affixes={crit:0,drain:0,energy:0};let signature=null,weaponRarity=null;
  for(const id of Object.values(slots)){const g=s.inventory.find(g=>g.id===id),base=g&&GEAR_BASE[g.base];if(!g)continue;if(base.set)counts[base.set]=(counts[base.set]||0)+1;if(base.hero===hero)signature=hero;if(base.slot==='weapon')weaponRarity=g.rarity;const traits=gearTraits(g);for(const k of Object.keys(affixes))affixes[k]=Math.min(GEAR_TRAIT_CAPS[k],affixes[k]+traits[k]);}
  return {sets:Object.entries(counts).map(([id,count])=>({id,count})),signature,affixes,weaponRarity};
}
export function loadoutEffects(loadout){
  const out={hp:0,atk:0,def:0,shield:0,burn:0,drain:(loadout?.affixes?.drain||0)/100,reflect:0,crit:(loadout?.affixes?.crit||0)/100,energy:loadout?.affixes?.energy||0};
  for(const entry of loadout?.sets||[]){const set=GEAR_SET[entry.id];if(!set)continue;if(entry.count>=2){out.hp+=set.hp||0;out.atk+=set.atk||0;out.def+=set.def||0;}if(entry.count>=3)for(const k of ['shield','burn','drain','reflect'])out[k]+=set[k]||0;if(entry.count>=3&&set.void)out.void=set.void;}
  return out;
}
export function forgeCost(baseId){const b=GEAR_BASE[baseId];return b?.crafted?{boss:GEAR_SET[b.set].boss,marks:b.hero?8:4,gold:b.hero?350:150,dust:b.hero?8:3,...(b.set==='void'?{raid:true}:{})}:null;}
export function setForgeTarget(s,id){if(id!==null&&!forgeCost(id))throw new Error('Mục tiêu rèn không hợp lệ.');s.armory.target=id;}
export const forgeMaterials=(s,cost)=>cost?.raid?(s.raids?.dragon?.scales||0):s.armory.marks[cost?.boss];
export function forgeProgress(s,id=s.armory.target){const cost=forgeCost(id),have=forgeMaterials(s,cost);return cost?{...cost,have,remaining:Math.max(0,cost.marks-have)}:null;}
export function makeForgedGear(s,baseId){
  const b=GEAR_BASE[baseId];if(!b?.crafted)throw new Error('Công thức rèn không tồn tại.');
  const primary=GEAR_SLOTS[b.slot].stat;
  return {id:'gear-'+s.nextGearId++,base:baseId,rarity:'SSR',level:0,quality:100,affixes:['atk','maxHp','def'].filter(k=>k!==primary).map(stat=>({stat,value:stat==='maxHp'?24:stat==='atk'?5:3}))};
}
export function forgeGear(s,id){
  const cost=forgeCost(id),b=GEAR_BASE[id];if(!cost)throw new Error('Công thức rèn không tồn tại.');
  if(b.hero&&!Object.hasOwn(s.owned,b.hero))throw new Error('Hãy chiêu mộ anh hùng trước khi rèn trấn phái.');
  if(b.hero&&s.inventory.some(g=>g.base===id))throw new Error('Trấn phái này đã có trong kho.');
  if(s.inventory.length>=120)throw new Error('Kho đã đầy. Hãy phân rã một món trước khi rèn.');
  if(forgeMaterials(s,cost)<cost.marks||s.gold<cost.gold||s.dust<cost.dust)throw new Error(cost.raid?'Chưa đủ Vảy Hư Không, vàng hoặc bụi rèn.':'Chưa đủ ấn boss, vàng hoặc bụi rèn.');
  if(cost.raid)s.raids.dragon.scales-=cost.marks;else s.armory.marks[cost.boss]-=cost.marks;s.gold-=cost.gold;s.dust-=cost.dust;
  const gear=makeForgedGear(s,id);s.inventory.push(gear);if(s.armory.target===id)s.armory.target=null;return gear;
}
export function huntUnlocked(s,id,tier){return Object.hasOwn(HUNT,id)&&int(tier,1,3)&&tier<=s.armory.hunts[id].best+1;}
export function completeHunt(s,r){
  const c=r.hunt;if(!c||c.claimed||r.phase!=='battle'||r.battle.enemies.some(e=>e.hp>0))throw new Error('Phần thưởng săn boss chưa sẵn sàng.');
  const tier=HUNT_TIERS[c.difficulty-1],rec=s.armory.hunts[c.id];c.claimed=true;rec.best=Math.max(rec.best,c.difficulty);rec.clears++;s.armory.marks[c.id]+=tier.marks;s.armory.essence+=tier.essence;s.gold+=tier.gold;r.goldEarned+=tier.gold;
  return {id:c.id,marks:tier.marks,gold:tier.gold,essence:tier.essence};
}
function validLoadout(loadout,hero){
  return loadout===null||(record(loadout)&&record(loadout.affixes)&&Object.keys(loadout.affixes).length===3&&Object.entries(GEAR_TRAIT_CAPS).every(([k,max])=>int(loadout.affixes[k],0,max))&&(loadout.weaponRarity===null||Object.hasOwn(GEAR_RARITY,loadout.weaponRarity))&&Array.isArray(loadout.sets)&&loadout.sets.length<=3&&loadout.sets.every(e=>record(e)&&Object.hasOwn(GEAR_SET,e.id)&&int(e.count,1,3))&&new Set(loadout.sets.map(e=>e.id)).size===loadout.sets.length&&loadout.sets.reduce((n,e)=>n+e.count,0)<=3&&(loadout.signature===null||(loadout.signature===hero&&Object.hasOwn(SIGNATURES,hero)&&loadout.sets.some(e=>e.id===SIGNATURES[hero].set))));
}
export function validateArmory(s){
  const a=s.armory;
  if(!record(a)||!record(a.marks)||Object.keys(a.marks).length!==4||HUNTS.some(h=>!Object.hasOwn(a.marks,h.id)||!int(a.marks[h.id]))||!record(a.hunts)||Object.keys(a.hunts).length!==4||HUNTS.some(h=>{const rec=a.hunts[h.id];return !Object.hasOwn(a.hunts,h.id)||!record(rec)||!int(rec.best,0,3)||!int(rec.clears)||rec.clears<rec.best;})||(a.target!==null&&!forgeCost(a.target)))throw new Error('Xưởng rèn hoặc tiến trình săn boss không hợp lệ.');
  if(!int(a.essence))throw new Error('Tinh hoa boss không hợp lệ.');
  const r=s.run;if(!r)return;
  if(r.mode==='training'||r.training!==null||r.heroes.some(h=>!validLoadout(h.loadout,h.id)))throw new Error('Trang bị trong chuyến đi không hợp lệ.');
  if(r.mode!=='hunt'){if(r.hunt!==null)throw new Error('Chuyến săn boss không hợp lệ.');return;}
  const c=r.hunt;
  if(!record(c)||!Object.hasOwn(HUNT,c.id)||!huntUnlocked(s,c.id,c.difficulty)||typeof c.claimed!=='boolean'||r.challenge!==null||r.dungeon!==null||r.floor!==1||r.routes.length!==1||r.routes[0]!=='boss'||!['battle','result'].includes(r.phase)||r.node!=='boss'||r.battle?.bossState?.id!==c.id||r.battle.enemies[0]?.bossId!==c.id)throw new Error('Luật săn boss không hợp lệ.');
  if(r.phase==='battle'&&(c.claimed||r.cleared!==0))throw new Error('Tiến độ săn boss không hợp lệ.');
  const prize=r.summary?.huntReward,won=r.phase==='result'&&r.summary.reason==='victory',def=HUNT_TIERS[c.difficulty-1];
  if(c.claimed!==won||(won&&(!prize||prize.id!==c.id||prize.marks!==def.marks||prize.gold!==def.gold||(prize.legacyEssence===true?prize.essence!==0:prize.essence!==def.essence)||r.cleared!==1||r.summary.cleared!==1||s.armory.hunts[c.id].best<c.difficulty))||(!won&&prize))throw new Error('Phần thưởng săn boss không hợp lệ.');
}
