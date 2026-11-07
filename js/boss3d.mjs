import {T,mesh,box,ball,crystal,cylinder,material,bake} from './models3d.mjs';

export const BOSS_FORMS={
  'curse-king':{name:'Ngai nguyền thức giấc',color:'#d98aa7',accent:'#cab1ef',theme:'eclipse'},
  colossus:{name:'Trái tim địa chấn',color:'#ffc184',accent:'#ffe4ad',theme:'stone'},
  archivist:{name:'Thư khố hư ảnh',color:'#c4a2ff',accent:'#ecd3ff',theme:'pages'},
  ashknight:{name:'Giáp tro bùng cháy',color:'#ff9c62',accent:'#ffddb0',theme:'flame'},
  moonwarden:{name:'Nguyệt thực thức giấc',color:'#a2e4ff',accent:'#e2e9ff',theme:'moon'},
  basalt:{name:'Cổ thụ phá mai',color:'#b6d890',accent:'#e2ecb8',theme:'shell'},
  groveheart:{name:'Thiên dực cuồng phong',color:'#9ce9cb',accent:'#e5f7cf',theme:'feather'},
  sunlion:{name:'Vầng dương rực cháy',color:'#ffdc8e',accent:'#fff0bf',theme:'sun'},
  cinderwyrm:{name:'Long giáp dung nham',color:'#ffac7d',accent:'#ffe2a6',theme:'dragonfire'},
  voidfox:{name:'Cửu vĩ nguyệt ảnh',color:'#d0afff',accent:'#f3d3f3',theme:'tails'},
  frostqueen:{name:'Vương miện băng vĩnh cửu',color:'#aeeeff',accent:'#e2fbff',theme:'frost'},
  stormwing:{name:'Thiên long tụ sấm',color:'#c5bbff',accent:'#e2e9ff',theme:'storm'},
  'void-dragon':{name:'Long huyết hư không',color:'#bb9fef',accent:'#a9e8f4',theme:'voidstorm'}
};
const geometries=new Map();
const geometry=(key,create)=>{if(!geometries.has(key)){const g=create();g.userData.shared3d=true;geometries.set(key,g);}return geometries.get(key);};
function line(group,color,a,b,r=.025){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=cylinder(group,color,0,0,0,r,av.distanceTo(bv),5);m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());m.material=material(color,.2,.65);return m;}
function ring(group,color,r,y,z=0,arc=Math.PI*2){const m=mesh(group,geometry(`ring:${r}:${arc}`,()=>new T.TorusGeometry(r,.022,4,48,arc)),color,0,y,z);m.material=material(color,.35,.65);return m;}
const charging=move=>['charge','summon','barrier','signature'].includes(move)?.65:['quake','volley','cleave','siphon','lunar','surge'].includes(move)?1:0;
export function readBossVisual(run,enemy){
  if(enemy?.kind!=='boss')return null;const bs=run?.battle?.bossState,tracked=bs&&bs.id===enemy.bossId;
  return {phase:tracked?bs.phase:1,move:tracked?bs.move:'strike',alive:enemy.hp>0,frozen:enemy.freeze>0,...(enemy.bossId==='void-dragon'?{airborne:tracked&&run.raid?.stage===0&&bs.parts?.arms.hp>0,barrier:tracked&&run.raid?.stage===1&&bs.parts?.core.hp>0}:{})};
}
export function attachBossVisual(model,id){
  const spec=BOSS_FORMS[id];if(!spec||model.userData.bossVisual)return model.userData.bossVisual||null;
  const body=model.userData.body,phaseRoot=new T.Group(),armor=new T.Group(),aura=new T.Group(),tell=new T.Group(),moving=[];
  body.add(phaseRoot);phaseRoot.add(armor);model.add(aura,tell);phaseRoot.visible=aura.visible=tell.visible=false;
  const add=(node,kind,phase=0)=>{moving.push({node,kind,phase,position:node.position.clone(),rotation:node.rotation.clone(),scale:node.scale.clone()});return node;};
  // Glowing fissures and fragments sit above the original armor without changing shared materials.
  const dragon=id==='void-dragon',creature=model.userData.kind==='boss',chestY=dragon?1.43:creature?1.02:1.6,chestZ=dragon?.59:creature?.53:.55;
  for(const sign of [-1,1])for(let i=0;i<3;i++)line(armor,spec.color,[sign*(.09+i*.1),chestY+.25-i*.12,chestZ+.02],[sign*(.18+i*.08),chestY+.09-i*.12,chestZ+.035],.018);
  const core=crystal(phaseRoot,spec.accent,0,chestY,chestZ+.07,[.13,.21,.06],.8);add(core,'core');
  if(spec.theme==='stone'||spec.theme==='flame'){
    for(const sign of [-1,1]){
      const pauldron=crystal(armor,spec.theme==='stone'?'#776e63':'#7b4b40',sign*.84,1.85,.01,[.48,.38,.45]);pauldron.rotation.z=sign*.27;
      for(let i=0;i<3;i++){const shard=crystal(phaseRoot,i%2?spec.accent:spec.color,sign*(.56+i*.17),2.2+i*.15,-.23,[.09,.3-i*.025,.1],.55);shard.rotation.z=-sign*(.3+i*.19);add(shard,spec.theme==='flame'?'flame':'shard',i+sign);}
    }
    if(spec.theme==='flame')for(let i=0;i<3;i++){const flame=crystal(phaseRoot,spec.accent,(i-1)*.18,2.98+(i===1?.16:0),.02,[.08,.25,.08],.65);add(flame,'flame',i);}
  }else if(spec.theme==='pages'){
    const orbit=new T.Group();phaseRoot.add(orbit);orbit.position.y=2.5;add(orbit,'pages');
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5,page=box(orbit,'#e5d3f1',Math.cos(a)*.95,Math.sin(a)*.18,-.35+Math.sin(a)*.65,[.2,.27,.035]);page.rotation.z=a*.3;line(orbit,spec.color,[page.position.x-.06,page.position.y+.04,page.position.z+.025],[page.position.x+.06,page.position.y+.04,page.position.z+.025],.012);}
    const halo=ring(phaseRoot,spec.color,1.15,2.05,-.35);halo.rotation.x=.4;add(halo,'orbit');
  }else if(spec.theme==='eclipse'){
    const eclipse=ring(phaseRoot,spec.color,1.06,2.24,-.44);add(eclipse,'orbit');
    const crescent=ring(phaseRoot,spec.accent,.89,2.24,-.43,Math.PI*1.45);crescent.rotation.z=.4;add(crescent,'moon');
    for(let i=0;i<6;i++){const a=i*Math.PI/3,shard=crystal(phaseRoot,i%2?spec.accent:spec.color,Math.cos(a)*1.13,2.24+Math.sin(a)*1.13,-.44,[.045,.13,.045],.65);shard.rotation.z=a-Math.PI/2;add(shard,'shard',i);}
    for(const sign of [-1,1])crystal(armor,spec.color,sign*.77,1.89,.04,[.23,.3,.28]);
  }else if(spec.theme==='moon'){
    const crescent=ring(phaseRoot,spec.accent,1.08,2.3,-.4,Math.PI*1.5);crescent.rotation.z=-.75;add(crescent,'moon');
    for(const sign of [-1,1]){const horn=crystal(armor,spec.color,sign*.45,3.03,-.1,[.1,.36,.1]);horn.rotation.z=-sign*.4;crystal(armor,spec.accent,sign*.8,1.87,.02,[.3,.35,.3]);}
  }else if(spec.theme==='shell'){
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;crystal(armor,i%2?spec.color:'#66765b',Math.cos(a)*.68,1.35+Math.sin(a)*.55,-.18,[.14,.33,.16]);}
    for(const sign of [-1,1]){line(armor,'#dcc89a',[sign*.2,1.6,-.35],[sign*.4,2.3,-.25],.055);const leaf=crystal(phaseRoot,spec.color,sign*.4,2.4,-.25,[.18,.38,.075]);leaf.rotation.z=-sign*.5;add(leaf,'feather',sign);}
  }else if(spec.theme==='feather'||spec.theme==='frost'){
    for(const sign of [-1,1])for(let i=0;i<3;i++){const feather=crystal(phaseRoot,i%2?spec.accent:spec.color,sign*(.7+i*.17),1.25+i*.2,-.18,[.12,.54-i*.08,.07],.4);feather.rotation.z=-sign*(.7+i*.15);add(feather,'feather',i+sign);}
    for(let i=0;i<5;i++)crystal(armor,spec.accent,(i-2)*.15,2.27+(i===2?.2:.07),.04,[.06,.22,.065],.6);
  }else if(spec.theme==='sun'){
    const crown=ring(phaseRoot,spec.accent,.87,1.65,-.25);add(crown,'sun');
    for(let i=0;i<10;i++){const a=i*Math.PI/5,ray=crystal(armor,spec.color,Math.cos(a)*.91,1.65+Math.sin(a)*.91,-.22,[.09,.25,.055],.5);ray.rotation.z=a-Math.PI/2;}
  }else if(spec.theme==='dragonfire'||spec.theme==='storm'){
    for(const sign of [-1,1]){
      line(armor,spec.accent,[sign*.35,1.95,0],[sign*.5,2.48,-.12],.06);line(armor,spec.color,[sign*.5,2.48,-.12],[sign*.75,2.67,-.1],.04);
      for(let i=0;i<3;i++){const shard=crystal(phaseRoot,spec.color,sign*(.7+i*.15),1.25+i*.21,-.3,[.1,.38,.07],.6);shard.rotation.z=-sign*.8;add(shard,spec.theme==='storm'?'storm':'flame',i+sign);}
    }
    for(let i=0;i<3;i++)crystal(armor,spec.accent,0,.6+i*.3,-.51,[.13,.25,.16],.5);
  }else if(spec.theme==='voidstorm'){
    for(const sign of [-1,1])for(let i=0;i<3;i++){
      const shard=crystal(phaseRoot,i%2?spec.accent:spec.color,sign*(.53+i*.18),2.38+i*.17,-.24,[.075,.32,.075],.6);shard.rotation.z=-sign*.36;add(shard,'storm',i);
    }
    const crown=ring(phaseRoot,spec.color,.66,2.72,-.14);crown.rotation.set(.1,.2,.14);add(crown,'orbit');
  }else if(spec.theme==='tails'){
    for(const sign of [-1,1])for(let i=0;i<4;i++){
      const tail=new T.Group();phaseRoot.add(tail);tail.position.set(sign*.35,.55,-.3);tail.rotation.z=-sign*(.45+i*.28);
      for(let j=0;j<3;j++){const tuft=ball(tail,j===2?spec.accent:spec.color,sign*(.16+j*.19),j*.35,-j*.06,[.13,.34-j*.03,.12],.15,.1);tuft.rotation.z=-sign*.4;}
      bake(tail,`boss-tail:${sign}`);add(tail,'tail',sign*(i+1));
    }
  }
  bake(armor,'boss-phase-armor:'+id);
  const phaseRing=ring(aura,spec.color,1.15,.12);phaseRing.rotation.x=Math.PI/2;add(phaseRing,'floor');
  const halo=ring(aura,spec.accent,1.22,1.55,-.22);halo.rotation.set(.4,.3,.1);add(halo,'orbit');
  const chargeRing=ring(tell,spec.color,1.36,.15);chargeRing.rotation.x=Math.PI/2;add(chargeRing,'charge');
  for(let i=0;i<6;i++){const a=i*Math.PI/3,marker=crystal(tell,spec.accent,Math.cos(a)*1.3,.14,Math.sin(a)*1.3,[.045,.09,.045],.65);add(marker,'charge-spark',i);}
  let barrier=null;if(dragon){barrier=new T.Mesh(geometry('void-barrier',()=>new T.IcosahedronGeometry(1,1)),new T.MeshBasicMaterial({color:spec.accent,transparent:true,opacity:.16,wireframe:true,depthWrite:false}));barrier.scale.set(1.25,1.55,1.15);barrier.position.set(0,1.4,.05);barrier.name='void-barrier';barrier.visible=false;body.add(barrier);}
  const visual={barrier,id,spec,phaseRoot,aura,tell,core,moving,initialized:false,phase:1,move:'strike',frozen:false,alive:true,changedAt:-10};model.userData.bossVisual=visual;return visual;
}
export function syncBossVisual(model,state,time,{reducedMotion=false}={}){
  const v=model.userData.bossVisual;if(!v||!state)return false;
  const phase=state.phase===2?2:1,changed=v.initialized&&v.phase===1&&phase===2&&state.alive;
  if(model.userData.dragon){model.userData.dragon.airborne=!!state.airborne;v.barrier.visible=!!state.barrier&&state.alive;}
  v.phase=phase;v.move=state.move;v.alive=state.alive;v.frozen=state.frozen;
  if(changed)v.changedAt=reducedMotion?-10:time;
  v.phaseRoot.visible=v.aura.visible=v.phase===2&&v.alive;v.tell.visible=v.alive&&!v.frozen&&charging(v.move)>0;v.initialized=true;
  animateBossVisual(model,time,{reducedMotion});return changed;
}
export function animateBossVisual(model,time,{reducedMotion=false}={}){
  const v=model.userData.bossVisual;if(!v)return;const still=reducedMotion||v.frozen||!v.alive,t=still?0:Math.max(0,time),charge=v.tell.visible?charging(v.move):0;
  if(v.barrier){v.barrier.rotation.y=still?0:t*.12;v.barrier.material.opacity=still?.16:.14+Math.sin(t*1.1)*.025;}
  for(const p of v.moving){
    const {node,kind,phase,position,rotation,scale}=p;node.position.copy(position);node.rotation.copy(rotation);node.scale.copy(scale);if(still)continue;
    if(kind==='orbit'||kind==='moon'||kind==='sun'){node.rotation.z+=t*(kind==='moon'?-.17:.2);node.rotation.y+=Math.sin(t*.7+phase)*.06;}
    else if(kind==='floor')node.rotation.z=t*.15;
    else if(kind==='charge'){node.rotation.z=t*(.3+charge*.35);node.scale.multiplyScalar(1+Math.sin(t*2)*.035*charge);}
    else if(kind==='charge-spark'){node.position.y+=charge*(.12+Math.sin(t*1.7+phase)*.1);}
    else if(kind==='core')node.scale.multiplyScalar(1+(.07+charge*.06)*Math.sin(t*1.8));
    else if(kind==='pages'){node.rotation.y=t*.26;node.position.y+=Math.sin(t*1.2)*.08;}
    else if(kind==='tail'){node.rotation.y=Math.sin(t*1.2+phase)*.13;node.rotation.z+=Math.sin(t*1.4+phase)*.035;}
    else if(kind==='feather'){node.rotation.y+=Math.sin(t*1.4+phase)*.12;}
    else{node.position.y+=Math.sin(t*(kind==='storm'?2:1.4)+phase)*.05;node.scale.y*=1+Math.sin(t*1.7+phase)*.06;}
  }
  const intro=still?1:Math.max(0,Math.min(1,(time-v.changedAt)/.7));v.phaseRoot.scale.setScalar(.94+intro*.06);v.phaseRoot.position.y=-(1-intro)*.05;
}
