import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {T,heroModel,weaponStyle,animateModel,arenaCamera,disposeScene} from '../js/models3d.mjs';
import {animateFighter,combatTiming} from '../js/combat3d.mjs';
import {CombatEffects3D} from '../js/effects3d.mjs';
import {createLobbyScene,lobbyKey} from '../js/lobby3d.mjs';
import {createTowerMapScene,towerMapKey} from '../js/tower-map3d.mjs';
import {createVictoryScene,animateVictory,fitVictoryCamera,chestStyle} from '../js/victory3d.mjs';
import {createUltimateScene,animateUltimate} from '../js/ultimate3d.mjs';

function rich(){const s=E.createState();s.gold=1e7;s.dust=100000;s.armory.essence=100000;s.armory.marks.colossus=100;return s;}
function wear(s,hero='rook',rarity='EX'){const g=E.forgeGear(s,'signature-'+hero);g.level=10;while(g.rarity!==rarity)E.evolveGear(s,g.id);E.equipGear(s,g.id,hero);return g;}
function vertices(model){let n=0;model.traverse(o=>{if(o.isMesh){n+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});return n;}
function fits(model,camera,label){const box=new T.Box3().setFromObject(model);for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,label);}}

test('every hero weapon gains bounded independent geometry and increasing ornaments for all seven equipment tiers',()=>{
  for(const h of HEROES){let previous=0;for(const rarity of E.GEAR_TIERS){const model=heroModel(h.id,{signature:true,weaponRarity:rarity}),n=vertices(model);assert.ok(n>previous||rarity==='R');previous=n;assert.ok(n<85000,`${h.id}/${rarity} geometry budget`);assert.equal(model.userData.rarity,h.rarity);assert.equal(model.userData.weaponRarity,rarity);disposeScene(model);}}
  assert.deepEqual(weaponStyle('invalid'),weaponStyle(null));
});

test('equipment cache keys distinguish rarity and preserve shared geometry without sharing aura poses',()=>{
  const a=heroModel('rook',{signature:true,weaponRarity:'EX'}),b=heroModel('rook',{signature:true,weaponRarity:'EX'}),lower=heroModel('rook',{signature:true,weaponRarity:'UR'});
  assert.equal(a.userData.combatRig[0].node.children[0].geometry,b.userData.combatRig[0].node.children[0].geometry);assert.notEqual(a.userData.combatRig[0].node.children[0].geometry,lower.userData.combatRig[0].node.children[0].geometry);
  const aura=model=>model.userData.motionParts.find(p=>p.node.parent?.userData.weaponAura);const part=aura(a),other=aura(b);assert.ok(part&&other);animateModel(a,3);assert.notEqual(part.node.rotation.z,other.node.rotation.z);animateModel(a,3,{reducedMotion:true});assert.equal(part.node.rotation.z,part.rotation.z);disposeScene(a);animateModel(b,2);assert.ok(vertices(b)>0);disposeScene(b);disposeScene(lower);
});

test('EX weapons remain framed during all hero attacks and signature cinematics in portrait and landscape',()=>{
  for(const hero of HEROES)for(const aspect of [360/780,1440/800]){
    const model=heroModel(hero.id,{signature:true,weaponRarity:'EX'}),timing=combatTiming(hero.weapon,{skill:true}),camera=arenaCamera(aspect),unit={model,x:3.4,z:3.45,angle:.12,scale:.88,phase:0,attackAt:0,attackDuration:timing.duration,attackSkill:true,attackTarget:{x:0,z:-3.75},hitAt:10};
    for(const p of [0,.2,.5,.8,1.1]){animateFighter(unit,p*timing.duration/1000);animateModel(model,p);fits(model,camera,hero.id+' attack');}disposeScene(model);
    const v=createUltimateScene(hero.id,aspect,{signature:true,weaponRarity:'EX',compact:true});assert.equal(v.model.userData.weaponRarity,'EX');for(const t of [0,.4,1,1.7,2.4]){animateUltimate(v,t);fits(v.model,v.camera,hero.id+' cinematic');}disposeScene(v.scene);
  }
});

