// Long-term account achievements. Combat code only records monotonic counters;
// all progress and reward decisions stay pure and easy to validate here.

const STAT_KEYS = Object.freeze(['bosses','partBreaks','perfectGuards','counters','raidClears']);
const int = (n,min=0,max=1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const ACHIEVEMENTS = Object.freeze([
  {id:'tower-10',title:'Bước chân đầu tiên',description:'Chạm tới tầng 10 của Tháp Vô Tận.',icon:'tower',color:'#cdb77b',goal:10,metric:'best',tier:'I',reward:{gold:300,tickets:2,shards:0}},
  {id:'tower-30',title:'Kẻ mở đường',description:'Chạm tới tầng 30 và sống sót qua những vùng đất sâu hơn.',icon:'compass',color:'#9bbfa8',goal:30,metric:'best',tier:'II',reward:{gold:650,tickets:4,shards:4}},
  {id:'tower-50',title:'Bóng ma đỉnh tháp',description:'Chạm tới tầng 50 — nơi các luật lệ bắt đầu đổi khác.',icon:'crown',color:'#d9a879',goal:50,metric:'best',tier:'III',reward:{gold:1200,tickets:6,shards:10}},
  {id:'boss-10',title:'Kẻ giải ấn',description:'Đánh bại 10 boss trong mọi chiến trường.',icon:'skull',color:'#d99b8a',goal:10,metric:'bosses',tier:'II',reward:{gold:700,tickets:4,shards:6}},
  {id:'part-5',title:'Phá giáp',description:'Phá vỡ 5 bộ phận boss để mở điểm yếu.',icon:'shield',color:'#9fc4d1',goal:5,metric:'partBreaks',tier:'II',reward:{gold:500,tickets:3,shards:5}},
  {id:'guard-10',title:'Nhịp thở của chiến binh',description:'Thực hiện 10 lần đỡ hoàn hảo trước đòn boss.',icon:'clock',color:'#b7c8e4',goal:10,metric:'perfectGuards',tier:'III',reward:{gold:800,tickets:5,shards:8}},
  {id:'counter-5',title:'Lưỡi kiếm phản chiếu',description:'Phản công thành công 5 lần sau một đỡ hoàn hảo.',icon:'sword',color:'#d7b17c',goal:5,metric:'counters',tier:'III',reward:{gold:650,tickets:4,shards:6}},
  {id:'summon-50',title:'Người nghe tinh tú',description:'Thực hiện 50 lượt triệu hồi.',icon:'star',color:'#c3a9e7',goal:50,metric:'totalSummons',tier:'II',reward:{gold:900,tickets:5,shards:8}},
  {id:'heroes-10',title:'Người kết đội',description:'Sở hữu 10 anh hùng khác nhau.',icon:'heroes',color:'#a9d1b5',goal:10,metric:'ownedHeroes',tier:'III',reward:{gold:700,tickets:5,shards:7}},
  {id:'raid-1',title:'Người phá thành',description:'Hoàn thành một chuyến đột kích đủ 3 giai đoạn.',icon:'crown',color:'#d2a1cf',goal:1,metric:'raidClears',tier:'IV',reward:{gold:1000,tickets:7,shards:12}}
]);

export const ACHIEVEMENT = Object.freeze(Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,a])));
export const ACHIEVEMENT_STAT_KEYS = STAT_KEYS;

export function starterAchievements(){
  return {claimed:[],stats:Object.fromEntries(STAT_KEYS.map(key=>[key,0]))};
}

export function achievementMetricValue(s,metric){
  if(metric==='best'||metric==='totalSummons')return s?.[metric]||0;
  if(metric==='ownedHeroes')return Object.keys(s?.owned||{}).length;
  return s?.achievements?.stats?.[metric]||0;
}

export function achievementStatus(s,id){
  if(typeof id!=='string'||!Object.hasOwn(ACHIEVEMENT,id))throw new Error('Thành tựu không tồn tại.');
  const achievement=ACHIEVEMENT[id];
  const value=achievementMetricValue(s,achievement.metric),progress=Math.min(achievement.goal,value),claimed=!!s.achievements?.claimed?.includes(id);
  return {id:achievement.id,title:achievement.title,description:achievement.description,icon:achievement.icon,color:achievement.color,goal:achievement.goal,metric:achievement.metric,tier:achievement.tier,value,progress,claimed,complete:value>=achievement.goal,ready:value>=achievement.goal&&!claimed&&s.run?.mode!=='training',reward:{...achievement.reward}};
}

export function achievementStatuses(s){return ACHIEVEMENTS.map(a=>achievementStatus(s,a.id));}
export function readyAchievements(s){return achievementStatuses(s).filter(a=>a.ready);}

export function recordAchievement(s,key,amount=1){
  if(!STAT_KEYS.includes(key)||!int(amount,1)||s?.run?.mode==='training')return false;
  const stats=s.achievements?.stats;
  if(!stats||!int(stats[key]))throw new Error('Sổ thành tựu không hợp lệ.');
  stats[key]=Math.min(1e9,stats[key]+amount);return true;
}

export function claimAchievement(s,id){
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để nhận thưởng thành tựu.');
  const status=achievementStatus(s,id);
  if(!status.ready)throw new Error('Thành tựu chưa hoàn thành hoặc đã nhận.');
  const reward=status.reward;
  for(const [key,value] of Object.entries(reward))if(!int((s[key]||0)+value))throw new Error('Tài nguyên đã chạm giới hạn. Hãy dùng bớt trước khi nhận.');
  s.achievements.claimed.push(id);
  for(const [key,value] of Object.entries(reward))s[key]+=value;
  return {...status,claimed:true,ready:false};
}

export function validateAchievements(s){
  const a=s.achievements;
  if(!record(a)||Object.keys(a).length!==2||!Array.isArray(a.claimed)||new Set(a.claimed).size!==a.claimed.length||a.claimed.some(id=>typeof id!=='string'||!Object.hasOwn(ACHIEVEMENT,id))||!record(a.stats)||Object.keys(a.stats).length!==STAT_KEYS.length||STAT_KEYS.some(key=>!Object.hasOwn(a.stats,key)||!int(a.stats[key])))throw new Error('Dữ liệu sổ thành tựu không hợp lệ.');
  if(a.claimed.some(id=>achievementMetricValue(s,ACHIEVEMENT[id].metric)<ACHIEVEMENT[id].goal))throw new Error('Phần thưởng thành tựu không hợp lệ.');
  return s;
}

