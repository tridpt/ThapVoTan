import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HERO,HEROES,BOSS} from '../js/data.mjs';
import {DUNGEON,DUNGEON_BOSSES} from '../js/adventure-data.mjs';
import {linkControl,linkDialog} from '../js/links-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function account(team=['rook','aerin','lumi'],level=1){
  const s=E.createState();s.gold=100000;s.welcome=true;s.team=[...team];
  for(const h of HEROES)s.owned[h.id]={level,copies:0,awaken:0};return s;
}
function durable(s){
  for(const e of s.run.battle.enemies)Object.assign(e,{hp:50000,maxHp:50000,def:0,atk:1,shield:0});
  if(s.run.battle.bossState)s.run.battle.bossState.parts=E.createBossParts(s.run.battle.enemies[0]);
  s.run.resonances=[];return s;
}
function battle(team=['rook','aerin','lumi'],boss=false){
  const s=account(team);if(boss)E.startHunt(s,'colossus',1,42);else{E.startRun(s,42);E.chooseRoute(s,0);}
  durable(s);s.run.link.charge=100;return s;
}
function teamFor(spec){
  const ids=[];for(const element of spec.elements)ids.push(HEROES.find(h=>h.element===element.name&&!ids.includes(h.id)).id);
  ids.push(HEROES.find(h=>!ids.includes(h.id)).id);return ids;
}
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}
const direct=events=>events.filter(e=>!e.heal&&!e.shieldGrant);

test('all 28 unordered elemental links exist, are distinct and support every hero in either selection order',()=>{
  assert.equal(Object.keys(E.LINKS).length,28);assert.equal(new Set(Object.values(E.LINKS).map(s=>s.name)).size,28);
  for(const spec of Object.values(E.LINKS)){
    const team=teamFor(spec);assert.equal(E.linkForPair(...team.slice(0,2)),spec);assert.equal(E.linkForPair(team[1],team[0]),spec);
    assert.ok(E.linkDescription(spec).length>0);assert.ok(spec.power>=1&&spec.power<=2.25);
  }
  for(const a of HEROES)for(const b of HEROES)if(a!==b)assert.equal(E.linkForPair(a.id,b.id),E.linkForPair(b.id,a.id));
  assert.equal(E.linkForPair('missing','rook'),null);
});

test('charge grows once per real normal attack or skill including healing and AOE, caps at 100 and ignores enemy and pet turns',()=>{
  const s=battle();s.run.link.charge=0;
  E.playerAction(s,'rook','enemy0');assert.equal(s.run.link.charge,14);
  for(const id of ['aerin','lumi'])s.run.heroes.find(h=>h.id===id).energy=100;
  E.playerAction(s,'lumi','enemy0',true);assert.equal(s.run.link.charge,36);
  E.playerAction(s,'aerin','enemy0',true);assert.equal(s.run.link.charge,58);
  atomic(s,()=>E.playerAction(s,'aerin','enemy0'));assert.equal(s.run.link.charge,58);
  E.enemyTurn(s);assert.equal(s.run.link.charge,58);
  for(const id of ['rook','aerin','lumi'])E.playerAction(s,id,'enemy0');assert.equal(s.run.link.charge,100);
  const pet=account();E.equipPet(pet,'mossling');E.startRun(pet,42);E.chooseRoute(pet,0);E.petAction(pet);assert.equal(pet.run.link.charge,0);
});

test('charge persists across victories, blessing choices and floors and resets only for a new journey',()=>{
  const s=battle();s.run.link.charge=30;s.run.heroes[0].atk=100000;
  for(const e of s.run.battle.enemies)e.hp=1;s.run.heroes[1].energy=100;E.playerAction(s,'aerin','enemy0',true);assert.equal(s.run.link.charge,52);
  assert.equal(s.run.phase,'blessing');assert.equal(copy(s).run.link.charge,52);E.selectBlessing(s,s.run.choices[0]);
  assert.equal(s.run.link.charge,52);s.run.map=null;s.run.routes=['battle'];E.chooseRoute(s,0);assert.equal(s.run.link.charge,52);assert.equal(s.run.battle.linkUsed,false);
  E.finishRun(s);E.startRun(s,43);assert.deepEqual(s.run.link,{charge:0,casts:0});
});

