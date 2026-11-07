import {HERO} from './data.mjs';
import {expeditionForHero} from './expeditions.mjs';
import {validFormation} from './formation.mjs';
import {validateArmory} from './armory.mjs';
import {validateTalents} from './talents.mjs';
import {dropGearAtRarity,validateEquipment,dismantleValue} from './equipment.mjs';
import {VOID_DRAGON,VOID_RAID_TIERS,VOID_RAID_STAGES} from './raid-data.mjs';
export {VOID_DRAGON,VOID_RAID_TIERS,VOID_RAID_STAGES} from './raid-data.mjs';

export const RAID_NAME='Thủ vệ Tam Ấn';
export const RAID_TIERS=[
  {name:'Khám phá',scale:1.7,level:10,gold:350,essence:4,rarity:'SSR'},
  {name:'Tinh anh',scale:3.4,level:25,gold:650,essence:8,rarity:'UR'},
  {name:'Ác mộng',scale:6,level:45,gold:1000,essence:14,rarity:'LR'}
];
export const RAID_STAGES=[
  {name:'Phá giáp cổ thạch',icon:'shield',color:'#b4cfac',world:'forest',mechanic:'Giáp lõi giảm 45% sát thương trực tiếp từ anh hùng. Chọn Lõi và phá giáp để mở điểm yếu.',tip:'Dồn sát thương vào Lõi; mang tướng gây sát thương ổn định.'},
  {name:'Ngắt địa chấn',icon:'flame',color:'#edb18a',world:'lava',mechanic:'Boss bắt đầu tụ lực. Dùng hai kỹ năng tấn công khi đang tụ lực, đóng băng hoặc phá Đầu để ngắt địa chấn.',tip:'Đội vào trận với 100 năng lượng. Giữ kỹ năng để ngắt tụ lực.'},
  {name:'Ấn triệu hồn',icon:'moon',color:'#c8b6ed',world:'sky',mechanic:'Hai bóng hộ vệ che chắn 35% sát thương lên boss. Boss gọi lại lính sau mỗi chu kỳ ba lượt.',tip:'Ưu tiên lính triệu hồi; dùng chiêu đánh nhiều mục tiêu.'}
];
export const RAID_MISSIONS=[
  {id:'first',name:'Phá Tam Ấn lần đầu',desc:'Thắng cả 3 giai đoạn ở độ khó này.',icon:'crown',metric:'clears',goal:1,rewards:[{tickets:3,gold:500,essence:4},{tickets:5,gold:1000,essence:8},{tickets:8,gold:1800,essence:14}]},
  {id:'veteran',name:'Người giữ ấn',desc:'Hoàn thành 5 chuyến đột kích ở độ khó này.',icon:'shield',metric:'clears',goal:5,rewards:[{tickets:2,dust:100},{tickets:3,dust:180},{tickets:5,dust:300}]},
  {id:'master',name:'Chủ nhân Tam Ấn',desc:'Hoàn thành 15 chuyến đột kích ở độ khó này.',icon:'star',metric:'clears',goal:15,rewards:[{tickets:4,essence:8},{tickets:6,essence:16},{tickets:10,essence:28}]},
  {id:'swift',name:'Chớp nhoáng',desc:'Thắng cả 3 giai đoạn trong tổng tối đa 12 vòng.',icon:'bolt',metric:'bestRounds',goal:12,rewards:[{tickets:2,gold:600},{tickets:3,gold:1000},{tickets:5,gold:1600}]},
  {id:'united',name:'Vẹn nguyên',desc:'Thắng cả 3 giai đoạn; mỗi đội còn đủ 3 tướng khi thắng. Có tính hồi sinh.',icon:'heroes',metric:'fullParty',goal:1,rewards:[{tickets:2,dust:120},{tickets:3,dust:200},{tickets:5,dust:350}]}
];
const int=(n,min=0,max=1e9)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const live=s=>s.run&&s.run.phase!=='result';
export const RAID_IDS=['tam-an','void-dragon'];
export const raidId=r=>r?.raid?.boss??'tam-an';
export function raidDefinition(id='tam-an'){
  if(id==='tam-an')return {id,name:RAID_NAME,bossId:'colossus',stages:RAID_STAGES,tiers:RAID_TIERS};
  if(id==='void-dragon')return {id,name:VOID_DRAGON.name,bossId:VOID_DRAGON.id,stages:VOID_RAID_STAGES,tiers:VOID_RAID_TIERS};
  throw new Error('Boss đột kích không hợp lệ.');
}
const emptyRecords=()=>Array.from({length:3},()=>({clears:0,bestRounds:null,fullParty:false,claimed:[]}));
export const starterDragonRaids=()=>({records:emptyRecords(),scales:0});
export const raidRecords=(s,boss='tam-an')=>boss==='tam-an'?s.raids.records:boss==='void-dragon'?s.raids.dragon.records:null;
export function raidMissions(boss='tam-an'){
  raidDefinition(boss);
  return boss==='tam-an'?RAID_MISSIONS:RAID_MISSIONS.map((m,i)=>({...m,name:['Hắc Long sơ chiến','Thợ săn long ấn','Khắc tinh Hắc Long','Chớp nhoáng','Vẹn nguyên'][i],desc:i===0?'Đánh bại cả 3 giai đoạn Hắc Long ở độ khó này.':m.desc}));
}
export const raidPartyIds=r=>r?.raid?.teams.flatMap(t=>t.heroes.map(h=>h.id))||r?.heroes?.map(h=>h.id)||[];
export function starterRaids(){return {teams:Array.from({length:3},()=>[null,null,null]),fronts:[1,1,1],records:emptyRecords(),dragon:starterDragonRaids()};}
export function migrateDragonRaids(s){if(!record(s.raids)||Object.keys(s.raids).length!==3||Object.hasOwn(s.raids,'dragon'))throw new Error('Bản lưu đột kích cũ không hợp lệ.');s.raids.dragon=starterDragonRaids();}
export function migrateRaidMissions(s){
  const a=s.raids;
  if(!record(a)||Object.keys(a).length!==3||!Array.isArray(a.records)||a.records.length!==3||a.records.some(v=>!record(v)||Object.keys(v).length!==2||!Object.hasOwn(v,'clears')||!Object.hasOwn(v,'bestRounds')))throw new Error('Kỷ lục đột kích cũ không hợp lệ.');
  // Old clears and speed records are evidence. Only the saved winning run can prove all nine survived.
  const r=s.run,won=r?.mode==='raid'&&r.phase==='result'&&r.summary?.reason==='victory';
  a.records=a.records.map((v,i)=>({...v,fullParty:!!(won&&r.raid?.difficulty===i+1&&Array.isArray(r.raid.reports)&&r.raid.reports.length===3&&r.raid.reports.every(p=>p?.survivors===3)),claimed:[]}));
}
export function raidMissionStatus(s,tier,id,boss='tam-an'){
  const mission=raidMissions(boss).find(m=>m.id===id);
  if(!int(tier,1,3)||!mission)throw new Error('Nhiệm vụ đột kích không hợp lệ.');
  const rec=raidRecords(s,boss)[tier-1],value=rec[mission.metric];
  const complete=mission.metric==='bestRounds'?value!==null&&value<=mission.goal:mission.metric==='fullParty'?value===true:value>=mission.goal;
  const claimed=rec.claimed.includes(id);
  return {value,complete,claimed,ready:complete&&!claimed,reward:{tickets:0,gold:0,dust:0,essence:0,...mission.rewards[tier-1]}};
}
export function readyRaidMissions(s,boss=null){return (boss===null?RAID_IDS:[boss]).flatMap(b=>raidDefinition(b).tiers.flatMap((_,i)=>raidMissions(b).filter(m=>raidMissionStatus(s,i+1,m.id,b).ready).map(m=>({...((b==='void-dragon')?{boss:b}:{}),tier:i+1,id:m.id}))));}
function payRaidMissions(s,tier,ids,boss){
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để nhận quà đột kích.');
  if(!ids.length)throw new Error('Chưa có nhiệm vụ đột kích để nhận thưởng.');
  const reward={tickets:0,gold:0,dust:0,essence:0};
  for(const id of ids){const status=raidMissionStatus(s,tier,id,boss);if(!status.ready)throw new Error('Nhiệm vụ chưa hoàn thành hoặc đã nhận thưởng.');for(const key of Object.keys(reward))reward[key]+=status.reward[key];}
  if(Object.entries(reward).some(([key,n])=>!int((key==='essence'?s.armory.essence:s[key])+n)))throw new Error('Tài nguyên đã chạm giới hạn. Hãy dùng bớt trước khi nhận.');
  for(const [key,n] of Object.entries(reward))if(key==='essence')s.armory.essence+=n;else s[key]+=n;
  raidRecords(s,boss)[tier-1].claimed.push(...ids);
  return {count:ids.length,reward};
}
export function claimRaidMission(s,tier,id,boss='tam-an'){return payRaidMissions(s,tier,[id],boss);}
export function claimAllRaidMissions(s,tier,boss='tam-an'){
  if(!int(tier,1,3))throw new Error('Độ khó không hợp lệ.');
  return payRaidMissions(s,tier,raidMissions(boss).filter(m=>raidMissionStatus(s,tier,m.id,boss).ready).map(m=>m.id),boss);
}
export function raidUnlocked(s,tier,boss='tam-an'){return RAID_IDS.includes(boss)&&int(tier,1,3)&&(boss!=='void-dragon'||s.raids.records[1].clears>0)&&(tier===1||raidRecords(s,boss)[tier-2].clears>0);}
export function raidBlocker(s,tier=1,boss='tam-an'){
  if(live(s))return 'Hoàn thành hoặc rời chuyến đang chơi trước khi đột kích.';
  raidDefinition(boss);
  if(boss==='void-dragon'&&!s.raids.records[1].clears)return 'Thắng Tam Ấn · Tinh anh để mở Hắc Long Hư Không.';
  if(!raidUnlocked(s,tier,boss))return 'Thắng mức khó trước để mở mức này.';
  const ids=s.raids.teams.flat();
  if(ids.some(id=>id===null)||new Set(ids).size!==9||ids.some(id=>!Object.hasOwn(s.owned,id)))return 'Chọn đủ 9 anh hùng khác nhau, mỗi đội 3 người.';
  const busy=ids.find(id=>expeditionForHero(s,id));
  return busy?HERO[busy].name+' đang viễn chinh. Hãy nhận thưởng hoặc thu hồi trước.':'';
}
function editable(s){if(live(s))throw new Error('Đội đột kích được giữ nguyên đến khi kết thúc chuyến đi.');}
export function setRaidSlot(s,team,slot,id){
  editable(s);
  if(!int(team,0,2)||!int(slot,0,2)||(id!==null&&(!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id))))throw new Error('Vị trí đột kích không hợp lệ.');
  if(id&&expeditionForHero(s,id))throw new Error('Anh hùng đang viễn chinh.');
  const old=s.raids.teams[team][slot];
  if(id)for(const row of s.raids.teams){const other=row.indexOf(id);if(other>=0)row[other]=old;}
  s.raids.teams[team][slot]=id;
}
export function setRaidFront(s,team,front){editable(s);if(!int(team,0,2)||![1,2].includes(front))throw new Error('Hàng đột kích không hợp lệ.');s.raids.fronts[team]=front;}
export function autoRaidTeams(s){
  editable(s);
  const ids=Object.keys(s.owned).filter(id=>!expeditionForHero(s,id)).sort((a,b)=>s.owned[b].level-s.owned[a].level||HERO[b].hp-HERO[a].hp);
  if(ids.length<9)throw new Error('Cần ít nhất 9 anh hùng đang sẵn sàng. Triệu hồi thêm hoặc thu hồi viễn chinh.');
  const teams=[[],[],[]],take=(team,id)=>{team.push(id);ids.splice(ids.indexOf(id),1);};
  for(const team of teams){const id=ids.find(id=>['shield','guard'].includes(HERO[id].kind));if(id)take(team,id);}
  for(const team of teams){const id=ids.find(id=>HERO[id].kind==='heal');if(id)take(team,id);}
  while(teams.some(t=>t.length<3))for(const team of teams)if(team.length<3)take(team,ids[0]);
  s.raids.teams=teams;s.raids.fronts=[1,1,1];return structuredClone(teams);
}
export function raidReport(r){
  const rows=Object.values(r.statistics.rows);
  return {rounds:r.battle.round,survivors:r.heroes.filter(h=>h.hp>0).length,...Object.fromEntries(['damage','healing','shield'].map(k=>[k,rows.reduce((n,row)=>n+row[k],0)]))};
}
export function completeRaid(s,r,rng){
  const c=r.raid;
  if(!c||c.claimed||r.phase!=='battle'||c.stage!==2||c.reports.length!==3||r.battle.enemies.some(e=>e.hp>0))throw new Error('Phần thưởng đột kích chưa sẵn sàng.');
  const boss=raidId(r),tier=raidDefinition(boss).tiers[c.difficulty-1],rounds=c.reports.reduce((n,v)=>n+v.rounds,0),rec=raidRecords(s,boss)[c.difficulty-1];
  const loot=structuredClone(dropGearAtRarity(s,rng,tier.rarity));
  c.claimed=true;s.gold+=tier.gold;s.armory.essence+=tier.essence;r.goldEarned+=tier.gold;r.gearFound++;
  rec.clears++;rec.bestRounds=rec.bestRounds===null?rounds:Math.min(rec.bestRounds,rounds);
  rec.fullParty ||= c.reports.every(v=>v.survivors===3);
  if(boss==='void-dragon')s.raids.dragon.scales+=tier.scales;
  r.lastReward={gold:tier.gold,tickets:0,shards:0,boss:true,loot};
  return {difficulty:c.difficulty,gold:tier.gold,essence:tier.essence,rounds,...(boss==='void-dragon'?{boss,scales:tier.scales}:{})};
}
export function validateRaids(s){
  const a=s.raids;
  if(!record(a)||Object.keys(a).length!==4||!record(a.dragon)||Object.keys(a.dragon).length!==2||!Array.isArray(a.dragon.records)||a.dragon.records.length!==3||!int(a.dragon.scales)||!Array.isArray(a.teams)||a.teams.length!==3||a.teams.some(t=>!Array.isArray(t)||t.length!==3||t.some(id=>id!==null&&(!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id))))||!Array.isArray(a.fronts)||a.fronts.length!==3||a.fronts.some(n=>![1,2].includes(n))||!Array.isArray(a.records)||a.records.length!==3)throw new Error('Đội đột kích không hợp lệ.');
  const selected=a.teams.flat().filter(Boolean);
  if(new Set(selected).size!==selected.length)throw new Error('Anh hùng đột kích bị trùng.');
  for(const boss of RAID_IDS)for(let i=0;i<3;i++){
    const records=raidRecords(s,boss),v=records[i],missions=raidMissions(boss);
    if(!record(v)||Object.keys(v).length!==4||!int(v.clears)||(v.clears===0?v.bestRounds!==null:!int(v.bestRounds,3,1e7))||typeof v.fullParty!=='boolean'||(v.fullParty&&!v.clears)||!Array.isArray(v.claimed)||v.claimed.length>missions.length||new Set(v.claimed).size!==v.claimed.length||v.claimed.some(id=>!missions.some(m=>m.id===id))||(i>0&&v.clears>0&&records[i-1].clears===0)||(boss==='void-dragon'&&v.clears>0&&!a.records[1].clears))throw new Error('Kỷ lục đột kích không hợp lệ.');
    if(v.claimed.some(id=>!raidMissionStatus(s,i+1,id,boss).complete))throw new Error('Thưởng nhiệm vụ đột kích không hợp lệ.');
  }
  if(a.dragon.scales>a.dragon.records.reduce((n,v,i)=>n+v.clears*VOID_RAID_TIERS[i].scales,0))throw new Error('Vảy Hư Không không hợp lệ.');
  const r=s.run;if(!r)return;
  if(r.mode!=='raid'){if(r.raid!==null||r.phase==='relay'||r.summary?.raidReward)throw new Error('Chế độ đột kích không hợp lệ.');return;}
  const c=r.raid,boss=raidId(r);
  if(!record(c)||!RAID_IDS.includes(boss)||Object.keys(c).length!==(boss==='void-dragon'?6:5)||(Object.hasOwn(c,'boss')&&c.boss!=='void-dragon')||!raidUnlocked(s,c.difficulty,boss)||!int(c.stage,0,2)||typeof c.claimed!=='boolean'||!Array.isArray(c.teams)||c.teams.length!==3||!Array.isArray(c.reports)||c.reports.length>3||r.challenge!==null||r.dungeon!==null||r.campaign!==null||r.hunt!==null||r.training!==null||r.map!==null||r.floor!==c.stage+1||r.routes.length!==1||r.routes[0]!=='boss'||r.node!=='boss'||!['battle','relay','result'].includes(r.phase)||r.buffs.length||r.relics.length)throw new Error('Luật đột kích không hợp lệ.');
  for(const t of c.teams){
    if(!record(t)||Object.keys(t).length!==2||!validFormation(t.formation)||!Array.isArray(t.heroes)||t.heroes.length!==3)throw new Error('Đội tiếp sức không hợp lệ.');
    for(const h of t.heroes)if(!record(h)||!Object.hasOwn(HERO,h.id)||!Object.hasOwn(s.owned,h.id)||!['maxHp','atk','def','energy','awaken'].every(k=>int(h[k],k==='maxHp'?1:0,k==='energy'?100:k==='awaken'?5:1e9))||h.hp!==h.maxHp||h.shield!==0)throw new Error('Chỉ số đội tiếp sức không hợp lệ.');
    const view={...s,run:{...r,heroes:t.heroes}};validateArmory(view);validateTalents(view);
  }
  const ids=raidPartyIds(r);
  if(new Set(ids).size!==9||(r.phase!=='result'&&ids.some(id=>expeditionForHero(s,id))))throw new Error('Chín anh hùng đột kích không hợp lệ.');
  const active=c.teams[c.stage];
  if(r.formation.front!==active.formation.front||r.heroes.some((h,i)=>{const original=active.heroes[i];return h.id!==original.id||['atk','def','maxHp','awaken'].some(k=>h[k]!==original[k])||JSON.stringify(h.loadout)!==JSON.stringify(original.loadout)||JSON.stringify(h.talents)!==JSON.stringify(original.talents);}))throw new Error('Đội đang đánh không khớp đội tiếp sức.');
  if(!r.battle||r.battle.bossState?.id!==raidDefinition(boss).bossId||r.battle.enemies[0]?.bossId!==raidDefinition(boss).bossId||c.reports.some(v=>!record(v)||Object.keys(v).length!==5||!int(v.rounds,1,1e7)||!int(v.survivors,1,3)||!['damage','healing','shield'].every(k=>int(v[k],0,1e15))))throw new Error('Báo cáo đột kích không hợp lệ.');
  if(boss==='void-dragon'){const bs=r.battle.bossState,e=r.battle.enemies[0];if(!bs.parts||r.battle.enemies.length!==1||(c.stage===2&&bs.phase!==2)||(e.hp===0&&((c.stage===0&&bs.parts.arms.hp>0)||(c.stage===1&&bs.parts.core.hp>0))))throw new Error('Cơ chế Hắc Long không hợp lệ.');}
  const won=r.phase==='result'&&r.summary.reason==='victory',between=r.phase==='relay',expected=r.phase==='battle'?c.stage:between?c.stage+1:won?3:c.reports.length;
  if(c.reports.length!==expected||r.cleared!==c.reports.length||(between&&(c.stage===2||!r.victory))||(!won&&!between&&r.phase==='result'&&![c.stage,c.stage+1].includes(c.reports.length))||(c.reports.length>c.stage&&r.battle.enemies.some(e=>e.hp>0))||c.claimed!==won||(won&&c.stage!==2))throw new Error('Tiến độ đột kích không hợp lệ.');
  const p=r.summary?.raidReward,tier=raidDefinition(boss).tiers[c.difficulty-1];
  if(won){
    const loot=r.lastReward?.loot,rounds=c.reports.reduce((n,v)=>n+v.rounds,0),rec=raidRecords(s,boss)[c.difficulty-1];
    if(c.reports.every(v=>v.survivors===3)&&!rec.fullParty)throw new Error('Thành tích đủ đội đột kích không hợp lệ.');
    if(!record(p)||Object.keys(p).length!==(boss==='void-dragon'?6:4)||(boss==='void-dragon'&&(p.boss!==boss||p.scales!==tier.scales))||p.difficulty!==c.difficulty||p.gold!==tier.gold||p.essence!==tier.essence||p.rounds!==rounds||!rec.clears||rec.bestRounds>rounds||r.summary.cleared!==3||r.summary.gold!==tier.gold||r.goldEarned!==tier.gold||r.ticketsEarned!==0||r.gearFound!==1||r.lastReward.gold!==tier.gold||r.lastReward.tickets!==0||r.lastReward.shards!==0||!loot||loot.gear.rarity!==tier.rarity||loot.gear.level!==0||typeof loot.converted!=='boolean'||loot.dust!==(loot.converted?dismantleValue(loot.gear):0))throw new Error('Phần thưởng đột kích không hợp lệ.');
    validateEquipment({...s,inventory:[loot.gear],equipped:{}});
  }else if(p||r.lastReward||r.goldEarned||r.ticketsEarned||r.gearFound)throw new Error('Đột kích chưa hoàn thành không có thưởng rương.');
}
