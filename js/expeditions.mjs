import {HEROES,HERO} from './data.mjs';

const MINUTE=60_000,HOUR=60*MINUTE;
export const EXPEDITION_SLOTS=[0,10,25];
export const EXPEDITIONS=[
  {id:'mist-path',name:'Lối mòn sương',tag:'THĂM DÒ',desc:'Theo dấu những cơn gió, gom vật tư quanh chân tháp.',element:'Phong',icon:'wind',color:'#9fc6b0',duration:15*MINUTE,unlock:0,gold:60,dust:1,boss:null,marks:0},
  {id:'old-mine',name:'Mỏ đá cổ',tag:'THU THẬP',desc:'Tìm vàng và bụi rèn trong những đường hầm bỏ quên.',element:'Thổ',icon:'forge',color:'#c6aa79',duration:2*HOUR,unlock:3,gold:320,dust:5,boss:null,marks:0},
  {id:'colossus-trail',name:'Dấu chân cự nhân',tag:'TÌM ẤN / THÀNH TRÌ',desc:'Khảo sát tàn tích để mang về ấn chế tác bộ Thành trì.',element:'Thổ',icon:'shield',color:'#b6ac87',duration:8*HOUR,unlock:5,gold:1000,dust:12,boss:'colossus',marks:2},
  {id:'archive-trail',name:'Thư viện thất lạc',tag:'TÌM ẤN / GƯƠNG HỘ VỆ',desc:'Giải mã những trang cổ thư, thu hồi ấn ký ức.',element:'Quang',icon:'star',color:'#bcb4d7',duration:8*HOUR,unlock:5,gold:1000,dust:12,boss:'archivist',marks:2},
  {id:'ash-trail',name:'Miền tro tàn',tag:'TÌM ẤN / TRO TÀN',desc:'Băng qua vùng đất âm ỉ để tìm ấn của Kỵ sĩ tro tàn.',element:'Hỏa',icon:'flame',color:'#d49b7c',duration:8*HOUR,unlock:5,gold:1000,dust:12,boss:'ashknight',marks:2},
  {id:'moon-trail',name:'Dưới vầng trăng',tag:'TÌM ẤN / HUYẾT NGUYỆT',desc:'Lần theo ánh nguyệt, thu nhặt những mảnh ấn bị lãng quên.',element:'Ảnh',icon:'moon',color:'#a6a7db',duration:8*HOUR,unlock:5,gold:1000,dust:12,boss:'moonwarden',marks:2}
];
export const EXPEDITION=Object.fromEntries(EXPEDITIONS.map(m=>[m.id,m]));
const int=(v,min=0,max=1e9)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const validTime=v=>int(v,0,8_640_000_000_000_000);
const mission=id=>Object.hasOwn(EXPEDITION,id)?EXPEDITION[id]:null;
const live=s=>s.run&&s.run.phase!=='result';
const runHeroIds=s=>s.run?.raid?s.run.raid.teams.flatMap(t=>t.heroes.map(h=>h.id)):s.run?.heroes.map(h=>h.id)||[];
function realState(s){if(s.run?.mode==='training')throw new Error('Thoát phòng thử để dùng viễn chinh.');}
function checkTime(now){if(!validTime(now))throw new Error('Thời gian thiết bị không hợp lệ.');}

