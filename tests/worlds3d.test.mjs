import test from 'node:test';
import assert from 'node:assert/strict';
import {T,disposeScene,arenaCamera} from '../js/models3d.mjs';
import {WORLDS,worldForRun,createWorld,animateWorld,setWorldDanger} from '../js/worlds3d.mjs';
import * as E from '../js/engine.mjs';

test('all tower conditions preserve base worlds, reuse bounded weather and have visible distinct static landmarks',()=>{
  const original=structuredClone(WORLDS),palettes=new Set();
  for(const id of ['forest','ice','lava','sky'])for(const anomaly of E.ANOMALIES)for(const compact of [true,false]){
    const world=createWorld(id,{compact,anomaly:anomaly.id});assert.equal(world.data.id,id);assert.equal(world.anomaly,anomaly.id);assert.equal(world.data.accent,anomaly.color);assert.ok(world.root.getObjectByName('anomaly:'+anomaly.id));assert.equal(world.seeds.length,compact?24:42);assert.equal(world.leaves.length,0);
    let draws=0,vertices=0;world.root.traverse(o=>{if(!o.geometry)return;draws++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});assert.ok(draws<=70,`${id}/${anomaly.id}: ${draws} calls`);assert.ok(vertices<180000);
    animateWorld(world,2);const positions=Array.from(world.weather.geometry.attributes.position.array);animateWorld(world,8);assert.notDeepEqual(Array.from(world.weather.geometry.attributes.position.array),positions);
    animateWorld(world,9,{reducedMotion:true});const snapshot=()=>({positions:Array.from(world.weather.geometry.attributes.position.array),motion:world.motion.map(p=>p.node.matrixWorld.toArray()),background:world.background.getHex()});world.root.updateMatrixWorld(true);const still=snapshot();animateWorld(world,99,{reducedMotion:true});world.root.updateMatrixWorld(true);assert.deepEqual(snapshot(),still);
    palettes.add(world.data.background);disposeScene(world.root);
  }
  assert.equal(palettes.size,3);assert.deepEqual(WORLDS,original);
});

test('anomaly scenery does not obscure fighters and palette caches stay separate when revisiting a plain world',()=>{
  const plain=createWorld('forest'),color=plain.root.children[0].children.map(o=>o.material.color.getHex());
  for(const anomaly of E.ANOMALIES){
    const world=createWorld('forest',{compact:true,anomaly:anomaly.id});world.root.updateWorldMatrix(true,true);
    for(const aspect of [321/430,768/570,1440/570]){const camera=arenaCamera(aspect);for(const x of [-3.4,0,3.4])for(const z of [-3.75,3.45])for(const y of [.7,1.7,2.8]){const p=new T.Vector3(x,y,z),ray=new T.Raycaster(camera.position,p.clone().sub(camera.position).normalize(),.1,camera.position.distanceTo(p)-.1);const meshes=world.root.children.filter(o=>o!==world.weather);assert.equal(ray.intersectObjects(meshes,true).length,0,anomaly.id+' '+[x,y,z]);}
      if(anomaly.id!=='frost')for(const time of [0,3,8]){animateWorld(world,time);world.root.updateMatrixWorld(true);world.root.getObjectByName('anomaly:'+anomaly.id).traverse(o=>{if(!o.geometry)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).project(camera);assert.ok(Math.abs(v.x)<.95&&v.y<.91&&v.y>-.95,anomaly.id+' outside framing '+v.toArray());}});}
    }
    const again=createWorld('forest');assert.deepEqual(again.root.children[0].children.map(o=>o.material.color.getHex()),color);assert.notEqual(world.root.children[0].children[0].geometry,plain.root.children[0].children[0].geometry);disposeScene(again.root);disposeScene(world.root);
  }
  disposeScene(plain.root);
});

test('condition weather buffers are disposed once and effects-off keeps static landmarks without weather animation',()=>{
  for(const anomaly of E.ANOMALIES){const a=createWorld('forest',{anomaly:anomaly.id}),b=createWorld('forest',{anomaly:anomaly.id});let geometry=0,mat=0;a.weather.geometry.addEventListener('dispose',()=>geometry++);a.weather.material.addEventListener('dispose',()=>mat++);a.weather.visible=false;a.lowEffects=true;animateWorld(a,3);const landmark=a.root.getObjectByName('anomaly:'+anomaly.id).matrix.clone();animateWorld(a,100);assert.deepEqual(a.root.getObjectByName('anomaly:'+anomaly.id).matrix,landmark);assert.equal(a.root.getObjectByName('anomaly:'+anomaly.id).visible,true);disposeScene(a.root);assert.equal(geometry,1);assert.equal(mat,1);animateWorld(b,30);assert.ok(b.weather.geometry.attributes.position.array.every(Number.isFinite));disposeScene(b.root);}
});

test('four worlds rotate every ten tower floors, map all dungeon elements and leave saves unchanged',()=>{
  const save=E.createState();E.startRun(save,42);const original=structuredClone(save);
  for(const [floor,id] of [[1,'forest'],[10,'forest'],[11,'ice'],[20,'ice'],[21,'lava'],[30,'lava'],[31,'sky'],[40,'sky'],[41,'forest'],[100,'ice']])assert.equal(worldForRun({...save.run,floor}).id,id);
  const mapping={earth:'forest',wind:'sky',light:'sky',fire:'lava',shadow:'forest',ice:'ice',thunder:'sky'};
  for(const [id,world] of Object.entries(mapping))assert.equal(worldForRun({...save.run,dungeon:{id},floor:3}).id,world);
  assert.equal(worldForRun(null).id,'forest');assert.equal(worldForRun({floor:0}).id,'forest');assert.deepEqual(save,original);
});

