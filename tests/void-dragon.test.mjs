import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {BOSSES,GEAR_BASE} from '../js/data.mjs';
import {GEAR_SETS,HUNTS} from '../js/armory-data.mjs';
import {worldForRun} from '../js/worlds3d.mjs';
import {raidMissionsPanel,raidsPage,raidRelayPage,raidResult,raidQuestLink} from '../js/raid-ui.mjs';
import {armoryPage,forgeDetail,forgeTargetPanel} from '../js/armory-ui.mjs';
import {victoryPage} from '../js/victory-ui.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';
import {DRAGON,account,roundtrip,overpower,clearStage,reachStage,win,wearVoid,sturdy} from './void-dragon-helper.mjs';
const wallet=s=>[s.gold,s.tickets,s.shards,s.dust,s.armory.essence,s.raids.dragon.scales,s.inventory.length,s.nextGearId];

test('Hắc Long unlock requires a complete Tam An elite clear, then uses its own sequential tiers',()=>{
  const s=account({unlocked:false});assert.equal(E.raidUnlocked(s,1,DRAGON),false);const before=structuredClone(s);
  assert.throws(()=>E.startRaid(s,1,42,DRAGON),/Tam Ấn · Tinh anh/);assert.deepEqual(s,before);
  for(const tier of [1,2]){E.startRaid(s,tier,42);overpower(s);for(let i=0;i<3;i++){clearStage(s);if(i<2){E.dismissVictory(s);E.continueRaid(s,i);}}assert.equal(E.raidUnlocked(s,1,DRAGON),tier===2);}
  assert.equal(E.raidUnlocked(s,2,DRAGON),false);win(s);assert.equal(E.raidUnlocked(s,2,DRAGON),true);assert.equal(E.raidUnlocked(s,3,DRAGON),false);roundtrip(s);
});

test('a raid-only boss leaves the eleven-boss tower rotation and four hunt wallets unchanged',()=>{
  const s=account();assert.ok(!BOSSES.some(b=>b.id===DRAGON));assert.equal(HUNTS.length,4);assert.equal(Object.keys(s.armory.marks).length,4);
  E.startRaid(s,1,42,DRAGON);assert.equal(E.bossForRun(s.run).id,DRAGON);assert.equal(s.run.battle.enemies[0].bossId,DRAGON);assert.equal(s.run.raid.boss,DRAGON);assert.equal(worldForRun(s.run).id,'ruins');roundtrip(s);
});

test('unknown boss identifiers reject before changing a draft, wallet or current result',()=>{
  const s=account(),before=structuredClone(s);for(const id of ['constructor','prototype','',null,42]){assert.throws(()=>E.startRaid(s,1,42,id));assert.deepEqual(s,before);}
  assert.throws(()=>E.claimRaidMission(s,1,'first','unknown'));assert.deepEqual(s,before);
});

test('wing protection reduces all damage by sixty percent and cannot kill the dragon',()=>{
  const a=reachStage(account(),0),b=structuredClone(a);for(const s of [a,b]){s.run.battle.enemies[0].hp=100000;s.run.battle.enemies[0].maxHp=100000;s.run.battle.bossState.parts=E.createBossParts(s.run.battle.enemies[0]);}
  for(const s of [a,b])for(const h of s.run.heroes)h.atk=200;
  b.run.battle.bossState.parts.arms.hp=0;
  const ha=E.playerAction(a,'rook','enemy0',false,'head')[0],hb=E.playerAction(b,'rook','enemy0',false,'head')[0];assert.equal(ha.value,Math.round(hb.value*.4));
  const s=reachStage(account(),0),e=s.run.battle.enemies[0];E.playerAction(s,'rook',e.id,false,'head');assert.equal(e.hp,1);assert.equal(s.run.phase,'battle');assert.ok(s.run.battle.bossState.parts.arms.hp>0);
  roundtrip(s);
});

test('targeted wing armor still breaks from pre-protection damage when the dragon has only one HP',()=>{
  const s=reachStage(account(),0),r=s.run,e=r.battle.enemies[0];e.hp=1;assert.equal(E.recommendedBossPart(r),'arms');
  const hit=E.playerAction(s,'rook',e.id,false,'arms')[0];assert.equal(hit.value,0);assert.equal(hit.part.broken,true);assert.equal(r.battle.bossState.parts.arms.hp,0);assert.equal(e.hp,1);assert.equal(E.bossAttackMultiplier(r),.8);
  assert.match(r.battle.log.map(v=>v.text).join(' '),/hạ đất/);E.playerAction(s,'aerin',e.id,false,'core');assert.equal(r.phase,'relay');roundtrip(s);
});

