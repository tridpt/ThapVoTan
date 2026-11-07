import {seasonAuraActive} from './season.mjs';
import {anomalyForFloor} from './anomalies.mjs';
import {T,material,mesh,ball,cylinder,makeModel,heroModel,enemyModel,creatureModel,disposeScene,arenaCamera,fitArenaCamera,animateModel} from './models3d.mjs';
import {CombatEffects3D} from './effects3d.mjs';
import {HERO,RARITY} from './data.mjs';
import {PET} from './adventure-data.mjs';
import {gearLoadout} from './armory.mjs';
import {combatTiming,animateFighter,syncFighterState} from './combat3d.mjs';
import {createUltimateScene,animateUltimate,ultimateMarkup,ULTIMATES} from './ultimate3d.mjs';
import {createWorld,worldForRun,animateWorld,setWorldDanger} from './worlds3d.mjs';
import {attachBossVisual,readBossVisual,syncBossVisual,animateBossVisual} from './boss3d.mjs';
import {attachEliteVisual,syncEliteVisual,animateEliteVisual} from './elites3d.mjs';
import {graphicsProfile} from './preferences.mjs';
import {attachBossPartsVisual,syncBossPartsVisual,breakBossPartVisual,bossPartPoint,animateBossPartsVisual,createBossTelegraph,syncBossTelegraph,animateBossTelegraph,pickBossPart} from './boss-parts3d.mjs';
import {createLobbyScene,lobbyKey,fitLobbyCamera,animateLobby,pickLobbyHero} from './lobby3d.mjs';
import {LINKS} from './links.mjs';
import {emitLinkEffect} from './links3d.mjs';
import {equippedSkin} from './skins.mjs';
import {bondAdorned} from './bonds.mjs';
import {hasUltimate,hasHeroUltimate} from './ultimate-data.mjs';
import {emitHeroSkill} from './hero-skills3d.mjs';
import {createTowerMapScene,towerMapKey,fitTowerMapCamera,towerNodeScreen,syncTowerMapFocus,startTowerTravel,finishTowerTravel,animateTowerMap,pickTowerNode} from './tower-map3d.mjs';

import {createVictoryScene,victoryKey,fitVictoryCamera,animateVictory} from './victory3d.mjs';
import {createBattleCamera,startBattleCamera,animateBattleCamera,resetBattleCamera} from './battle-camera3d.mjs';
import {createImpactBeat,impactBeatTime} from './impact-beat.mjs';
import {readPerformanceSettings,writePerformanceSetting,adaptiveGraphics,FramePerformance,IdlePreloader} from './performance.mjs';
import {readDevicePower,devicePowerPolicy,sceneFrameInterval} from './device-power.mjs';

