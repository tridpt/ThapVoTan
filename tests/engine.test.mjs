import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HERO} from '../js/data.mjs';
const rngR=()=>.99;
function fight(s) {
  let safety=0;
  while(s.run.phase==='battle'&&safety++<200){
    const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id));
    if(!h){E.enemyTurn(s);continue;}
    const enemy=r.battle.enemies.filter(e=>e.hp>0).sort((a,b)=>a.hp-b.hp)[0];
    const skill=h.energy>=100&&(HERO[h.id].kind!=='heal'||r.heroes.some(a=>a.hp/a.maxHp<.8));
    E.playerAction(s,h.id,enemy.id,skill);
  }
  assert.ok(safety<200,'Combat should terminate');
}
test('initial team is valid and survives save round trip',()=>{
  const s=E.createState();assert.equal(s.team.length,3);assert.equal(s.tickets,15);assert.deepEqual(E.validateState(JSON.parse(JSON.stringify(s))),s);
});
test('insufficient tickets cannot spend currency or advance pity',()=>{
  const s=E.createState();s.tickets=0;const before=structuredClone(s);assert.throws(()=>E.summon(s,10),/Chưa đủ vé/);assert.deepEqual(s,before);
});
test('ten consecutive R results guarantee SR, counted across batches',()=>{
  const s=E.createState();s.tickets=50;
  for(let i=0;i<9;i++)assert.equal(E.summon(s,1,rngR)[0].rarity,'R');
  assert.equal(E.summon(s,1,rngR)[0].rarity,'SR');assert.equal(s.srPity,0);assert.equal(s.pity,10);
});
test('50th draw guarantees SSR and resets both guarantees',()=>{
  const s=E.createState();s.tickets=100;let result;
  for(let i=0;i<50;i++)result=E.summon(s,1,rngR)[0];
  assert.equal(result.rarity,'SSR');assert.equal(s.pity,0);assert.equal(s.srPity,0);assert.equal(s.totalSummons,50);assert.equal(s.daily.summons,50);
});
test('early SSR resets pity; duplicates grant stated rewards',()=>{
  const s=E.createState();s.pity=30;
  const first=E.summon(s,1,()=>.03)[0];assert.equal(first.id,'astra');assert.equal(first.isNew,true);assert.equal(s.pity,0);
  const before={gold:s.gold,shards:s.shards};const second=E.summon(s,1,()=>.03)[0];
  assert.equal(second.isNew,false);assert.equal(s.gold-before.gold,180);assert.equal(s.shards-before.shards,12);assert.equal(s.owned.astra.copies,1);
});
test('level and team updates apply only to a future run',()=>{
  const s=E.createState();const first=E.heroStats(s,'rook').maxHp;E.startRun(s,42);E.upgradeHero(s,'rook');assert.equal(s.run.heroes[0].maxHp,first);assert.ok(E.heroStats(s,'rook').maxHp>first);
  assert.throws(()=>E.setTeamSlot(s,'ember',1),/Đội hình/);assert.throws(()=>E.startRun(s),/đang có/);
  E.finishRun(s);E.setTeamSlot(s,'ember',1);assert.equal(s.team[1],'ember');E.startRun(s,43);assert.ok(s.run.heroes[0].maxHp>first);
});
test('swapping existing team members never duplicates units',()=>{
  const s=E.createState();E.setTeamSlot(s,'lumi',0);assert.deepEqual(s.team,['lumi','aerin','rook']);assert.equal(new Set(s.team).size,3);
});
test('route choice spends exactly one floor and cannot be replayed',()=>{
  const s=E.createState();E.startRun(s,42);const before=s.tickets;const gold=s.gold;
  const result=E.chooseRoute(s,1);assert.equal(result.type,'treasure');assert.equal(s.tickets,before+1);assert.equal(s.gold,gold+138);assert.equal(s.run.floor,2);assert.equal(s.best,1);
});
test('one action per hero and 100 energy required for skills',()=>{
  const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);const r=s.run;
  assert.throws(()=>E.playerAction(s,'rook','enemy0',true),/100/);E.playerAction(s,'rook','enemy0');assert.throws(()=>E.playerAction(s,'rook','enemy0'),/đã hành động/);
});
test('healing skill revives an ally and cannot exceed max health',()=>{
  const s=E.createState();E.startRun(s,13);E.chooseRoute(s,0);const r=s.run;r.heroes[0].hp=0;r.heroes[2].energy=100;
  E.playerAction(s,'lumi','enemy0',true);assert.ok(r.heroes[0].hp>0);assert.equal(r.heroes[2].hp,r.heroes[2].maxHp);
});
test('victory pays once, offers exactly three blessings and persists',()=>{
  const s=E.createState();E.startRun(s,9);E.chooseRoute(s,0);fight(s);
  assert.equal(s.run.phase,'blessing');assert.equal(new Set(s.run.choices).size,3);const gold=s.gold;assert.throws(()=>E.playerAction(s,'aerin','enemy0'));assert.equal(s.gold,gold);
  const restored=E.validateState(JSON.parse(JSON.stringify(s)));assert.equal(restored.run.phase,'blessing');E.selectBlessing(s,s.run.choices[0]);assert.equal(s.run.floor,2);assert.equal(s.run.buffs.length,1);assert.equal(s.best,1);
});
test('boss every five floors gives tickets and permanent upgrade currency',()=>{
  const s=E.createState();E.startRun(s,2);const r=s.run;r.floor=5;r.map=null;r.routes=['boss'];r.heroes.forEach(h=>{h.atk=1000;h.maxHp=10000;h.hp=10000;});
  const tickets=s.tickets;E.chooseRoute(s,0);fight(s);assert.equal(r.phase,'contract');E.selectContract(s,null,r.floor);assert.equal(r.phase,'relic');assert.equal(s.tickets-tickets,3);assert.equal(s.shards,3);E.selectRelic(s,r.relicChoices[0]);E.selectBlessing(s,r.choices[0]);assert.equal(s.best,5);E.upgradeMeta(s,'health');assert.equal(s.meta.health,1);assert.equal(s.shards,0);
});
test('vitality blessing increases max health without discarding earned loot',()=>{
  const s=E.createState();E.startRun(s,2);s.run.phase='blessing';s.run.choices=['vitality','might','crit'];const before=s.run.heroes[0].maxHp;E.selectBlessing(s,'vitality');assert.equal(s.run.heroes[0].maxHp,before+Math.round(before*.18));
});
test('rest and event revive, trade and risk follow defined resource rules',()=>{
  const s=E.createState();E.startRun(s,3);s.run.map=null;s.run.routes=['rest'];s.run.heroes[0].hp=0;E.chooseRoute(s,0);assert.ok(s.run.heroes[0].hp>0);E.selectBlessing(s,s.run.choices[0]);
  s.run.map=null;s.run.routes=['event'];E.chooseRoute(s,0);const gold=s.gold,tickets=s.tickets;E.chooseEvent(s,'trade');assert.equal(s.gold,gold-100);assert.equal(s.tickets,tickets+2);assert.equal(s.run.phase,'route');
  s.run.map=null;s.run.routes=['event'];E.chooseRoute(s,0);E.chooseEvent(s,'risk');assert.equal(s.run.phase,'blessing');assert.ok(s.run.heroes.every(h=>h.hp>=1));
});
test('defeat and retreat preserve all collected resources',()=>{
  const s=E.createState();E.startRun(s,3);E.chooseRoute(s,1);const gold=s.gold,tickets=s.tickets;const r=s.run;r.map=null;r.routes=['battle'];E.chooseRoute(s,0);r.heroes.forEach(h=>h.hp=1);E.enemyTurn(s);if(r.phase==='battle')E.enemyTurn(s);if(r.phase==='battle')E.enemyTurn(s);
  assert.equal(r.phase,'result');assert.equal(s.gold,gold);assert.equal(s.tickets,tickets);assert.equal(r.summary.reason,'defeat');assert.equal(r.summary.cleared,1);
});
test('daily tasks and milestones are claimable only once',()=>{
  const s=E.createState();E.startRun(s,2);E.claimDaily(s,'runs');assert.throws(()=>E.claimDaily(s,'runs'));s.best=5;const before=s.tickets;E.claimMilestone(s,5);assert.equal(s.tickets-before,3);assert.throws(()=>E.claimMilestone(s,5));
  E.refreshDaily(s,new Date(2030,1,1));assert.equal(s.daily.runs,0);assert.deepEqual(s.daily.claimed,[]);
});
test('all in-progress phases survive JSON save and resume',()=>{
  const s=E.createState();E.startRun(s,42);assert.equal(E.validateState(JSON.parse(JSON.stringify(s))).run.phase,'route');E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');const restored=E.validateState(JSON.parse(JSON.stringify(s)));assert.equal(restored.run.phase,'battle');assert.deepEqual(restored.run.battle.used,['rook']);fight(restored);assert.equal(restored.run.phase,'blessing');E.finishRun(restored);assert.equal(E.validateState(JSON.parse(JSON.stringify(restored))).run.phase,'result');
});
test('malformed imports are rejected before replacing progress',()=>{
  const s=E.createState();s.gold=-10;assert.throws(()=>E.validateState(s));s.gold=1;s.team=['rook','rook','lumi'];assert.throws(()=>E.validateState(s));s.team=['rook','aerin','lumi'];E.startRun(s,2);s.run.heroes[0].hp=Infinity;assert.throws(()=>E.validateState(s));
});
test('100 seeded expeditions terminate and keep finite resources',()=>{
  const floors=[];
  for(let seed=1;seed<=100;seed++){
    const s=E.createState();E.startRun(s,seed);let steps=0;
    while(s.run.phase!=='result'&&s.run.floor<=30&&steps++<200){
      const r=s.run;
      if(r.phase==='route')E.chooseRoute(s,0);
      else if(r.phase==='battle')fight(s);
      else if(r.phase==='blessing')E.selectBlessing(s,r.choices[0]);
      else if(r.phase==='contract')E.selectContract(s,null,r.floor);
      else if(r.phase==='relic')E.selectRelic(s,r.relicChoices[0]);
      else if(r.phase==='event')E.chooseEvent(s,'leave');
    }
    assert.ok(steps<200);assert.ok(Number.isFinite(s.gold));assert.ok(s.run.heroes.every(h=>Number.isFinite(h.hp)&&h.hp>=0));floors.push(s.run.floor);
  }
  console.log('Starter expedition floors: avg '+(floors.reduce((a,b)=>a+b,0)/floors.length).toFixed(1)+', range '+Math.min(...floors)+'–'+Math.max(...floors));
});
