import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES,HERO} from '../js/data.mjs';
import {DUNGEON} from '../js/adventure-data.mjs';
import {talentSummary,talentDetail,talentResetDialog} from '../js/talents-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function account(level=50){const s=E.createState();s.gold=100000000;for(const h of HEROES)s.owned[h.id]={level,copies:0,awaken:0};return s;}
function learn(s,id,nodes){for(const node of E.TALENT_NODES)for(let n=0;n<(nodes[node.id]||0);n++)E.learnTalent(s,id,node.id);}
function battle(id='rook',nodes={},seed=42){
  const s=account();s.team=[id,...['rook','aerin','lumi'].filter(a=>a!==id)].slice(0,3);learn(s,id,nodes);E.startHunt(s,'colossus',1,seed);
  const e=s.run.battle.enemies[0];e.hp=e.maxHp=100000;e.def=0;s.run.battle.bossState.parts=E.createBossParts(e);s.run.heroes[0].energy=100;return s;
}

test('every level from two awards one derived point, separately for each hero and without spending gold',()=>{
  const s=E.createState();assert.equal(E.talentStatus(s,'rook').available,0);const gold=s.gold,cost=E.upgradeCost(s,'rook');E.upgradeHero(s,'rook');assert.equal(s.gold,gold-cost);assert.equal(E.talentStatus(s,'rook').available,1);assert.equal(E.talentStatus(s,'lumi').available,0);
  const before=s.gold;E.learnTalent(s,'rook','force');assert.equal(s.gold,before);assert.equal(E.talentStatus(s,'rook').available,0);assert.equal(E.talentStatus(s,'rook').spent,1);assert.equal(E.talentStatus(copy(s),'rook').available,0);
  for(let level=1;level<=100;level++){s.owned.lumi.level=level;assert.equal(E.talentStatus(s,'lumi').total,level-1);}s.owned.lumi.level=100;assert.equal(E.talentStatus(s,'lumi').total,99);copy(s);
});

test('three branches can be mixed with rank, point, level and previous-node gates',()=>{
  const s=account(50);for(const id of ['force','vitality','tempo'])E.learnTalent(s,'rook',id);assert.equal(E.talentStatus(s,'rook').available,46);
  const before=structuredClone(s);assert.throws(()=>E.learnTalent(s,'rook','pierce'),/Vũ lực/);assert.deepEqual(s,before);
  E.learnTalent(s,'rook','force');E.learnTalent(s,'rook','force');E.learnTalent(s,'rook','pierce');assert.equal(E.talentStatus(s,'rook').spent,8);
  const low=account(9);learn(low,'rook',{force:3});assert.throws(()=>E.learnTalent(low,'rook','pierce'),/cấp 10/);
  const mid=account(19);learn(mid,'rook',{force:3,pierce:3});assert.throws(()=>E.learnTalent(mid,'rook','precision'),/cấp 20/);
  const poor=account(10);learn(poor,'rook',{force:5,pierce:1});assert.equal(E.talentStatus(poor,'rook').available,1);assert.throws(()=>E.learnTalent(poor,'rook','pierce'),/Cần 3 điểm/);copy(s);
});

test('capped and invalid learns are atomic and cannot use unknown heroes or inherited node ids',()=>{
  const s=account(10);learn(s,'rook',{force:5});for(const [id,node] of [['rook','force'],['rook','invalid'],['rook','constructor'],['rook','__proto__'],['toString','force'],['unknown','force']]){const before=structuredClone(s);assert.throws(()=>E.learnTalent(s,id,node));assert.deepEqual(s,before);}
  const unowned=E.createState(),before=structuredClone(unowned);assert.throws(()=>E.learnTalent(unowned,'aion','force'));assert.deepEqual(unowned,before);
});

test('all twenty heroes can learn the full mixed build and keep it through an actual skill and reload',()=>{
  const mixed=Object.fromEntries(E.TALENT_NODES.map(n=>[n.id,3]));
  for(const hero of HEROES){const s=account(100);s.team=[hero.id,...['rook','aerin','lumi'].filter(id=>id!==hero.id)].slice(0,3);learn(s,hero.id,mixed);assert.equal(E.talentStatus(s,hero.id).spent,81);assert.equal(E.talentStatus(s,hero.id).available,18);E.startHunt(s,'colossus',1,42);const r=s.run,e=r.battle.enemies[0];e.hp=e.maxHp=100000;r.battle.bossState.parts=E.createBossParts(e);for(const h of r.heroes)h.hp=1;r.heroes[0].energy=100;E.playerAction(s,hero.id,e.id,true,'core');assert.deepEqual(copy(s).run.heroes[0].talents.nodes,mixed,hero.id);}
});

