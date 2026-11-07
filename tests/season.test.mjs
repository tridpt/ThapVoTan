import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/season-legacy-v1.43.0/js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {heroArt,enemyArt} from '../js/art.mjs';
import {seasonEntry,seasonPage,seasonRunBanner,seasonResultPage,seasonAuraMarkup} from '../js/season-ui.mjs';
import {victoryPage} from '../js/victory-ui.mjs';
import {T,heroModel,enemyModel,animateModel,arenaCamera,disposeScene} from '../js/models3d.mjs';
import {attachBossVisual,readBossVisual,syncBossVisual,animateBossVisual} from '../js/boss3d.mjs';
import {lobbyKey,createLobbyScene} from '../js/lobby3d.mjs';
import {victoryKey,createVictoryScene} from '../js/victory3d.mjs';
import {towerMapKey,createTowerMapScene} from '../js/tower-map3d.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const atomic=(s,fn,pattern)=>{const before=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,before);};
const day=(date,n)=>{const d=new Date(date);d.setDate(d.getDate()+n);return d;};
const state=(date=new Date())=>{const s=E.createState();s.welcome=true;E.observeSeason(s,date,true);return s;};
const fund=(s,n=10000)=>{s.season.wallet=n;s.season.current.earned=n;return s;};
const buy=(s,id,date=new Date())=>E.buySeasonItem(s,id,E.seasonReceipt(s,date),date);
function battle(curse='blood',boss=false){
  const today=new Date(),index=E.SEASON_CURSES.findIndex(c=>c.id===curse),s=state(day(today,-index));
  E.startSeasonRun(s,42,today);
  if(boss)Object.assign(s.run,{floor:5,cleared:4,routes:['boss']});
  E.chooseRoute(s,0);return s;
}
function win(s,skill=false){
  const r=s.run;for(const h of r.heroes)h.atk=100000;
  let n=0;while(r.phase==='battle'&&n++<20){
    const h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id));
    if(h){if(skill)h.energy=100;E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id,skill);}else E.enemyTurn(s);
  }
  assert.notEqual(r.phase,'battle');
}
function boss(){
  const s=battle('blood',true),r=s.run,e=r.battle.enemies[0];r.buffs=[];r.relics=[];r.resonances=[];r.pet=null;
  for(const h of r.heroes)Object.assign(h,{atk:25,def:0,maxHp:10000,hp:9000,energy:70,shield:0,loadout:null,talents:null,awaken:0});
  Object.assign(e,{maxHp:100000,hp:100000,atk:100,def:0});r.battle.bossState.parts=E.createBossParts(e);return s;
}
const neutral=s=>{const c=structuredClone(s);c.run.mode='normal';delete c.run.season;return c;};

test('the personal event starts explicitly, has independent defaults, and pure status does not change RNG or account',()=>{
  const s=E.createState(),other=E.createState(),before=structuredClone(s),date=new Date(2026,9,24,12);
  assert.equal(E.SAVE_VERSION,34);assert.deepEqual(s.season,E.starterSeason());
  for(let i=0;i<4;i++){const p=E.seasonStatus(s,date);assert.equal(p.day,1);assert.equal(p.cycle,0);assert.equal(p.remaining,14);assert.equal(p.curse.id,'blood');assert.equal(p.end,'2026-11-06');seasonEntry(s,date);seasonPage(s,date);}
  assert.equal(E.observeSeason(s,date),false);assert.deepEqual(s,before);assert.equal(E.observeSeason(s,date,true),true);assert.equal(E.observeSeason(s,date,true),false);assert.equal(s.season.anchor,'2026-10-24');assert.deepEqual(other.season,E.starterSeason());copy(s);
});

for(const [start,next] of [['2026-10-31','2026-11-01'],['2026-12-31','2027-01-01'],['2028-02-28','2028-02-29'],['2028-02-29','2028-03-01']])test(`event calendar advances across ${start} to ${next}`,()=>{
  const a=new Date(start+'T23:59:59'),b=new Date(next+'T00:00:00'),s=state(a);s.season.current.battles=s.season.current.daily.battles=2;
  const oldStamp=E.seasonStatus(s,a).stamp;assert.equal(E.seasonStatus(s,b).day,2);assert.equal(s.season.current.daily.day,1);
  atomic(s,()=>E.claimSeasonMission(s,'battles',oldStamp,b),/ngày|mùa/);E.observeSeason(s,b);assert.equal(s.season.current.battles,2);assert.equal(s.season.current.daily.battles,0);copy(s);
});

