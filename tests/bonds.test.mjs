import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/bonds-legacy-v1.42.0/js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {bondEntry,bondDialog,bondTitle} from '../js/bonds-ui.mjs';
import {heroModel,T,animateModel,disposeScene} from '../js/models3d.mjs';
import {lobbyKey,createLobbyScene} from '../js/lobby3d.mjs';
import {victoryKey,createVictoryScene} from '../js/victory3d.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const atomic=(s,fn,pattern)=>{const before=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,before);};
const gift=(s,id='rook')=>E.giveBondGift(s,id,E.bondGiftReceipt(s,id));
const win=s=>{const r=s.run;for(const h of r.heroes)h.atk=100000;if(r.raid)for(const team of r.raid.teams)for(const h of team.heroes)h.atk=100000;let n=0;while(r.phase==='battle'&&n++<20){const h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id));if(h)E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id);else E.enemyTurn(s);}assert.notEqual(r.phase,'battle');};

test('fresh and newly summoned heroes have independent empty bonds; previews never sample RNG or mutate',()=>{
  const s=E.createState(),b=E.createState(),before=structuredClone(s),random=Math.random;Math.random=()=>{throw Error('preview sampled RNG');};
  try{assert.deepEqual(s.bonds,{});assert.equal(E.bondStatus(s,'rook').xp,0);assert.equal(E.bondStatus(s,'rook').rank,0);assert.equal(E.bondStatus(s,'nyx').owned,false);assert.equal(bondEntry(s,'nyx'),'');assert.equal(E.bondAdorned(null,'rook'),false);assert.equal(E.bondGiftPreview(s,'rook').gain,20);assert.match(bondDialog(s,'rook',1),/80 vàng/);assert.deepEqual(s,before);assert.deepEqual(s,b);}finally{Math.random=random;}
  E.summon(s,1,()=>.03);assert.equal(E.bondStatus(s,'astra').xp,0);assert.equal(E.bondStatus(s,'astra').owned,true);copy(s);
});

test('every hero has five distinct memories and a unique oath title, and locked prose is absent from markup',()=>{
  assert.equal(Object.keys(E.BOND_LORE).length,HEROES.length);const prose=[],titles=[];const s=E.createState();
  for(const h of HEROES){s.owned[h.id]={level:1,copies:0,awaken:0};const lore=E.BOND_LORE[h.id];assert.equal(lore.chapters.length,5);titles.push(lore.title);for(const [title,body] of lore.chapters){assert.ok(title.length>5);assert.ok(body.length>60);prose.push(body);}const html=bondDialog(s,h.id,1);for(const [,body] of lore.chapters)assert.ok(!html.includes(body));}
  assert.equal(new Set(prose).size,100);assert.equal(new Set(titles).size,20);copy(s);
});

test('gifts pay their displayed cost, open all five exact thresholds, and cap with the actual final gain',()=>{
  const s=E.createState();s.gold=10000;
  for(let n=1;n<=40;n++){const before=s.gold,p=gift(s);assert.equal(s.gold,before-80);assert.equal(s.bonds.rook.xp,n*20);assert.equal(p.gain,20);const rank=E.BOND_MILESTONES.filter(m=>n*20>=m.xp).length;assert.equal(E.bondStatus(s,'rook').rank,rank);assert.equal((bondDialog(s,'rook',1).match(/<details /g)||[]).length,rank);copy(s);}
  assert.equal(E.bondStatus(s,'rook').maxed,true);atomic(s,()=>gift(s),/tối đa/);assert.equal(E.bondAdorned(s,'rook'),false);
  s.bonds.aerin={xp:796,adorned:false};assert.equal(E.bondGiftPreview(s,'aerin').gain,4);assert.equal(gift(s,'aerin').gain,4);assert.equal(s.bonds.aerin.xp,800);copy(s);
});

test('gift rejection is atomic for low funds, unknown/unowned heroes, missing and stale receipts',()=>{
  const s=E.createState();for(const id of ['nyx','missing','constructor','__proto__'])atomic(s,()=>gift(s,id));
  atomic(s,()=>E.giveBondGift(s,'rook'),/mở lại/);const receipt=E.bondGiftReceipt(s,'rook');gift(s);atomic(s,()=>E.giveBondGift(s,'rook',receipt),/thay đổi/);s.gold=79;atomic(s,()=>gift(s),/Chưa đủ/);copy(s);
});

