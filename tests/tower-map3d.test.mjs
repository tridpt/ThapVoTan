import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {T,disposeScene} from '../js/models3d.mjs';
import {createTowerMapScene,towerMapKey,fitTowerMapCamera,towerNodeScreen,syncTowerMapFocus,startTowerTravel,finishTowerTravel,animateTowerMap,pickTowerNode} from '../js/tower-map3d.mjs';

const state=()=>{const s=E.createState();E.startRun(s,42);return s;};
function budget(view){let meshes=0,vertices=0;view.scene.traverse(o=>{if(o.isMesh&&view.camera.layers.test(o.layers)){meshes++;vertices+=o.geometry.attributes.position.count*(o.isInstancedMesh?o.count:1);}});return {meshes,vertices};}
function assertVisible(view){
  view.scene.updateMatrixWorld(true);
  for(const node of view.nodes.values()){
    const p=towerNodeScreen(view,node.id);assert.ok(p.x>7&&p.x<93,`${node.id} x ${p.x}`);assert.ok(p.y>7&&p.y<90,`${node.id} y ${p.y}`);
    const bounds=new T.Box3().setFromObject(node.group);for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new T.Vector3(x,y,z).project(view.camera);assert.ok(Math.abs(v.x)<.99&&Math.abs(v.y)<.99,`${node.id} geometry ${v.toArray()}`);}
  }
}
test('all islands, gates and labels fit portrait, narrow Android and landscape map cameras',()=>{
  const s=state(),before=structuredClone(s);
  for(const compact of [false,true]){
    const view=createTowerMapScene(s,{compact});assert.equal(view.nodes.size,13);assert.equal(view.bridges.length,21);assert.equal(view.units.length,3);
    for(const aspect of [.5,.6,.72,1,1.5,2]){fitTowerMapCamera(view.camera,aspect);assertVisible(view);}
    const use=budget(view);assert.ok(use.meshes<240,JSON.stringify(use));assert.ok(use.vertices<100000,JSON.stringify(use));disposeScene(view.scene);
  }
  assert.deepEqual(s,before);
});
test('islands can be picked with a real ray and inspection changes the glow without changing the party or account',()=>{
  const s=state(),before=structuredClone(s),view=createTowerMapScene(s);fitTowerMapCamera(view.camera,.72);
  for(const node of view.nodes.values()){
    const p=node.position.clone().add(new T.Vector3(0,.2,0)).project(view.camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),view.camera);assert.equal(pickTowerNode(view,ray),node.id);
    syncTowerMapFocus(view,node.id);animateTowerMap(view,3,{reducedMotion:true});assert.equal(node.ring.scale.x,1.13);
  }
  assert.deepEqual(s,before);assert.deepEqual(view.party.position.toArray(),[0,-.12,8.75]);disposeScene(view.scene);
});
test('party travels across the actual selected bridge, halves duration at 2x and restores still poses on completion',()=>{
  const s=state(),before=structuredClone(s),a=createTowerMapScene(s),b=createTowerMapScene(s),id='1:1';
  assert.equal(startTowerTravel(a,id,10),760);assert.equal(startTowerTravel(b,id,10,{speed:2}),380);
  const from=a.party.position.clone(),to=a.nodes.get(id).position.clone();animateTowerMap(a,10.38);animateTowerMap(b,10.19);
  assert.ok(a.party.position.distanceTo(from.clone().lerp(to,.5))<1e-9);assert.ok(a.party.position.distanceTo(b.party.position)<1e-9);assert.ok(a.units.some(u=>u.model.position.y>.18));
  animateTowerMap(a,10.761);animateTowerMap(b,10.381);assert.equal(a.travel,null);assert.equal(b.travel,null);assert.ok(a.party.position.distanceTo(to)<1e-9);assert.ok(a.units.every(u=>u.model.position.y===.18));assert.deepEqual(s,before);disposeScene(a.scene);disposeScene(b.scene);
});
test('map resumes the party on the saved previous island and keeps costume and snapshotted signature appearance',()=>{
  const s=state();s.best=10;s.gold=10000;s.dust=100;s.armory.marks.colossus=10;E.finishRun(s);const gear=E.forgeGear(s,'signature-rook');E.equipGear(s,gear.id,'rook');E.equipSkin(s,'rook','rook-guardian');E.startRun(s,73);E.chooseRoute(s,1);
  const before=structuredClone(s),a=createTowerMapScene(s),key=towerMapKey(s);assert.ok(a.party.position.equals(a.nodes.get('1:1').position));assert.equal(a.units[0].model.userData.signature,true);assert.equal(a.units[0].model.userData.skin,'rook-guardian');
  E.equipSkin(s,'rook',null);assert.notEqual(towerMapKey(s),key);const b=createTowerMapScene(s);assert.equal(b.units[0].model.userData.skin,null);assert.deepEqual(s.run,before.run);disposeScene(a.scene);disposeScene(b.scene);
});
test('effects off and reduced motion produce stationary maps, instant travel and no gameplay mutations',()=>{
  const s=state(),view=createTowerMapScene(s,{effects:false}),before=structuredClone(s);syncTowerMapFocus(view,'1:0');assert.equal(view.motes.visible,false);
  animateTowerMap(view,1,{reducedMotion:true});view.scene.updateMatrixWorld(true);const first=[];view.scene.traverse(o=>first.push(o.matrixWorld.toArray()));animateTowerMap(view,9,{reducedMotion:true});view.scene.updateMatrixWorld(true);const second=[];view.scene.traverse(o=>second.push(o.matrixWorld.toArray()));assert.deepEqual(second,first);
  assert.equal(startTowerTravel(view,'1:0',9,{reducedMotion:true}),0);assert.equal(view.travel,null);assert.ok(view.party.position.equals(view.nodes.get('1:0').position));assert.equal(startTowerTravel(view,'5:1',10),0);assert.equal(startTowerTravel(view,'missing',10),0);
  startTowerTravel(view,'1:1',11);finishTowerTravel(view);assert.equal(view.travel,null);assert.ok(view.party.position.equals(view.nodes.get('1:1').position));assert.deepEqual(s,before);disposeScene(view.scene);
});
test('unique map resources are disposed exactly once and a second scene retains independent buffers and transforms',()=>{
  const s=state(),a=createTowerMapScene(s),b=createTowerMapScene(s),unique=new Set(),counts=new Map();
  a.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)unique.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!m.userData.shared3d)unique.add(m);});
  for(const resource of unique)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)||0)+1));
  assert.notEqual(a.motes.geometry,b.motes.geometry);assert.notEqual(a.motes.material,b.motes.material);startTowerTravel(a,'1:2',1);animateTowerMap(a,1.3);assert.notDeepEqual(a.party.position.toArray(),b.party.position.toArray());disposeScene(a.scene);assert.ok(unique.size>=6);assert.equal(counts.size,unique.size);assert.ok([...counts.values()].every(n=>n===1));animateTowerMap(b,3);assert.ok(b.units.every(u=>Number.isFinite(u.model.position.y)));disposeScene(b.scene);
});

test('instanced map stones and bridges keep high-rarity teams within the mobile draw budget and free their instance buffers',()=>{
  const s=E.createState();s.team=['aion','eclipse','orion'];for(const id of s.team)s.owned[id]={level:1,copies:0,awaken:0};E.startRun(s,42);
  for(const compact of [false,true]){
    const view=createTowerMapScene(s,{compact}),instances=[];view.scene.traverse(o=>{if(o.isInstancedMesh)instances.push(o);});const use=budget(view);assert.ok(use.meshes<240,JSON.stringify(use));assert.ok(use.vertices<100000,JSON.stringify(use));assert.ok(instances.length>0);let freed=0;for(const batch of instances)batch.addEventListener('dispose',()=>freed++);
    const node=view.nodes.get('1:1'),p=node.position.clone().add(new T.Vector3(0,.2,0)).project(view.camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),view.camera);const mask=ray.layers.mask;assert.equal(pickTowerNode(view,ray),'1:1');assert.equal(ray.layers.mask,mask);disposeScene(view.scene);assert.equal(freed,instances.length);
  }
});
