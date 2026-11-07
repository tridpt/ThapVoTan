import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES,HERO,GEAR_BASE} from '../js/data.mjs';
import {GEAR_SETS,SIGNATURES,HUNTS,HUNT_TIERS,FORGE_SOURCES} from '../js/armory-data.mjs';
import {armoryPage,huntsPage,forgeDetail,trainingPage,loadoutPanel} from '../js/armory-ui.mjs';
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function rich(){const s=E.createState();s.gold=100000;s.dust=10000;s.raids.records[0]={clears:1,bestRounds:12,fullParty:false,claimed:[]};s.raids.records[1]={clears:1,bestRounds:12,fullParty:false,claimed:[]};s.raids.dragon.records[0]={clears:100,bestRounds:12,fullParty:false,claimed:[]};s.raids.dragon.scales=100;for(const id of Object.keys(s.armory.marks))s.armory.marks[id]=100;for(const h of HEROES)s.owned[h.id]={level:1,copies:0,awaken:0};return s;}
function wear(s,hero,set,{signature=false,count=3}={}){for(const slot of ['weapon','armor','charm'].slice(0,count)){const g=E.forgeGear(s,slot==='weapon'&&signature?'signature-'+hero:`set-${set}-${slot}`);E.equipGear(s,g.id,hero);}}
function winHunt(s,id='colossus',tier=1){E.startHunt(s,id,tier,42);s.run.heroes[0].atk=100000;E.playerAction(s,s.run.heroes[0].id,'enemy0');assert.equal(s.run.phase,'result');return s.run.summary.huntReward;}

test('v5 migration keeps every existing battle value, gear and currency and runs only once',()=>{
  const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');s.version=5;delete s.armory;delete s.run.hunt;delete s.run.training;for(const h of s.run.heroes)delete h.loadout;
  const before=structuredClone(s),m=copy(s);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(s,before);
  for(const key of ['gold','tickets','shards','inventory','equipped','owned','highPity','challengeWeeks','adventure'])assert.deepEqual(m[key],s[key],key);
  assert.deepEqual(withoutCombatReport(m.run.battle),withoutCombatReport(s.run.battle));assert.deepEqual(m.run.heroes,s.run.heroes.map(h=>({...h,loadout:null,talents:null})));assert.deepEqual(copy(m),m);assert.deepEqual(Object.values(m.armory.marks),[0,0,0,0]);
});

test('all 35 forge recipes have valid slots, unique names, deterministic stats and real boss sources',()=>{
  const s=rich(),recipes=Object.values(GEAR_BASE).filter(b=>b.crafted);assert.equal(recipes.length,35);assert.equal(Object.keys(SIGNATURES).length,20);assert.equal(new Set(recipes.map(b=>b.name)).size,35);
  for(const b of recipes){const cost=E.forgeCost(b.id),g=E.forgeGear(s,b.id);assert.ok(FORGE_SOURCES[cost.boss]);assert.equal(g.rarity,'SSR');assert.equal(g.quality,100);assert.equal(g.affixes.length,2);assert.ok(E.gearStats(g)[{weapon:'atk',armor:'maxHp',charm:'def'}[b.slot]]>0);}copy(s);
});

