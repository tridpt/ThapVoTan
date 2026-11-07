import {T,mesh,box,ball,crystal,cylinder,material} from './models3d.mjs';

const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
function rod(group,color,from,to,r=.045){
  const a=new T.Vector3(...from),b=new T.Vector3(...to),node=cylinder(group,color,0,0,0,r,a.distanceTo(b),6);
  node.position.copy(a.clone().add(b).multiplyScalar(.5));node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());node.material=material(color,.3,.7);return node;
}
function arc(group,color,r,span=Math.PI*2,width=.025){
  const node=mesh(group,new T.TorusGeometry(r,width,4,40,span),color);node.material=material(color,.3,.85);return node;
}
function blade(group,color,size=1){
  const node=new T.Group();group.add(node);crystal(node,color,0,.42,0,[.11,.7,.055],.85);box(node,'#f3dfb1',0,-.18,0,[.4,.055,.08]);cylinder(node,color,0,-.32,0,.055,.28,5);node.scale.setScalar(size);return node;
}
function ribbon(group,color,points,width=.075){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const node=mesh(group,new T.TubeGeometry(curve,20,width,4,false),color);node.material=material(color,.2,.9);return node;
}

// Each storyboard owns finite geometry. No random calls or account state enter playback.
export function createExpandedHeroSpell(id,spec,{targets=null,compact=false,impactAt=.64}={}){
  const root=new T.Group(),parts=[],focus=[],{color:c,accent:a}=spec;
  const points=(targets?.length?targets:[new T.Vector3(-1,.1,1.15),new T.Vector3(0,.1,1.45),new T.Vector3(1,.1,1.15)]).slice(0,3).map(p=>p.clone());
  const target=points[0],add=(node,kind,index=0,extra={})=>{parts.push({node,kind,index,position:node.position.clone(),rotation:node.rotation.clone(),scale:node.scale.clone(),...extra});return node;};
  const group=(x=0,y=0,z=0)=>{const node=new T.Group();root.add(node);node.position.set(x,y,z);return node;};
  const seal=(p,r=.6,color=c)=>{const node=arc(root,color,r);node.rotation.x=Math.PI/2;node.position.set(p.x,.08,p.z);return add(node,'seal');};
  const sweep=(p,color,sign=1,r=.8)=>{const node=arc(root,color,r,Math.PI*1.4,.065);node.position.set(p.x,1.2,p.z);node.rotation.set(.2,sign*.35,sign*.7);focus.push(node);return add(node,'sweep',sign);};
  const light=(p,color=a)=>{const node=cylinder(root,color,p.x,1.25,p.z,.14,2.5,8);node.material=new T.MeshBasicMaterial({color,transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending});focus.push(node);return add(node,'light');};

  if(id==='kira'){
    for(const sign of [-1,1]){
      const shadow=group(sign*1.15,.1,.05);crystal(shadow,c,0,1.22,0,[.28,.6,.16],.35);ball(shadow,'#30283f',0,2,0,[.23,.28,.22]);
      for(const hand of [-1,1]){const knife=blade(shadow,a,.6);knife.position.set(hand*.38,1.1,.15);knife.rotation.z=hand*.8;}
      add(shadow,'shadow',sign,{to:new T.Vector3(target.x+sign*.28,.1,target.z)});focus.push(shadow);sweep(target,a,sign,.7);
    }
  }else if(id==='bryn'){
    seal(target,.85,a);
    for(let i=0;i<(compact?5:7);i++){
      const angle=i*Math.PI*2/(compact?5:7),spike=crystal(root,i%2?c:a,target.x+Math.cos(angle)*.65,1.05,target.z+Math.sin(angle)*.65,[.18,1.15,.16],.65);
      spike.rotation.z=Math.cos(angle)*.18;add(spike,'ice',i);focus.push(spike);
    }
    const snow=group(target.x,2.6,target.z);for(let i=0;i<3;i++){const branch=rod(snow,a,[-.55,0,0],[.55,0,0],.025);branch.rotation.z=i*Math.PI/3;}
    add(snow,'sigil');focus.push(snow);
  }else if(id==='raiden'){
    const bolt=group(target.x,.1,target.z);ribbon(bolt,a,[[.35,3.8,0],[-.1,2.8,0],[.25,2.7,0],[-.3,1.5,0],[.1,1.6,0],[0,0,0]],.055);add(bolt,'bolt');focus.push(bolt);
    sweep(target,c,1,1.05);const sword=blade(root,a,1.15);sword.position.set(target.x,2.8,target.z);sword.rotation.z=-.55;add(sword,'fallblade');focus.push(sword);seal(target,.8);
  }else if(id==='seraph'){
    const score=group(0,2.75,-.35);arc(score,a,.65);for(const sign of [-1,1])for(let i=0;i<(compact?2:3);i++){
      const feather=crystal(score,i%2?c:a,sign*(.7+i*.22),-.12-i*.1,0,[.1,.55-i*.08,.05],.65);feather.rotation.z=-sign*(.8+i*.18);
    }
    add(score,'sigil');focus.push(score);
    for(const [i,p] of points.entries()){
      seal(p,.55);light(p);
      const note=group(p.x+.25,1.5,p.z);ball(note,a,0,0,0,[.12,.08,.08],.2,.75);rod(note,a,[.09,0,0],[.09,.5,0],.025);rod(note,c,[.09,.5,0],[.32,.42,0],.035);add(note,'note',i);focus.push(note);
    }
  }else if(id==='thorne'){
    for(const [i,p] of points.entries()){
      seal(p,.65,a);const roots=group(p.x,0,p.z);
      for(const sign of [-1,1]){
        ribbon(roots,c,[[sign*.6,0,.4],[sign*.8,.5,.15],[sign*.62,1.1,0],[sign*.4,1.8,.1]],.1);
        const leaf=crystal(roots,a,sign*.57,1.45,.12,[.13,.36,.07],.3);leaf.rotation.z=-sign*.5;
      }
      const crest=arc(roots,a,.45,Math.PI*1.5);crest.position.set(0,1.05,.24);add(roots,'root',i);focus.push(roots);
    }
  }else if(id==='astra'){
    const sky=arc(root,a,1.65);sky.position.set(0,3,-.9);sky.rotation.x=.8;add(sky,'orbit');focus.push(sky);
    for(let i=0;i<(compact?4:7);i++){
      const p=points[i%points.length],meteor=group();crystal(meteor,i%2?c:a,0,0,0,[.22,.35,.24],.9);crystal(meteor,a,0,.65,-.1,[.11,.8,.1],.8);
      add(meteor,'meteor',i,{from:new T.Vector3(p.x-.7,4.1+(i%2)*.3,p.z-.8),to:new T.Vector3(p.x,.25,p.z)});focus.push(meteor);
    }
    points.forEach(p=>seal(p,.8,a));
  }else if(id==='nyx'){
    const disc=group(0,2.7,-1);ball(disc,'#161528',0,0,0,[.85,.85,.16],.1);arc(disc,c,.92);for(let i=0;i<5;i++){const spike=crystal(disc,a,(i-2)*.26,.8+(i===2?.25:0),.04,[.08,.26,.07],.8);spike.rotation.z=-(i-2)*.22;}
    add(disc,'eclipse');focus.push(disc);sweep(target,c,-1,1.05);sweep(target,a,1,.83);
    const drain=ribbon(root,a,[[target.x,1,target.z],[target.x*.6,2,target.z*.5],[0,1.8,0]],.055);add(drain,'drain');focus.push(drain);
  }else if(id==='kael'){
    const sword=blade(root,a,1.85);sword.position.set(0,2.2,.6);sword.rotation.z=-.45;add(sword,'flameblade');focus.push(sword);
    for(const sign of [-1,1]){
      const fan=group(sign*.3,1.8,-.25);for(let i=0;i<(compact?3:5);i++){
        const plume=crystal(fan,i%2?c:a,sign*(.5+i*.25),.5-i*.14,0,[.15,.85-i*.06,.08],.8);plume.rotation.z=-sign*(.7+i*.1);
      }
      add(fan,'firewing',sign);focus.push(fan);
    }
    for(const p of points){sweep(p,c,1,1);seal(p,.65,a);}
  }else if(id==='eira'){
    for(let i=0;i<(compact?2:3);i++){
      const wave=ribbon(root,i%2?a:c,[[-2,2.7+i*.22,-.6],[-1,3.2+i*.22,-.9],[0,2.6+i*.22,-1],[1,3.1+i*.22,-.9],[2,2.7+i*.22,-.6]],.095);add(wave,'aurora',i);focus.push(wave);
    }
    for(const [i,p] of points.entries()){
      seal(p,.65,c);light(p,c);const spring=group(p.x,.12,p.z);arc(spring,a,.42).rotation.x=Math.PI/2;
      for(let j=0;j<(compact?3:5);j++){const angle=j*Math.PI*2/(compact?3:5);crystal(spring,a,Math.cos(angle)*.4,.45,Math.sin(angle)*.4,[.07,.4,.07],.8);}
      add(spring,'spring',i);focus.push(spring);
    }
  }else if(id==='veyron'){
    for(const [i,p] of points.entries()){
      seal(p,.85,a);const lance=group(p.x,0,p.z);cylinder(lance,a,0,1.65,0,.05,2.4,6);crystal(lance,c,0,.25,0,[.22,.45,.13],.85);
      ribbon(lance,c,[[.2,3.7,0],[-.25,3,0],[.22,2.2,0],[-.13,1.5,0],[0,.25,0]],.055);add(lance,'lance',i);focus.push(lance);
      for(const sign of [-1,1]){const orbit=arc(root,sign<0?c:a,.58,Math.PI*1.5);orbit.position.set(p.x,1.4,p.z);orbit.rotation.set(.5,sign*.7,i);add(orbit,'stormorbit',sign);focus.push(orbit);}
    }
  }else if(id==='solis'){
    const sun=group(0,3.3,-.85);ball(sun,a,0,0,0,[.52,.52,.52],.3,.9);
    for(let i=0;i<(compact?8:12);i++){const angle=i*Math.PI*2/(compact?8:12),ray=crystal(sun,i%2?c:a,Math.sin(angle)*.85,Math.cos(angle)*.85,0,[.07,.3,.06],.9);ray.rotation.z=-angle;}
    add(sun,'sun');focus.push(sun);
    for(let i=0;i<(compact?2:3);i++){const halo=arc(root,i%2?c:a,1.2+i*.2);halo.position.set(0,3.3,-.85);halo.rotation.set(i*.5,i*.4,0);add(halo,'sunhalo',i);focus.push(halo);}
    for(const [i,p] of points.entries()){seal(p,.95,a);const eruption=group(p.x,.1,p.z);for(let j=0;j<3;j++){const flame=crystal(eruption,j%2?c:a,(j-1)*.25,.75,0,[.15,1.1-(j%2)*.2,.12],.85);flame.rotation.z=(j-1)*.2;}add(eruption,'eruption',i);focus.push(eruption);}
  }else if(id==='selene'){
    const moon=group(0,2.9,-1);ball(moon,'#42213c',0,0,0,[.9,.9,.16],.2,.3);arc(moon,c,.97);arc(moon,a,1.1,Math.PI*1.35,.04).rotation.z=.4;add(moon,'bloodmoon');focus.push(moon);
    for(const sign of [-1,1]){const scythe=group();const crescent=arc(scythe,c,.78,Math.PI*1.35,.09);crescent.rotation.z=sign*.6;const knife=blade(scythe,a,.85);knife.rotation.z=sign*1.2;
      add(scythe,'crescent',sign,{from:new T.Vector3(sign*1.5,1.8,.2),to:new T.Vector3(target.x,1.2,target.z)});focus.push(scythe);}
    for(let i=0;i<(compact?2:4);i++){const tether=ribbon(root,i%2?a:c,[[target.x,1+i*.13,target.z],[target.x*.5+(i%2?.35:-.35),1.6+i*.13,target.z*.5],[0,1.7,0]],.035);add(tether,'drain',i);}
    seal(target,.9,c);
  }else{return null;}
  root.userData.heroSpell=id;
  const spell={root,parts,focus,id,spec,impactAt,expanded:true};animateExpandedHeroSpell(spell,0);return spell;
}

