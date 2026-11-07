import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {BOSS,BOSSES,HERO} from '../js/data.mjs';
import {DUNGEON_BOSSES} from '../js/adventure-data.mjs';
import {bossPartsPanel,bossThreatMarkup} from '../js/boss-parts-ui.mjs';
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function boss(id='colossus'){
  const s=E.createState(),element=DUNGEON_BOSSES.find(b=>b.id===id);if(element){E.startDungeon(s,element.element,1,new Date(),42);Object.assign(s.run,{floor:3,cleared:2,routes:['boss']});E.chooseRoute(s,0);}else E.startHunt(s,id,1,42);
  for(const h of s.run.heroes)Object.assign(h,{hp:10000,maxHp:10000,atk:50,def:0,energy:100});return s;
}
function reset(s){s.run.battle.used=[];for(const h of s.run.heroes)h.energy=100;}
function breakPart(s,id){const p=E.bossParts(s.run);while(p[id].hp>0&&s.run.phase==='battle'){reset(s);E.playerAction(s,'rook','enemy0',false,id);}assert.equal(p[id].hp,0);assert.equal(s.run.phase,'battle');}
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}

test('all eleven bosses create separate part durability, names and unchanged shared HP in every combat mode',()=>{
  for(const id of Object.keys(BOSS)){const s=boss(id),r=s.run,e=r.battle.enemies[0],p=E.bossParts(r);assert.equal(p.selected,'head');assert.equal(p.stun,false);for(const part of E.BOSS_PART_IDS){assert.equal(p[part].hp,Math.max(1,Math.round(e.maxHp*E.BOSS_PARTS[part].ratio)));assert.match(E.bossPartName(id,part),/./);}const next=boss(id);p.head.hp--;assert.equal(E.bossParts(next.run).head.hp,p.head.maxHp);copy(s);}
  const campaign=E.createState();campaign.campaign.cleared=2;E.startCampaign(campaign,3,42);E.advanceCampaignStory(campaign,true);campaign.run.floor=3;campaign.run.cleared=2;campaign.run.map=null;campaign.run.routes=['boss'];E.chooseRoute(campaign,0);assert.ok(E.bossParts(campaign.run));copy(campaign);
  const tower=E.createState();E.startRun(tower,42);tower.run.floor=5;tower.run.map=null;tower.run.routes=['boss'];E.chooseRoute(tower,0);assert.ok(E.bossParts(tower.run));
  const trial=E.createState();E.startChallenge(trial,'gauntlet');E.chooseRoute(trial,0);assert.ok(E.bossParts(trial.run));assert.ok(E.bossParts(E.createTrainingState(E.createState()).run));
});

test('v8 saves retain existing boss HP, moves, gear and rewards, enabling parts only at the next battle',()=>{
  for(const id of Object.keys(BOSS)){const s=boss(id);E.playerAction(s,'rook','enemy0');s.version=8;delete s.run.battle.bossState.parts;const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.equal(E.bossParts(m.run),null);assert.deepEqual(withoutCombatReport(m.run),withoutCombatReport({...s.run,formation:null,link:E.starterLink(),heroes:s.run.heroes.map(h=>({...h,talents:null})),battle:{...s.run.battle,bossState:{...s.run.battle.bossState,parts:null}}}));for(const key of Object.keys(s).filter(k=>!['run','version'].includes(k)))assert.deepEqual(m[key],s[key],key);assert.deepEqual(copy(m),m);E.finishRun(m);if(DUNGEON_BOSSES.some(d=>d.id===id)){E.startRun(m,43);m.run.floor=5;m.run.map=null;m.run.routes=['boss'];E.chooseRoute(m,0);}else E.startHunt(m,id,1,43);assert.ok(E.bossParts(m.run));}
});

