import * as T from './vendor/three.module.mjs';
import {HERO,RARITY} from './data.mjs';
import {resolveSkin} from './skins.mjs';
import {decorateSkin} from './skins3d.mjs';
import {heroDesign} from './hero-design.mjs';
import {buildDarkHero} from './hero-armor3d.mjs';
import {animateHeroIdle,createHeroRig} from './hero-motion3d.mjs';
import {PET,ELEMENT,DUNGEON_BOSSES} from './adventure-data.mjs';

const geometries=new Map(),materials=new Map();
const baked=new Map();
const geo=(key,make)=>{if(!geometries.has(key)){const geometry=make();geometry.userData.shared3d=true;geometries.set(key,geometry);}return geometries.get(key);};
export function material(color,metalness=0,glow=0){
  const key=`${color}:${metalness}:${glow}`;
  if(!materials.has(key)){const mat=new T.MeshStandardMaterial({color,metalness,roughness:metalness?.36:.72,emissive:color,emissiveIntensity:glow,flatShading:metalness<.1});mat.userData.shared3d=true;materials.set(key,mat);}
  return materials.get(key);
}
// Static assets stay cached; weather buffers, instance buffers and shadow maps do not.
export function disposeScene(root){
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.geometry.userData.shared3d)geometries.add(o.geometry);for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat&&!mat.userData.shared3d)materials.add(mat);if(o.isLight)o.shadow?.dispose();});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export function fitArenaCamera(camera,aspect){
  const halfHeight=Math.max((aspect<1?12.3:14.4)/aspect/2,7.6),halfWidth=halfHeight*aspect;
  // Leave headroom for phase II crowns and keep the round label above the fight.
  Object.assign(camera,{left:-halfWidth,right:halfWidth,top:halfHeight+.35,bottom:-halfHeight+.35});camera.updateProjectionMatrix();return camera;
}
export function arenaCamera(aspect=1){
  const camera=new T.OrthographicCamera(-7,7,6,-6,.1,80);camera.position.set(1.2,15.8,15.8);camera.lookAt(0,.4,0);fitArenaCamera(camera,aspect);camera.updateMatrixWorld();return camera;
}
function finishModel(group,data){
  const motionParts=[];
  group.traverse(o=>{if(o.userData.motion3d)motionParts.push({node:o,...o.userData.motion3d,rotation:o.rotation.clone(),position:o.position.clone()});});
  group.userData={...data,motionParts};return group;
}
// Animate instance transforms only: geometry and materials remain safe to share.
export function animateModel(model,time,{reducedMotion=false,frozen=false,idle=true}={}){
  const still=reducedMotion||frozen;
  if(idle&&model.userData.heroRig)animateHeroIdle(model,time,{reducedMotion,frozen});
  if(model.userData.dragon)model.userData.body.position.y=model.userData.dragon.airborne?.38+(still?0:Math.sin(time*1.9)*.04):0;
  for(const part of model.userData.motionParts||[]){
    const {node,rotation,position,kind,phase=0,sign=1}=part;node.rotation.copy(rotation);node.position.copy(position);
    if(still){if(kind==='dragon-wing')node.rotation.y+=sign*(model.userData.dragon?.airborne ? .04 : .92);continue;}
    if(kind==='orbit'){node.rotation.z+=time*.22*sign;node.rotation.x+=Math.sin(time*.65+phase)*.055;}
    else if(kind==='bond-aura'){node.rotation.y+=time*.24;node.position.y+=Math.sin(time*1.2+phase)*.012;}
    else if(kind==='dragon-wing'){const flying=model.userData.dragon?.airborne;node.rotation.y+=sign*(flying?.04:.92)+(flying?Math.sin(time*1.9+phase)*.13*sign:0);node.rotation.z+=(flying?Math.sin(time*1.9+phase)*.06:0)*sign;}
    else if(kind==='wing'){node.rotation.y+=Math.sin(time*2.1+phase)*.16*sign;node.rotation.z+=Math.sin(time*2.1+phase)*.055*sign;}
    else if(kind==='spark'){node.rotation.y+=time*.6;node.position.y+=Math.sin(time*1.5+phase)*.045;}
  }
}
export function mesh(group,geometry,color,x=0,y=0,z=0,scale=[1,1,1],metal=0,glow=0){
  const m=new T.Mesh(geometry,material(color,metal,glow));m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}
