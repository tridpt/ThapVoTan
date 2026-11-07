import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES,HERO} from '../js/data.mjs';
import {HUNT} from '../js/armory-data.mjs';
import {expeditionsPage,expeditionConfig,expeditionCountdown} from '../js/expeditions-ui.mjs';
const NOW=1_792_550_000_000;
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function collected(){const s=E.createState();s.best=25;for(const h of HEROES)s.owned[h.id]={level:1,copies:0,awaken:0};return s;}
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}

test('v6 migration only adds empty expeditions and preserves a live battle and the old economy',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);E.playerAction(s,'rook','enemy0');s.armory.marks.archivist=9;s.armory.target='signature-lumi';s.version=6;delete s.expeditions;
  const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(m.expeditions,E.starterExpeditions());
  for(const key of Object.keys(s).filter(k=>!['version','run'].includes(k)))assert.deepEqual(m[key],s[key],key);
  assert.deepEqual(withoutCombatReport(m.run),withoutCombatReport({...s.run,formation:null,link:E.starterLink(),heroes:s.run.heroes.map(h=>({...h,talents:null}))}));
  assert.deepEqual(copy(m),m);
});

test('six destinations have finite durations, valid elements and all four real crafting materials',()=>{
  assert.equal(E.EXPEDITIONS.length,6);assert.equal(new Set(E.EXPEDITIONS.map(m=>m.id)).size,6);
  assert.deepEqual(new Set(E.EXPEDITIONS.map(m=>m.duration)),new Set([900_000,7_200_000,28_800_000]));
  assert.deepEqual(new Set(E.EXPEDITIONS.flatMap(m=>m.boss?[m.boss]:[])),new Set(Object.keys(HUNT)));
  for(const m of E.EXPEDITIONS){assert.ok(HEROES.some(h=>h.element===m.element));assert.ok(Number.isSafeInteger(m.gold)&&m.gold>0);assert.ok(Number.isSafeInteger(m.dust)&&m.dust>0);if(m.boss)assert.equal(m.marks,2);}
});

test('a new player can send Ember, while invalid, owned, active-team and occupied dispatches fail atomically',()=>{
  const s=E.createState();assert.deepEqual(E.expeditionHeroes(s).map(h=>h.id),['ember']);
  for(const args of [['constructor','ember',0,NOW],['mist-path','constructor',0,NOW],['mist-path','aion',0,NOW],['mist-path','rook',0,NOW],['mist-path','ember',-1,NOW],['mist-path','ember',3,NOW],['mist-path','ember',.5,NOW],['mist-path','ember',1,NOW],['mist-path','ember',0,-1],['mist-path','ember',0,Infinity],['mist-path','ember',0,8_640_000_000_000_000]])atomic(s,()=>E.dispatchExpedition(s,...args));
  const before=structuredClone(s),trip=E.dispatchExpedition(s,'mist-path','ember',0,NOW);assert.equal(trip.hero,'ember');assert.equal(trip.endsAt,NOW+900_000);assert.equal(s.expeditions.nextId,2);assert.equal(E.expeditionHeroes(s).length,0);
  for(const key of ['gold','dust','tickets','runs','daily','run','team'])assert.deepEqual(s[key],before[key]);
  trip.rewards.gold=99999;assert.equal(s.expeditions.slots[0].rewards.gold,60);atomic(s,()=>E.dispatchExpedition(s,'mist-path','ember',0,NOW));copy(s);
});

test('tower records unlock destinations and the second and third expedition slots at the advertised thresholds',()=>{
  const s=collected();s.best=0;atomic(s,()=>E.dispatchExpedition(s,'old-mine','ember',0,NOW));s.best=2;atomic(s,()=>E.dispatchExpedition(s,'old-mine','ember',0,NOW));s.best=3;E.dispatchExpedition(s,'old-mine','ember',0,NOW);E.recallExpedition(s,0,NOW);
  s.best=4;atomic(s,()=>E.dispatchExpedition(s,'ash-trail','ember',0,NOW));s.best=5;E.dispatchExpedition(s,'ash-trail','ember',0,NOW);
  s.best=9;atomic(s,()=>E.dispatchExpedition(s,'mist-path','kira',1,NOW));s.best=10;E.dispatchExpedition(s,'mist-path','kira',1,NOW);
  s.best=24;atomic(s,()=>E.dispatchExpedition(s,'mist-path','nyx',2,NOW));s.best=25;E.dispatchExpedition(s,'mist-path','nyx',2,NOW);copy(s);
});