for(const [zone,start] of [['America/New_York','2026-03-07'],['America/New_York','2026-10-31'],['Asia/Bangkok','2026-10-31']])test(`14 calendar days survive local clock changes in ${zone} from ${start}`,()=>{
  const url=new URL('../js/engine.mjs',import.meta.url).href;
  const source=`import assert from 'node:assert/strict';import * as E from ${JSON.stringify(url)};const a=new Date('${start}T23:30:00'),s=E.createState();E.observeSeason(s,a,true);for(let n=0;n<29;n++){const d=new Date(a);d.setDate(d.getDate()+n);d.setHours(0,1,0,0);const p=E.seasonStatus(s,d);assert.equal(p.cycle,Math.floor(n/14));assert.equal(p.day,n%14+1);E.observeSeason(s,d);E.validateState(s);}process.stdout.write('ok');`;
  assert.equal(execFileSync(process.execPath,['--input-type=module','-e',source],{env:{...process.env,TZ:zone},encoding:'utf8'}),'ok');
});

test('season rollover resets daily goals, milestones and shop stock but preserves seals, fragments and cosmetics',()=>{
  const date=new Date(2026,9,24,12),s=fund(state(date));s.season.current.battles=s.season.current.daily.battles=2;
  E.claimSeasonMission(s,'battles',E.seasonStatus(s,date).stamp,date);E.claimSeasonMilestone(s,'seal-50',E.seasonStatus(s,date).stamp,date);
  buy(s,'astra-fragment',date);buy(s,'eclipse-aura',date);E.setSeasonAura(s,true);const wallet=s.season.wallet;
  E.observeSeason(s,day(date,13));assert.equal(E.seasonStatus(s,day(date,13)).day,14);
  E.observeSeason(s,day(date,14));assert.equal(s.season.current.cycle,1);assert.equal(s.season.current.daily.day,1);assert.equal(s.season.current.earned,0);assert.equal(s.season.current.battles,0);assert.deepEqual(s.season.current.claimed,[]);assert.deepEqual(s.season.current.purchases,{});assert.equal(s.season.wallet,wallet);assert.equal(s.season.fragments.astra,5);assert.equal(E.seasonAuraActive(s),true);copy(s);
});

test('clock rollback blocks reward and purchase mutations until the last recorded calendar date returns',()=>{
  const date=new Date(2026,9,24,12),s=fund(state(date));s.season.current.battles=s.season.current.daily.battles=2;
  const stamp=E.seasonStatus(s,date).stamp;E.observeSeason(s,day(date,1));const before=structuredClone(s);
  assert.equal(E.seasonStatus(s,date).clockSkew,true);assert.equal(E.observeSeason(s,date),false);assert.deepEqual(s,before);
  atomic(s,()=>E.claimSeasonMission(s,'battles',stamp,date),/Ngày.*lùi/);atomic(s,()=>buy(s,'summon-ticket',date));atomic(s,()=>E.startSeasonRun(s,42,date),/Ngày.*lùi/);
  assert.equal(E.seasonStatus(s,day(date,1)).clockSkew,false);buy(s,'summon-ticket',day(date,1));copy(s);
});

test('event snapshots keep their curse through midnight, reload and later season rollover',()=>{
  const date=new Date(),s=state(date);E.startSeasonRun(s,42,date);const snap=structuredClone(s.run.season),seed=s.run.seed;
  E.observeSeason(s,day(date,1));assert.equal(E.seasonStatus(s,day(date,1)).curse.id,'iron');assert.deepEqual(s.run.season,snap);assert.equal(s.run.seed,seed);assert.equal(E.seasonCurse(copy(s).run).id,'blood');
  E.observeSeason(s,day(date,14));assert.deepEqual(s.run.season,snap);assert.equal(E.seasonCurse(copy(s).run).id,'blood');
});

test('the real five-floor route grants seals and completion once, with no tower records or contract changes',()=>{
  const s=state();E.startSeasonRun(s,42);const r=s.run;
  assert.equal(r.map,null);assert.equal(E.contractEligible(r),false);assert.equal(r.anomalyRules,undefined);assert.equal(r.eliteRules,undefined);
  while(r.phase!=='result'){
    copy(s);assert.deepEqual(r.routes,[...E.SEASON_ROUTES[r.floor-1]]);E.chooseRoute(s,0);
    if(r.phase==='battle'){win(s,true);const earned=s.season.wallet;atomic(s,()=>E.playerAction(s,'rook','enemy0'));E.dismissVictory(s);E.dismissVictory(s);assert.equal(s.season.wallet,earned);}
    if(r.phase==='blessing'){copy(s);E.selectBlessing(s,r.choices[0]);}
    copy(s);
  }
  assert.equal(r.floor,5);assert.equal(r.cleared,5);assert.equal(r.summary.reason,'victory');assert.equal(r.season.seals,24);assert.equal(s.season.wallet,24);assert.equal(s.season.current.battles,4);assert.equal(s.season.current.clears,1);assert.ok(s.season.current.skills>=4);assert.equal(s.best,0);
  const p=E.seasonStatus(s);assert.ok(p.missions.every(m=>m.ready));for(const m of p.missions)E.claimSeasonMission(s,m.id,p.stamp);assert.equal(s.season.wallet,124);assert.match(seasonResultPage(s),/Ngai nguyền đã sụp đổ/);copy(s);
});