let renderer,thumbRenderer,view=null,raf=0,lastFrame=0,failed=false,thumbnailFailed=false,inViewport=true,activeUltimate=null,pagePaused=false;
let presentationState=null;
let baseGraphics=graphicsProfile(),graphics=adaptiveGraphics(baseGraphics),menuPaused=false,fpsMeter=null;
const devicePerformance=(()=>{try{return readPerformanceSettings(localStorage);}catch{return readPerformanceSettings(null);}})();
let deviceProfile=readDevicePower(),powerPolicy=devicePowerPolicy(devicePerformance,deviceProfile);
graphics=limitedGraphics();
const framePerformance=new FramePerformance({fps:graphics.fps,automatic:devicePerformance.automatic});
const modelPreloader=new IdlePreloader(),thumbnailPreloader=new IdlePreloader(),warmedModels=new Set();
export const performanceSettings=()=>({...devicePerformance});
export const performanceStatus=()=>({fps:graphics.fps,reason:powerPolicy.reason});
function limitedGraphics(level=0){const fps=Math.min(baseGraphics.fps,powerPolicy.maxFps);return adaptiveGraphics({...baseGraphics,fps,frameInterval:1000/fps},Math.max(level,powerPolicy.floor));}
function refreshDevicePolicy(){
  deviceProfile=readDevicePower();powerPolicy=devicePowerPolicy(devicePerformance,deviceProfile);
  if(!powerPolicy.cinematics)skipUltimate();
  if(!powerPolicy.warmModels)modelPreloader.clear();
  applyAdaptiveGraphics();resetFrameSampling();updateVisualActivity();
  if(powerPolicy.warmModels)prepareBattleModels(presentationState?.run);
  startLoop();
}
export function setPerformanceSetting(key,value){
  if(!Object.hasOwn(devicePerformance,key))return;
  devicePerformance[key]=!!value;let storage;try{storage=localStorage;}catch{}writePerformanceSetting(storage,key,value);
  if(key==='automatic'||key==='batterySaver')refreshDevicePolicy();
  syncFpsMeter();startLoop();
}
function configureGraphics(source){
  const next=graphicsProfile(source?.settings?.graphics,innerWidth,devicePixelRatio||1);if(JSON.stringify(next)===JSON.stringify(baseGraphics))return;
  baseGraphics=next;framePerformance.configure({fps:Math.min(next.fps,powerPolicy.maxFps),automatic:devicePerformance.automatic});framePerformance.level=0;framePerformance.reset();graphics=limitedGraphics();warmedModels.clear();
  dropView();cancelAnimationFrame(raf);raf=0;lastFrame=0;renderer?.domElement.remove();renderer?.dispose();renderer=null;
}
function removeFpsMeter(){fpsMeter?.remove();fpsMeter=null;}
function syncFpsMeter(){
  if(!devicePerformance.showFps||!view?.host?.isConnected||document.hidden||pagePaused||menuPaused||!inViewport||failed){removeFpsMeter();return;}
  if(!fpsMeter||!fpsMeter.isConnected||fpsMeter.parentElement!==view.host){removeFpsMeter();fpsMeter=document.createElement('span');fpsMeter.className='performance-meter';fpsMeter.setAttribute('aria-hidden','true');view.host.append(fpsMeter);}
  const value=framePerformance.fps;fpsMeter.textContent=(value===null?'—':Math.round(value))+' FPS'+(powerPolicy.reason?' · '+powerPolicy.reason:devicePerformance.automatic&&framePerformance.level?' · Tự giảm '+framePerformance.level:'');
}
function applyAdaptiveGraphics(){
  framePerformance.configure({fps:Math.min(baseGraphics.fps,powerPolicy.maxFps),automatic:devicePerformance.automatic});
  graphics=limitedGraphics(framePerformance.level);
  if(renderer){renderer.setPixelRatio(graphics.pixelRatio);renderer.shadowMap.enabled=graphics.shadows;if(view?.width&&view?.height)renderer.setSize(view.width,view.height,false);}
  const scenes=[view,activeUltimate?.previous].filter(Boolean);
  for(const current of scenes){
    current.scene.traverse(o=>{if(!o.userData.dynamicShadow)return;const changed=o.castShadow!==graphics.shadows||o.shadow.mapSize.x!==graphics.shadowSize;
      if(changed){o.shadow.dispose();o.shadow.map=null;o.shadow.mapPass=null;}
      o.castShadow=graphics.shadows;o.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);
    });
    current.vfx?.setBudget({capacity:graphics.capacity,density:graphics.density});
    if(current.world){
      current.world.lowEffects=!graphics.environmentEffects;const weather=current.world.weather;weather.visible=graphics.environmentEffects;
      const count=weather.geometry.attributes.position.count,segment=weather.isLineSegments?2:1;weather.geometry.setDrawRange(0,Math.floor(count*graphics.density/segment)*segment);
      for(const leaves of current.world.leaves){leaves.userData.maxInstances??=leaves.count;leaves.count=Math.max(1,Math.ceil(leaves.userData.maxInstances*graphics.density));leaves.visible=graphics.environmentEffects;}
    }
    if(current.motes){current.motes.visible=graphics.environmentEffects;current.motes.geometry.setDrawRange(0,Math.ceil(current.motes.geometry.attributes.position.count*graphics.density));}
    if(current.particles?.isInstancedMesh){current.particles.userData.maxInstances??=current.particles.count;current.particles.count=Math.max(1,Math.ceil(current.particles.userData.maxInstances*graphics.density));}
  }
  syncFpsMeter();
}
function resetFrameSampling(){lastFrame=0;framePerformance.reset();syncFpsMeter();}
function updateVisualActivity(){
  const dialog=document.querySelector('.modal'),host=view?.mode==='ultimate'?activeUltimate?.previous?.host:view?.host;
  const obscured=!!dialog&&host?.closest?.('.modal')!==dialog;
  if(menuPaused!==obscured){menuPaused=obscured;resetFrameSampling();if(menuPaused){stopBattleCamera();stopTowerMapTravel();cancelAnimationFrame(raf);raf=0;}}
  const active=!failed&&!document.hidden&&!pagePaused;
  modelPreloader.setActive(active&&!dialog&&inViewport&&powerPolicy.warmModels);thumbnailPreloader.setActive(active);syncFpsMeter();
}
function prepareBattleModels(run){
  if(!presentationState||failed||!powerPolicy.warmModels)return;
  const active=run&&run.phase!=='result',heroes=active?run.heroes:presentationState.team.map(id=>({id,loadout:gearLoadout(presentationState,id)}));
  const specs=heroes.map(hero=>({type:'hero',id:hero.id,signature:hero.loadout?.signature===hero.id,weaponRarity:hero.loadout?.weaponRarity,skin:equippedSkin(presentationState,hero.id),bond:bondAdorned(presentationState,hero.id),seasonAura:seasonAuraActive(presentationState)}));
  const pet=active?run.pet?.id:presentationState.adventure?.equipped;if(pet)specs.push({type:'pet',id:pet});
  // Common enemies can be prepared while choosing a route, before their first battle.
  specs.push({type:'enemy',id:'sentinel'},{type:'enemy',id:'wraith'});
  if(run?.phase==='battle')for(const enemy of run.battle.enemies)specs.push({type:enemy.kind==='boss'?'boss':'enemy',id:enemy.bossId||enemy.kind});
  modelPreloader.replace(specs.map(spec=>({...spec,key:JSON.stringify(spec)+':'+graphics.shadows})).filter(spec=>!warmedModels.has(spec.key)).map(spec=>({key:spec.key,run:()=>{
    if(document.hidden||pagePaused||menuPaused||failed||!renderer)return;
    const {scene,camera}=studio(spec.type,spec.id,graphics.shadows,spec.signature,spec.skin,spec.weaponRarity,spec.bond,spec.seasonAura),currentRenderer=renderer;
    const finish=()=>{disposeScene(scene);if(renderer===currentRenderer){if(warmedModels.size>=24)warmedModels.delete(warmedModels.values().next().value);warmedModels.add(spec.key);}framePerformance.reset();};
    try{const pending=currentRenderer.compileAsync?.(scene,camera);if(pending?.then)return Promise.resolve(pending).then(finish,()=>{disposeScene(scene);framePerformance.reset();});currentRenderer.compile?.(scene,camera);finish();}
    catch{disposeScene(scene);framePerformance.reset();}
  }})));
}
const wornSignature=id=>!!presentationState&&gearLoadout(presentationState,id).signature===id;
function previewSignature(source){return source.dataset.modelType==='hero'&&!!(source.closest('[data-signature-preview]')||(!source.closest('[data-weapon-rarity]')&&wornSignature(source.dataset.modelId)));}
function previewWeapon(source){
  if(source.dataset.modelType!=='hero')return null;
  return source.closest('[data-weapon-rarity]')?.dataset.weaponRarity||(source.closest('[data-signature-preview]')?'SSR':presentationState?gearLoadout(presentationState,source.dataset.modelId).weaponRarity:null);
}
function previewSkin(source){
  if(source.dataset.modelType!=='hero')return null;
  const explicit=source.dataset.skinPreview??source.closest('[data-skin-preview]')?.dataset.skinPreview;
  return explicit==='base'?null:explicit??equippedSkin(presentationState,source.dataset.modelId);
}
let showCinematics=true;
try{showCinematics=localStorage.getItem('thap-vo-tan-cinematics')!=='off';}catch{}
let briefAuto=true;
try{briefAuto=localStorage.getItem('thap-vo-tan-cinematics-auto')!=='full';}catch{}
let cameraEnabled=true,screenShake=true;
try{cameraEnabled=localStorage.getItem('thap-vo-tan-camera-motion')!=='off';screenShake=localStorage.getItem('thap-vo-tan-camera-shake')!=='off';}catch{}
export const battleCameraEnabled=()=>cameraEnabled;
export const cameraShakeEnabled=()=>screenShake;
export function setBattleCameraEnabled(enabled){cameraEnabled=!!enabled;try{localStorage.setItem('thap-vo-tan-camera-motion',cameraEnabled?'on':'off');}catch{}if(!cameraEnabled)stopBattleCamera();startLoop();}
export function setCameraShakeEnabled(enabled){screenShake=!!enabled;try{localStorage.setItem('thap-vo-tan-camera-shake',screenShake?'on':'off');}catch{}startLoop();}

