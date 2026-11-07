import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {TimingGuardPrompt,timingGuardMarkup,timingGuardHint} from '../js/timing-guard-ui.mjs';
import {guardBattle} from './timing-guard-helper.mjs';

// DOM/scheduler stubs exercise input and cleanup. They do not render browser/CSS.
function harness(){
  let now=0,id=0;const timers=new Map(),frames=new Map(),roots=[];
  const doc={hidden:false,activeElement:null};
  const element=name=>({name,style:{},handlers:{},isConnected:true,removed:0,attributes:{},focus(){doc.activeElement=this;},addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(k,v){this.attributes[k]=v;},remove(){this.removed++;this.isConnected=false;},closest:()=>null});
  doc.activeElement=element('previous');doc.body={append:root=>roots.push(root)};
  doc.createElement=()=>{const root=element('root');root.parts=Object.fromEntries(['button','skip','ring','cursor','cue'].map(n=>[n,element(n)]));root.querySelector=selector=>root.parts[selector.replace('.guard-','')]||null;return root;};
  const prompt=new TimingGuardPrompt({document:doc,now:()=>now,schedule:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},unschedule:id=>timers.delete(id),frame:fn=>{frames.set(++id,fn);return id;},unframe:id=>frames.delete(id)});
  const event=(type,extra={})=>({type,button:0,isPrimary:true,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra});
  return {doc,prompt,timers,frames,roots,at:t=>now=t,root:()=>roots.at(-1),press(t,extra={}){now=t;const e=event('pointerdown',extra);this.root().parts.button.handlers.pointerdown(e);return e;},key(key,extra={}){const e=event('keydown',{key,target:this.root().parts.button,...extra});this.root().handlers.keydown(e);return e;},frame(t){now=t;const [id,fn]=frames.entries().next().value;frames.delete(id);fn();},deadline(){const [id,job]=timers.entries().next().value;timers.delete(id);job.fn();},click(){this.root().parts.button.handlers.click(event('click'));},skip(){this.root().parts.skip.handlers.click(event('click'));}};
}

for(const [time,grade] of [[100,'miss'],[1220,'guard'],[1335,'perfect'],[1400,'perfect'],[1465,'perfect'],[1580,'guard'],[1581,'miss'],[2100,'miss']])test(`real pointer at ${time}ms yields ${grade} exactly once and clears every callback`,async()=>{
  const h=harness(),previous=h.doc.activeElement,p=h.prompt.play({moveName:'Địa chấn'},['rook']),root=h.root();assert.equal(h.doc.activeElement,root.parts.button);assert.equal(h.prompt.active,true);assert.equal(h.timers.size,1);
  const e=h.press(time);assert.equal(e.prevented,true);assert.equal(e.stopped,true);h.click();h.press(1400);h.prompt.cancel();assert.equal(await p,grade);assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);assert.equal(root.removed,1);assert.equal(h.prompt.active,false);assert.equal(h.doc.activeElement,previous);
});

test('deadline, skipped, hidden, cancelled and escaped attempts all finish as misses',async()=>{
  for(const cancel of [h=>h.deadline(),h=>h.skip(),h=>h.prompt.cancel(),h=>h.key('Escape'),h=>{h.doc.hidden=true;h.frame(1400);},h=>{h.doc.hidden=true;h.press(1400);}]){
    const h=harness(),p=h.prompt.play();cancel(h);assert.equal(await p,'miss');assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);assert.equal(h.root().removed,1);
  }
});

test('keyboard timing is measured at keydown, repeat is ignored and focus remains inside the prompt',async()=>{
  for(const key of [' ','Enter']){
    const h=harness(),p=h.prompt.play();h.at(1400);h.key(key,{repeat:true});assert.equal(h.prompt.active,true);h.key('Tab');assert.equal(h.doc.activeElement,h.root().parts.skip);h.key('Tab',{shiftKey:true});assert.equal(h.doc.activeElement,h.root().parts.button);const ev=h.key(key,{repeat:false});assert.equal(ev.prevented,true);h.click();assert.equal(await p,'perfect');
  }
});