test('barrier protection reduces seventy percent and its core can break at one HP without a softlock',()=>{
  const s=reachStage(account(),1),r=s.run,e=r.battle.enemies[0];assert.equal(E.recommendedBossPart(r),'core');assert.equal(worldForRun(r).id,'ruins');
  const a=structuredClone(s),b=structuredClone(s);for(const v of [a,b])for(const h of v.run.heroes)h.atk=50;b.run.battle.bossState.parts.core.hp=0;
  const direct=E.playerAction(a,'ember','enemy0')[0].value,exposed=E.playerAction(b,'ember','enemy0')[0].value;assert.ok(direct<exposed*.4);
  e.hp=1;E.playerAction(s,'ember',e.id,false,'core');assert.equal(e.hp,1);assert.equal(r.battle.bossState.parts.core.hp,0);assert.equal(E.bossDirectMultiplier(r),1.25);E.playerAction(s,'kira',e.id,false,'head');assert.equal(r.phase,'relay');roundtrip(s);
});

test('burn, pet and void explosions respect unbroken wing protection and do not damage armor',()=>{
  const s=reachStage(account(),0),r=s.run,e=r.battle.enemies[0];e.hp=1;e.burn=2;e.burnPower=100000;e.burnSource={rook:1};const armor=structuredClone(r.battle.bossState.parts);E.enemyTurn(s);assert.equal(e.hp,1);assert.deepEqual(r.battle.bossState.parts,armor);
  E.petAction(s);assert.equal(e.hp,1);assert.deepEqual(r.battle.bossState.parts,armor);
  const hero=r.heroes[0];hero.loadout={...hero.loadout,sets:[{id:'void',count:3}]};e.voidMarks=2;E.playerAction(s,hero.id,e.id,false,'head');assert.equal(e.hp,1);assert.equal(e.voidMarks,0);assert.ok(r.battle.bossState.parts.arms.hp>0);
});

test('rage starts immediately with a charged attack and has no Tam An summoned guards',()=>{
  const s=reachStage(account(),2),r=s.run,bs=r.battle.bossState;assert.equal(bs.phase,2);assert.equal(bs.move,'charge');assert.equal(E.bossThreat(r).kind,'charge');assert.equal(r.battle.enemies.length,1);
  const before=structuredClone(r.heroes);E.enemyTurn(s);assert.equal(bs.move,'quake');assert.deepEqual(r.heroes,before);E.enemyTurn(s);assert.equal(bs.move,'strike');assert.equal(r.battle.enemies.length,1);assert.ok(r.heroes.every((h,i)=>h.hp<before[i].hp));roundtrip(s);
});

test('two offensive skills, freeze and a head break independently interrupt the final-stage hắc lôi',()=>{
  for(const method of ['skills','freeze','head']){
    const s=reachStage(account(),2),r=s.run,bs=r.battle.bossState;
    for(const h of r.heroes){h.atk=15;r.raid.teams[2].heroes.find(v=>v.id===h.id).atk=15;}
    if(method==='skills'){E.playerAction(s,'thorne','enemy0',true,'core');assert.equal(bs.stagger,1);E.playerAction(s,'bryn','enemy0',true,'core');assert.equal(bs.move,'stunned');r.battle.enemies[0].freeze=0;}
    if(method==='freeze')E.playerAction(s,'bryn','enemy0',true,'core');
    if(method==='head'){bs.parts.head.hp=1;E.playerAction(s,'thorne','enemy0',false,'head');assert.equal(bs.parts.stun,true);}
    const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);assert.equal(bs.move,'strike');assert.equal(bs.stagger,0);roundtrip(s);
  }
});

test('support healing skills do not count toward a two-hit charge interruption',()=>{
  const s=reachStage(account(),2),r=s.run;r.heroes.find(h=>h.id==='thorne').atk=15;E.playerAction(s,'seraph','enemy0',true);assert.equal(r.battle.bossState.stagger,0);E.playerAction(s,'thorne','enemy0',true);assert.equal(r.battle.bossState.stagger,1);
});

