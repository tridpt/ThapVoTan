import {TOWER_BALANCE_RULES,towerScale,towerEnemyProfile,towerGoldBonus,heroUpgradePrice,validateBalance} from './balance.mjs';
export * from './balance.mjs';
import {HEROES,HERO,RARITY,RARITIES,HIGH_PITY,rarityRank,AWAKENING,BLESSINGS,MILESTONES,DAILY,RELICS,RELIC,BOSS,BOSSES,TRIAL,bossForFloor} from './data.mjs';
import {starterEquipment,validateEquipment,gearBonus,dropGear} from './equipment.mjs';
import {starterGearPresets,validateGearPresets} from './gear-presets.mjs';
import {starterRefining,validateRefining} from './refining.mjs';
import {starterLoginRewards,validateLoginRewards} from './login-rewards.mjs';
import {starterBonds,validateBonds,recordBondVictory} from './bonds.mjs';
import {starterSeason,validateSeason,snapshotSeason,recordSeasonSkill,recordSeasonVictory,SEASON_FLOORS,SEASON_ROUTES,SEASON_BOSS,seasonSkillMultiplier,seasonHealingMultiplier,seasonShieldMultiplier,seasonEnemyHpMultiplier,seasonIncomingMultiplier,seasonBasicEnergy,seasonOpeningEnergy} from './season.mjs';
export * from './season.mjs';
import {teamResonances,hasResonance,skillPower,noRevive,weekKey,trialSeed,recordTrial,validateProgression} from './progression.mjs';
import {DUNGEON,DUNGEON_DIFFICULTIES,DUNGEON_ROOMS,PET} from './adventure-data.mjs';
import {starterAdventure,validateAdventure,snapshotPet,adventureDay,dungeonStatus,completeDungeon,petReady,petStrength} from './adventure.mjs';
import {starterArmory,validateArmory,gearLoadout,loadoutEffects,huntUnlocked,completeHunt,makeForgedGear} from './armory.mjs';
import {GEAR_SET,SIGNATURES,HUNT,HUNT_TIERS} from './armory-data.mjs';
import {starterExpeditions,validateExpeditions,expeditionForHero} from './expeditions.mjs';
import {starterCampaign,validateCampaign,campaignUnlocked,campaignStage,campaignChapter,campaignRooms,campaignDialogue,completeCampaign} from './campaign.mjs';
import {starterGraphics,starterPresets,validatePreferences} from './preferences.mjs';
import {createBossParts,damageBossPart,bossParts,bossPartName,BOSS_PART_IDS,bossAttackMultiplier,bossDirectMultiplier,validateBossParts} from './boss-parts.mjs';
import {talentBonuses,heroTalents,fighterTalents,snapshotTalents,validateTalents} from './talents.mjs';
import {LINK_MAX,starterLink,gainLink,linkForPair,linkBlocker,validateLink} from './links.mjs';
export * from './equipment.mjs';
export * from './gear-presets.mjs';
export * from './refining.mjs';
export * from './login-rewards.mjs';
export {BOND_LORE,BOND_MILESTONES,BOND_GIFT,BOND_MAX,starterBonds,validateBonds,bondStatus,bondAdorned,bondGiftReceipt,bondGiftPreview,giveBondGift,setBondAdornment} from './bonds.mjs';
export * from './progression.mjs';
export * from './adventure.mjs';
export * from './armory.mjs';
export * from './expeditions.mjs';
export * from './campaign.mjs';
export * from './preferences.mjs';
export * from './boss-parts.mjs';
export * from './talents.mjs';
export * from './links.mjs';
import {starterFormation,validFormation,validateFormation,formationTarget,enemyPierces,coverMultiplier} from './formation.mjs';
export * from './formation.mjs';
import {starterSkins,validateSkins} from './skins.mjs';
export * from './skins.mjs';
import {starterTowerMap,advanceTowerMap,commitTowerRoute,validateTowerMap} from './tower-map.mjs';
export * from './tower-map.mjs';
import {starterStatistics,recordContribution,recordResult,validateVictory} from './victory.mjs';
export * from './victory.mjs';
import {starterRaids,migrateRaidMissions,migrateDragonRaids,validateRaids,raidBlocker,raidId,raidDefinition,VOID_DRAGON,raidReport,completeRaid} from './raids.mjs';
export * from './raids.mjs';
import {starterSummoning,validateSummoning,resolveSummonTarget} from './summoning.mjs';
export * from './summoning.mjs';
import {starterOnboarding,validateOnboarding,recordTutorialProgress} from './onboarding.mjs';
export * from './onboarding.mjs';
import {ELITE_RULES,assignElite,eliteDefinition,activeEliteGuard,autoEnemyTarget,eliteAttackMultiplier,reviveElite,eliteReward,validateElites} from './elites.mjs';
export * from './elites.mjs';
import {CONTRACT_RULES,CONTRACT,contractEligible,availableContracts,contractDamageMultiplier,contractEnemyMultiplier,contractSkillMultiplier,contractGold,contractSkillCost,offerContracts,acceptContract,validateContracts} from './contracts.mjs';
export * from './contracts.mjs';
import {starterAnomalies,anomalyForFloor,anomalyDamageMultiplier,anomalyHealingMultiplier,anomalyShieldMultiplier,anomalyOpeningPenalty,anomalyBasicEnergy,anomalyEnemyHpMultiplier,validateAnomalies} from './anomalies.mjs';
export * from './anomalies.mjs';
import {GUARD_REDUCTION,GUARD_ENERGY,consumeTimingGuard,assertTimingGuardIdle,validateTimingGuard} from './timing-guard.mjs';
export * from './timing-guard.mjs';
import {COUNTER_POWER,consumeCounter,grantCounter,expireCounter,validateCounter} from './counter.mjs';
export * from './counter.mjs';
import {starterAchievements,achievementStatus,achievementStatuses,readyAchievements,recordAchievement,claimAchievement,validateAchievements} from './achievements.mjs';
export * from './achievements.mjs';
export const SAVE_VERSION = 34;
export const SUMMON_PITY = 50;
export const TEN_PITY = 10;
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export function dayKey(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function createState() {
  return {version:SAVE_VERSION,gold:800,tickets:15,shards:0,...starterEquipment(),refining:starterRefining(),loginRewards:starterLoginRewards(),bonds:starterBonds(),season:starterSeason(),gearPresets:starterGearPresets(),adventure:starterAdventure(),armory:starterArmory(),expeditions:starterExpeditions(),campaign:starterCampaign(),presets:starterPresets(),talents:{},skins:starterSkins(),raids:starterRaids(),summoning:starterSummoning(),onboarding:starterOnboarding(),achievements:starterAchievements(),owned:{aerin:{level:1,copies:0,awaken:0},rook:{level:1,copies:0,awaken:0},lumi:{level:1,copies:0,awaken:0},ember:{level:1,copies:0,awaken:0}},team:['rook','aerin','lumi'],formation:starterFormation(),meta:{attack:0,health:0,guard:0},pity:0,srPity:0,highPity:Object.fromEntries(Object.keys(HIGH_PITY).map(r=>[r,0])),totalSummons:0,best:0,runs:0,wins:0,claimed:[],daily:{day:dayKey(),battles:0,summons:0,runs:0,claimed:[]},challengeWeeks:{},run:null,settings:{sound:true,speed:1,graphics:starterGraphics()},welcome:false};
}
export function refreshDaily(s,date=new Date()) {if(s.daily.day!==dayKey(date)) s.daily={day:dayKey(date),battles:0,summons:0,runs:0,claimed:[]};}
export function validateState(raw) {
  if(!raw || ![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,SAVE_VERSION].includes(raw.version) || !raw.owned || typeof raw.owned!=='object'||Array.isArray(raw.owned)) throw new Error('Bản lưu không hợp lệ hoặc không tương thích.');
  if(raw.version<25&&Object.hasOwn(raw.run?.battle||{},'timingGuard'))throw new Error('Bản lưu cũ không có lượt đỡ đòn.');
  if(raw.version<26&&Object.hasOwn(raw.run?.battle||{},'counter'))throw new Error('Bản lưu cũ không có cơ hội phản công.');
  const s=structuredClone(raw);
  if(s.version===1){
    Object.assign(s,starterEquipment());s.version=2;
    if(s.run){
      Object.assign(s.run,{relics:[],relicChoices:[],relicUsed:{lantern:false},gearFound:0});
      if(s.run.battle){
        s.run.battle.bossState=null;s.run.battle.relicSkillUsed=false;
        for(const enemy of s.run.battle.enemies){enemy.shield=0;enemy.deathHandled=enemy.hp<=0;}
      }
    }
  }
  if(s.version===2){
    s.challengeWeeks={};s.version=3;
    for(const own of Object.values(s.owned))own.awaken=0;
    if(s.run){s.run.mode='normal';s.run.challenge=null;s.run.resonances=[];for(const h of s.run.heroes)h.awaken=0;}
  }
  for(const k of ['gold','tickets','shards','pity','srPity','totalSummons','best','runs','wins']) if(!Number.isSafeInteger(s[k]) || s[k]<0 || s[k]>1e9) throw new Error('Dữ liệu tài nguyên không hợp lệ.');
  if(s.version===3){
    // Older pools had no UR+ heroes: retain credit for every historical draw.
    s.highPity=Object.fromEntries(Object.entries(HIGH_PITY).map(([r,cap])=>[r,Math.min(s.totalSummons,cap-1)]));s.version=4;
  }
  if(s.version===4){
    s.adventure=starterAdventure();s.version=5;
    if(s.run){s.run.pet=null;s.run.dungeon=null;}
  }
  if(s.version===5){s.armory=starterArmory();s.version=6;if(s.run){s.run.hunt=null;s.run.training=null;for(const h of s.run.heroes)h.loadout=null;}}
  if(s.version===6){s.expeditions=starterExpeditions();s.version=7;}
  if(s.version===7){s.campaign=starterCampaign();s.presets=starterPresets();s.settings={...s.settings,graphics:starterGraphics()};s.version=8;if(s.run)s.run.campaign=null;}
  if(s.version===8){const bs=s.run?.battle?.bossState;if(bs&&!Object.hasOwn(bs,'parts'))bs.parts=null;s.version=9;}
  if(s.version===9){s.talents={};if(s.run)for(const h of s.run.heroes)h.talents=null;s.version=10;}
  if(s.version===10){if(s.run){s.run.link=starterLink();if(s.run.battle)s.run.battle.linkUsed=false;}s.version=11;}
  if(s.version===11){s.formation=starterFormation();if(s.run)s.run.formation=null;for(const p of s.presets||[])if(p)p.formation=starterFormation();s.version=12;}
  if(s.version===12){s.skins=starterSkins();s.version=13;}
  if(s.version===13){if(s.run)s.run.map=null;s.version=14;}
  if(s.version===14){if(s.run){const r=s.run;r.statistics=starterStatistics(r,true);r.victory=null;if(r.battle){r.battle.statistics=starterStatistics(r,true);for(const e of r.battle.enemies)e.burnSource=null;}}s.version=15;}
  if(s.version===15){
    s.armory.essence=0;
    if(s.run){for(const h of s.run.heroes)if(h.loadout){h.loadout.affixes={crit:0,drain:0,energy:0};h.loadout.weaponRarity=null;}
      const prize=s.run.summary?.huntReward;if(prize){prize.essence=0;prize.legacyEssence=true;}}
    s.version=16;
  }
  if(s.version===16){s.raids=starterRaids();if(s.run)s.run.raid=null;s.version=19;}
  if(s.version===17){migrateRaidMissions(s);s.version=18;}
  if(s.version===18){migrateDragonRaids(s);s.version=19;}
  if(s.version===19){
    if(Object.hasOwn(s,'summoning')){
      validateSummoning(s);
      if(s.summoning.target!==null||s.summoning.exchanged.length||Object.values(s.summoning.guaranteed).some(Boolean))throw new Error('Bản lưu cũ có tiến độ triệu hồi không hợp lệ.');
    }else s.summoning=starterSummoning();
    s.version=20;
  }
  if(s.version===20){
    if(Object.hasOwn(s,'onboarding')){
      validateOnboarding(s);
      if(s.onboarding.status!=='available'||s.onboarding.completed.length||s.onboarding.claimed.length||s.onboarding.ssr!==null)throw new Error('Bản lưu cũ có tiến độ tân thủ không hợp lệ.');
    }else s.onboarding=starterOnboarding();
    s.version=21;
  }
  if(s.version===21)s.version=22;
  // Existing journeys keep their original rules until the next normal departure.
  if(s.version===22)s.version=23;
  if(s.version===23)s.version=24;
  if(s.version===24)s.version=25;
  if(s.version===25)s.version=26;
  if(s.version===26){s.achievements=starterAchievements();s.version=27;}
  if(s.version===27){s.lockedGear=[];s.version=28;}
  if(s.version===28){s.gearPresets=starterGearPresets();s.version=29;}
  if(s.version===29){for(const p of s.presets||[])if(p)p.gear=null;s.version=30;}
  if(s.version===30){s.refining=starterRefining();s.version=31;}
  if(s.version===31){s.loginRewards=starterLoginRewards();s.version=32;}
  if(s.version===32){s.bonds=starterBonds();s.version=33;}
  if(s.version===33){s.season=starterSeason();s.version=SAVE_VERSION;}
  validateSummoning(s);
  validateOnboarding(s);
  if(s.pity>=SUMMON_PITY || s.srPity>=TEN_PITY) throw new Error('Dữ liệu triệu hồi không hợp lệ.');
  if(!s.highPity||typeof s.highPity!=='object'||Array.isArray(s.highPity)||Object.keys(s.highPity).length!==Object.keys(HIGH_PITY).length||Object.entries(HIGH_PITY).some(([r,cap])=>!Object.hasOwn(s.highPity,r)||!Number.isSafeInteger(s.highPity[r])||s.highPity[r]<0||s.highPity[r]>=cap))throw new Error('Bảo đảm độ hiếm cao không hợp lệ.');
  for(const [id,v] of Object.entries(s.owned)) if(!Object.hasOwn(HERO,id) || !v || !Number.isInteger(v.level) || v.level<1 || v.level>100 || !Number.isInteger(v.copies) || v.copies<0) throw new Error('Dữ liệu anh hùng không hợp lệ.');
  validateEquipment(s);
  validateRefining(s);
  validateLoginRewards(s);
  validateBonds(s);
  validateGearPresets(s);
  if(!Array.isArray(s.team) || s.team.length!==3 || new Set(s.team).size!==3 || s.team.some(id=>!Object.hasOwn(s.owned,id))) throw new Error('Đội hình không hợp lệ.');
  if(!s.meta || ['attack','health','guard'].some(k=>!Number.isInteger(s.meta[k])||s.meta[k]<0||s.meta[k]>25)) throw new Error('Dữ liệu ấn ký không hợp lệ.');
  if(!Array.isArray(s.claimed)||s.claimed.some(f=>!MILESTONES.includes(f))||!s.daily||!Array.isArray(s.daily.claimed)||s.daily.claimed.some(id=>!DAILY.some(q=>q.id===id))||!['battles','summons','runs'].every(k=>Number.isInteger(s.daily[k])&&s.daily[k]>=0)) throw new Error('Dữ liệu nhiệm vụ không hợp lệ.');
  validateAchievements(s);
  if(!s.settings || typeof s.settings.sound!=='boolean') s.settings={sound:true,speed:1,graphics:starterGraphics()};
  if(![1,2].includes(s.settings.speed))s.settings.speed=1;
  if(s.run) {
    const r=s.run;
    if(!['route','battle','blessing','relic','contract','event','result','story','relay'].includes(r.phase)||!Number.isInteger(r.floor)||r.floor<1||r.floor>1e6||!Array.isArray(r.heroes)||r.heroes.length!==3||!Array.isArray(r.buffs)||r.buffs.some(id=>!BLESSINGS.some(b=>b.id===id))||!Number.isFinite(r.seed)) throw new Error('Chuyến leo tháp không hợp lệ.');
    if(!Array.isArray(r.relics)||r.relics.length>RELICS.length||new Set(r.relics).size!==r.relics.length||r.relics.some(id=>!Object.hasOwn(RELIC,id))||!Array.isArray(r.relicChoices)||r.relicChoices.length>3||r.relicChoices.some(id=>!Object.hasOwn(RELIC,id))||!r.relicUsed||typeof r.relicUsed.lantern!=='boolean'||!Number.isSafeInteger(r.gearFound)||r.gearFound<0||![null,'battle','elite','rest','treasure','event','boss'].includes(r.node))throw new Error('Cổ vật trong chuyến đi không hợp lệ.');
    if(r.phase==='relic'&&(r.relicChoices.length<1||r.relicChoices.length>3||new Set(r.relicChoices).size!==r.relicChoices.length||r.relicChoices.some(id=>!RELIC[id]||r.relics.includes(id))))throw new Error('Lựa chọn cổ vật không hợp lệ.');
    for(const h of r.heroes) if(!Object.hasOwn(HERO,h.id)||!Object.hasOwn(s.owned,h.id)||!['hp','maxHp','atk','def','energy','shield'].every(k=>Number.isFinite(h[k])&&h[k]>=0)||h.hp>h.maxHp||h.maxHp<1||h.energy>100) throw new Error('Chỉ số đội hình không hợp lệ.');
    if(new Set(r.heroes.map(h=>h.id)).size!==3||!['goldEarned','ticketsEarned','cleared'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))throw new Error('Chuyến đi không hợp lệ.');
    if(!Array.isArray(r.routes)||r.routes.length<1||r.routes.length>3||r.routes.some(n=>!['battle','elite','rest','treasure','event','boss'].includes(n))) throw new Error('Lối đi không hợp lệ.');
    if(r.lastReward&&!['gold','tickets','shards'].every(k=>Number.isSafeInteger(r.lastReward[k])&&r.lastReward[k]>=0))throw new Error('Phần thưởng không hợp lệ.');
    if(r.lastReward?.loot){const loot=r.lastReward.loot;if(typeof loot.converted!=='boolean'||!Number.isSafeInteger(loot.dust)||loot.dust<0)throw new Error('Chiến lợi phẩm không hợp lệ.');validateEquipment({...s,inventory:[loot.gear],equipped:{},lockedGear:[]});}
    if(r.phase==='blessing'&&(!Array.isArray(r.choices)||r.choices.length!==3||r.choices.some(id=>!BLESSINGS.some(b=>b.id===id)))) throw new Error('Chúc phúc không hợp lệ.');
    if(r.phase==='battle'&&(!r.battle||!Array.isArray(r.battle.enemies)||!r.battle.enemies.length||r.battle.enemies.some(e=>!['hp','maxHp','atk','def','burn','freeze'].every(k=>Number.isFinite(e[k])&&e[k]>=0)||e.maxHp<1||e.hp>e.maxHp)||!Array.isArray(r.battle.used)||!Array.isArray(r.battle.log))) throw new Error('Trận đấu không hợp lệ.');
    if(r.phase==='battle') {
      const b=r.battle;
      if(!Number.isSafeInteger(b.round)||b.round<1||b.enemies.length>3||b.enemies.some((e,i)=>e.id!=='enemy'+i||!['boss','sentinel','wraith'].includes(e.kind)||typeof e.name!=='string'||e.name.length>80||!Number.isInteger(e.intent)||e.intent<0||e.intent>2||!Number.isFinite(e.burnPower)||e.burnPower<0||!Number.isFinite(e.shield)||e.shield<0||typeof e.deathHandled!=='boolean')||new Set(b.used).size!==b.used.length||b.used.some(id=>!r.heroes.some(h=>h.id===id))||typeof b.relicSkillUsed!=='boolean'||b.log.some(l=>typeof l.text!=='string'||l.text.length>300||!['info','damage','crit','enemy','skill'].includes(l.type)))throw new Error('Trạng thái trận đấu không hợp lệ.');
      if(b.bossState){const bs=b.bossState,def=bossDefinition(bs.id);if(!def||![1,2].includes(bs.phase)||!Object.hasOwn(def.moves,bs.move)||!Number.isInteger(bs.stagger)||bs.stagger<0||bs.stagger>2||b.enemies[0].kind!=='boss'||r.node!=='boss')throw new Error('Cơ chế boss không hợp lệ.');}
    }
    if(r.phase==='result'&&(!r.summary||!['retreat','defeat','victory'].includes(r.summary.reason)||!['cleared','gold','tickets','buffs'].every(k=>Number.isSafeInteger(r.summary[k])&&r.summary[k]>=0)))throw new Error('Kết quả chuyến đi không hợp lệ.');
  }
  if(s.run?.battle?.enemies?.some(e=>Object.hasOwn(e,'voidMarks')&&(!Number.isSafeInteger(e.voidMarks)||e.voidMarks<0||e.voidMarks>2)))throw new Error('Dấu Hư Không không hợp lệ.');
  validateSeason(s);
  validateProgression(s);
  validateAdventure(s);
  validateArmory(s);
  validateExpeditions(s);
  validateCampaign(s);
  validatePreferences(s);
  validateBossParts(s);
  validateTalents(s);
  validateLink(s);
  validateFormation(s);
  validateSkins(s);
  validateTowerMap(s);
  validateVictory(s);
  validateRaids(s);
  validateElites(s);
  validateContracts(s);
  validateAnomalies(s);
  validateTimingGuard(s);
  validateCounter(s);validateBalance(s);
  refreshDaily(s); return s;
}
export function heroStats(s,id) {
  const h=HERO[id], level=s.owned[id]?.level||1,awaken=s.owned[id]?.awaken||0;
  const gear=gearBonus(s,id),effects=loadoutEffects(gearLoadout(s,id)),talents=talentBonuses(heroTalents(s,id));
  return {maxHp:Math.round((Math.round(h.hp*(1+(level-1)*.075)*(1+s.meta.health*.05)*(1+awaken*.06))+gear.maxHp)*(1+effects.hp)*(1+talents.hp)),atk:Math.round((Math.round(h.atk*(1+(level-1)*.065)*(1+s.meta.attack*.04)*(1+awaken*.06))+gear.atk)*(1+effects.atk)*(1+talents.atk)),def:Math.round(h.def+(level-1)*.65+s.meta.guard+awaken)+gear.def+effects.def+talents.def};
}
export function upgradeCost(s,id) { return heroUpgradePrice(s.owned[id]?.level||1); }
export function upgradeHero(s,id) {
  if(!s.owned[id]) throw new Error('Bạn chưa sở hữu anh hùng này.');
  if(s.owned[id].level>=100) throw new Error('Anh hùng đã đạt cấp tối đa.');
  const cost=upgradeCost(s,id);if(s.gold<cost) throw new Error('Chưa đủ vàng. Hãy chinh phục thêm vài tầng tháp.');
  s.gold-=cost;s.owned[id].level++;return cost;
}
export function metaCost(s,id) {return 3+(s.meta[id]||0)*3;}
export function upgradeMeta(s,id) {
  if(!Object.hasOwn(s.meta,id)||s.meta[id]>=25) throw new Error('Ấn ký đã đạt giới hạn.');
  const cost=metaCost(s,id);if(s.shards<cost)throw new Error('Cần thêm tinh thạch. Boss mỗi 5 tầng sẽ rơi tinh thạch.');
  s.shards-=cost;s.meta[id]++;
}
export function setTeamSlot(s,id,slot) {
  if(s.run&&s.run.phase!=='result') throw new Error('Đội hình được giữ nguyên trong chuyến đi. Hãy đổi trước chuyến tiếp theo.');
  if(!s.owned[id]||!Number.isInteger(slot)||slot<0||slot>2)throw new Error('Vị trí đội hình không hợp lệ.');
  if(expeditionForHero(s,id))throw new Error('Anh hùng đang viễn chinh. Hãy nhận thưởng hoặc thu hồi trước khi xếp đội.');
  const current=s.team.indexOf(id),old=s.team[slot];s.team[slot]=id;if(current>=0)s.team[current]=old;
  recordTutorialProgress(s,'team');
}
export function summon(s,count=1,rng=Math.random) {
  if(![1,10].includes(count))throw new Error('Số lượt triệu hồi không hợp lệ.');
  if(s.tickets<count)throw new Error('Chưa đủ vé. Kiếm thêm vé từ kho báu, boss và nhiệm vụ.');
  validateSummoning(s);
  if(s.run?.mode==='training')throw new Error('Thoát phòng thử để triệu hồi.');
  refreshDaily(s);s.tickets-=count;const pulls=[];
  for(let i=0;i<count;i++) {
    s.pity++;s.srPity++;for(const r of Object.keys(HIGH_PITY))s.highPity[r]++;
    const roll=rng()*100;let rarity='R',threshold=0;
    for(const r of [...RARITIES].reverse()){threshold+=RARITY[r].rate;if(roll<threshold){rarity=r;break;}}
    if(s.srPity>=TEN_PITY&&rarityRank(rarity)<rarityRank('SR'))rarity='SR';
    if(s.pity>=SUMMON_PITY&&rarityRank(rarity)<rarityRank('SSR'))rarity='SSR';
    for(const [r,cap] of Object.entries(HIGH_PITY))if(s.highPity[r]>=cap&&rarityRank(rarity)<rarityRank(r))rarity=r;
    const pool=HEROES.filter(h=>h.rarity===rarity),natural=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
    const {hero:h,focus}=resolveSummonTarget(s,natural);
    const isNew=!s.owned[h.id];
    if(isNew)s.owned[h.id]={level:1,copies:0,awaken:0};else{s.owned[h.id].copies++;s.shards+=RARITY[rarity].shards;s.gold+=RARITY[rarity].gold;}
    if(rarityRank(rarity)>=rarityRank('SSR'))s.pity=0;if(rarity!=='R')s.srPity=0;
    for(const r of Object.keys(HIGH_PITY))if(rarityRank(rarity)>=rarityRank(r))s.highPity[r]=0;
    s.totalSummons++;s.daily.summons++;pulls.push({id:h.id,isNew,rarity,...(focus?{focus}:{})});
  }recordTutorialProgress(s,'summon');return pulls;
}
function rand(r) {let x=r.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;r.seed=x>>>0;return r.seed/4294967296;}
function pick(r,a) {return a[Math.floor(rand(r)*a.length)];}
export function stacks(r,id) {return r.buffs.filter(v=>v===id).length;}
export function startRun(s,seed=Date.now()) {
  const r=beginRun(s,seed,null,null,null,true);r.balanceRules=TOWER_BALANCE_RULES;r.eliteRules=ELITE_RULES;r.contractRules=CONTRACT_RULES;r.contracts=[];r.contractOffer=null;Object.assign(r,starterAnomalies(seed));recordTutorialProgress(s,'depart');return r;
}
export function startChallenge(s,id,date=new Date()){
  if(!Object.hasOwn(TRIAL,id))throw new Error('Thử thách không tồn tại.');
  if(id==='humble'&&s.team.some(id=>HERO[id].rarity!=='R'))throw new Error('Thử thách này chỉ cho phép đội hình 3 anh hùng R.');
  const week=weekKey(date);return beginRun(s,trialSeed(id,week),{id,week});
}
export function startDungeon(s,id,difficulty=1,date=new Date(),seed=Date.now()){
  if(!Object.hasOwn(DUNGEON,id)||!Number.isInteger(difficulty)||difficulty<1||difficulty>3)throw new Error('Phó bản hoặc mức khó không hợp lệ.');
  if(!(date instanceof Date)||!Number.isFinite(date.getTime())||date.getFullYear()<1000||date.getFullYear()>9999)throw new Error('Ngày bắt đầu phó bản không hợp lệ.');
  if(!dungeonStatus(s,id,difficulty).unlocked)throw new Error('Hãy hoàn thành mức khó trước để mở mức này.');
  return beginRun(s,seed,null,{id,difficulty,day:adventureDay(date)});
}
export function startCampaign(s,id,seed=Date.now()){
  if(!campaignUnlocked(s,id))throw new Error('Hãy hoàn thành ải trước để mở ải này.');
  const r=beginRun(s,seed,null,null,{stage:id,story:'intro',line:0});r.phase='story';return r;
}
export function advanceCampaignStory(s,skip=false){
  const r=s.run,c=r?.campaign;if(r?.phase!=='story'||!c?.story||typeof skip!=='boolean')throw new Error('Hội thoại không còn khả dụng.');
  if(!skip&&c.line+1<campaignDialogue(c.stage,c.story).length){c.line++;return;}
  const intro=c.story==='intro';c.story=null;c.line=0;r.phase=intro?'route':'result';
}
function snapshotHero(s,id){return {id,...heroStats(s,id),awaken:s.owned[id].awaken||0,loadout:gearLoadout(s,id),talents:snapshotTalents(s,id),hp:heroStats(s,id).maxHp,energy:65+talentBonuses(heroTalents(s,id)).openingEnergy,shield:0};}
function beginRun(s,seed,challenge=null,dungeon=null,campaign=null,branching=false,party=s.team,formation=s.formation){
  if(s.run&&s.run.phase!=='result')throw new Error('Bạn đang có một chuyến đi.');
  if(party.some(id=>expeditionForHero(s,id)))throw new Error('Đội hình có tướng đang viễn chinh. Hãy nhận thưởng hoặc thu hồi trước.');
  refreshDaily(s);
  s.run={map:branching?starterTowerMap(seed):null,seed:(seed>>>0)||1234567,formation:{...formation},link:starterLink(),mode:campaign?'campaign':challenge?'challenge':dungeon?'dungeon':'normal',challenge,dungeon,campaign,hunt:null,training:null,raid:null,pet:snapshotPet(s,!!challenge),resonances:teamResonances(party),floor:1,cleared:0,phase:'route',heroes:party.map(id=>snapshotHero(s,id)),buffs:[],relics:[],relicChoices:[],relicUsed:{lantern:false},gearFound:0,routes:[],choices:[],battle:null,node:null,goldEarned:0,ticketsEarned:0,started:Date.now(),summary:null};
  s.run.statistics=starterStatistics(s.run);s.run.victory=null;
  s.runs++;s.daily.runs++;recordTrial(s,s.run,0);generateRoutes(s.run);return s.run;
}
export function startSeasonRun(s,seed=Date.now(),date=new Date()){
  if(s.run&&s.run.phase!=='result')throw new Error('Bạn đang có một chuyến đi.');
  if(s.team.some(id=>expeditionForHero(s,id)))throw new Error('Đội hình có tướng đang viễn chinh. Hãy nhận thưởng hoặc thu hồi trước.');
  const season=snapshotSeason(s,date),r=beginRun(s,seed);r.mode='season';r.season=season;generateRoutes(r);return r;
}
export function startHunt(s,id,difficulty=1,seed=Date.now()){
  if(!Object.hasOwn(HUNT,id)||!huntUnlocked(s,id,difficulty))throw new Error('Hãy thắng mức săn trước để mở mức này.');
  const r=beginRun(s,seed);r.mode='hunt';r.hunt={id,difficulty,claimed:false};r.routes=['boss'];chooseRoute(s,0);return r;
}
export function startRaid(s,difficulty=1,seed=Date.now(),boss='tam-an'){
  const blocked=raidBlocker(s,difficulty,boss);if(blocked)throw new Error(blocked);
  const teams=s.raids.teams.map((team,i)=>({heroes:team.map(id=>({...snapshotHero(s,id),energy:100})),formation:{front:s.raids.fronts[i]}}));
  const r=beginRun(s,seed,null,null,null,false,s.raids.teams[0],teams[0].formation);
  r.mode='raid';r.raid={difficulty,stage:0,teams,reports:[],claimed:false,...(boss==='void-dragon'?{boss}:{})};r.heroes=structuredClone(teams[0].heroes);r.statistics=starterStatistics(r);r.routes=['boss'];chooseRoute(s,0);return r;
}
export function continueRaid(s,stage){
  const r=s.run,c=r?.raid;
  if(r?.phase!=='relay'||!c||c.stage!==stage||stage>=2||c.reports.length!==stage+1||r.victory?.stage!=='done')throw new Error('Đội tiếp sức chưa sẵn sàng.');
  c.stage++;const team=c.teams[c.stage];r.floor=c.stage+1;r.heroes=structuredClone(team.heroes);r.formation={...team.formation};r.resonances=teamResonances(r.heroes.map(h=>h.id));r.link=starterLink();r.statistics=starterStatistics(r);r.phase='route';r.victory=null;r.lastReward=null;r.battle=null;r.node=null;chooseRoute(s,0);return r;
}
export function createTrainingState(source,{team=source.team,level=20,set=null,signature=false,boss='colossus',difficulty=1,formation=source.formation}={}){
  if(!validFormation(formation))throw new Error('Bố trí phòng thử không hợp lệ.');
  if(!Array.isArray(team)||team.length!==3||new Set(team).size!==3||team.some(id=>!Object.hasOwn(HERO,id))||![1,20,50].includes(level)||(set!==null&&!Object.hasOwn(GEAR_SET,set))||typeof signature!=='boolean'||!Object.hasOwn(HUNT,boss)||!Number.isInteger(difficulty)||difficulty<1||difficulty>3)throw new Error('Cấu hình phòng thử không hợp lệ.');
  const s=structuredClone(source);s.run=null;s.team=[...team];s.formation={...formation};s.presets=starterPresets();s.owned=Object.fromEntries(HEROES.map(h=>[h.id,{level,copies:0,awaken:0}]));s.talents={};s.meta={attack:0,health:0,guard:0};s.inventory=[];s.equipped={};s.lockedGear=[];s.gearPresets=starterGearPresets();s.refining=starterRefining();s.loginRewards=starterLoginRewards();s.bonds=starterBonds();s.nextGearId=1;s.adventure.equipped=null;s.expeditions=starterExpeditions();
  for(const id of team){s.equipped[id]={};for(const slot of ['weapon','armor','charm']){const base=slot==='weapon'&&signature?'signature-'+id:set?`set-${set}-${slot}`:null;if(!base)continue;const gear=makeForgedGear(s,base);s.inventory.push(gear);s.equipped[id][slot]=gear.id;}}
  const r=beginRun(s,42);r.mode='training';r.training={bossId:boss,difficulty,damage:0,healing:0,received:0,absorbed:0};r.routes=['boss'];chooseRoute(s,0);for(const h of r.heroes)h.energy=100;r.link.charge=LINK_MAX;return s;
}
function trackTraining(r,events){
  if(!r.training)return;for(const e of events){if(e.heal||e.shieldGrant)continue;if(r.heroes.some(h=>h.id===e.target)){r.training.received+=e.value;r.training.absorbed+=e.shield||0;}else r.training.damage+=e.value;}
}
function generateRoutes(r) {
  if(r.season){r.routes=[...SEASON_ROUTES[r.floor-1]];return;}
  if(r.map){advanceTowerMap(r);return;}
  if(r.campaign){r.routes=[campaignRooms(r.campaign.stage)[r.floor-1]];return;}
  if(r.dungeon){r.routes=[DUNGEON_ROOMS[r.floor-1]];return;}
  if(r.challenge?.id==='gauntlet'){r.routes=['boss'];return;}
  if(r.floor%5===0){r.routes=['boss'];return;}
  if(r.floor===1){r.routes=['battle','treasure','elite'];return;}
  const pools=['battle','battle','elite','rest','treasure','event'];
  r.routes=['battle'];while(r.routes.length<3){const n=pick(r,pools);if(!r.routes.includes(n))r.routes.push(n);}
  if(rand(r)>.5)r.routes.reverse();
}
function offerBlessings(r) {
  const pool=[...BLESSINGS];r.choices=[];
  for(let i=0;i<3;i++){const idx=Math.floor(rand(r)*pool.length);r.choices.push(pool.splice(idx,1)[0].id);}r.phase='blessing';
}
export function hasRelic(r,id){return r.relics.includes(id);}
function offerRelics(r){
  const pool=RELICS.filter(a=>!r.relics.includes(a.id)&&!(noRevive(r)&&a.id==='lantern'));r.relicChoices=[];
  while(pool.length&&r.relicChoices.length<3){const i=Math.floor(rand(r)*pool.length);r.relicChoices.push(pool.splice(i,1)[0].id);}
  if(r.relicChoices.length)r.phase='relic';else offerBlessings(r);
}
export function selectRelic(s,id){
  const r=s.run;if(!r||r.phase!=='relic'||!r.relicChoices.includes(id)||r.relics.includes(id))throw new Error('Cổ vật không còn khả dụng.');
  r.relics.push(id);r.relicChoices=[];offerBlessings(r);
}
export function selectContract(s,id,floor){
  const r=s.run;
  if(!contractEligible(r)||r.phase!=='contract'||r.contractOffer?.floor!==floor||r.floor!==floor||(id!==null&&(!Object.hasOwn(CONTRACT,id)||!availableContracts(r).some(c=>c.id===id))))throw new Error('Khế ước không còn khả dụng.');
  if(id!==null)acceptContract(r,id);
  r.contractOffer=null;offerRelics(r);
}
function advanceFloor(s) {
  const r=s.run;r.cleared=r.floor;recordTrial(s,r,r.cleared);if(r.mode==='normal')s.best=Math.max(s.best,r.cleared);
  if(r.challenge&&r.floor>=TRIAL[r.challenge.id].goal){finishRun(s,'victory');return;}
  r.floor++;r.phase='route';r.battle=null;r.victory=null;r.choices=[];r.node=null;r.lastReward=null;if(contractEligible(r))r.contractOffer=null;generateRoutes(r);
}
function reward(s,gold,tickets=0,shards=0) {gold=contractGold(s.run,gold);s.gold+=gold;s.tickets+=tickets;s.shards+=shards;s.run.goldEarned+=gold;s.run.ticketsEarned+=tickets;recordResult(s.run,'shards',shards);return gold;}
function healHero(r,h,value,source=null,credit=source,combat=true){
  if(h.hp<=0&&noRevive(r))return 0;
  value=Math.round(value*(hasResonance(r,'light')?1.2:1)*(1+fighterTalents(source).aid)*(combat&&h.hp>0?anomalyHealingMultiplier(r):1)*seasonHealingMultiplier(r));
  const healed=Math.min(h.maxHp-h.hp,value),over=value-healed;h.hp+=healed;recordContribution(r,credit,'healing',healed);
  if(hasRelic(r,'chalice')&&over>0&&h.hp>0){const cap=Math.round(h.maxHp*.4),before=h.shield;h.shield=Math.max(h.shield,Math.min(cap,h.shield+shieldAmount(r,over*.6)));recordContribution(r,credit,'shield',h.shield-before);if(r.battle&&h.shield>before)log(r,`Chén suối nguồn: ${HERO[h.id].name} nhận ${h.shield-before} khiên từ hồi máu dư.`,'skill');}
  if(r.training)r.training.healing+=healed;return healed;
}
function healTeam(r,pct,combat=false) {for(const h of r.heroes)healHero(r,h,Math.round(h.maxHp*pct),null,null,combat);}
function shieldAmount(r,amount){return Math.round(amount*(hasResonance(r,'earth')?1.25:1)*anomalyShieldMultiplier(r)*seasonShieldMultiplier(r));}
function grantShield(r,h,amount,source=null,credit=source){if(h.hp>0){const value=shieldAmount(r,amount*(1+fighterTalents(source).aid));h.shield+=value;recordContribution(r,credit,'shield',value);}}
function lootGear(s,source){const loot=dropGear(s,()=>rand(s.run),s.run.floor,source);s.run.gearFound++;if(loot.converted)recordResult(s.run,'dust',loot.dust);return structuredClone(loot);}
export function chooseRoute(s,index) {
  const r=s.run;if(!r||r.phase!=='route'||!Number.isInteger(index)||!r.routes[index])throw new Error('Lối đi này không còn khả dụng.');
  if(r.map)commitTowerRoute(r,index);
  r.node=r.routes[index];
  if(r.node==='rest'){healTeam(r,.35);offerBlessings(r);return {type:'rest'};}
  if(r.node==='treasure'){const loot=lootGear(s,'treasure'),gold=reward(s,120+r.floor*18,1);advanceFloor(s);return {type:'treasure',gold,loot};}
  if(r.node==='event'){r.phase='event';return {type:'event'};}
  beginBattle(r);if(r.mode==='normal'){recordTutorialProgress(s,'depart');recordTutorialProgress(s,'route');}return {type:'battle'};
}
export function chooseEvent(s,choice) {
  const r=s.run;if(!r||r.phase!=='event')throw new Error('Sự kiện đã kết thúc.');
  if(choice==='trade'){if(s.gold<100)throw new Error('Cần 100 vàng để trao đổi.');s.gold-=100;s.tickets+=2;r.ticketsEarned+=2;advanceFloor(s);}
  else if(choice==='risk'){for(const h of r.heroes)h.hp=Math.max(h.hp>0?1:0,Math.round(h.hp*.75));offerBlessings(r);}
  else if(choice==='leave'){healTeam(r,.12);advanceFloor(s);}
  else throw new Error('Lựa chọn không hợp lệ.');
}
export function selectBlessing(s,id) {
  const r=s.run;if(!r||r.phase!=='blessing'||!r.choices.includes(id))throw new Error('Chúc phúc không còn khả dụng.');
  r.buffs.push(id);
  if(id==='vitality')for(const h of r.heroes){const base=h.maxHp/(1+.18*(stacks(r,'vitality')-1)),extra=Math.round(base*.18);h.maxHp+=extra;healHero(r,h,extra);}
  advanceFloor(s);
}
function beginBattle(r) {
  const boss=r.node==='boss',elite=r.node==='elite',f=r.challenge?.id==='gauntlet'?r.floor*2:r.floor,scale=towerScale(r,f)*(r.raid?raidDefinition(raidId(r)).tiers[r.raid.difficulty-1].scale:r.campaign?campaignStage(r.campaign.stage).scale:r.dungeon?DUNGEON_DIFFICULTIES[r.dungeon.difficulty-1].scale:r.hunt?HUNT_TIERS[r.hunt.difficulty-1].scale:r.training?HUNT_TIERS[r.training.difficulty-1].scale:1);
  const count=boss?1:f<3?2:3,bossDef=bossForRun(r);
  const names=['Kẻ lạc lối','Vệ binh rêu','Bóng lang thang'];
  const enemies=Array.from({length:count},(_,i)=>{const profile=towerEnemyProfile(r,i);return ({id:'enemy'+i,name:boss?bossDef.name:elite?'Vệ binh tinh anh':names[(i+f)%names.length],kind:boss?'boss':i%2===0?'sentinel':'wraith',...(boss?{bossId:bossDef.id}:{}),maxHp:Math.round(Math.round((boss?390:elite?135:100)*scale*profile.hp)*anomalyEnemyHpMultiplier(r)*seasonEnemyHpMultiplier(r)),hp:Math.round(Math.round((boss?390:elite?135:100)*scale*profile.hp)*anomalyEnemyHpMultiplier(r)*seasonEnemyHpMultiplier(r)),atk:Math.round((boss?35:elite?25:20)*scale*profile.attack),def:Math.round((boss?11:elite?8:5)+f*.5),burn:0,burnPower:0,burnSource:null,freeze:0,shield:0,deathHandled:false,intent:Math.floor(rand(r)*3)});});
  for(const h of r.heroes){h.shield=h.hp>0?shieldAmount(r,h.maxHp*.18*stacks(r,'barrier')):0;h.energy=Math.max(0,Math.min(100,h.energy+15+seasonOpeningEnergy(r)+(hasResonance(r,'diverse')?10:0))-(h.hp>0?anomalyOpeningPenalty(r):0));}
  const move=bossDef.id==='archivist'?'summon':bossDef.id==='moonwarden'?'barrier':'strike';
  r.battle={enemies,linkUsed:false,bossState:boss?{id:bossDef.id,phase:1,move,stagger:0,parts:createBossParts(enemies[0])}:null,relicSkillUsed:false,round:1,used:[],log:[{text:boss?'Người giữ tầng đã thức giấc.':'Những bóng hình bước ra từ màn sương.',type:'info'}]};r.phase='battle';
  r.battle.statistics=starterStatistics(r);for(const h of r.heroes)recordContribution(r,null,'shield',h.shield);
  const anomaly=anomalyForFloor(r);if(anomaly)log(r,`${anomaly.name}: ${anomaly.benefit}. ${anomaly.cost}.`,'info');
  const champion=assignElite(r,()=>rand(r));if(champion)log(r,`${champion.name} · ${eliteDefinition(champion).name}: ${eliteDefinition(champion).desc}`,'enemy');
  if(r.pet)r.pet.nextRound=1;
  if(hasRelic(r,'root')){healTeam(r,.12,true);for(const h of r.heroes)h.energy=Math.min(100,h.energy+25);log(r,'Rễ trường sinh hồi phục cả đội và tiếp năng lượng.','skill');}
  if(r.raid){
    const stage=r.raid.stage,def=raidDefinition(raidId(r)),dragon=raidId(r)==='void-dragon',bs=r.battle.bossState;
    enemies[0].name=def.name;bs.parts.selected=dragon?(stage===0?'arms':stage===1?'core':'head'):(stage===0?'core':'head');
    if(dragon&&stage===2){bs.phase=2;bs.move='charge';}
    if(!dragon&&stage===1)bs.move='charge';if(!dragon&&stage===2)summonRaidGuards(r);
    log(r,def.stages[stage].mechanic,'info');
  }
}
const bossDefinition=id=>BOSS[id]||(id===VOID_DRAGON.id?VOID_DRAGON:id===SEASON_BOSS.id?SEASON_BOSS:null);
export function bossForRun(r){return r.season?SEASON_BOSS:r.raid?bossDefinition(raidDefinition(raidId(r)).bossId):r.campaign?BOSS[campaignChapter(r.campaign.stage).boss]:r.hunt?BOSS[r.hunt.id]:r.training?BOSS[r.training.bossId]:r.dungeon?BOSS[DUNGEON[r.dungeon.id].bossId]:r.challenge?.id==='gauntlet'?BOSSES[(r.floor-1)%BOSSES.length]:bossForFloor(r.floor);}

function log(r,text,type='info'){r.battle.log.unshift({text,type});r.battle.log=r.battle.log.slice(0,30);}
export function bossInfo(r){
  const bs=r?.battle?.bossState;if(!bs)return null;
  const def=bossDefinition(bs.id),move=def.moves[bs.move];
  if(r.raid){const raid=raidDefinition(raidId(r)),stage=raid.stages[r.raid.stage],summon=raid.id==='tam-an'&&r.raid.stage===2;return {...def,name:raid.name,title:stage.name,color:stage.color,icon:stage.icon,phaseDesc:stage.mechanic,phase:r.raid.stage+1,desc:stage.mechanic,move:bs.move,moveName:bs.parts?.stun?'Mất thăng bằng':summon?{strike:'Cổ thạch giáng đòn',charge:'Gọi bóng hộ vệ',quake:'Sóng ấn triệu hồn',stunned:'Mất thăng bằng'}[bs.move]:move[0],moveDesc:stage.mechanic,stagger:bs.stagger};}
  return {...def,phaseDesc:def.phase,phase:bs.phase,move:bs.move,moveName:bs.parts?.stun?'Mất thăng bằng':move[0],moveDesc:bs.parts?.stun?'Giáp đầu đã vỡ. Chiêu bị ngắt; boss bỏ lượt kế tiếp.':move[1],stagger:bs.stagger};
}
function updateBossPhase(r){
  const b=r.battle,bs=b.bossState,e=b.enemies[0];
  if(!bs||bs.phase===2||e.hp<=0||e.hp/e.maxHp>.5)return;
  bs.phase=2;
  if(bs.id==='archivist')bs.move='summon';
  if(bs.id==='ashknight')bs.move='siphon';
  log(r,`${e.name} bước vào giai đoạn II! ${bossDefinition(bs.id).phase}`,'skill');
}
function hitEnemy(r,target,amount,credit=null){
  amount=Math.round(amount*contractDamageMultiplier(r)*anomalyDamageMultiplier(r));
  const bs=r.battle.bossState;
  const guard=activeEliteGuard(r,target),guardShield=target.elite?.trait==='guard'&&target.shield>0;
  if(guard)amount=Math.round(amount*.65);
  if(target.kind==='boss'&&(bs?.id==='archivist'||(r.raid?.stage===2&&raidId(r)==='tam-an'))&&r.battle.enemies.some(e=>e.kind!=='boss'&&e.hp>0))amount=Math.round(amount*.65);
  const dragon=target.kind==='boss'&&bs?.id==='void-dragon',protectedPart=dragon?(r.raid.stage===0?'arms':r.raid.stage===1?'core':null):null,protectedHit=protectedPart&&bs.parts?.[protectedPart].hp>0;
  if(protectedHit)amount=Math.max(1,Math.round(amount*(protectedPart==='arms'?.4:.3)));
  const absorbed=Math.min(target.shield,amount);target.shield-=absorbed;
  const value=Math.min(Math.max(0,target.hp-(protectedHit?1:0)),Math.max(0,amount-absorbed));target.hp-=value;if(target.kind==='boss'&&target.hp===0&&bs?.parts)bs.parts.stun=false;updateBossPhase(r);
  const guardBreak=guardShield&&target.shield===0;
  if(guardBreak)log(r,`Khiên Hộ vệ đã vỡ! Đồng bọn mất bảo hộ.`,'skill');
  recordContribution(r,credit,'damage',value);return {target:target.id,value,shield:absorbed,...(guard?{guarded:true}:{}),...(guardBreak?{guardBreak:true}:{})};
}
function resolveDeaths(r,events){
  let dead;
  while((dead=r.battle.enemies.find(e=>e.hp<=0&&!e.deathHandled))){
    const revival=reviveElite(dead);if(revival){events.push(revival);log(r,`${dead.name} Tái sinh với ${revival.value} máu! Mạng hồi sinh đã dùng.`,'skill');continue;}
    dead.deathHandled=true;recordResult(r,'kills',1,{battle:true});
    if(hasRelic(r,'spark')){for(const h of r.heroes)if(h.hp>0)h.energy=Math.min(100,h.energy+20);log(r,'Tàn sao thức tỉnh: cả đội nhận 20 năng lượng.','skill');}
    if(hasRelic(r,'cinder')&&dead.burn>0){
      const power=Math.round(dead.maxHp*.12);log(r,`${dead.name} bùng nổ: ${Math.round(power*contractDamageMultiplier(r)*anomalyDamageMultiplier(r))} sát thương lên địch còn lại!`,'skill');
      for(const e of r.battle.enemies.filter(e=>e.hp>0))events.push(hitEnemy(r,e,power));
    }
  }
}
function damage(r,actor,target,mult,skill=false,partId=null) {
  const talents=fighterTalents(actor);
  let raw=actor.atk*(1+.16*stacks(r,'might'))*mult*(skill?(1+.22*stacks(r,'focus'))*skillPower(actor):1)*(1+talents.damage);
  if(hasResonance(r,'diverse'))raw*=1.08;
  if(r.dungeon&&HERO[actor.id].element===DUNGEON[r.dungeon.id].element)raw*=1.25;
  if(hasResonance(r,'shadow')&&target.hp/target.maxHp<.4)raw*=1.2;
  if(skill&&actor.awaken>=1&&((actor.id==='astra'&&target.kind==='boss')||(actor.id==='kira'&&target.hp/target.maxHp<.5)))raw*=actor.id==='astra'?1.2:1.25;
  if(skill&&actor.awaken>=1&&target.kind==='boss')raw*=AWAKENING[actor.id]?.trait?.bossDamage||1;
  if(target.hp/target.maxHp<.4)raw*=1+.3*stacks(r,'execute');
  if(actor.hp/actor.maxHp<.5)raw*=1+.25*stacks(r,'courage');
  if(hasRelic(r,'prism')&&target.freeze>0){raw*=1.3;actor.energy=Math.min(100,actor.energy+20);}
  const crit=rand(r)<Math.min(.8,.08+.12*stacks(r,'crit')+talents.crit+loadoutEffects(actor.loadout).crit);if(crit)raw*=1.6;
  if(skill&&target.kind==='boss'){
    const bs=r.battle.bossState;
    if(bs?.id==='moonwarden'&&target.shield>0){target.shield=0;log(r,'Kỹ năng phá tan khiên nguyệt sắc!','skill');}
    if(bs?.id==='basalt'&&target.shield>0){target.shield=0;log(r,'Kỹ năng phá tan mai đá!','skill');}
    if(bs?.id==='colossus'&&r.raid?.stage!==2&&['charge','quake'].includes(bs.move)){
      bs.stagger=Math.min(2,bs.stagger+1);if(bs.stagger===2){bs.move='stunned';log(r,'Hai kỹ năng phá thế tụ lực! Cự nhân mất lượt.','skill');}
    }
    if(bs?.id==='void-dragon'&&['charge','quake'].includes(bs.move)){
      bs.stagger=Math.min(2,bs.stagger+1);if(bs.stagger===2){bs.move='stunned';log(r,'Hai kỹ năng đã ngắt hắc lôi! Hắc Long mất lượt.','skill');}
    }
    if(bs?.id===SEASON_BOSS.id&&['charge','quake'].includes(bs.move)){
      bs.stagger=Math.min(2,bs.stagger+1);if(bs.stagger===2){bs.move='stunned';log(r,'Hai kỹ năng đã phá nguyền! Vua Nguyền Ấn mất lượt.','skill');}
    }
    if(bs?.id==='stormwing'&&['signature','surge'].includes(bs.move)){
      bs.stagger=Math.min(2,bs.stagger+1);if(bs.stagger===2){bs.move='stunned';log(r,'Hai kỹ năng đã tán lôi! Boss mất lượt.','skill');}
    }
  }
  const direct=Math.max(1,Math.round((raw-target.def*.65)*(target.kind==='boss'?bossDirectMultiplier(r):1)*(skill?contractSkillMultiplier(r)*seasonSkillMultiplier(r):1))),hit=hitEnemy(r,target,direct,actor),value=hit.value;
  // Wing/core armor uses damage before the dragon's protection, even at 1 HP.
  const part=damageBossPart(r,target,partId,r.battle.bossState?.id==='void-dragon'?Math.max(0,direct-hit.shield):value);if(part){hit.part=part;if(part.broken)log(r,`Đã phá ${bossPartName(r.battle.bossState.id,part.id)}! ${part.id==='head'?'Chiêu bị ngắt; boss bỏ lượt kế tiếp.':part.id==='arms'?'Sức đánh boss giảm 20%.':'Lõi lộ ra; sát thương trực tiếp tăng 25%.'}`,'skill');}
  if(part?.broken&&r.battle.bossState.id==='void-dragon'){if(part.id==='arms'&&r.raid.stage===0)log(r,'Cánh đã vỡ! Hắc Long hạ đất, gỡ giảm sát thương 60%.','skill');if(part.id==='core'&&r.raid.stage===1)log(r,'Lõi kết giới tan vỡ! Hắc Long mất bảo hộ 70%.','skill');}
  if(stacks(r,'vamp'))healHero(r,actor,Math.round(value*.1*stacks(r,'vamp')),actor);
  const setEffects=loadoutEffects(actor.loadout);if(setEffects.drain)healHero(r,actor,Math.round(value*setEffects.drain),actor);if(setEffects.burn)applyBurn(target,2,Math.round(actor.atk*setEffects.burn),actor);
  if(stacks(r,'flame'))applyBurn(target,2,Math.round(actor.atk*.1*stacks(r,'flame')),actor);
  if(rand(r)<Math.min(.65,.15*stacks(r,'frost')))target.freeze=1;
  log(r,`${HERO[actor.id].name} → ${target.name}: ${value}${hit.shield?` (${hit.shield} khiên)`:''}${crit?' chí mạng':''}`,crit?'crit':'damage');
  if(setEffects.void&&target.hp>0){
    target.voidMarks=(target.voidMarks||0)+1;
    if(target.voidMarks===3){target.voidMarks=0;const burst=hitEnemy(r,target,Math.max(1,Math.round(actor.atk*setEffects.void)),actor);hit.voidBurst=burst.value;hit.voidShield=burst.shield;hit.value+=burst.value;hit.shield+=burst.shield;log(r,`Hư Không bùng nổ: ${burst.value} sát thương!`,'skill');}
    hit.voidMarks=target.voidMarks;
  }
  return {...hit,crit};
}
function applyBurn(target,turns,power,source=null){if(target.burn<=0){target.burnPower=0;target.burnSource=null;}if(power>target.burnPower)target.burnSource=typeof source==='string'?{[source]:1}:source?.id?{[source.id]:1}:source;target.burn=Math.max(target.burn,turns);target.burnPower=Math.max(target.burnPower,power);}
export function playerAction(s,heroId,targetId,skill=false,partId=null) {
  const r=s.run;if(!r||r.phase!=='battle')throw new Error('Trận đấu đã kết thúc.');
  assertTimingGuardIdle(r);
  const b=r.battle,h=r.heroes.find(h=>h.id===heroId),def=HERO[heroId],bossWasAlive=!!b.bossState&&b.enemies[0].hp>0;
  if(!h||h.hp<=0||b.used.includes(heroId))throw new Error('Anh hùng đã hành động hoặc đã gục ngã.');
  if(skill&&h.energy<100)throw new Error('Kỹ năng cần 100 năng lượng.');
  const target=b.enemies.find(e=>e.id===targetId&&e.hp>0)||b.enemies.find(e=>e.hp>0);if(!target)throw new Error('Không còn mục tiêu.');
  if(partId!==null&&(!bossParts(r)||target.kind!=='boss'||!BOSS_PART_IDS.includes(partId)))throw new Error('Mục tiêu bộ phận không hợp lệ.');
  const events=[],skillBoost=contractSkillMultiplier(r),power=skillPower(h)*skillBoost;
  const cost=skill?contractSkillCost(r,h):0;
  if(cost){h.hp-=cost;log(r,`Khế ước sinh lực: ${def.name} hiến ${cost} máu trước khi dùng kỹ năng.`,'skill');}
  if(skill){
    h.energy=0;log(r,`${def.name} thi triển ${def.skill}!`,'skill');
    const ability=def.ability||{},trait=h.awaken>=1?AWAKENING[h.id]?.trait||{}:{};
    if(def.kind==='heal') {
      const pct=ability.heal??(def.id==='seraph'?.38:.30);for(const ally of r.heroes){const value=healHero(r,ally,Math.round(ally.maxHp*pct*(1+.22*stacks(r,'focus'))*power),h);events.push({target:ally.id,value,heal:true});}
    } else if(def.kind==='aoe'||def.kind==='inferno') {
      for(const e of b.enemies.filter(e=>e.hp>0)){events.push(damage(r,h,e,ability.mult??(def.id==='astra'?1.9:def.id==='kael'?1.7:1.45),true,e.id===target.id?partId:null));if(def.kind==='inferno')applyBurn(e,trait.burnTurns||2,Math.round(h.atk*(ability.burn??(h.awaken>=1?.45:.3))*power),h);}
    } else if(def.kind==='shield') {
      events.push(damage(r,h,target,ability.mult??(def.id==='thorne'?1.8:1.5),true,partId));for(const ally of r.heroes)grantShield(r,ally,h.maxHp*(ability.shield??(def.id==='thorne'?.28:.22))*power,h);
    } else {
      const mult=ability.mult??(def.kind==='drain'?3.6:def.kind==='freeze'?2:def.kind==='burn'?2.3:def.id==='raiden'?3.1:2.9);
      events.push(damage(r,h,target,mult,true,partId));
      if(def.kind==='drain')healHero(r,h,Math.round(events[0].value*(ability.drain??(h.awaken>=1?.5:.3))),h);
      if(def.kind==='burn')applyBurn(target,h.awaken>=1?3:2,Math.round(h.atk*.3*power),h);
      if(def.kind==='freeze'||trait.freeze)target.freeze=1;
    }
    if(h.awaken>=1){
      if(['aerin','lumi'].includes(h.id)){const energy=h.id==='aerin'?15:10;for(const ally of r.heroes)if(ally.hp>0)ally.energy=Math.min(100,ally.energy+energy);}
      if(h.id==='rook')healHero(r,h,Math.round(h.maxHp*.12*power*(1+.22*stacks(r,'focus'))),h);
      if(h.id==='raiden')h.energy=Math.min(100,h.energy+25);
      if(h.id==='bryn')for(const ally of r.heroes)grantShield(r,ally,h.maxHp*.08*power,h);
      if(h.id==='seraph')for(const ally of r.heroes)grantShield(r,ally,ally.maxHp*.08*power,h);
      if(h.id==='thorne')for(const ally of r.heroes)if(ally.hp>0)healHero(r,ally,Math.round(ally.maxHp*.08*power*(1+.22*stacks(r,'focus'))),h);
      if(trait.energy)h.energy=Math.min(100,h.energy+trait.energy);
      if(trait.selfShield)grantShield(r,h,h.maxHp*trait.selfShield*power,h);
      for(const ally of r.heroes)if(ally.hp>0){
        if(trait.teamEnergy)ally.energy=Math.min(100,ally.energy+trait.teamEnergy);
        if(trait.teamShield)grantShield(r,ally,ally.maxHp*trait.teamShield*power,h);
        if(trait.teamHeal)healHero(r,ally,Math.round(ally.maxHp*trait.teamHeal*power*(1+.22*stacks(r,'focus'))),h);
      }
    }
  }else{events.push(damage(r,h,target,1,false,partId));h.energy=Math.min(100,h.energy+35+15*stacks(r,'energy')+(h.awaken>=5?15:0)+loadoutEffects(h.loadout).energy+anomalyBasicEnergy(r)+seasonBasicEnergy(r));}
  if(skill&&hasRelic(r,'hourglass')&&!b.relicSkillUsed){h.energy=Math.min(100,h.energy+35);b.relicSkillUsed=true;log(r,`Đồng hồ rạn trả lại 35 năng lượng cho ${def.name}.`,'skill');}
  if(skill){
    const effects=loadoutEffects(h.loadout);if(effects.shield)grantShield(r,h,h.maxHp*effects.shield,h);
    const sig=h.loadout?.signature===h.id?SIGNATURES[h.id]:null;
    if(sig){
      const alive=r.heroes.filter(a=>a.hp>0);log(r,`${sig.name}: ${sig.desc}`,'skill');
      if(sig.effect==='energy')h.energy=Math.min(100,h.energy+sig.power);
      if(sig.effect==='teamEnergy')for(const ally of alive)ally.energy=Math.min(100,ally.energy+sig.power);
      if(sig.effect==='teamShield')for(const ally of alive)grantShield(r,ally,h.maxHp*sig.power*skillBoost,h);
      if(sig.effect==='teamHeal')for(const ally of alive)events.push({target:ally.id,value:healHero(r,ally,Math.round(ally.maxHp*sig.power*skillBoost),h),heal:true});
      if(sig.effect==='selfHeal')events.push({target:h.id,value:healHero(r,h,Math.round(h.maxHp*sig.power*skillBoost),h),heal:true});
      if(sig.effect==='echo'&&target.hp>0){const hit=hitEnemy(r,target,Math.max(1,Math.round((h.atk*sig.power-target.def*.2)*skillBoost)),h);events.push(hit);if(effects.drain)healHero(r,h,Math.round(hit.value*effects.drain),h);}
      if(sig.effect==='burn'&&target.hp>0)applyBurn(target,2,Math.round(h.atk*sig.power*skillBoost),h);
      if(sig.effect==='burnAll')for(const e of b.enemies.filter(e=>e.hp>0))applyBurn(e,2,Math.round(h.atk*sig.power*skillBoost),h);
    }
    const energy=fighterTalents(h).teamEnergy;
    if(energy){for(const ally of r.heroes)if(ally.hp>0&&ally.id!==h.id)ally.energy=Math.min(100,ally.energy+energy);log(r,`${def.name} tiếp lửa: đồng đội còn sống nhận ${energy} năng lượng.`,'skill');}
  }
  if(bossParts(r)&&b.enemies[0].hp<=0)bossParts(r).stun=false;
  if(cost)events.push({target:h.id,value:cost,contractCost:true});
  if(skill)recordSeasonSkill(s);
  b.used.push(heroId);gainLink(r,skill);resolveDeaths(r,events);recordCombatAchievements(s,events,bossWasAlive);trackTraining(r,events);checkVictory(s);if(r.mode==='normal')recordTutorialProgress(s,skill?'skill':'attack');return events;
}
export function counterAction(s,heroId,targetId,receipt,partId=null){
  const r=s.run;if(!r||r.phase!=='battle')throw new Error('Trận đấu đã kết thúc.');
  assertTimingGuardIdle(r);
  const b=r.battle,h=r.heroes.find(h=>h.id===heroId&&h.hp>0),target=b.enemies.find(e=>e.id===targetId&&e.hp>0),bossWasAlive=!!b.bossState&&b.enemies[0].hp>0;
  if(!h)throw new Error('Chọn một anh hùng còn sống để phản công.');
  if(!target)throw new Error('Mục tiêu phản công không còn khả dụng.');
  if(partId!==null&&(!bossParts(r)||target.kind!=='boss'||!BOSS_PART_IDS.includes(partId)))throw new Error('Mục tiêu bộ phận không hợp lệ.');
  consumeCounter(r,receipt);
  log(r,`${HERO[heroId].name} phản công! Đòn đánh không tốn lượt.`,'skill');
  // Normal on-hit passives apply; this is neither a basic action nor a skill cast.
  const events=[{...damage(r,h,target,COUNTER_POWER,false,partId),actor:heroId,counter:true}];
  resolveDeaths(r,events);if(bossParts(r)&&b.enemies[0].hp<=0)bossParts(r).stun=false;
  recordAchievement(s,'counters');
  recordCombatAchievements(s,events,bossWasAlive);trackTraining(r,events);checkVictory(s);return events;
}
export function linkAction(s,firstId,secondId,targetId,partId=null){
  const r=s.run,blocked=linkBlocker(r,firstId,secondId);if(blocked)throw new Error(blocked);
  assertTimingGuardIdle(r);
  const b=r.battle,target=b.enemies.find(e=>e.id===targetId&&e.hp>0),bossWasAlive=!!b.bossState&&b.enemies[0].hp>0;
  if(!target)throw new Error('Mục tiêu không còn khả dụng.');
  if(partId!==null&&(!bossParts(r)||target.kind!=='boss'||!BOSS_PART_IDS.includes(partId)))throw new Error('Mục tiêu bộ phận không hợp lệ.');
  // Canonical order makes the same pair consume RNG identically in either selection order.
  const casters=r.heroes.filter(h=>h.id===firstId||h.id===secondId),spec=linkForPair(...casters.map(h=>h.id));
  const events=[],targets=spec.aoe?b.enemies.filter(e=>e.hp>0):[target];
  r.link.charge=0;r.link.casts++;b.linkUsed=true;
  log(r,`${casters.map(h=>HERO[h.id].name).join(' + ')} liên kết: ${spec.name}!`,'skill');
  let direct=0;
  for(const enemy of targets){
    for(const actor of casters)if(enemy.hp>0){
      const hit=damage(r,actor,enemy,spec.power,false,enemy.id===target.id?partId:null);
      hit.actor=actor.id;events.push(hit);direct+=hit.value;
    }
    if(enemy.hp>0){
      if(spec.burn)applyBurn(enemy,2,Math.round(casters.reduce((n,h)=>n+h.atk,0)*spec.burn),Object.fromEntries(casters.map(h=>[h.id,h.atk])));
      if(spec.freeze==='all'||(spec.freeze==='target'&&enemy.id===target.id))enemy.freeze=Math.max(1,enemy.freeze);
    }
  }
  for(const ally of r.heroes.filter(h=>h.hp>0)){
    if(spec.heal){let value=0;for(const source of casters)value+=healHero(r,ally,Math.round(ally.maxHp*spec.heal/2),source);events.push({target:ally.id,value,heal:true});}
    if(spec.shield){const before=ally.shield;for(const source of casters)grantShield(r,ally,ally.maxHp*spec.shield/2,source);events.push({target:ally.id,value:ally.shield-before,shieldGrant:true});}
    if(spec.energy)ally.energy=Math.min(100,ally.energy+spec.energy);
  }
  if(spec.drain)for(const actor of casters)events.push({target:actor.id,value:healHero(r,actor,Math.round(direct*spec.drain/2),actor),heal:true});
  resolveDeaths(r,events);recordCombatAchievements(s,events,bossWasAlive);trackTraining(r,events);checkVictory(s);return events;
}
export function petAction(s){
  const r=s.run;if(!petReady(r))throw new Error('Linh thú chưa sẵn sàng. Kỹ năng hồi sau 3 vòng.');
  assertTimingGuardIdle(r);
  const p=r.pet,def=PET[p.id],power=petStrength(p),events=[],allies=r.heroes.filter(h=>h.hp>0),enemies=r.battle.enemies.filter(e=>e.hp>0),bossWasAlive=!!r.battle.bossState&&r.battle.enemies[0].hp>0;
  if(!enemies.length)throw new Error('Không còn mục tiêu.');
  const affinity=r.dungeon?.id===def.element?1.25:1;
  const atk=allies.reduce((sum,h)=>sum+h.atk,0)/allies.length*(1+.16*stacks(r,'might'))*affinity;
  p.nextRound=r.battle.round+3;log(r,`${def.name} dùng ${def.skill}!`,'skill');
  if(def.kind==='shield')for(const h of allies)grantShield(r,h,h.maxHp*power.shield*affinity,null,'pet');
  else if(def.kind==='heal')for(const h of allies)events.push({target:h.id,value:healHero(r,h,Math.round(h.maxHp*power.heal*affinity),null,'pet'),heal:true});
  else if(def.kind==='energy')for(const h of allies)h.energy=Math.min(100,h.energy+Math.round(power.energy*affinity));
  else{
    const targets=def.kind==='burn'?enemies:[autoEnemyTarget(r)];
    for(const e of targets){
      const hit=hitEnemy(r,e,Math.max(1,Math.round(atk*power[def.kind]-e.def*.65)),'pet');events.push(hit);
      log(r,`${def.name} → ${e.name}: ${hit.value}${hit.shield?` (${hit.shield} khiên)`:''}`,'skill');
      if(def.kind==='burn')applyBurn(e,2,Math.round(atk*.18),'pet');
      if(def.kind==='freeze')e.freeze=1;
      if(def.kind==='drain'){
        const h=allies.reduce((a,b)=>a.hp/a.maxHp<=b.hp/b.maxHp?a:b),value=healHero(r,h,Math.round(hit.value*.3),null,'pet');events.push({target:h.id,value,heal:true});
      }
    }
  }
  resolveDeaths(r,events);recordCombatAchievements(s,events,bossWasAlive);trackTraining(r,events);checkVictory(s);return events;
}
function recordCombatAchievements(s,events,bossWasAlive){
  const breaks=events.reduce((total,event)=>total+(event?.part?.broken?1:0),0);
  if(breaks)recordAchievement(s,'partBreaks',breaks);
  if(bossWasAlive&&s.run.battle.enemies[0].hp<=0)recordAchievement(s,'bosses');
}
function checkVictory(s) {
  const r=s.run;if(r.battle?.bossState&&r.battle.enemies[0].hp<=0)expireCounter(r);
  if(r.phase!=='battle'||r.battle.enemies.some(e=>e.hp>0))return false;
  expireCounter(r);
  r.victory={floor:r.floor,stage:'intro'};
  if(r.training){finishRun(s,'victory');return true;}
  recordBondVictory(s);const seasonSeals=recordSeasonVictory(s);
  if(r.hunt){const prize=completeHunt(s,r);refreshDaily(s);s.wins++;s.daily.battles++;finishRun(s,'victory');r.summary.huntReward=prize;return true;}
  if(r.raid){r.raid.reports.push(raidReport(r));r.cleared=r.raid.reports.length;refreshDaily(s);s.wins++;s.daily.battles++;if(r.raid.stage<2){r.phase='relay';return true;}const prize=completeRaid(s,r,()=>rand(r));if(r.lastReward?.loot?.converted)recordResult(r,'dust',r.lastReward.loot.dust);recordAchievement(s,'raidClears');finishRun(s,'victory');r.summary.raidReward=prize;return true;}
  const boss=r.node==='boss',elite=r.node==='elite';
  const eliteBonus=eliteReward(r);
  const baseGold=Math.round((55+r.floor*12+towerGoldBonus(r))*(boss?3:elite?2:1)*(1+.25*stacks(r,'fortune')))+(eliteBonus?.gold||0);
  const tickets=boss?3:0,shards=boss?2+Math.floor(r.floor/5):0;
  const gold=reward(s,baseGold,tickets,shards);refreshDaily(s);s.wins++;s.daily.battles++;
  if(eliteBonus){s.dust+=eliteBonus.dust;recordResult(r,'dust',eliteBonus.dust);}
  recordTrial(s,r,r.floor);
  healTeam(r,.05+.08*stacks(r,'renew'));
  const loot=eliteBonus?lootGear(s,'champion'):boss||elite?lootGear(s,boss?'boss':'elite'):rand(r)<.25?lootGear(s,'battle'):null;
  r.lastReward={gold,tickets,shards,boss,loot,...(r.season?{seasonSeals}:{}),...(eliteBonus?{eliteBonus}:{})};
  if(r.season&&r.floor===SEASON_FLOORS){finishRun(s,'victory');return true;}
  if(r.campaign&&r.floor===3){const prize=completeCampaign(s,r);finishRun(s,'victory');r.summary.campaignReward=prize;r.campaign.story='outro';r.phase='story';return true;}
  if(r.dungeon&&r.floor===3){const prize=completeDungeon(s,r);finishRun(s,'victory');r.summary.dungeonReward=prize;return true;}
  if(r.challenge&&r.floor>=TRIAL[r.challenge.id].goal){finishRun(s,'victory');return true;}
  if(boss){if(!offerContracts(r))offerRelics(r);}else offerBlessings(r);return true;
}
function strikeHero(r,e,target,mult,events,piercing=false,guard=null){
  const b=r.battle,enraged=b.round>12?1+(b.round-12)*.2:1,bs=b.bossState;
  const phasePower=e.kind==='boss'&&bs?.phase===2?(['ashknight','void-dragon'].includes(bs.id)?1.25:bs.id==='archivist'?1.2:BOSS[bs.id]?.element?1.15:1):1;
  const raw=Math.max(2,Math.round((e.atk*mult*enraged*phasePower*eliteAttackMultiplier(e)*(e.kind==='boss'?bossAttackMultiplier(r):1)-target.def*.6)*(1-Math.min(.6,stacks(r,'armor')*.12))*(1-fighterTalents(target).guard)*coverMultiplier(r,target,piercing)*contractEnemyMultiplier(r)*anomalyDamageMultiplier(r)*seasonIncomingMultiplier(r)));
  const guardedRaw=guard?Math.round(raw*(1-GUARD_REDUCTION)):raw;
  const shieldBefore=target.shield,absorbed=Math.min(shieldBefore,guardedRaw);target.shield-=absorbed;
  const value=Math.min(target.hp,guardedRaw-absorbed);target.hp-=value;
  const report={target:target.id,value,shield:absorbed,...(r.formation?{piercing,covered:coverMultiplier(r,target,piercing)<1}:{}),...(guard?{timingGuard:{grade:guard.grade,prevented:raw-guardedRaw,energy:0}}:{})};
  events.push(report);log(r,`${e.name}${piercing?' xuyên hàng':''} → ${HERO[target.id].name}: ${value}${absorbed?` (${absorbed} đỡ đòn)`:''}${coverMultiplier(r,target,piercing)<1?' · che chắn −15%':''}${guard?' · đỡ đúng nhịp −50%':''}`,'enemy');
  if(shieldBefore>0&&target.shield===0&&hasRelic(r,'mirror')){
    const hit=hitEnemy(r,e,Math.round(target.atk*(1+.16*stacks(r,'might'))*.7),target);events.push(hit);log(r,`Gương hộ vệ phản ${hit.value} sát thương vào ${e.name}.`,'skill');resolveDeaths(r,events);
  }
  const reflect=loadoutEffects(target.loadout).reflect;if(reflect&&value>0&&e.hp>0){const hit=hitEnemy(r,e,Math.round(value*reflect),target);events.push(hit);log(r,`Gương hộ vệ phản ${hit.value} sát thương.`,'skill');resolveDeaths(r,events);}
  if(target.hp===0&&!noRevive(r)&&hasRelic(r,'lantern')&&!r.relicUsed.lantern){r.relicUsed.lantern=true;target.hp=Math.max(1,Math.round(target.maxHp*.3*(hasResonance(r,'light')?1.2:1)*seasonHealingMultiplier(r)));recordContribution(r,null,'healing',target.hp);events.push({target:target.id,value:target.hp,heal:true});log(r,`Đèn dẫn hồn hồi sinh ${HERO[target.id].name}!`,'skill');}
  return value;
}
function summonRaidGuards(r){
  const b=r.battle,e=b.enemies[0];
  for(let i=1;i<=2;i++)if(!b.enemies[i]||b.enemies[i].hp<=0){const maxHp=Math.round(e.maxHp*.16);b.enemies[i]={id:'enemy'+i,name:'Bóng hộ vệ Tam Ấn',kind:'wraith',maxHp,hp:maxHp,atk:Math.round(e.atk*.42),def:Math.round(e.def*.6),burn:0,burnPower:0,burnSource:null,freeze:0,shield:0,deathHandled:false,intent:Math.floor(rand(r)*3)};}
  log(r,'Bóng hộ vệ đã xuất hiện. Dọn lính để gỡ che chắn 35% cho boss.','enemy');
}
function bossTurn(r,e,events,guard=null){
  const b=r.battle,bs=b.bossState,move=bs.move,phaseBefore=bs.phase;
  if(guard&&(guard.boss!==bs.id||guard.move!==move))guard=null;
  const guardStart=events.length;
  if(bs.parts?.stun){bs.parts.stun=false;bs.move='strike';bs.stagger=0;log(r,'Giáp đầu đã vỡ. Boss mất thăng bằng và bỏ lượt!','skill');return;}
  const alive=()=>r.heroes.filter(h=>h.hp>0),piercing=enemyPierces(r,e),target=()=>formationTarget(r,e,piercing);
  const single=(mult=1)=>target()?strikeHero(r,e,target(),mult,events,piercing,guard):0;
  const all=mult=>{for(const h of alive())if(e.hp>0)strikeHero(r,e,h,mult,events,false,guard);};
  if(bs.id===SEASON_BOSS.id){
    if(move==='stunned'){log(r,'Nguyền ấn đã vỡ. Vua Nguyền Ấn bỏ lượt!','skill');bs.move='strike';bs.stagger=0;}
    else if(move==='strike'){single();bs.move='charge';bs.stagger=0;}
    else if(move==='charge'){for(const h of alive())h.energy=Math.max(0,h.energy-15);log(r,'Khắc nguyền: tướng còn sống mất 15 năng lượng. Hai kỹ năng hoặc đóng băng để ngắt Giáng nguyền!','enemy');bs.move='quake';}
    else{all(bs.phase===2?1.35:1.1);if(e.hp>0){e.shield=Math.max(e.shield,Math.round(e.maxHp*.08));log(r,'Hắc nguyệt dựng khiên bằng 8% máu tối đa.','enemy');}bs.move='strike';bs.stagger=0;}
  }else if(['basalt','groveheart','sunlion','cinderwyrm','voidfox','frostqueen','stormwing'].includes(bs.id)){
    if(move==='stunned'){log(r,'Sấm bị ngắt. Lôi Long bỏ lượt!','skill');bs.move='strike';bs.stagger=0;return;}
    if(move==='strike'){single();bs.move='signature';bs.stagger=0;}
    else if(move==='signature'){
      if(bs.id==='basalt'){e.shield=Math.max(e.shield,Math.round(e.maxHp*.14));log(r,'Cổ Quy dựng mai đá. Dùng kỹ năng để phá!','enemy');}
      if(bs.id==='groveheart')for(const h of alive().slice(0,2))if(e.hp>0)strikeHero(r,e,h,.65,events,false,guard);
      if(bs.id==='sunlion'){const healed=Math.min(e.maxHp-e.hp,Math.round(e.maxHp*.08*anomalyHealingMultiplier(r)));e.hp+=healed;log(r,`Nhật Quang hồi ${healed} máu.`,'enemy');}
      if(bs.id==='cinderwyrm')single(1.35);
      if(bs.id==='voidfox'){const dealt=single();if(e.hp>0){const heal=Math.min(e.maxHp-e.hp,Math.round(dealt*.5*anomalyHealingMultiplier(r)));e.hp+=heal;log(r,`Hư Không hút ${heal} máu.`,'enemy');}}
      if(bs.id==='frostqueen'){const victim=target();single(.9);if(victim){victim.energy=Math.max(0,victim.energy-30);log(r,`${HERO[victim.id].name} mất 30 năng lượng.`,'enemy');}}
      if(bs.id==='stormwing')log(r,'Lôi Long tụ lôi! Dùng hai kỹ năng anh hùng hoặc đóng băng để ngắt.','enemy');
      if(bs.move!=='stunned')bs.move='surge';
    }else{
      if(bs.id==='voidfox'){e.shield=Math.max(e.shield,Math.round(e.maxHp*.1));log(r,'Màn đêm che chở Hư Không.','enemy');}
      else all(bs.id==='stormwing'?1.4:bs.id==='frostqueen'?.8:bs.id==='sunlion'?.95:.9);
      bs.move='strike';bs.stagger=0;
    }
  }else if(bs.id==='void-dragon'){
    if(move==='stunned'){log(r,'Hắc lôi đã bị ngắt. Hắc Long bỏ lượt!','skill');bs.move='strike';bs.stagger=0;}
    else if(move==='strike'){single();bs.move='charge';bs.stagger=0;}
    else if(move==='charge'){log(r,'Hắc Long tụ hắc lôi. Hai kỹ năng hoặc đóng băng để ngắt!','enemy');bs.move='quake';}
    else{all(1.2);bs.move='strike';bs.stagger=0;}
  }else if(r.raid?.stage===2&&raidId(r)==='tam-an'){
    if(move==='strike'){single();bs.move='charge';}
    else if(move==='charge'){summonRaidGuards(r);bs.move='quake';}
    else{all(.65);bs.move='strike';bs.stagger=0;}
  }else if(bs.id==='colossus'){
    if(move==='strike'){single();bs.move='charge';bs.stagger=0;}
    else if(move==='charge'){log(r,'Cự nhân tụ lực. Hãy dùng kỹ năng hoặc đóng băng để ngắt!','enemy');bs.move='quake';}
    else if(move==='quake'){all(bs.phase===2?1.65:1.35);bs.move='strike';bs.stagger=0;}
    else{log(r,'Cự nhân mất thăng bằng và bỏ lượt.','skill');bs.move='strike';bs.stagger=0;}
  }else if(bs.id==='archivist'){
    if(move==='summon'){
      for(let i=1;i<=2;i++)if(!b.enemies[i]||b.enemies[i].hp<=0){
        const maxHp=Math.round(e.maxHp*.15);
        b.enemies[i]={id:'enemy'+i,name:'Bóng hầu ký ức',kind:'wraith',maxHp,hp:maxHp,atk:Math.round(e.atk*.45),def:Math.round(e.def*.6),burn:0,burnPower:0,burnSource:null,freeze:0,shield:0,deathHandled:false,intent:Math.floor(rand(r)*3)};
      }
      log(r,'Người gác thư viện gọi bóng hầu. Boss được giảm 35% sát thương khi còn bóng.','enemy');bs.move='volley';
    }else if(move==='volley'){all(.65);bs.move='strike';}else{single();bs.move='summon';}
  }else if(bs.id==='ashknight'){
    if(move==='strike'){single(1.1);bs.move='cleave';}
    else if(move==='cleave'){all(.7);bs.move='siphon';}
    else{const dealt=single();if(e.hp>0){const healed=Math.min(e.maxHp-e.hp,Math.round(dealt*.5*anomalyHealingMultiplier(r)));e.hp+=healed;log(r,`Hút lửa hồi ${healed} máu cho Kỵ sĩ.`,'enemy');}bs.move='strike';}
  }else{
    if(move==='barrier'){e.shield=Math.round(e.maxHp*(bs.phase===2?.25:.18));log(r,`Hộ thần tạo ${e.shield} khiên nguyệt sắc.`,'enemy');bs.move='lunar';}
    else if(move==='lunar'){all(.7);bs.move='strike';}else{single();bs.move='barrier';}
  }
  if(phaseBefore===1&&bs.phase===2&&e.hp>0){if(bs.id==='archivist')bs.move='summon';if(bs.id==='ashknight')bs.move='siphon';}
  if(guard?.grade==='perfect'){
    const energized=new Set();
    for(const event of events.slice(guardStart))if(event.timingGuard&&!energized.has(event.target)){
      energized.add(event.target);const h=r.heroes.find(h=>h.id===event.target&&h.hp>0);if(!h)continue;
      const before=h.energy;h.energy=Math.min(100,h.energy+GUARD_ENERGY);event.timingGuard.energy=h.energy-before;
    }
  }
}
export function enemyTurn(s,guardResult=null) {
  const r=s.run;if(!r||r.phase!=='battle')throw new Error('Trận đấu đã kết thúc.');const b=r.battle,events=[],bossWasAlive=!!b.bossState&&b.enemies[0].hp>0;
  const guard=consumeTimingGuard(s,guardResult);
  expireCounter(r);
  for(const e of b.enemies.filter(e=>e.hp>0)) {
    if(e.hp<=0)continue;
    if(e.burn>0){const burn=Math.round(e.burnPower*(hasResonance(r,'fire')?1.35:1));events.push(hitEnemy(r,e,burn,e.burnSource));log(r,`${e.name} chịu ${Math.round(burn*contractDamageMultiplier(r)*anomalyDamageMultiplier(r))} thiêu đốt.`,'damage');resolveDeaths(r,events);if(e.burn>0)e.burn--;if(e.hp===0)continue;}
    if(e.freeze>0){e.freeze--;log(r,`${e.name} bị đóng băng.`,'skill');if(e.kind==='boss'&&(b.bossState?.id==='void-dragon'||(r.raid?.stage!==2&&['colossus','stormwing',SEASON_BOSS.id].includes(b.bossState?.id)))){b.bossState.move='strike';b.bossState.stagger=0;log(r,'Băng giá đã ngắt thế tụ lực.','skill');}continue;}
    const alive=r.heroes.filter(h=>h.hp>0);if(!alive.length)break;
    const piercing=enemyPierces(r,e),target=formationTarget(r,e,piercing);
    if(e.kind==='boss'&&b.bossState)bossTurn(r,e,events,guard);else strikeHero(r,e,target,1,events,piercing);
    e.intent=Math.floor(rand(r)*3);
  }
  if(guard?.grade==='perfect'&&events.some(event=>event.timingGuard?.prevented>0))recordAchievement(s,'perfectGuards');
  recordCombatAchievements(s,events,bossWasAlive);
  trackTraining(r,events);
  if(r.mode==='normal')recordTutorialProgress(s,'end');
  if(!r.heroes.some(h=>h.hp>0)){finishRun(s,'defeat');return events;}
  if(checkVictory(s))return events;
  b.round++;b.used=[];b.relicSkillUsed=false;b.linkUsed=false;grantCounter(r,events);return events;
}
export function finishRun(s,reason='retreat') {
  const r=s.run;if(!r||r.phase==='result')return;
  if(r.battle)delete r.battle.timingGuard;
  expireCounter(r);
  if(r.campaign?.story==='outro'){r.campaign.story=null;r.campaign.line=0;r.phase='result';return;}
  if(r.campaign){r.campaign.story=null;r.campaign.line=0;}
  const reached=r.raid?r.raid.reports.length:reason==='victory'||['blessing','relic','contract'].includes(r.phase)?r.floor:r.floor-1;
  r.cleared=Math.max(r.cleared,Math.max(0,reached));
  if(r.mode==='normal')s.best=Math.max(s.best,reached);else recordTrial(s,r,Math.max(0,reached));
  if(contractEligible(r))r.contractOffer=null;
  r.phase='result';r.summary={reason,cleared:Math.max(0,reached),gold:r.goldEarned,tickets:r.ticketsEarned,buffs:r.buffs.length,gear:r.gearFound,relics:r.relics.length};
}
export function claimDaily(s,id) {
  refreshDaily(s);const q=DAILY.find(q=>q.id===id);if(!q||s.daily.claimed.includes(id)||s.daily[id]<q.goal)throw new Error('Nhiệm vụ chưa hoàn thành hoặc đã nhận.');
  s.daily.claimed.push(id);s.gold+=q.gold;s.tickets+=q.tickets;return q;
}
export function claimMilestone(s,floor) {
  if(!MILESTONES.includes(floor)||s.best<floor||s.claimed.includes(floor))throw new Error('Mốc này chưa thể nhận.');
  const tickets=3+Math.floor(floor/10);s.claimed.push(floor);s.tickets+=tickets;s.gold+=floor*40;return tickets;
}
