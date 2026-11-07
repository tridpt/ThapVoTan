import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import {HERO} from '../js/data.mjs';
import {ELEMENTS,PETS,DUNGEONS,DUNGEON_DIFFICULTIES} from '../js/adventure-data.mjs';

const day=new Date(2026,9,20,12),tomorrow=new Date(2026,9,21,12);
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function state(level=1){const s=E.createState();for(const h of Object.values(s.owned))h.level=level;return s;}
function ownPet(s,id,level=1){s.adventure.pets[id]={level};E.equipPet(s,id);}
function fight(s){
  let steps=0;
  while(s.run.phase==='battle'&&steps++<250){
    const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id));
    if(E.shouldUsePet(r))E.petAction(s);
    else if(!h)E.enemyTurn(s);
    else{const e=r.battle.enemies.filter(e=>e.hp>0).sort((a,b)=>a.hp-b.hp)[0];E.playerAction(s,h.id,e.id,h.energy>=100&&(HERO[h.id].kind!=='heal'||r.heroes.some(a=>a.hp<a.maxHp*.8)));}
    s=copy(s);
  }
  assert.ok(steps<250,'battle must end');return s;
}
function clear(s,id,tier=1,date=day){
  E.startDungeon(s,id,tier,date,5932);let steps=0;
  while(s.run.phase!=='result'&&steps++<15){
    if(s.run.phase==='route')E.chooseRoute(s,0);
    else if(s.run.phase==='battle')s=fight(s);
    else if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);
    else assert.fail(s.run.phase);
    s=copy(s);
  }
  assert.equal(s.run.summary.reason,'victory',`${id} tier ${tier}`);return s;
}
function arena(id='mossling',element=null){
  const s=state();ownPet(s,id);
  if(element)E.startDungeon(s,element,1,day,2854);else E.startRun(s,2854);
  E.chooseRoute(s,0);s.run.resonances=[];
  for(const h of s.run.heroes)Object.assign(h,{hp:1000,maxHp:1000,atk:100,def:0,shield:0,energy:0});
  for(const e of s.run.battle.enemies)Object.assign(e,{hp:2000,maxHp:2000,atk:10,def:0});return s;
}
function boss(element,pet='mossling'){
  let s=state(100);ownPet(s,pet);E.startDungeon(s,element,1,day,842);
  for(let n=0;n<2;n++){E.chooseRoute(s,0);s=fight(s);E.selectBlessing(s,s.run.choices[0]);}
  E.chooseRoute(s,0);s.run.buffs=[];s.run.resonances=[];
  for(const h of s.run.heroes)Object.assign(h,{hp:1000,maxHp:1000,atk:10,def:0,energy:100,shield:0});
  Object.assign(s.run.battle.enemies[0],{hp:5000,maxHp:5000,atk:100,def:0,intent:0});s.run.battle.bossState.parts=E.createBossParts(s.run.battle.enemies[0]);return s;
}

test('starter pet is free once; old saves preserve battle snapshots through v5 migration',()=>{
  const fresh=E.createState();assert.deepEqual(fresh.adventure.pets,{mossling:{level:1}});assert.equal(fresh.gold,800);
  for(const file of ['browser-v1.1-backup.json','browser-v1.2-baseline.json','browser-v1.3-baseline.json']){
    const raw=JSON.parse(readFileSync(new URL('../artifacts/qa/'+file,import.meta.url),'utf8')),old=raw.state||raw,s=E.validateState(old);
    assert.equal(s.version,E.SAVE_VERSION);assert.equal(s.gold,old.gold);assert.equal(s.tickets,old.tickets);assert.deepEqual(s.owned,Object.fromEntries(Object.entries(old.owned).map(([id,h])=>[id,{awaken:0,...h}])));
    if(old.run){assert.deepEqual(s.run.heroes,old.run.heroes.map(h=>({awaken:0,...h,loadout:null,talents:null})));assert.deepEqual(s.run.battle,old.run.battle);assert.equal(s.run.pet,null);assert.equal(s.run.dungeon,null);}
    assert.deepEqual(copy(s).adventure,s.adventure);
  }
  const legacy=state();E.startRun(legacy,11);E.chooseRoute(legacy,0);legacy.version=1;
  const migrated=copy(legacy);assert.equal(migrated.run.pet,null);assert.deepEqual(migrated.adventure.pets,fresh.adventure.pets);
});

