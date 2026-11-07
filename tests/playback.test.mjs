import test from 'node:test';
import assert from 'node:assert/strict';
import {BattlePlayback} from '../js/playback.mjs';
import * as E from '../js/engine.mjs';

const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const drain=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function scheduler(){let id=0;const timers=new Map();return {timers,schedule:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},unschedule:key=>timers.delete(key),fire(){const [key,timer]=timers.entries().next().value;timers.delete(key);timer.fn();}};}
function battle(){const s=E.createState();s.owned.aion={level:1,copies:0,awaken:0};s.team=['aion','rook','aerin'];E.startRun(s,987654);E.chooseRoute(s,0);s.run.heroes[0].energy=100;return s;}

test('skip, repeated input and background cancellation never replay a committed skill or its rewards',async()=>{
  const s=battle(),expected=structuredClone(s);E.playerAction(expected,'aion','enemy0',true);const clock=scheduler(),playback=new BattlePlayback(clock),opening=deferred();let commits=0,saved,finishes=0,starts=0;
  const action=playback.run({commit(){commits++;const ev=E.playerAction(s,'aion','enemy0',true);saved=structuredClone(s);return ev;},opening:()=>opening.promise,start(){starts++;return {duration:900,impact:400};},finish(){finishes++;},interrupt:opening.resolve});
  assert.deepEqual(saved,expected);assert.equal(playback.active,true);assert.equal(await playback.run({commit(){commits++;}}),false);
  opening.resolve();await drain();assert.equal(starts,1);assert.equal(clock.timers.size,1);
  playback.cancel();playback.cancel();await action;
  assert.equal(commits,1);assert.equal(finishes,1);assert.equal(playback.active,false);assert.equal(clock.timers.size,0);assert.deepEqual(s,expected);assert.deepEqual(E.validateState(saved),expected);
});

test('playback shows impact in sequence, then releases the next turn at both speeds',async()=>{
  for(const speed of [1,2]){
    const clock=scheduler(),playback=new BattlePlayback(clock),order=[];
    const first=playback.run({commit:()=>{order.push('save');return [1];},start:()=>{order.push('start');return {impact:400/speed,duration:900/speed};},impact:events=>{assert.deepEqual(events,[1]);order.push('impact');},finish:()=>order.push('finish')});
    await drain();assert.deepEqual(order,['save','start']);assert.equal(clock.timers.values().next().value.ms,400/speed);clock.fire();await drain();assert.deepEqual(order,['save','start','impact']);assert.equal(clock.timers.values().next().value.ms,500/speed);clock.fire();await first;assert.deepEqual(order,['save','start','impact','finish']);assert.equal(playback.active,false);
    await playback.run({commit:()=>order.push('next'),start:()=>({duration:0,impact:0})});assert.equal(order.at(-1),'next');assert.equal(clock.timers.size,0);
  }
});

test('cancelling during an unfinished cinematic or a failing presentation unlocks without an extra commit',async()=>{
  const playback=new BattlePlayback(),opening=deferred();let commits=0,finished=0,impacts=0;
  const action=playback.run({commit:()=>commits++,opening:()=>opening.promise,start:()=>{impacts++;},finish:()=>finished++});playback.cancel();await action;
  assert.equal(commits,1);assert.equal(finished,1);assert.equal(impacts,0);assert.equal(playback.active,false);opening.resolve();await drain();assert.equal(commits,1);
  await assert.rejects(playback.run({commit:()=>{throw new Error('invalid move');},finish:()=>finished++}),/invalid move/);assert.equal(playback.active,false);assert.equal(finished,2);
  await assert.rejects(playback.run({commit:()=>commits++,opening:()=>Promise.reject(new Error('renderer unavailable')),finish:()=>finished++}),/renderer unavailable/);assert.equal(commits,2);assert.equal(playback.active,false);assert.equal(finished,3);
});
