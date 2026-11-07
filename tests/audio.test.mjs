import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GameAudio,battleSoundProfile} from '../js/audio.mjs';
import {synthesizeCue,AUDIO_RATE} from '../js/audio-synthesis.mjs';
import {FakeAudioContext} from './audio-helper.mjs';
import * as E from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
const sha=a=>createHash('sha256').update(new Uint8Array(a.buffer)).digest('hex');
function harness(saved={}){const contexts=[],storage=new Map(Object.entries(saved));const audio=new GameAudio({storage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},createContext:()=>{const c=new FakeAudioContext();contexts.push(c);return c;}});return {audio,contexts,storage};}

test('all weapon release and impact sounds are distinct, deterministic, finite and bounded',()=>{
  const hashes=new Set();for(const weapon of ['sword','dagger','bow','shield','staff','orb','creature'])for(const phase of ['release','impact']){
    const key=`weapon:${weapon}:${phase}`,a=synthesizeCue(key),b=synthesizeCue(key);assert.equal(a.rate,AUDIO_RATE);assert.equal(sha(a.samples),sha(b.samples));hashes.add(sha(a.samples));
    let energy=0;for(const v of a.samples){assert.ok(Number.isFinite(v)&&Math.abs(v)<=.920001);energy+=v*v;}assert.ok(Math.sqrt(energy/a.samples.length)>.008);assert.ok(Math.abs(a.samples[0])<.00001&&Math.abs(a.samples.at(-1))<.001);
  }assert.equal(hashes.size,14);
});

test('seven elemental sounds, support and UI cues stay finite and music has quiet loop boundaries',()=>{
  const keys=['Hỏa','Băng','Lôi','Phong','Thổ','Quang','Ảnh'].map(x=>'element:'+x).concat(['aid:heal','aid:shield','break:armor','ui:tap','ui:summon','ui:win','music:battle','music:boss']),hashes=new Set();
  for(const key of keys){const {samples,rate,duration}=synthesizeCue(key);hashes.add(sha(samples));assert.ok(duration>0&&duration<=10);for(const v of samples)assert.ok(Number.isFinite(v)&&Math.abs(v)<=.920001);assert.ok(Math.abs(samples[0])<.00001&&Math.abs(samples.at(-1))<.001);if(key.startsWith('music:')){const step=key.endsWith('boss')?2:2.5;for(let t=step;t<duration;t+=step)assert.ok(Math.abs(samples[Math.round(t*rate)])<.002);}}
  assert.equal(hashes.size,keys.length);
});

test('rendering and configuration create no context until the first gesture, then reuse one music loop',()=>{
  const {audio:a,contexts}=harness();a.configure({combat:true,boss:false});assert.equal(contexts.length,0);assert.equal(a.cue('tap'),false);
  assert.equal(a.unlock(),true);const music=a.music;assert.ok(music&&music.source.loop);for(let i=0;i<10;i++){a.configure({combat:true});a.unlock();}assert.equal(contexts.length,1);assert.equal(a.music,music);
  a.configure({boss:true});assert.equal(music.source.stopped,true);assert.equal(a.music.key,'music:boss');a.configure({combat:false});assert.equal(a.music,null);a.dispose();
});

test('weapon launch follows release timing, contact sound waits for impact and speed 2x shortens each voice',()=>{
  const {audio:a}=harness();a.unlock();const p={weapon:'bow',element:'Phong',skill:true,damage:true,critical:true};a.battleStart(p,{release:145},{speed:2});
  const release=[...a.voices][0];assert.equal(release.key,'weapon:bow:release');assert.equal(release.source.started,3.145);assert.equal(release.source.playbackRate.value,2);assert.equal(a.voices.size,1);
  a.battleImpact();assert.ok([...a.voices].some(v=>v.key==='weapon:bow:impact'&&v.source.started===3));assert.ok([...a.voices].some(v=>v.key==='element:Phong'));const count=a.voices.size;assert.equal(a.battleImpact(),false);assert.equal(a.voices.size,count);a.dispose();
});

