import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../js/data.mjs';
import {T,heroModel,arenaCamera,disposeScene,animateModel} from '../js/models3d.mjs';
import {animateFighter,combatTiming} from '../js/combat3d.mjs';
import {createUltimateScene,animateUltimate,ULTIMATES} from '../js/ultimate3d.mjs';

test('all 20 signature weapons have separate finite geometry, shared caches and independent poses',()=>{
  for(const h of HEROES){const normal=heroModel(h.id),sig=heroModel(h.id,{signature:true}),next=heroModel(h.id,{signature:true});let original=0,extra=0,meshes=0;
    normal.traverse(o=>{if(o.isMesh)original+=o.geometry.attributes.position.count;});sig.traverse(o=>{if(o.isMesh){meshes++;extra+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(extra>original,`${h.id} has a new weapon silhouette`);assert.ok(extra<65000&&meshes<=85);assert.equal(sig.userData.signature,true);assert.equal(normal.userData.signature,false);assert.equal(sig.userData.combatRig[0].node.children[0].geometry,next.userData.combatRig[0].node.children[0].geometry);
    sig.userData.combatRig[0].node.rotation.x=1;assert.notEqual(next.userData.combatRig[0].node.rotation.x,1);disposeScene(sig);animateModel(next,1);assert.ok(new T.Box3().setFromObject(next).getSize(new T.Vector3()).y>3);disposeScene(normal);disposeScene(next);
  }
});

test('signature weapon swings stay inside arena cameras and reset under reduced motion',()=>{
  for(const aspect of [321/430,593/570,1440/570])for(const h of HEROES)for(const x of [-3.4,0,3.4]){
    const model=heroModel(h.id,{signature:true}),timing=combatTiming(h.weapon,{skill:true}),camera=arenaCamera(aspect),unit={model,x,z:3.45,angle:.12,scale:.88,phase:0,attackAt:0,attackDuration:timing.duration,attackSkill:true,attackTarget:{x:0,z:-3.75},hitAt:10};
    for(const p of [0,.18,.35,.5,.7,.95,1.1]){animateFighter(unit,p*timing.duration/1000);animateModel(model,p);const box=new T.Box3().setFromObject(model);for(const bx of [box.min.x,box.max.x])for(const by of [box.min.y,box.max.y])for(const bz of [box.min.z,box.max.z]){const v=new T.Vector3(bx,by,bz).project(camera);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1,`${h.id} signature fits ${aspect}/${p}`);}}
    animateFighter(unit,50,{reducedMotion:true});assert.deepEqual(model.position.toArray(),[x,.09,3.45]);disposeScene(model);
  }
});

test('all four ultimate scenes use the equipped signature and frame it throughout the animation',()=>{
  for(const id of Object.keys(ULTIMATES))for(const aspect of [360/780,768/1024,1280/800]){const v=createUltimateScene(id,aspect,{signature:true});assert.equal(v.model.userData.signature,true);for(const t of [0,.4,1.2,2.2]){animateUltimate(v,t);const box=new T.Box3().setFromObject(v.model);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(v.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${id} ultimate signature framed`);}}disposeScene(v.scene);}
});