test('forge failures are atomic for missing currency, full storage, duplicate and unowned signatures',()=>{
  for(const alter of [s=>s.gold=0,s=>s.dust=0,s=>s.armory.marks.colossus=0,s=>{while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');}]){
    const s=rich();alter(s);const before=structuredClone(s);assert.throws(()=>E.forgeGear(s,'set-bastion-armor'));assert.deepEqual(s,before);
  }
  const s=rich();E.forgeGear(s,'signature-rook');let before=structuredClone(s);assert.throws(()=>E.forgeGear(s,'signature-rook'));assert.deepEqual(s,before);
  delete s.owned.aion;before=structuredClone(s);assert.throws(()=>E.forgeGear(s,'signature-aion'));assert.deepEqual(s,before);assert.throws(()=>E.forgeGear(s,'constructor'));
});

test('signature weapons can only be worn by their hero and count toward the specified set',()=>{
  const s=rich();wear(s,'rook','bastion',{signature:true});const gear=s.inventory.find(g=>g.base==='signature-rook'),before=structuredClone(s);assert.throws(()=>E.equipGear(s,gear.id,'aerin'));assert.deepEqual(s,before);
  assert.deepEqual(E.gearLoadout(s,'rook'),{sets:[{id:'bastion',count:3}],signature:'rook',affixes:{crit:0,drain:0,energy:0},weaponRarity:'SSR'});copy(s);
  E.unequipGear(s,gear.id);assert.equal(E.gearLoadout(s,'rook').signature,null);assert.equal(E.gearLoadout(s,'rook').sets[0].count,2);
});

test('two-piece stats and three-piece passives start at the exact thresholds',()=>{
  for(const set of GEAR_SETS){const s=rich(),base=E.heroStats(s,'rook');wear(s,'rook',set.id,{count:1});assert.equal(E.loadoutEffects(E.gearLoadout(s,'rook'))[set.hp?'hp':set.atk?'atk':'def'],0);const g=E.forgeGear(s,`set-${set.id}-armor`);E.equipGear(s,g.id,'rook');const effect=E.loadoutEffects(E.gearLoadout(s,'rook'));assert.equal(effect.hp,set.hp||0);assert.equal(effect.atk,set.atk||0);assert.equal(effect.def,set.def||0);assert.equal(effect.shield+effect.burn+effect.drain+effect.reflect,0);assert.ok(E.heroStats(s,'rook').maxHp>base.maxHp);
    const charm=E.forgeGear(s,`set-${set.id}-charm`);E.equipGear(s,charm.id,'rook');assert.ok(Object.entries(E.loadoutEffects(E.gearLoadout(s,'rook'))).some(([k,v])=>['shield','burn','drain','reflect','void'].includes(k)&&v>0));copy(s);
  }
});

test('loadouts are snapshotted and survive mid-run equipment changes, saves and reopening',()=>{
  const s=rich();wear(s,'rook','bastion',{signature:true});E.startHunt(s,'colossus',1,42);const before=structuredClone(s.run.heroes[0]);for(const id of Object.values(s.equipped.rook))E.unequipGear(s,id);assert.deepEqual(s.run.heroes[0],before);assert.deepEqual(copy(s).run.heroes[0],before);E.finishRun(s);E.startRun(s,42);assert.equal(s.run.heroes[0].loadout.signature,null);assert.deepEqual(s.run.heroes[0].loadout.sets,[]);
});

test('bastion grants a personal skill shield and bloodmoon heals actual direct damage',()=>{
  let s=rich();wear(s,'aerin','bastion');s.team=['aerin','rook','lumi'];E.startHunt(s,'colossus',1,42);const h=s.run.heroes[0];h.energy=100;E.playerAction(s,h.id,'enemy0',true);assert.equal(h.shield,Math.round(h.maxHp*.08));
  s=rich();wear(s,'kira','bloodmoon',{signature:true});s.team=['kira','rook','lumi'];E.startHunt(s,'colossus',1,42);const k=s.run.heroes[0];k.hp=1;k.energy=100;const events=E.playerAction(s,k.id,'enemy0',true),hits=events.filter(e=>e.target==='enemy0');assert.equal(k.hp,1+hits.reduce((n,e)=>n+Math.round(e.value*.08),0));
});

test('ember set burns on normal hits and mirror reflects only HP lost after shields',()=>{
  let s=rich();wear(s,'rook','ember');E.startHunt(s,'colossus',1,42);E.playerAction(s,'rook','enemy0');assert.equal(s.run.battle.enemies[0].burn,2);assert.equal(s.run.battle.enemies[0].burnPower,Math.round(s.run.heroes[0].atk*.12));
  s=rich();wear(s,'rook','mirror');E.startHunt(s,'colossus',1,42);s.run.battle.enemies[0].intent=0;const h=s.run.heroes[0],e=s.run.battle.enemies[0];h.shield=10000;const hp=e.hp;E.enemyTurn(s);assert.equal(e.hp,hp);h.shield=0;s.run.battle.bossState.move='strike';e.intent=0;const events=E.enemyTurn(s),lost=events.find(ev=>ev.target==='rook').value;assert.equal(hp-e.hp,Math.round(lost*.2));copy(s);
});

test('all 20 signatures boost skill strength and execute the named extra effect',()=>{
  for(const hero of HEROES){const s=rich();const others=HEROES.filter(h=>h.id!==hero.id).slice(0,2).map(h=>h.id);s.team=[hero.id,...others];const g=E.forgeGear(s,'signature-'+hero.id);E.equipGear(s,g.id,hero.id);E.startHunt(s,'colossus',1,42);const r=s.run,h=r.heroes[0],sig=SIGNATURES[hero.id];h.energy=100;h.hp=1;for(const ally of r.heroes.slice(1)){ally.hp=1;ally.energy=0;}r.battle.enemies[0].maxHp=r.battle.enemies[0].hp=100000;r.battle.bossState.parts=E.createBossParts(r.battle.enemies[0]);
    const events=E.playerAction(s,hero.id,'enemy0',true);assert.equal(E.skillPower(h),1.12);assert.ok(r.battle.log.some(l=>l.text.startsWith(sig.name+':')));
    if(sig.effect==='energy')assert.equal(h.energy,sig.power);if(sig.effect==='teamEnergy')assert.ok(r.heroes.slice(1).every(a=>a.energy>=sig.power));if(sig.effect==='teamShield')assert.ok(r.heroes.every(a=>a.shield>0));if(['teamHeal','selfHeal'].includes(sig.effect))assert.ok(h.hp>1);if(sig.effect==='echo')assert.equal(events.filter(ev=>ev.target==='enemy0'&&!ev.heal).length,2);if(['burn','burnAll'].includes(sig.effect))assert.ok(r.battle.enemies[0].burn>0);copy(s);
  }
});

test('hunts unlock tiers in order and grant exactly 1/2/3 marks once without tower or dungeon rewards',()=>{
  for(const hunt of HUNTS){const s=E.createState();assert.throws(()=>E.startHunt(s,hunt.id,2));let total=0;for(let tier=1;tier<=3;tier++){const initial={best:s.best,tickets:s.tickets,shards:s.shards,inventory:s.inventory.length,adventure:structuredClone(s.adventure)};E.startHunt(s,hunt.id,tier,42);const resumed=copy(s);assert.deepEqual(resumed.run,s.run);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');const p=s.run.summary.huntReward;total+=tier;assert.equal(p.marks,tier);assert.equal(s.armory.marks[hunt.id],total);assert.equal(s.armory.hunts[hunt.id].best,tier);assert.equal(s.best,initial.best);assert.equal(s.tickets,initial.tickets);assert.equal(s.shards,initial.shards);assert.equal(s.inventory.length,initial.inventory);assert.deepEqual(s.adventure,initial.adventure);const after=structuredClone(s);E.finishRun(s);assert.throws(()=>E.playerAction(s,'rook','enemy0'));assert.throws(()=>E.completeHunt(s,s.run));assert.deepEqual(s,after);copy(s);}}
});

test('failed and abandoned hunts keep resources and cannot be used for claimed rewards',()=>{
  for(const reason of ['retreat','defeat']){const s=E.createState();E.startHunt(s,'colossus',1,42);if(reason==='defeat'){for(const h of s.run.heroes)h.hp=1;s.run.battle.bossState.move='quake';s.run.battle.bossState.phase=2;E.enemyTurn(s);}else E.finishRun(s);assert.equal(s.run.summary.reason,reason);assert.equal(s.armory.hunts.colossus.clears,0);assert.equal(s.armory.marks.colossus,0);assert.equal(s.gold,800);copy(s);}
});

test('four guaranteed tier-one clears reach a set recipe and crafting spends exactly the displayed cost',()=>{
  const s=E.createState();E.setForgeTarget(s,'set-bastion-armor');for(let i=0;i<4;i++){assert.equal(E.forgeProgress(s).remaining,4-i);winHunt(s);}assert.equal(E.forgeProgress(s).remaining,0);const gold=s.gold,dust=s.dust,next=s.nextGearId,target=s.armory.target,g=E.forgeGear(s,target);assert.equal(s.gold,gold-150);assert.equal(s.dust,dust-3);assert.equal(s.nextGearId,next+1);assert.equal(s.armory.marks.colossus,0);assert.equal(g.base,target);assert.equal(s.armory.target,null);copy(s);
});

test('new save fields reject malformed marks, recipes, loadouts and forged ownership without changing input',()=>{
  const mutations=[s=>s.armory.marks.colossus=-1,s=>delete s.armory.marks.archivist,s=>s.armory.hunts.colossus.best=3,s=>s.armory.target='html',s=>s.run.heroes[0].loadout.sets=[{id:'bastion',count:4}],s=>s.run.heroes[0].loadout.signature='aion',s=>s.run.hunt.id='aion',s=>s.run.hunt.claimed=true,s=>s.run.mode='normal',s=>s.run.training={bossId:'colossus'}];
  for(const mutate of mutations){const s=rich();E.startHunt(s,'colossus',1,42);mutate(s);const before=structuredClone(s);assert.throws(()=>copy(s));assert.deepEqual(s,before);}
  const s=rich(),g=E.forgeGear(s,'signature-rook');s.equipped.aerin={weapon:g.id};assert.throws(()=>copy(s));s.equipped={};s.inventory.push({...structuredClone(g),id:'gear-'+s.nextGearId++});assert.throws(()=>copy(s));
});

test('training grants all heroes at a selected level and never mutates the original journey or economy',()=>{
  const original=E.createState();E.startRun(original,42);E.chooseRoute(original,0);E.playerAction(original,'rook','enemy0');const before=structuredClone(original);
  for(const set of [null,...GEAR_SETS.map(s=>s.id)])for(const signature of [false,true]){
    const t=E.createTrainingState(original,{team:['aion','eclipse','eira'],level:50,set,signature,boss:'archivist',difficulty:3});assert.equal(Object.keys(t.owned).length,20);assert.ok(t.run.heroes.every(h=>h.energy===100&&h.awaken===0));assert.equal(t.run.pet,null);assert.throws(()=>copy(t));
    for(let turn=0;turn<30&&t.run.phase==='battle';turn++){for(const h of t.run.heroes.filter(h=>h.hp>0)){E.playerAction(t,h.id,t.run.battle.enemies.find(e=>e.hp>0)?.id,h.energy>=100);if(t.run.phase!=='battle')break;}if(t.run.phase==='battle')E.enemyTurn(t);}
    assert.equal(t.run.phase,'result');assert.ok(t.run.training.damage>0);assert.equal(t.armory.marks.colossus,original.armory.marks.colossus);assert.deepEqual(original,before);
  }
});

test('training meters include healing from both direct skills and bloodmoon lifesteal',()=>{
  const t=E.createTrainingState(E.createState(),{team:['kira','rook','lumi'],level:1,set:'bloodmoon',signature:true,difficulty:3});t.run.heroes[0].hp=1;let before=t.run.heroes[0].hp;E.playerAction(t,'kira','enemy0',true);assert.equal(t.run.training.healing,t.run.heroes[0].hp-before);assert.ok(t.run.training.healing>0);
  for(const h of t.run.heroes)h.hp=1;before=t.run.heroes.reduce((n,h)=>n+h.hp,0);const healed=t.run.training.healing;E.playerAction(t,'lumi','enemy0',true);assert.equal(t.run.training.healing-healed,t.run.heroes.reduce((n,h)=>n+h.hp,0)-before);
});

test('training validates team and options before touching any source state',()=>{
  const s=E.createState(),before=structuredClone(s);for(const options of [{team:['aion','aion','lumi']},{team:['invalid','rook','lumi']},{level:1000},{set:'constructor'},{boss:'basalt'},{difficulty:4},{signature:'yes'}]){assert.throws(()=>E.createTrainingState(s,options));assert.deepEqual(s,before);}
});

test('armory, hunt and training markup expose actionable recipes, costs, progress and all trial heroes',()=>{
  const s=E.createState();E.setForgeTarget(s,'signature-rook');const config={team:s.team,level:20,set:null,signature:false,boss:'colossus',difficulty:1};
  const armory=armoryPage(s),hunts=huntsPage(s),training=trainingPage(s,config);assert.match(armory,/role="progressbar"/);assert.match(armory,/set-bastion-armor/);assert.match(forgeDetail(s,'signature-rook'),/data-signature-preview/);assert.equal((hunts.match(/data-action="hunt-info"/g)||[]).length,4);assert.equal((training.match(/data-training="team"/g)||[]).length,3);for(const h of HEROES)assert.match(training,new RegExp('value="'+h.id+'"'));assert.match(loadoutPanel(s,'rook'),/Chưa có bộ đồ/);
});
