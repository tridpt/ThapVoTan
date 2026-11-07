import test from 'node:test';
import assert from 'node:assert/strict';
import {T,makeModel,enemyModel,disposeScene,material,arenaCamera,animateModel} from '../js/models3d.mjs';
import {HEROES} from '../js/data.mjs';
import {PETS,DUNGEON_BOSSES} from '../js/adventure-data.mjs';

const cases=[...HEROES.map(h=>['hero',h.id]),...PETS.map(p=>['pet',p.id]),...DUNGEON_BOSSES.map(b=>['boss',b.id]),['tower','tower'],...['colossus','archivist','ashknight','moonwarden'].map(id=>['boss',id]),['enemy-kind','sentinel'],['enemy-kind','wraith']];

test('every playable character and boss produces finite, bounded 3D geometry within the mobile budget',()=>{
  for(const [type,id] of cases){
    const model=makeModel(type,id),bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());let meshes=0,vertices=0;
    for(const n of [...bounds.min.toArray(),...bounds.max.toArray()])assert.ok(Number.isFinite(n),`${type}:${id} finite bounds`);
    assert.ok(size.x>0&&size.y>0&&size.z>0&&size.length()<20,`${id} fits its scene`);
    model.traverse(o=>{if(!o.isMesh)return;meshes++;const pos=o.geometry.getAttribute('position'),norm=o.geometry.getAttribute('normal');vertices+=pos.count;assert.equal(pos.count,norm.count);assert.ok(pos.array.every(Number.isFinite),`${id} has finite vertices`);assert.ok(norm.array.every(Number.isFinite),`${id} has finite normals`);});
    assert.ok(meshes>0&&meshes<=70,`${id}: ${meshes} draw calls`);assert.ok(vertices<50000,`${id}: ${vertices} vertices`);
    disposeScene(model);
  }
});

test('reopening a model reuses geometry and materials without sharing animation transforms',()=>{
  const first=makeModel('hero','aion'),second=makeModel('hero','aion');
  const a=[],b=[];first.traverse(o=>{if(o.isMesh)a.push(o);});second.traverse(o=>{if(o.isMesh)b.push(o);});
  assert.equal(a.length,b.length);let disposed=0;
  for(let i=0;i<a.length;i++){assert.equal(a[i].geometry,b[i].geometry);assert.equal(a[i].material,b[i].material);a[i].geometry.addEventListener('dispose',()=>disposed++);}
  first.userData.body.rotation.x=.5;assert.equal(second.userData.body.rotation.x,0);disposeScene(first);assert.equal(disposed,0);
  assert.ok(new T.Box3().setFromObject(second).getSize(new T.Vector3()).y>3);
});

test('leaving a scene frees unique meshes, materials and shadow maps exactly once',()=>{
  const scene=new T.Scene(),geometry=new T.TorusGeometry(2,.1,4,24),unique=new T.MeshBasicMaterial(),shared=material('#abcdef');let geomDisposed=0,matDisposed=0,sharedDisposed=0,shadowDisposed=0;
  geometry.addEventListener('dispose',()=>geomDisposed++);unique.addEventListener('dispose',()=>matDisposed++);shared.addEventListener('dispose',()=>sharedDisposed++);
  scene.add(new T.Mesh(geometry,unique),new T.Mesh(geometry,unique),new T.Mesh(geometry,shared),makeModel('pet','mossling'));
  const light=new T.DirectionalLight();light.shadow.map={dispose(){shadowDisposed++;}};scene.add(light);disposeScene(scene);
  assert.equal(geomDisposed,1);assert.equal(matDisposed,1);assert.equal(sharedDisposed,0);assert.equal(shadowDisposed,1);
});

test('summoned tower enemies use separate transforms while keeping their cached model',()=>{
  const a=enemyModel({id:'shadow1',kind:'wraith'}),b=enemyModel({id:'shadow2',kind:'wraith'});
  a.position.x=3;assert.equal(b.position.x,0);assert.equal(a.children[0].children[0].geometry,b.children[0].children[0].geometry);
  assert.ok(new T.Box3().setFromObject(b).getSize(new T.Vector3()).y>2);
});

test('phone, tablet and wide arena cameras keep every character head and foot inside the frame',()=>{
  for(const aspect of [321/430,593/570,1080/570,1440/570]){
    const camera=arenaCamera(aspect);
    for(const [type,id] of cases.filter(([type])=>type!=='tower'&&type!=='pet'))for(const x of [-3.4,0,3.4]){
      const model=makeModel(type,id);model.position.set(x,.09,type==='hero'?3.45:-3.75);model.scale.setScalar(type==='boss'?.95:.88);
      for(const time of [0,1.5,5,21]){
      animateModel(model,time);const bounds=new T.Box3().setFromObject(model);
      for(const bx of [bounds.min.x,bounds.max.x])for(const by of [bounds.min.y,bounds.max.y])for(const bz of [bounds.min.z,bounds.max.z]){
        const p=new T.Vector3(bx,by,bz).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${id} fits ${aspect.toFixed(2)}: ${p.x},${p.y}`);
      }
      }
      disposeScene(model);
    }
  }
});

test('moving rarity ornaments and creature wings are deterministic, independent and reset for reduced motion or freeze',()=>{
  for(const [type,id] of [['hero','aion'],['hero','orion'],['pet','zephyr'],['pet','raiju']]){
    const a=makeModel(type,id),b=makeModel(type,id),parts=a.userData.motionParts;assert.ok(parts.length>0,`${id} has moving parts`);
    const pose=model=>model.userData.motionParts.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray()]);
    const original=pose(a);animateModel(a,3);assert.notDeepEqual(pose(a),original);assert.deepEqual(pose(b),original);
    const atThree=pose(a);for(let i=0;i<100;i++)animateModel(a,3);assert.deepEqual(pose(a),atThree);
    animateModel(a,9,{reducedMotion:true});assert.deepEqual(pose(a),original);
    animateModel(a,900);animateModel(a,10,{frozen:true});assert.deepEqual(pose(a),original);
    for(const p of parts)assert.ok([...p.node.position.toArray(),p.node.rotation.x,p.node.rotation.y,p.node.rotation.z].every(Number.isFinite));
    disposeScene(a);disposeScene(b);
  }
});
