import {CAMPAIGN_STAGES,campaignStage,campaignChapter,campaignRooms,campaignDialogue} from './campaign-data.mjs';
export * from './campaign-data.mjs';
const int=(n,min=0,max=1e9)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export const starterCampaign=()=>({cleared:0,claimed:[]});
export function campaignUnlocked(s,id){return !!campaignStage(id)&&id<=s.campaign.cleared+1;}
export function completeCampaign(s,r){
  const c=r.campaign;if(!c||r.floor!==3||r.phase!=='battle'||r.battle.enemies.some(e=>e.hp>0)||!campaignUnlocked(s,c.stage))throw new Error('Ải chiến dịch chưa hoàn thành.');
  const first=s.campaign.cleared<c.stage;s.campaign.cleared=Math.max(s.campaign.cleared,c.stage);return {stage:c.stage,first};
}
export function claimCampaign(s,id){
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để nhận quà chiến dịch.');
  const stage=campaignStage(id);if(!stage||id>s.campaign.cleared||s.campaign.claimed.includes(id))throw new Error('Quà lần đầu chưa sẵn sàng hoặc đã nhận.');
  if(Object.entries(stage.reward).some(([key,n])=>!int(s[key]+n)))throw new Error('Tài nguyên đã chạm giới hạn. Hãy dùng bớt trước khi nhận.');
  for(const [key,n] of Object.entries(stage.reward))s[key]+=n;s.campaign.claimed.push(id);return {...stage.reward};
}
export function validateCampaign(s){
  const p=s.campaign;
  if(!record(p)||!int(p.cleared,0,CAMPAIGN_STAGES.length)||!Array.isArray(p.claimed)||new Set(p.claimed).size!==p.claimed.length||p.claimed.some(id=>!int(id,1,p.cleared)))throw new Error('Tiến trình chiến dịch không hợp lệ.');
  const r=s.run;if(!r)return;
  if(r.mode!=='campaign'){if(r.campaign!==null||r.phase==='story')throw new Error('Chế độ cốt truyện không hợp lệ.');return;}
  const c=r.campaign,stage=record(c)&&campaignStage(c.stage),rooms=stage&&campaignRooms(c.stage);
  if(!stage||!campaignUnlocked(s,c.stage)||r.floor>3||r.challenge!==null||r.dungeon!==null||r.hunt!==null||r.training!==null||r.routes.length!==1||r.routes[0]!==rooms[r.floor-1]||(r.node!==null&&r.node!==rooms[r.floor-1])||!['story','route','battle','blessing','result'].includes(r.phase)||r.cleared>3||!int(c.line,0,4)||![null,'intro','outro'].includes(c.story))throw new Error('Ải chiến dịch không hợp lệ.');
  if(r.phase==='story'){
    if(!c.story||c.line>=campaignDialogue(c.stage,c.story).length||(c.story==='intro'&&(r.floor!==1||r.node!==null||r.battle!==null||r.cleared!==0||r.summary!==null))||(c.story==='outro'&&(r.floor!==3||r.cleared!==3||r.summary?.reason!=='victory'||!Array.isArray(r.battle?.enemies)||!r.battle.enemies.length||r.battle.enemies.some(e=>e.hp!==0))))throw new Error('Hội thoại chiến dịch không hợp lệ.');
  }else if(c.story!==null||c.line!==0)throw new Error('Tiến độ hội thoại không hợp lệ.');
  if(['route','battle','blessing'].includes(r.phase)&&(r.cleared!==r.floor-1||(r.phase==='blessing'&&r.floor===3)))throw new Error('Tiến độ trận chiến dịch không hợp lệ.');
  if(r.phase==='battle'&&r.node==='boss'&&(r.battle.bossState?.id!==campaignChapter(c.stage).boss||r.battle.enemies[0].bossId!==campaignChapter(c.stage).boss))throw new Error('Boss chiến dịch không hợp lệ.');
  const prize=r.summary?.campaignReward,won=(r.phase==='result'||c.story==='outro')&&r.summary?.reason==='victory';
  if(won&&(!record(prize)||prize.stage!==c.stage||typeof prize.first!=='boolean'||r.floor!==3||r.cleared!==3||r.summary.cleared!==3||p.cleared<c.stage))throw new Error('Kết quả chiến dịch không hợp lệ.');
  if(!won&&prize)throw new Error('Phần thưởng chiến dịch không hợp lệ.');
}
