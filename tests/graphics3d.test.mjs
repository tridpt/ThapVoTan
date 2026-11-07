import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import * as models from '../js/models3d.mjs';
import * as effects from '../js/effects3d.mjs';
import * as combat from '../js/combat3d.mjs';
import * as battleCamera from '../js/battle-camera3d.mjs';
import * as impactBeat from '../js/impact-beat.mjs';
import * as performanceRuntime from '../js/performance.mjs';
import * as devicePower from '../js/device-power.mjs';
import * as ultimate from '../js/ultimate3d.mjs';
import * as worlds from '../js/worlds3d.mjs';
import * as bosses from '../js/boss3d.mjs';
import * as elites3d from '../js/elites3d.mjs';
import {encounter as eliteEncounter,champion as eliteChampion} from './elites-helper.mjs';
import * as bossPartsVisual from '../js/boss-parts3d.mjs';
import * as lobby from '../js/lobby3d.mjs';
import * as links3d from '../js/links3d.mjs';
import * as ultimateData from '../js/ultimate-data.mjs';
import * as heroSkills3d from '../js/hero-skills3d.mjs';
import * as towerMap3d from '../js/tower-map3d.mjs';
import * as victory3d from '../js/victory3d.mjs';
import {HERO,RARITY} from '../js/data.mjs';
import {PET} from '../js/adventure-data.mjs';
import {gearLoadout} from '../js/armory.mjs';
import {account as dragonAccount,reachStage,DRAGON} from './void-dragon-helper.mjs';
import {condition as anomalyCondition} from './anomalies-helper.mjs';
import {guardBattle,guardedTurn} from './timing-guard-helper.mjs';

// Real Three.js scenes and visual controller; renderer/DOM are stubs, with no WebGL or browser.
function harness(state,{preview=false,home=false,wardrobe=false,map=false,victory=false,stored={},device={},deviceNavigator={}}={}){
  const instances=[],scheduled=new Map(),timers=new Map(),idleJobs=new Map(),storage=new Map(Object.entries(stored)),events={},windowEvents={},mediaEvents={};let next=0;
  const element=()=>{
    const classes=new Set(),handlers={},styles=new Map(),el={isConnected:true,className:'',dataset:{},children:[],handlers,style:{removeProperty:k=>styles.delete(k),setProperty:(k,v)=>styles.set(k,v)},classList:{add:(...v)=>v.forEach(c=>classes.add(c)),remove:(...v)=>v.forEach(c=>classes.delete(c)),contains:c=>classes.has(c)},
      append(child){this.children.push(child);child.parentElement=this;child.isConnected=true;},remove(){this.isConnected=false;},focus(){this.focused=true;},setAttribute(){},addEventListener:(name,fn)=>handlers[name]=fn,querySelector(){return null;},querySelectorAll(){return [];},getBoundingClientRect:()=>({width:400,height:470})};
    Object.defineProperty(el,'innerHTML',{set(value){this.html=value;if(value.includes('ultimate-overlay')){const overlay=element(),stage=element(),skip=element();overlay.querySelector=selector=>selector==='.ultimate-stage'?stage:selector==='.ultimate-skip'||selector==='button'?skip:null;this.firstElementChild=overlay;}},get(){return this.html||'';}});return el;
  };
  const host=element(),source={dataset:{modelType:'hero',modelId:'aerin'},closest:()=>null};
  host.querySelector=selector=>selector==='[data-model-type]'&&preview?source:null;
  let surface=victory?'victory':map?'map':home?'lobby':wardrobe?'wardrobe':preview?'preview':'battle',menu=false;
  const dialog=element();host.closest=selector=>selector==='.modal'&&surface==='preview'?dialog:null;
  const document={hidden:false,body:element(),activeElement:null,createElement:element,querySelector:selector=>selector==='.modal'&&(menu||surface==='preview')?dialog:selector==='#victory3d'&&surface==='victory'?host:selector==='#tower-map3d'&&surface==='map'?host:selector==='#arena3d'&&surface==='battle'?host:selector==='#lobby3d'&&surface==='lobby'?host:selector.startsWith('.modal ')&&surface==='preview'?host:selector==='.signature-forge-art, .pet-feature-art, .wardrobe-art'&&surface==='wardrobe'?host:null,querySelectorAll:()=>[],addEventListener:(name,fn)=>events[name]=fn};
  host.querySelector=selector=>selector==='[data-model-type]'&&['preview','wardrobe'].includes(surface)?source:null;
  const window={addEventListener:(name,fn)=>windowEvents[name]=fn},motion={matches:false,addEventListener:(name,fn)=>mediaEvents[name]=fn};
  class Renderer{
    constructor(options){this.options=options;this.shadowMap={};this.domElement=element();this.domElement.toDataURL=()=>`stub-thumbnail:${this.renders.length}`;this.renders=[];this.compiled=[];instances.push(this);}
    setClearColor(){} setPixelRatio(value){this.pixelRatio=value;} setSize(width,height){this.size=[width,height];}
    render(scene,camera){this.renders.push({scene,camera});} compile(scene,camera){this.compiled.push({scene,camera});} dispose(){this.disposed=true;}
  }
  class Observer{observe(){} disconnect(){}}
  const context=vm.createContext({...models,...effects,...combat,...battleCamera,...impactBeat,...performanceRuntime,...devicePower,...ultimate,...worlds,...bosses,...elites3d,...bossPartsVisual,...lobby,...links3d,...ultimateData,...heroSkills3d,...towerMap3d,...victory3d,LINKS:E.LINKS,anomalyForFloor:E.anomalyForFloor,HERO,RARITY,PET,gearLoadout,
    readDevicePower:()=>devicePower.readDevicePower({profile:()=>JSON.stringify(device)},deviceNavigator),
    IdlePreloader:class extends performanceRuntime.IdlePreloader{constructor(){super({schedule:fn=>{idleJobs.set(++next,fn);return next;},cancel:id=>idleJobs.delete(id)});}},
    equippedSkin:E.equippedSkin,bondAdorned:E.bondAdorned,seasonAuraActive:E.seasonAuraActive,formationPosition:E.formationPosition,graphicsProfile:E.graphicsProfile,T:{...models.T,WebGLRenderer:Renderer},document,window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    Image:class{constructor(){return element();}},ResizeObserver:Observer,IntersectionObserver:Observer,matchMedia:()=>motion,innerWidth:400,innerHeight:800,devicePixelRatio:3,
    requestAnimationFrame:fn=>{scheduled.set(++next,fn);return next;},cancelAnimationFrame:id=>scheduled.delete(id),setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},clearTimeout:id=>timers.delete(id)});
  const js=readFileSync(new URL('../js/visuals3d.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');vm.runInContext(js,context,{filename:'visuals3d.mjs'});
  const inspect=js=>vm.runInContext(js,context);
  return {instances,document,source,events,timers,idleJobs,storage,windowEvents,motion,mediaEvents,inspect,surface:value=>surface=value,menu:value=>menu=value,
    idle:()=>{const job=[...idleJobs][0];if(!job)return false;idleJobs.delete(job[0]);job[1]();return true;},
    mount:()=>inspect('mountVisuals')(state.run,state.team[0],'enemy0',state),
    tick:now=>{const jobs=[...scheduled.values()];scheduled.clear();for(const fn of jobs)fn(now);},
    close:()=>{inspect('dropView()');inspect('renderer?.dispose()');scheduled.clear();}};
}
function battle(){const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);return s;}

test('low-RAM native devices and memory-only browsers start with bounded rendering and no prewarm jobs',()=>{
  for(const config of [{device:{lowRam:true,memoryGB:8}},{deviceNavigator:{deviceMemory:2}}]){
    const s=battle();E.setGraphics(s,'quality','high');E.setGraphics(s,'fps',60);const before=structuredClone(s),h=harness(s,config);h.mount();
    assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('graphics.fps'),30);assert.equal(h.instances[0].shadowMap.enabled,false);assert.equal(h.instances[0].options.antialias,false);assert.equal(h.inspect('view.world.weather.visible'),false);assert.equal(h.idleJobs.size,0);
    const arena=h.inspect('view');h.inspect('setPerformanceSetting')('automatic',false);assert.equal(h.inspect('graphics.fps'),60);assert.equal(h.instances[0].shadowMap.enabled,true);assert.equal(h.inspect('view'),arena);assert.equal(h.instances.length,1);assert.ok(h.idleJobs.size>0);assert.deepEqual(s,before);h.close();
  }
});

test('native heat and power changes reuse the live scene and respect system limits with adaptation disabled',()=>{
  const s=battle();E.setGraphics(s,'fps',60);const before=structuredClone(s),device={thermal:0},h=harness(s,{device});h.mount();const arena=h.inspect('view'),r=h.instances[0];
  h.inspect('setPerformanceSetting')('automatic',false);device.thermal=2;h.windowEvents.devicepowerchange();assert.equal(h.inspect('graphics.fps'),30);assert.equal(r.shadowMap.enabled,false);assert.equal(h.idleJobs.size,0);
  device.thermal=4;h.windowEvents.devicepowerchange();assert.equal(h.inspect('framePerformance.target'),20);assert.equal(h.inspect('graphics.fps'),20);const count=r.renders.length;for(let n=1;n<=60;n++)h.tick(n*1000/60);assert.equal(r.renders.length-count,20);
  device.thermal=0;device.powerSave=true;h.windowEvents.devicepowerchange();assert.equal(h.inspect('graphics.fps'),30);
  h.windowEvents.pagehide();device.powerSave=false;h.windowEvents.pageshow();assert.equal(h.inspect('graphics.fps'),60);assert.equal(r.shadowMap.enabled,true);assert.equal(h.inspect('view'),arena);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
});

test('the battery choice persists on the device, caps battle at 30 FPS and restores the selected ceiling in place',()=>{
  const s=battle();E.setGraphics(s,'fps',60);const before=structuredClone(s),h=harness(s);h.mount();const r=h.instances[0],arena=h.inspect('view');
  h.inspect('setPerformanceSetting')('batterySaver',true);assert.equal(h.storage.get('thap-vo-tan-battery-saver'),'on');assert.equal(h.inspect('graphics.fps'),30);
  for(let n=1;n<=60;n++)h.tick(n*1000/60);assert.equal(r.renders.length,30);assert.equal(h.inspect('modelPreloader.jobs.length'),0);
  h.inspect('setPerformanceSetting')('batterySaver',false);assert.equal(h.inspect('graphics.fps'),60);assert.equal(h.inspect('view'),arena);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
  const reopened=harness(s,{stored:{'thap-vo-tan-battery-saver':'on'}});reopened.mount();assert.equal(reopened.inspect('performanceSettings().batterySaver'),true);assert.equal(reopened.inspect('graphics.fps'),30);reopened.close();
});

test('battery-saving idle scenes render at 15 FPS without causing a false automatic downgrade',()=>{
  const s=E.createState();E.setGraphics(s,'fps',60);const before=structuredClone(s),h=harness(s,{home:true,stored:{'thap-vo-tan-battery-saver':'on'}});h.mount();const r=h.instances[0];
  for(let n=1;n<=1200;n++)h.tick(n*1000/60);assert.equal(r.renders.length,300);assert.equal(h.inspect('framePerformance.level'),0);assert.equal(h.inspect('graphics.fps'),30);assert.equal(h.inspect('framePerformance.target'),30);assert.deepEqual(s,before);h.close();
});

test('a heat event resolves a running cinematic, clears its timer and keeps the previous battle playable',async()=>{
  const s=battle(),before=structuredClone(s),device={thermal:0},h=harness(s,{device});h.mount();const arena=h.inspect('view'),promise=h.inspect('playUltimate')('rook');assert.equal(h.inspect('view.mode'),'ultimate');
  device.thermal=4;h.windowEvents.devicepowerchange();assert.equal(await promise,true);assert.equal(h.inspect('view'),arena);assert.equal(h.inspect('activeUltimate'),null);assert.equal(h.timers.size,0);assert.equal(await h.inspect('playUltimate')('rook'),false);h.tick(200);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
});

