import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {GEAR_BASE,GEAR_RARITY,GEAR_SLOTS} from '../js/data.mjs';
import {HUNTS,HUNT_TIERS} from '../js/armory-data.mjs';
import {equipmentPage,gearDetail,equipmentComparison} from '../js/expansion-ui.mjs';
import {huntDetail,huntResult,huntsPage} from '../js/armory-ui.mjs';
import {victoryPage} from '../js/victory-ui.mjs';
const copy=s=>E.validateState(structuredClone(s));
function rich(){const s=E.createState();s.gold=1e7;s.dust=100000;s.armory.essence=10000;s.armory.marks.colossus=100;return s;}
function evolved(s,base='dawnblade',rarity='EX'){
  const g=base.startsWith('signature-')||base.startsWith('set-')?E.forgeGear(s,base):E.dropGear(s,()=>.5,1,'treasure').gear;
  g.base=base;const primary=GEAR_SLOTS[GEAR_BASE[base].slot].stat;g.affixes=g.affixes.filter(a=>a.stat!==primary);
  if(!g.affixes.length)g.affixes=[{stat:primary==='maxHp'?'atk':'maxHp',value:3}];
  g.level=10;while(g.rarity!==rarity)E.evolveGear(s,g.id);return g;
}
function battleWith(stat,value=10){
  const s=rich(),g=evolved(s,'dawnblade','UR');g.affixes[2]={stat,value};E.equipGear(s,g.id,'aerin');E.startHunt(s,'colossus',1,42);s.run.pet=null;s.run.resonances=[];const h=s.run.heroes.find(h=>h.id==='aerin');h.energy=0;h.hp=1;return {s,h,g};
}

test('all seven gear tiers have finite stronger primaries, unique affixes and valid round trips',()=>{
  for(const slot of Object.keys(GEAR_SLOTS)){
    const s=rich(),base=Object.values(GEAR_BASE).find(b=>!b.crafted&&b.slot===slot).id,g=s.inventory[0];g.base=base;g.affixes=[{stat:GEAR_SLOTS[slot].stat==='maxHp'?'atk':'maxHp',value:3}];g.level=10;
    let previous=0;for(const rarity of E.GEAR_TIERS){assert.equal(g.rarity,rarity);const stats=E.gearStats(g),value=stats[GEAR_SLOTS[slot].stat];assert.ok(value>previous);previous=value;assert.equal(g.affixes.length,GEAR_RARITY[rarity].affixes);assert.equal(new Set(g.affixes.map(a=>a.stat)).size,g.affixes.length);assert.ok(Object.values(stats).every(Number.isFinite));copy(s);if(rarity!=='EX')E.evolveGear(s,g.id);}
  }
});

test('evolution spends exactly its preview cost, keeps identity, upgrades, quality, ownership and all set/signature effects',()=>{
  const s=rich(),g=E.forgeGear(s,'signature-rook');g.level=10;E.equipGear(s,g.id,'rook');const initial={id:g.id,base:g.base,level:g.level,quality:g.quality},slots=structuredClone(s.equipped),nextId=s.nextGearId;
  for(const rarity of ['UR','LR','MR','EX']){const preview=E.previewGearEvolution(g),before=structuredClone(s),cost=E.gearEvolutionCost(g);assert.equal(E.evolveGear(s,g.id),g);assert.equal(g.rarity,rarity);assert.deepEqual(g,preview);for(const [k,v] of Object.entries(initial))assert.equal(g[k],v);assert.equal(s.gold,before.gold-cost.gold);assert.equal(s.dust,before.dust-cost.dust);assert.equal(s.armory.essence,before.armory.essence-cost.essence);assert.equal(s.nextGearId,nextId);assert.deepEqual(s.equipped,slots);assert.equal(E.gearLoadout(s,'rook').signature,'rook');assert.deepEqual(E.gearLoadout(s,'rook').sets,[{id:'bastion',count:1}]);copy(s);}
  assert.equal(E.previewGearEvolution(g),null);assert.equal(E.gearEvolutionCost(g),null);
});