test('elite, rest and treasure alternatives pay their actual route rewards and never grant noncombat seals',()=>{
  const s=state();E.startSeasonRun(s,42);const r=s.run;
  for(let f=1;f<=5;f++){
    const n=f===5?0:1,before=s.season.wallet;E.chooseRoute(s,n);
    if(r.phase==='battle'){win(s);assert.equal(s.season.wallet-before,f===5?15:5);E.dismissVictory(s);}
    else assert.equal(s.season.wallet,before);
    if(r.phase==='blessing')E.selectBlessing(s,r.choices[0]);copy(s);
  }
  assert.equal(r.season.seals,30);assert.equal(s.season.current.battles,4);assert.equal(s.season.current.clears,1);
});

test('invalid departure and active expeditions leave event activation, funds and combat untouched',()=>{
  const s=E.createState();E.startRun(s,42);atomic(s,()=>E.startSeasonRun(s,42));assert.equal(s.season.anchor,null);
  const away=E.createState();E.dispatchExpedition(away,'mist-path','ember',0);away.team=['ember','aerin','lumi'];atomic(away,()=>E.startSeasonRun(away,42));assert.equal(away.season.anchor,null);
});

test('normal gameplay, retreat, defeat and practice cannot add event tasks or seals',()=>{
  const s=state();E.startRun(s,42);E.chooseRoute(s,0);const before=structuredClone(s.season);win(s,true);assert.deepEqual(s.season,before);
  for(const reason of ['retreat','defeat']){const n=state();E.startSeasonRun(n,42);E.chooseRoute(n,0);E.finishRun(n,reason);assert.equal(n.season.wallet,0);assert.equal(n.season.current.clears,0);copy(n);}
  const practice=E.createTrainingState(s),original=structuredClone(s),ledger=structuredClone(practice.season);win(practice,true);assert.deepEqual(practice.season,ledger);atomic(practice,()=>buy(practice,'summon-ticket'),/Phòng thử/);assert.equal(E.observeSeason(practice,day(new Date(),1),true),false);atomic(practice,()=>E.claimSeasonMission(practice,'battles','stale'),/Phòng thử/);assert.deepEqual(s,original);
});

test('an expired run finishes with its original rules but never credits the current season',()=>{
  const date=new Date(),s=state(day(date,-14));E.startSeasonRun(s,42,day(date,-14));Object.assign(s.run,{floor:5,cleared:4,routes:['boss']});E.chooseRoute(s,0);win(s,true);
  assert.equal(s.run.summary.reason,'victory');assert.equal(s.run.season.curse,'blood');assert.equal(s.season.current.cycle,1);assert.equal(s.season.current.skills,0);assert.equal(s.season.current.battles,0);assert.equal(s.season.current.clears,0);assert.equal(s.season.wallet,0);assert.equal(s.run.season.seals,0);copy(s);
});

test('blood and void multiply direct skill damage while basic attacks preserve the same RNG',()=>{
  for(const id of ['blood','void']){
    for(const skill of [false,true]){
      const s=battle(id),r=s.run;for(const e of r.battle.enemies)e.hp=e.maxHp=100000;for(const h of r.heroes)h.energy=100;const plain=neutral(s);
      const a=E.playerAction(s,'aerin','enemy0',skill).find(e=>e.target==='enemy0'),b=E.playerAction(plain,'aerin','enemy0',skill).find(e=>e.target==='enemy0');
      assert.equal(r.seed,plain.run.seed);if(skill)assert.ok(Math.abs(a.value-b.value*E.seasonSkillMultiplier(r))<=1);else assert.equal(a.value,b.value);copy(s);
    }
  }
});