test('saving skips battle cinematics while an explicit preview is allowed until critical heat',async()=>{
  const s=battle(),device={},h=harness(s,{device,preview:true,stored:{'thap-vo-tan-battery-saver':'on'}});h.mount();const p=h.inspect('playUltimate')('aerin',{preview:true});assert.equal(h.inspect('view.mode'),'ultimate');h.inspect('skipUltimate()');assert.equal(await p,true);
  device.thermal=4;h.windowEvents.devicepowerchange();assert.equal(await h.inspect('playUltimate')('aerin',{preview:true}),false);h.surface('battle');h.mount();device.thermal=0;h.windowEvents.devicepowerchange();assert.equal(await h.inspect('playUltimate')('rook'),false);h.close();
});

test('small thumbnails use a separate bounded cache and restore full size after device saving is disabled',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const thumbnail=h.inspect('thumbnail'),large=thumbnail('hero','rook');assert.deepEqual(h.instances.at(-1).size,[288,320]);
  h.inspect('setPerformanceSetting')('batterySaver',true);const small=thumbnail('hero','rook');assert.deepEqual(h.instances.at(-1).size,[192,213]);assert.notEqual(small,large);assert.equal(h.inspect('thumbnails.size'),2);
  h.inspect('setPerformanceSetting')('batterySaver',false);assert.equal(thumbnail('hero','rook'),large);assert.equal(h.instances.length,2);assert.deepEqual(s,before);h.close();
});

test('equipped bond auras reach real previews, preloading and battle rebuilds without changing account or combat state',()=>{
  const s=battle();s.bonds.rook={xp:800,adorned:true};const before=structuredClone(s),h=harness(s,{preview:true});h.source.dataset.modelId='rook';h.mount();assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.model.userData.bond'),true);const key=h.inspect('view.key');E.setBondAdornment(s,'rook',false);h.mount();assert.notEqual(h.inspect('view.key'),key);assert.equal(h.inspect('view.model.userData.bond'),false);
  E.setBondAdornment(s,'rook',true);h.surface('battle');h.mount();assert.equal(h.inspect('view.units.get("rook").model.userData.bond'),true);while(h.idle());assert.equal(h.inspect('failed'),false);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
});

test('event aura reaches live previews, preload and combat on one renderer with distinct cache keys',()=>{
  const s=battle();E.observeSeason(s,new Date(),true);s.season.wallet=s.season.current.earned=1000;E.buySeasonItem(s,'eclipse-aura',E.seasonReceipt(s));E.setSeasonAura(s,true);const run=structuredClone(s.run),h=harness(s,{preview:true});h.mount();assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.model.userData.seasonAura'),true);const key=h.inspect('view.key');E.setSeasonAura(s,false);h.mount();assert.notEqual(h.inspect('view.key'),key);assert.equal(h.inspect('view.model.userData.seasonAura'),false);
  E.setSeasonAura(s,true);h.surface('battle');h.mount();assert.equal(h.inspect('view.units.get("rook").model.userData.seasonAura'),true);const arenaKey=h.inspect('view.key');E.setSeasonAura(s,false);h.mount();assert.notEqual(h.inspect('view.key'),arenaKey);assert.equal(h.inspect('view.units.get("rook").model.userData.seasonAura'),false);while(h.idle());assert.equal(h.inspect('failed'),false);assert.equal(h.instances.length,1);assert.deepEqual(s.run,run);h.close();
});

test('counter VFX use increasing hero-rarity trails within the shared budget and return to normal attack state',()=>{
  const counts=[];
  for(const id of ['rook','aerin','kael','eira','solis','orion','eclipse']){
    const s=guardBattle();s.team=[id,'lumi',id==='aerin'?'rook':'aerin'];for(const hero of s.team)s.owned[hero]={level:1,copies:0,awaken:0};s.run.heroes=s.run.heroes.map((h,i)=>({...h,id:s.team[i]}));s.run.statistics=E.starterStatistics(s.run);s.run.battle.statistics=E.starterStatistics(s.run);E.setGraphics(s,'quality','high');
    const h=harness(s),tick=motionClock(h);tick(0);h.mount();const v=h.inspect('view'),actor=v.units.get(id),base=actor.model.position.clone();const events=guardedTurn(s);v.vfx.clear();
    const hits=E.counterAction(s,id,'enemy0',E.counterOpportunity(s.run),'arms'),before=structuredClone(s),timing=h.inspect('battleEffect')(id,hits,{counter:true});
    counts.push(v.vfx.items.filter(f=>f.kind==='weaponTrail').length);assert.equal(actor.attackCounter,true);assert.equal(actor.attackSkill,false);assert.equal(v.cameraRig.shot.counter,true);assert.ok(v.vfx.items.length<=v.vfx.capacity);assert.equal(h.instances.length,1);
    tick(timing.duration/1000*.4);assert.ok(actor.model.position.distanceTo(base)>.1);tick(timing.duration/1000+1);assert.equal(v.cameraRig.shot,null);assert.ok(Math.abs(actor.model.position.x-actor.x)<1e-12&&Math.abs(actor.model.position.z-actor.z)<1e-12);assert.deepEqual(s,before);
    h.inspect('battleEffect')(id,[{target:'enemy0',value:1}],{});assert.equal(actor.attackCounter,false);assert.equal(v.cameraRig.shot.counter,false);assert.equal(h.inspect('failed'),false);h.inspect('battleEffect')(id,hits,{link:{ids:[id,'lumi'],id:E.linkForPair(id,'lumi').id}});assert.equal(actor.attackCounter,false);h.close();assert.ok(events.length>0);
  }
  assert.deepEqual(counts,[0,0,1,2,3,4,5]);
});

for(const quiet of ['effects-off','motion'])test(`counter ${quiet} feedback keeps a still camera and no trails or lunge`,()=>{
  const s=guardBattle();if(quiet==='effects-off')E.setGraphics(s,'effects',false);const h=harness(s),tick=motionClock(h);tick(0);h.mount();if(quiet==='motion'){h.motion.matches=true;h.mediaEvents.change();}
  const v=h.inspect('view'),actor=v.units.get('rook'),base=v.camera.position.clone();guardedTurn(s);const events=E.counterAction(s,'rook','enemy0',E.counterOpportunity(s.run)),before=structuredClone(s),timing=h.inspect('battleEffect')('rook',events,{counter:true});
  assert.equal(v.cameraRig.shot,null);assert.equal(timing.duration,230);assert.ok(!v.vfx.items.some(f=>['weaponTrail','meleeTrail','projectile','elementContact'].includes(f.kind)));assert.equal(v.vfx.items.filter(f=>f.kind==='particle').length,3);assert.equal(v.vfx.reducedMotion,true);assert.ok(v.vfx.items.some(f=>f.kind==='pulse'));tick(.1);assert.equal(actor.model.position.x,actor.x);assert.equal(actor.model.position.z,actor.z);assert.deepEqual(v.camera.position,base);assert.deepEqual(s,before);h.close();
});

for(const reduced of ['normal','effects-off','motion'])test(`real guard shield feedback is bounded and leaves combat unchanged under ${reduced}`,()=>{
  const s=guardBattle();if(reduced==='effects-off')E.setGraphics(s,'effects',false);const h=harness(s);h.mount();if(reduced==='motion'){h.motion.matches=true;h.mediaEvents.change();}
  const events=guardedTurn(s),before=structuredClone(s),v=h.inspect('view'),timing=h.inspect('battleEffect')(null,events,{enemy:true});
  assert.ok(events.some(e=>e.timingGuard));const rings=v.vfx.items.filter(e=>e.kind==='pulse'&&e.radius===1.12);assert.equal(rings.length,3);assert.ok(rings.every(e=>e.node.material.color.getHexString()==='f3d58c'));assert.ok(rings.every(e=>e.born>=0));assert.ok(v.vfx.items.length<=v.vfx.capacity);assert.ok(timing.duration>0);h.tick(500);h.mount();assert.equal(h.inspect('view'),v);assert.equal(h.instances.length,1);assert.equal(h.inspect('failed'),false);assert.deepEqual(s,before);h.close();
});

test('condition arenas and maps use the saved palette on one renderer and retain rules through effects-off and reload',()=>{
  const s=battle(),h=harness(s);let released=0;
  for(const id of ['bloodmoon','frost','mana']){
    anomalyCondition(s.run,id);const before=structuredClone(s);h.mount();h.tick(500);assert.equal(h.inspect('failed'),false);const view=h.inspect('view');assert.equal(view.world.anomaly,id);assert.equal(view.accent,E.ANOMALY[id].color);assert.equal(h.instances.length,1);assert.deepEqual(s,before);view.world.weather.geometry.addEventListener('dispose',()=>released++);
    h.motion.matches=true;h.mediaEvents.change();h.tick(600);const still=view.world.root.getObjectByName('anomaly:'+id).matrixWorld.clone();h.tick(3000);assert.deepEqual(view.world.root.getObjectByName('anomaly:'+id).matrixWorld,still);h.motion.matches=false;h.mediaEvents.change();
  }
  assert.equal(released,2);E.setGraphics(s,'effects',false);h.mount();h.tick(4000);assert.equal(h.inspect('view.world.weather.visible'),false);assert.equal(h.inspect('view.world.anomaly'),'mana');assert.ok(h.inspect('view.world.root.getObjectByName("anomaly:mana").visible'));assert.equal(released,3);h.close();
  const map=E.createState();E.startRun(map,42);anomalyCondition(map.run,'mana');const before=structuredClone(map),m=harness(map,{map:true});m.mount();assert.equal(m.inspect('view.scene.background.getHexString()'),E.ANOMALY.mana.visual.background.slice(1));assert.equal(m.instances.length,1);assert.deepEqual(map,before);m.close();
});

