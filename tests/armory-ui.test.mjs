import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import * as data from '../js/data.mjs';
import * as art from '../js/art.mjs';
import * as expansion from '../js/expansion-ui.mjs';
import * as progression from '../js/progression-ui.mjs';
import * as rarity from '../js/rarity-ui.mjs';
import * as summoningUI from '../js/summoning-ui.mjs';
import * as onboardingUI from '../js/onboarding-ui.mjs';
import * as adventure from '../js/adventure-ui.mjs';
import * as adventureData from '../js/adventure-data.mjs';
import * as armory from '../js/armory-ui.mjs';
import * as expeditions from '../js/expeditions-ui.mjs';
import * as campaignUI from '../js/campaign-ui.mjs';
import * as preferencesUI from '../js/preferences-ui.mjs';
import * as bossPartsUI from '../js/boss-parts-ui.mjs';
import * as talentsUI from '../js/talents-ui.mjs';
import * as gameUI from '../js/game-ui.mjs';
import * as achievementsUI from '../js/achievements-ui.mjs';
import * as linksUI from '../js/links-ui.mjs';
import * as formationUI from '../js/formation-ui.mjs';
import * as skinUI from '../js/skins-ui.mjs';
import {hasUltimate} from '../js/ultimate-data.mjs';
import * as towerMapUI from '../js/tower-map-ui.mjs';
import * as resultAdviceUI from '../js/result-advice.mjs';
import * as victoryUI from '../js/victory-ui.mjs';
import * as eliteUI from '../js/elites-ui.mjs';
import * as contractUI from '../js/contracts-ui.mjs';
import * as anomalyUI from '../js/anomalies-ui.mjs';
import {condition as anomalyCondition} from './anomalies-helper.mjs';
import {offer as contractOffer,combat as contractCombat} from './contracts-helper.mjs';
import {encounter as eliteEncounter,champion as eliteChampion,win as eliteWin} from './elites-helper.mjs';
import * as raidUI from '../js/raid-ui.mjs';
import {worldForRun} from '../js/worlds3d.mjs';
import {BattlePlayback} from '../js/playback.mjs';
import * as timingGuardUI from '../js/timing-guard-ui.mjs';
import * as counterUI from '../js/counter-ui.mjs';
import * as gearPresetUI from '../js/gear-presets-ui.mjs';
import * as teamLoadoutUI from '../js/team-loadouts-ui.mjs';
import * as refiningUI from '../js/refining-ui.mjs';
import * as loginRewardsUI from '../js/login-rewards-ui.mjs';
import * as bondsUI from '../js/bonds-ui.mjs';
import * as seasonUI from '../js/season-ui.mjs';
import * as touchUI from '../js/touch-ui.mjs';
import {TouchLayout} from '../js/touch-layout.mjs';
import {guardBattle} from './timing-guard-helper.mjs';
import {GameAudio,battleSoundProfile} from '../js/audio.mjs';
import {FakeAudioContext} from './audio-helper.mjs';
import {account as dragonAccount,DRAGON} from './void-dragon-helper.mjs';

// Exercise the real app handlers and markup offline. These stubs do not render a UI or WebGL.
function harness(saved,{onCinematic=null,onTravel=null,onBattle=null,onGuard=null,stored={}}={}){
  const travelCalls=[],cinematicCalls=[],guardCalls=[],audioContexts=[],preferences={timingGuard:stored['thap-vo-tan-timing-guard']!=='off',cinematics:false,brief:true,cameraMotion:true,cameraShake:true,automatic:true,showFps:false,batterySaver:stored['thap-vo-tan-battery-saver']==='on'};
  const key='thap-vo-tan-v1',writes=[],storage=new Map([[key,JSON.stringify(saved)],...Object.entries(stored)]),handlers={},windowHandlers={},timers=new Map();let nextTimer=0;
  const element=()=>({innerHTML:'',className:'',classList:{add(){},remove(){}},append(){},remove(){},setAttribute(){},removeAttribute(){},querySelector(){return null;},querySelectorAll(){return [];},focus(){}});
  const app=element(),modal=element(),toasts=element();
  const nodes=new Map();
  const document={hidden:false,body:element(),activeElement:null,querySelector:selector=>({'#app':app,'#modal-root':modal,'#toasts':toasts}[selector]||null),querySelectorAll:selector=>nodes.get(selector)||[],createElement:element,addEventListener:(name,fn)=>handlers[name]=fn};
  const window={addEventListener:(name,fn)=>windowHandlers[name]=fn,scrollTo(){},matchMedia:()=>({matches:false})};
  const context=vm.createContext({...data,...art,...expansion,...progression,...rarity,...summoningUI,...onboardingUI,...adventure,...adventureData,...armory,...expeditions,...campaignUI,...preferencesUI,...bossPartsUI,...talentsUI,...gameUI,...achievementsUI,...linksUI,...formationUI,...skinUI,...towerMapUI,...victoryUI,...resultAdviceUI,...eliteUI,...contractUI,...anomalyUI,...raidUI,...counterUI,...gearPresetUI,...teamLoadoutUI,...refiningUI,...loginRewardsUI,...bondsUI,...seasonUI,...touchUI,TouchLayout,hasUltimate,E,BattlePlayback,Date,
    TimingGuardPrompt:class{constructor(){this.current=null;}get active(){return !!this.current;}cancel(){const p=this.current;if(p){this.current=null;p('miss');}}play(...args){guardCalls.push(args);return new Promise(resolve=>{this.current=resolve;Promise.resolve(onGuard?onGuard(...args):'miss').then(grade=>{if(this.current===resolve){this.current=null;resolve(grade);}});});}},
    timingGuardEnabled:()=>preferences.timingGuard,setTimingGuardEnabled:v=>{preferences.timingGuard=v;storage.set('thap-vo-tan-timing-guard',v?'on':'off');},timingGuardSettings:()=>timingGuardUI.timingGuardSettings(preferences.timingGuard),timingGuardHint:(r,a)=>timingGuardUI.timingGuardHint(r,a,preferences.timingGuard),battleSoundProfile,GameAudio:class extends GameAudio{constructor(){super({preloadScheduler:{schedule:fn=>{timers.set(++nextTimer,{fn,delay:90});return nextTimer;},cancel:id=>timers.delete(id)},storage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{writes.push({key:k,value:v});storage.set(k,v);}},createContext:()=>{const c=new FakeAudioContext();audioContexts.push(c);return c;}});}},worldForRun,document,window,console,structuredClone,performance,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{writes.push({key:k,value:v});storage.set(k,v);}},setTimeout:(fn,delay)=>{timers.set(++nextTimer,{fn,delay});return nextTimer;},clearTimeout:id=>timers.delete(id),
    performanceStatus:()=>({fps:preferences.batterySaver?30:60,reason:preferences.batterySaver?'Tiết kiệm pin':null}),performanceSettings:()=>({automatic:preferences.automatic,showFps:preferences.showFps,batterySaver:preferences.batterySaver}),setPerformanceSetting:(key,value)=>{preferences[key]=value;storage.set('thap-vo-tan-'+({automatic:'auto-performance',showFps:'show-fps',batterySaver:'battery-saver'}[key]),value?'on':'off');},mountVisuals(){},towerMapTravel:(id,options)=>{travelCalls.push({id,options});return onTravel?onTravel(id,options):{duration:0,impact:0};},stopTowerMapTravel(){},battleEffect:(...args)=>onBattle?onBattle(...args):({duration:0,impact:0}),playUltimate:async(id,options)=>{cinematicCalls.push({id,options});return onCinematic?onCinematic(id,options):false;},skipUltimate:()=>false,cinematicsEnabled:()=>preferences.cinematics,setCinematicsEnabled:v=>preferences.cinematics=v,briefAutoEnabled:()=>preferences.brief,setBriefAutoEnabled:v=>preferences.brief=v,battleCameraEnabled:()=>preferences.cameraMotion,setBattleCameraEnabled:v=>preferences.cameraMotion=v,cameraShakeEnabled:()=>preferences.cameraShake,setCameraShakeEnabled:v=>preferences.cameraShake=v,hapticsEnabled:()=>true,setHapticsEnabled(){},battleHaptic(){}});
  const source=readFileSync(new URL('../js/app.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');vm.runInContext(source,context,{filename:'app.mjs'});
  return {app,modal,writes,window,document,storage,cinematicCalls,travelCalls,guardCalls,audioContexts,preferences,windowHandlers,nodes,inspect:expression=>vm.runInContext(expression,context),tickAuto:async()=>{const job=[...timers].find(([,v])=>[310,670].includes(v.delay));assert.ok(job,'auto timer scheduled');timers.delete(job[0]);await job[1].fn();},
    tickWelcome:()=>{const job=[...timers].find(([,v])=>v.delay===350);assert.ok(job,'welcome timer scheduled');timers.delete(job[0]);job[1].fn();},
    tickSummon:()=>{const job=[...timers].find(([,v])=>[250,850,1060,1270,1480,1690,1900,2110].includes(v.delay));assert.ok(job,'summon timer scheduled');timers.delete(job[0]);job[1].fn();},
    press:async(action,attributes={})=>handlers.click({preventDefault(){},target:{closest:()=>({disabled:false,dataset:{action,...attributes}})}}),
    change:(key,value,slot)=>handlers.change({target:{dataset:{training:key,slot},value}}),voyageHero:value=>handlers.change({target:{dataset:{expedition:'hero'},value}}),presetName:(slot,value)=>handlers.change({target:{dataset:{presetName:String(slot)},value}}),gearPresetName:(hero,slot,value)=>handlers.change({target:{dataset:{gearPresetName:String(slot),hero},value}}),keydown:key=>handlers.keydown({key,preventDefault(){}}),visibility:()=>handlers.visibilitychange()};
}

const counterButton=h=>{const p=h.inspect('pendingCounter');return {id:p.heroId,target:p.targetId,part:p.partId||'body',round:String(p.receipt.round),stamp:String(p.receipt.stamp)};};
const counterBattle=()=>{const s=guardBattle();const receipt=E.beginTimingGuard(s);E.enemyTurn(s,{...receipt,grade:'perfect'});return s;};

test('touch controls expose all three actors and target selection leaves the combat snapshot exact',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);E.chooseRoute(s,0);const h=harness(s),before=structuredClone(h.inspect('state'));
  assert.match(h.app.innerHTML,/battle-quick-team/);assert.match(h.app.innerHTML,/data-action="target-picker"/);assert.equal((h.app.innerHTML.match(/class="quick-hero /g)||[]).length,3);
  await h.press('actor',{id:s.team[1]});assert.equal(h.inspect('selectedHero'),s.team[1]);
  await h.press('target-picker');assert.match(h.modal.innerHTML,/Nhắm đòn kế tiếp/);assert.match(h.modal.innerHTML,/Địch còn sống/);const id=s.run.battle.enemies.at(-1).id;await h.press('touch-target',{id});
  assert.equal(h.inspect('selectedEnemy'),id);assert.equal(h.inspect('modalOpen'),false);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
});

test('touch boss parts persist only the intended selection and cannot be applied twice from a closed dialog',async()=>{
  const s=guardBattle(),h=harness(s),before=structuredClone(h.inspect('state'));await h.press('target-picker');assert.match(h.modal.innerHTML,/Giáp tay địa chấn/);assert.match(h.modal.innerHTML,/data-action="touch-part" data-part="core"/);
  await h.press('touch-part',{part:'core'});const expected=structuredClone(before);E.selectBossPart(expected,'core');assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,1);assert.equal(h.inspect('selectedEnemy'),s.run.battle.enemies[0].id);
  await h.press('touch-part',{part:'arms'});assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,1);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);
});

test('invalid, dead, stale-round and unrelated-modal touch selections are rejected atomically',async()=>{
  const s=guardBattle(),h=harness(s);await h.press('touch-part',{part:'core'});await h.press('target-picker');const before=structuredClone(h.inspect('state'));
  await h.press('touch-target',{id:'missing'});await h.press('touch-part',{part:'constructor'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),before);
  h.inspect('pendingBattleTarget.round--');await h.press('touch-part',{part:'arms'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
  await h.press('settings');await h.press('touch-target',{id:s.run.battle.enemies[0].id});assert.equal(h.inspect('modalOpen'),true);assert.equal(h.writes.length,0);
  await h.press('close');await h.press('target-picker');h.inspect('state.run.battle.enemies[0].hp=0');const down=structuredClone(h.inspect('state'));await h.press('touch-target',{id:s.run.battle.enemies[0].id});await h.press('touch-part',{part:'arms'});assert.deepEqual(h.inspect('state'),down);assert.equal(h.writes.length,0);
});

test('used or fallen actors and Auto cannot be overridden by stale quick buttons',async()=>{
  const s=guardBattle();s.run.heroes[1].hp=0;s.run.battle.used.push(s.team[2]);const h=harness(s),selected=h.inspect('selectedHero');
  await h.press('actor',{id:s.team[1]});await h.press('actor',{id:s.team[2]});assert.equal(h.inspect('selectedHero'),selected);
  await h.press('auto');await h.press('target-picker');assert.equal(h.inspect('modalOpen'),false);await h.press('actor',{id:s.team[1]});assert.equal(h.inspect('selectedHero'),selected);assert.equal(h.writes.length,0);
});

test('touch controls work in practice and exiting restores the real account with no practice target saved',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('training-start');await h.press('target-picker');assert.match(h.modal.innerHTML,/Nhắm đòn kế tiếp/);const writes=h.writes.length;
  await h.press('touch-part',{part:'arms'});assert.equal(E.bossParts(h.inspect('state.run')).selected,'arms');assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
});

test('battery preference updates settings copy and stays out of account export and reload',async()=>{
  const s=guardBattle(),h=harness(s),before=structuredClone(h.inspect('state'));await h.press('settings');assert.match(h.modal.innerHTML,/data-key="batterySaver" role="switch" aria-checked="false"/);
  await h.press('performance-toggle',{key:'batterySaver'});assert.equal(h.storage.get('thap-vo-tan-battery-saver'),'on');assert.match(h.modal.innerHTML,/Giới hạn đang dùng: <strong>30 FPS/);assert.match(h.modal.innerHTML,/data-key="batterySaver" role="switch" aria-checked="true"/);assert.equal(h.writes.length,0);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');assert.deepEqual(JSON.parse(exported).state,before);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,1);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),before);
  const reopened=harness(s,{stored:{'thap-vo-tan-battery-saver':'on'}});await reopened.press('settings');assert.match(reopened.modal.innerHTML,/data-key="batterySaver" role="switch" aria-checked="true"/);
});

const resultButton=h=>({token:String(h.inspect('pendingResult.token'))});
test('defeat advice opens the real talent and gear controls without spending or replacing the finished run',async()=>{
  const s=guardBattle();s.run.battle.round=7;for(const id of s.team)s.owned[id].level=3;for(const hero of s.run.heroes){hero.hp=0;hero.loadout=E.gearLoadout(s,hero.id);}E.finishRun(s,'defeat');const before=structuredClone(s),h=harness(s);
  assert.match(h.app.innerHTML,/data-advice="talents"/);assert.match(h.app.innerHTML,/data-advice="equipment"/);assert.equal(h.writes.length,0);
  await h.press('talent-info',{id:'rook'});assert.match(h.modal.innerHTML,/2 điểm|Còn <b>2<\/b>/);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);await h.press('close');
  await h.press('go-equipment',{id:'aerin',slot:'weapon'});assert.equal(h.inspect('page'),'forge');assert.equal(h.inspect('gearHero'),'aerin');assert.equal(h.inspect('gearFilter'),'weapon');assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
});

test('result advice stays hidden after retreat and in practice, while boss help keeps the result intact',async()=>{
  const s=guardBattle();s.run.battle.round=7;for(const hero of s.run.heroes)hero.hp=0;E.finishRun(s,'defeat');const h=harness(s),before=structuredClone(s);assert.match(h.app.innerHTML,/data-advice="boss"/);
  await h.press('boss-info');assert.match(h.modal.innerHTML,/NGƯỜI GIỮ TẦNG/);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
  const retreat=structuredClone(s);retreat.run.summary.reason='retreat';assert.doesNotMatch(harness(retreat).app.innerHTML,/data-advice=/);
  await h.press('close');await h.press('training-start');h.inspect("E.finishRun(state,'defeat');render()");assert.doesNotMatch(h.app.innerHTML,/data-advice=/);
});

test('hero upgrade shows the early-level price and pays that price once per purchased level',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s),cost=E.upgradeCost(s,'aerin');await h.press('hero',{id:'aerin'});assert.match(h.modal.innerHTML,/giảm 40% vàng/);assert.ok(h.modal.innerHTML.includes(String(cost)));
  await h.press('upgrade',{id:'aerin'});assert.equal(h.inspect('state.gold'),s.gold-cost);assert.equal(h.inspect('state.owned.aerin.level'),2);assert.equal(h.writes.length,1);
  assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),h.inspect('state'));
});

test('final result exposes the review panel and replay restores the finished party and formation without repaying rewards',async()=>{
  const s=guardBattle();s.run.formation={front:2};E.finishRun(s);s.team=['ember','aerin','lumi'];s.formation={front:1};const before=structuredClone(s),h=harness(s);
  assert.match(h.app.innerHTML,/result-review/);assert.match(h.app.innerHTML,/Xem chi tiết trận/);assert.match(h.app.innerHTML,/Chơi lại cùng đội/);
  const button=resultButton(h);await h.press('result-retry',button);assert.equal(h.inspect('state.run.phase'),'route');assert.equal(h.inspect('state.run.mode'),'normal');assert.deepEqual(h.inspect('state.team'),before.run.heroes.map(h=>h.id));assert.deepEqual(structuredClone(h.inspect('state.formation')),{front:2});assert.equal(h.inspect('state.gold'),before.gold);assert.equal(h.inspect('state.tickets'),before.tickets);assert.equal(h.writes.length,1);
  assert.ok(h.inspect('state.run.map'));assert.deepEqual(h.inspect('state.run.statistics.report'),{kills:0,shards:0,dust:0});assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),structuredClone(h.inspect('state')));
  const restarted=structuredClone(h.inspect('state'));await h.press('result-retry',button);assert.deepEqual(structuredClone(h.inspect('state')),restarted);assert.equal(h.writes.length,1);
});

test('specialized hunt results also receive the same review block and keep their replay action',async()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);E.finishRun(s);const h=harness(s);
  assert.match(h.app.innerHTML,/result-review/);assert.match(h.app.innerHTML,/SĂN BOSS/);assert.match(h.app.innerHTML,/Săn lại/);assert.match(h.app.innerHTML,/TỔNG KẾT HÀNH TRÌNH/);
});

test('replay ignores missing, forged, stale and off-screen result buttons',async()=>{
  const s=guardBattle();E.finishRun(s);const before=structuredClone(s),h=harness(s),old=resultButton(h);
  await h.press('result-retry');await h.press('result-retry',{token:'0'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),before);
  await h.press('nav',{page:'heroes'});await h.press('result-retry',old);assert.equal(h.writes.length,0);
  await h.press('nav',{page:'tower'});await h.press('result-retry',old);assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),before);
  const fresh=resultButton(h);await h.press('settings');await h.press('result-retry',fresh);assert.equal(h.writes.length,0);await h.press('close');await h.press('result-retry',fresh);assert.equal(h.writes.length,1);
});

test('a finished party with an unavailable hero fails replay atomically',async()=>{
  const s=guardBattle();E.finishRun(s);s.team=['ember','aerin','lumi'];s.best=5;E.dispatchExpedition(s,'mist-path','rook',0,Date.now());const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('result-retry',resultButton(h));assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);assert.match(h.app.innerHTML,/Chơi lại cùng đội/);
});

test('weekly trial replay keeps the challenge, resets combat reports and does not auto-claim milestone gifts',async()=>{
  const s=E.createState();s.welcome=true;E.startChallenge(s,'iron');E.finishRun(s);const before=structuredClone(s),h=harness(s);
  assert.match(h.app.innerHTML,/Chơi lại cùng đội/);await h.press('result-retry',resultButton(h));assert.equal(h.inspect('state.run.challenge.id'),'iron');assert.equal(h.inspect('state.run.phase'),'route');assert.deepEqual(h.inspect('state.challengeWeeks'),before.challengeWeeks);assert.equal(h.inspect('state.gold'),before.gold);assert.equal(h.writes.length,1);
});

test('season replay starts a fresh event journey with the previous heroes without granting any extra seals',async()=>{
  const s=E.createState();s.welcome=true;E.startSeasonRun(s,42);E.finishRun(s);const before=structuredClone(s),h=harness(s);
  assert.match(h.app.innerHTML,/data-action="result-retry"/);await h.press('result-retry',resultButton(h));assert.equal(h.inspect('state.run.mode'),'season');assert.equal(h.inspect('state.run.floor'),1);assert.equal(h.inspect('state.run.season.seals'),0);assert.equal(h.inspect('state.season.wallet'),before.season.wallet);assert.equal(h.writes.length,1);
});

for(const [reason,title] of [['victory','CHIẾN THẮNG'],['defeat','THẤT BẠI'],['retreat','ĐÃ RÚT LUI']])test(`real result screen uses the correct ${reason} theme and return-to-lobby action`,async()=>{
  const s=guardBattle();E.finishRun(s,reason);const h=harness(s),before=structuredClone(s);assert.ok(h.app.innerHTML.includes(`data-result="${reason}"`));assert.ok(h.app.innerHTML.includes(title));
  await h.press('back-home');assert.equal(h.inspect('state.run'),null);assert.equal(h.inspect('page'),'home');assert.equal(h.inspect('state.gold'),before.gold);assert.equal(h.inspect('state.tickets'),before.tickets);assert.equal(h.writes.length,1);
});

test('practice results retain their own retry and exit controls without persisting the trial account',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('training-start');const writes=h.writes.length;h.inspect("E.finishRun(state,'retreat');render()");assert.match(h.app.innerHTML,/result-review/);assert.match(h.app.innerHTML,/data-action="training-retry"/);assert.doesNotMatch(h.app.innerHTML,/data-action="result-retry"/);
  const before=structuredClone(h.inspect('state'));await h.press('result-retry',resultButton(h));assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('training-retry');assert.equal(h.inspect('state.run.phase'),'battle');assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,writes);
});

const seasonAccount=()=>{const s=E.createState();s.welcome=true;E.observeSeason(s,new Date(),true);s.season.wallet=s.season.current.earned=10000;return s;};
const seasonButton=h=>{const p=h.inspect('pendingSeason');assert.ok(p);return {id:p.id,token:String(p.token)};};

test('event lobby, modes and quests entries open and persist the personal calendar only on first explicit entry',async()=>{
  const s=E.createState();s.welcome=true;let h=harness(s);assert.match(h.app.innerHTML,/data-action="season-open"/);assert.equal(h.inspect('state.season.anchor'),null);assert.equal(h.writes.length,0);
  await h.press('nav',{page:'quests'});assert.match(h.app.innerHTML,/Lời nguyền Tháp/);assert.equal(h.writes.length,0);await h.press('season-open');assert.equal(h.inspect('page'),'season');assert.equal(h.writes.length,1);assert.match(h.app.innerHTML,/Vua Nguyền Ấn/);assert.match(h.app.innerHTML,/Chợ Hắc Nguyệt/);assert.match(h.app.innerHTML,/aria-current="date"/);
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));await h.press('season-open');assert.equal(h.writes.length,1);assert.deepEqual(h.inspect('state'),saved);
  h=harness(saved);await h.press('nav',{page:'modes'});assert.match(h.app.innerHTML,/data-page="season"/);await h.press('nav',{page:'season'});assert.equal(h.inspect('page'),'season');assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),saved);
});

