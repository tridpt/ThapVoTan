import {seasonAuraActive} from './season.mjs';
import {T,mesh,cylinder,heroModel,towerModel,animateModel,material} from './models3d.mjs';
import {HERO} from './data.mjs';
import {createWorld,animateWorld} from './worlds3d.mjs';
import {gearLoadout} from './armory.mjs';
import {lobbyParty} from './game-ui.mjs';
import {equippedSkin} from './skins.mjs';
import {bondAdorned} from './bonds.mjs';

export function lobbyKey(state){
  const active=state.run&&state.run.phase!=='result';
  return seasonAuraActive(state)+':'+lobbyParty(state).map(id=>id+':'+bondAdorned(state,id)+':'+(equippedSkin(state,id)||'base')+':'+(active?state.run.heroes.find(h=>h.id===id)?.loadout?.signature===id:gearLoadout(state,id).signature===id)+':'+(active?state.run.heroes.find(h=>h.id===id)?.loadout?.weaponRarity:gearLoadout(state,id).weaponRarity)).join('|');
}

export function fitLobbyCamera(camera,aspect){
  const height=Math.max(5.15,4.5/Math.max(.1,aspect));
  Object.assign(camera,{left:-height*aspect,right:height*aspect,top:height-.65,bottom:-height-.65});
  camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;
}

export function createLobbyScene(state,{compact=false,effects=true}={}){
  const scene=new T.Scene(),world=createWorld('forest',{compact}),active=state.run&&state.run.phase!=='result';
  scene.fog=new T.Fog('#163832',23,45);scene.add(world.root);
  world.weather.visible=effects;world.leaves.forEach(o=>o.visible=effects);
  const tower=towerModel();tower.position.set(0,.35,-5.8);tower.scale.setScalar(.77);tower.rotation.y=-.15;scene.add(tower);
  const portal=new T.Group();portal.position.set(0,2.35,-4.35);scene.add(portal);
  const ring=mesh(portal,new T.TorusGeometry(1.38,.055,6,64),'#c6e1aa');
  ring.material=material('#b8edc0',.4,.65);
  const inner=mesh(portal,new T.TorusGeometry(1.16,.018,4,64),'#ecd29a');inner.rotation.z=.3;inner.material=material('#e7d5a3',.3,.6);
  const veil=mesh(portal,new T.CircleGeometry(1.32,48),'#a6eac4');
  veil.position.z=-.04;veil.material=new T.MeshBasicMaterial({color:'#9feac2',transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide});
  const units=lobbyParty(state).map((id,index)=>{
    const signature=active?state.run.heroes.find(h=>h.id===id)?.loadout?.signature===id:gearLoadout(state,id).signature===id;
    const weaponRarity=active?state.run.heroes.find(h=>h.id===id)?.loadout?.weaponRarity:gearLoadout(state,id).weaponRarity;
    const model=heroModel(id,{signature,weaponRarity,skin:equippedSkin(state,id),bond:bondAdorned(state,id),seasonAura:seasonAuraActive(state)}),x=[0,-2.25,2.25][index],z=index===0?2.7:1.35;
    model.position.set(x,.12,z);model.rotation.y=[.08,.25,-.22][index];model.scale.setScalar(index===0?1.03:.94);
    scene.add(model);cylinder(scene,'#344b43',x,.04,z,.9,.13,12,.3);
    const rune=mesh(scene,new T.TorusGeometry(.82,.025,4,48),HERO[id].color,x,.12,z);rune.rotation.x=-Math.PI/2;rune.material=material(HERO[id].color,.3,.55);
    return {id,model,rune,x,z,baseY:.12,angle:model.rotation.y};
  });
  const camera=new T.OrthographicCamera(-6,6,6,-6,.1,70);camera.position.set(0,7.5,16);camera.lookAt(0,2,-.6);fitLobbyCamera(camera,1);
  return {scene,world,tower,portal,ring,inner,veil,units,camera,mode:'lobby',key:lobbyKey(state)};
}

export function animateLobby(view,time,{reducedMotion=false}={}){
  animateWorld(view.world,time,{reducedMotion});animateModel(view.tower,time,{reducedMotion});
  for(const unit of view.units){
    unit.model.position.y=unit.baseY+(reducedMotion?0:Math.sin(time*1.6+unit.x)*.025);
    unit.model.rotation.y=unit.angle+(reducedMotion?0:Math.sin(time*.4+unit.x)*.03);
    animateModel(unit.model,time,{reducedMotion});
  }
  view.ring.rotation.z=reducedMotion?0:time*.07;view.inner.rotation.z=reducedMotion?.3:.3-time*.11;
  view.veil.material.opacity=reducedMotion?.12:.12+Math.sin(time*1.3)*.035;
}

export function pickLobbyHero(view,ray){
  view.scene.updateMatrixWorld(true);
  const hit=ray.intersectObjects(view.units.map(u=>u.model),true).find(h=>{
    let node=h.object;while(node){if(!node.visible)return false;node=node.parent;}return true;
  });
  if(!hit)return null;
  return view.units.find(u=>{let node=hit.object;while(node){if(node===u.model)return true;node=node.parent;}return false;})?.id||null;
}