test('missing evolution resources, level, id and max rarity fail atomically',()=>{
  for(const alter of [s=>s.gold=0,s=>s.dust=0,s=>s.armory.essence=0,s=>s.inventory[0].level=0,s=>{while(s.inventory[0].rarity!=='EX')E.evolveGear(s,s.inventory[0].id);}]){
    const s=rich();s.inventory[0].level=10;alter(s);const before=structuredClone(s);assert.throws(()=>E.evolveGear(s,'gear-1'));assert.deepEqual(s,before);
  }
  const s=rich(),before=structuredClone(s);assert.throws(()=>E.evolveGear(s,'missing'));assert.deepEqual(s,before);
});

test('new evolution lines are stable across previews and reloads, while preserving prior stat choices',()=>{
  const s=rich(),g=evolved(s,'dawnblade','UR'),before=structuredClone(s),preview=E.previewGearEvolution(g);for(let i=0;i<12;i++)assert.deepEqual(E.previewGearEvolution(copy(s).inventory.find(a=>a.id===g.id)),preview);
  assert.deepEqual(s,before);const traits=g.affixes.filter(a=>['crit','drain','energy'].includes(a.stat)).map(a=>a.stat);E.evolveGear(s,g.id);assert.ok(traits.every(k=>g.affixes.some(a=>a.stat===k)));assert.equal(g.affixes.length,4);
});

test('deep bosses unlock UR/LR/MR at disclosed floors and EX is obtained by evolution',()=>{
  for(const [floor,expected] of [[14,'SSR'],[15,'UR'],[39,'UR'],[40,'LR'],[59,'LR'],[60,'MR']]){const s=rich(),loot=E.dropGear(s,()=>0,floor,'boss');assert.equal(loot.gear.rarity,expected);copy(s);}
  for(const source of ['boss','elite','treasure','battle'])for(const floor of [1,14,15,25,40,50,60,100,1000000]){const table=E.gearDropChances(floor,source);assert.ok(Math.abs(table.reduce((n,[,v])=>n+v,0)-1)<1e-12);assert.ok(table.every(([,v])=>v>=0&&v<=1));assert.ok(!table.some(([rarity])=>rarity==='EX'));if(source==='boss')assert.ok(!table.some(([rarity])=>rarity==='R'));}
});

test('random high-rarity loot and full storage conversion validate without losing or duplicating rewards',()=>{
  const s=rich();let seed=21;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let i=0;i<300;i++){const loot=E.dropGear(s,rng,100,'boss'),g=loot.gear;E.validateEquipment({...s,inventory:[g],equipped:{}});assert.equal(g.affixes.length,new Set(g.affixes.map(a=>a.stat)).size);assert.ok(g.affixes.every(a=>Number.isSafeInteger(a.value)));}
  const before=structuredClone(s),loot=E.dropGear(s,()=>0,60,'boss');assert.equal(loot.gear.rarity,'MR');assert.equal(loot.converted,true);assert.equal(loot.dust,E.dismantleValue(loot.gear));assert.equal(s.dust,before.dust+loot.dust);assert.equal(s.inventory.length,E.GEAR_LIMIT);assert.equal(s.nextGearId,before.nextGearId+1);copy(s);
});

