export const TOWER_BALANCE_RULES=1;
const normal=r=>r?.mode==='normal'&&!r.challenge&&!r.campaign&&!r.dungeon&&!r.hunt&&!r.training&&!r.raid&&!r.season;
export const balancedTower=r=>r?.balanceRules===TOWER_BALANCE_RULES&&normal(r);
export function towerScale(r,floor){
  const legacy=1+(floor-1)*.155+Math.floor(floor/10)*.14;
  return balancedTower(r)&&floor<=20?1+(floor-1)*.155+(floor-1)*.014:legacy;
}
export function towerEnemyProfile(r,index){
  if(!balancedTower(r)||r.floor>20)return {hp:1,attack:1};
  if(r.node==='boss'){
    const t=Math.max(0,Math.min(1,(r.floor-5)/15));return {hp:.9+.1*t,attack:.85+.15*t};
  }
  // The third enemy enters gradually instead of adding a full extra attacker at floor 3.
  if(index===2&&r.floor<=4)return r.floor===3?{hp:.55,attack:.5}:{hp:.8,attack:.75};
  return {hp:1,attack:1};
}
export const towerGoldBonus=r=>balancedTower(r)?Math.max(0,Math.round(35*(25-r.floor)/24)):0;
export function heroUpgradePrice(level){
  const legacy=Math.round(90*Math.pow(level,1.35));
  const factor=level<=10?.6:level<20?.6+(level-10)*.04:1;
  return Math.round(legacy*factor);
}
export function validateBalance(s){
  if(Object.hasOwn(s.run||{},'balanceRules')&&(!balancedTower(s.run)))throw new Error('Luật cân bằng tháp không hợp lệ.');
}