test('stat talents combine with gear and awakening while ordinary heroes retain their exact stats',()=>{
  const s=account();E.equipGear(s,'gear-1','rook');s.owned.rook.awaken=3;const before=E.heroStats(s,'rook'),other=E.heroStats(s,'lumi');learn(s,'rook',{force:5,vitality:5,iron:5});const next=E.heroStats(s,'rook');assert.equal(next.atk,Math.round(before.atk*1.1));assert.equal(next.maxHp,Math.round(before.maxHp*1.15));assert.equal(next.def,before.def+5);assert.deepEqual(E.heroStats(s,'lumi'),other);copy(s);
});

test('direct damage talents affect both attacks and skills without boosting burn damage a second time',()=>{
  for(const skill of [false,true]){const a=battle('ember',{force:3}),b=battle('ember',{force:3,pierce:5});const hitA=E.playerAction(a,'ember','enemy0',skill)[0],hitB=E.playerAction(b,'ember','enemy0',skill)[0];assert.equal(hitB.crit,hitA.crit);assert.ok(hitB.value>hitA.value);assert.ok(Math.abs(hitB.value-hitA.value*1.1)<=1);if(skill)assert.equal(b.run.battle.enemies[0].burnPower,a.run.battle.enemies[0].burnPower);copy(b);}
});

test('precision produces extra critical hits with the same seeds and preserves the existing eighty percent cap',()=>{
  let extra=0;
  for(let i=1;i<=100;i++){const a=battle('rook',{force:3,pierce:3},i*7919),b=battle('rook',{force:3,pierce:3,precision:5},i*7919),c=structuredClone(a),d=structuredClone(b);const x=E.playerAction(a,'rook','enemy0')[0],y=E.playerAction(b,'rook','enemy0')[0];if(x.crit)assert.equal(y.crit,true);if(y.crit&&!x.crit)extra++;c.run.buffs=d.run.buffs=Array(8).fill('crit');assert.equal(E.playerAction(c,'rook','enemy0')[0].crit,E.playerAction(d,'rook','enemy0')[0].crit);}
  assert.ok(extra>0,'precision changes real critical outcomes');
});

test('defensive mitigation reduces both HP loss and shield consumption before absorption',()=>{
  const a=battle('rook',{vitality:3,iron:3}),b=battle('rook',{vitality:3,iron:3,resolve:5});for(const s of [a,b]){s.run.battle.enemies[0].intent=0;s.run.battle.enemies[0].atk=200;s.run.heroes[0].shield=1000;}
  const x=E.enemyTurn(a)[0],y=E.enemyTurn(b)[0];assert.equal(x.target,'rook');assert.equal(y.target,'rook');assert.equal(x.value,0);assert.equal(y.value,0);assert.ok(y.shield<x.shield);assert.ok(Math.abs(y.shield-x.shield*.9)<=1);copy(b);
  for(const s of [a,b]){s.run.battle.bossState.move='strike';s.run.battle.enemies[0].intent=0;s.run.heroes[0].shield=0;}const x2=E.enemyTurn(a)[0],y2=E.enemyTurn(b)[0];assert.ok(y2.value<x2.value);copy(b);
});

test('support opening energy is hero-specific, awarded once per journey and capped by ordinary battle rules',()=>{
  const s=account();learn(s,'rook',{tempo:5});E.startRun(s,42);assert.deepEqual(s.run.heroes.map(h=>h.energy),[80,65,65]);E.chooseRoute(s,0);assert.deepEqual(s.run.heroes.map(h=>h.energy),[100,90,90]);const saved=copy(s);assert.deepEqual(saved.run.heroes.map(h=>h.energy),s.run.heroes.map(h=>h.energy));
});

