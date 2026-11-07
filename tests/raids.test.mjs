import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES,HERO,GEAR_BASE} from '../js/data.mjs';
import {RAID_TIERS} from '../js/raids.mjs';
import {worldForRun} from '../js/worlds3d.mjs';
import {raidsPage,raidPicker,raidRelayPage,raidResult,raidRunInfo} from '../js/raid-ui.mjs';
import {victoryPage} from '../js/victory-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function account(level=20){
  const s=E.createState();s.welcome=true;s.gold=100000;s.dust=10000;s.best=50;
  for(const h of HEROES)s.owned[h.id]={level,copies:0,awaken:0};
  E.autoRaidTeams(s);return s;
}
function overpower(s){
  for(const team of s.run.raid.teams)for(const h of team.heroes)h.atk=100000;
  for(const h of s.run.heroes)h.atk=100000;
}
function clearStage(s){
  let count=0;
  while(s.run.phase==='battle'&&count++<30){
    const r=s.run,actor=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),target=r.battle.enemies.find(e=>e.hp>0);
    if(actor)E.playerAction(s,actor.id,target.id,actor.energy>=100,target.kind==='boss'?E.recommendedBossPart(r):null);else E.enemyTurn(s);
  }
  assert.notEqual(s.run.phase,'battle');
}
function win(s,difficulty=1,seed=42){
  E.startRaid(s,difficulty,seed);overpower(s);
  for(let i=0;i<3;i++){clearStage(s);if(i<2){E.dismissVictory(s);E.continueRaid(s,i);}}
  assert.equal(s.run.summary.reason,'victory');return s;
}

test('raid drafts and personal records begin empty, roundtrip and do not share arrays',()=>{
  const s=E.createState(),other=E.createState();assert.deepEqual(copy(s),s);assert.equal(E.raidUnlocked(s,1),true);assert.equal(E.raidUnlocked(s,2),false);
  E.setRaidSlot(s,0,0,'rook');assert.equal(other.raids.teams[0][0],null);assert.equal(s.raids.teams[1][0],null);assert.deepEqual(s.raids.records,E.starterRaids().records);
});

