import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES} from '../js/data.mjs';
import {SKINS} from '../js/skins.mjs';
import {T,heroModel,animateModel,disposeScene,arenaCamera} from '../js/models3d.mjs';
import {applyCombatPose,animateFighter,syncFighterState,combatTiming} from '../js/combat3d.mjs';
import {animateHeroIdle,poseHeroWalk,poseHeroFall,poseHeroCast} from '../js/hero-motion3d.mjs';
const pose=model=>model.userData.heroRig.rest.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray()]);
const armPose=model=>model.userData.combatRig.map(p=>p.node.rotation.toArray());
const unit=model=>({model,x:0,z:0,angle:0,scale:1,phase:0,attackAt:-10,attackDuration:1,hitAt:-10,alive:true,fallAt:null,reviveAt:null});
const nearPose=(a,b)=>{const aa=pose(a).flat(),bb=pose(b).flat();assert.equal(aa.length,bb.length);for(let i=0;i<aa.length;i++)if(typeof aa[i]==='number')assert.ok(Math.abs(aa[i]-bb[i])<1e-12,`joint component ${i}: ${aa[i]} / ${bb[i]}`);else assert.equal(aa[i],bb[i]);};

test('all 20 heroes and owned outfits articulate real hips, knees and cloth with independent instance transforms',()=>{
  for(const [id,skin] of [...HEROES.map(h=>[h.id,null]),...SKINS.map(s=>[s.hero,s.id])]){
    const a=heroModel(id,{skin,signature:true}),b=heroModel(id,{skin,signature:true}),rest=pose(a),otherArms=armPose(b),rig=a.userData.heroRig;
    assert.equal(rig.legs.length,2);assert.equal(rig.capes.length,2);assert.equal(rig.waist.parent,rig.hips);
    assert.ok(rig.legs.every(l=>l.knee.parent===l.node&&l.node.parent===rig.hips));
    applyCombatPose(a,.35,{skill:true,time:.35});assert.notDeepEqual(pose(a),rest);assert.ok(Math.abs(rig.waist.rotation.x)+Math.abs(rig.waist.rotation.y)>.01,id);
    assert.ok(rig.legs.some(l=>l.knee.rotation.x>.05));assert.ok(rig.capes.some(c=>Math.abs(c.node.rotation.x)>.05));
    assert.deepEqual(pose(b),rest);assert.deepEqual(armPose(b),otherArms);
    for(let i=0;i<20;i++)applyCombatPose(a,.35,{skill:true,time:.35});const stable=pose(a);applyCombatPose(a,.35,{skill:true,time:.35});assert.deepEqual(pose(a),stable);
    for(const options of [{},{reducedMotion:true},{frozen:true}]){applyCombatPose(a,(options.reducedMotion||options.frozen)?.35:1,options);assert.deepEqual(pose(a),rest);assert.deepEqual(armPose(a),otherArms);}
    const meshes=m=>{const out=[];m.traverse(o=>{if(o.isMesh)out.push(o);});return out;};const ma=meshes(a),mb=meshes(b);
    assert.equal(ma.length,mb.length);for(let i=0;i<ma.length;i++){assert.equal(ma[i].geometry,mb[i].geometry);assert.equal(ma[i].material,mb[i].material);}
    [a,b].forEach(disposeScene);
  }
});

test('class idle stances and split capes breathe without drift and exactly stop for freeze or reduced motion',()=>{
  const stances=new Set();
  for(const id of ['rook','kael','kira','aerin','lumi','ember']){
    const m=heroModel(id),rest=pose(m),arms=armPose(m);animateModel(m,3);const atThree=pose(m);stances.add(JSON.stringify(atThree));
    animateModel(m,6);assert.notDeepEqual(pose(m),atThree);animateModel(m,3);assert.deepEqual(pose(m),atThree);
    for(const opts of [{reducedMotion:true},{frozen:true}]){animateModel(m,6,opts);assert.deepEqual(pose(m),rest);assert.deepEqual(armPose(m),arms);animateModel(m,100,opts);assert.deepEqual(pose(m),rest);}
    disposeScene(m);
  }
  assert.equal(stances.size,6);
});

test('interrupting attack, walk, cast and death never leaks an old joint pose into another animation',()=>{
  const a=heroModel('eclipse'),b=heroModel('eclipse');
  for(const action of [()=>applyCombatPose(a,.45,{skill:true}),()=>poseHeroWalk(a,1),()=>poseHeroCast(a,.4),()=>poseHeroFall(a,1)]){
    action();animateHeroIdle(a,4);animateHeroIdle(b,4);assert.deepEqual(pose(a),pose(b));assert.deepEqual(armPose(a),armPose(b));assert.equal(a.userData.ornaments.visible,true);
  }
  [a,b].forEach(disposeScene);
});

