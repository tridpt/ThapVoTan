import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO} from '../js/data.mjs';
import {SKINS} from '../js/skins.mjs';
import {HERO_ULTIMATES,ultimateSpec,hasUltimate} from '../js/ultimate-data.mjs';
import {createUltimateScene,animateUltimate,ultimateMarkup} from '../js/ultimate3d.mjs';
import {createHeroSpell,animateHeroSpell,poseHeroUltimate} from '../js/hero-ultimates3d.mjs';
import {T,heroModel,disposeScene} from '../js/models3d.mjs';

const snapshot=root=>{const rows=[];root.traverse(o=>rows.push([o.visible,...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray(),o.material?.opacity]));return rows;};
const ids=Object.keys(HERO_ULTIMATES);
const corners=box=>{const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z));return points;};

test('starter storyboards raise a wall, rain arrows, spread healing wings and send a real phoenix toward its target',()=>{
  const wall=createHeroSpell('rook',ultimateSpec('rook')),slab=wall.parts.find(p=>p.kind==='wall');animateHeroSpell(wall,.1);const low=slab.node.scale.y;animateHeroSpell(wall,.65);assert.ok(slab.node.scale.y>low*10);
  const rain=createHeroSpell('aerin',ultimateSpec('aerin')),arrow=rain.parts.find(p=>p.kind==='arrow');animateHeroSpell(rain,.4);const high=arrow.node.position.clone();animateHeroSpell(rain,.6);assert.equal(arrow.node.visible,true);assert.ok(arrow.node.position.y<high.y);assert.ok(arrow.node.position.distanceTo(arrow.to)<high.distanceTo(arrow.to));
  const dawn=createHeroSpell('lumi',ultimateSpec('lumi')),wing=dawn.parts.find(p=>p.kind==='wing');animateHeroSpell(dawn,.1);const folded=wing.node.scale.x;animateHeroSpell(dawn,.7);assert.ok(wing.node.scale.x>folded*5);assert.ok(dawn.parts.filter(p=>p.kind==='beam').every(p=>p.node.visible));
  const fire=createHeroSpell('ember',ultimateSpec('ember')),bird=fire.parts.find(p=>p.kind==='phoenix');animateHeroSpell(fire,.2);const start=bird.node.position.clone();animateHeroSpell(fire,.6);assert.ok(bird.node.position.distanceTo(bird.to)<start.distanceTo(bird.to));assert.ok(bird.wings.every(w=>w.node.children.length>=3));
  [wall,rain,dawn,fire].forEach(v=>disposeScene(v.root));
});

test('all 16 articulated storyboards have a full-body cast pose and restore arms under reduced motion',()=>{
  for(const id of ids){const a=heroModel(id),b=heroModel(id),original=snapshot(b);poseHeroUltimate(a,.42);assert.notDeepEqual(snapshot(a),original);assert.deepEqual(snapshot(b),original);
    if(id==='aerin')assert.ok(a.position.y>.5);if(id==='rook')assert.ok(a.position.y<0);
    poseHeroUltimate(a,.4,{reducedMotion:true,baseY:.09,angle:.12});assert.equal(a.position.y,.09);assert.equal(a.rotation.y,.12);assert.ok(a.userData.combatRig.every(p=>p.node.rotation.equals(p.rotation)));
    [a,b].forEach(disposeScene);
  }
});

test('costumes and signatures carry into all four cinematics and use outfit colors without mutating hero or costume definitions',()=>{
  const heroes=structuredClone(HERO),skins=structuredClone(SKINS);
  for(const skin of SKINS){const v=createUltimateScene(skin.hero,1,{skin:skin.id,signature:true});assert.equal(v.model.userData.skin,skin.id);assert.equal(v.model.userData.signature,true);assert.equal(v.spec.color,skin.color);assert.equal(v.spec.accent,skin.accent);
    const html=ultimateMarkup(skin.hero,{skin:skin.id});assert.ok(html.includes(skin.name));assert.ok(html.includes(`--ultimate:${skin.color}`));assert.ok(html.includes(HERO[skin.hero].skill));disposeScene(v.scene);
  }
  assert.deepEqual(HERO,heroes);assert.deepEqual(SKINS,skins);assert.equal(hasUltimate('constructor'),false);assert.equal(createUltimateScene('constructor'),null);assert.throws(()=>createUltimateScene('rook',1,{skin:'ember-phoenix'}));
});