test('event start and route handlers persist the curse and combat, and repeated departure cannot replace a live run',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('season-open');await h.press('season-start');assert.equal(h.inspect('page'),'tower');assert.equal(h.inspect('state.run.mode'),'season');assert.match(h.app.innerHTML,/Máu đổi quyền năng/);assert.deepEqual(h.inspect('state.run.routes'),['battle','elite']);
  const departed=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),writes=h.writes.length;await h.press('season-start');assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),departed);
  await h.press('route',{index:'0'});const battle=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(battle.run.phase,'battle');assert.match(h.app.innerHTML,/Lời nguyền Tháp/);assert.deepEqual(harness(battle).inspect('state'),battle);
});

test('real event claims save one reward per stamp and preserve a live guarded battle across repeat taps and reload',async()=>{
  const s=guardBattle();E.observeSeason(s,new Date(),true);s.season.current.battles=s.season.current.daily.battles=2;const h=harness(s),stamp=E.seasonStatus(s).stamp,run=structuredClone(s.run);
  await h.press('season-open');const n=h.writes.length;await h.press('season-claim-mission',{id:'battles',stamp});assert.equal(h.inspect('state.season.wallet'),25);assert.equal(h.writes.length,n+1);assert.deepEqual(h.inspect('state.run'),run);
  await h.press('season-claim-mission',{id:'battles',stamp});await h.press('season-claim-mission',{id:'skills',stamp:'old-day'});assert.equal(h.writes.length,n+1);const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(harness(saved).inspect('state'),saved);
});

test('real milestone claim changes account resources once and keeps active combat and event wallet exact',async()=>{
  const s=seasonAccount();E.startHunt(s,'colossus',1,42);const h=harness(s),stamp=E.seasonStatus(s).stamp;await h.press('season-open');const writes=h.writes.length,run=structuredClone(s.run);await h.press('season-claim-milestone',{id:'seal-50',stamp});assert.equal(h.inspect('state.gold'),s.gold+300);assert.equal(h.inspect('state.tickets'),s.tickets+2);assert.equal(h.inspect('state.season.wallet'),10000);assert.deepEqual(h.inspect('state.run'),run);assert.equal(h.writes.length,writes+1);await h.press('season-claim-milestone',{id:'seal-50',stamp});assert.equal(h.writes.length,writes+1);
});

test('real shop uses one open confirmation token, rejects stale funds and prevents duplicate purchases',async()=>{
  const s=seasonAccount(),h=harness(s);await h.press('season-open');const n=h.writes.length;await h.press('season-buy',{id:'summon-ticket',token:'1'});assert.equal(h.writes.length,n);
  await h.press('season-buy-open',{id:'summon-ticket'});const old=seasonButton(h);assert.match(h.modal.innerHTML,/Trả 30 ấn/);await h.press('season-buy',{...old,token:'wrong'});assert.equal(h.writes.length,n);
  await h.press('season-buy',old);assert.equal(h.inspect('state.tickets'),s.tickets+1);assert.equal(h.inspect('state.season.wallet'),9970);assert.equal(h.writes.length,n+1);await h.press('season-buy',old);assert.equal(h.writes.length,n+1);
  await h.press('season-buy-open',{id:'forge-dust'});const stale=seasonButton(h);await h.press('season-claim-milestone',{id:'seal-50',stamp:E.seasonStatus(h.inspect('state')).stamp});const paid=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('season-buy',stale);assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),paid);
  await h.press('close');await h.press('season-buy-open',{id:'forge-dust'});const closed=seasonButton(h);await h.press('close');await h.press('season-buy',closed);assert.equal(h.writes.length,writes);
});

test('real fragment fusion grants one SSR and one duplicate, preserving the party, pity and active battle',async()=>{
  const s=seasonAccount();s.season.fragments.astra=120;E.startHunt(s,'colossus',1,42);const h=harness(s),run=structuredClone(s.run);await h.press('season-open');await h.press('season-fuse-open',{id:'astra'});const first=seasonButton(h);assert.match(h.modal.innerHTML,/Ghép anh hùng/);await h.press('season-fuse',first);assert.equal(h.inspect('state.owned.astra.level'),1);assert.equal(h.inspect('state.season.fragments.astra'),60);const n=h.writes.length;await h.press('season-fuse',first);assert.equal(h.writes.length,n);
  await h.press('season-fuse-open',{id:'astra'});await h.press('season-fuse',seasonButton(h));assert.equal(h.inspect('state.owned.astra.copies'),1);assert.equal(h.inspect('state.season.fragments.astra'),0);assert.deepEqual(h.inspect('state.run'),run);assert.equal(h.inspect('state.pity'),s.pity);assert.deepEqual(h.inspect('state.team'),s.team);const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(harness(saved).inspect('state'),saved);
});

test('native event export/import retains purchased cosmetics, fragments, aura, personal calendar and boss snapshot',async()=>{
  const s=seasonAccount();for(const id of ['eclipse-aura','guardian-outfit'])E.buySeasonItem(s,id,E.seasonReceipt(s));E.equipSkin(s,'rook','rook-guardian');E.setSeasonAura(s,true);s.season.fragments.nyx=35;E.startSeasonRun(s,42);Object.assign(s.run,{floor:5,cleared:4,routes:['boss']});E.chooseRoute(s,0);
  const h=harness(s);let exported;h.window.AndroidSave={exportSave:value=>exported=value};await h.press('export');const fresh=E.createState();fresh.welcome=true;const restored=harness(fresh);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state'),s);assert.deepEqual(E.validateState(JSON.parse(restored.storage.get('thap-vo-tan-v1'))),s);assert.match(restored.app.innerHTML,/Vua Nguyền Ấn/);
  await restored.press('season-open');await restored.press('season-aura',{enabled:'false'});assert.equal(restored.inspect('state.season.aura'),false);assert.deepEqual(restored.inspect('state.run'),s.run);await restored.press('season-aura',{enabled:'true'});await restored.press('hero',{id:'rook'});assert.match(restored.modal.innerHTML,/data-season-aura="true"/);assert.deepEqual(restored.inspect('state'),s);
});

test('practice cannot spend or claim event rewards and leaving it restores the full real event account',async()=>{
  const s=seasonAccount();s.season.fragments.astra=60;s.season.current.battles=s.season.current.daily.battles=2;E.buySeasonItem(s,'eclipse-aura',E.seasonReceipt(s));E.setSeasonAura(s,true);const h=harness(s);await h.press('training-start');const n=h.writes.length,practice=structuredClone(h.inspect('state'));await h.press('season-open');await h.press('season-claim-mission',{id:'battles',stamp:E.seasonStatus(h.inspect('state')).stamp});await h.press('season-buy-open',{id:'summon-ticket'});await h.press('season-buy',{id:'summon-ticket',token:'blocked'});await h.press('season-fuse-open',{id:'astra'});await h.press('season-fuse',{id:'astra',token:'blocked'});await h.press('season-aura',{enabled:'false'});assert.equal(h.writes.length,n);assert.deepEqual(h.inspect('state'),practice);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
});

test('real achievement page claims and saves one reward and keeps the active battle exact across repeat taps and reload',async()=>{
  const s=guardBattle();s.achievements.stats.bosses=10;let h=harness(s);await h.press('nav',{page:'quests'});
  assert.equal(h.inspect('page'),'quests');assert.match(h.app.innerHTML,/Sổ thành tựu dài hạn/);assert.match(h.app.innerHTML,/1 huy hiệu đang chờ/);
  const before=structuredClone(h.inspect('state'));await h.press('claim-achievement',{id:'boss-10'});
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.gold,before.gold+700);assert.equal(saved.tickets,before.tickets+4);assert.equal(saved.shards,before.shards+6);assert.deepEqual(saved.run,before.run);assert.deepEqual(saved.achievements.claimed,['boss-10']);assert.equal(h.writes.length,1);
  await h.press('claim-achievement',{id:'boss-10'});assert.equal(h.writes.length,1);h=harness(saved);await h.press('nav',{page:'quests'});assert.match(h.app.innerHTML,/is-claimed/);await h.press('claim-achievement',{id:'boss-10'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),saved);
});

test('real achievement handler rejects unfinished, invalid, capped and practice rewards without a save write',async()=>{
  const s=E.createState();s.welcome=true;let h=harness(s);
  for(const id of ['tower-10','constructor','missing']){await h.press('claim-achievement',{id});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),s);}
  s.best=50;s.gold=1e9;h=harness(s);await h.press('claim-achievement',{id:'tower-50'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),s);
  await h.press('training-start');const practice=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('claim-achievement',{id:'heroes-10'});await h.press('claim-achievement',{id:'tower-50'});assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
});

test('real native export/import keeps achievement claims and counters without paying or changing the restored battle',async()=>{
  const s=counterBattle();s.best=30;E.claimAchievement(s,'tower-10');const h=harness(s);let exported;
  h.window.AndroidSave={exportSave:value=>exported=value};await h.press('export');const fresh=E.createState();fresh.welcome=true;const restored=harness(fresh);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state'),s);await restored.press('nav',{page:'quests'});assert.match(restored.app.innerHTML,/1 \/ 10/);const writes=restored.writes.length;await restored.press('claim-achievement',{id:'tower-10'});assert.equal(restored.writes.length,writes);assert.deepEqual(restored.inspect('state.run'),s.run);
});

test('real counter chooser keeps used heroes eligible, selects boss parts and saves exactly once before playback',async()=>{
  const s=counterBattle();s.run.battle.used=s.run.heroes.map(h=>h.id);let played=0;
  const expected=structuredClone(s);E.counterAction(expected,'aerin','enemy0',E.counterOpportunity(expected.run),'arms');
  const h=harness(s,{onBattle:(actor,events,options)=>{played++;assert.equal(actor,'aerin');assert.equal(options.counter,true);assert.equal(options.skill,undefined);assert.ok(events[0].counter);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);return {duration:0,impact:0};}});
  assert.match(h.app.innerHTML,/PHẢN CÔNG/);await h.press('counter-open');assert.match(h.modal.innerHTML,/Đã đánh · Vẫn phản công được/);await h.press('counter-hero',{id:'aerin'});await h.press('counter-part',{part:'arms'});
  assert.equal(h.writes.length,0);const button=counterButton(h);const action=h.press('counter-fire',button);await h.press('counter-fire',button);await action;
  assert.equal(played,1);assert.equal(h.writes.length,1);assert.deepEqual(h.inspect('state'),expected);assert.equal(h.inspect('pendingCounter'),null);assert.equal(h.inspect('modalOpen'),false);assert.equal(h.inspect('busy'),false);assert.doesNotMatch(h.app.innerHTML,/data-action="counter-open"/);assert.equal(h.cinematicCalls.length,0);
});

for(const exit of ['close','back','escape'])test(`counter ${exit} closes choices without consuming the opportunity or advancing a turn`,async()=>{
  const s=counterBattle(),h=harness(s);await h.press('counter-open');await h.press('counter-hero',{id:'lumi'});const stale=counterButton(h);
  if(exit==='close')await h.press('close');if(exit==='back')assert.equal(h.window.gameBack(),true);if(exit==='escape')h.keydown('Escape');
  await h.press('counter-fire',stale);assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);assert.equal(h.inspect('pendingCounter'),null);assert.equal(h.inspect('modalOpen'),false);
  await h.press('counter-open');assert.match(h.modal.innerHTML,/Thời cơ phản công/);
});

test('real counter target selector hits a minion without boss armor side effects',async()=>{
  const s=counterBattle();s.run.battle.enemies.push({...structuredClone(s.run.battle.enemies[0]),id:'enemy1',kind:'wraith',name:'Bóng hầu'});const hp=s.run.battle.enemies[0].hp;
  const h=harness(s);await h.press('counter-open');await h.press('counter-target',{id:'enemy1'});assert.doesNotMatch(h.modal.innerHTML,/data-action="counter-part"/);await h.press('counter-fire',counterButton(h));
  assert.equal(h.inspect('state.run.battle.enemies[0].hp'),hp);assert.ok(h.inspect('state.run.battle.enemies[1].hp')<s.run.battle.enemies[1].hp);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('counter import and reload retain an unused chance; consumed saves never grant a second chance',async()=>{
  const s=counterBattle(),h=harness(s);h.window.receiveNativeSave(JSON.stringify(s));await h.press('confirm-import');assert.deepEqual(h.inspect('state'),s);assert.match(h.app.innerHTML,/data-action="counter-open"/);
  await h.press('counter-open');await h.press('counter-fire',counterButton(h));const committed=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),loaded=harness(committed);assert.deepEqual(loaded.inspect('state'),committed);assert.doesNotMatch(loaded.app.innerHTML,/data-action="counter-open"/);await loaded.press('counter-open');assert.equal(loaded.inspect('pendingCounter'),null);assert.deepEqual(loaded.inspect('state'),committed);
});

test('Auto skips counters, disables its chooser and expires the chance on the ordinary enemy turn',async()=>{
  const s=counterBattle();s.run.pet=null;s.run.link.charge=0;s.run.battle.used=s.run.heroes.map(h=>h.id);const expected=structuredClone(s);E.enemyTurn(expected);
  const h=harness(s);await h.press('auto');assert.match(h.app.innerHTML,/Auto bỏ qua · Hết hạn cuối lượt/);await h.press('counter-open');assert.equal(h.inspect('pendingCounter'),null);await h.tickAuto();assert.deepEqual(h.inspect('state'),expected);assert.equal(h.guardCalls.length,0);
});

test('end turn warns about an unused counter even after every hero has acted and cancels without losing it',async()=>{
  const s=counterBattle();s.run.battle.used=s.run.heroes.map(h=>h.id);const h=harness(s);await h.press('end-turn');assert.match(h.modal.innerHTML,/Chưa dùng cơ hội phản công/);assert.match(h.modal.innerHTML,/sẽ hết hạn/);await h.press('close');assert.deepEqual(h.inspect('state'),s);
  await h.press('end-turn');await h.press('confirm-end');assert.equal(E.counterOpportunity(h.inspect('state.run')),null);assert.equal(h.inspect('state.run.battle.round'),3);
});

for(const exit of ['hidden','pagehide'])test(`counter damage commits once before ${exit} cancels playback`,async()=>{
  const s=counterBattle(),expected=structuredClone(s);E.counterAction(expected,'rook','enemy0',E.counterOpportunity(expected.run),'head');let h;
  h=harness(s,{onBattle:()=>{assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);return {duration:180,impact:90};}});await h.press('counter-open');const button=counterButton(h),action=h.press('counter-fire',button);await Promise.resolve();await Promise.resolve();await h.press('counter-fire',button);
  if(exit==='hidden'){h.document.hidden=true;h.visibility();}else h.windowHandlers.pagehide();await action;assert.deepEqual(h.inspect('state'),expected);assert.equal(h.inspect('busy'),false);assert.equal(h.app.inert,false);h.document.hidden=false;if(exit==='hidden')h.visibility();else h.windowHandlers.pageshow();assert.deepEqual(h.inspect('state'),expected);assert.equal(h.cinematicCalls.length,0);
});

test('practice counter choices and attacks never save into the real account',async()=>{
  const source=E.createState();source.welcome=true;const h=harness(source);await h.press('nav',{page:'training'});await h.press('training-start');const writes=h.writes.length,stored=h.storage.get('thap-vo-tan-v1');
  h.inspect("state.run.battle.bossState.move='quake';const counterPracticeReceipt=E.beginTimingGuard(state);E.enemyTurn(state,{...counterPracticeReceipt,grade:'perfect'});render();");await h.press('counter-open');assert.match(h.modal.innerHTML,/Thời cơ phản công/);await h.press('counter-fire',counterButton(h));assert.equal(h.writes.length,writes);assert.equal(h.storage.get('thap-vo-tan-v1'),stored);assert.ok(h.inspect('state.run.training.damage')>0);await h.press('training-exit');assert.deepEqual(h.inspect('state'),source);
});

test('real guard input saves a queued turn before input and commits its result before playback exactly once',async()=>{
  const s=guardBattle();s.run.battle.used=s.run.heroes.map(h=>h.id);let resolve,visuals=0;
  const gate=new Promise(r=>resolve=r),expected=structuredClone(s),receipt=E.beginTimingGuard(expected);E.enemyTurn(expected,{...receipt,grade:'perfect'});
  const h=harness(s,{onGuard:()=>gate,onBattle:(actor,events)=>{visuals++;const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(saved,expected);assert.ok(events.some(e=>e.timingGuard?.grade==='perfect'));return {impact:0,duration:0};}});
  assert.match(h.app.innerHTML,/Sẵn sàng đỡ chiêu/);const action=h.press('end-turn');
  assert.equal(h.inspect('busy'),true);assert.equal(h.app.inert,true);assert.equal(h.guardCalls.length,1);assert.equal(visuals,0);assert.deepEqual(structuredClone(h.inspect('state.run.heroes')),s.run.heroes);
  const queued=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(E.timingGuardPending(queued.run),true);assert.equal(queued.run.battle.round,1);assert.equal(h.writes.length,1);
  await h.press('end-turn');await h.press('attack');await h.press('auto');h.window.receiveNativeSave(JSON.stringify(E.createState()));assert.equal(h.guardCalls.length,1);assert.equal(h.writes.length,1);assert.equal(h.inspect('modalOpen'),false);
  resolve('perfect');await action;assert.equal(visuals,1);assert.equal(h.writes.length,2);assert.equal(h.inspect('busy'),false);assert.equal(h.app.inert,false);assert.deepEqual(h.inspect('state'),expected);
});

test('guard preference persists on the device, default is on and Auto bypasses timing input',async()=>{
  const s=guardBattle();s.run.battle.used=s.run.heroes.map(h=>h.id);s.run.pet=null;s.run.link.charge=0;const expected=structuredClone(s);E.enemyTurn(expected);
  const h=harness(s);await h.press('settings');assert.match(h.modal.innerHTML,/aria-label="Đỡ đòn đúng nhịp"/);await h.press('timing-guard-setting');assert.equal(h.storage.get('thap-vo-tan-timing-guard'),'off');assert.match(h.modal.innerHTML,/data-action="timing-guard-setting" role="switch" aria-checked="false"/);assert.deepEqual(h.inspect('state'),s);await h.press('close');assert.doesNotMatch(h.app.innerHTML,/Sẵn sàng đỡ chiêu/);await h.press('end-turn');assert.equal(h.guardCalls.length,0);assert.deepEqual(h.inspect('state'),expected);
  const restored=harness(s,{stored:{'thap-vo-tan-timing-guard':'off'}});assert.equal(restored.preferences.timingGuard,false);await restored.press('end-turn');assert.equal(restored.guardCalls.length,0);assert.deepEqual(restored.inspect('state'),expected);
  const automatic=harness(s);await automatic.press('auto');await automatic.tickAuto();assert.equal(automatic.guardCalls.length,0);assert.deepEqual(automatic.inspect('state'),expected);assert.equal(automatic.preferences.timingGuard,true);
});

for(const interruption of ['back','escape','hidden','pagehide'])test(`guard ${interruption} resolves a single ordinary turn and releases all input locks`,async()=>{
  const s=guardBattle();s.run.battle.used=s.run.heroes.map(h=>h.id);const expected=structuredClone(s);E.enemyTurn(expected);let late;
  const gate=new Promise(r=>late=r),h=harness(s,{onGuard:()=>gate}),action=h.press('end-turn');assert.equal(h.inspect('timingGuardPrompt.active'),true);
  if(interruption==='back'){assert.equal(h.window.gameBack(),true);assert.equal(h.window.gameBack(),true);}
  if(interruption==='escape')h.keydown('Escape');
  if(interruption==='hidden'){h.document.hidden=true;h.visibility();}
  if(interruption==='pagehide')h.windowHandlers.pagehide();
  await action;assert.equal(h.inspect('busy'),false);assert.equal(h.app.inert,false);assert.equal(h.inspect('timingGuardPrompt.active'),false);assert.deepEqual(h.inspect('state'),expected);assert.deepEqual(JSON.parse(h.storage.get('thap-vo-tan-v1')),expected);
  late('perfect');await Promise.resolve();assert.deepEqual(h.inspect('state'),expected);
  if(interruption==='hidden'){h.document.hidden=false;h.visibility();}
  if(interruption==='pagehide')h.windowHandlers.pageshow();
  assert.deepEqual(h.inspect('state'),expected);
});

test('reload and confirmed import settle a saved pending guard as a miss before returning control',async()=>{
  const s=guardBattle();E.beginTimingGuard(s);const expected=structuredClone(s);E.enemyTurn(expected);
  const loaded=harness(s);assert.equal(loaded.writes.length,1);assert.deepEqual(loaded.inspect('state'),expected);assert.equal(loaded.guardCalls.length,0);const twice=harness(JSON.parse(loaded.storage.get('thap-vo-tan-v1')));assert.deepEqual(twice.inspect('state'),expected);assert.equal(twice.writes.length,0);
  const fresh=E.createState();fresh.welcome=true;const imported=harness(fresh);imported.window.receiveNativeSave(JSON.stringify({game:'thap-vo-tan',state:s}));assert.deepEqual(imported.inspect('state'),fresh);assert.equal(imported.inspect('E.timingGuardPending(importCandidate.run)'),true);await imported.press('confirm-import');assert.deepEqual(imported.inspect('state'),expected);assert.equal(imported.guardCalls.length,0);assert.deepEqual(JSON.parse(imported.storage.get('thap-vo-tan-v1')),expected);
});

test('ending early requires the existing confirmation before any guard turn is queued',async()=>{
  const s=guardBattle(),h=harness(s);await h.press('end-turn');assert.equal(h.guardCalls.length,0);assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),s);await h.press('close');assert.deepEqual(h.inspect('state'),s);await h.press('end-turn');await h.press('confirm-end');assert.equal(h.guardCalls.length,1);assert.equal(h.inspect('state.run.battle.round'),2);
});

test('practice guard is ephemeral and reduced effects with speed 2x preserve manual timing',async()=>{
  const s=E.createState();s.welcome=true;E.setGraphics(s,'effects',false);s.settings.speed=2;const h=harness(s,{onGuard:async()=> 'perfect'});await h.press('training-start');h.inspect("state.run.battle.bossState.move='quake';state.run.battle.used=state.run.heroes.map(h=>h.id);render()");const writes=h.writes.length;await h.press('end-turn');assert.equal(h.guardCalls.length,1);assert.equal(h.guardCalls[0][2].quiet,true);assert.equal(h.writes.length,writes);assert.equal(h.inspect('state.run.battle.round'),2);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
});

test('real map and combat handlers expose fixed condition and forecast without changing the saved journey',async()=>{
  for(const id of ['bloodmoon','frost','mana']){
    const s=E.createState();s.welcome=true;E.startRun(s,42);anomalyCondition(s.run,id);const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;
    assert.match(h.app.innerHTML,/Dị biến chặng hiện tại/);assert.match(h.app.innerHTML,/Chặng kế/);assert.match(h.app.innerHTML,new RegExp(E.anomalyForFloor(s.run).name));await h.press('anomaly-info');assert.match(h.modal.innerHTML,/Dị biến tháp/);assert.match(h.modal.innerHTML,/cả hai bên/);assert.match(h.modal.innerHTML,/20 năng lượng/);assert.match(h.modal.innerHTML,/15 năng lượng/);assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),before);
    assert.equal(h.window.gameBack(),true);await h.press('route',{index:'0'});const saved=JSON.parse(h.storage.get('thap-vo-tan-v1'));assert.equal(saved.run.phase,'battle');assert.match(h.app.innerHTML,new RegExp('data-anomaly="'+id+'"'));if(id==='mana'){assert.match(h.app.innerHTML,/has-mana/);assert.match(h.app.innerHTML,/mỗi đòn thường hồi thêm 15/);}const opening=structuredClone(saved.run.heroes);
    await h.press('nav',{page:'home'});await h.press('nav',{page:'tower'});await h.press('anomaly-info');assert.deepEqual(structuredClone(h.inspect('state.run.heroes')),opening);await h.press('close');const resumed=harness(saved);assert.deepEqual(structuredClone(resumed.inspect('state.run.heroes')),opening);assert.deepEqual(structuredClone(resumed.inspect('state.run.anomalyOrder')),s.run.anomalyOrder);await resumed.press('run-info');assert.match(resumed.modal.innerHTML,/Xem luật và chặng kế/);
  }
});

