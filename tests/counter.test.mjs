import {withoutResultLedger} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/counter-legacy-v1.35.0/engine.mjs';
import {BOSS} from '../js/data.mjs';
import {guardBattle,guardedTurn,copy} from './timing-guard-helper.mjs';
import {account as dragonAccount,reachStage,DRAGON} from './void-dragon-helper.mjs';
import {step} from './anomalies-helper.mjs';

const atomic=(s,fn)=>{const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);};
const ready=(...args)=>{const s=guardBattle(...args);guardedTurn(s);return s;};
const fire=(s,id='rook',target='enemy0',part=null)=>E.counterAction(s,id,target,E.counterOpportunity(s.run),part);
const normalized=s=>{const c=withoutResultLedger(s);delete c.version;delete c.achievements;delete c.bonds;delete c.lockedGear;delete c.gearPresets;if(JSON.stringify(c.refining)===JSON.stringify({rolls:0,pending:null}))delete c.refining;if(JSON.stringify(c.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete c.loginRewards;if(JSON.stringify(c.bonds)==='{}')delete c.bonds;if(JSON.stringify(c.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete c.season;return c;};

test('a perfect guarded hit unlocks exactly one saved opportunity in the next player round without extra RNG',()=>{
  const s=guardBattle(),old=structuredClone(s);old.version=25;
  const receipt=Old.beginTimingGuard(old);const expectedEvents=Old.enemyTurn(old,{...receipt,grade:'perfect'});
  assert.deepEqual(guardedTurn(s),expectedEvents);
  assert.deepEqual(E.counterOpportunity(s.run),{rules:1,round:2,boss:'colossus',stamp:s.run.seed});
  old.version=26;old.run.battle.counter={rules:1,round:2,boss:'colossus',stamp:old.run.seed};
  assert.deepEqual(normalized(s),normalized(old));assert.deepEqual(copy(s),s);
  const receiptCopy=E.counterOpportunity(s.run);receiptCopy.stamp=0;assert.notEqual(s.run.battle.counter.stamp,0);
});

test('every damaging boss special grants a counter after perfect guard; misses and ordinary guards never do',()=>{
  let specials=0;
  for(const [boss,def] of Object.entries(BOSS))for(const move of Object.keys(def.moves)){
    const s=guardBattle(boss,move);if(!E.timingGuardThreat(s.run))continue;specials++;
    for(const grade of ['miss','guard','perfect']){
      const sample=structuredClone(s),events=guardedTurn(sample,grade);
      assert.equal(!!E.counterOpportunity(sample.run),grade==='perfect',boss+'/'+move+'/'+grade);
      if(grade==='perfect')assert.ok(events.some(e=>e.timingGuard?.prevented>0));copy(sample);
    }
  }
  assert.ok(specials>=15);
});

test('no counter is granted for a frozen boss, a changed move, a burn kill or a reflection kill',()=>{
  const frozen=guardBattle();frozen.run.battle.enemies[0].freeze=1;E.enemyTurn(frozen);assert.equal(E.counterOpportunity(frozen.run),null);
  const changed=guardBattle('ashknight','cleave'),e=changed.run.battle.enemies[0];e.hp=500010;e.burn=1;e.burnPower=100;
  guardedTurn(changed);assert.equal(E.counterOpportunity(changed.run),null);copy(changed);
  const burned=guardBattle();Object.assign(burned.run.battle.enemies[0],{hp:1,burn:1,burnPower:100});guardedTurn(burned);assert.equal(E.counterOpportunity(burned.run),null);assert.equal(Object.hasOwn(burned.run.battle,'counter'),false);copy(burned);
  const reflected=guardBattle();reflected.run.relics=['mirror'];reflected.run.heroes[0].shield=1;reflected.run.battle.enemies[0].hp=1;
  guardedTurn(reflected);assert.equal(E.counterOpportunity(reflected.run),null);copy(reflected);
});

test('the whole enemy turn must leave a living party and boss before granting; another survivor may counter',()=>{
  const defeated=guardBattle();for(const h of defeated.run.heroes)h.hp=1;guardedTurn(defeated);
  assert.equal(defeated.run.summary.reason,'defeat');assert.equal(Object.hasOwn(defeated.run.battle,'counter'),false);copy(defeated);
  const s=guardBattle('cinderwyrm','signature'),victim=E.timingGuardThreat(s.run).targets[0];s.run.heroes.find(h=>h.id===victim).hp=1;
  guardedTurn(s);assert.equal(s.run.heroes.find(h=>h.id===victim).hp,0);assert.ok(E.counterOpportunity(s.run));
  const survivor=s.run.heroes.find(h=>h.hp>0);fire(s,survivor.id);copy(s);
  const minions=guardBattle('archivist','volley'),b=minions.run.battle;
  b.enemies.push({...structuredClone(b.enemies[0]),id:'enemy1',kind:'wraith',name:'Bóng hầu',atk:1000000,intent:0});
  minions.run.heroes.forEach((h,i)=>h.hp=i===2?50:1);guardedTurn(minions);assert.equal(E.counterOpportunity(minions.run),null);assert.equal(minions.run.summary.reason,'defeat');copy(minions);
});

test('counter damage equals a 150% normal strike, respects defense and crit, and records the actor for MVP',()=>{
  for(const seed of [1,42,24680]){
    const s=ready(),r=s.run,hero=r.heroes[0];r.seed=seed;r.battle.enemies[0].def=25;
    const old=structuredClone(s);delete old.run.battle.counter;old.version=25;old.run.heroes[0].atk*=1.5;
    const expected=Old.playerAction(old,hero.id,'enemy0')[0],before=r.battle.statistics.rows[hero.id].damage;
    const events=fire(s),hit=events[0];assert.deepEqual(hit,{...expected,actor:hero.id,counter:true});
    assert.equal(r.battle.statistics.rows[hero.id].damage-before,hit.value);assert.equal(r.seed,old.run.seed);copy(s);
  }
});

test('a used hero can counter and still keeps normal action, energy, link, pet and skill allowances unchanged',()=>{
  const s=ready(),r=s.run;r.link.charge=100;E.linkAction(s,'rook','aerin','enemy0');r.battle.used=['rook'];r.heroes[0].energy=100;r.link.charge=80;r.battle.relicSkillUsed=true;r.pet={id:'mossling',level:1,nextRound:7};
  const resources=()=>({used:[...r.battle.used],energy:r.heroes.map(h=>h.energy),link:structuredClone(r.link),pet:structuredClone(r.pet),hourglass:r.battle.relicSkillUsed,linkUsed:r.battle.linkUsed,round:r.battle.round,gold:s.gold,tickets:s.tickets});
  const before=resources();fire(s);assert.deepEqual(resources(),before);assert.equal(E.counterOpportunity(r),null);copy(s);
  const fresh=ready();fire(fresh);assert.equal(fresh.run.battle.used.includes('rook'),false);E.playerAction(fresh,'rook','enemy0');assert.equal(fresh.run.battle.used.includes('rook'),true);copy(fresh);
});

test('healers counter with direct damage, without casting their skill, paying sacrifice or triggering tutorial actions',()=>{
  const s=ready('colossus','quake',{contracts:['sacrifice']}),r=s.run;r.heroes[0].hp=0;const lumi=r.heroes.find(h=>h.id==='lumi');lumi.energy=100;
  const before=structuredClone(s),events=fire(s,'lumi');assert.equal(events.length,1);assert.ok(events[0].value>0);assert.equal(r.heroes[0].hp,0);assert.equal(lumi.hp,before.run.heroes.find(h=>h.id==='lumi').hp);assert.equal(lumi.energy,100);assert.deepEqual(s.onboarding,before.onboarding);copy(s);
});

test('standard on-hit passives still heal, burn and return prism energy without basic energy or link gain',()=>{
  const s=ready(),r=s.run,h=r.heroes[0],e=r.battle.enemies[0];r.relics=['prism'];r.buffs=['vamp','flame'];h.hp=400;e.freeze=1;
  const energy=h.energy,charge=r.link.charge,events=fire(s);assert.equal(h.energy,energy+20);assert.equal(r.link.charge,charge);assert.ok(h.hp>400);assert.equal(e.burn,2);assert.equal(e.burnPower,10);assert.equal(r.battle.statistics.rows[h.id].healing,h.hp-400);assert.equal(events[0].counter,true);copy(s);
});

for(const part of E.BOSS_PART_IDS)test(`counter may break boss ${part} armor with the existing part effects`,()=>{
  const s=ready(),r=s.run,p=r.battle.bossState.parts;p[part].hp=1;
  const events=fire(s,'aerin','enemy0',part);assert.equal(events[0].part.id,part);assert.equal(events[0].part.broken,true);assert.equal(p[part].hp,0);
  if(part==='head'){assert.equal(p.stun,true);assert.equal(r.battle.bossState.move,'strike');}
  if(part==='arms')assert.equal(E.bossAttackMultiplier(r),.8);
  if(part==='core')assert.equal(E.bossDirectMultiplier(r),1.25);copy(s);
});

test('counter can choose a living minion; invalid targets and parts never redirect damage or consume the token',()=>{
  const s=ready('archivist','volley'),r=s.run,b=r.battle;b.enemies.push({...structuredClone(b.enemies[0]),id:'enemy1',kind:'wraith',name:'Bóng hầu',hp:1000,maxHp:1000});
  for(const [hero,target,part] of [['missing','enemy0',null],['rook','missing',null],['rook','enemy1','head'],['rook','enemy0','wings']])atomic(s,()=>E.counterAction(s,hero,target,E.counterOpportunity(r),part));
  r.heroes[1].hp=0;atomic(s,()=>fire(s,'aerin'));const hp=b.enemies[0].hp;fire(s,'rook','enemy1');assert.equal(b.enemies[0].hp,hp);assert.ok(b.enemies[1].hp<1000);copy(s);
});

test('duplicate, malformed and stale receipts reject atomically before RNG, HP, parts or rewards change',()=>{
  const s=ready(),p=E.counterOpportunity(s.run);
  for(const receipt of [null,undefined,{},[],false,{...p,round:p.round+1},{...p,stamp:p.stamp+1},{...p,boss:'ashknight'},{...p,rules:2},{...p,extra:1}])atomic(s,()=>E.counterAction(s,'rook','enemy0',receipt,'head'));
  fire(s);atomic(s,()=>E.counterAction(s,'rook','enemy0',p));
  const later=ready();E.enemyTurn(later);later.run.battle.bossState.move='quake';guardedTurn(later);assert.notEqual(later.run.battle.counter.round,p.round);atomic(later,()=>E.counterAction(later,'rook','enemy0',p));copy(later);
  const other=guardBattle();other.run.seed=43;guardedTurn(other);atomic(other,()=>E.counterAction(other,'rook','enemy0',p));copy(other);
});

test('counter expires on the next enemy turn; invalid guard results do not expire it and pending guard blocks it',()=>{
  const s=ready(),p=E.counterOpportunity(s.run);atomic(s,()=>E.enemyTurn(s,{rules:1,round:2,boss:'colossus',move:'quake',grade:'perfect'}));assert.deepEqual(E.counterOpportunity(s.run),p);
  s.run.battle.bossState.move='quake';const queued=E.beginTimingGuard(s);assert.equal(E.counterOpportunity(s.run),null);atomic(s,()=>E.counterAction(s,'rook','enemy0',p));copy(s);
  E.enemyTurn(s);assert.equal(E.counterOpportunity(s.run),null);assert.equal(Object.hasOwn(s.run.battle,'counter'),false);atomic(s,()=>E.counterAction(s,'rook','enemy0',p));
  const another=ready();another.run.battle.bossState.move='quake';guardedTurn(another);assert.equal(another.run.battle.counter.round,3);assert.ok(queued);copy(another);
});

test('counter killing a boss pays victory once, clears tokens and head stun, and survives reload without a second strike',()=>{
  const s=ready(),r=s.run;r.battle.enemies[0].hp=1;r.battle.bossState.parts.head.hp=1;const p=E.counterOpportunity(r),wins=s.wins;
  const events=E.counterAction(s,'rook','enemy0',p,'head');assert.equal(events[0].value,1);assert.equal(s.wins,wins+1);assert.equal(r.battle.bossState.parts.stun,false);assert.equal(Object.hasOwn(r.battle,'counter'),false);assert.ok(E.victoryPending(r));
  const paid=copy(s);atomic(paid,()=>E.counterAction(paid,'rook','enemy0',p));assert.deepEqual(paid,s);
});

test('killing the boss with another action expires counter even if a minion keeps the fight running',()=>{
  const s=ready('archivist','volley'),r=s.run,b=r.battle;b.enemies.push({...structuredClone(b.enemies[0]),id:'enemy1',kind:'wraith',name:'Bóng hầu'});b.enemies[0].hp=1;
  E.playerAction(s,'rook','enemy0');assert.equal(r.phase,'battle');assert.equal(b.enemies[0].hp,0);assert.equal(Object.hasOwn(b,'counter'),false);copy(s);
});

test('counter clears on a normal victory or retreat and never transfers to a new battle',()=>{
  const s=ready();E.finishRun(s);assert.equal(Object.hasOwn(s.run.battle,'counter'),false);copy(s);E.startRun(s,44);E.chooseRoute(s,0);assert.equal(E.counterOpportunity(s.run),null);copy(s);
  const won=ready();won.run.battle.enemies[0].hp=1;E.playerAction(won,'rook','enemy0');assert.equal(Object.hasOwn(won.run.battle,'counter'),false);copy(won);
});

test('unused and consumed opportunities round-trip without changing rewards, RNG or action eligibility',()=>{
  const s=ready();E.playerAction(s,'rook','enemy0');const loaded=copy(s);assert.deepEqual(loaded,s);
  assert.deepEqual(fire(loaded),fire(s));assert.deepEqual(loaded,s);const after=copy(loaded);assert.deepEqual(after,loaded);assert.equal(E.counterOpportunity(after.run),null);atomic(after,()=>fire(after));
});

test('saved tokens reject missing fields, invalid phases, round, stamp, boss, old versions and dead encounters',()=>{
  const good=ready();for(const mutate of [s=>s.run.battle.counter=null,s=>s.run.battle.counter=[],s=>delete s.run.battle.counter.stamp,s=>s.run.battle.counter.extra=1,s=>s.run.battle.counter.rules=2,s=>s.run.battle.counter.round++,s=>s.run.battle.counter.round=1,s=>s.run.battle.counter.round='2',s=>s.run.battle.counter.stamp=-1,s=>s.run.battle.counter.stamp=4294967296,s=>s.run.battle.counter.stamp=1.5,s=>s.run.battle.counter.boss='archivist',s=>s.run.phase='route',s=>s.run.battle.enemies[0].hp=0,s=>{for(const h of s.run.heroes)h.hp=0;},s=>s.version=25]){
    const bad=structuredClone(good);mutate(bad);const before=structuredClone(bad);assert.throws(()=>copy(bad));assert.deepEqual(bad,before);
  }
});

test('save 25 migration changes only the version and does not create a retroactive perfect opportunity',()=>{
  const s=guardBattle();s.version=25;const before=structuredClone(s),migrated=copy(s);assert.deepEqual(s,before);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(normalized(s),normalized(migrated));assert.equal(Object.hasOwn(migrated.run.battle,'counter'),false);
});

test('dragon counters damage protected wing and core armor and cannot bypass protected boss HP',()=>{
  for(const stage of [0,1]){
    const s=dragonAccount();reachStage(s,stage);const r=s.run,b=r.battle,p=b.bossState.parts;b.bossState.move='quake';
    for(const h of r.heroes){Object.assign(h,{hp:100000,maxHp:100000});Object.assign(r.raid.teams[stage].heroes.find(a=>a.id===h.id),{hp:100000,maxHp:100000});}guardedTurn(s);b.enemies[0].hp=1;
    const part=stage===0?'arms':'core';p[part].hp=p[part].maxHp;r.heroes[0].atk=10;r.raid.teams[stage].heroes[0].atk=10;
    const hit=fire(s,r.heroes[0].id,'enemy0',part)[0];assert.equal(hit.value,0);assert.ok(hit.part.damage>0);assert.equal(b.enemies[0].hp,1);assert.equal(r.phase,'battle');copy(s);
  }
});

test('practice counters track real damage without changing or rewarding the account',()=>{
  const source=E.createState(),before=structuredClone(source),s=E.createTrainingState(source);s.run.battle.bossState.move='quake';
  guardedTurn(s);const damage=s.run.training.damage,events=fire(s);assert.equal(s.run.training.damage-damage,events[0].value);assert.deepEqual(source,before);
});

test('ordinary 1.35 journeys remain identical at every action when no timing input is used',()=>{
  for(const seed of [1,42,123456]){
    const old=Old.createState();for(const h of Object.values(old.owned))h.level=8;Old.startRun(old,seed);let s=copy(old),actions=0;
    while(old.run.phase!=='result'&&old.run.floor<=15&&actions++<1600){assert.equal(step(E,s),step(Old,old));assert.deepEqual(normalized(s),normalized(old));s=copy(s);}
    assert.ok(actions<1600);
  }
});