test('blood healing penalty applies to revival, ordinary healing and rest without altering non-event healing',()=>{
  const s=battle(),r=s.run;r.resonances=[];for(const h of r.heroes){h.hp=h.id==='aerin'?0:1;h.energy=100;}const plain=neutral(s);
  const events=E.playerAction(s,'lumi','enemy0',true),normal=E.playerAction(plain,'lumi','enemy0',true);
  for(let i=0;i<events.length;i++)assert.ok(Math.abs(events[i].value-normal[i].value*.75)<=1);assert.ok(r.heroes[1].hp>0);
  const resting=state();E.startSeasonRun(resting,42);Object.assign(resting.run,{floor:3,cleared:2,routes:['rest','elite']});for(const h of resting.run.heroes)h.hp=0;const hp=resting.run.heroes.map(h=>h.maxHp);E.chooseRoute(resting,0);resting.run.heroes.forEach((h,i)=>assert.equal(h.hp,Math.round(Math.round(hp[i]*.35)*.75)));copy(resting);
});

test('blood applies its healing penalty to the lantern resurrection and records the actual recovery',()=>{
  const s=boss(),r=s.run;r.relics=['lantern'];r.heroes[0].hp=1;r.battle.bossState.move='strike';const plain=neutral(s),events=E.enemyTurn(s),normal=E.enemyTurn(plain),revive=events.find(e=>e.heal),old=normal.find(e=>e.heal);assert.ok(revive);assert.equal(revive.target,'rook');assert.ok(Math.abs(revive.value-old.value*.75)<=1);assert.equal(r.heroes[0].hp,revive.value);assert.equal(r.relicUsed.lantern,true);assert.equal(r.battle.statistics.rows.effects.healing,revive.value);copy(s);
});

test('victory loot displays the seals actually credited, including zero when the wallet is capped or the run has expired',()=>{
  for(const mode of ['active','capped','expired']){
    const s=battle();if(mode==='capped')s.season.wallet=1e9;if(mode==='expired')E.observeSeason(s,day(new Date(),14));win(s);E.advanceVictory(s);assert.equal(E.victoryRewards(s.run).seasonSeals,mode==='active'?3:0);assert.equal(s.run.lastReward.seasonSeals,mode==='active'?3:0);const page=victoryPage(s);assert.match(page,/LỜI NGUYỀN THÁP/);if(mode==='active')assert.match(page,/Ấn hắc nguyệt/);else assert.doesNotMatch(page,/Ấn hắc nguyệt/);copy(s);
  }
});

test('iron increases enemy HP and ally shields and gives ten additional basic-attack energy',()=>{
  const s=battle('iron'),r=s.run,plain=neutral(s);assert.equal(r.battle.enemies[0].maxHp,120);for(const h of r.heroes)h.energy=0;for(const h of plain.run.heroes)h.energy=0;
  E.playerAction(s,'aerin','enemy0');E.playerAction(plain,'aerin','enemy0');assert.equal(r.heroes[1].energy-plain.run.heroes[1].energy,10);
  r.heroes[0].energy=plain.run.heroes[0].energy=100;E.playerAction(s,'rook','enemy0',true);E.playerAction(plain,'rook','enemy0',true);assert.ok(Math.abs(r.heroes[2].shield-plain.run.heroes[2].shield*1.35)<=1);copy(s);
});

test('void adds opening energy and incoming damage without changing enemy targeting RNG',()=>{
  const s=battle('void'),r=s.run;assert.equal(r.heroes[0].energy,100);assert.equal(battle('blood').run.heroes[0].energy,90);const plain=neutral(s);for(const h of [...r.heroes,...plain.run.heroes])Object.assign(h,{hp:10000,maxHp:10000,def:0});
  const events=E.enemyTurn(s).filter(e=>!e.heal),normal=E.enemyTurn(plain).filter(e=>!e.heal);assert.equal(events.length,normal.length);for(let i=0;i<events.length;i++){assert.equal(events[i].target,normal[i].target);assert.ok(Math.abs(events[i].value-normal[i].value*1.15)<=1);}assert.equal(r.seed,plain.run.seed);copy(s);
});

test('the curse king telegraphs an energy drain followed by shielded AoE and stronger phase-two damage',()=>{
  const s=boss(),r=s.run,bs=r.battle.bossState;assert.equal(bs.id,'curse-king');assert.equal(E.bossForRun(r).id,'curse-king');
  E.enemyTurn(s);assert.equal(bs.move,'charge');const energies=r.heroes.map(h=>h.energy);assert.equal(E.beginTimingGuard(s),null);const charge=E.enemyTurn(s);assert.equal(bs.move,'quake');assert.equal(charge.length,0);assert.deepEqual(r.heroes.map(h=>h.energy),energies.map(n=>n-15));copy(s);
  const phase2=structuredClone(s);phase2.run.battle.bossState.phase=2;const events=E.enemyTurn(s),strong=E.enemyTurn(phase2);assert.equal(events.length,3);assert.ok(strong.every((e,i)=>e.value>events[i].value));assert.equal(bs.move,'strike');assert.equal(r.battle.enemies[0].shield,8000);assert.equal(E.bossInfo(phase2.run).phase,2);copy(s);copy(phase2);
});