test('boss choices retain the current condition until blessing advances and save the next segment once',async()=>{
  const s=contractOffer();anomalyCondition(s.run,'frost');const h=harness(s),paid=structuredClone(h.inspect('[state.gold,state.tickets,state.shards]'));
  await h.press('contract-skip',{floor:'5'});await h.press('choose-relic',{id:h.inspect('state.run.relicChoices[0]')});assert.equal(h.inspect('E.anomalyForFloor(state.run).id'),'frost');await h.press('blessing',{id:h.inspect('state.run.choices[0]')});assert.equal(h.inspect('state.run.floor'),6);assert.notEqual(h.inspect('E.anomalyForFloor(state.run).id'),'frost');assert.match(h.app.innerHTML,/TẦNG 6–10/);assert.match(h.app.innerHTML,/Tầng 11–15/);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.tickets,state.shards]')),paid);const saved=JSON.parse(h.storage.get('thap-vo-tan-v1'));assert.deepEqual(structuredClone(harness(saved).inspect('state')),h.inspect('state'));
});

test('an old journey and special modes show no condition controls and remain unchanged after attempted info',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);delete s.run.anomalyRules;delete s.run.anomalyOrder;s.version=23;const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;assert.doesNotMatch(h.app.innerHTML,/Dị biến chặng hiện tại/);await h.press('anomaly-info');assert.equal(h.inspect('modalOpen'),false);assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),before);await h.press('route',{index:'0'});assert.doesNotMatch(h.app.innerHTML,/Dị biến chặng hiện tại/);
  const special=E.createState();special.welcome=true;E.startHunt(special,'colossus',1,42);assert.doesNotMatch(harness(special).app.innerHTML,/Dị biến chặng hiện tại/);
});

test('real contract altar previews costs and HP before one signed, saved choice then resumes through relic and blessing',async()=>{
  const s=contractOffer(),h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;
  assert.match(h.app.innerHTML,/Khế ước bóng tối/);assert.equal((h.app.innerHTML.match(/data-action="contract-review"/g)||[]).length,3);
  await h.press('contract-confirm',{id:'blood',floor:'5'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('contract-review',{id:'blood',floor:'5'});assert.match(h.modal.innerHTML,/Máu sau khi ký/);assert.match(h.modal.innerHTML,/−15% máu tối đa/);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('contract-confirm',{id:'ambition',floor:'5'});assert.deepEqual(h.inspect('state'),before);
  await h.press('contract-confirm',{id:'blood',floor:'10'});assert.deepEqual(h.inspect('state'),before);
  await h.press('contract-confirm',{id:'blood',floor:'5'});assert.equal(h.inspect('modalOpen'),false);assert.equal(h.inspect('state.run.phase'),'relic');assert.deepEqual(structuredClone(h.inspect('state.run.contracts')),[{id:'blood',floor:5}]);assert.equal(h.writes.length,writes+1);assert.equal(h.inspect('state.run.heroes[0].maxHp'),Math.round(s.run.heroes[0].maxHp*.85));
  const paid=structuredClone(h.inspect('state')),saved=JSON.parse(h.storage.get('thap-vo-tan-v1'));await h.press('contract-confirm',{id:'blood',floor:'5'});assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,writes+1);
  const resumed=harness(saved);assert.match(resumed.app.innerHTML,/CỔ VẬT ĐỘC NHẤT/);await resumed.press('choose-relic',{id:resumed.inspect('state.run.relicChoices[0]')});await resumed.press('blessing',{id:resumed.inspect('state.run.choices[0]')});assert.equal(resumed.inspect('state.run.floor'),6);assert.match(resumed.app.innerHTML,/aria-label="Khế ước của chuyến đi"/);await resumed.press('run-info');assert.match(resumed.modal.innerHTML,/1\/3 khế ước đã ký/);await resumed.press('contract-info',{id:'blood'});assert.match(resumed.modal.innerHTML,/ĐÃ KÝ Ở TẦNG 5/);assert.match(resumed.modal.innerHTML,/25% mọi sát thương/);assert.doesNotMatch(resumed.modal.innerHTML,/data-action="contract-confirm"/);
});

test('real contract skip keeps rewards, waits for manual choice and persists across lobby/native back and reload',async()=>{
  const s=contractOffer(),expected=structuredClone(s);E.selectContract(expected,null,5);const h=harness(s);
  await h.press('nav',{page:'home'});assert.match(h.app.innerHTML,/TIẾP TỤC HÀNH TRÌNH/);await h.press('nav',{page:'tower'});assert.match(h.app.innerHTML,/Khế ước bóng tối/);assert.equal(h.window.gameBack(),true);await h.press('nav',{page:'tower'});const before=structuredClone(h.inspect('state'));
  await h.press('contract-skip',{floor:'10'});assert.deepEqual(h.inspect('state'),before);await h.press('contract-skip',{floor:'5'});assert.deepEqual(h.inspect('state'),expected);const writes=h.writes.length;await h.press('contract-skip',{floor:'5'});assert.equal(h.writes.length,writes);const resumed=harness(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(resumed.inspect('state.run.phase'),'relic');assert.equal(resumed.inspect('state.run.contracts.length'),0);
});

test('contract confirmation expires on close, settings, native back or importing a save; forged IDs never open a preview',async()=>{
  const s=contractOffer(),h=harness(s);
  for(const cancel of [()=>h.press('close'),()=>h.press('settings'),async()=>h.window.gameBack(),async()=>{h.window.receiveNativeSave(JSON.stringify({game:'thap-vo-tan',state:s}));await h.press('confirm-import');}]){
    await h.press('contract-review',{id:'ambition',floor:'5'});assert.match(h.modal.innerHTML,/Ký khế ước/);await cancel();const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('contract-confirm',{id:'ambition',floor:'5'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  }
  await h.press('close');await h.press('contract-review',{id:'constructor',floor:'5'});assert.equal(h.inspect('modalOpen'),false);await h.press('contract-info',{id:'sacrifice'});assert.equal(h.inspect('modalOpen'),false);
});

test('sacrifice saves one HP cost before cinematics and filters self-payment out of attack feedback',async()=>{
  const s=contractCombat(['sacrifice'],{team:['astra','rook','lumi']}),seen=[];let release;const gate=new Promise(resolve=>release=resolve);
  const h=harness(s,{onCinematic:async()=>{seen.push(JSON.parse(h.storage.get('thap-vo-tan-v1')).run.heroes[0].hp);await gate;return true;},onBattle:(_actor,events)=>{assert.ok(events.every(e=>!e.contractCost));assert.ok(events.every(e=>e.target.startsWith('enemy')));return {duration:0,impact:0};}});h.preferences.cinematics=true;assert.match(h.app.innerHTML,/Hiến <b>50 máu/);const writes=h.writes.length,action=h.press('skill');
  assert.equal(h.inspect('busy'),true);assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).run.heroes[0].hp,850);await h.press('skill');assert.equal(h.writes.length,writes+1);assert.equal(h.inspect('state.run.heroes[0].hp'),850);release();await action;assert.deepEqual(seen,[850]);assert.equal(h.inspect('busy'),false);assert.equal(h.writes.length,writes+1);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('Auto stops at a boss contract offer, saves its payout before effects, and never signs on behalf of the player',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);Object.assign(s.run,{map:null,floor:5,routes:['boss']});E.chooseRoute(s,0);s.run.pet=null;s.run.battle.enemies[0].hp=1;const h=harness(s,{onBattle:()=>{const saved=JSON.parse(h.storage.get('thap-vo-tan-v1'));assert.equal(saved.run.phase,'contract');assert.ok(saved.run.lastReward.gold>0);assert.deepEqual(saved.run.contracts,[]);return {duration:0,impact:0};}});
  await h.press('auto');await h.tickAuto();assert.equal(h.inspect('auto'),false);assert.equal(h.inspect('state.run.phase'),'contract');assert.match(h.app.innerHTML,/Chiến thắng/);await h.press('victory-skip');assert.match(h.app.innerHTML,/Khế ước bóng tối/);assert.equal(h.inspect('state.run.contracts.length'),0);const paid=structuredClone(h.inspect('[state.gold,state.tickets,state.shards]'));await h.press('contract-review',{id:'ambition',floor:'5'});await h.press('contract-confirm',{id:'ambition',floor:'5'});assert.deepEqual(structuredClone(h.inspect('[state.gold,state.tickets,state.shards]')),paid);assert.equal(h.inspect('state.run.contracts[0].id'),'ambition');
});

test('performance switches update device choices and labels without changing saves, resources or combat snapshots',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;
  await h.press('settings');assert.match(h.modal.innerHTML,/aria-label="Hiệu năng tự động"/);assert.match(h.modal.innerHTML,/data-key="showFps" role="switch" aria-checked="false"/);
  await h.press('performance-toggle',{key:'automatic'});assert.equal(h.preferences.automatic,false);assert.match(h.modal.innerHTML,/data-key="automatic" role="switch" aria-checked="false"/);
  await h.press('performance-toggle',{key:'showFps'});assert.equal(h.preferences.showFps,true);assert.match(h.modal.innerHTML,/data-key="showFps" role="switch" aria-checked="true"/);
  await h.press('performance-toggle',{key:'quality'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);assert.equal(h.storage.get('thap-vo-tan-show-fps'),'on');
});

test('fresh welcome offers the interactive guide or skip and never interrupts an acknowledged veteran',async()=>{
  let h=harness(E.createState());h.tickWelcome();assert.match(h.modal.innerHTML,/Học và chơi ngay/);assert.match(h.modal.innerHTML,/data-action="tutorial-skip"/);const wallet=structuredClone(h.inspect('[state.gold,state.tickets,state.shards]'));await h.press('tutorial-begin');assert.equal(h.inspect('page'),'summon');assert.equal(h.inspect('state.onboarding.status'),'active');assert.match(h.app.innerHTML,/Gọi đồng đội đầu tiên/);assert.equal(h.modal.innerHTML,'');assert.deepEqual(structuredClone(h.inspect('[state.gold,state.tickets,state.shards]')),wallet);assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).onboarding.status,'active');
  h=harness(E.createState());await h.press('tutorial-begin');h.tickWelcome();assert.equal(h.modal.innerHTML,'');
  const veteran=E.createState();veteran.welcome=true;veteran.version=20;delete veteran.onboarding;h=harness(veteran);assert.equal(h.inspect('state.version'),E.SAVE_VERSION);assert.equal(h.modal.innerHTML,'');assert.match(h.app.innerHTML,/Xem mục tiêu/);assert.equal(h.inspect('state.onboarding.status'),'available');
});

test('real guide can teach re-equipping existing gear and explains a team locked by an active journey',async()=>{
  const s=E.createState();s.welcome=true;s.onboarding.status='active';s.onboarding.completed=['summon','team'];E.equipGear(s,'gear-1','rook');s.onboarding.completed=['summon','team'];const h=harness(s);await h.press('tutorial-go');await h.press('gear',{id:'gear-1'});assert.match(h.modal.innerHTML,/đang mặc sẵn/);await h.press('unequip-gear',{id:'gear-1'});assert.match(h.modal.innerHTML,/Chạm Trang bị/);await h.press('equip-gear',{id:'gear-1'});assert.equal(h.inspect('E.tutorialStep(state)'),'depart');
  const active=E.createState();E.beginTutorial(active);E.summon(active,1,()=>.99);E.startRun(active,42);const locked=harness(active);await locked.press('hero',{id:'rook'});assert.match(locked.modal.innerHTML,/Đội hình đã chốt/);await locked.press('close');await locked.press('tutorial-go');assert.equal(locked.inspect('page'),'tower');assert.equal(locked.inspect('E.tutorialStep(state)'),'team');
});

test('real tutorial guides summon, team, equipment, map and combat while saving before playback',async()=>{
  const h=harness(E.createState());await h.press('tutorial-begin');h.inspect('cryptoRandom=()=>.99');let action=h.press('summon',{count:'1'});assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).onboarding.completed[0],'summon');h.tickSummon();await action;await h.press('close');await h.press('tutorial-go');assert.equal(h.inspect('page'),'heroes');await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/Chạm một vị trí/);await h.press('assign',{id:'rook',slot:'0'});await h.press('close');await h.press('tutorial-go');assert.equal(h.inspect('page'),'forge');assert.equal(h.inspect('hallTab'),'equipment');assert.equal(h.inspect('gearFilter'),'all');await h.press('gear',{id:'gear-1'});assert.match(h.modal.innerHTML,/Chạm Trang bị/);await h.press('equip-gear',{id:'gear-1'});await h.press('close');await h.press('tutorial-go');assert.equal(h.inspect('page'),'home');await h.press('start');assert.equal(h.inspect('E.tutorialStep(state)'),'route');await h.press('tutorial-go');assert.equal(h.inspect('mapFocus'),h.inspect('E.towerMapView(state.run).choices[0].id'));await h.press('route',{index:'0'});assert.equal(h.inspect('E.tutorialStep(state)'),'target');await h.press('target',{id:'enemy0'});assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).onboarding.completed.at(-1),'target');await h.press('attack');assert.equal(h.inspect('E.tutorialStep(state)'),'end');
  let actions=0;while(h.inspect('state.onboarding.status')!=='done'&&actions++<40){
    const phase=h.inspect('state.run.phase');
    if(h.inspect('E.victoryPending(state.run)')){await h.press('victory-skip');continue;}
    if(phase==='blessing'){await h.press('blessing',{id:h.inspect('state.run.choices[0]')});continue;}
    if(phase==='route'){await h.press('route',{index:String(Math.max(0,h.inspect('state.run.routes.findIndex(x=>x==="battle"||x==="boss")')))});continue;}
    if(phase!=='battle')break;
    const id=h.inspect('selectedHero');if(!id){await h.press('end-turn');continue;}
    const skill=h.inspect('E.tutorialStep(state)==="skill"&&state.run.heroes.find(h=>h.id===selectedHero).energy>=100');await h.press(skill?'skill':'attack');
  }
  assert.equal(h.inspect('state.onboarding.status'),'done');assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).onboarding.completed.length,9);assert.doesNotMatch(h.app.innerHTML,/class="tutorial-coach"/);
});

test('real guide skip and resume preserve lessons across reload, modal close and native back',async()=>{
  let h=harness(E.createState());await h.press('tutorial-begin');h.inspect('cryptoRandom=()=>.99');const action=h.press('summon',{count:'1'});h.tickSummon();await action;await h.press('tutorial-skip');assert.equal(h.inspect('state.onboarding.status'),'skipped');assert.doesNotMatch(h.app.innerHTML,/class="tutorial-coach"/);h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('novice-open');assert.match(h.app.innerHTML,/1\/9 bước/);await h.press('tutorial-begin');assert.equal(h.inspect('page'),'heroes');assert.equal(h.inspect('E.tutorialStep(state)'),'team');await h.press('hero',{id:'rook'});assert.equal(h.window.gameBack(),true);assert.equal(h.inspect('modalOpen'),false);assert.equal(h.inspect('E.tutorialStep(state)'),'team');assert.deepEqual(Array.from(h.inspect('state.onboarding.completed')),['summon']);
});

function noviceAccount(){const s=E.createState();s.welcome=true;s.totalSummons=1;s.best=10;E.equipGear(s,'gear-1','rook');return s;}
test('real novice mission chain unlocks the SSR picker and requires the reviewed choice before one saved claim',async()=>{
  let h=harness(noviceAccount());await h.press('novice-open');assert.match(h.app.innerHTML,/15 vé, 1.500 vàng/);const before=structuredClone(h.inspect('state'));await h.press('novice-claim',{id:'floor10'});await h.press('novice-ssr-confirm',{id:'astra'});assert.deepEqual(h.inspect('state'),before);
  for(const q of E.NOVICE_MISSIONS){await h.press('novice-claim',{id:q.id});const writes=h.writes.length;await h.press('novice-claim',{id:q.id});assert.equal(h.writes.length,writes);}
  assert.equal(h.inspect('state.tickets'),before.tickets+15);assert.equal(h.inspect('state.gold'),before.gold+1500);await h.press('novice-ssr-open');assert.equal((h.modal.innerHTML.match(/data-action="novice-ssr-detail"/g)||[]).length,3);await h.press('novice-ssr-detail',{id:'astra'});assert.match(h.modal.innerHTML,/data-model-id="astra"/);assert.match(h.modal.innerHTML,/Mở một anh hùng mới/);await h.press('preview-ultimate',{id:'astra'});assert.equal(h.cinematicCalls.at(-1).id,'astra');const pending=structuredClone(h.inspect('state'));await h.press('novice-ssr-confirm',{id:'nyx'});assert.deepEqual(h.inspect('state'),pending);await h.press('novice-ssr-confirm',{id:'astra'});const paid=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(paid.onboarding.ssr,'astra');assert.equal(paid.owned.astra.level,1);assert.match(h.modal.innerHTML,/QUÀ TÂN THỦ · ĐÃ LƯU/);const writes=h.writes.length;await h.press('novice-ssr-confirm',{id:'astra'});assert.equal(h.writes.length,writes);h=harness(paid);await h.press('novice-open');assert.match(h.app.innerHTML,/Đã chọn Astra/);assert.equal(h.inspect('E.noviceReady(state)'),false);
});

test('real SSR confirmation expires on closing, another dialog, native back or an imported state',async()=>{
  const s=noviceAccount();for(const q of E.NOVICE_MISSIONS)E.claimNoviceMission(s,q.id);const h=harness(s);
  for(const cancel of [()=>h.press('close'),()=>h.press('settings'),async()=>h.window.gameBack(),async()=>{h.window.receiveNativeSave(JSON.stringify({game:'thap-vo-tan',state:s}));await h.press('confirm-import');}]){
    await h.press('novice-ssr-detail',{id:'astra'});await cancel();const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('novice-ssr-confirm',{id:'astra'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  }
});

test('real owned SSR dialog explains duplicate rewards and preserves its level, awakening and talents',async()=>{
  const s=noviceAccount();for(const q of E.NOVICE_MISSIONS)E.claimNoviceMission(s,q.id);s.owned.nyx={level:15,copies:2,awaken:1};E.learnTalent(s,'nyx','force');const h=harness(s);await h.press('novice-ssr-detail',{id:'nyx'});assert.match(h.modal.innerHTML,/\+1 bản trùng Nyx, \+12 tinh thạch và \+180 vàng/);await h.press('novice-ssr-confirm',{id:'nyx'});const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(saved.owned.nyx,{level:15,copies:3,awaken:1});assert.deepEqual(saved.talents,s.talents);assert.equal(saved.gold,s.gold+180);assert.equal(saved.shards,s.shards+12);
});

test('real export/import and reload retain tutorial lessons, all novice claims and the chosen SSR',async()=>{
  const s=noviceAccount();for(const q of E.NOVICE_MISSIONS)E.claimNoviceMission(s,q.id);E.claimNoviceSsr(s,'kael');E.beginTutorial(s);E.summon(s,1,()=>.99);E.skipTutorial(s);const h=harness(s);let exported;h.window.AndroidSave={exportSave:v=>exported=v};await h.press('export');const fresh=E.createState();fresh.welcome=true;let restored=harness(fresh);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state.onboarding'),s.onboarding);restored=harness(E.validateState(JSON.parse(restored.storage.get('thap-vo-tan-v1'))));await restored.press('tutorial-begin');assert.equal(restored.inspect('E.tutorialStep(state)'),'team');assert.equal(restored.inspect('state.onboarding.ssr'),'kael');assert.equal(restored.inspect('state.onboarding.claimed.length'),5);
});

test('practice blocks all new novice actions and restores the real tutorial after leaving',async()=>{
  const s=noviceAccount();E.beginTutorial(s);const h=harness(s);await h.press('training-start');const before=structuredClone(h.inspect('state')),writes=h.writes.length;
  for(const action of ['tutorial-begin','tutorial-go','tutorial-skip','novice-open','novice-claim','novice-ssr-open','novice-ssr-detail','novice-ssr-confirm'])await h.press(action,{id:'astra'});
  assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.equal(h.inspect('E.tutorialStep(state)'),'summon');assert.deepEqual(h.inspect('state.onboarding'),s.onboarding);
});

test('real target picker filters all tiers, previews locked models and skills, and saves selection and opt-out',async()=>{
  const s=E.createState();s.welcome=true;let h=harness(s);await h.press('nav',{page:'summon'});assert.match(h.app.innerHTML,/Bạn muốn gặp ai/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;
  await h.press('summon-focus-open');assert.equal((h.modal.innerHTML.match(/data-action="summon-focus-preview"/g)||[]).length,20);await h.press('summon-focus-filter',{rarity:'SSR'});assert.equal((h.modal.innerHTML.match(/data-action="summon-focus-preview"/g)||[]).length,3);
  await h.press('summon-focus-preview',{id:'astra'});assert.match(h.modal.innerHTML,/class="detail-art"/);assert.match(h.modal.innerHTML,/data-model-id="astra"/);assert.match(h.modal.innerHTML,/Thiên hà sụp đổ/);await h.press('preview-ultimate',{id:'astra'});assert.equal(h.cinematicCalls.at(-1).id,'astra');assert.equal(h.cinematicCalls.at(-1).options.preview,true);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('summon-focus-set',{id:'astra'});assert.equal(h.inspect('state.summoning.target'),'astra');assert.equal(h.inspect('state.owned.astra'),undefined);assert.match(h.app.innerHTML,/ASTRA · MỤC TIÊU ĐÃ CHỌN/);h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('nav',{page:'summon'});assert.equal(h.inspect('state.summoning.target'),'astra');assert.match(h.app.innerHTML,/33,333%/);
  h.inspect('state.summoning.guaranteed.SSR=true');await h.press('summon-focus-clear');assert.equal(h.inspect('state.summoning.target'),null);assert.equal(h.inspect('state.summoning.guaranteed.SSR'),true);assert.match(h.app.innerHTML,/Đang giữ bảo đảm/);assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).summoning.guaranteed.SSR,true);
});

test('real summon commits a miss before animation, ignores double taps and redeems its promise after relaunch',async()=>{
  const s=E.createState();s.welcome=true;E.setSummonTarget(s,'astra');let h=harness(s);await h.press('nav',{page:'summon'});h.inspect('let summonTestCalls=0;cryptoRandom=()=>summonTestCalls++%2===0?.03:.4');
  let action=h.press('summon',{count:'1'});assert.equal(h.inspect('busy'),true);assert.equal(h.inspect('state.summoning.guaranteed.SSR'),true);assert.equal(h.inspect('state.owned.nyx.level'),1);const saved=JSON.parse(h.storage.get('thap-vo-tan-v1')),writes=h.writes.length;assert.equal(saved.summoning.guaranteed.SSR,true);await h.press('summon',{count:'1'});assert.equal(h.writes.length,writes);assert.equal(h.inspect('state.totalSummons'),1);
  h.tickSummon();await action;assert.match(h.modal.innerHTML,/Lệch Astra · Mở bảo đảm/);assert.match(h.modal.innerHTML,/Đã lệch 1\/1/);h=harness(E.validateState(saved));await h.press('nav',{page:'summon'});assert.match(h.app.innerHTML,/tiếp theo chắc chắn là Astra/);h.inspect('let summonTestCalls=0;cryptoRandom=()=>summonTestCalls++%2===0?.03:.4');
  action=h.press('summon',{count:'1'});assert.equal(h.inspect('state.owned.astra.level'),1);assert.equal(h.inspect('state.summoning.guaranteed.SSR'),false);assert.equal(h.inspect('state.totalSummons'),2);h.tickSummon();await action;assert.match(h.modal.innerHTML,/TRÚNG BẢO ĐẢM/);assert.match(h.modal.innerHTML,/Chưa lệch/);assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).owned.astra.level,1);
});

