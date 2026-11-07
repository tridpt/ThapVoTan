import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/contract-legacy-v1.32.0/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {contractPage,contractDetail,contractTray,contractSkillHint} from '../js/contracts-ui.mjs';
import {towerMapPage} from '../js/tower-map-ui.mjs';
import {victoryPage} from '../js/victory-ui.mjs';
import {eliteRewardNote} from '../js/elites-ui.mjs';
import {withoutCombatReport,withoutResultLedger} from './legacy-report-helper.mjs';
import {offer,boss,sign,combat,neutral,copy,atomic} from './contracts-helper.mjs';

const wallet=s=>[s.gold,s.tickets,s.shards,s.dust,s.inventory.length,s.run.goldEarned,s.run.ticketsEarned];
const hit=events=>events.find(e=>e.target==='enemy0'&&!e.heal);

test('only newly departed normal towers opt into contracts with independent empty state',()=>{
  const s=E.createState();assert.equal(E.SAVE_VERSION,34);E.startRun(s,42);assert.equal(s.run.contractRules,1);assert.deepEqual(s.run.contracts,[]);assert.equal(s.run.contractOffer,null);copy(s);
  const other=E.createState();E.startRun(other,42);s.run.contracts.push({id:'blood',floor:5});assert.deepEqual(other.run.contracts,[]);
  const starts=[s=>E.startChallenge(s,'iron'),s=>E.startCampaign(s,1,42),s=>E.startDungeon(s,'earth',1,new Date(),42),s=>E.startHunt(s,'colossus',1,42)];
  for(const start of starts){const next=E.createState();start(next);assert.equal(E.contractEligible(next.run),false);assert.equal(Object.hasOwn(next.run,'contractRules'),false);atomic(next,()=>E.selectContract(next,'blood',5));}
  const training=E.createTrainingState(other);assert.equal(E.contractEligible(training.run),false);assert.equal(training.run.contracts,undefined);
  const raid=E.createState();raid.best=100;for(const h of HEROES)raid.owned[h.id]={level:1,copies:0,awaken:0};raid.raids.teams=Array.from({length:3},(_,i)=>HEROES.slice(i*3,i*3+3).map(h=>h.id));E.startRaid(raid,1,42);assert.equal(E.contractEligible(raid.run),false);assert.equal(raid.run.contracts,undefined);
});

test('boss pays once before the three fixed contracts; regular victories never offer a contract',()=>{
  for(const floor of [5,10,25]){
    const s=offer({floor}),old=offer({floor,engine:Old});assert.equal(s.run.phase,'contract');assert.deepEqual(s.run.contractOffer,{floor});assert.deepEqual(E.availableContracts(s.run).map(c=>c.id),['blood','ambition','sacrifice']);assert.deepEqual(wallet(s),wallet(old));assert.deepEqual(s.run.lastReward,old.run.lastReward);
    const paid=wallet(s);for(const stage of ['intro','loot','done']){s.run.victory.stage=stage;assert.deepEqual(copy(s),s);contractPage(s.run);}assert.deepEqual(wallet(s),paid);
  }
  const s=combat();for(const e of s.run.battle.enemies)e.hp=1;for(const h of s.run.heroes){if(s.run.phase!=='battle')break;E.playerAction(s,h.id,s.run.battle.enemies.find(e=>e.hp>0).id);}assert.equal(s.run.phase,'blessing');assert.equal(s.run.contractOffer,null);copy(s);
});

test('skip delays only presentation and preserves released relic/blessing/loot RNG exactly',()=>{
  for(let seed=1;seed<=35;seed++){
    const s=offer({seed}),old=offer({seed,engine:Old}),paid=wallet(s);const before=s.run.seed;
    for(let i=0;i<3;i++){contractPage(s.run);contractDetail(s.run,'blood',{review:true});E.availableContracts(s.run);}assert.equal(s.run.seed,before);
    E.selectContract(s,null,5);assert.equal(s.run.phase,'relic');assert.equal(s.run.seed,old.run.seed);assert.deepEqual(s.run.relicChoices,old.run.relicChoices);assert.deepEqual(wallet(s),paid);
    E.selectRelic(s,s.run.relicChoices[0]);Old.selectRelic(old,old.run.relicChoices[0]);assert.deepEqual(s.run.choices,old.run.choices);assert.equal(s.run.seed,old.run.seed);
  }
});

