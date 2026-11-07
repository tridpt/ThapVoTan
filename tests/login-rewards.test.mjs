import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/login-rewards-legacy-v1.41.0/js/engine.mjs';
import {loginRewardCard} from '../js/login-rewards-ui.mjs';

const day=new Date(2026,9,20,12),next=new Date(2026,9,21,12),weekLater=new Date(2026,9,27,12),before=new Date(2026,9,19,12);
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const atomic=(s,fn,pattern)=>{const snapshot=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,snapshot);};
const wallet=s=>({gold:s.gold,tickets:s.tickets,dust:s.dust,shards:s.shards});

test('fresh accounts have a read-only day-one preview and independent login ledgers',()=>{
  const a=E.createState(),b=E.createState(),status=E.loginRewardStatus(a,day),beforeState=structuredClone(a);
  assert.equal(status.claimable,true);assert.equal(status.day,1);assert.equal(status.reward.gold,120);assert.equal(status.totalClaims,0);assert.deepEqual(a.loginRewards,E.starterLoginRewards());
  assert.deepEqual(E.loginRewardStatus(a,day),E.loginRewardStatus(b,day));assert.deepEqual(a,b);assert.deepEqual(a,beforeState);assert.match(loginRewardCard(a,day),/Nhận quà hôm nay/);assert.match(loginRewardCard(a,day),/Ngày 7/);copy(a);
});

test('claiming seven consecutive local days advances the cycle and pays exactly the shown reward',()=>{
  const s=E.createState(),initial=wallet(s),paid=[];
  for(let i=0;i<7;i++){
    const date=new Date(2026,9,20+i,12),status=E.loginRewardStatus(s,date),expected=status.reward;
    assert.equal(status.day,i+1);assert.equal(status.claimable,true);const reward=E.claimLoginReward(s,date);paid.push(reward);assert.deepEqual(reward,expected);assert.equal(s.loginRewards.streak,i+1);assert.equal(s.loginRewards.totalClaims,i+1);assert.equal(s.loginRewards.lastDay,E.dayKey(date));assert.deepEqual(copy(s),s);
  }
  assert.equal(s.gold-initial.gold,120+180+300+650);assert.equal(s.tickets-initial.tickets,1+2+2+3);assert.equal(s.dust-initial.dust,2+3+4+5+7+9+12);assert.equal(s.shards-initial.shards,2+3+8);assert.equal(paid.length,7);
  const nextStatus=E.loginRewardStatus(s,weekLater);assert.equal(nextStatus.claimable,true);assert.equal(nextStatus.day,1);E.claimLoginReward(s,weekLater);assert.equal(s.loginRewards.streak,8);assert.equal(E.loginRewardStatus(s,new Date(2026,9,28,12)).day,2);copy(s);
});

test('same-day repeat is atomic, a missed day resets to day one, and clock rollback is blocked',()=>{
  const s=E.createState();E.claimLoginReward(s,day);const paid=wallet(s),ledger=structuredClone(s.loginRewards);
  atomic(s,()=>E.claimLoginReward(s,day),/đã nhận/);assert.deepEqual(wallet(s),paid);assert.deepEqual(s.loginRewards,ledger);
  const missed=E.loginRewardStatus(s,new Date(2026,9,23,12));assert.equal(missed.claimable,true);assert.equal(missed.missed,true);assert.equal(missed.day,1);E.claimLoginReward(s,new Date(2026,9,23,12));assert.equal(s.loginRewards.streak,1);
  const clock=E.loginRewardStatus(s,before);assert.equal(clock.clockSkew,true);atomic(s,()=>E.claimLoginReward(s,before),/lùi/);copy(s);
});

test('offline timestamps use calendar days, validate impossible dates, and do not mutate while rendering',()=>{
  const s=E.createState(),beforeState=structuredClone(s);assert.equal(E.loginRewardStatus(s,new Date(2026,9,31,23)).day,1);assert.throws(()=>E.loginRewardStatus(s,new Date('invalid')),/Ngày/);assert.deepEqual(E.loginRewardStatus(s,day).reward,{day:1,gold:120,tickets:0,dust:2,shards:0});assert.deepEqual(loginRewardCard(s,day).match(/data-action="claim-login-reward"/).length,1);assert.deepEqual(s,beforeState);
  for(const bad of [new Date(2026,1,29,12),new Date(2026,13,1,12)])assert.doesNotThrow(()=>E.loginRewardStatus(s,bad)); // JS normalizes Date objects; key validation protects saved strings.
});

