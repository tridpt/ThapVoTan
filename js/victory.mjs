const FIELDS=['damage','healing','shield'];
const REPORT_FIELDS=['kills','shards','dust'];
const keysFor=r=>[...r.heroes.map(h=>h.id),'pet','effects'];
export function starterStatistics(r,partial=false){
  return {partial,rows:Object.fromEntries(keysFor(r).map(id=>[id,{damage:0,healing:0,shield:0}])),...(!partial?{report:{kills:0,shards:0,dust:0}}:{})};
}
// Optional presentation ledger: v34 saves without it remain valid and show missing history honestly.
export function recordResult(r,field,value,{battle=false}={}){
  if(!REPORT_FIELDS.includes(field)||!Number.isSafeInteger(value)||value<=0)return;
  for(const stats of [r.statistics,...(battle?[r.battle?.statistics]:[])])if(stats?.report)stats.report[field]+=value;
}
// Attribution is presentation data. It never reads RNG or changes combat values.
export function recordContribution(r,source,field,value){
  if(r.phase!=='battle'||r.victory||!r.battle?.statistics||!Number.isSafeInteger(value)||value<=0)return;
  const ids=keysFor(r),credit=typeof source==='string'?{[source]:1}:source?.id?{[source.id]:1}:source||{effects:1};
  const weights=ids.map(id=>[id,credit[id]||0]).filter(([,weight])=>Number.isFinite(weight)&&weight>0);
  if(!weights.length)weights.push(['effects',1]);
  const total=weights.reduce((n,[,weight])=>n+weight,0),parts=weights.map(([id,weight],index)=>{const exact=value*weight/total;return {id,index,value:Math.floor(exact),remainder:exact-Math.floor(exact)};});
  let rest=value-parts.reduce((n,p)=>n+p.value,0);
  for(const part of [...parts].sort((a,b)=>b.remainder-a.remainder||a.index-b.index)){if(rest--<=0)break;part.value++;}
  for(const part of parts)for(const stats of [r.statistics,r.battle.statistics])stats.rows[part.id][field]+=part.value;
}
export function advanceVictory(s){
  const v=s.run?.victory;if(!v||v.stage==='done')throw new Error('Màn chiến thắng đã kết thúc.');
  v.stage=s.run.phase==='relay'?'done':v.stage==='intro'?'loot':'done';return v.stage;
}
export function dismissVictory(s){
  const v=s.run?.victory;if(!v||v.stage==='done')return false;v.stage='done';return true;
}
export const victoryPending=r=>!!r?.victory&&r.victory.stage!=='done';
export function contributionRanking(r,journey=false){
  const stats=journey?r.statistics:r.battle?.statistics;if(!stats)return {rows:[],mvp:null,partial:true};
  const rows=keysFor(r).map(id=>({id,...stats.rows[id],score:FIELDS.reduce((n,k)=>n+stats.rows[id][k],0)}));
  const best=rows.filter(row=>r.heroes.some(h=>h.id===row.id)).reduce((a,b)=>!a||b.score>a.score?b:a,null);
  return {rows,mvp:best?.score>0?best.id:null,partial:stats.partial};
}
export function victoryRewards(r){
  const v=r.lastReward,prize=r.summary?.raidReward||r.summary?.huntReward,dungeon=r.summary?.dungeonReward;
  if(r.training)return {gold:0,tickets:0,shards:0,loot:null,marks:0,cores:0,essence:0,practice:true};
  return {gold:prize?.gold??v?.gold??0,tickets:v?.tickets||0,shards:v?.shards||0,loot:v?.loot||null,marks:prize?.marks||0,...(prize?.scales?{scales:prize.scales}:{}),...(v?.eliteBonus?{dust:v.eliteBonus.dust}:{}),essence:prize?.essence||0,cores:dungeon?.cores||0,element:dungeon?.element||null,...(r.season?{seasonSeals:v?.seasonSeals||0}:{}),practice:false};
}
export function resultRewards(r){
  if(r.training)return {gold:0,tickets:0,shards:0,dust:0,marks:0,essence:0,scales:0,cores:0,seasonSeals:0,complete:true,practice:true};
  const prize=victoryRewards(r),report=r.statistics?.report;
  return {gold:r.summary?.gold??r.goldEarned??0,tickets:r.summary?.tickets??r.ticketsEarned??0,
    shards:report?.shards??0,dust:report?.dust??0,marks:prize.marks,essence:prize.essence,
    scales:prize.scales??0,cores:prize.cores,seasonSeals:r.season?.seals??0,
    complete:!!report,practice:false};
}
export function validateVictory(s){
  const r=s.run;if(!r)return;
  const ids=keysFor(r),validNumber=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e15;
  const validate=stats=>{
    if(!stats||typeof stats.partial!=='boolean'||!stats.rows||Array.isArray(stats.rows)||Object.keys(stats.rows).length!==ids.length||ids.some(id=>!Object.hasOwn(stats.rows,id)||!stats.rows[id]||Object.keys(stats.rows[id]).length!==3||FIELDS.some(k=>!validNumber(stats.rows[id][k]))))throw new Error('Thống kê chiến đấu không hợp lệ.');
    if(Object.hasOwn(stats,'report')){const p=stats.report;if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==REPORT_FIELDS.length||REPORT_FIELDS.some(k=>!Object.hasOwn(p,k)||!validNumber(p[k])))throw new Error('Tổng kết chiến đấu không hợp lệ.');}
  };
  validate(r.statistics);
  if(r.battle){
    validate(r.battle.statistics);
    if((r.battle.statistics.partial&&!r.statistics.partial)||ids.some(id=>FIELDS.some(k=>r.battle.statistics.rows[id][k]>r.statistics.rows[id][k])))throw new Error('Tổng đóng góp không hợp lệ.');
    if(r.statistics.report&&r.battle.statistics.report&&REPORT_FIELDS.some(k=>r.battle.statistics.report[k]>r.statistics.report[k]))throw new Error('Tổng kết trận vượt quá hành trình.');
    for(const e of r.battle.enemies){const source=e.burnSource;if(source!==null&&(typeof source!=='object'||Array.isArray(source)||!Object.keys(source).length||Object.entries(source).some(([id,n])=>!ids.includes(id)||!Number.isFinite(n)||n<=0||n>1e15)))throw new Error('Nguồn thiêu đốt không hợp lệ.');}
  }
  const v=r.victory;
  if(v!==null&&(!v||Object.keys(v).length!==2||v.floor!==r.floor||!['intro','loot','done'].includes(v.stage)||!['blessing','relic','contract','result','story','relay'].includes(r.phase)||!r.battle?.enemies?.length||r.battle.enemies.some(e=>e.hp!==0)))throw new Error('Màn chiến thắng không hợp lệ.');
}
