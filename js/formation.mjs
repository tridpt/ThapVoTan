export const COVER_REDUCTION=.15;
export const starterFormation=()=>({front:1});
export const validFormation=f=>f!==null&&typeof f==='object'&&!Array.isArray(f)&&Object.keys(f).length===1&&[1,2].includes(f.front);
export function formationBlocker(s){return s.run&&s.run.phase!=='result'?'Hoàn thành hoặc rời chuyến đang chơi để đổi hàng.':null;}
export function setFormation(s,front){
  if(!validFormation({front}))throw new Error('Bố trí đội hình không hợp lệ.');
  const blocked=formationBlocker(s);if(blocked)throw new Error(blocked);
  s.formation={front};return {...s.formation};
}
export function swapFormationSlots(s,first,second){
  if(![first,second].every(i=>Number.isInteger(i)&&i>=0&&i<3)||first===second)throw new Error('Vị trí đổi hàng không hợp lệ.');
  const blocked=formationBlocker(s);if(blocked)throw new Error(blocked);
  [s.team[first],s.team[second]]=[s.team[second],s.team[first]];
}
export function heroRow(run,id){
  if(!run?.formation)return null;
  const i=run.heroes.findIndex(h=>h.id===id);return i<0?null:i<run.formation.front?'front':'back';
}
export function rowMembers(run,row){return run.heroes.filter(h=>h.hp>0&&heroRow(run,h.id)===row);}
export function enemyPierces(run,enemy){
  if(!run?.formation)return false;
  const bs=run.battle?.bossState;
  return enemy.kind==='wraith'&&enemy.intent===2||enemy.kind==='boss'&&((bs?.id==='cinderwyrm'&&bs.move==='signature')||(bs?.id==='ashknight'&&bs.move==='siphon'));
}
export function formationTarget(run,enemy,piercing=enemyPierces(run,enemy)){
  const alive=run.heroes.filter(h=>h.hp>0);if(!alive.length)return null;
  if(!run.formation)return run.heroes[enemy.intent]?.hp>0?run.heroes[enemy.intent]:alive[0];
  const preferred=rowMembers(run,piercing?'back':'front'),candidates=preferred.length?preferred:alive;
  return candidates[enemy.intent%candidates.length];
}
export function coverMultiplier(run,target,piercing=false){return !piercing&&heroRow(run,target.id)==='back'&&rowMembers(run,'front').length?1-COVER_REDUCTION:1;}
export function formationPosition(run,index){
  if(!run.formation)return {x:(index-1)*3.4,z:3.45};
  const front=index<run.formation.front,count=front?run.formation.front:3-run.formation.front,i=front?index:index-run.formation.front;
  return {x:(i-(count-1)/2)*(front?3.6:5.2),z:front?1.85:4.6};
}
export function validateFormation(s){
  if(!validFormation(s.formation)||(s.run&&s.run.formation!==null&&!validFormation(s.run.formation)))throw new Error('Bố trí hàng trước/sau không hợp lệ.');
}
