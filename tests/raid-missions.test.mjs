import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES,DAILY} from '../js/data.mjs';
import {raidMissionsPanel,raidQuestLink,raidResult,raidRewardText} from '../js/raid-ui.mjs';
import {questReady,gameDock} from '../js/game-ui.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const wallet=s=>({gold:s.gold,tickets:s.tickets,dust:s.dust,essence:s.armory.essence});
function account(){
  const s=E.createState();s.welcome=true;
  for(const h of HEROES)s.owned[h.id]={level:50,copies:0,awaken:0};
  E.autoRaidTeams(s);return s;
}
function start(s,tier=1){
  E.startRaid(s,tier,42);
  for(const team of s.run.raid.teams)for(const h of team.heroes)h.atk=100000;
  for(const h of s.run.heroes)h.atk=100000;
}
function stage(s,{rounds=1,casualty=false}={}){
  s.run.battle.round=rounds;
  if(casualty)s.run.heroes[2].hp=0;
  let count=0;
  while(s.run.phase==='battle'&&count++<30){
    const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),e=r.battle.enemies.find(e=>e.hp>0);
    if(h)E.playerAction(s,h.id,e.id,false,e.kind==='boss'?E.recommendedBossPart(r):null);else E.enemyTurn(s);
  }
  assert.notEqual(s.run.phase,'battle');
}
function win(s,tier=1,{rounds=[1,1,1],casualty=-1}={}){
  start(s,tier);
  for(let i=0;i<3;i++){stage(s,{rounds:rounds[i],casualty:casualty===i});if(i<2){E.dismissVictory(s);E.continueRaid(s,i);}}
  assert.equal(s.run.summary.reason,'victory');copy(s);return s;
}
function old17(s){
  const old=structuredClone(s);old.version=17;delete old.raids.dragon;
  old.raids.records=old.raids.records.map(({clears,bestRounds})=>({clears,bestRounds}));
  return old;
}

test('raid mission defaults have independent claim ledgers and no reward is initially ready',()=>{
  const a=E.createState(),b=E.createState();
  assert.equal(E.SAVE_VERSION,34);assert.deepEqual(E.readyRaidMissions(a),[]);assert.equal(questReady(a),false);
  a.raids.records[0].claimed.push('first');assert.deepEqual(a.raids.records[1].claimed,[]);assert.deepEqual(b.raids.records[0].claimed,[]);
  for(const tier of [1,2,3])for(const m of E.RAID_MISSIONS){const status=E.raidMissionStatus(b,tier,m.id);assert.equal(status.complete,false);assert.equal(status.claimed,false);}
  copy(b);
});

test('only a full winning raid unlocks first clear, speed and full-party bonuses; no bonus is paid automatically',()=>{
  const s=account(),before=wallet(s);win(s);
  assert.deepEqual(E.readyRaidMissions(s),['first','swift','united'].map(id=>({tier:1,id})));
  assert.deepEqual(wallet(s),{...before,gold:before.gold+350,essence:4});
  assert.equal(s.raids.records[0].fullParty,true);assert.deepEqual(s.raids.records[0].claimed,[]);
  assert.deepEqual(E.victoryRewards(s.run).gold,350);assert.match(raidResult(s),/3 phần thưởng nhiệm vụ đang chờ/);
});

test('five and fifteen actual clears unlock their own milestones without needing to claim earlier ones',()=>{
  const s=account();
  for(let n=1;n<=15;n++){
    win(s);assert.equal(E.raidMissionStatus(s,1,'veteran').complete,n>=5);assert.equal(E.raidMissionStatus(s,1,'master').complete,n>=15);
  }
  assert.equal(s.raids.records[0].clears,15);assert.equal(E.readyRaidMissions(s).length,5);
  E.claimRaidMission(s,1,'master');assert.equal(E.raidMissionStatus(s,1,'first').ready,true);copy(s);
});

test('speed uses the sum of all three reports with an inclusive 12-round boundary and retains the best clear',()=>{
  const s=account();win(s,1,{rounds:[4,4,5]});assert.equal(E.raidMissionStatus(s,1,'swift').complete,false);assert.equal(s.raids.records[0].bestRounds,13);
  win(s,1,{rounds:[4,4,4]});assert.equal(E.raidMissionStatus(s,1,'swift').ready,true);E.claimRaidMission(s,1,'swift');
  win(s,1,{rounds:[4,5,5]});assert.equal(s.raids.records[0].bestRounds,12);assert.equal(E.raidMissionStatus(s,1,'swift').claimed,true);copy(s);
});