test('two damaging skills interrupt the curse king; healing alone never adds stagger',()=>{
  const s=boss(),r=s.run,bs=r.battle.bossState;bs.move='charge';for(const h of r.heroes)h.energy=100;
  E.playerAction(s,'lumi','enemy0',true);assert.equal(bs.stagger,0);E.playerAction(s,'rook','enemy0',true);assert.equal(bs.stagger,1);E.playerAction(s,'aerin','enemy0',true);assert.equal(bs.move,'stunned');const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);assert.equal(bs.move,'strike');assert.equal(s.season.current.skills,3);copy(s);
});

test('freezing or breaking the crown interrupts the boss while arm/core breaks retain their existing effects',()=>{
  for(const method of ['freeze','head','arms','core']){
    const s=boss(),r=s.run,e=r.battle.enemies[0],bs=r.battle.bossState;bs.move='quake';
    if(method==='freeze'){e.freeze=1;E.enemyTurn(s);assert.equal(bs.move,'strike');assert.equal(e.shield,0);}
    else{r.heroes[0].atk=40000;E.playerAction(s,'rook','enemy0',false,method);assert.equal(bs.parts[method].hp,0);assert.ok(e.hp>0);if(method==='head'){const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);}if(method==='arms')assert.equal(E.bossAttackMultiplier(r),.8);if(method==='core')assert.equal(E.bossDirectMultiplier(r),1.25);}
    copy(s);
  }
});

test('the curse king supports saved timing-guard receipts, half damage and one perfect-guard counter',()=>{
  const s=boss();s.run.battle.bossState.move='quake';const missed=structuredClone(s),receipt=E.beginTimingGuard(s);assert.equal(receipt.boss,'curse-king');assert.deepEqual(copy(s),s);
  const events=E.enemyTurn(s,{...receipt,grade:'perfect'}),normal=E.enemyTurn(missed);events.forEach((e,i)=>assert.ok(Math.abs(e.value-normal[i].value*.5)<=1));assert.ok(E.counterOpportunity(s.run));copy(s);
  const counter=E.counterOpportunity(s.run),skills=s.season.current.skills;E.counterAction(s,'rook','enemy0',counter);assert.equal(E.counterOpportunity(s.run),null);assert.equal(s.season.current.skills,skills);atomic(s,()=>E.counterAction(s,'rook','enemy0',counter));copy(s);
});

test('daily missions and earned-seal milestones are atomic, independent and cannot be claimed twice',()=>{
  const s=state(),c=s.season.current;c.battles=c.daily.battles=3;c.skills=c.daily.skills=4;c.clears=c.daily.clears=1;const stamp=E.seasonStatus(s).stamp;
  for(const id of ['battles','skills','clears']){E.claimSeasonMission(s,id,stamp);atomic(s,()=>E.claimSeasonMission(s,id,stamp));}assert.equal(s.season.wallet,100);assert.equal(c.earned,0);assert.equal(s.season.current.earned,100);
  const gold=s.gold,tickets=s.tickets;E.claimSeasonMilestone(s,'seal-50',stamp);assert.equal(s.gold,gold+300);assert.equal(s.tickets,tickets+2);assert.equal(s.season.wallet,100);atomic(s,()=>E.claimSeasonMilestone(s,'seal-50',stamp));atomic(s,()=>E.claimSeasonMilestone(s,'seal-150',stamp));atomic(s,()=>E.claimSeasonMission(s,'constructor',stamp));copy(s);
});

test('stale daily/milestone stamps and capped resource claims never consume the reward',()=>{
  const date=new Date(2026,9,24,12),s=fund(state(date));s.season.current.battles=s.season.current.daily.battles=2;const stamp=E.seasonStatus(s,date).stamp;
  for(const next of [day(date,1),day(date,14)]){atomic(s,()=>E.claimSeasonMission(s,'battles',stamp,next));atomic(s,()=>E.claimSeasonMilestone(s,'seal-50',stamp,next));}
  s.gold=1e9;atomic(s,()=>E.claimSeasonMilestone(s,'seal-50',stamp,date),/giới hạn/);s.gold=800;s.season.wallet=1e9;atomic(s,()=>E.claimSeasonMission(s,'battles',stamp,date),/giới hạn/);s.season.wallet=0;s.season.current.earned=1e9;atomic(s,()=>E.claimSeasonMission(s,'battles',stamp,date),/giới hạn/);copy(s);
});

