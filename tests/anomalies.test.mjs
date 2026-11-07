import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/anomaly-legacy-v1.33.0/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {anomalyBanner,anomalyDetail,anomalyRunInfo,anomalyActionHint} from '../js/anomalies-ui.mjs';
import {towerMapPage} from '../js/tower-map-ui.mjs';
import {withoutCombatReport,withoutResultLedger} from './legacy-report-helper.mjs';
import {condition,neutral,encounter,combat,copy,step} from './anomalies-helper.mjs';
import {combat as contractCombat,boss,sign} from './contracts-helper.mjs';

const hit=events=>events.find(e=>e.target==='enemy0'&&!e.heal);
const noVersion=s=>{const a=withoutResultLedger(s);delete a.version;if(a.run)delete a.run.balanceRules;delete a.achievements;delete a.bonds;delete a.lockedGear;delete a.gearPresets;if(JSON.stringify(a.refining)===JSON.stringify({rolls:0,pending:null}))delete a.refining;if(JSON.stringify(a.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete a.loginRewards;if(JSON.stringify(a.bonds)==='{}')delete a.bonds;if(JSON.stringify(a.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete a.season;return a;};
const atomic=(s,fn)=>{const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);};

test('new normal journeys alone receive a saved order without changing combat or route RNG at departure',()=>{
  const orders=new Set();
  for(let seed=1;seed<=30;seed++){
    const a=E.createState(),b=Old.createState();E.startRun(a,seed);Old.startRun(b,seed);b.run.started=a.run.started;
    assert.equal(a.version,E.SAVE_VERSION);assert.equal(a.run.anomalyRules,1);assert.equal(a.run.seed,b.run.seed);assert.deepEqual(a.run.map,b.run.map);assert.deepEqual(noVersion(neutral(a)),noVersion(b));copy(a);orders.add(a.run.anomalyOrder.join());
  }
  assert.equal(orders.size,6);
  const a=E.createState(),b=E.createState();E.startRun(a,42);E.startRun(b,42);assert.notEqual(a.run.anomalyOrder,b.run.anomalyOrder);assert.deepEqual(a.run.anomalyOrder,b.run.anomalyOrder);
  const starts=[s=>E.startChallenge(s,'iron'),s=>E.startCampaign(s,1,42),s=>E.startDungeon(s,'earth',1,new Date(),42),s=>E.startHunt(s,'colossus',1,42)];
  for(const start of starts){const s=E.createState();start(s);assert.equal(E.anomalyForFloor(s.run),null);assert.equal(s.run.anomalyOrder,undefined);copy(s);}
  const training=E.createTrainingState(a);assert.equal(E.anomalyForFloor(training.run),null);
  const raid=E.createState();raid.best=100;for(const h of HEROES)raid.owned[h.id]={level:1,copies:0,awaken:0};raid.raids.teams=Array.from({length:3},(_,i)=>HEROES.slice(i*3,i*3+3).map(h=>h.id));E.startRaid(raid,1,42);assert.equal(E.anomalyForFloor(raid.run),null);
});

test('forecasts stay fixed for all five floors, include bosses and repeat only after all three conditions',()=>{
  let s=E.createState();E.startRun(s,42);const order=s.run.anomalyOrder,seed=s.run.seed;
  for(const floor of [1,2,5,6,10,11,15,16,20,999996,1000000]){
    const a=E.anomalyForFloor(s.run,floor);assert.equal(a.id,order[Math.floor((floor-1)/5)%3]);assert.equal(a.start,Math.floor((floor-1)/5)*5+1);assert.equal(a.end,a.start+4);
  }
  for(let i=0;i<10;i++){s=copy(s);anomalyBanner(s.run,{forecast:true});anomalyDetail(s.run);assert.equal(s.run.seed,seed);assert.deepEqual(s.run.anomalyOrder,order);}
  for(const floor of [0,-1,NaN,Infinity,'1',1.5,1000001])assert.equal(E.anomalyForFloor(s.run,floor),null);
  E.finishRun(s);copy(s);E.startRun(s,42);assert.deepEqual(s.run.anomalyOrder,order);
});

for(const action of ['attack','skill','link','pet','burn','echo','void','cinder','mirror'])test(`bloodmoon boosts ${action} outgoing damage exactly once and credits actual damage`,()=>{
  const s=combat('bloodmoon',{team:['kira','rook','lumi']}),r=s.run;
  if(action==='link')r.link.charge=100;
  if(action==='pet')r.pet={id:'vermillion',level:1,nextRound:1};
  if(action==='burn'){r.battle.enemies[0].burn=1;r.battle.enemies[0].burnPower=100;for(const e of r.battle.enemies)e.freeze=1;}
  if(action==='echo')r.heroes[0].loadout={sets:[{id:'bloodmoon',count:1}],signature:'kira',weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
  if(action==='void'){r.heroes[0].loadout={sets:[{id:'void',count:3}],signature:null,weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};r.battle.enemies[0].voidMarks=2;}
  if(action==='cinder'){r.relics=['cinder'];Object.assign(r.battle.enemies[0],{hp:1,maxHp:100,burn:1,burnPower:1});}
  if(action==='mirror'){r.relics=['mirror'];r.heroes[0].shield=1;r.battle.enemies=r.battle.enemies.slice(0,1);}
  const base=neutral(s),apply=state=>action==='link'?E.linkAction(state,'kira','rook','enemy0'):action==='pet'?E.petAction(state):['burn','mirror'].includes(action)?E.enemyTurn(state):E.playerAction(state,'kira','enemy0',['skill','echo'].includes(action));
  const ordinary=apply(base).filter(e=>e.target.startsWith('enemy')&&!e.heal),boosted=apply(s).filter(e=>e.target.startsWith('enemy')&&!e.heal);assert.equal(boosted.length,ordinary.length);
  for(let i=0;i<ordinary.length;i++){
    if(ordinary[i].value===1)assert.equal(boosted[i].value,1);
    else if(action==='void'&&i===0){assert.equal(boosted[i].voidBurst,Math.round(ordinary[i].voidBurst*1.2));assert.equal(boosted[i].value-boosted[i].voidBurst,Math.round((ordinary[i].value-ordinary[i].voidBurst)*1.2));}
    else assert.equal(boosted[i].value,Math.round(ordinary[i].value*1.2));
  }
  assert.equal(s.run.seed,base.run.seed);const damage=Object.values(r.battle.statistics.rows).reduce((n,row)=>n+row.damage,0);assert.ok(damage>=boosted.reduce((n,e)=>n+e.value,0));
});

test('bloodmoon incoming damage combines with ambition, defenses, cover and shields; HP skill cost is unchanged',()=>{
  const s=contractCombat(['blood','ambition','sacrifice']);condition(s.run,'bloodmoon');s.run.heroes.forEach(h=>h.shield=1000);const plain=neutral(s),a=E.enemyTurn(plain),b=E.enemyTurn(s);for(let i=0;i<a.length;i++)assert.ok(Math.abs(b[i].shield-a[i].shield*1.2)<=1);
  const costly=contractCombat(['blood','sacrifice']);condition(costly.run,'bloodmoon');const base=neutral(costly),x=E.playerAction(base,'aerin','enemy0',true),y=E.playerAction(costly,'aerin','enemy0',true);assert.equal(y.find(e=>e.contractCost).value,50);assert.equal(hit(y).value,Math.round(hit(x).value*1.2));copy(costly);
});

for(const action of ['heal','pet','link','drain','signature','root'])test(`bloodmoon reduces ${action} recovery in battle and records the amount actually restored`,()=>{
  const s=combat('bloodmoon',{team:action==='drain'?['nyx','rook','lumi']:action==='signature'?['thorne','aerin','lumi']:['rook','aerin','lumi']}),r=s.run;r.heroes.forEach(h=>h.hp=100);
  if(action==='pet'){s.adventure.pets.stella={level:1};r.pet={id:'stella',level:1,nextRound:1};}
  if(action==='link'){s.team=['lumi','aerin','rook'];r.link.charge=100;}
  if(action==='signature')r.heroes[0].loadout={sets:[{id:'bastion',count:1}],signature:'thorne',weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
  if(action==='root'){
    const state=encounter('bloodmoon',{prepare:r=>{r.heroes.forEach(h=>{h.hp=10;h.maxHp=1000;});r.relics=['root'];}});assert.equal(state.run.heroes[0].hp,100);copy(state);return;
  }
  const base=neutral(s),perform=t=>action==='pet'?E.petAction(t):action==='link'?E.linkAction(t,'aerin','lumi','enemy0'):E.playerAction(t,action==='drain'?'nyx':action==='signature'?'thorne':'lumi','enemy0',true);
  const a=perform(base),b=perform(s);
  if(action==='drain')assert.equal(s.run.heroes[0].hp,100+Math.round(Math.round(hit(b).value*.3)*.75));
  else for(let i=0;i<r.heroes.length;i++){const gain=r.heroes[i].hp-100,old=base.run.heroes[i].hp-100;if(old>0)assert.ok(Math.abs(gain-old*.75)<=2);}
  const healed=Object.values(r.battle.statistics.rows).reduce((n,row)=>n+row.healing,0);assert.ok(healed>0);assert.equal(s.run.seed,base.run.seed);copy(s);
});

test('bloodmoon preserves resurrection, post-battle recovery, rest, camp and vitality healing',()=>{
  const dead=combat('bloodmoon');dead.run.heroes[0].hp=0;E.playerAction(dead,'lumi','enemy0',true);assert.equal(dead.run.heroes[0].hp,300);
  const lantern=combat('bloodmoon');lantern.run.heroes[0].hp=1;lantern.run.relics=['lantern'];lantern.run.battle.enemies=lantern.run.battle.enemies.slice(0,1);const ev=E.enemyTurn(lantern);assert.equal(ev.find(e=>e.heal).value,300);
  const s=combat('bloodmoon'),r=s.run;r.heroes.forEach(h=>h.hp=100);r.battle.enemies.forEach(e=>{e.hp=1;e.maxHp=1;});for(const h of r.heroes){if(r.phase!=='battle')break;E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id);}assert.ok(r.heroes.every(h=>h.hp===150));
  r.choices=['vitality','might','focus'];E.selectBlessing(s,'vitality');assert.ok(r.heroes.every(h=>h.hp===330));
  for(const node of ['rest','event']){const t=encounter('bloodmoon',{node,prepare:r=>r.heroes.forEach(h=>{h.maxHp=1000;h.hp=100;})});if(node==='event')E.chooseEvent(t,'leave');assert.ok(t.run.heroes.every(h=>h.hp===(node==='rest'?450:220)));copy(t);}
});

test('bloodmoon reduces boss healing but leaves elite rebirth and boss HP unchanged',()=>{
  const s=combat('bloodmoon',{node:'boss'}),r=s.run,e=r.battle.enemies[0];r.battle.bossState.id='sunlion';r.battle.bossState.move='signature';e.hp=100;e.maxHp=1000;E.enemyTurn(s);assert.equal(e.hp,160);
  const t=encounter('bloodmoon',{floor:11,node:'elite',seed:2});const reborn=t.run.battle.enemies.find(e=>e.elite);assert.equal(reborn.elite.trait,'rebirth');const cap=reborn.maxHp;t.run.heroes[0].atk=10000;E.playerAction(t,'rook',reborn.id);assert.equal(reborn.hp,Math.round(cap*.4));copy(t);
});

test('frost opening subtracts once after normal entry energy, preserves dead heroes and applies root afterwards',()=>{
  const s=encounter('frost',{prepare:r=>{r.heroes[0].energy=100;r.heroes[1].energy=0;r.heroes[2].hp=0;r.heroes[2].energy=10;}});assert.deepEqual(s.run.heroes.map(h=>h.energy),[80,5,35]);const before=structuredClone(s);for(let i=0;i<5;i++)assert.deepEqual(copy(s),s);assert.deepEqual(s,before);
  const root=encounter('frost',{prepare:r=>{r.heroes.forEach(h=>h.energy=0);r.relics=['root'];}});assert.ok(root.run.heroes.every(h=>h.energy===30));
  const low=encounter('frost',{prepare:r=>{r.resonances=[];r.heroes.forEach(h=>h.energy=0);}});assert.ok(low.run.heroes.every(h=>h.energy===0));
});

for(const source of ['barrier','skill','link','pet','gear','chalice'])test(`frost boosts new ${source} shields once, preserving cap and old shield amounts`,()=>{
  const s=combat('frost'),r=s.run;
  if(source==='barrier'){
    const t=encounter('frost',{team:['rook','thorne','lumi'],prepare:r=>{r.buffs=['barrier'];}});for(const h of t.run.heroes)assert.equal(h.shield,Math.round(h.maxHp*.18*1.25*1.3));copy(t);return;
  }
  if(source==='link')r.link.charge=100;
  if(source==='pet')r.pet={id:'mossling',level:1,nextRound:1};
  if(source==='gear')r.heroes[2].loadout={sets:[{id:'bastion',count:3}],signature:null,weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
  if(source==='chalice'){r.relics=['chalice'];r.heroes.forEach(h=>h.hp=h.maxHp);}
  r.heroes.forEach(h=>h.shield=10);const base=neutral(s),apply=t=>source==='pet'?E.petAction(t):source==='link'?E.linkAction(t,'rook','lumi','enemy0'):E.playerAction(t,['chalice','gear'].includes(source)?'lumi':'rook','enemy0',true);
  apply(base);apply(s);assert.ok(r.heroes.some(h=>h.shield>10));for(let i=0;i<r.heroes.length;i++){const value=r.heroes[i].shield-10,old=base.run.heroes[i].shield-10;assert.ok(Math.abs(value-old*1.3)<=1);}
  const snapshot=structuredClone(r.heroes);copy(s);assert.deepEqual(r.heroes,snapshot);
});

test('frost leaves enemy shields unchanged and stops on the next segment without rewriting old hero shields',()=>{
  const s=combat('frost',{node:'boss'}),r=s.run;r.battle.bossState.id='moonwarden';r.battle.bossState.move='barrier';const plain=neutral(s);E.enemyTurn(s);E.enemyTurn(plain);assert.equal(r.battle.enemies[0].shield,plain.run.battle.enemies[0].shield);
  r.floor=5;condition(r,'frost');r.heroes.forEach(h=>h.shield=123);r.phase='blessing';r.choices=['might','focus','armor'];E.selectBlessing(s,'might');assert.notEqual(E.anomalyForFloor(r).id,'frost');assert.ok(r.heroes.every(h=>h.shield===123));
});

test('frost shields combine once with earth resonance and sacrifice while chalice retains its maximum cap',()=>{
  const s=contractCombat(['sacrifice'],{team:['rook','thorne','lumi']}),r=s.run;condition(r,'frost');r.resonances=['earth'];const base=neutral(s);E.playerAction(s,'rook','enemy0',true);E.playerAction(base,'rook','enemy0',true);const hp=r.heroes[0].maxHp;assert.equal(r.heroes[1].shield,Math.round(hp*.22*1.3*1.25*1.3));assert.equal(base.run.heroes[1].shield,Math.round(hp*.22*1.3*1.25));assert.equal(r.heroes[0].hp,850);
  const t=combat('frost');t.run.relics=['chalice'];t.run.heroes.forEach(h=>{h.hp=h.maxHp;h.shield=390;});E.playerAction(t,'lumi','enemy0',true);assert.ok(t.run.heroes.every(h=>h.shield===400));copy(t);
});

test('mana adds exactly 15 energy only to basic attacks, caps at 100 and never charges invalid actions',()=>{
  for(const energy of [0,70,99,100]){
    const s=combat('mana'),h=s.run.heroes[0];h.energy=energy;E.playerAction(s,'rook','enemy0');assert.equal(h.energy,Math.min(100,energy+50));atomic(s,()=>E.playerAction(s,'rook','enemy0'));copy(s);
  }
  for(const action of ['skill','link','pet']){const s=combat('mana');s.run.link.charge=100;s.run.pet={id:'mossling',level:1,nextRound:1};const base=neutral(s),apply=t=>action==='link'?E.linkAction(t,'rook','aerin','enemy0'):action==='pet'?E.petAction(t):E.playerAction(t,'rook','enemy0',true);assert.deepEqual(apply(s),apply(base));assert.deepEqual(s.run.heroes,base.run.heroes);}
});

test('mana basic energy stacks with awakening, energy blessings and weapon affixes once per action',()=>{
  const s=combat('mana'),h=s.run.heroes[0];s.run.buffs=['energy'];h.energy=0;h.awaken=5;h.loadout={sets:[],signature:null,weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:5}};const base=neutral(s);E.playerAction(s,'rook','enemy0');E.playerAction(base,'rook','enemy0');assert.equal(h.energy,85);assert.equal(base.run.heroes[0].energy,70);
});

for(const node of ['battle','elite','boss'])test(`mana increases ${node} max and current HP at spawn without extra RNG or reapplying on reload`,()=>{
  const s=encounter('mana',{node,floor:node==='boss'?5:11}),old=Old.createState();Old.startRun(old,42);Object.assign(old.run,{map:null,floor:s.run.floor,cleared:s.run.floor-1,routes:[node]});Old.chooseRoute(old,0);
  for(let i=0;i<s.run.battle.enemies.length;i++){const a=s.run.battle.enemies[i],b=old.run.battle.enemies[i];const expected=a.elite?Math.round(Math.round(Math.round((node==='elite'?135:100)*(1+(s.run.floor-1)*.155+Math.floor(s.run.floor/10)*.14))*1.2)*1.25):Math.round(b.maxHp*1.2);assert.equal(a.maxHp,expected);assert.equal(a.hp,a.maxHp);assert.equal(a.atk,b.atk);assert.deepEqual(a.elite,b.elite);}
  assert.equal(s.run.seed,old.run.seed);assert.deepEqual(copy(s),s);if(node==='boss')for(const id of E.BOSS_PART_IDS)assert.equal(E.bossParts(s.run)[id].maxHp,Math.round(s.run.battle.enemies[0].maxHp*E.BOSS_PARTS[id].ratio));
});

test('mana summons derive HP from the already boosted boss once and elite revival uses the boosted cap',()=>{
  const s=encounter('mana',{floor:10,node:'boss'}),r=s.run;assert.equal(r.battle.bossState.id,'archivist');E.enemyTurn(s);for(const e of r.battle.enemies.slice(1))assert.equal(e.maxHp,Math.round(r.battle.enemies[0].maxHp*.15));assert.deepEqual(copy(s),s);
  const t=encounter('mana',{floor:11,node:'elite',seed:2}),e=t.run.battle.enemies.find(e=>e.elite);t.run.heroes[0].atk=10000;E.playerAction(t,'rook',e.id);assert.equal(e.hp,Math.round(e.maxHp*.4));copy(t);
});

test('condition effects never change flat rewards or respend resources on reload or retreat',()=>{
  for(const id of ['bloodmoon','frost','mana']){const s=combat(id),base=neutral(s);for(const t of [s,base]){t.run.battle.enemies.forEach(e=>e.hp=1);for(const h of t.run.heroes){if(t.run.phase!=='battle')break;E.playerAction(t,h.id,t.run.battle.enemies.find(e=>e.hp>0).id);}}assert.deepEqual(s.run.lastReward,base.run.lastReward);assert.deepEqual([s.gold,s.tickets,s.shards,s.dust],[base.gold,base.tickets,base.shards,base.dust]);const paid=s.gold;E.finishRun(s);copy(s);assert.equal(s.gold,paid);assert.equal(s.run.summary.gold,s.run.goldEarned);}
});

const invalid=[['missing rules',s=>delete s.run.anomalyRules],['missing order',s=>delete s.run.anomalyOrder],['unknown rules',s=>s.run.anomalyRules=2],['string rules',s=>s.run.anomalyRules='1'],['null order',s=>s.run.anomalyOrder=null],['object order',s=>s.run.anomalyOrder={}],['empty order',s=>s.run.anomalyOrder=[]],['short order',s=>s.run.anomalyOrder.pop()],['long order',s=>s.run.anomalyOrder.push('mana')],['repeat order',s=>s.run.anomalyOrder[1]=s.run.anomalyOrder[0]],['unknown id',s=>s.run.anomalyOrder[1]='constructor'],['boxed id',s=>s.run.anomalyOrder[1]=new String(s.run.anomalyOrder[1])],['wrong mode',s=>s.run.mode='challenge']];
for(const [label,alter] of invalid)test(`anomaly import rejects without mutating the source: ${label}`,()=>{const s=encounter('mana');alter(s);atomic(s,()=>E.validateState(s));});

test('forecasts and battle UI expose costs, duration and next condition without consuming RNG or hiding actual conditions from traces',()=>{
  for(const id of ['bloodmoon','frost','mana']){const s=E.createState();E.startRun(s,42);condition(s.run,id);const before=structuredClone(s),html=towerMapPage(s);assert.match(html,/DỊ BIẾN/);assert.match(html,/Chặng kế/);assert.match(html,/data-action="anomaly-info"/);assert.match(html,new RegExp(E.anomalyForFloor(s.run).name));assert.match(anomalyDetail(s.run),/cả hai bên/);assert.match(anomalyRunInfo(s.run),/Xem luật/);assert.equal(!!anomalyActionHint(s.run),id==='mana');assert.deepEqual(s,before);assert.deepEqual(withoutCombatReport(s).run.anomalyOrder,s.run.anomalyOrder);}
  const old=Old.createState();Old.startRun(old,42);assert.equal(anomalyBanner(old.run),'');assert.equal(anomalyDetail(old.run),'');assert.equal(anomalyRunInfo(old.run),'');
});

for(const phase of ['route','battle','event','blessing','contract','relic','result'])test(`released 1.33 ${phase} save preserves exact original state and continues without anomalies`,()=>{
  const old=Old.createState();Old.startRun(old,42);old.run.map=null;
  if(['contract','relic'].includes(phase)){boss(old,5,Old);if(phase==='relic')Old.selectContract(old,'blood',5);}
  else if(phase==='battle')Old.chooseRoute(old,0);
  else if(phase==='event'){old.run.routes=['event'];Old.chooseRoute(old,0);}
  else if(phase==='blessing'){old.run.routes=['rest'];Old.chooseRoute(old,0);}
  else if(phase==='result')Old.finishRun(old);
  const before=structuredClone(old);let current=copy(old);assert.deepEqual(old,before);assert.deepEqual(noVersion(current),noVersion(old));assert.equal(current.run.anomalyOrder,undefined);
  if(phase!=='result')for(let n=0;n<25&&old.run.phase!=='result';n++){assert.equal(step(E,current),step(Old,old));assert.deepEqual(noVersion(current),noVersion(old));current=copy(current);}
});
