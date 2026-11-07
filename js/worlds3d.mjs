import {T,mesh,box,ball,crystal,cylinder,material,bake} from './models3d.mjs';
import {raidDefinition,raidId} from './raids.mjs';
import {HUNT} from './armory-data.mjs';
import {campaignChapter} from './campaign-data.mjs';
import {ANOMALY} from './anomalies.mjs';

export const WORLDS={
  ruins:{id:'ruins',name:'Đền Hắc Lôi',weather:'Mưa hắc lôi',accent:'#b9a4ef',background:'#171f38',danger:'#302243',stone:'#444e63',tile:'#687080',edge:'#242b42',glow:'#a7dce9'},
  forest:{id:'forest',name:'Rừng cổ',weather:'Lá rơi',accent:'#a5dcb8',background:'#102b2d',danger:'#302b32',stone:'#526d60',tile:'#6f8270',edge:'#2a4740',glow:'#b7daa0'},
  ice:{id:'ice',name:'Hang băng',weather:'Tuyết bay',accent:'#a7e7f2',background:'#142d43',danger:'#302b46',stone:'#648d9e',tile:'#8bb4bd',edge:'#324e6e',glow:'#b5eeff'},
  lava:{id:'lava',name:'Dung nham',weather:'Tàn lửa',accent:'#ffb17d',background:'#281c28',danger:'#3b1725',stone:'#514952',tile:'#726361',edge:'#302c3a',glow:'#ff985c'},
  sky:{id:'sky',name:'Thành trên mây',weather:'Mây trôi',accent:'#d8dcff',background:'#283e59',danger:'#382c50',stone:'#7f91a3',tile:'#a6b4b6',edge:'#586b89',glow:'#f6e3ac'}
};
const order=['forest','ice','lava','sky'],dungeonWorld={earth:'forest',wind:'sky',light:'sky',fire:'lava',shadow:'forest',ice:'ice',thunder:'sky'};
export function worldForRun(run){return WORLDS[(run?.raid?raidDefinition(raidId(run)).stages[run.raid.stage]?.world:null)||campaignChapter(run?.campaign?.stage)?.world||HUNT[run?.hunt?.id||run?.training?.bossId]?.world||dungeonWorld[run?.dungeon?.id]||order[Math.floor((Math.max(1,run?.floor||1)-1)/10)%4]];}
const shared=new Map();
function geometry(key,make){if(!shared.has(key)){const g=make();g.userData.shared3d=true;shared.set(key,g);}return shared.get(key);}
function torus(g,color,r,x,y,z,rx=Math.PI/2){const ring=mesh(g,geometry(`rune:${r}`,()=>new T.TorusGeometry(r,.025,4,64)),color,x,y,z);ring.rotation.x=rx;ring.material=material(color,.35,.25);return ring;}
function rod(g,color,a,b,r=.045,glow=0){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=cylinder(g,color,0,0,0,r,av.distanceTo(bv),6);m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());m.material=material(color,0,glow);return m;}
function rock(g,color,x,y,z,scale){return mesh(g,geometry('rock',()=>new T.DodecahedronGeometry(1)),color,x,y,z,scale);}
function tree(g,x,z,sign){
  cylinder(g,'#534f3a',x,1.8,z,.38,3.7,7);rod(g,'#534f3a',[x,2.1,z],[x-sign*.85,3.1,z+.1],.16);
  for(let i=0;i<4;i++){const a=i*2.4;rock(g,i%2?'#608569':'#3c6c58',x+Math.cos(a)*.8,3.25+(i%2)*.6,z+Math.sin(a)*.65,[1.15,.7,.94]);}
  for(let i=0;i<3;i++)rod(g,'#344d39',[x+Math.sin(i)*.5,.07,z+.2],[x+sign*(1.3+i*.3),.06,z+.9-i*.6],.1);
}
function cloud(g,x,y,z,scale=1){
  const group=new T.Group();g.add(group);group.position.set(x,y,z);group.scale.setScalar(scale);
  for(let i=0;i<4;i++)ball(group,'#a2b6ce',(i-1.5)*.65,Math.sin(i*1.7)*.14,Math.cos(i)*.2,[.88,.37,.6]);
  bake(group,'sky-cloud');group.traverse(o=>{o.castShadow=false;});return group;
}
export function createWorld(id,{compact=false,anomaly=null}={}){
  const condition=Object.hasOwn(ANOMALY,anomaly)?ANOMALY[anomaly]:null,original=WORLDS[id]||WORLDS.forest;
  const data=condition?{...original,...condition.visual}:original,root=new T.Group(),base=new T.Group(),decor=new T.Group(),motion=[];root.add(base,decor);root.name='world:'+data.id;
  cylinder(base,data.edge,0,-.45,0,6.6,.8,12);cylinder(base,data.stone,0,-.07,0,6.45,.1,12,.1);
  for(let x=-4;x<=4;x+=2)for(let z=-4;z<=4;z+=2){const tile=box(base,(x+z)%4?data.stone:data.tile,x,-.005,z,[1.94,.07,1.94]);tile.rotation.y=(x+z)*.001;}
  for(const r of [2.5,5.9])torus(base,data.glow,r,0,.04,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,rune=crystal(base,data.glow,Math.sin(a)*5.6,.08,Math.cos(a)*5.6,[.1,.035,.23],.4);rune.rotation.y=a;}
  for(const sign of [-1,1])for(const z of [-4.8,1.4]){
    const x=sign*5.65;cylinder(decor,data.edge,x,.08,z,.55,.23,6);
    if(data.id==='ice'){
      crystal(decor,'#a8d7df',x,1.15,z,[.5,1.3,.42],.08);crystal(decor,'#75acbf',x+sign*.38,.55,z+.28,[.25,.68,.3]);
    }else if(data.id==='lava'){
      const spire=rock(decor,'#3c3c4b',x,1.05,z,[.6,1.4,.62]);spire.rotation.z=sign*.1;
      rod(decor,'#ffab64',[x,.1,z+.55],[x+sign*.1,1.65,z+.42],.035,.7);crystal(decor,'#ffc37f',x,2.23,z,[.16,.38,.16],.8);
    }else{
      box(decor,data.stone,x,1.25,z,[.6,2.2,.63]);box(decor,data.tile,x,2.4,z,[.88,.21,.9]);
      box(decor,data.glow,x,2.14,z+.34,[.65,.1,.05],.35);crystal(decor,data.glow,x,2.8,z,[.17,.36,.17],.4);
      if(data.id==='forest')for(let i=0;i<3;i++){const leaf=ball(decor,'#75936b',x-sign*.35,1.1+i*.28,z+.36,[.2,.08,.1]);leaf.rotation.z=sign*.6;}
    }
  }
  torus(decor,data.tile,1.65,0,2.02,-6,0).scale.y=1.18;torus(decor,data.glow,1.43,0,2.02,-5.98,0).scale.y=1.18;
  if(data.id==='forest'){
    for(const sign of [-1,1])tree(decor,sign*7,-3.8,sign);
    for(let i=0;i<7;i++){const a=i*2.399;rock(decor,i%2?'#617965':'#304c43',Math.cos(a)*7.6,.1,Math.sin(a)*7.5,[.65,1+(i%2)*.4,.6]);}
    for(const sign of [-1,1])for(let i=0;i<3;i++){const mushroom=cylinder(decor,'#e2c6a3',sign*(6+i*.35),.15,3.2+i*.3,.05,.28,5);ball(decor,'#bcaa76',mushroom.position.x,.31,mushroom.position.z,[.15,.08,.15]);}
  }else if(data.id==='ice'){
    for(const sign of [-1,1])for(let i=0;i<4;i++){const ice=crystal(decor,i%2?'#6ca8bd':'#b2dce5',sign*(6.7+i*.32),1.25+(i%3)*.5,-6+i*1.8,[.55,1.75+(i%2)*.55,.64],.03);ice.rotation.z=sign*(.12+i*.05);}
    for(let i=0;i<6;i++){const x=-4.8+i*1.9;rod(base,'#c0eced',[x,.05,-5.1],[x+.5,.05,-4.55],.018,.3);rod(base,'#c0eced',[x+.5,.05,-4.55],[x+.2,.05,-4.15],.018,.3);}
  }else if(data.id==='lava'){
    for(const sign of [-1,1]){
      box(decor,'#bb5b3f',sign*7.5,-.63,0,[2.1,.07,14]);
      for(let i=0;i<6;i++){const z=-5+i*2.2;rod(decor,'#ffad59',[sign*6.9,-.57,z],[sign*8.2,-.57,z+.6],.035,.8);rock(decor,'#413b48',sign*(7.1+(i%2)*.5),.1,z,[.6,.9+(i%3)*.35,.8]);}
    }
    for(let i=0;i<6;i++){const a=i*1.05;rod(base,'#e39460',[Math.cos(a)*5,.06,Math.sin(a)*5],[Math.cos(a+.08)*5.45,.06,Math.sin(a+.08)*5.45],.025,.55);}
  }else if(data.id==='ruins'){
    for(const sign of [-1,1]){
      for(let i=0;i<3;i++){const x=sign*(6.8+(i%2)*.5),z=-6.2+i*3.1;const column=box(decor,'#4e5065',x,.8+(i%2)*.4,z,[.7,1.8+(i%2)*.8,.7],.15);column.rotation.z=sign*.07;box(decor,'#7e7a8b',x,1.8+(i%2)*.8,z,[1,.18,1]);rock(decor,'#353b52',x-sign*.5,.12,z+.9,[.7,.3,.5]);}
      const tilted=box(decor,'#53586e',sign*2.2,3.45,-6.8,[.6,2.9,.7]);tilted.rotation.z=sign*.12;
      box(decor,'#747388',sign*1.7,5,-6.8,[1.65,.36,.9]);
    }
    for(let i=0;i<6;i++){const a=i*1.05;rod(base,'#a5bfd1',[Math.cos(a)*4.8,.05,Math.sin(a)*4.8],[Math.cos(a+.09)*5.4,.05,Math.sin(a+.09)*5.4],.018,.25);}
    for(const sign of [-1,1]){const node=cloud(root,sign*6.5,4.1,-7.8,1.4);node.traverse(o=>{if(o.isMesh)o.material=material('#3c405c');});motion.push({node,kind:'cloud',position:node.position.clone(),rotation:node.rotation.clone(),phase:sign});}
    for(const sign of [-1,1]){const node=new T.Group();root.add(node);for(const [a,b] of [[[-.2,5.7,0],[.16,4.9,0]],[[.16,4.9,0],[-.15,4.4,0]],[[-.15,4.4,0],[.25,3.7,0]]])rod(node,'#b9b6ed',a,b,.028,.5);bake(node,'ruins-lightning');node.position.set(sign*6.1,0,-7);node.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.userData.shared3d=false;o.material.transparent=true;o.material.depthWrite=false;}});motion.push({node,kind:'lightning',position:node.position.clone(),rotation:node.rotation.clone(),phase:sign*2});}
  }else{
    for(let i=0;i<7;i++){const a=i*2.4,shard=rock(root,i%2?'#667d9f':'#8b9db2',Math.cos(a)*7.5,-.25+(i%3)*.3,Math.sin(a)*7.3,[.4+(i%2)*.2,.6,.5]);motion.push({node:shard,kind:'island',position:shard.position.clone(),rotation:shard.rotation.clone(),phase:i*.9});}
    for(const [x,y,z,s] of [[-7,-1,2,1.4],[7,-1,-1,1.6],[0,-1.25,-7,1.7]]){const node=cloud(root,x,y,z,s);motion.push({node,kind:'cloud',position:node.position.clone(),rotation:node.rotation.clone(),phase:x*.2});}
    for(const sign of [-1,1]){box(decor,'#b9c2b7',sign*2.3,3.1,-6.5,[.45,3.5,.5]);box(decor,'#d4c39c',sign*2.3,4.83,-6.5,[.78,.23,.7]);}
    box(decor,'#bec5bc',0,4.95,-6.5,[5,.23,.64]);
  }
  // Landmarks sit behind and above the battle lanes; no lights or second particle pool.
  if(condition){
    const sign=new T.Group();sign.name='anomaly:'+condition.id;root.add(sign);
    if(condition.id==='bloodmoon'){
      ball(sign,'#b76166',0,3.1,-6,[.9,.9,.22]);
      torus(sign,'#f4b29a',1.04,0,3.1,-6.04,0);
      for(const x of [-.38,.22])ball(sign,'#8e4957',x,3.25+x,-5.79,[.17,.14,.03]);
    }else if(condition.id==='frost'){
      for(const side of [-1,1])for(let i=0;i<3;i++){const shard=crystal(sign,i%2?'#8dbbd2':'#c2e4ec',side*(6.1+i*.35),.6+i*.36,-6.5,[.17,.8+i*.12,.2],.16);shard.rotation.z=side*(.3+i*.1);}
    }else{
      torus(sign,'#b5a5ed',.94,0,3.1,-6,0);
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3;crystal(sign,'#c8b9f7',Math.sin(a)*.8,3.1+Math.cos(a)*.8,-5.98,[.13,.28,.13],.5);}
      crystal(sign,'#d5c4ff',0,3.1,-6,[.24,.5,.2],.5);
    }
    bake(sign,'anomaly-landmark:'+condition.id);sign.traverse(o=>{o.castShadow=false;});
    motion.push({node:sign,kind:'island',position:sign.position.clone(),rotation:sign.rotation.clone(),phase:0});
  }
  const paletteKey=data.id+(condition?':'+condition.id:'');
  bake(base,'world-floor:'+paletteKey);bake(decor,'world-decor:'+paletteKey);
  const count=compact?24:42,positions=new Float32Array(count*(data.id==='ruins'?6:3)),seeds=[];
  for(let i=0;i<count;i++){const a=i*2.399,se={x:Math.sin(a)*5.8,z:Math.cos(a)*6.1,y:.7+(i%11)*.4,phase:i*.71,speed:.2+(i%5)*.035};seeds.push(se);positions.set([se.x,se.y,se.z],i*3);}
  const weatherGeometry=new T.BufferGeometry();weatherGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const weatherMaterial=new T.PointsMaterial({color:condition?.visual.weather||(data.id==='lava'?'#ffd29b':data.id==='forest'?'#d9dba1':data.id==='sky'?'#e5eeff':'#ddf8ff'),size:condition?.id==='frost'?1.7:data.id==='lava'?2.1:data.id==='forest'?1.7:1.4,transparent:true,opacity:data.id==='sky'?.4:.7,depthWrite:false,sizeAttenuation:false});
  const weather=data.id==='ruins'?new T.LineSegments(weatherGeometry,new T.LineBasicMaterial({color:'#afc4df',transparent:true,opacity:.35,depthWrite:false})):new T.Points(weatherGeometry,weatherMaterial);if(data.id==='ruins')weatherMaterial.dispose();weather.frustumCulled=false;root.add(weather);
  const leaves=[];
  if(data.id==='forest'&&!condition){
    const instanced=new T.InstancedMesh(geometry('leaf',()=>new T.OctahedronGeometry(1)),material('#c3cc8b'),compact?8:12);instanced.instanceMatrix.setUsage(T.DynamicDrawUsage);instanced.frustumCulled=false;root.add(instanced);leaves.push(instanced);
  }
  const world={root,data,anomaly:condition?.id||null,motion,weather,seeds,leaves,dummy:new T.Object3D(),danger:0,dangerFrom:0,dangerTarget:0,dangerAt:0,background:new T.Color(data.background),calmColor:new T.Color(data.background),dangerColor:new T.Color(data.danger)};
  animateWorld(world,0);return world;
}
export function setWorldDanger(world,enraged,time,{instant=false}={}){
  const target=enraged?1:0;if(target===world.dangerTarget)return;
  world.dangerFrom=world.danger;world.dangerTarget=target;world.dangerAt=time;
  if(instant){world.danger=target;world.dangerFrom=target;}
}
export function animateWorld(world,time,{reducedMotion=false}={}){
  reducedMotion||=!!world.lowEffects;
  const t=reducedMotion?0:Math.max(0,time),{data,weather,seeds,dummy}=world;
  const progress=reducedMotion?1:Math.min(1,Math.max(0,(time-world.dangerAt)/.8));world.danger=world.dangerFrom+(world.dangerTarget-world.dangerFrom)*progress;world.background.copy(world.calmColor).lerp(world.dangerColor,world.danger);
  for(const p of world.motion){p.node.position.copy(p.position);p.node.rotation.copy(p.rotation);if(p.kind==='lightning'){p.node.visible=!reducedMotion;const alpha=Math.max(0,Math.sin(t*.45+p.phase))**6*.65;p.node.traverse(o=>{if(o.isMesh)o.material.opacity=alpha;});continue;}if(reducedMotion)continue;p.node.position.y+=Math.sin(t*.65+p.phase)*.17;if(p.kind==='cloud')p.node.position.x+=Math.sin(t*.18+p.phase)*.55;else p.node.rotation.y+=Math.sin(t*.35+p.phase)*.12;}
  const positions=weather.geometry.attributes.position;
  for(let i=0;i<(weather.visible?Math.min(seeds.length,weather.geometry.drawRange.count/(data.id==='ruins'?2:1)):0);i++){
    const s=seeds[i],rising=world.anomaly?world.anomaly!=='frost':data.id==='lava',y=reducedMotion?s.y:((s.y+(rising?1:-1)*t*s.speed*(data.id==='ruins'?5:1))%5+5)%5;
    if(data.id==='ruins'){positions.setXYZ(i*2,s.x,.15+y,s.z);positions.setXYZ(i*2+1,s.x+.045,.15+Math.min(5,y+.22),s.z);continue;}
    positions.setXYZ(i,s.x+(reducedMotion?0:Math.sin(t*.6+s.phase)*.27),.15+y,s.z+(reducedMotion?0:Math.cos(t*.3+s.phase)*.14));
  }
  if(weather.visible)positions.needsUpdate=true;
  for(const leaves of world.leaves)if(leaves.visible)for(let i=0;i<leaves.count;i++){
    const s=seeds[i];dummy.position.set(s.x+Math.sin(t*.55+s.phase)*.4,((s.y-t*.25)%4.5+4.5)%4.5+.3,s.z);dummy.rotation.set(t*.6+s.phase,.3,Math.sin(t*.7+s.phase));dummy.scale.set(.12,.035,.065);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.instanceMatrix.needsUpdate=true;
  }
}
