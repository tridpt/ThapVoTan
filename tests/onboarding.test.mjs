import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/novice-legacy-v1.25.0/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {tutorialCue,tutorialCoach,mountTutorialHighlight,novicePanel,noviceSsrDetail} from '../js/onboarding-ui.mjs';
import {questReady} from '../js/game-ui.mjs';
import {withoutCombatReport,withoutResultLedger} from './legacy-report-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const neutral=s=>{const out=withoutResultLedger(s);delete out.version;if(out.run)delete out.run.balanceRules;delete out.achievements;delete out.bonds;delete out.lockedGear;delete out.gearPresets;if(JSON.stringify(out.refining)===JSON.stringify({rolls:0,pending:null}))delete out.refining;if(JSON.stringify(out.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete out.loginRewards;if(JSON.stringify(out.bonds)==='{}')delete out.bonds;if(JSON.stringify(out.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete out.season;delete out.onboarding;if(out.run?.contractRules===1&&out.run.contracts.length===0&&out.run.contractOffer===null){delete out.run.contractRules;delete out.run.contracts;delete out.run.contractOffer;}if(out.run?.eliteRules===1&&out.run.floor<10&&!out.run.battle?.enemies.some(e=>e.elite)&&!out.run.lastReward?.eliteBonus)delete out.run.eliteRules;return out;};
function battle(s=E.createState()){
  E.startRun(s,42);E.chooseRoute(s,s.run.routes.findIndex(x=>['battle','elite','boss'].includes(x)));return s;
}
function lesson(step){const s=E.createState();s.onboarding={...E.starterOnboarding(),status:'active',completed:E.TUTORIAL_STEPS.slice(0,E.TUTORIAL_STEPS.indexOf(step))};s.welcome=true;return s;}
function prizes(){const s=E.createState();s.totalSummons=1;s.best=10;E.equipGear(s,'gear-1','rook');for(const q of E.NOVICE_MISSIONS)E.claimNoviceMission(s,q.id);return s;}
const atomic=(s,fn)=>{const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);};

test('fresh onboarding is neutral, independent and exposes nine real lessons and three SSR choices',()=>{
  const a=E.createState(),b=E.createState();assert.equal(a.version,E.SAVE_VERSION);assert.deepEqual(a.onboarding,E.starterOnboarding());assert.equal(E.tutorialStep(a),null);assert.equal(E.noviceReady(a),false);assert.equal(questReady(a),false);assert.equal(E.TUTORIAL_STEPS.length,9);assert.deepEqual(E.NOVICE_SSR,['astra','nyx','kael']);
  E.beginTutorial(a);assert.equal(E.tutorialStep(a),'summon');assert.equal(a.welcome,true);assert.deepEqual(b.onboarding,E.starterOnboarding());copy(a);
});

test('successful summon, assignment and equipment advance in order while invalid attempts are atomic',()=>{
  let s=E.createState();E.beginTutorial(s);atomic(s,()=>E.summon(s,2));E.setTeamSlot(s,'rook',1);E.equipGear(s,'gear-1','rook');assert.equal(E.tutorialStep(s),'summon');
  E.summon(s,1,()=>.99);assert.equal(E.tutorialStep(s),'team');s=copy(s);atomic(s,()=>E.setTeamSlot(s,'astra',0));E.setTeamSlot(s,'rook',0);assert.equal(E.tutorialStep(s),'gear');atomic(s,()=>E.equipGear(s,'missing','rook'));E.equipGear(s,'gear-1','rook');assert.equal(E.tutorialStep(s),'depart');copy(s);
});