test('unlocking all pets consumes only the correct cores and cannot charge twice',()=>{
  const s=state();for(const e of ELEMENTS)s.adventure.cores[e.id]=100;
  for(const p of PETS.filter(p=>p.cost)){
    const before=structuredClone(s);E.unlockPet(s,p.id);assert.equal(s.adventure.cores[p.element],100-p.cost);assert.equal(s.gold,before.gold);
    const paid=structuredClone(s);assert.throws(()=>E.unlockPet(s,p.id));assert.deepEqual(s,paid);copy(s);
  }
  for(const id of ['missing','toString','__proto__']){const before=structuredClone(s);assert.throws(()=>E.unlockPet(s,id));assert.throws(()=>E.equipPet(s,id));assert.deepEqual(s,before);}
  const poor=state(),before=structuredClone(poor);assert.throws(()=>E.unlockPet(poor,'raiju'));assert.deepEqual(poor,before);
});

test('pet upgrades pay exact level costs, cap at twenty and leave failed actions untouched',()=>{
  const s=state();s.gold=50000;s.adventure.cores.earth=1000;let gold=0,cores=0;
  for(let level=1;level<20;level++){const cost=E.petUpgradeCost(s,'mossling');assert.deepEqual(cost,{cores:2+Math.floor(level/3),gold:70+level*35});gold+=cost.gold;cores+=cost.cores;assert.equal(E.upgradePet(s,'mossling'),level+1);copy(s);}
  assert.equal(s.gold,50000-gold);assert.equal(s.adventure.cores.earth,1000-cores);assert.equal(E.petUpgradeCost(s,'mossling'),null);
  const before=structuredClone(s);assert.throws(()=>E.upgradePet(s,'mossling'));assert.deepEqual(s,before);
  for(const [gold,cores] of [[1000,0],[0,1000]]){const a=state();a.gold=gold;a.adventure.cores.earth=cores;const saved=structuredClone(a);assert.throws(()=>E.upgradePet(a,'mossling'));assert.deepEqual(a,saved);}
});

test('changing pet and upgrading during a trip affects only the next trip; weekly rules exclude pets',()=>{
  const s=state();s.gold=10000;s.adventure.cores.earth=20;E.startRun(s,12);const snap=structuredClone(s.run.pet);
  E.upgradePet(s,'mossling');ownPet(s,'zephyr');assert.deepEqual(s.run.pet,snap);copy(s);
  E.finishRun(s);E.startRun(s,13);assert.equal(s.run.pet.id,'zephyr');E.finishRun(s);E.equipPet(s,null);E.startRun(s,14);assert.equal(s.run.pet,null);
  E.finishRun(s);E.equipPet(s,'mossling');E.startChallenge(s,'iron',day);assert.equal(s.run.pet,null);assert.throws(()=>E.petAction(s));copy(s);
});

test('pet casts use no hero action or energy, wait three rounds and reset at the next battle',()=>{
  const s=arena(),r=s.run,b=r.battle,before=r.heroes.map(h=>h.energy);E.petAction(s);
  assert.equal(r.pet.nextRound,4);assert.deepEqual(b.used,[]);assert.deepEqual(r.heroes.map(h=>h.energy),before);
  const saved=structuredClone(s);assert.throws(()=>E.petAction(s));assert.deepEqual(s,saved);
  for(let round=2;round<=4;round++){E.enemyTurn(s);assert.equal(E.petReady(r),round===4);copy(s);}
  E.petAction(s);assert.equal(r.pet.nextRound,7);
  for(const e of b.enemies)e.hp=1;r.heroes[0].atk=10000;E.playerAction(s,'rook','enemy0');
  if(r.phase==='battle')E.playerAction(s,'aerin','enemy1');
  E.selectBlessing(s,r.choices[0]);E.chooseRoute(s,r.routes.indexOf('battle'));assert.equal(r.pet.nextRound,1);assert.equal(E.petReady(r),true);
});

