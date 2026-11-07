import test from 'node:test';
import assert from 'node:assert/strict';
import {createImpactBeat,impactBeatTime} from '../js/impact-beat.mjs';

test('a critical contact holds briefly, advances monotonically and reaches the original action end',()=>{
  const timing={duration:900,impact:414},beat=createImpactBeat(2,timing,[{target:'enemy0',value:50,crit:true}]);
  assert.ok(beat.hold>=.05&&beat.hold<=.06);const mid=beat.impact+beat.hold*.5;
  assert.equal(impactBeatTime(beat,mid),beat.impact);assert.equal(impactBeatTime(beat,2),2);assert.equal(impactBeatTime(beat,2.9),2.9);
  let previous=2;for(let i=0;i<=1000;i++){const wall=2+i*.001,time=impactBeatTime(beat,wall);assert.ok(time>=previous-1e-12&&time<=wall+1e-12);previous=time;}
});

test('normal light hits, empty turns, healing and shield grants never freeze, while absorbed damage can',()=>{
  const timing={duration:900,impact:400};for(const events of [[],[{value:100,heal:true,crit:true}],[{value:100,shieldGrant:true}],[{value:0}],[{value:10}]])assert.equal(createImpactBeat(0,timing,events),null);
  assert.ok(createImpactBeat(0,timing,[{value:0,shield:20}],{heavy:true}));assert.ok(createImpactBeat(0,timing,[{value:20,part:{broken:true}}]));
});

test('speed 2x preserves the same normalized hold and recovery without an extra gameplay delay',()=>{
  const events=[{value:10,crit:true}],a=createImpactBeat(0,{duration:900,impact:414},events),b=createImpactBeat(0,{duration:450,impact:207},events,{speed:2});
  for(let i=0;i<=180;i++){const t=i*.005;assert.ok(Math.abs(impactBeatTime(a,t)-2*impactBeatTime(b,t/2))<1e-12);}
});

test('reduced motion and invalid or too-short contact windows safely avoid or bound the hold',()=>{
  const hits=[{value:50,crit:true}];assert.equal(createImpactBeat(0,{duration:900,impact:414},hits,{reducedMotion:true}),null);
  for(const timing of [{duration:NaN,impact:400},{duration:900,impact:Infinity},{duration:900,impact:900},{duration:0,impact:0},{duration:900,impact:-1}])assert.equal(createImpactBeat(0,timing,hits),null);
  const beat=createImpactBeat(0,{duration:430,impact:425},hits,{finisher:true});assert.ok(beat.hold<.002);assert.equal(impactBeatTime(null,.7),.7);
});
