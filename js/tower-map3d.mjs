import {seasonAuraActive} from './season.mjs';
import {T,mesh,box,cylinder,crystal,heroModel,material,animateModel} from './models3d.mjs';
import {poseHeroWalk} from './hero-motion3d.mjs';
import {NODES} from './data.mjs';
import {equippedSkin} from './skins.mjs';
import {towerMapView} from './tower-map.mjs';
import {anomalyForFloor} from './anomalies.mjs';

export function towerMapKey(state){
  const r=state.run;return [seasonAuraActive(state),r.started,r.floor,r.map.seed,r.map.start,r.map.path.join(','),anomalyForFloor(r)?.id||'',...r.heroes.map(h=>`${h.id}:${h.hp>0}:${h.loadout?.signature===h.id}:${h.loadout?.weaponRarity}:${equippedSkin(state,h.id)||'base'}`)].join('|');
}
export const towerNodePosition=node=>new T.Vector3((node.lane-1)*4.2,.12+node.row*.28,6-node.row*3.25);
export function fitTowerMapCamera(camera,aspect){
  const half=Math.max(7.8,6.1/Math.max(.1,aspect));Object.assign(camera,{left:-half*aspect,right:half*aspect,top:half+.35,bottom:-half+.35});camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;
}
export function towerNodeScreen(view,id){
  const node=view.nodes.get(id);if(!node)return null;
  const p=node.position.clone().add(new T.Vector3(0,.04,.95)).project(view.camera);return {x:(p.x*.5+.5)*100,y:(-p.y*.5+.5)*100};
}
function bridge(scene,a,b,color,width=.23){
  const delta=b.clone().sub(a),length=delta.length(),center=a.clone().add(b).multiplyScalar(.5);
  const deck=box(scene,color,center.x,center.y-.1,center.z,[width,.12,length],.25);deck.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());
  return deck;
}
function emblem(group,type,color,compact){
  const base=.3;
  if(type==='treasure'){
    box(group,'#6f5140',0,base+.3,0,[.95,.5,.62]);box(group,color,0,base+.58,0,[1,.12,.66],.5);box(group,color,0,base+.33,.33,[.16,.26,.05],.5);
  }else if(type==='rest'){
    cylinder(group,'#5c7182',0,base+.12,0,.5,.18,6);crystal(group,color,0,base+.68,0,[.25,.5,.25],.5);
  }else if(type==='event'){
    const orb=crystal(group,color,0,base+.72,0,[.35,.48,.3],.7);orb.rotation.z=.5;
    const halo=mesh(group,new T.TorusGeometry(.55,.035,4,compact?20:32),color,0,base+.72,0);halo.rotation.x=.5;
  }else if(type==='boss'){
    for(const x of [-.7,.7]){cylinder(group,'#6c5263',x,base+.7,0,.16,1.4,6);crystal(group,color,x,base+1.5,0,[.17,.32,.17],.5);}
    const gate=mesh(group,new T.TorusGeometry(.73,.07,5,compact?24:40),color,0,base+.95,0);gate.material=material(color,.4,.65);
  }else{
    for(const side of type==='elite'?[-1,1]:[1]){
      const sword=new T.Group();group.add(sword);sword.position.set(side*.13,base+.7,0);sword.rotation.z=side*.45;
      box(sword,color,0,0,0,[.12,1,.08],.6);box(sword,'#ead3a2',0,-.24,.02,[.48,.08,.13],.5);
    }
  }
}
function batchStaticMap(scene,meshes){
  // Keep layer-1 originals as picking/bounds proxies; draw repeated stone/bridge shapes with instancing.
  scene.updateMatrixWorld(true);const batches=new Map();
  for(const item of meshes){const key=item.geometry.uuid+':'+item.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(item);}
  for(const items of batches.values()){
    if(items.length<2)continue;
    const instances=new T.InstancedMesh(items[0].geometry,items[0].material,items.length);instances.castShadow=instances.receiveShadow=true;
    items.forEach((item,index)=>{instances.setMatrixAt(index,item.matrixWorld);item.layers.set(1);});instances.instanceMatrix.needsUpdate=true;scene.add(instances);
  }
}
export function createTowerMapScene(state,{compact=false,effects=true}={}){
  const data=towerMapView(state.run),scene=new T.Scene(),nodes=new Map(),bridges=[],portals=[],stable=[];
  const anomaly=anomalyForFloor(state.run),background=anomaly?.visual.background||'#10242d';
  scene.background=new T.Color(background);scene.fog=new T.Fog(background,32,57);
  const rockGeometry=new T.ConeGeometry(1,1,compact?5:7),ringGeometry=new T.TorusGeometry(.87,.027,4,compact?24:40);
  const camera=new T.OrthographicCamera(-7,7,8,-8,.1,70);camera.position.set(0,19,17);camera.lookAt(0,.65,0);fitTowerMapCamera(camera,1);
  for(const node of data.nodes){
    const group=new T.Group(),position=towerNodePosition(node),color=NODES[node.type].color;group.position.copy(position);scene.add(group);
    cylinder(group,node.status==='bypassed'||node.status==='blocked'?'#30454c':'#607b73',0,0,0,node.type==='boss'?1.17:1.02,.22,compact?6:8,.1);
    const rock=mesh(group,rockGeometry,'#283e4b',0,-.67,0,[.95,1.15,.95]);rock.rotation.z=Math.PI;
    const ring=mesh(group,ringGeometry,color,0,.14,0);ring.rotation.x=-Math.PI/2;ring.material=material(color,.35,node.status==='available'?.65:.12);
    emblem(group,node.type,node.status==='bypassed'?'#6a7e81':color,compact);
    group.traverse(o=>{if(o.isMesh&&o!==ring)stable.push(o);});
    if(node.status==='available'||node.type==='boss'){
      const portal=mesh(group,new T.TorusGeometry(node.type==='boss'?.98:.77,.018,4,compact?24:40),color,0,node.type==='boss'?1.26:.79,-.08);portal.material=material(color,.3,.45);portals.push({mesh:portal,angle:node.lane*.3});
    }
    group.traverse(o=>o.userData.mapNode=node.id);nodes.set(node.id,{...node,group,position,ring,color});
  }
  for(const edge of data.edges){
    const from=nodes.get(edge.from),to=nodes.get(edge.to),chosen=from.chosen&&to.chosen,open=from.chosen&&to.status==='available';
    const deck=bridge(scene,from.position,to.position,chosen?'#d8bd85':open?'#789e8c':'#344d58',(chosen||open) ? .2 : .12);bridges.push({...edge,deck});stable.push(deck);
  }
  const start=new T.Vector3(0,-.12,8.75);stable.push(cylinder(scene,'#577366',start.x,start.y,start.z,1,.2,8));
  for(const node of data.rows[0])stable.push(bridge(scene,start,nodes.get(node.id).position,'#46665e',.14));
  batchStaticMap(scene,stable);
  const party=new T.Group(),previous=data.path.at(-1);party.position.copy(previous?nodes.get(previous).position:start);scene.add(party);
  const units=state.run.heroes.map((h,i)=>{
    const model=heroModel(h.id,{signature:h.loadout?.signature===h.id,weaponRarity:h.loadout?.weaponRarity,skin:equippedSkin(state,h.id),seasonAura:seasonAuraActive(state)});model.scale.setScalar(.3);model.position.set((i-1)*.46,.18,i===1?.18:0);model.rotation.y=.18;model.visible=h.hp>0;party.add(model);return {model,x:model.position.x,z:model.position.z};
  });
  const motesGeometry=new T.BufferGeometry(),points=[];for(let i=0;i<(compact?22:50);i++)points.push(Math.sin(i*8.13)*7,-1+(i%8)*.5,Math.cos(i*2.7)*10);
  motesGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));const motes=new T.Points(motesGeometry,new T.PointsMaterial({color:anomaly?.visual.weather||'#c5dcca',size:.055,transparent:true,opacity:.6,depthWrite:false}));motes.visible=effects;scene.add(motes);
  return {mode:'map',key:towerMapKey(state),scene,camera,nodes,bridges,portals,party,units,motes,travel:null};
}
export function syncTowerMapFocus(view,id){
  view.focus=id;
  for(const node of view.nodes.values())node.ring.material=material(node.color,.35,node.id===id?.95:node.status==='available'?.65:node.chosen?.4:.12);
}
export function startTowerTravel(view,id,time,{speed=1,reducedMotion=false}={}){
  const node=view.nodes.get(id);if(!node||node.status!=='available')return 0;
  const duration=reducedMotion?0:760/(speed===2?2:1);
  view.travel={from:view.party.position.clone(),to:node.position.clone(),startedAt:time,duration:duration/1000};
  if(!duration)finishTowerTravel(view);return duration;
}
export function finishTowerTravel(view){if(view?.travel){view.party.position.copy(view.travel.to);view.travel=null;}}
export function animateTowerMap(view,time,{reducedMotion=false}={}){
  let moving=false,travelPhase=0;
  if(view.travel){
    const p=reducedMotion?1:Math.min(1,Math.max(0,(time-view.travel.startedAt)/view.travel.duration)),ease=p*p*(3-2*p);view.party.position.lerpVectors(view.travel.from,view.travel.to,ease);travelPhase=p;moving=p<1;if(!moving)view.travel=null;
  }
  for(const [i,u] of view.units.entries()){
    u.model.position.y=.18+(moving&&!reducedMotion?Math.abs(Math.sin(time*19+i*.8))*.1:0);u.model.rotation.y=moving?Math.PI:.18;animateModel(u.model,time,{reducedMotion});
    if(moving)poseHeroWalk(u.model,travelPhase*.76,{reducedMotion});
  }
  for(const p of view.portals)p.mesh.rotation.z=p.angle+(reducedMotion?0:Math.sin(time*.65+p.angle)*.12);
  for(const node of view.nodes.values())node.ring.scale.setScalar(node.id===view.focus?1.13:node.status==='available'&&!reducedMotion?1+Math.sin(time*2+node.lane)*.035:1);
  view.motes.rotation.y=reducedMotion?0:time*.015;
}
export function pickTowerNode(view,ray){
  view.scene.updateMatrixWorld(true);const mask=ray.layers.mask;ray.layers.enable(1);
  try{return ray.intersectObjects([...view.nodes.values()].map(n=>n.group),true).find(h=>h.object.userData.mapNode)?.object.userData.mapNode||null;}finally{ray.layers.mask=mask;}
}
