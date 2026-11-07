import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {resultReviewPanel,mvpPanel} from '../js/victory-ui.mjs';
import * as Old from '../artifacts/qa/result-legacy-v1.45.0/js/engine.mjs';
import {withoutCombatReport,withoutResultLedger} from './legacy-report-helper.mjs';
import {encounter,champion,win} from './elites-helper.mjs';
import {account,win as winRaid,DRAGON} from './void-dragon-helper.mjs';
import {HEROES} from '../js/data.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function finishedBattle(){const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);win(s);E.dismissVictory(s);E.selectBlessing(s,s.run.choices[0]);E.finishRun(s);return s;}
function boss(s,floor){Object.assign(s.run,{map:null,floor,routes:['boss']});E.chooseRoute(s,0);win(s);}
function nextFloor(s){E.dismissVictory(s);if(s.run.phase==='contract')E.selectContract(s,null,s.run.floor);if(s.run.phase==='relic')E.selectRelic(s,s.run.relicChoices[0]);if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);}
const wallet=s=>[s.gold,s.tickets,s.shards,s.dust];

test('result review summarizes the entire journey after the last battle is cleared from memory',()=>{
  const s=finishedBattle(),before=structuredClone(s),html=resultReviewPanel(s.run);
  assert.equal(s.run.battle,null);assert.equal(s.run.lastReward,null);assert.equal(s.run.statistics.report.kills,2);
  for(const text of ['TỔNG KẾT HÀNH TRÌNH','Dấu ấn hành trình','SÁT THƯƠNG','ĐỊCH ĐÃ HẠ','Xem chi tiết trận','Vàng'])assert.ok(html.includes(text),text);
  assert.match(html,/data-contribution="rook"/);assert.match(html,/class="result-mvp-badge"/);assert.match(mvpPanel(s.run,{journey:true}),/Hồi máu/);
  assert.equal(E.resultRewards(s.run).gold,s.run.summary.gold);assert.deepEqual(s,before);assert.deepEqual(copy(s),s);
});

for(const reason of ['retreat','defeat','victory'])test(`result copy reflects ${reason} and does not invent a zero-contribution MVP`,()=>{
  const s=E.createState();E.startRun(s,42);E.finishRun(s,reason);const before=structuredClone(s),html=resultReviewPanel(s.run);
  assert.match(html,new RegExp({retreat:'Dấu ấn hành trình',defeat:'Sức mạnh để trở lại',victory:'Dấu ấn chiến thắng'}[reason]));
  assert.match(html,/Chưa có MVP/);assert.doesNotMatch(html,/class="result-mvp-badge"|class="is-mvp"|result-reward-strip/);assert.match(html,/Chuyến này chưa nhận tài nguyên/);assert.deepEqual(s,before);
});

test('kills accumulate once across battles, survive reload and ignore an elite resurrection until its final death',()=>{
  let s=encounter('rebirth');const e=champion(s),id=e.id;for(const h of s.run.heroes)h.atk=100000;
  E.playerAction(s,'rook',id);assert.ok(e.hp>0);assert.equal(s.run.statistics.report.kills,0);s=copy(s);
  E.playerAction(s,'aerin',id);assert.equal(s.run.statistics.report.kills,1);win(s);
  assert.equal(s.run.statistics.report.kills,s.run.battle.enemies.length);const first=s.run.statistics.report.kills;nextFloor(s);s.run.routes=['battle'];E.chooseRoute(s,0);assert.equal(s.run.battle.statistics.report.kills,0);win(s);
  assert.equal(s.run.statistics.report.kills,first+s.run.battle.enemies.length);assert.deepEqual(copy(s),s);
});

test('reinforcements reusing enemy slots each count as a new defeated enemy',()=>{
  const s=E.createState();E.startHunt(s,'archivist',1,42);const r=s.run;
  for(const h of r.heroes){h.hp=h.maxHp=100000;h.atk=100000;}
  E.enemyTurn(s);assert.equal(r.battle.enemies.length,3);
  E.playerAction(s,'rook','enemy1');E.playerAction(s,'aerin','enemy2');assert.equal(r.statistics.report.kills,2);
  for(let i=0;i<3;i++)E.enemyTurn(s);
  assert.ok(r.battle.enemies[1].hp>0);assert.ok(r.battle.enemies[2].hp>0);
  E.playerAction(s,'rook','enemy1');E.playerAction(s,'aerin','enemy2');E.playerAction(s,'lumi','enemy0');
  assert.equal(r.summary.reason,'victory');assert.equal(r.statistics.report.kills,5);assert.equal(r.battle.statistics.report.kills,5);copy(s);
});