test('rewards cap all wallets atomically and training cannot claim account rewards',()=>{
  const s=E.createState();s.gold=1e9;atomic(s,()=>E.claimLoginReward(s,day),/giới hạn/);assert.deepEqual(s.loginRewards,E.starterLoginRewards());
  const training=E.createTrainingState(E.createState());atomic(training,()=>E.claimLoginReward(training,day),/Phòng thử/);assert.deepEqual(training.loginRewards,E.starterLoginRewards());E.validateLoginRewards(training);E.validateEquipment(training);
});

const invalid=[
  ['missing root',s=>delete s.loginRewards],['null root',s=>s.loginRewards=null],['array root',s=>s.loginRewards=[]],['extra root',s=>s.loginRewards.extra=1],['bad last day',s=>s.loginRewards.lastDay='2026-02-29'],['bad last type',s=>s.loginRewards.lastDay=1],['future impossible',s=>s.loginRewards.lastDay='2026-13-01'],['negative streak',s=>s.loginRewards.streak=-1],['fractional streak',s=>s.loginRewards.streak=.5],['streak without day',s=>{s.loginRewards.lastDay=null;s.loginRewards.streak=1}],['day without streak',s=>{s.loginRewards.lastDay='2026-10-20';s.loginRewards.streak=0}],['claims below streak',s=>{s.loginRewards.lastDay='2026-10-20';s.loginRewards.streak=2;s.loginRewards.totalClaims=1}],['negative total',s=>s.loginRewards.totalClaims=-1],['string total',s=>s.loginRewards.totalClaims='1']
];
for(const [name,mutate] of invalid)test(`login reward schema rejects ${name} without mutating input`,()=>{const s=E.createState();mutate(s);atomic(s,()=>E.validateState(s));});

test('empty ledgers reject invented totals and counters reject values above the save limit',()=>{
  for(const ledger of [{lastDay:null,streak:0,totalClaims:1},{lastDay:'2026-10-20',streak:1,totalClaims:1e9+1},{lastDay:'2026-10-20',streak:1e9+1,totalClaims:1e9+1}]){
    const s=E.createState();s.loginRewards=ledger;atomic(s,()=>copy(s));
  }
});

test('the final representable claim saves valid counters and further claims stay atomic',()=>{
  const s=E.createState();s.loginRewards={lastDay:'2026-10-19',streak:1e9-1,totalClaims:1e9-1};
  assert.equal(E.loginRewardStatus(s,day).claimable,true);E.claimLoginReward(s,day);assert.equal(s.loginRewards.streak,1e9);assert.equal(s.loginRewards.totalClaims,1e9);assert.deepEqual(copy(s),s);
  for(const date of [day,next,weekLater]){const status=E.loginRewardStatus(s,date);assert.equal(status.capped,true);assert.equal(status.claimable,false);atomic(s,()=>E.claimLoginReward(s,date),/giới hạn/);assert.match(loginRewardCard(s,date),/Đã đạt giới hạn/);assert.doesNotMatch(loginRewardCard(s,date),/data-action="claim-login-reward"/);}
});

test('unsupported years and non-Date arguments cannot commit a reward',()=>{
  const early=new Date(day);early.setFullYear(99);const late=new Date(day);late.setFullYear(10000);
  for(const date of [null,{},'2026-10-20',new Date(NaN),early,late]){const s=E.createState();atomic(s,()=>E.claimLoginReward(s,date),/Ngày/);}
});

