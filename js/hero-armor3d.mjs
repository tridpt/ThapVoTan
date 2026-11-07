// Each rigid armor segment is cached; its joint transforms belong to one hero instance.
export function buildDarkHero({T,mesh,material,ball,box,crystal,cylinder,cone,rod,plate,geo},d,{body,head,arms}){
  const {steel,cloth,trim,eye,role,helm}=d,heavy=role==='guardian',knight=role==='knight',rogue=role==='assassin',robe=['sorcerer','cleric'].includes(role),edge='#92999c',black='#171c25',leather='#302b2b';
  const width=heavy?.49:knight?.41:rogue?.31:.35;
  const closed=['bastion','cathedral','winged','solar','void','eclipse'].includes(helm);
  const legs=[],capes=[];
  function pivot(group,x,y,z){group.position.set(x,y,z);for(const child of group.children)child.position.sub(group.position);}
  function panel(g,color,points,z=.28,depth=.06){const p=plate(g,color,points,depth,.015);p.position.z=z;return p;}
  function taper(g,color,x,y,z,top,bottom,height,depth=1){
    const key=`armor-taper:${top}:${bottom}:${height}`;
    return mesh(g,geo(key,()=>new T.CylinderGeometry(top,bottom,height,10)),color,x,y,z,[1,1,depth],.35);
  }
  function gem(g,x,y,z,size=.055){return crystal(g,eye,x,y,z,[size,size*1.6,size*.55],.4);}
  function spike(g,a,b,r=.055){rod(g,steel,a,b,r,.6);const tip=cone(g,trim,...b,r*1.25,.23,4);tip.rotation.z=-(b[0]-a[0])*1.6;return tip;}
  // A split, pleated mantle and a visible lining give the back a different silhouette per class.
  for(const sign of [-1,1]){
    const cape=new T.Group();body.add(cape);
    panel(cape,cloth,[[sign*.025,2.3],[sign*width,2.35],[sign*(width+.2),.39],[sign*.2,.15],[sign*.035,.36]],-.38,.045);
    rod(cape,cloth,[sign*(width-.02),2.22,-.35],[sign*(width+.17),.43,-.49],.017,.3);
    pivot(cape,sign*.13,2.29,-.34);capes.push({node:cape,side:sign});
    const leg=new T.Group(),knee=new T.Group();body.add(leg);leg.add(knee);
    mesh(leg,geo('dark-thigh',()=>new T.CylinderGeometry(.13,.12,.47,8)),black,sign*.2,.97,0,[1,1,.9],.3);
    panel(leg,steel,[[sign*.085,1.17],[sign*.32,1.15],[sign*.32,.78],[sign*.2,.68],[sign*.075,.8]],.15,.08);
    mesh(knee,geo('dark-shin',()=>new T.CylinderGeometry(.115,.09,.54,8)),black,sign*.2,.44,0,[1,1,.9],.3);
    const greave=panel(knee,steel,[[sign*.08,.7],[sign*.31,.7],[sign*.34,.35],[sign*.19,.23],[sign*.075,.4]],.14,.1);
    greave.rotation.y=-sign*.07;
    panel(knee,trim,[[sign*.1,.72],[sign*.29,.72],[sign*.32,.61],[sign*.2,.52],[sign*.08,.61]],.24,.055);
    const boot=mesh(knee,geo('dark-boot',()=>new T.CapsuleGeometry(.14,.18,2,6)),black,sign*.22,.15,.11,[1,1.1,1.55],.3);boot.rotation.x=Math.PI/2;
    panel(knee,steel,[[sign*.075,.22],[sign*.33,.22],[sign*.35,.085],[sign*.05,.085]],.32,.07);
    rod(knee,trim,[sign*.11,.25,.27],[sign*.3,.25,.27],.016,.3);
    pivot(knee,sign*.2,.7,0);pivot(leg,sign*.2,1.18,0);legs.push({node:leg,knee,side:sign});
  }
  taper(body,black,0,1.67,0,width,width*.76,1.13,.61);
  // The pointed cuirass, overlapping abdominal plates and high gorget read at phone size.
  panel(body,steel,[[-width,2.25],[-width*.54,2.4],[0,2.32],[width*.54,2.4],[width,2.25],[width*.81,1.68],[0,1.49],[-width*.81,1.68]],.23,.15);
  for(const sign of [-1,1]){
    rod(body,trim,[sign*(width-.045),2.21,.36],[sign*.11,1.72,.38],.023,.6);
    panel(body,edge,[[sign*.06,2.27],[sign*(width-.08),2.31],[sign*(width-.03),2.15],[sign*.08,2.19]],.335,.025);
  }
  for(let i=0;i<3;i++)panel(body,i%2?black:steel,[[-width*.78,1.69-i*.13],[0,1.59-i*.13],[width*.78,1.69-i*.13],[width*.69,1.51-i*.13],[0,1.42-i*.13],[-width*.69,1.51-i*.13]],.27+i*.015,.055);
  taper(body,leather,0,1.24,.01,width*.85,width*.88,.13,.75);gem(body,0,1.25,.33,.075);
  // Tassets are distinct for armor, robes and the light assassin outfit.
  for(const sign of [-1,1]){
    panel(body,robe?cloth:steel,[[sign*.04,1.18],[sign*.34,1.22],[sign*(robe?.46:.4),robe?.31:.68],[sign*.12,robe?.18:.56]],.24,.07);
    rod(body,trim,[sign*.11,1.12,.32],[sign*(robe?.17:.18),robe?.32:.69,.32],.018,.5);
    const arm=arms.find(a=>a.userData.hand===sign);arm.position.set(sign*(width-.015),2.18,0);arm.rotation.z=sign*(rogue?.1:.16);
    const span=heavy?.36:knight?.3:rogue?.17:robe?.16:.22;
    taper(arm,black,sign*.13,-.4,0,.105,.11,.63,.95);
    const shoulderPoints=robe?[[sign*-.06,.06],[sign*.13,.2],[sign*.29,.03],[sign*.19,-.35],[sign*.06,-.19]]:[[sign*-.07,.04],[sign*.15,.21],[sign*(span+.1),.12],[sign*(span+.14),-.16],[sign*.13,-.29],[sign*-.08,-.16]];
    const pauldron=panel(arm,steel,shoulderPoints,.02,heavy?.33:robe?.16:.25);
    pauldron.rotation.z=-sign*.13;
    panel(arm,trim,[[sign*-.025,.06],[sign*.16,.18],[sign*(span+.05),.09],[sign*.21,.04]],.19,.035);
    panel(arm,steel,[[sign*.02,-.42],[sign*.25,-.41],[sign*.28,-.78],[sign*.11,-.87],[sign*-.01,-.69]],.04,.2);
    rod(arm,trim,[sign*.015,-.46,.16],[sign*.23,-.46,.16],.019,.5);
    ball(arm,leather,sign*.135,-.92,.07,[.105,.14,.11],.25);
    panel(arm,steel,[[sign*.025,-.83],[sign*.24,-.83],[sign*.21,-1.01],[sign*.065,-1.01]],.15,.03);
    if(heavy||knight)for(let i=0;i<(heavy?2:1);i++)spike(arm,[sign*(.24+i*.12),.1-i*.05,-.02],[sign*(.31+i*.14),.38-i*.04,-.04],.045);
    if(heavy)panel(arm,steel,[[sign*.13,-.16],[sign*.47,-.11],[sign*.47,-.31],[sign*.2,-.42]],.055,.24);
    if(rogue)panel(arm,cloth,[[sign*-.07,-.12],[sign*.2,-.13],[sign*.24,-.55],[sign*.1,-.43],[sign*-.035,-.58]],-.035,.1);
  }
  // A smaller head and shaded, narrow eyes replace round toy eyes.
  head.position.set(0,2.75,0);
  cylinder(body,black,0,2.39,0,.19,.22,10,.2);
  panel(body,steel,[[-.31,2.28],[-.24,2.6],[-.11,2.52],[0,2.43],[.11,2.52],[.24,2.6],[.31,2.28]],.03,.27);
  const skin=new T.Color(d.skin).lerp(new T.Color('#80747b'),.18).getHex();
  if(!closed){
  ball(head,skin,0,-.01,.025,[.285,.36,.27]);
  ball(head,black,0,.16,-.085,[.305,.29,.26]);
  for(const sign of [-1,1]){
    ball(head,skin,sign*.275,-.035,.01,[.055,.095,.045]);
    const brow=box(head,black,sign*.135,.035,.265,[.16,.047,.055]);brow.rotation.z=sign*.13;
    const slit=box(head,eye,sign*.135,-.001,.295,[.111,.026,.026]);slit.material=material(eye,.3,.35);
    const cheek=panel(head,steel,[[sign*.29,.04],[sign*.205,-.1],[sign*.21,-.23],[sign*.29,-.16]],.2,.035);cheek.rotation.y=sign*.25;
  }
  panel(head,skin,[[-.027,-.055],[0,-.16],[.048,-.16],[.021,-.04]],.285,.025);
  rod(head,'#655057',[-.065,-.225,.238],[.065,-.225,.238],.009,.1);
  }
  const hood=['hood','veil','cowl','mask','antler'].includes(helm)&&!heavy;
  if(hood){
    // Open hood: separate side panels leave the face visible from the studio angle.
    ball(head,cloth,0,.16,-.09,[.36,.39,.31]);
    panel(head,cloth,[[-.36,.18],[-.25,.43],[0,.5],[.25,.43],[.36,.18],[.23,.23],[0,.34],[-.23,.23]],.19,.09);
    panel(head,cloth,[[-.28,.23],[0,.36],[.28,.23],[.22,.06],[0,.145],[-.22,.06]],.27,.07);
    for(const sign of [-1,1]){
      panel(head,cloth,[[sign*.25,.3],[sign*.4,.13],[sign*.37,-.3],[sign*.21,-.44],[sign*.26,-.06]],.08,.15);
      rod(head,trim,[sign*.28,.25,.27],[sign*.31,-.29,.26],.013,.4);
    }
  }else if(!closed){
    // Swept hair is made from faceted locks, with a metal brow instead of identical cone bangs.
    const hair=new T.Color(d.hair).lerp(new T.Color('#30303b'),.35).getHex();
    for(let i=0;i<4;i++){
      const lock=crystal(head,hair,-.22+i*.14,.22+(i%2)*.035,.11,[.14,.25,.19],0);lock.rotation.z=.3-i*.06;lock.rotation.x=-.35;
    }
    for(const sign of [-1,1]){const lock=crystal(head,hair,sign*.27,-.05,-.07,[.08,.3,.12],0);lock.rotation.z=-sign*.18;}
    panel(head,steel,[[-.29,.17],[-.2,.31],[0,.23],[.2,.31],[.29,.17],[.21,.1],[0,.16],[-.21,.1]],.25,.07);
    gem(head,0,.22,.34,.045);
  }
  if(closed){
    ball(head,steel,0,.17,-.02,[.325,.32,.29],.6);
    panel(head,black,[[-.29,.06],[0,.1],[.29,.06],[.26,-.065],[0,-.1],[-.26,-.065]],.275,.025);
    for(const sign of [-1,1]){const slit=box(head,eye,sign*.14,.012,.31,[.15,.022,.026]);slit.material=material(eye,.3,.65);}
    panel(head,steel,[[-.27,-.07],[0,-.13],[.27,-.07],[.2,-.3],[0,-.38],[-.2,-.3]],.245,.085);
    panel(head,trim,[[-.035,.14],[.035,.14],[.048,-.29],[0,-.35],[-.048,-.29]],.33,.035);
    for(const sign of [-1,1])for(let i=0;i<2;i++)rod(head,black,[sign*(.09+i*.06),-.15,.323],[sign*(.07+i*.06),-.26,.299],.011,.1);
  }else{
    // A fitted lower faceguard avoids toy-like facial features while retaining a narrow eye opening.
    panel(head,rogue?black:steel,[[-.25,-.055],[0,-.105],[.25,-.055],[.22,-.23],[0,-.35],[-.22,-.23]],.305,.055);
    for(const sign of [-1,1])rod(head,trim,[0,-.25,.355],[sign*.19,-.12,.355],.011,.4);
    if(!rogue)for(const sign of [-1,1])rod(head,black,[sign*.07,-.17,.35],[sign*.06,-.27,.35],.012,.1);
  }
  // Every headpiece has a recognizable outline; crowns are restrained on common heroes.
  if(['antler','horn','dragon','eclipse','crescent'].includes(helm))for(const sign of [-1,1]){
    spike(head,[sign*.23,.22,-.05],[sign*.42,.54,-.11],.045);
    if(helm==='antler'){
      rod(head,trim,[sign*.34,.41,-.07],[sign*.55,.42,-.03],.025,.4);
      rod(head,trim,[sign*.45,.42,-.03],[sign*.52,.62,-.08],.021,.4);
    }
  }
  if(['cathedral','solar','star','void','ice','mitre','winged','ronin'].includes(helm)){
    const count=helm==='ronin'?3:5;
    for(let i=0;i<count;i++){
      const x=(i-(count-1)/2)*.115,height=helm==='mitre'?.29-Math.abs(x)*.4:.18+Math.abs(x)*.35;
      const tip=crystal(head,i%2?steel:trim,x,.38+height*.35,-.015,[.048,height,.065],.04);tip.rotation.z=-x*.5;
    }
    if(helm==='winged')for(const sign of [-1,1])panel(head,trim,[[sign*.26,.21],[sign*.55,.45],[sign*.45,.04],[sign*.29,-.07]],-.02,.045);
  }
  // Class signatures also remain visible from the rear and from combat's elevated camera.
  if(role==='ranger'){
    cylinder(body,leather,-.33,1.86,-.44,.14,.8,8,.2).rotation.z=-.25;
    for(let i=0;i<3;i++){rod(body,trim,[-.43+i*.09,1.83,-.46],[-.55+i*.09,2.67,-.43],.018,.3);crystal(body,cloth,-.55+i*.09,2.64,-.43,[.04,.09,.035],0);}
  }
  if(robe){
    panel(body,cloth,[[-.17,2.32],[0,2.22],[.17,2.32],[.19,1.41],[0,1.33],[-.19,1.41]],.4,.025);
    rod(body,trim,[-.1,2.24,.44],[0,1.6,.45],.014,.5);rod(body,trim,[.1,2.24,.44],[0,1.6,.45],.014,.5);gem(body,0,1.98,.49,.075);
  }else{
    gem(body,0,2.11,.43,heavy?.095:.06);
    const sash=panel(body,cloth,[[-width,2.2],[-width+.11,2.27],[width,1.55],[width-.13,1.48]],.42,.035);sash.rotation.y=-.03;
  }
  if(d.crest==='flame')for(const sign of [-1,1])panel(body,trim,[[sign*.17,1.77],[sign*.25,1.95],[sign*.22,1.72],[sign*.31,1.59],[sign*.15,1.67]],.43,.025);
  if(d.crest==='frost')for(const sign of [-1,1]){const shard=crystal(body,eye,sign*.38,2.3,-.17,[.08,.3,.07],.2);shard.rotation.z=-sign*.35;}
  if(helm==='bastion')panel(head,trim,[[-.055,.28],[.055,.28],[.08,.51],[0,.64],[-.08,.51]],-.025,.055);
  return {legs,capes};
}