test('target and exchange hero studios share one renderer for all 20 locked or owned models without account mutations',async()=>{
  const s=E.createState(),before=structuredClone(s),h=harness(s,{preview:true});
  for(const id of Object.keys(HERO)){h.source.dataset.modelId=id;h.mount();h.tick(150);assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.mode'),'preview');assert.equal(h.inspect('view.model.userData.id'),id);assert.equal(h.instances.length,1);}
  const preview=h.inspect('view'),promise=h.inspect('playUltimate')('eclipse',{preview:true});assert.equal(h.inspect('view.mode'),'ultimate');h.inspect('skipUltimate()');assert.equal(await promise,true);assert.equal(h.inspect('view'),preview);assert.deepEqual(s,before);h.close();
});

function won(){const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');return s;}

test('three raid phases rebuild their world and all nine actors on the shared renderer and release each old scene',()=>{
  const s=E.createState();for(const id of Object.keys(HERO))s.owned[id]={level:20,copies:0,awaken:0};E.autoRaidTeams(s);s.raids.fronts=[2,1,2];E.startRaid(s,1,42);
  for(const team of s.run.raid.teams)for(const hero of team.heroes)hero.atk=100000;for(const hero of s.run.heroes)hero.atk=100000;
  const h=harness(s),seen=new Set();
  for(const stage of [0,1,2]){
    h.surface('battle');const before=structuredClone(s);h.mount();h.tick(200+stage*100);const view=h.inspect('view');assert.equal(view.world.data.id,['forest','lava','sky'][stage]);assert.equal(h.instances.length,1);assert.equal(h.inspect('failed'),false);assert.deepEqual(s,before);
    for(const [i,hero] of s.run.heroes.entries()){seen.add(hero.id);assert.ok(view.units.has(hero.id));const position=E.formationPosition(s.run,i);assert.equal(view.units.get(hero.id).x,position.x);assert.equal(view.units.get(hero.id).z,position.z);}
    if(stage===2){assert.ok(view.units.has('enemy1'));assert.ok(view.units.has('enemy2'));}
    let released=0;view.world.weather.geometry.addEventListener('dispose',()=>released++);
    while(s.run.phase==='battle'){
      const actor=s.run.heroes.find(h=>h.hp>0&&!s.run.battle.used.includes(h.id)),enemy=s.run.battle.enemies.find(e=>e.hp>0);
      if(actor)E.playerAction(s,actor.id,enemy.id,false,enemy.kind==='boss'?'core':null);else E.enemyTurn(s);
    }
    h.surface('victory');h.mount();assert.equal(h.inspect('view.mode'),'victory');assert.equal(released,1);E.dismissVictory(s);if(stage<2)E.continueRaid(s,stage);
  }
  assert.equal(seen.size,9);h.close();E.validateState(s);
});

test('victory and chest stages reuse one live renderer, preserve costume data and clean up unique geometry on transition',()=>{
  const s=won(),before=structuredClone(s),h=harness(s,{victory:true});h.mount();const intro=h.inspect('view'),host=intro.host;assert.equal(intro.mode,'victory');assert.equal(host.classList.contains('victory3d-ready'),true);h.tick(200);assert.ok(h.instances[0].renders.some(r=>r.scene===intro.scene));let freed=0;intro.particles.geometry.addEventListener('dispose',()=>freed++);h.mount();assert.equal(h.inspect('view'),intro);
  E.advanceVictory(s);h.mount();assert.notEqual(h.inspect('view'),intro);assert.equal(h.inspect('view.loot'),true);assert.equal(freed,1);assert.equal(h.instances.length,1);E.advanceVictory(s);h.surface('lobby');h.mount();assert.equal(h.inspect('view.mode'),'lobby');assert.equal(host.classList.contains('victory3d-ready'),false);assert.equal(h.instances.length,1);assert.deepEqual({...s,run:{...s.run,victory:before.run.victory}},before);h.close();
});

test('victory respects speed, effects-off and reduced-motion settings and pauses rendering while hidden',()=>{
  const s=won();s.settings.speed=2;const h=harness(s,{victory:true});h.mount();assert.equal(h.inspect('view.duration'),1800);h.document.hidden=true;h.events.visibilitychange();const renders=h.instances[0].renders.length;h.tick(200);assert.equal(h.instances[0].renders.length,renders);h.document.hidden=false;h.events.visibilitychange();h.tick(400);assert.ok(h.instances[0].renders.length>renders);h.motion.matches=true;h.mediaEvents.change();h.tick(600);assert.equal(h.inspect('view.enemy.visible'),false);assert.equal(h.inspect('view.particles.visible'),false);
  E.advanceVictory(s);E.setGraphics(s,'effects',false);h.mount();h.tick(800);assert.equal(h.inspect('view.chest.lid.rotation.x'),-1.85);assert.equal(h.inspect('view.particles.visible'),false);assert.equal(h.inspect('failed'),false);h.close();
});

test('loss of the victory renderer restores the SVG fallback and leaves pending rewards and report intact',()=>{
  const s=won(),before=structuredClone(s),h=harness(s,{victory:true});h.mount();const host=h.inspect('view.host');h.instances[0].render=()=>{throw new Error('lost victory context');};h.tick(200);assert.equal(h.inspect('failed'),true);assert.equal(h.inspect('view'),null);assert.equal(host.classList.contains('victory3d-ready'),false);assert.equal(h.instances[0].disposed,true);assert.deepEqual(s,before);h.close();
});

test('the map shares the live renderer, projects DOM labels, reuses inspection scenes and restores fallback positions on leaving',()=>{
  const s=E.createState();E.startRun(s,42);const before=structuredClone(s),h=harness(s,{map:true});h.mount();const view=h.inspect('view'),host=view.host,renderer=h.instances[0];assert.equal(view.mode,'map');assert.equal(host.classList.contains('tower-map3d-ready'),true);
  const labels=[...view.nodes.values()].map(n=>({dataset:{mapNode:n.id,fallbackX:(18+n.lane*32)+'%',fallbackY:(82-n.row*17)+'%'},style:{}}));host.querySelectorAll=selector=>selector==='[data-map-node]'?labels:[];host.dataset.mapFocus='5:1';h.mount();h.tick(200);
  assert.equal(h.inspect('view'),view);assert.equal(view.focus,'5:1');assert.ok(labels.every(l=>parseFloat(l.style.left)>0&&parseFloat(l.style.left)<100&&parseFloat(l.style.top)>0&&parseFloat(l.style.top)<100));assert.ok(renderer.renders.some(r=>r.scene===view.scene));
  let freed=0;view.motes.geometry.addEventListener('dispose',()=>freed++);h.surface('lobby');h.mount();assert.equal(h.inspect('view.mode'),'lobby');assert.equal(h.instances.length,1);assert.equal(freed,1);assert.equal(host.classList.contains('tower-map3d-ready'),false);assert.ok(labels.every(l=>l.style.left===l.dataset.fallbackX&&l.style.top===l.dataset.fallbackY));assert.deepEqual(s,before);h.close();
});

test('map travel uses the shared scene and respects 2x, reduced effects, backgrounding and system motion preferences',()=>{
  const s=E.createState();E.startRun(s,42);const before=structuredClone(s),h=harness(s,{map:true});h.mount();const view=h.inspect('view');
  assert.equal(h.inspect('towerMapTravel')('1:1',{speed:2}).duration,380);assert.ok(view.travel);h.document.hidden=true;h.events.visibilitychange();assert.equal(view.travel,null);assert.ok(view.party.position.equals(view.nodes.get('1:1').position));assert.equal(h.inspect('towerMapTravel')('1:0').duration,0);
  h.document.hidden=false;h.motion.matches=true;h.mediaEvents.change();assert.equal(h.inspect('towerMapTravel')('1:0').duration,0);assert.equal(view.travel,null);assert.ok(view.party.position.equals(view.nodes.get('1:0').position));
  h.motion.matches=false;s.settings.graphics.effects=false;h.mount();assert.equal(h.inspect('towerMapTravel')('1:2').duration,0);assert.equal(h.inspect('view.motes.visible'),false);assert.deepEqual(s.run,before.run);h.close();
});

test('a map renderer failure clears the live class and preserves the saved journey for the SVG and button fallback',()=>{
  const s=E.createState();E.startRun(s,42);const before=structuredClone(s),h=harness(s,{map:true});h.mount();const host=h.inspect('view.host'),renderer=h.instances[0];renderer.render=()=>{throw new Error('lost map context');};h.tick(200);
  assert.equal(h.inspect('failed'),true);assert.equal(h.inspect('view'),null);assert.equal(host.classList.contains('tower-map3d-ready'),false);assert.equal(renderer.disposed,true);assert.deepEqual(s,before);h.close();
});

test('entering a route brings an offscreen map into view for the short party movement',()=>{
  const s=E.createState();E.startRun(s,42);const h=harness(s,{map:true});h.mount();const view=h.inspect('view');let scrolled=0;view.host.scrollIntoView=options=>{assert.equal(options.behavior,'instant');assert.equal(options.block,'center');scrolled++;};h.inspect('inViewport=false');
  assert.equal(h.inspect('towerMapTravel')('1:0').duration,760);assert.equal(scrolled,1);assert.equal(h.inspect('inViewport'),true);h.inspect('stopTowerMapTravel()');h.close();
});

test('a real starter cinematic uses the battle costume, shares the renderer and restores focus/scene after skip or timeout',async()=>{
  const s=battle();s.best=10;E.equipSkin(s,'rook','rook-guardian');const before=structuredClone(s),h=harness(s);h.mount();const previous=h.inspect('view'),renderer=h.instances[0],focus={isConnected:true,focus(){this.restored=true;}};h.document.activeElement=focus;
  for(const close of ['skip','timeout']){
    const promise=h.inspect('playUltimate')('rook',{speed:2}),v=h.inspect('view');assert.equal(v.mode,'ultimate');assert.equal(v.model.userData.skin,'rook-guardian');assert.equal(v.duration,1225);assert.equal(h.inspect('activeUltimate.previous'),previous);assert.equal(h.document.body.classList.contains('ultimate-open'),true);
    h.tick(close==='skip'?200:400);assert.ok(renderer.renders.some(r=>r.scene===v.scene));let freed=0;v.action.root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)o.geometry.addEventListener('dispose',()=>freed++);});
    const overlay=h.inspect('activeUltimate.overlay');if(close==='skip')overlay.querySelector('.ultimate-skip').handlers.click();else{const timer=[...h.timers].find(([,job])=>job.ms===1225);assert.ok(timer);timer[1].fn();}
    assert.equal(await promise,true);assert.equal(h.inspect('view'),previous);assert.equal(h.inspect('activeUltimate'),null);assert.ok(freed>0);assert.equal(overlay.isConnected,false);assert.equal(focus.restored,true);assert.equal(h.document.body.classList.contains('ultimate-open'),false);assert.equal(h.inspect('skipUltimate()'),false);assert.equal(h.timers.size,0);
  }
  assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
});

test('wardrobe cinematic previews the selected locked outfit or base and retains signature appearance',async()=>{
  const s=E.createState();s.gold=10000;s.dust=100;s.armory.marks.ashknight=10;const gear=E.forgeGear(s,'signature-ember');E.equipGear(s,gear.id,'ember');const h=harness(s,{wardrobe:true}),before=structuredClone(s);h.source.dataset.modelId='ember';
  for(const skin of ['ember-phoenix','base']){h.source.dataset.skinPreview=skin;h.mount();const preview=h.inspect('view'),promise=h.inspect('playUltimate')('ember',{preview:true});assert.equal(h.inspect('view.model.userData.skin'),skin==='base'?null:skin);assert.equal(h.inspect('view.model.userData.signature'),true);assert.equal(h.inspect('view.spec.costume'),skin==='base'?null:'Phượng hoàng');h.inspect('skipUltimate()');assert.equal(await promise,true);assert.equal(h.inspect('view'),preview);}
  assert.deepEqual(s,before);h.close();
});

test('Auto defaults to brief, persists its setting, and full casts remain available at 2x without touching account data',async()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();assert.equal(h.inspect('briefAutoEnabled()'),true);assert.equal(await h.inspect('playUltimate')('rook',{auto:true}),false);assert.equal(h.inspect('view.mode'),'battle');
  h.inspect('setBriefAutoEnabled(false)');assert.equal(h.storage.get('thap-vo-tan-cinematics-auto'),'full');const promise=h.inspect('playUltimate')('rook',{auto:true,speed:2});assert.equal(h.inspect('view.mode'),'ultimate');h.inspect('skipUltimate()');await promise;
  h.inspect('setCinematicsEnabled(false)');assert.equal(h.storage.get('thap-vo-tan-cinematics'),'off');assert.equal(await h.inspect('playUltimate')('rook'),false);assert.deepEqual(s,before);h.close();
  const reopened=harness(s,{stored:{'thap-vo-tan-cinematics-auto':'full','thap-vo-tan-cinematics':'off'}});assert.equal(reopened.inspect('briefAutoEnabled()'),false);assert.equal(reopened.inspect('cinematicsEnabled()'),false);reopened.close();
});

