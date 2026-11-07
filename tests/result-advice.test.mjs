import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {resultAdvice,resultAdvicePanel} from '../js/result-advice.mjs';
import {HERO} from '../js/data.mjs';

function lost({team=['rook','aerin','lumi'],level=1,boss=false}={}){
  const s=E.createState();s.team=[...team];for(const id of team)s.owned[id]??={level:1,copies:0,awaken:0};for(const id of team)s.owned[id].level=level;
  E.startRun(s,42);if(boss)Object.assign(s.run,{floor:5,map:null,routes:['boss']});E.chooseRoute(s,0);s.run.battle.round=7;
  for(const h of s.run.heroes)h.hp=0;E.finishRun(s,'defeat');return s;
}

test('advice is pure, deterministic, limited to three concrete actions and tied to the finished battle',()=>{
  const s=lost({level:3,boss:true}),before=structuredClone(s),tips=resultAdvice(s);assert.ok(tips.length>0&&tips.length<=3);assert.equal(new Set(tips.map(t=>t.id)).size,tips.length);
  for(const t of tips){assert.ok(t.title&&t.evidence&&t.suggestion&&t.action.label);if(t.action.id)assert.ok(s.owned[t.action.id]);}
  for(let i=0;i<3;i++){assert.deepEqual(resultAdvice(s),tips);assert.match(resultAdvicePanel(s),/CHUẨN BỊ LẦN TỚI/);}assert.deepEqual(s,before);
});

test('missing healer recommendation uses an already owned available hero rather than requesting gacha',()=>{
  const s=lost({team:['rook','aerin','ember']}),t=resultAdvice(s).find(t=>t.id==='healer');assert.equal(t.action.id,'lumi');assert.match(t.evidence,/không có vai trò trị liệu/);assert.match(t.suggestion,/đã sở hữu/);assert.doesNotMatch(resultAdvicePanel(s),/triệu hồi|nạp|SSR/);
});

test('busy heroes are not offered as roster changes and the R-only challenge keeps its restriction',()=>{
  const s=lost({team:['rook','aerin','ember']});s.best=5;E.dispatchExpedition(s,'mist-path','lumi',0,Date.now());assert.ok(!resultAdvice(s).some(t=>t.id==='healer'));
  s.owned.seraph={level:30,copies:0,awaken:0};assert.equal(resultAdvice(s).find(t=>t.id==='healer').action.id,'seraph');
  s.run.challenge={id:'humble',week:E.weekKey()};assert.ok(!resultAdvice(s).some(t=>t.id==='healer'));
});

test('formation recommendation refers to the actual saved front row instead of the account team after edits',()=>{
  const s=lost({team:['aerin','rook','lumi']});s.team=['rook','aerin','lumi'];const t=resultAdvice(s).find(t=>t.id==='formation');assert.ok(t);assert.match(t.evidence,/Rook đang ở hàng sau/);assert.equal(t.action.page,'heroes');
  s.run.formation={front:2};assert.ok(!resultAdvice(s).some(t=>t.id==='formation'));
});

test('talent advice uses the points still available on the current account and disappears after allocation',()=>{
  const s=lost({level:2});let t=resultAdvice(s).find(t=>t.id==='talents');assert.equal(t.action.id,'rook');assert.match(t.evidence,/1 điểm/);assert.equal(t.action.name,'talent-info');
  for(const id of s.team)E.learnTalent(s,id,'force');assert.ok(!resultAdvice(s).some(t=>t.id==='talents'));assert.equal(s.run.heroes[0].talents.nodes.force,undefined);
});

test('weapon advice is based on the departure loadout and disappears if gear has already been equipped',()=>{
  const s=lost();let t=resultAdvice(s).find(t=>t.id==='equipment');assert.equal(t.action.id,'aerin');assert.equal(t.action.slot,'weapon');
  E.equipGear(s,'gear-1','aerin');assert.ok(!resultAdvice(s).some(t=>t.id==='equipment'));
  delete s.equipped.aerin;s.run.heroes[1].loadout=null;assert.ok(!resultAdvice(s).some(t=>t.id==='equipment'));
});

test('long-fight advice quotes actual round and remaining enemy HP and offers an affordable upgrade',()=>{
  const s=lost();E.equipGear(s,'gear-1','aerin');const t=resultAdvice(s).find(t=>t.id==='pressure');assert.ok(t);assert.match(t.evidence,/vòng 7/);assert.match(t.evidence,/100%/);assert.match(t.suggestion,new RegExp(`${E.upgradeCost(s,'aerin')} vàng`));assert.equal(t.action.id,'aerin');
  s.gold=0;const poor=resultAdvice(s).find(t=>t.id==='pressure');assert.equal(poor.action.name,'nav');assert.doesNotMatch(poor.suggestion,/đủ vàng/);
});

for(const [round,fraction] of [[1,1],[5,.9],[7,.1]])test(`pressure advice is absent at round ${round} with ${fraction} enemy HP`,()=>{
  const s=lost();s.run.battle.round=round;for(const e of s.run.battle.enemies)e.hp=Math.round(e.maxHp*fraction);assert.ok(!resultAdvice(s).some(t=>t.id==='pressure'));
});

test('boss advice uses the remaining saved armor, and does not invent a break target after it is destroyed',()=>{
  const s=lost({boss:true});const t=resultAdvice(s).find(t=>t.id==='boss');assert.ok(t);assert.match(t.evidence,new RegExp(`${s.run.battle.bossState.parts.head.hp}/`));assert.equal(t.action.name,'boss-info');
  s.run.battle.bossState.parts.head.hp=0;assert.ok(!resultAdvice(s).some(t=>t.id==='boss'));
});

test('legacy partial contributions do not generate a damage diagnosis and missing old gear snapshots are not guessed',()=>{
  const s=lost();s.run.battle.statistics.partial=true;for(const h of s.run.heroes)h.loadout=null;assert.ok(!resultAdvice(s).some(t=>t.id==='pressure'||t.id==='equipment'));assert.equal(resultAdvice(s)[0].id,'practice');assert.match(resultAdvice(s)[0].evidence,/chưa có đầy đủ thống kê/);
});

test('support heroes are not classified as failed damage dealers from their contribution ranking',()=>{
  const s=lost();s.run.battle.statistics.rows.lumi.damage=10000;s.run.battle.statistics.rows.rook.damage=10000;const t=resultAdvice(s).find(t=>t.id==='equipment');assert.equal(t.action.id,'aerin');assert.ok(HERO[t.action.id].kind!=='heal');
});

test('fallback suggests free practice when the completed data yields no specific roster problem',()=>{
  const s=lost();s.run.battle.round=1;E.equipGear(s,'gear-1','aerin');const tips=resultAdvice(s);assert.equal(tips.length,1);assert.equal(tips[0].id,'practice');assert.equal(tips[0].action.page,'training');assert.match(tips[0].suggestion,/miễn phí/);
});

for(const phase of ['route','battle','victory','retreat','training'])test(`advice stays hidden for ${phase}`,()=>{
  const s=lost();if(['route','battle'].includes(phase))s.run.phase=phase;else if(phase==='training')s.run.training={};else s.run.summary.reason=phase;
  assert.deepEqual(resultAdvice(s),[]);assert.equal(resultAdvicePanel(s),'');
});