test('nurture amplifies caster healing and shielding including awakening and equipped signatures',()=>{
  for(const id of ['lumi','rook']){const a=battle(id,{tempo:3}),b=battle(id,{tempo:3,nurture:5});for(const s of [a,b]){s.run.heroes[0].awaken=1;for(const h of s.run.heroes)h.hp=1;}const x=E.playerAction(a,id,'enemy0',true),y=E.playerAction(b,id,'enemy0',true);
    if(id==='lumi'){for(let i=0;i<x.length;i++)assert.equal(y[i].value,Math.round(x[i].value*1.2));}
    else {assert.equal(b.run.heroes[1].shield,Math.round(a.run.heroes[1].shield*1.2));assert.ok(b.run.heroes[0].hp>a.run.heroes[0].hp);}copy(b);
  }
  // Rook's signature shield is generated independently of the main skill's shield.
  const c=battle('rook',{tempo:3}),d=battle('rook',{tempo:3,nurture:5});for(const s of [c,d]){s.armory.marks.colossus=8;const gear=E.forgeGear(s,'signature-rook');E.equipGear(s,gear.id,'rook');s.run.heroes[0].loadout=E.gearLoadout(s,'rook');}E.playerAction(c,'rook','enemy0',true);E.playerAction(d,'rook','enemy0',true);assert.ok(Math.abs(d.run.heroes[1].shield-c.run.heroes[1].shield*1.2)<=2);copy(d);
});

test('inspire gives energy only to other living allies once after a skill and never on a normal attack',()=>{
  const s=battle('rook',{tempo:3,nurture:3,inspire:5});s.run.heroes[0].awaken=0;s.run.heroes[1].energy=96;s.run.heroes[2].hp=0;s.run.heroes[2].energy=2;E.playerAction(s,'rook','enemy0',true);assert.deepEqual(s.run.heroes.map(h=>h.energy),[0,100,2]);assert.equal(s.run.heroes[2].hp,0);copy(s);
  const normal=battle('rook',{tempo:3,nurture:3,inspire:5});normal.run.heroes[1].energy=0;E.playerAction(normal,'rook','enemy0');assert.equal(normal.run.heroes[1].energy,0);
});

test('pet support and rest healing do not inherit a hero nurture multiplier',()=>{
  const a=battle('rook',{tempo:3}),b=battle('rook',{tempo:3,nurture:5});for(const s of [a,b]){for(const h of s.run.heroes)h.hp=1;}E.petAction(a);E.petAction(b);assert.deepEqual(b.run.heroes.map(h=>h.shield),a.run.heroes.map(h=>h.shield));
  for(const s of [a,b]){E.finishRun(s);E.startRun(s,42);for(const h of s.run.heroes)h.hp=1;s.run.map=null;s.run.routes=['rest'];E.chooseRoute(s,0);}assert.deepEqual(b.run.heroes.map(h=>h.hp),a.run.heroes.map(h=>h.hp));copy(b);
});

test('respec refunds exactly the spent points and charges gold once without changing a live journey',()=>{
  const s=battle('rook',{force:5,pierce:5,precision:5}),run=structuredClone(s.run),gold=s.gold;assert.equal(E.talentResetCost(s,'rook'),600);assert.deepEqual(E.resetTalents(s,'rook'),{points:45,gold:600});assert.equal(s.gold,gold-600);assert.equal(E.talentStatus(s,'rook').available,49);assert.deepEqual(s.run,run);assert.deepEqual(copy(s).run,run);
  const before=structuredClone(s);assert.throws(()=>E.resetTalents(s,'rook'));assert.deepEqual(s,before);E.learnTalent(s,'rook','vitality');assert.deepEqual(s.run,run);E.finishRun(s);E.startRun(s,55);assert.deepEqual(s.run.heroes[0].talents.nodes,{vitality:1});
});

test('insufficient gold and invalid respec requests preserve every resource and allocation',()=>{
  const s=account();learn(s,'rook',{force:3});s.gold=179;for(const id of ['rook','unknown','constructor']){const before=structuredClone(s);assert.throws(()=>E.resetTalents(s,id));assert.deepEqual(s,before);}assert.equal(E.talentResetCost(s,'lumi'),0);copy(s);
});

test('every real game mode snapshots talents and later upgrades or reallocations cannot rewrite that snapshot',()=>{
  const starters=[s=>E.startRun(s,42),s=>E.startHunt(s,'colossus',1,42),...Object.keys(DUNGEON).map(id=>s=>E.startDungeon(s,id,1,new Date('2026-10-21T12:00:00'),42)),s=>E.startCampaign(s,1,42),s=>E.startChallenge(s,'iron',new Date('2026-10-21T12:00:00')),s=>E.startChallenge(s,'gauntlet',new Date('2026-10-21T12:00:00'))];
  for(const start of starters){const s=account();learn(s,'rook',{force:3,tempo:3});start(s);const run=structuredClone(s.run);E.upgradeHero(s,'rook');E.learnTalent(s,'rook','force');E.resetTalents(s,'rook');assert.deepEqual(s.run,run);assert.deepEqual(copy(s).run,run);}
});