test('v16 migration preserves a real active hunt, RNG, reports, inventory and resources without mutating its source',()=>{
  const s=account();E.startHunt(s,'archivist',1,720);E.enemyTurn(s);s.version=16;delete s.raids;delete s.run.raid;
  const before=structuredClone(s),m=copy(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(m.raids,E.starterRaids());
  assert.deepEqual(m.run,{...s.run,raid:null});for(const key of Object.keys(s).filter(k=>!['version','run'].includes(k)))assert.deepEqual(m[key],s[key],key);assert.deepEqual(copy(m),m);
});

test('raid slot selection swaps heroes across teams, can clear a slot and rejects invalid or unowned choices atomically',()=>{
  const s=account(),a=s.raids.teams[0][0],b=s.raids.teams[2][1];E.setRaidSlot(s,0,0,b);assert.equal(s.raids.teams[2][1],a);assert.equal(new Set(s.raids.teams.flat()).size,9);
  E.setRaidSlot(s,1,2,null);assert.equal(s.raids.teams[1][2],null);E.setRaidFront(s,2,2);assert.equal(s.raids.fronts[2],2);copy(s);
  for(const args of [[-1,0,a],[0,3,a],[0,0,'unknown'],[0,0,undefined]]){const before=structuredClone(s);assert.throws(()=>E.setRaidSlot(s,...args));assert.deepEqual(s,before);}
  const fresh=E.createState();assert.throws(()=>E.setRaidSlot(fresh,0,0,'aion'));assert.throws(()=>E.setRaidFront(fresh,0,3));
});

test('auto draft uses nine owned available heroes, spreads shield/heal roles and cannot spend resources',()=>{
  const s=account(),wallet=[s.gold,s.tickets,s.shards,s.dust],draft=E.autoRaidTeams(s);assert.equal(new Set(draft.flat()).size,9);
  for(const team of draft){assert.ok(team.some(id=>HERO[id].kind==='shield'));assert.ok(team.some(id=>HERO[id].kind==='heal'));}
  assert.deepEqual([s.gold,s.tickets,s.shards,s.dust],wallet);
  const fresh=E.createState(),before=structuredClone(fresh);assert.throws(()=>E.autoRaidTeams(fresh),/9 anh hùng/);assert.deepEqual(fresh,before);
  const id=HEROES.find(h=>!s.team.includes(h.id)).id;E.dispatchExpedition(s,'mist-path',id,0,100);E.autoRaidTeams(s);assert.ok(!s.raids.teams.flat().includes(id));copy(s);
});

test('raid starts reject incomplete, duplicated, locked, dispatched and concurrent parties before touching state',()=>{
  const fresh=E.createState(),before=structuredClone(fresh);assert.throws(()=>E.startRaid(fresh),/9 anh hùng/);assert.deepEqual(fresh,before);
  for(const alter of [s=>s.raids.teams[1][0]=s.raids.teams[0][0],s=>s.raids.teams[1][0]=null,s=>E.startRun(s,42),s=>{const id=s.raids.teams.flat().find(id=>!s.team.includes(id));E.dispatchExpedition(s,'mist-path',id,0,100);}]){
    const s=account();alter(s);const before=structuredClone(s);assert.throws(()=>E.startRaid(s,1,22));assert.deepEqual(s,before);
  }
  const s=account(),old=structuredClone(s);for(const tier of [0,2,3,4,NaN,'1'])assert.throws(()=>E.startRaid(s,tier,42));assert.deepEqual(s,old);
});

test('a raid snapshots all nine heroes, three formations and pet while leaving the normal party untouched',()=>{
  const s=account();s.raids.fronts=[2,1,2];const party=[...s.team],formation={...s.formation},runs=s.runs;
  E.startRaid(s,1,42);const r=s.run;assert.equal(r.mode,'raid');assert.equal(r.floor,1);assert.equal(r.raid.teams.length,3);assert.equal(r.heroes.length,3);assert.equal(r.formation.front,2);assert.equal(r.battle.bossState.id,'colossus');assert.equal(r.battle.enemies[0].name,E.RAID_NAME);
  assert.equal(s.runs,runs+1);assert.deepEqual(s.team,party);assert.deepEqual(s.formation,formation);assert.equal(r.map,null);assert.deepEqual(r.buffs,[]);assert.ok(r.raid.teams.every(t=>t.heroes.every(h=>h.hp===h.maxHp&&h.energy===100&&h.shield===0)));assert.deepEqual(copy(s),s);
  E.playerAction(s,r.heroes[0].id,'enemy0');assert.deepEqual(r.raid.teams[0].heroes.map(h=>h.energy),[100,100,100]);
});

test('stage one armor and auto target require the core, then expose its normal 25 percent weakness',()=>{
  const s=account();E.startRaid(s,1,42);const r=s.run;assert.equal(worldForRun(r).id,'forest');assert.equal(E.bossDirectMultiplier(r),.55);assert.equal(E.recommendedBossPart(r),'core');
  r.battle.bossState.parts.core.hp=0;assert.equal(E.bossDirectMultiplier(r),1.25);assert.equal(E.recommendedBossPart(r),'arms');copy(s);
});

test('stage two starts charged with 100 energy; two offensive skills or freeze interrupt the quake',()=>{
  for(const freeze of [false,true]){
    const s=account();s.raids.teams=[['rook','aerin','lumi'],['ember','bryn','raiden'],['thorne','seraph','astra']];E.startRaid(s,1,42);overpower(s);clearStage(s);E.dismissVictory(s);E.continueRaid(s,0);
    // Restore combat-sized damage in both the persisted snapshot and active team.
    for(const h of s.run.heroes){h.atk=40;s.run.raid.teams[1].heroes.find(x=>x.id===h.id).atk=40;}
    const r=s.run;assert.equal(worldForRun(r).id,'lava');assert.equal(r.battle.bossState.move,'charge');assert.equal(E.bossThreat(r).kind,'charge');assert.ok(r.heroes.every(h=>h.energy===100));
    if(freeze){E.playerAction(s,'bryn','enemy0',true);E.enemyTurn(s);assert.equal(r.battle.bossState.move,'strike');}
    else{E.playerAction(s,'ember','enemy0',true);assert.equal(r.battle.bossState.stagger,1);E.playerAction(s,'raiden','enemy0',true);assert.equal(r.battle.bossState.move,'stunned');const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);}
    copy(s);
  }
});