test('Moc Linh shields living allies and combines with earth resonance and mirror relic',()=>{
  const s=arena(),r=s.run;r.resonances=['earth'];r.heroes[2].hp=0;r.relics=['mirror'];E.petAction(s);
  assert.equal(r.heroes[0].shield,80);assert.equal(r.heroes[2].shield,0);
  const e=r.battle.enemies[0];e.atk=200;e.intent=0;const hp=e.hp;E.enemyTurn(s);assert.equal(e.hp,hp-70);copy({...s,run:{...r,resonances:[]}});
});

test('Tinh Huou heals only living allies, overflows into chalice shields and auto waits above 85 percent',()=>{
  const s=arena('stella'),r=s.run;assert.equal(E.shouldUsePet(r),false);r.heroes[0].hp=100;r.heroes[1].hp=0;r.relics=['chalice'];r.resonances=['light'];
  assert.equal(E.shouldUsePet(r),true);E.petAction(s);assert.equal(r.heroes[0].hp,164);assert.equal(r.heroes[1].hp,0);assert.equal(r.heroes[2].shield,38);
});

test('Vu Linh caps energy, skips healthy energy pools on auto and ignores fallen allies',()=>{
  const s=arena('zephyr'),r=s.run;for(const h of r.heroes)h.energy=90;assert.equal(E.shouldUsePet(r),false);
  r.heroes[0].energy=20;r.heroes[1].energy=99;r.heroes[2].hp=0;assert.equal(E.shouldUsePet(r),true);E.petAction(s);
  assert.deepEqual(r.heroes.map(h=>h.energy),[30,100,90]);copy(s);
});

test('Hong Vu applies AoE burn, fire resonance and cinder death chains',()=>{
  const s=arena('vermillion'),r=s.run;r.resonances=['fire'];E.petAction(s);
  assert.ok(r.battle.enemies.every(e=>e.hp===1947&&e.burn===2&&e.burnPower===18));
  E.enemyTurn(s);assert.ok(r.battle.enemies.every(e=>e.hp===1923&&e.burn===1));
  r.relics=['cinder','spark'];r.pet.nextRound=r.battle.round;r.battle.enemies[0].hp=1;r.battle.enemies[1].hp=280;E.petAction(s);
  assert.equal(r.phase,'blessing');assert.ok(r.heroes.every(h=>h.energy===40));copy({...s,run:{...r,resonances:[]}});
});

test('Nguyet Ho drains actual HP damage to the lowest living HP ratio, never revives',()=>{
  const s=arena('umbra'),r=s.run;r.heroes[0].hp=500;r.heroes[1].hp=1;r.heroes[2].hp=0;
  const e=r.battle.enemies[1];e.hp=30;e.shield=95;const events=E.petAction(s);assert.equal(e.hp,20);assert.equal(events[0].shield,95);assert.equal(r.heroes[1].hp,4);assert.equal(r.heroes[2].hp,0);copy(s);
});

test('Tuyet Mieu freezes the weakest target; Loi Long strikes it using living team attack',()=>{
  for(const [id,damage] of [['nixie',63],['raiju',135]]){
    const s=arena(id),r=s.run;r.battle.enemies[1].hp=500;r.heroes[2].hp=0;r.heroes[2].atk=5000;E.petAction(s);
    assert.equal(r.battle.enemies[0].hp,2000);assert.equal(r.battle.enemies[1].hp,500-damage);assert.equal(r.battle.enemies[1].freeze,id==='nixie'?1:0);copy(s);
  }
});

test('matching dungeon element boosts hero direct damage and pet ability by twenty-five percent',()=>{
  const a=arena('mossling','earth'),b=arena('mossling','wind');
  const x=E.playerAction(a,'rook','enemy0')[0],y=E.playerAction(b,'rook','enemy0')[0];assert.equal(x.value,Math.round(y.value*1.25));
  E.petAction(a);E.petAction(b);assert.equal(a.run.heroes[0].shield,80);assert.equal(b.run.heroes[0].shield,64);
  const c=arena('zephyr','wind');E.petAction(c);assert.equal(c.run.heroes[0].energy,13);copy(c);
});

