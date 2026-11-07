import {BOSS} from './data.mjs';
import {formationTarget,enemyPierces} from './formation.mjs';

export const BOSS_PART_IDS=['head','arms','core'];
export const BOSS_PARTS={
  head:{label:'Đầu',icon:'eye',ratio:.22,color:'#d5b8f1',effect:'Ngắt chiêu đang chuẩn bị; boss bỏ lượt kế tiếp.'},
  arms:{label:'Tay / cánh',icon:'sword',ratio:.28,color:'#efb38c',effect:'Giảm 20% sức đánh của boss đến hết trận.'},
  core:{label:'Lõi',icon:'gem',ratio:.32,color:'#9edbcf',effect:'Boss chịu thêm 25% sát thương trực tiếp từ anh hùng.'}
};
const names={
  'curse-king':['Vương miện gãy','Giáp tay nguyền ấn','Lõi hắc nguyệt'],
  colossus:['Mặt nạ cổ thạch','Giáp tay địa chấn','Giáp hạch rừng'],
  archivist:['Mặt nạ ký ức','Ấn triệu hồn','Khóa thư khố'],
  ashknight:['Mũ tro đỏ','Giáp tay hỏa kiếm','Giáp tim lửa'],
  moonwarden:['Vương miện trăng','Giáp tay nguyệt sắc','Giáp lõi nguyệt'],
  basalt:['Mặt nạ rêu','Giáp chân cổ quy','Giáp hạch mai đá'],
  groveheart:['Mào thiên phong','Giáp cánh gió','Giáp tâm bão'],
  sunlion:['Vương miện sư vương','Giáp vuốt nhật quang','Giáp lõi mặt trời'],
  cinderwyrm:['Mũ nanh lửa','Giáp cánh long','Giáp tim dung nham'],
  voidfox:['Mặt nạ hư không','Giáp vuốt nguyệt ảnh','Ấn giấc mộng'],
  frostqueen:['Vương miện băng','Giáp vuốt sương','Giáp tim băng'],
  stormwing:['Mũ thiên long','Giáp cánh sấm','Giáp lõi lôi vân'],
  'void-dragon':['Sừng hắc lôi','Cánh hắc long','Lõi kết giới']
};
export function bossPartName(boss,id){const index=BOSS_PART_IDS.indexOf(id);return names[boss]?.[index]||BOSS_PARTS[id]?.label||'';}
export function createBossParts(enemy){return {selected:'head',stun:false,...Object.fromEntries(BOSS_PART_IDS.map(id=>{const maxHp=Math.max(1,Math.round(enemy.maxHp*BOSS_PARTS[id].ratio));return [id,{hp:maxHp,maxHp}];}))};}
export const bossParts=r=>r?.battle?.bossState?.parts||null;
export function selectBossPart(s,id){
  const r=s.run,p=bossParts(r);if(r?.phase!=='battle'||!p||!BOSS_PART_IDS.includes(id)||r.battle.enemies[0].hp<=0)throw new Error('Bộ phận không còn khả dụng.');
  if(Object.hasOwn(r.battle,'timingGuard'))throw new Error('Đòn boss đang chờ kết quả đỡ đòn.');
  p.selected=id;return id;
}
export function damageBossPart(r,enemy,id,value){
  const p=bossParts(r);if(!p||enemy.kind!=='boss'||!BOSS_PART_IDS.includes(id)||!Number.isFinite(value)||value<=0)return null;
  const part=p[id],damage=Math.min(part.hp,value),broken=part.hp>0&&part.hp<=damage;part.hp-=damage;
  if(broken&&id==='head'&&enemy.hp>0){p.stun=true;r.battle.bossState.move='strike';r.battle.bossState.stagger=0;}
  return {id,damage,broken};
}
export const bossAttackMultiplier=r=>bossParts(r)?.arms.hp===0?.8:1;
export const bossDirectMultiplier=r=>bossParts(r)?.core.hp===0?1.25:(r.raid?.stage===0&&!r.raid.boss) ? .55 : 1;
export function recommendedBossPart(r){
  const p=bossParts(r);if(!p)return null;
  if(r.raid?.boss==='void-dragon'){if(r.raid.stage===0&&p.arms.hp>0)return 'arms';if(r.raid.stage===1&&p.core.hp>0)return 'core';}
  if(r.raid?.stage===0&&!r.raid.boss&&p.core.hp>0)return 'core';
  const move=r.battle.bossState.move;
  if(p.head.hp>0&&['charge','quake','summon','volley','cleave','siphon','barrier','lunar','signature','surge'].includes(move))return 'head';
  return p.core.hp>0?'core':p.arms.hp>0?'arms':p.head.hp>0?'head':'core';
}
export function bossThreat(r){
  const b=r?.battle,bs=b?.bossState,e=b?.enemies[0];if(r?.phase!=='battle'||!bs||e?.kind!=='boss'||e.hp<=0)return null;
  const alive=r.heroes.filter(h=>h.hp>0).map(h=>h.id),single=[formationTarget(r,e)?.id].filter(Boolean),move=bs.move;
  if(e.freeze>0)return {kind:'safe',targets:[],label:'Đóng băng · Boss bỏ lượt'};
  if(bs.parts?.stun||move==='stunned')return {kind:'safe',targets:[],label:'Đã ngắt chiêu · Boss bỏ lượt'};
  let kind='attack',targets=single;
  if(['quake','volley','cleave','lunar'].includes(move))targets=alive;
  if((move==='charge'&&(r.raid?.stage!==2||bs.id==='void-dragon'))||(bs.id==='stormwing'&&move==='signature')){kind='charge';targets=alive;}
  if((move==='charge'&&r.raid?.stage===2&&bs.id!=='void-dragon')||['summon','barrier'].includes(move)||(move==='signature'&&['basalt','sunlion'].includes(bs.id))||(move==='surge'&&bs.id==='voidfox')){kind='prepare';targets=[];}
  if(move==='signature'&&bs.id==='groveheart')targets=alive.slice(0,2);
  if(move==='surge'&&bs.id!=='voidfox')targets=alive;
  const label=kind==='charge'?'Đang tụ lực · Chuẩn bị đánh cả đội':kind==='prepare'?'Boss đang chuẩn bị':targets.length===alive.length&&alive.length>1?'Sắp đánh cả đội':'Mục tiêu đã bị đánh dấu';
  return {kind,targets,label:enemyPierces(r,e)&&kind==='attack'?'Xuyên hàng · '+label:label};
}
export function validateBossParts(s){
  const b=s.run?.battle,bs=b?.bossState;if(!bs)return;
  const p=bs.parts;if(p===null)return;
  const e=b.enemies?.[0],record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  if(!record(p)||(!Object.hasOwn(BOSS,bs.id)&&!(bs.id==='void-dragon'&&s.run.raid?.boss==='void-dragon')&&!(bs.id==='curse-king'&&s.run.mode==='season'))||e?.bossId!==bs.id||Object.keys(p).length!==5||!BOSS_PART_IDS.includes(p.selected)||typeof p.stun!=='boolean'||BOSS_PART_IDS.some(id=>{const a=p[id];return !record(a)||Object.keys(a).length!==2||!Number.isSafeInteger(a.hp)||!Number.isSafeInteger(a.maxHp)||a.maxHp!==Math.max(1,Math.round(e.maxHp*BOSS_PARTS[id].ratio))||a.hp<0||a.hp>a.maxHp;})||(p.stun&&(p.head.hp!==0||e.hp<=0)))throw new Error('Bộ phận boss không hợp lệ.');
}