export const box=(g,c,x,y,z,s,metal=0)=>mesh(g,geo('box',()=>new T.BoxGeometry(1,1,1)),c,x,y,z,s,metal);
export const ball=(g,c,x,y,z,s,metal=0,glow=0)=>mesh(g,geo('ball',()=>new T.SphereGeometry(1,16,12)),c,x,y,z,s,metal,glow);
export const crystal=(g,c,x,y,z,s,glow=.15)=>mesh(g,geo('crystal',()=>new T.OctahedronGeometry(1)),c,x,y,z,s,.35,glow);
export const cylinder=(g,c,x,y,z,r=.5,h=.3,vertices=10,metal=0)=>mesh(g,geo(`cyl:${vertices}`,()=>new T.CylinderGeometry(1,1,1,vertices)),c,x,y,z,[r,h,r],metal);
function cone(g,c,x,y,z,r,h,vertices=6){return mesh(g,geo(`cone:${vertices}`,()=>new T.ConeGeometry(1,1,vertices)),c,x,y,z,[r,h,r]);}
function ring(g,c,x,y,z,r){const m=mesh(g,geo('ring',()=>new T.TorusGeometry(1,.025,5,48)),c,x,y,z,[r,r,r],.45,.3);m.userData.motion3d={kind:'orbit',phase:r,sign:r>1.4?-1:1};return m;}
function rod(g,c,a,b,r=.06,metal=.3){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=cylinder(g,c,0,0,0,r,av.distanceTo(bv),8,metal);m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;}
function plate(g,c,points,depth=.1,bevel=.04){
  const key=`plate:${JSON.stringify(points)}:${depth}:${bevel}`;
  return mesh(g,geo(key,()=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geom=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel});geom.translate(0,0,-depth/2);return geom;}),c,0,0,0,[1,1,1],.3);
}
function eyes(g,y,z,spacing=.23,color='#29313a',scale=1){
  for(const side of [-1,1]){
    ball(g,'#f9f2db',side*spacing,y,z,[.14*scale,.18*scale,.065]);
    ball(g,color,side*spacing+.025,y-.006,z+.052,[.083*scale,.12*scale,.035],.2);
    ball(g,'#ffffff',side*spacing+.045,y+.045,z+.083,[.028,.038,.014],0,.15);
  }
}
function halo(g,color,rank){
  const ornaments=new T.Group();g.add(ornaments);
  if(rank>=2){const r=ring(ornaments,color,0,2.8,-.24,.77);r.rotation.x=.1;for(let i=0;i<5;i++)crystal(ornaments,color,(i-2)*.17,3.24+(.2-Math.abs(i-2)*.07),.01,[.07,.14,.07]);}
  if(rank>=3){const r=ring(ornaments,color,0,1.6,0,1.25);r.rotation.set(1.1,.3,.45);for(const sign of [-1,1])crystal(r,'#d8f5ff',sign,0,0,[.065,.1,.065],.6);}
  if(rank>=4)for(let i=0;i<10;i++){const a=i*Math.PI/5,spark=crystal(ornaments,color,Math.cos(a)*1.02,2.4+Math.sin(a)*1.02,-.26,[.06,.15,.06]);spark.userData.motion3d={kind:'spark',phase:i*.7};}
  if(rank>=5)for(const sign of [-1,1])for(let i=0;i<4;i++){const feather=crystal(ornaments,color,sign*(.65+i*.19),1.65+i*.19,-.3,[.16,.62-i*.07,.1]);feather.rotation.z=-sign*(.6+i*.15);feather.userData.motion3d={kind:'wing',sign,phase:i*.12};}
  if(rank>=6){const r=ring(ornaments,'#aee8ff',0,1.55,0,1.58);r.rotation.set(.4,1.1,-.5);const p=ring(ornaments,'#ffaee8',0,1.55,0,1.48);p.rotation.set(.9,-.6,.5);for(const orbit of [r,p])for(const sign of [-1,1])ball(orbit,sign>0?'#c0efff':'#ffcbef',sign,0,0,[.06,.06,.06],.2,.7);}
  return ornaments;
}
// Hero rarity ornaments use forged metal and restrained rune light; creatures keep their own style.
function heroHalo(g,d,color,rank){
  const ornaments=new T.Group(),staticParts=new T.Group();ornaments.add(staticParts);g.add(ornaments);
  const rune=(parent,c,r,begin,end)=>mesh(parent,geo(`rune-arc:${r}:${begin}:${end}`,()=>new T.TorusGeometry(r,.018,4,32,end-begin)),c,0,0,0,[1,1,1],.65,.18).rotation.z=begin;
  if(rank>=2){
    const seal=new T.Group();staticParts.add(seal);seal.position.set(0,2.64,-.32);
    for(let i=0;i<4;i++)rune(seal,d.trim,.76,i*Math.PI/2+.13,(i+1)*Math.PI/2-.13);
    for(const sign of [-1,1]){const sigil=crystal(seal,color,sign*.72,.08,0,[.045,.12,.035],.5);sigil.rotation.z=sign*.3;}
    crystal(seal,color,0,.76,0,[.05,.12,.04],.5);
  }
  if(rank>=3){
    const r=ring(ornaments,color,0,1.3,0,1.16);r.rotation.set(1.2,.25,.35);
    for(const sign of [-1,1])crystal(r,d.trim,sign,0,0,[.06,.11,.04],.15);
  }
  if(rank>=4)for(let i=0;i<8;i++){
    const a=i*Math.PI/4,spark=crystal(ornaments,color,Math.cos(a)*1.02,2.25+Math.sin(a)*1.02,-.28,[.035,.12,.035],.65);
    spark.userData.motion3d={kind:'spark',phase:i*.7};
  }
  if(rank>=5)for(const sign of [-1,1]){
    const wing=new T.Group();ornaments.add(wing);wing.userData.motion3d={kind:'wing',sign,phase:0};
    for(let i=0;i<3;i++){
      const x=sign*(.48+i*.25),y=1.8+i*.16;
      const p=plate(wing,d.steel,[[x,y],[x+sign*.16,y+.58-i*.04],[x+sign*.45,y+.75-i*.06],[x+sign*.26,y+.1],[x+sign*.12,y-.18]],.035,.01);p.position.z=-.38-i*.025;
      rod(wing,d.trim,[x,y+.04,-.34-i*.025],[x+sign*.39,y+.66-i*.06,-.34-i*.025],.018,.5);
      crystal(wing,color,x+sign*.2,y+.37,-.3-i*.025,[.035,.15,.025],.6);
    }
    bake(wing,`hero-wing:${d.id}:${d.outfit||'base'}`);
  }
  if(rank>=6){
    for(const [i,c] of [color,d.eye].entries()){
      const orbit=new T.Group();ornaments.add(orbit);orbit.position.set(0,1.5,0);orbit.rotation.set(.55+i*.65,.6-i*.95,-.4+i*.8);orbit.userData.motion3d={kind:'orbit',sign:i?-1:1,phase:i};
      for(let a=0;a<3;a++)rune(orbit,c,1.48-i*.08,a*Math.PI*2/3+.15,(a+1)*Math.PI*2/3-.15);
      for(const sign of [-1,1])crystal(orbit,c,sign*1.46,0,0,[.055,.12,.04],.6);
      bake(orbit,`hero-orbit:${d.id}:${i}`);
    }
  }
  bake(staticParts,`hero-seal:${d.id}:${d.outfit||'base'}`);return ornaments;
}
// Merge static parts by material so a character does not need a draw call per joint.
export function bake(group,key){
  if(!baked.has(key)){
    group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),batches=new Map();
    group.traverse(o=>{if(!o.isMesh)return;const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geom.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geom);});
    const result=[];
    for(const [mat,parts] of batches){const count=parts.reduce((n,p)=>n+p.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3);let offset=0;for(const p of parts){positions.set(p.attributes.position.array,offset);normals.set(p.attributes.normal.array,offset);offset+=p.attributes.position.array.length;p.dispose();}const geometry=new T.BufferGeometry();geometry.userData.shared3d=true;geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));result.push([geometry,mat]);}
    baked.set(key,result);
  }
  disposeScene(group);
  group.clear();for(const [geometry,mat] of baked.get(key)){const m=new T.Mesh(geometry,mat);m.castShadow=m.receiveShadow=true;group.add(m);}
}
function weapon(g,type,c,signature=false,heroId='',design=null){
  const steel=design?.steel||'#60727a',trim=design?.trim||'#d2bd89',ink='#22232c',rune=design?.eye||c;
  const w=new T.Group(),parts=[w];g.add(w);w.position.set(.66,1.25,.24);w.userData.hand=1;
  if(type==='shield'){
    const sh=plate(w,trim,[[-.36,.47],[.36,.47],[.42,.05],[.28,-.42],[0,-.68],[-.28,-.42],[-.42,.05]],.15);sh.rotation.y=-.18;
    const inner=plate(w,steel,[[-.27,.36],[.27,.36],[.31,.02],[.19,-.35],[0,-.51],[-.19,-.35],[-.31,.02]],.08);inner.position.z=.14;crystal(w,rune,0,-.03,.24,[.09,.22,.065],.45);
    rod(w,ink,[-.29,.32,.21],[.29,.32,.21],.02);rod(w,trim,[0,.38,.22],[0,-.44,.22],.02);
    for(const sign of [-1,1])for(let i=0;i<3;i++)box(w,trim,sign*(.27-i*.025),.22-i*.2,.21,[.035,.035,.025],.6);
    const spear=new T.Group();g.add(spear);spear.userData.hand=-1;parts.push(spear);rod(spear,ink,[-.7,.55,.12],[-.7,2.4,.12],.045);cone(spear,trim,-.7,2.5,.12,.12,.32,4);
  }else if(type==='sword'||type==='dagger'){
    for(const side of type==='dagger'?[-1,1]:[1]){
      const blade=new T.Group();g.add(blade);parts.push(blade);blade.userData.hand=side;blade.position.set(side*.75,1.1,.25);blade.rotation.z=-side*.26;
      const shape=plate(blade,design?'#b7c0c5':'#dceceb',design?[[-.095,0],[-.14,.3],[-.12,1.12],[0,1.5],[.12,1.12],[.14,.3],[.095,0]]:[[-.08,0],[-.1,.95],[0,1.3],[.1,.95],[.08,0]],design?.07:.065,.01);shape.rotation.y=.3;
      if(design){
        const fuller=plate(blade,steel,[[-.032,.16],[-.045,1.1],[0,1.38],[.045,1.1],[.032,.16]],.02,.005);fuller.position.z=.065;fuller.rotation.y=.3;
        if(type==='sword')for(const sign of [-1,1]){const hook=crystal(blade,trim,sign*.2,.045,0,[.11,.14,.07],.02);hook.rotation.z=-sign*.4;}
      }
      rod(blade,design?trim:'#eaca80',[-.22,.03,0],[.22,.03,0],.055);rod(blade,design?ink:'#5c3b36',[0,-.28,0],[0,0,0],.07);crystal(blade,rune,0,-.3,0,[.08,.12,.08]);
      if(type==='dagger')blade.scale.setScalar(.74);
    }
  }else if(type==='bow'){
    const curve=new T.CatmullRomCurve3([new T.Vector3(-.08,-.72,0),new T.Vector3(.38,-.35,0),new T.Vector3(.42,.15,0),new T.Vector3(.1,.78,0)]);
    mesh(w,new T.TubeGeometry(curve,16,.045,6,false),trim,0,0,0,[1,1,1],.4);
    const string=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.08,-.72,0),new T.Vector3(.01,0,0),new T.Vector3(.1,.78,0)]),new T.LineBasicMaterial({color:'#d3d8c8'}));string.userData.weaponAura=true;string.userData.bowString=true;w.add(string);
    rod(w,'#e8d5a5',[-.34,0,.14],[.48,0,.14],.02);cone(w,'#dce8df',.49,.02,.14,.07,.17,4).rotation.z=-Math.PI/2;
  }else if(type==='orb'){
    crystal(w,rune,.05,.38,.09,[.2,.27,.2],.55);const r=ring(w,trim,.05,.38,.09,.4);r.rotation.y=.5;crystal(w,'#fff3d2',.05,.38,.35,[.09,.14,.07],.8);
  }else{
    rod(w,design?ink:'#6f5343',[0,-.92,0],[0,1.3,0],.045);crystal(w,design?trim:'#ebd99b',0,1.2,0,[.24,.35,.19]);crystal(w,rune,0,1.23,.18,[.16,.25,.12],.65);
    const r=ring(w,c,0,1.2,0,.34);r.rotation.y=.25;
  }
  if(signature){
    const seed=Object.keys(HERO).indexOf(heroId),gem=HERO[heroId].color;
    for(const part of parts.filter(p=>p.children.length)){
      const isBlade=type==='sword'||type==='dagger',isShield=type==='shield';
      const x=isShield&&part!==w?-.7:0,y=isBlade?.65:isShield?(part===w?-.04:2.15):type==='bow'?.4:type==='orb'?.38:1.22,z=isShield?.28:.12;
      const crest=new T.Group();part.add(crest);crest.position.set(x,y,z);
      crystal(crest,gem,0,0,.06,[.1,.22,.07],.85);
      const seal=ring(crest,'#f1d79b',0,0,0,isShield?.32:.22);seal.rotation.y=.25;
      for(const sign of [-1,1]){
        const shard=crystal(crest,gem,sign*(isShield?.3:.19),.1,0,[.06,.3+(seed%3)*.025,.05],.6);shard.rotation.z=-sign*.55;
        for(let i=0;i<2+seed%3;i++)crystal(crest,'#f6e5bc',sign*(.12+i*.04),-.12-i*.09,.04,[.025,.05,.025],.6);
      }
    }
  }
  return parts;
}

