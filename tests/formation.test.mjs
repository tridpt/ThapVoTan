import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HERO} from '../js/data.mjs';
import {formationPanel,formationBattleStatus,formationBadge,enemyFormationIntent} from '../js/formation-ui.mjs';
const copy=s=>E.validateState(structuredClone(s));
function battle(front=1,boss='colossus'){
  const s=E.createState();E.setFormation(s,front);E.startHunt(s,boss,1,42);
  for(const h of s.run.heroes){h.hp=h.maxHp=10000;h.shield=0;h.def=0;}return s;
}
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}

test('formation layouts and cross-row swaps change only arrangement, persist, and block during every active phase',()=>{
  const s=E.createState(),before=structuredClone(s);E.setFormation(s,2);E.swapFormationSlots(s,0,2);assert.deepEqual(s.team,['lumi','aerin','rook']);
  for(const k of Object.keys(before).filter(k=>!['team','formation'].includes(k)))assert.deepEqual(s[k],before[k]);assert.deepEqual(copy(s),s);
  for(const n of [0,3,'1',NaN,1.5])atomic(s,()=>E.setFormation(s,n));for(const pair of [[0,0],[-1,1],[0,3],['0',2]])atomic(s,()=>E.swapFormationSlots(s,...pair));
  E.startRun(s,42);for(const phase of ['route','battle','blessing','relic','event','story']){s.run.phase=phase;atomic(s,()=>E.setFormation(s,1));atomic(s,()=>E.swapFormationSlots(s,0,1));}
  E.finishRun(s);E.setFormation(s,1);assert.deepEqual(s.run.formation,{front:2});
});

test('normal single attacks prefer living front rows; fallen fronts expose the back without reordering',()=>{
  for(const front of [1,2]){const s=battle(front),r=s.run,e=r.battle.enemies[0],ids=r.heroes.map(h=>h.id);
    for(let intent=0;intent<3;intent++){e.intent=intent;assert.equal(E.heroRow(r,E.formationTarget(r,e).id),'front');}
    r.heroes[0].hp=0;assert.equal(E.formationTarget(r,e).id,front===2?'aerin':ids[1]);r.heroes[1].hp=0;assert.equal(E.formationTarget(r,e).id,'lumi');
    assert.deepEqual(r.heroes.map(h=>h.id),ids);
  }
});

test('AOE reduces rear damage by 15 percent before shields while front damage and outgoing attacks stay unchanged',()=>{
  const s=battle(),r=s.run,e=r.battle.enemies[0];e.atk=100;r.battle.bossState.move='quake';r.heroes[2].shield=20;
  const events=E.enemyTurn(s).filter(e=>r.heroes.some(h=>h.id===e.target)&&!e.heal);
  assert.equal(events[0].value,135);assert.equal(events[0].covered,false);assert.equal(events[1].value,115);assert.equal(events[1].covered,true);assert.equal(events[2].value,95);assert.equal(events[2].shield,20);
  const a=battle(1),b=battle(2);assert.deepEqual(E.playerAction(a,'rook','enemy0'),E.playerAction(b,'rook','enemy0'));
});

test('cover disappears during an AOE if the last front falls, and returns when the front is revived',()=>{
  const s=battle(),r=s.run;r.battle.enemies[0].atk=100;r.battle.bossState.move='quake';r.heroes[0].hp=1;
  const events=E.enemyTurn(s);assert.equal(events.find(e=>e.target==='aerin').value,135);assert.equal(E.coverMultiplier(r,r.heroes[1]),1);
  r.heroes[2].energy=100;E.playerAction(s,'lumi','enemy0',true);assert.ok(r.heroes[0].hp>0);assert.equal(E.coverMultiplier(r,r.heroes[1]),.85);copy(s);
});