test('full-party achievement needs all three teams in the same completed raid and stays earned after a later casualty',()=>{
  const s=account();
  for(const casualty of [0,1,2]){win(s,1,{casualty});assert.equal(s.raids.records[0].fullParty,false);assert.equal(E.raidMissionStatus(s,1,'united').ready,false);}
  win(s);assert.equal(s.raids.records[0].fullParty,true);win(s,1,{casualty:1});assert.equal(s.raids.records[0].fullParty,true);copy(s);
});

test('a real healing skill may revive a fallen member before victory and still earn the full-party goal',()=>{
  const s=account();s.raids.teams=[['rook','lumi','aerin'],['ember','bryn','raiden'],['thorne','seraph','astra']];start(s);
  s.run.heroes[0].hp=0;E.playerAction(s,'lumi','enemy0',true);assert.ok(s.run.heroes[0].hp>0);stage(s);
  for(let i=0;i<2;i++){E.dismissVictory(s);E.continueRaid(s,i);stage(s);}
  assert.ok(s.run.raid.reports.every(p=>p.survivors===3));assert.equal(E.raidMissionStatus(s,1,'united').ready,true);copy(s);
});

test('retreat, defeat and stage handoff do not grant partial mission credit',()=>{
  for(const cleared of [0,1,2])for(const reason of ['retreat','defeat']){
    const s=account(),records=structuredClone(s.raids.records);start(s);
    for(let i=0;i<cleared;i++){stage(s);E.dismissVictory(s);if(i<cleared-1)E.continueRaid(s,i);}
    assert.deepEqual(s.raids.records,records);assert.deepEqual(E.readyRaidMissions(s),[]);
    if(reason==='defeat'){
      if(s.run.phase==='relay')E.continueRaid(s,s.run.raid.stage);
      for(const h of s.run.heroes)h.hp=0;E.enemyTurn(s);
    }else E.finishRun(s);
    assert.deepEqual(s.raids.records,records);copy(s);
  }
});

test('each difficulty has independent first-clear credit, exact bonuses and claim history',()=>{
  const s=account();
  for(let tier=1;tier<=3;tier++){
    win(s,tier);const before=wallet(s),expected=E.raidMissionStatus(s,tier,'first').reward;
    const prize=E.claimRaidMission(s,tier,'first');assert.equal(prize.count,1);assert.deepEqual(prize.reward,expected);
    for(const key of Object.keys(before))assert.equal(wallet(s)[key],before[key]+expected[key],`${tier}/${key}`);
    assert.deepEqual(s.raids.records[tier-1].claimed,['first']);copy(s);
  }
  assert.equal(E.readyRaidMissions(s).length,6);
});

test('single claims reject repeated taps, invalid difficulty, unknown identifiers and unfinished goals atomically',()=>{
  const s=win(account());E.claimRaidMission(s,1,'first');
  for(const [tier,id] of [[1,'first'],[1,'master'],[2,'first'],[0,'first'],[4,'first'],['1','swift'],[1,'constructor'],[1,'__proto__'],[1,null]]){
    const before=structuredClone(s);assert.throws(()=>E.claimRaidMission(s,tier,id));assert.deepEqual(s,before);
  }
  copy(s);
});

test('claim-all sums only ready unclaimed goals for one tier and cannot repeat after export/reload',()=>{
  let s=account();win(s);win(s,2);E.claimRaidMission(s,1,'first');
  const before=wallet(s),expected={tickets:4,gold:600,dust:120,essence:0},tier2=structuredClone(s.raids.records[1]);
  assert.deepEqual(E.claimAllRaidMissions(s,1),{count:2,reward:expected});
  for(const key of Object.keys(before))assert.equal(wallet(s)[key],before[key]+expected[key]);
  assert.deepEqual(s.raids.records[1],tier2);s=copy(s);const saved=structuredClone(s);
  assert.throws(()=>E.claimAllRaidMissions(s,1));assert.deepEqual(s,saved);assert.equal(E.readyRaidMissions(s).length,3);
});

