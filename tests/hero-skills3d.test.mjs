import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HERO} from '../js/data.mjs';
import {HERO_ULTIMATES} from '../js/ultimate-data.mjs';
import {T,heroModel,enemyModel,disposeScene,arenaCamera} from '../js/models3d.mjs';
import {CombatEffects3D} from '../js/effects3d.mjs';
import {combatTiming,animateFighter} from '../js/combat3d.mjs';
import {emitHeroSkill} from '../js/hero-skills3d.mjs';

function fixture(id){
  const s=E.createState();s.best=10;s.armory.hunts.colossus={best:1,clears:3};s.armory.hunts.ashknight={best:1,clears:3};if(E.skinForHero(id))E.equipSkin(s,id,E.skinForHero(id).id);s.owned[id]||={level:1,copies:0,awaken:0};s.team=[id,...['rook','aerin','lumi','ember'].filter(h=>h!==id).slice(0,2)];E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;for(const h of s.run.heroes)h.hp=1;
  const scene=new T.Scene(),units=new Map();s.run.heroes.forEach((h,i)=>{const position=E.formationPosition(s.run,i),model=heroModel(h.id,{skin:E.equippedSkin(s,h.id)});model.scale.setScalar(.88);model.position.set(position.x,.09,position.z);scene.add(model);units.set(h.id,{model,...position,angle:.12,scale:.88,phase:0,attackAt:0,hitAt:-10});});
  for(const e of s.run.battle.enemies){const model=enemyModel(e);scene.add(model);units.set(e.id,{model,x:0,z:-3.75,enemy:true});}
  const events=E.playerAction(s,id,'enemy0',true),timing=combatTiming(HERO[id].weapon,{skill:true}),view={scene,units,vfx:new CombatEffects3D(scene)};
  return {s,events,timing,view};
}

test('all 16 brief spells use actual caster/target positions and never change committed skill results or RNG',()=>{
  for(const id of Object.keys(HERO_ULTIMATES)){const {s,view,events,timing}=fixture(id),before=structuredClone(s),copy=structuredClone(events),item=emitHeroSkill(view,id,events,0,timing);assert.equal(item.hero,id);assert.equal(item.node.userData.heroSpell,id);assert.equal(item.node.position.x,view.units.get(id).x);assert.equal(item.life,timing.duration/1000);
    view.vfx.step(timing.impact/1000);assert.equal(item.node.visible,true);assert.ok(view.vfx.active);assert.deepEqual(s,before);assert.deepEqual(events,copy);view.vfx.step(5);assert.equal(view.vfx.items.length,0);disposeScene(view.scene);}
});

test('healing and shielding spells follow friendly targets while arrows and the phoenix follow damage targets',()=>{
  for(const id of ['rook','aerin','lumi','ember']){const {view,events,timing}=fixture(id),item=emitHeroSkill(view,id,events,0,timing);view.vfx.step(timing.impact/1000);
    const support=id==='rook'||id==='lumi',expected=id==='rook'?[...view.units].filter(([,u])=>u.model.userData.kind==='hero').map(([key])=>key):[...new Set(events.filter(e=>support?(e.heal||e.shieldGrant):!e.heal&&!e.shieldGrant).map(e=>e.target))];assert.ok(expected.length>0);assert.ok(expected.every(target=>!!view.units.get(target).enemy!==support));
    if(id==='lumi'){const beams=[];item.node.traverse(n=>{if(n.material?.isMeshBasicMaterial)beams.push(n);});assert.equal(beams.length,expected.length);for(const beam of beams){const world=beam.getWorldPosition(new T.Vector3());assert.ok(expected.some(target=>Math.abs(view.units.get(target).x-world.x)<.001&&Math.abs(view.units.get(target).z-world.z)<.001));}}
    if(id==='ember'){const bird=item.node.children.find(n=>n.children.some(o=>o.isGroup));assert.ok(bird);const world=bird.getWorldPosition(new T.Vector3());assert.ok(world.distanceTo(new T.Vector3(0,1.04,-3.75))<.01);}
    view.vfx.clear();disposeScene(view.scene);
  }
});

test('reduced effects skip elaborate spells, 2x scales lifetime, and a capped pool frees every transient object',()=>{
  const {view,events,timing}=fixture('lumi');assert.equal(emitHeroSkill(view,'lumi',events,0,timing,{reducedMotion:true}),null);assert.equal(view.vfx.items.length,0);
  view.vfx.capacity=4;let allocations=0,disposals=0;
  for(let i=0;i<25;i++){const item=emitHeroSkill(view,'lumi',events,i*.01,{duration:timing.duration/2,impact:timing.impact/2});assert.equal(item.life,timing.duration/2000);item.node.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d){allocations++;o.geometry.addEventListener('dispose',()=>disposals++);}if(o.material&&!o.material.userData.shared3d){allocations++;o.material.addEventListener('dispose',()=>disposals++);}});assert.ok(view.vfx.items.length<=4);}
  view.vfx.clear();assert.equal(disposals,allocations);assert.equal(view.vfx.items.length,0);disposeScene(view.scene);
});

test('brief airborne and shield poses remain in arena cameras and restore the fighter after the spell expires',()=>{
  for(const id of Object.keys(HERO_ULTIMATES)){const {view,events,timing}=fixture(id),actor=view.units.get(id);actor.attackDuration=timing.duration;actor.attackSkill=true;actor.attackTarget={x:0,z:-3.75};emitHeroSkill(view,id,events,0,timing);
    for(const phase of [.2,.4,.65,.85]){animateFighter(actor,phase*timing.duration/1000);view.vfx.step(phase*timing.duration/1000);const box=new T.Box3().setFromObject(actor.model);for(const aspect of [.46,.85,1.6,2.1]){const camera=arenaCamera(aspect);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,id+' framed');}}}
    view.vfx.step(5);animateFighter(actor,5,{reducedMotion:true});assert.deepEqual(actor.model.position.toArray(),[actor.x,.09,actor.z]);assert.ok(actor.model.userData.combatRig.every(p=>p.node.rotation.equals(p.rotation)));disposeScene(view.scene);
  }
});

test('new supports place roots and healing columns on allies, and falling projectiles reach actual enemy coordinates at impact',()=>{
  for(const id of ['thorne','seraph','eira','astra','selene']){
    const {s,view,events,timing}=fixture(id),before=structuredClone(s),item=emitHeroSkill(view,id,events,0,timing);view.vfx.step(timing.impact/1000);
    const support=['thorne','seraph','eira'].includes(id),props=item.node.children.filter(n=>id==='thorne'?n.isGroup:id==='seraph'||id==='eira'?n.material?.isMeshBasicMaterial:n.isGroup&&n.position.y<1.3);
    assert.ok(props.length>0,id);
    for(const prop of props){const point=prop.getWorldPosition(new T.Vector3());assert.ok([...view.units.values()].some(u=>!!u.enemy!==support&&Math.hypot(u.x-point.x,u.z-point.z)<.001),id+' target');}
    assert.deepEqual(s,before);view.vfx.clear();disposeScene(view.scene);
  }
});
