import test from 'node:test';
import assert from 'node:assert/strict';
import {HEROES,HERO,RARITIES} from '../js/data.mjs';
import {ultimateSpec,HERO_ULTIMATES} from '../js/ultimate-data.mjs';
import {createUltimateScene,animateUltimate} from '../js/ultimate3d.mjs';
import {createHeroSpell,animateHeroSpell,poseHeroUltimate} from '../js/hero-ultimates3d.mjs';
import {T,heroModel,disposeScene} from '../js/models3d.mjs';

const starters=['rook','aerin','lumi','ember'],ids=Object.keys(HERO_ULTIMATES).filter(id=>!starters.includes(id));
const snapshot=root=>{const rows=[];root.traverse(o=>rows.push([o.visible,...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray(),o.material?.opacity]));return rows;};
function assertFramed(view,label){
  const bounds=new T.Box3().setFromObject(view.model);bounds.expandByObject(view.aura.root);
  for(const node of view.action.focus)if(node.visible)bounds.expandByObject(node);
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const point=new T.Vector3(x,y,z).project(view.camera);assert.ok(point.toArray().every(Number.isFinite),label);assert.ok(Math.abs(point.x)<.98&&Math.abs(point.y)<.98,label+': '+point.toArray());
  }
}

test('12 new storyboards contain recognizable hero-specific props and move them through windup and impact',()=>{
  const expected={kira:['shadow','sweep'],bryn:['ice','sigil'],raiden:['bolt','fallblade'],seraph:['note','light'],thorne:['root'],astra:['meteor','orbit'],nyx:['eclipse','drain'],kael:['flameblade','firewing'],eira:['aurora','spring'],veyron:['lance','stormorbit'],solis:['sun','eruption'],selene:['bloodmoon','crescent','drain']};
  assert.equal(ids.length,12);
  for(const id of ids){
    const spell=createHeroSpell(id,ultimateSpec(id));assert.equal(spell.expanded,true);for(const kind of expected[id])assert.ok(spell.parts.some(p=>p.kind===kind),id+'/'+kind);
    animateHeroSpell(spell,.12);const windup=snapshot(spell.root);animateHeroSpell(spell,.67);assert.notDeepEqual(snapshot(spell.root),windup,id);assert.ok(spell.parts.some(p=>p.node.visible),id);disposeScene(spell.root);
  }
});

test('new weapons use distinct full-body poses and return to their neutral articulated rotations',()=>{
  const poses=[];
  for(const id of ids){const model=heroModel(id,{signature:true});poseHeroUltimate(model,.42);poses.push(snapshot(model).slice(0,3));
    assert.ok(model.userData.combatRig.some(p=>!p.node.rotation.equals(p.rotation)),id);
    poseHeroUltimate(model,.7,{reducedMotion:true,baseY:.09,angle:-.4});assert.equal(model.position.y,.09);assert.equal(model.rotation.y,-.4);assert.ok(model.userData.body.rotation.toArray().slice(0,3).every(n=>n===0));assert.ok(model.userData.combatRig.every(p=>p.node.rotation.equals(p.rotation)));disposeScene(model);
  }
  assert.equal(new Set(poses.map(v=>JSON.stringify(v))).size,12);
});

test('raised weapons, full spells and rarity halos fit narrow phones and landscape with signatures at every shot phase',()=>{
  for(const id of ids)for(const compact of [false,true])for(const aspect of [.46,.75,1.6,2.17]){
    const view=createUltimateScene(id,aspect,{signature:true,compact});for(const phase of [0,.12,.3,.48,.62,.7,.85,1]){animateUltimate(view,phase*view.duration/1000);assertFramed(view,`${id}/${compact}/${aspect}/${phase}`);}disposeScene(view.scene);
  }
});

