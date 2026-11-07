import test from 'node:test';
import assert from 'node:assert/strict';
import {T,heroModel,makeModel,arenaCamera,fitArenaCamera,disposeScene,animateModel} from '../js/models3d.mjs';
import {createBattleCamera,startBattleCamera,animateBattleCamera,resetBattleCamera} from '../js/battle-camera3d.mjs';
import {combatTiming,animateFighter} from '../js/combat3d.mjs';
import {HEROES} from '../js/data.mjs';
import {DUNGEON_BOSSES} from '../js/adventure-data.mjs';
import {attachBossVisual,syncBossVisual,animateBossVisual} from '../js/boss3d.mjs';
const snapshot=c=>[...c.position.toArray(),...c.quaternion.toArray(),c.zoom,...c.projectionMatrix.toArray()];
function arena({aspect=1,hero='kael',boss='colossus',phase2=false}={}){
  const units=new Map();
  const add=(id,model,x,z)=>{model.position.set(x,.09,z);model.scale.setScalar(.88);model.userData.unitId=id;const u={model,x,z,angle:0,scale:.88,phase:0,attackAt:-10,attackDuration:1,hitAt:-10,alive:true};units.set(id,u);return u;};
  const actor=add(hero,heroModel(hero,{signature:true,weaponRarity:'EX'}),-2.9,3.45);
  add('other1',heroModel('orion',{weaponRarity:'EX'}),0,1.65);add('other2',heroModel('eclipse',{weaponRarity:'EX'}),3.4,3.45);
  const enemy=add('enemy0',makeModel('boss',boss),0,-3.75);
  if(phase2){attachBossVisual(enemy.model,boss);syncBossVisual(enemy.model,{phase:2,alive:true,charged:false},0);}
  actor.attackTarget=enemy;
  const camera=arenaCamera(aspect),rig=createBattleCamera(camera,units);
  return {camera,rig,units,actor,enemy,close:()=>{for(const u of units.values())disposeScene(u.model);}};
}
function begin(a,{time=0,speed=1,critical=false,finisher=false,heal=false,skill=false,counter=false}={}){
  const timing=combatTiming(a.actor.model.userData.weapon,{speed,skill,counter});a.actor.attackAt=time;a.actor.attackSkill=skill;a.actor.attackCounter=counter;a.actor.attackDuration=timing.duration;
  startBattleCamera(a.rig,[a.actor],[heal?{target:a.actor.model.userData.unitId,heal:true,value:30}:{target:'enemy0',value:100,crit:critical}],time,timing,{skill,counter,speed,run:{battle:{enemies:[{id:'enemy0',kind:'boss',hp:finisher?0:100}]}}});return timing;
}
function tick(a,t,options={}){for(const u of a.units.values()){animateModel(u.model,t,{idle:false});animateFighter(u,t);animateBossVisual(u.model,t);}animateBattleCamera(a.rig,t,options);}
function inside(a){for(const u of a.units.values()){const b=new T.Box3().setFromObject(u.model);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(a.camera);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<1.00001&&Math.abs(p.y)<1.00001,`${u.model.userData.id}: ${p.x}, ${p.y}`);}}}

test('camera follows the actual lunging actor and restores the exact overview without accumulated drift',()=>{
  const a=arena(),base=snapshot(a.camera),timing=begin(a);tick(a,timing.duration/1000*.35);assert.notDeepEqual(snapshot(a.camera),base);inside(a);
  tick(a,timing.duration/1000);assert.deepEqual(snapshot(a.camera),base);assert.equal(a.rig.shot,null);
  for(let i=1;i<=15;i++){begin(a,{time:i*2});tick(a,i*2+.3);tick(a,i*2+1.5);assert.deepEqual(snapshot(a.camera),base);}
  a.close();
});

test('critical hits and boss finishers request a stronger zoom while normal hits and healing do not',()=>{
  const a=arena();const zoom=[];
  for(const options of [{},{critical:true},{finisher:true},{heal:true}]){const timing=begin(a,options);tick(a,timing.impact/1000,{shake:false});zoom.push(a.camera.zoom);if(options.finisher)assert.equal(a.rig.shot.finisher,true);}
  assert.ok(zoom[1]>zoom[0]);assert.ok(zoom[2]>zoom[1]);assert.equal(a.rig.shot.strength,0);assert.equal(a.rig.shot.zoom,0);a.close();
});

