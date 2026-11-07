import {assertTimingGuardIdle,timingGuardPending} from './timing-guard.mjs';

export const COUNTER_POWER=1.5;
const keys=['rules','round','boss','stamp'];
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const same=(a,b)=>record(a)&&record(b)&&keys.every(k=>a[k]===b[k]);
const liveBattle=r=>r?.phase==='battle'&&r.node==='boss'&&r.battle?.bossState&&r.battle.enemies[0]?.kind==='boss'&&r.battle.enemies[0].hp>0&&r.heroes.some(h=>h.hp>0);

export function counterOpportunity(r){
  const p=r?.battle?.counter;
  return liveBattle(r)&&!timingGuardPending(r)&&p?.rules===1&&p.round===r.battle.round&&p.boss===r.battle.bossState.id?{...p}:null;
}
// Grant after the entire enemy turn, never from a perfect input alone. No extra RNG.
export function grantCounter(r,events){
  if(!liveBattle(r)||!events.some(e=>e.timingGuard?.grade==='perfect'&&e.timingGuard.prevented>0))return;
  r.battle.counter={rules:1,round:r.battle.round,boss:r.battle.bossState.id,stamp:r.seed};
}
export function expireCounter(r){if(r?.battle)delete r.battle.counter;}
export function consumeCounter(r,receipt){
  assertTimingGuardIdle(r);
  const p=counterOpportunity(r);
  if(!p||!record(receipt)||Object.keys(receipt).length!==keys.length||!keys.every(k=>Object.hasOwn(receipt,k))||!same(p,receipt))throw new Error('Cơ hội phản công đã dùng hoặc hết hạn.');
  expireCounter(r);
}
export function validateCounter(s){
  const r=s.run,b=r?.battle;if(!b||!Object.hasOwn(b,'counter'))return;
  const p=b.counter;
  if(!liveBattle(r)||!record(p)||Object.keys(p).length!==keys.length||!keys.every(k=>Object.hasOwn(p,k))||p.rules!==1||p.round!==b.round||!Number.isSafeInteger(p.round)||p.round<2||p.boss!==b.bossState.id||!Number.isSafeInteger(p.stamp)||p.stamp<0||p.stamp>4294967295)throw new Error('Cơ hội phản công trong bản lưu không hợp lệ.');
}
