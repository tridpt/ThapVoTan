import {poseHeroCast} from './hero-motion3d.mjs';
import {T,mesh,box,ball,crystal,cylinder,material} from './models3d.mjs';
import {hasHeroUltimate} from './ultimate-data.mjs';
import {createExpandedHeroSpell,animateExpandedHeroSpell,poseExpandedHeroUltimate} from './expanded-ultimates3d.mjs';

const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
function plate(group,color,points,depth=.055){
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  return mesh(group,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1}),color);
}
function ring(group,color,x,z,r=.65){
  const node=mesh(group,new T.TorusGeometry(r,.025,4,40),color,x,.07,z);node.rotation.x=Math.PI/2;node.material=material(color,.3,.65);return node;
}
function beam(group,color,x,z){
  const node=cylinder(group,color,x,1.3,z,.13,2.6,8);
  node.material=new T.MeshBasicMaterial({color,transparent:true,opacity:.32,depthWrite:false,blending:T.AdditiveBlending});return node;
}

// The same finite spell geometry powers the cinematic and the capped arena VFX pool.
export function createHeroSpell(id,spec,{targets=null,compact=false,impactAt=.64}={}){
  if(!hasHeroUltimate(id))return null;
  if(!['rook','aerin','lumi','ember'].includes(id))return createExpandedHeroSpell(id,spec,{targets,compact,impactAt});
  const root=new T.Group(),parts=[],focus=[],{color:c,accent:a}=spec;
  const points=(targets?.length?targets:[new T.Vector3(-1,.1,1.15),new T.Vector3(0,.1,1.45),new T.Vector3(1,.1,1.15)]).slice(0,3).map(p=>p.clone());
  const add=(node,kind,index=0,extra={})=>{parts.push({node,kind,index,position:node.position.clone(),rotation:node.rotation.clone(),scale:node.scale.clone(),...extra});return node;};
  if(id==='rook'){
    for(let i=0;i<3;i++){
      const wall=new T.Group();root.add(wall);wall.position.set((i-1)*.92,.02,.88);
      plate(wall,c,[[-.44,0],[.44,0],[.44,1.5],[.28,1.82],[0,1.98],[-.28,1.82],[-.44,1.5]],.09);
      box(wall,a,0,1.1,.14,[.055,1.2,.055]);box(wall,a,0,1.35,.14,[.55,.055,.055]);crystal(wall,a,0,1.35,.2,[.13,.22,.07],.75);
      add(wall,'wall',i);focus.push(wall);
    }
    add(ring(root,a,0,0,1.55),'slam');
    for(const [i,p] of points.entries()){
      const seal=mesh(root,new T.TorusGeometry(.4,.025,4,32),a,p.x,1.3,p.z-.35);add(seal,'ward',i);focus.push(seal);
    }
  }else if(id==='aerin'){
    const bowlight=mesh(root,new T.TorusGeometry(.74,.025,4,40,Math.PI*1.5),a,.55,1.8,.3);add(bowlight,'bowlight');
    for(const [i,p] of points.entries()){add(ring(root,c,p.x,p.z,.46),'impact',i);}
    for(let i=0;i<(compact?6:9);i++){
      const target=points[i%points.length].clone();target.x+=(i%3-1)*.11;target.y=.2;
      const from=target.clone().add(new T.Vector3(-.38,3.9,-.9)),arrow=new T.Group();root.add(arrow);
      cylinder(arrow,a,0,0,0,.025,.8,5);const tip=mesh(arrow,new T.ConeGeometry(.1,.24,4),c,0,.48,0);tip.material=material(c,.3,.75);
      const tail=crystal(arrow,a,0,-.5,0,[.08,.3,.035],.65);tail.rotation.y=.4;
      add(arrow,'arrow',i,{from,to:target});focus.push(arrow);
    }
  }else if(id==='lumi'){
    for(const sign of [-1,1]){
      const wing=new T.Group();root.add(wing);wing.position.set(sign*.3,1.65,-.37);
      for(let i=0;i<(compact?3:4);i++)plate(wing,i%2?c:a,[[0,0],[sign*(.6+i*.2),1.2-i*.1],[sign*(1.2+i*.18),.6-i*.18],[sign*.35,-.25]],.035);
      add(wing,'wing',sign);focus.push(wing);
    }
    const halo=mesh(root,new T.TorusGeometry(.8,.025,4,48),a,0,3.05,-.4);add(halo,'halo');focus.push(halo);
    for(const [i,p] of points.entries()){
      const light=beam(root,a,p.x,p.z);add(light,'beam',i);focus.push(light);
      add(ring(root,c,p.x,p.z,.5),'impact',i);
    }
  }else{
    const bird=new T.Group();root.add(bird);
    ball(bird,c,0,0,0,[.2,.22,.56],.3,.65);ball(bird,a,0,.2,.44,[.16,.18,.24],.3,.75);
    const beak=mesh(bird,new T.ConeGeometry(.09,.3,4),a,0,.18,.71);beak.rotation.x=Math.PI/2;
    const birdWings=[];
    for(const sign of [-1,1]){
      const wing=new T.Group();bird.add(wing);wing.position.set(sign*.1,.05,-.05);birdWings.push({node:wing,sign});
      for(let i=0;i<(compact?3:4);i++){
        const feather=plate(wing,i%2?c:a,[[0,0],[sign*(.8+i*.12),.34-i*.17],[sign*(1.22+i*.13),-.15-i*.19],[sign*.25,-.28]],.035);feather.rotation.x=-.3;
      }
      const plume=crystal(bird,c,sign*.15,-.05,-.72,[.11,.16,.7],.65);plume.rotation.y=sign*.22;
    }
    const target=points[0].clone();target.y=.95;
    add(bird,'phoenix',0,{from:new T.Vector3(0,2.25,-.3),to:target,wings:birdWings});focus.push(bird);
    for(let i=0;i<(compact?4:7);i++)add(crystal(root,i%2?c:a,0,0,0,[.1,.13,.32],.8),'trail',i,{from:new T.Vector3(0,2.25,-.3),to:target});
    add(ring(root,a,target.x,target.z,.9),'impact');
  }
  root.userData.heroSpell=id;
  const spell={root,parts,focus,id,spec,impactAt};animateHeroSpell(spell,0);return spell;
}