test('claiming bonuses never rewrites battle snapshots, RNG, the chest, inventory or normal raid payouts',()=>{
  const s=win(account()),run=structuredClone(s.run),items=structuredClone(s.inventory),gearId=s.nextGearId;
  E.claimAllRaidMissions(s,1);assert.deepEqual(s.run,run);assert.deepEqual(s.inventory,items);assert.equal(s.nextGearId,gearId);
  for(let n=0;n<3;n++){const before=wallet(s);if(s.run.victory?.stage!=='done')E.advanceVictory(s);copy(s);assert.deepEqual(wallet(s),before);}
});

test('all four bonus currencies enforce the save cap before any claim or resource mutation',()=>{
  for(const key of ['tickets','gold','dust','essence']){
    const s=win(account());if(key==='essence')s.armory.essence=1e9;else s[key]=1e9;
    const before=structuredClone(s);assert.throws(()=>E.claimAllRaidMissions(s,1),/giới hạn/);assert.deepEqual(s,before);
    const id=key==='dust'?'united':'first';assert.throws(()=>E.claimRaidMission(s,1,id),/giới hạn/);assert.deepEqual(s,before);copy(s);
  }
});

test('an exact-cap claim succeeds and full gear storage cannot swallow mission rewards',()=>{
  const s=account();while(s.inventory.length<E.GEAR_LIMIT)E.dropGearAtRarity(s,()=>.5,'R');win(s);
  const sum=E.readyRaidMissions(s).reduce((n,v)=>n+E.raidMissionStatus(s,v.tier,v.id).reward.tickets,0);s.tickets=1e9-sum;
  const items=structuredClone(s.inventory),dust=s.dust;E.claimAllRaidMissions(s,1);
  assert.equal(s.tickets,1e9);assert.equal(s.dust,dust+120);assert.deepEqual(s.inventory,items);copy(s);
});

test('practice cannot pay mission bonuses from copied account achievements',()=>{
  const source=win(account()),s=E.createTrainingState(source),before=structuredClone(s);
  assert.throws(()=>E.claimRaidMission(s,1,'first'),/phòng thử/);assert.deepEqual(s,before);
  assert.throws(()=>E.claimAllRaidMissions(s,1),/phòng thử/);assert.deepEqual(s,before);
});

test('v17 migration retroactively counts stored clears and best rounds without issuing or claiming rewards',()=>{
  const s=account();s.raids.records=[{clears:15,bestRounds:12},{clears:5,bestRounds:13},{clears:1,bestRounds:20}];s.version=17;delete s.raids.dragon;
  const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(wallet(m),wallet(s));
  assert.equal(E.readyRaidMissions(m).length,7);assert.ok(m.raids.records.every(v=>v.fullParty===false&&v.claimed.length===0));
  assert.deepEqual(m.raids.teams,s.raids.teams);assert.deepEqual(m.raids.fronts,s.raids.fronts);assert.deepEqual(copy(m),m);
});

test('v17 saved winning reports provide full-party evidence only for their own difficulty',()=>{
  const s=account();win(s);win(s,2);const old=old17(s),before=structuredClone(old),m=copy(old);
  assert.deepEqual(old,before);assert.deepEqual(m.run,old.run);assert.equal(m.raids.records[0].fullParty,false);assert.equal(m.raids.records[1].fullParty,true);assert.equal(m.raids.records[2].fullParty,false);
  const paid=E.claimAllRaidMissions(m,2);assert.equal(paid.count,3);copy(m);
  win(s,2,{casualty:1});const casualty=copy(old17(s));assert.equal(casualty.raids.records[1].fullParty,false);
});

test('v17 active battle, handoff and failed journeys retain snapshots and receive no speculative achievement',()=>{
  for(const phase of ['battle','relay','retreat','defeat']){
    const s=account();start(s);if(phase==='relay'){stage(s);E.dismissVictory(s);}
    if(phase==='retreat')E.finishRun(s);if(phase==='defeat'){for(const h of s.run.heroes)h.hp=0;E.enemyTurn(s);}
    const old=old17(s),m=copy(old);assert.deepEqual(m.run,old.run);assert.deepEqual(wallet(m),wallet(old));assert.deepEqual(E.readyRaidMissions(m),[]);assert.deepEqual(copy(m),m);
    if(phase==='relay'){E.continueRaid(m,0);stage(m);E.dismissVictory(m);E.continueRaid(m,1);stage(m);assert.equal(m.raids.records[0].fullParty,true);copy(m);}
  }
});

