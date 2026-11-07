import {HERO,RESONANCES,TRIAL,TRIAL_REWARDS} from './data.mjs';

export const AWAKEN_MAX=5;
const COPY_COSTS=[1,1,2,2,3],GOLD_COSTS=[250,500,1000,1800,3000];
export function awakeningCost(s,id){
  const rank=s.owned[id]?.awaken||0;
  return rank>=AWAKEN_MAX?null:{copies:COPY_COSTS[rank],gold:GOLD_COSTS[rank]};
}
export function awakenHero(s,id){
  if(!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id))throw new Error('Bạn chưa sở hữu anh hùng này.');
  const own=s.owned[id],cost=awakeningCost(s,id);
  if(!cost)throw new Error('Anh hùng đã thức tỉnh tối đa.');
  if(own.copies<cost.copies)throw new Error('Chưa đủ bản trùng của anh hùng này.');
  if(s.gold<cost.gold)throw new Error('Chưa đủ vàng để thức tỉnh.');
  own.copies-=cost.copies;s.gold-=cost.gold;own.awaken=(own.awaken||0)+1;
  return own.awaken;
}
export function teamResonances(ids){
  const elements=ids.map(id=>HERO[id].element);
  return RESONANCES.filter(r=>r.element?elements.filter(e=>e===r.element).length>=r.count:new Set(elements).size>=r.count).map(r=>r.id);
}
export function hasResonance(r,id){return r.resonances.includes(id);}
export function skillPower(h){return (h.awaken>=3?1.15:1)*(h.loadout?.signature?1.12:1);}
export function noRevive(r){return r.challenge?.id==='iron';}
export function weekKey(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function validWeek(key){
  if(typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key))return false;
  const d=new Date(key+'T12:00:00');return Number.isFinite(d.getTime())&&weekKey(d)===key;
}
export function trialSeed(id,week){
  let hash=2166136261;for(const c of `${week}:${id}`)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  return hash||1234567;
}
export function trialStatus(s,id,week=weekKey()){
  return s.challengeWeeks[week]?.[id]||{best:0,claimed:[]};
}
export function recordTrial(s,r,floor){
  if(!r.challenge)return;
  const {id,week}=r.challenge;
  s.challengeWeeks[week]||={};s.challengeWeeks[week][id]||={best:0,claimed:[]};
  s.challengeWeeks[week][id].best=Math.max(s.challengeWeeks[week][id].best,Math.min(TRIAL[id].goal,floor));
  const keys=Object.keys(s.challengeWeeks).sort();
  // Keep the active run's week even when the device clock crosses a reset.
  while(keys.length>12){const i=keys.findIndex(k=>k!==week&&k!==weekKey());if(i<0)break;delete s.challengeWeeks[keys.splice(i,1)[0]];}
}
export function claimTrial(s,id,floor,week=weekKey()){
  if(!Object.hasOwn(TRIAL,id)||!validWeek(week))throw new Error('Thử thách không hợp lệ.');
  const def=TRIAL[id],index=def.milestones.indexOf(floor),record=s.challengeWeeks[week]?.[id];
  if(index<0||!record||record.best<floor||record.claimed.includes(floor))throw new Error('Mốc thử thách chưa hoàn thành hoặc đã nhận.');
  const prize=TRIAL_REWARDS[index];record.claimed.push(floor);
  for(const k of ['tickets','gold','dust','shards'])s[k]+=prize[k];
  return prize;
}
export function validateProgression(s){
  for(const own of Object.values(s.owned))if(!Number.isInteger(own.awaken)||own.awaken<0||own.awaken>AWAKEN_MAX||!Number.isSafeInteger(own.copies)||own.copies<0||own.copies>1e9)throw new Error('Thức tỉnh anh hùng không hợp lệ.');
  const weeks=s.challengeWeeks;
  if(!weeks||typeof weeks!=='object'||Array.isArray(weeks)||Object.keys(weeks).length>12)throw new Error('Nhật ký thử thách không hợp lệ.');
  for(const [week,records] of Object.entries(weeks)){
    if(!validWeek(week)||!records||typeof records!=='object'||Array.isArray(records))throw new Error('Tuần thử thách không hợp lệ.');
    for(const [id,record] of Object.entries(records)){
      if(!Object.hasOwn(TRIAL,id)||!record||!Number.isSafeInteger(record.best)||record.best<0||record.best>TRIAL[id].goal||!Array.isArray(record.claimed)||new Set(record.claimed).size!==record.claimed.length||record.claimed.some(f=>!TRIAL[id].milestones.includes(f)||f>record.best))throw new Error('Phần thưởng thử thách không hợp lệ.');
    }
  }
  const r=s.run;if(!r)return;
  if(!['normal','challenge','dungeon','hunt','campaign','raid','season'].includes(r.mode)||!Array.isArray(r.resonances)||new Set(r.resonances).size!==r.resonances.length||r.resonances.some(id=>!RESONANCES.some(a=>a.id===id))||r.resonances.some(id=>!teamResonances(r.heroes.map(h=>h.id)).includes(id)))throw new Error('Cộng hưởng đội hình không hợp lệ.');
  if(r.heroes.some(h=>!Number.isInteger(h.awaken)||h.awaken<0||h.awaken>AWAKEN_MAX))throw new Error('Thức tỉnh trong chuyến đi không hợp lệ.');
  if(r.mode==='normal'&&r.challenge!==null)throw new Error('Chế độ chuyến đi không hợp lệ.');
  if(r.mode==='challenge'){
    const c=r.challenge;
    if(!c||!Object.hasOwn(TRIAL,c.id)||!validWeek(c.week)||r.floor>TRIAL[c.id].goal||(c.id==='humble'&&r.heroes.some(h=>HERO[h.id].rarity!=='R'))||(c.id==='gauntlet'&&(r.routes.length!==1||r.routes[0]!=='boss'||(r.node!==null&&r.node!=='boss'))))throw new Error('Luật thử thách không hợp lệ.');
  }
}