export function animateHeroSpell(spell,progress,{reducedMotion=false}={}){
  if(spell.expanded)return animateExpandedHeroSpell(spell,progress,{reducedMotion});
  const p=reducedMotion?.64:clamp(progress),hit=spell.impactAt;
  for(const part of spell.parts){
    const {node,kind,index,position,rotation,scale}=part;node.position.copy(position);node.rotation.copy(rotation);node.scale.copy(scale);node.visible=true;
    if(kind==='wall'){
      const rise=reducedMotion?1:ease((p-hit+.16)/.18);node.scale.y=.03+.97*rise;node.position.y=position.y-(1-rise)*.1;
    }else if(kind==='ward'){
      node.visible=reducedMotion||p>=hit;node.scale.setScalar(reducedMotion?.9:.35+ease((p-hit)/.15)*.65);
    }else if(kind==='slam'||kind==='impact'){
      const age=reducedMotion?.15:p-hit;node.visible=reducedMotion||(age>=0&&age<.35);node.scale.setScalar(reducedMotion?1:.35+clamp(age/.35)*1.1);
    }else if(kind==='arrow'){
      const f=clamp((p-(hit-.28+(index%3)*.012))/.28);node.visible=reducedMotion?false:f>0&&f<1;node.position.lerpVectors(part.from,part.to,f);node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),part.to.clone().sub(part.from).normalize());
    }else if(kind==='bowlight'){
      node.visible=reducedMotion||p<hit;node.rotation.z=reducedMotion?0:p*.75;
    }else if(kind==='wing'){
      const open=reducedMotion?1:ease((p-.12)/.32);node.scale.x=.08+open*.92;node.rotation.y=reducedMotion?0:index*(1-open)*.9;
    }else if(kind==='beam'){
      const strength=reducedMotion?.7:Math.sin(clamp((p-hit+.12)/.48)*Math.PI);node.visible=strength>.01;node.scale.y=.1+strength*.9;node.material.opacity=.12+strength*.3;
    }else if(kind==='halo'){
      node.rotation.z=reducedMotion?0:p*.8;node.scale.setScalar(reducedMotion?1:.8+ease(p/.4)*.2);
    }else if(kind==='phoenix'||kind==='trail'){
      const delay=kind==='trail'?(index+1)*.023:0,f=clamp((p-.14-delay)/Math.max(.1,hit-.14));
      node.visible=reducedMotion?kind==='phoenix':p>.14+delay&&p<hit+.16+delay;
      node.position.lerpVectors(part.from,part.to,reducedMotion?.58:f);if(!reducedMotion)node.position.y+=Math.sin(f*Math.PI)*.45;
      const direction=part.to.clone().sub(part.from).normalize();node.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction);
      node.scale.multiplyScalar(kind==='trail'?(1-f)*.85+.15:reducedMotion?.8:.55+Math.sin(f*Math.PI)*.25);
      if(part.wings)for(const wing of part.wings)wing.node.rotation.z=reducedMotion?wing.sign*.15:wing.sign*(.2+Math.sin(f*Math.PI*6)*.34);
    }
  }
}

// Hero poses are absolute; reopening a cached model cannot inherit a previous cast.
export function poseHeroUltimate(model,p,{reducedMotion=false,baseY=0,angle=.15}={}){
  const id=model.userData.id;if(!hasHeroUltimate(id))return;
  poseHeroCast(model,p,{reducedMotion});
  if(poseExpandedHeroUltimate(model,p,{reducedMotion,baseY,angle}))return;
  const quiet=reducedMotion,q=quiet?0:clamp(p),wind=Math.sin(clamp(q/.55)*Math.PI),cast=Math.sin(clamp((q-.22)/.65)*Math.PI),body=model.userData.body;
  model.position.y=baseY+(quiet?0:id==='aerin'?Math.sin(clamp((q-.08)/.75)*Math.PI)*.7:id==='rook'?-.18*wind:.08*cast);
  model.rotation.y=angle+(quiet?0:id==='aerin'?-.35*wind:0);
  body.rotation.set(quiet?0:id==='rook'?.24*wind:0,quiet?0:id==='aerin'?-.25*wind:0,0);
  for(const arm of model.userData.combatRig){
    arm.node.rotation.copy(arm.rotation);if(quiet)continue;
    if(id==='rook')arm.node.rotation.x+=arm.hand>0?.45*wind-.85*cast:-.35*wind;
    else if(id==='aerin'){arm.node.rotation.x-=.85*wind;arm.node.rotation.z+=arm.hand<0?.8*wind:-.45*wind;}
    else{arm.node.rotation.x-=.75*cast;arm.node.rotation.z+=arm.hand*(id==='lumi'?.85:.45)*cast;}
  }
}
