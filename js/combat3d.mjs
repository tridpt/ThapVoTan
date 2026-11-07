import {animateHeroIdle,poseHeroAttack,poseHeroHit,poseHeroFall} from './hero-motion3d.mjs';

const clamp=n=>Math.max(0,Math.min(1,n));
const wave=(t,start,end)=>t<=start||t>=end?0:Math.sin((t-start)/(end-start)*Math.PI);
export const WEAPONS=['sword','dagger','bow','staff','orb','shield'];
const profiles={
  sword:{duration:840,release:.27,impact:.43,melee:true},
  dagger:{duration:740,release:.22,impact:.38,melee:true},
  bow:{duration:880,release:.33,impact:.65,melee:false},
  staff:{duration:940,release:.35,impact:.64,melee:false},
  orb:{duration:980,release:.31,impact:.65,melee:false},
  shield:{duration:900,release:.28,impact:.46,melee:true},
  creature:{duration:760,release:.18,impact:.49,melee:false}
};
export function combatTiming(weapon,{skill=false,counter=false,speed=1,reducedMotion=false}={}){
  if(reducedMotion)return {duration:230,release:0,impact:0,flight:0,melee:false};
  const p=profiles[weapon]||profiles.creature,duration=p.duration*(counter?.78:skill?1.12:1)/(speed===2?2:1);
  return {duration,release:p.release*duration,impact:p.impact*duration,flight:(p.impact-p.release)*duration,melee:p.melee};
}
// Absolute poses allow interrupted animations and cached instances to reset cleanly.
export function combatPose(weapon,t,{skill=false,counter=false,reducedMotion=false,frozen=false}={}){
  const pose={lunge:0,lean:0,twist:0,lift:0,turn:0,left:[0,0,0],right:[0,0,0]};
  if(reducedMotion||frozen||t<=0||t>=1||!Number.isFinite(t))return pose;
  const wind=wave(t,0,.5),strike=wave(t,.22,.78),hold=wave(t,.08,.96),power=skill?1.18:1;
  if(weapon==='sword'){
    pose.right=[-1.2*wind+.7*strike,.5*strike,-.75*wind+1.3*strike];pose.left=[-.2*hold,0,.2*wind];
    pose.lunge=.76*strike;pose.twist=-.42*wind+.8*strike;pose.lean=.2*strike;pose.turn=.95*hold;
  }else if(weapon==='dagger'){
    pose.right=[-.85*wind+.9*strike,-.4*strike,-.9*strike];pose.left=[-.65*strike,.6*strike,.85*strike];
    pose.lunge=.88*strike;pose.twist=-.8*strike;pose.lean=.32*strike;pose.lift=.13*strike;pose.turn=hold;
  }else if(weapon==='bow'){
    pose.right=[-1.25*hold,.16*hold,-.3*hold];pose.left=[-1.2*hold,-.5*wind,.8*wind];
    pose.twist=-.3*hold;pose.lean=-.1*strike;pose.turn=.27*hold;
  }else if(weapon==='shield'){
    pose.right=[-1.12*hold,0,-.35*strike];pose.left=[-.8*wind,.2*strike,.2*wind];
    pose.lunge=.54*strike;pose.lean=.3*strike;pose.turn=.8*hold;
  }else if(weapon==='orb'){
    pose.right=[-.7*hold,-.3*hold,-.9*hold];pose.left=[-.6*hold,.3*hold,.9*hold];
    pose.lift=.18*hold;pose.twist=.15*strike;pose.turn=.1*hold;
  }else if(weapon==='staff'){
    pose.right=[-.8*hold,.25*strike,-.55*wind];pose.left=[-.4*hold,0,.65*hold];
    pose.lean=-.1*wind;pose.lift=.05*hold;pose.turn=.15*hold;
  }else{pose.lunge=.1*strike;pose.lean=.22*strike;pose.lift=.12*hold;}
  if(counter){const dash=wave(t,.04,.82);pose.lunge=(profiles[weapon]?.melee?.98:.24)*dash;pose.turn=Math.max(pose.turn,.98*wave(t,.02,.88));pose.lean+=.12*dash;pose.lift+=.05*dash;}
  pose.lean*=power;return pose;
}
export function applyCombatPose(model,t,options={}){
  const pose=combatPose(model.userData.weapon,t,options),body=model.userData.body;
  if(model.userData.heroRig)poseHeroAttack(model,t,pose,options);
  else if(body){body.rotation.x=pose.lean;body.rotation.y=pose.twist;}
  for(const part of model.userData.combatRig||[]){
    const angles=part.hand<0?pose.left:pose.right;part.node.rotation.copy(part.rotation);
    part.node.rotation.x+=angles[0];part.node.rotation.y+=angles[1];part.node.rotation.z+=angles[2];
  }
  return pose;
}
export function attackProgress(time,started,duration){return clamp((time-started)*1000/Math.max(1,duration));}
// HP remains authoritative in the engine. These timestamps control only the visual fall/recovery.
export function syncFighterState(unit,hp,time,{impactAt=time,immediate=false,speed=1}={}){
  const alive=hp>0;if(unit.alive===alive)return;
  const wasAlive=unit.alive;unit.alive=alive;unit.lifeDuration=.82/(speed===2?2:1);
  if(!alive){unit.fallAt=immediate?-Infinity:Math.max(time,impactAt);unit.reviveAt=null;}
  else if(wasAlive===false){unit.reviveAt=immediate?-Infinity:Math.max(time,impactAt);unit.attackAt=-10;}
  else{unit.fallAt=null;unit.reviveAt=null;}
}
function lifeProgress(unit,time,quiet){
  if(unit.fallAt==null)return null;
  const duration=unit.lifeDuration||.82;
  const fallen=at=>unit.fallAt===-Infinity?1:clamp((at-unit.fallAt)/duration);
  if(unit.alive===false)return quiet?1:time<unit.fallAt?null:fallen(time);
  if(unit.reviveAt!=null){
    if(quiet||unit.reviveAt===-Infinity||time>=unit.reviveAt+duration*.7)return null;
    if(time<unit.reviveAt)return fallen(time);
    const p=clamp((time-unit.reviveAt)/(duration*.7));return fallen(unit.reviveAt)*(1-p*p*(3-2*p));
  }
  return null;
}
export function animateFighter(unit,time,{reducedMotion=false}={}){
  const {model}=unit,quiet=reducedMotion||unit.frozen,progress=attackProgress(time,unit.attackAt,unit.attackDuration),pose=applyCombatPose(model,progress,{skill:unit.attackSkill,counter:unit.attackCounter,reducedMotion,frozen:unit.frozen,time});
  const life=lifeProgress(unit,time,reducedMotion);
  if(model.userData.heroRig&&life!=null){
    poseHeroFall(model,life,{reducedMotion:reducedMotion&&unit.alive===false});model.position.set(unit.x,.09,unit.z);model.rotation.set(0,unit.angle??0,0);model.scale.setScalar(unit.scale);return pose;
  }
  if(model.userData.heroRig&&(progress<=0||progress>=1))animateHeroIdle(model,time,{reducedMotion,frozen:unit.frozen});
  const hitAge=time-unit.hitAt,hit=quiet||hitAge<0?0:Math.max(0,1-hitAge/.38),idle=quiet?0:Math.sin(time*1.8+(unit.phase||0))*.018;
  const dx=(unit.attackTarget?.x??unit.x)-unit.x,dz=(unit.attackTarget?.z??unit.z)-unit.z,distance=Math.hypot(dx,dz),travel=distance>0?Math.max(0,1-1.35/distance)*pose.lunge:0,angle=unit.angle??0;
  const hx=unit.x-(unit.hitSource?.x??unit.x),hz=unit.z-(unit.hitSource?.z??(unit.z-1)),hd=Math.hypot(hx,hz)||1,push=hit*(model.userData.silhouette==='guardian'?.12:.25);
  model.position.set(unit.x+dx*travel+hx/hd*push,.09+idle+pose.lift,unit.z+dz*travel+hz/hd*push);
  if(hit)poseHeroHit(model,hit,{time});
  const facing=distance>.01?Math.atan2(dx,dz):angle,turn=Math.atan2(Math.sin(facing-angle),Math.cos(facing-angle));model.rotation.y=angle+turn*pose.turn;
  model.scale.set(unit.scale*(1+hit*.025),unit.scale*(1-hit*.025),unit.scale);
  return pose;
}
