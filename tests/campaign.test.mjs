import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HERO,BOSS} from '../js/data.mjs';
import {campaignPage,campaignStoryPage,campaignResult} from '../js/campaign-ui.mjs';
import {worldForRun} from '../js/worlds3d.mjs';
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}
function winBattle(s){
  let steps=0;while(s.run.phase==='battle'&&steps++<50){const r=s.run;if(E.shouldUsePet(r))E.petAction(s);for(const h of r.heroes){if(r.phase!=='battle')break;if(h.hp>0&&!r.battle.used.includes(h.id))E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0)?.id,h.energy>=100);}if(r.phase==='battle')E.enemyTurn(s);}
  assert.notEqual(s.run.phase,'battle');assert.notEqual(s.run.summary?.reason,'defeat');
}
function clearStage(s,id){
  E.startCampaign(s,id,42);E.advanceCampaignStory(s,true);for(const h of s.run.heroes)h.atk=10000;
  for(let n=0;n<3;n++){E.chooseRoute(s,0);winBattle(s);copy(s);if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);}
  assert.equal(s.run.phase,'story');assert.equal(s.run.campaign.story,'outro');E.advanceCampaignStory(s,true);return s.run.summary.campaignReward;
}

test('campaign has five authored chapters, fifteen stages and valid speakers, worlds and unique chapter bosses',()=>{
  assert.equal(E.CHAPTERS.length,5);assert.equal(E.CAMPAIGN_STAGES.length,15);assert.equal(new Set(E.CHAPTERS.map(c=>c.boss)).size,5);
  for(const [i,c] of E.CHAPTERS.entries()){assert.ok(BOSS[c.boss]);assert.equal(E.CAMPAIGN_STAGES.filter(v=>v.chapter===i).length,3);assert.equal(E.campaignChapter(i*3+1),c);assert.equal(worldForRun({campaign:{stage:i*3+1}}).id,c.world);}
  for(const stage of E.CAMPAIGN_STAGES){assert.equal(stage.id,stage.chapter*3+stage.number);assert.deepEqual(E.campaignRooms(stage.id),['battle','elite',stage.number===3?'boss':'elite']);for(const kind of ['intro','outro']){assert.ok(stage[kind].length>=2);for(const [speaker,text] of stage[kind]){assert.ok(Object.hasOwn(HERO,speaker));assert.ok(text.length>20);}}}
  assert.equal(E.campaignStage('1'),null);assert.equal(E.campaignStage(16),null);
});

test('v7 migration preserves active battle, expedition and economy while adding campaign, presets and graphics once',()=>{
  const s=E.createState();s.welcome=true;s.settings.sound=false;s.settings.speed=2;E.startHunt(s,'colossus',1,42);E.playerAction(s,'rook','enemy0');E.dispatchExpedition(s,'mist-path','ember',0,Date.now());s.version=7;delete s.campaign;delete s.presets;delete s.settings.graphics;delete s.run.campaign;
  const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(m.campaign,E.starterCampaign());assert.deepEqual(m.presets,[null,null,null]);assert.deepEqual(m.settings,{sound:false,speed:2,graphics:E.starterGraphics()});assert.deepEqual(withoutCombatReport(m.run),withoutCombatReport({...s.run,formation:null,link:E.starterLink(),campaign:null,heroes:s.run.heroes.map(h=>({...h,talents:null}))}));
  for(const key of ['owned','gold','tickets','dust','shards','armory','adventure','expeditions','team','inventory','equipped','daily','challengeWeeks','highPity'])assert.deepEqual(m[key],s[key],key);assert.deepEqual(copy(m),m);
});

test('stage unlocks are sequential and rejected starts preserve an active journey or unavailable hero',()=>{
  const s=E.createState();for(const id of [0,2,15,16,1.5,'1','constructor'])atomic(s,()=>E.startCampaign(s,id,42));E.startCampaign(s,1,42);atomic(s,()=>E.startCampaign(s,1,99));E.finishRun(s);assert.equal(s.campaign.cleared,0);
  E.dispatchExpedition(s,'mist-path','ember',0,Date.now());s.team[0]='ember';atomic(s,()=>E.startCampaign(s,1,42));
});

test('intro dialogue resumes after reload and must finish before route or combat actions',()=>{
  let s=E.createState();E.startCampaign(s,1,42);assert.equal(s.run.phase,'story');assert.equal(s.run.campaign.line,0);atomic(s,()=>E.chooseRoute(s,0));atomic(s,()=>E.playerAction(s,'rook','enemy0'));E.advanceCampaignStory(s);s=copy(s);assert.equal(s.run.campaign.line,1);assert.equal(s.run.campaign.story,'intro');E.advanceCampaignStory(s);assert.equal(s.run.phase,'route');assert.equal(s.run.campaign.line,0);assert.equal(s.run.campaign.story,null);copy(s);atomic(s,()=>E.advanceCampaignStory(s));
});

