import {GEAR_RARITY} from './data.mjs';
import {gearOwner,gearLocked} from './equipment.mjs';

const LIMIT=1e9;
const weights={atk:2,maxHp:10,def:1,crit:1,drain:.7,energy:1};
const goldCosts=[80,140,220,340,500,720,1000],dustCosts=[2,3,5,8,12,18,26];
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const itemStamp=g=>JSON.stringify([g.id,g.base,g.rarity,g.level,g.quality,g.affixes.map(a=>[a.stat,a.value])]);
function selection(s,id,line){
  const g=s.inventory.find(g=>g.id===id);
  if(!g)throw new Error('Trang bị này không còn trong kho.');
  if(!integer(line,0,g.affixes.length-1))throw new Error('Dòng tẩy luyện không hợp lệ.');
  return g;
}
function notTraining(s){if(s.run?.training)throw new Error('Không thể tẩy luyện trong Phòng thử.');}
export function starterRefining(){return {rolls:0,pending:null};}
export function gearRefiningRange(g,line){
  if(!integer(line,0,g.affixes.length-1))throw new Error('Dòng tẩy luyện không hợp lệ.');
  const stat=g.affixes[line].stat,scale=weights[stat]*GEAR_RARITY[g.rarity].scale;
  const cap=['crit','drain','energy'].includes(stat)?20:Object.keys(GEAR_RARITY).indexOf(g.rarity)>=3?1000:100;
  return {min:Math.max(1,Math.min(cap,Math.round(scale*.7))),max:Math.max(1,Math.min(cap,Math.round(scale*2)))};
}
export function gearRefiningCost(g){const rank=Object.keys(GEAR_RARITY).indexOf(g.rarity);return {gold:goldCosts[rank],dust:dustCosts[rank]};}
export function validateRefining(s){
  const r=s.refining;
  if(!exact(r,['rolls','pending'])||!integer(r.rolls,0,LIMIT))throw new Error('Dữ liệu tẩy luyện không hợp lệ.');
  const p=r.pending;if(p===null)return;
  if(!exact(p,['id','line','stat','oldValue','newValue','roll','itemStamp'])||typeof p.id!=='string'||!integer(p.roll,1,LIMIT)||p.roll!==r.rolls)throw new Error('Kết quả tẩy luyện không hợp lệ.');
  const g=selection(s,p.id,p.line),a=g.affixes[p.line],range=gearRefiningRange(g,p.line);
  if(p.stat!==a.stat||p.oldValue!==a.value||!integer(p.newValue,range.min,range.max)||p.itemStamp!==itemStamp(g))throw new Error('Kết quả tẩy luyện không khớp trang bị.');
}
export function refiningReceipt(s,id,line){
  const g=selection(s,id,line);
  // Account-only inputs cover the displayed owner, stats, price and paid result.
  // Combat state and its RNG are deliberately not part of this transaction.
  return JSON.stringify([id,line,itemStamp(g),s.refining,s.gold,s.dust,s.lockedGear,s.equipped,s.inventory,s.owned,s.meta,s.talents,!!s.run?.training]);
}
export function previewGearRefining(s,id,line=0){
  const g=selection(s,id,line),locked=gearLocked(s,id),cost=gearRefiningCost(g),range=gearRefiningRange(g,line);
  const blocked=s.run?.training?'Không thể tẩy luyện trong Phòng thử.':s.refining.pending?'Hãy chọn giữ cũ hoặc nhận mới cho lượt đang chờ.':locked?'Mở khóa trang bị trước khi tẩy luyện.':s.refining.rolls>=LIMIT?'Đã đạt giới hạn lượt tẩy luyện.':null;
  return {id,line,stat:g.affixes[line].stat,current:g.affixes[line].value,range,cost,owner:gearOwner(s,id),locked,blocked,affordable:s.gold>=cost.gold&&s.dust>=cost.dust,stamp:refiningReceipt(s,id,line)};
}
function checkReceipt(s,id,line,expected){
  if(typeof expected!=='string'||expected!==refiningReceipt(s,id,line))throw new Error('Trang bị hoặc bảng so sánh đã thay đổi. Hãy mở lại tẩy luyện.');
}
export function rollGearRefining(s,id,line,expected,rng=Math.random){
  notTraining(s);validateRefining(s);const plan=previewGearRefining(s,id,line);
  checkReceipt(s,id,line,expected);
  if(plan.blocked)throw new Error(plan.blocked);
  if(!plan.affordable)throw new Error('Chưa đủ vàng hoặc bụi rèn để tẩy luyện.');
  // Only a paid action draws randomness; inspection never samples a result.
  const draw=rng();if(!Number.isFinite(draw)||draw<0||draw>=1)throw new Error('Lượt tẩy luyện không hợp lệ.');
  const g=selection(s,id,line),p={id,line,stat:plan.stat,oldValue:plan.current,newValue:plan.range.min+Math.floor(draw*(plan.range.max-plan.range.min+1)),roll:s.refining.rolls+1,itemStamp:itemStamp(g)};
  s.gold-=plan.cost.gold;s.dust-=plan.cost.dust;s.refining.rolls++;s.refining.pending=p;
  return structuredClone(p);
}
export function resolveGearRefining(s,id,choice,expected){
  notTraining(s);validateRefining(s);const p=s.refining.pending;
  if(!p||p.id!==id||!['old','new'].includes(choice))throw new Error('Không có kết quả tẩy luyện để chọn.');
  checkReceipt(s,id,p.line,expected);
  if(choice==='new'&&gearLocked(s,id))throw new Error('Mở khóa trang bị trước khi nhận chỉ số mới.');
  if(choice==='new')selection(s,id,p.line).affixes[p.line].value=p.newValue;
  s.refining.pending=null;return {...p,choice};
}
