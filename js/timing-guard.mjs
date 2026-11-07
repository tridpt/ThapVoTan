import {bossThreat} from './boss-parts.mjs';

// Input happens before enemy-turn resolution. This clock never consumes combat RNG.
export const GUARD_TIMING=Object.freeze({duration:1800,target:1400,window:180,perfect:65});
export const GUARD_REDUCTION=.5;
export const GUARD_ENERGY=15;
export function timingGuardGrade(elapsed){
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>GUARD_TIMING.duration)return 'miss';
  const distance=Math.abs(elapsed-GUARD_TIMING.target);
  return distance<=GUARD_TIMING.perfect?'perfect':distance<=GUARD_TIMING.window?'guard':'miss';
}
export function timingGuardThreat(r){
  const threat=bossThreat(r),bs=r?.battle?.bossState;
  if(!threat||threat.kind!=='attack'||bs.move==='strike'||!threat.targets.length)return null;
  return {boss:bs.id,move:bs.move,targets:[...threat.targets]};
}
const receiptKeys=['rules','round','boss','move'];
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const same=(a,b)=>receiptKeys.every(k=>a[k]===b[k]);
export const timingGuardPending=r=>!!r?.battle&&Object.hasOwn(r.battle,'timingGuard');
export function assertTimingGuardIdle(r){if(timingGuardPending(r))throw new Error('Đòn boss đang chờ kết quả đỡ đòn.');}
export function beginTimingGuard(s){
  const r=s.run;assertTimingGuardIdle(r);
  const threat=timingGuardThreat(r);if(!threat)return null;
  const receipt={rules:1,round:r.battle.round,boss:threat.boss,move:threat.move};
  r.battle.timingGuard={...receipt};return receipt;
}
export function validateTimingGuard(s){
  const r=s.run;if(!timingGuardPending(r))return;
  const b=r.battle,p=b.timingGuard,threat=timingGuardThreat(r);
  if(!record(p)||Object.keys(p).length!==receiptKeys.length||!receiptKeys.every(k=>Object.hasOwn(p,k))||p.rules!==1||p.round!==b.round||!threat||p.boss!==threat.boss||p.move!==threat.move)throw new Error('Lượt đỡ đòn đang chờ không hợp lệ.');
}
// A missing result (reload, background, Back or skip) always resolves as a miss.
export function consumeTimingGuard(s,result=null){
  const r=s.run,p=r?.battle?.timingGuard;
  validateTimingGuard(s);
  if(result!==null&&(!record(result)||Object.keys(result).length!==5||!receiptKeys.every(k=>Object.hasOwn(result,k))||!Object.hasOwn(result,'grade')||!['miss','guard','perfect'].includes(result.grade)||!p||!same(p,result)))throw new Error('Kết quả đỡ đòn đã hết hạn hoặc không hợp lệ.');
  if(!p)return null;
  delete r.battle.timingGuard;
  return result&&result.grade!=='miss'?{boss:p.boss,move:p.move,grade:result.grade}:null;
}