test('relay commits only a stage report, restores after closing the game and rejects stale or premature transitions',()=>{
  let s=account();E.startRaid(s,1,42);overpower(s);const wallet=[s.gold,s.dust,s.armory.essence,s.inventory.length],runs=s.runs;clearStage(s);
  assert.equal(s.run.phase,'relay');assert.equal(s.run.cleared,1);assert.equal(s.run.raid.reports.length,1);assert.deepEqual([s.gold,s.dust,s.armory.essence,s.inventory.length],wallet);
  assert.throws(()=>E.continueRaid(s,0),/chưa sẵn sàng/);assert.equal(E.advanceVictory(s),'done');s=copy(s);assert.match(raidRelayPage(s),/Đến lượt đội 2/);const old=structuredClone(s.run.raid.teams[1]);
  E.continueRaid(s,0);assert.equal(s.run.floor,2);assert.equal(s.run.phase,'battle');assert.deepEqual(s.run.heroes,old.heroes);assert.equal(s.run.link.charge,0);assert.equal(s.run.battle.round,1);assert.equal(s.runs,runs);
  const before=structuredClone(s);assert.throws(()=>E.continueRaid(s,0));assert.deepEqual(s,before);copy(s);
});

test('upgrades, gear reassignment, talent reset and pet changes between phases never rewrite waiting teams',()=>{
  const s=account();s.armory.marks.colossus=100;const id=s.raids.teams[1][0],g=E.forgeGear(s,'set-bastion-weapon');
  E.equipGear(s,g.id,id);E.learnTalent(s,id,'force');E.startRaid(s,1,42);overpower(s);const waiting=structuredClone(s.run.raid.teams[1]);
  clearStage(s);E.dismissVictory(s);E.upgradeHero(s,id);E.upgradeGear(s,g.id);E.equipGear(s,g.id,s.team[0]);E.resetTalents(s,id);E.equipPet(s,null);
  assert.deepEqual(s.run.raid.teams[1],waiting);E.continueRaid(s,0);assert.deepEqual(s.run.heroes,waiting.heroes);assert.equal(s.run.pet.id,'mossling');assert.deepEqual(copy(s),s);
});

test('every waiting and resting raid hero is locked out of expeditions until the raid finishes',()=>{
  const s=account();E.startRaid(s,1,42);const id=s.run.raid.teams[2].heroes.find(h=>!s.team.includes(h.id)).id;
  assert.equal(E.expeditionHeroAvailable(s,id),false);assert.throws(()=>E.dispatchExpedition(s,'mist-path',id,0,100));
  const draft=structuredClone(s.raids);assert.throws(()=>E.setRaidSlot(s,0,0,null));assert.throws(()=>E.setRaidFront(s,1,2));assert.throws(()=>E.autoRaidTeams(s));assert.deepEqual(s.raids,draft);
  E.finishRun(s);assert.equal(E.expeditionHeroAvailable(s,id),true);E.dispatchExpedition(s,'mist-path',id,0,100);copy(s);
});

test('stage three opens with two guards, removes 35 percent boss protection when cleared and resummons them',()=>{
  const s=account();E.startRaid(s,1,42);overpower(s);
  for(let i=0;i<2;i++){clearStage(s);E.dismissVictory(s);E.continueRaid(s,i);}
  const r=s.run;for(const h of r.heroes){h.atk=50;r.raid.teams[2].heroes.find(x=>x.id===h.id).atk=50;}
  assert.equal(worldForRun(r).id,'sky');assert.equal(r.battle.enemies.length,3);assert.match(E.bossInfo(r).desc,/bóng hộ vệ/);
  const a=structuredClone(s),b=structuredClone(s),actor=r.heroes[0].id;for(const guard of b.run.battle.enemies.slice(1)){guard.hp=0;guard.deathHandled=true;}
  E.playerAction(a,actor,'enemy0');E.playerAction(b,actor,'enemy0');assert.ok(a.run.battle.enemies[0].hp>b.run.battle.enemies[0].hp);
  for(const guard of r.battle.enemies.slice(1)){guard.hp=0;guard.deathHandled=true;}r.battle.bossState.move='charge';assert.equal(E.bossThreat(r).kind,'prepare');E.enemyTurn(s);assert.ok(r.battle.enemies.slice(1).every(e=>e.hp>0));assert.equal(r.battle.bossState.move,'quake');copy(s);
});

