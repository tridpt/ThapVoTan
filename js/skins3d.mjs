// Static armor is baked with the body/arms; moving ornaments remain per instance.
export function decorateSkin({T,box,crystal,cone,ring,rod,plate},skin,{body,head,arms,parts,ornaments}){
  if(!skin)return;
  const {color:c,accent:a,id}=skin;
  const crest=(group,x,y,z,scale=.16)=>crystal(group,a,x,y,z,[scale,scale*1.5,.065],.55);
  const feather=(group,sign,i,color,span=1)=>{
    const f=plate(group,color,[[0,0],[sign*.13,.46],[sign*(.4+i*.1),span],[sign*(.32+i*.1),.28]],.035,.01);
    f.position.set(sign*(.32+i*.14),1.65-i*.06,-.4-i*.025);return f;
  };
  if(id==='rook-guardian'){
    for(const sign of [-1,1]){
      const cheek=plate(head,c,[[sign*.38,.32],[sign*.6,.24],[sign*.55,-.39],[sign*.4,-.49],[sign*.39,-.12]],.09);
      cheek.position.z=.4;crest(head,sign*.47,.45,.02,.12);
      const shoulder=arms.find(p=>p.userData.hand===sign);
      box(shoulder,c,sign*.2,.06,0,[.48,.22,.48],.6);
      const fin=cone(shoulder,a,sign*.33,.28,-.02,.14,.43,4);fin.rotation.z=-sign*.35;
      rod(body,a,[sign*.32,1.72,.47],[sign*.2,1.3,.47],.045);
    }
    const brow=plate(head,a,[[-.55,.35],[-.4,.56],[-.16,.43],[0,.74],[.16,.43],[.4,.56],[.55,.35]],.1);brow.position.z=.35;
    crest(body,0,1.57,.52,.17);
    const shield=parts.find(p=>p.userData.hand===1);shield.scale.set(1.26,1.16,1);
    const shieldFace=plate(shield,c,[[-.31,.43],[0,.62],[.31,.43],[.29,-.28],[0,-.61],[-.29,-.28]],.08);shieldFace.position.z=.23;
    rod(shield,a,[-.25,.1,.31],[.25,.1,.31],.036);rod(shield,a,[0,-.35,.31],[0,.4,.31],.036);crest(shield,0,.1,.37,.12);
    const spear=parts.find(p=>p.userData.hand===-1);crest(spear,-.7,2.42,.14,.15);
    const seal=ring(ornaments,a,0,2.94,-.26,.71);seal.rotation.y=.2;
    for(const sign of [-1,1])crest(seal,sign,0,0,.07);
  }else if(id==='aerin-moon'){
    const cape=plate(body,'#4b4d80',[[-.44,1.95],[.44,1.95],[.81,.47],[.33,.68],[0,.29],[-.33,.68],[-.81,.47]],.045);cape.position.z=-.36;
    for(const sign of [-1,1]){
      const hood=plate(head,'#5b5d91',[[sign*.39,.53],[sign*.66,.28],[sign*.62,-.38],[sign*.47,-.55],[sign*.43,.18]],.08);hood.position.z=.16;
      rod(head,a,[sign*.46,.46,.35],[sign*.58,-.28,.38],.025);
      const trim=plate(body,c,[[sign*.33,1.75],[sign*.4,1.12],[sign*.65,.48],[sign*.22,.63]],.025);trim.position.z=.37;
    }
    const bow=parts[0];
    for(const sign of [-1,1]){
      const crescent=plate(bow,a,[[.04,sign*.28],[.26,sign*.48],[.13,sign*.87],[.03,sign*1.02],[.44,sign*.75],[.45,sign*.43],[.27,sign*.18]],.04,.01);crescent.position.z=.07;
      crest(bow,.28,sign*.46,.14,.08);
    }
    const moon=ring(ornaments,a,0,2.98,-.35,.67);moon.rotation.z=-.35;
    const arc=plate(ornaments,c,[[-.22,3.14],[-.06,3.39],[.21,3.51],[.05,3.23],[.1,3.04]],.045,.01);arc.position.z=.05;
    for(let i=0;i<3;i++){
      const shard=crystal(ornaments,a,Math.cos(i*2.1)*.85,1.9+Math.sin(i*2.1)*.4,-.25,[.065,.18,.055],.65);
      shard.userData.motion3d={kind:'spark',phase:i*2};
    }
  }else{
    const phoenix=id==='ember-phoenix';
    const robe=plate(body,phoenix?'#923e36':'#e5d6b0',[[-.32,1.72],[.32,1.72],[.48,.44],[0,.28],[-.48,.44]],.055);robe.position.z=.4;
    for(const sign of [-1,1]){
      rod(body,a,[sign*.27,1.75,.46],[sign*.35,.5,.48],.026);
      const wing=new T.Group();ornaments.add(wing);wing.userData.motion3d={kind:'wing',sign,phase:phoenix?.4:0};
      for(let i=0;i<3;i++)feather(wing,sign,i,i%2?a:c,phoenix?1.18:.95);
      const crown=cone(head,a,sign*.35,.55,.03,.11,.45,4);crown.rotation.z=-sign*.5;
      if(phoenix){
        const tail=plate(ornaments,sign>0?c:a,[[0,0],[sign*.57,.5],[sign*.4,-.18],[sign*.27,-.47]],.025,.01);tail.position.set(sign*.23,.64,-.45);tail.userData.motion3d={kind:'wing',sign,phase:1.5};
      }
    }
    crest(head,0,.55,.48,.14);
    const halo=ring(ornaments,a,0,2.94,-.39,.72);halo.rotation.z=.1;
    if(!phoenix)for(let i=0;i<6;i++){const angle=i*Math.PI/3;crest(halo,Math.cos(angle)*1.16,Math.sin(angle)*1.16,0,.055);}
    const staff=parts[0];crest(staff,0,1.28,.22,.23);
    for(const sign of [-1,1]){
      const tip=plate(staff,a,[[sign*.1,1.18],[sign*.4,1.6],[sign*.29,1.05],[sign*.12,.94]],.04,.01);tip.position.z=.1;
    }
    if(phoenix)for(let i=0;i<4;i++){
      const spark=crystal(ornaments,i%2?a:c,(i%2?1:-1)*(.65+i*.07),.65+i*.48,-.18,[.055,.13,.045],.8);spark.userData.motion3d={kind:'spark',phase:i};
    }
  }
}