test('real ten-pull results distinguish five misses from five guaranteed targets and are saved before reveal',async()=>{
  const s=E.createState();s.welcome=true;E.setSummonTarget(s,'astra');const h=harness(s);await h.press('nav',{page:'summon'});h.inspect('let summonTestCalls=0;cryptoRandom=()=>summonTestCalls++%2===0?.03:.4');const action=h.press('summon',{count:'10'}),saved=JSON.parse(h.storage.get('thap-vo-tan-v1'));assert.equal(saved.tickets,5);assert.equal(saved.owned.astra.copies,4);assert.equal(saved.totalSummons,10);assert.equal(saved.summoning.guaranteed.SSR,false);h.tickSummon();await action;assert.equal((h.modal.innerHTML.match(/TRÚNG BẢO ĐẢM/g)||[]).length,5);assert.equal((h.modal.innerHTML.match(/Lệch Astra · Mở bảo đảm/g)||[]).length,5);
});

test('real exchange requires a reviewed quote, grants once and survives reopening with every guarantee intact',async()=>{
  const s=E.createState();s.welcome=true;s.shards=310;E.setSummonTarget(s,'astra');s.summoning.guaranteed.SSR=true;let h=harness(s);await h.press('nav',{page:'summon'});const before=structuredClone(h.inspect('state')),writes=h.writes.length;
  await h.press('summon-exchange-confirm',{id:'astra',cost:'300'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);await h.press('summon-exchange-open');assert.match(h.modal.innerHTML,/310/);await h.press('summon-exchange-filter',{rarity:'SSR'});assert.equal((h.modal.innerHTML.match(/data-action="summon-exchange-detail"/g)||[]).length,3);
  await h.press('summon-exchange-detail',{id:'astra'});assert.match(h.modal.innerHTML,/Số dư sau đổi<strong>10/);assert.match(h.modal.innerHTML,/data-cost="300"/);assert.deepEqual(h.inspect('state'),before);await h.press('summon-exchange-confirm',{id:'nyx',cost:'300'});await h.press('summon-exchange-confirm',{id:'astra',cost:'299'});assert.deepEqual(h.inspect('state'),before);
  await h.press('summon-exchange-confirm',{id:'astra',cost:'300'});assert.equal(h.inspect('state.shards'),10);assert.equal(h.inspect('state.owned.astra.level'),1);assert.equal(h.inspect('state.summoning.guaranteed.SSR'),true);assert.equal(h.inspect('state.totalSummons'),0);assert.match(h.modal.innerHTML,/Astra đã đến/);const paid=structuredClone(h.inspect('state')),paidWrites=h.writes.length;await h.press('summon-exchange-confirm',{id:'astra',cost:'300'});assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,paidWrites);
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('summon-exchange-open');assert.match(h.modal.innerHTML,/ĐÃ ĐỔI/);await h.press('summon-exchange-detail',{id:'astra'});assert.match(h.modal.innerHTML,/data-cost="300" disabled/);await h.press('summon-exchange-confirm',{id:'astra',cost:'300'});assert.deepEqual(h.inspect('state'),paid);
});

test('closing, Back, another dialog or insufficient funds invalidate real exchange confirmation without payment',async()=>{
  for(const cancel of ['close','back','settings','poor']){const s=E.createState();s.welcome=true;s.shards=300;const h=harness(s);await h.press('summon-exchange-detail',{id:'astra'});if(cancel==='back')h.window.gameBack();else if(cancel==='poor')h.inspect('state.shards=299');else await h.press(cancel);const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('summon-exchange-confirm',{id:'astra',cost:'300'});assert.deepEqual(h.inspect('state'),before,cancel);assert.equal(h.writes.length,writes,cancel);}
});

test('gacha buttons stay isolated in training and the rates dialog explains both independent guarantees',async()=>{
  const s=E.createState();s.welcome=true;s.shards=5000;const h=harness(s);await h.press('rates');assert.match(h.modal.innerHTML,/chuyển bảo đảm cho tướng mới/);assert.match(h.modal.innerHTML,/từ R đến EX/);await h.press('close');await h.press('training-start');const before=structuredClone(h.inspect('state')),saved=h.storage.get('thap-vo-tan-v1'),writes=h.writes.length;
  for(const action of ['summon-focus-set','summon-focus-clear','summon-exchange-detail','summon-exchange-confirm','summon'])await h.press(action,{id:'astra',cost:'300',count:'1'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.storage.get('thap-vo-tan-v1'),saved);assert.equal(h.writes.length,writes);
});

test('real export/import and reload retain the target, all rarity promises and exchanged hero history',async()=>{
  const s=E.createState();s.welcome=true;s.shards=25;E.exchangeHero(s,'kira',25);E.setSummonTarget(s,'astra');s.summoning.guaranteed.SSR=s.summoning.guaranteed.EX=true;const h=harness(s);let exported;h.window.AndroidSave={exportSave:v=>exported=v};await h.press('export');const saved=E.validateState(JSON.parse(exported).state);assert.deepEqual(saved.summoning,s.summoning);const fresh=E.createState();fresh.welcome=true;const restored=harness(fresh);restored.window.receiveNativeSave(exported);assert.match(restored.modal.innerHTML,/Dùng bản lưu này/);assert.equal(restored.inspect('state.summoning.target'),null);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state.summoning'),s.summoning);await restored.press('nav',{page:'summon'});assert.match(restored.app.innerHTML,/Đã lệch 1\/1/);assert.match(restored.app.innerHTML,/>EX<\/span>/);assert.equal(restored.inspect('state.owned.kira.level'),1);const reloaded=harness(E.validateState(JSON.parse(restored.storage.get('thap-vo-tan-v1'))));assert.deepEqual(reloaded.inspect('state.summoning'),s.summoning);
});

function raidAccount(){const s=E.createState();s.welcome=true;for(const h of data.HEROES)s.owned[h.id]={level:20,copies:0,awaken:0};E.autoRaidTeams(s);return s;}
async function clearRaidWithButtons(h){
  h.inspect('for(const t of state.run.raid.teams)for(const h of t.heroes)h.atk=100000;for(const h of state.run.heroes)h.atk=100000;');
  let count=0;while(h.inspect('state.run.phase')==='battle'&&count++<8)await h.press('attack');
  assert.notEqual(h.inspect('state.run.phase'),'battle');
}

test('real raid preparation controls save swaps, row layouts and drafts and reject incomplete launches',async()=>{
  const fresh=E.createState();fresh.welcome=true;let h=harness(fresh);await h.press('nav',{page:'modes'});assert.match(h.app.innerHTML,/data-page="raids"/);await h.press('nav',{page:'raids'});assert.match(h.app.innerHTML,/Cần thêm 5/);
  const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('raid-start',{tier:'1'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  h=harness(raidAccount());await h.press('nav',{page:'raids'});const a=h.inspect('state.raids.teams[0][0]'),b=h.inspect('state.raids.teams[2][1]');await h.press('raid-pick',{team:'0',slot:'0'});assert.match(h.modal.innerHTML,/Chọn đồng đội/);await h.press('raid-assign',{team:'0',slot:'0',id:b});assert.equal(h.inspect('state.raids.teams[2][1]'),a);
  await h.press('raid-front',{team:'0',front:'2'});const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.raids.fronts[0],2);const restored=harness(saved);await restored.press('nav',{page:'raids'});assert.match(restored.app.innerHTML,/9\/9 vị trí/);assert.equal(restored.inspect('state.raids.teams[0][0]'),b);
});

test('real raid victory handoff resumes offline without a partial chest and ignores duplicate next-team taps',async()=>{
  let h=harness(raidAccount());await h.press('nav',{page:'raids'});await h.press('raid-start',{tier:'1'});assert.match(h.app.innerHTML,/ĐỘI 1\/3/);assert.match(h.app.innerHTML,/Đột kích 1\/3/);const wallet=structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]'));
  await clearRaidWithButtons(h);assert.equal(h.inspect('state.run.phase'),'relay');assert.match(h.app.innerHTML,/Chuẩn bị đội tiếp theo/);assert.doesNotMatch(h.app.innerHTML,/Mở rương/);await h.press('victory-next');assert.match(h.app.innerHTML,/Đến lượt đội 2/);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]')),wallet);
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.match(h.app.innerHTML,/Đội 2 xuất trận/);await h.press('raid-continue',{stage:'0'});assert.equal(h.inspect('state.run.raid.stage'),1);assert.match(h.app.innerHTML,/ĐỘI 2\/3/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('raid-continue',{stage:'0'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('nav',{page:'home'});assert.match(h.app.innerHTML,/Đột kích 3 đội/);await h.press('nav',{page:'tower'});assert.equal(h.inspect('state.run.raid.stage'),1);
});

test('real final raid chest and result restore the single reward, all three reports and the next unlocked difficulty',async()=>{
  let h=harness(raidAccount());await h.press('raid-start',{tier:'1'});
  for(let stage=0;stage<3;stage++){await clearRaidWithButtons(h);if(stage<2){await h.press('victory-next');await h.press('raid-continue',{stage:String(stage)});}}
  assert.equal(h.inspect('state.run.summary.reason'),'victory');assert.equal(h.inspect('state.armory.essence'),4);assert.equal(h.inspect('state.inventory.length'),4);assert.match(h.app.innerHTML,/Mở rương/);await h.press('victory-next');assert.match(h.app.innerHTML,/SSR · TRANG BỊ/);assert.match(h.app.innerHTML,/Tinh hoa boss/);const wallet=structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]'));
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('victory-next');assert.match(h.app.innerHTML,/Ba phong ấn đã sụp đổ/);assert.equal((h.app.innerHTML.match(/class="raid-reports"/g)||[]).length,1);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]')),wallet);
  await h.press('nav',{page:'raids'});await h.press('raid-tier',{tier:'2'});assert.match(h.app.innerHTML,/Rương UR bảo đảm/);assert.equal(h.inspect('E.raidBlocker(state,2)'),'');const saved=structuredClone(h.inspect('state'));await h.press('raid-tier',{tier:'0'});assert.deepEqual(h.inspect('state'),saved);
});

test('real raid retreat dialog accurately warns about losing partial progress and preserves resources',async()=>{
  const h=harness(raidAccount());await h.press('raid-start',{tier:'1'});await clearRaidWithButtons(h);await h.press('victory-next');const wallet=structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]'));
  await h.press('retreat');assert.match(h.modal.innerHTML,/Đã vượt 1\/3/);assert.match(h.modal.innerHTML,/bắt đầu từ giai đoạn I/);await h.press('confirm-retreat');assert.equal(h.inspect('state.run.summary.reason'),'retreat');assert.match(h.app.innerHTML,/Đã vượt 1\/3/);assert.equal(h.inspect('state.run.cleared'),1);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.dust,state.armory.essence,state.inventory.length]')),wallet);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real quest navigation exposes earned raid bonuses and individual claims save once across repeated taps',async()=>{
  const s=raidAccount();s.daily.claimed=data.DAILY.map(q=>q.id);for(const a of E.readyAchievements(s))E.claimAchievement(s,a.id);let h=harness(s);assert.equal(h.inspect('questReady(state)'),false);
  await h.press('raid-start',{tier:'1'});
  for(let stage=0;stage<3;stage++){await clearRaidWithButtons(h);if(stage<2){await h.press('victory-next');await h.press('raid-continue',{stage:String(stage)});}}
  await h.press('victory-next');await h.press('victory-next');assert.match(h.app.innerHTML,/3 phần thưởng nhiệm vụ đang chờ/);
  await h.press('nav',{page:'quests'});assert.match(h.app.innerHTML,/3 phần thưởng sẵn sàng/);assert.match(h.app.innerHTML,/Có thưởng để nhận/);
  await h.press('raid-missions',{tier:'1'});assert.equal(h.inspect('page'),'raids');assert.equal(h.inspect('raidTier'),1);assert.match(h.app.innerHTML,/Nhận tất cả \(3\)/);
  const before=structuredClone(h.inspect('state'));await h.press('raid-claim',{tier:'1',id:'first'});
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.tickets,before.tickets+3);assert.equal(saved.gold,before.gold+500);assert.equal(saved.armory.essence,before.armory.essence+4);assert.deepEqual(saved.run,before.run);assert.deepEqual(saved.raids.records[0].claimed,['first']);
  const paid=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('raid-claim',{tier:'1',id:'first'});assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,writes);
  h=harness(saved);await h.press('raid-missions',{tier:'1'});assert.match(h.app.innerHTML,/1\/5 phần thưởng đã nhận/);assert.match(h.app.innerHTML,/Nhận tất cả \(2\)/);
});

test('real claim-all pays only the displayed tier, persists every claim and leaves other tier notifications visible',async()=>{
  const s=raidAccount();s.daily.claimed=data.DAILY.map(q=>q.id);for(const a of E.readyAchievements(s))E.claimAchievement(s,a.id);
  s.raids.records[0]={clears:15,bestRounds:12,fullParty:true,claimed:['first']};s.raids.records[1]={clears:1,bestRounds:15,fullParty:false,claimed:[]};
  let h=harness(s);await h.press('raid-missions',{tier:'1'});assert.match(h.app.innerHTML,/Nhận tất cả \(4\)/);
  const before=structuredClone(h.inspect('state'));await h.press('raid-claim-all',{tier:'1'});
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.tickets,before.tickets+10);assert.equal(saved.gold,before.gold+600);assert.equal(saved.dust,before.dust+220);assert.equal(saved.armory.essence,before.armory.essence+8);assert.equal(saved.raids.records[0].claimed.length,5);assert.deepEqual(saved.raids.records[1],before.raids.records[1]);
  const writes=h.writes.length;await h.press('raid-claim-all',{tier:'1'});assert.equal(h.writes.length,writes);
  h=harness(saved);await h.press('nav',{page:'quests'});assert.match(h.app.innerHTML,/5\/30 phần thưởng đã nhận · 1 phần thưởng sẵn sàng/);
  await h.press('raid-missions',{tier:'2'});assert.equal(h.inspect('raidTier'),2);assert.match(h.app.innerHTML,/MỆNH LỆNH TAM ẤN \/ TINH ANH/);await h.press('raid-claim-all',{tier:'2'});assert.equal(h.inspect('questReady(state)'),false);
});

test('real mission handlers reject unfinished goals, invalid selections, capped wallets and practice without writing a save',async()=>{
  let h=harness(raidAccount());
  for(const [action,attrs] of [['raid-claim',{tier:'1',id:'first'}],['raid-claim',{tier:'1',id:'constructor'}],['raid-claim-all',{tier:'3'}],['raid-missions',{tier:'4'}]]){
    const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press(action,attrs);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  }
  const s=raidAccount();s.raids.records[0]={clears:1,bestRounds:12,fullParty:true,claimed:[]};s.tickets=1e9;h=harness(s);
  const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('raid-claim-all',{tier:'1'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('training-start');const practice=structuredClone(h.inspect('state')),practiceWrites=h.writes.length;await h.press('raid-claim',{tier:'1',id:'first'});assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,practiceWrites);
});

test('real app restores v17 clear records as unclaimed missions and keeps an active raid unchanged while claiming',async()=>{
  const s=raidAccount();s.raids.records[0]={clears:5,bestRounds:12};s.raids.records[1]={clears:0,bestRounds:null};s.raids.records[2]={clears:0,bestRounds:null};s.version=17;delete s.raids.dragon;
  let h=harness(s);assert.equal(h.inspect('state.version'),E.SAVE_VERSION);assert.equal(h.inspect('state.tickets'),s.tickets);assert.equal(h.inspect('E.readyRaidMissions(state).length'),3);
  await h.press('raid-start',{tier:'1'});const journey=structuredClone(h.inspect('state.run'));await h.press('nav',{page:'quests'});await h.press('raid-missions',{tier:'1'});await h.press('raid-claim-all',{tier:'1'});
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(saved.run,journey);assert.deepEqual(saved.raids.records[0].claimed,['first','veteran','swift']);
  h=harness(saved);assert.equal(h.inspect('state.run.raid.stage'),0);assert.deepEqual(h.inspect('state.run'),journey);await h.press('nav',{page:'raids'});assert.match(h.app.innerHTML,/3\/5 phần thưởng đã nhận/);
});

test('winning commits rewards and MVP before playback, then restores a usable victory page after background cancellation',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;s.run.heroes[0].energy=100;let release,h;
  h=harness(s,{onCinematic:()=>{const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.run.victory.stage,'intro');assert.equal(saved.armory.hunts.colossus.clears,1);assert.ok(saved.run.battle.statistics.rows.rook.damage>0);return new Promise(resolve=>release=resolve);}});
  const action=h.press('skill');await Promise.resolve();assert.equal(h.inspect('busy'),true);h.document.hidden=true;h.visibility();await action;release?.(true);assert.equal(h.inspect('busy'),false);assert.equal(h.app.inert,false);assert.match(h.app.innerHTML,/id="victory3d"/);assert.match(h.app.innerHTML,/MVP/);assert.equal(h.inspect('state.armory.hunts.colossus.clears'),1);
});

test('real victory controls save each stage and reopen without duplicating rewards or replaying a finished chest',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');let h=harness(s);const wallet=structuredClone(h.inspect('[state.gold,state.tickets,state.dust,state.armory.marks.colossus]'));
  assert.match(h.app.innerHTML,/Mở rương/);assert.doesNotMatch(h.app.innerHTML,/game-dock/);await h.press('victory-next');assert.equal(h.inspect('state.run.victory.stage'),'loot');assert.match(h.app.innerHTML,/Ấn săn boss/);assert.doesNotMatch(h.app.innerHTML,/victory-loot-rarity/);h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.match(h.app.innerHTML,/Rương chiến lợi phẩm/);await h.press('victory-next');assert.equal(h.inspect('state.run.victory.stage'),'done');assert.match(h.app.innerHTML,/Chiến lợi phẩm đã về kho/);assert.match(h.app.innerHTML,/TOÀN HÀNH TRÌNH/);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.tickets,state.dust,state.armory.marks.colossus]')),wallet);
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.doesNotMatch(h.app.innerHTML,/id="victory3d"/);const writes=h.writes.length;await h.press('victory-next');assert.equal(h.writes.length,writes);assert.equal(h.inspect('state.armory.hunts.colossus.clears'),1);
});

test('immediate skip and native Back preserve loot and reveal the next relic choice without a second reward action',async()=>{
  for(const method of ['victory-skip','back']){const s=E.createState();s.welcome=true;E.startRun(s,42);s.run.map=null;s.run.floor=5;s.run.routes=['boss'];E.chooseRoute(s,0);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');const h=harness(s),wallet=h.inspect('[state.gold,state.tickets,state.shards,state.inventory.length]');if(method==='back')assert.equal(h.window.gameBack(),true);else await h.press(method);assert.equal(h.inspect('state.run.victory.stage'),'done');assert.match(h.app.innerHTML,/Khế ước bóng tối/);await h.press('contract-skip',{floor:'5'});assert.match(h.app.innerHTML,/CỔ VẬT ĐỘC NHẤT/);assert.deepEqual(h.inspect('[state.gold,state.tickets,state.shards,state.inventory.length]'),wallet);const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.run.lastReward.loot.gear.id,s.run.lastReward.loot.gear.id);await h.press('choose-relic',{id:h.inspect('state.run.relicChoices[0]')});await h.press('blessing',{id:h.inspect('state.run.choices[0]')});assert.equal(h.inspect('state.run.victory'),null);assert.equal(h.inspect('state.run.floor'),6);}
});

test('rest choices do not show victory, and practice victory reports stay isolated from the account save',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);s.run.map=null;s.run.routes=['rest'];E.chooseRoute(s,0);const rested=harness(s);assert.doesNotMatch(rested.app.innerHTML,/id="victory3d"/);assert.match(rested.app.innerHTML,/Một khoảng lặng/);
  const account=E.createState();account.welcome=true;const h=harness(account);await h.press('training-start');const saved=h.storage.get('thap-vo-tan-v1'),writes=h.writes.length;h.inspect('state.run.heroes[0].atk=1000000');await h.press('attack');assert.match(h.app.innerHTML,/id="victory3d"/);await h.press('victory-next');assert.match(h.app.innerHTML,/không nhận tài nguyên/);await h.press('victory-next');assert.match(h.app.innerHTML,/TOÀN HÀNH TRÌNH/);assert.equal(h.writes.length,writes);assert.equal(h.storage.get('thap-vo-tan-v1'),saved);await h.press('training-exit');assert.deepEqual(h.inspect('state'),account);
});

test('real map previews show connected paths and future rewards without spending resources or altering the saved journey',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;
  assert.match(h.app.innerHTML,/id="tower-map3d"/);await h.press('map-inspect',{node:'5:1'});assert.match(h.app.innerHTML,/3 vé · 3 tinh thạch/);assert.doesNotMatch(h.app.innerHTML,/data-action="route"/);
  await h.press('map-inspect',{node:'1:1'});assert.match(h.app.innerHTML,/138 vàng · 1 vé/);assert.match(h.app.innerHTML,/data-action="route" data-index="1"/);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
});

test('a map route commits and saves before travel, rejects double taps and resumes its connected exits after cancellation',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);const expected=structuredClone(s);E.chooseRoute(expected,1);let h;
  h=harness(s,{onTravel:(id,options)=>{assert.equal(id,'1:1');assert.equal(options.speed,1);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);return {duration:760,impact:0};}});
  const action=h.press('route',{index:'1'});assert.equal(h.inspect('busy'),true);assert.equal(h.app.inert,true);await h.press('route',{index:'1'});assert.equal(h.travelCalls.length,1);assert.deepEqual(h.inspect('state'),expected);
  h.document.hidden=true;h.visibility();await action;assert.equal(h.inspect('busy'),false);assert.equal(h.app.inert,false);assert.deepEqual(h.inspect('state'),expected);
  const restored=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.deepEqual(restored.inspect('state.run.map.path'),['1:1']);assert.match(restored.app.innerHTML,/TẦNG 2 \/ 5/);assert.equal(restored.inspect('state.run.routes.length'),2);
});

test('the old card router remains usable for a migrated run and its next journey opens the map',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);s.run.map=null;s.version=13;delete s.run.map;const h=harness(s);
  assert.match(h.app.innerHTML,/class="route-choices"/);assert.doesNotMatch(h.app.innerHTML,/id="tower-map3d"/);await h.press('route',{index:'1'});assert.equal(h.travelCalls.length,0);assert.equal(h.inspect('state.run.floor'),2);assert.equal(h.inspect('state.run.map'),null);
  await h.press('confirm-retreat');await h.press('start');assert.match(h.app.innerHTML,/id="tower-map3d"/);assert.ok(h.inspect('state.run.map'));assert.equal(h.inspect('state.version'),E.SAVE_VERSION);
});

