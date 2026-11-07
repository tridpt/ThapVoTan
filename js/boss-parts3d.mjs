import {T} from './models3d.mjs';
import {BOSS_PART_IDS,BOSS_PARTS,bossThreat} from './boss-parts.mjs';

const shellGeometry=new T.IcosahedronGeometry(1,0),ringGeometry=new T.TorusGeometry(.28,.024,4,28),floorGeometry=new T.RingGeometry(.72,.88,40);
for(const g of [shellGeometry,ringGeometry,floorGeometry])g.userData.shared3d=true;
function layout(model){
  if(model.userData.id==='void-dragon')return {head:[0,2.61,.71],arms:[1.05,1.92,-.08],core:[0,1.43,.65]};
  if(model.userData.id==='basalt')return {head:[0,.98,1.01],arms:[.65,.42,.6],core:[0,1.3,.59]};
  if(model.userData.kind==='boss')return {head:[0,1.84,.6],arms:[.77,1.08,.31],core:[0,.87,.61]};
  return {head:[0,2.44,.57],arms:[.78,1.62,.39],core:[0,1.57,.61]};
}
export function attachBossPartsVisual(model){
  if(model.userData.bossPartsVisual)return model.userData.bossPartsVisual;
  const root=new T.Group(),parts={},positions=layout(model);root.name='breakable-armor';model.userData.body.add(root);
  for(const id of BOSS_PART_IDS){
    const def=BOSS_PARTS[id],group=new T.Group();group.position.fromArray(positions[id]);root.add(group);
    const mat=new T.MeshStandardMaterial({color:def.color,metalness:.65,roughness:.3,emissive:def.color,emissiveIntensity:.15,flatShading:true});
    const shells=[];
    for(const sign of id==='arms'?[-1,1]:[1]){
      const shell=new T.Mesh(shellGeometry,mat);shell.scale.set(...(id==='head'?[.38,.3,.09]:id==='arms'?[.29,.36,.18]:[.27,.36,.12]));
      if(id==='arms')shell.position.x=(sign-1)*positions[id][0];shell.userData.bossPart=id;group.add(shell);shells.push({node:shell,position:shell.position.clone(),scale:shell.scale.clone(),sign});
    }
    const marker=new T.Mesh(ringGeometry,new T.MeshBasicMaterial({color:def.color,transparent:true,opacity:.65,depthWrite:false}));marker.position.z=.14;marker.userData.bossPart=id;group.add(marker);
    parts[id]={group,marker,mat,shells,broken:false,breakAt:-10};
  }
  const visual={root,parts,selected:null,initialized:false};root.visible=false;model.userData.bossPartsVisual=visual;return visual;
}
export function syncBossPartsVisual(model,parts,time,{reducedMotion=false}={}){
  const v=model.userData.bossPartsVisual;if(!v)return;
  v.root.visible=!!parts;if(!parts)return;v.selected=parts.selected;
  for(const id of BOSS_PART_IDS){const part=v.parts[id],broken=parts[id].hp===0;if(broken!==part.broken){part.broken=broken;part.breakAt=-10;}}
  v.initialized=true;animateBossPartsVisual(model,time,{reducedMotion});
}
export function breakBossPartVisual(model,id,time){const p=model.userData.bossPartsVisual?.parts[id];if(!p||p.broken)return;p.broken=true;p.breakAt=time;}
export function bossPartPoint(model,id){const p=model.userData.bossPartsVisual?.parts[id];if(!p)return null;model.updateWorldMatrix(true,true);return p.group.localToWorld(new T.Vector3(0,0,.18));}
export function animateBossPartsVisual(model,time,{reducedMotion=false}={}){
  const v=model.userData.bossPartsVisual;if(!v?.root.visible)return;
  for(const id of BOSS_PART_IDS){
    const p=v.parts[id],selected=v.selected===id,progress=p.broken?reducedMotion?1:Math.max(0,Math.min(1,(time-p.breakAt)/.55)):0;
    p.mat.emissiveIntensity=p.broken?.03:selected?.75:.15;p.marker.material.color.set(p.broken?(id==='core'?'#a8ffe1':'#6d8185'):BOSS_PARTS[id].color);p.marker.material.opacity=p.broken?.4:selected?1:.6;
    p.marker.scale.setScalar(selected&&!reducedMotion?1.08+Math.sin(time*3)*.08:1);
    for(const shell of p.shells){shell.node.position.copy(shell.position);shell.node.scale.copy(shell.scale);shell.node.rotation.set(0,0,0);shell.node.visible=!p.broken||progress<1;if(p.broken){shell.node.position.x+=shell.sign*progress*.36;shell.node.position.y-=progress*.22;shell.node.rotation.z=shell.sign*progress*.7;shell.node.scale.multiplyScalar(1-progress);}}
  }
}
import {formationPosition} from './formation.mjs';
export function createBossTelegraph(scene,heroes,formation=null){
  const root=new T.Group(),markers=new Map();root.name='boss-threat-zones';scene.add(root);
  heroes.forEach((h,i)=>{const mat=new T.MeshBasicMaterial({color:'#f19b87',transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide}),node=new T.Mesh(floorGeometry,mat);node.rotation.x=-Math.PI/2;const {x,z}=formationPosition({heroes,formation},i);node.position.set(x,.17,z);node.visible=false;root.add(node);markers.set(h.id,node);});
  return {root,markers,kind:'safe'};
}
export function syncBossTelegraph(visual,run){const threat=bossThreat(run);visual.kind=threat?.kind||'safe';for(const [id,node] of visual.markers){node.visible=!!threat?.targets.includes(id);node.material.color.set(threat?.kind==='charge'?'#e3c580':'#ee9984');}}
export function animateBossTelegraph(visual,time,{reducedMotion=false}={}){for(const node of visual.markers.values()){node.scale.setScalar(reducedMotion?1:1+Math.sin(time*3)*.05);node.material.opacity=reducedMotion?.6:.5+(Math.sin(time*3)+1)*.12;}}
export function pickBossPart(model,raycaster){
  const v=model.userData.bossPartsVisual;if(!v?.root.visible||!model.visible)return null;
  model.updateWorldMatrix(true,true);let closest=null;
  for(const id of BOSS_PART_IDS){const p=v.parts[id],scale=p.group.getWorldScale(new T.Vector3()),radius=Math.max(scale.x,scale.y,scale.z)*.32;for(const shell of p.shells){const center=p.group.localToWorld(shell.position.clone().add(new T.Vector3(0,0,.15))),point=raycaster.ray.intersectSphere(new T.Sphere(center,radius),new T.Vector3());if(point){const distance=point.distanceTo(raycaster.ray.origin);if(!closest||distance<closest.distance)closest={id,distance};}}}
  return closest?.id||null;
}