test('healing or shield-only actions never emit a weapon collision or stack sounds per target',()=>{
  for(const kind of ['heal','shield']){const {audio:a}=harness();a.unlock();a.battleStart({weapon:'staff',damage:false,[kind]:true},{release:300});assert.equal(a.voices.size,0);a.battleImpact();assert.deepEqual([...a.voices].map(v=>v.key),['aid:'+kind]);a.dispose();}
  const {audio:a}=harness();a.unlock();a.battleStart({weapon:'shield',damage:true,broken:true},{release:0});a.battleImpact();assert.equal([...a.voices].filter(v=>v.key==='break:armor').length,1);a.dispose();
});

test('master mute stops scheduled sounds and music, keeps the music preference and never queues a muted impact',()=>{
  const {audio:a,storage}=harness();a.configure({combat:true});a.unlock();a.setMusicEnabled(false);assert.equal(storage.get('thap-vo-tan-music'),'off');a.setMusicEnabled(true);
  a.battleStart({weapon:'sword',damage:true},{release:200});const sources=[...a.voices].map(v=>v.source);a.configure({enabled:false});assert.ok(sources.every(v=>v.stopped));assert.equal(a.music,null);assert.equal(a.battleImpact(),false);assert.equal(a.cue(),false);
  assert.equal(a.musicEnabled,true);a.configure({enabled:true});assert.equal(a.music.key,'music:battle');a.setMusicEnabled(false);a.configure({enabled:false});a.configure({enabled:true});assert.equal(a.music,null);a.dispose();
});

test('background and foreground stop pending sounds without replay and recover a late context suspension',async()=>{
  const {audio:a}=harness();a.configure({combat:true});a.unlock();const c=a.context;a.battleStart({weapon:'dagger',damage:true},{release:250});const sources=c.sources.slice();let releaseSuspend;c.suspend=()=>new Promise(resolve=>releaseSuspend=()=>{c.state='suspended';resolve();});
  a.setActive(false);assert.equal(a.voices.size,0);assert.ok(sources.every(s=>s.stopped));a.setActive(true);releaseSuspend();await Promise.resolve();await Promise.resolve();assert.equal(c.state,'running');assert.equal(a.battleImpact(),false);assert.ok([...a.voices].every(v=>v.group==='music'));a.dispose();
});

test('voice and buffer caps hold under repeated attacks, preserving the music loop and freeing ended sources',()=>{
  const {audio:a}=harness();a.configure({combat:true});a.unlock();const music=a.music;
  for(let i=0;i<100;i++){a.cue();assert.ok(a.voices.size<=20);}assert.equal(a.music,music);assert.equal(music.source.stopped,undefined);
  const ended=[...a.voices].find(v=>v.group==='ui');ended.source.onended();assert.equal(ended.source.disconnected,true);assert.equal(ended.volume.disconnected,true);
  for(let i=0;i<40;i++)a.buffer('element:'+i);assert.ok(a.buffers.size<=32);a.dispose();assert.equal(a.context,null);assert.equal(a.voices.size,0);assert.equal(a.buffers.size,0);
});

test('missing audio, rejected resume and unavailable preference storage degrade without unhandled rejection',async()=>{
  const broken=new GameAudio({storage:{getItem(){throw new Error('unavailable');}},createContext(){throw new Error('no audio');}});assert.equal(broken.unlock(),false);broken.setMusicEnabled(false);assert.equal(broken.cue(),false);broken.dispose();
  const {audio:a}=harness();a.createContext=()=>{const c=new FakeAudioContext();c.resume=()=>Promise.reject(new Error('gesture blocked'));return c;};a.unlock();a.cue();await Promise.resolve();await Promise.resolve();assert.equal(a.voices.size,0);assert.equal(a.unlocked,false);a.dispose();
  const restored=harness({'thap-vo-tan-music':'off'});assert.equal(restored.audio.musicEnabled,false);restored.audio.dispose();
});