test('matching elements give exactly 25 percent gold and dust rounded down, with fixed boss marks for every hero',()=>{
  for(const m of E.EXPEDITIONS)for(const h of HEROES){const r=E.expeditionRewards(m.id,h.id),scale=m.element===h.element?1.25:1;assert.equal(r.gold,Math.floor(m.gold*scale));assert.equal(r.dust,Math.floor(m.dust*scale));assert.deepEqual(r.marks,m.boss?{[m.boss]:2}:{});}
  const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);const reward=structuredClone(s.expeditions.slots[0].rewards);E.upgradeHero(s,'ember');assert.deepEqual(s.expeditions.slots[0].rewards,reward);assert.deepEqual(copy(s).expeditions.slots[0].rewards,reward);
});

test('offline progress survives export and reload, pays at the exact end and cannot be claimed twice',()=>{
  let s=E.createState();E.dispatchExpedition(s,'mist-path','ember',0,NOW);const base=structuredClone(s);s=copy(s);
  assert.equal(E.expeditionStatus(s,0,NOW+450_000).progress,50);assert.equal(E.expeditionStatus(s,0,NOW+899_999).remaining,1);atomic(s,()=>E.claimExpedition(s,0,NOW+899_999));
  const r=E.claimExpedition(s,0,NOW+900_000);assert.deepEqual(r,{gold:60,dust:1,marks:{}});assert.equal(s.gold,base.gold+60);assert.equal(s.dust,base.dust+1);assert.equal(s.expeditions.completed,1);assert.equal(s.expeditions.slots[0],null);assert.equal(E.expeditionHeroAvailable(s,'ember'),true);
  s=copy(s);atomic(s,()=>E.claimExpedition(s,0,NOW+900_001));atomic(s,()=>E.claimAllExpeditions(s,NOW+900_001));E.setTeamSlot(s,'ember',0);assert.equal(s.team[0],'ember');
});

test('a long absence pays only the single dispatched trip, and a finished hero remains reserved until claim',()=>{
  const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);const after=NOW+365*86_400_000;
  assert.deepEqual(E.readyExpeditions(s,after),[0]);atomic(s,()=>E.setTeamSlot(s,'ember',0));atomic(s,()=>E.recallExpedition(s,0,after));assert.equal(E.expeditionHeroAvailable(s,'ember'),false);
  const r=E.claimExpedition(s,0,after);assert.deepEqual(r,{gold:1250,dust:15,marks:{ashknight:2}});assert.equal(s.armory.marks.ashknight,2);assert.equal(s.expeditions.completed,1);assert.deepEqual(s.expeditions.slots,[null,null,null]);
});

test('clock rollback neither grants early rewards nor erases observed progress or a saved completed trip',()=>{
  let s=E.createState();E.dispatchExpedition(s,'mist-path','ember',0,NOW);assert.equal(E.expeditionStatus(s,0,NOW-500_000).progress,0);assert.equal(E.expeditionStatus(s,0,NOW-500_000).remaining,900_000);atomic(s,()=>E.claimExpedition(s,0,NOW-500_000));
  E.observeExpeditions(s,NOW+450_000);s=copy(s);E.observeExpeditions(s,NOW-100_000);assert.equal(E.expeditionStatus(s,0,NOW-100_000).progress,50);
  E.observeExpeditions(s,NOW+900_000);s=copy(s);assert.equal(E.expeditionStatus(s,0,NOW-100_000).ready,true);E.claimExpedition(s,0,NOW-100_000);assert.equal(s.expeditions.completed,1);
});