test('link spends one shared bar but no hero action or private energy, even after both heroes already acted',()=>{
  const s=battle(['ember','bryn','rook']),r=s.run;r.battle.used=['ember','bryn','rook'];
  const energy=r.heroes.map(h=>h.energy),wallet=[s.gold,s.tickets,s.shards],hp=r.battle.enemies[0].hp;
  const events=E.linkAction(s,'ember','bryn','enemy0');assert.deepEqual(r.link,{charge:0,casts:1});assert.equal(r.battle.linkUsed,true);
  assert.deepEqual(r.battle.used,['ember','bryn','rook']);assert.deepEqual(r.heroes.map(h=>h.energy),energy);assert.deepEqual([s.gold,s.tickets,s.shards],wallet);
  assert.equal(direct(events).length,2);assert.equal(hp-r.battle.enemies[0].hp,direct(events).reduce((n,e)=>n+e.value,0));
  assert.deepEqual(copy(s),s);atomic(s,()=>E.linkAction(s,'ember','bryn','enemy0'));
});

test('invalid pairs, dead heroes, targets, parts, insufficient charge and ended fights reject without consuming RNG or state',()=>{
  const s=battle();for(const pair of [['rook','rook'],['rook','ember'],['missing','lumi'],[null,'lumi']])atomic(s,()=>E.linkAction(s,...pair,'enemy0'));
  for(const target of ['enemy7',null,'constructor'])atomic(s,()=>E.linkAction(s,'rook','lumi',target));
  atomic(s,()=>E.linkAction(s,'rook','lumi','enemy0','head'));s.run.heroes[0].hp=0;atomic(s,()=>E.linkAction(s,'rook','lumi','enemy0'));
  s.run.heroes[0].hp=10;s.run.link.charge=99;atomic(s,()=>E.linkAction(s,'rook','lumi','enemy0'));
  s.run.link.charge=100;s.run.battle.enemies[0].hp=0;atomic(s,()=>E.linkAction(s,'rook','lumi','enemy0'));
  E.finishRun(s);atomic(s,()=>E.linkAction(s,'rook','lumi','enemy1'));
  const boss=battle(undefined,true);atomic(boss,()=>E.linkAction(boss,'rook','lumi','enemy0','wing'));
});

test('one link per round is enforced independently of charge; enemy turn unlocks the next round without refilling it',()=>{
  const s=battle(['ember','bryn','rook']);E.linkAction(s,'ember','bryn','enemy0');
  s.run.link.charge=100;atomic(s,()=>E.linkAction(s,'ember','bryn','enemy0'));E.enemyTurn(s);
  assert.equal(s.run.battle.linkUsed,false);assert.equal(s.run.link.charge,100);E.linkAction(s,'ember','bryn','enemy0');
  assert.deepEqual(s.run.link,{charge:0,casts:2});E.enemyTurn(s);assert.equal(s.run.link.charge,0);
});

test('every elemental link deals real damage and applies its listed burn, freeze, healing, shield and energy effects',()=>{
  for(const spec of Object.values(E.LINKS)){
    const team=teamFor(spec),s=battle(team),r=s.run;for(const h of r.heroes){h.hp=Math.round(h.maxHp*.4);h.shield=0;h.energy=20;}
    const hp=r.heroes.map(h=>h.hp),wallet=[s.gold,s.tickets,s.shards],events=E.linkAction(s,...team.slice(0,2),'enemy0');
    assert.equal(direct(events).length,spec.aoe?4:2,spec.name);assert.ok(direct(events).every(e=>e.value>0));
    for(const [i,e] of r.battle.enemies.entries()){
      assert.equal(e.hp<e.maxHp,spec.aoe||i===0,spec.name);
      assert.equal(e.burn>0,!!spec.burn&&(spec.aoe||i===0),spec.name);
      assert.equal(e.freeze>0,!!spec.freeze&&(spec.freeze==='all'||i===0),spec.name);
    }
    for(let i=0;i<3;i++){
      assert.equal(r.heroes[i].shield>0,!!spec.shield,spec.name);
      assert.equal(r.heroes[i].hp>hp[i],!!spec.heal||(!!spec.drain&&i<2),spec.name);
      assert.equal(r.heroes[i].energy,20+(spec.energy||0),spec.name);
    }
    assert.deepEqual([s.gold,s.tickets,s.shards],wallet);assert.deepEqual(copy(s),s);
  }
});

