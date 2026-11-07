// Animation is presentation only. Each pose restores local joint transforms before applying offsets.
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const ease=n=>{const p=clamp(n);return p*p*(3-2*p);};
const wave=(p,a,b)=>p<=a||p>=b?0:Math.sin((p-a)/(b-a)*Math.PI);
const styles={
  guardian:{breath:.012,sway:.008,crouch:0,spread:.045,cape:.022,stride:.21},
  knight:{breath:.018,sway:.012,crouch:.025,spread:.03,cape:.035,stride:.32},
  assassin:{breath:.022,sway:.022,crouch:.075,spread:.065,cape:.055,stride:.48},
  ranger:{breath:.018,sway:.015,crouch:.035,spread:.045,cape:.045,stride:.32},
  cleric:{breath:.014,sway:.012,crouch:0,spread:.012,cape:.033,stride:.2},
  sorcerer:{breath:.018,sway:.016,crouch:.012,spread:.015,cape:.04,stride:.24}
};
const footCache=new WeakMap();
function footSupport(knee){
  const key=knee.children[0].geometry;if(footCache.has(key))return footCache.get(key);
  const vertices=[];for(const mesh of knee.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)vertices.push([p.getX(i),p.getY(i),p.getZ(i)]);}
  const support=new Map();
  for(let i=0;i<24;i++)for(const x of [-.25,0,.25]){
    const y=Math.cos(i*Math.PI/12),z=Math.sin(i*Math.PI/12);let best=Infinity,point;
    for(const v of vertices){const score=v[0]*x+v[1]*y+v[2]*z;if(score<best){best=score;point=v;}}
    support.set(point.join(','),point);
  }
  const points=[...support.values()];footCache.set(key,points);return points;
}
export function createHeroRig(parts){
  const nodes=[parts.hips,parts.waist,...parts.legs.flatMap(p=>[p.node,p.knee]),...parts.capes.map(p=>p.node)];
  let bowString=null;for(const arm of parts.arms)arm.node.traverse(n=>{if(n.userData.bowString)bowString=n;});
  return {...parts,legs:parts.legs.map(l=>({...l,support:footSupport(l.knee)})),style:styles[parts.role]||styles.knight,phase:[...parts.id].reduce((n,c)=>n+c.charCodeAt(0),0)*.13,
    bowString,probe:parts.hips.position.clone(),inverse:parts.hips.matrix.clone(),
    rest:nodes.map(node=>({node,position:node.position.clone(),rotation:node.rotation.clone()}))};
}
function drawBow(rig,pull){
  if(!rig.bowString)return;const geometry=rig.bowString.geometry;
  const z=pull?-pull*.36:0;if(geometry.attributes.position.getZ(1)===z)return;
  geometry.attributes.position.setZ(1,z);geometry.attributes.position.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
function anchorFeet(model,rig){
  model.updateWorldMatrix(true,true);rig.inverse.copy(model.matrixWorld).invert();let bottom=Infinity;
  for(const leg of rig.legs)for(const point of leg.support){
    rig.probe.set(...point).applyMatrix4(leg.knee.matrixWorld).applyMatrix4(rig.inverse);bottom=Math.min(bottom,rig.probe.y);
  }
  rig.hips.position.y+=Math.max(0,-.067-bottom);
}
export function resetHeroRig(model){
  const rig=model.userData.heroRig;if(!rig)return null;
  for(const part of rig.rest){part.node.position.copy(part.position);part.node.rotation.copy(part.rotation);}
  for(const arm of rig.arms)arm.node.rotation.copy(arm.rotation);
  drawBow(rig,0);
  if(model.userData.ornaments)model.userData.ornaments.visible=true;
  model.userData.body.rotation.set(0,0,0);return rig;
}
function cloth(rig,time,energy=0,twist=0){
  for(const cape of rig.capes){
    const t=time*1.8+rig.phase+cape.side*.6;
    cape.node.rotation.x=-.035+Math.sin(t)*rig.style.cape-energy*.22;
    cape.node.rotation.z=cape.side*(.018+energy*.08)+Math.sin(t*.8)*.013;
    cape.node.rotation.y=Math.sin(t*.7)*rig.style.cape-twist*.2;
  }
}
export function animateHeroIdle(model,time,{reducedMotion=false,frozen=false}={}){
  const rig=resetHeroRig(model);if(!rig||reducedMotion||frozen)return;
  const t=(Number.isFinite(time)?time:0)*1.65+rig.phase,s=Math.sin(t),c=Math.cos(t*.6),{style,hips,waist}=rig;
  hips.position.y-=style.crouch;waist.rotation.x=style.crouch*.5+s*style.breath;waist.rotation.z=c*style.sway;
  for(const leg of rig.legs){leg.node.rotation.x=-style.crouch;leg.knee.rotation.x=style.crouch*2;leg.node.rotation.z=-leg.side*style.spread;}
  for(const arm of rig.arms){arm.node.rotation.x+=s*style.breath;arm.node.rotation.z+=arm.hand*(rig.role==='assassin'?.035:.012)+c*style.sway;}
  cloth(rig,time);
  anchorFeet(model,rig);
}
export function poseHeroAttack(model,progress,pose,{skill=false,reducedMotion=false,frozen=false,time=0}={}){
  const rig=resetHeroRig(model);if(!rig||reducedMotion||frozen)return;
  const p=clamp(progress);if(p<=0||p>=1)return;
  const wind=wave(p,0,.5),strike=wave(p,.22,.78),hold=wave(p,.08,.96),power=skill?1.1:1,melee=['sword','dagger','shield'].includes(model.userData.weapon),weight=rig.role==='guardian'?.72:1;
  rig.waist.rotation.set(pose.lean*power,pose.twist*weight,Math.sin(p*Math.PI*2)*hold*.035);
  rig.hips.rotation.y=-pose.twist*.15;rig.hips.position.y-=(melee?.085:.035)*wind;
  for(const leg of rig.legs){
    const lead=leg.side<0?1:-1;
    leg.node.rotation.x=melee?lead*(-.23*wind+.28*strike)*weight:-lead*.11*hold;
    leg.node.rotation.z=-leg.side*(melee?.045:.025)*hold;
    leg.node.position.z+=melee?lead*strike*.11:lead*hold*.035;
    leg.knee.rotation.x=(melee?.21*wind+.12*strike:.07*hold)+(leg.side>0?.07*strike:0);
  }
  // The projectile launches at 33% of the bow attack; release the string on that frame.
  if(model.userData.weapon==='bow'){rig.waist.rotation.y-=wind*.2;drawBow(rig,p<.33?ease(p/.27):0);}
  if(model.userData.weapon==='orb'){rig.hips.position.y+=hold*.035;rig.waist.rotation.x=-hold*.06;}
  cloth(rig,time,strike+wind*.35,pose.twist);
  anchorFeet(model,rig);
}
export function poseHeroHit(model,strength,{time=0}={}){
  const rig=model.userData.heroRig;if(!rig)return;
  const amount=clamp(strength),weight=rig.role==='guardian'?.55:1;
  rig.waist.rotation.x-=amount*.27*weight;rig.waist.rotation.z+=amount*.065;
  rig.hips.position.y-=amount*.08*weight;
  for(const leg of rig.legs){leg.knee.rotation.x+=amount*.18*weight;leg.node.rotation.x-=amount*.08*weight;}
  for(const arm of rig.arms)arm.node.rotation.x-=amount*.18*weight;
  cloth(rig,time,amount*.5,rig.waist.rotation.y);
  anchorFeet(model,rig);
}
export function poseHeroFall(model,progress,{reducedMotion=false}={}){
  const rig=resetHeroRig(model);if(!rig)return;
  const p=reducedMotion?1:clamp(progress),kneel=ease(p/.45),fall=ease((p-.35)/.65);
  rig.hips.position.y-=kneel*.42+fall*.18;rig.hips.position.z+=fall*.27;
  rig.hips.rotation.set(fall*1.46,0,-fall*.13);rig.waist.rotation.x=kneel*.25-fall*.16;
  for(const leg of rig.legs){leg.node.rotation.x=-kneel*(leg.side<0?.7:.4);leg.knee.rotation.x=kneel*((leg.side<0?2.35:2.2)*(1-fall)+(leg.side<0?1.15:.95)*fall);}
  for(const arm of rig.arms){arm.node.rotation.x-=kneel*.2*(1-fall);arm.node.rotation.x+=fall*.08;arm.node.rotation.z+=arm.hand*fall*.2;}
  for(const cape of rig.capes){cape.node.rotation.x=-fall*.4;cape.node.rotation.z=cape.side*fall*.08;}
  if(model.userData.ornaments)model.userData.ornaments.visible=p<.35;
  anchorFeet(model,rig);
}
export function poseHeroWalk(model,time,{reducedMotion=false}={}){
  const rig=resetHeroRig(model);if(!rig||reducedMotion)return;
  const t=time*(rig.role==='guardian'?9:12)+rig.phase;
  for(const leg of rig.legs){const step=Math.sin(t+leg.side*Math.PI/2);leg.node.rotation.x=step*rig.style.stride;leg.knee.rotation.x=Math.max(0,-step)*.48;}
  rig.waist.rotation.y=Math.sin(t)*.06;rig.waist.rotation.x=.055;
  for(const arm of rig.arms)arm.node.rotation.x+=Math.sin(t-arm.hand*Math.PI/2)*.12;
  cloth(rig,time,.6,rig.waist.rotation.y);
  anchorFeet(model,rig);
}
export function poseHeroCast(model,progress,{reducedMotion=false}={}){
  const rig=resetHeroRig(model);if(!rig||reducedMotion)return;
  const p=clamp(progress),wind=wave(p,0,.65),cast=wave(p,.18,1);
  rig.hips.position.y-=wind*(rig.role==='guardian'?.12:.045);
  for(const leg of rig.legs){leg.node.rotation.x=-wind*(leg.side<0?.13:.06);leg.knee.rotation.x=wind*.18;leg.node.rotation.z=-leg.side*cast*.035;}
  rig.waist.rotation.y=cast*(rig.role==='assassin'?-.24:.1);cloth(rig,p*2.4,cast,rig.waist.rotation.y);
  if(model.userData.weapon==='bow')drawBow(rig,wind);
  anchorFeet(model,rig);
}