test('gifting and equipping alter only gold and bonds; battle, paid refining, pity and the next action stay exact',()=>{
  const s=E.createState();s.gold=10000;s.dust=100;E.rollGearRefining(s,'gear-1',0,E.refiningReceipt(s,'gear-1',0),()=>.5);E.startHunt(s,'colossus',1,42);const plain=structuredClone(s),before=structuredClone(s);gift(s);const projected=structuredClone(s);projected.gold+=80;projected.bonds=before.bonds;assert.deepEqual(projected,before);
  s.bonds.rook={xp:800,adorned:false};E.setBondAdornment(s,'rook',true);assert.deepEqual(s.run,plain.run);assert.deepEqual(s.summoning,plain.summoning);assert.deepEqual(s.refining,plain.refining);assert.deepEqual(E.heroStats(s,'rook'),E.heroStats(plain,'rook'));assert.deepEqual(E.playerAction(s,'rook','enemy0'),E.playerAction(plain,'rook','enemy0'));assert.deepEqual(s.run,plain.run);copy(s);
});

test('oath appearance unlocks exactly at the fifth milestone, toggles independently and stays valid after reload',()=>{
  const s=E.createState();atomic(s,()=>E.setBondAdornment(s,'rook',true),/mốc/);s.bonds.rook={xp:799,adorned:false};atomic(s,()=>E.setBondAdornment(s,'rook',true),/mốc/);s.bonds.rook.xp=800;assert.equal(E.setBondAdornment(s,'rook',true),true);assert.equal(E.setBondAdornment(s,'rook',true),false);assert.equal(E.bondAdorned(s,'rook'),true);assert.match(bondTitle(s,'rook'),/Người giữ lời thề/);assert.equal(E.bondAdorned(copy(s),'rook'),true);assert.equal(E.setBondAdornment(s,'rook',false),true);assert.equal(bondTitle(s,'rook'),'');atomic(s,()=>E.setBondAdornment(s,'rook','true'),/hợp lệ/);atomic(s,()=>E.setBondAdornment(s,'nyx',false),/chưa sở hữu/);
});

for(const mode of ['battle','boss','hunt','campaign','dungeon','raid'])test(`${mode} victory awards the actual participating heroes exactly once`,()=>{
  const s=E.createState();
  if(mode==='hunt')E.startHunt(s,'colossus',1,42);
  else if(mode==='campaign'){E.startCampaign(s,1,42);E.advanceCampaignStory(s,true);E.chooseRoute(s,0);}
  else if(mode==='dungeon'){E.startDungeon(s,'wind',1,new Date(2026,9,24,12),42);E.chooseRoute(s,0);}
  else if(mode==='raid'){for(const h of HEROES)s.owned[h.id]={level:1,copies:0,awaken:0};s.best=15;s.raids.teams=[['rook','aerin','lumi'],['ember','bryn','raiden'],['thorne','seraph','astra']];E.startRaid(s,1,42);}
  else {E.startRun(s,42);s.run.map=null;s.run.routes=[mode==='boss'?'boss':'battle'];if(mode==='boss')s.run.floor=5;E.chooseRoute(s,0);}
  const gain=s.run.node==='boss'?8:4,ids=s.run.heroes.map(h=>h.id);s.run.heroes[2].hp=0;win(s);for(const id of ids)assert.equal(s.bonds[id].xp,gain);assert.equal(E.bondStatus(s,'ember').xp,0);const before=structuredClone(s.bonds);assert.throws(()=>E.playerAction(s,'rook','enemy0'));E.dismissVictory(s);E.dismissVictory(s);assert.deepEqual(s.bonds,before);copy(s);
});

test('retreat, defeat, rest and practice never pay bond XP; practice keeps the real account untouched',()=>{
  const s=E.createState();s.bonds.rook={xp:800,adorned:true};const before=structuredClone(s),training=E.createTrainingState(s);assert.deepEqual(training.bonds,{});atomic(training,()=>gift(training),/Phòng thử/);atomic(training,()=>E.setBondAdornment(training,'rook',false),/Phòng thử/);win(training);assert.deepEqual(training.bonds,{});assert.deepEqual(s,before);E.validateBonds(training);
  for(const reason of ['retreat','defeat']){const state=E.createState();E.startRun(state,42);E.chooseRoute(state,0);E.finishRun(state,reason);assert.deepEqual(state.bonds,{});copy(state);}
  const resting=E.createState();E.startRun(resting,42);resting.run.map=null;resting.run.routes=['rest'];E.chooseRoute(resting,0);assert.deepEqual(resting.bonds,{});copy(resting);
});

