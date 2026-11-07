import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/balance-legacy-v1.46.0/js/engine.mjs';
import {playTower} from '../tools/tower-balance-audit.mjs';
import {HEROES} from '../js/data.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const compare=(a,b)=>{const c=structuredClone(a),d=structuredClone(b);if(c.run)c.run.started=123;if(d.run)d.run.started=123;assert.deepEqual(c,d);};
function combat(engine,floor,node='battle',fresh=true){const s=engine.createState();engine.startRun(s,42);if(!fresh)delete s.run.balanceRules;delete s.run.anomalyRules;delete s.run.anomalyOrder;Object.assign(s.run,{map:null,floor,routes:[node]});engine.chooseRoute(s,0);return s;}
function win(engine,s){for(const h of s.run.heroes)h.atk=100000;while(s.run.phase==='battle'){const h=s.run.heroes.find(h=>h.hp>0&&!s.run.battle.used.includes(h.id));if(h)engine.playerAction(s,h.id,s.run.battle.enemies.find(e=>e.hp>0).id);else engine.enemyTurn(s);}return s;}
function neutral(s){const c=structuredClone(s);delete c.run.balanceRules;c.run.started=123;return c;}

test('normal departures alone snapshot balance rules and do not draw extra RNG or change the account',()=>{
  const a=E.createState(),b=Old.createState();E.startRun(a,42);Old.startRun(b,42);assert.equal(a.run.balanceRules,1);compare(neutral(a),neutral(b));copy(a);
  for(const start of [s=>E.startChallenge(s,'iron'),s=>E.startDungeon(s,'fire',1),s=>E.startCampaign(s,1),s=>E.startHunt(s,'colossus'),s=>E.startSeasonRun(s)]){const s=E.createState();start(s);assert.equal(Object.hasOwn(s.run,'balanceRules'),false);copy(s);}
  assert.equal(Object.hasOwn(E.createTrainingState(E.createState()).run,'balanceRules'),false);
});

test('third attacker and first boss enter at reduced strength without changing enemy intents or RNG',()=>{
  for(const floor of [3,4,5,10,15,20]){
    const node=floor%5===0?'boss':'battle',s=combat(E,floor,node),old=combat(Old,floor,node);
    assert.equal(s.run.seed,old.run.seed);assert.deepEqual(s.run.battle.enemies.map(e=>e.intent),old.run.battle.enemies.map(e=>e.intent));
    const e=s.run.battle.enemies[node==='boss'?0:2],o=old.run.battle.enemies[node==='boss'?0:2];
    if(floor<20){assert.ok(e.hp<o.hp);assert.ok(e.atk<o.atk);}else assert.ok(Math.abs(e.hp-o.hp)<10);
    assert.deepEqual(s.run.battle.bossState?.parts?.head.maxHp,node==='boss'?Math.round(e.maxHp*.22):undefined);copy(s);
  }
});

test('normal curve is continuous across the old decade steps and rejoins original stats above floor 20',()=>{
  const r={mode:'normal',balanceRules:1,floor:1};let last=E.towerScale(r,1);
  for(let f=2;f<=21;f++){const value=E.towerScale(r,f);assert.ok(value>last);assert.ok(value-last<=.17+1e-8);last=value;}
  for(const floor of [21,25,30,100])for(const node of ['battle','boss']){const s=combat(E,floor,node),old=combat(Old,floor,node);compare(neutral(s),neutral(old));}
});

test('normal gold is boosted once, bonus fades monotonically and optional fortune remains multiplicative',()=>{
  let last=Infinity;for(let floor=1;floor<=30;floor++){const r={mode:'normal',balanceRules:1,floor},n=E.towerGoldBonus(r);assert.ok(n>=0&&n<=last);last=n;if(floor>=25)assert.equal(n,0);}
  for(const [floor,node] of [[1,'battle'],[5,'boss'],[10,'boss'],[20,'boss'],[25,'boss']]){
    const s=combat(E,floor,node),o=combat(Old,floor,node);s.run.buffs=o.run.buffs=['fortune'];const n=E.towerGoldBonus(s.run);win(E,s);win(Old,o);
    assert.equal(s.run.summary?.gold??s.run.goldEarned,s.run.goldEarned);assert.ok(s.gold>=o.gold);assert.equal(s.gold-o.gold,Math.round((55+floor*12+n)*(node==='boss'?3:1)*1.25)-Math.round((55+floor*12)*(node==='boss'?3:1)*1.25));
    const paid=structuredClone(s);E.dismissVictory(s);E.finishRun(s);const wallet=[s.gold,s.tickets,s.shards];E.finishRun(s);assert.deepEqual([s.gold,s.tickets,s.shards],wallet);assert.equal(s.gold,paid.gold);copy(s);
  }
});

