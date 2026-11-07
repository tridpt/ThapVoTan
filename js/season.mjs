import {HERO} from './data.mjs';
import {SEASON_DAYS,SEASON_FLOORS,SEASON_ROUTES,SEASON_CURSES,SEASON_CURSE,SEASON_DAILY,SEASON_MILESTONES,SEASON_FRAGMENT_HEROES,SEASON_FRAGMENT_COST,SEASON_COSMETICS,SEASON_SHOP,SEASON_ITEM,SEASON_BOSS} from './season-data.mjs';
export * from './season-data.mjs';
const MAX=1e9,metrics=['battles','skills','clears'];
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(n,min=0,max=MAX)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const exact=(v,keys)=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const list=(v,values)=>Array.isArray(v)&&new Set(v).size===v.length&&v.every(id=>values.includes(id));
export function seasonDayOrdinal(key){
  if(typeof key!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
  const [y,m,d]=key.split('-').map(Number),date=new Date(0);date.setUTCFullYear(y,m-1,d);date.setUTCHours(0,0,0,0);
  return y>=1&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date.getTime()/86400000:null;
}
function localKey(date){
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Ngày sự kiện không hợp lệ.');
  const key=`${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if(seasonDayOrdinal(key)===null)throw new Error('Ngày sự kiện không hợp lệ.');return key;
}
const keyFromOrdinal=n=>{const d=new Date(n*86400000);return `${String(d.getUTCFullYear()).padStart(4,'0')}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;};
const newDaily=day=>({day,battles:0,skills:0,clears:0,claimed:[]});
const newCycle=(cycle,day)=>({cycle,earned:0,battles:0,skills:0,clears:0,daily:newDaily(day),claimed:[],purchases:{}});
export const starterSeason=()=>({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null});
export const seasonAuraActive=s=>!!s?.season?.aura&&s.season.cosmetics.includes('aura-eclipse');
export const seasonCurse=r=>r?.mode==='season'&&r.season?.rules===1&&Object.hasOwn(SEASON_CURSE,r.season.curse)?SEASON_CURSE[r.season.curse]:null;
export const seasonSkillMultiplier=r=>seasonCurse(r)?.skill||1;
export const seasonHealingMultiplier=r=>seasonCurse(r)?.healing||1;
export const seasonShieldMultiplier=r=>seasonCurse(r)?.shield||1;
export const seasonEnemyHpMultiplier=r=>seasonCurse(r)?.enemyHp||1;
export const seasonIncomingMultiplier=r=>seasonCurse(r)?.incoming||1;
export const seasonBasicEnergy=r=>seasonCurse(r)?.energy||0;
export const seasonOpeningEnergy=r=>seasonCurse(r)?.opening||0;

export function validateSeason(s){
  const p=s?.season;
  if(!exact(p,['anchor','lastDay','wallet','fragments','cosmetics','aura','current'])||!integer(p.wallet)||!exact(p.fragments,SEASON_FRAGMENT_HEROES)||SEASON_FRAGMENT_HEROES.some(id=>!integer(p.fragments[id]))||!list(p.cosmetics,SEASON_COSMETICS)||typeof p.aura!=='boolean'||p.aura&&!p.cosmetics.includes('aura-eclipse'))throw new Error('Dữ liệu mùa sự kiện không hợp lệ.');
  if(p.anchor===null){if(p.lastDay!==null||p.current!==null||p.wallet||Object.values(p.fragments).some(Boolean)||p.cosmetics.length||p.aura)throw new Error('Mùa sự kiện chưa bắt đầu không hợp lệ.');}
  else{
    const first=seasonDayOrdinal(p.anchor),last=seasonDayOrdinal(p.lastDay),c=p.current;
    if(first===null||last===null||last<first||!exact(c,['cycle','earned','battles','skills','clears','daily','claimed','purchases'])||c.cycle!==Math.floor((last-first)/SEASON_DAYS)||!integer(c.earned)||metrics.some(k=>!integer(c[k]))||c.clears>c.battles||!exact(c.daily,['day',...metrics,'claimed'])||c.daily.day!==(last-first)%SEASON_DAYS+1||metrics.some(k=>!integer(c.daily[k])||c.daily[k]>c[k])||!list(c.daily.claimed,metrics)||!list(c.claimed,SEASON_MILESTONES.map(m=>m.id))||c.claimed.some(id=>SEASON_MILESTONES.find(m=>m.id===id).goal>c.earned)||!record(c.purchases)||Object.entries(c.purchases).some(([id,n])=>!Object.hasOwn(SEASON_ITEM,id)||!integer(n,1,SEASON_ITEM[id].limit)))throw new Error('Tiến trình mùa sự kiện không hợp lệ.');
    if(SEASON_DAILY[c.daily.day-1].missions.some(m=>c.daily.claimed.includes(m.id)&&c.daily[m.metric]<m.goal)||c.daily.clears>c.daily.battles)throw new Error('Nhiệm vụ mùa sự kiện không hợp lệ.');
    for(const item of SEASON_SHOP)if(item.kind==='cosmetic'&&c.purchases[item.id]&&!p.cosmetics.includes(item.cosmetic))throw new Error('Vật phẩm sự kiện chưa được lưu.');
  }
  const r=s.run;if(!r)return;
  if(r.mode!=='season'){if(Object.hasOwn(r,'season')||r.battle?.bossState?.id===SEASON_BOSS.id||r.battle?.enemies?.some(e=>e.bossId===SEASON_BOSS.id))throw new Error('Chế độ sự kiện không hợp lệ.');return;}
  const snap=r.season;
  if(!exact(snap,['rules','anchor','cycle','day','curse','seals'])||snap.rules!==1||snap.anchor!==p.anchor||!integer(snap.cycle)||!integer(snap.day,1,14)||!integer(snap.seals)||!p.current||snap.cycle>p.current.cycle||snap.cycle===p.current.cycle&&snap.day>p.current.daily.day||snap.curse!==SEASON_CURSES[(snap.cycle+snap.day-1)%SEASON_CURSES.length].id||!integer(r.floor,1,SEASON_FLOORS)||r.cleared>SEASON_FLOORS||r.map!==null||r.challenge!==null||r.dungeon!==null||r.campaign!==null||r.hunt!==null||r.training!==null||r.raid!==null||!['route','battle','blessing','result'].includes(r.phase)||r.routes.length!==SEASON_ROUTES[r.floor-1].length||r.routes.some((id,i)=>id!==SEASON_ROUTES[r.floor-1][i])||r.node!==null&&!r.routes.includes(r.node)||['route','battle','blessing'].includes(r.phase)&&r.cleared!==r.floor-1||r.phase==='blessing'&&r.floor===SEASON_FLOORS)throw new Error('Hành trình mùa sự kiện không hợp lệ.');
  if(r.lastReward&&(!integer(r.lastReward.seasonSeals,0,15)||r.lastReward.seasonSeals>snap.seals))throw new Error('Ấn chiến lợi phẩm không hợp lệ.');
  if(r.node==='boss'&&(r.battle?.bossState?.id!==SEASON_BOSS.id||r.battle.enemies.length!==1||r.battle.enemies[0].bossId!==SEASON_BOSS.id))throw new Error('Boss sự kiện không hợp lệ.');
  if(r.phase==='result'&&r.summary.reason==='victory'&&(r.floor!==5||r.cleared!==5||r.summary.cleared!==5||r.battle?.enemies.some(e=>e.hp>0)))throw new Error('Kết quả sự kiện không hợp lệ.');
}

// Project against local calendar dates; never advance the ledger while the clock is behind.
function projectSeason(s,date){
  validateSeason(s);const today=localKey(date),p=structuredClone(s.season);
  const clockSkew=p.lastDay!==null&&seasonDayOrdinal(today)<seasonDayOrdinal(p.lastDay);
  if(clockSkew)return {p,today,clockSkew};
  if(p.anchor===null)p.anchor=today;
  const offset=seasonDayOrdinal(today)-seasonDayOrdinal(p.anchor),cycle=Math.floor(offset/SEASON_DAYS),day=offset%SEASON_DAYS+1;
  if(p.current?.cycle!==cycle)p.current=newCycle(cycle,day);
  else if(p.current.daily.day!==day)p.current.daily=newDaily(day);
  p.lastDay=today;return {p,today,clockSkew};
}
export function observeSeason(s,date=new Date(),start=false){
  if(s.run?.training||s.run?.mode==='training'||s.season.anchor===null&&!start)return false;
  const {p}=projectSeason(s,date);if(JSON.stringify(p)===JSON.stringify(s.season))return false;s.season=p;return true;
}
export function seasonStatus(s,date=new Date()){
  const {p,today,clockSkew}=projectSeason(s,date),c=p.current,day=c.daily.day,curse=SEASON_CURSES[(c.cycle+day-1)%3],training=!!s.run?.training||s.run?.mode==='training';
  const stamp=JSON.stringify([p.anchor,c.cycle,day]),end=keyFromOrdinal(seasonDayOrdinal(p.anchor)+(c.cycle+1)*SEASON_DAYS-1);
  const missions=SEASON_DAILY[day-1].missions.map(m=>({...m,progress:Math.min(m.goal,c.daily[m.metric]),claimed:c.daily.claimed.includes(m.id),ready:!clockSkew&&!training&&!c.daily.claimed.includes(m.id)&&c.daily[m.metric]>=m.goal}));
  const milestones=SEASON_MILESTONES.map(m=>({...m,claimed:c.claimed.includes(m.id),ready:!clockSkew&&!training&&!c.claimed.includes(m.id)&&c.earned>=m.goal}));
  return {anchor:p.anchor,today,cycle:c.cycle,day,remaining:SEASON_DAYS-day+1,end,stamp,curse,training,clockSkew,wallet:p.wallet,earned:c.earned,battles:c.battles,clears:c.clears,daily:SEASON_DAILY[day-1],missions,milestones,fragments:p.fragments,cosmetics:p.cosmetics,aura:p.aura,ready:missions.some(m=>m.ready)||milestones.some(m=>m.ready)};
}
const accountBlock=s=>{if(s.run?.training||s.run?.mode==='training')throw new Error('Thoát Phòng thử để dùng sự kiện.');};
const validClock=result=>{if(result.clockSkew)throw new Error('Ngày thiết bị đang lùi. Hãy chờ ngày đã ghi nhận để nhận thưởng.');};
function credit(p,amount){const gain=Math.min(amount,MAX-p.wallet,MAX-p.current.earned);p.wallet+=gain;p.current.earned+=gain;return gain;}
function walletCheck(s,reward){for(const [key,n] of Object.entries(reward))if(!integer(s[key])||s[key]+n>MAX)throw new Error('Tài nguyên đã đạt giới hạn.');}
export function claimSeasonMission(s,id,stamp,date=new Date()){
  accountBlock(s);const status=seasonStatus(s,date),q=status.missions.find(m=>m.id===id);validClock(status);
  if(typeof stamp!=='string'||stamp!==status.stamp)throw new Error('Nhiệm vụ đã sang ngày hoặc mùa mới. Hãy mở lại sự kiện.');
  if(!q||!q.ready)throw new Error('Nhiệm vụ chưa hoàn thành hoặc đã nhận.');
  const {p}=projectSeason(s,date);if(p.wallet+q.seals>MAX||p.current.earned+q.seals>MAX)throw new Error('Ấn sự kiện đã đạt giới hạn.');
  credit(p,q.seals);p.current.daily.claimed.push(id);s.season=p;return {...q};
}
export function claimSeasonMilestone(s,id,stamp,date=new Date()){
  accountBlock(s);const status=seasonStatus(s,date),q=status.milestones.find(m=>m.id===id);validClock(status);
  if(typeof stamp!=='string'||stamp!==status.stamp)throw new Error('Mốc thưởng đã sang ngày hoặc mùa mới. Hãy mở lại sự kiện.');
  if(!q||!q.ready)throw new Error('Mốc sự kiện chưa hoàn thành hoặc đã nhận.');walletCheck(s,q.reward);
  const {p}=projectSeason(s,date);p.current.claimed.push(id);for(const [key,n] of Object.entries(q.reward))s[key]+=n;s.season=p;return {...q.reward};
}
export function seasonShopStatus(s,id,date=new Date()){
  if(typeof id!=='string'||!Object.hasOwn(SEASON_ITEM,id))throw new Error('Vật phẩm sự kiện không tồn tại.');
  const item=SEASON_ITEM[id],status=seasonStatus(s,date),{p}=projectSeason(s,date),bought=p.current.purchases[id]||0;
  const owned=item.kind==='cosmetic'&&(p.cosmetics.includes(item.cosmetic)||(item.cosmetic==='rook-guardian'&&s.best>=5)||(item.cosmetic==='aerin-moon'&&s.best>=10));
  const blocked=status.training?'Thoát Phòng thử để đổi quà.':status.clockSkew?'Ngày thiết bị đang lùi.':owned?'Bạn đã mở ngoại hình này.':bought>=item.limit?'Đã hết lượt đổi trong mùa.':status.wallet<item.cost?'Chưa đủ Ấn hắc nguyệt.':null;
  return {item,bought,remaining:item.limit-bought,owned,blocked,canBuy:!blocked};
}
export function seasonReceipt(s,date=new Date()){
  const {p,today,clockSkew}=projectSeason(s,date);
  return JSON.stringify([today,clockSkew,p,s.gold,s.tickets,s.dust,s.shards,s.best,SEASON_FRAGMENT_HEROES.map(id=>s.owned[id]||null),!!s.run?.training]);
}
export function buySeasonItem(s,id,receipt,date=new Date()){
  accountBlock(s);const status=seasonShopStatus(s,id,date);
  if(typeof receipt!=='string'||receipt!==seasonReceipt(s,date))throw new Error('Quà hoặc số ấn đã thay đổi. Hãy mở lại xác nhận đổi.');
  if(status.blocked)throw new Error(status.blocked);
  const {item}=status,{p}=projectSeason(s,date);
  if(item.kind==='resource')walletCheck(s,{[item.resource]:item.amount});
  if(item.kind==='fragment'&&p.fragments[item.hero]+item.amount>MAX)throw new Error('Mảnh anh hùng đã đạt giới hạn.');
  p.wallet-=item.cost;p.current.purchases[id]=status.bought+1;
  if(item.kind==='resource')s[item.resource]+=item.amount;
  if(item.kind==='fragment')p.fragments[item.hero]+=item.amount;
  if(item.kind==='cosmetic')p.cosmetics.push(item.cosmetic);
  s.season=p;return {...item};
}
export function fuseSeasonHero(s,id,receipt,date=new Date()){
  accountBlock(s);if(typeof id!=='string'||!SEASON_FRAGMENT_HEROES.includes(id))throw new Error('Mảnh anh hùng không hợp lệ.');
  const status=seasonStatus(s,date);validClock(status);
  if(typeof receipt!=='string'||receipt!==seasonReceipt(s,date))throw new Error('Mảnh hoặc anh hùng đã thay đổi. Hãy mở lại xác nhận ghép.');
  const {p}=projectSeason(s,date),own=s.owned[id];
  if(p.fragments[id]<SEASON_FRAGMENT_COST)throw new Error('Cần đủ 60 mảnh để ghép anh hùng.');
  if(own&&!integer(own.copies,0,MAX-1))throw new Error('Bản trùng đã đạt giới hạn.');
  p.fragments[id]-=SEASON_FRAGMENT_COST;if(own)own.copies++;else s.owned[id]={level:1,copies:0,awaken:0};s.season=p;
  return {id,isNew:!own,name:HERO[id].name};
}
export function setSeasonAura(s,enabled){
  accountBlock(s);validateSeason(s);if(typeof enabled!=='boolean'||!s.season.cosmetics.includes('aura-eclipse'))throw new Error('Cần mở Hào quang Hắc nguyệt trước.');
  if(s.season.aura===enabled)return false;s.season.aura=enabled;return true;
}
export function snapshotSeason(s,date=new Date()){
  accountBlock(s);const status=seasonStatus(s,date);validClock(status);
  observeSeason(s,date,true);return {rules:1,anchor:status.anchor,cycle:status.cycle,day:status.day,curse:status.curse.id,seals:0};
}
function recordSeason(s,metric,date){
  const r=s.run;if(!seasonCurse(r)||r.training||r.mode==='training')return null;
  const {p,clockSkew}=projectSeason(s,date);if(clockSkew)return null;
  // Journeys may finish after the season ends, with their original combat rules.
  if(r.season.anchor!==p.anchor||r.season.cycle!==p.current.cycle){s.season=p;return null;}
  for(const k of metric){p.current[k]=Math.min(MAX,p.current[k]+1);p.current.daily[k]=Math.min(MAX,p.current.daily[k]+1);}
  return p;
}
export function recordSeasonSkill(s,date=new Date()){
  const p=recordSeason(s,['skills'],date);if(p)s.season=p;
}
export function recordSeasonVictory(s,date=new Date()){
  const r=s.run,final=r?.floor===SEASON_FLOORS&&r.node==='boss',p=recordSeason(s,final?['battles','clears']:['battles'],date);if(!p)return 0;
  const gain=credit(p,final?15:r.node==='elite'?5:3);r.season.seals=Math.min(MAX,r.season.seals+gain);s.season=p;return gain;
}