export function animateExpandedHeroSpell(spell,progress,{reducedMotion=false}={}){
  const p=clamp(progress),hit=spell.impactAt,quiet=reducedMotion;
  for(const part of spell.parts){
    const {node,kind,index,position,rotation,scale}=part;node.position.copy(position);node.rotation.copy(rotation);node.scale.copy(scale);node.visible=true;
    const charge=quiet?1:ease(p/Math.max(.05,hit)),release=quiet?1:ease((p-hit+.2)/.2),after=quiet?.12:Math.max(0,p-hit);
    if(kind==='shadow'){
      const f=quiet?.85:ease((p-hit+.25)/.3);node.visible=quiet||p>hit-.25&&p<hit+.2;node.position.lerpVectors(position,part.to,f);node.scale.multiplyScalar(.7+.3*release);
    }else if(kind==='sweep'){
      node.visible=quiet||p>hit-.16&&p<hit+.22;node.rotation.z+=quiet?0:index*(p-hit)*3.5;node.scale.multiplyScalar(quiet?1:.55+release*.65);
    }else if(kind==='seal'){
      node.visible=quiet||p>=hit-.09;node.scale.multiplyScalar(quiet?1:.5+ease(after/.25)*.8);node.rotation.z+=quiet?0:after*.5;
    }else if(kind==='ice'||kind==='root'||kind==='spring'||kind==='eruption'){
      const rise=quiet?1:ease((p-hit+.09-(index%3)*.008)/.16);node.scale.y*=.02+.98*rise;node.visible=quiet||rise>0;
      if(kind==='ice')node.position.y=position.y-scale.y+node.scale.y;
    }else if(kind==='bolt'||kind==='lance'){
      node.visible=quiet||p>=hit-.14&&p<hit+.24;node.position.y+=quiet?0:(1-release)*2.8;node.scale.x*=quiet?1:.8+Math.sin(p*45)*.15;
    }else if(kind==='sigil'||kind==='note'||kind==='orbit'){
      node.scale.multiplyScalar(.2+.8*charge);node.rotation.z+=quiet?0:p*(kind==='note'?.3:.7);node.position.y+=quiet?0:Math.sin(p*Math.PI)*.1;
    }else if(kind==='light'){
      const strength=quiet?.75:Math.sin(clamp((p-hit+.1)/.5)*Math.PI);node.visible=strength>.01;node.scale.y*=.08+strength*.92;node.material.opacity=.15+strength*.25;
    }else if(kind==='meteor'||kind==='crescent'){
      const stagger=kind==='meteor'?index%3*.009:0,f=quiet?1:clamp((p-hit+.3-stagger)/(.3-stagger));node.visible=quiet||p>hit-.3&&p<hit+.13;
      node.position.lerpVectors(part.from,part.to,f);node.rotation.z+=quiet?0:kind==='meteor'?-.45:index*(f*Math.PI*1.5);node.scale.multiplyScalar(quiet?1:.6+charge*.4);
    }else if(kind==='fallblade'||kind==='flameblade'){
      node.position.y-=quiet?.7:release*.9;node.rotation.z+=quiet?.6:release*1.2;node.scale.multiplyScalar(.3+charge*.7);node.visible=quiet||p<hit+.18;
    }else if(kind==='eclipse'||kind==='bloodmoon'){
      node.scale.multiplyScalar(.25+.75*charge);node.rotation.z+=quiet?0:Math.sin(p*Math.PI)*.15;
    }else if(kind==='drain'){
      node.visible=quiet||p>=hit&&p<hit+.3;node.scale.multiplyScalar(quiet?1:.7+.3*Math.sin(clamp(after/.3)*Math.PI));
    }else if(kind==='firewing'){
      node.scale.x*=.05+charge*.95;node.rotation.y+=quiet?0:index*(1-charge)*.8;
    }else if(kind==='aurora'){
      node.scale.multiplyScalar(.3+.7*charge);node.position.y+=quiet?0:Math.sin(p*Math.PI*2+index)*.1;node.rotation.y+=quiet?0:Math.sin(p*Math.PI)*.08;
    }else if(kind==='stormorbit'){
      node.visible=quiet||p>hit-.2;node.rotation.z+=quiet?0:index*p*3;node.scale.multiplyScalar(.25+.75*release);
    }else if(kind==='sun'||kind==='sunhalo'){
      node.scale.multiplyScalar(quiet?1:.15+charge*.85+Math.sin(clamp(after/.25)*Math.PI)*.25);node.rotation.z+=quiet?0:p*(index+1)*.45;
    }
  }
}