test('real normal combat teaches target, attack, enemy turn and a charged skill with no extra combat effects',()=>{
  const old=Old.createState();old.welcome=true;Old.startRun(old,42);Old.chooseRoute(old,0);const s=copy(old);s.onboarding=lesson('target').onboarding;
  assert.equal(E.recordTutorialTarget(s,'enemy0'),true);assert.equal(E.tutorialStep(s),'attack');atomic(s,()=>E.playerAction(s,'rook','enemy0',true));
  let turns=0;
  while(E.tutorialStep(s)!==null&&turns++<12){
    if(s.run.phase!=='battle')break;
    const actor=s.run.heroes.find(h=>h.hp>0&&!s.run.battle.used.includes(h.id));
    if(actor){const skill=E.tutorialStep(s)==='skill'&&actor.energy>=100;assert.deepEqual(E.playerAction(s,actor.id,'enemy0',skill),Old.playerAction(old,actor.id,'enemy0',skill));}
    else {assert.deepEqual(E.enemyTurn(s),Old.enemyTurn(old));}
    assert.deepEqual(neutral(s),neutral(old));copy(s);
  }
  assert.equal(s.onboarding.status,'done');assert.equal(s.onboarding.completed.length,9);atomic(s,()=>E.beginTutorial(s));
});

test('departure and route lessons catch up only when entering or selecting a target in a real normal battle',()=>{
  let s=lesson('depart');E.startRun(s,42);assert.equal(E.tutorialStep(s),'route');atomic(s,()=>E.chooseRoute(s,99));E.chooseRoute(s,0);assert.equal(E.tutorialStep(s),'target');
  s=battle();s.onboarding=lesson('depart').onboarding;const run=structuredClone(s.run);atomic(s,()=>E.recordTutorialTarget(s,'missing'));assert.equal(E.recordTutorialTarget(s,'enemy0'),true);assert.equal(E.tutorialStep(s),'attack');assert.deepEqual(s.run,run);
  s=lesson('depart');E.startRun(s,42);s.onboarding=lesson('depart').onboarding;E.chooseRoute(s,0);assert.equal(E.tutorialStep(s),'target');
});

test('skipping, saving and resuming preserve the current step, claims, RNG and active battle',()=>{
  let s=battle(lesson('depart'));E.recordTutorialTarget(s,'enemy0');const before=structuredClone(s.run);E.skipTutorial(s);assert.equal(E.tutorialStep(s),null);s=copy(s);E.playerAction(s,'rook','enemy0');assert.equal(s.onboarding.completed.length,6);E.beginTutorial(s);assert.equal(E.tutorialStep(s),'attack');assert.equal(s.run.seed!==before.seed,true);const active=structuredClone(s.run);s=copy(s);assert.deepEqual(s.run,active);assert.equal(E.tutorialStep(s),'attack');
});

test('inactive and skipped guides leave every original summon and combat field unchanged',()=>{
  for(const skipped of [false,true]){
    const a=E.createState(),b=Old.createState();a.welcome=b.welcome=true;if(skipped)E.skipTutorial(a);
    for(let i=0;i<10;i++)assert.deepEqual(E.summon(a,1,()=>.35),Old.summon(b,1,()=>.35));
    E.equipGear(a,'gear-1','rook');Old.equipGear(b,'gear-1','rook');E.startRun(a,42);delete a.run.balanceRules;delete a.run.anomalyRules;delete a.run.anomalyOrder;Old.startRun(b,42);b.run.started=a.run.started;E.chooseRoute(a,0);Old.chooseRoute(b,0);E.playerAction(a,'rook','enemy0');Old.playerAction(b,'rook','enemy0');E.enemyTurn(a);Old.enemyTurn(b);assert.deepEqual(neutral(a),neutral(b));assert.equal(a.onboarding.completed.length,0);
  }
});

test('training and other combat modes cannot satisfy normal tower lessons or novice floor goals',()=>{
  const s=lesson('target');E.startHunt(s,'colossus',1,42);assert.equal(E.recordTutorialTarget(s,'enemy0'),false);E.playerAction(s,'rook','enemy0');E.enemyTurn(s);assert.equal(E.tutorialStep(s),'target');assert.equal(E.noviceMissionStatus(s,'floor3').progress,0);
  const p=E.createTrainingState(prizes(),{level:20,boss:'colossus',difficulty:1});const before=structuredClone(p.onboarding);E.recordTutorialProgress(p,'summon');atomic(p,()=>E.beginTutorial(p));atomic(p,()=>E.skipTutorial(p));atomic(p,()=>E.claimNoviceSsr(p,'astra'));assert.equal(E.noviceReady(p),false);assert.deepEqual(p.onboarding,before);
});

