import {ELEMENT,ELEMENTS,PET,PETS,PET_MAX_LEVEL,DUNGEON,DUNGEON_DIFFICULTIES,DUNGEON_ROOMS} from './adventure-data.mjs';

const integer=(n,min=0,max=1e9)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const record=o=>o&&typeof o==='object'&&!Array.isArray(o);
export function adventureDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function validDay(day){if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;const d=new Date(day+'T12:00:00');return Number.isFinite(d.getTime())&&adventureDay(d)===day;}
export function starterAdventure(){return {cores:Object.fromEntries(ELEMENTS.map(e=>[e.id,0])),pets:{mossling:{level:1}},equipped:'mossling',dungeons:Object.fromEntries(ELEMENTS.map(e=>[e.id,{best:0,clears:0}])),days:{}};}
export function petUpgradeCost(s,id){
  const level=s.adventure.pets[id]?.level;
  return level&&level<PET_MAX_LEVEL?{cores:2+Math.floor(level/3),gold:70+level*35}:null;
}
export function unlockPet(s,id){
  if(!Object.hasOwn(PET,id))throw new Error('Linh thú không tồn tại.');
  const p=PET[id],a=s.adventure;if(Object.hasOwn(a.pets,id))throw new Error('Bạn đã kết ước với linh thú này.');
  if(a.cores[p.element]<p.cost)throw new Error(`Cần ${p.cost} lõi ${ELEMENT[p.element].name}. Hãy hoàn thành phó bản cùng hệ.`);
  a.cores[p.element]-=p.cost;a.pets[id]={level:1};return p;
}
export function upgradePet(s,id){
  if(!Object.hasOwn(PET,id)||!Object.hasOwn(s.adventure.pets,id))throw new Error('Bạn chưa kết ước với linh thú này.');
  const p=PET[id],a=s.adventure,cost=petUpgradeCost(s,id);if(!cost)throw new Error('Linh thú đã đạt cấp tối đa.');
  if(a.cores[p.element]<cost.cores||s.gold<cost.gold)throw new Error('Chưa đủ lõi nguyên tố hoặc vàng để nâng linh thú.');
  a.cores[p.element]-=cost.cores;s.gold-=cost.gold;return ++a.pets[id].level;
}
export function equipPet(s,id){
  if(id!==null&&(!Object.hasOwn(PET,id)||!Object.hasOwn(s.adventure.pets,id)))throw new Error('Bạn chưa kết ước với linh thú này.');
  s.adventure.equipped=id;
}
export function snapshotPet(s,challenge=false){
  const id=s.adventure.equipped;return !challenge&&id?{id,level:s.adventure.pets[id].level,nextRound:1}:null;
}
export function petReady(r){return !!(r?.phase==='battle'&&r.pet&&r.battle.round>=r.pet.nextRound&&r.heroes.some(h=>h.hp>0));}
export function shouldUsePet(r){
  if(!petReady(r))return false;const kind=PET[r.pet.id].kind,alive=r.heroes.filter(h=>h.hp>0);
  return kind==='heal'?alive.some(h=>h.hp/h.maxHp<.85):kind==='energy'?alive.some(h=>h.energy<85):true;
}
export function petStrength(p){
  return {shield:.06+p.level*.004,heal:.05+p.level*.003,energy:10+Math.floor(p.level/4),burn:.5+p.level*.03,drain:1+p.level*.05,freeze:.6+p.level*.03,strike:1.3+p.level*.05};
}
export function dungeonStatus(s,id,difficulty=1,day=adventureDay()){
  const r=s.adventure.dungeons[id];return {...r,unlocked:difficulty<=r.best+1,dailyClaimed:!!s.adventure.days[day]?.[`${id}-${difficulty}`]};
}
export function completeDungeon(s,r){
  const c=r.dungeon,a=s.adventure,def=DUNGEON_DIFFICULTIES[c.difficulty-1],rec=a.dungeons[c.id],key=`${c.id}-${c.difficulty}`;
  const first=rec.best<c.difficulty,daily=!a.days[c.day]?.[key],cores=def.cores+(daily?def.daily:0)+(first?def.first:0);
  a.cores[c.id]+=cores;rec.best=Math.max(rec.best,c.difficulty);rec.clears++;a.days[c.day]||={};a.days[c.day][key]=true;
  // Preserve the captured run day when a journey spans a reset.
  const days=Object.keys(a.days).sort();while(days.length>14){const i=days.findIndex(d=>d!==c.day);delete a.days[days.splice(i,1)[0]];}
  return {element:c.id,cores,first,daily};
}
export function validateAdventure(s){
  const a=s.adventure;
  if(!record(a)||!record(a.cores)||Object.keys(a.cores).length!==ELEMENTS.length||ELEMENTS.some(e=>!Object.hasOwn(a.cores,e.id)||!integer(a.cores[e.id]))||!record(a.pets)||Object.keys(a.pets).length>PETS.length||Object.entries(a.pets).some(([id,p])=>!Object.hasOwn(PET,id)||!record(p)||!integer(p.level,1,PET_MAX_LEVEL))||!Object.hasOwn(a.pets,'mossling')||(a.equipped!==null&&(!Object.hasOwn(PET,a.equipped)||!Object.hasOwn(a.pets,a.equipped))))throw new Error('Linh thú hoặc lõi nguyên tố không hợp lệ.');
  if(!record(a.dungeons)||Object.keys(a.dungeons).length!==ELEMENTS.length||ELEMENTS.some(e=>!Object.hasOwn(a.dungeons,e.id)||!record(a.dungeons[e.id])||!integer(a.dungeons[e.id].best,0,3)||!integer(a.dungeons[e.id].clears)||a.dungeons[e.id].clears<a.dungeons[e.id].best)||!record(a.days)||Object.keys(a.days).length>14)throw new Error('Tiến trình phó bản không hợp lệ.');
  for(const [day,claims] of Object.entries(a.days))if(!validDay(day)||!record(claims)||Object.entries(claims).some(([key,value])=>{const [id,tier]=key.split('-');return !Object.hasOwn(DUNGEON,id)||!integer(Number(tier),1,3)||key!==`${id}-${Number(tier)}`||Number(tier)>a.dungeons[id].best||value!==true;}))throw new Error('Phần thưởng ngày của phó bản không hợp lệ.');
  const r=s.run;if(!r)return;
  if(r.pet!==null){const p=r.pet;if(!record(p)||!Object.hasOwn(PET,p.id)||!Object.hasOwn(a.pets,p.id)||!integer(p.level,1,a.pets[p.id].level)||!integer(p.nextRound,1,1e7)||r.mode==='challenge')throw new Error('Linh thú trong chuyến đi không hợp lệ.');}
  if(r.mode!=='dungeon'&&r.dungeon!==null)throw new Error('Chế độ phó bản không hợp lệ.');
  if(r.mode==='dungeon'){
    const c=r.dungeon;
    if(!record(c)||!Object.hasOwn(DUNGEON,c.id)||!integer(c.difficulty,1,3)||!validDay(c.day)||c.difficulty>a.dungeons[c.id].best+1||r.floor>3||r.challenge!==null||r.routes.length!==1||r.routes[0]!==DUNGEON_ROOMS[r.floor-1]||(r.node!==null&&r.node!==DUNGEON_ROOMS[r.floor-1])||(r.phase==='result'&&r.summary.reason==='victory'&&(!r.summary.dungeonReward||!integer(r.summary.dungeonReward.cores,1,42)||r.summary.dungeonReward.element!==c.id)))throw new Error('Luật phó bản không hợp lệ.');
    if(['event','relic'].includes(r.phase)||r.cleared>3||(['route','battle'].includes(r.phase)&&r.cleared!==r.floor-1))throw new Error('Tiến độ phòng phó bản không hợp lệ.');
    if(r.phase==='battle'&&r.node==='boss'&&(r.battle.bossState?.id!==DUNGEON[c.id].bossId||r.battle.enemies.length!==1||r.battle.enemies[0].bossId!==DUNGEON[c.id].bossId))throw new Error('Boss phó bản không hợp lệ.');
    const prize=r.summary?.dungeonReward;
    if(prize){const def=DUNGEON_DIFFICULTIES[c.difficulty-1];if(r.phase!=='result'||r.summary.reason!=='victory'||r.floor!==3||r.cleared!==3||r.summary.cleared!==3||typeof prize.first!=='boolean'||typeof prize.daily!=='boolean'||prize.cores!==def.cores+(prize.daily?def.daily:0)+(prize.first?def.first:0)||a.dungeons[c.id].best<c.difficulty||!a.days[c.day]?.[`${c.id}-${c.difficulty}`])throw new Error('Phần thưởng hoàn thành phó bản không hợp lệ.');}
  }
}