test('all shop items charge exact costs, consume stock and preserve earned-seal milestone progress',()=>{
  for(const item of E.SEASON_SHOP){
    const s=fund(state()),before=structuredClone(s);const result=buy(s,item.id);assert.equal(result.id,item.id);assert.equal(s.season.wallet,before.season.wallet-item.cost);assert.equal(s.season.current.earned,before.season.current.earned);assert.equal(s.season.current.purchases[item.id],1);
    if(item.kind==='resource')assert.equal(s[item.resource],before[item.resource]+item.amount);if(item.kind==='fragment')assert.equal(s.season.fragments[item.hero],item.amount);if(item.kind==='cosmetic')assert.ok(s.season.cosmetics.includes(item.cosmetic));copy(s);
  }
});

test('shop stock, insufficient seals, unknown items, stale receipts and resource caps fail atomically',()=>{
  const s=fund(state());for(let i=0;i<10;i++)buy(s,'summon-ticket');atomic(s,()=>buy(s,'summon-ticket'),/hết lượt/);atomic(s,()=>buy(s,'constructor'));atomic(s,()=>buy(s,'missing'));
  const stale=E.seasonReceipt(s);buy(s,'forge-dust');atomic(s,()=>E.buySeasonItem(s,'forge-dust',stale),/thay đổi/);
  s.tickets=1e9;const t=fund(state());t.tickets=1e9;atomic(t,()=>buy(t,'summon-ticket'),/giới hạn/);t.season.fragments.astra=1e9;atomic(t,()=>buy(t,'astra-fragment'),/giới hạn/);t.season.wallet=0;atomic(t,()=>buy(t,'forge-dust'),/Chưa đủ/);copy(t);
});

test('shop confirmation expires at midnight/rollover and a new season replenishes stock',()=>{
  const date=new Date(2026,9,24,12),s=fund(state(date));const receipt=E.seasonReceipt(s,date);
  atomic(s,()=>E.buySeasonItem(s,'summon-ticket',receipt,day(date,1)),/thay đổi/);atomic(s,()=>E.buySeasonItem(s,'summon-ticket',receipt,day(date,14)),/thay đổi/);
  for(let i=0;i<12;i++)buy(s,'astra-fragment',date);assert.equal(s.season.fragments.astra,60);atomic(s,()=>buy(s,'astra-fragment',date));buy(s,'astra-fragment',day(date,14));assert.equal(s.season.current.purchases['astra-fragment'],1);assert.equal(s.season.fragments.astra,65);copy(s);
});

for(const id of ['astra','nyx'])test(`60 ${id} fragments fuse a new SSR or one duplicate while preserving pity, team and active combat`,()=>{
  const s=fund(state());E.startRun(s,42);E.chooseRoute(s,0);s.season.fragments[id]=120;const before=structuredClone(s),receipt=E.seasonReceipt(s);assert.equal(E.fuseSeasonHero(s,id,receipt).isNew,true);assert.deepEqual(s.owned[id],{level:1,copies:0,awaken:0});assert.equal(s.season.fragments[id],60);assert.deepEqual(s.run,before.run);assert.deepEqual(s.team,before.team);assert.deepEqual(s.summoning,before.summoning);assert.equal(s.totalSummons,before.totalSummons);assert.equal(s.pity,before.pity);atomic(s,()=>E.fuseSeasonHero(s,id,receipt),/thay đổi/);
  s.owned[id]={level:20,copies:3,awaken:2};const old=structuredClone(s);assert.equal(E.fuseSeasonHero(s,id,E.seasonReceipt(s)).isNew,false);assert.deepEqual(s.owned[id],{level:20,copies:4,awaken:2});assert.deepEqual(s.run,old.run);atomic(s,()=>E.fuseSeasonHero(s,id,E.seasonReceipt(s)),/60/);copy(s);
});

test('capped duplicate copies and malformed fusion requests leave fragments and account untouched',()=>{
  const s=state();s.season.fragments.astra=60;s.owned.astra={level:1,copies:1e9,awaken:0};atomic(s,()=>E.fuseSeasonHero(s,'astra',E.seasonReceipt(s)),/giới hạn/);for(const id of ['rook','constructor',null])atomic(s,()=>E.fuseSeasonHero(s,id,E.seasonReceipt(s)));copy(s);
});