test('five novice goals unlock sequentially, credit exactly 15 tickets and 1500 gold and never pay twice',()=>{
  let s=E.createState();s.best=10;s.totalSummons=1;E.equipGear(s,'gear-1','rook');const wallet=[s.tickets,s.gold];assert.equal(questReady(s),true);
  atomic(s,()=>E.claimNoviceMission(s,'floor10'));
  for(const q of E.NOVICE_MISSIONS){assert.equal(E.noviceMissionStatus(s,q.id).ready,true);E.claimNoviceMission(s,q.id);s=copy(s);atomic(s,()=>E.claimNoviceMission(s,q.id));}
  assert.equal(s.tickets,wallet[0]+15);assert.equal(s.gold,wallet[1]+1500);assert.equal(E.noviceSsrReady(s),true);assert.equal(questReady(s),true);E.claimNoviceSsr(s,'astra');assert.equal(E.noviceReady(s),false);
});

test('novice floor milestones use cleared normal floors and do not need tutorial participation',()=>{
  const s=E.createState();E.skipTutorial(s);E.summon(s,1,()=>.99);E.claimNoviceMission(s,'summon');atomic(s,()=>E.claimNoviceMission(s,'gear'));E.equipGear(s,'gear-1','rook');E.claimNoviceMission(s,'gear');
  for(const [floor,id] of [[3,'floor3'],[5,'floor5'],[10,'floor10']]){s.best=floor-1;assert.equal(E.noviceMissionStatus(s,id).ready,false);s.best=floor;E.claimNoviceMission(s,id);}
  assert.equal(s.onboarding.status,'skipped');assert.deepEqual(s.onboarding.completed,[]);assert.equal(E.noviceSsrReady(s),true);
});

test('completed gear lesson remains eligible after the player removes or dismantles that item',()=>{
  const s=lesson('gear');E.equipGear(s,'gear-1','rook');E.unequipGear(s,'gear-1');E.dismantleGear(s,'gear-1');assert.equal(E.noviceMissionStatus(s,'gear').progress,1);copy(s);
});

test('mission and duplicate SSR caps reject before changing claims, heroes or resources',()=>{
  for(const key of ['gold','tickets']){const s=E.createState();s.totalSummons=1;s[key]=1e9;atomic(s,()=>E.claimNoviceMission(s,'summon'));}
  for(const key of ['gold','shards','copies']){const s=prizes();s.owned.astra={level:30,copies:2,awaken:1};if(key==='copies')s.owned.astra.copies=1e9;else s[key]=1e9;atomic(s,()=>E.claimNoviceSsr(s,'astra'));}
});

for(const id of ['astra','nyx','kael'])test(`novice SSR ${id} grants once, restores on reload and preserves pity, snapshots and team`,()=>{
  let s=prizes();E.setSummonTarget(s,id);s.summoning.guaranteed.SSR=true;E.startRun(s,42);const before=structuredClone(s);const reward=E.claimNoviceSsr(s,id);assert.equal(reward.isNew,true);assert.deepEqual(s.owned[id],{level:1,copies:0,awaken:0});assert.equal(s.onboarding.ssr,id);assert.deepEqual(s.run,before.run);assert.deepEqual(s.team,before.team);assert.deepEqual(s.summoning,before.summoning);for(const k of ['pity','srPity','highPity','tickets','gold','shards','totalSummons'])assert.deepEqual(s[k],before[k],k);s=copy(s);atomic(s,()=>E.claimNoviceSsr(s,id));
});

test('owned SSR yields the standard duplicate with existing talents, level and awakening preserved',()=>{
  const s=prizes();s.owned.astra={level:20,copies:4,awaken:2};E.learnTalent(s,'astra','force');const before=structuredClone(s);const reward=E.claimNoviceSsr(s,'astra');assert.deepEqual(reward,{id:'astra',isNew:false,gold:180,shards:12});assert.deepEqual(s.owned.astra,{level:20,copies:5,awaken:2});assert.deepEqual(s.talents,before.talents);assert.equal(s.gold,before.gold+180);assert.equal(s.shards,before.shards+12);copy(s);assert.match(noviceSsrDetail(before,'astra'),/\+1 bản trùng Astra, \+12 tinh thạch và \+180 vàng/);
});