test('real row controls swap heroes and restore row layouts through presets, export and reload',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('nav',{page:'heroes'});assert.match(h.app.innerHTML,/ĐỘI HÌNH CHIẾN THUẬT/);
  await h.press('formation-layout',{front:'2'});await h.press('formation-swap',{first:'0',second:'2'});assert.equal(h.inspect('state.formation.front'),2);assert.deepEqual(h.inspect('state.team'),['lumi','aerin','rook']);
  await h.press('preset-save',{slot:'0'});await h.press('formation-layout',{front:'1'});await h.press('preset-apply',{slot:'0'});assert.equal(h.inspect('state.formation.front'),1);await h.press('preset-confirm-apply',{slot:'0'});assert.equal(h.inspect('state.formation.front'),2);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const restored=harness(E.validateState(JSON.parse(exported).state));assert.equal(restored.inspect('state.formation.front'),2);
  await h.press('start');await h.press('route',{index:'0'});assert.match(h.app.innerHTML,/2 trước · 1 sau/);const before=structuredClone(h.inspect('state'));
  await h.press('formation-layout',{front:'1'});await h.press('formation-swap',{first:'0',second:'2'});assert.deepEqual(h.inspect('state'),before);
});

test('real skill actions open all 20 cinematics with auto/speed options after committing exactly once',async()=>{
  for(const {id} of data.HEROES){
    const s=E.createState();s.welcome=true;s.owned[id]||={level:1,copies:0,awaken:0};s.team=[id,...['rook','aerin','lumi','ember'].filter(h=>h!==id).slice(0,2)];s.settings.speed=2;E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;for(const hero of s.run.heroes)hero.hp=1;
    const expected=structuredClone(s);E.playerAction(expected,id,'enemy0',true,E.bossParts(expected.run).selected);const h=harness(s);await h.press('skill');assert.equal(h.cinematicCalls.length,1);assert.equal(h.cinematicCalls[0].id,id);assert.deepEqual(structuredClone(h.cinematicCalls[0].options),{auto:false,speed:2});
    assert.deepEqual(h.inspect('state'),expected);assert.equal(h.inspect('busy'),false);assert.equal(h.inspect('battlePlayback.active'),false);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);
  }
});

test('Auto forwards its mode and a newly supported hero completes ordinary playback if the cinematic is unavailable',async()=>{
  const s=E.createState();s.welcome=true;s.adventure.equipped=null;E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;const h=harness(s);await h.press('auto');await h.tickAuto();assert.equal(h.cinematicCalls[0].id,'rook');assert.equal(h.cinematicCalls[0].options.auto,true);assert.equal(h.inspect('busy'),false);
  const plain=E.createState();plain.welcome=true;plain.owned.bryn={level:1,copies:0,awaken:0};plain.team=['bryn','rook','aerin'];E.startHunt(plain,'colossus',1,42);plain.run.heroes[0].energy=100;const expected=structuredClone(plain);E.playerAction(expected,'bryn','enemy0',true,E.bossParts(expected.run).selected);const other=harness(plain);await other.press('skill');assert.equal(other.cinematicCalls.length,1);assert.equal(other.cinematicCalls[0].id,'bryn');assert.equal(other.inspect('state.run.heroes[0].energy'),0);assert.deepEqual(other.inspect('state'),expected);
});

test('every hero has a free cinematic preview in its real detail modal, including heroes not yet owned',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s),before=structuredClone(h.inspect('state'));
  for(const {id} of data.HEROES){await h.press('hero',{id});assert.match(h.modal.innerHTML,/data-action="preview-ultimate"/);await h.press('preview-ultimate',{id});assert.equal(h.cinematicCalls.at(-1).id,id);assert.equal(h.cinematicCalls.at(-1).options.preview,true);}
  assert.deepEqual(h.inspect('state'),before);
});

test('backgrounding during a starter cinematic releases input without replaying the skill or changing the saved result',async()=>{
  let resolve;const opening=new Promise(r=>resolve=r),s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;
  const expected=structuredClone(s);E.playerAction(expected,'rook','enemy0',true,E.bossParts(expected.run).selected);const h=harness(s,{onCinematic:()=>opening}),action=h.press('skill');
  await Promise.resolve();assert.equal(h.inspect('busy'),true);assert.deepEqual(h.inspect('state'),expected);await h.press('skill');assert.equal(h.cinematicCalls.length,1);
  h.document.hidden=true;h.visibility();await action;resolve(true);await Promise.resolve();assert.equal(h.inspect('busy'),false);assert.equal(h.inspect('battlePlayback.active'),false);assert.equal(h.app.inert,false);assert.deepEqual(h.inspect('state'),expected);assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);
});

test('cinematic settings and wardrobe preview actions operate without altering account progress',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s),before=structuredClone(h.inspect('state'));await h.press('settings');assert.match(h.modal.innerHTML,/Hoạt cảnh kỹ năng 3D/);assert.match(h.modal.innerHTML,/Rút gọn chiêu khi Auto/);
  await h.press('cinematics');assert.equal(h.preferences.cinematics,true);await h.press('cinematics-auto');assert.equal(h.preferences.brief,false);assert.deepEqual(h.inspect('state'),before);
  for(const id of ['rook','aerin','lumi','ember']){await h.press('hero',{id});assert.match(h.modal.innerHTML,/data-action="preview-ultimate"/);await h.press('skin-open',{id});assert.match(h.app.innerHTML,/data-action="preview-ultimate"/);await h.press('preview-ultimate',{id});assert.equal(h.cinematicCalls.at(-1).id,id);assert.equal(h.cinematicCalls.at(-1).options.preview,true);}
  assert.deepEqual(h.inspect('state'),before);
});

test('real camera controls retain the shake choice and preserve an active journey and phone haptics',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;
  await h.press('settings');assert.match(h.modal.innerHTML,/data-action="battle-camera" role="switch" aria-checked="true"/);assert.match(h.modal.innerHTML,/data-action="camera-shake" role="switch" aria-checked="true"/);
  await h.press('camera-shake');assert.equal(h.preferences.cameraShake,false);assert.match(h.modal.innerHTML,/data-action="camera-shake" role="switch" aria-checked="false"/);
  await h.press('battle-camera');assert.equal(h.preferences.cameraMotion,false);assert.match(h.modal.innerHTML,/data-action="camera-shake"[^>]* disabled/);
  await h.press('battle-camera');assert.equal(h.preferences.cameraMotion,true);assert.equal(h.preferences.cameraShake,false);assert.doesNotMatch(h.modal.innerHTML,/data-action="camera-shake"[^>]* disabled/);
  await h.press('camera-shake');assert.equal(h.preferences.cameraShake,true);assert.equal(h.inspect('hapticsEnabled()'),true);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
});

test('real audio settings mute every voice, preserve the music choice and keep the active journey unchanged',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state'));assert.equal(h.audioContexts.length,0);
  await h.press('settings');assert.equal(h.audioContexts.length,1);assert.equal(h.inspect('gameAudio.music.key'),'music:boss');assert.match(h.modal.innerHTML,/data-action="music" role="switch" aria-checked="true"/);
  await h.press('music');assert.equal(h.storage.get('thap-vo-tan-music'),'off');assert.equal(h.inspect('gameAudio.music'),null);assert.deepEqual(h.inspect('state'),before);
  await h.press('sound');assert.equal(h.inspect('gameAudio.voices.size'),0);assert.match(h.modal.innerHTML,/data-action="music"[^>]* disabled/);assert.equal(h.inspect('state.settings.sound'),false);
  await h.press('sound');assert.equal(h.inspect('gameAudio.music'),null);assert.equal(h.inspect('gameAudio.musicEnabled'),false);assert.deepEqual(h.inspect('state'),before);
  await h.press('music');assert.equal(h.inspect('gameAudio.music.key'),'music:boss');assert.equal(h.audioContexts.length,1);assert.deepEqual(h.inspect('state'),before);h.inspect('gameAudio.dispose()');
});

test('a real attack commits once before its weapon audio and background cancellation removes the pending contact',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const expected=structuredClone(s);E.playerAction(expected,'rook','enemy0',false,E.bossParts(expected.run).selected);
  let h;h=harness(s,{onBattle:()=>{assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),expected);return {duration:150,release:25,impact:70};}});
  const action=h.press('attack');for(let i=0;i<10;i++)await Promise.resolve();assert.deepEqual(h.inspect('state'),expected);assert.ok(h.inspect('[...gameAudio.voices].some(v=>v.key==="weapon:shield:release")'));assert.equal(h.inspect('[...gameAudio.voices].some(v=>v.key==="weapon:shield:impact")'),false);
  h.document.hidden=true;h.visibility();await action;assert.equal(h.inspect('gameAudio.pending'),null);assert.equal(h.inspect('gameAudio.voices.size'),0);assert.deepEqual(h.inspect('state'),expected);assert.equal(h.inspect('busy'),false);
  h.document.hidden=false;h.visibility();assert.equal(h.inspect('[...gameAudio.voices].some(v=>v.group==="battle")'),false);assert.deepEqual(h.inspect('state'),expected);h.inspect('gameAudio.dispose()');
});

test('real wardrobe controls preview locked skins, equip unlocked ones and restore base through native backup and reload',async()=>{
  const s=E.createState();s.welcome=true;s.best=10;const h=harness(s),before=structuredClone(h.inspect('state'));
  assert.match(h.app.innerHTML,/data-page="wardrobe"/);await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/data-action="skin-open"/);
  await h.press('skin-open',{id:'rook'});assert.equal(h.inspect('page'),'wardrobe');assert.match(h.app.innerHTML,/data-skin-preview="rook-guardian"/);
  await h.press('skin-select',{id:'ember-phoenix'});assert.match(h.app.innerHTML,/Chưa mở khóa/);assert.deepEqual(h.inspect('state'),before);const writes=h.writes.length;
  await h.press('skin-equip',{hero:'ember',id:'ember-phoenix'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  await h.press('skin-select',{id:'rook-guardian'});await h.press('skin-equip',{hero:'rook',id:'rook-guardian'});assert.equal(h.inspect('state.skins.rook'),'rook-guardian');assert.match(h.app.innerHTML,/Đang mặc/);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const restored=harness(E.validateState(JSON.parse(exported).state));
  assert.equal(restored.inspect('state.skins.rook'),'rook-guardian');await restored.press('skin-open',{id:'rook'});await restored.press('skin-variant',{id:'base'});assert.match(restored.app.innerHTML,/data-skin-preview="base"/);
  await restored.press('skin-equip',{hero:'rook',id:'base'});assert.equal(restored.inspect('state.skins.rook'),null);assert.equal(JSON.parse(restored.storage.get('thap-vo-tan-v1')).skins.rook,null);
});

test('wardrobe navigation and mid-battle costume changes preserve the full live journey and stop auto',async()=>{
  const s=E.createState();s.welcome=true;s.best=10;E.startHunt(s,'colossus',1,42);E.playerAction(s,'rook','enemy0');const h=harness(s),run=structuredClone(h.inspect('state.run'));
  await h.press('auto');await h.press('nav',{page:'home'});await h.press('nav',{page:'wardrobe'});assert.equal(h.inspect('auto'),false);
  await h.press('skin-equip',{hero:'rook',id:'rook-guardian'});await h.press('nav',{page:'tower'});assert.match(h.app.innerHTML,/data-skin-preview="rook-guardian"/);assert.deepEqual(h.inspect('state.run'),run);
  const restored=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.equal(restored.inspect('state.skins.rook'),'rook-guardian');assert.deepEqual(restored.inspect('state.run'),run);
});

test('wardrobe actions cannot write to a training account, and navigation restores the real costume choices',async()=>{
  const s=E.createState();s.welcome=true;s.best=10;E.equipSkin(s,'rook','rook-guardian');E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('nav',{page:'training'});await h.press('training-start');const writes=h.writes.length;await h.press('skin-equip',{hero:'rook',id:'base'});assert.equal(h.writes.length,writes);
  await h.press('nav',{page:'wardrobe'});assert.equal(h.inspect('practice'),null);assert.deepEqual(h.inspect('state'),before);assert.match(h.app.innerHTML,/Đang mặc/);
});

test('training row controls remain isolated across retry and exit to a live journey',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('nav',{page:'training'});assert.match(h.app.innerHTML,/data-training="front"/);h.change('front','2');await h.press('training-start');assert.equal(h.inspect('state.run.formation.front'),2);
  await h.press('training-retry');assert.equal(h.inspect('state.run.formation.front'),2);await h.press('training-exit');assert.deepEqual(h.inspect('state'),before);
});

test('v11 imports resume legacy rows while new journeys and native backups use the new formation snapshot',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.version=11;delete s.formation;delete s.run.formation;const h=harness(s);
  assert.match(h.app.innerHTML,/Chuyến cũ/);assert.equal(h.inspect('state.run.formation'),null);await h.press('nav',{page:'home'});await h.press('nav',{page:'tower'});assert.equal(h.inspect('state.run.formation'),null);
  await h.press('confirm-retreat');await h.press('back-home');await h.press('start');assert.equal(h.inspect('state.run.formation.front'),1);
});

test('the game lobby connects real activities, resources, hero details and the first tower run',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);
  assert.equal(h.inspect('page'),'home');assert.match(h.app.innerHTML,/id="lobby3d"/);assert.match(h.app.innerHTML,/VÀO THÁP/);
  assert.doesNotMatch(h.app.innerHTML,/class="rail"|app-footer|Hành trình bắt đầu từ đây/);
  for(const page of ['heroes','summon','forge','quests','modes','campaign','dungeons','hunts','challenges','pets','expeditions','training']){
    assert.match(h.app.innerHTML,new RegExp('data-page="'+page+'"'));
    await h.press('nav',{page});assert.equal(h.inspect('page'),page);assert.match(h.app.innerHTML,/class="screen-tools"/);
    await h.press('nav',{page:'home'});assert.match(h.app.innerHTML,/id="lobby3d"/);
  }
  const before=structuredClone(h.inspect('state'));
  await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/Rook/);await h.press('close');
  await h.press('settings');const release=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;assert.ok(h.modal.innerHTML.includes('Phiên bản '+release));await h.press('close');assert.deepEqual(h.inspect('state'),before);
  await h.press('start');assert.equal(h.inspect('page'),'tower');assert.equal(h.inspect('state.run.phase'),'route');
  assert.match(h.app.innerHTML,/Chọn lối đi/);assert.equal(h.inspect('state.tickets'),s.tickets);assert.equal(h.inspect('state.gold'),s.gold);
});

test('real link controls select a pair, commit once, and survive lobby navigation, native backup and reload',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.link.charge=100;const h=harness(s);
  assert.match(h.app.innerHTML,/data-action="link-open"/);const before=structuredClone(h.inspect('state'));
  await h.press('link-open');assert.match(h.modal.innerHTML,/Liên kết nguyên tố/);assert.deepEqual(h.inspect('state'),before);
  await h.press('link-pair',{first:'rook',second:'lumi'});assert.match(h.modal.innerHTML,/Thánh thành/);await h.press('link-fire',{first:'rook',second:'lumi'});
  assert.equal(h.inspect('state.run.link.charge'),0);assert.equal(h.inspect('state.run.link.casts'),1);assert.deepEqual(h.inspect('state.run.battle.used'),[]);
  const committed=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('link-fire',{first:'rook',second:'lumi'});
  assert.deepEqual(h.inspect('state'),committed);assert.equal(h.writes.length,writes);await h.press('nav',{page:'home'});await h.press('nav',{page:'tower'});assert.deepEqual(h.inspect('state.run'),committed.run);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const restored=harness(E.validateState(JSON.parse(exported).state));
  assert.deepEqual(restored.inspect('state'),committed);await restored.press('link-open');assert.match(restored.modal.innerHTML,/Đã dùng liên kết trong vòng này/);
});

test('training link controls consume only the practice bar, reset on retry and restore the live journey',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.link.charge=71;const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('nav',{page:'training'});await h.press('training-start');const writes=h.writes.length;assert.equal(h.inspect('state.run.link.charge'),100);
  await h.press('link-open');await h.press('link-pair',{first:'rook',second:'lumi'});await h.press('link-fire',{first:'rook',second:'lumi'});
  assert.equal(h.inspect('state.run.link.casts'),1);assert.equal(h.writes.length,writes);await h.press('training-retry');assert.equal(h.inspect('state.run.link.charge'),100);
  await h.press('training-exit');assert.deepEqual(h.inspect('state'),before);assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).run.link.charge,71);
});

test('real autoplay uses the pet then a ready pair before hero attacks and stops when returning home',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.link.charge=100;const h=harness(s);
  await h.press('auto');await h.tickAuto();assert.equal(h.inspect('state.run.pet.nextRound'),4);assert.equal(h.inspect('state.run.link.casts'),0);assert.equal(h.inspect('state.run.link.charge'),100);assert.deepEqual(h.inspect('state.run.battle.used'),[]);
  await h.tickAuto();assert.equal(h.inspect('state.run.link.casts'),1);assert.equal(h.inspect('state.run.link.charge'),0);assert.deepEqual(h.inspect('state.run.battle.used'),[]);
  await h.tickAuto();assert.equal(h.inspect('state.run.battle.used.length'),1);assert.equal(h.inspect('state.run.link.casts'),1);
  await h.press('nav',{page:'home'});assert.equal(h.inspect('auto'),false);assert.match(h.app.innerHTML,/TIẾP TỤC HÀNH TRÌNH/);
});

test('partial charge and dead pair controls reject without spending while imported v10 battles acquire an empty bar',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.link.charge=81;const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('link-open');assert.match(h.modal.innerHTML,/Cần thêm 19 điểm/);await h.press('link-fire',{first:'rook',second:'lumi'});assert.deepEqual(h.inspect('state'),before);
  h.inspect('state.run.link.charge=100;state.run.heroes[0].hp=0');const dead=structuredClone(h.inspect('state'));await h.press('link-open');await h.press('link-pair',{first:'rook',second:'lumi'});assert.match(h.modal.innerHTML,/Cả hai anh hùng phải còn sống/);await h.press('link-fire',{first:'rook',second:'lumi'});assert.deepEqual(h.inspect('state'),dead);
  const old=structuredClone(s);old.version=10;delete old.run.link;delete old.run.battle.linkUsed;h.window.receiveNativeSave(JSON.stringify(old));await h.press('confirm-import');
  assert.deepEqual(h.inspect('state.run.link'),{charge:0,casts:0});assert.equal(h.inspect('state.run.battle.linkUsed'),false);assert.deepEqual(h.inspect('state.run.heroes'),old.run.heroes);
});

test('returning to the lobby pauses autoplay and resumes the exact battle without withdrawing or duplicating rewards',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');
  const h=harness(s),before=structuredClone(h.inspect('state.run')),resources=h.inspect('[state.gold,state.tickets,state.wins]');
  assert.match(h.app.innerHTML,/is-combat/);assert.doesNotMatch(h.app.innerHTML,/class="game-dock"|class="game-hud"/);
  assert.match(h.app.innerHTML,/aria-label="Về sảnh, giữ lại trận đấu"/);await h.press('auto');assert.equal(h.inspect('auto'),true);
  await h.press('nav',{page:'home'});assert.equal(h.inspect('auto'),false);assert.deepEqual(h.inspect('state.run'),before);
  assert.match(h.app.innerHTML,/TIẾP TỤC HÀNH TRÌNH/);assert.doesNotMatch(h.app.innerHTML,/data-action="start"/);
  await h.press('nav',{page:'modes'});assert.match(h.app.innerHTML,/HÀNH TRÌNH ĐANG DIỄN RA/);assert.doesNotMatch(h.app.innerHTML,/data-action="start"/);
  await h.press('nav',{page:'tower'});assert.deepEqual(h.inspect('state.run'),before);assert.match(h.app.innerHTML,/is-combat/);
  assert.equal(h.window.gameBack(),true);assert.equal(h.inspect('page'),'home');assert.deepEqual(h.inspect('state.run'),before);
  assert.equal(h.window.gameBack(),false);assert.deepEqual(h.inspect('[state.gold,state.tickets,state.wins]'),resources);
  const restored=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.equal(restored.inspect('page'),'tower');assert.deepEqual(restored.inspect('state.run'),before);
});

test('lobby uses current run snapshots, exits training cleanly, and acknowledges finished runs',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);const h=harness(s),before=structuredClone(h.inspect('state'));
  await h.press('nav',{page:'home'});assert.deepEqual(h.inspect('lobbyParty(state)'),s.run.heroes.map(u=>u.id));
  await h.press('nav',{page:'training'});await h.press('training-start');await h.press('nav',{page:'home'});
  assert.equal(h.inspect('practice'),null);assert.deepEqual(h.inspect('state'),before);assert.match(h.app.innerHTML,/TIẾP TỤC HÀNH TRÌNH/);
  await h.press('nav',{page:'tower'});h.inspect('state.run.heroes[0].atk=100000');await h.press('attack');assert.equal(h.inspect('state.run.phase'),'result');
  await h.press('nav',{page:'home'});assert.match(h.app.innerHTML,/Xem kết quả chuyến trước/);assert.match(h.app.innerHTML,/VÀO THÁP/);
  await h.press('nav',{page:'tower'});await h.press('back-home');assert.equal(h.inspect('page'),'home');assert.equal(h.inspect('state.run'),null);
  assert.equal(JSON.parse(h.storage.get('thap-vo-tan-v1')).run,null);
});

test('real app training handlers guard persistence, retry, backgrounding and navigation back to a live journey',async()=>{
  const original=E.createState();original.welcome=true;E.startRun(original,42);E.chooseRoute(original,0);E.playerAction(original,'rook','enemy0');const before=structuredClone(original),h=harness(original);
  await h.press('nav',{page:'training'});assert.match(h.app.innerHTML,/data-training="team"/);h.change('team','aion','0');h.change('team','eclipse','1');h.change('level','20');h.change('signature','on');await h.press('training-start');
  assert.equal(h.inspect('state.run.mode'),'training');assert.equal(h.inspect('Object.keys(state.owned).length'),20);const writeCount=h.writes.length,stored=h.storage.get('thap-vo-tan-v1');
  for(let i=0;i<3&&h.inspect('state.run.phase')==='battle';i++)await h.press('skill');assert.equal(h.inspect('state.run.phase'),'result');await h.press('training-retry');assert.equal(h.inspect('state.run.phase'),'battle');await h.press('summon',{count:'10'});await h.press('export');await h.press('speed');h.visibility();h.windowHandlers.pagehide();h.windowHandlers.pageshow();
  assert.equal(h.writes.length,writeCount);assert.equal(h.storage.get('thap-vo-tan-v1'),stored);assert.deepEqual(JSON.parse(stored),before);
  await h.press('nav',{page:'forge'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.inspect('practice'),null);assert.match(h.app.innerHTML,/KHO CHIẾN LỢI PHẨM/);
  await h.press('nav',{page:'training'});await h.press('training-start');assert.equal(h.window.gameBack(),true);assert.deepEqual(h.inspect('state'),before);assert.equal(h.inspect('page'),'training');
});

test('real forge and hunt controls persist the item, correct owner and one boss reward',async()=>{
  const s=E.createState();s.welcome=true;s.gold=10000;s.dust=100;s.armory.marks.colossus=10;const h=harness(s);
  await h.press('nav',{page:'armory'});await h.press('forge-info',{id:'signature-rook'});assert.match(h.modal.innerHTML,/Rèn và trừ nguyên liệu/);await h.press('forge-create',{id:'signature-rook'});assert.equal(h.inspect("state.inventory.some(g=>g.base==='signature-rook')"),true);const id=h.inspect("state.inventory.find(g=>g.base==='signature-rook').id");await h.press('equip-gear',{id});
  let saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(E.gearLoadout(saved,'rook').signature,'rook');assert.equal(saved.armory.marks.colossus,2);
  await h.press('nav',{page:'armory'});await h.press('hall-tab',{tab:'seals'});assert.equal(h.inspect('page'),'forge');assert.match(h.app.innerHTML,/Khắc ấn/);
  await h.press('nav',{page:'hunts'});await h.press('hunt-info',{id:'colossus',tier:'1'});await h.press('start-hunt',{id:'colossus',tier:'1'});h.inspect('state.run.heroes[0].atk=100000');await h.press('attack');const count=h.writes.length;await h.press('attack');saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(h.writes.length,count);assert.equal(saved.armory.marks.colossus,3);assert.equal(saved.armory.hunts.colossus.clears,1);assert.equal(saved.best,0);assert.match(h.app.innerHTML,/Chiến thắng/);await h.press('victory-skip');assert.match(h.app.innerHTML,/Chiến lợi phẩm đã về kho/);
});

test('real expedition controls persist dispatch, lock team assignment and confirm early recall',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('nav',{page:'expeditions'});assert.match(h.app.innerHTML,/Cần tầng 5/);assert.match(h.app.innerHTML,/Vượt tầng 25/);
  await h.press('expedition-dispatch');let saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.expeditions.slots[0].hero,'ember');assert.equal(saved.gold,s.gold);const count=h.writes.length;await h.press('expedition-dispatch');assert.equal(h.writes.length,count);
  await h.press('nav',{page:'heroes'});assert.match(h.app.innerHTML,/VIỄN CHINH/);await h.press('hero',{id:'ember'});assert.match(h.modal.innerHTML,/class="slot-pick [^"]*" disabled/);await h.press('assign',{id:'ember',slot:'0'});assert.deepEqual(h.inspect('state.team'),s.team);
  await h.press('nav',{page:'expeditions'});await h.press('expedition-recall',{slot:'0'});assert.match(h.modal.innerHTML,/không nhận phần thưởng/);await h.press('close');assert.equal(h.inspect('state.expeditions.slots[0].hero'),'ember');await h.press('expedition-recall',{slot:'0'});await h.press('expedition-confirm-recall',{slot:'0'});
  saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.expeditions.slots[0],null);assert.equal(saved.expeditions.completed,0);assert.equal(saved.gold,s.gold);await h.press('assign',{id:'ember',slot:'0'});assert.equal(h.inspect('state.team[0]'),'ember');
});

