import test from 'node:test';
import assert from 'node:assert/strict';
import {T,heroModel,enemyModel,disposeScene} from '../js/models3d.mjs';
import {CombatEffects3D} from '../js/effects3d.mjs';
import {emitLinkEffect} from '../js/links3d.mjs';
import {linkForPair} from '../js/links.mjs';

function scene(capacity=96,quiet=false){
  const root=new T.Scene(),units=new Map();for(const [id,x,z] of [['ember',-2,3],['aerin',2,3],['enemy0',0,-3],['enemy1',3,-3]]){
    const model=id.startsWith('enemy')?enemyModel({kind:'sentinel'}):heroModel(id);model.position.set(x,0,z);root.add(model);units.set(id,{x,z,model,enemy:id.startsWith('enemy')});
  }
  return {scene:root,units,vfx:new CombatEffects3D(root,{capacity,reducedMotion:quiet})};
}

test('dual projectiles converge before the combined AOE and every transient transform stays finite',()=>{
  const view=scene(),spec=linkForPair('ember','aerin'),events=[{actor:'ember',target:'enemy0',value:50},{actor:'aerin',target:'enemy0',value:45},{actor:'ember',target:'enemy1',value:50}];
  const timing=emitLinkEffect(view,['ember','aerin'],spec,events,5);assert.equal(timing.duration,1200);assert.equal(timing.impact,780);
  const shots=view.vfx.items.filter(i=>i.kind==='projectile');assert.equal(shots.length,6);assert.ok(shots[0].to.equals(shots[1].to));assert.notEqual(shots[0].from.x,shots[1].from.x);
  assert.ok(shots[2].born>shots[0].born);assert.equal(view.units.get('ember').attackDuration,1200);assert.equal(view.units.get('aerin').attackDuration,1200);
  for(const time of [5,5.2,5.5,5.78,6,6.4]){view.vfx.step(time);view.scene.traverse(o=>assert.ok([...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray()].every(Number.isFinite)));}
  view.vfx.step(10);assert.equal(view.vfx.items.length,0);disposeScene(view.scene);
});

test('repeated full and reduced links obey the same pool cap, cleanup and static-motion contract',()=>{
  for(const quiet of [false,true]){
    const view=scene(16,quiet),events=[{target:'enemy0',value:40},{target:'aerin',value:10,heal:true},{target:'aerin',value:25,shieldGrant:true}];
    for(let i=0;i<30;i++){emitLinkEffect(view,['ember','aerin'],linkForPair('ember','aerin'),events,i/100,{reducedMotion:quiet});assert.ok(view.vfx.items.length<=16);}
    if(quiet)assert.ok(view.vfx.items.every(i=>i.kind!=='projectile'));
    const unique=view.vfx.items.filter(i=>i.node.material&&!i.node.material.userData.shared3d);let disposed=0;for(const i of unique)i.node.material.addEventListener('dispose',()=>disposed++);
    view.vfx.clear();assert.equal(disposed,unique.length);assert.equal(view.vfx.items.length,0);assert.equal(view.scene.children.length,4);disposeScene(view.scene);
  }
});
