import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function harness({saved=null,native=true,browser=true}={}){const calls=[],storage=new Map([['thap-vo-tan-haptics',saved]]),document={hidden:false};let now=0;const window=native?{AndroidSave:{haptic:strong=>calls.push({native:strong})}}:{};const context=vm.createContext({window,document,navigator:browser?{vibrate:n=>calls.push({ms:n})}:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now}});vm.runInContext(readFileSync(new URL('../js/haptics.mjs',import.meta.url),'utf8').replace(/^export /gm,''),context);return {calls,storage,document,window,call:(source,...args)=>vm.runInContext(source,context)(...args),tick:n=>now=n};}

test('native haptics fire once for a part break or heavy impact, throttling repeated presentation',()=>{const h=harness();assert.equal(h.call('hapticsEnabled'),true);h.call('battleHaptic',[{target:'enemy0',value:20,part:{broken:true}}]);assert.deepEqual(h.calls,[{native:true}]);assert.equal(h.call('battleHaptic',[{target:'enemy0',value:20,crit:true}]),false);h.tick(200);h.call('battleHaptic',[{target:'rook',value:20}],[{id:'rook',maxHp:100}]);assert.deepEqual(h.calls,[{native:true},{native:false}]);h.tick(400);assert.equal(h.call('battleHaptic',[{target:'rook',value:19}],[{id:'rook',maxHp:100}]),false);assert.equal(h.call('battleHaptic',[{target:'rook',value:100,heal:true}],[{id:'rook',maxHp:100}]),false);});
test('haptic preference persists separately from game progress and hidden pages never vibrate',()=>{const h=harness();h.call('setHapticsEnabled',false);assert.equal(h.storage.get('thap-vo-tan-haptics'),'off');assert.equal(h.call('battleHaptic',[{part:{broken:true}}]),false);const restored=harness({saved:'off'});assert.equal(restored.call('hapticsEnabled'),false);restored.call('setHapticsEnabled',true);assert.equal(restored.storage.get('thap-vo-tan-haptics'),'on');restored.document.hidden=true;assert.equal(restored.call('battleHaptic',[{part:{broken:true}}]),false);assert.deepEqual(restored.calls,[]);});
test('browser and unavailable haptics degrade safely without requesting vibrate permission',()=>{const h=harness({native:false});assert.equal(h.call('battleHaptic',[{part:{broken:true}}]),true);assert.deepEqual(h.calls,[{ms:28}]);assert.equal(harness({native:false,browser:false}).call('battleHaptic',[{part:{broken:true}}]),false);const broken=harness();broken.window.AndroidSave.haptic=()=>{throw new Error('unsupported');};assert.equal(broken.call('battleHaptic',[{part:{broken:true}}]),false);});

test('a timing guard gives one light vibration even when shields absorb all HP damage',()=>{
  const h=harness(),events=[{target:'rook',value:0,shield:20,timingGuard:{grade:'perfect',prevented:20,energy:15}}];
  assert.equal(h.call('battleHaptic',events),true);assert.deepEqual(h.calls,[{native:false}]);assert.equal(h.call('battleHaptic',events),false);h.tick(200);h.call('setHapticsEnabled',false);assert.equal(h.call('battleHaptic',events),false);assert.equal(h.calls.length,1);
});

test('counter impact gives one light vibration and obeys hidden, disabled and throttle settings',()=>{
  const h=harness(),events=[{target:'enemy0',value:10,counter:true}];
  assert.equal(h.call('battleHaptic',events),true);assert.deepEqual(h.calls,[{native:false}]);assert.equal(h.call('battleHaptic',events),false);
  h.tick(200);h.document.hidden=true;assert.equal(h.call('battleHaptic',events),false);h.document.hidden=false;h.call('setHapticsEnabled',false);assert.equal(h.call('battleHaptic',events),false);assert.equal(h.calls.length,1);
});
