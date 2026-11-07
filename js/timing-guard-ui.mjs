import {HERO} from './data.mjs';
import {icon} from './art.mjs';
import {GUARD_TIMING,timingGuardGrade,timingGuardThreat} from './timing-guard.mjs';

const KEY='thap-vo-tan-timing-guard';let enabled=true;
try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
export const timingGuardEnabled=()=>enabled;
export function setTimingGuardEnabled(value){enabled=!!value;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}}
export function timingGuardSettings(value=enabled){return `<div class="setting-row"><span>${icon('shield',20)} Đỡ đòn đúng nhịp</span><button class="toggle ${value?'on':''}" data-action="timing-guard-setting" role="switch" aria-checked="${value}" aria-label="Đỡ đòn đúng nhịp"><i></i></button></div><p class="cinematics-hint">Đỡ chiêu mạnh của boss để giảm 50% sát thương. Hoàn hảo: +15 năng lượng cho tướng còn sống được đỡ và một cơ hội Phản công ở lượt kế nếu trận còn tiếp diễn. Auto bỏ qua đỡ đòn; nhịp đỡ giữ nguyên ở 1× / 2×.</p>`;}
export function timingGuardHint(r,auto=false,value=enabled){
  if(!value||auto||!timingGuardThreat(r))return '';
  return `<div class="timing-guard-hint" role="status">${icon('shield',18)}<span><strong>Sẵn sàng đỡ chiêu</strong> Khi kết thúc lượt, chạm Đỡ đòn lúc vòng sáng vào vùng vàng · giảm 50% sát thương của chiêu boss.</span></div>`;
}
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function timingGuardMarkup(info,targets=[]){
  const {duration,target,window,perfect}=GUARD_TIMING;
  return `<section class="timing-guard-overlay" role="dialog" aria-modal="true" aria-labelledby="guard-heading" aria-describedby="guard-instructions"><div class="timing-guard-card"><span class="guard-kicker">BOSS SẮP RA ĐÒN</span><h2 id="guard-heading">${esc(info?.moveName||'Chiêu mạnh')}</h2><p class="guard-targets">${targets.map(id=>esc(HERO[id]?.name||id)).join(' · ')}</p><div class="guard-dial" aria-hidden="true"><i class="guard-rune"></i><i class="guard-ring"></i><span class="guard-emblem">${icon('shield',52)}</span></div><p id="guard-instructions">Chạm khi vạch sáng vào vùng vàng.<br><b>Đúng nhịp −50% sát thương · Hoàn hảo +15 năng lượng và Phản công</b></p><div class="guard-timing-track" aria-hidden="true"><i class="guard-window" style="left:${(target-window)/duration*100}%;width:${window*2/duration*100}%"></i><i class="guard-perfect" style="left:${(target-perfect)/duration*100}%;width:${perfect*2/duration*100}%"></i><i class="guard-cursor"></i></div><p class="guard-cue" role="status" aria-live="polite">Chờ vòng sáng…</p><button class="guard-button" type="button">${icon('shield',23)} Đỡ đòn</button><button class="guard-skip" type="button">Bỏ qua</button><small>Một lần chạm · Nhịp đỡ giữ nguyên ở 1× / 2×</small></div></section>`;
}
// A single terminal input. Presentation can be skipped without replaying the queued turn.
export class TimingGuardPrompt{
  constructor({document=globalThis.document,now=()=>performance.now(),schedule=setTimeout,unschedule=clearTimeout,frame=fn=>requestAnimationFrame(fn),unframe=id=>cancelAnimationFrame(id)}={}){
    Object.assign(this,{document,now,schedule,unschedule,frame,unframe});this.current=null;
  }
  get active(){return !!this.current;}
  cancel(){this.current?.finish('miss');}
  play(info,targets=[],{quiet=false}={}){
    if(this.active)return Promise.resolve('miss');
    const doc=this.document,root=doc.createElement('div');root.className='guard-prompt-root'+(quiet?' guard-static':'');root.innerHTML=timingGuardMarkup(info,targets);
    const button=root.querySelector('.guard-button'),skip=root.querySelector('.guard-skip'),ring=root.querySelector('.guard-ring'),cursor=root.querySelector('.guard-cursor'),cue=root.querySelector('.guard-cue');
    if(!button||!skip||!ring||!cursor||!cue)return Promise.resolve('miss');
    let resolve;const promise=new Promise(r=>resolve=r),token={root,timer:null,frame:null,done:false};this.current=token;
    const previous=doc.activeElement;
    const finish=grade=>{
      if(token.done)return;token.done=true;this.unschedule(token.timer);this.unframe(token.frame);root.remove();this.current=null;
      if(previous?.isConnected&&!previous.closest?.('[inert]'))previous.focus();resolve(grade);
    };
    token.finish=finish;
    try{
      doc.body.append(root);button.focus();const start=this.now();let lastCue='';
      const press=event=>{
        if(event.type==='pointerdown'&&(event.isPrimary===false||event.button!==0))return;
        event.preventDefault();event.stopPropagation();if(!token.done)finish(doc.hidden?'miss':timingGuardGrade(this.now()-start));
      };
      button.addEventListener('pointerdown',press);button.addEventListener('click',press);
      skip.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();finish('miss');});
      root.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finish('miss');}
        else if((event.key===' '||event.key==='Enter')&&event.target===button){event.preventDefault();event.stopPropagation();if(!event.repeat)press(event);}
        else if(event.key==='Tab'){event.preventDefault();(doc.activeElement===button?skip:button).focus();}
      });
      const update=()=>{
        if(token.done)return;
        if(doc.hidden){finish('miss');return;}
        const elapsed=Math.max(0,this.now()-start),progress=Math.min(1,elapsed/GUARD_TIMING.duration),grade=timingGuardGrade(elapsed);
        ring.style.transform=`scale(${1.9-.9*elapsed/GUARD_TIMING.target})`;cursor.style.left=`${progress*100}%`;
        const text=grade==='perfect'?'Hoàn hảo — chạm ngay!':grade==='guard'?'Đỡ ngay!':elapsed>GUARD_TIMING.target+GUARD_TIMING.window?'Đã qua nhịp':'Chờ vòng sáng…';
        if(text!==lastCue){cue.textContent=text;lastCue=text;root.setAttribute('data-grade',grade);}
        if(elapsed>=GUARD_TIMING.duration){finish('miss');return;}
        token.frame=this.frame(update);
      };
      token.timer=this.schedule(()=>finish('miss'),GUARD_TIMING.duration);update();
    }catch{finish('miss');}
    return promise;
  }
}
