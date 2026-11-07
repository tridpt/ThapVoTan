import {HERO,HEROES,RARITIES,RARITY} from './data.mjs';

export const HERO_EXCHANGE_COST = Object.freeze({R:25,SR:100,SSR:300,UR:600,LR:1000,MR:1800,EX:3000});
export const starterSummoning = ()=>({target:null,guaranteed:Object.fromEntries(RARITIES.map(r=>[r,false])),exchanged:[]});
const record = v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exactKeys = (v,keys)=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const validHero = id=>typeof id==='string'&&Object.hasOwn(HERO,id);

export function validateSummoning(s){
  const v=s.summoning;
  if(!Object.hasOwn(s,'summoning')||!exactKeys(v,['target','guaranteed','exchanged'])||!(v.target===null||validHero(v.target))||!exactKeys(v.guaranteed,RARITIES)||RARITIES.some(r=>typeof v.guaranteed[r]!=='boolean')||!Array.isArray(v.exchanged)||v.exchanged.length>HEROES.length||new Set(v.exchanged).size!==v.exchanged.length||v.exchanged.some(id=>!validHero(id)||!Object.hasOwn(s.owned,id)))throw new Error('Tiến độ triệu hồi định hướng không hợp lệ.');
}

export function setSummonTarget(s,id){
  validateSummoning(s);
  if(id!==null&&!validHero(id))throw new Error('Mục tiêu triệu hồi không hợp lệ.');
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để chọn mục tiêu.');
  s.summoning.target=id;
}

export function summonFocusStatus(s){
  const h=HERO[s.summoning.target];
  if(!h)return null;
  const pool=HEROES.filter(other=>other.rarity===h.rarity),guaranteed=s.summoning.guaranteed[h.rarity];
  return {hero:h,guaranteed,poolSize:pool.length,conditionalRate:guaranteed?100:100/pool.length,baseRate:RARITY[h.rarity].rate/pool.length};
}

// Resolve identity only after the existing rarity/pity roll. Always consume the
// original two RNG calls, including a guaranteed hit, to preserve draw sequences.
export function resolveSummonTarget(s,natural){
  const target=HERO[s.summoning.target];
  if(!target||target.rarity!==natural.rarity)return {hero:natural,focus:null};
  const promised=s.summoning.guaranteed[target.rarity],hero=promised?target:natural;
  const outcome=promised?'guaranteed':hero.id===target.id?'hit':'miss';
  s.summoning.guaranteed[target.rarity]=outcome==='miss';
  return {hero,focus:{id:target.id,outcome}};
}

export function heroExchangeCost(id){
  if(!validHero(id))throw new Error('Anh hùng đổi không hợp lệ.');
  return HERO_EXCHANGE_COST[HERO[id].rarity];
}

export function exchangeHero(s,id,quotedCost){
  validateSummoning(s);
  const cost=heroExchangeCost(id);
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để đổi anh hùng.');
  if(quotedCost!==cost)throw new Error('Giá đổi đã thay đổi. Hãy mở lại xác nhận.');
  if(Object.hasOwn(s.owned,id))throw new Error('Bạn đã sở hữu anh hùng này. Chỉ đổi tướng còn thiếu.');
  if(!Number.isSafeInteger(s.shards)||s.shards<cost)throw new Error(`Cần ${cost.toLocaleString('vi-VN')} tinh thạch để đổi anh hùng này.`);
  s.shards-=cost;
  s.owned[id]={level:1,copies:0,awaken:0};
  s.summoning.exchanged.push(id);
  return {id,cost};
}