test('each dragon difficulty pays exactly one guaranteed high-rarity chest, own records and scales',()=>{
  const s=account();for(let tier=1;tier<=3;tier++){const before=wallet(s),tam=structuredClone(s.raids.records),v=E.VOID_RAID_TIERS[tier-1];win(s,tier);
    assert.equal(s.run.summary.reason,'victory');assert.equal(s.raids.dragon.scales,before[5]+v.scales);assert.equal(s.gold,before[0]+v.gold);assert.equal(s.armory.essence,before[4]+v.essence);assert.equal(s.inventory.length,before[6]+1);assert.equal(s.run.lastReward.loot.gear.rarity,v.rarity);assert.deepEqual(s.raids.records,tam);
    assert.equal(s.raids.dragon.records[tier-1].clears,1);assert.equal(s.raids.dragon.records[tier-1].fullParty,true);assert.equal(s.run.summary.raidReward.boss,DRAGON);assert.equal(E.victoryRewards(s.run).scales,v.scales);assert.equal(E.readyRaidMissions(s,DRAGON).filter(m=>m.tier===tier).length,3);
    const saved=roundtrip(s),unchanged=wallet(saved);E.dismissVictory(saved);E.finishRun(saved);assert.deepEqual(wallet(saved),unchanged);assert.throws(()=>E.completeRaid(saved,saved.run,()=>.5));roundtrip(saved);
  }
});

test('a full inventory converts dragon loot to dust while retaining gold, scales, essence and single payment',()=>{
  const s=account();while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');const before=wallet(s);win(s);assert.equal(s.inventory.length,E.GEAR_LIMIT);assert.equal(s.run.lastReward.loot.converted,true);assert.equal(s.dust,before[3]+E.dismantleValue(s.run.lastReward.loot.gear));assert.equal(s.raids.dragon.scales,1);roundtrip(s);
});

test('retreat and defeat after one or two phases pay no scales, chest or dragon missions',()=>{
  for(const stage of [0,1,2])for(const reason of ['retreat','defeat']){const s=reachStage(account(),stage),before=wallet(s);if(reason==='retreat')E.finishRun(s);else{for(const h of s.run.heroes)h.hp=0;E.enemyTurn(s);}assert.deepEqual(wallet(s),before);assert.equal(s.raids.dragon.records[0].clears,0);assert.deepEqual(E.readyRaidMissions(s,DRAGON),[]);roundtrip(s);}
});

test('boss-specific mission claims and claim-all never spend another boss ledger or change a saved run',()=>{
  const s=win(account()),r=structuredClone(s.run),tam=structuredClone(s.raids.records),before=wallet(s);const paid=E.claimAllRaidMissions(s,1,DRAGON);assert.equal(paid.count,3);assert.equal(s.tickets,before[1]+7);assert.deepEqual(s.raids.records,tam);assert.deepEqual(s.run,r);assert.deepEqual(s.raids.dragon.records[0].claimed,['first','swift','united']);assert.equal(E.raidMissionStatus(s,1,'first').ready,true);assert.equal(E.raidMissionStatus(s,1,'first',DRAGON).ready,false);const snapshot=structuredClone(s);assert.throws(()=>E.claimRaidMission(s,1,'first',DRAGON));assert.deepEqual(s,snapshot);roundtrip(s);
});

test('new raid defaults and legacy projection remain independent, rejecting malformed new progress',()=>{
  const a=E.createState(),b=E.createState();a.raids.dragon.records[0].claimed.push('first');assert.deepEqual(b.raids.dragon.records[0].claimed,[]);assert.equal(Object.hasOwn(withoutCombatReport(b),'raids'),false);
  for(const alter of [s=>delete s.raids.dragon,s=>s.raids.dragon.scales=-1,s=>s.raids.dragon.scales=1,s=>s.raids.dragon.records.pop(),s=>s.raids.dragon.records[0].extra=0,s=>s.raids.dragon.records[1]={clears:1,bestRounds:3,fullParty:false,claimed:[]},s=>s.raids.dragon.records[0].claimed=['first']]){const s=E.createState();alter(s);assert.throws(()=>roundtrip(s));}
  const s=E.createState();s.raids.dragon.scales=1;assert.deepEqual(withoutCombatReport(s).raids,s.raids);
});