test('recalling early returns the hero without rewards, frees the slot and never reuses dispatch IDs',()=>{
  const s=E.createState(),before=structuredClone(s);E.dispatchExpedition(s,'mist-path','ember',0,NOW);assert.equal(E.recallExpedition(s,0,NOW+100),'ember');assert.equal(s.gold,before.gold);assert.equal(s.dust,before.dust);assert.equal(s.expeditions.completed,0);assert.equal(E.expeditionForHero(s,'ember'),null);
  atomic(s,()=>E.recallExpedition(s,0,NOW+200));const t=E.dispatchExpedition(s,'mist-path','ember',0,NOW+200);assert.equal(t.id,2);copy(s);
});

test('claim all pays only ready slots, sums shared materials and leaves the later trip untouched',()=>{
  const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);E.dispatchExpedition(s,'ash-trail','kira',1,NOW);E.dispatchExpedition(s,'old-mine','nyx',2,NOW+28_800_000);const later=structuredClone(s.expeditions.slots[2]);
  const r=E.claimAllExpeditions(s,NOW+28_800_000),expected=[E.expeditionRewards('ash-trail','ember'),E.expeditionRewards('ash-trail','kira')];assert.equal(r.gold,expected[0].gold+expected[1].gold);assert.equal(r.dust,expected[0].dust+expected[1].dust);assert.deepEqual(r.marks,{ashknight:4});assert.equal(s.expeditions.completed,2);assert.deepEqual(s.expeditions.slots,[null,null,later]);copy(s);
});

test('claim all refuses resource overflow before changing any wallet or freeing a hero',()=>{
  for(const fill of [s=>s.gold=1e9,s=>s.dust=1e9,s=>s.armory.marks.ashknight=1e9]){const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);E.dispatchExpedition(s,'ash-trail','kira',1,NOW);fill(s);atomic(s,()=>E.claimAllExpeditions(s,NOW+28_800_000));assert.equal(E.readyExpeditions(s,NOW+28_800_000).length,2);}
});

test('a reserve expedition runs alongside a live battle without changing its HP, turns, seed or rewards',()=>{
  const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');const battle=structuredClone(s.run),daily=structuredClone(s.daily);E.dispatchExpedition(s,'mist-path','ember',0,NOW);E.observeExpeditions(s,NOW+900_000);E.claimExpedition(s,0,NOW+900_000);assert.deepEqual(s.run,battle);assert.deepEqual(s.daily,daily);assert.deepEqual(copy(s).run,battle);
  E.dispatchExpedition(s,'mist-path','ember',0,NOW+900_001);s.team[0]='ember';atomic(s,()=>E.startHunt(s,'colossus',1,42));assert.throws(()=>copy(s));
});

test('training can use a dispatched hero without copying real trips or allowing expedition economy changes',()=>{
  const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);const before=structuredClone(s),t=E.createTrainingState(s,{team:['ember','aion','eclipse']});assert.deepEqual(s,before);assert.equal(t.run.mode,'training');assert.deepEqual(t.expeditions,E.starterExpeditions());
  atomic(t,()=>E.dispatchExpedition(t,'mist-path','kira',0,NOW));atomic(t,()=>E.claimAllExpeditions(t,NOW+28_800_000));atomic(t,()=>E.recallExpedition(t,0,NOW));assert.deepEqual(s,before);
});

test('all real journey entry points reject an expedition hero before mutating the run or counters',()=>{
  for(const start of [s=>E.startRun(s,42),s=>E.startHunt(s,'colossus',1,42),s=>E.startDungeon(s,'earth',1,new Date(),42),s=>E.startChallenge(s,'iron')]){const s=collected();E.dispatchExpedition(s,'mist-path','ember',0,NOW);s.team[0]='ember';atomic(s,()=>start(s));assert.equal(s.run,null);assert.equal(s.runs,0);}
});