export function weaponStyle(rarity){
  const rank=Object.hasOwn(RARITY,rarity)?RARITY[rarity].rank:-1;
  return {rank,color:rank<0?'#cad9cf':RARITY[rarity].color,gems:rank<0?0:[0,1,2,4,6,8,10][rank],rings:rank<0?0:[0,0,1,1,2,3,4][rank],trails:rank<0?0:[0,0,1,2,3,4,5][rank]};
}
function decorateWeapon(parts,type,rarity){
  const style=weaponStyle(rarity);if(style.rank<1)return;
  for(const part of parts.filter(p=>p.children.length)){
    const shield=type==='shield',blade=type==='sword'||type==='dagger',spear=shield&&part!==parts[0];
    const crest=new T.Group();crest.position.set(spear?-.7:0,blade?.65:shield?(spear?2.15:-.04):type==='bow'?.4:type==='orb'?.38:1.22,shield?.31:.15);part.add(crest);
    for(let i=0;i<style.gems;i++){const angle=i*Math.PI*2/style.gems,gem=crystal(crest,style.rank===6&&i%2?'#ffc1e9':style.color,Math.cos(angle)*.2,Math.sin(angle)*.25,.05,[.04,.1,.04],.8);gem.rotation.z=-angle;}
    // Keep orbit groups outside the static arm bake so each instance can move independently.
    const aura=new T.Group();aura.userData.weaponAura=true;crest.add(aura);
    for(let i=0;i<style.rings;i++){const r=ring(aura,style.rank===6&&i%2?'#b9eeff':style.color,0,0,0,.18+i*.045);r.rotation.set(.2+i*.45,i*.35,.2);r.userData.motion3d.phase=i;}
  }
}
export function heroModel(id,{signature=false,skin=null,weaponRarity=null,bond=false,seasonAura=false}={}){
  const h=HERO[id],outfit=resolveSkin(id,skin),g=new T.Group(),body=new T.Group(),c=outfit?.color||h.color,rank=RARITY[h.rarity].rank;g.add(body);
  const design=heroDesign(id,skin),head=new T.Group(),torso=new T.Group(),arms=[],rig=new T.Group();body.add(torso);torso.add(head);
  for(const side of [-1,1]){const arm=new T.Group();arm.userData.hand=side;rig.add(arm);arms.push(arm);}
  const {legs,capes}=buildDarkHero({T,mesh,material,ball,box,crystal,cylinder,cone,rod,plate,geo},design,{body:torso,head,arms});
  const parts=weapon(rig,h.weapon,c,signature,id,design),ornaments=heroHalo(g,design,RARITY[h.rarity].color,rank);
  weaponRarity=Object.hasOwn(RARITY,weaponRarity)?weaponRarity:null;decorateWeapon(parts,h.weapon,weaponRarity);
  const skinHead=new T.Group();skinHead.scale.setScalar(.66);head.add(skinHead);
  decorateSkin({T,box,crystal,cone,ring,rod,plate},outfit,{body:torso,head:skinHead,arms,parts,ornaments});
  // Keep weapons attached to the hand while caching each articulated arm separately.
  for(const part of parts)arms.find(a=>a.userData.hand===part.userData.hand).attach(part);
  for(const part of [...legs,...capes])body.attach(part.node);
  bake(torso,`hero:${id}:${outfit?.id||'base'}`);
  for(const leg of legs){
    leg.node.remove(leg.knee);bake(leg.node,`hero-thigh:${id}:${outfit?.id||'base'}:${leg.side}`);
    leg.node.add(leg.knee);bake(leg.knee,`hero-shin:${id}:${outfit?.id||'base'}:${leg.side}`);
  }
  for(const cape of capes)bake(cape.node,`hero-cape:${id}:${outfit?.id||'base'}:${cape.side}`);
  for(const arm of arms){
    const auras=[];arm.traverse(o=>{if(o.userData.weaponAura)auras.push(o);});
    for(const aura of auras){arm.attach(aura);arm.remove(aura);}
    bake(arm,`hero-arm:${id}:${outfit?.id||'base'}:${arm.userData.hand}:${signature?'signature':'normal'}:${weaponRarity||'none'}`);if(auras.length)arm.add(...auras);torso.add(arm);
  }
  const combatRig=arms.map(node=>({node,hand:node.userData.hand,rotation:node.rotation.clone()}));
  const hips=new T.Group(),waist=new T.Group();body.add(hips);hips.position.y=1.2;body.add(waist);waist.position.y=1.2;
  waist.attach(torso);for(const cape of capes)waist.attach(cape.node);hips.attach(waist);for(const leg of legs)hips.attach(leg.node);
  const heroRig=createHeroRig({hips,waist,legs,capes,arms:combatRig,role:design.role,id});
  if(bond){
    const aura=new T.Group();aura.name='bond-oath-aura';aura.position.y=.06;aura.userData.motion3d={kind:'bond-aura',phase:rank};g.add(aura);
    for(const radius of [.9,1.12]){const seal=ring(aura,h.color,0,0,0,radius);seal.rotation.x=-Math.PI/2;delete seal.userData.motion3d;seal.castShadow=false;}
    for(let i=0;i<6;i++){const angle=i*Math.PI/3+rank*.13,rune=crystal(aura,h.color,Math.cos(angle)*1.12,.055,Math.sin(angle)*1.12,[.045,.12,.045],.6);rune.castShadow=false;}
    bake(aura,'bond-oath-aura:'+id);for(const part of aura.children)part.castShadow=part.receiveShadow=false;
  }
  if(seasonAura){
    const aura=new T.Group();aura.name='season-eclipse-aura';aura.position.y=.045;aura.userData.motion3d={kind:'bond-aura',phase:2};g.add(aura);
    for(const [radius,color] of [[1.02,'#d98aa7'],[1.18,'#b59bdf']]){const seal=ring(aura,color,0,0,0,radius);seal.rotation.x=-Math.PI/2;delete seal.userData.motion3d;}
    for(let i=0;i<8;i++){const angle=i*Math.PI/4;crystal(aura,i%2?'#d98aa7':'#b59bdf',Math.cos(angle)*1.18,.04,Math.sin(angle)*1.18,[.035,.1,.035],.55);}
    bake(aura,'season-eclipse-aura');for(const part of aura.children)part.castShadow=part.receiveShadow=false;
  }
  return finishModel(g,{body,combatRig,heroRig,ornaments,kind:'hero',id,height:3.5,color:c,rarity:h.rarity,appearance:'dark-fantasy',silhouette:design.role,headpiece:design.helm,weapon:h.weapon,weaponRarity,signature,bond:!!bond,seasonAura:!!seasonAura,skin:outfit?.id||null});
}