test('rarity trails follow real endpoints, stay within their pool and free unique buffers on expiry or replacement',()=>{
  const scene=new T.Scene(),vfx=new CombatEffects3D(scene,{capacity:8}),from=new T.Vector3(-3,1.5,3),to=new T.Vector3(2,1.8,-4);let previous=0;
  for(const rarity of E.GEAR_TIERS){vfx.clear();vfx.weaponTrail(from,to,rarity,0);assert.ok(vfx.items.length>=previous);previous=vfx.items.length;for(const f of vfx.items){const pos=f.node.geometry.attributes.position;const first=new T.Vector3().fromBufferAttribute(pos,0),last=new T.Vector3().fromBufferAttribute(pos,pos.count-1);assert.ok(first.distanceTo(from)<.4);assert.ok(last.distanceTo(to)<.4);assert.ok(pos.array.every(Number.isFinite));}}
  let freed=0;for(const f of vfx.items)f.node.geometry.addEventListener('dispose',()=>freed++);vfx.weaponTrail(from,to,'EX',0);assert.equal(vfx.items.length,8);assert.ok(freed>0);vfx.step(.2);assert.ok(vfx.items.every(f=>f.node.visible&&f.node.geometry.drawRange.count>0));vfx.step(2);assert.equal(vfx.active,false);assert.equal(scene.children.length,0);
});

test('compact trails reduce the effect count and reduced motion removes them entirely',()=>{
  const scene=new T.Scene(),from=new T.Vector3(0,1,2),to=new T.Vector3(0,1,-2),vfx=new CombatEffects3D(scene);vfx.weaponTrail(from,to,'EX',0);const full=vfx.items.length;vfx.clear();vfx.weaponTrail(from,to,'EX',0,{compact:true});assert.ok(vfx.items.length<full);vfx.clear();vfx.reducedMotion=true;vfx.weaponTrail(from,to,'EX',0);assert.equal(vfx.items.length,0);
});

test('lobby and map take active weapon snapshots and refresh their scene keys for a new journey',()=>{
  const s=rich(),g=wear(s),lobby=createLobbyScene(s);assert.equal(lobby.units[0].model.userData.weaponRarity,'EX');disposeScene(lobby.scene);E.startRun(s,42);const key=lobbyKey(s),mapKey=towerMapKey(s),before=structuredClone(s);E.unequipGear(s,g.id);assert.equal(lobbyKey(s),key);assert.equal(towerMapKey(s),mapKey);const active=createLobbyScene(s),map=createTowerMapScene(s);assert.equal(active.units[0].model.userData.weaponRarity,'EX');assert.equal(map.units[0].model.userData.weaponRarity,'EX');disposeScene(active.scene);disposeScene(map.scene);assert.deepEqual(s.run,before.run);E.finishRun(s);assert.notEqual(lobbyKey(s),key);
});

test('chests support every rarity with finite bounded particles and retain the winning weapon snapshot',()=>{
  for(const rarity of E.GEAR_TIERS){const s=rich();wear(s);E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');E.advanceVictory(s);const gear=E.dropGear(s,()=>.5,1,'treasure').gear;gear.rarity=rarity;s.run.lastReward={gold:0,tickets:0,shards:0,loot:{gear,converted:false,dust:0}};
    const style=chestStyle(s.run),v=createVictoryScene(s,{compact:true,effects:true});assert.equal(style.rank,E.GEAR_TIERS.indexOf(rarity));assert.ok(style.particles>=14&&style.particles<=84);assert.ok(style.beams<=16);assert.equal(v.heroes.find(h=>h.model.userData.id==='rook').model.userData.weaponRarity,'EX');for(const aspect of [360/780,1440/800]){fitVictoryCamera(v,aspect);for(const t of [0,.5,1,2]){animateVictory(v,t);assert.ok(v.camera.position.toArray().every(Number.isFinite));for(const hero of v.heroes)fits(hero.model,v.camera,rarity+' victory');}}disposeScene(v.scene);
  }
});