test('swapping the selected heroes preserves damage, crit RNG, logs, effects and the resulting saved state',()=>{
  for(const spec of Object.values(E.LINKS)){
    const team=teamFor(spec),a=battle(team),b=copy(a);
    assert.deepEqual(E.linkAction(a,team[0],team[1],'enemy0'),E.linkAction(b,team[1],team[0],'enemy0'));assert.deepEqual(a,b);
  }
});

test('enemy shields absorb both link hits and prevent armor durability damage without adding loot',()=>{
  const s=battle(undefined,true),r=s.run,e=r.battle.enemies[0],parts=structuredClone(E.bossParts(r));e.shield=10000;
  const before=structuredClone(s),events=E.linkAction(s,'rook','aerin','enemy0','head');
  assert.ok(direct(events).every(e=>e.value===0));assert.equal(e.hp,e.maxHp);assert.deepEqual(E.bossParts(r),parts);
  assert.equal(before.run.battle.enemies[0].shield-e.shield,direct(events).reduce((n,h)=>n+h.shield,0));assert.equal(s.gold,before.gold);assert.equal(s.inventory.length,before.inventory.length);
});

test('a combo breaks the selected armor on all eleven bosses, interrupts the head and never damages the other parts',()=>{
  for(const id of Object.keys(BOSS)){
    const s=account(),dungeon=DUNGEON_BOSSES.find(b=>b.id===id);
    if(dungeon){E.startDungeon(s,dungeon.element,1,new Date(),42);s.run.floor=3;s.run.cleared=2;s.run.map=null;s.run.routes=['boss'];E.chooseRoute(s,0);}else E.startHunt(s,id,1,42);
    durable(s);s.run.link.charge=100;const r=s.run,p=E.bossParts(r);p.head.hp=1;const core=structuredClone(p.core),arms=structuredClone(p.arms);
    const events=E.linkAction(s,'rook','lumi','enemy0','head');assert.ok(events.some(e=>e.part?.broken));assert.equal(p.head.hp,0);assert.equal(p.stun,true);assert.deepEqual(p.core,core);assert.deepEqual(p.arms,arms);
    const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);assert.equal(p.stun,false);copy(s);
  }
});

test('breaking the core with the first contribution boosts the second contribution but does not apply damage twice',()=>{
  const a=battle(['ember','bryn','rook'],true);E.bossParts(a.run).core.hp=1;const b=copy(a),enemy=a.run.battle.enemies[0];
  const enhanced=direct(E.linkAction(a,'ember','bryn','enemy0','core')),normal=direct(E.linkAction(b,'ember','bryn','enemy0'));
  assert.equal(enhanced[0].value,normal[0].value);assert.ok(enhanced[1].value>normal[1].value);assert.equal(enemy.maxHp-enemy.hp,enhanced.reduce((n,e)=>n+e.value,0));copy(a);
});

test('link uses snapshotted talents and gives no ordinary skill, awakening, hourglass or skill-energy triggers',()=>{
  const s=account(['ember','bryn','rook'],30);for(let i=0;i<3;i++)E.learnTalent(s,'ember','tempo');for(let i=0;i<3;i++)E.learnTalent(s,'ember','nurture');E.learnTalent(s,'ember','inspire');
  s.owned.ember.awaken=1;s.owned.bryn.awaken=1;E.startHunt(s,'colossus',1,42);durable(s);s.run.link.charge=100;s.run.relics=['hourglass'];
  for(const h of s.run.heroes)h.energy=20;const control=copy(s);E.resetTalents(s,'ember');
  const a=E.linkAction(s,'ember','bryn','enemy0'),b=E.linkAction(control,'ember','bryn','enemy0');assert.deepEqual(a,b);assert.deepEqual(s.run,control.run);
  assert.deepEqual(s.run.heroes.map(h=>h.energy),[20,20,20]);assert.equal(s.run.battle.relicSkillUsed,false);assert.equal(s.run.battle.enemies[0].burn,0);assert.equal(s.run.battle.enemies[0].freeze,0);
});