test('secondary touches and mouse buttons do not consume the single valid attempt',async()=>{
  const h=harness(),p=h.prompt.play();h.press(1400,{isPrimary:false});h.press(1400,{button:2});assert.equal(h.prompt.active,true);h.press(1400);assert.equal(await p,'perfect');
});

test('ring, cursor and textual cue use the same monotonic clock as input, even when frames are delayed',async()=>{
  const h=harness(),p=h.prompt.play();h.frame(1400);assert.ok(Math.abs(Number(h.root().parts.ring.style.transform.slice(6,-1))-1)<1e-9);assert.match(h.root().parts.cue.textContent,/Hoàn hảo/);assert.equal(h.root().attributes['data-grade'],'perfect');assert.equal(h.root().parts.cursor.style.left,`${1400/1800*100}%`);h.press(1590);assert.equal(await p,'miss');
});

test('repeated play cannot replace an active attempt and a cancelled attempt can be reopened cleanly',async()=>{
  const h=harness(),first=h.prompt.play();assert.equal(await h.prompt.play(),'miss');assert.equal(h.roots.length,1);h.prompt.cancel();assert.equal(await first,'miss');h.at(10000);const second=h.prompt.play(null,[],{quiet:true});assert.match(h.root().className,/guard-static/);h.press(11400);assert.equal(await second,'perfect');assert.equal(h.roots.length,2);assert.equal(h.timers.size,0);
});

test('unavailable DOM or animation scheduler fails closed as a miss and releases the prompt',async()=>{
  for(const broken of ['dom','frame','append']){
    const h=harness();if(broken==='dom')h.doc.createElement=()=>({querySelector:()=>null});if(broken==='frame')h.prompt.frame=()=>{throw new Error('no animation');};if(broken==='append')h.doc.body.append=()=>{throw new Error('no document');};
    assert.equal(await h.prompt.play(),'miss');assert.equal(h.prompt.active,false);assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);
  }
});

test('guard markup escapes input, exposes accessible controls and explains optional/manual behavior',()=>{
  const markup=timingGuardMarkup({moveName:'<script>'},['rook']);assert.doesNotMatch(markup,/<script>/);assert.match(markup,/&lt;script&gt;/);assert.match(markup,/role="dialog" aria-modal="true"/);assert.match(markup,/aria-describedby="guard-instructions"/);assert.match(markup,/role="status" aria-live="polite"/);assert.match(markup,/Đỡ đòn/);assert.match(markup,/Bỏ qua/);assert.match(markup,/−50%/);assert.match(markup,/15 năng lượng/);
  const s=guardBattle(),before=structuredClone(s);assert.match(timingGuardHint(s.run),/Sẵn sàng/);assert.equal(timingGuardHint(s.run,true),'');assert.equal(timingGuardHint(s.run,false,false),'');assert.deepEqual(s,before);
});

test('preference defaults on, survives unavailable storage and remembers only the device toggle',()=>{
  for(const unavailable of [false,true]){
    const stored=new Map(),ctx=vm.createContext({localStorage:{getItem:k=>{if(unavailable)throw new Error('locked');return stored.get(k);},setItem:(k,v)=>{if(unavailable)throw new Error('locked');stored.set(k,v);}}});
    const source=readFileSync(new URL('../js/timing-guard-ui.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');vm.runInContext(source,ctx);assert.equal(vm.runInContext('timingGuardEnabled()',ctx),true);vm.runInContext('setTimingGuardEnabled(false)',ctx);assert.equal(vm.runInContext('timingGuardEnabled()',ctx),false);if(!unavailable){assert.equal(stored.get('thap-vo-tan-timing-guard'),'off');const restored=vm.createContext({localStorage:{getItem:k=>stored.get(k)}});vm.runInContext(source,restored);assert.equal(vm.runInContext('timingGuardEnabled()',restored),false);}
  }
});