test('effects-off, reduced motion and hidden pages bypass cinematic allocation and leave a short bounded skill response',async()=>{
  for(const reason of ['effects','motion','hidden']){
    const s=battle();if(reason==='effects')E.setGraphics(s,'effects',false);const h=harness(s);h.mount();if(reason==='motion'){h.motion.matches=true;h.mediaEvents.change();}if(reason==='hidden')h.document.hidden=true;const scene=h.inspect('view');
    assert.equal(await h.inspect('playUltimate')('rook'),false);assert.equal(h.inspect('view'),scene);assert.equal(h.inspect('activeUltimate'),null);
    if(reason!=='hidden'){const timing=h.inspect('battleEffect')('rook',[{target:'enemy0',value:10}],{skill:true});assert.equal(timing.duration,230);assert.equal(timing.impact,0);assert.equal(scene.vfx.items.some(i=>i.kind==='scripted'),false);assert.ok(scene.vfx.items.length<=16);}
    h.close();
  }
  const s=E.createState();E.setGraphics(s,'effects',false);const h=harness(s,{preview:true});h.mount();assert.equal(await h.inspect('playUltimate')('aerin',{preview:true}),false);h.close();
});

test('background, escape, reduced-motion changes and render failures close the cinematic without stranding the previous scene',async()=>{
  for(const cause of ['hidden','pagehide','escape','motion','render']){const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const previous=h.inspect('view'),promise=h.inspect('playUltimate')('rook');assert.equal(h.inspect('view.mode'),'ultimate');
    if(cause==='hidden'){h.document.hidden=true;h.events.visibilitychange();}else if(cause==='pagehide')h.windowEvents.pagehide();else if(cause==='escape')h.events.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});else if(cause==='motion'){h.motion.matches=true;h.mediaEvents.change();}else{h.instances[0].render=()=>{throw new Error('context lost');};h.tick(200);}
    assert.equal(await promise,true);assert.equal(h.inspect('activeUltimate'),null);assert.equal(h.document.body.classList.contains('ultimate-open'),false);if(cause==='render'){assert.equal(h.inspect('failed'),true);assert.equal(h.inspect('view'),null);}else assert.equal(h.inspect('view'),previous);assert.deepEqual(s,before);h.close();
  }
});

test('all 16 brief spells use the real capped VFX pool and preserve committed battle results',()=>{
  for(const id of Object.keys(ultimateData.HERO_ULTIMATES)){const s=E.createState();s.owned[id]||={level:1,copies:0,awaken:0};s.team=[id,...['rook','aerin','lumi','ember'].filter(v=>v!==id).slice(0,2)];E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;s.run.heroes.forEach(h=>h.hp=1);const h=harness(s);h.mount();const events=E.playerAction(s,id,'enemy0',true),before=structuredClone(s),timing=h.inspect('battleEffect')(id,events,{skill:true,speed:2}),v=h.inspect('view');
    assert.ok(v.vfx.items.some(i=>i.kind==='scripted'&&i.hero===id));v.vfx.step(timing.impact/1000+.001);assert.ok(v.vfx.items.length<=v.vfx.capacity);v.vfx.step(10);assert.equal(v.vfx.items.length,0);assert.deepEqual(s,before);assert.equal(h.inspect('failed'),false);h.close();}
});

test('every new cinematic restores the shared battle renderer and releases its scene on skip, timeout or background',async()=>{
  const ids=Object.keys(ultimateData.HERO_ULTIMATES).filter(id=>!['rook','aerin','lumi','ember'].includes(id));
  for(const id of ids)for(const cause of ['skip','timeout','background']){
    const s=E.createState();s.owned[id]={level:1,copies:0,awaken:0};s.team=[id,'rook','aerin'];E.startHunt(s,'colossus',1,42);const before=structuredClone(s),h=harness(s);h.mount();const previous=h.inspect('view'),promise=h.inspect('playUltimate')(id,{speed:2}),cinematic=h.inspect('view');
    assert.equal(cinematic.model.userData.id,id);assert.equal(cinematic.duration,ultimateData.ultimateSpec(id).duration/2);let freed=0;cinematic.action.root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)o.geometry.addEventListener('dispose',()=>freed++);});h.tick(200);
    if(cause==='skip')h.inspect('skipUltimate()');else if(cause==='timeout')[...h.timers.values()][0].fn();else{h.document.hidden=true;h.events.visibilitychange();}
    assert.equal(await promise,true);assert.equal(h.inspect('view'),previous);assert.equal(h.inspect('activeUltimate'),null);assert.equal(h.document.body.classList.contains('ultimate-open'),false);assert.equal(h.timers.size,0);assert.ok(freed>0,id);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
  }
});

test('new heroes follow Auto brief/full policy and reduced effects never allocate an elaborate spell',async()=>{
  for(const id of Object.keys(ultimateData.HERO_ULTIMATES).filter(id=>!['rook','aerin','lumi','ember'].includes(id))){
    const s=E.createState();s.owned[id]={level:1,copies:0,awaken:0};s.team=[id,'rook','aerin'];E.startHunt(s,'colossus',1,42);const h=harness(s);h.mount();const before=structuredClone(s);
    assert.equal(await h.inspect('playUltimate')(id,{auto:true}),false);h.inspect('setBriefAutoEnabled(false)');const promise=h.inspect('playUltimate')(id,{auto:true,speed:2});assert.equal(h.inspect('view.mode'),'ultimate');h.inspect('skipUltimate()');assert.equal(await promise,true);
    E.setGraphics(s,'effects',false);h.mount();assert.equal(await h.inspect('playUltimate')(id),false);const timing=h.inspect('battleEffect')(id,[{target:'enemy0',value:10}],{skill:true});assert.equal(timing.duration,230);assert.equal(h.inspect('view.vfx.items.some(i=>i.kind==="scripted")'),false);assert.equal(h.inspect('failed'),false);assert.deepEqual(s.run,before.run);h.close();
  }
});

test('the wardrobe previews locked outfits and explicit base with separate thumbnail caches and no account writes',()=>{
  const s=E.createState(),before=structuredClone(s),h=harness(s,{wardrobe:true});h.source.dataset.modelId='ember';h.source.dataset.skinPreview='ember-phoenix';h.mount();
  assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.model.userData.skin'),'ember-phoenix');assert.equal(h.inspect('view.mode'),'preview');const dressed=h.inspect('view');
  h.source.dataset.skinPreview='base';h.mount();assert.notEqual(h.inspect('view'),dressed);assert.equal(h.inspect('view.model.userData.skin'),null);
  const thumbnail=h.inspect('thumbnail'),base=thumbnail('hero','ember',false,null),outfit=thumbnail('hero','ember',false,'ember-phoenix');assert.notEqual(outfit,base);assert.equal(thumbnail('hero','ember',false,null),base);assert.equal(thumbnail('hero','ember',false,'ember-phoenix'),outfit);assert.equal(h.inspect('thumbnails.size'),2);
  assert.deepEqual(s,before);h.close();
});

test('battle and lobby scene keys follow worn cosmetics while preserving battle snapshots and shared renderer cleanup',()=>{
  const s=battle();s.best=10;const run=structuredClone(s.run),h=harness(s);h.mount();const initial=h.inspect('view'),renderer=h.instances[0];
  E.equipSkin(s,'rook','rook-guardian');h.mount();const dressed=h.inspect('view');assert.notEqual(dressed,initial);assert.equal(dressed.units.get('rook').model.userData.skin,'rook-guardian');assert.equal(initial.vfx.items.length,0);
  h.surface('lobby');h.mount();assert.equal(h.inspect("view.units[0].model.userData.skin"),'rook-guardian');
  h.surface('preview');h.source.dataset.modelId='rook';h.source.dataset.skinPreview='base';h.mount();assert.equal(h.inspect('view.model.userData.skin'),null);
  delete h.source.dataset.skinPreview;h.mount();assert.equal(h.inspect('view.model.userData.skin'),'rook-guardian');
  h.surface('battle');h.mount();assert.equal(h.inspect("view.units.get('rook').model.userData.skin"),'rook-guardian');E.equipSkin(s,'rook',null);h.mount();assert.equal(h.inspect("view.units.get('rook').model.userData.skin"),null);
  assert.equal(h.instances.length,1);assert.equal(h.instances[0],renderer);assert.equal(h.inspect('failed'),false);assert.deepEqual(s.run,run);h.close();
});

test('costume preview wings reset when effects are disabled and continue respecting system reduced motion',()=>{
  const s=E.createState(),h=harness(s,{wardrobe:true});h.source.dataset.modelId='ember';h.source.dataset.skinPreview='ember-phoenix';h.mount();const first=h.inspect('view.model');models.animateModel(first,3);
  E.setGraphics(s,'effects',false);h.mount();h.tick(100);const model=h.inspect('view.model');for(const part of model.userData.motionParts){assert.deepEqual(part.node.rotation.toArray(),part.rotation.toArray());assert.deepEqual(part.node.position.toArray(),part.position.toArray());}
  E.setGraphics(s,'effects',true);h.mount();h.motion.matches=true;h.mediaEvents.change();h.tick(200);const quiet=h.inspect('view.model');for(const part of quiet.userData.motionParts)assert.deepEqual(part.node.rotation.toArray(),part.rotation.toArray());assert.equal(h.inspect('failed'),false);h.close();
});

test('both tactical layouts place models and boss telegraphs in the same rows within portrait and landscape cameras',()=>{
  for(const front of [1,2]){
    const s=E.createState();E.setFormation(s,front);E.startHunt(s,'colossus',1,42);s.run.battle.bossState.move='quake';const before=structuredClone(s),h=harness(s);h.mount();
    assert.equal(h.inspect('failed'),false);const view=h.inspect('view');
    for(const [i,hero] of s.run.heroes.entries()){
      const unit=view.units.get(hero.id),marker=view.telegraph.markers.get(hero.id),position=E.formationPosition(s.run,i);
      assert.equal(unit.x,position.x);assert.equal(unit.z,position.z);assert.equal(marker.position.x,unit.x);assert.equal(marker.position.z,unit.z);assert.equal(marker.visible,true);
      for(const aspect of [.46,.85,1.6,2.1]){models.fitArenaCamera(view.camera,aspect);view.camera.updateMatrixWorld();for(const y of [0,1.8,3.5]){const point=new models.T.Vector3(unit.x,y,unit.z).project(view.camera);assert.ok(Math.abs(point.x)<.95);assert.ok(Math.abs(point.y)<.95);}}
    }
    assert.deepEqual(s,before);h.close();
  }
});

test('resuming a legacy battle retains its flat positions and a newly snapshotted layout rebuilds the arena',()=>{
  const s=battle();s.run.formation=null;const h=harness(s);h.mount();const old=h.inspect('view');assert.equal(old.units.get('rook').z,3.45);
  s.run.formation={front:2};h.mount();assert.notEqual(h.inspect('view'),old);assert.equal(h.inspect("view.units.get('rook').z"),1.85);assert.equal(h.inspect("view.units.get('lumi').z"),4.6);assert.equal(old.vfx.items.length,0);h.close();
});

test('the real visual controller animates both link casters, respects 2x and leaves the committed battle unchanged',()=>{
  const s=battle();s.run.link.charge=100;const h=harness(s);h.mount();const events=E.linkAction(s,'rook','lumi','enemy0'),before=structuredClone(s),emit=h.inspect('battleEffect');
  const timing=emit('rook',events,{link:{id:E.linkForPair('rook','lumi').id,ids:['rook','lumi']},speed:2});
  assert.equal(timing.duration,600);assert.equal(timing.impact,390);assert.equal(h.inspect("view.units.get('rook').attackSkill"),true);assert.equal(h.inspect("view.units.get('lumi').attackSkill"),true);assert.equal(h.inspect("view.units.get('lumi').attackDuration"),600);
  assert.ok(h.inspect('view.vfx.items.some(i=>i.kind==="projectile")'));h.tick(100);assert.deepEqual(s,before);h.close();
});