test('each world stays within mobile geometry budgets and has distinct scenery and weather',()=>{
  const counts=[];
  for(const id of Object.keys(WORLDS))for(const compact of [true,false]){
    const world=createWorld(id,{compact});let draws=0,vertices=0;
    world.root.traverse(o=>{if(!o.geometry)return;draws++;const position=o.geometry.attributes.position;vertices+=position.count*(o.isInstancedMesh?o.count:1);assert.ok(position.array.every(Number.isFinite));if(o.geometry.attributes.normal)assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));});
    const bounds=new T.Box3().setFromObject(world.root);assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));assert.ok(draws<=65,`${id}/${compact}: ${draws} draw calls`);assert.ok(vertices<180000,`${id}/${compact}: ${vertices} vertices`);
    assert.equal(world.seeds.length,compact?24:42);assert.equal(world.weather.geometry.attributes.position.count,world.seeds.length*(id==='ruins'?2:1));
    if(!compact)counts.push(vertices);if(id==='sky')assert.equal(world.motion.length,10);if(id==='forest')assert.equal(world.leaves.length,1);disposeScene(world.root);
  }
  assert.equal(new Set(counts).size,5);
});

test('world landmarks leave all three hero and enemy body positions unobstructed',()=>{
  for(const id of Object.keys(WORLDS))for(const aspect of [321/430,768/570,1440/570]){
    const world=createWorld(id,{compact:true}),camera=arenaCamera(aspect);world.root.updateWorldMatrix(true,true);
    for(const x of [-3.4,0,3.4])for(const z of [-3.75,3.45])for(const y of [.7,1.7,2.8]){
      const target=new T.Vector3(x,y,z),direction=target.clone().sub(camera.position).normalize(),ray=new T.Raycaster(camera.position,direction,.1,camera.position.distanceTo(target)-.1);
      const hits=ray.intersectObjects(world.root.children.slice(0,2),true);assert.equal(hits.length,0,`${id} at ${x},${y},${z} occluded by scenery`);
    }
    disposeScene(world.root);
  }
});

test('weather and drifting scenery are deterministic, bounded and stationary with reduced motion',()=>{
  for(const id of Object.keys(WORLDS)){
    const world=createWorld(id),snapshot=()=>({weather:[...world.weather.geometry.attributes.position.array],motion:world.motion.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray()]),leaves:world.leaves.map(p=>[...p.instanceMatrix.array])});
    animateWorld(world,7.5);const atSeven=snapshot();for(let i=0;i<50;i++)animateWorld(world,7.5);assert.deepEqual(snapshot(),atSeven);
    animateWorld(world,1000000);assert.ok(world.weather.geometry.attributes.position.array.every(Number.isFinite));
    for(let i=0;i<world.seeds.length;i++){const positions=world.weather.geometry.attributes.position;assert.ok(positions.getY(i)>=.15&&positions.getY(i)<=5.15);assert.ok(Math.abs(positions.getX(i))<7);assert.ok(Math.abs(positions.getZ(i))<7);}
    animateWorld(world,11,{reducedMotion:true});const still=snapshot();animateWorld(world,99,{reducedMotion:true});assert.deepEqual(snapshot(),still);disposeScene(world.root);
  }
});

test('phase II atmosphere blends once and restores instantly on resume or reduced motion',()=>{
  for(const id of Object.keys(WORLDS)){
    const world=createWorld(id);setWorldDanger(world,true,10);animateWorld(world,10.4);assert.ok(world.danger>0&&world.danger<1);const halfway=world.danger;setWorldDanger(world,true,10.4);animateWorld(world,11);assert.equal(world.danger,1);assert.notEqual(world.background.getHexString(),world.calmColor.getHexString());assert.ok(halfway<world.danger);
    setWorldDanger(world,false,12,{instant:true});animateWorld(world,12);assert.equal(world.danger,0);assert.equal(world.background.getHexString(),world.calmColor.getHexString());
    setWorldDanger(world,true,13,{instant:true});animateWorld(world,13);assert.equal(world.danger,1);
    setWorldDanger(world,false,14);animateWorld(world,14,{reducedMotion:true});assert.equal(world.danger,0);disposeScene(world.root);
  }
});

test('leaving a world releases weather resources without disposing cached scenery or the next instance',()=>{
  for(const id of Object.keys(WORLDS)){
    const a=createWorld(id),b=createWorld(id);let geometryFreed=0,materialFreed=0,cacheFreed=0,instancesFreed=0;
    a.weather.geometry.addEventListener('dispose',()=>geometryFreed++);a.weather.material.addEventListener('dispose',()=>materialFreed++);
    a.leaves.forEach(leaves=>leaves.addEventListener('dispose',()=>instancesFreed++));
    assert.notEqual(a.weather.geometry,b.weather.geometry);assert.equal(a.root.children[0].children[0].geometry,b.root.children[0].children[0].geometry);
    a.root.children[0].children[0].geometry.addEventListener('dispose',()=>cacheFreed++);disposeScene(a.root);assert.equal(geometryFreed,1);assert.equal(materialFreed,1);assert.equal(instancesFreed,a.leaves.length);assert.equal(cacheFreed,0);animateWorld(b,5);assert.ok(new T.Box3().setFromObject(b.root).getSize(new T.Vector3()).length()>10);disposeScene(b.root);
  }
});