test('v17 migration rejects malformed or prepopulated mission data rather than overwriting it',()=>{
  for(const alter of [s=>delete s.raids,s=>s.raids.records.pop(),s=>s.raids.records[0].clears=-1,s=>s.raids.records[0].bestRounds=3,s=>s.raids.records[0].claimed=[],s=>s.raids.records[0].fullParty=true,s=>s.raids.records[0]={clears:0,other:null}]){
    const s=old17(account());alter(s);const before=structuredClone(s);assert.throws(()=>copy(s));assert.deepEqual(s,before);
  }
});

test('v18 validates boolean evidence and a unique earned-only claim ledger without repairing malformed saves',()=>{
  const earned=win(account());
  for(const alter of [s=>delete s.raids.records[0].claimed,s=>delete s.raids.records[0].fullParty,s=>s.raids.records[0].fullParty=1,s=>s.raids.records[0].fullParty=false,s=>s.raids.records[0].claimed=['first','first'],s=>s.raids.records[0].claimed=['constructor'],s=>s.raids.records[0].claimed=['master'],s=>s.raids.records[0].claimed='first',s=>s.raids.records[2].fullParty=true,s=>s.raids.records[1].claimed=['first']]){
    const s=structuredClone(earned);alter(s);assert.throws(()=>copy(s));
  }
  const slow=win(account(),1,{rounds:[5,5,5]});slow.raids.records[0].claimed=['swift'];assert.throws(()=>copy(slow));
});

test('neutral compatibility projection removes only exact empty v17, v18 or v19 raid defaults',()=>{
  for(const s of [E.createState(),old17(E.createState())])assert.equal(Object.hasOwn(withoutCombatReport(s),'raids'),false);
  for(const alter of [s=>s.raids.records[0].fullParty=true,s=>s.raids.records[0].claimed=['first'],s=>s.raids.records[0].clears=1,s=>s.raids.teams[0][0]='rook',s=>s.raids.records[0].extra=0]){
    const s=E.createState();alter(s);assert.deepEqual(withoutCombatReport(s).raids,s.raids);
  }
});

test('mission views show five goals, locked rewards and thirty-account progress without mutating state',()=>{
  const s=account(),before=structuredClone(s),locked=raidMissionsPanel(s,3);
  assert.equal((locked.match(/data-action="raid-claim"/g)||[]).length,5);assert.match(locked,/QUÀ LẦN ĐẦU/);assert.match(locked,/8<\/b> vé/);assert.match(locked,/Chưa mở/);assert.match(locked,/Mục tiêu ≤12/);assert.match(locked,/Có tính hồi sinh/);assert.match(raidQuestLink(s),/0\/30/);assert.deepEqual(s,before);
  win(s);s.daily.claimed=DAILY.map(q=>q.id);const won=structuredClone(s),ready=raidMissionsPanel(s);
  assert.match(ready,/Nhận tất cả \(3\)/);assert.match(ready,/Kỷ lục 3 vòng/);assert.equal(questReady(s),true);assert.match(gameDock(s,'quests'),/Có thưởng để nhận/);assert.deepEqual(s,won);
  E.claimAllRaidMissions(s,1);assert.equal(E.readyRaidMissions(s).length,0);assert.equal(questReady(s),true);for(const a of E.readyAchievements(s))E.claimAchievement(s,a.id);assert.equal(questReady(s),false);assert.match(raidMissionsPanel(s),/3\/5 phần thưởng đã nhận/);assert.match(raidQuestLink(s),/3\/30/);
});

test('mission reward views return detached prizes and preserve Vietnamese currency names',()=>{
  const s=account(),a=E.raidMissionStatus(s,1,'first');a.reward.tickets=999;
  assert.equal(E.raidMissionStatus(s,1,'first').reward.tickets,3);
  assert.equal(raidRewardText({tickets:3,gold:500,dust:0,essence:4}),'3 vé triệu hồi · 500 vàng · 4 Tinh hoa boss');
});