test('shake starts at contact, is deterministic and bounded, and can stop independently of the camera pan',()=>{
  const a=arena(),timing=begin(a,{critical:true}),contact=timing.impact/1000;
  for(const t of [contact-.03,contact+.023,contact+.4]){
    tick(a,t,{shake:true});const on=snapshot(a.camera);tick(a,t,{shake:true});assert.deepEqual(snapshot(a.camera),on);
    tick(a,t,{shake:false});const off=snapshot(a.camera);
    if(t===contact+.023){assert.notDeepEqual(on,off);assert.ok(Math.hypot(...on.slice(0,3).map((n,i)=>n-off[i]))<.08);}
    else assert.deepEqual(on,off);
  }
  begin(a,{heal:true});tick(a,.63,{shake:true});const healed=snapshot(a.camera);tick(a,.63,{shake:false});assert.deepEqual(snapshot(a.camera),healed);a.close();
});

test('1x and 2x camera playback produce identical poses at the same normalized contact and recovery times',()=>{
  const a=arena(),b=arena(),ta=begin(a,{critical:true}),tb=begin(b,{critical:true,speed:2});assert.equal(ta.duration,2*tb.duration);
  // Keep the same actor geometry so this compares camera timing alone, without idle clock differences.
  for(const p of [.1,.3,.43,.46,.6,.95,1]){
    animateBattleCamera(a.rig,p*ta.duration/1000);animateBattleCamera(b.rig,p*tb.duration/1000);
    const aa=snapshot(a.camera),bb=snapshot(b.camera);for(let i=0;i<aa.length;i++)assert.ok(Math.abs(aa[i]-bb[i])<1e-12);
  }
  a.close();b.close();
});

test('reduced motion, disabled camera and explicit cancellation instantly restore a still overview and never replay a shot',()=>{
  const a=arena(),base=snapshot(a.camera);
  for(const stop of [()=>animateBattleCamera(a.rig,.4,{reducedMotion:true}),()=>animateBattleCamera(a.rig,.4,{enabled:false}),()=>resetBattleCamera(a.rig)]){
    begin(a);tick(a,.3);assert.notDeepEqual(snapshot(a.camera),base);stop();assert.deepEqual(snapshot(a.camera),base);assert.equal(a.rig.shot,null);animateBattleCamera(a.rig,.5);assert.deepEqual(snapshot(a.camera),base);
  }
  for(const options of [{reducedMotion:true},{enabled:false}]){startBattleCamera(a.rig,[a.actor],[],0,{duration:800,impact:400},options);assert.equal(a.rig.shot,null);}
  for(const duration of [NaN,Infinity,0,-1]){startBattleCamera(a.rig,[a.actor],[],0,{duration,impact:400});assert.equal(a.rig.shot,null);}
  a.close();
});

test('interrupted shots and portrait to landscape resize do not alter the base camera or leave stale focus',()=>{
  const a=arena({aspect:.46});begin(a,{critical:true});tick(a,.35);begin(a,{time:.4,heal:true});assert.equal(a.rig.shot.critical,false);assert.equal(a.rig.shot.targets.length,0);tick(a,2);
  resetBattleCamera(a.rig);fitArenaCamera(a.camera,2.2);const resized=snapshot(a.camera);begin(a,{time:3});tick(a,3.4);inside(a);tick(a,5);assert.deepEqual(snapshot(a.camera),resized);a.close();
});

test('all 20 EX-equipped hero attacks stay framed with three heroes in narrow and wide viewports',()=>{
  for(const hero of HEROES)for(const aspect of [.46,.85,1.2,2.2]){
    const a=arena({hero:hero.id,aspect}),timing=begin(a,{critical:true,skill:true});
    for(const p of [.2,.43,.65,.9]){tick(a,p*timing.duration/1000);inside(a);}a.close();
  }
});

test('all boss models in phase II remain visible through boss-finisher zoom, including dragon wings',()=>{
  for(const boss of new Set([...DUNGEON_BOSSES.map(b=>b.id),'colossus','archivist','ashknight','moonwarden','void-dragon']))for(const aspect of [.46,.85,1.2,2.2]){
    const a=arena({boss,aspect,phase2:true}),timing=begin(a,{finisher:true,skill:true});
    for(const p of [.2,.43,.65,.9]){tick(a,p*timing.duration/1000);inside(a);}a.close();
  }
});

test('all heroes counter inside narrow and wide camera framing, then restore the exact overview',()=>{
  for(const hero of HEROES)for(const aspect of [.46,1.2,2.2]){
    const a=arena({hero:hero.id,aspect}),base=snapshot(a.camera),timing=begin(a,{counter:true});assert.equal(a.rig.shot.counter,true);assert.equal(a.rig.shot.zoom,.1);
    for(const p of [.1,.3,.43,.6,.8,.95]){tick(a,p*timing.duration/1000);inside(a);}
    tick(a,timing.duration/1000);assert.deepEqual(snapshot(a.camera),base);assert.equal(a.rig.shot,null);
    begin(a,{time:2});assert.equal(a.actor.attackCounter,false);assert.equal(a.rig.shot.counter,false);a.close();
  }
});