test('malformed boss tags, protection, rage, rewards and non-raid dragon states are rejected',()=>{
  for(const alter of [s=>s.run.raid.boss='colossus',s=>s.run.raid.boss='',s=>s.run.raid.boss=null,s=>delete s.run.raid.boss,s=>s.run.battle.bossState.parts=null,s=>s.run.battle.enemies[0].bossId='colossus',s=>s.run.battle.enemies[0].hp=0]){const s=reachStage(account(),0);alter(s);assert.throws(()=>roundtrip(s));}
  const rage=reachStage(account(),2);rage.run.battle.bossState.phase=1;assert.throws(()=>roundtrip(rage));
  for(const alter of [s=>s.run.summary.raidReward.scales++,s=>s.run.summary.raidReward.boss='tam-an',s=>s.raids.dragon.records[0].clears=0]){const s=win(account());alter(s);assert.throws(()=>roundtrip(s));}
});

test('forge uses four void scales per SSR piece, exact separate wallet costs and normal evolution',()=>{
  const s=account({scales:12}),marks=structuredClone(s.armory.marks),before=wallet(s);assert.equal(GEAR_SETS.length,5);E.setForgeTarget(s,'set-void-weapon');assert.equal(E.forgeProgress(s).have,12);
  for(const slot of ['weapon','armor','charm']){const id='set-void-'+slot,c=E.forgeCost(id),g=E.forgeGear(s,id);assert.equal(c.raid,true);assert.equal(c.marks,4);assert.equal(g.rarity,'SSR');assert.equal(g.quality,100);assert.equal(GEAR_BASE[g.base].set,'void');E.equipGear(s,g.id,'rook');if(slot==='weapon'){for(let i=0;i<4;i++)E.upgradeGear(s,g.id);E.evolveGear(s,g.id);assert.equal(g.rarity,'UR');assert.equal(GEAR_BASE[g.base].set,'void');}}
  assert.equal(s.raids.dragon.scales,0);assert.equal(s.armory.target,null);assert.deepEqual(s.armory.marks,marks);assert.ok(s.gold<before[0]);assert.equal(E.loadoutEffects(E.gearLoadout(s,'rook')).void,.8);roundtrip(s);
});