// Tuples are lift, lean, twist, facing turn, then left/right weapon rotations.
const poses={
  kira:[.12,.3,-.65,-.2,[-.7,.45,.95],[-.95,-.45,-1]],
  bryn:[.08,-.14,.12,.08,[-.65,0,.55],[-1.1,.2,-.2]],
  raiden:[.25,.28,-.45,.12,[-.3,0,.2],[-1.45,.4,.95]],
  seraph:[.16,-.08,0,0,[-.75,.15,1.05],[-.9,-.15,-.7]],
  thorne:[-.14,.22,.16,-.1,[-1.05,.2,.25],[-.8,-.15,-.45]],
  astra:[.32,-.15,.25,.15,[-1,.3,1.1],[-1.2,-.35,-1.15]],
  nyx:[.18,.24,.85,-.4,[-1.1,.6,.75],[-.7,-.5,-1.15]],
  kael:[.2,.18,-.55,.25,[-.45,0,.5],[-1.55,.3,1.3]],
  eira:[.35,-.1,-.12,-.08,[-.65,.2,1.2],[-1.05,-.2,-.45]],
  veyron:[.45,.24,.45,.35,[-1.15,.25,.35],[-1.6,-.2,-.85]],
  solis:[.48,-.18,.18,.12,[-1.35,.4,1.25],[-1.4,-.4,-1.25]],
  selene:[.28,.2,-.9,-.35,[-1.3,.5,1.3],[-1.15,-.6,-1.35]]
};
export function poseExpandedHeroUltimate(model,progress,{reducedMotion=false,baseY=0,angle=.15}={}){
  const pose=poses[model.userData.id];if(!pose)return false;
  const p=clamp(progress),wind=reducedMotion?0:Math.sin(clamp(p/.65)*Math.PI),cast=reducedMotion?0:Math.sin(clamp((p-.18)/.82)*Math.PI),[lift,lean,twist,turn,left,right]=pose;
  model.position.y=baseY+lift*cast;model.rotation.y=angle+turn*wind;model.userData.body.rotation.set(lean*cast,twist*cast,0);
  for(const arm of model.userData.combatRig){const rotation=arm.hand<0?left:right;arm.node.rotation.copy(arm.rotation);arm.node.rotation.x+=rotation[0]*wind;arm.node.rotation.y+=rotation[1]*cast;arm.node.rotation.z+=rotation[2]*cast;}
  return true;
}

