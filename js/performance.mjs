// Device-only choices: exported saves keep their existing, strict graphics schema.
const KEYS={automatic:'thap-vo-tan-auto-performance',showFps:'thap-vo-tan-show-fps',batterySaver:'thap-vo-tan-battery-saver'};
export function readPerformanceSettings(storage){
  const settings={automatic:true,showFps:false,batterySaver:false};
  if(storage===undefined)try{storage=globalThis.localStorage;}catch{return settings;}
  for(const key of Object.keys(KEYS))try{const value=storage?.getItem(KEYS[key]);if(value==='on'||value==='off')settings[key]=value==='on';}catch{}
  return settings;
}
export function writePerformanceSetting(storage,key,value){
  if(!Object.hasOwn(KEYS,key))return;
  try{storage?.setItem(KEYS[key],value?'on':'off');}catch{}
}

// Every step stays below the player's selected quality and never changes combat timing.
export function adaptiveGraphics(base,level=0){
  level=Math.max(0,Math.min(3,Math.floor(level)||0));
  const density=[1,.75,.5,.35][level],scale=[1,.85,.7,.6][level];
  return {...base,pixelRatio:Math.min(base.pixelRatio,Math.max(.65,base.pixelRatio*scale)),
    capacity:Math.min(base.capacity,Math.max(16,Math.floor(base.capacity*density))),
    shadows:base.shadows&&level<2,shadowSize:Math.min(base.shadowSize,level?512:1024),
    compact:base.compact||level>0,density,environmentEffects:base.effects&&level<2};
}

export class FramePerformance{
  constructor({fps=30,automatic=true}={}){this.target=fps;this.automatic=automatic;this.level=0;this.lastChange=-Infinity;this.reset();}
  reset(){this.last=null;this.start=null;this.frames=0;this.fps=null;this.low=0;this.healthy=0;this.warmUntil=null;}
  configure({fps=this.target,automatic=this.automatic}={}){
    if(fps===this.target&&automatic===this.automatic)return;
    this.target=fps;this.automatic=automatic;this.level=0;this.lastChange=-Infinity;this.reset();
  }
  sample(now,{eligible=true}={}){
    if(!Number.isFinite(now))return null;
    if(this.last===null||now<=this.last||now-this.last>1000){this.reset();this.last=now;this.warmUntil=now+800;return null;}
    this.last=now;
    if(now<this.warmUntil)return null;
    if(this.start===null){this.start=now;return null;}
    this.frames++;
    const elapsed=now-this.start;if(elapsed<1000)return null;
    this.fps=Math.round(this.frames*10000/elapsed)/10;this.start=now;this.frames=0;
    const previous=this.level;
    if(!eligible||!this.automatic){this.low=0;this.healthy=0;}
    else{
      this.low=this.fps<this.target*.78?this.low+1:0;
      this.healthy=this.fps>=this.target*.93?this.healthy+1:0;
      if(this.low>=2&&this.level<3&&now-this.lastChange>=6000)this.level++;
      else if(this.healthy>=8&&this.level>0&&now-this.lastChange>=12000)this.level--;
      if(previous!==this.level){this.lastChange=now;this.low=0;this.healthy=0;}
    }
    return {fps:this.fps,level:this.level,changed:previous!==this.level};
  }
}

const scheduleIdle=callback=>{
  if(typeof globalThis.requestIdleCallback==='function')return {idle:true,id:globalThis.requestIdleCallback(callback,{timeout:1500})};
  const id=globalThis.setTimeout(callback,90);id?.unref?.();return {idle:false,id};
};
const cancelIdle=job=>{if(job?.idle)globalThis.cancelIdleCallback?.(job.id);else if(job)globalThis.clearTimeout(job.id);};

// One bounded job per idle turn. A generation also protects against late callbacks after cancellation.
export class IdlePreloader{
  constructor({schedule=scheduleIdle,cancel=cancelIdle}={}){this.schedule=schedule;this.cancel=cancel;this.jobs=[];this.active=true;this.pending=null;this.running=false;this.generation=0;}
  replace(jobs){this.cancelPending();this.jobs=[...new Map(jobs.map(job=>[job.key,job])).values()].slice(0,32);this.pump();}
  cancelPending(){this.generation++;if(this.pending!==null)this.cancel(this.pending);this.pending=null;}
  setActive(active){this.active=!!active;if(!this.active)this.cancelPending();else this.pump();}
  clear(){this.cancelPending();this.jobs=[];}
  pump(){
    if(!this.active||this.pending!==null||this.running||!this.jobs.length)return;
    const generation=this.generation;
    this.pending=this.schedule(()=>{
      if(generation!==this.generation||!this.active)return;
      this.pending=null;const job=this.jobs.shift();if(!job)return;
      this.running=true;
      let result;try{result=job.run();}catch{}
      const finish=()=>{this.running=false;this.pump();};
      if(result&&typeof result.then==='function')Promise.resolve(result).then(finish,finish);else finish();
    });
  }
}