test('reopening the real app after an offline expedition pays once and preserves an active battle',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');E.dispatchExpedition(s,'mist-path','ember',0,Date.now()-900_100);const battle=structuredClone(s.run),h=harness(s);await h.press('nav',{page:'expeditions'});assert.match(h.app.innerHTML,/Sẵn sàng nhận/);assert.doesNotMatch(h.app.innerHTML,/data-expedition-claim="0" disabled/);
  await h.press('expedition-claim-all');let saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.gold,s.gold+60);assert.equal(saved.dust,s.dust+1);assert.equal(saved.expeditions.completed,1);assert.deepEqual(saved.run,battle);const count=h.writes.length;await h.press('expedition-claim',{slot:'0'});await h.press('expedition-claim-all');assert.equal(h.writes.length,count);
  saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));const reopened=harness(saved);assert.equal(reopened.inspect('state.expeditions.completed'),1);assert.equal(reopened.inspect('state.gold'),saved.gold);assert.deepEqual(reopened.inspect('state.run'),battle);
});

test('countdown completion updates individual nodes and persists readiness without rerendering or replacing a modal',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('nav',{page:'expeditions'});await h.press('expedition-dispatch');await h.press('settings');const markup=h.app.innerHTML,modal=h.modal.innerHTML;
  const make=()=>({textContent:'',disabled:true,hidden:false,style:{},classList:{toggle(){}},parentElement:{setAttribute(){}}});
  for(const selector of ['[data-expedition-countdown="0"]','[data-expedition-progress="0"]','[data-expedition-state="0"]','[data-expedition-card="0"]','[data-expedition-claim="0"]','[data-expedition-recall="0"]','[data-expedition-summary]','[data-expedition-dot]','[data-expedition-claim-all]'])h.nodes.set(selector,[make()]);
  h.inspect('state.expeditions.slots[0].endsAt=Date.now()-100;state.expeditions.slots[0].startedAt=state.expeditions.slots[0].endsAt-900000;state.expeditions.slots[0].observedAt=state.expeditions.slots[0].startedAt;refreshExpeditionClock()');
  assert.equal(h.app.innerHTML,markup);assert.equal(h.modal.innerHTML,modal);assert.equal(h.nodes.get('[data-expedition-countdown="0"]')[0].textContent,'Sẵn sàng nhận');assert.equal(h.nodes.get('[data-expedition-claim="0"]')[0].disabled,false);assert.equal(h.nodes.get('[data-expedition-recall="0"]')[0].hidden,true);assert.equal(h.nodes.get('[data-expedition-progress="0"]')[0].style.width,'100%');
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.expeditions.slots[0].observedAt,saved.expeditions.slots[0].endsAt);
});

test('real expedition selectors choose the requested hero and slot, while training cannot claim or overwrite them',async()=>{
  const s=E.createState();s.welcome=true;s.best=25;for(const hero of data.HEROES)s.owned[hero.id]={level:1,copies:0,awaken:0};const h=harness(s);await h.press('nav',{page:'expeditions'});await h.press('expedition-select',{id:'ash-trail'});h.voyageHero('ember');await h.press('expedition-slot',{slot:'2'});await h.press('expedition-dispatch');const stored=h.storage.get('thap-vo-tan-v1'),saved=E.validateState(JSON.parse(stored));assert.equal(saved.expeditions.slots[2].hero,'ember');assert.deepEqual(saved.expeditions.slots[2].rewards,{gold:1250,dust:15,marks:{ashknight:2}});
  await h.press('nav',{page:'training'});h.change('team','ember','0');await h.press('training-start');const count=h.writes.length,trainingStored=h.storage.get('thap-vo-tan-v1');assert.equal(JSON.parse(trainingStored).expeditions.slots[2].startedAt,saved.expeditions.slots[2].startedAt);assert.ok(JSON.parse(trainingStored).expeditions.slots[2].observedAt>=saved.expeditions.slots[2].observedAt);await h.press('expedition-claim-all');await h.press('expedition-dispatch');h.visibility();h.windowHandlers.pagehide();h.windowHandlers.pageshow();assert.equal(h.writes.length,count);assert.equal(h.storage.get('thap-vo-tan-v1'),trainingStored);
  await h.press('nav',{page:'expeditions'});assert.equal(h.inspect('practice'),null);assert.equal(h.inspect('state.expeditions.slots[2].hero'),'ember');assert.match(h.app.innerHTML,/Miền tro tàn/);h.document.hidden=true;h.visibility();h.document.hidden=false;h.visibility();assert.equal(h.inspect('state.expeditions.slots[2].hero'),'ember');assert.equal(h.window.gameBack(),true);assert.equal(h.inspect('page'),'home');
});

test('real native export and import retain expedition timestamps and reward snapshots without granting again',async()=>{
  const s=E.createState();s.welcome=true;E.dispatchExpedition(s,'mist-path','ember',0,Date.now()-900_100);const h=harness(s);let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const backup=JSON.parse(exported);assert.equal(backup.game,'thap-vo-tan');assert.equal(backup.state.expeditions.slots[0].observedAt,backup.state.expeditions.slots[0].endsAt);
  const target=E.createState();target.welcome=true;const imported=harness(target);imported.window.receiveNativeSave(exported);assert.match(imported.modal.innerHTML,/Dùng bản lưu này/);await imported.press('confirm-import');assert.equal(imported.inspect('state.expeditions.slots[0].id'),backup.state.expeditions.slots[0].id);await imported.press('nav',{page:'expeditions'});await imported.press('expedition-claim',{slot:'0'});const saved=E.validateState(JSON.parse(imported.storage.get('thap-vo-tan-v1')));assert.equal(saved.gold,backup.state.gold+60);assert.equal(saved.expeditions.completed,1);let exportedClaimed;imported.window.AndroidSave={exportSave:json=>exportedClaimed=json};await imported.press('export');assert.equal(JSON.parse(exportedClaimed).state.expeditions.completed,1);assert.deepEqual(JSON.parse(exportedClaimed).state.expeditions.slots,[null,null,null]);assert.equal(h.inspect('state.expeditions.completed'),0);
});

test('real campaign controls retain dialogue on reopen, complete three battles and claim the first reward once',async()=>{
  const s=E.createState();s.welcome=true;let h=harness(s);await h.press('nav',{page:'campaign'});assert.match(h.app.innerHTML,/15 ải/);await h.press('campaign-chapter',{chapter:'4'});assert.match(h.app.innerHTML,/Bình minh không lặp lại/);await h.press('campaign-chapter',{chapter:'0'});await h.press('campaign-stage-info',{stage:'1'});assert.match(h.modal.innerHTML,/Bắt đầu ải/);await h.press('campaign-start',{stage:'1'});assert.match(h.app.innerHTML,/Dấu chân này/);await h.press('campaign-story-next');
  let saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.run.campaign.line,1);h=harness(saved);assert.match(h.app.innerHTML,/Lần này sẽ có người đi cùng/);await h.press('campaign-story-skip');assert.equal(h.inspect('state.run.phase'),'route');h.inspect('state.run.heroes.forEach(h=>h.atk=100000)');
  for(let room=0;room<3;room++){await h.press('route',{index:'0'});for(let n=0;n<3&&h.inspect('state.run.phase')==='battle';n++)await h.press('attack');await h.press('victory-skip');if(room<2){assert.equal(h.inspect('state.run.phase'),'blessing');await h.press('blessing',{id:h.inspect('state.run.choices[0]')});}}
  assert.equal(h.inspect('state.run.campaign.story'),'outro');saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));h=harness(saved);assert.match(h.app.innerHTML,/Chiếc chuông vẫn ấm/);await h.press('campaign-story-next');assert.equal(h.inspect('state.run.campaign.line'),1);await h.press('campaign-story-next');assert.equal(h.inspect('state.run.phase'),'result');assert.match(h.app.innerHTML,/Nhận quà vào túi/);
  const tickets=h.inspect('state.tickets');await h.press('campaign-claim',{stage:'1'});assert.equal(h.inspect('state.tickets'),tickets+1);const count=h.writes.length;await h.press('campaign-claim',{stage:'1'});assert.equal(h.writes.length,count);assert.equal(h.inspect('state.best'),0);await h.press('campaign-start',{stage:'2'});assert.equal(h.inspect('state.run.campaign.stage'),2);assert.equal(h.inspect('state.run.phase'),'story');E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real preset controls save, rename, confirm overwrites and deletes, and restore all three heroes and pet',async()=>{
  const s=E.createState();s.welcome=true;let h=harness(s);await h.press('nav',{page:'heroes'});assert.match(h.app.innerHTML,/ĐỘI HÌNH LƯU NHANH/);await h.press('preset-save',{slot:'0'});h.presetName(0,'Đội bình minh');await h.press('assign',{id:'ember',slot:'0'});await h.press('equip-pet',{id:'mossling'});await h.press('close');await h.press('preset-save',{slot:'1'});await h.press('preset-save',{slot:'2'});await h.press('preset-save',{slot:'0'});assert.match(h.modal.innerHTML,/Ghi đè đội Đội bình minh/);await h.press('close');assert.equal(h.inspect('state.presets[0].team[0]'),'rook');await h.press('preset-save',{slot:'0'});await h.press('preset-confirm-save',{slot:'0'});assert.equal(h.inspect('state.presets[0].team[0]'),'ember');assert.equal(h.inspect('state.presets[0].name'),'Đội bình minh');
  await h.press('assign',{id:'rook',slot:'0'});await h.press('equip-pet',{id:'mossling'});await h.press('close');await h.press('preset-apply',{slot:'1'});assert.equal(h.inspect('state.team[0]'),'rook');await h.press('preset-confirm-apply',{slot:'1'});assert.equal(h.inspect('state.team[0]'),'ember');assert.equal(h.inspect('state.adventure.equipped'),null);let saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));h=harness(saved);assert.equal(h.inspect('state.presets[0].name'),'Đội bình minh');await h.press('preset-delete',{slot:'0'});await h.press('close');assert.notEqual(h.inspect('state.presets[0]'),null);await h.press('preset-delete',{slot:'0'});await h.press('preset-confirm-delete',{slot:'0'});assert.equal(h.inspect('state.presets[0]'),null);assert.notEqual(h.inspect('state.presets[1]'),null);
  await h.press('assign',{id:'rook',slot:'0'});await h.press('nav',{page:'expeditions'});await h.press('expedition-dispatch');const before=structuredClone(h.inspect('state.team')),count=h.writes.length;await h.press('preset-apply',{slot:'1'});assert.deepEqual(h.inspect('state.team'),before);assert.equal(h.writes.length,count);await h.press('nav',{page:'heroes'});assert.match(h.app.innerHTML,/Ember đang viễn chinh/);await h.press('start');const run=structuredClone(h.inspect('state.run'));await h.press('preset-apply',{slot:'2'});assert.deepEqual(h.inspect('state.run'),run);assert.deepEqual(h.inspect('state.team'),before);
});

test('real graphics controls persist selected quality, frame cap and toggles without altering an active battle',async()=>{
  const s=E.createState();s.welcome=true;E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');const run=structuredClone(s.run);let h=harness(s);await h.press('settings');await h.press('graphics-quality',{quality:'low'});assert.match(h.modal.innerHTML,/data-quality="low" aria-pressed="true"/);await h.press('graphics-fps',{fps:'60'});await h.press('graphics-toggle',{key:'shadows'});await h.press('graphics-toggle',{key:'effects'});assert.deepEqual(h.inspect('state.settings.graphics'),{quality:'low',fps:60,shadows:true,effects:true});assert.deepEqual(h.inspect('state.run'),run);const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));h=harness(saved);await h.press('settings');assert.match(h.modal.innerHTML,/data-fps="60" aria-pressed="true"/);assert.match(h.modal.innerHTML,/data-key="shadows" role="switch" aria-checked="true"/);await h.press('nav',{page:'training'});await h.press('training-start');const count=h.writes.length;for(const action of ['graphics-quality','preset-save','campaign-start','campaign-claim'])await h.press(action,{quality:'high',slot:'0',stage:'1'});h.presetName(0,'Sai');assert.equal(h.writes.length,count);await h.press('training-exit');assert.deepEqual(h.inspect('state'),saved);
});

test('real native backup roundtrip retains campaign progress, a dialogue line, three presets and graphics',async()=>{
  const s=E.createState();s.welcome=true;s.campaign={cleared:3,claimed:[1,3]};for(let slot=0;slot<3;slot++)E.saveTeamPreset(s,slot);E.setGraphics(s,'quality','high');E.setGraphics(s,'fps',60);E.startCampaign(s,4,42);E.advanceCampaignStory(s);const h=harness(s);let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const target=E.createState();target.welcome=true;const imported=harness(target);imported.window.receiveNativeSave(exported);await imported.press('confirm-import');const restored=E.validateState(JSON.parse(imported.storage.get('thap-vo-tan-v1')));assert.deepEqual(restored,s);assert.match(imported.app.innerHTML,/Chúng tôi sẽ nhớ tên cô/);await imported.press('campaign-claim',{stage:'3'});assert.equal(imported.inspect('state.tickets'),s.tickets);assert.equal(imported.inspect('state.run.campaign.line'),1);
});

test('real boss part controls persist targeting, break armor through attacks and resume the interrupted boss once',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);for(const hero of s.run.heroes)hero.atk=50;s.run.battle.bossState.move='quake';let h=harness(s);assert.match(h.app.innerHTML,/PHÁ GIÁP/);assert.match(h.app.innerHTML,/Sắp đánh cả đội/);await h.press('boss-part',{part:'head'});assert.equal(h.inspect('selectedEnemy'),'enemy0');await h.press('attack');await h.press('attack');assert.equal(h.inspect('state.run.battle.bossState.parts.head.hp'),0);assert.equal(h.inspect('state.run.battle.bossState.parts.stun'),true);assert.match(h.app.innerHTML,/Chiêu bị ngắt/);assert.match(h.app.innerHTML,/Boss bỏ lượt/);
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));h=harness(saved);assert.match(h.app.innerHTML,/1\/3 đã phá/);const hp=structuredClone(h.inspect('state.run.heroes.map(h=>h.hp)'));await h.press('confirm-end');assert.deepEqual(h.inspect('state.run.heroes.map(h=>h.hp)'),hp);assert.equal(h.inspect('state.run.battle.bossState.parts.stun'),false);await h.press('boss-part',{part:'core'});assert.equal(h.inspect('state.run.battle.bossState.parts.selected'),'core');await h.press('settings');assert.match(h.modal.innerHTML,/Rung khi va chạm mạnh/);await h.press('haptics');await h.press('close');await h.press('graphics-quality',{quality:'low'});assert.equal(h.inspect('state.run.battle.bossState.parts.head.hp'),0);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real part controls handle minion targets, legacy saves, native backup and isolated training',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'archivist',1,42);E.enemyTurn(s);const h=harness(s);await h.press('boss-part',{part:'arms'});await h.press('target',{id:'enemy1'});const before=structuredClone(h.inspect('state.run.battle.bossState.parts'));await h.press('attack');assert.deepEqual(h.inspect('state.run.battle.bossState.parts'),before);await h.press('boss-part',{part:'core'});assert.equal(h.inspect('selectedEnemy'),'enemy0');let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const target=E.createState();target.welcome=true;const restored=harness(target);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state.run'),h.inspect('state.run'));
  const stored=restored.storage.get('thap-vo-tan-v1');await restored.press('nav',{page:'training'});await restored.press('training-start');const writes=restored.writes.length;await restored.press('boss-part',{part:'arms'});assert.equal(restored.inspect('state.run.battle.bossState.parts.selected'),'arms');await restored.press('attack');assert.equal(restored.writes.length,writes);await restored.press('training-exit');assert.deepEqual(restored.inspect('state.run'),JSON.parse(stored).run);
  const old=structuredClone(s);old.version=8;delete old.run.battle.bossState.parts;const legacy=harness(old);assert.doesNotMatch(legacy.app.innerHTML,/data-action="boss-part"/);await legacy.press('boss-part',{part:'head'});assert.equal(legacy.inspect('state.run.battle.bossState.parts'),null);
});

test('real autoplay selects the core first then interrupts a queued boss move through the head without replaying a turn',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);for(const hero of s.run.heroes){hero.atk=10;hero.energy=0;}const h=harness(s);await h.press('auto');await h.tickAuto();assert.equal(h.inspect('state.run.battle.used.length'),0);await h.tickAuto();assert.equal(h.inspect('state.run.battle.bossState.parts.selected'),'core');assert.ok(h.inspect('state.run.battle.bossState.parts.core.hp<state.run.battle.bossState.parts.core.maxHp'));assert.deepEqual(h.inspect('state.run.battle.used'),['rook']);h.inspect("state.run.battle.bossState.move='charge'");await h.tickAuto();assert.equal(h.inspect('state.run.battle.bossState.parts.selected'),'head');assert.ok(h.inspect('state.run.battle.bossState.parts.head.hp<state.run.battle.bossState.parts.head.maxHp'));assert.deepEqual(h.inspect('state.run.battle.used'),['rook','aerin']);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real talent controls award a level point, learn, persist, cancel and refund with a single gold charge',async()=>{
  const s=E.createState();s.welcome=true;s.gold=100000;let h=harness(s);await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/Lên cấp 2 nhận điểm đầu tiên/);await h.press('upgrade',{id:'rook'});assert.equal(h.inspect('state.owned.rook.level'),2);assert.match(h.modal.innerHTML,/1 điểm chưa dùng/);await h.press('talent-info',{id:'rook'});assert.equal((h.modal.innerHTML.match(/data-action="talent-learn"/g)||[]).length,9);const gold=h.inspect('state.gold');await h.press('talent-learn',{id:'rook',node:'force'});assert.equal(h.inspect('state.talents.rook.force'),1);assert.equal(h.inspect('state.gold'),gold);
  const saved=h.storage.get('thap-vo-tan-v1'),snapshot=h.inspect('JSON.stringify(state)');await h.press('talent-learn',{id:'rook',node:'force'});assert.equal(h.inspect('JSON.stringify(state)'),snapshot);E.validateState(JSON.parse(saved));h=harness(JSON.parse(saved));await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/1 điểm đã dùng/);await h.press('talent-reset',{id:'rook'});assert.match(h.modal.innerHTML,/160 vàng/);assert.equal(h.inspect('state.gold'),gold);await h.press('talent-info',{id:'rook'});assert.equal(h.inspect('state.talents.rook.force'),1);await h.press('talent-reset',{id:'rook'});await h.press('talent-confirm-reset',{id:'rook'});assert.equal(h.inspect('state.gold'),gold-160);assert.equal(h.inspect('state.talents.rook'),undefined);assert.match(h.modal.innerHTML,/Còn <b>1<\/b> điểm/);await h.press('talent-confirm-reset',{id:'rook'});assert.equal(h.inspect('state.gold'),gold-160);assert.equal(E.talentStatus(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),'rook').available,1);
});

test('real talent changes preserve the active boss, survive native export/import and cannot leak out of training',async()=>{
  const s=E.createState();s.welcome=true;s.gold=100000;s.owned.rook.level=30;for(const [node,ranks] of Object.entries({force:3,pierce:3,tempo:3,nurture:3}))for(let i=0;i<ranks;i++)E.learnTalent(s,'rook',node);E.startHunt(s,'colossus',1,42);E.playerAction(s,'rook','enemy0',false,'arms');const run=structuredClone(s.run),h=harness(s);await h.press('talent-info',{id:'rook'});assert.match(h.modal.innerHTML,/Chuyến đang chơi giữ thiên phú/);await h.press('talent-learn',{id:'rook',node:'force'});await h.press('talent-reset',{id:'rook'});await h.press('talent-confirm-reset',{id:'rook'});await h.press('talent-learn',{id:'rook',node:'vitality'});assert.deepEqual(h.inspect('state.run'),run);let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const target=E.createState();target.welcome=true;const restored=harness(target);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.equal(restored.inspect('state.talents.rook.vitality'),1);assert.deepEqual(restored.inspect('state.run'),run);
  const stored=restored.storage.get('thap-vo-tan-v1');await restored.press('nav',{page:'training'});await restored.press('training-start');const writes=restored.writes.length;assert.equal(restored.inspect('Object.keys(state.talents).length'),0);await restored.press('talent-learn',{id:'rook',node:'force'});await restored.press('talent-confirm-reset',{id:'rook'});assert.equal(restored.inspect('Object.keys(state.talents).length'),0);assert.equal(restored.writes.length,writes);await restored.press('training-exit');assert.deepEqual(restored.inspect('state.run'),run);assert.deepEqual(JSON.parse(restored.storage.get('thap-vo-tan-v1')).talents,JSON.parse(stored).talents);
});