test('migration credits existing levels and preserves live HP, turns, boss armor, pet and economy exactly once',()=>{
  for(const phase of ['route','battle','story','result']){const s=account(57);if(phase==='story')E.startCampaign(s,1,42);else {E.startHunt(s,'colossus',1,42);if(phase==='route'){E.finishRun(s);E.startRun(s,42);}else if(phase==='result')E.finishRun(s);else E.playerAction(s,'rook','enemy0',false,'arms');}
    s.run.map=null;s.version=9;delete s.talents;for(const h of s.run.heroes)delete h.talents;const before=structuredClone(s),expected=structuredClone(s.run);expected.link=E.starterLink();expected.formation=null;for(const h of expected.heroes)h.talents=null;const migrated=copy(s);assert.deepEqual(s,before);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(withoutCombatReport(migrated.run),withoutCombatReport(expected));assert.equal(migrated.gold,s.gold);assert.equal(migrated.totalSummons,s.totalSummons);assert.deepEqual(migrated.owned,s.owned);assert.equal(E.talentStatus(migrated,'rook').available,56);assert.deepEqual(copy(migrated),migrated);
  }
});

test('imports reject missing, overspent, invalid and impossible prerequisite allocations atomically',()=>{
  const s=battle('rook',{force:3,pierce:3});const edits=[x=>delete x.talents,x=>x.talents=[],x=>x.talents={unknown:{force:1}},x=>x.talents.rook={force:6},x=>x.talents.rook={force:0},x=>x.talents.rook={force:1.5},x=>x.talents.rook={precision:1},x=>x.talents.rook={force:3,pierce:3,precision:5,vitality:5,iron:5,resolve:5},x=>x.talents.rook=JSON.parse('{"constructor":1}'),x=>x.talents.rook={nope:1},x=>x.owned.rook.level=2,x=>delete x.run.heroes[0].talents,x=>x.run.heroes[0].talents={level:101,nodes:{}},x=>x.run.heroes[0].talents={level:9,nodes:{force:3,pierce:1}},x=>x.run.heroes[0].talents.nodes={resolve:1},x=>x.run.heroes[0].talents.extra=1];
  for(const edit of edits){const raw=structuredClone(s);edit(raw);const before=structuredClone(raw);assert.throws(()=>copy(raw));assert.deepEqual(raw,before);}const low=E.createState();low.talents={aion:{force:1}};assert.throws(()=>copy(low));copy(s);
});

test('training clears account talents and blocks learn/respec without changing real progress',()=>{
  const source=battle('rook',{force:3,pierce:3,tempo:3,nurture:3}),before=structuredClone(source),training=E.createTrainingState(source,{team:['aion','rook','lumi'],level:20});assert.deepEqual(training.talents,{});assert.ok(training.run.heroes.every(h=>Object.keys(h.talents.nodes).length===0));const snapshot=structuredClone(training);assert.throws(()=>E.learnTalent(training,'rook','force'),/phòng thử/);assert.throws(()=>E.resetTalents(training,'rook'),/phòng thử/);assert.deepEqual(training,snapshot);assert.deepEqual(source,before);
});

test('talent markup explains all nine nodes, accessible ranks, blockers, reset price and pending run behavior',()=>{
  const s=account(20);learn(s,'rook',{force:3,pierce:3});E.startRun(s,42);const html=talentDetail(s,'rook');assert.equal((html.match(/data-action="talent-learn"/g)||[]).length,9);assert.equal((html.match(/role="meter"/g)||[]).length,9);for(const n of E.TALENT_NODES)assert.ok(html.includes(n.name));assert.match(html,/Cần Nuôi dưỡng/);assert.match(html,/Chuyến đang chơi giữ thiên phú/);assert.match(talentSummary(s,'rook'),/7 điểm chưa dùng/);assert.match(talentResetDialog(s,'rook'),/270 vàng/);assert.match(talentResetDialog(s,'rook'),/12 điểm thiên phú/);assert.equal(talentSummary(E.createState(),'aion'),'');
});
