import {HERO} from './data.mjs';
export {BOND_LORE} from './bonds-data.mjs';

export const BOND_MILESTONES=Object.freeze([
  Object.freeze({xp:40,name:'Gặp gỡ'}),Object.freeze({xp:120,name:'Tin cậy'}),
  Object.freeze({xp:260,name:'Đồng hành'}),Object.freeze({xp:480,name:'Tri kỷ'}),Object.freeze({xp:800,name:'Thệ ước'})
]);
export const BOND_GIFT=Object.freeze({name:'Hoa hồng tro',cost:80,xp:20});
export const BOND_MAX=800;
export const starterBonds=()=>({});
const hasHero=(s,id)=>!!s?.owned&&typeof id==='string'&&Object.hasOwn(HERO,id)&&Object.hasOwn(s.owned,id);
const entry=(s,id)=>s?.bonds?.[id]||{xp:0,adorned:false};
const level=xp=>BOND_MILESTONES.filter(m=>xp>=m.xp).length;

export function validateBonds(s){
  if(!s.bonds||typeof s.bonds!=='object'||Array.isArray(s.bonds))throw new Error('Dữ liệu thân thiết không hợp lệ.');
  for(const [id,p] of Object.entries(s.bonds)){
    if(!hasHero(s,id)||!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==2||!Object.hasOwn(p,'xp')||!Object.hasOwn(p,'adorned')||!Number.isSafeInteger(p.xp)||p.xp<0||p.xp>BOND_MAX||typeof p.adorned!=='boolean'||p.adorned&&p.xp!==BOND_MAX)throw new Error('Tiến trình thân thiết không hợp lệ.');
  }
}
export function bondStatus(s,id){
  if(typeof id!=='string'||!Object.hasOwn(HERO,id))throw new Error('Anh hùng không tồn tại.');
  const p=entry(s,id),rank=level(p.xp),next=BOND_MILESTONES[rank]||null,previous=BOND_MILESTONES[rank-1]?.xp||0;
  return {owned:hasHero(s,id),xp:p.xp,rank,name:BOND_MILESTONES[rank-1]?.name||'Chưa gắn bó',next,progress:next?(p.xp-previous)/(next.xp-previous):1,maxed:p.xp===BOND_MAX,adorned:p.adorned};
}
export const bondAdorned=(s,id)=>hasHero(s,id)&&entry(s,id).xp===BOND_MAX&&entry(s,id).adorned;
export function bondGiftReceipt(s,id){return JSON.stringify([id,s.gold,s.owned[id],s.bonds?.[id]||null,!!s.run?.training]);}
export function bondGiftPreview(s,id){
  const status=bondStatus(s,id),gain=Math.min(BOND_GIFT.xp,BOND_MAX-status.xp);
  const blocked=!status.owned?'Bạn chưa sở hữu anh hùng này.':s.run?.training?'Không thể tặng quà trong Phòng thử.':status.maxed?'Đã đạt thân thiết tối đa.':null;
  return {...status,gain,cost:BOND_GIFT.cost,blocked,affordable:Number.isSafeInteger(s.gold)&&s.gold>=BOND_GIFT.cost,receipt:bondGiftReceipt(s,id)};
}
export function giveBondGift(s,id,receipt){
  validateBonds(s);const p=bondGiftPreview(s,id);
  if(p.blocked)throw new Error(p.blocked);
  if(typeof receipt!=='string'||receipt!==p.receipt)throw new Error('Quà hoặc tài nguyên đã thay đổi. Hãy mở lại thân thiết.');
  if(!p.affordable||s.gold>1e9)throw new Error('Chưa đủ vàng để tặng quà.');
  s.gold-=p.cost;s.bonds[id]={xp:p.xp+p.gain,adorned:false};
  return {gain:p.gain,cost:p.cost,rank:level(p.xp+p.gain),rankUp:level(p.xp+p.gain)>p.rank};
}
export function setBondAdornment(s,id,enabled){
  validateBonds(s);
  if(s.run?.training)throw new Error('Không thể đổi thân thiết trong Phòng thử.');
  if(!hasHero(s,id))throw new Error('Bạn chưa sở hữu anh hùng này.');
  if(typeof enabled!=='boolean')throw new Error('Ngoại hình thân thiết không hợp lệ.');
  const p=entry(s,id);if(enabled&&p.xp!==BOND_MAX)throw new Error('Cần đạt mốc Thệ ước để mở ngoại hình.');
  if(p.adorned===enabled)return false;s.bonds[id]={xp:p.xp,adorned:enabled};return true;
}
// Called only after the engine commits a real victory; it never reads combat RNG.
export function recordBondVictory(s){
  const r=s.run;if(!r||r.training)return;
  const gain=r.node==='boss'?8:4;
  for(const h of r.heroes){const p=entry(s,h.id);if(hasHero(s,h.id)&&p.xp<BOND_MAX)s.bonds[h.id]={xp:Math.min(BOND_MAX,p.xp+gain),adorned:p.adorned};}
}