test('event costume unlocks are permanent alternatives and eclipse aura is cosmetic only',()=>{
  const s=fund(state()),stats=E.heroStats(s,'rook');buy(s,'guardian-outfit');assert.equal(s.best,0);assert.equal(E.skinProgress(s,'rook-guardian').eventUnlocked,true);E.equipSkin(s,'rook','rook-guardian');assert.equal(E.equippedSkin(s,'rook'),'rook-guardian');atomic(s,()=>buy(s,'guardian-outfit'));
  atomic(s,()=>E.setSeasonAura(s,true));buy(s,'eclipse-aura');const before=structuredClone(s);assert.equal(E.setSeasonAura(s,true),true);assert.equal(E.setSeasonAura(s,true),false);assert.deepEqual(E.heroStats(s,'rook'),stats);const projected=structuredClone(s);projected.season.aura=false;assert.deepEqual(projected,before);assert.match(seasonAuraMarkup(s,heroArt(HEROES[0])),/data-season-aura="true"/);E.setSeasonAura(s,false);assert.equal(E.seasonAuraActive(s),false);copy(s);
  const reached=fund(state());reached.best=10;atomic(reached,()=>buy(reached,'guardian-outfit'));atomic(reached,()=>buy(reached,'moon-outfit'));assert.equal(E.seasonShopStatus(reached,'moon-outfit').owned,true);
});

test('historical combat projections remove only empty event defaults and retain real progress',()=>{
  const s=E.createState(),old=structuredClone(s);delete old.season;assert.deepEqual(withoutCombatReport(s),withoutCombatReport(old));E.observeSeason(s,new Date(),true);assert.notDeepEqual(withoutCombatReport(s),withoutCombatReport(old));
});

for(const phase of ['idle','route','battle','pending-guard','counter','contract','result'])test(`released 1.43 / v33 ${phase} migrates without changing currencies, bonds, refinements, teams or combat`,()=>{
  const old=Old.createState();old.gold=1000000;old.dust=100000;old.bonds.rook={xp:800,adorned:true};Old.claimLoginReward(old,new Date(2026,9,24,12));Old.equipGear(old,'gear-1','rook');Old.saveGearPreset(old,'rook',0);Old.saveTeamPreset(old,0,'Đội cũ');Old.rollGearRefining(old,'gear-1',0,Old.refiningReceipt(old,'gear-1',0),()=>.5);Old.toggleGearLock(old,'gear-1');
  if(phase!=='idle')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){Object.assign(old.run,{map:null,floor:5,cleared:4,routes:['boss']});Old.chooseRoute(old,0);if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}}
  if(phase==='result')Old.finishRun(old);Old.validateState(old);const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,34);assert.deepEqual(migrated.season,E.starterSeason());const projected=structuredClone(migrated);delete projected.season;projected.version=33;assert.deepEqual(projected,old);assert.deepEqual(old,before);assert.deepEqual(copy(migrated),migrated);
});

const malformed=[['missing root',s=>delete s.season],['null root',s=>s.season=null],['root array',s=>s.season=[]],['extra root field',s=>s.season.extra=1],['invalid date',s=>s.season.anchor='2026-02-30'],['last date before start',s=>s.season.lastDay='0001-01-01'],['missing current',s=>s.season.current=null],['negative wallet',s=>s.season.wallet=-1],['capped wallet',s=>s.season.wallet=1e9+1],['fractional wallet',s=>s.season.wallet=.5],['bad fragment hero',s=>s.season.fragments.rook=1],['negative fragments',s=>s.season.fragments.astra=-1],['unknown cosmetic',s=>s.season.cosmetics=['fake']],['duplicate cosmetic',s=>s.season.cosmetics=['aura-eclipse','aura-eclipse']],['aura without purchase',s=>s.season.aura=true],['bad cycle',s=>s.season.current.cycle=2],['daily beyond total',s=>s.season.current.daily.skills=1],['unearned claim',s=>s.season.current.claimed=['seal-50']],['unearned daily',s=>s.season.current.daily.claimed=['skills']],['unknown stock',s=>s.season.current.purchases.fake=1],['excess stock',s=>s.season.current.purchases['summon-ticket']=11],['unowned purchase',s=>s.season.current.purchases['eclipse-aura']=1],['bad run curse',s=>{E.startSeasonRun(s,42);s.run.season.curse='fake';}],['future run cycle',s=>{E.startSeasonRun(s,42);s.run.season.cycle=100;}],['invalid event route',s=>{E.startSeasonRun(s,42);s.run.routes=['rest'];}],['season on normal run',s=>{E.startRun(s,42);s.run.season={};}]];
for(const [name,mutate] of malformed)test(`event save rejects ${name} without modifying the imported source`,()=>{const s=state();mutate(s);atomic(s,()=>copy(s));});