export function creatureModel(id,boss=false){
  const p=boss?DUNGEON_BOSSES.find(p=>p.id===id):PET[id],c=boss?p.color:ELEMENT[p.element].color,shape=p.shape,g=new T.Group(),body=new T.Group(),wings=new T.Group();g.add(body,wings);
  const cream='#efe4b9',dark='#263a46';let faceY=1.65,faceZ=.5;
  if(shape==='turtle'){
    ball(body,c,0,.94,-.15,[.9,.72,.83]);const shell=mesh(body,geo('shell',()=>new T.IcosahedronGeometry(1,1)),'#536f59',0,1.05,-.24,[.84,.78,.74]);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;crystal(body,c,Math.cos(a)*.6,1.1+Math.sin(a)*.5,.3,[.22,.27,.09]);}
    ball(body,cream,0,.89,.6,[.47,.45,.38]);faceY=.93;faceZ=.94;
    for(const side of [-1,1])for(const z of [-.5,.5])ball(body,c,side*.61,.3,z,[.34,.21,.33]);
    for(const side of [-1,1]){const leaf=ball(body,'#b8d88c',side*.2,1.88,-.17,[.13,.4,.07]);leaf.rotation.z=-side*.5;}
    shell.rotation.y=.2;
  }else{
    ball(body,c,0,.83,0,[.58,.71,.48]);ball(body,cream,0,.77,.4,[.35,.45,.12]);
    for(const side of [-1,1])ball(body,c,side*.35,.25,.16,[.29,.2,.38]);
    if(['bird','phoenix'].includes(shape)){
      for(const side of [-1,1]){const wingRoot=new T.Group();wings.add(wingRoot);wingRoot.position.set(side*.45,1.08,0);wingRoot.userData.motion3d={kind:'wing',sign:side};for(let i=0;i<3;i++){const wing=cone(wingRoot,i===0?cream:c,side*(.19+i*.17),i*.07,-.03,.2,.8-i*.1,5);wing.rotation.z=-side*(.8+i*.2);}}
      for(let i=0;i<3;i++){const tail=crystal(body,c,(i-1)*.25,.7,-.54,[.15,.68,.1]);tail.rotation.x=-.65;}
    }
    ball(body,c,0,1.6,.07,[.65,.59,.53]);
    if(['fox','cat','dragon'].includes(shape))for(const side of [-1,1]){const ear=cone(body,c,side*.43,2.15,.03,.22,.62,4);ear.rotation.z=-side*.25;cone(body,cream,side*.43,2.12,.1,.11,.37,4).rotation.z=-side*.25;}
    if(shape==='deer')for(const side of [-1,1]){rod(body,'#dcc38a',[side*.33,1.99,0],[side*.48,2.7,-.1],.055);rod(body,'#dcc38a',[side*.44,2.45,-.07],[side*.8,2.58,-.05],.045);rod(body,'#dcc38a',[side*.43,2.38,-.06],[side*.22,2.62,-.08],.04);ball(body,c,side*.63,1.95,.05,[.3,.11,.12]);}
    if(shape==='lion'){const mane=mesh(body,geo('mane',()=>new T.IcosahedronGeometry(1,1)),c,0,1.62,-.06,[.88,.9,.52]);ball(body,cream,0,1.6,.31,[.55,.56,.32]);mane.rotation.z=.2;}
    if(['fox','cat','dragon'].includes(shape)){
      const curve=new T.CatmullRomCurve3([new T.Vector3(.3,.45,-.2),new T.Vector3(1,.6,-.25),new T.Vector3(1.1,1.2,-.5),new T.Vector3(.9,1.4,-.45)]);
      mesh(body,new T.TubeGeometry(curve,10,shape==='fox'?.22:.12,6,false),c);ball(body,cream,.9,1.4,-.45,[.13,.2,.13]);
    }
    if(shape==='dragon')for(const side of [-1,1]){const wing=plate(wings,c,[[0,0],[.9,.7],[.7,-.1],[.4,.04],[.2,-.3]],.06);wing.position.set(side*.43,1.22,-.28);wing.scale.x=side;wing.rotation.y=side*.45;wing.userData.motion3d={kind:'wing',sign:side};}
    if(shape==='bird'||shape==='phoenix'){cone(body,'#e9ba72',0,1.52,.66,.16,.29,4).rotation.x=Math.PI/2;for(let i=0;i<3;i++)cone(body,c,(i-1)*.16,2.21,0,.11,.36+(i===1?.22:0),4);}
  }
  eyes(body,faceY,faceZ,.22,dark,.85);
  if(!['bird','phoenix'].includes(shape)){ball(body,dark,0,faceY-.17,faceZ+.04,[.065,.045,.03]);rod(body,dark,[-.07,faceY-.28,faceZ],[0,faceY-.31,faceZ+.02],.013);rod(body,dark,[0,faceY-.31,faceZ+.02],[.07,faceY-.28,faceZ],.013);}
  if(boss){const crown=halo(g,c,3);crown.position.y=-.2;body.scale.setScalar(1.23);wings.scale.setScalar(1.23);}
  else if(RARITY[p.rarity].rank>=2){const r=ring(g,c,0,1.2,0,1.21);r.rotation.set(.8,.3,-.3);}
  bake(body,(boss?'boss:':'pet:')+id);return finishModel(g,{body,kind:boss?'boss':'pet',id,color:c,rarity:p.rarity,height:boss?3.6:2.7});
}

