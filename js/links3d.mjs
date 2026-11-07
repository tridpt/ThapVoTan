import {T} from './models3d.mjs';
import {bossPartPoint,breakBossPartVisual} from './boss-parts3d.mjs';

// All transient objects belong to the capped battle VFX pool and share its cleanup.
export function emitLinkEffect(view,ids,spec,events,time,{speed=1,reducedMotion=false}={}){
  const duration=reducedMotion?230:1200/(speed===2?2:1),impact=reducedMotion?0:duration*.65,seconds=duration/1000,vfx=view.vfx;
  const casters=ids.map(id=>view.units.get(id)).filter(Boolean),colors=spec.elements.map(e=>e.color);
  const target=events.filter(e=>!e.heal&&!e.shieldGrant).map(e=>view.units.get(e.target)).find(u=>u?.enemy);
  const center=new T.Vector3(casters.reduce((n,u)=>n+u.x,0)/Math.max(1,casters.length),2.1,.2);
  casters.forEach((u,i)=>{
    u.attackAt=time;u.attackSkill=true;u.attackCounter=false;u.attackDuration=duration;u.attackTarget=target;
    vfx.cast(u,colors[i%2],time,{skill:true,rank:3});
    if(!reducedMotion)vfx.projectile(new T.Vector3(u.x,1.7,u.z),center,colors[i%2],time,{skill:true,delay:.12*seconds,life:.22*seconds});
  });
  if(!reducedMotion){
    vfx.pulse(center,colors[0],time,{radius:1.1,vertical:true,delay:.28*seconds,life:.48*seconds});
    vfx.pulse(center,colors[1],time,{radius:.8,vertical:true,delay:.34*seconds,life:.42*seconds});
  }
  const hits=new Set();
  for(const event of events){
    const unit=view.units.get(event.target);if(!unit)continue;
    if(event.heal||event.shieldGrant){if(!hits.has('aid:'+event.target)){vfx.support(unit,colors[1],time);hits.add('aid:'+event.target);}continue;}
    const point=event.part?bossPartPoint(unit.model,event.part.id):null;
    if(!hits.has(event.target)){
      unit.hitAt=time+impact/1000;
      if(!reducedMotion)for(const color of colors)vfx.projectile(center,point||new T.Vector3(unit.x,1.6,unit.z),color,time,{skill:true,delay:.37*seconds,life:.28*seconds});
      vfx.impact(point||unit,colors[0],time,{skill:true,rank:4,delay:impact/1000,critical:events.some(e=>e.target===event.target&&e.crit),height:point?.y});
      hits.add(event.target);
    }
    if(event.part?.broken){breakBossPartVisual(unit.model,event.part.id,time+impact/1000);vfx.particles(point||new T.Vector3(unit.x,1.6,unit.z),colors[1],time,{count:reducedMotion?2:10,delay:impact/1000});}
  }
  return {duration,impact};
}