test('unearned, unknown and already received SSR claims are atomic',()=>{
  let s=E.createState();atomic(s,()=>E.claimNoviceSsr(s,'astra'));s=prizes();for(const id of ['aerin','aion','constructor',null])atomic(s,()=>E.claimNoviceSsr(s,id));E.claimNoviceSsr(s,'nyx');for(const id of ['astra','nyx','kael'])atomic(s,()=>E.claimNoviceSsr(s,id));
});

test('current save validation rejects malformed tutorial, unordered steps, claims, status and SSR history',()=>{
  const changes=[s=>delete s.onboarding,s=>s.onboarding=null,s=>s.onboarding=[],s=>s.onboarding.extra=true,s=>s.onboarding.status='bad',s=>s.onboarding.completed=['team'],s=>s.onboarding.completed=['summon','summon'],s=>s.onboarding.completed=['summon'],s=>s.onboarding.status='done',s=>{s.onboarding.status='active';s.onboarding.completed=[...E.TUTORIAL_STEPS];},s=>s.onboarding.claimed=['floor3'],s=>s.onboarding.claimed=['summon','summon'],s=>s.onboarding.ssr='astra',s=>{s.onboarding.claimed=E.NOVICE_MISSIONS.map(q=>q.id);s.onboarding.ssr='astra';},s=>s.onboarding.completed=new Array(1)];
  for(const change of changes){const s=E.createState();change(s);atomic(s,()=>E.validateState(s));}
});

test('historical saves cannot inject earned onboarding before its introduction',()=>{
  for(const change of [s=>s.onboarding={...E.starterOnboarding(),status:'active'},s=>s.onboarding={...E.starterOnboarding(),claimed:['summon']},s=>s.onboarding={...E.starterOnboarding(),completed:['summon']},s=>s.onboarding={}]){const s=Old.createState();change(s);atomic(s,()=>E.validateState(s));}
  const s=Old.createState();s.onboarding={ssr:null,claimed:[],completed:[],status:'available'};assert.deepEqual(copy(s).onboarding,E.starterOnboarding());
});

const legacyCases=[
  ['fresh',s=>s],['targeted',s=>{Old.setSummonTarget(s,'astra');s.tickets=100;Old.summon(s,10,()=>.03);}],
  ['route',s=>Old.startRun(s,42)],['battle',s=>{Old.startRun(s,42);Old.chooseRoute(s,0);Old.playerAction(s,'rook','enemy0');}],
  ['blessing',s=>{battleLegacy(s);s.run.heroes[0].atk=100000;while(s.run.phase==='battle'){s.run.battle.used=[];Old.playerAction(s,'rook',s.run.battle.enemies.find(e=>e.hp>0).id);}}],
  ['result',s=>{Old.startRun(s,42);Old.finishRun(s);}],['campaign',s=>Old.startCampaign(s,1,42)],['hunt',s=>Old.startHunt(s,'colossus',1,42)],
  ['raid',s=>{s.best=100;for(const h of HEROES)s.owned[h.id]={level:20,copies:0,awaken:0};Old.autoRaidTeams(s);Old.startRaid(s,1,42);}],
  ['dragon',s=>{s.best=100;for(const h of HEROES)s.owned[h.id]={level:20,copies:0,awaken:0};Old.autoRaidTeams(s);for(const tier of [0,1])s.raids.records[tier]={clears:1,bestRounds:12,fullParty:true,claimed:['first']};Old.startRaid(s,1,42,'void-dragon');}],
  ['equipped veteran',s=>{s.best=30;s.totalSummons=80;s.welcome=true;Old.equipGear(s,'gear-1','rook');}]
];
function battleLegacy(s){Old.startRun(s,42);Old.chooseRoute(s,0);}
for(const [kind,setup] of legacyCases)test(`APK save v20 ${kind}: neutral onboarding migration preserves all original fields and next action`,()=>{
  const old=Old.createState();setup(old);const before=structuredClone(old),s=copy(old);assert.equal(old.version,20);assert.deepEqual(old,before);assert.deepEqual(s.onboarding,E.starterOnboarding());assert.deepEqual(neutral(s),neutral(old));assert.deepEqual(copy(s),s);
  if(old.run?.phase==='battle'){const h=old.run.heroes.find(h=>h.hp>0&&!old.run.battle.used.includes(h.id));const skill=h.energy>=100;Old.playerAction(old,h.id,'enemy0',skill);E.playerAction(s,h.id,'enemy0',skill);assert.deepEqual(neutral(s),neutral(old));}
});

