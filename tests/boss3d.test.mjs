import test from 'node:test';
import assert from 'node:assert/strict';
import {T,enemyModel,disposeScene,arenaCamera,animateModel} from '../js/models3d.mjs';
import {BOSSES} from '../js/data.mjs';
import {DUNGEON_BOSSES} from '../js/adventure-data.mjs';
import {BOSS_FORMS,attachBossVisual,readBossVisual,syncBossVisual,animateBossVisual} from '../js/boss3d.mjs';
import * as E from '../js/engine.mjs';

const bosses=[...BOSSES,...DUNGEON_BOSSES],modelFor=id=>{const model=enemyModel({kind:'boss',bossId:id});attachBossVisual(model,id);return model;};
function fightBoss(id){const s=E.createState(),dungeon=DUNGEON_BOSSES.find(b=>b.id===id);if(dungeon){E.startDungeon(s,dungeon.element,1,new Date(),42);s.run.floor=3;s.run.cleared=2;}else{E.startRun(s,42);s.run.floor=(BOSSES.findIndex(b=>b.id===id)+1)*5;}s.run.map=null;s.run.routes=['boss'];E.chooseRoute(s,0);return s;}

test('all eleven tower and elemental bosses have distinct phase II decorations within geometry budgets',()=>{
  assert.deepEqual(Object.keys(BOSS_FORMS).sort(),[...bosses.map(b=>b.id),'void-dragon','curse-king'].sort());assert.equal(new Set(Object.values(BOSS_FORMS).map(s=>s.theme)).size,13);
  for(const {id} of bosses){
    const model=modelFor(id),visual=model.userData.bossVisual;assert.ok(visual.phaseRoot.parent);assert.equal(visual.phaseRoot.visible,false);syncBossVisual(model,{phase:2,move:'strike',alive:true,frozen:false},0);
    let meshes=0,vertices=0;model.traverse(o=>{if(!o.isMesh)return;meshes++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));});
    assert.ok(meshes<=85,`${id} meshes: ${meshes}`);assert.ok(vertices<75000,`${id} vertices: ${vertices}`);assert.equal(visual.phaseRoot.visible,true);assert.equal(visual.aura.visible,true);disposeScene(model);
  }
});

test('phase visuals follow engine state at half health, stay enraged after healing and do not retrigger on resume',()=>{
  for(const {id} of bosses){
    const state=fightBoss(id),enemy=state.run.battle.enemies[0],model=modelFor(id);assert.equal(enemy.bossId,id);syncBossVisual(model,readBossVisual(state.run,enemy),0);
    enemy.hp=Math.floor(enemy.maxHp*.5)+1;state.run.heroes[0].atk=2;E.playerAction(state,state.run.heroes[0].id,enemy.id);assert.equal(state.run.battle.bossState.phase,2);assert.ok(enemy.hp>0);
    const before=structuredClone(state),status=readBossVisual(state.run,enemy);assert.equal(syncBossVisual(model,status,1),true);assert.equal(syncBossVisual(model,status,1.2),false);assert.deepEqual(state,before);
    enemy.hp=enemy.maxHp;assert.equal(readBossVisual(state.run,enemy).phase,2);assert.equal(syncBossVisual(model,readBossVisual(state.run,enemy),2),false);assert.equal(model.userData.bossVisual.aura.visible,true);
    const restored=E.validateState(JSON.parse(JSON.stringify(state))),next=modelFor(id);assert.equal(syncBossVisual(next,readBossVisual(restored.run,restored.run.battle.enemies[0]),20),false);assert.equal(next.userData.bossVisual.phase,2);disposeScene(model);disposeScene(next);
  }
});

test('phase reading handles old saves and respects death, frozen and interrupted charge states',()=>{
  assert.equal(readBossVisual({}, {kind:'wraith'}),null);const legacy={kind:'boss',hp:1,maxHp:100,freeze:0};assert.deepEqual(readBossVisual({battle:{bossState:null}},legacy),{phase:1,move:'strike',alive:true,frozen:false});
  const model=modelFor('colossus'),visual=model.userData.bossVisual;
  for(const move of ['charge','quake']){syncBossVisual(model,{phase:2,move,alive:true,frozen:false},1);assert.equal(visual.tell.visible,true);}
  syncBossVisual(model,{phase:2,move:'quake',alive:true,frozen:true},2);assert.equal(visual.tell.visible,false);assert.equal(visual.aura.visible,true);
  syncBossVisual(model,{phase:2,move:'stunned',alive:true,frozen:false},3);assert.equal(visual.tell.visible,false);
  syncBossVisual(model,{phase:2,move:'quake',alive:false,frozen:false},4);assert.equal(visual.tell.visible,false);assert.equal(visual.phaseRoot.visible,false);assert.equal(visual.aura.visible,false);disposeScene(model);
});

test('boss transformations and charge ornaments are deterministic, independent and reset under reduced motion',()=>{
  const pose=model=>model.userData.bossVisual.moving.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray(),...p.node.scale.toArray()]);
  for(const {id} of bosses){
    const a=modelFor(id),b=modelFor(id);syncBossVisual(a,{phase:1,move:'signature',alive:true,frozen:false},0);syncBossVisual(b,{phase:1,move:'strike',alive:true,frozen:false},0);const rest=pose(b);
    syncBossVisual(a,{phase:2,move:'surge',alive:true,frozen:false},1);animateBossVisual(a,1.4);const atTime=pose(a);for(let n=0;n<50;n++)animateBossVisual(a,1.4);assert.deepEqual(pose(a),atTime);assert.deepEqual(pose(b),rest);
    animateBossVisual(a,10,{reducedMotion:true});const still=pose(a);animateBossVisual(a,100,{reducedMotion:true});assert.deepEqual(pose(a),still);assert.equal(a.userData.bossVisual.phaseRoot.scale.x,1);
    disposeScene(a);syncBossVisual(b,{phase:2,move:'surge',alive:true,frozen:false},100);animateBossVisual(b,101);assert.ok(new T.Box3().setFromObject(b).getSize(new T.Vector3()).y>2);disposeScene(b);
  }
});

test('phase II silhouettes and charge effects fit phone, tablet and wide arena cameras',()=>{
  for(const aspect of [321/430,593/570,1080/570,1440/570])for(const {id} of bosses)for(const x of [-3.4,0,3.4]){
    const model=modelFor(id),camera=arenaCamera(aspect);model.position.set(x,.09,-3.75);model.rotation.y=-.28;model.scale.setScalar(.95);syncBossVisual(model,{phase:2,move:'surge',alive:true,frozen:false},0);
    for(const time of [0,1.5,5,21]){animateModel(model,time);animateBossVisual(model,time);const bounds=new T.Box3().setFromObject(model);for(const bx of [bounds.min.x,bounds.max.x])for(const by of [bounds.min.y,bounds.max.y])for(const bz of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(bx,by,bz).project(camera);assert.ok(Math.abs(p.x)<1&&p.y> -1&&p.y<.9,`${id} transformed fits below the round label at ${aspect}/${time}: ${p.toArray()}`);}}
    disposeScene(model);
  }
});