test('all three difficulties award exactly one guaranteed chest plus gold/essence and unlock sequentially',()=>{
  const s=account();for(let difficulty=1;difficulty<=3;difficulty++){
    const tier=RAID_TIERS[difficulty-1],wallet={gold:s.gold,essence:s.armory.essence,items:s.inventory.length,tickets:s.tickets,shards:s.shards};win(s,difficulty);
    assert.equal(s.run.cleared,3);assert.equal(s.run.raid.claimed,true);assert.equal(s.raids.records[difficulty-1].clears,1);assert.equal(s.gold,wallet.gold+tier.gold);assert.equal(s.armory.essence,wallet.essence+tier.essence);assert.equal(s.inventory.length,wallet.items+1);assert.equal(s.tickets,wallet.tickets);assert.equal(s.shards,wallet.shards);assert.equal(s.run.lastReward.loot.gear.rarity,tier.rarity);assert.equal(s.run.summary.raidReward.rounds,s.run.raid.reports.reduce((n,v)=>n+v.rounds,0));
    assert.equal(E.victoryRewards(s.run).essence,tier.essence);assert.match(raidResult(s),/Ba phong ấn/);assert.match(victoryPage(s),/ĐỘT KÍCH 3 ĐỘI/);assert.deepEqual(copy(s),s);
    const before=structuredClone(s);assert.throws(()=>E.completeRaid(s,s.run,Math.random));assert.deepEqual(s,before);E.dismissVictory(s);copy(s);
  }
});

test('full inventory converts the single rare chest to dust without dropping gold or essence',()=>{
  const s=account();while(s.inventory.length<E.GEAR_LIMIT)E.dropGearAtRarity(s,()=>.5,'R');const dust=s.dust,items=s.inventory.length;win(s);
  const loot=s.run.lastReward.loot;assert.equal(loot.converted,true);assert.equal(s.inventory.length,items);assert.equal(s.dust,dust+E.dismantleValue(loot.gear));assert.equal(s.armory.essence,4);assert.deepEqual(copy(s),s);
});

test('reopening or advancing victory never repeats raid rewards and evolved loot cannot rewrite its chest snapshot',()=>{
  let s=win(account());const loot=structuredClone(s.run.lastReward.loot),id=loot.gear.id,wallet=[s.gold,s.dust,s.armory.essence,s.nextGearId];s=copy(s);E.advanceVictory(s);s=copy(s);E.advanceVictory(s);assert.deepEqual([s.gold,s.dust,s.armory.essence,s.nextGearId],wallet);
  for(let i=0;i<4;i++)E.upgradeGear(s,id);s.armory.essence=100;E.evolveGear(s,id);assert.equal(s.inventory.find(g=>g.id===id).rarity,'UR');assert.deepEqual(s.run.lastReward.loot,loot);assert.deepEqual(copy(s),s);
});

test('defeat and retreat at every stage retain cleared phase reports but never grant chest or records',()=>{
  for(const stage of [0,1,2])for(const reason of ['retreat','defeat']){
    const s=account();E.startRaid(s,1,42);overpower(s);for(let i=0;i<stage;i++){clearStage(s);E.dismissVictory(s);E.continueRaid(s,i);}
    const wallet=[s.gold,s.dust,s.armory.essence,s.inventory.length];if(reason==='defeat'){for(const h of s.run.heroes)h.hp=0;E.enemyTurn(s);}else E.finishRun(s);
    assert.equal(s.run.phase,'result');assert.equal(s.run.summary.reason,reason);assert.equal(s.run.cleared,stage);assert.equal(s.run.summary.cleared,stage);assert.equal(s.run.raid.claimed,false);assert.equal(s.raids.records[0].clears,0);assert.deepEqual([s.gold,s.dust,s.armory.essence,s.inventory.length],wallet);assert.deepEqual(copy(s),s);
  }
});