test('every boss grants exactly 1/2/4 essence once and both victory stages survive reload',()=>{
  for(const boss of HUNTS){const s=E.createState();let total=0;for(let tier=1;tier<=3;tier++){E.startHunt(s,boss.id,tier,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');total+=HUNT_TIERS[tier-1].essence;assert.equal(s.armory.essence,total);assert.equal(s.run.summary.huntReward.essence,HUNT_TIERS[tier-1].essence);assert.equal(E.victoryRewards(s.run).essence,HUNT_TIERS[tier-1].essence);const won=structuredClone(s);assert.throws(()=>E.completeHunt(s,s.run));assert.deepEqual(s,won);E.advanceVictory(s);copy(s);assert.match(victoryPage(s),/Tinh hoa boss/);E.advanceVictory(s);assert.equal(copy(s).armory.essence,total);E.finishRun(s);assert.equal(s.armory.essence,total);assert.match(huntResult(s),/Tinh hoa boss/);}}
});

test('retreats, defeats, tower rewards and training do not grant hunt essence',()=>{
  for(const mode of ['retreat','defeat','training','tower']){let s=E.createState();if(mode==='training')s=E.createTrainingState(s);else if(mode==='tower'){E.startRun(s,42);E.chooseRoute(s,0);}else E.startHunt(s,'colossus',1,42);
    if(mode==='retreat')E.finishRun(s);else if(mode==='defeat'){for(const h of s.run.heroes)h.hp=1;s.run.battle.bossState.move='quake';E.enemyTurn(s);}else{s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');}assert.equal(s.armory.essence,0);}
});

test('lifesteal heals actual HP damage and energy affix applies only after normal attacks with a cap of 100',()=>{
  let {s,h}=battleWith('drain');const events=E.playerAction(s,'aerin','enemy0'),hit=events.find(e=>e.target==='enemy0');assert.equal(h.hp,1+Math.round(hit.value*E.loadoutEffects(h.loadout).drain));assert.ok(h.hp>1);copy(s);
  ({s,h}=battleWith('energy'));const bonus=h.loadout.affixes.energy;E.playerAction(s,'aerin','enemy0');assert.equal(h.energy,35+bonus);E.enemyTurn(s);h.energy=99;E.playerAction(s,'aerin','enemy0');assert.equal(h.energy,100);E.enemyTurn(s);E.playerAction(s,'aerin','enemy0',true);assert.equal(h.energy,0);copy(s);
});

test('crit affix changes the threshold without consuming additional RNG or amplifying non-crits',()=>{
  let found=false;for(let index=1;index<100&&!found;index++){const {s}=battleWith('crit',20),plain=structuredClone(s);s.run.seed=plain.run.seed=Math.imul(index,2654435761)>>>0;plain.run.heroes.find(a=>a.id==='aerin').loadout.affixes.crit=0;const a=E.playerAction(s,'aerin','enemy0')[0],b=E.playerAction(plain,'aerin','enemy0')[0];assert.equal(s.run.seed,plain.run.seed);if(a.crit&&!b.crit){assert.ok(a.value>b.value);found=true;}else assert.equal(a.value,b.value);}
  assert.equal(found,true);
});

test('gear affix caps, equipped weapon appearance and all effects are snapshotted for the next journey',()=>{
  const s=rich();for(const base of ['dawnblade','mossguard','sunpendant']){const g=evolved(s,base);for(const a of g.affixes)if(['crit','drain','energy'].includes(a.stat))a.value=20;E.equipGear(s,g.id,'rook');}
  assert.deepEqual(E.gearLoadout(s,'rook').affixes,E.GEAR_TRAIT_CAPS);E.startHunt(s,'colossus',1,42);const hero=structuredClone(s.run.heroes[0]);assert.equal(hero.loadout.weaponRarity,'EX');for(const id of Object.values(s.equipped.rook))E.unequipGear(s,id);assert.deepEqual(s.run.heroes[0],hero);assert.deepEqual(copy(s).run.heroes[0],hero);E.finishRun(s);E.startRun(s,42);assert.deepEqual(s.run.heroes[0].loadout.affixes,{crit:0,drain:0,energy:0});assert.equal(s.run.heroes[0].loadout.weaponRarity,null);
});

test('v15 migration adds neutral snapshots and zero essence, preserving every old item and ongoing combat',()=>{
  const s=rich(),g=E.forgeGear(s,'signature-rook');E.equipGear(s,g.id,'rook');E.startHunt(s,'colossus',1,42);s.version=15;delete s.armory.essence;for(const h of s.run.heroes){delete h.loadout.affixes;delete h.loadout.weaponRarity;}const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.equal(m.armory.essence,0);for(const key of ['inventory','equipped','gold','dust','nextGearId'])assert.deepEqual(m[key],s[key]);assert.deepEqual(m.run.battle,s.run.battle);assert.equal(m.run.seed,s.run.seed);assert.equal(m.run.heroes[0].loadout.signature,'rook');assert.deepEqual(m.run.heroes[0].loadout.affixes,{crit:0,drain:0,energy:0});assert.equal(m.run.heroes[0].loadout.weaponRarity,null);assert.deepEqual(copy(m),m);
});

test('a claimed pre-upgrade hunt resumes without granting new essence, including a partially opened chest',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');E.advanceVictory(s);s.version=15;delete s.armory.essence;delete s.run.summary.huntReward.essence;for(const h of s.run.heroes){delete h.loadout.affixes;delete h.loadout.weaponRarity;}const m=copy(s);assert.equal(m.armory.essence,0);assert.equal(m.run.summary.huntReward.essence,0);assert.equal(m.run.victory.stage,'loot');assert.equal(E.victoryRewards(m.run).essence,0);E.advanceVictory(m);E.finishRun(m);assert.equal(copy(m).armory.essence,0);
});

test('evolving a newly dropped item cannot rewrite the recorded chest reward or active combat snapshot',()=>{
  const s=rich();E.startRun(s,42);const r=s.run;r.map=null;r.floor=5;r.routes=['boss'];E.chooseRoute(s,0);r.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');const reward=structuredClone(r.lastReward),heroes=structuredClone(r.heroes),seed=r.seed,g=s.inventory.find(g=>g.id===reward.loot.gear.id);assert.notEqual(g,r.lastReward.loot.gear);
  while(g.level<10)E.upgradeGear(s,g.id);while(g.rarity!=='EX')E.evolveGear(s,g.id);assert.deepEqual(r.lastReward,reward);assert.deepEqual(r.heroes,heroes);assert.equal(r.seed,seed);assert.deepEqual(copy(s).run.lastReward,reward);
});

test('invalid new gear, essence, snapshots and hunt prizes reject without changing the imported input',()=>{
  for(const mutate of [s=>s.armory.essence=-1,s=>delete s.armory.essence,s=>s.armory.essence=1.5,s=>s.inventory.at(-1).affixes[2].value=21,s=>s.inventory.at(-1).affixes[2].stat='html',s=>s.inventory.at(-1).affixes.push({stat:'crit',value:1}),s=>s.run.heroes[0].loadout.affixes.crit=31,s=>delete s.run.heroes[0].loadout.weaponRarity,s=>s.run.heroes[0].loadout.weaponRarity='constructor']){const s=rich();evolved(s,'dawnblade','UR');E.startHunt(s,'colossus',1,42);mutate(s);const before=structuredClone(s);assert.throws(()=>copy(s));assert.deepEqual(s,before);}
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');s.run.summary.huntReward.essence=99;assert.throws(()=>copy(s));
});

test('comparison includes whole-hero set thresholds, affix caps and signature ownership without mutations',()=>{
  const s=rich();for(const slot of ['weapon','armor']){const g=E.forgeGear(s,`set-bastion-${slot}`);if(slot==='weapon')E.equipGear(s,g.id,'rook');}
  const g=s.inventory.at(-1),before=structuredClone(s),result=equipmentComparison(s,g,'rook');assert.ok(result.after.maxHp>result.before.maxHp+E.gearStats(g).maxHp);assert.deepEqual(s,before);E.equipGear(s,g.id,'rook');assert.equal(E.heroStats(s,'rook').maxHp,result.after.maxHp);const signature=E.forgeGear(s,'signature-rook');assert.equal(equipmentComparison(s,signature,'aerin'),null);
});

test('equipment and hunt UI expose seven-tier sorting, special units, exact evolution costs and acquisition',()=>{
  const s=rich(),ex=evolved(s),ur=evolved(s,'dawnblade','UR');const page=equipmentPage(s,'rook','all');assert.ok(page.indexOf(`data-id="${ex.id}"`)<page.indexOf(`data-id="${ur.id}"`));assert.match(page,/R → EX/);assert.match(page,/15\+.*40\+.*60\+/);const detail=gearDetail(s,ur.id,'rook');assert.match(detail,/Trước và sau khi mặc/);assert.match(detail,/Tiến hóa lên LR/);assert.match(detail,/data-rarity="UR"/);assert.match(detail,/data-weapon-rarity="UR"/);assert.match(detail,/Hút máu|chí mạng|năng lượng/);assert.match(gearDetail(s,ex.id,'rook'),/Đỉnh cao trang bị/);assert.match(huntsPage(s,3),/4 Tinh hoa/);assert.match(huntDetail(s,'colossus',3),/4 Tinh hoa boss/);
});
