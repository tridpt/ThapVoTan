import test from 'node:test';
import assert from 'node:assert/strict';
import {T,enemyModel,disposeScene,arenaCamera,animateModel} from '../js/models3d.mjs';
import {attachBossVisual,syncBossVisual,animateBossVisual} from '../js/boss3d.mjs';
import {attachBossPartsVisual,syncBossPartsVisual,breakBossPartVisual,bossPartPoint,animateBossPartsVisual,createBossTelegraph,syncBossTelegraph,animateBossTelegraph,pickBossPart} from '../js/boss-parts3d.mjs';
import * as E from '../js/engine.mjs';
import {BOSS} from '../js/data.mjs';

function modelFor(id){const model=enemyModel({kind:'boss',bossId:id});attachBossVisual(model,id);attachBossPartsVisual(model);model.position.set(0,.09,-3.75);model.rotation.y=-.28;model.scale.setScalar(.95);return model;}
const parts=()=>E.createBossParts({maxHp:1000});

test('all eleven bosses have three distinct armor targets with finite geometry inside mobile camera bounds',()=>{
  for(const id of Object.keys(BOSS))for(const aspect of [321/430,593/570,1440/570]){const model=modelFor(id),camera=arenaCamera(aspect),p=parts();syncBossVisual(model,{phase:2,move:'strike',alive:true,frozen:false},0);syncBossPartsVisual(model,p,0);const points=E.BOSS_PART_IDS.map(id=>bossPartPoint(model,id));assert.equal(new Set(points.map(p=>p.toArray().join(','))).size,3);
    for(const time of [0,1.5,8]){animateModel(model,time);animateBossVisual(model,time);animateBossPartsVisual(model,time);let meshes=0,vertices=0;model.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(meshes<=92,`${id}: ${meshes}`);assert.ok(vertices<80000,`${id}: ${vertices}`);const box=new T.Box3().setFromObject(model);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const point=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(point.x)<1&&point.y> -1&&point.y<.9,`${id}/${aspect} fits`);}}
    disposeScene(model);
  }
});

test('ray picking selects all parts, both arm plates and broken targets without selecting a hidden legacy boss',()=>{
  for(const id of Object.keys(BOSS)){const model=modelFor(id),p=parts();syncBossPartsVisual(model,p,0);const v=model.userData.bossPartsVisual;for(const part of E.BOSS_PART_IDS)for(const shell of v.parts[part].shells){model.updateWorldMatrix(true,true);const point=v.parts[part].group.localToWorld(shell.position.clone().add(new T.Vector3(0,0,.15))),origin=point.clone().add(new T.Vector3(0,0,8)),ray=new T.Raycaster(origin,point.clone().sub(origin).normalize());assert.equal(pickBossPart(model,ray),part,`${id}/${part}`);p[part].hp=0;syncBossPartsVisual(model,p,1);assert.equal(pickBossPart(model,ray),part);}
    syncBossPartsVisual(model,null,2);const point=bossPartPoint(model,'core'),ray=new T.Raycaster(point.clone().add(new T.Vector3(0,0,8)),new T.Vector3(0,0,-1));assert.equal(pickBossPart(model,ray),null);disposeScene(model);
  }
});

test('break animation occurs once at the impact time; restored armor stays broken without replaying debris',()=>{
  const model=modelFor('colossus'),p=parts();syncBossPartsVisual(model,p,0);const v=model.userData.bossPartsVisual;breakBossPartVisual(model,'head',1);animateBossPartsVisual(model,.5);assert.ok(v.parts.head.shells.every(s=>s.node.visible));animateBossPartsVisual(model,1.25);const atTime=v.parts.head.shells.map(s=>s.node.scale.toArray());for(let n=0;n<30;n++)animateBossPartsVisual(model,1.25);assert.deepEqual(v.parts.head.shells.map(s=>s.node.scale.toArray()),atTime);animateBossPartsVisual(model,2);assert.ok(v.parts.head.shells.every(s=>!s.node.visible));const t=v.parts.head.breakAt;breakBossPartVisual(model,'head',3);assert.equal(v.parts.head.breakAt,t);
  p.head.hp=0;const restored=modelFor('colossus');syncBossPartsVisual(restored,p,20);assert.ok(restored.userData.bossPartsVisual.parts.head.shells.every(s=>!s.node.visible));assert.equal(restored.userData.bossPartsVisual.parts.head.breakAt,-10);disposeScene(model);disposeScene(restored);
});

test('armor materials are independent, reduced motion is static and disposal cannot break the next instance',()=>{
  const a=modelFor('stormwing'),b=modelFor('stormwing'),p=parts();syncBossPartsVisual(a,p,0);syncBossPartsVisual(b,p,0);const av=a.userData.bossPartsVisual,bv=b.userData.bossPartsVisual;assert.notEqual(av.parts.head.mat,bv.parts.head.mat);assert.equal(av.parts.head.shells[0].node.geometry,bv.parts.head.shells[0].node.geometry);let freed=0,sharedFreed=0;av.parts.head.mat.addEventListener('dispose',()=>freed++);av.parts.head.shells[0].node.geometry.addEventListener('dispose',()=>sharedFreed++);breakBossPartVisual(a,'head',0);animateBossPartsVisual(a,1,{reducedMotion:true});const before=av.parts.core.marker.scale.toArray();animateBossPartsVisual(a,99,{reducedMotion:true});assert.deepEqual(av.parts.core.marker.scale.toArray(),before);assert.ok(bv.parts.head.shells.every(s=>s.node.visible));disposeScene(a);assert.equal(freed,1);assert.equal(sharedFreed,0);animateBossPartsVisual(b,2);assert.ok(bv.parts.head.shells.every(s=>s.node.visible));disposeScene(b);
});

test('telegraph zones match attack and charge targets, stay readable without motion, and release their own materials',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);const scene=new T.Scene(),v=createBossTelegraph(scene,s.run.heroes);s.run.battle.bossState.move='quake';s.run.heroes[0].hp=0;syncBossTelegraph(v,s.run);assert.deepEqual([...v.markers].filter(([,n])=>n.visible).map(([id])=>id),['aerin','lumi']);const red=v.markers.get('lumi').material.color.getHex();s.run.battle.bossState.move='charge';syncBossTelegraph(v,s.run);assert.notEqual(v.markers.get('lumi').material.color.getHex(),red);animateBossTelegraph(v,1,{reducedMotion:true});const snapshot=[...v.markers.values()].map(n=>[n.material.opacity,...n.scale.toArray()]);animateBossTelegraph(v,100,{reducedMotion:true});assert.deepEqual([...v.markers.values()].map(n=>[n.material.opacity,...n.scale.toArray()]),snapshot);s.run.battle.enemies[0].freeze=1;syncBossTelegraph(v,s.run);assert.ok([...v.markers.values()].every(n=>!n.visible));let freed=0;for(const n of v.markers.values())n.material.addEventListener('dispose',()=>freed++);disposeScene(scene);assert.equal(freed,3);
});