test('all fifteen stages clear through three real battles, retain progress and pay first-clear rewards exactly once',()=>{
  let s=E.createState();const initial=structuredClone(s),total={gold:0,tickets:0,dust:0,shards:0};
  for(let id=1;id<=15;id++){assert.equal(E.campaignUnlocked(s,id),true);const result=clearStage(s,id);assert.deepEqual(result,{stage:id,first:true});assert.equal(s.campaign.cleared,id);assert.equal(s.run.summary.cleared,3);assert.equal(s.best,0);assert.equal(s.challengeWeeks&&Object.keys(s.challengeWeeks).length,0);const before=structuredClone(s);const r=E.claimCampaign(s,id);for(const [key,n] of Object.entries(r)){assert.equal(s[key],before[key]+n);total[key]+=n;}atomic(s,()=>E.claimCampaign(s,id));s=copy(s);}
  assert.equal(total.tickets,25);assert.equal(total.dust,70);assert.equal(total.shards,10);assert.equal(s.campaign.claimed.length,15);assert.equal(s.runs,15);assert.equal(s.wins,45);assert.equal(s.owned.ember.level,initial.owned.ember.level);assert.equal(E.campaignUnlocked(s,16),false);
});

test('replaying a completed stage gives normal battle loot without resetting first-clear claims or later progress',()=>{
  const s=E.createState();clearStage(s,1);E.claimCampaign(s,1);clearStage(s,2);const before=structuredClone(s);assert.deepEqual(clearStage(s,1),{stage:1,first:false});assert.equal(s.campaign.cleared,2);assert.deepEqual(s.campaign.claimed,before.campaign.claimed);assert.ok(s.gold>before.gold);assert.ok(s.run.gearFound>=2);atomic(s,()=>E.claimCampaign(s,1));copy(s);
});

test('outro reload keeps victory and does not reapply battle rewards, even if retreat is requested while reading',()=>{
  const s=E.createState();clearStage(s,1);s.run.phase='story';s.run.campaign.story='outro';s.run.campaign.line=1;const before=structuredClone(s),m=copy(s);assert.deepEqual(m.run,s.run);E.finishRun(m,'retreat');assert.equal(m.run.phase,'result');assert.equal(m.run.summary.reason,'victory');assert.equal(m.gold,before.gold);assert.equal(m.wins,before.wins);assert.deepEqual(m.campaign,before.campaign);copy(m);
});

test('retreating or losing in the campaign does not unlock an unfinished stage or grant its first-clear reward',()=>{
  for(const phase of ['story','route','battle','blessing']){const s=E.createState();E.startCampaign(s,1,42);if(phase!=='story')E.advanceCampaignStory(s,true);if(['battle','blessing'].includes(phase))E.chooseRoute(s,0);if(phase==='blessing'){for(const h of s.run.heroes)h.atk=10000;winBattle(s);}E.finishRun(s,'retreat');assert.equal(s.campaign.cleared,0);atomic(s,()=>E.claimCampaign(s,1));assert.equal(s.run.phase,'result');assert.ok(s.gold>=800);copy(s);}
  const s=E.createState();E.startCampaign(s,1,42);E.advanceCampaignStory(s,true);E.chooseRoute(s,0);for(const h of s.run.heroes)h.hp=1;for(const e of s.run.battle.enemies)e.atk=10000;for(let n=0;n<3&&s.run.phase==='battle';n++)E.enemyTurn(s);assert.equal(s.run.summary.reason,'defeat');assert.equal(s.campaign.cleared,0);copy(s);
});

test('claiming a campaign reward checks all currency limits before changing the claim record or any wallet',()=>{
  for(const key of ['gold','tickets','dust','shards']){const s=E.createState();s.campaign.cleared=3;s[key]=1e9;atomic(s,()=>E.claimCampaign(s,3));assert.deepEqual(s.campaign.claimed,[]);}
});

test('chapter bosses use their own second phases and mechanics in campaign mode',()=>{
  for(let chapter=0;chapter<5;chapter++){
    const s=E.createState(),id=chapter*3+3;s.campaign.cleared=id-1;E.startCampaign(s,id,42);E.advanceCampaignStory(s,true);for(const h of s.run.heroes)h.atk=10000;
    for(let room=0;room<2;room++){E.chooseRoute(s,0);winBattle(s);E.selectBlessing(s,s.run.choices[0]);}
    E.chooseRoute(s,0);const r=s.run,e=r.battle.enemies[0],boss=E.CHAPTERS[chapter].boss;assert.equal(e.bossId,boss);assert.equal(E.bossForRun(r).id,boss);for(const h of r.heroes)Object.assign(h,{atk:5,hp:10000,maxHp:10000,energy:100});e.hp=Math.floor(e.maxHp*.5)+1;E.playerAction(s,'rook','enemy0');assert.equal(r.battle.bossState.phase,2);
    if(boss==='frostqueen'){r.battle.bossState.move='signature';e.intent=0;const energy=r.heroes[0].energy;E.enemyTurn(s);assert.equal(r.heroes[0].energy,Math.max(0,energy-30));}
    if(boss==='stormwing'){r.battle.bossState.move='surge';r.battle.used=[];for(const h of r.heroes)h.energy=100;E.playerAction(s,'rook','enemy0',true);E.playerAction(s,'aerin','enemy0',true);assert.equal(r.battle.bossState.move,'stunned');}
    if(boss==='moonwarden'){e.shield=999;r.battle.used=[];r.heroes[0].energy=100;E.playerAction(s,'rook','enemy0',true);assert.equal(e.shield,0);}copy(s);
  }
});

