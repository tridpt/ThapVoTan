import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as E from '../js/engine.mjs';
import {SKINS} from '../js/skins.mjs';
import {T,heroModel,disposeScene,animateModel,arenaCamera} from '../js/models3d.mjs';
import {createLobbyScene,fitLobbyCamera,lobbyKey} from '../js/lobby3d.mjs';
const meshes=root=>{const result=[];root.traverse(o=>{if(o.isMesh)result.push(o);});return result;};
const fingerprint=root=>{const hash=createHash('sha256');for(const m of meshes(root))hash.update(Buffer.from(m.geometry.attributes.position.array.buffer));return hash.digest('hex');};
const pose=m=>m.userData.motionParts.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray()]);
function unlocked(){const s=E.createState();s.best=10;s.armory.hunts.colossus={best:1,clears:3};s.armory.hunts.ashknight={best:1,clears:3};for(const skin of SKINS)E.equipSkin(s,skin.hero,skin.id);return s;}
function corners(box){const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z));return points;}

test('all four costumes change body and weapon geometry, stay finite and fit the mobile mesh budget with signatures',()=>{
  for(const skin of SKINS){
    const base=heroModel(skin.hero),model=heroModel(skin.hero,{skin:skin.id});
    assert.notEqual(fingerprint(model.userData.body),fingerprint(base.userData.body));
    assert.notEqual(fingerprint(model.userData.combatRig[1].node),fingerprint(base.userData.combatRig[1].node));
    for(const signature of [false,true]){
      const m=heroModel(skin.hero,{skin:skin.id,signature}),list=meshes(m);let vertices=0;
      assert.ok(list.length<=70);assert.equal(m.userData.signature,signature);assert.equal(m.userData.skin,skin.id);
      for(const node of list){const p=node.geometry.attributes.position,n=node.geometry.attributes.normal;vertices+=p.count;assert.equal(n.count,p.count);assert.ok(p.array.every(Number.isFinite));assert.ok(n.array.every(Number.isFinite));}
      assert.ok(vertices<50000,`${skin.id}: ${vertices}`);disposeScene(m);
    }
    disposeScene(base);disposeScene(model);
  }
});

test('base, outfit and signature caches remain isolated after repeated switching and disposal',()=>{
  for(const skin of SKINS){
    const base=heroModel(skin.hero),original=fingerprint(base),outfit=heroModel(skin.hero,{skin:skin.id}),dressed=fingerprint(outfit),sig=heroModel(skin.hero,{skin:skin.id,signature:true});
    assert.notEqual(fingerprint(sig),dressed);let freed=0;
    for(const m of meshes(outfit))m.geometry.addEventListener('dispose',()=>freed++);
    disposeScene(outfit);assert.equal(freed,0);
    for(let i=0;i<3;i++){
      const normal=heroModel(skin.hero),again=heroModel(skin.hero,{skin:skin.id}),signature=heroModel(skin.hero,{skin:skin.id,signature:true});
      assert.equal(fingerprint(normal),original);assert.equal(fingerprint(again),dressed);assert.equal(fingerprint(signature),fingerprint(sig));
      assert.equal(meshes(base)[0].geometry,meshes(normal)[0].geometry);assert.equal(meshes(outfit)[0].geometry,meshes(again)[0].geometry);assert.notEqual(meshes(base)[0].geometry,meshes(outfit)[0].geometry);
      again.userData.combatRig[0].node.rotation.x=.7;assert.notEqual(again.userData.combatRig[0].node.rotation.x,sig.userData.combatRig[0].node.rotation.x);
      [normal,again,signature].forEach(disposeScene);
    }
    [base,sig].forEach(disposeScene);
  }
});

test('costume wings, seals and sparks animate per instance, reset without drift and never mutate shared materials',()=>{
  for(const skin of SKINS){
    const a=heroModel(skin.hero,{skin:skin.id}),b=heroModel(skin.hero,{skin:skin.id}),initial=pose(a),colors=meshes(a).map(n=>[n.material,n.material.color.getHex(),n.material.emissiveIntensity]);
    assert.ok(initial.length>0);animateModel(a,3);const moved=pose(a);assert.notDeepEqual(moved,initial);assert.deepEqual(pose(b),initial);
    for(let i=0;i<20;i++)animateModel(a,3);assert.deepEqual(pose(a),moved);animateModel(a,99,{reducedMotion:true});assert.deepEqual(pose(a),initial);animateModel(a,20);animateModel(a,55,{frozen:true});assert.deepEqual(pose(a),initial);
    assert.ok(colors.every(([m,c,e])=>m.color.getHex()===c&&m.emissiveIntensity===e));[a,b].forEach(disposeScene);
  }
});

test('outfit silhouettes fit every row slot in portrait and landscape combat cameras while animated',()=>{
  for(const skin of SKINS)for(const front of [1,2])for(let slot=0;slot<3;slot++){
    const s=E.createState();s.formation={front};E.startRun(s,42);const pos=E.formationPosition(s.run,slot),m=heroModel(skin.hero,{skin:skin.id,signature:true});m.scale.setScalar(.88);m.position.set(pos.x,.09,pos.z);
    for(const time of [0,3,11]){
      animateModel(m,time);const points=corners(new T.Box3().setFromObject(m));
      for(const aspect of [.46,.85,1.6,2.1]){const camera=arenaCamera(aspect);for(const p of points){const v=p.clone().project(camera);assert.ok(Math.abs(v.x)<1&&Math.abs(v.y)<1,skin.id+' fits arena '+aspect);}}
    }
    disposeScene(m);
  }
});

test('lobby shows saved costumes during a live journey, rebuilds its key on equip and keeps models inside the camera',()=>{
  const s=unlocked();E.startRun(s,42);const snapshot=structuredClone(s.run),key=lobbyKey(s);E.equipSkin(s,'rook',null);assert.notEqual(lobbyKey(s),key);E.equipSkin(s,'rook','rook-guardian');
  for(const hero of ['rook','aerin','lumi','ember'])for(const slot of [0,1,2]){
    const ids=['rook','aerin','lumi','ember'].filter(id=>id!==hero).slice(0,2);ids.splice(slot,0,hero);
    // Independent fixture: test every outfit in each visible lobby position.
    const account=structuredClone(s);account.run=null;account.team=ids;const v=createLobbyScene(account,{compact:true});
    for(const aspect of [320/550,400/650,768/850,1440/850,850/430]){fitLobbyCamera(v.camera,aspect);for(const u of v.units){assert.equal(u.model.userData.skin,s.skins[u.id]);for(const p of corners(new T.Box3().setFromObject(u.model))){p.project(v.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,u.id+' fits lobby '+aspect);}}}
    disposeScene(v.scene);
  }
  const v=createLobbyScene(s);assert.equal(v.units[0].model.userData.skin,'rook-guardian');assert.deepEqual(s.run,snapshot);disposeScene(v.scene);
});