test('early hero prices fall by 40%, taper without a price cliff and keep level 20+ prices unchanged',()=>{
  const s=E.createState(),old=Old.createState();let last=0;
  for(let level=1;level<100;level++){
    s.owned.rook.level=old.owned.rook.level=level;const cost=E.upgradeCost(s,'rook'),previous=Old.upgradeCost(old,'rook');assert.ok(Number.isSafeInteger(cost)&&cost>last);last=cost;
    if(level<=10)assert.equal(cost,Math.round(previous*.6));else if(level<20)assert.ok(cost<previous);else assert.equal(cost,previous);
    if(level<99){s.owned.rook.level=level+1;assert.ok(E.upgradeCost(s,'rook')/cost<2.6);}
  }
  const first=E.createState();for(let level=1;level<3;level++)for(const id of first.team)E.upgradeHero(first,id);assert.equal(first.gold,800-573);assert.ok(first.team.every(id=>first.owned[id].level===3));copy(first);
});

test('hero upgrades use the displayed cost, reject insufficient gold atomically and leave active fighter snapshots intact',()=>{
  const s=E.createState();E.startRun(s,42);const heroes=structuredClone(s.run.heroes),cost=E.upgradeCost(s,'aerin');s.gold=cost-1;let before=structuredClone(s);assert.throws(()=>E.upgradeHero(s,'aerin'));assert.deepEqual(s,before);s.gold=cost;E.upgradeHero(s,'aerin');assert.equal(s.gold,0);assert.deepEqual(s.run.heroes,heroes);assert.equal(E.talentStatus(s,'aerin').available,1);copy(s);
});

for(const floor of [1,3,5,10,20])test(`released 1.46 journey at floor ${floor} keeps original stats, actions and rewards after import`,()=>{
  const old=combat(Old,floor,floor%5===0?'boss':'battle'),s=copy(old);compare(s,old);
  for(let i=0;i<3&&s.run.phase==='battle';i++){const actor=s.run.heroes.find(h=>!s.run.battle.used.includes(h.id)&&h.hp>0),target=s.run.battle.enemies.find(e=>e.hp>0).id;if(actor)assert.deepEqual(E.playerAction(s,actor.id,target),Old.playerAction(old,actor.id,target));else assert.deepEqual(E.enemyTurn(s),Old.enemyTurn(old));compare(s,old);}
  win(E,s);win(Old,old);compare(s,old);copy(s);
});

for(const value of [0,2,'1',null,{},[],true])test(`invalid tower rule ${JSON.stringify(value)} is rejected without mutating the save`,()=>{
  const s=E.createState();E.startRun(s,42);s.run.balanceRules=value;const before=structuredClone(s);assert.throws(()=>E.validateState(s),/cân bằng/);assert.deepEqual(s,before);
});

test('balance markers cannot be imported into hunt, season, campaign, dungeon, challenge or training',()=>{
  for(const start of [s=>E.startHunt(s,'colossus'),s=>E.startSeasonRun(s),s=>E.startCampaign(s,1),s=>E.startDungeon(s,'fire',1),s=>E.startChallenge(s,'iron')]){const s=E.createState();start(s);s.run.balanceRules=1;assert.throws(()=>copy(s),/cân bằng/);}
});

test('starter teams can progress without gacha and deterministic simulations roundtrip every completed route',()=>{
  for(const seed of [1,7,42]){const a=playTower(E,{seed,level:1,cap:20}),b=playTower(E,{seed,level:1,cap:20});assert.deepEqual(a,b);assert.equal(a.cleared,20);assert.ok(a.gold>5000);assert.ok(a.rounds>20);}
});
