import {withoutResultLedger} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/achievements-legacy-v1.36.0/js/engine.mjs';
import {HEROES,RARITIES,RARITY,rarityRank,DAILY} from '../js/data.mjs';
import {achievementBook,achievementReward} from '../js/achievements-ui.mjs';
import {questReady,gameDock} from '../js/game-ui.mjs';
import {guardBattle,guardedTurn} from './timing-guard-helper.mjs';
import {account,overpower,clearStage,DRAGON} from './void-dragon-helper.mjs';
import {step} from './anomalies-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const atomic=(s,action)=>{const before=structuredClone(s);assert.throws(action);assert.deepEqual(s,before);};
const legacy=s=>{const c=withoutResultLedger(s);delete c.version;delete c.achievements;delete c.bonds;delete c.lockedGear;delete c.gearPresets;if(JSON.stringify(c.refining)===JSON.stringify({rolls:0,pending:null}))delete c.refining;if(JSON.stringify(c.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete c.loginRewards;if(JSON.stringify(c.bonds)==='{}')delete c.bonds;if(JSON.stringify(c.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete c.season;return c;};
const wallet=s=>({gold:s.gold,tickets:s.tickets,shards:s.shards});
function clear(s){
  for(const h of s.run.heroes)h.atk=100000;
  let n=0;while(s.run.phase==='battle'&&n++<30){const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),e=r.battle.enemies.find(e=>e.hp>0);if(h)E.playerAction(s,h.id,e.id);else E.enemyTurn(s);}
  assert.notEqual(s.run.phase,'battle');
}

test('fresh achievement books are independent and do not award a new account for owning the starter team',()=>{
  const a=E.createState(),b=E.createState();assert.equal(a.version,E.SAVE_VERSION);assert.deepEqual(copy(a),a);assert.equal(E.ACHIEVEMENTS.length,10);assert.deepEqual(E.readyAchievements(a),[]);assert.equal(questReady(a),false);
  a.achievements.stats.bosses++;a.achievements.claimed.push('boss-10');assert.deepEqual(b.achievements,E.starterAchievements());
});

test('normal tower records unlock all three floor badges and claiming preserves the active journey and old milestones',()=>{
  let s=E.createState();E.startRun(s,42);s.run.map=null;s.run.floor=50;s.run.routes=['boss'];E.chooseRoute(s,0);clear(s);E.finishRun(s);
  assert.equal(s.best,50);assert.deepEqual(E.readyAchievements(s).map(a=>a.id),['tower-10','tower-30','tower-50']);
  E.startRun(s,43);const run=structuredClone(s.run),before=wallet(s),milestones=structuredClone(s.claimed);
  for(const id of ['tower-10','tower-30','tower-50']){E.claimAchievement(s,id);s=copy(s);atomic(s,()=>E.claimAchievement(s,id));}
  assert.deepEqual(wallet(s),{gold:before.gold+2150,tickets:before.tickets+12,shards:before.shards+14});assert.deepEqual(s.run,run);assert.deepEqual(s.claimed,milestones);assert.deepEqual(E.readyAchievements(s),[]);
});

test('fifty actual summons unlock a separate reward without altering pity, contracts or owned heroes when claimed',()=>{
  const s=E.createState();s.tickets=50;for(let n=0;n<5;n++)E.summon(s,10,()=>.99);
  assert.equal(E.achievementStatus(s,'summon-50').ready,true);const before=structuredClone(s),reward=E.claimAchievement(s,'summon-50').reward;
  assert.deepEqual(wallet(s),{gold:before.gold+reward.gold,tickets:before.tickets+reward.tickets,shards:before.shards+reward.shards});
  for(const key of ['pity','srPity','highPity','summoning','owned','totalSummons','daily'])assert.deepEqual(s[key],before[key],key);
  assert.equal(E.achievementStatus(s,'summon-50').progress,50);assert.deepEqual(copy(s),s);
});

test('collection progress counts distinct heroes obtained through the real summon pool and ignores duplicate copies',()=>{
  const s=E.createState();s.tickets=30;
  for(const hero of HEROES.filter(h=>!s.owned[h.id]).slice(0,6)){
    const pool=HEROES.filter(h=>h.rarity===hero.rarity),higher=RARITIES.filter(r=>rarityRank(r)>rarityRank(hero.rarity)).reduce((sum,r)=>sum+RARITY[r].rate,0);
    let n=0;E.summon(s,1,()=>n++%2===0?(higher+RARITY[hero.rarity].rate/2)/100:(pool.indexOf(hero)+.25)/pool.length);
  }
  assert.equal(E.achievementStatus(s,'heroes-10').value,10);assert.equal(E.achievementStatus(s,'heroes-10').ready,true);
  E.summon(s,1,()=>.99);assert.equal(E.achievementStatus(s,'heroes-10').value,10);E.claimAchievement(s,'heroes-10');assert.deepEqual(copy(s),s);
});

for(const action of ['attack','skill','link','pet','burn','mirror','cinder'])test(`a boss killed by ${action} counts once, including indirect damage`,()=>{
  let s=guardBattle(),r=s.run,e=r.battle.enemies[0];e.hp=1;
  if(action==='attack')E.playerAction(s,'rook','enemy0');
  if(action==='skill'){r.heroes[0].energy=100;E.playerAction(s,'rook','enemy0',true);}
  if(action==='link'){r.link.charge=100;E.linkAction(s,'rook','aerin','enemy0');}
  if(action==='pet'){s.adventure.pets.vermillion={level:1};r.pet={id:'vermillion',level:1,nextRound:1};E.petAction(s);}
  if(action==='burn'){e.burn=1;e.burnPower=100;E.enemyTurn(s);}
  if(action==='mirror'){r.relics=['mirror'];r.heroes[0].shield=1;E.enemyTurn(s);}
  if(action==='cinder'){
    r.relics=['cinder'];r.battle.enemies.push({...structuredClone(e),id:'enemy1',kind:'wraith',name:'Bóng hầu',hp:1,maxHp:100,burn:1,burnPower:1});E.playerAction(s,'rook','enemy1');
  }
  assert.equal(e.hp,0);assert.equal(s.achievements.stats.bosses,1);assert.deepEqual(E.readyAchievements(s),[]);s=copy(s);E.dismissVictory(s);E.finishRun(s);assert.equal(copy(s).achievements.stats.bosses,1);
});

test('a dead boss with surviving minions is never counted again by later actions, reload, pet or enemy turns',()=>{
  let s=guardBattle('archivist','summon');E.enemyTurn(s);assert.equal(s.run.battle.enemies.length,3);
  for(const e of s.run.battle.enemies.slice(1))e.hp=e.maxHp=100000;
  s.run.battle.enemies[0].hp=1;E.playerAction(s,'rook','enemy0');assert.equal(s.run.phase,'battle');assert.equal(s.achievements.stats.bosses,1);
  s=copy(s);E.playerAction(s,'aerin','enemy1');E.petAction(s);E.enemyTurn(s);s=copy(s);E.playerAction(s,'rook','enemy2');assert.equal(s.achievements.stats.bosses,1);
  clear(s);assert.equal(copy(s).achievements.stats.bosses,1);
});

for(const mode of ['hunt','challenge','campaign','dungeon'])test(`${mode} boss victories contribute without inventing tower records`,()=>{
  const s=E.createState();
  if(mode==='hunt')E.startHunt(s,'colossus',1,42);
  if(mode==='challenge')E.startChallenge(s,'gauntlet');
  if(mode==='campaign'){s.campaign.cleared=2;E.startCampaign(s,3,42);}
  if(mode==='dungeon')E.startDungeon(s,'earth',1,new Date(),42);
  if(s.run.phase==='story')E.advanceCampaignStory(s,true);
  if(s.run.phase==='route'){s.run.floor=mode==='campaign'||mode==='dungeon'?3:1;s.run.map=null;s.run.routes=['boss'];E.chooseRoute(s,0);}
  clear(s);assert.equal(s.achievements.stats.bosses,1);assert.equal(s.best,0);assert.deepEqual(copy(s),s);
});

test('part breaks count only the transition from intact to broken across reload and repeat attacks',()=>{
  let s=guardBattle();
  for(const part of E.BOSS_PART_IDS){s.run.battle.bossState.parts[part].hp=1;s.run.battle.used=[];const events=E.playerAction(s,'rook','enemy0',false,part);assert.equal(events[0].part.broken,true);s=copy(s);}
  assert.equal(s.achievements.stats.partBreaks,3);s.run.battle.used=[];E.playerAction(s,'rook','enemy0',false,'arms');assert.equal(s.achievements.stats.partBreaks,3);
});

test('ten actual hunt victories unlock the boss reward only at the threshold and never pay it automatically',()=>{
  let s=E.createState();
  for(let n=1;n<=10;n++){E.startHunt(s,'colossus',1,42+n);clear(s);assert.equal(s.achievements.stats.bosses,n);assert.equal(E.achievementStatus(s,'boss-10').ready,n===10);s=copy(s);}
  const before=wallet(s);E.claimAchievement(s,'boss-10');assert.deepEqual(wallet(s),{gold:before.gold+700,tickets:before.tickets+4,shards:before.shards+6});atomic(s,()=>E.claimAchievement(s,'boss-10'));copy(s);
});

test('achievement counters saturate safely so another real kill cannot make the account unloadable',()=>{
  const s=guardBattle();s.achievements.stats.bosses=1e9;s.run.battle.enemies[0].hp=1;E.playerAction(s,'rook','enemy0');assert.equal(s.achievements.stats.bosses,1e9);assert.deepEqual(copy(s),s);
});

test('perfect guards count once per boss special and counters count only a consumed valid opportunity',()=>{
  for(const grade of ['miss','guard','perfect']){
    let s=guardBattle();const receipt=E.beginTimingGuard(s);s=copy(s);E.enemyTurn(s,{...receipt,grade});assert.equal(s.achievements.stats.perfectGuards,grade==='perfect'?1:0);
    if(grade==='perfect'){
      assert.equal(s.achievements.stats.counters,0);const token=E.counterOpportunity(s.run);s=copy(s);E.counterAction(s,'rook','enemy0',token,'arms');assert.equal(s.achievements.stats.counters,1);assert.equal(s.achievements.stats.perfectGuards,1);atomic(s,()=>E.counterAction(s,'rook','enemy0',token));
    }
    assert.deepEqual(copy(s),s);
  }
  const frozen=guardBattle();frozen.run.battle.enemies[0].freeze=1;E.enemyTurn(frozen);assert.equal(frozen.achievements.stats.perfectGuards,0);
  const burned=guardBattle();burned.run.battle.enemies[0].hp=1;burned.run.battle.enemies[0].burn=1;burned.run.battle.enemies[0].burnPower=100;guardedTurn(burned);assert.equal(burned.achievements.stats.perfectGuards,0);
});

for(const boss of ['tam-an',DRAGON])test(`${boss} requires all three raid stages before recording the raid badge and never pays twice`,()=>{
  let s=account();E.startRaid(s,1,42,boss);overpower(s);
  for(let i=0;i<3;i++){
    clearStage(s);assert.equal(s.achievements.stats.bosses,i+1);assert.equal(s.achievements.stats.raidClears,i===2?1:0);s=copy(s);
    if(i<2){assert.equal(E.achievementStatus(s,'raid-1').ready,false);E.dismissVictory(s);E.continueRaid(s,i);}
  }
  const prize=E.claimAchievement(s,'raid-1');assert.equal(prize.reward.tickets,7);const paid=structuredClone(s);E.dismissVictory(s);E.finishRun(s);assert.deepEqual(wallet(s),wallet(paid));atomic(s,()=>E.claimAchievement(s,'raid-1'));assert.equal(s.achievements.stats.raidClears,1);copy(s);
});

test('retreating from a partially completed raid keeps defeated bosses without granting a full clear',()=>{
  const s=account();E.startRaid(s,1,42);overpower(s);clearStage(s);E.finishRun(s);assert.equal(s.achievements.stats.bosses,1);assert.equal(s.achievements.stats.raidClears,0);assert.equal(E.achievementStatus(s,'raid-1').ready,false);copy(s);
});

test('training never changes achievement counters or pays copied or artificial collection progress',()=>{
  const source=E.createState();source.best=50;source.achievements.stats.bosses=10;const before=structuredClone(source),s=E.createTrainingState(source),ledger=structuredClone(s.achievements);
  s.run.battle.bossState.move='quake';for(const h of s.run.heroes)h.hp=h.maxHp=10000;guardedTurn(s);s.run.battle.bossState.parts.arms.hp=1;E.counterAction(s,'rook','enemy0',E.counterOpportunity(s.run),'arms');clear(s);
  assert.deepEqual(s.achievements,ledger);assert.deepEqual(source,before);assert.deepEqual(E.readyAchievements(s),[]);atomic(s,()=>E.claimAchievement(s,'tower-50'));atomic(s,()=>E.claimAchievement(s,'heroes-10'));
});

for(const phase of ['fresh','route','battle','pending-guard','counter','contract','result'])test(`released save v26 ${phase} migrates without changing an existing journey, account or RNG`,()=>{
  const old=Old.createState();
  if(phase!=='fresh')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){
    old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);
    if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}
    if(['pending-guard','counter'].includes(phase)){
      old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;
      const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});
    }
  }
  if(phase==='result')Old.finishRun(old);
  old.best=30;old.totalSummons=70;const frozen=structuredClone(old),s=copy(old);assert.equal(old.version,26);assert.equal(s.version,E.SAVE_VERSION);assert.deepEqual(old,frozen);assert.deepEqual(legacy(s),legacy(old));assert.deepEqual(s.achievements,E.starterAchievements());assert.deepEqual(s.lockedGear,[]);assert.deepEqual(copy(s),s);
  assert.deepEqual(E.readyAchievements(s).map(a=>a.id),['tower-10','tower-30','summon-50']);
});

