import test from 'node:test';
import assert from 'node:assert/strict';
import {readPerformanceSettings,writePerformanceSetting,adaptiveGraphics,FramePerformance,IdlePreloader} from '../js/performance.mjs';
import {graphicsProfile,createState,validateState} from '../js/engine.mjs';

function drive(meter,fps,seconds){const step=1000/fps,start=meter.last??0;for(let n=1;n<=Math.floor(fps*seconds);n++)meter.sample(start+n*step);}
function idleHarness(){const scheduled=new Map();let id=0;const options={schedule:fn=>{scheduled.set(++id,fn);return id;},cancel:id=>scheduled.delete(id)};return {options,scheduled,step(){const next=[...scheduled][0];assert.ok(next);scheduled.delete(next[0]);next[1]();}};}

test('performance preferences persist independently of the unchanged validated save and tolerate denied storage',()=>{
  const s=createState(),before=structuredClone(s),storage=new Map(),device={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)};
  assert.deepEqual(readPerformanceSettings(device),{automatic:true,showFps:false,batterySaver:false});
  writePerformanceSetting(device,'automatic',false);writePerformanceSetting(device,'showFps',true);writePerformanceSetting(device,'batterySaver',true);writePerformanceSetting(device,'quality','auto');
  assert.equal(storage.size,3);assert.deepEqual(readPerformanceSettings(device),{automatic:false,showFps:true,batterySaver:true});
  storage.set('thap-vo-tan-auto-performance','corrupt');assert.equal(readPerformanceSettings(device).automatic,true);
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.deepEqual(readPerformanceSettings(denied),{automatic:true,showFps:false,batterySaver:false});assert.doesNotThrow(()=>writePerformanceSetting(denied,'showFps',true));
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),before);assert.deepEqual(Object.keys(s.settings.graphics).sort(),['effects','fps','quality','shadows']);
});

test('automatic profiles never exceed the selected graphics ceiling or re-enable disabled options',()=>{
  for(const quality of ['low','medium','high'])for(const effects of [true,false])for(const shadows of [true,false])for(const dpr of [.5,1,3]){
    const base=graphicsProfile({quality,fps:60,effects,shadows},400,dpr),before=structuredClone(base);
    for(let level=0;level<=3;level++){const current=adaptiveGraphics(base,level);assert.ok(current.pixelRatio<=base.pixelRatio&&current.pixelRatio>0);assert.ok(current.capacity<=base.capacity);assert.ok(current.shadowSize<=base.shadowSize);assert.equal(current.fps,60);assert.equal(current.frameInterval,base.frameInterval);assert.equal(current.effects,effects);if(!shadows)assert.equal(current.shadows,false);if(!effects)assert.equal(current.environmentEffects,false);}
    assert.deepEqual(base,before);
  }
});

test('the FPS meter measures rendered 30 and 60 FPS streams without lowering their quality',()=>{
  for(const fps of [30,60]){const meter=new FramePerformance({fps});drive(meter,fps,30);assert.ok(Math.abs(meter.fps-fps)<.2);assert.equal(meter.level,0);}
});

test('only sustained low FPS degrades quality, with bounded steps and a cooldown between steps',()=>{
  const meter=new FramePerformance({fps:60});drive(meter,60,3);drive(meter,15,.3);drive(meter,60,3);assert.equal(meter.level,0);
  drive(meter,20,4);assert.equal(meter.level,1);const changedAt=meter.lastChange;
  drive(meter,20,3);assert.equal(meter.level,1);drive(meter,20,4);assert.equal(meter.level,2);assert.ok(meter.lastChange-changedAt>=6000);
  drive(meter,20,30);assert.equal(meter.level,3);
});

test('recovery needs sustained healthy frames and restores one step at a time',()=>{
  const meter=new FramePerformance({fps:30});drive(meter,10,30);assert.equal(meter.level,3);
  drive(meter,30,6);assert.equal(meter.level,3);for(let i=0;i<10&&meter.level===3;i++)drive(meter,30,1);assert.equal(meter.level,2);
  drive(meter,30,6);assert.equal(meter.level,2);const recoveredAt=meter.lastChange;for(let i=0;i<12&&meter.level===2;i++)drive(meter,30,1);assert.equal(meter.level,1);assert.ok(meter.lastChange-recoveredAt>=12000);drive(meter,30,20);assert.equal(meter.level,0);
});

test('background gaps, sampling resets and ineligible cinematic frames cannot trigger a false downgrade',()=>{
  const meter=new FramePerformance({fps:60});drive(meter,60,2);meter.reset();meter.sample(100000);assert.equal(meter.fps,null);drive(meter,60,3);assert.equal(meter.level,0);
  for(let n=1;n<=120;n++)meter.sample(meter.last+100,{eligible:false});assert.equal(meter.level,0);
  meter.sample(meter.last+5000);assert.equal(meter.fps,null);drive(meter,60,3);assert.equal(meter.level,0);
});

test('turning off adaptation restores the ceiling and still measures FPS; a new cap starts a fresh sample',()=>{
  const meter=new FramePerformance({fps:60});drive(meter,15,12);assert.ok(meter.level>0);meter.configure({automatic:false});assert.equal(meter.level,0);
  drive(meter,15,20);assert.equal(meter.fps,15);assert.equal(meter.level,0);meter.configure({fps:30,automatic:true});assert.equal(meter.fps,null);drive(meter,30,3);assert.equal(meter.level,0);assert.equal(meter.fps,30);
});

test('idle jobs are bounded, deduplicated and run one at a time instead of blocking the caller',()=>{
  const h=idleHarness(),queue=new IdlePreloader(h.options),seen=[];
  queue.replace(Array.from({length:50},(_,i)=>({key:i%40,run:()=>seen.push(i%40)})));assert.equal(seen.length,0);assert.equal(h.scheduled.size,1);
  h.step();assert.equal(seen.length,1);assert.equal(h.scheduled.size,1);while(h.scheduled.size)h.step();assert.equal(seen.length,32);assert.equal(new Set(seen).size,32);assert.equal(queue.jobs.length,0);
});

test('cancelled callbacks cannot run stale work and replacing a queue uses the latest scene',()=>{
  const h=idleHarness(),queue=new IdlePreloader(h.options),seen=[];queue.replace([{key:'old',run:()=>seen.push('old')}]);const stale=[...h.scheduled.values()][0];
  queue.setActive(false);stale();assert.deepEqual(seen,[]);assert.equal(h.scheduled.size,0);
  queue.replace([{key:'new',run:()=>seen.push('new')}]);assert.equal(h.scheduled.size,0);queue.setActive(true);h.step();assert.deepEqual(seen,['new']);queue.clear();assert.equal(h.scheduled.size,0);
});

test('asynchronous prewarming is serialized, releases failures and obeys a pause before scheduling more work',async()=>{
  const h=idleHarness(),queue=new IdlePreloader(h.options);let finish,runs=0;
  queue.replace([{key:1,run:()=>new Promise(resolve=>finish=resolve)},{key:2,run:()=>{throw Error('unsupported');}},{key:3,run:()=>runs++}]);h.step();assert.equal(h.scheduled.size,0);
  queue.setActive(false);finish();await Promise.resolve();assert.equal(h.scheduled.size,0);queue.setActive(true);h.step();h.step();assert.equal(runs,1);
});
