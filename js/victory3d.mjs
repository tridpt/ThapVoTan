import {seasonAuraActive} from './season.mjs';
import {T,heroModel,enemyModel,box,cylinder,crystal,mesh,material,bake,animateModel} from './models3d.mjs';
import {RARITY,GEAR_BASE} from './data.mjs';
import {worldForRun} from './worlds3d.mjs';
import {equippedSkin} from './skins.mjs';
import {bondAdorned} from './bonds.mjs';
import {contributionRanking,victoryRewards} from './victory.mjs';
import {poseHeroFall} from './hero-motion3d.mjs';

const clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{const p=clamp(n);return p*p*(3-2*p);};
export function victoryKey(s){const r=s.run;return [seasonAuraActive(s),r.started,r.floor,r.victory.stage,s.settings.speed,...r.heroes.map(h=>`${h.id}:${bondAdorned(s,h.id)}:${equippedSkin(s,h.id)||'base'}:${h.loadout?.signature}:${h.loadout?.weaponRarity}`)].join('|');}
export function chestStyle(r){
  const gear=victoryRewards(r).loot?.gear,rank=gear?RARITY[gear.rarity].rank:0;
  return {rank,color:gear?RARITY[gear.rarity].color:'#edce8d',rings:rank+1,particles:[14,26,42,50,60,72,84][rank],beams:[0,4,8,10,12,14,16][rank],slot:gear?GEAR_BASE[gear.base].slot:null};
}
function ring(root,color,radius,x,y,z){const m=mesh(root,new T.TorusGeometry(radius,.023,4,48),color,x,y,z);m.material=material(color,.45,.7);return m;}
function chestModel(style){
  const root=new T.Group(),base=new T.Group(),lid=new T.Group();root.add(base,lid);lid.position.set(0,.8,-.44);
  box(base,'#273c46',0,.42,0,[1.9,.76,1.15],.4);box(base,'#6b5741',0,.45,.05,[1.62,.56,1.13],.15);
  for(const x of [-.72,.72]){box(base,style.color,x,.43,.61,[.1,.79,.07],.7);box(base,style.color,x,.43,-.59,[.1,.79,.07],.7);box(lid,style.color,x,.16,.48,[.11,.38,1.23],.65);}
  box(base,'#d6bd83',0,.07,0,[2.02,.14,1.26],.6);box(base,'#d6bd83',0,.8,0,[2.02,.1,1.26],.6);
  box(lid,'#485449',0,.16,.46,[1.95,.34,1.2],.45);box(lid,'#ceb483',0,.34,.46,[2.03,.06,1.25],.7);
  crystal(base,style.color,0,.55,.67,[.14,.2,.07],.85);bake(base,'victory-chest-base:'+style.color);bake(lid,'victory-chest-lid:'+style.color);
  return {root,lid};
}
function lootEmblem(style){
  const root=new T.Group(),color=style.color;
  if(style.slot==='weapon'){
    box(root,'#e7e5d5',0,.17,0,[.13,1.2,.09],.65);crystal(root,color,0,.85,0,[.13,.25,.09],.6);box(root,color,0,-.37,0,[.65,.1,.13],.65);box(root,'#6e5347',0,-.62,0,[.12,.44,.12]);root.rotation.z=-.3;
  }else if(style.slot==='armor'){
    box(root,'#879b95',0,0,0,[.73,.85,.28],.7);for(const sign of [-1,1])box(root,color,sign*.47,.29,0,[.3,.25,.32],.65);crystal(root,color,0,.1,.21,[.19,.32,.09],.6);
  }else if(style.slot==='charm'){
    ring(root,'#e7d194',.44,0,.22,0);crystal(root,color,0,-.35,0,[.28,.38,.15],.8);
  }else{
    cylinder(root,'#e4c78b',0,0,0,.45,.15,12,.7).rotation.x=Math.PI/2;crystal(root,color,0,0,.12,[.15,.23,.06],.7);
  }
  return root;
}
export function createVictoryScene(s,graphics={}){
  const r=s.run,style=chestStyle(r),world=worldForRun(r),scene=new T.Scene();scene.background=new T.Color(world.background);scene.fog=new T.Fog(world.background,24,48);
  const dais=new T.Group();scene.add(dais);cylinder(dais,world.edge,0,-.32,0,5.25,.55,16,.3);cylinder(dais,world.stone,0,-.035,0,5.12,.07,16,.25);
  for(const radius of [3.8,4.9]){const rune=ring(dais,'#d8c58f',radius,0,.01,0);rune.rotation.x=-Math.PI/2;}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;crystal(dais,world.glow,Math.cos(a)*4.6,.05,Math.sin(a)*4.6,[.09,.03,.19],.45).rotation.y=-a;}
  bake(dais,'victory-dais:'+world.id);
  const mvp=contributionRanking(r).mvp,order=[...r.heroes],best=order.findIndex(h=>h.id===mvp);if(best>=0)[order[1],order[best]]=[order[best],order[1]];
  const loot=r.victory.stage==='loot',heroes=order.map((h,index)=>{
    const model=heroModel(h.id,{signature:h.loadout?.signature===h.id,weaponRarity:h.loadout?.weaponRarity,skin:equippedSkin(s,h.id),bond:bondAdorned(s,h.id),seasonAura:seasonAuraActive(s)});model.scale.setScalar(loot?.72:.93);model.position.set((index-1)*2.6,.04,loot?-1.15:1.35);scene.add(model);
    return {model,alive:h.hp>0,index,position:model.position.clone()};
  });
  let enemy=null;if(!loot){enemy=enemyModel(r.battle.enemies[0]);enemy.scale.setScalar(.9);enemy.position.set(0,.04,-2.65);enemy.rotation.y=.1;scene.add(enemy);}
  const chest=chestModel(style);chest.root.position.set(0,.08,2.05);chest.root.visible=loot;scene.add(chest.root);
  const emblem=lootEmblem(style);emblem.position.set(0,2.3,2.05);scene.add(emblem);emblem.visible=loot;
  const rings=[];for(let i=0;i<style.rings;i++){const node=ring(scene,style.color,1.35+i*.28,0,.2+i*.13,2.05);node.rotation.x=-Math.PI/2;node.visible=loot;rings.push(node);}
  const beams=new T.Group();scene.add(beams);beams.position.set(0,.12,2.05);for(let i=0;i<style.beams;i++){const a=i*Math.PI*2/style.beams,node=crystal(beams,style.color,Math.cos(a)*.55,1.15,Math.sin(a)*.55,[.045,1.8,.045],.7);node.rotation.z=-Math.cos(a)*.18;node.rotation.x=Math.sin(a)*.18;}
  const count=graphics.compact?Math.ceil(style.particles*.6):style.particles,particles=new T.InstancedMesh(new T.OctahedronGeometry(1),material(style.color,.3,.85),count);particles.frustumCulled=false;particles.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(particles);
  const camera=new T.PerspectiveCamera(39,1,.1,80),view={scene,camera,mode:'victory',key:victoryKey(s),style,heroes,enemy,chest,emblem,rings,beams,particles,dummy:new T.Object3D(),focus:new T.Vector3(),bounds:new T.Box3(),corner:new T.Vector3(),loot,duration:(loot?2100:3600)/(s.settings.speed===2?2:1),elapsed:0};
  animateVictory(view,0,{reducedMotion:!graphics.effects});return view;
}
export function fitVictoryCamera(view,aspect){view.camera.aspect=aspect;view.camera.updateProjectionMatrix();}
export function animateVictory(view,elapsed,{reducedMotion=false}={}){
  const p=reducedMotion?1:clamp(elapsed*1000/view.duration),t=reducedMotion?0:Math.max(0,elapsed),party=ease((p-.13)/.4),{loot,style,camera}=view;view.elapsed=elapsed;
  if(view.enemy){view.enemy.visible=p<.57;view.enemy.rotation.z=-ease(p/.32)*1.43;view.enemy.position.y=.04-ease(p/.35)*.6;}
  for(const hero of view.heroes){
    const {model,index,alive,position}=hero;model.position.copy(position);model.rotation.set(0,(1-index)*.14,0);animateModel(model,t,{reducedMotion});
    const celebrate=alive?(loot?1:party):0;model.position.y+=alive&&!reducedMotion?Math.max(0,Math.sin(t*5+index*.7))*.12*celebrate:alive?0:-.25;
    model.userData.body.rotation.x=alive?-.035*celebrate:.22;
    for(const part of model.userData.combatRig){part.node.rotation.copy(part.rotation);part.node.rotation.x-=celebrate*(part.hand>0?1.85:.35);part.node.rotation.z+=part.hand*celebrate*(.26+(reducedMotion?0:Math.sin(t*3.4+index)*.08));}
    if(!alive){poseHeroFall(model,1,{reducedMotion:true});model.position.copy(position);}
  }
  const open=ease((p-.12)/.42);view.chest.lid.rotation.x=-1.85*open;view.emblem.position.y=1.1+open*1.5;view.emblem.scale.setScalar(.3+open*.7);view.emblem.rotation.y=reducedMotion?0:t*.4;
  view.emblem.visible=loot&&open>.02;view.beams.visible=loot&&!reducedMotion&&open>.1;view.beams.scale.setScalar(.35+open*.65);view.beams.rotation.y=t*.15;
  for(let i=0;i<view.rings.length;i++){const node=view.rings[i];node.visible=loot&&!reducedMotion;node.scale.setScalar(.7+open*.3+(reducedMotion?0:Math.sin(t*1.5+i)*.025));node.rotation.z=reducedMotion?0:t*(i%2?-.16:.12);}
  view.particles.visible=!reducedMotion;
  if(!reducedMotion){for(let i=0;i<view.particles.count;i++){
    const a=i*2.399+t*.08,radius=loot?.8+(i%5)*.24:2.2+(i%6)*.36,dummy=view.dummy;
    dummy.position.set(Math.cos(a)*radius,(i*.17+t*.6)%3.8+.2,Math.sin(a)*radius+(loot?2.05:.2));dummy.rotation.set(t*.2+i,t*.35,0);dummy.scale.setScalar((loot?.035:.022)+(i%3)*.008);dummy.updateMatrix();view.particles.setMatrixAt(i,dummy.matrix);
  }view.particles.instanceMatrix.needsUpdate=true;}
  view.focus.set(0,loot?1.3:1.2+party*.25,loot?.35:-.6+party*1.7);camera.position.set(.55+(reducedMotion?0:party*.3),loot?5.1:5.6-party*.6,loot?13:14);camera.lookAt(view.focus);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  view.bounds.makeEmpty();for(const hero of view.heroes)view.bounds.expandByObject(hero.model);if(view.enemy?.visible)view.bounds.expandByObject(view.enemy);if(loot){view.bounds.expandByObject(view.chest.root);view.bounds.expandByObject(view.emblem);}
  for(let pass=0;pass<3;pass++){
    let overflow=1;const {bounds,corner}=view;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){corner.set(x,y,z).project(camera);overflow=Math.max(overflow,Math.abs(corner.x)/.91,Math.abs(corner.y)/.8);}
    if(overflow<=1)break;camera.position.sub(view.focus).multiplyScalar(overflow*1.025).add(view.focus);camera.lookAt(view.focus);camera.updateMatrixWorld();
  }
}