for(const seed of [1,42,123456])test(`released 1.36 journey ${seed} keeps all actions, RNG and economy while the new book records progress`,()=>{
  const old=Old.createState();for(const h of Object.values(old.owned))h.level=8;Old.startRun(old,seed);let s=copy(old),actions=0;
  while(old.run.phase!=='result'&&old.run.floor<=15&&actions++<1600){assert.equal(step(E,s),step(Old,old));assert.deepEqual(legacy(s),legacy(old));s=copy(s);}
  assert.ok(actions<1600);assert.ok(s.achievements.stats.bosses>0);
});

for(const key of ['gold','tickets','shards'])test(`a capped ${key} wallet rejects the entire achievement claim atomically`,()=>{
  const s=E.createState();s.best=50;s[key]=1e9;atomic(s,()=>E.claimAchievement(s,'tower-50'));assert.deepEqual(copy(s),s);
});

test('invalid, unfinished and duplicate achievement claims never mutate resources or the book',()=>{
  const s=E.createState();for(const id of ['tower-10','constructor','toString','__proto__','missing',null,{},['tower-10']])atomic(s,()=>E.claimAchievement(s,id));
  s.best=10;const status=E.achievementStatus(s,'tower-10');status.reward.gold=100000;E.claimAchievement(s,'tower-10');assert.equal(s.gold,1100);atomic(s,()=>E.claimAchievement(s,'tower-10'));copy(s);
});

