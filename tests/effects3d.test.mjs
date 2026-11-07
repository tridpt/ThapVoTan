import test from 'node:test';
import assert from 'node:assert/strict';
import {T,makeModel,disposeScene} from '../js/models3d.mjs';
import {CombatEffects3D} from '../js/effects3d.mjs';

test('hundreds of overlapping EX casts keep effects bounded and release every transient material',()=>{
  const scene=new T.Scene(),hero=makeModel('hero','aion');scene.add(hero);
  const effects=new CombatEffects3D(scene,{capacity:96});let allocated=0,disposed=0;
  for(let turn=0;turn<200;turn++){
    const time=turn*.02,position={x:(turn%3-1)*3.4,z:-3.75};
    effects.cast({x:0,z:3.45},'#f3e4b5',time,{skill:true,rank:6});effects.impact(position,'#f3e4b5',time,{skill:true,rank:6});
    for(const item of effects.items)if(item.kind==='pulse'&&!item.node.userData.counted){item.node.userData.counted=true;allocated++;item.node.material.addEventListener('dispose',()=>disposed++);}
    effects.step(time);assert.ok(effects.items.length<=96);assert.ok(scene.children.length<=97);
    for(const item of effects.items)assert.ok([...item.node.position.toArray(),...item.node.scale.toArray()].every(Number.isFinite));
  }
  effects.step(100);assert.equal(effects.active,false);assert.equal(disposed,allocated);assert.deepEqual(scene.children,[hero]);disposeScene(scene);
});

test('spell impacts wait for projectiles, expire on time and share immutable geometry across casts',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene),a=new T.Vector3(0,1.8,3),b=new T.Vector3(0,1.5,-3);
  effects.projectile(a,b,'#b4eaff',0,{skill:true,rank:3});effects.impact(b,'#b4eaff',0,{skill:true,rank:3});
  const projectile=effects.items.find(f=>f.kind==='projectile'),pulse=effects.items.find(f=>f.kind==='pulse');
  effects.step(.1);assert.equal(pulse.node.visible,false);assert.ok(projectile.node.position.z<a.z&&projectile.node.position.z>b.z);
  effects.step(.3);assert.equal(pulse.node.visible,true);assert.ok(!scene.children.includes(projectile.node));
  const geometry=pulse.node.geometry;effects.pulse(b,'#aaffbb',1);assert.equal(effects.items.at(-1).node.geometry,geometry);
  effects.step(2);assert.equal(effects.active,false);assert.equal(scene.children.length,0);assert.deepEqual(a.toArray(),[0,1.8,3]);assert.deepEqual(b.toArray(),[0,1.5,-3]);
});

test('reduced motion removes travelling and expanding effects while keeping a short visual response',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene,{reducedMotion:true});
  effects.projectile({x:0,z:3},{x:0,z:-3},'#aaffbb',0,{skill:true});assert.equal(effects.active,false);
  effects.impact({x:0,z:-3},'#aaffbb',0,{skill:true,rank:6,heal:true});assert.equal(effects.items.length,4);
  effects.step(.1);const first=effects.items.map(f=>[...f.node.position.toArray(),...f.node.scale.toArray()]);
  effects.step(.2);effects.items.forEach((f,i)=>{assert.deepEqual(f.node.position.toArray(),first[i].slice(0,3));if(f.kind==='pulse')assert.deepEqual(f.node.scale.toArray(),first[i].slice(3));});
  effects.clear();assert.equal(effects.active,false);assert.equal(scene.children.length,0);
});

test('bow arrows release on cue, face the target and arrive at the scheduled impact',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene),from=new T.Vector3(1,1.8,3),to=new T.Vector3(-2,1.5,-3);
  const arrow=effects.projectile(from,to,'#ccffe0',0,{weapon:'bow',skill:true,delay:.3,life:.28});effects.impact(to,'#ccffe0',0,{weapon:'bow',delay:.58});
  effects.step(.2);assert.equal(arrow.node.visible,false);assert.equal(effects.items.some(i=>i.node.visible),false);
  effects.step(.4);assert.equal(arrow.node.visible,true);assert.ok(arrow.node.position.distanceTo(from)>1);const forward=new T.Vector3(0,0,1).applyQuaternion(arrow.node.quaternion),direction=to.clone().sub(from).normalize();assert.ok(forward.dot(direction)>.98);
  effects.step(.59);assert.ok(!scene.children.includes(arrow.node));assert.ok(effects.items.some(i=>i.kind==='particle'&&i.node.visible));effects.clear();assert.equal(scene.children.length,0);
});