test('dungeon validation rejects locked and unknown tiers, invalid dates and replacing an active trip without spending',()=>{
  const s=state();for(const args of [['wind',2,day],['wind',4,day],['toString',1,day],['wind',1,new Date(NaN)]]){const before=structuredClone(s);assert.throws(()=>E.startDungeon(s,...args));assert.deepEqual(s,before);}
  E.startRun(s,42);const before=structuredClone(s);assert.throws(()=>E.startDungeon(s,'earth',1,day));assert.deepEqual(s,before);
});

test('twenty-one dungeons have complete routes, unique bosses and exact first/daily/repeat rewards',()=>{
  let s=state(100);s.best=18;const weeks=structuredClone(s.challengeWeeks);
  for(const d of DUNGEONS)for(const tier of [1,2,3]){
    const def=DUNGEON_DIFFICULTIES[tier-1],before=s.adventure.cores[d.id];s=clear(s,d.id,tier);
    assert.equal(s.adventure.cores[d.id]-before,def.cores+def.daily+def.first);assert.equal(s.run.floor,3);assert.equal(s.run.summary.cleared,3);
    assert.equal(s.run.battle.bossState.id,d.bossId);assert.equal(s.run.summary.tickets,3);assert.ok(s.run.gearFound>=2);
    assert.equal(s.best,18);assert.deepEqual(s.challengeWeeks,weeks);assert.equal(s.adventure.dungeons[d.id].best,tier);
    const paid=structuredClone(s);E.finishRun(s);assert.throws(()=>E.petAction(s));assert.deepEqual(s,paid);
    s=clear(s,d.id,tier);assert.equal(s.run.summary.dungeonReward.cores,def.cores);assert.equal(s.run.summary.dungeonReward.daily,false);assert.equal(s.run.summary.dungeonReward.first,false);
  }
  s=clear(s,'earth',1,tomorrow);assert.equal(s.run.summary.dungeonReward.cores,12);assert.equal(s.adventure.dungeons.earth.clears,7);
});

test('retreat and defeat keep loot without giving cores or changing tower records',()=>{
  let s=state(100);s.best=9;E.startDungeon(s,'fire',1,day);E.chooseRoute(s,0);s=fight(s);const gold=s.gold;
  E.finishRun(s);assert.equal(s.gold,gold);assert.equal(s.run.summary.cleared,1);assert.equal(s.adventure.cores.fire,0);assert.equal(s.best,9);copy(s);
  E.startDungeon(s,'fire',1,day);E.chooseRoute(s,0);for(const h of s.run.heroes)h.hp=1;for(const e of s.run.battle.enemies)e.atk=100000;E.enemyTurn(s);
  // Ensure every living hero gets hit before concluding a defeat.
  while(s.run.phase==='battle')E.enemyTurn(s);
  assert.equal(s.run.summary.reason,'defeat');assert.equal(s.adventure.cores.fire,0);assert.equal(s.adventure.dungeons.fire.clears,0);assert.equal(s.best,9);copy(s);
});

test('captured dungeon day survives midnight; daily history remains bounded',()=>{
  let s=state(100);for(let n=1;n<=16;n++)s=clear(s,'earth',1,new Date(2026,8,n,12));
  assert.equal(Object.keys(s.adventure.days).length,14);assert.ok(!s.adventure.days['2026-09-01']);
  s=clear(s,'wind',1,new Date(2026,7,1,23,59));assert.equal(s.run.dungeon.day,'2026-08-01');assert.equal(s.run.summary.dungeonReward.daily,true);assert.ok(s.adventure.days['2026-08-01']);copy(s);
});