test('void forge failures and full storage preserve all resources, target, next ID and inventory',()=>{
  for(const alter of [s=>s.raids.dragon.scales=3,s=>s.gold=0,s=>s.dust=0,s=>{while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');}]){const s=account({scales:12});E.setForgeTarget(s,'set-void-armor');alter(s);const before=structuredClone(s);assert.throws(()=>E.forgeGear(s,'set-void-armor'));assert.deepEqual(s,before);}
});

test('three heroes share marks; the third direct hit bursts for 80 percent ATK with truthful statistics and RNG',()=>{
  const s=account({scales:36});wearVoid(s);E.startHunt(s,'colossus',1,42);const e=sturdy(s),control=structuredClone(s);for(const h of control.run.heroes)h.loadout.sets[0].count=2;
  const events=[];for(const [i,h] of s.run.heroes.entries()){const hit=E.playerAction(s,h.id,e.id)[0];events.push(hit);E.playerAction(control,h.id,e.id);assert.equal(e.voidMarks,(i+1)%3);if(i<2)assert.equal(hit.voidBurst,undefined);else assert.equal(hit.voidBurst,Math.round(h.atk*.8));}
  const burst=Math.round(s.run.heroes[2].atk*.8);assert.equal(control.run.battle.enemies[0].hp-e.hp,burst);assert.equal(s.run.seed,control.run.seed);assert.equal(events.reduce((n,e)=>n+e.value,0),e.maxHp-e.hp);assert.equal(Object.values(s.run.statistics.rows).reduce((n,r)=>n+r.damage,0),e.maxHp-e.hp);roundtrip(s);
});

test('two void pieces cannot add marks and removing the third piece later leaves the active snapshot intact',()=>{
  const s=account({scales:36});wearVoid(s,['rook']);const charm=s.inventory.find(g=>g.base==='set-void-charm');E.unequipGear(s,charm.id);E.startHunt(s,'colossus',1,42);sturdy(s);E.playerAction(s,'rook','enemy0');assert.equal(s.run.battle.enemies[0].voidMarks,undefined);E.finishRun(s);E.equipGear(s,charm.id,'rook');E.startHunt(s,'colossus',1,42);sturdy(s);E.unequipGear(s,charm.id);E.playerAction(s,'rook','enemy0');assert.equal(s.run.battle.enemies[0].voidMarks,1);roundtrip(s);
});

test('void bursts count only actual lost HP, respect shields and stop at death',()=>{
  for(const shield of [0,100000]){const s=account({scales:12});wearVoid(s,['rook']);E.startHunt(s,'colossus',1,42);const e=sturdy(s);e.voidMarks=2;e.shield=shield;e.hp=40;e.def=0;s.run.heroes[0].atk=30;const before=e.hp,hit=E.playerAction(s,'rook',e.id)[0];assert.equal(hit.value,before-e.hp);assert.equal(s.run.statistics.rows.rook.damage,hit.value);assert.equal(e.voidMarks,0);if(shield){assert.equal(hit.value,0);assert.equal(hit.voidBurst,0);assert.ok(hit.voidShield>0);}else{assert.equal(e.hp,0);assert.ok(hit.voidBurst<Math.round(s.run.heroes[0].atk*.8));}roundtrip(s);}
});

test('AoE adds one independent mark on each living enemy and links add one per caster',()=>{
  const s=account({scales:36});s.team=['astra','rook','aerin'];wearVoid(s);E.startHunt(s,'archivist',1,42);sturdy(s);E.enemyTurn(s);for(const e of s.run.battle.enemies)e.hp=e.maxHp=100000;s.run.heroes[0].energy=100;E.playerAction(s,'astra','enemy0',true);assert.deepEqual(s.run.battle.enemies.map(e=>e.voidMarks),[1,1,1]);
  const b=account({scales:36});wearVoid(b);E.startHunt(b,'colossus',1,42);sturdy(b);b.run.link.charge=100;E.linkAction(b,'rook','aerin','enemy0');assert.equal(b.run.battle.enemies[0].voidMarks,2);assert.ok(E.playerAction(b,'lumi','enemy0')[0].voidBurst>0);roundtrip(b);
});

test('burn, pet, reflection and healing do not add void marks or trigger their own explosions',()=>{
  const s=account({scales:36});wearVoid(s);E.startHunt(s,'colossus',1,42);const e=sturdy(s);e.voidMarks=2;e.burn=1;e.burnPower=20;e.burnSource={rook:1};E.enemyTurn(s);assert.equal(e.voidMarks,2);E.petAction(s);assert.equal(e.voidMarks,2);s.run.heroes.find(h=>h.id==='lumi').energy=100;E.playerAction(s,'lumi',e.id,true);assert.equal(e.voidMarks,2);roundtrip(s);
});

test('zero through two marks survive battle and finished-save reload, with malformed values rejected',()=>{
  for(const value of [0,1,2]){const s=account();E.startHunt(s,'colossus',1,42);s.run.battle.enemies[0].voidMarks=value;assert.equal(roundtrip(s).run.battle.enemies[0].voidMarks,value);E.finishRun(s);assert.equal(roundtrip(s).run.battle.enemies[0].voidMarks,value);for(const invalid of [-1,3,1.2,'1',null]){s.run.battle.enemies[0].voidMarks=invalid;assert.throws(()=>roundtrip(s));}}
});

test('boss selector, locked preview, tier claims, void forge and victory UI expose their correct data',()=>{
  const s=account({unlocked:false}),before=structuredClone(s),locked=raidsPage(s,1,DRAGON);assert.match(locked,/Thắng Tam Ấn · Tinh anh/);assert.match(locked,/data-model-id="void-dragon"/);assert.match(locked,/data-action="raid-start" data-boss="void-dragon"/);assert.match(locked,/Rèn bộ Hư Không/);assert.deepEqual(s,before);
  const won=win(account());assert.match(raidResult(won),/Bình minh vượt qua hư không/);assert.match(raidMissionsPanel(won,1,DRAGON),/Hắc Long sơ chiến/);assert.match(raidQuestLink(won),/\/30 phần thưởng/);E.advanceVictory(won);assert.match(victoryPage(won),/Vảy Hư Không/);assert.match(armoryPage(won,'sets','void'),/Vảy Hư Không/);assert.match(forgeDetail(won,'set-void-weapon'),/Vảy Hư Không/);E.setForgeTarget(won,'set-void-armor');assert.match(forgeTargetPanel(won),/data-action="raid-return" data-boss="void-dragon"/);
  const relay=reachStage(account(),1);clearStage(relay);assert.match(raidRelayPage(relay),/Bình minh sau bão/);
});


test('the new set can be tried in a free training clone without granting scales or changing the account',()=>{
  const s=E.createState(),before=structuredClone(s),trial=E.createTrainingState(s,{set:'void',level:20});assert.deepEqual(s,before);assert.equal(trial.raids.dragon.scales,0);assert.ok(trial.run.heroes.every(h=>E.loadoutEffects(h.loadout).void===.8));assert.throws(()=>E.validateState(trial));
});