test('contact slashes and armor sparks begin on cue, follow directed trajectories and expire without mutating positions',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene),position=new T.Vector3(1,1.35,-3),before=position.toArray();
  effects.meleeTrail(position,'#e6d4b3',0,{weapon:'dagger',delay:.3});effects.armorSparks(position,0,{delay:.4,critical:true,source:{x:1,z:3}});
  effects.step(.2);assert.ok(effects.items.every(f=>!f.node.visible));effects.step(.41);assert.ok(effects.items.some(f=>f.kind==='meleeTrail'&&f.node.visible));
  const spark=effects.items.find(f=>f.kind==='metalSpark');assert.ok(spark.node.position.z>position.z);assert.ok(spark.node.position.y>position.y);assert.deepEqual(position.toArray(),before);
  effects.step(2);assert.equal(effects.active,false);assert.equal(scene.children.length,0);
});

test('seven elemental contacts have distinct geometry or motion and bounded richer layers at high rarities',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene),signatures=new Set();
  for(const element of ['Hỏa','Băng','Lôi','Phong','Thổ','Quang','Ảnh']){
    const low=effects.elementImpact({x:0,y:1.35,z:0},element,0),high=effects.elementImpact({x:0,y:1.35,z:0},element,0,{rank:6});assert.ok(high.node.children.length>low.node.children.length);assert.ok(high.node.children.length<=6);
    effects.step(.2);signatures.add(JSON.stringify(low.parts.map(p=>[p.node.geometry.type,p.node.geometry.parameters,...p.node.rotation.toArray().slice(0,3),...p.node.scale.toArray()])));
    for(const part of high.parts)assert.ok([...part.node.position.toArray(),...part.node.scale.toArray()].every(Number.isFinite));effects.clear();
  }assert.equal(signatures.size,7);assert.equal(scene.children.length,0);
});

test('contact feedback at 2x has the same normalized pose and finishes twice as quickly',()=>{
  for(const kind of ['melee','sparks','element']){
    const a=new CombatEffects3D(new T.Scene()),b=new CombatEffects3D(new T.Scene());
    const add=(fx,speed)=>kind==='melee'?fx.meleeTrail({x:0,y:1,z:0},'#ffd4a0',0,{speed}):kind==='sparks'?fx.armorSparks({x:0,y:1,z:0},0,{speed}):fx.elementImpact({x:0,y:1,z:0},'Băng',0,{speed});add(a,1);add(b,2);a.step(.1);b.step(.05);
    for(let i=0;i<a.items.length;i++){assert.deepEqual(a.items[i].node.position.toArray(),b.items[i].node.position.toArray());assert.deepEqual(a.items[i].node.scale.toArray(),b.items[i].node.scale.toArray());}a.clear();b.clear();
  }
});

test('reduced motion suppresses every new moving effect and rapid contacts keep a capped pool with disposed unique materials',()=>{
  const scene=new T.Scene(),effects=new CombatEffects3D(scene,{capacity:24,reducedMotion:true});
  effects.meleeTrail({x:0,z:0},'#ffd4a0',0);effects.armorSparks({x:0,z:0},0);effects.elementImpact({x:0,z:0},'Lôi',0);assert.equal(effects.active,false);
  effects.reducedMotion=false;let allocated=0,disposed=0;const track=()=>{for(const f of effects.items)f.node.traverse(n=>{if(n.material&&!n.material.userData.shared3d&&!n.material.userData.counted){n.material.userData.counted=true;allocated++;n.material.addEventListener('dispose',()=>disposed++);}});};
  for(let i=0;i<80;i++){effects.elementImpact({x:0,z:0},'Lôi',i*.01,{rank:6});track();effects.armorSparks({x:0,z:0},i*.01,{critical:true});track();assert.ok(effects.items.length<=24);}effects.clear();assert.equal(disposed,allocated);assert.equal(scene.children.length,0);
});
