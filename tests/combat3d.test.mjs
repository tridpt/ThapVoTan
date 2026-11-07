import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../js/data.mjs';
import {T,heroModel,disposeScene,arenaCamera} from '../js/models3d.mjs';
import {WEAPONS,combatTiming,combatPose,applyCombatPose,attackProgress,animateFighter} from '../js/combat3d.mjs';

test('weapon timings preserve release-before-impact, finish at both speeds and reduce motion',()=>{
  const timings=new Set();
  for(const weapon of WEAPONS)for(const skill of [false,true]){
    const t=combatTiming(weapon,{skill}),fast=combatTiming(weapon,{skill,speed:2});timings.add(t.duration);
    assert.ok(t.release>0&&t.release<t.impact&&t.impact<t.duration);assert.equal(fast.duration,t.duration/2);assert.equal(fast.impact,t.impact/2);
    assert.ok(Math.abs(t.flight-(t.impact-t.release))<1e-9);assert.equal(attackProgress(10,10,t.duration),0);assert.equal(attackProgress(20,10,t.duration),1);
    assert.deepEqual(combatTiming(weapon,{skill,reducedMotion:true}),{duration:230,release:0,impact:0,flight:0,melee:false});
  }
  assert.ok(timings.size>=6);assert.ok(combatTiming('unknown').duration>0);
});

test('every hero has independent arm and weapon pivots, deterministic poses and exact rest reset',()=>{
  for(const h of HEROES){
    const a=heroModel(h.id),b=heroModel(h.id),snapshot=m=>m.userData.combatRig.map(p=>p.node.rotation.toArray());
    assert.equal(a.userData.combatRig.length,2);const rest=snapshot(a);
    for(const t of [.15,.35,.55,.8]){applyCombatPose(a,t,{skill:true});const pose=snapshot(a);if(t===.35)assert.notDeepEqual(pose,rest);for(let i=0;i<30;i++)applyCombatPose(a,t,{skill:true});assert.deepEqual(snapshot(a),pose);assert.deepEqual(snapshot(b),rest);const bounds=new T.Box3().setFromObject(a);assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));}
    for(const options of [{},{reducedMotion:true},{frozen:true}]){applyCombatPose(a,(options.reducedMotion||options.frozen)?.5:1,options);assert.deepEqual(snapshot(a),rest);assert.equal(a.userData.body.rotation.x,0);assert.equal(a.userData.body.rotation.y,0);}
    disposeScene(a);disposeScene(b);
  }
});

test('real fighter movement keeps weapon swings in the arena and does not react before a hit lands',()=>{
  for(const aspect of [321/430,768/570,1440/570])for(const h of HEROES)for(const x of [-3.4,3.4]){
    const model=heroModel(h.id),timing=combatTiming(h.weapon,{skill:true}),unit={model,x,z:3.45,angle:.12,scale:.88,phase:0,attackAt:0,attackDuration:timing.duration,attackSkill:true,attackTarget:{x:0,z:-3.75},hitAt:10},camera=arenaCamera(aspect);
    for(const progress of [0,.25,.45,.7,.95,1]){
      animateFighter(unit,progress*timing.duration/1000);const bounds=new T.Box3().setFromObject(model);
      for(const bx of [bounds.min.x,bounds.max.x])for(const by of [bounds.min.y,bounds.max.y])for(const bz of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(bx,by,bz).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${h.id} swing fits ${aspect}/${progress}: ${p.toArray()}`);}
    }
    animateFighter(unit,0,{reducedMotion:true});assert.deepEqual(model.position.toArray(),[x,.09,3.45]);assert.deepEqual(model.scale.toArray(),[.88,.88,.88]);assert.equal(model.rotation.y,.12);disposeScene(model);
  }
});

test('weapon poses distinguish melee reach, bow draw, staff casting and floating orb stance',()=>{
  const poses=WEAPONS.map(w=>combatPose(w,.45,{skill:true}));assert.equal(new Set(poses.map(p=>JSON.stringify(p))).size,6);
  for(const weapon of ['sword','dagger','shield'])assert.ok(combatPose(weapon,.45).lunge>.4);
  for(const weapon of ['bow','staff','orb'])assert.equal(combatPose(weapon,.45).lunge,0);
  assert.ok(combatPose('orb',.45).lift>.1);assert.notDeepEqual(combatPose('bow',.3).left,combatPose('bow',.65).left);
  for(const weapon of WEAPONS)for(const t of [-1,0,1,2,NaN])assert.deepEqual(combatPose(weapon,t),combatPose(weapon,0));
});

test('counter lunges are shorter in time, restore every pose and keep the speed ratio without skill bonuses',()=>{
  for(const weapon of WEAPONS){
    const normal=combatTiming(weapon),counter=combatTiming(weapon,{counter:true}),fast=combatTiming(weapon,{counter:true,speed:2});
    assert.equal(counter.duration,normal.duration*.78);assert.equal(fast.impact,counter.impact/2);assert.ok(counter.release<counter.impact&&counter.impact<counter.duration);
    assert.ok(combatPose(weapon,.43,{counter:true}).lunge>combatPose(weapon,.43).lunge);
    for(const options of [{counter:true,reducedMotion:true},{counter:true,frozen:true}])assert.deepEqual(combatPose(weapon,.43,options),combatPose(weapon,0));
    assert.deepEqual(combatPose(weapon,1,{counter:true}),combatPose(weapon,0));assert.equal(combatTiming(weapon,{counter:true,reducedMotion:true}).duration,230);
  }
});
