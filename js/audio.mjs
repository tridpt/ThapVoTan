import {synthesizeCue} from './audio-synthesis.mjs';
import {HERO} from './data.mjs';
import {PET} from './adventure-data.mjs';
import {IdlePreloader} from './performance.mjs';

export function battleSoundProfile(visual,events,run){
  const hero=HERO[visual.actorId],pet=visual.pet?PET[run?.pet?.id]:null;
  const hits=events.filter(e=>!e.heal&&!e.shieldGrant&&(e.value>0||e.shield>0));
  return {weapon:visual.enemy||pet?'creature':hero?.weapon||'orb',element:hero?.element||null,
    skill:!!(visual.skill||visual.link||pet),damage:hits.length>0,critical:hits.some(e=>e.crit),
    broken:hits.some(e=>e.part?.broken),heal:events.some(e=>e.heal&&e.value>0),shield:events.some(e=>e.shieldGrant&&e.value>0)};
}

const MUSIC_KEY='thap-vo-tan-music';
// One reusable context, one music loop, bounded voices and buffers. No audio is created before a gesture.
export class GameAudio{
  constructor({createContext=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)(),storage,preloadScheduler}={}){
    this.createContext=createContext;this.enabled=true;this.active=true;this.combat=false;this.boss=false;
    this.context=null;this.voices=new Set();this.buffers=new Map();this.music=null;this.pending=null;this.unlocked=false;this.musicEnabled=true;
    this.preloader=new IdlePreloader(preloadScheduler);this.preloadKeys=[];
    try{this.storage=storage===undefined?globalThis.localStorage:storage;this.musicEnabled=this.storage?.getItem(MUSIC_KEY)!=='off';}catch{}
  }
  configure({enabled=this.enabled,combat=this.combat,boss=this.boss}={}){
    this.enabled=!!enabled;this.combat=!!combat;this.boss=!!boss;
    if(!this.enabled){this.preloader.setActive(false);this.stopAll();return;}this.syncMusic();this.queuePreload();
  }
  prepare(run,team=[]){
    const ids=run?.phase==='battle'?run.heroes.map(h=>h.id):team,keys=['ui:tap','ui:win','ui:summon','weapon:creature:release','weapon:creature:impact','aid:heal','aid:shield','break:armor'];
    for(const id of ids){const hero=HERO[id];if(hero)keys.push(`weapon:${hero.weapon}:release`,`weapon:${hero.weapon}:impact`,'element:'+hero.element);}
    if(this.musicEnabled)keys.push('music:battle','music:boss');
    this.preloadKeys=[...new Set(keys)].slice(0,30);this.queuePreload();
  }
  queuePreload(){
    const ready=this.enabled&&this.active&&this.unlocked&&this.context&&this.context.state!=='closed'&&!this.pending;
    this.preloader.setActive(!!ready);if(!ready)return;
    this.preloader.replace(this.preloadKeys.filter(key=>!this.buffers.has(key)&&(!key.startsWith('music:')||this.musicEnabled)).map(key=>({key,run:()=>{if(this.enabled&&this.active&&this.unlocked&&this.context?.state!=='closed')this.buffer(key);}})));
  }
  setMusicEnabled(value){this.musicEnabled=!!value;try{this.storage?.setItem(MUSIC_KEY,value?'on':'off');}catch{}this.syncMusic();this.queuePreload();}
  unlock(){
    if(!this.enabled||!this.active)return false;
    try{
      if(!this.context){this.context=this.createContext();this.bus=this.context.createGain();this.bus.gain.value=.22;this.bus.connect(this.context.destination);}
      if(this.context.state==='closed')return false;
      this.unlocked=true;
      if(this.context.state==='suspended'){const context=this.context;Promise.resolve(context.resume()).catch(()=>{if(this.context===context){this.preloader.setActive(false);this.stopAll();this.unlocked=false;}});}
      this.syncMusic();this.queuePreload();return true;
    }catch{return false;}
  }
  setActive(value){
    this.active=!!value;
    if(!this.active){this.preloader.setActive(false);this.stopAll();try{Promise.resolve(this.context?.suspend()).then(()=>{if(this.active&&this.enabled&&this.unlocked)this.unlock();}).catch(()=>{});}catch{}}
    else if(this.unlocked&&this.enabled)this.unlock();
  }
  buffer(key){
    if(this.buffers.has(key))return this.buffers.get(key);
    const data=synthesizeCue(key),buffer=this.context.createBuffer(1,data.samples.length,data.rate);buffer.getChannelData(0).set(data.samples);
    if(this.buffers.size>=32)this.buffers.delete(this.buffers.keys().next().value);
    this.buffers.set(key,buffer);return buffer;
  }
  voice(key,{delay=0,speed=1,gain=1,group='ui',loop=false}={}){
    if(!this.active||!this.enabled||!this.unlocked||!this.context||this.context.state==='closed')return null;
    let source,volume,voice;
    try{
      while(this.voices.size>=20)this.stopVoice([...this.voices].find(v=>v.group!=='music')||this.voices.values().next().value);
      const buffer=this.buffer(key);source=this.context.createBufferSource();volume=this.context.createGain();
      source.buffer=buffer;source.loop=loop;source.playbackRate.value=speed===2?2:1;volume.gain.value=gain;
      source.connect(volume);volume.connect(this.bus);voice={source,volume,group,key};this.voices.add(voice);
      source.onended=()=>this.releaseVoice(voice);source.start(this.context.currentTime+Math.max(0,delay)/1000);return voice;
    }catch{if(voice)this.stopVoice(voice);else{try{source?.disconnect();volume?.disconnect();}catch{}}return null;}
  }
  releaseVoice(voice){if(!this.voices.delete(voice))return;voice.source.onended=null;try{voice.source.disconnect();voice.volume.disconnect();}catch{}if(this.music===voice)this.music=null;}
  stopVoice(voice){if(!voice)return;try{voice.source.stop();}catch{}this.releaseVoice(voice);}
  cue(type='tap'){return !!this.voice('ui:'+(['tap','summon','win'].includes(type)?type:'tap'));}
  battleStart(profile,timing,{speed=1}={}){
    this.cancelBattle();if(!this.enabled||!this.active)return;
    this.preloader.setActive(false);
    this.pending={profile,speed};
    if(profile.damage)this.voice(`weapon:${profile.weapon}:release`,{delay:timing.release||0,speed,group:'battle',gain:.7});
  }
  battleImpact(){
    const pending=this.pending;this.pending=null;if(!pending)return false;const {profile:p,speed}=pending,opts={speed,group:'battle'};
    if(p.damage){this.voice(`weapon:${p.weapon}:impact`,{...opts,gain:p.critical?1.15:1});if(p.skill&&p.element)this.voice('element:'+p.element,{...opts,gain:.5});if(p.broken)this.voice('break:armor',{...opts,gain:.65});}
    else if(p.heal||p.shield)this.voice('aid:'+(p.heal?'heal':'shield'),opts);
    return true;
  }
  cancelBattle(){this.pending=null;for(const v of [...this.voices])if(v.group==='battle')this.stopVoice(v);}
  syncMusic(){
    const key='music:'+(this.boss?'boss':'battle'),wanted=this.active&&this.enabled&&this.musicEnabled&&this.combat&&this.unlocked;
    if(this.music&&(!wanted||this.music.key!==key))this.stopVoice(this.music);
    if(wanted&&!this.music)this.music=this.voice(key,{gain:.23,group:'music',loop:true});
  }
  stopAll(){this.pending=null;for(const v of [...this.voices])this.stopVoice(v);this.music=null;}
  dispose(){this.preloader.setActive(false);this.preloader.clear();this.preloadKeys=[];this.stopAll();this.buffers.clear();try{this.bus?.disconnect();Promise.resolve(this.context?.close()).catch(()=>{});}catch{}this.context=null;this.unlocked=false;}
}