test('both casters contribute their healing and shield talents, without resurrecting fallen allies',()=>{
  const s=account(['rook','lumi','aerin'],30);for(let i=0;i<3;i++)E.learnTalent(s,'lumi','tempo');for(let i=0;i<3;i++)E.learnTalent(s,'lumi','nurture');
  E.startHunt(s,'colossus',1,42);durable(s);s.run.link.charge=100;s.run.heroes[2].hp=0;
  for(const h of s.run.heroes.slice(0,2)){h.hp=1;h.shield=0;}
  const control=copy(s);control.run.heroes[1].talents={level:30,nodes:{}};
  E.linkAction(s,'rook','lumi','enemy0');E.linkAction(control,'rook','lumi','enemy0');
  assert.ok(s.run.heroes[0].hp>control.run.heroes[0].hp);assert.ok(s.run.heroes[0].shield>control.run.heroes[0].shield);assert.equal(s.run.heroes[2].hp,0);assert.equal(s.run.heroes[2].shield,0);
});

test('iron challenge allows healing only for living heroes and keeps the dead ally out of link pairs',()=>{
  const s=account(['rook','lumi','ember']);E.startChallenge(s,'iron');E.chooseRoute(s,0);durable(s);s.run.link.charge=100;s.run.heroes[2].hp=0;s.run.heroes[0].hp=1;
  atomic(s,()=>E.linkAction(s,'lumi','ember','enemy0'));E.linkAction(s,'rook','lumi','enemy0');assert.equal(s.run.heroes[2].hp,0);assert.ok(s.run.heroes[0].hp>1);copy(s);
});

test('training starts ready, counts direct damage and healing correctly, and never counts granted shield as damage received',()=>{
  const source=account(),before=structuredClone(source),s=E.createTrainingState(source),r=s.run;durable(s);
  assert.equal(r.link.charge,100);r.heroes.forEach(h=>h.hp=Math.round(h.maxHp*.5));const damageBefore=r.training.damage,healBefore=r.training.healing;
  const events=E.linkAction(s,'rook','lumi','enemy0');assert.equal(r.training.damage-damageBefore,direct(events).reduce((n,e)=>n+e.value,0));
  assert.equal(r.training.healing-healBefore,events.filter(e=>e.heal).reduce((n,e)=>n+e.value,0));assert.equal(r.training.received,0);assert.equal(r.training.absorbed,0);assert.deepEqual(source,before);
  assert.equal(E.createTrainingState(source).run.link.charge,100);
});

test('v10 migration preserves every phase, HP, energy, armor, RNG and economy while adding an empty link once',()=>{
  for(const phase of ['route','battle','blessing','relic','event','story','result']){
    const s=account();if(phase==='story')E.startCampaign(s,1,42);else if(phase==='relic'){E.startHunt(s,'colossus',1,42);E.finishRun(s);E.startRun(s,42);s.run.floor=5;s.run.map=null;s.run.routes=['boss'];E.chooseRoute(s,0);s.run.heroes[1].atk=100000;s.run.heroes[1].energy=100;E.playerAction(s,'aerin','enemy0',true);E.selectContract(s,null,s.run.floor);}else{E.startRun(s,42);if(phase==='event'){s.run.map=null;s.run.routes=['event'];E.chooseRoute(s,0);}if(['battle','blessing'].includes(phase)){E.chooseRoute(s,0);if(phase==='battle')E.playerAction(s,'rook','enemy0');else{s.run.heroes[1].atk=100000;s.run.heroes[1].energy=100;E.playerAction(s,'aerin','enemy0',true);}}if(phase==='result')E.finishRun(s);}
    assert.equal(s.run.phase,phase);s.run.map=null;s.version=10;delete s.run.link;if(s.run.battle)delete s.run.battle.linkUsed;const before=structuredClone(s),expected=structuredClone(s);
    expected.version=E.SAVE_VERSION;expected.run.formation=null;expected.run.link=E.starterLink();if(expected.run.battle)expected.run.battle.linkUsed=false;
    const migrated=copy(s);assert.deepEqual(withoutCombatReport(migrated),withoutCombatReport(expected));assert.deepEqual(s,before);assert.deepEqual(copy(migrated),migrated);
  }
});

