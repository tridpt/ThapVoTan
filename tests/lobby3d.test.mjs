import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,startRun,createTrainingState,forgeGear,equipGear} from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {T,disposeScene} from '../js/models3d.mjs';
import {lobbyParty,gameHud,gameDock,lobbyPage,gameModeMenu} from '../js/game-ui.mjs';
import {createLobbyScene,fitLobbyCamera,animateLobby,pickLobbyHero,lobbyKey} from '../js/lobby3d.mjs';

function projection(box,camera){
  const points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));
  return points;
}

test('every hero and rarity fits the lobby camera on narrow phones, tablets and wide screens',()=>{
  const s=createState(),aspects=[320/550,360/600,400/650,768/850,1440/850,850/430];
  for(let i=0;i<HEROES.length;i+=3){
    const team=Array.from({length:3},(_,j)=>HEROES[(i+j)%HEROES.length].id);s.team=team;
    for(const id of team)s.owned[id]||={level:1,copies:0,awaken:0};
    const v=createLobbyScene(s,{compact:true});v.scene.updateMatrixWorld(true);
    for(const aspect of aspects){
      fitLobbyCamera(v.camera,aspect);
      for(const unit of v.units){
        const points=projection(new T.Box3().setFromObject(unit.model),v.camera);
        for(const p of points){assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(Math.abs(p.x)<1,unit.id+' horizontal '+aspect);assert.ok(Math.abs(p.y)<1,unit.id+' vertical '+aspect);}
      }
    }
    disposeScene(v.scene);
  }
});

test('lobby animation respects reduced motion and leaves account, camera and shared materials intact',()=>{
  const s=createState(),before=structuredClone(s),v=createLobbyScene(s);
  const shared=[];v.scene.traverse(o=>{if(o.material?.userData.shared3d)shared.push([o.material,o.material.version,o.material.color.getHex()]);});
  animateLobby(v,8);assert.notEqual(v.ring.rotation.z,0);assert.notEqual(v.units[0].model.position.y,v.units[0].baseY);
  animateLobby(v,9,{reducedMotion:true});assert.equal(v.ring.rotation.z,0);assert.equal(v.inner.rotation.z,.3);assert.equal(v.veil.material.opacity,.12);
  assert.ok(v.units.every(u=>u.model.position.y===u.baseY&&u.model.rotation.y===u.angle));
  assert.ok(shared.every(([mat,version,color])=>mat.version===version&&mat.color.getHex()===color));
  assert.deepEqual(s,before);disposeScene(v.scene);
});

test('lobby hero picking uses the real Three.js raycaster and excludes background scenery',()=>{
  const v=createLobbyScene(createState());fitLobbyCamera(v.camera,400/650);v.scene.updateMatrixWorld(true);
  for(const unit of v.units){
    const center=new T.Vector3(unit.x,1.8,unit.z).project(v.camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(center.x,center.y),v.camera);
    assert.equal(pickLobbyHero(v,ray),unit.id);
  }
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(.98,.98),v.camera);assert.equal(pickLobbyHero(v,ray),null);disposeScene(v.scene);
});

test('lobby keeps journey team and weapon snapshots, changing its cache key only when visible models change',()=>{
  const s=createState();s.gold=100000;s.dust=100;s.armory.marks.colossus=10;
  const initial=lobbyKey(s),gear=forgeGear(s,'signature-rook');equipGear(s,gear.id,'rook');assert.notEqual(lobbyKey(s),initial);
  startRun(s,42);const key=lobbyKey(s);s.team=['ember','rook','aerin'];delete s.equipped.rook.weapon;
  assert.equal(lobbyKey(s),key);assert.deepEqual(lobbyParty(s),s.run.heroes.map(h=>h.id));
  const v=createLobbyScene(s);assert.equal(v.units[0].model.userData.signature,true);disposeScene(v.scene);
  s.run.phase='result';assert.deepEqual(lobbyParty(s),s.team);assert.notEqual(lobbyKey(s),key);
});

test('lobby disposes its unique portal and weather without breaking another cached scene',()=>{
  const s=createState(),a=createLobbyScene(s,{compact:true,effects:false}),b=createLobbyScene(s);let freed=0;
  for(const obj of [a.ring,a.inner,a.veil])obj.geometry.addEventListener('dispose',()=>freed++);
  a.veil.material.addEventListener('dispose',()=>freed++);a.world.weather.geometry.addEventListener('dispose',()=>freed++);
  assert.equal(a.world.weather.visible,false);assert.ok(a.world.leaves.every(o=>!o.visible));disposeScene(a.scene);assert.equal(freed,5);
  assert.notEqual(a.veil.material,b.veil.material);assert.equal(b.veil.material.opacity,.12);animateLobby(b,4);assert.ok(b.units.every(u=>Number.isFinite(u.model.position.y)));disposeScene(b.scene);
});

test('game HUD exposes full balances, real notification dots and actionable lobby controls',()=>{
  const s=createState();s.gold=123456789;s.shards=54321;s.tickets=12345;
  assert.match(gameHud(s),/123\.456\.789 vàng/);assert.match(gameHud(s),/123,5tr/);assert.match(gameHud(s),/54,3k/);
  assert.match(gameDock(s,'home'),/data-page="home" aria-current="page"/);assert.match(gameDock(s,'pets'),/data-page="heroes" aria-current="page"/);
  assert.match(lobbyPage(s),/data-action="start"/);assert.doesNotMatch(gameModeMenu(s),/data-page="tower"/);
  startRun(s,42);assert.doesNotMatch(lobbyPage(s),/data-action="start"/);assert.match(gameModeMenu(s),/data-page="tower"/);
  const training=createTrainingState(s,{team:['aion','orion','solis'],level:20,set:null,signature:true,boss:'colossus',difficulty:1});
  assert.deepEqual(lobbyParty(training),['aion','orion','solis']);
});