// Raid-only silhouette: angular obsidian plates, broad articulated wings and a long tail.
export function voidDragonModel(){
  const g=new T.Group(),body=new T.Group(),staticBody=new T.Group(),wings=[];g.add(body);body.add(staticBody);
  const obsidian='#222b40',plateColor='#414767',edge='#78699f',glow='#a9e8f4';
  ball(staticBody,obsidian,0,1.14,-.08,[.62,.93,.57],.35);
  for(let i=0;i<4;i++){const armor=crystal(staticBody,plateColor,0,.65+i*.29,.4,[.4-i*.025,.27,.18],.02);armor.rotation.x=.18;}
  crystal(staticBody,glow,0,1.43,.59,[.17,.27,.1],.85);
  rod(staticBody,obsidian,[0,1.7,0],[0,2.33,.34],.27,.4);
  const head=box(staticBody,plateColor,0,2.39,.48,[.67,.45,.74],.45);head.rotation.x=.12;
  box(staticBody,obsidian,0,2.22,.91,[.51,.22,.54],.4);
  for(const sign of [-1,1]){
    const brow=crystal(staticBody,edge,sign*.27,2.58,.64,[.2,.12,.29],.1);brow.rotation.z=sign*.24;
    const eye=box(staticBody,glow,sign*.29,2.43,.85,[.14,.055,.13]);eye.material=material(glow,.2,1);
    rod(staticBody,edge,[sign*.26,2.57,.23],[sign*.42,3.03,-.08],.085);
    crystal(staticBody,'#c5b4f4',sign*.43,3.08,-.1,[.06,.19,.065],.4);
    rod(staticBody,plateColor,[sign*.49,1.6,.1],[sign*.73,.88,.48],.17);
    box(staticBody,obsidian,sign*.49,.35,.1,[.4,.48,.43],.3);
    ball(staticBody,plateColor,sign*.48,.16,.4,[.32,.18,.44],.3);
    for(let i=0;i<3;i++){crystal(staticBody,'#c6cbd9',sign*.48+(i-1)*.14,.13,.79,[.06,.06,.19],.05);crystal(staticBody,'#d7d3e9',sign*.25,2.11,.96+(i-1)*.1,[.035,.07,.035],.05);}
  }
  const tailPoints=[[0,.85,-.48],[.38,.64,-1.1],[1.05,.56,-1.65],[1.56,.81,-1.9]];
  for(let i=0;i<tailPoints.length-1;i++)rod(staticBody,plateColor,tailPoints[i],tailPoints[i+1],.17-i*.04);
  crystal(staticBody,edge,1.67,.86,-1.98,[.22,.1,.31],.2).rotation.y=-.5;
  for(let i=0;i<5;i++)crystal(staticBody,i%2?edge:glow,0,1.01+i*.3,-.54,[.1,.23,.13],.2);
  bake(staticBody,'void-dragon-body');
  for(const sign of [-1,1]){
    const wing=new T.Group();wing.position.set(sign*.48,1.67,-.14);wing.name='void-wing:'+sign;body.add(wing);
    const membrane=plate(wing,'#413854',[[0,0],[.7,.84],[1.9,1.08],[1.66,.2],[1.36,.38],[.98,-.42],[.71,-.12],[.36,-.6]],.045,.015);membrane.scale.x=sign;
    for(const [end,mid] of [[[1.9,1.08],[.7,.84]],[[1.36,.38],[.7,.84]],[[.98,-.42],[.7,.84]],[[.36,-.6],[0,0]]]){rod(wing,edge,[sign*mid[0],mid[1],.03],[sign*end[0],end[1],.03],.045);}
    rod(wing,plateColor,[0,0,0],[sign*.7,.84,0],.11);
    rod(wing,glow,[sign*.08,.06,.04],[sign*.7,.84,.04],.018);
    rod(wing,glow,[sign*.7,.84,.04],[sign*1.87,1.07,.04],.018);
    crystal(wing,glow,sign*.7,.84,.01,[.085,.15,.06],.6);
    bake(wing,'void-dragon-wing:'+sign);wing.userData.motion3d={kind:'dragon-wing',sign};wings.push(wing);
  }
  return finishModel(g,{body,kind:'boss',id:'void-dragon',color:edge,height:3.7,wings,dragon:{airborne:false}});
}