for(const id of ['blood','ambition','sacrifice'])test(`${id}: acceptance is once, remains through JSON resume, and ends on the next departure`,()=>{
  let s=offer();const paid=wallet(s),account=structuredClone([s.owned,s.meta,s.talents,s.equipped]);E.selectContract(s,id,5);assert.deepEqual(s.run.contracts,[{id,floor:5}]);assert.equal(s.run.contractOffer,null);assert.equal(s.run.phase,'relic');assert.deepEqual(wallet(s),paid);assert.deepEqual([s.owned,s.meta,s.talents,s.equipped],account);s=copy(s);atomic(s,()=>E.selectContract(s,id,5));atomic(s,()=>E.selectContract(s,null,5));E.selectRelic(s,s.run.relicChoices[0]);E.selectBlessing(s,s.run.choices[0]);s=copy(s);assert.equal(E.hasContract(s.run,id),true);boss(s,10);assert.equal(E.availableContracts(s.run).some(c=>c.id===id),false);atomic(s,()=>E.selectContract(s,id,10));E.finishRun(s);copy(s);E.startRun(s,42);assert.deepEqual(s.run.contracts,[]);assert.equal(E.hasContract(s.run,id),false);
});

test('unknown choices, old floor buttons, absent offers and mode changes reject without spending anything',()=>{
  const s=offer();for(const id of ['constructor','bogus',undefined,{},1])atomic(s,()=>E.selectContract(s,id,5));for(const floor of [0,10,'5',NaN,undefined])atomic(s,()=>E.selectContract(s,'blood',floor));
  sign(s,'blood');boss(s,10);atomic(s,()=>E.selectContract(s,'sacrifice',5));E.selectContract(s,'sacrifice',10);atomic(s,()=>E.selectContract(s,'ambition',10));
});

test('all three unique contracts coexist and a later boss proceeds directly to relics',()=>{
  const s=offer();sign(s,'blood');boss(s,10);sign(s,'ambition');boss(s,15);sign(s,'sacrifice');assert.deepEqual(s.run.contracts.map(c=>c.id),['blood','ambition','sacrifice']);boss(s,20);assert.equal(s.run.phase,'relic');assert.equal(s.run.contractOffer,null);assert.deepEqual(E.availableContracts(s.run),[]);copy(s);
});

test('blood reduces the current HP cap once, clamps only excess HP, and never revives or touches account stats',()=>{
  const s=offer(),r=s.run;r.heroes.forEach((h,i)=>{h.maxHp=1000;h.hp=[1000,500,0][i];});const account=structuredClone(s.owned),stats=r.heroes.map(h=>E.heroStats(s,h.id));const preview=contractDetail(r,'blood',{review:true});assert.match(preview,/1\.000 → <b>850/);assert.match(preview,/Đã gục · Giữ 0/);E.selectContract(s,'blood',5);assert.deepEqual(r.heroes.map(h=>[h.maxHp,h.hp]),[[850,850],[850,500],[850,0]]);assert.deepEqual(s.owned,account);assert.deepEqual(r.heroes.map(h=>E.heroStats(s,h.id)),stats);copy(s);atomic(s,()=>E.selectContract(s,'blood',5));
  E.selectRelic(s,r.relicChoices[0]);r.choices=['vitality','might','focus'];E.selectBlessing(s,'vitality');assert.equal(r.heroes[0].maxHp,850+Math.round(850*.18));copy(s);
});

