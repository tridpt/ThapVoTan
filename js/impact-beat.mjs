// A brief presentation hold at contact. Recovery catches up smoothly by the original action end.
// This clock never delays input, consumes gameplay RNG or changes combat state.
export function createImpactBeat(time,timing,events,{speed=1,reducedMotion=false,finisher=false,heavy=false}={}){
  const damage=events.filter(e=>!e.heal&&!e.shieldGrant&&(e.value>0||e.shield>0));
  if(reducedMotion||!damage.length||!Number.isFinite(time)||!Number.isFinite(timing.duration)||!Number.isFinite(timing.impact)||timing.impact<=0||timing.impact>=timing.duration)return null;
  const ms=finisher?70:damage.some(e=>e.part?.broken)?60:damage.some(e=>e.crit)?55:heavy?28:0;
  const hold=Math.min(ms/(speed===2?2:1),(timing.duration-timing.impact)*.22)/1000;
  return hold>0?{impact:time+timing.impact/1000,end:time+timing.duration/1000,hold}:null;
}
export function impactBeatTime(beat,time){
  if(!beat||time<=beat.impact||time>=beat.end)return time;
  const after=time-beat.impact;if(after<=beat.hold)return beat.impact;
  const p=(after-beat.hold)/(beat.end-beat.impact-beat.hold);
  return time-beat.hold*(1-p*p*(3-2*p));
}