test('link effects restore a broken head and fall back to static capped impacts when effects are reduced',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.link.charge=100;s.run.battle.bossState.parts.head.hp=1;
  const h=harness(s);h.mount();const events=E.linkAction(s,'rook','lumi','enemy0','head'),before=structuredClone(s),id=E.linkForPair('rook','lumi').id;
  h.inspect('battleEffect')('rook',events,{link:{id,ids:['rook','lumi']}});assert.equal(h.inspect("view.units.get('enemy0').model.userData.bossPartsVisual.parts.head.broken"),true);
  E.setGraphics(s,'effects',false);h.mount();const timing=h.inspect('battleEffect')('rook',events,{link:{id,ids:['rook','lumi']}});
  assert.equal(timing.duration,230);assert.equal(timing.impact,0);assert.ok(h.inspect('view.vfx.items.length<=16'));assert.equal(h.inspect('view.vfx.items.some(i=>i.kind==="projectile")'),false);assert.equal(h.inspect('failed'),false);
  assert.deepEqual(s.run,before.run);h.close();
});

test('the lobby shares one live renderer, restores after previews and frees old scenes on team and quality changes',()=>{
  const s=E.createState(),before=structuredClone(s),h=harness(s,{home:true});h.mount();assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.mode'),'lobby');
  const renderer=h.instances[0],first=h.inspect('view');assert.equal(renderer.pixelRatio,1.35);assert.equal(first.scene.children.find(o=>o.isDirectionalLight).castShadow,true);
  let freed=0;first.veil.material.addEventListener('dispose',()=>freed++);h.surface('preview');h.mount();assert.equal(h.inspect('view.mode'),'preview');assert.equal(freed,1);
  h.surface('lobby');h.mount();assert.equal(h.inspect('view.mode'),'lobby');assert.equal(h.instances.length,1);assert.deepEqual(s,before);
  const key=h.inspect('view.key');s.team=['ember','aerin','lumi'];h.mount();assert.notEqual(h.inspect('view.key'),key);
  E.setGraphics(s,'quality','low');h.mount();assert.equal(renderer.disposed,true);assert.equal(h.inspect('view.world.weather.visible'),false);assert.equal(h.inspect('view.scene.children.find(o=>o.isDirectionalLight).castShadow'),false);
  const low=h.instances.at(-1);h.tick(100);const count=low.renders.length;h.tick(200);assert.equal(low.renders.length,count);assert.equal(h.inspect('failed'),false);h.close();
});

test('lobby pauses in the background, renders once with reduced motion and never advances a journey',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s,{home:true});h.mount();h.tick(100);const r=h.instances.at(-1),count=r.renders.length;
  h.document.hidden=true;h.tick(200);assert.equal(r.renders.length,count);h.document.hidden=false;h.windowEvents.pageshow();h.tick(300);assert.equal(r.renders.length,count+1);
  h.motion.matches=true;h.mediaEvents.change();h.tick(400);assert.equal(h.inspect('view.ring.rotation.z'),0);const quiet=r.renders.length;h.tick(500);assert.equal(r.renders.length,quiet);
  h.windowEvents.pagehide();h.tick(600);assert.equal(r.renders.length,quiet);h.windowEvents.pageshow();h.tick(700);assert.equal(r.renders.length,quiet+1);assert.deepEqual(s,before);h.close();
});

test('graphics settings rebuild the real arena at selected resolution, shadow budget and effect count, freeing the old scene',()=>{
  const s=battle(),before=structuredClone(s.run),h=harness(s);h.mount();const medium=h.instances.at(-1),first=h.inspect('view');
  assert.equal(medium.pixelRatio,1.35);assert.equal(medium.shadowMap.enabled,true);assert.equal(first.world.seeds.length,24);assert.equal(first.vfx.capacity,96);
  let freed=0;first.world.weather.geometry.addEventListener('dispose',()=>freed++);E.setGraphics(s,'quality','low');h.mount();const low=h.instances.at(-1),lowView=h.inspect('view');
  assert.equal(medium.disposed,true);assert.equal(freed,1);assert.equal(low.options.antialias,false);assert.equal(low.pixelRatio,1);assert.equal(low.shadowMap.enabled,false);assert.equal(lowView.vfx.capacity,16);assert.equal(lowView.vfx.reducedMotion,true);assert.equal(lowView.world.weather.visible,false);assert.ok(lowView.world.leaves.every(o=>!o.visible));assert.equal(lowView.scene.children.find(o=>o.isDirectionalLight).castShadow,false);
  E.setGraphics(s,'quality','high');E.setGraphics(s,'fps',60);h.mount();const high=h.instances.at(-1),view=h.inspect('view'),sun=view.scene.children.find(o=>o.isDirectionalLight);
  assert.equal(low.disposed,true);assert.equal(high.options.antialias,true);assert.equal(high.pixelRatio,2);assert.equal(high.shadowMap.enabled,true);assert.equal(view.world.seeds.length,42);assert.equal(view.world.weather.visible,true);assert.equal(view.vfx.capacity,160);assert.equal(view.vfx.reducedMotion,false);assert.deepEqual(sun.shadow.mapSize.toArray(),[1024,1024]);const count=h.instances.length;h.mount();assert.equal(h.instances.length,count);assert.deepEqual(s.run,before);h.close();
});

test('the animation controller actually caps render calls at 30 and 60 FPS without advancing the game',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const thirty=h.instances.at(-1);for(let n=1;n<=60;n++)h.tick(n*1000/60);assert.equal(thirty.renders.length,30);
  E.setGraphics(s,'fps',60);h.mount();const sixty=h.instances.at(-1);for(let n=1;n<=60;n++)h.tick(n*1000/60);assert.equal(sixty.renders.length,60);assert.deepEqual(s.run,before.run);assert.equal(s.gold,before.gold);
  h.document.hidden=true;h.tick(1100);const count=sixty.renders.length;h.tick(1200);assert.equal(sixty.renders.length,count);h.document.hidden=false;h.windowEvents.pageshow();h.tick(1300);assert.equal(sixty.renders.length,count+1);h.windowEvents.pagehide();h.tick(1400);assert.equal(sixty.renders.length,count+1);h.close();
});

test('reduced effects keep particle limits, skip automatic cinematics and continue to respect OS reduced motion',async()=>{
  const s=battle();E.setGraphics(s,'effects',false);const before=structuredClone(s),h=harness(s);h.mount();const vfx=h.inspect('view.vfx');assert.equal(await h.inspect("playUltimate('aion')"),false);for(let n=0;n<50;n++)h.inspect("battleEffect('rook',[{target:'enemy0',value:1}],{skill:true})");assert.ok(vfx.items.length<=16);assert.ok(vfx.active);h.motion.matches=true;h.mediaEvents.change();assert.equal(vfx.items.length,0);h.motion.matches=false;h.mediaEvents.change();assert.equal(vfx.reducedMotion,true);
  E.setGraphics(s,'effects',true);h.mount();const full=h.inspect('view.vfx');assert.equal(full.reducedMotion,false);h.motion.matches=true;h.mediaEvents.change();assert.equal(full.reducedMotion,true);h.motion.matches=false;h.mediaEvents.change();assert.equal(full.reducedMotion,false);assert.deepEqual(s.run,before.run);h.close();
});

test('preview lighting uses the same shadow switches and quality budget as the battle renderer',()=>{
  const s=E.createState();E.setGraphics(s,'quality','low');const h=harness(s,{preview:true});h.mount();assert.equal(h.inspect('failed'),false);assert.equal(h.inspect('view.mode'),'preview');assert.equal(h.inspect('view.scene.children.find(o=>o.isDirectionalLight).castShadow'),false);assert.equal(h.instances.at(-1).shadowMap.enabled,false);
  E.setGraphics(s,'quality','medium');h.mount();assert.equal(h.inspect('view.scene.children.find(o=>o.isDirectionalLight).castShadow'),true);assert.equal(h.inspect('view.scene.children.find(o=>o.isDirectionalLight).shadow.mapSize.x'),512);h.close();
});

test('real visual controller restores broken armor and telegraphs after quality changes, with part-specific impact points',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.battle.bossState.move='quake';const h=harness(s);h.mount();assert.equal(h.inspect('failed'),false);let v=h.inspect('view'),unit=v.units.get('enemy0');assert.equal(unit.model.userData.bossPartsVisual.root.visible,true);assert.ok([...v.telegraph.markers.values()].every(n=>n.visible));const before=structuredClone(s.run);h.inspect("battleEffect('rook',[{target:'enemy0',value:10,part:{id:'head',damage:10,broken:true}}])");const p=unit.model.userData.bossPartsVisual.parts.head;assert.equal(p.broken,true);assert.ok(v.vfx.items.some(i=>i.kind==='particle'&&i.origin.y>2));assert.deepEqual(s.run,before);
  s.run.battle.bossState.parts.head.hp=0;s.run.battle.bossState.parts.stun=true;E.setGraphics(s,'quality','low');h.mount();v=h.inspect('view');unit=v.units.get('enemy0');assert.ok(unit.model.userData.bossPartsVisual.parts.head.shells.every(s=>!s.node.visible));assert.ok([...v.telegraph.markers.values()].every(n=>!n.visible));assert.equal(unit.model.userData.bossPartsVisual.root.visible,true);assert.equal(h.inspect('failed'),false);h.close();
});


test('weapon evolution updates account previews but retains the battle snapshot until a new journey',()=>{
  const s=E.createState();s.gold=1e7;s.dust=100000;s.armory.essence=100000;s.armory.marks.colossus=100;const g=E.forgeGear(s,'signature-rook');g.level=10;E.equipGear(s,g.id,'rook');E.startHunt(s,'colossus',1,42);const h=harness(s);h.mount();const original=h.inspect('view');assert.equal(original.units.get('rook').model.userData.weaponRarity,'SSR');while(g.rarity!=='EX')E.evolveGear(s,g.id);h.mount();assert.equal(h.inspect('view'),original);assert.equal(h.inspect('view.units.get("rook").model.userData.weaponRarity'),'SSR');E.finishRun(s);E.startHunt(s,'colossus',1,42);h.mount();assert.equal(h.inspect('view.units.get("rook").model.userData.weaponRarity'),'EX');
  const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s);h.inspect('battleEffect')('rook',events);assert.ok(h.inspect('view.vfx.items.some(f=>f.kind==="weaponTrail")'));assert.deepEqual(s,before);h.close();
});

test('a selected ordinary weapon preview overrides the worn signature and changes its thumbnail/studio cache key',()=>{
  const s=E.createState();s.gold=1e7;s.dust=100000;s.armory.essence=100000;for(const id of Object.keys(s.armory.marks))s.armory.marks[id]=100;const g=E.forgeGear(s,'signature-aerin');g.level=10;while(g.rarity!=='EX')E.evolveGear(s,g.id);E.equipGear(s,g.id,'aerin');const h=harness(s,{preview:true});h.mount();assert.equal(h.inspect('view.model.userData.weaponRarity'),'EX');assert.equal(h.inspect('view.model.userData.signature'),true);const first=h.inspect('view'),explicit={dataset:{weaponRarity:'UR'}};h.source.closest=selector=>selector==='[data-weapon-rarity]'?explicit:null;h.mount();assert.notEqual(h.inspect('view'),first);assert.equal(h.inspect('view.model.userData.weaponRarity'),'UR');assert.equal(h.inspect('view.model.userData.signature'),false);explicit.dataset.weaponRarity='LR';h.mount();assert.equal(h.inspect('view.model.userData.weaponRarity'),'LR');h.close();
});