// Rarity adds a predictable number of layers, independent of the hero's theme.
export function createUltimateAura(spec,{compact=false}={}){
  const root=new T.Group(),rings=[],motes=[],rank=spec.rank||0;
  for(let i=0;i<rank;i++){
    const ring=arc(root,i%2?spec.accent:spec.color,1.65+i*.12,Math.PI*(1.25+i*.08),.018);ring.position.set(0,1.6,-.45);ring.rotation.set(.45+i*.22,i*.4,i*.7);rings.push({node:ring,rotation:ring.rotation.clone()});
  }
  const count=(compact?3:6)+rank*(compact?1:2);
  for(let i=0;i<count;i++){const angle=i*2.399,r=1.7+(i%3)*.2,node=crystal(root,i%2?spec.color:spec.accent,Math.cos(angle)*r,.7+(i%5)*.46,Math.sin(angle)*r-.4,[.035,.075,.035],.85);motes.push({node,position:node.position.clone(),phase:i*.53});}
  return {root,rings,motes,rank};
}
export function animateUltimateAura(aura,progress,{reducedMotion=false}={}){
  const p=clamp(progress),power=reducedMotion?.8:.55+.45*Math.sin(p*Math.PI);
  for(const [i,part] of aura.rings.entries()){part.node.rotation.copy(part.rotation);if(!reducedMotion)part.node.rotation.z+=p*(i%2?-1:1)*.8;part.node.scale.setScalar(power);}
  for(const part of aura.motes){part.node.position.copy(part.position);part.node.rotation.set(0,reducedMotion?0:p+part.phase,0);if(!reducedMotion)part.node.position.y+=Math.sin(p*Math.PI*2+part.phase)*.12;}
}