export function enemyModel(e){
  if(e.bossId==='void-dragon')return voidDragonModel();
  if(DUNGEON_BOSSES.some(b=>b.id===e.bossId))return creatureModel(e.bossId,true);
  const id=e.bossId||e.kind,g=new T.Group(),body=new T.Group();g.add(body);
  const colors={'curse-king':'#98677f',archivist:'#aa83dc',ashknight:'#de8658',moonwarden:'#80c9e7',colossus:'#9aa78c',wraith:'#8e83ba',sentinel:'#74a991'},c=colors[id]||colors.sentinel;
  const boss=e.kind==='boss',dark=new T.Color(c).multiplyScalar(.35).getHex();
  for(const side of [-1,1]){box(body,dark,side*.33,.34,0,[.49,.68,.53],.2);box(body,c,side*.74,1.49,0,[.43,.95,.52],.3);crystal(body,c,side*.7,1.95,.01,[.38,.28,.33]);}
  const robe=cone(body,dark,0,1.15,0,.77,1.85,7);robe.rotation.y=Math.PI/7;
  ball(body,c,0,1.53,0,[.63,.64,.46],.2);crystal(body,'#baf5d6',0,1.58,.52,[.22,.35,.13],.5);
  const head=mesh(body,geo('enemy-head',()=>new T.DodecahedronGeometry(1)),c,0,2.36,0,[.57,.64,.5],.3);head.rotation.y=.15;
  box(body,'#152731',0,2.32,.46,[.78,.27,.12]);for(const side of [-1,1])box(body,id==='ashknight'?'#ffcb7a':'#bbf4de',side*.2,2.34,.54,[.23,.055,.06]);
  if(boss)for(let i=0;i<5;i++)cone(body,'#e6c88d',(i-2)*.22,3.02+(i===2?.12:0),0,.12,.4,4);
  if(id==='wraith'){body.remove(robe);const cloak=cone(body,'#514666',0,1.24,-.13,.82,2.5,7);cloak.rotation.y=Math.PI/7;}
  if(id==='curse-king'){
    weapon(body,'staff','#bb8fa8');
    for(const sign of [-1,1]){const horn=crystal(body,'#ba97c6',sign*.57,2.94,-.06,[.1,.45,.13]);horn.rotation.z=-sign*.45;crystal(body,'#4d3b50',sign*.85,1.92,.06,[.3,.42,.33]);}
    const halo=ring(body,'#d98aa7',0,2.2,-.45,.93);halo.rotation.z=.2;delete halo.userData.motion3d;
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;crystal(body,'#b59bdf',Math.cos(angle)*.93,2.2+Math.sin(angle)*.93,-.45,[.055,.12,.04],.5);}
    crystal(body,'#edb3ca',0,1.57,.59,[.13,.3,.06],.6);
  }
  if(id==='ashknight')weapon(body,'sword',c);if(id==='moonwarden')weapon(body,'staff',c);
  if(id==='archivist'){const book=box(body,'#6b517f',.85,1.4,.43,[.65,.15,.5]);book.rotation.z=.16;box(body,'#f0dcaa',.85,1.49,.43,[.58,.06,.44]);}
  if(boss)body.scale.setScalar(1.25);
  bake(body,'enemy:'+id);g.userData={body,kind:'enemy',id,color:c,height:boss?4.1:3.15};return g;
}