test('selected parts persist without consuming a hero turn or changing the enemy or wallet',()=>{
  let s=boss();const before=structuredClone(s);E.selectBossPart(s,'arms');assert.equal(E.bossParts(s.run).selected,'arms');assert.deepEqual(s.run.battle.used,[]);s=copy(s);assert.equal(E.bossParts(s.run).selected,'arms');assert.deepEqual(s.run.battle.enemies,before.run.battle.enemies);assert.equal(s.gold,before.gold);for(const id of ['',undefined,'constructor','__proto__',1,'wing'])atomic(s,()=>E.selectBossPart(s,id));E.finishRun(s);atomic(s,()=>E.selectBossPart(s,'head'));
});

test('direct targeted damage hits shared boss HP and only one part, with no extra loot or resources',()=>{
  const s=boss(),control=structuredClone(s),before=structuredClone(s),p=E.bossParts(s.run),hit=E.playerAction(s,'rook','enemy0',false,'arms')[0],normal=E.playerAction(control,'rook','enemy0')[0];assert.equal(hit.value,normal.value);assert.equal(hit.part.id,'arms');assert.equal(hit.part.damage,hit.value);assert.equal(p.arms.hp,before.run.battle.bossState.parts.arms.hp-hit.value);assert.deepEqual(p.head,before.run.battle.bossState.parts.head);assert.deepEqual(p.core,before.run.battle.bossState.parts.core);assert.equal(s.run.battle.enemies[0].hp,before.run.battle.enemies[0].hp-hit.value);assert.equal(s.gold,before.gold);assert.equal(s.wins,before.wins);copy(s);
});

test('invalid part attacks fail before spending energy, using a turn, advancing RNG or changing HP',()=>{
  const s=boss();for(const id of ['',undefined,'constructor',1,'wing']){if(id!==undefined)atomic(s,()=>E.playerAction(s,'rook','enemy0',true,id));}const regular=E.createState();E.startRun(regular,42);E.chooseRoute(regular,0);atomic(regular,()=>E.playerAction(regular,'rook','enemy0',true,'head'));s.run.battle.bossState.parts=null;atomic(s,()=>E.playerAction(s,'rook','enemy0',true,'head'));
});

test('shields block part damage, while shield-breaking skills still remove durability using actual HP lost',()=>{
  const s=boss('moonwarden'),r=s.run,e=r.battle.enemies[0],p=E.bossParts(r);e.shield=10000;const before=structuredClone(p),hit=E.playerAction(s,'rook','enemy0',false,'head')[0];assert.equal(hit.value,0);assert.equal(hit.part,undefined);assert.deepEqual(p,before);reset(s);const skill=E.playerAction(s,'aerin','enemy0',true,'head')[0];assert.equal(e.shield,0);assert.ok(skill.part.damage>0);assert.equal(skill.part.damage,Math.min(before.head.hp,skill.value));copy(s);
});

test('head breaks cancel queued moves on all eleven bosses, skip exactly one action and never replay after reload',()=>{
  for(const id of Object.keys(BOSS)){let s=boss(id),bs=s.run.battle.bossState;bs.move=Object.hasOwn(BOSS[id].moves,'signature')?'signature':Object.hasOwn(BOSS[id].moves,'quake')?'quake':Object.keys(BOSS[id].moves)[0];breakPart(s,'head');assert.equal(bs.move,'strike');assert.equal(bs.parts.stun,true);assert.equal(E.bossThreat(s.run).kind,'safe');s=copy(s);const before=s.run.heroes.map(h=>h.hp),events=E.enemyTurn(s);assert.equal(events.length,0);assert.deepEqual(s.run.heroes.map(h=>h.hp),before);assert.equal(E.bossParts(s.run).stun,false);s=copy(s);E.enemyTurn(s);assert.ok(s.run.heroes.some((h,i)=>h.hp<before[i]));copy(s);}
});

