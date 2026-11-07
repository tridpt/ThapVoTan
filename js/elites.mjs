// Rules are snapshotted only on new normal tower journeys. Old journeys keep their RNG.
export const ELITE_RULES=1;
export const ELITE_FLOOR=10;
export const ELITE_CHANCE=.28;
export const ELITE_TRAITS=Object.freeze({
  rage:Object.freeze({id:'rage',name:'Cuồng nộ',icon:'sword',color:'#ee977e',desc:'Càng mất máu càng mạnh, tối đa +60% sức đánh.',counter:'Dồn sát thương kết liễu hoặc đóng băng khi máu thấp.'}),
  guard:Object.freeze({id:'guard',name:'Hộ vệ',icon:'shield',color:'#8dc5df',desc:'Khởi đầu với khiên bằng 30% máu tối đa. Khi còn sống và còn khiên, đồng bọn nhận ít hơn 35% sát thương.',counter:'Tập trung đánh Hộ vệ để phá khiên trước. Khiên không tái tạo.'}),
  rebirth:Object.freeze({id:'rebirth',name:'Tái sinh',icon:'star',color:'#c1a0e8',desc:'Hồi sinh một lần với 40% máu, xóa thiêu đốt, đóng băng và dấu Hư Không.',counter:'Giữ kỹ năng cho mạng thứ hai. Hạ gục lần đầu chưa tính là tiêu diệt.'})
});
const traits=Object.keys(ELITE_TRAITS);
export const eliteDefinition=e=>ELITE_TRAITS[e?.elite?.trait]||null;
export function eliteEligible(r,node=r?.node,floor=r?.floor){
  return r?.eliteRules===ELITE_RULES&&r.mode==='normal'&&!r.challenge&&!r.dungeon&&!r.campaign&&!r.hunt&&!r.training&&!r.raid&&floor>=ELITE_FLOOR&&['battle','elite'].includes(node);
}
export function assignElite(r,rng){
  if(!eliteEligible(r)||!r.battle?.enemies?.length)return null;
  if(r.node==='battle'&&rng()>=ELITE_CHANCE)return null;
  const enemies=r.battle.enemies.filter(e=>e.kind!=='boss');if(!enemies.length)return null;
  const enemy=enemies[Math.min(enemies.length-1,Math.floor(rng()*enemies.length))],trait=traits[Math.min(traits.length-1,Math.floor(rng()*traits.length))];
  enemy.elite={trait,revived:false};
  enemy.maxHp=Math.round(enemy.maxHp*1.25);enemy.hp=enemy.maxHp;enemy.atk=Math.round(enemy.atk*1.12);enemy.def+=2;
  if(trait==='guard')enemy.shield=Math.round(enemy.maxHp*.3);
  return enemy;
}
export function eliteAttackMultiplier(e){return e?.elite?.trait==='rage'?1+(1-e.hp/e.maxHp)*.6:1;}
export function activeEliteGuard(r,target=null){
  return r?.battle?.enemies?.find(e=>e.hp>0&&e.shield>0&&e.elite?.trait==='guard'&&(!target||e.id!==target.id))||null;
}
export function autoEnemyTarget(r){
  const alive=r?.battle?.enemies?.filter(e=>e.hp>0)||[],guard=activeEliteGuard(r);
  return (alive.length>1&&guard)||alive.sort((a,b)=>a.hp-b.hp)[0]||null;
}
export function reviveElite(e){
  if(e.hp>0||e.deathHandled||e.elite?.trait!=='rebirth'||e.elite.revived)return null;
  e.elite.revived=true;e.hp=Math.max(1,Math.round(e.maxHp*.4));e.shield=0;e.burn=0;e.burnPower=0;e.burnSource=null;e.freeze=0;
  if(Object.hasOwn(e,'voidMarks'))e.voidMarks=0;
  return {target:e.id,value:e.hp,heal:true,eliteRevive:true};
}
export function eliteReward(r){
  const enemy=r?.battle?.enemies?.find(e=>eliteDefinition(e));
  return enemy?{trait:enemy.elite.trait,gold:80+r.floor*4,dust:3+Math.floor(r.floor/10)}:null;
}
export function validateElites(s){
  const r=s.run;if(!r)return;
  const fail=()=>{throw new Error('Đặc tính quái tinh anh không hợp lệ.');};
  if(Object.hasOwn(r,'eliteRules')&&(r.eliteRules!==ELITE_RULES||r.mode!=='normal'||r.challenge||r.dungeon||r.campaign||r.hunt||r.training||r.raid))fail();
  const enemies=r.battle?.enemies||[],tagged=enemies.filter(e=>Object.hasOwn(e,'elite'));
  if(tagged.length>1)fail();
  for(const e of tagged){
    const t=e.elite;
    if(!eliteEligible(r)||!['sentinel','wraith'].includes(e.kind)||!t||Array.isArray(t)||Object.keys(t).length!==2||!Object.hasOwn(ELITE_TRAITS,t.trait)||typeof t.revived!=='boolean'||(t.trait!=='rebirth'&&t.revived)||!Number.isSafeInteger(e.maxHp)||e.maxHp<1||!Number.isSafeInteger(e.hp)||e.hp<0||e.hp>e.maxHp||!Number.isSafeInteger(e.shield)||e.shield<0||typeof e.deathHandled!=='boolean'||(e.hp>0&&e.deathHandled)||(e.hp===0&&!e.deathHandled)||(t.trait==='rebirth'&&e.deathHandled&&!t.revived)||(t.trait==='guard'?e.shield>Math.round(e.maxHp*.3):e.shield!==0))fail();
  }
  const bonus=r.lastReward?.eliteBonus;
  if(Object.hasOwn(r.lastReward||{},'eliteBonus')){
    const expected=eliteReward(r);
    if(!tagged.length||!bonus||Array.isArray(bonus)||Object.keys(bonus).length!==3||!expected||['trait','gold','dust'].some(k=>bonus[k]!==expected[k])||!r.victory||enemies.some(e=>e.hp!==0||!e.deathHandled)||r.lastReward.gold<bonus.gold||!r.lastReward.loot)fail();
  }else if(tagged.length&&r.victory)fail();
}