test('real gear preset save, rename, preview and apply persist once across reload and native export',async()=>{
  const s=E.createState();s.welcome=true;for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,'rook');const h=harness(s);await h.press('go-equipment',{id:'rook'});assert.match(h.app.innerHTML,/Bộ trang bị của Rook/);await h.press('gear-preset-save',{hero:'rook',slot:'0'});assert.equal(h.writes.length,0);assert.match(h.modal.innerHTML,/LƯU BỘ MỚI/);await h.press('gear-preset-confirm',{hero:'rook',slot:'0',kind:'save'});assert.equal(h.writes.length,1);assert.equal(h.inspect('state.gearPresets.rook[0].name'),'Leo tháp');await h.press('gear-preset-confirm',{hero:'rook',slot:'0',kind:'save'});assert.equal(h.writes.length,1);
  h.gearPresetName('rook',0,'  Phá boss  ');assert.equal(h.inspect('state.gearPresets.rook[0].name'),'Phá boss');for(const id of ['gear-1','gear-2','gear-3'])await h.press('unequip-gear',{id});await h.press('gear-preset-preview',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/SAU KHI MẶC/);assert.match(h.modal.innerHTML,/Phá boss/);const writes=h.writes.length;await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.equal(h.writes.length,writes+1);assert.deepEqual(h.inspect('state.equipped.rook'),{weapon:'gear-1',armor:'gear-2',charm:'gear-3'});await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.equal(h.writes.length,writes+1);
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(harness(saved).inspect('state'),saved);let exported;h.window.AndroidSave={exportSave:v=>exported=v};await h.press('export');const fresh=E.createState();fresh.welcome=true;const target=harness(fresh);target.window.receiveNativeSave(exported);await target.press('confirm-import');assert.deepEqual(target.inspect('state'),saved);
});

test('real gear presets keep separate heroes and three slots with reviewed overwrite and deletion',async()=>{
  const s=E.createState();s.welcome=true;E.equipGear(s,'gear-1','rook');const h=harness(s);
  for(const [hero,slot] of [['rook','0'],['rook','1'],['rook','2'],['lumi','0']]){await h.press('gear-preset-save',{hero,slot});await h.press('gear-preset-confirm',{hero,slot,kind:'save'});}
  assert.equal(h.inspect('state.gearPresets.rook[1].name'),'Săn boss');assert.equal(h.inspect('state.gearPresets.rook[2].name'),'Đột kích');assert.equal(h.inspect('state.gearPresets.lumi[0].gear.weapon'),null);h.gearPresetName('rook',0,'Đồ tank');await h.press('gear-hero',{id:'rook'});await h.press('unequip-gear',{id:'gear-1'});await h.press('gear-preset-save',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/sẽ được thay thế/);await h.press('close');assert.equal(h.inspect('state.gearPresets.rook[0].gear.weapon.id'),'gear-1');await h.press('gear-preset-save',{hero:'rook',slot:'0'});await h.press('gear-preset-confirm',{hero:'rook',slot:'0',kind:'save'});assert.equal(h.inspect('state.gearPresets.rook[0].gear.weapon'),null);assert.equal(h.inspect('state.gearPresets.rook[0].name'),'Đồ tank');
  const before=structuredClone(h.inspect('state'));await h.press('gear-preset-delete',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/XÓA BỘ ĐÃ LƯU/);await h.press('close');assert.deepEqual(h.inspect('state'),before);await h.press('gear-preset-delete',{hero:'rook',slot:'0'});await h.press('gear-preset-confirm',{hero:'rook',slot:'0',kind:'delete'});assert.equal(h.inspect('state.gearPresets.rook[0]'),null);assert.deepEqual(h.inspect('state.inventory'),before.inventory);assert.deepEqual(h.inspect('state.equipped'),before.equipped);assert.deepEqual(h.inspect('state.gearPresets.lumi'),before.gearPresets.lumi);
});

test('real gear preset partial apply tells the player which missing, borrowed and locked slots stay',async()=>{
  const s=E.createState();s.welcome=true;s.gold=10000;s.dust=100;s.armory.marks.colossus=100;for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,'rook');E.saveGearPreset(s,'rook',0);for(const id of ['gear-1','gear-2','gear-3'])E.unequipGear(s,id);E.equipGear(s,'gear-1','aerin');E.dismantleGear(s,'gear-2');const h=harness(s);await h.press('gear-preset-preview',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/Aerin đang mặc/);assert.match(h.modal.innerHTML,/không còn trong kho/);assert.match(h.modal.innerHTML,/Đổi 1 ô khả dụng/);await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.deepEqual(h.inspect('state.equipped.rook'),{charm:'gear-3'});assert.equal(h.inspect('state.equipped.aerin.weapon'),'gear-1');
  const g=E.forgeGear(h.inspect('state'),'set-bastion-charm');E.equipGear(h.inspect('state'),g.id,'rook');E.toggleGearLock(h.inspect('state'),g.id);await h.press('gear-preset-preview',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/Trang bị hiện tại đã khóa/);assert.match(h.modal.innerHTML,/Chưa có ô có thể đổi/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
});

test('gear preset pending apply, overwrite and delete expire on dialog exits, import and navigation',async()=>{
  const s=E.createState();s.welcome=true;E.equipGear(s,'gear-1','rook');E.saveGearPreset(s,'rook',0);E.unequipGear(s,'gear-1');
  for(const kind of ['apply','save','delete'])for(const exit of ['close','back','escape','settings','nav','import']){
    const h=harness(s);await h.press(kind==='apply'?'gear-preset-preview':kind==='save'?'gear-preset-save':'gear-preset-delete',{hero:'rook',slot:'0'});assert.equal(h.inspect('modalOpen'),true);
    if(exit==='back')h.window.gameBack();else if(exit==='escape')h.keydown('Escape');else if(exit==='import'){h.window.receiveNativeSave(JSON.stringify(s));await h.press('confirm-import');}else await h.press(exit,exit==='nav'?{page:'heroes'}:{});
    const writes=h.writes.length;await h.press(kind==='apply'?'gear-preset-apply':'gear-preset-confirm',{hero:'rook',slot:'0',kind});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,writes);assert.equal(h.inspect('pendingGearPreset'),null);
  }
});

test('real gear preset handlers reject forged, mismatched and stale confirmations without a save',async()=>{
  const s=E.createState();s.welcome=true;E.equipGear(s,'gear-1','rook');E.saveGearPreset(s,'rook',0);E.unequipGear(s,'gear-1');const h=harness(s);
  await h.press('gear-preset-apply',{hero:'rook',slot:'0'});await h.press('gear-preset-confirm',{hero:'rook',slot:'0',kind:'save'});assert.equal(h.writes.length,0);await h.press('gear-preset-preview',{hero:'rook',slot:'0'});await h.press('gear-preset-apply',{hero:'lumi',slot:'0'});await h.press('gear-preset-apply',{hero:'rook',slot:'1'});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
  E.equipGear(h.inspect('state'),'gear-1','aerin');const before=structuredClone(h.inspect('state'));await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
});

test('real gear preset names escape HTML, reject invalid names and restore their last saved values',async()=>{
  const s=E.createState();s.welcome=true;E.saveGearPreset(s,'rook',0);const h=harness(s);await h.press('go-equipment',{id:'rook'});h.gearPresetName('rook',0,'<img src=x onerror=x>');assert.match(h.app.innerHTML,/&lt;img/);assert.doesNotMatch(h.app.innerHTML,/<img src=x/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;for(const name of ['', 'x'.repeat(25),'a\nb'])h.gearPresetName('rook',0,name);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
});

test('real gear preset save preserves active combat, applying is blocked and practice cannot write presets',async()=>{
  const s=guardBattle();E.saveGearPreset(s,'rook',0);const h=harness(s);await h.press('gear-preset-save',{hero:'rook',slot:'1'});await h.press('gear-preset-confirm',{hero:'rook',slot:'1',kind:'save'});assert.deepEqual(h.inspect('state.run'),s.run);await h.press('gear-preset-preview',{hero:'rook',slot:'0'});assert.match(h.modal.innerHTML,/Hãy kết thúc chuyến đi/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('gear-preset-apply',{hero:'rook',slot:'0'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);await h.press('training-start');const practice=structuredClone(h.inspect('state')),practiceWrites=h.writes.length;
  for(const action of ['gear-preset-preview','gear-preset-save','gear-preset-delete','gear-preset-confirm','gear-preset-apply'])await h.press(action,{hero:'rook',slot:'0',kind:'save'});h.gearPresetName('rook',0,'Không lưu');assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,practiceWrites);await h.press('training-exit');assert.deepEqual(h.inspect('state'),before);
});

function teamLoadoutAccount(){
  const s=E.createState();s.welcome=true;s.gold=1000000;s.dust=100000;for(const key of Object.keys(s.armory.marks))s.armory.marks[key]=1000;
  for(const hero of s.team)for(const slot of ['weapon','armor','charm']){const gear=E.forgeGear(s,slot==='weapon'?'signature-'+hero:'set-bastion-'+slot);E.equipGear(s,gear.id,hero);}
  return s;
}
function stripTeamGear(s){for(const slots of Object.values(s.equipped))for(const id of Object.values(slots))E.unequipGear(s,id);}

test('real team controls capture all nine items, preview without writing and commit one native-safe combined change',async()=>{
  const h=harness(teamLoadoutAccount());await h.press('nav',{page:'heroes'});await h.press('preset-save',{slot:'0'});assert.equal(h.writes.length,1);assert.match(h.app.innerHTML,/9\/9 món đã lưu/);
  h.presetName(0,'Đội bình minh');const live=h.inspect('state');stripTeamGear(live);E.setTeamSlot(live,'ember',0);E.setFormation(live,2);live.adventure.equipped=null;
  const before=structuredClone(live),expected=structuredClone(live),writes=h.writes.length;E.applyTeamPreset(expected,0);await h.press('preset-apply',{slot:'0'});
  assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);for(const label of ['ĐỘI SAU KHI ĐỔI','Tổng chỉ số ngoài trận','Cộng hưởng','Tỉ lệ chí mạng'])assert.ok(h.modal.innerHTML.includes(label));
  await h.press('preset-confirm-apply',{slot:'0'});assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,writes+1);assert.equal(h.inspect('pendingTeamPreset'),null);await h.press('preset-confirm-apply',{slot:'0'});assert.equal(h.writes.length,writes+1);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const imported=harness(E.createState());imported.window.receiveNativeSave(exported);await imported.press('confirm-import');assert.deepEqual(imported.inspect('state'),expected);assert.deepEqual(E.validateState(JSON.parse(imported.storage.get('thap-vo-tan-v1'))),expected);
});

test('real combined preview explains partial application and preserves all three kinds of unavailable gear',async()=>{
  const s=teamLoadoutAccount();E.equipGear(s,'gear-1','rook');E.saveTeamPreset(s,0);const saved=s.presets[0].gear.rook;stripTeamGear(s);E.equipGear(s,saved.weapon.id,'ember');E.dismantleGear(s,saved.armor.id);const charm=E.forgeGear(s,'set-bastion-charm');E.equipGear(s,charm.id,'rook');E.toggleGearLock(s,charm.id);E.setTeamSlot(s,'ember',0);
  const expected=structuredClone(s);E.applyTeamPreset(expected,0);const h=harness(s);await h.press('preset-apply',{slot:'0'});for(const label of ['Ember đang mặc','không còn trong kho','Trang bị hiện tại đã khóa','Đổi đội & 6 ô khả dụng'])assert.ok(h.modal.innerHTML.includes(label),label);
  await h.press('preset-confirm-apply',{slot:'0'});assert.deepEqual(h.inspect('state'),expected);assert.equal(h.inspect('state.equipped.ember.weapon'),saved.weapon.id);assert.equal(h.inspect('state.equipped.rook.charm'),charm.id);assert.equal(h.writes.length,1);
});

test('real team confirmations expire after all six exit paths for apply, overwrite and delete',async()=>{
  const s=teamLoadoutAccount();E.saveTeamPreset(s,0);stripTeamGear(s);
  for(const kind of ['apply','save','delete'])for(const exit of ['close','back','escape','nav','settings','import']){
    const h=harness(s);await h.press('preset-'+kind,{slot:'0'});assert.equal(h.inspect('pendingTeamPreset.kind'),kind);
    if(exit==='back')h.window.gameBack();else if(exit==='escape')h.keydown('Escape');else if(exit==='import')h.window.receiveNativeSave(JSON.stringify({game:'thap-vo-tan',state:s}));else await h.press(exit,exit==='nav'?{page:'home'}:{});
    const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('preset-confirm-'+kind,{slot:'0'});assert.deepEqual(h.inspect('state'),before,kind+' '+exit);assert.equal(h.writes.length,writes);assert.equal(h.inspect('pendingTeamPreset'),null);
  }
});

test('real team handlers reject forged, mismatched and stale confirmations before a save write',async()=>{
  const s=teamLoadoutAccount();E.saveTeamPreset(s,0);E.saveTeamPreset(s,1);stripTeamGear(s);
  for(const kind of ['apply','save','delete']){
    const h=harness(s);await h.press('preset-confirm-'+kind,{slot:'0'});assert.equal(h.writes.length,0);await h.press('preset-'+kind,{slot:'0'});await h.press('preset-confirm-'+kind,{slot:'1'});await h.press('preset-confirm-'+(kind==='delete'?'save':'delete'),{slot:'0'});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
    E.upgradeGear(h.inspect('state'),'gear-1');const before=structuredClone(h.inspect('state'));await h.press('preset-confirm-'+kind,{slot:'0'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,0);
  }
  const h=harness(s);await h.press('preset-apply',{slot:'0'});h.presetName(0,'Mới');const writes=h.writes.length,before=structuredClone(h.inspect('state'));assert.equal(h.inspect('pendingTeamPreset'),null);await h.press('preset-confirm-apply',{slot:'0'});assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),before);
});

test('real team overwrite and delete apply once, keep names escaped and leave hero equipment presets independent',async()=>{
  const s=teamLoadoutAccount();E.saveGearPreset(s,'rook',0);E.saveTeamPreset(s,0);E.saveTeamPreset(s,1);const h=harness(s);h.presetName(0,'<img src=x onerror=x>');stripTeamGear(h.inspect('state'));
  await h.press('preset-save',{slot:'0'});assert.match(h.modal.innerHTML,/&lt;img/);assert.doesNotMatch(h.modal.innerHTML,/<img src=x/);assert.match(h.modal.innerHTML,/Đang lưu 0\/9 món/);const writes=h.writes.length;
  await h.press('preset-confirm-save',{slot:'0'});assert.equal(h.writes.length,writes+1);assert.equal(h.inspect('state.presets[0].gear.rook.weapon'),null);assert.equal(h.inspect('state.presets[0].name'),'<img src=x onerror=x>');await h.press('preset-confirm-save',{slot:'0'});assert.equal(h.writes.length,writes+1);
  const before=structuredClone(h.inspect('state'));await h.press('preset-delete',{slot:'0'});await h.press('preset-confirm-delete',{slot:'0'});await h.press('preset-confirm-delete',{slot:'0'});assert.equal(h.writes.length,writes+2);assert.equal(h.inspect('state.presets[0]'),null);for(const key of ['inventory','equipped','gearPresets'])assert.deepEqual(h.inspect('state.'+key),before[key]);assert.deepEqual(h.inspect('state.presets[1]'),s.presets[1]);
});

test('real migrated teams retain current gear and acquire equipment snapshots only on reviewed overwrite',async()=>{
  const s=teamLoadoutAccount();E.saveTeamPreset(s,0);s.version=29;delete s.presets[0].gear;const h=harness(s);await h.press('nav',{page:'heroes'});assert.equal(h.inspect('state.presets[0].gear'),null);E.setTeamSlot(h.inspect('state'),'ember',0);
  const before=structuredClone(h.inspect('state.equipped'));await h.press('preset-apply',{slot:'0'});assert.match(h.modal.innerHTML,/Đội từ bản cũ chưa lưu bộ đồ/);await h.press('preset-confirm-apply',{slot:'0'});assert.deepEqual(h.inspect('state.equipped'),before);
  await h.press('preset-save',{slot:'0'});await h.press('preset-confirm-save',{slot:'0'});assert.notEqual(h.inspect('state.presets[0].gear'),null);assert.match(h.app.innerHTML,/9\/9 món đã lưu/);
});

test('real team no-ops do not save and active journeys or practice cannot apply or overwrite the account',async()=>{
  const s=teamLoadoutAccount();E.saveTeamPreset(s,0);const h=harness(s);await h.press('preset-apply',{slot:'0'});assert.match(h.modal.innerHTML,/Đội và trang bị đã khớp/);await h.press('preset-confirm-apply',{slot:'0'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),s);
  E.startRun(h.inspect('state'),42);const live=structuredClone(h.inspect('state'));await h.press('preset-apply',{slot:'0'});assert.match(h.modal.innerHTML,/chuyến đang chơi/);await h.press('preset-confirm-apply',{slot:'0'});assert.deepEqual(h.inspect('state'),live);assert.equal(h.writes.length,0);
  await h.press('training-start');const practice=structuredClone(h.inspect('state')),writes=h.writes.length;for(const action of ['preset-apply','preset-confirm-apply','preset-save','preset-confirm-save','preset-delete','preset-confirm-delete'])await h.press(action,{slot:'0'});h.presetName(0,'Không lưu');assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),live);
});

test('real smart build opens each direction without saving, then applies the reviewed set once and reloads it',async()=>{
  const s=E.createState();s.welcome=true;s.gold=10000;s.dust=100;for(const id of Object.keys(s.armory.marks))s.armory.marks[id]=100;for(const slot of ['weapon','armor','charm'])E.forgeGear(s,'set-ember-'+slot);
  const h=harness(s);await h.press('go-equipment',{id:'rook'});assert.match(h.app.innerHTML,/TRANG BỊ NHANH THÔNG MINH/);await h.press('smart-build',{hero:'rook',direction:'damage'});assert.equal(h.inspect('modalOpen'),true);assert.match(h.modal.innerHTML,/SAU KHI MẶC/);assert.match(h.modal.innerHTML,/3\/3 món/);assert.match(h.modal.innerHTML,/3 món: Đòn đánh/);
  await h.press('smart-direction',{direction:'tank'});assert.match(h.modal.innerHTML,/Rook · Chống chịu/);await h.press('smart-direction',{direction:'support'});assert.match(h.modal.innerHTML,/Rook · Hỗ trợ/);await h.press('smart-direction',{direction:'damage'});assert.equal(h.writes.length,0);assert.deepEqual(h.inspect('state'),s);
  const expected=structuredClone(s);E.applyGearRecommendation(expected,'rook','damage');await h.press('smart-equip',{hero:'rook',direction:'damage'});assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,1);assert.equal(h.inspect('modalOpen'),false);await h.press('smart-equip',{hero:'rook',direction:'damage'});assert.equal(h.writes.length,1);
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(saved,expected);assert.deepEqual(harness(saved).inspect('state'),expected);
});

test('smart gear confirmation expires on close, Back, Escape, another dialog, navigation and native import',async()=>{
  const s=E.createState();s.welcome=true;
  for(const exit of ['close','back','escape','settings','nav','import']){
    const h=harness(s);await h.press('smart-build',{hero:'rook',direction:'damage'});
    if(exit==='back')h.window.gameBack();else if(exit==='escape')h.keydown('Escape');else if(exit==='import'){h.window.receiveNativeSave(JSON.stringify(s));await h.press('confirm-import');}else await h.press(exit,exit==='nav'?{page:'heroes'}:{});
    const writes=h.writes.length;await h.press('smart-equip',{hero:'rook',direction:'damage'});assert.equal(h.writes.length,writes);assert.deepEqual(h.inspect('state'),s);assert.equal(h.inspect('pendingSmartGear'),null);
  }
});

test('real gear lock controls preserve favorites through native backup and allow unlocking a locked transfer',async()=>{
  const s=E.createState();s.welcome=true;E.equipGear(s,'gear-1','rook');const h=harness(s);await h.press('gear',{id:'gear-1'});await h.press('toggle-gear-lock',{id:'gear-1'});assert.deepEqual(h.inspect('state.lockedGear'),['gear-1']);assert.match(h.modal.innerHTML,/Mở khóa để tháo/);
  await h.press('unequip-gear',{id:'gear-1'});await h.press('dismantle-gear',{id:'gear-1'});assert.equal(h.writes.length,1);assert.equal(h.inspect('state.equipped.rook.weapon'),'gear-1');await h.press('gear-hero',{id:'aerin'});await h.press('gear',{id:'gear-1'});assert.match(h.modal.innerHTML,/Mở khóa trang bị trước khi thay/);await h.press('equip-gear',{id:'gear-1'});assert.equal(h.writes.length,1);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const fresh=E.createState();fresh.welcome=true;const restored=harness(fresh);restored.window.receiveNativeSave(exported);await restored.press('confirm-import');assert.deepEqual(restored.inspect('state.lockedGear'),['gear-1']);assert.equal(restored.inspect('state.equipped.rook.weapon'),'gear-1');
  await h.press('toggle-gear-lock',{id:'gear-1'});await h.press('equip-gear',{id:'gear-1'});assert.equal(E.gearOwner(h.inspect('state'),'gear-1'),'aerin');assert.deepEqual(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),structuredClone(h.inspect('state')));
});

test('smart build explains an active journey and rejects equipment and lock writes from practice',async()=>{
  const s=guardBattle(),h=harness(s);await h.press('smart-build',{hero:'rook',direction:'damage'});assert.match(h.modal.innerHTML,/Hãy kết thúc chuyến đi/);assert.match(h.modal.innerHTML,/data-action="smart-equip"[^>]*disabled/);await h.press('smart-equip',{hero:'rook',direction:'damage'});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
  await h.press('close');await h.press('training-start');const practice=structuredClone(h.inspect('state')),writes=h.writes.length;for(const [action,attributes] of [['smart-build',{hero:'rook',direction:'tank'}],['smart-equip',{hero:'rook',direction:'tank'}],['toggle-gear-lock',{id:'gear-1'}]])await h.press(action,attributes);assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
});

test('real smart preview handles a partial bag and another hero signature without changing its owner',async()=>{
  const s=E.createState();s.welcome=true;s.gold=10000;s.dust=100;s.armory.marks.archivist=100;const g=E.forgeGear(s,'signature-lumi');g.level=10;E.equipGear(s,'gear-2','aerin');E.dismantleGear(s,'gear-3');const h=harness(s);await h.press('smart-build',{hero:'rook',direction:'support'});assert.match(h.modal.innerHTML,/Chưa có món trống phù hợp/);assert.equal(h.inspect('modalOpen'),true);await h.press('smart-equip',{hero:'rook',direction:'support'});assert.deepEqual(h.inspect('state.equipped.rook'),{weapon:'gear-1'});assert.equal(h.inspect('state.equipped.aerin.armor'),'gear-2');assert.equal(E.gearOwner(h.inspect('state'),g.id),null);
});

test('real evolution button commits the preview once, saves and keeps an active loadout unchanged',async()=>{
  const s=E.createState();s.welcome=true;s.gold=10000;s.dust=100;s.armory.essence=100;s.armory.marks.colossus=20;const g=E.forgeGear(s,'signature-rook');g.level=4;E.equipGear(s,g.id,'rook');E.startHunt(s,'colossus',1,42);const snapshot=structuredClone(s.run.heroes[0]),expected=structuredClone(s);E.evolveGear(expected,g.id);
  const h=harness(s);await h.press('gear',{id:g.id});assert.match(h.modal.innerHTML,/Tiến hóa lên UR/);const writes=h.writes.length;await h.press('evolve-gear',{id:g.id,rarity:'SSR'});assert.deepEqual(h.inspect('state'),expected);assert.deepEqual(h.inspect('state.run.heroes[0]'),snapshot);assert.equal(h.writes.length,writes+1);assert.match(h.modal.innerHTML,/data-weapon-rarity="UR"/);
  await h.press('evolve-gear',{id:g.id,rarity:'SSR'});assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,writes+1);const resumed=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(resumed,expected);assert.deepEqual(harness(resumed).inspect('state'),expected);
});

test('evolution resource failures are caught by the real handler without a save or partial expense',async()=>{
  const s=E.createState();s.welcome=true;s.inventory[0].level=4;const h=harness(s),before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('evolve-gear',{id:'gear-1',rarity:'R'});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
});