test('real dragon controller mounts each raid phase in ruins on one renderer and keeps gameplay untouched',()=>{
  const s=dragonAccount();E.startRaid(s,1,42,DRAGON);const h=harness(s);let freed=0;
  for(const stage of [0,1,2]){
    if(stage>0){const replacement=reachStage(dragonAccount(),stage);s.run=replacement.run;}
    const before=structuredClone(s);h.mount();h.tick(200+stage*100);const v=h.inspect('view'),boss=v.units.get('enemy0').model;assert.equal(v.world.data.id,'ruins');assert.equal(boss.userData.id,DRAGON);assert.equal(boss.userData.dragon.airborne,stage===0);assert.equal(boss.userData.bossVisual.barrier.visible,stage===1);assert.equal(boss.userData.bossVisual.phaseRoot.visible,stage===2);assert.equal(h.instances.length,1);assert.equal(h.inspect('failed'),false);assert.deepEqual(s,before);v.world.weather.geometry.addEventListener('dispose',()=>freed++);
  }
  assert.equal(freed,2);h.close();assert.equal(freed,3);
});

test('real controller follows wing/core breaks and turns off storm motion and weather under reduced effects',()=>{
  const s=reachStage(dragonAccount(),0);for(const hero of s.run.heroes){hero.atk=20;s.run.raid.teams[0].heroes.find(h=>h.id===hero.id).atk=20;}const h=harness(s);h.mount();const m=h.inspect('view.units.get("enemy0").model');s.run.battle.bossState.parts.arms.hp=1;E.playerAction(s,'rook','enemy0',false,'arms');h.mount();h.tick(200);assert.equal(m.userData.dragon.airborne,false);assert.equal(m.userData.body.position.y,0);assert.equal(h.inspect('failed'),false);
  s.settings.graphics.effects=false;h.mount();h.tick(400);assert.equal(h.inspect('view.world.weather.visible'),false);assert.ok(h.inspect('view.world.motion').filter(p=>p.kind==='lightning').every(p=>!p.node.visible));h.close();
});


test('real visual controller emits a bounded void burst for direct attacks and links without touching gameplay',()=>{
  for(const link of [null,{id:'earth-wind',ids:['rook','aerin']}]){const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const timing=h.inspect('battleEffect')('rook',[{target:'enemy0',value:50,voidBurst:20,voidMarks:0}],{link});assert.ok(timing.duration>0);assert.ok(h.inspect('view.vfx.items').some(e=>e.kind==='pulse'&&e.radius===1.2));assert.ok(h.inspect('view.vfx.items.length')<=96);assert.deepEqual(s,before);h.close();}
});

// Drive the controller clock rather than waiting on real playback timers.
function motionClock(h){let frame=0;return seconds=>{h.inspect('clock').getElapsedTime=()=>seconds;h.tick(frame+=1000);};}

test('sustained low FPS lowers resolution, shadows and particles in place without resetting a fight',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const arena=h.inspect('view'),r=h.instances[0],rig=arena.cameraRig,model=arena.units.get('rook').model;
  for(let now=90;now<=11000;now+=90)h.tick(now);
  assert.equal(h.inspect('failed'),false);assert.equal(h.instances.length,1);assert.equal(h.inspect('view'),arena);assert.equal(arena.cameraRig,rig);assert.equal(arena.units.get('rook').model,model);
  assert.ok(h.inspect('framePerformance.level')>=2);assert.ok(r.pixelRatio<1.35);assert.equal(r.shadowMap.enabled,false);assert.ok(arena.vfx.capacity<96);assert.ok(arena.vfx.density<1);assert.equal(arena.world.weather.visible,false);assert.ok(arena.world.leaves.every(leaf=>!leaf.visible));
  h.inspect('setPerformanceSetting')( 'automatic',false);assert.equal(r.pixelRatio,1.35);assert.equal(r.shadowMap.enabled,true);assert.equal(arena.vfx.capacity,96);assert.equal(arena.world.weather.visible,true);assert.equal(h.inspect('view'),arena);assert.deepEqual(s,before);h.close();
});

test('a settings dialog stops the scene behind it, preserves the arena and resumes with a fresh FPS sample',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();h.tick(100);const arena=h.inspect('view'),r=h.instances[0];h.menu(true);h.mount();const count=r.renders.length;
  h.tick(10000);assert.equal(r.renders.length,count);assert.equal(h.inspect('menuPaused'),true);assert.equal(h.inspect('modelPreloader.active'),false);assert.equal(h.inspect('view'),arena);
  h.menu(false);h.mount();h.tick(20000);assert.equal(r.renders.length,count+1);assert.equal(h.inspect('framePerformance.level'),0);assert.equal(h.inspect('framePerformance.fps'),null);assert.equal(h.instances.length,1);assert.deepEqual(s,before);h.close();
});

test('hero previews and their ultimates remain live inside a modal while squad prewarming stays paused',async()=>{
  const s=battle(),h=harness(s,{preview:true});h.mount();h.tick(100);assert.equal(h.inspect('menuPaused'),false);assert.equal(h.inspect('modelPreloader.active'),false);
  const r=h.instances[0],count=r.renders.length;h.tick(200);assert.equal(r.renders.length,count+1);const promise=h.inspect('playUltimate')('aerin',{preview:true});h.tick(300);assert.equal(h.inspect('view.mode'),'ultimate');h.inspect('skipUltimate()');assert.equal(await promise,true);assert.equal(h.inspect('view.mode'),'preview');h.close();
});

test('FPS display is optional, updates from measured frames and disappears in menus, background and WebGL fallback',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s,{stored:{'thap-vo-tan-show-fps':'on'}});h.mount();assert.match(h.inspect('fpsMeter.textContent'),/— FPS/);
  for(let n=1;n<=180;n++)h.tick(n*1000/60);assert.match(h.inspect('fpsMeter.textContent'),/^30 FPS/);
  h.menu(true);h.mount();assert.equal(h.inspect('fpsMeter'),null);h.menu(false);h.mount();assert.match(h.inspect('fpsMeter.textContent'),/— FPS/);
  h.document.hidden=true;h.events.visibilitychange();assert.equal(h.inspect('fpsMeter'),null);h.document.hidden=false;h.events.visibilitychange();assert.match(h.inspect('fpsMeter.textContent'),/— FPS/);
  h.inspect('setPerformanceSetting')('showFps',false);assert.equal(h.inspect('fpsMeter'),null);assert.equal(h.storage.get('thap-vo-tan-show-fps'),'off');
  h.inspect('setPerformanceSetting')('showFps',true);h.instances[0].render=()=>{throw Error('lost context');};h.tick(4000);assert.equal(h.inspect('failed'),true);assert.equal(h.inspect('fpsMeter'),null);assert.equal(h.idleJobs.size,0);assert.deepEqual(s,before);h.close();
});

test('model prewarming uses distinct instances, runs in idle slices and stops during actions, menus and background',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();const arena=h.inspect('view'),r=h.instances[0];assert.equal(r.compiled.length,0);assert.equal(h.idleJobs.size,1);
  h.idle();assert.equal(r.compiled.length,1);const prepared=r.compiled[0].scene.children.find(node=>node.userData.id==='rook');assert.ok(prepared);assert.notEqual(prepared,arena.units.get('rook').model);
  h.document.hidden=true;h.events.visibilitychange();assert.equal(h.idleJobs.size,0);assert.equal(h.idle(),false);h.document.hidden=false;h.events.visibilitychange();h.idle();assert.equal(r.compiled.length,2);
  h.inspect("battleEffect('rook',[{target:'enemy0',value:1}])");assert.equal(h.idleJobs.size,0);h.mount();assert.equal(h.idleJobs.size,1);h.menu(true);h.mount();assert.equal(h.idleJobs.size,0);assert.deepEqual(s,before);h.close();
});

test('thumbnail hydration processes long lists in bounded idle batches and cancels work while backgrounded',()=>{
  const s=E.createState(),h=harness(s,{home:true}),images=[];
  const svgs=Array.from({length:38},(_,i)=>({isConnected:true,dataset:{modelType:'hero',modelId:s.team[i%3]},closest:()=>null,getAttribute:()=>'',replaceWith(img){this.isConnected=false;images.push(img);}}));
  h.document.querySelectorAll=selector=>selector==='svg[data-model-type]'?svgs:[];h.mount();assert.equal(images.length,0);
  // Both queues have at most one scheduled idle callback; each callback does one job.
  for(let i=0;i<5;i++)h.idle();assert.ok(images.length>0&&images.length<5);
  h.document.hidden=true;h.events.visibilitychange();const count=images.length;assert.equal(h.idleJobs.size,0);h.idle();assert.equal(images.length,count);
  h.document.hidden=false;h.events.visibilitychange();let guard=0;while(h.idleJobs.size&&guard++<100)h.idle();assert.equal(images.length,38);assert.ok(h.inspect('thumbnails.size')<=96);assert.equal(h.inspect('failed'),false);h.close();
});

test('adaptive effect budgets release excess objects and reduce new particles while keeping contact cues',()=>{
  const scene=new models.T.Scene(),vfx=new effects.CombatEffects3D(scene),point=new models.T.Vector3();vfx.particles(point,'#ffbb88',0,{count:90});assert.equal(vfx.items.length,90);
  let released=0;vfx.items[0].node.addEventListener('removed',()=>released++);vfx.setBudget({capacity:24,density:.35});assert.equal(vfx.items.length,24);assert.equal(released,1);vfx.clear();
  vfx.impact(point,'#ffbb88',0,{skill:true,rank:6});assert.ok(vfx.items.filter(item=>item.kind==='particle').length<=9);assert.ok(vfx.items.some(item=>item.kind==='pulse'));assert.ok(vfx.items.length<=24);vfx.clear();
});

test('30 and 60 FPS caps stay accurate on 90 and 120 Hz displays without false automatic downgrades',()=>{
  for(const refresh of [90,120])for(const fps of [30,60]){const s=battle();E.setGraphics(s,'fps',fps);const h=harness(s);h.mount();for(let n=1;n<=refresh*5;n++)h.tick(n*1000/refresh);assert.ok(Math.abs(h.instances[0].renders.length-fps*5)<=1);assert.ok(Math.abs(h.inspect('framePerformance.fps')-fps)<1);assert.equal(h.inspect('framePerformance.level'),0);h.close();}
});

test('a pending shader compile is released after context loss and does not schedule work on the disposed renderer',async()=>{
  const s=battle(),h=harness(s);h.mount();const r=h.instances[0];let resolve,prepared;r.compileAsync=scene=>{prepared=scene;return new Promise(done=>resolve=done);};h.idle();assert.equal(h.inspect('modelPreloader.running'),true);
  let freed=0;prepared.traverse(node=>{if(node.geometry&&!node.geometry.userData.shared3d)node.geometry.addEventListener('dispose',()=>freed++);});
  h.inspect('fallback()');assert.equal(h.idleJobs.size,0);resolve();await new Promise(done=>setImmediate(done));assert.ok(freed>0);assert.equal(h.inspect('modelPreloader.running'),false);assert.equal(h.idleJobs.size,0);assert.equal(h.inspect('warmedModels.size'),0);assert.equal(r.disposed,true);h.close();
});