test('ordinary wraith piercing is announced, targets a living rear and bypasses cover',()=>{
  const s=E.createState();E.startRun(s,42);delete s.run.anomalyRules;delete s.run.anomalyOrder;E.chooseRoute(s,0);const r=s.run,e=r.battle.enemies[1];
  for(const h of r.heroes){h.hp=h.maxHp=10000;h.def=0;h.shield=0;}r.battle.enemies[0].hp=0;e.intent=2;e.atk=100;
  assert.equal(E.enemyPierces(r,e),true);const victim=E.formationTarget(r,e);assert.equal(E.heroRow(r,victim.id),'back');assert.match(enemyFormationIntent(r,e),new RegExp('Xuyên hàng → '+HERO[victim.id].name));
  const hit=E.enemyTurn(s).find(hit=>hit.target===victim.id);assert.equal(hit.value,100);assert.equal(hit.covered,false);assert.equal(hit.piercing,true);
  e.intent=0;assert.equal(E.enemyPierces(r,e),false);assert.equal(E.formationTarget(r,e).id,'rook');
});

test('ash knight siphon telegraphs the rear target and heals from the actual unprotected HP loss',()=>{
  const s=battle(2,'ashknight'),r=s.run,e=r.battle.enemies[0];e.hp=Math.round(e.maxHp*.7);e.atk=100;e.intent=1;r.battle.bossState.move='siphon';
  assert.deepEqual(E.bossThreat(r).targets,['lumi']);assert.match(E.bossThreat(r).label,/Xuyên hàng/);const before=e.hp,hit=E.enemyTurn(s)[0];assert.equal(hit.target,'lumi');assert.equal(hit.covered,false);assert.equal(e.hp-before,Math.round(hit.value*.5));
});

test('cinderwyrm signature pierces the rear while its normal strike still chooses the front',()=>{
  const s=E.createState();E.startDungeon(s,'fire',1,new Date(),42);Object.assign(s.run,{floor:3,cleared:2,routes:['boss']});E.chooseRoute(s,0);
  const r=s.run,e=r.battle.enemies[0];for(const h of r.heroes){h.hp=h.maxHp=10000;h.def=0;}r.battle.bossState.move='signature';
  const target=E.formationTarget(r,e).id;assert.ok(E.enemyPierces(r,e));assert.deepEqual(E.bossThreat(r).targets,[target]);assert.equal(E.enemyTurn(s)[0].target,target);
  r.battle.bossState.move='strike';assert.equal(E.formationTarget(r,e).id,'rook');
});

test('a piercing attacker falls back to the front when no rear lives, and frozen enemies never attack',()=>{
  const s=battle(1,'ashknight'),r=s.run,e=r.battle.enemies[0];r.battle.bossState.move='siphon';r.heroes[1].hp=r.heroes[2].hp=0;
  assert.deepEqual(E.bossThreat(r).targets,['rook']);e.freeze=1;assert.deepEqual(E.bossThreat(r).targets,[]);assert.equal(E.enemyTurn(s).filter(e=>!e.heal).length,0);copy(s);
});

test('all three presets clone and restore row layout independently of the current formation',()=>{
  const s=E.createState();E.saveTeamPreset(s,0);E.setFormation(s,2);E.swapFormationSlots(s,0,2);const p=E.saveTeamPreset(s,1);p.formation.front=1;
  assert.equal(s.presets[1].formation.front,2);E.applyTeamPreset(s,0);assert.deepEqual(s.team,['rook','aerin','lumi']);assert.equal(s.formation.front,1);
  E.applyTeamPreset(s,1);assert.deepEqual(s.team,['lumi','aerin','rook']);assert.equal(s.formation.front,2);s.formation.front=1;assert.equal(s.presets[1].formation.front,2);copy(s);
});