const invalid=[['missing book',s=>delete s.achievements],['null book',s=>s.achievements=null],['array book',s=>s.achievements=[]],['extra book field',s=>s.achievements.extra=1],['missing claims',s=>delete s.achievements.claimed],['object claims',s=>s.achievements.claimed={}],['unknown claim',s=>s.achievements.claimed=['constructor']],['duplicate claim',s=>{s.best=10;s.achievements.claimed=['tower-10','tower-10'];}],['unearned claim',s=>s.achievements.claimed=['boss-10']],['missing stats',s=>delete s.achievements.stats],['array stats',s=>s.achievements.stats=[]],['extra stat',s=>s.achievements.stats.extra=1],['missing stat',s=>delete s.achievements.stats.counters],['negative stat',s=>s.achievements.stats.bosses=-1],['fractional stat',s=>s.achievements.stats.partBreaks=.5],['string stat',s=>s.achievements.stats.raidClears='1'],['overflow stat',s=>s.achievements.stats.perfectGuards=1e9+1],['nonfinite stat',s=>s.achievements.stats.counters=Infinity]];
for(const [name,alter] of invalid)test(`achievement import rejects ${name} without mutating its source`,()=>{const s=E.createState();alter(s);atomic(s,()=>E.validateState(s));});

test('achievement import rejects non-string claim identifiers even when they coerce to an earned badge',()=>{
  for(const claimed of [[['tower-10']],[[['tower-10']]],[['tower-10'],'tower-10'],[null],[{}],[10]]){
    const s=E.createState();s.best=10;s.achievements.claimed=claimed;atomic(s,()=>E.validateState(s));
  }
});