test('rarer ultimates gain one halo layer per rank and more motes, with smaller compact scenes at every rarity',()=>{
  let previous=-1;
  for(const rarity of RARITIES){const hero=HEROES.find(h=>h.rarity===rarity),full=createUltimateScene(hero.id),compact=createUltimateScene(hero.id,1,{compact:true}),rank=RARITIES.indexOf(rarity);
    assert.equal(full.aura.rank,rank);assert.equal(full.aura.rings.length,rank);assert.equal(compact.aura.rings.length,rank);assert.ok(full.aura.motes.length>previous);assert.ok(compact.aura.motes.length<full.aura.motes.length);previous=full.aura.motes.length;
    animateUltimate(full,.7,{reducedMotion:true});const still=snapshot(full.aura.root);animateUltimate(full,1.8,{reducedMotion:true});assert.deepEqual(snapshot(full.aura.root),still);[full,compact].forEach(v=>disposeScene(v.scene));
  }
});

test('all new full and compact signature scenes stay within finite mobile geometry budgets',()=>{
  for(const id of ids){const counts=[];for(const compact of [false,true]){
    const view=createUltimateScene(id,1,{compact,signature:true});let meshes=0,vertices=0;view.scene.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite),id);assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite),id);});
    assert.ok(meshes<170,`${id}: ${meshes} meshes`);assert.ok(vertices<85000,`${id}: ${vertices} vertices`);counts.push({meshes,vertices});disposeScene(view.scene);
  }assert.ok(counts[1].meshes<counts[0].meshes,id);assert.ok(counts[1].vertices<counts[0].vertices,id);}
});

test('2x plays the same new spell, pose and aura in half the duration without altering hero definitions',()=>{
  const data=structuredClone(HERO);
  for(const id of ids){const a=createUltimateScene(id,1,{signature:true}),b=createUltimateScene(id,1,{signature:true,speed:2});assert.equal(b.duration,a.duration/2);
    for(const phase of [.12,.4,.64,.8,1]){animateUltimate(a,a.duration*phase/1000);animateUltimate(b,b.duration*phase/1000);assert.deepEqual(snapshot(a.action.root),snapshot(b.action.root),id);assert.deepEqual(snapshot(a.model),snapshot(b.model),id);assert.deepEqual(snapshot(a.aura.root),snapshot(b.aura.root),id);} [a,b].forEach(v=>disposeScene(v.scene));
  }
  assert.deepEqual(HERO,data);
});

test('projectiles land at supplied targets and ice rises from the ground at the requested combat impact',()=>{
  const target=new T.Vector3(2.1,.1,-6.4);
  for(const id of ['astra','selene'])for(const impactAt of [.38,.65]){
    const spell=createHeroSpell(id,ultimateSpec(id),{targets:[target],impactAt});animateHeroSpell(spell,impactAt);
    for(const part of spell.parts.filter(p=>p.kind==='meteor'||p.kind==='crescent')){assert.ok(part.node.position.distanceTo(part.to)<1e-9,id);assert.equal(part.node.visible,true);}
    assert.deepEqual(target.toArray(),[2.1,.1,-6.4]);disposeScene(spell.root);
  }
  const spell=createHeroSpell('bryn',ultimateSpec('bryn'),{targets:[target],impactAt:.64}),ice=spell.parts.find(p=>p.kind==='ice');animateHeroSpell(spell,.56);assert.ok(ice.node.scale.y<ice.scale.y*.15);assert.ok(Math.abs(ice.node.position.y-ice.node.scale.y+.1)<1e-9);animateHeroSpell(spell,.75);assert.equal(ice.node.scale.y,ice.scale.y);disposeScene(spell.root);
});

test('reduced motion makes all new props still and disposing a cast leaves another live cast intact',()=>{
  for(const id of ids){const a=createUltimateScene(id),b=createUltimateScene(id);animateUltimate(b,1.2);const unchanged=snapshot(b.scene);animateUltimate(a,.2,{reducedMotion:true});const still=snapshot(a.action.root);animateUltimate(a,2.8,{reducedMotion:true});assert.deepEqual(snapshot(a.action.root),still,id);
    const resources=new Set();a.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)resources.add(o.geometry);if(o.material&&!o.material.userData.shared3d)resources.add(o.material);});let freed=0;for(const r of resources)r.addEventListener('dispose',()=>freed++);disposeScene(a.scene);assert.equal(freed,resources.size);assert.deepEqual(snapshot(b.scene),unchanged,id);disposeScene(b.scene);
  }
});
