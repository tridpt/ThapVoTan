const KEY='thap-vo-tan-haptics';let enabled=true,last=-Infinity;
try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
export const hapticsEnabled=()=>enabled;
export function setHapticsEnabled(value){enabled=!!value;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}}
export function battleHaptic(events,heroes=[]){
  if(!enabled||document.hidden)return false;
  const guarded=events.some(e=>e.timingGuard||e.counter),broken=events.some(e=>e.part?.broken),heavy=events.some(e=>!e.heal&&e.value>0&&(e.crit||heroes.some(h=>h.id===e.target&&e.value>=h.maxHp*.2)));
  if(!guarded&&!broken&&!heavy)return false;const now=performance.now();if(now-last<120)return false;
  try{if(typeof window.AndroidSave?.haptic==='function')window.AndroidSave.haptic(broken);else if(typeof navigator!=='undefined'&&typeof navigator.vibrate==='function')navigator.vibrate(broken?28:12);else return false;last=now;return true;}catch{return false;}
}
