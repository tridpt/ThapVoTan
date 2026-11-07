import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDevicePower,readDevicePower,devicePowerPolicy,sceneFrameInterval} from '../js/device-power.mjs';
import {commandSpace,TouchLayout} from '../js/touch-layout.mjs';
import {graphicsProfile} from '../js/preferences.mjs';

test('missing, malformed or denied device information is neutral and never prevents startup',()=>{
  const neutral={lowRam:false,memoryGB:null,powerSave:false,thermal:0};
  for(const value of [null,[],false,'bad',{lowRam:1,memoryGB:'2',powerSave:1,thermal:7},{memoryGB:Infinity,thermal:-1}])assert.deepEqual(normalizeDevicePower(value),neutral);
  for(const profile of [()=>'{bad',()=> 'x'.repeat(2049),()=>{throw Error('unavailable');}])assert.deepEqual(readDevicePower({profile},null),neutral);
  assert.deepEqual(readDevicePower(null,{get deviceMemory(){throw Error('denied');}}),neutral);
  assert.deepEqual(devicePowerPolicy({},neutral),{floor:0,maxFps:60,reason:null,warmModels:true,thumbnailSize:288,cinematics:true,quietIdle:false});
});

test('native memory takes precedence; browsers can supply an anonymous memory fallback',()=>{
  assert.deepEqual(readDevicePower({profile:()=>JSON.stringify({memoryGB:1.8,lowRam:true,powerSave:true,thermal:3})},{deviceMemory:8}),{memoryGB:1.8,lowRam:true,powerSave:true,thermal:3});
  assert.equal(readDevicePower(null,{deviceMemory:2}).memoryGB,2);
  assert.equal(readDevicePower({profile:()=>JSON.stringify({memoryGB:0})},{deviceMemory:4}).memoryGB,4);
});

test('low memory starts with less rendering work only while automatic performance is enabled',()=>{
  for(const [profile,floor] of [[{lowRam:true,memoryGB:8},2],[{memoryGB:2},2],[{memoryGB:3},1],[{memoryGB:4},0],[{},0]]){
    assert.equal(devicePowerPolicy({},profile).floor,floor);
    assert.equal(devicePowerPolicy({automatic:false},profile).floor,0);
  }
});

test('manual saving, Android saving and heat constrain rendering independently of automatic adaptation',()=>{
  for(const automatic of [true,false]){
    for(const [settings,profile] of [[{batterySaver:true},{}],[{},{powerSave:true}],[{},{thermal:2}]]){
      const policy=devicePowerPolicy({...settings,automatic},profile);
      assert.equal(policy.floor,2);assert.equal(policy.maxFps,30);assert.equal(policy.warmModels,false);assert.equal(policy.thumbnailSize,192);assert.equal(policy.cinematics,false);assert.equal(policy.quietIdle,true);
    }
    for(const thermal of [4,5,6]){const p=devicePowerPolicy({automatic},{thermal});assert.equal(p.floor,3);assert.equal(p.maxFps,20);assert.equal(p.reason,'Máy đang rất nóng');}
  }
  assert.equal(devicePowerPolicy({batterySaver:true},{powerSave:true,thermal:3}).reason,'Máy đang nóng');
});

test('quiet scene caps cannot raise a selected cap or slow battle, travel timers or a cinematic clock',()=>{
  const base=graphicsProfile({quality:'medium',fps:30,shadows:true,effects:true},400,2),policy=devicePowerPolicy({batterySaver:true});
  for(const mode of ['lobby','map','preview','victory'])assert.equal(sceneFrameInterval(base,policy,mode),1000/15);
  for(const mode of ['battle','ultimate'])assert.equal(sceneFrameInterval(base,policy,mode),1000/30);
  assert.equal(sceneFrameInterval({...base,frameInterval:100},policy,'lobby'),100);
  assert.equal(sceneFrameInterval(base,devicePowerPolicy(),'lobby'),base.frameInterval);
});