test('import validation rejects corrupted expeditions, duplicate heroes, forged rewards and team overlap',()=>{
  const s=collected();E.dispatchExpedition(s,'ash-trail','ember',0,NOW);E.dispatchExpedition(s,'mist-path','kira',1,NOW);
  const corruptions=[s=>delete s.expeditions,s=>s.expeditions.slots.push(null),s=>s.expeditions.slots[2]=false,s=>s.expeditions.nextId=2,s=>s.expeditions.completed=1,s=>s.expeditions.slots[1].hero='ember',s=>s.expeditions.slots[1].id=1,s=>s.expeditions.slots[0].hero='constructor',s=>delete s.owned.ember,s=>s.team[0]='ember',s=>s.expeditions.slots[0].mission='constructor',s=>s.expeditions.slots[0].endsAt++,s=>s.expeditions.slots[0].observedAt=NOW-1,s=>s.expeditions.slots[0].observedAt=NOW+28_800_001,s=>s.expeditions.slots[0].startedAt=-1,s=>s.expeditions.slots[0].rewards.gold++,s=>s.expeditions.slots[0].rewards.marks.ashknight=100,s=>s.expeditions.slots[0].rewards.marks.colossus=2,s=>s.expeditions.slots[0].rewards.extra=3,s=>s.best=9,s=>s.expeditions.slots[2]={...s.expeditions.slots[0],id:3}];
  for(const corrupt of corruptions){const invalid=structuredClone(s);corrupt(invalid);const before=structuredClone(invalid);assert.throws(()=>copy(invalid));assert.deepEqual(invalid,before);}copy(s);
});

test('an expedition hero cannot appear in a live run snapshot even if it is no longer on the selected team',()=>{
  const s=collected();E.startRun(s,42);E.chooseRoute(s,0);s.team=['ember','kira','nyx'];atomic(s,()=>E.dispatchExpedition(s,'mist-path','rook',0,NOW));
  const invalid=collected();E.startRun(invalid,42);E.chooseRoute(invalid,0);E.dispatchExpedition(invalid,'mist-path','ember',0,NOW);invalid.run.heroes[0]={...invalid.run.heroes[0],id:'ember'};assert.throws(()=>copy(invalid));
});

test('the page exposes slot unlocks, exact bonus preview, available heroes and ready reward controls',()=>{
  const s=collected(),c=expeditionConfig(s,{mission:'ash-trail',hero:'ember',slot:0}),before=structuredClone(s),html=expeditionsPage(s,c,NOW);assert.deepEqual(s,before);assert.match(html,/data-expedition="hero"/);assert.match(html,/1\.250/);assert.match(html,/>15<\/b> bụi rèn/);assert.match(html,/2<\/b> Ấn tro lửa/);assert.doesNotMatch(html,/<option value="rook"/);
  E.dispatchExpedition(s,c.mission,c.hero,c.slot,NOW);const active=expeditionsPage(s,c,NOW);assert.match(active,/data-expedition-countdown="0">8:00:00/);assert.match(active,/data-expedition-claim="0" disabled/);assert.match(active,/data-expedition-recall="0"/);
  const ready=expeditionsPage(s,c,NOW+28_800_000);assert.match(ready,/Sẵn sàng nhận/);assert.doesNotMatch(ready,/data-expedition-claim="0" disabled/);assert.match(ready,/data-expedition-recall="0" hidden/);
  const starter=expeditionsPage(E.createState(),{},NOW);assert.match(starter,/Vượt tầng 10/);assert.match(starter,/Vượt tầng 25/);assert.match(starter,/Cần tầng 3/);assert.match(starter,/Cần tầng 5/);
});

test('countdowns round partial seconds up and configuration recovers after dispatch or a changed roster',()=>{
  assert.equal(expeditionCountdown(1),'00:01');assert.equal(expeditionCountdown(900_000),'15:00');assert.equal(expeditionCountdown(28_800_000),'8:00:00');assert.equal(expeditionCountdown(-1),'00:00');
  const s=E.createState(),c=expeditionConfig(s,{mission:'constructor',hero:'aion',slot:10});assert.deepEqual(c,{mission:'mist-path',hero:'ember',slot:0});E.dispatchExpedition(s,c.mission,c.hero,c.slot,NOW);assert.deepEqual(expeditionConfig(s,c),{mission:'mist-path',hero:null,slot:null});
});