test('arm breaks reduce boss attack by twenty percent but do not weaken summoned minions or restore on healing',()=>{
  const s=boss(),p=E.bossParts(s.run);breakPart(s,'arms');assert.equal(E.bossAttackMultiplier(s.run),.8);const a=structuredClone(s),b=structuredClone(s);b.run.battle.bossState.parts.arms.hp=1;for(const st of [a,b]){const e=st.run.battle.enemies[0];e.atk=100;e.intent=0;st.run.battle.bossState.phase=1;st.run.battle.bossState.move='strike';}assert.equal(E.enemyTurn(a)[0].value,80);assert.equal(E.enemyTurn(b)[0].value,100);s.run.battle.enemies[0].hp=s.run.battle.enemies[0].maxHp;copy(s);assert.equal(p.arms.hp,0);
  const arch=boss('archivist');breakPart(arch,'arms');arch.run.battle.bossState.parts.stun=false;arch.run.battle.bossState.move='summon';E.enemyTurn(arch);const control=structuredClone(arch);control.run.battle.bossState.parts.arms.hp=1;const left=E.enemyTurn(arch),right=E.enemyTurn(control);assert.deepEqual(left.slice(-2),right.slice(-2));
});

test('core breaks add twenty-five percent to future direct hero hits, with no increase to burn or reflected damage',()=>{
  const s=boss();breakPart(s,'core');assert.equal(E.bossDirectMultiplier(s.run),1.25);const control=structuredClone(s);control.run.battle.bossState.parts.core.hp=1;reset(s);reset(control);const boosted=E.playerAction(s,'aerin','enemy0')[0],normal=E.playerAction(control,'aerin','enemy0')[0];assert.ok(Math.abs(boosted.value-normal.value*1.25)<=1);assert.equal(E.bossParts(s.run).core.hp,0);const again=structuredClone(s);again.run.battle.bossState.parts.core.hp=1;for(const st of [s,again]){Object.assign(st.run.battle.enemies[0],{burn:1,burnPower:10});st.run.battle.bossState.move='strike';}assert.equal(E.enemyTurn(s)[0].value,10);assert.equal(E.enemyTurn(again)[0].value,10);copy(s);
});

test('AoE, healing, pets, damage over time and signature echoes cannot break extra parts',()=>{
  const s=boss('archivist');E.enemyTurn(s);const before=structuredClone(E.bossParts(s.run));E.playerAction(s,'aerin','enemy0',true,'core');assert.deepEqual(E.bossParts(s.run).head,before.head);assert.deepEqual(E.bossParts(s.run).arms,before.arms);assert.ok(E.bossParts(s.run).core.hp<before.core.hp);reset(s);const after=structuredClone(E.bossParts(s.run));E.playerAction(s,'lumi','enemy0',true,'head');assert.deepEqual(E.bossParts(s.run),after);E.petAction(s);assert.deepEqual(E.bossParts(s.run),after);s.run.battle.enemies[0].burn=1;s.run.battle.enemies[0].burnPower=2;E.enemyTurn(s);assert.deepEqual(E.bossParts(s.run),after);copy(s);
  const echo=boss();echo.owned.kira={level:1,copies:0,awaken:0};echo.run.heroes[0].id='kira';echo.run.statistics=E.starterStatistics(echo.run);echo.run.battle.statistics=E.starterStatistics(echo.run);echo.run.heroes[0].atk=10;echo.run.heroes[0].loadout={signature:'kira',sets:[{id:'bloodmoon',count:1}]};const p=structuredClone(E.bossParts(echo.run)),hits=E.playerAction(echo,'kira','enemy0',true,'arms');assert.equal(hits.length,2);assert.ok(hits[0].part);assert.equal(hits[1].part,undefined);assert.equal(E.bossParts(echo.run).arms.hp,p.arms.hp-hits[0].part.damage);
});

test('killing blows, burns and pet actions clear pending head stun without double-paying battle rewards',()=>{
  for(const method of ['attack','burn','pet']){const s=boss(),r=s.run,e=r.battle.enemies[0];breakPart(s,'head');e.hp=1;reset(s);if(method==='attack')E.playerAction(s,'rook','enemy0',false,'core');if(method==='burn'){e.burn=1;e.burnPower=100;E.enemyTurn(s);}if(method==='pet'){s.adventure.pets.raiju={level:1};r.pet={id:'raiju',level:1,nextRound:1};E.petAction(s);}assert.equal(r.phase,'result');assert.equal(E.bossParts(r).stun,false);const before=structuredClone(s);E.finishRun(s);assert.deepEqual(s,before);copy(s);}
});