test('archived v2 backup reaches save21 with neutral onboarding and its exact inventory',()=>{
  const raw=JSON.parse(readFileSync(new URL('../artifacts/qa/browser-v1.1-backup.json',import.meta.url),'utf8')),old=raw.state||raw,before=structuredClone(old),s=copy(old);assert.equal(old.version,2);assert.equal(s.version,E.SAVE_VERSION);assert.deepEqual(s.onboarding,E.starterOnboarding());assert.deepEqual(old,before);assert.deepEqual(s.inventory,old.inventory);
});

test('legacy combat projection removes only exact neutral onboarding and keeps all meaningful progress',()=>{
  assert.equal(Object.hasOwn(withoutCombatReport(E.createState()),'onboarding'),false);
  for(const change of [s=>E.beginTutorial(s),s=>E.skipTutorial(s),s=>{s.totalSummons=1;E.claimNoviceMission(s,'summon');},s=>s.onboarding.extra=true]){const s=E.createState();change(s);assert.deepEqual(withoutCombatReport(s).onboarding,s.onboarding);}
});

test('guide cues explain modal, map, empty wallet, gear and interrupted combat without spending resources',()=>{
  const s=lesson('summon'),before=structuredClone(s);assert.match(tutorialCoach(s,{page:'home'}),/Đi tới bước này/);assert.equal(tutorialCue(s,{page:'summon'}).selectors[0],'[data-action="summon"][data-count="1"]:not([disabled])');assert.deepEqual(s,before);
  s.tickets=0;assert.match(tutorialCue(s).text,/cần 1 vé/);s.onboarding=lesson('gear').onboarding;s.inventory=[];assert.match(tutorialCue(s).text,/Kho đang trống/);assert.match(tutorialCue(s,{modal:true,dialog:'gear'}).text,/Trang bị/);
  const b=battle(lesson('depart'));assert.match(tutorialCue(b,{page:'tower'}).text,/kẻ địch/);assert.match(tutorialCue(b,{modal:true}).text,/Đóng/);E.finishRun(b);assert.equal(tutorialCue(b).page,'home');
  const map=lesson('route');E.startRun(map,42);assert.equal(tutorialCue(map).routeIndex,0);assert.match(novicePanel(s),/Bỏ qua hướng dẫn vẫn làm nhiệm vụ/);
});

test('highlight points at the actual enabled control, cleans old hints and supports modal focus',()=>{
  const attrs=new Map(),classes=new Set();let pointer=null,scrolled=0,focused=0;
  const target={classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),append:p=>pointer=p,querySelector:()=>pointer,scrollIntoView:()=>scrolled++,focus:()=>focused++};
  const root={querySelector:selector=>selector.includes('assign')?target:null};
  const doc={querySelectorAll:()=>classes.has('tutorial-highlight')?[target]:[],querySelector:selector=>selector==='.modal'?root:selector.includes('summon')?target:null,createElement:()=>({setAttribute(){},remove(){pointer=null;}})};
  const s=lesson('summon');assert.equal(mountTutorialHighlight(s,{page:'summon'},doc,true),true);assert.ok(classes.has('tutorial-highlight'));assert.equal(attrs.get('aria-describedby'),'tutorial-instruction');assert.equal(pointer.textContent,'CHẠM');assert.equal(scrolled,1);assert.equal(focused,1);
  E.skipTutorial(s);assert.equal(mountTutorialHighlight(s,{page:'summon'},doc),false);assert.equal(classes.size,0);assert.equal(pointer,null);assert.equal(attrs.has('aria-describedby'),false);
  s.onboarding=lesson('team').onboarding;assert.equal(mountTutorialHighlight(s,{modal:true,dialog:'team'},doc),true);assert.equal(attrs.get('aria-describedby'),'tutorial-instruction-modal');assert.equal(mountTutorialHighlight(s,{page:'home'},doc),false);
});