const invalid=[['missing root',s=>delete s.bonds],['null root',s=>s.bonds=null],['array root',s=>s.bonds=[]],['unknown hero',s=>s.bonds.noone={xp:10,adorned:false}],['unowned hero',s=>s.bonds.nyx={xp:10,adorned:false}],['extra field',s=>s.bonds.rook.extra=1],['missing xp',s=>delete s.bonds.rook.xp],['missing adorned',s=>delete s.bonds.rook.adorned],['negative xp',s=>s.bonds.rook.xp=-1],['fractional xp',s=>s.bonds.rook.xp=.5],['huge xp',s=>s.bonds.rook.xp=801],['string xp',s=>s.bonds.rook.xp='800'],['forged appearance',s=>s.bonds.rook.adorned=true],['string appearance',s=>s.bonds.rook.adorned='true'],['null entry',s=>s.bonds.rook=null],['array entry',s=>s.bonds.rook=[]]];
for(const [name,mutate] of invalid)test(`bond schema rejects ${name} without changing imported input`,()=>{const s=E.createState();s.bonds.rook={xp:40,adorned:false};mutate(s);atomic(s,()=>copy(s));});

test('all twenty oath auras have finite small geometry, independent motion and work alongside costumes',()=>{
  for(const h of HEROES){const model=heroModel(h.id,{bond:true,skin:h.id==='rook'?'rook-guardian':null}),other=heroModel(h.id,{bond:true}),plain=heroModel(h.id),aura=model.getObjectByName('bond-oath-aura');assert.ok(aura);assert.equal(plain.getObjectByName('bond-oath-aura'),undefined);assert.equal(aura.children.length,2);const before=aura.rotation.clone();animateModel(model,3);assert.notEqual(aura.rotation.y,before.y);assert.equal(other.getObjectByName('bond-oath-aura').rotation.y,0);animateModel(model,10,{reducedMotion:true});assert.equal(aura.rotation.y,before.y);const bounds=new T.Box3().setFromObject(model);assert.ok(bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite));for(const m of [model,other,plain])disposeScene(m);}
});

test('lobby and victory refresh keys include equipped bond appearance while keeping skins and gear',()=>{
  const s=E.createState(),base=lobbyKey(s);s.bonds.rook={xp:800,adorned:true};assert.notEqual(lobbyKey(s),base);const lobby=createLobbyScene(s);assert.equal(lobby.units.find(u=>u.id==='rook').model.userData.bond,true);disposeScene(lobby.scene);E.startHunt(s,'colossus',1,42);win(s);const key=victoryKey(s);E.setBondAdornment(s,'rook',false);assert.notEqual(victoryKey(s),key);E.setBondAdornment(s,'rook',true);const scene=createVictoryScene(s);assert.ok(scene.heroes.some(v=>v.model.userData.id==='rook'&&v.model.userData.bond));disposeScene(scene.scene);
});

test('historical projections exclude cosmetic bond metadata without changing real currencies or RNG',()=>{
  const s=E.createState();s.bonds.rook={xp:800,adorned:true};const old=structuredClone(s);delete old.bonds;assert.deepEqual(withoutCombatReport(s),withoutCombatReport(old));
});

for(const phase of ['idle','route','battle','pending-guard','counter','contract','result'])test(`released 1.42 / v32 ${phase} migrates exact login rewards, paid refining, loadouts and combat`,()=>{
  const old=Old.createState();old.gold=1000000;old.dust=100000;Old.claimLoginReward(old,new Date(2026,9,24,12));Old.equipGear(old,'gear-1','rook');Old.saveGearPreset(old,'rook',0);Old.saveTeamPreset(old,0,'Đội cũ');Old.rollGearRefining(old,'gear-1',0,Old.refiningReceipt(old,'gear-1',0),()=>.5);Old.toggleGearLock(old,'gear-1');
  if(phase!=='idle')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}}
  if(phase==='result')Old.finishRun(old);Old.validateState(old);const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.bonds,{});const projected=structuredClone(migrated);delete projected.bonds;assert.deepEqual(projected.season,E.starterSeason());delete projected.season;projected.version=32;assert.deepEqual(projected,old);assert.deepEqual(old,before);assert.deepEqual(copy(migrated),migrated);
});
