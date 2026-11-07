import {T} from './models3d.mjs';
import {HERO} from './data.mjs';
import {hasHeroUltimate,ultimateSpec} from './ultimate-data.mjs';
import {createHeroSpell,animateHeroSpell,poseHeroUltimate} from './hero-ultimates3d.mjs';

export function emitHeroSkill(view,id,events,time,timing,{compact=false,reducedMotion=false}={}){
  const actor=view.units.get(id);if(!actor||!hasHeroUltimate(id)||reducedMotion)return null;
  const kind=HERO[id].kind,support=kind==='shield'||kind==='heal',ids=kind==='shield'?[...view.units].filter(([,u])=>!u.enemy&&u.model.userData.kind==='hero'&&u.model.visible).map(([target])=>target):[...new Set(events.filter(e=>support?(e.heal||e.shieldGrant):!e.heal&&!e.shieldGrant).map(e=>e.target))];
  const targets=ids.map(target=>view.units.get(target)).filter(Boolean).map(u=>new T.Vector3(u.x-actor.x,.1,u.z-actor.z));
  const spell=createHeroSpell(id,ultimateSpec(id,{skin:actor.model.userData.skin}),{targets,compact,impactAt:timing.impact/timing.duration});
  spell.root.position.set(actor.x,.09,actor.z);
  const target=targets[0],angle=!support&&target?Math.atan2(target.x,target.z):actor.angle;
  const item=view.vfx.add(spell.root,time,timing.duration/1000,{kind:'scripted',animate:(p,options)=>{
    animateHeroSpell(spell,p,options);poseHeroUltimate(actor.model,p,{...options,baseY:.09,angle});actor.model.position.x=actor.x;actor.model.position.z=actor.z;
  }});item.hero=id;return item;
}