test('starter model, costume, raised weapon and important spell props stay inside portrait and landscape cameras at every phase',()=>{
  for(const skin of SKINS)for(const costume of [null,skin.id])for(const aspect of [.46,.75,1.6,2.17]){
    const v=createUltimateScene(skin.hero,aspect,{skin:costume,signature:true});
    for(const phase of [0,.15,.35,.48,.62,.75,.9,1]){animateUltimate(v,phase*v.duration/1000);const bounds=new T.Box3().setFromObject(v.model);for(const node of v.action.focus)if(node.visible)bounds.expandByObject(node);
      for(const point of corners(bounds)){point.project(v.camera);assert.ok([point.x,point.y,point.z].every(Number.isFinite));assert.ok(Math.abs(point.x)<.98&&Math.abs(point.y)<.98,`${skin.id}/${aspect}/${phase}`);}}
    disposeScene(v.scene);
  }
});

test('compact starter scenes reduce geometry and all costume/signature combinations stay within a mobile cinematic budget',()=>{
  for(const skin of SKINS){const counts=[];for(const compact of [false,true]){const v=createUltimateScene(skin.hero,1,{skin:skin.id,signature:true,compact});let meshes=0,vertices=0;
      v.scene.traverse(o=>{if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;vertices+=p.count;assert.equal(p.count,n.count);assert.ok(p.array.every(Number.isFinite));assert.ok(n.array.every(Number.isFinite));});
      assert.ok(meshes<130,`${skin.id}: ${meshes} meshes`);assert.ok(vertices<65000,`${skin.id}: ${vertices} vertices`);counts.push({meshes,vertices});disposeScene(v.scene);
    }assert.ok(counts[1].meshes<counts[0].meshes);assert.ok(counts[1].vertices<counts[0].vertices);}
});

test('2x halves scene duration and produces the same complete storyboard at the same normalized phase',()=>{
  for(const skin of SKINS){const a=createUltimateScene(skin.hero,1,{skin:skin.id}),b=createUltimateScene(skin.hero,1,{skin:skin.id,speed:2});assert.equal(a.duration/2,b.duration);
    for(const phase of [.2,.5,.7,.95]){animateUltimate(a,a.duration*phase/1000);animateUltimate(b,b.duration*phase/1000);assert.deepEqual(snapshot(a.action.root),snapshot(b.action.root));assert.deepEqual(snapshot(a.model),snapshot(b.model));}
    [a,b].forEach(v=>disposeScene(v.scene));
  }
});

test('spell animation is deterministic, resets to a still pose, and frees unique geometry/materials exactly once',()=>{
  for(const id of ids){const v=createUltimateScene(id),other=createUltimateScene(id),before=snapshot(other.action.root);animateUltimate(v,1.3);const pose=snapshot(v.action.root);for(let i=0;i<30;i++)animateUltimate(v,1.3);assert.deepEqual(snapshot(v.action.root),pose);assert.deepEqual(snapshot(other.action.root),before);
    animateUltimate(v,.4,{reducedMotion:true});const quiet=snapshot(v.action.root);animateUltimate(v,2,{reducedMotion:true});assert.deepEqual(snapshot(v.action.root),quiet);
    const geometry=new Set(),materials=new Set();let freed=0;v.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)geometry.add(o.geometry);if(o.material&&!o.material.userData.shared3d)materials.add(o.material);});for(const resource of [...geometry,...materials])resource.addEventListener('dispose',()=>freed++);
    disposeScene(v.scene);assert.equal(freed,geometry.size+materials.size);assert.ok(new T.Box3().setFromObject(other.model).getSize(new T.Vector3()).y>3);disposeScene(other.scene);
  }
});