test('a real lethal enemy turn falls at visual contact, survives rerenders and excludes the body from pointer selection',()=>{
  const s=battle();s.run.heroes[0].hp=1;s.run.heroes[0].def=0;for(const e of s.run.battle.enemies.slice(1))e.freeze=1;
  const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const v=h.inspect('view'),u=v.units.get('rook');
  const events=E.enemyTurn(s),before=structuredClone(s);assert.equal(s.run.heroes[0].hp,0);
  const timing=h.inspect('battleEffect')(null,events,{enemy:true,speed:2}),impact=timing.impact/1000;
  assert.equal(u.alive,false);assert.equal(u.fallAt,impact);assert.equal(u.lifeDuration,.41);
  assert.ok(timing.duration>=timing.impact+410);
  h.mount();assert.equal(h.inspect('view'),v);assert.equal(u.fallAt,impact);assert.equal(u.ring.visible,false);assert.equal(u.selected,false);
  tick(impact-.05);assert.equal(u.model.userData.heroRig.hips.rotation.x,0);assert.equal(u.model.position.x,u.x);assert.equal(u.model.position.z,u.z);
  tick(impact+.41*.6);assert.ok(u.model.userData.heroRig.hips.rotation.x>0&&u.model.userData.heroRig.hips.rotation.x<1.46);
  tick(impact+1);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);assert.equal(u.model.visible,true);assert.equal(u.bubble.visible,false);
  h.inspect('T.Raycaster=class {setFromCamera(){} intersectObjects(objects){globalThis.pointerCandidates=objects.map(m=>m.userData.unitId);return [];}}');
  const canvas=h.instances[0].domElement;canvas.onpointerdown({clientX:200,clientY:200});canvas.onpointerup({clientX:200,clientY:200});
  assert.equal(h.inspect('pointerCandidates.includes("rook")'),false);assert.equal(h.inspect('pointerCandidates.includes("aerin")'),true);
  assert.deepEqual(s,before);assert.equal(h.inspect('failed'),false);h.close();
});

test('Lumi revives an already fallen saved hero only at healing contact and the controller returns all joints to idle',()=>{
  const s=battle();s.run.heroes[0].hp=0;s.run.heroes.find(a=>a.id==='lumi').energy=100;
  const h=harness(s),tick=motionClock(h);tick(10);h.mount();tick(10);const u=h.inspect('view.units.get("rook")');
  assert.equal(u.model.visible,true);assert.equal(u.fallAt,-Infinity);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);
  tick(20);const events=E.playerAction(s,'lumi','enemy0',true),before=structuredClone(s),timing=h.inspect('battleEffect')('lumi',events,{skill:true});
  assert.ok(events.some(e=>e.target==='rook'&&e.heal&&e.value>0));const contact=20+timing.impact/1000;
  assert.ok(timing.duration>=timing.impact+574);
  assert.equal(u.alive,true);assert.equal(u.reviveAt,contact);h.mount();assert.equal(u.reviveAt,contact);assert.equal(u.ring.visible,true);
  tick(contact-.05);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);
  tick(contact+.25);assert.ok(u.model.userData.heroRig.hips.rotation.x>0&&u.model.userData.heroRig.hips.rotation.x<1.46);
  tick(contact+.8);assert.equal(u.model.userData.heroRig.hips.rotation.x,0);assert.equal(u.model.userData.ornaments.visible,true);assert.equal(u.model.scale.x,u.scale);
  assert.deepEqual(s,before);assert.equal(h.inspect('failed'),false);h.close();
});

test('rebuilding graphics preserves loaded deaths and reduced effects or system motion preference shows still death and revival poses',()=>{
  for(const quiet of ['effects','system']){
    const s=battle();s.run.heroes[0].hp=0;s.run.heroes.find(a=>a.id==='lumi').energy=100;
    const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const original=h.inspect('view');
    E.setGraphics(s,'quality','low');if(quiet==='effects')E.setGraphics(s,'effects',false);else{h.motion.matches=true;h.mediaEvents.change();}
    h.mount();tick(1);const u=h.inspect('view.units.get("rook")');assert.notEqual(h.inspect('view'),original);assert.equal(u.fallAt,-Infinity);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);
    const snapshot=()=>u.model.userData.heroRig.rest.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray()]);const fallen=snapshot();tick(4);assert.deepEqual(snapshot(),fallen);
    const events=E.playerAction(s,'lumi','enemy0',true),before=structuredClone(s),timing=h.inspect('battleEffect')('lumi',events,{skill:true,speed:2});assert.equal(timing.impact,0);
    h.mount();tick(5);assert.equal(u.model.userData.heroRig.hips.rotation.x,0);assert.equal(u.model.userData.ornaments.visible,true);const upright=snapshot();tick(9);assert.deepEqual(snapshot(),upright);assert.deepEqual(s,before);h.close();
  }
});

test('the battle frame keeps full body attack joints after idle updates and freezes all joints when effects stop',()=>{
  const s=battle(),h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);
  const events=E.playerAction(s,'aerin','enemy0'),before=structuredClone(s),timing=h.inspect('battleEffect')('aerin',events),u=h.inspect('view.units.get("aerin")');
  tick(timing.duration/1000*.25);assert.ok(u.model.userData.heroRig.waist.rotation.y<-.1);assert.ok(u.model.userData.heroRig.bowString.geometry.attributes.position.getZ(1)<-.3);
  assert.ok(u.model.userData.heroRig.legs.some(l=>l.knee.rotation.x>.04));assert.ok(u.model.userData.combatRig.some(a=>a.node.rotation.x<-.5));
  h.motion.matches=true;h.mediaEvents.change();tick(2);assert.equal(u.model.userData.heroRig.bowString.geometry.attributes.position.getZ(1),0);assert.equal(u.model.userData.heroRig.waist.rotation.y,0);
  assert.ok(u.model.userData.heroRig.legs.every(l=>l.knee.rotation.x===0));assert.deepEqual(s,before);h.close();
});

test('the final lethal turn keeps its arena until all three heroes finish falling before the result transition',()=>{
  const s=battle();for(const hero of s.run.heroes){hero.hp=1;hero.def=0;}
  s.run.battle.enemies.push({...structuredClone(s.run.battle.enemies[0]),id:'enemy2'});
  const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const arena=h.inspect('view');
  const events=E.enemyTurn(s),before=structuredClone(s);assert.equal(s.run.phase,'result');assert.ok(s.run.heroes.every(hero=>hero.hp===0));
  const timing=h.inspect('battleEffect')(null,events,{enemy:true});assert.equal(h.inspect('view'),arena);assert.ok(timing.duration>=timing.impact+820);
  tick(timing.duration/1000);for(const hero of s.run.heroes){const u=arena.units.get(hero.id);assert.equal(u.model.visible,true);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);}
  h.mount();assert.equal(h.inspect('view'),null);assert.deepEqual(s,before);assert.equal(h.inspect('failed'),false);h.close();
});

const cameraPose=c=>[...c.position.toArray(),...c.quaternion.toArray(),c.zoom,...c.projectionMatrix.toArray()];

test('a real critical attack pans and zooms the battle camera, then returns before playback gives back control',()=>{
  const s=battle();s.run.buffs=Array(8).fill('crit');const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);
  const v=h.inspect('view'),base=cameraPose(v.camera),events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s);assert.ok(events.some(e=>e.crit));
  const timing=h.inspect('battleEffect')('rook',events);assert.equal(v.cameraRig.shot.critical,true);assert.equal(timing.duration,combat.combatTiming('shield').duration);
  tick(timing.impact/1000);assert.notDeepEqual(cameraPose(v.camera),base);assert.ok(v.camera.zoom>1);
  tick(timing.duration/1000);assert.deepEqual(cameraPose(v.camera),base);assert.equal(v.cameraRig.shot,null);assert.deepEqual(s,before);h.close();
});

test('a real boss defeat uses the finisher shot for humanoid bosses and releases it on the result transition',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;
  const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const v=h.inspect('view'),base=cameraPose(v.camera);
  const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s),timing=h.inspect('battleEffect')('rook',events);assert.equal(v.cameraRig.shot.finisher,true);
  tick(timing.impact/1000);assert.ok(v.camera.zoom>1);tick(timing.duration/1000);assert.deepEqual(cameraPose(v.camera),base);
  h.surface('victory');h.mount();assert.equal(h.inspect('view.mode'),'victory');assert.equal(v.cameraRig.shot,null);assert.deepEqual(s,before);h.close();
});

test('moving battle labels and actual ray picking use the current animated camera and actor positions',()=>{
  const s=battle(),h=harness(s),tick=motionClock(h);tick(0);h.mount();const v=h.inspect('view'),labels=new Map();
  for(const [id] of v.units)labels.set(`[data-unit="${id}"]`,{style:{},click(){this.clicked=true;}});v.host.querySelector=selector=>labels.get(selector)||null;
  const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s),timing=h.inspect('battleEffect')('rook',events);tick(timing.duration/1000*.4);
  for(const [id,u] of v.units){if(id==='pet')continue;const p=new models.T.Vector3(u.model.position.x,.17,u.model.position.z).project(v.camera),label=labels.get(`[data-unit="${id}"]`);assert.ok(Math.abs(parseFloat(label.style.left)-(p.x*.5+.5)*100)<1e-9);assert.ok(Math.abs(parseFloat(label.style.top)-(-p.y*.5+.5)*100)<1e-9);}
  const u=v.units.get('aerin'),p=u.model.position.clone().add(new models.T.Vector3(0,1.8,0)).project(v.camera),canvas=h.instances[0].domElement;
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:400,height:470});const touch={clientX:(p.x*.5+.5)*400,clientY:(-p.y*.5+.5)*470};canvas.onpointerdown(touch);canvas.onpointerup(touch);assert.equal(labels.get('[data-unit="aerin"]').clicked,true);
  h.document.hidden=true;h.events.visibilitychange();h.document.hidden=false;h.events.visibilitychange();tick(2);
  for(const [id,u] of v.units){if(id==='pet')continue;const p=new models.T.Vector3(u.model.position.x,.17,u.model.position.z).project(v.camera),label=labels.get(`[data-unit="${id}"]`);assert.ok(Math.abs(parseFloat(label.style.left)-(p.x*.5+.5)*100)<1e-9);assert.ok(Math.abs(parseFloat(label.style.top)-(-p.y*.5+.5)*100)<1e-9);}
  assert.deepEqual(s,before);h.close();
});

test('camera and screen-shake preferences persist independently without changing saves, graphics or the haptics setting',()=>{
  const s=battle(),before=structuredClone(s),h=harness(s);h.mount();assert.equal(h.inspect('battleCameraEnabled()'),true);assert.equal(h.inspect('cameraShakeEnabled()'),true);
  h.inspect('setCameraShakeEnabled(false)');h.inspect('setBattleCameraEnabled(false)');assert.equal(h.storage.get('thap-vo-tan-camera-shake'),'off');assert.equal(h.storage.get('thap-vo-tan-camera-motion'),'off');assert.equal(h.storage.has('thap-vo-tan-haptics'),false);
  const stored=Object.fromEntries(h.storage);h.close();const loaded=harness(s,{stored});loaded.mount();assert.equal(loaded.inspect('battleCameraEnabled()'),false);assert.equal(loaded.inspect('cameraShakeEnabled()'),false);
  loaded.inspect('setBattleCameraEnabled(true)');assert.equal(loaded.inspect('cameraShakeEnabled()'),false);
  loaded.inspect('localStorage.setItem=()=>{throw new Error("storage unavailable")};setCameraShakeEnabled(true);setBattleCameraEnabled(false)');assert.equal(loaded.inspect('cameraShakeEnabled()'),true);assert.equal(loaded.inspect('battleCameraEnabled()'),false);assert.deepEqual(s,before);loaded.close();
});

test('backgrounding, resizing, reduced motion and disabling the camera cancel the current shot without replay or save edits',()=>{
  for(const reason of ['hidden','pagehide','resize','system','disabled']){
    const s=battle(),h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const v=h.inspect('view'),base=cameraPose(v.camera);
    const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s);h.inspect('battleEffect')('rook',events);tick(.3);assert.notDeepEqual(cameraPose(v.camera),base);
    if(reason==='hidden'){h.document.hidden=true;h.events.visibilitychange();}else if(reason==='pagehide')h.windowEvents.pagehide();else if(reason==='resize')h.inspect('resize()');else if(reason==='system'){h.motion.matches=true;h.mediaEvents.change();}else h.inspect('setBattleCameraEnabled(false)');
    assert.equal(v.cameraRig.shot,null);assert.deepEqual(cameraPose(v.camera),base);h.document.hidden=false;h.motion.matches=false;h.events.visibilitychange();h.windowEvents.pageshow();tick(.6);assert.deepEqual(cameraPose(v.camera),base);assert.deepEqual(s,before);h.close();
  }
});

