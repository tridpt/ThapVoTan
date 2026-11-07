import {T,heroModel,mesh,ball,box,crystal,cylinder,material,animateModel} from './models3d.mjs';
import {HERO} from './data.mjs';
import {applyCombatPose} from './combat3d.mjs';

import {ULTIMATES,ultimateSpec,hasHeroUltimate} from './ultimate-data.mjs';
import {createHeroSpell,animateHeroSpell,poseHeroUltimate} from './hero-ultimates3d.mjs';
import {createUltimateAura,animateUltimateAura} from './expanded-ultimates3d.mjs';
export {ULTIMATES} from './ultimate-data.mjs';

const clamp=n=>Math.max(0,Math.min(1,n));
export function ultimateMarkup(id,options={}){
  const h=HERO[id],spec=ultimateSpec(id,options);if(!spec)return '';
  return `<section class="ultimate-overlay tier-${h.rarity}" role="dialog" aria-modal="true" aria-labelledby="ultimate-title" style="--ultimate:${spec.color};--ultimate-accent:${spec.accent}"><div class="ultimate-stage" aria-hidden="true"></div><div class="ultimate-shade" aria-hidden="true"></div><header class="ultimate-top"><span>${h.rarity} <i>✦</i> ${h.name}</span><button type="button" class="ultimate-skip" aria-label="Bỏ qua màn tung chiêu">Bỏ qua <span aria-hidden="true">↠</span></button></header><div class="ultimate-copy"><span>${spec.tag}</span><h2 id="ultimate-title">${h.skill}</h2><p>${spec.costume?`${h.name} · ${spec.costume}`:h.title}</p><div class="ultimate-progress" aria-hidden="true"><i></i></div></div></section>`;
}
function glowRing(group,color,radius,x,y,z,rotation=[0,0,0],arc=Math.PI*2){
  const ring=mesh(group,new T.TorusGeometry(radius,.025,5,64,arc),color,x,y,z);ring.material=material(color,.35,.85);ring.rotation.set(...rotation);return ring;
}
export function createUltimateScene(id,aspect=1,options={}){
  const spec=ultimateSpec(id,options);if(!spec)return null;
  const scene=new T.Scene();scene.background=new T.Color('#081320');scene.fog=new T.Fog('#081320',17,36);
  scene.add(new T.HemisphereLight('#e2edff','#25394c',2.1));
  const key=new T.DirectionalLight('#fff0db',2.5);key.position.set(-4,7,5);scene.add(key);
  const rim=new T.DirectionalLight(spec.color,2.2);rim.position.set(3,3,-4);scene.add(rim);
  const model=heroModel(id,options);scene.add(model);
  const aura=createUltimateAura(spec,options);scene.add(aura.root);
  cylinder(scene,'#243a4a',0,-.17,0,1.65,.25,12,.4);
  const floor=glowRing(scene,spec.color,1.55,0,-.025,0,[Math.PI/2,0,0]);
  const moving=[],stars=[],add=(node,kind,phase=0)=>{moving.push({node,kind,phase,position:node.position.clone(),rotation:node.rotation.clone(),scale:node.scale.clone()});return node;};
  const starCount=hasHeroUltimate(id)?(options.compact?6:12):options.compact?18:28;
  for(let i=0;i<starCount;i++){
    const a=i*2.399,r=2.7+(i%4)*.58,star=crystal(scene,i%2?spec.color:spec.accent,Math.cos(a)*r,.4+(i%9)*.55,Math.sin(a)*r-1,[.035,.08,.035],.85);
    stars.push({node:star,position:star.position.clone(),phase:i*.53});
  }
  const action=createHeroSpell(id,spec,{compact:!!options.compact});
  if(action)scene.add(action.root);
  else if(spec.theme==='gate'){
    for(const sign of [-1,1]){
      const column=new T.Group();scene.add(column);column.position.set(sign*2.05,-.3,-1.5);
      box(column,'#4d456a',0,1.8,0,[.42,3.9,.45],.4);box(column,'#dfc997',0,3.65,0,[.75,.16,.62],.5);
      crystal(column,spec.accent,0,4.1,0,[.18,.45,.18],.5);add(column,'pillar',sign>0?0:1);
    }
    add(glowRing(scene,spec.accent,2.12,0,2.25,-1.5),'gate');
    for(let i=0;i<6;i++){const a=i*Math.PI/3;add(crystal(scene,spec.color,Math.sin(a)*1.8,2.1+Math.cos(a)*1.7,-1.35,[.13,.3,.08],.7),'shard',i);}
  }else if(spec.theme==='symphony'){
    for(let i=0;i<3;i++)add(glowRing(scene,i%2?spec.accent:spec.color,1.75+i*.35,0,.6+i*.8,-.55,[.45+i*.3,.15,i*.7],Math.PI*1.65),'music',i);
    for(let i=0;i<7;i++){
      const a=i*1.1,note=new T.Group();scene.add(note);note.position.set(Math.cos(a)*2.15,1.1+(i%4)*.65,Math.sin(a)*1.7);
      ball(note,spec.accent,0,0,0,[.12,.08,.08],.3,.6);box(note,spec.color,.1,.19,0,[.025,.4,.025]);box(note,spec.color,.19,.38,0,[.18,.035,.025]);add(note,'note',i);
    }
  }else if(spec.theme==='cosmos'){
    for(let i=0;i<3;i++)add(glowRing(scene,i%2?spec.accent:spec.color,2.05+i*.25,0,1.7,-.55,[.4+i*.7,.3+i*.4,i]),'cosmos',i);
    const core=ball(scene,'#abcfff',0,2.6,-2.5,[.62,.62,.62],.6,.5);add(core,'core');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;add(crystal(scene,spec.accent,Math.cos(a)*2.6,1.75+Math.sin(a)*2,-.8,[.1,.21,.1],.9),'shard',i);}
  }else{
    ball(scene,'#080b17',0,2.35,-2,[1.3,1.3,.55],.1);
    add(glowRing(scene,spec.color,1.4,0,2.35,-1.94,[.2,.15,-.4]),'void');
    add(glowRing(scene,spec.accent,1.64,0,2.35,-1.9,[.3,-.15,.5],Math.PI*1.7),'void',1);
    for(const sign of [-1,1])add(glowRing(scene,spec.color,2.4,0,1.7,-.5,[sign*.6,.3,sign*1.2],Math.PI*1.2),'crescent',sign);
  }
  const camera=new T.PerspectiveCamera(39,aspect,.1,60),view={scene,camera,model,moving,stars,floor,spec,mode:'ultimate',duration:(spec.duration||2350)/(options.speed===2?2:1),action,aura,elapsed:0,bounds:new T.Box3(),corner:new T.Vector3(),focus:new T.Vector3(0,1.65,0)};
  animateUltimate(view,0);return view;
}
export function animateUltimate(view,elapsed,{reducedMotion=false}={}){
  const p=clamp(Math.max(0,elapsed)/(view.duration/1000)),t=p*(view.spec.duration||2350)/1000,power=Math.sin(p*Math.PI),{model,camera,spec}=view;view.elapsed=Math.max(0,elapsed);
  animateModel(model,t,{reducedMotion});applyCombatPose(model,reducedMotion?0:.12+p*.55,{skill:true,reducedMotion});
  model.rotation.y=reducedMotion?.12:.18+Math.sin(p*Math.PI)*.2;model.position.y=reducedMotion?0:power*.12;
  if(view.action){poseHeroUltimate(model,p,{reducedMotion});animateHeroSpell(view.action,p,{reducedMotion});}
  animateUltimateAura(view.aura,p,{reducedMotion});
  for(const part of view.moving){
    const {node,kind,phase,position,rotation,scale}=part;node.position.copy(position);node.rotation.copy(rotation);node.scale.copy(scale);if(reducedMotion)continue;
    if(kind==='pillar')node.position.y-=.55*(1-clamp(p*3));
    else if(kind==='shard'){node.rotation.y=t*.7;node.position.y+=Math.sin(t*1.8+phase)*.1;}
    else if(kind==='note'){node.position.y+=Math.sin(t*2+phase)*.16;node.rotation.y=t*.5;}
    else if(kind==='core')node.scale.setScalar(.62*(1+power*.12));
    else{node.rotation.z+=t*(kind==='crescent'?phase*.7:.25+phase*.12);node.rotation.y+=Math.sin(t*.7+phase)*.15;}
  }
  for(const star of view.stars){star.node.position.copy(star.position);if(!reducedMotion)star.node.position.y+=Math.sin(t*.8+star.phase)*.14;star.node.rotation.y=reducedMotion?0:t*.45+star.phase;}
  const fit=Math.max(1,.96/Math.max(.3,camera.aspect)),zoom=reducedMotion?1:1-power*.08,angle=reducedMotion?.35:.35+Math.sin(p*Math.PI)*.13;
  camera.position.set(Math.sin(angle)*9.2*fit*zoom,3.3+fit*.3,Math.cos(angle)*9.2*fit*zoom);camera.lookAt(0,1.65,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  // Fit the animated silhouette, including EX orbits and raised weapons, on either orientation.
  view.bounds.setFromObject(model);
  for(const node of view.action?.focus||[])if(node.visible)view.bounds.expandByObject(node);
  view.bounds.expandByObject(view.aura.root);
  for(const {node} of view.moving)if(node.visible)view.bounds.expandByObject(node);
  for(let pass=0;pass<3;pass++){
    let overflow=1;const {bounds,corner}=view;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){corner.set(x,y,z).project(camera);overflow=Math.max(overflow,Math.abs(corner.x)/.9,Math.abs(corner.y)/.77);}
    if(overflow<=1)break;camera.position.sub(view.focus).multiplyScalar(overflow*1.025).add(view.focus);camera.lookAt(view.focus);camera.updateMatrixWorld();
  }
  view.floor.rotation.z=reducedMotion?0:t*.12;
}