test('current saves reject missing, extra, fractional, nonfinite and inconsistent link data atomically',()=>{
  const s=battle();const edits=[x=>delete x.run.link,x=>x.run.link=null,x=>x.run.link=[],x=>x.run.link.extra=1,x=>x.run.link.charge=-1,x=>x.run.link.charge=101,x=>x.run.link.charge=1.5,x=>x.run.link.charge='100',x=>x.run.link.charge=NaN,x=>x.run.link.casts=-1,x=>x.run.link.casts=Infinity,x=>x.run.link.casts=1.5,x=>delete x.run.battle.linkUsed,x=>x.run.battle.linkUsed=1,x=>x.run.battle.linkUsed=true];
  for(const edit of edits){const bad=structuredClone(s);edit(bad);const before=structuredClone(bad);assert.throws(()=>E.validateState(bad),/liên kết/);assert.deepEqual(bad,before);}
});

test('links work and save in tower, trials, campaign, seven dungeons, hunts and sandbox',()=>{
  const starts=[s=>E.startRun(s,42),s=>E.startHunt(s,'archivist',1,42),s=>E.startChallenge(s,'humble'),s=>E.startChallenge(s,'iron'),s=>E.startChallenge(s,'gauntlet'),...Object.keys(DUNGEON).map(id=>s=>E.startDungeon(s,id,1,new Date(),42)),s=>{E.startCampaign(s,1,42);E.advanceCampaignStory(s,true);}];
  for(const start of starts){const s=account(['rook','lumi','ember']);start(s);if(s.run.phase==='route')E.chooseRoute(s,0);durable(s);assert.equal(s.run.link.charge,0);s.run.link.charge=100;E.linkAction(s,'rook','lumi','enemy0');assert.deepEqual(copy(s),s);}
});

test('a finishing link commits boss rewards once and cannot be replayed from the finished save',()=>{
  const s=account(['ember','bryn','rook']);E.startHunt(s,'colossus',1,42);s.run.link.charge=100;for(const h of s.run.heroes)h.atk=100000;
  const marks=s.armory.marks.colossus,wins=s.wins;E.linkAction(s,'ember','bryn','enemy0','head');assert.equal(s.run.phase,'result');assert.equal(s.run.link.casts,1);assert.equal(s.armory.marks.colossus,marks+1);assert.equal(s.wins,wins+1);
  const saved=copy(s);atomic(saved,()=>E.linkAction(saved,'ember','bryn','enemy0'));assert.deepEqual(saved,s);
});

test('UI explains all three actual pairs, current charge, targets, costs and blocked heroes without spending resources',()=>{
  const s=battle(),before=structuredClone(s);assert.equal(E.linkPairs(s.run).length,3);
  assert.match(linkControl(s.run),/Sẵn sàng tung combo/);const dialog=linkDialog(s.run,['rook','lumi'],'enemy0');assert.match(dialog,/Thánh thành/);assert.match(dialog,/aria-pressed="true"/);assert.match(dialog,/data-first="rook" data-second="lumi"/);assert.match(dialog,/Không tốn lượt/);
  s.run.heroes[0].hp=0;assert.match(linkDialog(s.run,['rook','lumi'],'enemy0'),/Cả hai anh hùng phải còn sống/);assert.match(linkDialog(s.run,['rook','lumi'],'enemy0'),/data-action="link-fire"[^>]+disabled/);
  s.run.heroes[0].hp=before.run.heroes[0].hp;s.run.link.charge=72;assert.match(linkControl(s.run),/aria-valuenow="72"/);assert.match(linkDialog(s.run),/Cần thêm 28 điểm/);assert.equal(s.gold,before.gold);
});