const rect=(top,height,width=360)=>({top,bottom:top+height,height,width});
test('command clearance includes visible callouts and ignores hidden or invalid rectangles',()=>{
  assert.equal(commandSpace([rect(610,190),rect(540,60),rect(0,0),rect(20,20,0),rect(NaN,20)],800),276);
  assert.equal(commandSpace([rect(900,20),rect(-30,20)],800),null);
  assert.equal(commandSpace([rect(610,190)],NaN),null);
});

function layoutHarness(observe=true){
  const events=new Map(),viewportEvents=new Map(),observers=[];
  const node=(top,height)=>({isConnected:true,properties:new Map(),getBoundingClientRect:()=>rect(top,height),querySelectorAll:()=>[],style:{setProperty(k,v){this.owner.properties.set(k,v);},removeProperty(k){this.owner.properties.delete(k);}}});
  const create=(top,height)=>{const n=node(top,height);n.style.owner=n;return n;};
  let shell=create(0,800),tray=create(620,180);
  class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(n){this.target=n;}disconnect(){this.target=null;}}
  const window={innerHeight:800,getComputedStyle:n=>({position:n.position||'static'}),addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k),visualViewport:{height:800,offsetTop:0,addEventListener:(k,f)=>viewportEvents.set(k,f),removeEventListener:k=>viewportEvents.delete(k)}};
  const document={querySelector:s=>s==='.game-shell'?shell:tray};
  const layout=new TouchLayout({document,window,ResizeObserver:observe?Observer:null});
  return {layout,window,events,viewportEvents,observers,create,get shell(){return shell;},get tray(){return tray;},replace(s,t){shell=s;tray=t;}};
}

test('layout measures actual tray growth and viewport resize instead of a fixed phone padding',()=>{
  const h=layoutHarness();h.layout.mount();assert.equal(h.shell.properties.get('--command-space'),'196px');
  h.tray.getBoundingClientRect=()=>rect(510,290);h.observers[0].callback();assert.equal(h.shell.properties.get('--command-space'),'306px');
  h.window.visualViewport.height=680;h.window.visualViewport.offsetTop=10;h.tray.getBoundingClientRect=()=>rect(440,250);h.viewportEvents.get('resize')();assert.equal(h.shell.properties.get('--command-space'),'266px');
  h.layout.dispose();assert.equal(h.events.size,0);assert.equal(h.viewportEvents.size,0);assert.equal(h.shell.properties.size,0);assert.equal(h.observers[0].target,null);
});

test('replacing the full app still writes clearance when the new tray has the same height',()=>{
  const h=layoutHarness();h.layout.mount();const previous=h.shell,next=h.create(0,800),tray=h.create(620,180);h.replace(next,tray);h.layout.mount();
  assert.equal(previous.properties.size,0);assert.equal(next.properties.get('--command-space'),'196px');assert.equal(h.observers[0].target,tray);
  h.replace(next,null);h.layout.mount();assert.equal(next.properties.size,0);h.layout.dispose();
});

test('clipped children in a scrolling tray cannot inflate clearance, while floating desktop callouts can',()=>{
  const h=layoutHarness(),callout=h.create(540,60);h.tray.querySelectorAll=()=>[callout];h.layout.mount();assert.equal(h.shell.properties.get('--command-space'),'196px');
  callout.position='absolute';h.layout.measure();assert.equal(h.shell.properties.get('--command-space'),'276px');
  callout.position='static';callout.getBoundingClientRect=()=>rect(300,60);h.layout.measure();assert.equal(h.shell.properties.get('--command-space'),'196px');h.layout.dispose();
});

test('older WebViews without a ResizeObserver can still update on render and window resize',()=>{
  const h=layoutHarness(false);delete h.window.visualViewport;h.layout.mount();assert.equal(h.shell.properties.get('--command-space'),'196px');
  h.tray.getBoundingClientRect=()=>rect(550,250);h.events.get('resize')();assert.equal(h.shell.properties.get('--command-space'),'266px');
  h.tray.isConnected=false;h.layout.measure();h.layout.dispose();assert.doesNotThrow(()=>new TouchLayout({document:null,window:null,ResizeObserver:null}).mount());
});