export function starterExpeditions(){return {nextId:1,completed:0,slots:[null,null,null]};}
export function expeditionSlotUnlocked(s,slot){return int(slot,0,2)&&s.best>=EXPEDITION_SLOTS[slot];}
export function expeditionForHero(s,id){return s.expeditions.slots.find(t=>t?.hero===id)||null;}
export function expeditionHeroAvailable(s,id){
  return Object.hasOwn(HERO,id)&&Object.hasOwn(s.owned,id)&&!s.team.includes(id)&&!expeditionForHero(s,id)&&!(live(s)&&runHeroIds(s).includes(id));
}
export function expeditionHeroes(s){return HEROES.filter(h=>expeditionHeroAvailable(s,h.id));}
export function expeditionRewards(id,hero){
  const m=mission(id);if(!m||!Object.hasOwn(HERO,hero))throw new Error('Chuyến viễn chinh không hợp lệ.');
  const bonus=HERO[hero].element===m.element,scale=bonus?1.25:1;
  return {gold:Math.floor(m.gold*scale),dust:Math.floor(m.dust*scale),marks:m.boss?{[m.boss]:m.marks}:{}};
}
export function dispatchExpedition(s,id,hero,slot,now=Date.now()){
  realState(s);checkTime(now);const m=mission(id);
  if(!m||s.best<m.unlock)throw new Error('Chinh phục thêm tầng tháp để mở chuyến này.');
  if(!expeditionSlotUnlocked(s,slot))throw new Error('Ô viễn chinh chưa mở.');
  if(s.expeditions.slots[slot])throw new Error('Ô này đang có chuyến đi. Hãy nhận thưởng hoặc thu hồi trước.');
  if(!expeditionHeroAvailable(s,hero))throw new Error('Chọn tướng đã sở hữu, ngoài đội chính và chưa đi viễn chinh.');
  if(!int(s.expeditions.nextId,1,1e9-1)||!validTime(now+m.duration))throw new Error('Chưa thể khởi hành thêm. Hãy kiểm tra bản lưu hoặc đồng hồ.');
  const trip={id:s.expeditions.nextId++,mission:id,hero,startedAt:now,observedAt:now,endsAt:now+m.duration,rewards:expeditionRewards(id,hero)};
  s.expeditions.slots[slot]=trip;return structuredClone(trip);
}
// Remember observed progress so moving the device clock back cannot undo it.
// Only one trip is paid per dispatch; elapsed offline time never auto-repeats it.
export function observeExpeditions(s,now=Date.now()){
  checkTime(now);let changed=false;
  for(const t of s.expeditions.slots){if(!t)continue;const observed=Math.min(t.endsAt,Math.max(t.observedAt,now));if(observed!==t.observedAt){t.observedAt=observed;changed=true;}}
  return changed;
}
export function expeditionStatus(s,slot,now=Date.now()){
  checkTime(now);const t=s.expeditions.slots[slot];if(!t)return null;
  const duration=t.endsAt-t.startedAt,elapsed=Math.min(duration,Math.max(t.observedAt,now)-t.startedAt),remaining=Math.max(0,duration-elapsed);
  return {ready:remaining===0,remaining,progress:Math.max(0,Math.min(100,elapsed/duration*100))};
}
export function readyExpeditions(s,now=Date.now()){return s.expeditions.slots.flatMap((t,i)=>t&&expeditionStatus(s,i,now).ready?[i]:[]);}
function claimSlots(s,slots,now){
  realState(s);checkTime(now);if(!slots.length)throw new Error('Chưa có chuyến viễn chinh nào hoàn tất.');
  const reward={gold:0,dust:0,marks:{}};
  for(const slot of slots){
    if(!int(slot,0,2)||!s.expeditions.slots[slot]||!expeditionStatus(s,slot,now).ready)throw new Error('Chuyến viễn chinh chưa hoàn tất.');
    const r=s.expeditions.slots[slot].rewards;reward.gold+=r.gold;reward.dust+=r.dust;for(const [id,n] of Object.entries(r.marks))reward.marks[id]=(reward.marks[id]||0)+n;
  }
  if(!int(s.gold+reward.gold)||!int(s.dust+reward.dust)||!int(s.expeditions.completed+slots.length)||Object.entries(reward.marks).some(([id,n])=>!int(s.armory.marks[id]+n)))throw new Error('Tài nguyên đã chạm giới hạn. Hãy dùng bớt trước khi nhận.');
  s.gold+=reward.gold;s.dust+=reward.dust;for(const [id,n] of Object.entries(reward.marks))s.armory.marks[id]+=n;
  s.expeditions.completed+=slots.length;for(const slot of slots)s.expeditions.slots[slot]=null;return reward;
}
export function claimExpedition(s,slot,now=Date.now()){return claimSlots(s,[slot],now);}
export function claimAllExpeditions(s,now=Date.now()){return claimSlots(s,readyExpeditions(s,now),now);}
export function recallExpedition(s,slot,now=Date.now()){
  realState(s);checkTime(now);if(!int(slot,0,2)||!s.expeditions.slots[slot])throw new Error('Không tìm thấy chuyến viễn chinh.');
  if(expeditionStatus(s,slot,now).ready)throw new Error('Chuyến đã hoàn tất. Hãy nhận thưởng để đưa tướng về.');
  const hero=s.expeditions.slots[slot].hero;s.expeditions.slots[slot]=null;return hero;
}
function sameReward(a,b){return record(a)&&Object.keys(a).length===3&&a.gold===b.gold&&a.dust===b.dust&&record(a.marks)&&Object.keys(a.marks).length===Object.keys(b.marks).length&&Object.entries(b.marks).every(([id,n])=>Object.hasOwn(a.marks,id)&&a.marks[id]===n);}
export function validateExpeditions(s){
  const e=s.expeditions;
  if(!record(e)||!int(e.nextId,1)||!int(e.completed,0,e.nextId-1)||!Array.isArray(e.slots)||e.slots.length!==3)throw new Error('Dữ liệu viễn chinh không hợp lệ.');
  const ids=new Set(),heroes=new Set();let count=0;
  for(let slot=0;slot<3;slot++){
    const t=e.slots[slot];if(t===null)continue;const m=record(t)&&mission(t.mission);
    if(!m||!int(t.id,1,e.nextId-1)||ids.has(t.id)||!Object.hasOwn(HERO,t.hero)||!Object.hasOwn(s.owned,t.hero)||heroes.has(t.hero)||!expeditionSlotUnlocked(s,slot)||s.best<m.unlock||s.team.includes(t.hero)||(live(s)&&runHeroIds(s).includes(t.hero))||!validTime(t.startedAt)||!validTime(t.endsAt)||t.endsAt-t.startedAt!==m.duration||!int(t.observedAt,t.startedAt,t.endsAt)||!sameReward(t.rewards,expeditionRewards(m.id,t.hero)))throw new Error('Chuyến viễn chinh trong bản lưu không hợp lệ.');
    ids.add(t.id);heroes.add(t.hero);count++;
  }
  if(e.completed+count>=e.nextId)throw new Error('Tiến độ viễn chinh không hợp lệ.');
}
