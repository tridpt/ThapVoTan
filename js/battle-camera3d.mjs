import {T} from './models3d.mjs';

const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
const ease=v=>{const p=clamp(v);return p*p*(3-2*p);};
// Presentation only: one bounded shot per action, independent of frame rate and gameplay RNG.
export function createBattleCamera(camera,units){
  return {camera,units,shot:null,position:camera.position.clone(),rotation:camera.quaternion.clone(),zoom:camera.zoom,
    right:new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up:new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),
    point:new T.Vector3(),focus:new T.Vector3(),target:new T.Vector3(),box:new T.Box3(),corner:new T.Vector3()};
}
export function resetBattleCamera(rig){
  if(!rig)return false;const c=rig.camera,changed=!!rig.shot||!c.position.equals(rig.position)||!c.quaternion.equals(rig.rotation)||c.zoom!==rig.zoom;
  rig.shot=null;if(changed){c.position.copy(rig.position);c.quaternion.copy(rig.rotation);c.zoom=rig.zoom;c.updateProjectionMatrix();c.updateMatrixWorld();}return changed;
}
export function startBattleCamera(rig,actors,events,time,timing,{run=null,skill=false,counter=false,speed=1,reducedMotion=false,enabled=true}={}){
  resetBattleCamera(rig);if(!rig||reducedMotion||!enabled||!Number.isFinite(time)||!Number.isFinite(timing.duration)||timing.duration<=0)return;
  const casters=actors.filter(u=>u?.model?.visible&&u.alive!==false&&!u.frozen),hits=events.filter(e=>!e.heal&&!e.shieldGrant&&(e.value>0||e.shield>0));
  const targets=[...new Set(hits.map(e=>rig.units.get(e.target)).filter(u=>u?.model?.visible))];
  if(!casters.length&&!targets.length)return;
  const critical=hits.some(e=>e.crit),finisher=targets.some(u=>u.alive!==false&&run?.battle?.enemies.some(e=>e.id===u.model.userData.unitId&&e.kind==='boss'&&e.hp<=0));
  const damaging=hits.length>0,heavy=skill||casters.some(u=>['sword','dagger','shield'].includes(u.model.userData.weapon));
  rig.shot={started:time,duration:timing.duration/1000,impact:Math.max(0,Math.min(timing.duration,timing.impact||0))/1000,
    casters,targets,critical,finisher,counter,zoom:finisher?.12:counter?.1:critical?.075:0,
    strength:!damaging?0:finisher?.075:critical?.055:counter?.045:heavy?.038:.018,shakeDuration:.22/(speed===2?2:1)};
}
function unitCenter(out,units){out.set(0,0,0);for(const u of units){out.x+=u.model.position.x;out.y+=u.model.position.y+1.4*u.scale;out.z+=u.model.position.z;}return out.multiplyScalar(1/Math.max(1,units.length));}
export function animateBattleCamera(rig,time,{reducedMotion=false,enabled=true,shake=true}={}){
  const shot=rig?.shot;if(!shot)return false;
  if(reducedMotion||!enabled||!Number.isFinite(time)||time<shot.started||time>=shot.started+shot.duration)return resetBattleCamera(rig);
  const {camera:c}=rig,age=time-shot.started,p=age/shot.duration,fade=ease(p/.2)*(1-ease((p-.7)/.3));
  unitCenter(rig.focus,shot.casters.length?shot.casters:shot.targets);
  if(shot.targets.length){unitCenter(rig.target,shot.targets);rig.focus.lerp(rig.target,.15+.45*ease(age/Math.max(.001,shot.impact)));}
  // Use the actors' current animated positions, so a lunge carries the camera with it.
  rig.focus.y-=1.4;let x=clamp(rig.focus.dot(rig.right)*.15,-.52,.52)*fade,y=clamp(rig.focus.dot(rig.up)*.15,-.4,.4)*fade;
  const contact=age-shot.impact;
  if(shake&&contact>=0&&contact<shot.shakeDuration){const t=contact/shot.shakeDuration,amp=shot.strength*(1-t)**2;x+=Math.sin(t*Math.PI*8)*amp;y+=Math.sin(t*Math.PI*11)*amp*.6;}
  const punch=age<=shot.impact?ease(age/Math.max(.001,shot.impact)):1-ease((age-shot.impact)/Math.max(.001,shot.duration-shot.impact));
  // Measure each animated model against the overview. Clamp pan/zoom instead of cropping a teammate.
  c.position.copy(rig.position);c.quaternion.copy(rig.rotation);c.zoom=rig.zoom;c.updateProjectionMatrix();c.updateMatrixWorld();
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const u of rig.units.values())if(u.model.visible){
    rig.box.setFromObject(u.model);if(rig.box.isEmpty())continue;
    for(const xx of [rig.box.min.x,rig.box.max.x])for(const yy of [rig.box.min.y,rig.box.max.y])for(const zz of [rig.box.min.z,rig.box.max.z]){
      rig.corner.set(xx,yy,zz).project(c);minX=Math.min(minX,rig.corner.x);maxX=Math.max(maxX,rig.corner.x);minY=Math.min(minY,rig.corner.y);maxY=Math.max(maxY,rig.corner.y);
    }
  }
  if(![minX,maxX,minY,maxY].every(Number.isFinite))return resetBattleCamera(rig);
  const w=(c.right-c.left)/(2*rig.zoom),h=(c.top-c.bottom)/(2*rig.zoom),margin=.965;
  const fit=(value,lo,hi)=>lo<=hi?clamp(value,lo,hi):(lo+hi)/2;
  x=fit(x,(maxX-margin)*w,(minX+margin)*w);y=fit(y,(maxY-margin)*h,(minY+margin)*h);
  const spread=Math.max(Math.abs(minX-x/w),Math.abs(maxX-x/w),Math.abs(minY-y/h),Math.abs(maxY-y/h));
  c.position.copy(rig.position).addScaledVector(rig.right,x).addScaledVector(rig.up,y);
  c.zoom=rig.zoom*Math.min(1+shot.zoom*punch,margin/Math.max(.001,spread));
  c.updateProjectionMatrix();c.updateMatrixWorld();return true;
}
