import {HERO,HEROES,RARITY} from './data.mjs';

export const TUTORIAL_STEPS=Object.freeze(['summon','team','gear','depart','route','target','attack','end','skill']);
export const NOVICE_MISSIONS=Object.freeze([
  {id:'summon',name:'Tiếng gọi đầu tiên',desc:'Triệu hồi ít nhất 1 anh hùng.',goal:1,tickets:2,gold:150},
  {id:'gear',name:'Sẵn sàng lên đường',desc:'Mặc ít nhất 1 món trang bị cho anh hùng.',goal:1,tickets:2,gold:200},
  {id:'floor3',name:'Bước qua màn sương',desc:'Hoàn thành tầng 3 của Tháp thường.',goal:3,tickets:3,gold:250},
  {id:'floor5',name:'Người giữ tầng đầu tiên',desc:'Hoàn thành tầng 5 của Tháp thường.',goal:5,tickets:3,gold:400},
  {id:'floor10',name:'Mười tầng khởi đầu',desc:'Hoàn thành tầng 10 của Tháp thường.',goal:10,tickets:5,gold:500}
]);
export const NOVICE_SSR=Object.freeze(HEROES.filter(h=>h.rarity==='SSR').map(h=>h.id));
export const starterOnboarding=()=>({status:'available',completed:[],claimed:[],ssr:null});
const prefix=(list,ids)=>Array.isArray(list)&&list.length<=ids.length&&ids.slice(0,list.length).every((id,i)=>id===list[i]);
export function validateOnboarding(s){
  const v=s.onboarding;
  if(!Object.hasOwn(s,'onboarding')||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==4||!['status','completed','claimed','ssr'].every(k=>Object.hasOwn(v,k))||!['available','active','skipped','done'].includes(v.status)||!prefix(v.completed,TUTORIAL_STEPS)||!prefix(v.claimed,NOVICE_MISSIONS.map(q=>q.id))||(v.status==='available'&&v.completed.length!==0)||(v.status==='done')!==(v.completed.length===TUTORIAL_STEPS.length)||!(v.ssr===null||NOVICE_SSR.includes(v.ssr)&&v.claimed.length===NOVICE_MISSIONS.length&&Object.hasOwn(s.owned,v.ssr)))throw new Error('Tiến độ tân thủ không hợp lệ.');
}
const practice=s=>s.run?.mode==='training';
function editable(s){validateOnboarding(s);if(practice(s))throw new Error('Thoát phòng thử để dùng hành trình tân thủ.');}
export function beginTutorial(s){
  editable(s);if(s.onboarding.status==='done')throw new Error('Bạn đã hoàn thành hướng dẫn.');
  s.onboarding.status='active';s.welcome=true;return tutorialStep(s);
}
export function skipTutorial(s){
  editable(s);if(s.onboarding.status!=='done')s.onboarding.status='skipped';s.welcome=true;
}
export const tutorialStep=s=>s.onboarding?.status==='active'?TUTORIAL_STEPS[s.onboarding.completed.length]||null:null;
// Only successful actions in the active guide advance its ordered lessons.
// Inactive tutorials stay completely neutral for old accounts and combat traces.
export function recordTutorialProgress(s,id){
  if(practice(s)||tutorialStep(s)!==id)return false;
  s.onboarding.completed.push(id);
  if(s.onboarding.completed.length===TUTORIAL_STEPS.length)s.onboarding.status='done';
  return true;
}
export function recordTutorialTarget(s,id){
  if(!['depart','route','target'].includes(tutorialStep(s))||practice(s))return false;
  const r=s.run;if(r?.mode!=='normal')return false;
  if(r.phase!=='battle'||!r.battle.enemies.some(e=>e.id===id&&e.hp>0))throw new Error('Chọn một kẻ địch còn sống trong Tháp thường.');
  // A player may enter a real battle before reaching the departure lesson.
  // Selecting a living enemy safely catches up these navigation lessons.
  recordTutorialProgress(s,'depart');recordTutorialProgress(s,'route');
  return recordTutorialProgress(s,'target');
}
export function noviceMissionStatus(s,id){
  const index=NOVICE_MISSIONS.findIndex(q=>q.id===id);if(index<0)throw new Error('Nhiệm vụ tân thủ không tồn tại.');
  const mission=NOVICE_MISSIONS[index],claimed=s.onboarding.claimed.includes(id),unlocked=index===0||s.onboarding.claimed.includes(NOVICE_MISSIONS[index-1].id);
  const equipped=Object.values(s.equipped).some(slots=>Object.keys(slots).length>0);
  const progress=id==='summon'?Math.min(mission.goal,s.totalSummons):id==='gear'?(equipped||s.onboarding.completed.includes('gear')?1:0):Math.min(mission.goal,s.best);
  return {mission,progress,claimed,unlocked,ready:!practice(s)&&unlocked&&!claimed&&progress>=mission.goal};
}
export function noviceSsrReady(s){return !practice(s)&&s.onboarding.claimed.length===NOVICE_MISSIONS.length&&s.onboarding.ssr===null;}
export function noviceReady(s){return noviceSsrReady(s)||NOVICE_MISSIONS.some(q=>noviceMissionStatus(s,q.id).ready);}
function canCredit(s,rewards){for(const [key,value] of Object.entries(rewards))if(!Number.isSafeInteger(s[key])||s[key]<0||s[key]>1e9-value)throw new Error('Tài nguyên đã đạt giới hạn. Hãy dùng bớt trước khi nhận quà.');}
export function claimNoviceMission(s,id){
  editable(s);const status=noviceMissionStatus(s,id);if(!status.ready)throw new Error('Nhiệm vụ chưa hoàn thành, chưa mở hoặc đã nhận.');
  const {tickets,gold}=status.mission;canCredit(s,{tickets,gold});
  s.onboarding.claimed.push(id);s.tickets+=tickets;s.gold+=gold;return {tickets,gold};
}
export function claimNoviceSsr(s,id){
  editable(s);if(!NOVICE_SSR.includes(id)||!Object.hasOwn(HERO,id))throw new Error('Hãy chọn Astra, Nyx hoặc Kael bậc SSR.');
  if(!noviceSsrReady(s))throw new Error('Quà SSR chưa mở hoặc đã nhận.');
  const isNew=!Object.hasOwn(s.owned,id),reward=RARITY.SSR;
  if(!isNew){if(!Number.isSafeInteger(s.owned[id].copies)||s.owned[id].copies<0||s.owned[id].copies>=1e9)throw new Error('Bản trùng đã đạt giới hạn.');canCredit(s,{gold:reward.gold,shards:reward.shards});}
  if(isNew)s.owned[id]={level:1,copies:0,awaken:0};else{s.owned[id].copies++;s.gold+=reward.gold;s.shards+=reward.shards;}
  s.onboarding.ssr=id;return {id,isNew,gold:isNew?0:reward.gold,shards:isNew?0:reward.shards};
}