test('effects-off and system reduced motion suppress camera shots, including links, while linked actors share one shot normally',()=>{
  for(const quiet of ['none','effects','system']){
    const s=battle();s.run.link.charge=100;if(quiet==='effects')E.setGraphics(s,'effects',false);const h=harness(s),tick=motionClock(h);tick(0);h.mount();if(quiet==='system'){h.motion.matches=true;h.mediaEvents.change();}
    const v=h.inspect('view'),base=cameraPose(v.camera),events=E.linkAction(s,'rook','lumi','enemy0'),before=structuredClone(s),link={id:E.linkForPair('rook','lumi').id,ids:['rook','lumi']};
    const timing=h.inspect('battleEffect')('rook',events,{link});if(quiet==='none'){assert.equal(v.cameraRig.shot.casters.length,2);assert.equal(v.cameraRig.shot.duration,timing.duration/1000);tick(.4);assert.notDeepEqual(cameraPose(v.camera),base);}else{assert.equal(v.cameraRig.shot,null);tick(.4);assert.deepEqual(cameraPose(v.camera),base);}
    tick(2);assert.deepEqual(cameraPose(v.camera),base);assert.deepEqual(s,before);h.close();
  }
});

test('opening and skipping a cinematic restores the battle overview without reviving a previous camera shot',async()=>{
  const s=battle(),h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const v=h.inspect('view'),base=cameraPose(v.camera);
  const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s);h.inspect('battleEffect')('rook',events);tick(.3);assert.notDeepEqual(cameraPose(v.camera),base);
  const promise=h.inspect('playUltimate')('rook');assert.equal(h.inspect('view.mode'),'ultimate');assert.equal(v.cameraRig.shot,null);assert.deepEqual(cameraPose(v.camera),base);
  h.inspect('skipUltimate()');assert.equal(await promise,true);assert.equal(h.inspect('view'),v);tick(.5);assert.deepEqual(cameraPose(v.camera),base);assert.deepEqual(s,before);h.close();
});

test('a real critical contact holds actors, effects and camera briefly but finishes on the original playback boundary',()=>{
  const s=battle();s.run.buffs=Array(8).fill('crit');const h=harness(s),tick=motionClock(h);tick(0);h.mount();tick(0);const v=h.inspect('view');
  const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s),timing=h.inspect('battleEffect')('rook',events);assert.ok(events.some(e=>e.crit));assert.equal(timing.duration,combat.combatTiming('shield').duration);assert.ok(v.impactBeat.hold>0);
  const pose=()=>{const out=[];for(const u of v.units.values())u.model.traverse(n=>out.push(...n.position.toArray(),...n.quaternion.toArray()));return out.concat(cameraPose(v.camera));};
  const contact=timing.impact/1000;tick(contact);const held=pose();tick(contact+v.impactBeat.hold*.75);pose().forEach((n,i)=>assert.ok(Math.abs(n-held[i])<1e-12));tick(contact+v.impactBeat.hold+.1);assert.notDeepEqual(pose(),held);
  tick(timing.duration/1000);assert.equal(v.cameraRig.shot,null);assert.ok(v.units.get('rook').model.position.distanceTo(new models.T.Vector3(v.units.get('rook').x,.09,v.units.get('rook').z))<.2);assert.deepEqual(s,before);h.close();
});

test('real sword skills emit elemental contact and metal sparks while healing and quiet settings suppress the new feedback',()=>{
  for(const mode of ['normal','effects','system','heal']){
    const s=battle();s.owned.kael={level:1,copies:0,awaken:0};s.run=null;E.setTeamSlot(s,'kael',0);E.startHunt(s,'colossus',1,42);const id=mode==='heal'?'lumi':'kael';s.run.heroes.find(h=>h.id===id).energy=100;if(mode==='heal')s.run.heroes[0].hp=1;if(mode==='effects')E.setGraphics(s,'effects',false);
    const h=harness(s),tick=motionClock(h);tick(0);h.mount();if(mode==='system'){h.motion.matches=true;h.mediaEvents.change();}const events=E.playerAction(s,id,'enemy0',true),before=structuredClone(s),timing=h.inspect('battleEffect')(id,events,{skill:true,speed:2}),v=h.inspect('view');
    const additions=v.vfx.items.filter(f=>['elementContact','metalSpark','meleeTrail'].includes(f.kind));
    if(mode==='normal'){assert.ok(additions.some(f=>f.kind==='elementContact'&&f.element==='Hỏa'));assert.ok(additions.some(f=>f.kind==='metalSpark'));assert.ok(additions.some(f=>f.kind==='meleeTrail'));assert.ok(v.impactBeat);tick(timing.impact/1000);assert.ok(additions.some(f=>f.node.visible));}
    else{assert.equal(additions.length,0);assert.equal(v.impactBeat,null);}tick(3);assert.equal(v.vfx.active,false);assert.deepEqual(s,before);h.close();
  }
});

test('background, resize, system motion and ultimate transitions discard contact holds without replay',async()=>{
  for(const reason of ['hidden','pagehide','resize','system','ultimate']){
    const s=battle();s.run.buffs=Array(8).fill('crit');const h=harness(s),tick=motionClock(h);tick(0);h.mount();const events=E.playerAction(s,'rook','enemy0'),before=structuredClone(s),timing=h.inspect('battleEffect')('rook',events);tick(timing.impact/1000+.01);const v=h.inspect('view');assert.ok(v.impactBeat);
    if(reason==='hidden'){h.document.hidden=true;h.events.visibilitychange();}else if(reason==='pagehide')h.windowEvents.pagehide();else if(reason==='resize')h.inspect('resize()');else if(reason==='system'){h.motion.matches=true;h.mediaEvents.change();}else{const promise=h.inspect('playUltimate')('rook');h.inspect('skipUltimate()');await promise;}
    assert.equal(v.impactBeat,null);h.document.hidden=false;h.motion.matches=false;h.events.visibilitychange();h.windowEvents.pageshow();tick(3);assert.equal(v.impactBeat,null);assert.deepEqual(s,before);h.close();
  }
});


for(const trait of ['rage','guard','rebirth'])test(`elite ${trait} controller keeps its scene, reflects mechanics and respects reduced effects`,()=>{
  const s=eliteEncounter(trait),e=eliteChampion(s),before=structuredClone(s),h=harness(s);h.mount();h.tick(200);
  const v=h.inspect('view'),u=v.units.get(e.id),visual=u.model.userData.eliteVisual;
  assert.equal(h.inspect('failed'),false);assert.equal(visual.trait,trait);assert.equal(visual.aura.visible,true);assert.ok(visual.armor.children.length>0);assert.equal(visual.root.visible,true);assert.deepEqual(s,before);
  if(trait==='guard'){e.shield=0;h.mount();assert.equal(h.inspect('view'),v);assert.equal(visual.shield.visible,false);}
  if(trait==='rage'){e.hp=1;h.mount();h.tick(400);assert.ok(visual.power>.5);assert.ok(visual.ring.scale.x>1);}
  if(trait==='rebirth'){e.elite.revived=true;h.mount();assert.equal(visual.revived,true);}
  const after=structuredClone(s);E.setGraphics(s,'effects',false);h.mount();h.tick(600);let quietVisual=h.inspect('view').units.get(e.id).model.userData.eliteVisual;assert.equal(quietVisual.aura.visible,false);assert.equal(quietVisual.armor.visible,true);assert.equal(quietVisual.root.visible,true);
  E.setGraphics(s,'effects',true);h.motion.matches=true;h.mediaEvents.change();h.mount();h.tick(800);quietVisual=h.inspect('view').units.get(e.id).model.userData.eliteVisual;assert.equal(quietVisual.aura.visible,false);assert.equal(quietVisual.motes.rotation.y,0);assert.equal(quietVisual.root.visible,true);assert.equal(h.instances.filter(r=>!r.disposed).length,1);assert.deepEqual(s.run,after.run);
  const renderer=h.instances.at(-1),renders=renderer.renders.length;h.document.hidden=true;h.events.visibilitychange();h.tick(1000);assert.equal(renderer.renders.length,renders);assert.deepEqual(s.run,after.run);h.close();
});

test('elite scene keys include the trait and release unique aura resources on replacement',()=>{
  const s=eliteEncounter('guard'),e=eliteChampion(s),h=harness(s);h.mount();const old=h.inspect('view'),visual=old.units.get(e.id).model.userData.eliteVisual;let geometry=0,material=0;
  visual.ring.geometry.addEventListener('dispose',()=>geometry++);visual.ring.material.addEventListener('dispose',()=>material++);
  e.elite.trait='rage';e.shield=0;h.mount();assert.notEqual(h.inspect('view'),old);assert.equal(geometry,1);assert.equal(material,1);assert.equal(h.instances.length,1);assert.equal(h.inspect('failed'),false);h.close();
});

test('elite adornments animate per instance without changing shared enemy geometry or materials',()=>{
  const e=eliteChampion(eliteEncounter('rebirth')),a=models.enemyModel(e),b=models.enemyModel(e),plain=models.enemyModel({...e,elite:undefined});
  const av=elites3d.attachEliteVisual(a,e),bv=elites3d.attachEliteVisual(b,e),shared=[];plain.traverse(o=>{if(o.isMesh)shared.push({node:o,color:o.material.color.getHex(),glow:o.material.emissiveIntensity});});
  assert.notEqual(av.ring.material,bv.ring.material);assert.equal(elites3d.attachEliteVisual(a,e),av);elites3d.syncEliteVisual(a,{...e,elite:{trait:'rebirth',revived:true}});elites3d.animateEliteVisual(a,4);elites3d.animateEliteVisual(b,1);
  assert.equal(bv.revived,false);assert.notEqual(av.crest.material,bv.crest.material);assert.notEqual(av.motes.rotation.y,bv.motes.rotation.y);
  for(const item of shared){assert.equal(item.node.material.color.getHex(),item.color);assert.equal(item.node.material.emissiveIntensity,item.glow);}
  for(const model of [a,b,plain]){model.updateMatrixWorld(true);model.traverse(o=>{if(o.isMesh){assert.ok([...o.matrixWorld.elements].every(Number.isFinite));assert.ok(o.geometry.attributes.position.count>0);}});models.disposeScene(model);}
});

test('revival and broken-shield events emit bounded feedback in regular and linked playback',()=>{
  for(const linked of [false,true]){
    const s=eliteEncounter('rebirth'),e=eliteChampion(s),h=harness(s);h.mount();e.hp=1;for(const actor of s.run.heroes)actor.atk=100000;
    const events=linked?(s.run.link.charge=100,E.linkAction(s,'rook','aerin',e.id)):E.playerAction(s,'rook',e.id),before=structuredClone(s),options=linked?{link:{ids:['rook','aerin'],id:E.linkForPair('rook','aerin').id}}:{};
    const timing=h.inspect('battleEffect')('rook',events,options);assert.ok(events.some(ev=>ev.eliteRevive));assert.ok(timing.duration>0);const v=h.inspect('view');assert.ok(v.vfx.items.length>0);assert.ok(v.vfx.items.length<=v.vfx.capacity);h.tick(500);h.mount();assert.equal(h.inspect('view'),v);assert.equal(v.units.get(e.id).model.userData.eliteVisual.revived,true);assert.deepEqual(s,before);h.close();
  }
});