export const cinematicsEnabled=()=>showCinematics;
export function setCinematicsEnabled(enabled){showCinematics=!!enabled;try{localStorage.setItem('thap-vo-tan-cinematics',showCinematics?'on':'off');}catch{}if(!showCinematics)skipUltimate();}
export const briefAutoEnabled=()=>briefAuto;
export function setBriefAutoEnabled(enabled){briefAuto=!!enabled;try{localStorage.setItem('thap-vo-tan-cinematics-auto',briefAuto?'brief':'full');}catch{}}
const thumbnails=new Map(),clock=new T.Clock(),motion=matchMedia('(prefers-reduced-motion: reduce)');
function createRenderer(thumbnail=false){
  const r=new T.WebGLRenderer({alpha:true,antialias:thumbnail||graphics.quality!=='low'&&powerPolicy.floor===0,powerPreference:'low-power',preserveDrawingBuffer:thumbnail});
  r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1;r.setClearColor(0,0);r.shadowMap.enabled=!thumbnail&&graphics.shadows;r.shadowMap.type=T.PCFSoftShadowMap;
  r.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(thumbnail)thumbnailFailed=true;else fallback();});
  r.setPixelRatio(thumbnail?1:graphics.pixelRatio);return r;
}
function lighting(scene,accent='#a2e3cf',shadows=true){
  scene.add(new T.HemisphereLight('#e9f5ff','#405b63',2));
  const sun=new T.DirectionalLight('#fff0df',2.7);sun.position.set(-4,9,7);sun.castShadow=shadows;sun.userData.dynamicShadow=true;sun.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);sun.shadow.camera.left=-9;sun.shadow.camera.right=9;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;scene.add(sun);
  const rim=new T.DirectionalLight(accent,1.7);rim.position.set(4,3,-5);scene.add(rim);return sun;
}
function pedestal(scene,color,radius=1){
  cylinder(scene,'#263d4b',0,-.14,0,radius,.22,12,.3);cylinder(scene,'#81988f',0,-.02,0,radius*.95,.05,12,.35);
  const ring=mesh(scene,new T.TorusGeometry(radius*.87,.018,5,48),color,0,.012,0);ring.rotation.x=-Math.PI/2;ring.material=material(color,.3,.35);
}
function studio(type,id,shadows=true,signature=false,skin=null,weaponRarity=null,bond=false,seasonAura=false){
  const scene=new T.Scene(),model=makeModel(type,id,{signature,skin,weaponRarity,bond,seasonAura});lighting(scene,model.userData.color,shadows);
  model.rotation.y=.13;scene.add(model);if(type!=='tower')pedestal(scene,model.userData.color,type==='hero'?1.05:1.2);
  const camera=new T.PerspectiveCamera(35,1,0.1,80);
  if(type==='tower'){camera.position.set(9,7.5,13);camera.lookAt(0,2.7,0);}else{camera.position.set(4.5,3.6,7.4);camera.lookAt(0,type==='pet'?1.25:1.7,0);if(type==='boss')camera.position.multiplyScalar(1.18);}
  return {scene,model,camera};
}
function thumbnail(type,id,signature=false,skin=null,weaponRarity=null,bond=false,seasonAura=false){
  const width=powerPolicy.thumbnailSize,height=Math.round(width*(type==='tower'?340:320)/288);
  const key=type+':'+id+':'+signature+':'+(skin||'base')+':'+(weaponRarity||'none')+':'+bond+':'+seasonAura+':'+width;if(thumbnails.has(key))return thumbnails.get(key);
  thumbRenderer ||= createRenderer(true);thumbRenderer.setSize(width,height,false);
  const {scene,camera}=studio(type,id,false,signature,skin,weaponRarity,bond,seasonAura);
  try{camera.aspect=width/height;camera.updateProjectionMatrix();thumbRenderer.render(scene,camera);const url=thumbRenderer.domElement.toDataURL('image/png');if(thumbnails.size>=96)thumbnails.delete(thumbnails.keys().next().value);thumbnails.set(key,url);return url;}finally{disposeScene(scene);framePerformance.reset();}
}
function hydrate(root){
  if(thumbnailFailed||failed){thumbnailPreloader.clear();return;}
  const jobs=[...root.querySelectorAll('svg[data-model-type]')].filter(e=>!e.closest('.battle-unit, .lobby-fallback, .victory-fallback'));
  const nextBatch=()=>{const batch=jobs.splice(0,32);thumbnailPreloader.replace(batch.map((svg,index)=>({key:index,run:()=>{
    try{
      if(thumbnailFailed||failed||document.hidden||pagePaused||!svg.isConnected)return;
      try{
        const skin=previewSkin(svg),img=new Image();
        img.src=thumbnail(svg.dataset.modelType,svg.dataset.modelId,previewSignature(svg),skin,previewWeapon(svg),svg.dataset.modelType==='hero'&&bondAdorned(presentationState,svg.dataset.modelId),svg.dataset.modelType==='hero'&&seasonAuraActive(presentationState));
        img.className=(svg.getAttribute('class')||'')+' model-image';img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;
        if(svg.getAttribute('style'))img.setAttribute('style',svg.getAttribute('style'));
        img.dataset.modelType=svg.dataset.modelType;img.dataset.modelId=svg.dataset.modelId;
        if(svg.dataset.modelType==='hero')img.dataset.skinPreview=skin||'base';
        svg.replaceWith(img);
      }catch{thumbnailFailed=true;thumbnailPreloader.clear();thumbRenderer?.dispose();thumbRenderer=null;}
    }finally{if(index===batch.length-1&&jobs.length&&!failed&&!thumbnailFailed)nextBatch();}
  }})));};nextBatch();
}
import {formationPosition} from './formation.mjs';
const arenaKey=run=>`${seasonAuraActive(presentationState)}:${run.started}:${run.floor}:${run.node}:${anomalyForFloor(run)?.id||''}:${run.formation?.front||0}:${run.heroes.map(h=>h.id+':'+(equippedSkin(presentationState,h.id)||'base')+':'+h.loadout?.signature+':'+h.loadout?.weaponRarity+':'+bondAdorned(presentationState,h.id)).join(',')}:${run.battle.enemies.map(e=>e.id+':'+(e.bossId||e.kind)+':'+(e.elite?.trait||'')).join(',')}`;
function buildArena(run){
  const world=createWorld(worldForRun(run).id,{compact:graphics.compact,anomaly:anomalyForFloor(run)?.id}),accent=world.data.accent,scene=new T.Scene();
  world.weather.visible=graphics.effects;for(const leaf of world.leaves)leaf.visible=graphics.effects;
  scene.background=world.background;scene.fog=new T.Fog(world.data.background,22,46);const sun=lighting(scene,accent,graphics.shadows);sun.shadow.mapSize.set(graphics.shadowSize,graphics.shadowSize);scene.add(world.root);
  const camera=arenaCamera();
  const units=new Map();
  function place(unit,enemy,index,count){
    const model=enemy?enemyModel(unit):heroModel(unit.id,{signature:unit.loadout?.signature===unit.id,weaponRarity:unit.loadout?.weaponRarity,skin:equippedSkin(presentationState,unit.id),bond:bondAdorned(presentationState,unit.id),seasonAura:seasonAuraActive(presentationState)}),position=enemy?{x:(index-(count-1)/2)*3.4,z:-3.75}:formationPosition(run,index),{x,z}=position;
    if(unit.kind==='boss'){attachBossVisual(model,unit.bossId);attachBossPartsVisual(model);}
    if(enemy&&unit.elite)attachEliteVisual(model,unit);
    model.position.set(x,.09,z);model.rotation.y=enemy?-.28:.12;const scale=unit.kind==='boss'?.95:.88;model.scale.setScalar(scale);scene.add(model);
    const ring=mesh(scene,new T.TorusGeometry(enemy&&unit.kind==='boss'?1.18:.83,.035,4,40),enemy?'#efa279':'#e8ce90',x,.06,z);ring.rotation.x=-Math.PI/2;
    const bubble=ball(scene,enemy?'#a7cbf3':'#a8e5d4',x,1.55,z,[1.05,1.6,.9]);bubble.material=new T.MeshBasicMaterial({color:enemy?'#acb9ff':'#abf3dc',transparent:true,opacity:.075,wireframe:true,depthWrite:false});bubble.visible=false;
    model.traverse(o=>o.userData.unitId=unit.id);
    units.set(unit.id,{model,ring,bubble,enemy,x,z,scale,angle:model.rotation.y,phase:index*1.6,attackAt:-10,hitAt:-10,attackDuration:1,alive:unit.hp>0,fallAt:unit.hp>0?null:-Infinity,reviveAt:null,lifeDuration:.82});
  }
  run.battle.enemies.forEach((u,i)=>place(u,true,i,run.battle.enemies.length));run.heroes.forEach((u,i)=>place(u,false,i,3));
  if(run.pet){const pet=creatureModel(run.pet.id);pet.scale.setScalar(.46);pet.position.set(-4.45,.15,4.05);pet.rotation.y=.2;scene.add(pet);units.set('pet',{model:pet,x:-4.45,z:4.05,scale:.46,angle:.2,phase:2,attackAt:-10,hitAt:-10,attackDuration:1});}
  return {scene,camera,units,cameraRig:createBattleCamera(camera,units),accent,world,worldSynced:false,telegraph:createBossTelegraph(scene,run.heroes,run.formation),vfx:new CombatEffects3D(scene,{capacity:graphics.capacity,density:graphics.density,reducedMotion:motion.matches||!graphics.effects}),mode:'battle',key:arenaKey(run)};
}
function clearHost(host){
  if(!host)return;host.classList.remove('arena3d-ready','model-live','lobby3d-ready','tower-map3d-ready','victory3d-ready');host.querySelectorAll('[data-map-node]').forEach(e=>{e.style.left=e.dataset.fallbackX;e.style.top=e.dataset.fallbackY;});host.querySelectorAll('[data-unit]').forEach(e=>{e.style.removeProperty('left');e.style.removeProperty('top');});host.querySelector('.model-controls')?.remove();host.querySelector('.boss-awakening')?.remove();
}
function stopBattleCamera(){if(view)view.impactBeat=null;if(resetBattleCamera(view?.cameraRig))positionLabels();}
function dropView(){modelPreloader.clear();thumbnailPreloader.clear();removeFpsMeter();stopBattleCamera();skipUltimate();if(view){clearHost(view.host);view.vfx?.clear();disposeScene(view.scene);view=null;}framePerformance.reset();lastFrame=0;observer.disconnect();visibilityObserver?.disconnect();}
function fallback(){
  failed=true;cancelAnimationFrame(raf);raf=0;dropView();document.querySelectorAll('.arena3d-ready,.model-live,.tower-map3d-ready,.victory3d-ready').forEach(clearHost);renderer?.domElement.remove();renderer?.dispose();renderer=null;
}
function resize(){
  if(!view?.host?.isConnected||!renderer)return;const {width,height}=view.host.getBoundingClientRect();if(width<1||height<1)return;
  if(width!==view.width||height!==view.height)resetFrameSampling();renderer.setSize(width,height,false);const aspect=width/height;
  if(view.mode==='battle'){
    view.impactBeat=null;resetBattleCamera(view.cameraRig);fitArenaCamera(view.camera,aspect);
  }else if(view.mode==='lobby')fitLobbyCamera(view.camera,aspect);
  else if(view.mode==='map')fitTowerMapCamera(view.camera,aspect);
  else if(view.mode==='victory')fitVictoryCamera(view,aspect);
  else view.camera.aspect=aspect;
  view.camera.updateProjectionMatrix();view.width=width;view.height=height;positionLabels();startLoop();
}
function positionLabels(){
  if(view?.mode==='map'&&view.host.isConnected){for(const label of view.host.querySelectorAll('[data-map-node]')){const p=towerNodeScreen(view,label.dataset.mapNode);if(p){label.style.left=`${p.x}%`;label.style.top=`${p.y}%`;}}return;}
  if(view?.mode!=='battle'||!view.host.isConnected)return;
  for(const [id,u] of view.units){if(id==='pet')continue;const label=view.host.querySelector(`[data-unit="${id}"]`);if(!label)continue;const p=view.cameraRig.point.set(u.model.position.x,.17,u.model.position.z).project(view.camera),left=`${(p.x*.5+.5)*100}%`,top=`${(-p.y*.5+.5)*100}%`;if(label.style.left!==left)label.style.left=left;if(label.style.top!==top)label.style.top=top;}
}
function syncRun(run,hero,enemy){
  if(view?.mode!=='battle')return;
  const time=clock.getElapsedTime();let enraged=false;
  for(const [id,u] of view.units){
    if(id==='pet')continue;const state=(u.enemy?run.battle.enemies:run.heroes).find(h=>h.id===id);if(!state){u.model.visible=u.ring.visible=u.bubble.visible=false;continue;}
    syncFighterState(u,state.hp,time,{immediate:motion.matches||!graphics.effects});
    if(state.elite)syncEliteVisual(u.model,state);
    u.model.visible=!u.enemy||state.hp>0;u.ring.visible=state.hp>0;u.selected=state.hp>0&&(id===hero||id===enemy);u.ring.material=material(u.enemy?'#ed9977':'#e8cd8b',.3,u.selected?1:.05);u.ring.scale.setScalar(u.selected?1.1:.9);u.bubble.visible=state.hp>0&&state.shield>0;u.frozen=state.freeze>0;
    if(state.kind==='boss'){
      const status=readBossVisual(run,state),changed=syncBossVisual(u.model,status,time,{reducedMotion:motion.matches||!graphics.effects});enraged=status.phase===2&&status.alive;
      syncBossPartsVisual(u.model,run.battle.bossState?.parts,time,{reducedMotion:motion.matches||!graphics.effects});
      if(changed){
        const spec=u.model.userData.bossVisual.spec;view.vfx.support(u,spec.color,time);
        const notice=document.createElement('div');notice.className='boss-awakening';notice.setAttribute('role','status');notice.style.setProperty('--boss-form',spec.color);notice.innerHTML='<span>'+(run.raid?.boss==='void-dragon'?'HẮC LONG CUỒNG NỘ':run.raid?'TAM ẤN CUỒNG NỘ':'GIAI ĐOẠN II')+'</span><strong></strong>';notice.querySelector('strong').textContent=spec.name;
        view.host.querySelector('.boss-awakening')?.remove();view.host.append(notice);setTimeout(()=>notice.remove(),1900);
      }
    }
  }
  syncBossTelegraph(view.telegraph,run);setWorldDanger(view.world,enraged,time,{instant:!view.worldSynced||motion.matches});view.worldSynced=true;
}
const observer=new ResizeObserver(()=>resize());
const visibilityObserver=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{const current=entries.find(e=>e.target===view?.host);if(!current)return;inViewport=current.isIntersecting;resetFrameSampling();updateVisualActivity();if(inViewport)startLoop();else{stopBattleCamera();cancelAnimationFrame(raf);raf=0;}});
function bindCanvas(host){
  host.append(renderer.domElement);renderer.domElement.className='scene3d-canvas';renderer.domElement.setAttribute('aria-hidden','true');observer.disconnect();observer.observe(host);
  inViewport=true;visibilityObserver?.disconnect();visibilityObserver?.observe(host);
  let start=null;
  renderer.domElement.onpointerdown=e=>{start={x:e.clientX,y:e.clientY,angle:view?.angle||0};if(view?.mode==='preview'){renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';}};
  renderer.domElement.onpointermove=e=>{if(start&&view?.mode==='preview'){view.angle=start.angle+(e.clientX-start.x)*.012;view.model.rotation.y=view.angle;startLoop();}};
  renderer.domElement.onpointerup=e=>{
    if(start&&view?.mode==='map'&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<8){const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),view.camera);const id=pickTowerNode(view,ray);if(id)host.querySelector(`[data-map-node="${id}"]`)?.click();}
    if(start&&view?.mode==='lobby'&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<8){const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),view.camera);const id=pickLobbyHero(view,ray);if(id)document.querySelector(`[data-lobby-hero="${id}"]`)?.click();}
    if(start&&view?.mode==='battle'&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<8){const rect=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),view.camera);const bossUnit=[...view.units.values()].find(u=>u.model.userData.bossPartsVisual&&u.model.visible),part=bossUnit&&pickBossPart(bossUnit.model,ray);const hit=part?null:ray.intersectObjects([...view.units.values()].filter(u=>u.model.visible&&u.alive!==false).map(u=>u.model),true).find(h=>{let node=h.object;while(node){if(!node.visible)return false;node=node.parent;}return h.object.userData.unitId;});if(part||hit){if(part)document.querySelector(`[data-action="boss-part"][data-part="${part}"]`)?.click();else host.querySelector(`[data-unit="${hit.object.userData.unitId}"]`)?.click();}}
    start=null;renderer.domElement.style.cursor=view?.mode==='preview'?'grab':'default';
  };renderer.domElement.onpointercancel=()=>start=null;
}
function previewHost(){return document.querySelector('.modal .signature-forge-art, .modal .detail-art, .modal .showcase-art, .modal .pet-detail-art')||document.querySelector('.signature-forge-art, .pet-feature-art, .wardrobe-art');}
export function mountVisuals(run,selectedHero,selectedEnemy,sourceState=null){
  if(sourceState)presentationState=sourceState;
  if(failed)return;
  try{
    configureGraphics(presentationState);
    renderer ||= createRenderer();const preview=previewHost(),source=preview?.querySelector('[data-model-type]'),battle=document.querySelector('#arena3d'),lobby=document.querySelector('#lobby3d'),map=document.querySelector('#tower-map3d'),victory=document.querySelector('#victory3d');
    if(source){
      const signature=previewSignature(source),skin=previewSkin(source),weaponRarity=previewWeapon(source),bond=source.dataset.modelType==='hero'&&bondAdorned(presentationState,source.dataset.modelId),seasonAura=source.dataset.modelType==='hero'&&seasonAuraActive(presentationState),key=`${source.dataset.modelType}:${source.dataset.modelId}:${signature}:${skin||'base'}:${weaponRarity||'none'}:${bond}:${seasonAura}`;
      if(view?.mode!=='preview'||view.key!==key){dropView();const studioView=studio(source.dataset.modelType,source.dataset.modelId,graphics.shadows,signature,skin,weaponRarity,bond,seasonAura);view={...studioView,mode:'preview',key,angle:.13};}
      view.host=preview;preview.classList.add('model-live');
      if(!preview.querySelector('.model-controls')){const controls=document.createElement('div');controls.className='model-controls';controls.innerHTML='<button type="button" aria-label="Xoay sang trái">↶</button><span>Kéo để xoay</span><button type="button" aria-label="Xoay sang phải">↷</button>';const buttons=controls.querySelectorAll('button');buttons.forEach((b,i)=>b.onclick=()=>{if(view?.mode==='preview'){view.angle+=(i?1:-1)*.45;view.model.rotation.y=view.angle;startLoop();}});preview.append(controls);}
      bindCanvas(preview);resize();
    }else if(victory&&run?.victory&&run.victory.stage!=='done'&&presentationState){
      const key=victoryKey(presentationState);if(view?.mode!=='victory'||view.key!==key){dropView();view=createVictoryScene(presentationState,graphics);lighting(view.scene,view.style.color,graphics.shadows);view.startedAt=clock.getElapsedTime();}
      view.host=victory;victory.classList.add('victory3d-ready');bindCanvas(victory);resize();
    }else if(battle&&run?.phase==='battle'){
      const key=arenaKey(run);if(view?.mode!=='battle'||view.key!==key){dropView();view=buildArena(run);}
      view.host=battle;battle.classList.add('arena3d-ready');bindCanvas(battle);syncRun(run,selectedHero,selectedEnemy);resize();
    }else if(map&&run?.map&&run.phase==='route'&&presentationState){
      const key=towerMapKey(presentationState);if(view?.mode!=='map'||view.key!==key){dropView();view=createTowerMapScene(presentationState,graphics);lighting(view.scene,'#acd5c5',graphics.shadows);}
      view.host=map;map.classList.add('tower-map3d-ready');syncTowerMapFocus(view,map.dataset.mapFocus);bindCanvas(map);resize();
    }else if(lobby&&presentationState){
      const key=lobbyKey(presentationState);if(view?.mode!=='lobby'||view.key!==key){dropView();view=createLobbyScene(presentationState,graphics);lighting(view.scene,'#bce2c1',graphics.shadows);}
      view.host=lobby;lobby.classList.add('lobby3d-ready');bindCanvas(lobby);resize();
    }else{dropView();renderer.domElement.remove();}
    applyAdaptiveGraphics();updateVisualActivity();hydrate(document.querySelector('.modal')||document);prepareBattleModels(run);if(view)startLoop();
  }catch{fallback();}
}
export function skipUltimate(){
  const current=activeUltimate;if(!current)return false;activeUltimate=null;clearTimeout(current.timer);
  cancelAnimationFrame(raf);raf=0;observer.disconnect();visibilityObserver?.disconnect();const cinematic=view;view=current.previous;
  try{
    disposeScene(cinematic.scene);
    if(view?.host.isConnected&&!failed){bindCanvas(view.host);resize();}else if(view){view.vfx?.clear();disposeScene(view.scene);clearHost(view.host);view=null;renderer?.domElement.remove();}
    if(current.focus?.isConnected)current.focus.focus({preventScroll:true});
  }catch{fallback();}finally{current.overlay.remove();document.body.classList.remove('ultimate-open');current.resolve(true);}
  return true;
}
export function playUltimate(id,{preview=false,auto=false,speed=1}={}){
  const validHost=preview?view?.mode==='preview'&&view.model.userData.kind==='hero'&&view.model.userData.id===id:view?.mode==='battle'&&view.units.get(id)?.model.userData.kind==='hero';
  if(((!showCinematics||!inViewport||auto&&briefAuto||!powerPolicy.cinematics)&&!preview)||deviceProfile.thermal>=4||!graphics.effects||motion.matches||document.hidden||pagePaused||menuPaused||failed||!validHost||!hasUltimate(id))return Promise.resolve(false);
  let cinematic,overlay;
  try{
    stopBattleCamera();
    const model=preview?view.model:view.units.get(id).model,options={signature:!!model.userData.signature,weaponRarity:model.userData.weaponRarity,skin:model.userData.skin,bond:model.userData.bond,seasonAura:model.userData.seasonAura,compact:graphics.compact,speed:preview?1:speed};
    cinematic=createUltimateScene(id,innerWidth/innerHeight,options);
    const wrapper=document.createElement('div');wrapper.innerHTML=ultimateMarkup(id,options);overlay=wrapper.firstElementChild;
    if(!overlay?.querySelector('.ultimate-stage')||!overlay.querySelector('.ultimate-skip'))throw new Error('Missing cinematic host');
    const previous=view;
    const result=new Promise(resolve=>{activeUltimate={previous,overlay,resolve,focus:document.activeElement,timer:null};});
    view=cinematic;view.host=overlay.querySelector('.ultimate-stage');view.startedAt=clock.getElapsedTime();
    overlay.querySelector('.ultimate-skip').addEventListener('click',()=>skipUltimate());document.body.append(overlay);document.body.classList.add('ultimate-open');bindCanvas(view.host);resize();
    overlay.querySelector('button').focus({preventScroll:true});activeUltimate.timer=setTimeout(()=>skipUltimate(),view.duration);startLoop();return result;
  }catch{if(activeUltimate&&activeUltimate.overlay===overlay)skipUltimate();else if(cinematic)disposeScene(cinematic.scene);return Promise.resolve(false);}
}
function startLoop(){if(!failed&&!raf&&!document.hidden&&!pagePaused&&!menuPaused&&inViewport&&view)raf=requestAnimationFrame(frame);}
function frame(now){
  raf=0;if(!view||document.hidden||pagePaused||menuPaused||!inViewport||!view.host.isConnected){removeFpsMeter();return;}
  const interval=sceneFrameInterval(graphics,powerPolicy,view.mode),delta=now-lastFrame;if(delta<interval-.5){startLoop();return;}
  // Carry short scheduling drift so a 90 Hz display can reach the selected 30/60 FPS cap.
  lastFrame=now-(delta<interval*2?Math.max(0,delta-interval):0);const rawTime=clock.getElapsedTime(),quiet=motion.matches||!graphics.effects;
  const time=view.mode==='battle'&&!quiet?impactBeatTime(view.impactBeat,rawTime):rawTime;
  if(view.mode==='ultimate'){
    const elapsed=time-view.startedAt;animateUltimate(view,elapsed,{reducedMotion:quiet});
    activeUltimate?.overlay.style.setProperty('--ultimate-progress',Math.min(1,elapsed*1000/view.duration));
  }else if(view.mode==='victory'){
    animateVictory(view,time-view.startedAt,{reducedMotion:quiet});
  }else if(view.mode==='preview'){
    view.model.rotation.y=view.angle+(quiet?0:Math.sin(time*.45)*.05);view.model.position.y=quiet?0:Math.sin(time*1.6)*.035;
    animateModel(view.model,time,{reducedMotion:quiet});
  }else if(view.mode==='lobby'){
    animateLobby(view,time,{reducedMotion:quiet});
  }else if(view.mode==='map'){
    animateTowerMap(view,time,{reducedMotion:quiet});
  }else{
    for(const u of view.units.values()){
      animateModel(u.model,time,{reducedMotion:quiet,frozen:u.frozen,idle:false});
      animateFighter(u,time,{reducedMotion:quiet});
      animateBossVisual(u.model,time,{reducedMotion:quiet});
      animateEliteVisual(u.model,time,{reducedMotion:quiet});
      animateBossPartsVisual(u.model,time,{reducedMotion:quiet});
      if(u.ring)u.ring.scale.setScalar(u.selected?1.08+(quiet?0:Math.sin(time*2)*.035):.9);
      if(u.bubble&&!quiet)u.bubble.rotation.y=time*.18;
    }
    animateBossTelegraph(view.telegraph,time,{reducedMotion:quiet});animateWorld(view.world,time,{reducedMotion:quiet});view.scene.fog.color.copy(view.world.background);
    view.vfx.step(time);
    animateBattleCamera(view.cameraRig,time,{reducedMotion:quiet,enabled:cameraEnabled,shake:screenShake});positionLabels();
  }
  try{renderer.render(view.scene,view.camera);}catch{fallback();return;}
  const sample=framePerformance.sample(now,{eligible:interval<=graphics.frameInterval&&!motion.matches&&view.mode!=='ultimate'&&!modelPreloader.running&&!thumbnailPreloader.running});
  if(sample?.changed)applyAdaptiveGraphics();else if(sample)syncFpsMeter();
  if((!motion.matches&&(!['lobby','map','victory'].includes(view.mode)||graphics.effects))||view.vfx?.active)startLoop();
}
export function towerMapTravel(id,{speed=1}={}){
  if(view?.mode!=='map'||failed||document.hidden||pagePaused||menuPaused)return {duration:0,impact:0};
  modelPreloader.setActive(false);thumbnailPreloader.setActive(false);
  const duration=startTowerTravel(view,id,clock.getElapsedTime(),{speed,reducedMotion:motion.matches||!graphics.effects});
  if(duration&&!inViewport){view.host.scrollIntoView?.({block:'center',behavior:'instant'});inViewport=true;}
  startLoop();return {duration,impact:0};
}
export function stopTowerMapTravel(){if(view?.mode==='map')finishTowerTravel(view);}
function emitVoidBursts(events,time,impact,quiet){
  for(const event of events){const target=view.units.get(event.target);if(!target||!event.voidBurst)continue;view.vfx.pulse(target,'#b9a4ef',time,{radius:1.2,delay:impact,life:.55});view.vfx.particles(new T.Vector3(target.x,1.5,target.z),'#a9e8f4',time,{count:quiet?2:10,delay:impact});}
}
function syncHeroLife(time,impact,{quiet=false,speed=1}={}){
  const run=presentationState?.run;if(!run||view?.mode!=='battle')return 0;let settled=0;
  for(const u of view.units.values())if(u.model.userData.heroRig){
    const saved=run.heroes.find(h=>h.id===u.model.userData.id);if(!saved)continue;const wasAlive=u.alive;
    syncFighterState(u,saved.hp,time,{impactAt:time+impact/1000,immediate:quiet,speed});
    if(!quiet&&wasAlive!==u.alive)settled=Math.max(settled,impact+u.lifeDuration*(u.alive?.7:1)*1000);
  }
  return settled;
}
export function battleEffect(actorId,events,{skill=false,enemy=false,pet=false,counter=false,speed=1,link=null}={}){
  modelPreloader.setActive(false);thumbnailPreloader.setActive(false);
  if(view?.mode!=='battle')return {duration:motion.matches?160:420,impact:0};
  if(link&&LINKS[link.id]){const now=clock.getElapsedTime(),quiet=motion.matches||!graphics.effects,timing=emitLinkEffect(view,link.ids,LINKS[link.id],events,now,{speed,reducedMotion:quiet}),settled=syncHeroLife(now,timing.impact,{quiet,speed}),playback={...timing,duration:Math.max(timing.duration,settled)};emitVoidBursts(events,now,timing.impact/1000,quiet);for(const e of events)if(!e.heal&&!e.shieldGrant&&(e.value>0||e.shield>0)){const u=view.units.get(e.target);if(u)for(const id of link.ids)view.vfx.elementImpact(new T.Vector3(u.x,1.35,u.z),HERO[id]?.element,now,{rank:RARITY[HERO[id]?.rarity]?.rank||0,delay:timing.impact/1000,compact:true,speed});}return finishBattleFeedback(now,playback,events,link.ids.map(id=>view.units.get(id)),{skill:true,quiet,speed});}
  const time=clock.getElapsedTime(),actor=view.units.get(pet?'pet':actorId)||[...view.units.values()].find(u=>u.enemy===enemy&&u.model.visible&&u.alive!==false),vfx=view.vfx,quiet=motion.matches||!graphics.effects;
  const rank=RARITY[actor?.model.userData.rarity]?.rank||0,color=actor?.model.userData.color||view.accent,weapon=actor?.model.userData.weapon||'creature',timing=combatTiming(weapon,{skill,counter,speed,reducedMotion:quiet}),heroSkill=skill&&!enemy&&!pet&&hasHeroUltimate(actorId);
  if(actor){actor.attackAt=time;actor.attackSkill=skill;actor.attackCounter=counter;actor.attackDuration=timing.duration;actor.attackTarget=events.filter(e=>!e.heal).map(e=>view.units.get(e.target)).find(u=>u&&u.enemy!==actor.enemy);vfx.cast(actor,color,time,{skill,rank});}
  const support=pet?PET[actor?.model.userData.id]?.kind:skill?HERO[actorId]?.kind:null;
  if(['shield','energy'].includes(support))for(const u of view.units.values())if(u.enemy===false&&u.model.visible&&u.alive!==false)vfx.support(u,support==='energy'?'#b4dfff':'#a9edd7',time);
  for(const event of events){
    const target=view.units.get(event.target);if(!target)continue;const aid=!!(event.heal||event.shieldGrant);target.hitAt=aid?-10:time+timing.impact/1000;if(!aid&&actor)target.hitSource={x:actor.x,z:actor.z};
    const tint=aid?'#9df2bc':skill||counter?color:'#ffd6a0';
    const partPoint=event.part?bossPartPoint(target.model,event.part.id):null,impact=partPoint||target;
    if(!aid&&(event.value>0||event.shield>0)){
      const contact=partPoint||new T.Vector3(target.x,1.35,target.z),delay=timing.impact/1000;
      if(event.timingGuard){
        const guardColor=event.timingGuard.grade==='perfect'?'#f3d58c':'#a9dfd3';
        vfx.pulse(contact,guardColor,time,{radius:1.12,delay,life:.48,vertical:true});
        vfx.armorSparks(contact,time,{shield:true,delay,compact:true,source:actor,speed});
      }
      if(counter)vfx.pulse(contact,rank>=3?color:'#f3d58c',time,{radius:1+rank*.08,delay,life:.38/(speed===2?2:1),vertical:true});
      vfx.meleeTrail(contact,rank>=3?color:'#e6d4b3',time,{weapon,rank,delay:Math.max(0,delay-.065/(speed===2?2:1)),compact:graphics.compact,speed});
      const armored=event.shield>0||target.model.userData.kind==='hero'||['colossus','ashknight','sentinel'].includes(target.model.userData.id);
      if(armored)vfx.armorSparks(contact,time,{critical:!!event.crit,shield:event.shield>0,delay,compact:graphics.compact,source:actor,speed});
      if((skill||counter&&rank>=3)&&!enemy&&!pet)vfx.elementImpact(contact,HERO[actorId]?.element,time,{rank,delay,compact:graphics.compact,speed});
    }
    if(actor&&!actor.enemy&&!aid)vfx.weaponTrail(new T.Vector3(actor.x,1.75,actor.z),partPoint||new T.Vector3(target.x,1.5,target.z),counter?actor.model.userData.rarity:actor.model.userData.weaponRarity,time,{delay:timing.release/1000,life:timing.flight/1000+.28,compact:graphics.compact});
    if(actor&&!event.heal&&!event.shieldGrant&&!timing.melee&&!heroSkill)vfx.projectile(new T.Vector3(actor.x,1.8,actor.z),partPoint||new T.Vector3(target.x,1.5,target.z),tint,time,{skill,rank,weapon,delay:timing.release/1000,life:timing.flight/1000});
    vfx.impact(impact,tint,time,{skill,rank,weapon,delay:timing.impact/1000,heal:aid,critical:!!event.crit,height:partPoint?.y});
    if(event.part?.broken){breakBossPartVisual(target.model,event.part.id,time+timing.impact/1000);vfx.particles(partPoint||new T.Vector3(target.x,1.5,target.z),'#ffe3ad',time,{count:graphics.effects?18:3,delay:timing.impact/1000});}
  }
  const settled=syncHeroLife(time,timing.impact,{quiet,speed});
  emitVoidBursts(events,time,timing.impact/1000,quiet);
  if(heroSkill)emitHeroSkill(view,actorId,events,time,timing,{compact:graphics.compact,reducedMotion:quiet});
  // Let death/recovery finish before playback hands control to the next turn or result screen.
  const playback={...timing,duration:Math.max(timing.duration,settled)};
  return finishBattleFeedback(time,playback,events,[actor],{skill,counter,quiet,speed});
}
function finishBattleFeedback(time,timing,events,actors,{skill,counter=false,quiet,speed}){
  for(const event of events)if(event.eliteRevive||event.guardBreak){
    const target=view.units.get(event.target);if(!target)continue;
    view.vfx.pulse(target,event.eliteRevive?'#c1a0e8':'#8dc5df',time,{radius:1.25,delay:timing.impact/1000,life:.65});
    view.vfx.particles(new T.Vector3(target.x,1.5,target.z),event.eliteRevive?'#c1a0e8':'#8dc5df',time,{count:quiet?2:8,delay:timing.impact/1000,heal:!!event.eliteRevive});
  }
  const run=presentationState?.run,finisher=events.some(e=>!e.heal&&!e.shieldGrant&&(e.value>0||e.shield>0)&&run?.battle?.enemies.some(u=>u.id===e.target&&u.kind==='boss'&&u.hp<=0));
  view.impactBeat=createImpactBeat(time,timing,events,{speed,reducedMotion:quiet,finisher,heavy:skill||actors.some(u=>['sword','shield'].includes(u?.model.userData.weapon))});
  startBattleCamera(view.cameraRig,actors,events,time,timing,{run,skill,counter,speed,reducedMotion:quiet,enabled:cameraEnabled});startLoop();return timing;
}
document.addEventListener('visibilitychange',()=>{resetFrameSampling();if(document.hidden){stopBattleCamera();stopTowerMapTravel();skipUltimate();cancelAnimationFrame(raf);raf=0;}updateVisualActivity();if(!document.hidden)startLoop();});
window.addEventListener('pagehide',()=>{pagePaused=true;resetFrameSampling();stopBattleCamera();stopTowerMapTravel();skipUltimate();cancelAnimationFrame(raf);raf=0;updateVisualActivity();});
window.addEventListener('pageshow',()=>{pagePaused=false;refreshDevicePolicy();});
window.addEventListener('devicepowerchange',refreshDevicePolicy);
motion.addEventListener('change',()=>{resetFrameSampling();if(motion.matches){stopBattleCamera();stopTowerMapTravel();skipUltimate();}if(view?.vfx){view.vfx.reducedMotion=motion.matches||!graphics.effects;if(view.vfx.reducedMotion)view.vfx.clear();}startLoop();});
document.addEventListener('keydown',e=>{if(!activeUltimate)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();skipUltimate();}else if(e.key==='Tab'){e.preventDefault();activeUltimate.overlay.querySelector('button').focus();}},true);
