import {withoutResultLedger} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/guard-legacy-v1.34.0/engine.mjs';
import {BOSS} from '../js/data.mjs';
import {guardBattle,guardedTurn,incoming,copy} from './timing-guard-helper.mjs';
import {step} from './anomalies-helper.mjs';
import {account as dragonAccount,reachStage} from './void-dragon-helper.mjs';

const atomic=(s,fn)=>{const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);};
const withoutVersion=s=>{const value=withoutResultLedger(s);delete value.version;delete value.achievements;delete value.bonds;delete value.lockedGear;delete value.gearPresets;if(JSON.stringify(value.refining)===JSON.stringify({rolls:0,pending:null}))delete value.refining;if(JSON.stringify(value.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete value.loginRewards;if(JSON.stringify(value.bonds)==='{}')delete value.bonds;if(JSON.stringify(value.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete value.season;return value;};

test('timing uses inclusive fixed windows and rejects invalid, early and late input',()=>{
  assert.deepEqual(E.GUARD_TIMING,{duration:1800,target:1400,window:180,perfect:65});
  for(const [elapsed,grade] of [[0,'miss'],[1219.99,'miss'],[1220,'guard'],[1334.99,'guard'],[1335,'perfect'],[1400,'perfect'],[1465,'perfect'],[1465.01,'guard'],[1580,'guard'],[1580.01,'miss'],[1800,'miss']])assert.equal(E.timingGuardGrade(elapsed),grade,String(elapsed));
  for(const bad of [-1,NaN,Infinity,-Infinity,'1400',null,undefined])assert.equal(E.timingGuardGrade(bad),'miss');
});

for(const [id,def] of Object.entries(BOSS))test(`${id} only offers guard on an imminent damaging special`,()=>{
  for(const move of Object.keys(def.moves)){
    const s=guardBattle(id,move),r=s.run,before=structuredClone(s),threat=E.bossThreat(r),expected=threat?.kind==='attack'&&move!=='strike'&&threat.targets.length>0;
    assert.equal(!!E.timingGuardThreat(r),expected,move);assert.deepEqual(s,before);
    const receipt=E.beginTimingGuard(s);assert.equal(!!receipt,expected,move);
    if(!expected){assert.deepEqual(s,before);continue;}
    assert.equal(r.seed,before.run.seed);assert.deepEqual(r.heroes,before.run.heroes);assert.deepEqual(copy(s),s);
    const events=E.enemyTurn(s,{...receipt,grade:'guard'}),hits=incoming(events);
    assert.ok(hits.length>0,move);assert.ok(hits.every(e=>e.timingGuard?.grade==='guard'),move);assert.equal(E.timingGuardPending(r),false);copy(s);
  }
});

test('frozen, staggered, dead, nonboss and completed encounters never open a timing prompt',()=>{
  for(const mutate of [s=>s.run.battle.enemies[0].freeze=1,s=>{const p=s.run.battle.bossState.parts;p.head.hp=0;p.stun=true;},s=>s.run.battle.enemies[0].hp=0,s=>s.run.phase='result',s=>s.run.battle.bossState=null]){
    const s=guardBattle();mutate(s);const before=structuredClone(s);assert.equal(E.timingGuardThreat(s.run),null);assert.equal(E.beginTimingGuard(s),null);assert.deepEqual(s,before);
  }
  assert.equal(E.beginTimingGuard(E.createState()),null);
});

for(const anomaly of [null,'bloodmoon','frost','mana'])for(const grade of ['guard','perfect'])test(`${grade} halves ${anomaly||'neutral'} boss damage before shields without changing RNG`,()=>{
  const s=guardBattle('colossus','quake',{anomaly,contracts:['ambition']}),plain=structuredClone(s);
  s.run.buffs=['armor'];plain.run.buffs=['armor'];s.run.heroes[0].shield=40;plain.run.heroes[0].shield=40;s.run.heroes[1].energy=94;plain.run.heroes[1].energy=94;
  const old=incoming(E.enemyTurn(plain)),hits=incoming(guardedTurn(s,grade));
  assert.equal(hits.length,3);for(let i=0;i<3;i++){
    const oldRaw=old[i].value+old[i].shield,reduced=Math.round(oldRaw*.5),h=s.run.heroes[i];
    assert.equal(hits[i].value+hits[i].shield,reduced);assert.equal(hits[i].timingGuard.prevented,oldRaw-reduced);
    assert.equal(h.hp,900-hits[i].value);assert.equal(h.shield,i===0?Math.max(0,40-reduced):0);
    assert.equal(h.energy,grade==='perfect'?(i===1?100:35):(i===1?94:20));
  }
  assert.equal(s.run.seed,plain.run.seed);copy(s);
});

test('perfect energy is paid once to surviving struck targets, after frost energy drain and capped at 100',()=>{
  for(const energy of [0,20,100]){
    const s=guardBattle('frostqueen','signature');s.run.heroes[0].energy=energy;
    const hits=incoming(guardedTurn(s));assert.equal(hits.length,1);assert.equal(s.run.heroes[0].energy,Math.max(0,energy-30)+15);assert.equal(hits[0].timingGuard.energy,15);assert.equal(s.run.heroes[1].energy,20);
  }
  const s=guardBattle('groveheart','signature');s.run.heroes[0].hp=0;s.run.heroes[1].energy=99;
  const hits=incoming(guardedTurn(s));assert.equal(hits.length,2);assert.equal(s.run.heroes[0].energy,20);assert.deepEqual(hits.map(e=>e.timingGuard.energy),[1,15]);copy(s);
});

test('a lethal guarded hit gives no energy unless the lantern revives its target',()=>{
  for(const revive of [false,true]){
    const s=guardBattle('cinderwyrm','signature'),victim=s.run.heroes.find(h=>h.id===E.timingGuardThreat(s.run).targets[0]);victim.hp=1;if(revive)s.run.relics=['lantern'];
    const events=guardedTurn(s),hit=incoming(events)[0];assert.equal(hit.value,1);assert.equal(hit.timingGuard.energy,revive?15:0);assert.equal(victim.energy,revive?35:20);assert.equal(victim.hp,revive?300:0);copy(s);
  }
});

test('guarded siphon heals the boss from actual HP lost after guard and shield, including bloodmoon',()=>{
  for(const anomaly of [null,'bloodmoon']){
    const s=guardBattle('ashknight','siphon',{anomaly});s.run.battle.enemies[0].hp=700000;s.run.heroes[1].shield=20;
    const events=guardedTurn(s),hit=incoming(events)[0];assert.equal(hit.target,'aerin');assert.equal(hit.covered,false);assert.equal(hit.piercing,true);
    assert.equal(s.run.battle.enemies[0].hp,700000+Math.round(hit.value*.5*(anomaly?.75:1)));copy(s);
  }
});

test('minions, reflection and stored shields do not inherit the timing reduction',()=>{
  const s=guardBattle('archivist','volley'),r=s.run,e=r.battle.enemies[0];
  r.battle.enemies.push({...structuredClone(e),id:'enemy1',kind:'wraith',bossId:undefined,name:'Bóng hầu',intent:2});
  const plain=structuredClone(s),events=guardedTurn(s),old=incoming(E.enemyTurn(plain)),hits=incoming(events);
  assert.equal(hits.length,4);assert.ok(hits.slice(0,3).every(e=>e.timingGuard));assert.equal(hits[3].timingGuard,undefined);assert.equal(hits[3].value,old[3].value);assert.equal(r.seed,plain.run.seed);copy(s);
  const mirror=guardBattle();mirror.run.relics=['mirror'];mirror.run.heroes[0].shield=1;
  const mirrored=guardedTurn(mirror);assert.ok(mirrored.some(e=>e.target==='enemy0'&&!e.timingGuard));copy(mirror);
});

test('a boss killed by burn never pays perfect energy or duplicates victory rewards',()=>{
  const s=guardBattle(),e=s.run.battle.enemies[0];e.hp=1;e.burn=1;e.burnPower=100;
  const events=guardedTurn(s);assert.equal(incoming(events).length,0);assert.ok(s.run.heroes.every(h=>h.energy===20));assert.ok(E.victoryPending(s.run));const paid=structuredClone(s);copy(s);atomic(s,()=>guardedTurn(s));assert.deepEqual(s,paid);
});

test('burn that changes the advertised move does not guard a different attack',()=>{
  const s=guardBattle('ashknight','cleave'),e=s.run.battle.enemies[0];e.hp=500010;e.burn=1;e.burnPower=100;
  const events=guardedTurn(s);assert.equal(s.run.battle.bossState.phase,2);assert.equal(s.run.battle.bossState.move,'strike');assert.ok(incoming(events).every(e=>!e.timingGuard));copy(s);
});

test('queue creation, duplicate input and invalid receipts reject atomically without costs or RNG',()=>{
  const s=guardBattle(),receipt=E.beginTimingGuard(s),pending=structuredClone(s);
  for(const result of [{...receipt,grade:'great'},{...receipt,grade:'perfect',extra:1},{...receipt,round:2,grade:'perfect'},{...receipt,boss:'ashknight',grade:'perfect'},'perfect',{},false])atomic(s,()=>E.enemyTurn(s,result));
  atomic(s,()=>E.beginTimingGuard(s));atomic(s,()=>E.playerAction(s,'rook','enemy0',true));atomic(s,()=>E.selectBossPart(s,'arms'));
  s.run.link.charge=100;atomic(s,()=>E.linkAction(s,'rook','aerin','enemy0'));s.run.pet={id:'mossling',level:1,nextRound:1};atomic(s,()=>E.petAction(s));
  assert.equal(s.run.seed,pending.run.seed);const result={...receipt,grade:'perfect'};E.enemyTurn(s,result);const committed=structuredClone(s);atomic(s,()=>E.enemyTurn(s,result));assert.deepEqual(s,committed);
  const fresh=guardBattle();atomic(fresh,()=>E.enemyTurn(fresh,result));
});

test('pending turns round-trip and resuming without input exactly matches an ordinary enemy turn',()=>{
  const s=guardBattle(),plain=structuredClone(s);E.beginTimingGuard(s);let resumed=copy(s);const frozen=structuredClone(s);
  assert.deepEqual(resumed,s);assert.deepEqual(s,frozen);assert.deepEqual(E.enemyTurn(resumed),E.enemyTurn(plain));assert.deepEqual(resumed,plain);assert.equal(E.timingGuardPending(resumed.run),false);resumed=copy(resumed);assert.deepEqual(resumed,plain);
  const miss=guardBattle(),old=structuredClone(miss);assert.deepEqual(guardedTurn(miss,'miss'),E.enemyTurn(old));assert.deepEqual(miss,old);
});

test('saved pending records reject tampering, wrong phases, old versions and saved outcomes',()=>{
  const good=guardBattle();E.beginTimingGuard(good);
  for(const mutate of [s=>s.run.battle.timingGuard=null,s=>s.run.battle.timingGuard=[],s=>s.run.battle.timingGuard.rules=2,s=>s.run.battle.timingGuard.round='1',s=>s.run.battle.timingGuard.round++,s=>delete s.run.battle.timingGuard.move,s=>s.run.battle.timingGuard.grade='perfect',s=>s.run.battle.timingGuard.move='strike',s=>s.run.battle.enemies[0].freeze=1,s=>s.run.phase='blessing',s=>s.version=24]){
    const bad=structuredClone(good);mutate(bad);assert.throws(()=>copy(bad));
  }
  const source=Old.createState();Old.startHunt(source,'colossus',1,42);const frozen=structuredClone(source),migrated=copy(source);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(withoutVersion(migrated),withoutVersion(source));assert.deepEqual(source,frozen);
});

test('raid stages and practice use the same real guard calculation without changing account rewards',()=>{
  for(const stage of [0,1,2]){
    const s=dragonAccount();reachStage(s,stage);s.run.battle.bossState.move='quake';const before=s.raids.dragon.scales,events=guardedTurn(s);assert.ok(events.some(e=>e.timingGuard));assert.equal(s.raids.dragon.scales,before);copy(s);
  }
  const source=E.createState(),before=structuredClone(source),practice=E.createTrainingState(source);practice.run.battle.bossState.move='quake';const events=guardedTurn(practice);assert.equal(practice.run.training.received,incoming(events).reduce((n,e)=>n+e.value,0));assert.deepEqual(source,before);assert.equal(E.timingGuardPending(practice.run),false);
});

test('old and new journeys with no timing input match the released 1.34 engine at every action',()=>{
  for(const seed of [1,42,123456]){
    const old=Old.createState();for(const h of Object.values(old.owned))h.level=8;Old.startRun(old,seed);let s=copy(old),actions=0;
    while(old.run.phase!=='result'&&old.run.floor<=15&&actions++<1600){assert.equal(step(E,s),step(Old,old));assert.deepEqual(withoutVersion(s),withoutVersion(old));s=copy(s);}
    assert.ok(actions<1600);
  }
});