test('export/import retains claimed rewards, unclaimed goals and counters without crediting a second payout',()=>{
  let s=guardBattle();guardedTurn(s);E.counterAction(s,'rook','enemy0',E.counterOpportunity(s.run));s.best=30;E.claimAchievement(s,'tower-10');const exported=JSON.stringify({game:'thap-vo-tan',state:s}),before=structuredClone(s);s=E.validateState(JSON.parse(exported).state);assert.deepEqual(s,before);atomic(s,()=>E.claimAchievement(s,'tower-10'));assert.equal(E.achievementStatus(s,'tower-30').ready,true);assert.deepEqual(s.run,before.run);
});

test('the book orders ready badges first, shows all four tiers and clears its quest notification only after claiming',()=>{
  const s=E.createState();s.achievements.stats.bosses=10;s.daily.claimed=DAILY.map(q=>q.id);const before=structuredClone(s),html=achievementBook(s);
  assert.equal((html.match(/data-action="claim-achievement"/g)||[]).length,10);assert.match(html,/1 huy hiệu đang chờ/);assert.match(html,/5 \/ 5|10 \/ 10/);assert.ok(html.indexOf('Kẻ giải ấn')<html.indexOf('Bước chân đầu tiên'));for(const tier of ['I','II','III','IV'])assert.ok(html.includes('data-tier="'+tier+'"'));assert.match(html,/Phòng thử/);assert.deepEqual(s,before);assert.equal(questReady(s),true);assert.match(gameDock(s,'quests'),/Có thưởng để nhận/);
  E.claimAchievement(s,'boss-10');assert.equal(questReady(s),false);assert.match(achievementBook(s),/is-claimed/);assert.match(achievementReward({tickets:2,gold:1500,shards:3}),/1\.500 vàng/);copy(s);
});
