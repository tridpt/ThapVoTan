import {T,disposeScene,weaponStyle} from './models3d.mjs';

const shapes=new Map(),glows=new Map();
function geometry(key,create){if(!shapes.has(key)){const g=create();g.userData.shared3d=true;shapes.set(key,g);}return shapes.get(key);}
function glow(color,unique=false){
  if(!unique&&glows.has(color))return glows.get(color);
  const mat=new T.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  if(!unique){mat.userData.shared3d=true;glows.set(color,mat);}return mat;
}
function point(position){return position.isVector3?position.clone():new T.Vector3(position.x,position.y??.1,position.z);}

// Short-lived effects have a hard cap; dropping an effect also frees its unique material.
export class CombatEffects3D{
  constructor(scene,{capacity=96,reducedMotion=false,density=1}={}){this.scene=scene;this.capacity=Math.max(1,Math.floor(capacity));this.density=density;this.reducedMotion=reducedMotion;this.items=[];}
  setBudget({capacity=this.capacity,density=this.density}={}){this.capacity=Math.max(1,Math.floor(capacity));this.density=Math.max(.1,Math.min(1,density));while(this.items.length>this.capacity)this.remove(0);}
  get active(){return this.items.length>0;}
  remove(index){const [item]=this.items.splice(index,1);if(item){this.scene.remove(item.node);disposeScene(item.node);}}
  add(node,time,life,data={}){
    while(this.items.length>=this.capacity)this.remove(0);
    node.visible=false;this.scene.add(node);const item={node,born:time,life,...data};this.items.push(item);return item;
  }
  pulse(position,color,time,{radius=1,delay=0,life=.6,vertical=false,slash=false}={}){
    const shape=geometry(slash?'slash':'ring',()=>new T.RingGeometry(slash?.83:.9,1,40,1,0,slash?Math.PI*1.35:Math.PI*2));
    const node=new T.Mesh(shape,glow(color,true));node.position.copy(point(position));node.rotation.set(vertical?.15:-Math.PI/2,vertical?-.35:0,slash?.5:0);
    return this.add(node,time+delay,life,{kind:'pulse',radius,slash});
  }
  particles(position,color,time,{count=8,delay=0,heal=false,rank=0}={}){
    count=Math.min(this.capacity,Math.ceil(count*this.density));
    const origin=point(position),shape=geometry('spark',()=>new T.OctahedronGeometry(1)),palette=rank>=6?[color,'#aee8ff','#ffb8e7']:[color];
    for(let i=0;i<count;i++){
      const angle=i*2.399,scale=.045+(i%3)*.014,node=new T.Mesh(shape,glow(palette[i%palette.length]));node.position.copy(origin);node.scale.setScalar(scale);
      this.add(node,time+delay,.48+(i%4)*.1,{kind:'particle',origin:origin.clone(),velocity:new T.Vector3(Math.cos(angle)*(heal?.5:1.5),heal?1.4:.7+(i%3)*.5,Math.sin(angle)*(heal?.5:1.5)),scale,heal});
    }
  }
  projectile(from,to,color,time,{skill=false,rank=0,weapon='orb',delay=0,life=.27}={}){
    if(this.reducedMotion)return;
    const node=new T.Group();
    if(weapon==='bow'){
      const shaft=new T.Mesh(geometry('arrow-shaft',()=>new T.CylinderGeometry(.02,.02,.75,5)),glow('#ffe0a0'));shaft.rotation.x=Math.PI/2;node.add(shaft);
      const head=new T.Mesh(geometry('arrow-head',()=>new T.ConeGeometry(.095,.25,4)),glow(color));head.rotation.x=Math.PI/2;head.position.z=.45;node.add(head);
      if(skill){const trail=new T.Mesh(geometry('arrow-trail',()=>new T.ConeGeometry(.12,.8,5)),glow('#b6ffe0'));trail.rotation.x=-Math.PI/2;trail.position.z=-.5;node.add(trail);}
    }else{
      const orb=new T.Mesh(geometry('orb',()=>new T.IcosahedronGeometry(1,1)),glow(color));orb.scale.setScalar(skill?.16:.08);node.add(orb);
      if(skill){const orbit=new T.Mesh(geometry('trail',()=>new T.TorusGeometry(.22,.018,4,20)),glow(rank>=6?'#ffb8e7':color));orbit.rotation.x=.6;node.add(orbit);}
    }
    return this.add(node,time+delay,Math.max(.03,life),{kind:'projectile',from:point(from),to:point(to),arrow:weapon==='bow'});
  }
  weaponTrail(from,to,rarity,time,{delay=0,life=.5,compact=false}={}){
    const style=weaponStyle(rarity);if(this.reducedMotion||!style.trails)return;
    const start=point(from),end=point(to),layers=compact?Math.min(2,style.trails):style.trails;
    for(let i=0;i<layers;i++){
      const offset=(i-(layers-1)/2)*.08,a=start.clone().add(new T.Vector3(0,offset,0)),b=end.clone().add(new T.Vector3(0,offset,0)),mid=a.clone().lerp(b,.5);mid.y+=.35+i*.12;
      const geometry=new T.TubeGeometry(new T.CatmullRomCurve3([a,mid,b]),16,.012+style.rank*.003,3,false),node=new T.Mesh(geometry,glow(style.rank===6&&i%2?'#ffc1e9':style.color,true));
      geometry.setDrawRange(0,0);this.add(node,time+delay,life,{kind:'weaponTrail',count:geometry.index.count});
    }
  }
  meleeTrail(position,color,time,{weapon='sword',rank=0,delay=0,compact=false,life=.22,speed=1}={}){
    if(this.reducedMotion||!['sword','dagger'].includes(weapon))return;
    const shape=geometry('contact-slash',()=>new T.RingGeometry(.76,1,28,1,-.4,Math.PI*1.2));
    for(let i=0;i<(weapon==='dagger'&&!compact?2:1);i++){
      const node=new T.Mesh(shape,glow(i?'#ffe5c6':color,true));node.position.copy(point(position));node.rotation.set(.14,i?-.35:.3,i?-.9:.5);
      this.add(node,time+delay+i*.025/(speed===2?2:1),life/(speed===2?2:1),{kind:'meleeTrail',radius:.86+Math.min(6,rank)*.045,angle:node.rotation.z,sign:i?-1:1});
    }
  }
  armorSparks(position,time,{critical=false,shield=false,delay=0,compact=false,source=null,speed=1}={}){
    if(this.reducedMotion)return;
    const origin=point(position),shape=geometry('metal-spark',()=>new T.BoxGeometry(1,1,1)),count=compact?4:critical?9:shield?7:5;
    const facing=source?Math.atan2(source.x-origin.x,source.z-origin.z):0;
    for(let i=0;i<Math.ceil(count*this.density);i++){
      const angle=facing+(i-(count-1)/2)*.3,node=new T.Mesh(shape,glow(i%3?'#edbd76':'#fff0c3',true));node.position.copy(origin);node.scale.set(.018,.025,.14);
      const velocity=new T.Vector3(Math.sin(angle)*(1.1+i%3*.45),1.05+(i%3)*.4,Math.cos(angle)*(1.1+i%3*.45));node.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),velocity.clone().normalize());
      const rate=speed===2?2:1;velocity.multiplyScalar(rate);this.add(node,time+delay,(.28+(i%3)*.045)/rate,{kind:'metalSpark',origin,velocity,gravity:4*rate*rate});
    }
  }
  elementImpact(position,element,time,{rank=0,delay=0,compact=false,life=.42,speed=1}={}){
    if(this.reducedMotion||!['Hỏa','Băng','Lôi','Phong','Thổ','Quang','Ảnh'].includes(element))return;
    const colors={'Hỏa':'#ffac5e','Băng':'#b6eeff','Lôi':'#c5b7ff','Phong':'#a7dfc4','Thổ':'#c5ab7b','Quang':'#ffe5a3','Ảnh':'#bd98ed'};
    const root=new T.Group(),mat=glow(colors[element],true),count=compact?3:3+(rank>=3?1:0)+(rank>=5?1:0),parts=[];root.position.copy(point(position));
    for(let i=0;i<count;i++){
      const angle=i*Math.PI*2/count;let shape;
      if(element==='Hỏa')shape=geometry('contact-flame',()=>new T.ConeGeometry(.16,.65,5));
      else if(element==='Băng')shape=geometry('contact-ice',()=>new T.OctahedronGeometry(.23));
      else if(element==='Lôi')shape=geometry('contact-bolt',()=>new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,-.65,0),new T.Vector3(.18,-.25,0),new T.Vector3(-.13,0,0),new T.Vector3(.15,.3,0),new T.Vector3(0,.7,0)]),12,.024,3,false));
      else if(element==='Thổ')shape=geometry('contact-stone',()=>new T.DodecahedronGeometry(.18));
      else if(element==='Quang')shape=geometry('contact-ray',()=>new T.ConeGeometry(.055,.8,4));
      else shape=geometry('contact-crescent',()=>new T.RingGeometry(.63,.67,28,1,0,Math.PI*1.35));
      const node=new T.Mesh(shape,mat);node.position.set(Math.cos(angle)*.32,(i%2)*.15,Math.sin(angle)*.32);node.rotation.set(element==='Phong'?Math.PI/2:.1,angle,(i%2?1:-1)*.28);
      if(element==='Băng')node.scale.set(.65,1.5,.65);
      if(element==='Ảnh'||element==='Phong'){node.position.set(0,0,0);node.rotation.x=Math.PI/2+i*.45;node.rotation.z=angle;}
      root.add(node);parts.push({node,position:node.position.clone(),scale:node.scale.clone(),rotation:node.rotation.clone(),angle});
    }
    if(rank>=3&&!compact){const halo=new T.Mesh(geometry('contact-halo',()=>new T.RingGeometry(.79,.82,32)),mat);halo.rotation.x=-Math.PI/2;root.add(halo);}
    return this.add(root,time+delay,life/(speed===2?2:1),{kind:'elementContact',element,parts,material:mat});
  }
  cast(position,color,time,{skill=false,rank=0}={}){
    if(!skill)return;
    const ground=point(position);ground.y=.11;
    this.pulse(ground,color,time,{radius:1.05+rank*.06,life:.7});
    if(rank>=3&&!this.reducedMotion)this.pulse(ground,rank>=6?'#b3eaff':color,time,{radius:.72,delay:.12,life:.65});
  }
  support(position,color,time){
    const origin=point(position);origin.y=.13;this.pulse(origin,color,time,{radius:.95,life:.7});origin.y=1.2;
    this.particles(origin,color,time,{count:this.reducedMotion?2:5,heal:true});
  }
  impact(position,color,time,{skill=false,rank=0,heal=false,critical=false,delay=.22,weapon='orb',height=1.35}={}){
    const origin=point(position);origin.y=height;delay=this.reducedMotion?0:delay;
    this.particles(origin,color,time,{count:this.reducedMotion?3:skill?12+rank*2:critical?12:7,delay,heal,rank});
    if(skill||heal||critical||weapon==='shield'){
      const ground=origin.clone();ground.y=.14;this.pulse(ground,color,time,{radius:heal?1:1.1+rank*.06,delay});
    }
    if(!heal&&!this.reducedMotion&&skill&&!['sword','dagger'].includes(weapon)){this.pulse(origin,rank>=6?'#c3efff':color,time,{radius:1.05,delay,vertical:true,slash:true});if(rank>=5)this.pulse(origin,'#ffd4f1',time,{radius:.8,delay:delay+.1,life:.5,vertical:true,slash:true});}
  }
  step(time){
    for(let i=this.items.length-1;i>=0;i--){
      const f=this.items[i],age=time-f.born;if(age>=f.life){this.remove(i);continue;}if(age<0)continue;
      const p=Math.max(0,Math.min(1,age/f.life)),node=f.node;node.visible=true;
      if(f.kind==='scripted')f.animate(p,{reducedMotion:this.reducedMotion});
      else if(f.kind==='meleeTrail'){node.scale.setScalar(f.radius*(.9+p*.3));node.rotation.z=f.angle+f.sign*p*.65;node.material.opacity=(1-p)*.65;}
      else if(f.kind==='metalSpark'){node.position.copy(f.origin).addScaledVector(f.velocity,age);node.position.y-=f.gravity*age*age;node.scale.set(.018*(1-p),.025*(1-p),.14*(1-p*.65));node.material.opacity=(1-p)*.8;}
      else if(f.kind==='elementContact'){
        f.material.opacity=(1-p)*.62;
        for(const part of f.parts){const n=part.node;n.position.copy(part.position);n.scale.copy(part.scale);n.rotation.copy(part.rotation);
          if(f.element==='Hỏa'){n.position.y+=p*.65;n.scale.setScalar(1-p*.4);n.rotation.z+=Math.sin(p*Math.PI)*.2;}
          else if(f.element==='Băng'||f.element==='Thổ'){n.position.x+=Math.cos(part.angle)*p*.6;n.position.z+=Math.sin(part.angle)*p*.6;n.position.y+=(f.element==='Băng'?.3:.55)*Math.sin(p*Math.PI)-p*.28;n.rotation.z+=p*1.3;}
          else if(f.element==='Lôi'){n.scale.y=1+Math.sin(p*Math.PI)*.2;}
          else if(f.element==='Quang'){n.position.y+=p*.3;n.scale.y=1+p*.5;}
          else {n.rotation.z+=p*(f.element==='Phong'?1.4:-1);n.scale.setScalar(f.element==='Ảnh'?1-p*.35:1+p*.35);}
        }
      }
      else if(f.kind==='weaponTrail'){node.geometry.setDrawRange(0,Math.floor(f.count*Math.min(1,p*3)/3)*3);node.material.opacity=Math.min(.75,(1-p)*1.4);}
      else if(f.kind==='pulse'){node.scale.setScalar(f.radius*(this.reducedMotion?.8:.3+p*.85));node.material.opacity=(1-p)*.7;if(f.slash&&!this.reducedMotion)node.rotation.z=.5+p*.65;}
      else if(f.kind==='projectile'){
        node.position.lerpVectors(f.from,f.to,p);node.position.y+=Math.sin(p*Math.PI)*(f.arrow?.12:.65);
        if(f.arrow){const direction=f.to.clone().sub(f.from);direction.y+=Math.cos(p*Math.PI)*Math.PI*.12;node.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.normalize());}else node.rotation.z=p*4;
      }
      else if(f.kind==='particle'){node.position.copy(f.origin);if(!this.reducedMotion){node.position.addScaledVector(f.velocity,age);if(!f.heal)node.position.y-=age*age*.9;node.rotation.set(age*2,age*3,age);}node.scale.setScalar(f.scale*(1-p*.85));}
    }
  }
  clear(){while(this.items.length)this.remove(this.items.length-1);}
}