test('new journeys snapshot formations across tower, trials, campaign, hunts and all dungeons',()=>{
  const starts=[s=>E.startRun(s,42),s=>E.startChallenge(s,'iron'),s=>E.startCampaign(s,1,42),s=>E.startHunt(s,'colossus',1,42),...['earth','wind','light','fire','shadow','ice','thunder'].map(id=>s=>E.startDungeon(s,id,1,new Date(),42))];
  for(const start of starts){const s=E.createState();E.setFormation(s,2);start(s);assert.deepEqual(s.run.formation,{front:2});assert.notEqual(s.run.formation,s.formation);copy(s);}
});

test('training supports either row layout without changing the live run, presets or account',()=>{
  const s=battle(1),before=structuredClone(s),practice=E.createTrainingState(s,{formation:{front:2}});
  assert.deepEqual(practice.run.formation,{front:2});assert.deepEqual(s,before);practice.run.formation.front=1;assert.equal(s.run.formation.front,1);assert.equal(practice.formation.front,2);
  atomic(s,()=>E.createTrainingState(s,{formation:{front:3}}));
});

test('v11 migration adds account and preset rows but preserves every old run as a legacy snapshot',()=>{
  for(const phase of ['route','battle','blessing','relic','event','story','result']){
    const s=battle(2);s.run.mode='normal';s.run.hunt=null;E.saveTeamPreset(s,0);s.run.phase=phase;
    if(phase==='blessing')s.run.choices=['might','armor','energy'];if(phase==='relic')s.run.relicChoices=['lantern'];if(phase==='story'){E.finishRun(s);E.startCampaign(s,1,42);}if(phase==='result'){s.run.phase='battle';E.finishRun(s);}
    s.version=11;delete s.formation;delete s.run.formation;delete s.presets[0].formation;delete s.presets[0].gear;const before=structuredClone(s),expected=structuredClone(s);
    expected.version=E.SAVE_VERSION;expected.formation={front:1};expected.presets[0].formation={front:1};expected.presets[0].gear=null;expected.run.formation=null;
    const migrated=copy(s);assert.deepEqual(withoutCombatReport(migrated),withoutCombatReport(expected));assert.deepEqual(s,before);assert.deepEqual(copy(migrated),migrated);
  }
});

test('legacy battles retain their old intent targets, damage and flat 3D positions until a new run',()=>{
  const s=battle(2,'ashknight');s.run.formation=null;const r=s.run,e=r.battle.enemies[0];e.intent=1;e.atk=100;r.battle.bossState.move='siphon';
  assert.equal(E.enemyPierces(r,e),false);assert.deepEqual(E.bossThreat(r).targets,['aerin']);assert.equal(E.enemyTurn(s)[0].value,100);assert.deepEqual(E.formationPosition(r,0),{x:-3.4,z:3.45});
  E.finishRun(s);E.startRun(s,42);assert.deepEqual(s.run.formation,{front:2});copy(s);
});

test('invalid imported account, run and preset formations reject atomically',()=>{
  const s=battle();E.saveTeamPreset(s,0);
  for(const field of ['formation','run','preset'])for(const bad of [undefined,null,[],{},0,{front:0},{front:3},{front:1.5},{front:'1'},{front:1,extra:true}]){
    if(field==='run'&&bad===null)continue;const data=structuredClone(s);if(field==='formation')data.formation=bad;else if(field==='run')data.run.formation=bad;else data.presets[0].formation=bad;
    const before=structuredClone(data);assert.throws(()=>copy(data));assert.deepEqual(data,before);
  }
});

test('row UI shows actual members, locked controls, rear cover, enemy intent and legacy rules without mutations',()=>{
  const s=battle(2),before=structuredClone(s);assert.match(formationPanel(s),/2 trước · 1 sau/);assert.match(formationPanel(s),/data-action="formation-layout"[^>]+disabled/);
  assert.match(formationBadge(s.run,s.run.heroes[2]),/SAU · −15%/);assert.match(formationBattleStatus(s.run),/2 trước · 1 sau/);s.run.formation=null;assert.match(formationBattleStatus(s.run),/Chuyến cũ/);s.run.formation=before.run.formation;assert.deepEqual(s,before);
});