test('campaign battle and blessing snapshots resume without changing choices, HP, turns, pet or equipment',()=>{
  let s=E.createState();E.startCampaign(s,1,42);E.advanceCampaignStory(s,true);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');const before=structuredClone(s.run);s=copy(s);assert.deepEqual(s.run,before);for(const h of s.run.heroes)h.atk=10000;winBattle(s);const choices=[...s.run.choices];s=copy(s);assert.deepEqual(s.run.choices,choices);E.selectBlessing(s,choices[0]);assert.equal(s.run.floor,2);assert.equal(s.run.cleared,1);copy(s);
});

test('campaign validation rejects invalid records, forged completion, routes, dialogue and a mismatched boss',()=>{
  const base=E.createState();E.startCampaign(base,1,42);
  for(const alter of [s=>delete s.campaign,s=>s.campaign.cleared=16,s=>s.campaign.claimed=[1],s=>s.campaign.claimed=[0],s=>s.run.campaign.stage=2,s=>s.run.campaign.line=99,s=>s.run.campaign.story='none',s=>s.run.campaign.story='outro',s=>s.run.routes=['treasure'],s=>s.run.campaign=null,s=>s.run.mode='normal']){const bad=structuredClone(base);alter(bad);assert.throws(()=>copy(bad));}
  const won=E.createState();clearStage(won,1);for(const alter of [s=>s.run.summary.campaignReward.stage=2,s=>s.run.summary.campaignReward.first='yes',s=>s.run.floor=2,s=>s.run.cleared=2,s=>s.run.summary.reason='retreat',s=>s.campaign.cleared=0]){const bad=structuredClone(won);alter(bad);assert.throws(()=>copy(bad));}
  won.run.phase='story';won.run.campaign.story='outro';for(const alter of [s=>s.run.summary=null,s=>s.run.battle=null,s=>s.run.battle.enemies=[],s=>s.run.battle.enemies[0].hp=1]){const bad=structuredClone(won);alter(bad);assert.throws(()=>copy(bad));}
  const boss=E.createState();boss.campaign.cleared=2;E.startCampaign(boss,3,42);E.advanceCampaignStory(boss,true);for(const h of boss.run.heroes)h.atk=10000;for(let room=0;room<2;room++){E.chooseRoute(boss,0);winBattle(boss);E.selectBlessing(boss,boss.run.choices[0]);}E.chooseRoute(boss,0);copy(boss);for(const alter of [s=>s.run.battle.bossState.id='ashknight',s=>s.run.battle.enemies[0].bossId='moonwarden']){const bad=structuredClone(boss);alter(bad);assert.throws(()=>copy(bad));}
});

test('campaign training and expeditions stay isolated from story progress and first-clear rewards',()=>{
  const s=E.createState();E.dispatchExpedition(s,'mist-path','ember',0,Date.now());E.startCampaign(s,1,42);E.advanceCampaignStory(s);const before=structuredClone(s),t=E.createTrainingState(s);assert.deepEqual(s,before);assert.equal(t.run.campaign,null);assert.deepEqual(t.campaign,s.campaign);atomic(t,()=>E.claimCampaign(t,1));assert.deepEqual(copy(s).expeditions,s.expeditions);
});

test('campaign map and story markup expose chapter selection, unlocks, first rewards and saved dialogue line',()=>{
  const s=E.createState(),before=structuredClone(s),html=campaignPage(s);assert.deepEqual(s,before);assert.equal((html.match(/data-action="campaign-chapter"/g)||[]).length,5);assert.match(html,/Cần vượt ải trước/);assert.match(html,/QUÀ VƯỢT ẢI LẦN ĐẦU/);assert.match(campaignPage(s,4),/Bình minh không lặp lại/);E.startCampaign(s,1,42);assert.match(campaignStoryPage(s),/Dấu chân này/);E.advanceCampaignStory(s);assert.match(campaignStoryPage(copy(s)),/Lần này sẽ có người đi cùng/);E.finishRun(s);assert.match(campaignResult(s),/Chơi lại ải/);
});