for(const action of ['attack','skill','link','pet','burn','echo','void','cinder','mirror'])test(`blood increases ${action} damage once, including shared effects and actual MVP damage`,()=>{
  const s=combat(['blood'],{team:['kira','rook','lumi']}),r=s.run;
  if(action==='link')r.link.charge=100;
  if(action==='pet')r.pet={id:'vermillion',level:1,nextRound:1};
  if(action==='burn'){r.battle.enemies[0].burn=1;r.battle.enemies[0].burnPower=100;for(const e of r.battle.enemies)e.freeze=1;}
  if(action==='echo')r.heroes[0].loadout={sets:[{id:'bloodmoon',count:1}],signature:'kira',weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
  if(action==='void'){r.heroes[0].loadout={sets:[{id:'void',count:3}],signature:null,weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};r.battle.enemies[0].voidMarks=2;}
  if(action==='cinder'){r.relics=['cinder'];Object.assign(r.battle.enemies[0],{hp:1,maxHp:100,burn:1,burnPower:1});}
  if(action==='mirror'){r.relics=['mirror'];r.heroes[0].shield=1;r.battle.enemies=r.battle.enemies.slice(0,1);}
  const base=neutral(s),apply=state=>action==='link'?E.linkAction(state,'kira','rook','enemy0'):action==='pet'?E.petAction(state):['burn','mirror'].includes(action)?E.enemyTurn(state):E.playerAction(state,'kira','enemy0',['skill','echo'].includes(action));
  const ordinary=apply(base),boosted=apply(s),b=boosted.filter(e=>e.target.startsWith('enemy')&&!e.heal),a=ordinary.filter(e=>e.target.startsWith('enemy')&&!e.heal);
  assert.equal(b.length,a.length);assert.ok(a.some(e=>e.value>1),action);
  for(let i=0;i<a.length;i++){
    if(a[i].value===1)assert.equal(b[i].value,1);else if(action==='void'&&i===0){assert.equal(b[i].voidBurst,Math.round(a[i].voidBurst*1.25));assert.equal(b[i].value-b[i].voidBurst,Math.round((a[i].value-a[i].voidBurst)*1.25));}
    else assert.equal(b[i].value,Math.round(a[i].value*1.25),action);
  }
  const total=Object.values(r.battle.statistics.rows).reduce((n,row)=>n+row.damage,0);assert.ok(total>=b.reduce((n,e)=>n+e.value,0));
});

for(const actor of ['aerin','astra','ember','rook','lumi','kira'])test(`sacrifice charges ${actor} once per skill, including AoE, shield, healing and echo`,()=>{
  const s=combat(['sacrifice'],{team:[actor,...['rook','lumi','aerin'].filter(id=>id!==actor).slice(0,2)]}),h=s.run.heroes[0];
  if(actor==='kira')h.loadout={sets:[{id:'bloodmoon',count:1}],signature:'kira',weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
  h.maxHp=1001;h.hp=900;h.shield=500;const events=E.playerAction(s,actor,'enemy0',true),costs=events.filter(e=>e.contractCost);assert.equal(costs.length,1);assert.equal(costs[0].value,51);assert.equal(h.shield>=500,true);assert.equal(h.energy,0);if(!['lumi','rook'].includes(actor))assert.equal(h.hp,849);atomic(s,()=>E.playerAction(s,actor,'enemy0',true));assert.equal(events.filter(e=>e.contractCost).length,1);copy(s);
});

test('sacrifice bypasses shield, leaves one HP, does not trigger a revive and charges only committed skills',()=>{
  for(const hp of [1,2,30,50,51]){
    const s=combat(['sacrifice']),h=s.run.heroes[1];h.hp=hp;h.shield=999;s.run.relics=['lantern'];const expected=Math.min(hp-1,50);const before=structuredClone(s);h.energy=99;atomic(s,()=>E.playerAction(s,h.id,'enemy0',true));h.energy=100;atomic(s,()=>E.playerAction(s,h.id,'enemy0',true,'bogus'));assert.equal(h.hp,hp);const events=E.playerAction(s,h.id,'enemy0',true);assert.equal(h.hp,hp-expected);assert.equal(h.shield,999);assert.equal(s.run.relicUsed.lantern,false);assert.equal(events.filter(e=>e.contractCost).reduce((n,e)=>n+e.value,0),expected);assert.deepEqual(s.owned,before.owned);
  }
});

test('sacrifice boosts skill damage, healing, shield, awakenings and signature but preserves link, pet and basic actions',()=>{
  for(const actor of ['aerin','lumi','rook','kira','thorne','ember']){
    const s=combat(['sacrifice'],{team:[actor,...['rook','lumi','aerin'].filter(id=>id!==actor).slice(0,2)]}),r=s.run,h=r.heroes[0];r.heroes.forEach(a=>a.hp=200);h.awaken=1;
    if(actor==='rook')h.loadout={sets:[{id:'bastion',count:1}],signature:'rook',weaponRarity:'SSR',affixes:{crit:0,drain:0,energy:0}};
    const base=neutral(s),plain=E.playerAction(base,actor,'enemy0',true),enhanced=E.playerAction(s,actor,'enemy0',true);
    if(actor==='lumi')assert.equal(enhanced.find(e=>e.heal).value,Math.round(plain.find(e=>e.heal).value*1.3));
    else assert.ok(hit(enhanced).value>hit(plain).value);
    if(actor==='rook')assert.ok(r.heroes[1].shield>base.run.heroes[1].shield);
    if(actor==='ember')assert.equal(r.battle.enemies[0].burnPower,Math.round(base.run.battle.enemies[0].burnPower*1.3));
  }
  for(const action of ['attack','link','pet']){
    const s=combat(['sacrifice']),r=s.run;r.link.charge=100;r.pet={id:'mossling',level:1,nextRound:1};const base=neutral(s),apply=state=>action==='attack'?E.playerAction(state,'aerin','enemy0'):action==='link'?E.linkAction(state,'aerin','rook','enemy0'):E.petAction(state);
    assert.deepEqual(apply(s),apply(base));assert.deepEqual(r.heroes,base.run.heroes);
  }
});

test('blood and sacrifice multiply once together and skill HP payment never receives enemy damage bonuses',()=>{
  const s=combat(['blood','sacrifice','ambition']),base=neutral(s),h=s.run.heroes[1];const a=E.playerAction(base,'aerin','enemy0',true),b=E.playerAction(s,'aerin','enemy0',true);assert.equal(hit(b).value,Math.round(Math.round(hit(a).value*1.3)*1.25));assert.equal(b.find(e=>e.contractCost).value,50);assert.equal(h.hp,850);copy(s);
});

for(const node of ['battle','boss'])test(`ambition increases incoming ${node} hits before shields, respecting defenses and formation`,()=>{
  const s=combat(['ambition'],{node}),r=s.run;r.heroes.forEach(h=>{h.shield=10000;h.def=20;});r.buffs=['armor'];if(node==='boss')r.battle.bossState.phase=2;const base=neutral(s),plain=E.enemyTurn(base),boost=E.enemyTurn(s);assert.equal(boost.length,plain.length);for(let i=0;i<plain.length;i++)assert.ok(Math.abs(boost[i].shield-plain[i].shield*1.15)<=1);assert.ok(r.heroes.every(h=>h.hp===900));copy(s);
});

test('ambition pays battle and treasure gold into wallet, run totals, reward UI and summary exactly once',()=>{
  const s=combat(['ambition']),r=s.run;r.buffs=['fortune','fortune'];const base=neutral(s),money=s.gold;
  const win=state=>{state.run.battle.enemies.forEach(e=>e.hp=1);for(const h of state.run.heroes){if(state.run.phase!=='battle')break;E.playerAction(state,h.id,state.run.battle.enemies.find(e=>e.hp>0).id);}};win(base);win(s);const expected=Math.round(base.run.lastReward.gold*1.4);assert.equal(r.lastReward.gold,expected);assert.equal(s.gold-money,expected);assert.equal(r.goldEarned-base.run.goldEarned,expected-base.run.lastReward.gold);const paid=wallet(s);E.advanceVictory(s);E.advanceVictory(s);assert.deepEqual(wallet(s),paid);copy(s);E.selectBlessing(s,r.choices[0]);Object.assign(r,{routes:['treasure'],map:null});const before=s.gold,res=E.chooseRoute(s,0);assert.equal(res.gold,Math.round((120+(r.floor-1)*18)*1.4));assert.equal(s.gold-before,res.gold);E.finishRun(s);assert.equal(r.summary.gold,r.goldEarned);copy(s);
});

test('ambition includes elite bonus gold while preserving dust, loot conversion and tickets',()=>{
  const s=combat(['ambition']),r=s.run;r.eliteRules=1;r.floor=11;r.cleared=10;r.battle.enemies[0].elite={trait:'rage',revived:false};const base=neutral(s);while(s.inventory.length<E.GEAR_LIMIT){E.dropGear(s,()=>.5,1,'treasure');E.dropGear(base,()=>.5,1,'treasure');}
  for(const state of [s,base]){for(const e of state.run.battle.enemies)e.hp=1;for(const h of state.run.heroes){if(state.run.phase!=='battle')break;E.playerAction(state,h.id,state.run.battle.enemies.find(e=>e.hp>0).id);}}
  assert.equal(r.lastReward.gold,Math.round(base.run.lastReward.gold*1.4));assert.deepEqual(r.lastReward.eliteBonus,base.run.lastReward.eliteBonus);assert.equal(s.dust,base.dust);assert.deepEqual(r.lastReward.loot,base.run.lastReward.loot);assert.equal(r.lastReward.loot.converted,true);assert.equal(s.tickets,base.tickets);assert.match(eliteRewardNote(r),/thưởng gốc thêm/);assert.match(eliteRewardNote(r),/Tham vọng \+40% đã áp dụng/);copy(s);
});

test('ambition leaves account quests, duplicate summons, event payments and gear dust unchanged',()=>{
  const s=sign(offer(),'ambition'),base=neutral(s);
  for(const state of [s,base]){state.best=5;E.claimMilestone(state,5);E.claimDaily(state,'runs');E.summon(state,1,()=>.99);state.run.map=null;state.run.routes=['event'];E.chooseRoute(state,0);E.chooseEvent(state,'trade');}
  assert.deepEqual(wallet(s),wallet(base));assert.deepEqual(s.owned,base.owned);copy(s);
});

test('retreat from a pending contract counts the boss cleared and retains all already paid rewards',()=>{
  const s=offer(),paid=wallet(s);E.finishRun(s);assert.equal(s.run.phase,'result');assert.equal(s.run.summary.cleared,5);assert.equal(s.best,5);assert.equal(s.run.contractOffer,null);assert.deepEqual(wallet(s),paid);copy(s);atomic(s,()=>E.selectContract(s,'blood',5));
});

const invalid=[
  ['rules missing',s=>delete s.run.contractRules],['rules unknown',s=>s.run.contractRules=2],['contract list missing',s=>delete s.run.contracts],['list object',s=>s.run.contracts={}],['offer missing',s=>delete s.run.contractOffer],['wrong mode',s=>s.run.mode='challenge'],['offer unknown field',s=>s.run.contractOffer.extra=1],['offer null',s=>s.run.contractOffer=null],['wrong boss floor',s=>s.run.contractOffer.floor=10],['offer outside phase',s=>s.run.phase='relic'],['boss not dead',s=>s.run.battle.enemies[0].hp=1],['reward not boss',s=>s.run.lastReward.boss=false],['unknown contract',s=>s.run.contracts=[{id:'constructor',floor:5}]],['null signature',s=>s.run.contracts=[null]],['future signature',s=>s.run.contracts=[{id:'blood',floor:10}]],['non-boss signature',s=>s.run.contracts=[{id:'blood',floor:3}]],['signed same offer',s=>s.run.contracts=[{id:'blood',floor:5}]],['list too long',s=>s.run.contracts=new Array(4).fill({id:'blood',floor:5})]
];
for(const [label,alter] of invalid)test(`contract import rejects atomically: ${label}`,()=>{const s=offer();alter(s);atomic(s,()=>copy(s));});

test('accepted contract history rejects duplicates, reverse order, extra fields and impossible current-floor state',()=>{
  const s=combat(['blood','ambition']);for(const alter of [s=>s.run.contracts[1].id='blood',s=>s.run.contracts.reverse(),s=>s.run.contracts[1].floor=5,s=>s.run.contracts[0].extra=1,s=>s.run.contracts[1].floor=s.run.floor,s=>s.run.contractOffer={floor:s.run.floor}]){const bad=structuredClone(s);alter(bad);atomic(bad,()=>copy(bad));}
});

const sameLegacy=(s,old)=>{const a=withoutResultLedger(s),b=withoutResultLedger(old);delete a.version;delete b.version;delete a.achievements;delete a.bonds;delete b.achievements;delete b.bonds;delete a.lockedGear;delete a.gearPresets;if(JSON.stringify(a.refining)===JSON.stringify({rolls:0,pending:null}))delete a.refining;if(JSON.stringify(a.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete a.loginRewards;if(JSON.stringify(a.bonds)==='{}')delete a.bonds;if(JSON.stringify(a.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete a.season;delete b.lockedGear;delete b.gearPresets;if(JSON.stringify(b.refining)===JSON.stringify({rolls:0,pending:null}))delete b.refining;if(JSON.stringify(b.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete b.loginRewards;if(JSON.stringify(b.bonds)==='{}')delete b.bonds;if(JSON.stringify(b.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete b.season;assert.deepEqual(a,b);};
const legacyCases=[['route',s=>{}],['battle',s=>Old.chooseRoute(s,0)],['blessing',s=>{s.run.routes=['rest'];Old.chooseRoute(s,0);}],['event',s=>{s.run.routes=['event'];Old.chooseRoute(s,0);}],['relic',s=>boss(s,5,Old)],['result',s=>Old.finishRun(s)]];
for(const [phase,setup] of legacyCases)test(`released 1.32 ${phase} migrates and keeps old combat, boss choices, rewards and RNG throughout the journey`,()=>{
  const old=Old.createState();Old.startRun(old,42);old.run.map=null;setup(old);const before=structuredClone(old),s=copy(old);assert.deepEqual(old,before);assert.equal(s.version,E.SAVE_VERSION);assert.equal(s.run.contractRules,undefined);sameLegacy(s,old);
  if(phase==='battle'){assert.deepEqual(E.playerAction(s,'rook','enemy0'),Old.playerAction(old,'rook','enemy0'));sameLegacy(s,old);assert.deepEqual(E.enemyTurn(s),Old.enemyTurn(old));sameLegacy(s,old);}
  if(phase==='relic'){E.selectRelic(s,s.run.relicChoices[0]);Old.selectRelic(old,old.run.relicChoices[0]);sameLegacy(s,old);}
  if(phase==='event'){E.chooseEvent(s,'risk');Old.chooseEvent(old,'risk');sameLegacy(s,old);}
  boss(s,15);boss(old,15,Old);assert.equal(s.run.phase,'relic');sameLegacy(s,old);copy(s);E.selectRelic(s,s.run.relicChoices[0]);Old.selectRelic(old,old.run.relicChoices[0]);E.selectBlessing(s,s.run.choices[0]);Old.selectBlessing(old,old.run.choices[0]);sameLegacy(s,old);E.finishRun(s);E.startRun(s,42);assert.equal(s.run.contractRules,1);
});

test('trace projection removes only neutral contract defaults and retains pending offers and signed effects',()=>{
  const s=E.createState();E.startRun(s,42);assert.equal(withoutCombatReport(s).run.contractRules,undefined);const pending=offer();assert.deepEqual(withoutCombatReport(pending).run.contractOffer,{floor:5});sign(pending,'blood');assert.deepEqual(withoutCombatReport(pending).run.contracts,[{id:'blood',floor:5}]);
});

test('contract UI previews explicit benefits, costs, duration, HP changes, unique signatures and a safe skip without mutating RNG',()=>{
  const s=offer(),before=structuredClone(s),html=contractPage(s.run);assert.equal((html.match(/data-action="contract-review"/g)||[]).length,3);assert.match(html,/data-action="contract-skip" data-floor="5"/);for(const text of ['25%','15%','40%','30%','5%','Mỗi loại chỉ ký một lần'])assert.ok(html.includes(text));assert.match(contractDetail(s.run,'blood',{review:true}),/Máu sau khi ký/);assert.match(contractDetail(s.run,'sacrifice',{review:true}),/trước khi thi triển/);assert.equal(contractDetail(s.run,'constructor',{review:true}),'');assert.equal(contractDetail(s.run,'ambition'),'');assert.deepEqual(s,before);
  sign(s,'sacrifice');assert.match(contractTray(s.run),/Đánh đổi sinh lực/);assert.match(contractSkillHint(s.run,s.run.heroes[0]),/Hiến/);boss(s,10);assert.match(contractPage(s.run),/Đang có hiệu lực/);assert.equal(contractDetail(s.run,'sacrifice',{review:true}),'');assert.match(contractDetail(s.run,'sacrifice'),/ĐÃ KÝ Ở TẦNG 5/);
});

test('map and victory previews expose the next contract step and show ambition treasure income exactly',()=>{
  const s=E.createState();E.startRun(s,42);assert.match(towerMapPage(s,'5:1'),/Khế ước bóng tối/);const pending=offer();pending.run.victory.stage='loot';assert.match(victoryPage(pending),/Chọn khế ước/);const active=sign(offer(),'ambition');active.run.map=E.starterTowerMap(42);active.run.map.start=6;E.advanceTowerMap(active.run);const treasure=E.towerMapView(active.run).nodes.find(n=>n.type==='treasure');if(treasure)assert.ok(towerMapPage(active,treasure.id).includes(E.contractGold(active.run,120+treasure.floor*18).toLocaleString('vi-VN')+' vàng'));
});