test('total rewards retain shards from multiple bosses and dust from elite rewards and full-bag conversions',()=>{
  const s=E.createState();while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');E.startRun(s,42);const initial=wallet(s);
  boss(s,5);nextFloor(s);boss(s,10);nextFloor(s);
  Object.assign(s.run,{floor:11,routes:['elite']});E.chooseRoute(s,0);win(s);assert.ok(s.run.lastReward.eliteBonus.dust>0);nextFloor(s);
  s.run.routes=['treasure'];E.chooseRoute(s,0);E.finishRun(s);const result=E.resultRewards(s.run);
  assert.equal(s.run.lastReward,null);assert.equal(result.shards,s.shards-initial[2]);assert.equal(result.dust,s.dust-initial[3]);assert.ok(result.dust>0);assert.ok(result.shards>=7);
  assert.equal(result.gold,s.gold-initial[0]);assert.equal(result.tickets,s.tickets-initial[1]);assert.equal(result.complete,true);
  const paid=structuredClone(s);resultReviewPanel(s.run);E.finishRun(s);assert.deepEqual(s,paid);copy(s);
});

test('special hunt, dungeon and season resources are included without claiming their quests',()=>{
  const hunt=E.createState();E.startHunt(hunt,'colossus',1,42);win(hunt);const p=hunt.run.summary.huntReward,html=resultReviewPanel(hunt.run);
  assert.equal(E.resultRewards(hunt.run).marks,p.marks);assert.equal(E.resultRewards(hunt.run).essence,p.essence);assert.match(html,/Ấn săn boss/);assert.match(html,/Tinh hoa boss/);assert.match(html,/Về sảnh/);
  const d=E.createState();E.startDungeon(d,'fire',1,new Date(),42);Object.assign(d.run,{floor:3,routes:['boss']});E.chooseRoute(d,0);win(d);assert.equal(E.resultRewards(d.run).cores,d.run.summary.dungeonReward.cores);assert.match(resultReviewPanel(d.run),/Lõi nguyên tố/);
  const season=E.createState();E.startSeasonRun(season,42);E.chooseRoute(season,0);win(season);E.finishRun(season);const before=structuredClone(season);assert.equal(E.resultRewards(season.run).seasonSeals,season.run.season.seals);assert.match(resultReviewPanel(season.run),/Ấn hắc nguyệt/);assert.deepEqual(season,before);
});

test('raid MVP and kill statistics identify the current team while all raid loot is reported accurately',()=>{
  const s=account();while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');const dust=s.dust;winRaid(s);const before=structuredClone(s),html=resultReviewPanel(s.run),rewards=E.resultRewards(s.run);
  assert.match(html,/ĐỘI 3 \/ TỔNG KẾT TRẬN/);assert.match(html,/MVP · ĐỘI 3/);assert.doesNotMatch(html,/TOÀN HÀNH TRÌNH/);assert.match(html,/Vảy Hư Không/);
  assert.equal(rewards.scales,s.run.summary.raidReward.scales);assert.equal(rewards.dust,s.dust-dust);assert.equal(s.run.raid.boss,DRAGON);assert.deepEqual(s,before);copy(s);
});

test('training results expose combat contributions and never display account rewards',()=>{
  const source=E.createState(),before=structuredClone(source),practice=E.createTrainingState(source);win(practice);const html=resultReviewPanel(practice.run),rewards=E.resultRewards(practice.run);
  assert.match(html,/Phòng thử · Không tiêu hao/);assert.doesNotMatch(html,/PHẦN THƯỞNG ĐÃ VÀO TÚI|result-reward-strip/);assert.equal(rewards.practice,true);assert.equal(rewards.gold,0);assert.equal(practice.run.statistics.report.kills,1);assert.deepEqual(source,before);
});

