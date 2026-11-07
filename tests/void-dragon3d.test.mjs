import test from 'node:test';
import assert from 'node:assert/strict';
import {T,enemyModel,disposeScene,arenaCamera,animateModel} from '../js/models3d.mjs';
import {attachBossVisual,readBossVisual,syncBossVisual,animateBossVisual} from '../js/boss3d.mjs';
import {attachBossPartsVisual,syncBossPartsVisual,bossPartPoint,pickBossPart} from '../js/boss-parts3d.mjs';
import {createWorld,animateWorld} from '../js/worlds3d.mjs';
import {account,reachStage,DRAGON} from './void-dragon-helper.mjs';
const make=()=>{const m=enemyModel({kind:'boss',bossId:DRAGON});attachBossVisual(m,DRAGON);attachBossPartsVisual(m);return m;};
const pose=m=>{m.updateWorldMatrix(true,true);return [m.userData.body,...m.userData.wings,...m.userData.bossVisual.moving.map(p=>p.node)].map(n=>[...n.position.toArray(),...n.rotation.toArray(),...n.scale.toArray()]);};

test('obsidian dragon has two separately baked animated wings and bounded, finite mobile geometry',()=>{
  const m=make(),bounds=new T.Box3().setFromObject(m);let meshes=0,vertices=0;m.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;for(const name of ['position','normal'])if(o.geometry.attributes[name])assert.ok(o.geometry.attributes[name].array.every(Number.isFinite));});
  assert.equal(m.userData.wings.length,2);assert.equal(m.userData.motionParts.filter(p=>p.kind==='dragon-wing').length,2);assert.ok(bounds.getSize(new T.Vector3()).x>4.5);assert.ok(meshes<85,meshes);assert.ok(vertices<75000,vertices);assert.equal(m.userData.bossVisual.spec.theme,'voidstorm');disposeScene(m);
});

test('flight, landing and core barrier read the real three stages without changing combat state',()=>{
  for(const stage of [0,1,2]){const s=reachStage(account(),stage),before=structuredClone(s),m=make(),r=s.run,status=readBossVisual(r,r.battle.enemies[0]);syncBossVisual(m,status,0);animateModel(m,1);assert.equal(status.airborne,stage===0);assert.equal(status.barrier,stage===1);assert.equal(m.userData.bossVisual.barrier.visible,stage===1);assert.equal(m.userData.bossVisual.phaseRoot.visible,stage===2);assert.equal(m.userData.body.position.y>0,stage===0);assert.deepEqual(s,before);
    if(stage===0){r.battle.bossState.parts.arms.hp=0;syncBossVisual(m,readBossVisual(r,r.battle.enemies[0]),2);animateModel(m,2);assert.equal(m.userData.dragon.airborne,false);assert.equal(m.userData.body.position.y,0);assert.ok(Math.abs(m.userData.wings[0].rotation.y)>.8);}
    if(stage===1){r.battle.bossState.parts.core.hp=0;syncBossVisual(m,readBossVisual(r,r.battle.enemies[0]),2);assert.equal(m.userData.bossVisual.barrier.visible,false);}
    disposeScene(m);
  }
});

test('dragon animations are repeatable, frozen under reduced motion and independent between instances',()=>{
  const a=make(),b=make(),state={phase:2,move:'charge',alive:true,frozen:false,airborne:true,barrier:false};syncBossVisual(a,state,0);syncBossVisual(b,state,0);animateModel(b,0);const untouched=pose(b);
  animateModel(a,5);animateBossVisual(a,5);const atFive=pose(a);for(let i=0;i<30;i++){animateModel(a,5);animateBossVisual(a,5);}assert.deepEqual(pose(a),atFive);assert.deepEqual(pose(b),untouched);
  animateModel(a,10,{reducedMotion:true});animateBossVisual(a,10,{reducedMotion:true});const still=pose(a);animateModel(a,100,{reducedMotion:true});animateBossVisual(a,100,{reducedMotion:true});assert.deepEqual(pose(a),still);disposeScene(a);animateModel(b,11);assert.ok(new T.Box3().setFromObject(b).getSize(new T.Vector3()).y>3);disposeScene(b);
});

test('all dragon phases, flight and folded wings fit phone, tablet and wide arena cameras',()=>{
  for(const aspect of [321/430,593/570,1080/570,1440/570])for(const stage of [0,1,2]){
    const m=make(),camera=arenaCamera(aspect),s=reachStage(account(),stage);m.position.set(0,.09,-3.75);m.rotation.y=-.28;m.scale.setScalar(.95);syncBossVisual(m,readBossVisual(s.run,s.run.battle.enemies[0]),0);syncBossPartsVisual(m,s.run.battle.bossState.parts,0);
    for(const time of [0,1.5,5,21]){animateModel(m,time);animateBossVisual(m,time);const bounds=new T.Box3().setFromObject(m);for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&p.y> -1&&p.y<.9,`phase ${stage} aspect ${aspect}: ${p.toArray()}`);}}
    disposeScene(m);
  }
});

test('dragon-specific head, wing and core armor locations remain selectable after flight and landing',()=>{
  const s=reachStage(account(),0),m=make();syncBossVisual(m,readBossVisual(s.run,s.run.battle.enemies[0]),0);syncBossPartsVisual(m,s.run.battle.bossState.parts,0);animateModel(m,1);
  for(const id of ['head','arms','core']){const point=bossPartPoint(m,id);assert.ok(point.toArray().every(Number.isFinite));const origin=point.clone().add(new T.Vector3(0,0,10)),ray=new T.Raycaster(origin,new T.Vector3(0,0,-1));assert.equal(pickBossPart(m,ray),id);}
  assert.ok(bossPartPoint(m,'head').y>2.6);assert.ok(bossPartPoint(m,'arms').x>1);disposeScene(m);
});

test('ruined temple rain and slow lightning honor reduced effects and dispose only instance-owned resources',()=>{
  const a=createWorld('ruins'),b=createWorld('ruins');assert.equal(a.weather.isLineSegments,true);assert.equal(a.motion.filter(m=>m.kind==='lightning').length,2);animateWorld(a,12);
  const positions=[...a.weather.geometry.attributes.position.array];animateWorld(a,12);assert.deepEqual([...a.weather.geometry.attributes.position.array],positions);
  animateWorld(a,22,{reducedMotion:true});assert.ok(a.motion.filter(m=>m.kind==='lightning').every(m=>!m.node.visible));const still=[...a.weather.geometry.attributes.position.array];animateWorld(a,72,{reducedMotion:true});assert.deepEqual([...a.weather.geometry.attributes.position.array],still);
  let released=0;a.weather.geometry.addEventListener('dispose',()=>released++);a.weather.material.addEventListener('dispose',()=>released++);for(const p of a.motion.filter(m=>m.kind==='lightning'))p.node.traverse(o=>{if(o.material)o.material.addEventListener('dispose',()=>released++);});disposeScene(a.root);assert.equal(released,4);animateWorld(b,100);assert.ok(b.weather.geometry.attributes.position.array.every(Number.isFinite));disposeScene(b.root);
});
