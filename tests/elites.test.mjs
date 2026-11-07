import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/elite-legacy-v1.31.0/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {ELITE_SEEDS,encounter,champion,copy,win} from './elites-helper.mjs';
import {withoutCombatReport,withoutResultLedger} from './legacy-report-helper.mjs';
import {eliteBadge,eliteBanner,eliteDetail,eliteRouteNote,eliteRewardNote} from '../js/elites-ui.mjs';
import {enemyArt} from '../js/art.mjs';
import {victoryPage} from '../js/victory-ui.mjs';

test('only new normal journeys snapshot elite rules; no extra RNG below floor 10 or at bosses',()=>{
  assert.equal(E.SAVE_VERSION,34);
  for(const floor of [1,9,10,11,25])for(const node of ['battle','elite','boss']){
    const s=encounter('guard',{floor,node}),old=encounter('guard',{floor,node,engine:Old});
    assert.equal(s.run.eliteRules,1);if(node==='elite'&&floor>=10)assert.ok(champion(s));if(node==='boss'||floor<10)assert.equal(champion(s),undefined);
    if(floor<10||node==='boss'){
      delete s.version;delete old.version;delete s.achievements;delete s.bonds;delete old.achievements;delete old.bonds;delete s.lockedGear;delete s.gearPresets;if(JSON.stringify(s.refining)===JSON.stringify({rolls:0,pending:null}))delete s.refining;if(JSON.stringify(s.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete s.loginRewards;if(JSON.stringify(s.bonds)==='{}')delete s.bonds;if(JSON.stringify(s.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete s.season;delete old.lockedGear;delete old.gearPresets;if(JSON.stringify(old.refining)===JSON.stringify({rolls:0,pending:null}))delete old.refining;if(JSON.stringify(old.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete old.loginRewards;if(JSON.stringify(old.bonds)==='{}')delete old.bonds;if(JSON.stringify(old.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete old.season;delete s.run.eliteRules;delete s.run.contractRules;delete s.run.contracts;delete s.run.contractOffer;s.run.started=old.run.started;assert.deepEqual(withoutResultLedger(s),withoutResultLedger(old));
    }
  }
});

test('elite rooms roll exactly one seeded trait and regular battles use the stated 28 percent chance',()=>{
  const counts={rage:0,guard:0,rebirth:0};let regular=0;
  for(let seed=1;seed<=1024;seed++){
    const a=encounter('guard',{seed}),b=encounter('guard',{seed});a.run.started=b.run.started;
    assert.deepEqual(a,b);assert.equal(a.run.battle.enemies.filter(e=>e.elite).length,1);counts[champion(a).elite.trait]++;
    regular+=!!champion(encounter('guard',{seed,node:'battle'}));
  }
  for(const count of Object.values(counts))assert.ok(count>250&&count<430);
  assert.ok(regular>240&&regular<335,`regular encounter count: ${regular}`);
});

for(const trait of Object.keys(ELITE_SEEDS))test(`${trait}: seeded stat increase is limited to one enemy, saves without rerolling and leaves inputs independent`,()=>{
  const s=encounter(trait),e=champion(s),old=encounter(trait,{engine:Old}),original=old.run.battle.enemies.find(x=>x.id===e.id);
  assert.equal(e.elite.trait,trait);assert.equal(e.maxHp,Math.round(original.maxHp*1.25));assert.equal(e.atk,Math.round(original.atk*1.12));assert.equal(e.def,original.def+2);assert.equal(e.shield,trait==='guard'?Math.round(e.maxHp*.3):0);
  assert.deepEqual(s.run.battle.enemies.filter(x=>x.id!==e.id),old.run.battle.enemies.filter(x=>x.id!==e.id));
  const before=structuredClone(s),restored=copy(s);assert.deepEqual(restored,s);champion(restored).hp--;assert.deepEqual(s,before);
});

test('challenge, campaign, dungeon, hunt, training and raid runs never opt into elite rules',()=>{
  const states=[];
  let s=E.createState();E.startChallenge(s,'iron');states.push(s);
  s=E.createState();E.startCampaign(s,1,42);states.push(s);
  s=E.createState();E.startDungeon(s,'earth',1,new Date(),42);states.push(s);
  s=E.createState();E.startHunt(s,'colossus',1,42);states.push(s);
  states.push(E.createTrainingState(E.createState()));
  s=E.createState();s.best=100;for(const h of HEROES)s.owned[h.id]={level:20,copies:0,awaken:0};E.autoRaidTeams(s);E.startRaid(s,1,42);states.push(s);
  for(const state of states){assert.equal(Object.hasOwn(state.run,'eliteRules'),false);assert.equal(E.eliteEligible(state.run,'elite',30),false);assert.equal(E.assignElite(state.run,()=>{throw new Error('extra RNG');}),null);if(state.run.mode!=='training')copy(state);}
});

function guardedPair(options={}){
  const s=encounter('guard',options),plain=structuredClone(s);delete champion(plain).elite;
  const guard=champion(s),target=s.run.battle.enemies.find(e=>e.id!==guard.id);return {s,plain,guard,target};
}
test('Hộ vệ reduces direct HP and shield damage to allies by 35 percent, without protecting itself',()=>{
  const {s,plain,guard,target}=guardedPair();target.shield=30;plain.run.battle.enemies.find(e=>e.id===target.id).shield=30;
  const ordinary=E.playerAction(plain,'rook',target.id)[0],hit=E.playerAction(s,'rook',target.id)[0];
  assert.equal(hit.value+hit.shield,Math.round((ordinary.value+ordinary.shield)*.65));assert.equal(hit.guarded,true);assert.equal(guard.shield,Math.round(guard.maxHp*.3));
  const a=encounter('guard'),b=structuredClone(a),g=champion(a);delete champion(b).elite;
  assert.deepEqual(E.playerAction(a,'rook',g.id),E.playerAction(b,'rook',g.id));
});

test('breaking or killing Hộ vệ ends protection immediately; Auto changes target after the shield is gone',()=>{
  const s=encounter('guard'),g=champion(s),other=s.run.battle.enemies.find(e=>e.id!==g.id);other.hp=5;
  assert.equal(E.autoEnemyTarget(s.run).id,g.id);g.shield=1;
  const hit=E.playerAction(s,'rook',g.id)[0];assert.equal(hit.guardBreak,true);assert.equal(g.shield,0);assert.equal(E.activeEliteGuard(s.run),null);assert.equal(E.autoEnemyTarget(s.run).id,other.id);
  const plain=structuredClone(s);delete champion(plain).elite;
  assert.deepEqual(E.playerAction(s,'aerin',other.id),E.playerAction(plain,'aerin',other.id));
  const dead=encounter('guard');champion(dead).hp=0;assert.equal(E.activeEliteGuard(dead.run),null);
});

test('guard reduction covers burn, pet attacks, link hits and signature echoes in the central damage path',()=>{
  for(const path of ['burn','pet','link','echo']){
    const {s,plain,target}=guardedPair(path==='echo'?{team:['rook','kira','lumi']}:{});
    for(const state of [s,plain]){
      const r=state.run,e=r.battle.enemies.find(e=>e.id===target.id);e.maxHp=e.hp=10000;
      if(path==='burn'){e.burn=2;e.burnPower=100;e.burnSource={rook:1};for(const x of r.battle.enemies)x.freeze=1;}
      if(path==='pet')r.pet={id:'nixie',level:1,nextRound:1};
      if(path==='link'){r.link.charge=100;for(const h of r.heroes)h.energy=100;}
    }
    if(path==='burn'){
      const protectedEvents=E.enemyTurn(s),plainEvents=E.enemyTurn(plain);assert.equal(protectedEvents.find(x=>x.target===target.id).value,65);assert.equal(plainEvents.find(x=>x.target===target.id).value,100);
    }else if(path==='pet'){
      // The pet also focuses a shielded Hộ vệ, so compare the splash fire pet on all targets.
      s.run.pet={id:'vermillion',level:1,nextRound:1};plain.run.pet={...s.run.pet};
      const a=E.petAction(s).find(x=>x.target===target.id),b=E.petAction(plain).find(x=>x.target===target.id);assert.equal(a.value,Math.round(b.value*.65));assert.equal(a.guarded,true);
    }else if(path==='link'){
      const a=E.linkAction(s,'rook','aerin',target.id).filter(x=>x.target===target.id&&!x.heal&&!x.shieldGrant),b=E.linkAction(plain,'rook','aerin',target.id).filter(x=>x.target===target.id&&!x.heal&&!x.shieldGrant);
      assert.ok(a.length>=2);for(let i=0;i<a.length;i++)assert.equal(a[i].value,Math.round(b[i].value*.65));
    }else{
      // Kira's signature has an echo; use the real effect from the weapon data.
      for(const state of [s,plain]){const h=state.run.heroes.find(h=>h.id==='kira');h.energy=100;h.loadout={sets:[{id:'bloodmoon',count:1}],signature:'kira',affixes:{crit:0,drain:0,energy:0},weaponRarity:null};}
      const a=E.playerAction(s,'kira',target.id,true).filter(x=>x.target===target.id),b=E.playerAction(plain,'kira',target.id,true).filter(x=>x.target===target.id);
      assert.ok(a.length>=2);for(let i=0;i<a.length;i++)assert.equal(a[i].value,Math.round(b[i].value*.65));
    }
  }
});

test('Cuồng nộ scales enemy attacks with missing HP and respects freezing, shields and defenses',()=>{
  for(const fraction of [1,.5,.1]){
    const s=encounter('rage'),e=champion(s);e.hp=Math.round(e.maxHp*fraction);
    for(const x of s.run.battle.enemies)if(x!==e)x.freeze=1;
    const plain=structuredClone(s);delete champion(plain).elite;
    const target=E.formationTarget(s.run,e),expected=Math.max(2,Math.round((e.atk*E.eliteAttackMultiplier(e)-target.def*.6)*E.coverMultiplier(s.run,target,E.enemyPierces(s.run,e))));
    target.shield=10;const events=E.enemyTurn(s).filter(x=>x.target===target.id&&!x.heal);
    assert.equal(events.length,1);assert.equal(events[0].value+events[0].shield,expected);
    assert.ok(expected>=(E.enemyTurn(plain).find(x=>x.target===target.id)?.value||0));copy(s);
  }
  const s=encounter('rage'),e=champion(s);e.freeze=1;for(const x of s.run.battle.enemies)x.freeze=1;assert.deepEqual(E.enemyTurn(s),[]);assert.equal(e.freeze,0);
});

test('guard protection covers void detonations, death explosions and both reflection sources',()=>{
  for(const path of ['void','cinder','mirror','set-reflect']){
    const {s,plain,guard,target}=guardedPair();let protectedEvents,ordinaryEvents;
    for(const state of [s,plain]){
      const r=state.run,e=r.battle.enemies.find(e=>e.id===target.id);
      if(path==='void'){e.voidMarks=2;r.heroes[0].loadout={sets:[{id:'void',count:3}],signature:null,affixes:{crit:0,drain:0,energy:0},weaponRarity:'SSR'};}
      else if(path==='cinder'){r.relics=['cinder'];e.hp=1;e.burn=1;e.burnPower=1;e.burnSource={rook:1};}
      else{
        for(const enemy of r.battle.enemies)if(enemy.id!==target.id)enemy.freeze=1;
        for(const hero of r.heroes){hero.shield=path==='mirror'?1:0;if(path==='set-reflect')hero.loadout={sets:[{id:'mirror',count:3}],signature:null,affixes:{crit:0,drain:0,energy:0},weaponRarity:'SSR'};}
        if(path==='mirror')r.relics=['mirror'];
      }
    }
    if(['mirror','set-reflect'].includes(path)){protectedEvents=E.enemyTurn(s);ordinaryEvents=E.enemyTurn(plain);}
    else{protectedEvents=E.playerAction(s,'rook',target.id);ordinaryEvents=E.playerAction(plain,'rook',target.id);}
    if(path==='void'){assert.equal(protectedEvents[0].voidBurst,Math.round(ordinaryEvents[0].voidBurst*.65));assert.ok(ordinaryEvents[0].voidBurst>0);}
    else{
      const id=path==='cinder'?s.run.battle.enemies.find(e=>e.id!==guard.id&&e.id!==target.id).id:target.id,a=protectedEvents.find(e=>e.target===id),b=ordinaryEvents.find(e=>e.target===id);
      assert.ok(b.value>0,path);assert.equal(a.value,Math.round(b.value*.65),path);assert.equal(a.guarded,true,path);
    }
  }
});

test('single-target pets prioritize a protecting Hộ vệ, then return to the lowest-HP target',()=>{
  const s=encounter('guard'),g=champion(s),low=s.run.battle.enemies.find(e=>e!==g);low.hp=1;s.adventure.pets.nixie={level:1};s.run.pet={id:'nixie',level:1,nextRound:1};
  assert.equal(E.petAction(s)[0].target,g.id);copy(s);g.shield=0;s.run.pet.nextRound=1;assert.equal(E.petAction(s)[0].target,low.id);copy(s);
});

test('Tái sinh survives the first lethal hit, clears ailments, reloads its spent life and dies only once',()=>{
  let s=encounter('rebirth'),e=champion(s);e.hp=1;e.burn=2;e.burnPower=8;e.burnSource={rook:1};e.freeze=1;e.voidMarks=2;
  const actor=s.run.heroes[0],before=[s.gold,s.dust,s.wins];s.run.relics=['spark','cinder'];actor.energy=0;
  const events=E.playerAction(s,actor.id,e.id),revive=events.find(x=>x.eliteRevive);
  assert.deepEqual(revive,{target:e.id,value:Math.round(e.maxHp*.4),heal:true,eliteRevive:true});assert.equal(e.deathHandled,false);assert.equal(e.elite.revived,true);assert.equal(actor.energy,35);assert.deepEqual([e.burn,e.burnPower,e.burnSource,e.freeze,e.voidMarks],[0,0,null,0,0]);assert.deepEqual([s.gold,s.dust,s.wins],before);assert.equal(s.run.phase,'battle');
  s=copy(s);e=champion(s);s.run.heroes[1].atk=100000;const second=E.playerAction(s,s.run.heroes[1].id,e.id);assert.equal(second.some(x=>x.eliteRevive),false);assert.equal(e.hp,0);assert.equal(e.deathHandled,true);assert.equal(s.run.heroes[0].energy,55);copy(s);
});

test('burn lethality revives without a negative burn counter or premature victory; a later burn kills normally',()=>{
  let s=encounter('rebirth'),e=champion(s);e.hp=1;e.burn=2;e.burnPower=50;e.burnSource={rook:1};
  for(const x of s.run.battle.enemies)if(x!==e)x.freeze=1;
  const events=E.enemyTurn(s);assert.equal(events.filter(x=>x.eliteRevive).length,1);assert.equal(e.burn,0);assert.equal(e.burnPower,0);assert.equal(s.run.phase,'battle');s=copy(s);e=champion(s);
  e.hp=1;e.burn=2;e.burnPower=50;e.burnSource={rook:1};const later=E.enemyTurn(s);assert.equal(later.some(x=>x.eliteRevive),false);assert.equal(e.hp,0);assert.equal(e.deathHandled,true);copy(s);
});

test('AoE skills, links, pets, cinder explosions and mirror reflection all honor the extra life',()=>{
  for(const path of ['aoe','link','pet','cinder','mirror']){
    const s=encounter('rebirth'),e=champion(s);e.hp=1;
    let events;
    if(path==='aoe'){
      const h=s.run.heroes.find(h=>h.id==='aerin');h.energy=100;h.atk=100000;events=E.playerAction(s,h.id,e.id,true);
    }else if(path==='link'){
      s.run.link.charge=100;for(const h of s.run.heroes){h.energy=100;h.atk=100000;}events=E.linkAction(s,'rook','aerin',e.id);
    }else if(path==='pet'){
      s.adventure.pets.vermillion={level:1};s.run.pet={id:'vermillion',level:1,nextRound:1};for(const h of s.run.heroes)h.atk=100000;events=E.petAction(s);
    }else if(path==='cinder'){
      const other=s.run.battle.enemies.find(x=>x!==e);other.hp=1;other.burn=2;other.burnPower=1;other.burnSource={rook:1};s.run.relics=['cinder'];events=E.playerAction(s,'rook',other.id);
    }else{
      s.run.relics=['mirror'];for(const x of s.run.battle.enemies)if(x!==e)x.freeze=1;
      for(const h of s.run.heroes)h.shield=1;events=E.enemyTurn(s);
    }
    assert.equal(events.filter(x=>x.eliteRevive).length,1,path);assert.equal(e.elite.revived,true,path);assert.equal(e.hp,Math.round(e.maxHp*.4),path);assert.equal(s.run.phase,'battle');copy(s);
  }
});

for(const trait of Object.keys(ELITE_SEEDS))test(`${trait}: victory pays one gold/dust bonus and improved gear, preserved through every victory stage`,()=>{
  let s=encounter(trait),baseGold=s.gold,baseDust=s.dust;win(s);const r=s.run,bonus=E.eliteReward(r),gold=2*(55+11*12)+bonus.gold;
  assert.equal(s.gold,baseGold+gold);assert.equal(s.dust,baseDust+bonus.dust);assert.equal(s.wins,1);assert.equal(r.gearFound,1);assert.deepEqual(r.lastReward.eliteBonus,bonus);assert.equal(r.lastReward.gold,gold);assert.ok(r.lastReward.loot);assert.equal(E.victoryRewards(r).dust,bonus.dust);
  assert.match(eliteRewardNote(r),/đã tính trong tổng thưởng/);E.advanceVictory(s);assert.match(victoryPage(s),/Bụi rèn/);assert.match(victoryPage(s),/tinh anh/);
  for(const action of [s=>E.advanceVictory(s),s=>E.dismissVictory(s)]){
    const before=structuredClone([s.gold,s.dust,s.inventory,s.wins,s.run.seed]);s=copy(s);action(s);assert.deepEqual([s.gold,s.dust,s.inventory,s.wins,s.run.seed],before);
  }
  assert.throws(()=>E.playerAction(s,'rook','enemy0'));const bonusPaid=s.dust;E.selectBlessing(s,s.run.choices[0]);assert.equal(s.run.lastReward,null);assert.equal(s.dust,bonusPaid);copy(s);
});

test('full inventory converts the one elite gear drop separately from bonus dust, and retreat gives no prize',()=>{
  const s=encounter('rage');while(s.inventory.length<E.GEAR_LIMIT)E.dropGearAtRarity(s,()=>.5,'R');const dust=s.dust,next=s.nextGearId;win(s);
  assert.equal(s.inventory.length,E.GEAR_LIMIT);assert.equal(s.nextGearId,next+1);assert.equal(s.run.lastReward.loot.converted,true);assert.equal(s.dust,dust+s.run.lastReward.eliteBonus.dust+s.run.lastReward.loot.dust);copy(s);
  const retreat=encounter('rebirth'),before=[retreat.gold,retreat.dust,retreat.inventory.length];E.finishRun(retreat);assert.deepEqual([retreat.gold,retreat.dust,retreat.inventory.length],before);assert.equal(retreat.run.lastReward,undefined);copy(retreat);
});

test('elite gear rates sum to 100 percent, beat elite rooms and leave every historical source unchanged',()=>{
  for(const floor of [10,11,24,25,49,50,100]){
    const rates=E.gearDropChances(floor,'champion'),tier=Object.fromEntries(rates);assert.ok(Math.abs(rates.reduce((n,[,p])=>n+p,0)-1)<1e-10);assert.equal(tier.SR,.62);assert.equal(tier.SSR,.08);assert.equal(tier.UR||0,floor>=25?.04:0);assert.equal(tier.LR||0,floor>=50?.01:0);assert.ok(tier.R<Object.fromEntries(E.gearDropChances(floor,'elite')).R);
    for(const source of ['battle','elite','boss','treasure'])assert.deepEqual(E.gearDropChances(floor,source),Old.gearDropChances(floor,source));
  }
});

test('battle hints, SVG silhouettes and counters stay readable, escaped and free of RNG mutations',()=>{
  for(const trait of Object.keys(ELITE_SEEDS)){
    const s=encounter(trait),e=champion(s);e.name='<img onerror="oops">';const before=structuredClone(s);
    assert.match(eliteBanner(s.run),/data-action="elite-info"/);assert.match(eliteDetail(s.run,e.id),/Cách khắc chế/);assert.match(eliteDetail(s.run,e.id),/SSR 8%/);assert.match(eliteBadge(e),new RegExp(E.ELITE_TRAITS[trait].name));assert.match(enemyArt(e),new RegExp('elite-'+trait));assert.doesNotMatch(eliteBanner(s.run),/<img/);assert.match(eliteRouteNote(s.run,'battle'),/28%/);assert.match(eliteRouteNote(s.run,'elite'),/Chắc chắn/);assert.equal(eliteRouteNote(s.run,'boss'), '');assert.deepEqual(s,before);
  }
  const s=encounter('guard');delete s.run.eliteRules;assert.equal(eliteRouteNote(s.run),'');
});

const invalid=[
  ['unknown rules',s=>s.run.eliteRules=2],['missing rules',s=>delete s.run.eliteRules],['wrong mode',s=>s.run.mode='challenge'],['low floor',s=>s.run.floor=9],['boss node',s=>s.run.node='boss'],['unknown trait',s=>champion(s).elite.trait='god'],['null trait',s=>champion(s).elite=null],['extra trait field',s=>champion(s).elite.extra=true],['revival type',s=>champion(s).elite.revived=1],['guard revival',s=>champion(s).elite.revived=true],['two champions',s=>s.run.battle.enemies[1].elite={trait:'rage',revived:false}],['boss kind',s=>champion(s).kind='boss'],['shield overflow',s=>champion(s).shield=champion(s).maxHp],['dead but unresolved',s=>champion(s).hp=0],['alive but handled',s=>champion(s).deathHandled=true]
];
for(const [label,alter] of invalid)test(`invalid elite saves reject atomically: ${label}`,()=>{const s=encounter('guard');alter(s);const before=structuredClone(s);assert.throws(()=>copy(s));assert.deepEqual(s,before);});

test('reward and spent revival validation cover post-battle phases as well as active combat',()=>{
  const s=win(encounter('rebirth'));for(const alter of [s=>delete s.run.lastReward.eliteBonus,s=>s.run.lastReward.eliteBonus.gold++,s=>s.run.lastReward.eliteBonus.dust++,s=>s.run.lastReward.eliteBonus.extra=1,s=>champion(s).elite.revived=false,s=>champion(s).deathHandled=false,s=>delete s.run.eliteRules]){const bad=structuredClone(s);alter(bad);assert.throws(()=>copy(bad));}
  for(const stage of ['intro','loot','done']){s.run.victory.stage=stage;copy(s);}
  const ordinary=encounter('guard',{floor:1});win(ordinary);ordinary.run.lastReward.eliteBonus={trait:'guard',gold:84,dust:3};assert.throws(()=>copy(ordinary));
});

test('historical trace projection removes only the neutral rules marker, retaining actual elites and rewards',()=>{
  const s=E.createState();E.startRun(s,42);assert.equal(Object.hasOwn(withoutCombatReport(s).run,'eliteRules'),false);
  for(const trait of Object.keys(ELITE_SEEDS)){const s=encounter(trait);assert.equal(withoutCombatReport(s).run.eliteRules,1);assert.deepEqual(withoutCombatReport(s).run.battle.enemies.find(e=>e.elite).elite,champion(s).elite);win(s);assert.deepEqual(withoutCombatReport(s).run.lastReward.eliteBonus,s.run.lastReward.eliteBonus);}
});

const legacyCases=[['route',s=>{}],['battle',s=>Old.chooseRoute(s,0)],['blessing',s=>{Old.chooseRoute(s,0);win(s,Old);}],['event',s=>{s.run.routes=['event'];Old.chooseRoute(s,0);}],['relic',s=>{s.run.floor=10;s.run.routes=['boss'];Old.chooseRoute(s,0);win(s,Old);}],['result',s=>Old.finishRun(s)]];
const sameLegacy=(s,old)=>{const a=withoutResultLedger(s),b=withoutResultLedger(old);delete a.version;delete b.version;delete a.achievements;delete a.bonds;delete b.achievements;delete b.bonds;delete a.lockedGear;delete a.gearPresets;if(JSON.stringify(a.refining)===JSON.stringify({rolls:0,pending:null}))delete a.refining;if(JSON.stringify(a.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete a.loginRewards;if(JSON.stringify(a.bonds)==='{}')delete a.bonds;if(JSON.stringify(a.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete a.season;delete b.lockedGear;delete b.gearPresets;if(JSON.stringify(b.refining)===JSON.stringify({rolls:0,pending:null}))delete b.refining;if(JSON.stringify(b.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete b.loginRewards;if(JSON.stringify(b.bonds)==='{}')delete b.bonds;if(JSON.stringify(b.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete b.season;assert.deepEqual(a,b);};
for(const [phase,setup] of legacyCases)test(`released 1.31 ${phase} save migrates exactly and keeps old rules on later floors`,()=>{
  const old=Old.createState();Old.startRun(old,42);Object.assign(old.run,{map:null,floor:11,routes:['elite']});setup(old);const before=structuredClone(old),s=copy(old);assert.deepEqual(old,before);assert.equal(s.version,E.SAVE_VERSION);assert.equal(Object.hasOwn(s.run,'eliteRules'),false);sameLegacy(s,old);
  if(phase==='battle'){
    assert.deepEqual(E.playerAction(s,'rook','enemy0'),Old.playerAction(old,'rook','enemy0'));sameLegacy(s,old);
    assert.deepEqual(E.enemyTurn(s),Old.enemyTurn(old));sameLegacy(s,old);
  }else if(phase==='event'){E.chooseEvent(s,'risk');Old.chooseEvent(old,'risk');sameLegacy(s,old);}
  else if(phase==='relic'){E.selectRelic(s,s.run.relicChoices[0]);Old.selectRelic(old,old.run.relicChoices[0]);sameLegacy(s,old);}
  for(const state of [s,old]){state.run.phase='route';state.run.battle=null;state.run.lastReward=null;state.run.victory=null;state.run.node=null;state.run.floor=26;state.run.routes=['elite'];}
  E.chooseRoute(s,0);Old.chooseRoute(old,0);sameLegacy(s,old);assert.equal(champion(s),undefined);copy(s);
});