for(const phase of ['route','battle','result'])test(`real v1.45 ${phase} saves load without changing gameplay or inventing historical counters`,()=>{
  const s=Old.createState();Old.startRun(s,42);if(phase!=='route')Old.chooseRoute(s,0);if(phase==='result')Old.finishRun(s);const before=structuredClone(s),loaded=copy(s);
  assert.deepEqual(loaded,s);assert.deepEqual(s,before);assert.equal(loaded.version,34);assert.equal(loaded.run.statistics.report,undefined);
  if(phase==='result'){const html=resultReviewPanel(loaded.run);assert.match(html,/Bản lưu cũ chưa ghi số địch/);assert.match(html,/Bản lưu cũ chưa ghi tổng tinh thạch/);assert.doesNotMatch(html,/ĐỊCH ĐÃ HẠ<\/span><strong>0/);const partial=structuredClone(loaded.run);partial.statistics.partial=true;assert.match(resultReviewPanel(partial),/Chỉ tính đóng góp được ghi sau khi cập nhật phiên bản/);}
  if(phase==='battle'){E.playerAction(loaded,'rook','enemy0');Old.playerAction(s,'rook','enemy0');assert.deepEqual(withoutCombatReport(loaded),withoutCombatReport(s));}
});

for(const value of [null,[],{},1,{kills:-1,shards:0,dust:0},{kills:1.5,shards:0,dust:0},{kills:0,shards:1e16,dust:0},{kills:0,shards:0,dust:NaN},{kills:0,shards:0,dust:0,extra:1}])test(`malformed optional report ${JSON.stringify(value)} is rejected without mutating the imported save`,()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.statistics.report=value;const before=structuredClone(s);assert.throws(()=>E.validateState(s),/Tổng kết/);assert.deepEqual(s,before);
});

test('a battle kill total cannot exceed the journey total in imported reports',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.battle.statistics.report.kills=1;const before=structuredClone(s);assert.throws(()=>copy(s),/Tổng kết trận/);assert.deepEqual(s,before);
});

const withoutLedger=s=>{const c=withoutResultLedger(s);if(c.run){c.run.started=123;for(const stats of [c.run.statistics,c.run.battle?.statistics])if(stats)delete stats.report;}return c;};
function prepared(engine,mode,seed){
  const s=engine.createState();for(const h of HEROES)s.owned[h.id]={level:20,copies:0,awaken:0};
  if(mode==='hunt')engine.startHunt(s,'archivist',1,seed);
  else if(mode==='campaign')engine.startCampaign(s,1,seed);
  else if(mode==='dungeon')engine.startDungeon(s,'fire',1,new Date(),seed);
  else if(mode==='season')engine.startSeasonRun(s,seed);
  else if(mode==='raid'){engine.autoRaidTeams(s);engine.startRaid(s,1,seed);}
  else {engine.startRun(s,seed);delete s.run.balanceRules;}
  return s;
}
function step(engine,s){
  const r=s.run;if(engine.victoryPending(r)){engine.dismissVictory(s);return;}
  if(r.phase==='route'){let route=r.routes.findIndex(n=>['battle','elite','boss'].includes(n));engine.chooseRoute(s,Math.max(0,route));}
  else if(r.phase==='battle'){
    const actor=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),enemy=r.battle.enemies.find(e=>e.hp>0),pair=engine.recommendedLink(r),part=enemy.kind==='boss'?engine.recommendedBossPart(r):null;
    if(engine.shouldUsePet(r))engine.petAction(s);else if(pair)engine.linkAction(s,...pair.ids,enemy.id,part);else if(actor)engine.playerAction(s,actor.id,enemy.id,actor.energy>=100,part);else engine.enemyTurn(s);
  }else if(r.phase==='blessing')engine.selectBlessing(s,r.choices[0]);
  else if(r.phase==='relic')engine.selectRelic(s,r.relicChoices[0]);
  else if(r.phase==='contract')engine.selectContract(s,null,r.floor);
  else if(r.phase==='event')engine.chooseEvent(s,'leave');
  else if(r.phase==='story')engine.advanceCampaignStory(s,true);
  else if(r.phase==='relay')engine.continueRaid(s,r.raid.stage);
}
for(const mode of ['tower','hunt','campaign','dungeon','season','raid'])for(const seed of [1,42])test(`${mode} seed ${seed}: new result counters preserve v1.45 actions, RNG, combat contributions and payouts`,()=>{
  let current=prepared(E,mode,seed),old=prepared(Old,mode,seed);assert.deepEqual(withoutLedger(current),withoutLedger(old));
  for(let i=0;i<100&&current.run.phase!=='result';i++){
    step(E,current);step(Old,old);assert.deepEqual(withoutLedger(current),withoutLedger(old),`step ${i}`);
    if(i%13===0){current=copy(current);old=Old.validateState(JSON.parse(JSON.stringify(old)));assert.deepEqual(withoutLedger(current),withoutLedger(old));}
  }
});

