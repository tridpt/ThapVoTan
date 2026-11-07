import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {T,disposeScene} from '../js/models3d.mjs';
import {createVictoryScene,animateVictory,fitVictoryCamera,chestStyle} from '../js/victory3d.mjs';

function victory(team=['rook','aerin','lumi']){const s=E.createState();for(const h of HEROES)s.owned[h.id]={level:1,copies:0,awaken:0};s.team=team;E.startHunt(s,'colossus',1,42);s.run.heroes[0].atk=100000;E.playerAction(s,team[0],'enemy0');return s;}
function gear(s,rarity='SR',base='dawnblade'){s.run.lastReward={gold:100,tickets:3,shards:3,loot:{gear:{base,rarity},converted:false,dust:0}};s.run.summary.huntReward=null;s.run.victory.stage='loot';return s;}
function fingerprint(view){return {heroes:view.heroes.map(h=>({position:h.model.position.toArray(),rotation:h.model.rotation.toArray(),rig:h.model.userData.combatRig.map(p=>p.node.rotation.toArray())})),enemy:view.enemy?.rotation.toArray(),lid:view.chest.lid.rotation.toArray(),camera:view.camera.position.toArray(),emblem:view.emblem.position.toArray()};}

test('the boss falls before the camera settles on the celebrating party, without changing saved gameplay',()=>{
  const s=victory(),before=structuredClone(s),v=createVictoryScene(s,{effects:true,compact:true}),start=v.camera.position.clone();assert.equal(v.enemy.visible,true);animateVictory(v,.8);assert.ok(v.enemy.rotation.z<-.5);animateVictory(v,3);assert.equal(v.enemy.visible,false);assert.ok(v.camera.position.distanceTo(start)>.1);assert.ok(v.heroes.every(h=>h.model.userData.combatRig.some(p=>p.node.rotation.x<p.rotation.x-.3)));assert.equal(v.chest.root.visible,false);assert.deepEqual(s,before);disposeScene(v.scene);
});

test('chest lids open and loot emblems match weapons, armor, charms or real currency rewards',()=>{
  for(const [base,slot] of [['dawnblade','weapon'],['mossguard','armor'],['sunpendant','charm']]){
    const s=gear(victory(),'SR',base),before=structuredClone(s),v=createVictoryScene(s,{effects:true});assert.equal(v.style.slot,slot);assert.ok(v.chest.lid.rotation.x===0);animateVictory(v,v.duration/1000);assert.ok(v.chest.lid.rotation.x<-1.7);assert.ok(v.emblem.position.y>2.5);assert.ok(v.emblem.children.length>0);assert.deepEqual(s,before);disposeScene(v.scene);
  }
  const s=victory();s.run.victory.stage='loot';assert.equal(chestStyle(s.run).slot,null);assert.equal(chestStyle(s.run).color,'#edce8d');
});

test('rarer gear has progressively richer rings, particles and light beams, with a compact particle budget',()=>{
  let previous={particles:0,rings:0,beams:-1};for(const rarity of ['R','SR','SSR']){const s=gear(victory(),rarity),v=createVictoryScene(s,{effects:true,compact:false}),compact=createVictoryScene(s,{effects:true,compact:true});assert.ok(v.style.particles>previous.particles);assert.ok(v.rings.length>previous.rings);assert.ok(v.beams.children.length>previous.beams);assert.ok(compact.particles.count<v.particles.count);assert.equal(v.particles.isInstancedMesh,true);previous={particles:v.style.particles,rings:v.rings.length,beams:v.beams.children.length};disposeScene(v.scene);disposeScene(compact.scene);}
});

test('all camera bounds fit starter and EX parties through collapse, celebration and loot at phone and landscape aspects',()=>{
  for(const team of [['rook','aerin','lumi'],['aion','eclipse','orion']])for(const stage of ['intro','loot']){
    const s=victory(team);if(stage==='loot')gear(s,'SSR');const v=createVictoryScene(s,{effects:true,compact:true});
    for(const aspect of [.5,.85,1.7,2.5])for(const p of [0,.2,.5,1]){fitVictoryCamera(v,aspect);animateVictory(v,v.duration/1000*p);const corner=new T.Vector3();for(const x of [v.bounds.min.x,v.bounds.max.x])for(const y of [v.bounds.min.y,v.bounds.max.y])for(const z of [v.bounds.min.z,v.bounds.max.z]){corner.set(x,y,z).project(v.camera);assert.ok(Math.abs(corner.x)<=.92,`${team}/${stage}/${aspect}/${p}/x`);assert.ok(Math.abs(corner.y)<=.82,`${team}/${stage}/${aspect}/${p}/y`);assert.ok(corner.z>=-1&&corner.z<=1);}}
    disposeScene(v.scene);
  }
});

test('poses are absolute, 2x halves timing, and reduced motion opens the chest immediately with no burst',()=>{
  const s=gear(victory(),'SSR'),v=createVictoryScene(s,{effects:true}),fast=createVictoryScene({...s,settings:{...s.settings,speed:2}},{effects:true});assert.equal(fast.duration,v.duration/2);animateVictory(v,.7);const pose=fingerprint(v);animateVictory(v,3);animateVictory(v,.7);assert.deepEqual(fingerprint(v),pose);
  animateVictory(fast,.7/2);assert.deepEqual(fast.chest.lid.rotation.toArray(),v.chest.lid.rotation.toArray());animateVictory(v,0,{reducedMotion:true});assert.equal(v.chest.lid.rotation.x,-1.85);assert.equal(v.particles.visible,false);assert.equal(v.beams.visible,false);assert.ok(v.rings.every(n=>!n.visible));const still=fingerprint(v);animateVictory(v,100,{reducedMotion:true});assert.deepEqual(fingerprint(v),still);disposeScene(v.scene);disposeScene(fast.scene);
});

test('celebration preserves costume and signature visuals, with MVP centered and fallen allies resting',()=>{
  const s=victory();s.best=10;E.equipSkin(s,'rook','rook-guardian');s.run.heroes[0].loadout={signature:'rook',sets:[{id:'bastion',count:1}]};s.run.heroes[2].hp=0;const v=createVictoryScene(s,{effects:true});assert.equal(v.heroes[1].model.userData.id,'rook');assert.equal(v.heroes[1].model.userData.skin,'rook-guardian');assert.equal(v.heroes[1].model.userData.signature,true);animateVictory(v,3);const fallen=v.heroes.find(h=>h.model.userData.id==='lumi');assert.equal(fallen.model.userData.heroRig.hips.rotation.x,1.46);assert.ok(fallen.model.userData.heroRig.legs.every(l=>l.knee.rotation.x>.9));assert.equal(fallen.model.userData.ornaments.visible,false);assert.equal(fallen.model.position.y,fallen.position.y);disposeScene(v.scene);
});

test('disposing a victory scene frees instance and unique geometry resources while retaining cached hero assets',()=>{
  const s=gear(victory(),'SSR'),v=createVictoryScene(s,{effects:true}),unique=new Set(),shared=new Set();let disposed=0,sharedDisposed=0,instances=0;
  v.scene.traverse(o=>{if(o.geometry)(o.geometry.userData.shared3d?shared:unique).add(o.geometry);if(o.isInstancedMesh)o.addEventListener('dispose',()=>instances++);});
  for(const g of unique)g.addEventListener('dispose',()=>disposed++);for(const g of shared)g.addEventListener('dispose',()=>sharedDisposed++);assert.ok(unique.size>0);disposeScene(v.scene);assert.equal(disposed,unique.size);assert.equal(sharedDisposed,0);assert.equal(instances,1);
});