test('calendar adjacency works at local midnight, month end, leap day and year end',()=>{
  for(const [last,current] of [[new Date(2026,9,20,23,59),new Date(2026,9,21,0,1)],[new Date(2026,9,31,23),new Date(2026,10,1,1)],[new Date(2028,1,28,12),new Date(2028,1,29,12)],[new Date(2026,11,31,12),new Date(2027,0,1,12)]]){
    const s=E.createState();E.claimLoginReward(s,last);assert.equal(E.loginRewardStatus(s,current).day,2);E.claimLoginReward(s,current);assert.equal(s.loginRewards.streak,2);assert.deepEqual(copy(s),s);
  }
});

for(const [key,claims] of [['gold',0],['tickets',1],['dust',0],['shards',2]])test(`${key} overflow cancels every wallet and the entire login ledger`,()=>{
  const s=E.createState();for(let i=0;i<claims;i++)E.claimLoginReward(s,new Date(2026,9,20+i,12));s[key]=1e9;
  atomic(s,()=>E.claimLoginReward(s,new Date(2026,9,20+claims,12)),/giới hạn/);assert.deepEqual(copy(s),s);
});

test('the calendar shows actual claimed markers, resets expired streak display and explains unavailable states',()=>{
  const s=E.createState();E.claimLoginReward(s,day);E.claimLoginReward(s,next);const before=structuredClone(s);
  for(const date of [next,day]){const html=loginRewardCard(s,date);assert.equal((html.match(/class="login-reward-day [^"]*is-done/g)||[]).length,2);assert.doesNotMatch(html,/data-action="claim-login-reward"/);}
  const expired=loginRewardCard(s,new Date(2026,9,23,12));assert.equal(E.loginRewardStatus(s,new Date(2026,9,23,12)).streak,0);assert.match(expired,/login-streak"><strong>0<\/strong>/);assert.match(expired,/bắt đầu lại từ Ngày 1/);assert.equal((expired.match(/class="login-reward-day [^"]*is-done/g)||[]).length,0);assert.match(expired,/Sau Ngày 7/);assert.deepEqual(s,before);
  const training=E.createTrainingState(s);assert.equal(E.loginRewardStatus(training,day).claimable,false);assert.match(loginRewardCard(training,day),/Đang trong Phòng thử/);assert.doesNotMatch(loginRewardCard(training,day),/data-action="claim-login-reward"/);
});

test('claiming changes only four wallets and the ledger while preserving pending refining, combat and both RNG streams',()=>{
  const s=E.createState();s.gold=10000;s.dust=100;E.rollGearRefining(s,'gear-1',0,E.refiningReceipt(s,'gear-1',0),()=>.5);E.startHunt(s,'colossus',1,42);
  const plain=structuredClone(s),before=structuredClone(s),reward=E.claimLoginReward(s,day),projected=structuredClone(s);
  for(const key of ['gold','tickets','dust','shards'])projected[key]-=reward[key];projected.loginRewards=before.loginRewards;assert.deepEqual(projected,before);
  assert.deepEqual(E.playerAction(s,'rook','enemy0'),E.playerAction(plain,'rook','enemy0'));assert.deepEqual(s.run,plain.run);assert.deepEqual(s.summoning,plain.summoning);assert.deepEqual(copy(s),s);
});

for(const phase of ['idle','route','battle','pending-guard','counter','contract','result'])test(`released 1.41 / v31 ${phase} migrates with exact paid refining, presets, locks and combat`,()=>{
  const old=Old.createState();old.gold=1000000;old.dust=100000;Old.equipGear(old,'gear-1','rook');Old.saveGearPreset(old,'rook',0);Old.saveTeamPreset(old,0,'Đội cũ');Old.rollGearRefining(old,'gear-1',0,Old.refiningReceipt(old,'gear-1',0),()=>.5);Old.toggleGearLock(old,'gear-1');
  if(phase!=='idle')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){
    old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);
    if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}
    if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}
  }
  if(phase==='result')Old.finishRun(old);Old.validateState(old);const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.loginRewards,E.starterLoginRewards());
  const projected=structuredClone(migrated);delete projected.loginRewards;if(JSON.stringify(projected.bonds)==='{}')delete projected.bonds;if(JSON.stringify(projected.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete projected.season;projected.version=31;assert.deepEqual(projected,old);assert.deepEqual(old,before);assert.deepEqual(copy(migrated),migrated);
});