test('event boss and seal loot cannot be forged into another mode or saved with an invalid amount',()=>{
  const old=E.createState();E.startHunt(old,'colossus',1,42);old.run.battle.enemies[0].bossId='curse-king';old.run.battle.bossState.id='curse-king';old.run.battle.bossState.parts=null;atomic(old,()=>copy(old));
  for(const n of [-1,.5,16]){const s=battle();win(s);s.run.lastReward.seasonSeals=n;atomic(s,()=>copy(s));}
});

test('all twenty eclipse auras have bounded finite geometry and independent reduced-motion behavior',()=>{
  for(const h of HEROES){const model=heroModel(h.id,{seasonAura:true,bond:true,skin:h.id==='rook'?'rook-guardian':null}),other=heroModel(h.id,{seasonAura:true}),plain=heroModel(h.id),aura=model.getObjectByName('season-eclipse-aura');assert.ok(aura);assert.equal(plain.getObjectByName('season-eclipse-aura'),undefined);assert.equal(aura.children.length,4);let vertices=0;aura.traverse(o=>{if(o.isMesh){vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(vertices<10000);animateModel(model,3);assert.notEqual(aura.rotation.y,0);assert.equal(other.getObjectByName('season-eclipse-aura').rotation.y,0);animateModel(model,10,{reducedMotion:true});assert.equal(aura.rotation.y,0);const size=new T.Box3().setFromObject(model).getSize(new T.Vector3());assert.ok(size.toArray().every(Number.isFinite));for(const m of [model,other,plain])disposeScene(m);}
});

test('curse king phase visuals are finite, deterministic and fit the existing phone and wide arena cameras',()=>{
  const s=boss(),e=s.run.battle.enemies[0],model=enemyModel(e),other=enemyModel(e);attachBossVisual(model,'curse-king');attachBossVisual(other,'curse-king');syncBossVisual(model,{...readBossVisual(s.run,e),phase:2,move:'quake'},0);syncBossVisual(other,readBossVisual(s.run,e),0);
  assert.equal(model.userData.bossVisual.phaseRoot.visible,true);assert.equal(other.userData.bossVisual.phaseRoot.visible,false);let meshes=0,vertices=0;model.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));}});assert.ok(meshes<=85);assert.ok(vertices<75000);
  for(const aspect of [321/430,593/570,1080/570,1440/570])for(const x of [-3.4,0,3.4]){const camera=arenaCamera(aspect);model.position.set(x,.09,-3.75);model.rotation.y=-.28;model.scale.setScalar(.95);for(const time of [0,1.5,5,21]){animateModel(model,time);animateBossVisual(model,time);const b=new T.Box3().setFromObject(model);for(const bx of [b.min.x,b.max.x])for(const by of [b.min.y,b.max.y])for(const bz of [b.min.z,b.max.z]){const p=new T.Vector3(bx,by,bz).project(camera);assert.ok(Math.abs(p.x)<1&&p.y>-1&&p.y<.9,`curse king fits ${aspect}: ${p.toArray()}`);}}}
  assert.match(enemyArt(e),/data-model-id="curse-king"/);disposeScene(model);disposeScene(other);
});

test('lobby, map and victory scenes refresh when eclipse aura changes without modifying gameplay',()=>{
  const s=fund(state());buy(s,'eclipse-aura');const old=lobbyKey(s);E.setSeasonAura(s,true);assert.notEqual(lobbyKey(s),old);const before=structuredClone(s),lobby=createLobbyScene(s);assert.ok(lobby.units.every(u=>u.model.userData.seasonAura));assert.deepEqual(s,before);disposeScene(lobby.scene);
  E.startRun(s,42);const key=towerMapKey(s);E.setSeasonAura(s,false);assert.notEqual(towerMapKey(s),key);E.setSeasonAura(s,true);const map=createTowerMapScene(s);assert.ok(map.units.every(h=>h.model.userData.seasonAura));disposeScene(map.scene);
  E.chooseRoute(s,0);win(s);const vkey=victoryKey(s);E.setSeasonAura(s,false);assert.notEqual(victoryKey(s),vkey);E.setSeasonAura(s,true);const v=createVictoryScene(s);assert.ok(v.heroes.every(h=>h.model.userData.seasonAura));disposeScene(v.scene);assert.match(seasonRunBanner(battle().run),/Lời nguyền Tháp/);copy(s);
});