test('retreat after a completed stage accurately counts the stage without awarding a partial chest',()=>{
  const s=account();E.startRaid(s,1,42);overpower(s);clearStage(s);E.dismissVictory(s);E.finishRun(s);assert.equal(s.run.summary.cleared,1);assert.equal(s.run.raid.reports.length,1);assert.equal(s.run.lastReward,undefined);copy(s);
});

test('personal records count repeated clears and retain the shortest total round count',()=>{
  const s=account();win(s);const best=s.raids.records[0].bestRounds;assert.ok(best>=3);E.dismissVictory(s);E.startRaid(s,1,99);overpower(s);E.enemyTurn(s);clearStage(s);E.dismissVictory(s);E.continueRaid(s,0);clearStage(s);E.dismissVictory(s);E.continueRaid(s,1);clearStage(s);
  assert.equal(s.run.summary.raidReward.rounds,best+1);assert.equal(s.raids.records[0].clears,2);assert.equal(s.raids.records[0].bestRounds,best);copy(s);
});

test('malformed raid drafts, records, snapshots, cross-mode state and partial rewards are rejected',()=>{
  for(const alter of [s=>delete s.raids,s=>s.raids.fronts[0]=3,s=>s.raids.teams[0][0]='unknown',s=>s.raids.teams[1][0]=s.raids.teams[0][0],s=>s.raids.records[1]={clears:1,bestRounds:3},s=>s.raids.records[0]={clears:0,bestRounds:4}]){const s=account();alter(s);assert.throws(()=>copy(s));}
  const started=account();E.startRaid(started,1,42);
  for(const alter of [s=>delete s.run.raid,s=>s.run.raid.teams[1].heroes[0].hp=1,s=>s.run.raid.teams[1].heroes[0].loadout.affixes.energy=26,s=>s.run.raid.teams[1].heroes[0].talents={level:100,nodes:{}},s=>s.run.raid.teams[2].heroes[0].id=s.run.heroes[0].id,s=>s.run.raid.stage=1,s=>s.run.raid.claimed=true,s=>s.run.heroes[0].atk++,s=>s.run.phase='relay',s=>s.run.mode='normal',s=>s.run.goldEarned=300,s=>s.run.lastReward={gold:0,tickets:0,shards:0}]){const s=structuredClone(started);alter(s);assert.throws(()=>copy(s));}
  const won=win(account());for(const alter of [s=>s.run.summary.raidReward.essence++,s=>s.run.lastReward.loot.gear.rarity='UR',s=>s.run.raid.reports.pop(),s=>s.run.raid.stage=1,s=>s.run.raid.claimed=false,s=>s.run.summary.raidReward.rounds++,s=>s.raids.records[0].clears=0]){const s=structuredClone(won);alter(s);assert.throws(()=>copy(s));}
});

test('raid UI exposes locked difficulty, nine slot controls, mechanics, real rewards and owned-only picker without mutation',()=>{
  const s=account(),before=structuredClone(s),page=raidsPage(s,2);assert.match(page,/Rương UR bảo đảm/);assert.match(page,/Cần thắng|Thắng mức khó trước/);assert.equal((page.match(/data-action="raid-pick"/g)||[]).length,9);assert.match(page,/9\/9/);assert.match(page,/8<\/b> Tinh hoa boss/);assert.deepEqual(s,before);
  const fresh=E.createState(),picker=raidPicker(fresh,0,0);assert.match(raidsPage(fresh),/Cần thêm 5/);assert.match(picker,/data-id="rook"/);assert.doesNotMatch(picker,/data-id="aion"/);E.startRaid(s,1,42);assert.match(raidRunInfo(s),/Chín anh hùng/);assert.throws(()=>raidPicker(s,3,0));assert.deepEqual(copy(s),s);
});