test('all seven boss signatures and surges follow their advertised mechanics',()=>{
  for(const id of ELEMENTS.map(e=>e.id)){
    const s=boss(id),r=s.run,b=r.battle,e=b.enemies[0];b.bossState.move='signature';const hp=r.heroes.map(h=>h.hp);e.hp=4000;
    E.enemyTurn(s);assert.equal(b.bossState.move,'surge');
    if(id==='earth')assert.equal(e.shield,700);
    if(id==='wind')assert.deepEqual(r.heroes.map(h=>h.hp),[935,945,1000]);
    if(id==='light')assert.equal(e.hp,4400);
    if(id==='fire')assert.equal(r.heroes[1].hp,865);
    if(id==='shadow')assert.equal(e.hp,4050);
    if(id==='ice')assert.equal(r.heroes[0].energy,70);
    if(id==='thunder')assert.deepEqual(r.heroes.map(h=>h.hp),hp);
    const before=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.equal(b.bossState.move,'strike');
    if(id==='shadow')assert.equal(e.shield,500);
    else assert.deepEqual(r.heroes.map(h=>h.hp),before.map((n,i)=>n-Math.round(100*(id==='thunder'?1.4:id==='ice'?.8:id==='light'?.95:.9)*(i===0?1:.85))));
    copy(s);
  }
});

test('dungeon bosses enter phase two at half HP and increase attack by fifteen percent',()=>{
  for(const element of ELEMENTS){const s=boss(element.id),r=s.run,e=r.battle.enemies[0];e.hp=2501;E.playerAction(s,'aerin',e.id);assert.equal(r.battle.bossState.phase,2);E.enemyTurn(s);assert.equal(r.heroes[0].hp,885);copy(s);}
});

test('hero damage skills break basalt shields; thunder charge is interrupted by two skills or ice pet',()=>{
  const earth=boss('earth');earth.run.battle.enemies[0].shield=700;E.playerAction(earth,'rook','enemy0',true);assert.equal(earth.run.battle.enemies[0].shield,0);copy(earth);
  const thunder=boss('thunder'),r=thunder.run;r.battle.bossState.move='surge';E.playerAction(thunder,'rook','enemy0',true);assert.equal(r.battle.bossState.stagger,1);E.playerAction(thunder,'aerin','enemy0',true);assert.equal(r.battle.bossState.move,'stunned');
  E.enemyTurn(thunder);assert.ok(r.heroes.every(h=>h.hp===1000));assert.equal(r.battle.bossState.move,'strike');copy(thunder);
  const frozen=boss('thunder','nixie');frozen.run.battle.bossState.move='surge';E.petAction(frozen);E.enemyTurn(frozen);assert.equal(frozen.run.battle.bossState.move,'strike');assert.ok(frozen.run.heroes.every(h=>h.hp===1000));copy(frozen);
});

test('voidfox cannot drain damage absorbed by shields',()=>{
  const s=boss('shadow'),r=s.run,e=r.battle.enemies[0];e.hp=4000;r.heroes[0].shield=1000;r.battle.bossState.move='signature';E.enemyTurn(s);assert.equal(e.hp,4000);assert.equal(r.heroes[0].hp,1000);copy(s);
});

test('malformed adventure imports cannot create fake pets, cores, daily flags or boss rewards',()=>{
  const base=state();E.startDungeon(base,'earth',1,day);
  const edits=[s=>delete s.adventure,s=>s.adventure.cores.fire=-1,s=>s.adventure.pets.mossling.level=21,s=>s.adventure.equipped='raiju',s=>s.run.pet.level=2,s=>s.run.pet.nextRound=0,s=>s.run.dungeon.id='missing',s=>s.run.dungeon.day='2026-02-30',s=>s.run.routes=['rest'],s=>s.run.cleared=2,s=>s.adventure.days['2026-10-20']={'earth-3':true}];
  for(const edit of edits){const s=structuredClone(base);edit(s);assert.throws(()=>copy(s));}
  let won=clear(state(100),'earth');
  for(const edit of [s=>s.run.summary.dungeonReward.cores=42,s=>s.run.summary.dungeonReward.first='true',s=>s.run.summary.cleared=2,s=>s.run.summary.reason='retreat']){const s=structuredClone(won);edit(s);assert.throws(()=>copy(s));}
});

test('recommended teams and levelled pets can finish every dungeon without stalled battles',()=>{
  for(const d of DUNGEONS){let s=state(5);const pet=PETS.find(p=>p.element===d.id);ownPet(s,pet.id,5);
    for(const [tier,level] of [[1,5],[2,15],[3,25]]){for(const h of Object.values(s.owned))h.level=level;s=clear(s,d.id,tier);}
  }
});
