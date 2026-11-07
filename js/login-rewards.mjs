const MAX=1e9;

export const LOGIN_REWARDS=Object.freeze([
  Object.freeze({day:1,gold:120,tickets:0,dust:2,shards:0}),
  Object.freeze({day:2,gold:0,tickets:1,dust:3,shards:0}),
  Object.freeze({day:3,gold:180,tickets:0,dust:4,shards:2}),
  Object.freeze({day:4,gold:0,tickets:2,dust:5,shards:0}),
  Object.freeze({day:5,gold:300,tickets:0,dust:7,shards:3}),
  Object.freeze({day:6,gold:0,tickets:2,dust:9,shards:0}),
  Object.freeze({day:7,gold:650,tickets:3,dust:12,shards:8})
]);

const fields=['lastDay','streak','totalClaims'];
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const validDateKey=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
};
const ordinal=value=>{const [year,month,day]=value.split('-').map(Number);return Date.UTC(year,month-1,day)/86400000;};
const todayKey=date=>{
  if(!(date instanceof Date)||Number.isNaN(date.getTime()))throw new Error('Ngày điểm danh không hợp lệ.');
  const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if(!validDateKey(key))throw new Error('Ngày điểm danh không hợp lệ.');
  return key;
};
const rewardFor=day=>LOGIN_REWARDS[day-1];

export function starterLoginRewards(){return {lastDay:null,streak:0,totalClaims:0};}

export function validateLoginRewards(s){
  const value=s?.loginRewards;
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==fields.length||fields.some(k=>!Object.hasOwn(value,k)))throw new Error('Dữ liệu điểm danh không hợp lệ.');
  if(value.lastDay!==null&&!validDateKey(value.lastDay))throw new Error('Ngày điểm danh không hợp lệ.');
  if(!integer(value.streak,0,MAX)||!integer(value.totalClaims,0,MAX))throw new Error('Chuỗi điểm danh không hợp lệ.');
  if(value.lastDay===null&&(value.streak!==0||value.totalClaims!==0))throw new Error('Chuỗi điểm danh chưa bắt đầu không hợp lệ.');
  if(value.lastDay!==null&&value.streak<1)throw new Error('Chuỗi điểm danh đang hoạt động không hợp lệ.');
  if(value.totalClaims<value.streak&&value.lastDay!==null)throw new Error('Tổng lượt điểm danh không hợp lệ.');
}

export function loginRewardStatus(s,date=new Date()){
  validateLoginRewards(s);const today=todayKey(date),ledger=s.loginRewards,last=ledger.lastDay;
  const delta=last?ordinal(today)-ordinal(last):null,clockSkew=delta!==null&&delta<0,claimed=delta===0,missed=delta!==null&&delta>1;
  const capped=ledger.totalClaims===MAX,training=!!s.run?.training;
  const nextStreak=delta===1?Math.min(MAX,ledger.streak+1):claimed||clockSkew?ledger.streak:1;
  const day=((nextStreak-1)%7)+1;
  return {today,lastDay:last,claimable:!claimed&&!clockSkew&&!capped&&!training,clockSkew,claimed,missed,capped,training,streak:missed?0:ledger.streak,nextStreak,day,reward:rewardFor(day),totalClaims:ledger.totalClaims};
}

export function claimLoginReward(s,date=new Date()){
  if(s.run?.training)throw new Error('Không thể nhận điểm danh trong Phòng thử.');
  const status=loginRewardStatus(s,date);
  if(status.capped)throw new Error('Đã đạt giới hạn lượt điểm danh.');
  if(!status.claimable)throw new Error(status.clockSkew?'Ngày trên thiết bị đang lùi so với lần điểm danh trước.':'Bạn đã nhận quà điểm danh hôm nay.');
  const reward=status.reward;
  for(const [key,value] of Object.entries(reward))if(key!=='day'&&(!integer(s[key],0,MAX)||s[key]+value>MAX))throw new Error('Tài nguyên đã đạt giới hạn.');
  s.gold+=reward.gold;s.tickets+=reward.tickets;s.dust+=reward.dust;s.shards+=reward.shards;
  s.loginRewards={lastDay:status.today,streak:status.nextStreak,totalClaims:s.loginRewards.totalClaims+1};
  return structuredClone(reward);
}