test('bow strings really draw and release while keeping mutable geometry private and disposing it once',()=>{
  const a=heroModel('aerin'),b=heroModel('aerin'),string=a.userData.heroRig.bowString,other=b.userData.heroRig.bowString;
  assert.ok(string&&other);assert.notEqual(string.geometry,other.geometry);let freed=0,materialFreed=0;
  string.geometry.addEventListener('dispose',()=>freed++);string.material.addEventListener('dispose',()=>materialFreed++);
  applyCombatPose(a,.25);assert.ok(string.geometry.attributes.position.getZ(1)<-.3);assert.equal(other.geometry.attributes.position.getZ(1),0);
  const timing=combatTiming('bow');applyCombatPose(a,timing.release/timing.duration);assert.equal(string.geometry.attributes.position.getZ(1),0);
  applyCombatPose(a,.25);animateModel(a,1,{reducedMotion:true});assert.equal(string.geometry.attributes.position.getZ(1),0);
  disposeScene(a);assert.equal(freed,1);assert.equal(materialFreed,1);applyCombatPose(b,.25);assert.ok(other.geometry.attributes.position.getZ(1)<-.3);disposeScene(b);
});

test('fallen heroes wait for impact, kneel then fall, remain visible and recover only after a healing impact',()=>{
  const u=unit(heroModel('kira'));syncFighterState(u,0,10,{impactAt:10.4});assert.equal(u.fallAt,10.4);
  animateFighter(u,10.39);assert.equal(u.model.userData.heroRig.hips.rotation.x,0);
  animateFighter(u,10.4+.82*.3);assert.ok(u.model.userData.heroRig.legs.every(l=>l.knee.rotation.x>1));
  animateFighter(u,11.4);assert.equal(u.model.userData.heroRig.hips.rotation.x,1.46);assert.equal(u.model.visible,true);assert.equal(u.model.userData.ornaments.visible,false);
  const fallen=pose(u.model);syncFighterState(u,0,11.5);assert.equal(u.fallAt,10.4);animateFighter(u,11.7);assert.deepEqual(pose(u.model),fallen);
  syncFighterState(u,50,12,{impactAt:12.4});animateFighter(u,12.3);assert.deepEqual(pose(u.model),fallen);
  animateFighter(u,12.6);assert.ok(u.model.userData.heroRig.hips.rotation.x>0&&u.model.userData.heroRig.hips.rotation.x<1.46);
  animateFighter(u,13.2);const fresh=unit(heroModel('kira'));animateFighter(fresh,13.2);nearPose(u.model,fresh.model);assert.equal(u.model.userData.ornaments.visible,true);
  [u.model,fresh.model].forEach(disposeScene);
});

test('death and healing use the same normalized poses at 2x and reduced motion immediately restores a still result',()=>{
  const a=unit(heroModel('lumi')),b=unit(heroModel('lumi'));
  syncFighterState(a,0,0,{impactAt:.4});syncFighterState(b,0,0,{impactAt:.2,speed:2});
  for(const p of [0,.2,.5,.8,1]){animateFighter(a,.4+.82*p);animateFighter(b,.2+.41*p);const pa=pose(a.model).flat(),pb=pose(b.model).flat();for(let i=0;i<pa.length;i++)if(typeof pa[i]==='number')assert.ok(Math.abs(pa[i]-pb[i])<1e-12);}
  animateFighter(a,5,{reducedMotion:true});const still=pose(a.model);animateFighter(a,50,{reducedMotion:true});assert.deepEqual(pose(a.model),still);
  syncFighterState(a,10,50,{immediate:true});animateFighter(a,50,{reducedMotion:true});assert.equal(a.model.userData.heroRig.hips.rotation.x,0);assert.equal(a.model.userData.ornaments.visible,true);
  [a.model,b.model].forEach(disposeScene);
});

test('hit reaction waits for the contact, recoils away from its source and stops completely when frozen or effects are disabled',()=>{
  const u=unit(heroModel('kael'));u.x=2;u.z=3;u.hitAt=10.4;u.hitSource={x:-1,z:-2};
  animateFighter(u,10.39);assert.equal(u.model.position.x,2);assert.equal(u.model.position.z,3);
  animateFighter(u,10.45);assert.ok(u.model.position.x>2&&u.model.position.z>3);assert.ok(u.model.userData.heroRig.waist.rotation.x<0);
  animateFighter(u,10.45,{reducedMotion:true});assert.deepEqual(u.model.position.toArray(),[2,.09,3]);
  u.frozen=true;animateFighter(u,10.45);const fixed=pose(u.model);assert.deepEqual(u.model.position.toArray(),[2,.09,3]);animateFighter(u,11);assert.deepEqual(pose(u.model),fixed);
  u.frozen=false;animateFighter(u,11);assert.equal(u.model.position.x,2);assert.equal(u.model.position.z,3);disposeScene(u.model);
});

test('articulated attacks, walks and falls with EX weapons keep finite geometry and fit both phone and landscape cameras',()=>{
  for(const hero of HEROES){const m=heroModel(hero.id,{signature:true,weaponRarity:'EX'}),u=unit(m);u.x=3.4;u.z=3.45;u.scale=.88;
    for(const p of [0,.25,.5,.75,1])for(const action of [()=>applyCombatPose(m,p,{skill:true}),()=>poseHeroWalk(m,p),()=>poseHeroFall(m,p)]){
      action();m.position.set(u.x,.09,u.z);m.scale.setScalar(u.scale);const box=new T.Box3().setFromObject(m);
      for(const v of [...box.min.toArray(),...box.max.toArray()])assert.ok(Number.isFinite(v));
      for(const aspect of [.46,2.2]){const cam=arenaCamera(aspect);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const v=new T.Vector3(x,y,z).project(cam);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1,`${hero.id}/${p}/${aspect}`);}}
    }
    disposeScene(m);
  }
});