export function towerModel(){
  const g=new T.Group();mesh(g,geo('island',()=>new T.IcosahedronGeometry(1,1)),'#354d51',0,-.45,0,[2.8,1.7,2.5]);cylinder(g,'#79866a',0,.45,0,2.65,.28,7);
  for(let i=0;i<6;i++){const y=.65+i*.76,r=1.5-i*.12;cylinder(g,i%2?'#6f8c88':'#8ca29a',0,y+.28,0,r,.67,6);cone(g,'#376c65',0,y+.74,0,r+.28,.35,6);
    for(let j=0;j<6;j++){const a=j*Math.PI/3+.5;const window=box(g,'#cce6a0',Math.sin(a)*(r-.02),y+.3,Math.cos(a)*(r-.02),[.14,.27,.06]);window.rotation.y=a;window.material=material('#d8f3aa',0,.8);}
  }
  cone(g,'#b9c99c',0,5.91,0,.92,1.58,6);crystal(g,'#a7f6d1',0,6.9,0,[.22,.44,.22],1);
  const gate=box(g,'#294c4e',0,1.1,1.33,[.65,.9,.18]);ball(g,'#b2efbd',0,1.12,1.46,[.23,.38,.06],0,.7);gate.rotation.y=.05;
  for(let i=0;i<7;i++){const a=i*2.4;crystal(g,'#a0e9bd',Math.cos(a)*3.1,1+(i%3)*1.2,Math.sin(a)*2.6,[.12,.28,.12],.5);}
  g.userData={kind:'tower',id:'tower',height:8,color:'#a8d6b1'};return g;
}
export function makeModel(type,id,options={}){return type==='hero'?heroModel(id,options):type==='pet'?creatureModel(id):type==='tower'?towerModel():enemyModel({kind:type==='boss'?'boss':id,bossId:type==='boss'?id:undefined});}
export {T};
