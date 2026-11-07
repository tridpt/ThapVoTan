import {T,box,crystal,mesh,material,bake} from './models3d.mjs';
import {eliteDefinition,eliteAttackMultiplier} from './elites.mjs';

// Decorations sit outside the cached enemy body. Only the aura owns mutable materials.
export function attachEliteVisual(model,enemy){
  const def=eliteDefinition(enemy);if(!def||model.userData.eliteVisual)return model.userData.eliteVisual||null;
  const root=new T.Group(),armor=new T.Group(),aura=new T.Group();root.name='elite-'+def.id;root.add(armor,aura);model.add(root);
  const steel='#35434f',trim=def.color;
  for(const side of [-1,1]){
    const plate=box(armor,steel,side*.72,1.92,.1,[.54,.32,.65],.8);plate.rotation.z=-side*.22;
    box(armor,trim,side*.72,1.98,.43,[.36,.055,.06],.7);
    for(let i=0;i<2;i++){const spike=crystal(armor,trim,side*(.56+i*.22),2.17+i*.09,-.05,[.075,.23,.08],.3);spike.rotation.z=-side*(.15+i*.35);}
  }
  for(let i=0;i<3;i++){const crown=crystal(armor,trim,(i-1)*.29,3.03+(i===1?.18:0),.04,[.085,.3,.09],.3);crown.rotation.z=(i-1)*-.25;}
  const crest=crystal(root,trim,0,1.59,.57,[.19,.29,.09],.45);
  if(def.id==='rage'){
    for(const side of [-1,1]){const blade=crystal(armor,'#ae675a',side*.9,1.36,.4,[.14,.63,.1],.12);blade.rotation.z=-side*.45;}
  }else if(def.id==='rebirth'){
    const halo=mesh(armor,new T.TorusGeometry(.7,.035,4,24,Math.PI*1.65),trim,0,2.55,-.4,[1,1,1],.65,.25);halo.rotation.z=-.7;
  }
  bake(armor,'elite-armor:'+def.id);
  const shield=new T.Group();root.add(shield);shield.position.set(-.98,1.25,.49);shield.rotation.z=.12;
  if(def.id==='guard'){
    crystal(shield,steel,0,0,0,[.48,.72,.15],.1);crystal(shield,trim,0,0,.16,[.39,.59,.06],.3);box(shield,steel,0,0,.23,[.05,.8,.03],.8);bake(shield,'elite-guard-shield');
  }
  const auraMat=new T.MeshBasicMaterial({color:trim,transparent:true,opacity:.4,depthWrite:false});
  const ring=new T.Mesh(new T.TorusGeometry(1.04,.028,4,36),auraMat);ring.rotation.x=-Math.PI/2;ring.position.y=.09;aura.add(ring);
  const motes=new T.Group();aura.add(motes);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;crystal(motes,trim,Math.cos(a)*1.04,.3+i*.35,Math.sin(a)*1.04,[.045,.12,.045],.35);}
  const visual={root,armor,aura,ring,motes,shield,crest,trait:def.id,alive:true,frozen:false,power:0,revived:false};model.userData.eliteVisual=visual;
  syncEliteVisual(model,enemy);return visual;
}
export function syncEliteVisual(model,enemy){
  const v=model.userData.eliteVisual;if(!v)return;
  v.alive=enemy.hp>0;v.frozen=enemy.freeze>0;v.revived=!!enemy.elite?.revived;v.power=eliteAttackMultiplier(enemy)-1;
  v.root.visible=v.alive;v.shield.visible=v.trait==='guard'&&enemy.shield>0;
  // Material replacement is safe for the cache; shared material properties stay immutable.
  v.crest.material=material(v.revived?'#6b627c':eliteDefinition(enemy).color,.35,v.revived?.05:.45);
}
export function animateEliteVisual(model,time,{reducedMotion=false}={}){
  const v=model.userData.eliteVisual;if(!v)return;
  const still=reducedMotion||v.frozen;v.aura.visible=v.alive&&!reducedMotion;
  v.ring.material.opacity=v.revived?.2:.35+v.power*.3+(still?0:Math.sin(time*2.5)*.07);
  v.ring.scale.setScalar(1+v.power*.14);v.ring.rotation.z=still?0:time*.22;
  v.motes.rotation.y=still?0:time*(v.trait==='rage'?.55:.22);v.motes.position.y=still?0:Math.sin(time*1.5)*.07;
}