test('the next-action threat marks exactly the heroes actually attacked by every move of all eleven bosses',()=>{
  for(const [id,b] of Object.entries(BOSS))for(const move of Object.keys(b.moves))for(const down of [null,'rook']){const s=boss(id),r=s.run;r.battle.bossState.move=move;if(down)r.heroes[0].hp=0;const threat=E.bossThreat(r),events=E.enemyTurn(s).filter(e=>r.heroes.some(h=>h.id===e.target)&&!e.heal);const actual=[...new Set(events.map(e=>e.target))];if(threat.kind==='attack')assert.deepEqual(threat.targets,actual,`${id}/${move}/${down}`);else assert.equal(actual.length,0,`${id}/${move}`);copy(s);}
});

test('frozen or interrupted bosses show safe zones and do not mark fallen heroes',()=>{
  const s=boss();s.run.battle.bossState.move='quake';s.run.heroes[0].hp=0;assert.deepEqual(E.bossThreat(s.run).targets,['aerin','lumi']);s.run.battle.enemies[0].freeze=1;assert.equal(E.bossThreat(s.run).kind,'safe');assert.deepEqual(E.bossThreat(s.run).targets,[]);assert.equal(E.bossThreat(null),null);s.run.battle.enemies[0].freeze=0;assert.match(bossThreatMarkup(s.run),/Aerin \/ Lumi/);assert.doesNotMatch(bossThreatMarkup(s.run),/Rook/);
});

test('malformed imported parts, illegal stuns and forged boss identities are rejected without changing input',()=>{
  const base=boss();for(const alter of [s=>delete s.run.battle.bossState.parts,s=>s.run.battle.bossState.parts={},s=>s.run.battle.bossState.parts.selected='__proto__',s=>s.run.battle.bossState.parts.stun=true,s=>s.run.battle.bossState.parts.head.hp=-1,s=>s.run.battle.bossState.parts.head.hp=.5,s=>s.run.battle.bossState.parts.head.maxHp++,s=>s.run.battle.bossState.parts.extra=true,s=>s.run.battle.bossState.parts.core.extra=true,s=>s.run.battle.enemies[0].bossId='archivist']){const bad=structuredClone(base);alter(bad);const before=structuredClone(bad);assert.throws(()=>E.validateState(bad));assert.deepEqual(bad,before);}const dead=structuredClone(base);dead.run.battle.enemies[0].hp=0;dead.run.battle.bossState.parts.head.hp=0;dead.run.battle.bossState.parts.stun=true;assert.throws(()=>copy(dead));
});

test('part break state and target survive JSON backup without granting resources or changing campaign progression',()=>{
  let s=boss();breakPart(s,'arms');E.selectBossPart(s,'arms');const before=structuredClone(s);s=copy(s);assert.deepEqual(s,before);assert.equal(E.bossAttackMultiplier(s.run),.8);assert.equal(s.campaign.cleared,0);assert.deepEqual(s.armory.marks,before.armory.marks);const p=E.bossParts(s.run),html=bossPartsPanel(s.run);assert.match(html,/1\/3 đã phá/);assert.match(html,/data-part="arms" aria-pressed="true"/);assert.match(html,/ĐÃ PHÁ/);assert.equal((html.match(/data-action="boss-part"/g)||[]).length,3);assert.deepEqual(E.bossParts(s.run),p);
});

test('training supports parts while preserving the source account and never adding real rewards',()=>{
  const source=E.createState();E.startCampaign(source,1,42);E.advanceCampaignStory(source);const before=structuredClone(source),s=E.createTrainingState(source,{level:20});for(const h of s.run.heroes)h.atk=50;breakPart(s,'head');E.selectBossPart(s,'core');assert.throws(()=>copy(s));assert.deepEqual(source,before);assert.equal(s.gold,source.gold);assert.equal(s.run.mode,'training');
});