test('real hero, pet, enemy and linked combat sound profiles preserve state and ignore support grants as damage',()=>{
  for(const hero of HEROES){const s=E.createState();s.owned[hero.id]={level:1,copies:0,awaken:0};E.setTeamSlot(s,hero.id,0);E.startHunt(s,'colossus',1,42);s.run.heroes[0].energy=100;
    const events=E.playerAction(s,hero.id,'enemy0',true),before=structuredClone(s),p=battleSoundProfile({actorId:hero.id,skill:true},events,s.run);assert.equal(p.weapon,hero.weapon);assert.equal(p.element,hero.element);if(hero.kind==='heal')assert.equal(p.damage,false);assert.deepEqual(s,before);
  }
  const s=E.createState();E.startHunt(s,'colossus',1,42);const before=structuredClone(s);
  assert.equal(battleSoundProfile({pet:true},[{value:10,heal:true}],s.run).weapon,'creature');assert.equal(battleSoundProfile({enemy:true},[{value:10}],s.run).weapon,'creature');assert.equal(battleSoundProfile({actorId:'rook',link:{}},[{value:20,shieldGrant:true}],s.run).damage,false);assert.deepEqual(s,before);
});

function preloaderAudio(){
  const jobs=new Map(),contexts=[];let id=0;
  const audio=new GameAudio({storage:null,preloadScheduler:{schedule:fn=>{jobs.set(++id,fn);return id;},cancel:key=>jobs.delete(key)},createContext:()=>{const c=new FakeAudioContext();contexts.push(c);return c;}});
  const step=()=>{const next=[...jobs][0];assert.ok(next);jobs.delete(next[0]);next[1]();};return {audio,jobs,contexts,step};
}

test('audio prepares the selected squad after a gesture, one cached buffer at a time without playing voices',()=>{
  const {audio:a,jobs,contexts,step}=preloaderAudio(),s=E.createState(),before=structuredClone(s);a.prepare(null,s.team);assert.equal(contexts.length,0);assert.equal(jobs.size,0);
  a.unlock();assert.equal(jobs.size,1);assert.equal(a.buffers.size,0);step();assert.equal(a.buffers.size,1);assert.equal(a.voices.size,0);while(jobs.size)step();
  for(const key of ['weapon:shield:release','weapon:shield:impact','element:Thổ','music:battle','music:boss'])assert.ok(a.buffers.has(key),key);
  const count=a.context.buffers.length;a.battleStart({weapon:'shield',damage:true},{release:0});a.battleImpact();assert.equal(a.context.buffers.length,count);assert.equal(contexts.length,1);assert.deepEqual(s,before);a.dispose();
});

test('audio prewarming is cancelled while muted, backgrounded, fighting or disposed and resumes from cached work',()=>{
  const {audio:a,jobs,step}=preloaderAudio();a.prepare(null,['rook','ember','lumi']);a.unlock();step();const cached=a.buffers.size;
  a.setActive(false);assert.equal(jobs.size,0);assert.equal(a.buffers.size,cached);a.setActive(true);assert.equal(jobs.size,1);
  a.battleStart({weapon:'shield',damage:true},{release:0});assert.equal(jobs.size,0);a.battleImpact();a.prepare(null,['aerin']);assert.equal(jobs.size,1);
  a.configure({enabled:false});assert.equal(jobs.size,0);a.configure({enabled:true});assert.equal(jobs.size,1);a.dispose();assert.equal(jobs.size,0);assert.equal(a.buffers.size,0);
});

test('prewarming tolerates synthesis failures and respects the separate music toggle and buffer cap',()=>{
  const {audio:a,jobs,step}=preloaderAudio();a.setMusicEnabled(false);a.prepare(null,['rook','ember','lumi']);a.unlock();
  const create=a.context.createBuffer.bind(a.context);let failed=false;a.context.createBuffer=(...args)=>{if(!failed){failed=true;throw Error('memory');}return create(...args);};
  while(jobs.size)step();assert.equal(failed,true);assert.ok(a.buffers.size>0&&a.buffers.size<=32);assert.ok([...a.buffers.keys()].every(key=>!key.startsWith('music:')));assert.equal(a.voices.size,0);a.dispose();
});