test('real hunt chest pays new essence before presentation and never again on skip or reload',async()=>{
  const s=E.createState();s.welcome=true;E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;let h=harness(s);await h.press('attack');assert.equal(h.inspect('state.armory.essence'),1);assert.equal(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))).armory.essence,1);await h.press('victory-next');assert.match(h.app.innerHTML,/Tinh hoa boss/);h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('victory-skip');assert.equal(h.inspect('state.armory.essence'),1);assert.match(h.app.innerHTML,/Tinh hoa boss/);
});


test('real boss selector previews the locked dragon and launches the explicit selected boss and difficulty',async()=>{
  const locked=dragonAccount({unlocked:false}),h=harness(locked);await h.press('nav',{page:'raids'});await h.press('raid-boss',{boss:DRAGON});assert.match(h.app.innerHTML,/Hắc Long Hư Không/);assert.match(h.app.innerHTML,/Thắng Tam Ấn · Tinh anh/);const before=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('raid-start',{tier:'1',boss:DRAGON});assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);
  const open=harness(dragonAccount());await open.press('raid-boss',{boss:DRAGON});await open.press('raid-tier',{tier:'1',boss:DRAGON});assert.equal(open.inspect('raidBoss'),DRAGON);await open.press('raid-start',{tier:'1',boss:DRAGON});assert.equal(open.inspect('state.run.raid.boss'),DRAGON);assert.match(open.app.innerHTML,/Bẻ cánh hắc long/);E.validateState(JSON.parse(open.storage.get('thap-vo-tan-v1')));
});

test('real dragon combat, two relays and final chest persist separate rewards across an app reload',async()=>{
  let h=harness(dragonAccount());await h.press('raid-start',{tier:'1',boss:DRAGON});const tam=structuredClone(h.inspect('state.raids.records'));
  for(let stage=0;stage<3;stage++){await clearRaidWithButtons(h);if(stage<2){await h.press('victory-next');h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.equal(h.inspect('state.run.raid.boss'),DRAGON);await h.press('raid-continue',{stage:String(stage)});}}
  assert.equal(h.inspect('state.raids.dragon.scales'),1);assert.deepEqual(h.inspect('state.raids.records'),tam);assert.equal(h.inspect('state.run.summary.raidReward.boss'),DRAGON);await h.press('victory-next');assert.match(h.app.innerHTML,/Vảy Hư Không/);assert.match(h.app.innerHTML,/UR · TRANG BỊ/);const wallet=structuredClone(h.inspect('[state.gold,state.armory.essence,state.raids.dragon.scales,state.inventory.length]'));
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('victory-next');assert.match(h.app.innerHTML,/Bình minh vượt qua hư không/);await h.press('raid-return',{boss:DRAGON});assert.equal(h.inspect('raidBoss'),DRAGON);assert.match(h.app.innerHTML,/1 lần hoàn thành/);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.armory.essence,state.raids.dragon.scales,state.inventory.length]')),wallet);
});

test('real mission controls carry their explicit boss even after switching the preview to the other raid',async()=>{
  const s=dragonAccount({scales:1});s.raids.dragon.records[0]={clears:1,bestRounds:12,fullParty:true,claimed:[]};const h=harness(s);await h.press('raid-missions',{tier:'1',boss:DRAGON});assert.equal(h.inspect('raidBoss'),DRAGON);assert.match(h.app.innerHTML,/Hắc Long sơ chiến/);await h.press('raid-boss',{boss:'tam-an'});const tam=structuredClone(h.inspect('state.raids.records'));await h.press('raid-claim',{tier:'1',boss:DRAGON,id:'first'});assert.deepEqual(h.inspect('state.raids.records'),tam);assert.deepEqual(Array.from(h.inspect('state.raids.dragon.records[0].claimed')),['first']);await h.press('raid-claim-all',{tier:'1',boss:DRAGON});assert.equal(h.inspect('state.raids.dragon.records[0].claimed.length'),3);assert.deepEqual(h.inspect('state.raids.records'),tam);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real void forge shortcut, tracking, creation and source navigation use the scales wallet',async()=>{
  const h=harness(dragonAccount({scales:8}));await h.press('raid-forge');assert.equal(h.inspect('page'),'armory');assert.equal(h.inspect('craftSet'),'void');assert.match(h.app.innerHTML,/Vảy Hư Không: 8\/4/);await h.press('forge-target',{id:'set-void-weapon'});assert.match(h.app.innerHTML,/data-action="raid-return" data-boss="void-dragon"/);await h.press('forge-info',{id:'set-void-weapon'});assert.match(h.modal.innerHTML,/Vảy Hư Không/);await h.press('forge-create',{id:'set-void-weapon'});const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(saved.raids.dragon.scales,4);assert.equal(saved.inventory.filter(g=>g.base==='set-void-weapon').length,1);assert.equal(saved.armory.target,null);await h.press('raid-return',{boss:DRAGON});assert.equal(h.inspect('raidBoss'),DRAGON);assert.equal(h.inspect('page'),'raids');
});


for(const linked of [false,true])test(`real elite Auto ${linked?'link':'hero'} prioritizes an active Hộ vệ and pauses for its details`,async()=>{
  const s=eliteEncounter('guard'),guard=eliteChampion(s);s.welcome=true;s.run.pet=null;s.run.battle.enemies.find(e=>e!==guard).hp=1;if(linked)s.run.link.charge=100;
  const calls=[],h=harness(s,{onBattle:(actor,events,visual)=>{calls.push({actor,events,visual});return {duration:0,impact:0};}});await h.press('nav',{page:'tower'});assert.match(h.app.innerHTML,/QUÁI TINH ANH/);assert.match(h.app.innerHTML,/elite-unit-badge/);
  const before=structuredClone(h.inspect('state'));await h.press('elite-info',{id:guard.id});assert.match(h.modal.innerHTML,/Cách khắc chế/);assert.match(h.modal.innerHTML,/SSR 8%/);assert.deepEqual(h.inspect('state'),before);await h.press('auto');assert.equal(h.inspect('modalOpen'),true);assert.equal(calls.length,0);await h.press('close');await h.tickAuto();assert.equal(calls[0].events.find(e=>!e.heal&&!e.shieldGrant).target,guard.id);assert.equal(!!calls[0].visual.link,linked);E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));
});

test('real elite revival commits once before effects and reloads the spent life with no reward',async()=>{
  const s=eliteEncounter('rebirth'),e=eliteChampion(s);s.welcome=true;e.hp=1;let observed=0;
  const h=harness(s,{onBattle:(actor,events)=>{const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.equal(eliteChampion(saved).elite.revived,true);assert.ok(events.some(ev=>ev.eliteRevive));observed++;return {duration:0,impact:0};}});await h.press('nav',{page:'tower'});await h.press('target',{id:e.id});await h.press('attack');assert.equal(observed,1);assert.equal(h.inspect('state.gold'),s.gold);assert.equal(h.inspect('state.dust'),s.dust);assert.equal(h.inspect('state.run.phase'),'battle');
  const saved=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),reloaded=harness(saved);await reloaded.press('nav',{page:'tower'});assert.match(reloaded.app.innerHTML,/Đã dùng hồi sinh/);const before=structuredClone(reloaded.inspect('state'));await reloaded.press('elite-info',{id:e.id});assert.match(reloaded.modal.innerHTML,/Đã dùng hồi sinh/);assert.deepEqual(reloaded.inspect('state'),before);
});

test('real elite victory skip and chest buttons preserve a single paid reward across reload',async()=>{
  const s=eliteEncounter('rage');s.welcome=true;eliteWin(s);let h=harness(s);await h.press('nav',{page:'tower'});const paid=structuredClone(h.inspect('[state.gold,state.dust,state.inventory,state.wins,state.run.seed]'));await h.press('victory-next');assert.match(h.app.innerHTML,/Bụi rèn/);assert.match(h.app.innerHTML,/thưởng thêm/);
  h=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));await h.press('nav',{page:'tower'});await h.press('victory-next');assert.match(h.app.innerHTML,/CHÚC PHÚC/);assert.match(h.app.innerHTML,/đã tính trong tổng thưởng/);assert.deepEqual(structuredClone(h.inspect('[state.gold,state.dust,state.inventory,state.wins,state.run.seed]')),paid);await h.press('victory-skip');assert.deepEqual(structuredClone(h.inspect('[state.gold,state.dust,state.inventory,state.wins,state.run.seed]')),paid);
});
const refiningAccount=()=>{const s=E.createState();s.welcome=true;s.gold=1000000;s.dust=100000;return s;};
const refiningButton=h=>{const p=h.inspect('pendingRefining');assert.ok(p);return {id:p.id,line:String(p.line),token:String(p.token)};};

test('real refining flow charges once, persists before showing a result, and accepts only the selected value',async()=>{
  const s=refiningAccount();s.inventory[0].level=10;E.equipGear(s,'gear-1','rook');E.startRun(s,42);s.run.map=null;s.run.routes=['battle'];E.chooseRoute(s,0);
  const h=harness(s);await h.press('gear',{id:'gear-1'});assert.match(h.modal.innerHTML,/refine-open/);await h.press('refine-open',{id:'gear-1'});assert.match(h.modal.innerHTML,/80 vàng/);assert.equal(h.writes.length,0);
  const button=refiningButton(h);await h.press('refine-roll',button);const paid=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))),p=paid.refining.pending;assert.ok(p);assert.deepEqual(h.inspect('state'),paid);assert.equal(paid.gold,s.gold-80);assert.equal(paid.dust,s.dust-2);assert.equal(h.writes.length,1);assert.match(h.modal.innerHTML,/KẾT QUẢ MỚI/);
  await h.press('refine-roll',button);assert.equal(h.writes.length,1);assert.deepEqual(h.inspect('state'),paid);
  const accept=refiningButton(h),expected=structuredClone(paid);E.resolveGearRefining(expected,p.id,'new',E.refiningReceipt(expected,p.id,p.line));await h.press('refine-accept',accept);assert.deepEqual(h.inspect('state'),expected);assert.deepEqual(h.inspect('state.run'),s.run);assert.equal(h.writes.length,2);
  await h.press('refine-accept',accept);await h.press('refine-keep',accept);assert.equal(h.writes.length,2);assert.deepEqual(h.inspect('state'),expected);
});

test('real paid comparison resumes after Android back, reload and native export/import; keeping consumes no further resources',async()=>{
  let h=harness(refiningAccount());await h.press('refine-open',{id:'gear-1'});await h.press('refine-roll',refiningButton(h));const paid=structuredClone(h.inspect('state')),stale=refiningButton(h);h.window.gameBack();assert.equal(h.inspect('pendingRefining'),null);assert.deepEqual(h.inspect('state'),paid);await h.press('refine-accept',stale);assert.deepEqual(h.inspect('state'),paid);
  h=harness(paid);await h.press('go-equipment',{id:'rook'});assert.match(h.app.innerHTML,/Kết quả tẩy luyện đang chờ/);await h.press('refine-open',{id:'gear-1'});assert.match(h.modal.innerHTML,/Đã trả/);assert.equal(h.writes.length,0);
  let exported;h.window.AndroidSave={exportSave:json=>exported=json};await h.press('export');const other=harness(refiningAccount());other.window.receiveNativeSave(exported);await other.press('confirm-import');assert.deepEqual(other.inspect('state'),paid);await other.press('refine-open',{id:'gear-1'});const expected=structuredClone(paid);E.resolveGearRefining(expected,'gear-1','old',E.refiningReceipt(expected,'gear-1',0));await other.press('refine-keep',refiningButton(other));assert.deepEqual(other.inspect('state'),expected);assert.equal(other.inspect('state.gold'),paid.gold);assert.equal(other.inspect('state.dust'),paid.dust);assert.equal(other.inspect('state.refining.pending'),null);
});

for(const exit of ['close','back','escape','settings','nav','import'])test(`refining confirmation buttons expire on ${exit} before and after paying`,async()=>{
  for(const paid of [false,true]){
    const h=harness(refiningAccount());await h.press('refine-open',{id:'gear-1'});if(paid)await h.press('refine-roll',refiningButton(h));const before=structuredClone(h.inspect('state')),button=refiningButton(h);
    if(exit==='back')h.window.gameBack();else if(exit==='escape')h.keydown('Escape');else if(exit==='import'){h.window.receiveNativeSave(JSON.stringify(before));await h.press('confirm-import');}else await h.press(exit,exit==='nav'?{page:'heroes'}:{});
    const writes=h.writes.length;for(const action of ['refine-roll','refine-keep','refine-accept'])await h.press(action,button);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writes);assert.equal(h.inspect('pendingRefining'),null);
    await h.press('refine-open',{id:'gear-1'});const writesAfterOpen=h.writes.length;for(const action of ['refine-roll','refine-keep','refine-accept'])await h.press(action,button);assert.deepEqual(h.inspect('state'),before);assert.equal(h.writes.length,writesAfterOpen);
  }
});

test('real line tabs, mismatched items, forged buttons and changing resource balances cannot spend an unseen roll',async()=>{
  const s=refiningAccount(),g=E.dropGearAtRarity(s,()=>.5,'SSR').gear,h=harness(s);for(const action of ['refine-roll','refine-keep','refine-accept'])await h.press(action,{id:g.id,line:'0',token:'1'});assert.equal(h.writes.length,0);
  await h.press('refine-open',{id:g.id});const first=refiningButton(h);await h.press('refine-line',{...first,line:'1'});assert.equal(h.inspect('pendingRefining.line'),1);assert.equal(h.writes.length,0);await h.press('refine-roll',first);assert.equal(h.writes.length,0);
  const selected=refiningButton(h);await h.press('refine-roll',{...selected,id:'gear-1'});await h.press('refine-roll',{...selected,line:'9'});await h.press('refine-roll',{...selected,token:'0'});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
  h.inspect('state.gold--');const changed=structuredClone(h.inspect('state'));await h.press('refine-roll',selected);assert.deepEqual(h.inspect('state'),changed);assert.equal(h.writes.length,0);await h.press('refine-open',{id:g.id});await h.press('refine-line',{...refiningButton(h),line:'1'});await h.press('refine-roll',refiningButton(h));assert.equal(h.inspect('state.refining.pending.line'),1);assert.equal(h.writes.length,1);
});

test('real lock controls protect new results, allow keep, and expose a way back to unlock the item',async()=>{
  const h=harness(refiningAccount());await h.press('toggle-gear-lock',{id:'gear-1'});await h.press('refine-open',{id:'gear-1'});assert.match(h.modal.innerHTML,/data-action="refine-roll"[^>]*disabled/);let writes=h.writes.length;await h.press('refine-roll',refiningButton(h));assert.equal(h.writes.length,writes);
  await h.press('toggle-gear-lock',{id:'gear-1'});await h.press('refine-open',{id:'gear-1'});await h.press('refine-roll',refiningButton(h));await h.press('toggle-gear-lock',{id:'gear-1'});await h.press('refine-open',{id:'gear-1'});assert.match(h.modal.innerHTML,/data-action="refine-accept"[^>]*disabled/);assert.match(h.modal.innerHTML,/Về món đồ để mở khóa/);writes=h.writes.length;const paid=structuredClone(h.inspect('state'));await h.press('refine-accept',refiningButton(h));assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,writes);await h.press('refine-keep',refiningButton(h));assert.equal(h.inspect('state.refining.pending'),null);assert.equal(h.inspect('state.gold'),paid.gold);assert.equal(h.writes.length,writes+1);
});

test('real pending refinement blocks item mutations, shows the one global result, and stays isolated in practice',async()=>{
  const h=harness(refiningAccount());await h.press('refine-open',{id:'gear-1'});await h.press('refine-roll',refiningButton(h));const paid=structuredClone(h.inspect('state')),writes=h.writes.length;
  for(const action of ['upgrade-gear','evolve-gear','confirm-dismantle'])await h.press(action,{id:'gear-1',rarity:'R'});assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,writes);
  await h.press('refine-open',{id:'gear-2'});assert.match(h.modal.innerHTML,/Về kết quả đang chờ/);await h.press('refine-roll',refiningButton(h));assert.deepEqual(h.inspect('state'),paid);assert.equal(h.writes.length,writes);
  await h.press('training-start');const practice=structuredClone(h.inspect('state')),practiceWrites=h.writes.length;for(const action of ['refine-open','refine-line','refine-roll','refine-keep','refine-accept'])await h.press(action,{id:'gear-1',line:'0',token:'1'});assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,practiceWrites);assert.deepEqual(h.inspect('state.refining'),E.starterRefining());await h.press('training-exit');assert.deepEqual(h.inspect('state'),paid);
});

test('real login calendar opens from quests, pays the current day once, and keeps the next day locked',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('nav',{page:'quests'});assert.match(h.app.innerHTML,/Bảy ngày, bảy mốc tiếp sức/);assert.match(h.app.innerHTML,/data-action="claim-login-reward"/);
  const expected=structuredClone(s);const reward=E.claimLoginReward(expected);await h.press('claim-login-reward');assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,1);assert.match(h.app.innerHTML,/Đã nhận hôm nay/);assert.match(h.app.innerHTML,/Ngày 7/);await h.press('claim-login-reward');assert.deepEqual(h.inspect('state'),expected);assert.equal(h.writes.length,1);assert.equal(reward.gold,120);
});

test('login claim is blocked by practice mode and forged clicks cannot mint a second reward',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('nav',{page:'quests'});await h.press('claim-login-reward');const paid=structuredClone(h.inspect('state'));await h.press('claim-login-reward');assert.deepEqual(h.inspect('state'),paid);await h.press('training-start');const practice=structuredClone(h.inspect('state')),writes=h.writes.length;await h.press('claim-login-reward');assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),paid);
});

test('claimed login rewards survive reload and native export/import without changing a pending counter or refining result',async()=>{
  const s=counterBattle();s.welcome=true;s.gold=10000;s.dust=100;E.rollGearRefining(s,'gear-1',0,E.refiningReceipt(s,'gear-1',0),()=>.5);const before=structuredClone(s),h=harness(s);await h.press('nav',{page:'quests'});await h.press('claim-login-reward');
  const paid=E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1')));assert.deepEqual(paid.run,before.run);assert.deepEqual(paid.refining,before.refining);assert.equal(paid.loginRewards.totalClaims,1);
  const reloaded=harness(paid);await reloaded.press('claim-login-reward');assert.equal(reloaded.writes.length,0);assert.deepEqual(reloaded.inspect('state'),paid);
  let exported;reloaded.window.AndroidSave={exportSave:value=>exported=value};await reloaded.press('export');const imported=harness(E.createState());imported.window.receiveNativeSave(exported);await imported.press('confirm-import');assert.deepEqual(imported.inspect('state'),paid);
  await imported.press('nav',{page:'quests'});assert.match(imported.app.innerHTML,/Đã nhận hôm nay/);const writes=imported.writes.length;await imported.press('claim-login-reward');assert.equal(imported.writes.length,writes);assert.deepEqual(imported.inspect('state'),paid);
});

const bondButton=h=>{const p=h.inspect('pendingBond');return {id:p.id,token:String(p.token)};};
test('real bond entry previews locked memories without writes, pays once and rejects duplicate taps',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/Thân thiết/);await h.press('bond-open',{id:'rook'});assert.match(h.modal.innerHTML,/Hoa hồng tro/);assert.match(h.modal.innerHTML,/80 vàng/);assert.doesNotMatch(h.modal.innerHTML,/Rook không cho thợ rèn/);assert.equal(h.writes.length,0);
  const button=bondButton(h);await h.press('bond-gift',button);const paid=structuredClone(h.inspect('state'));assert.equal(paid.gold,s.gold-80);assert.equal(paid.bonds.rook.xp,20);assert.equal(h.writes.length,1);await h.press('bond-gift',button);assert.equal(h.writes.length,1);assert.deepEqual(h.inspect('state'),paid);await h.press('bond-gift',bondButton(h));assert.equal(h.inspect('state.bonds.rook.xp'),40);assert.match(h.modal.innerHTML,/Rook không cho thợ rèn/);assert.doesNotMatch(h.modal.innerHTML,/Anh thú nhận đã rời vị trí/);
});

for(const exit of ['close','back','escape','settings','nav','import'])test(`bond confirmation expires on ${exit} without spending`,async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);await h.press('bond-open',{id:'rook'});const button=bondButton(h);
  if(exit==='close')await h.press('close');else if(exit==='back')h.window.gameBack();else if(exit==='escape')h.keydown('Escape');else if(exit==='settings')await h.press('settings');else if(exit==='nav')await h.press('nav',{page:'heroes'});else h.window.receiveNativeSave(JSON.stringify(s));
  await h.press('bond-gift',button);await h.press('bond-adorn',{...button,enabled:'true'});assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
});

test('real bond actions reject forged IDs, other hero tokens, capped gifts and practice writes',async()=>{
  const s=E.createState();s.welcome=true;const h=harness(s);for(const id of ['nyx','constructor','missing']){await h.press('bond-open',{id});await h.press('bond-gift',{id,token:'1'});}assert.deepEqual(h.inspect('state'),s);assert.equal(h.writes.length,0);
  await h.press('bond-open',{id:'rook'});await h.press('bond-gift',{...bondButton(h),id:'aerin'});assert.deepEqual(h.inspect('state'),s);await h.press('training-start');const practice=structuredClone(h.inspect('state')),writes=h.writes.length;for(const action of ['bond-open','bond-gift','bond-adorn'])await h.press(action,{id:'rook',token:'1',enabled:'true'});assert.deepEqual(h.inspect('state'),practice);assert.equal(h.writes.length,writes);await h.press('training-exit');assert.deepEqual(h.inspect('state'),s);
  const maxed=structuredClone(s);maxed.bonds.rook={xp:800,adorned:false};const cap=harness(maxed);await cap.press('bond-open',{id:'rook'});await cap.press('bond-gift',bondButton(cap));assert.deepEqual(cap.inspect('state'),maxed);assert.equal(cap.writes.length,0);
});

test('real oath equip survives reload and native backup with active counter, login and refining intact',async()=>{
  const s=counterBattle();s.welcome=true;s.gold=10000;s.dust=100;s.bonds.rook={xp:780,adorned:false};E.claimLoginReward(s);E.rollGearRefining(s,'gear-1',0,E.refiningReceipt(s,'gear-1',0),()=>.5);const h=harness(s);await h.press('bond-open',{id:'rook'});await h.press('bond-gift',bondButton(h));assert.match(h.modal.innerHTML,/Người giữ lời thề/);await h.press('bond-adorn',{...bondButton(h),enabled:'true'});const paid=structuredClone(h.inspect('state'));assert.equal(paid.bonds.rook.adorned,true);assert.deepEqual(paid.run,s.run);assert.deepEqual(paid.loginRewards,s.loginRewards);assert.deepEqual(paid.refining,s.refining);assert.equal(h.writes.length,2);
  await h.press('hero',{id:'rook'});assert.match(h.modal.innerHTML,/Người giữ lời thề/);assert.match(h.modal.innerHTML,/data-bond-adorned="true"/);const reloaded=harness(E.validateState(JSON.parse(h.storage.get('thap-vo-tan-v1'))));assert.deepEqual(reloaded.inspect('state'),paid);let exported;reloaded.window.AndroidSave={exportSave:value=>exported=value};await reloaded.press('export');const target=harness(E.createState());target.window.receiveNativeSave(exported);await target.press('confirm-import');assert.deepEqual(target.inspect('state'),paid);await target.press('bond-open',{id:'rook'});await target.press('bond-adorn',{...bondButton(target),enabled:'false'});assert.equal(target.inspect('state.bonds.rook.xp'),800);assert.equal(target.inspect('state.bonds.rook.adorned'),false);assert.deepEqual(target.inspect('state.run'),paid.run);
});
