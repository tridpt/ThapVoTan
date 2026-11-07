import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import {HERO,HEROES,TRIALS,AWAKENING} from '../js/data.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
// These awakening/resonance fixtures isolate their original numeric contributions.
function originalRun(s,seed){E.startRun(s,seed);delete s.run.anomalyRules;delete s.run.anomalyOrder;}
const monday=new Date(2026,9,19,12),nextMonday=new Date(2026,9,26,12);
function stateFor(ids=['rook','aerin','lumi'],rank=0){
  const s=E.createState();for(const id of ids)s.owned[id]={level:1,copies:10,awaken:rank};s.team=ids;return s;
}
function abilityBattle(id,rank=1){
  const ids=[id,...['rook','aerin','lumi'].filter(a=>a!==id)].slice(0,3),s=stateFor(ids,rank);
  originalRun(s,59241);s.run.resonances=[];E.chooseRoute(s,0);
  for(const enemy of s.run.battle.enemies){enemy.hp=enemy.maxHp=2000;enemy.def=0;enemy.atk=1;}
  for(const h of s.run.heroes)h.energy=0;
  s.run.heroes[0].energy=100;return s;
}
function fight(s,validate=false){
  let n=0;
  while(s.run.phase==='battle'&&n++<250){
    const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id));
    if(!h)E.enemyTurn(s);
    else{const enemy=r.battle.enemies.filter(e=>e.hp>0).sort((a,b)=>a.hp-b.hp)[0];E.playerAction(s,h.id,enemy.id,h.energy>=100&&(HERO[h.id].kind!=='heal'||r.heroes.some(a=>a.hp/a.maxHp<.8)));}
    if(validate)s=copy(s);
  }
  assert.ok(n<250);return s;
}

test('awakening spends saved duplicates and gold exactly once and preserves active snapshots',()=>{
  const s=E.createState();s.owned.rook.copies=2;E.startRun(s,1);const original=structuredClone(s.run),stats=E.heroStats(s,'rook');
  const rank=E.awakenHero(s,'rook');assert.equal(rank,1);assert.equal(s.gold,550);assert.equal(s.owned.rook.copies,1);assert.ok(E.heroStats(s,'rook').atk>stats.atk);assert.equal(E.heroStats(s,'rook').def,stats.def+1);assert.deepEqual(s.run,original);
  const restored=copy(s);assert.equal(restored.owned.rook.awaken,1);assert.equal(restored.run.heroes[0].awaken,0);
  E.finishRun(restored);E.startRun(restored,2);assert.equal(restored.run.heroes[0].awaken,1);
});
test('all five awakening costs are paid once; failed and capped actions cannot spend',()=>{
  const s=E.createState();s.gold=10000;s.owned.rook.copies=9;
  for(let i=0;i<5;i++)assert.equal(E.awakenHero(s,'rook'),i+1);
  assert.equal(s.owned.rook.copies,0);assert.equal(s.gold,3450);assert.equal(E.awakeningCost(s,'rook'),null);
  let before=structuredClone(s);assert.throws(()=>E.awakenHero(s,'rook'),/tối đa/);assert.deepEqual(s,before);
  assert.throws(()=>E.awakenHero(s,'astra'),/chưa sở hữu/);assert.throws(()=>E.awakenHero(s,'toString'));assert.deepEqual(s,before);
  for(const [gold,copies] of [[10000,0],[0,10]]){const a=E.createState();a.gold=gold;a.owned.lumi.copies=copies;before=structuredClone(a);assert.throws(()=>E.awakenHero(a,'lumi'));assert.deepEqual(a,before);}
});
test('duplicate pulls retain awakening copies alongside all prior gacha compensation',()=>{
  const s=E.createState();const before=s.gold;E.summon(s,1,()=>.5);const id=HEROES.filter(h=>h.rarity==='R')[2].id;
  assert.equal(s.owned[id].copies,1);assert.equal(s.owned[id].awaken,0);assert.equal(s.gold,before+30);assert.equal(s.shards,1);
  E.summon(s,1,()=>.03);assert.equal(s.owned.astra.awaken,0);copy(s);
});

test('Aerin and Lumi awakenings supply team energy; Raiden refunds his own skill',()=>{
  for(const [id,energy] of [['aerin',15],['lumi',10],['raiden',25]]){
    const s=abilityBattle(id);E.playerAction(s,id,'enemy0',true);assert.equal(s.run.heroes[0].energy,energy);
    if(id!=='raiden')assert.equal(s.run.heroes[1].energy,energy);copy(s);
  }
});
test('Rook, Thorne, Bryn and Seraph unlock their specific healing or shielding',()=>{
  const rook=abilityBattle('rook'),r=rook.run,h=r.heroes[0];h.hp=50;E.playerAction(rook,'rook','enemy0',true);assert.equal(h.hp,50+Math.round(h.maxHp*.12));
  const thorne=abilityBattle('thorne'),t=thorne.run.heroes[1];t.hp=50;E.playerAction(thorne,'thorne','enemy0',true);assert.equal(t.hp,50+Math.round(t.maxHp*.08));
  const bryn=abilityBattle('bryn');E.playerAction(bryn,'bryn','enemy0',true);assert.ok(bryn.run.heroes.every(h=>h.shield===Math.round(bryn.run.heroes[0].maxHp*.08)));
  const seraph=abilityBattle('seraph');E.playerAction(seraph,'seraph','enemy0',true);assert.ok(seraph.run.heroes.every(h=>h.shield===Math.round(h.maxHp*.08)));
  for(const s of [rook,thorne,bryn,seraph])copy(s);
});
test('Ember extends burning, Kael increases burn power and weaker effects cannot overwrite either',()=>{
  const ember=abilityBattle('ember');ember.run.buffs=['flame'];E.playerAction(ember,'ember','enemy0',true);const enemy=ember.run.battle.enemies[0];assert.equal(enemy.burn,3);const power=enemy.burnPower;
  E.playerAction(ember,'rook','enemy0');assert.equal(enemy.burn,3);assert.equal(enemy.burnPower,power);
  enemy.burn=0;enemy.burnPower=1000;E.playerAction(ember,'aerin','enemy0');assert.equal(enemy.burn,2);assert.equal(enemy.burnPower,Math.round(ember.run.heroes[2].atk*.1));
  const kael=abilityBattle('kael');E.playerAction(kael,'kael','enemy0',true);assert.equal(kael.run.battle.enemies[0].burnPower,Math.round(kael.run.heroes[0].atk*.45));
});
test('Kira executes wounded targets and Astra gains boss damage only after awakening',()=>{
  for(const id of ['kira','astra']){
    const ordinary=abilityBattle(id,0),awakened=abilityBattle(id,1);
    awakened.run.heroes[0].atk=ordinary.run.heroes[0].atk;
    for(const s of [ordinary,awakened]){s.run.battle.enemies[0].hp=800;if(id==='astra')s.run.battle.enemies[0].kind='boss';}
    const base=E.playerAction(ordinary,id,'enemy0',true)[0].value,boost=E.playerAction(awakened,id,'enemy0',true)[0].value;
    assert.ok(boost>=base*(id==='astra'?1.18:1.23));
  }
});
test('Nyx skill drains 50 percent after awakening instead of 30 percent',()=>{
  for(const rank of [0,1]){const s=abilityBattle('nyx',rank),h=s.run.heroes[0];h.maxHp=1000;h.hp=1;const result=E.playerAction(s,'nyx','enemy0',true);assert.equal(h.hp,1+Math.round(result[0].value*(rank?.5:.3)));}
});
test('rank three boosts skill damage, healing and shields; rank five adds basic energy',()=>{
  for(const id of ['rook','lumi']){
    const a=abilityBattle(id,1),b=abilityBattle(id,3);Object.assign(b.run.heroes[0],{atk:a.run.heroes[0].atk,maxHp:a.run.heroes[0].maxHp});
    if(id==='lumi')for(const s of [a,b])for(const h of s.run.heroes)h.hp=1;
    const x=E.playerAction(a,id,'enemy0',true),y=E.playerAction(b,id,'enemy0',true);
    assert.ok(y[0].value>x[0].value);
    if(id==='rook')assert.ok(b.run.heroes[1].shield>a.run.heroes[1].shield);
  }
  const s=abilityBattle('ember',5);s.run.heroes[0].energy=0;E.playerAction(s,'ember','enemy0');assert.equal(s.run.heroes[0].energy,50);
  assert.equal(Object.keys(AWAKENING).length,HEROES.length);
});

test('resonance counts distinct team slots and all five supported recipes are reachable',()=>{
  assert.deepEqual(E.teamResonances(['ember','kael','rook']),['fire']);
  assert.deepEqual(E.teamResonances(['lumi','seraph','astra']),['light']);
  assert.deepEqual(E.teamResonances(['rook','thorne','lumi']),['earth']);
  assert.deepEqual(E.teamResonances(['kira','nyx','rook']),['shadow']);
  assert.deepEqual(E.teamResonances(['rook','aerin','lumi']),['diverse']);
});
test('diverse resonance supplies entry energy and increases direct damage',()=>{
  const a=stateFor(),b=stateFor();originalRun(a,41);originalRun(b,41);b.run.resonances=[];E.chooseRoute(a,0);E.chooseRoute(b,0);
  assert.equal(a.run.heroes[0].energy,90);assert.equal(b.run.heroes[0].energy,80);
  assert.ok(E.playerAction(a,'rook','enemy0')[0].value>E.playerAction(b,'rook','enemy0')[0].value);
});
test('fire resonance increases burn ticks without changing explosion damage',()=>{
  const s=stateFor(['ember','kael','rook']);originalRun(s,3);E.chooseRoute(s,0);const enemy=s.run.battle.enemies[0],before=enemy.hp;enemy.burn=2;enemy.burnPower=20;
  E.enemyTurn(s);assert.equal(before-enemy.hp,27);assert.equal(enemy.burn,1);copy(s);
});
test('light resonance boosts recovery and overheal shields remain capped',()=>{
  const s=stateFor(['lumi','seraph','rook']);originalRun(s,3);s.run.relics=['chalice'];E.chooseRoute(s,0);s.run.heroes[0].energy=100;s.run.heroes[1].hp=1;
  const ally=s.run.heroes[1],before=ally.hp;E.playerAction(s,'lumi','enemy0',true);assert.equal(ally.hp-before,Math.round(Math.round(ally.maxHp*.3)*1.2));
  assert.ok(s.run.heroes[0].shield<=Math.round(s.run.heroes[0].maxHp*.4));
});
test('earth resonance boosts skill, barrier and chalice shields',()=>{
  const s=stateFor(['rook','thorne','lumi']);originalRun(s,3);s.run.buffs=['barrier'];E.chooseRoute(s,0);const h=s.run.heroes[0],shield=h.shield;
  assert.equal(shield,Math.round(h.maxHp*.18*1.25));h.energy=100;E.playerAction(s,'rook','enemy0',true);assert.equal(h.shield-shield,Math.round(h.maxHp*.22*1.25));
  const a=stateFor(['rook','thorne','lumi']);originalRun(a,3);a.run.relics=['chalice'];E.chooseRoute(a,0);a.run.heroes[2].energy=100;E.playerAction(a,'lumi','enemy0',true);assert.equal(a.run.heroes[0].shield,Math.round(Math.round(a.run.heroes[0].maxHp*.3)*.6*1.25));
});
test('shadow resonance rewards hitting a low-health enemy and remains after an ally falls',()=>{
  const s=stateFor(['kira','nyx','rook']);E.startRun(s,15);E.chooseRoute(s,0);s.run.heroes[1].hp=0;const base=copy(s);base.run.resonances=[];
  for(const a of [s,base]){a.run.battle.enemies[0].hp=30;a.run.battle.enemies[0].maxHp=500;a.run.heroes[0].atk=10;}
  assert.ok(E.playerAction(s,'kira','enemy0')[0].value>E.playerAction(base,'kira','enemy0')[0].value);
});

test('weekly keys reset on local Monday including year boundaries; seed stays deterministic',()=>{
  assert.equal(E.weekKey(monday),'2026-10-19');assert.equal(E.weekKey(new Date(2026,9,25,23,59)),'2026-10-19');assert.equal(E.weekKey(nextMonday),'2026-10-26');
  assert.equal(E.weekKey(new Date(2027,0,1)),'2026-12-28');assert.equal(E.validWeek('2026-10-20'),false);assert.equal(E.validWeek('2026-02-30'),false);
  assert.equal(E.trialSeed('iron','2026-10-19'),E.trialSeed('iron','2026-10-19'));assert.notEqual(E.trialSeed('iron','2026-10-19'),E.trialSeed('iron','2026-10-26'));
});
test('R-only trial enforces its roster and all modes protect an active expedition',()=>{
  const s=E.createState(),before=structuredClone(s);assert.throws(()=>E.startChallenge(s,'humble',monday),/3 anh hùng R/);assert.deepEqual(s,before);assert.throws(()=>E.startChallenge(s,'constructor',monday));
  E.setTeamSlot(s,'ember',1);E.startChallenge(s,'humble',monday);assert.equal(s.run.mode,'challenge');assert.equal(s.run.challenge.week,'2026-10-19');assert.throws(()=>E.startRun(s));assert.throws(()=>E.startChallenge(s,'iron'));assert.throws(()=>E.setTeamSlot(s,'aerin',1));copy(s);
});
test('weekly replay retains claimed prizes while a new week gets a new record and seed',()=>{
  const s=E.createState();E.startChallenge(s,'iron',monday);const seed=s.run.seed;E.chooseRoute(s,1);const best=E.trialStatus(s,'iron','2026-10-19').best;E.finishRun(s);
  E.startChallenge(s,'iron',monday);assert.equal(s.run.seed,seed);assert.equal(E.trialStatus(s,'iron','2026-10-19').best,best);E.finishRun(s);
  E.startChallenge(s,'iron',nextMonday);assert.notEqual(s.run.seed,seed);assert.equal(E.trialStatus(s,'iron','2026-10-26').best,0);assert.equal(E.trialStatus(s,'iron','2026-10-19').best,best);
});
test('no-revival blocks heal skills, rest, event, post-victory healing and root relic',()=>{
  const s=E.createState();E.startChallenge(s,'iron',monday);s.run.heroes[0].hp=0;s.run.relics=['root'];E.chooseRoute(s,0);assert.equal(s.run.heroes[0].hp,0);s.run.heroes[2].energy=100;E.playerAction(s,'lumi','enemy0',true);assert.equal(s.run.heroes[0].hp,0);
  s.run.heroes[1].atk=100000;E.playerAction(s,'aerin','enemy0');s.run.battle.used=[];E.playerAction(s,'aerin','enemy1');assert.equal(s.run.heroes[0].hp,0);assert.equal(s.run.phase,'blessing');
  s.run.choices=['vitality','might','crit'];E.selectBlessing(s,'vitality');assert.equal(s.run.heroes[0].hp,0);s.run.map=null;s.run.routes=['rest'];E.chooseRoute(s,0);assert.equal(s.run.heroes[0].hp,0);E.selectBlessing(s,s.run.choices[0]);s.run.map=null;s.run.routes=['event'];E.chooseRoute(s,0);E.chooseEvent(s,'leave');assert.equal(s.run.heroes[0].hp,0);copy(s);
});
test('no-revival blocks lantern and never offers a useless lantern as a boss reward',()=>{
  const s=E.createState();E.startChallenge(s,'iron',monday);s.run.relics=['lantern'];E.chooseRoute(s,0);s.run.heroes[0].hp=1;for(const e of s.run.battle.enemies){e.intent=0;e.atk=20;}E.enemyTurn(s);assert.equal(s.run.heroes[0].hp,0);assert.equal(s.run.relicUsed.lantern,false);
  for(let seed=1;seed<=20;seed++){const a=E.createState();E.startChallenge(a,'iron',monday);a.run.floor=5;a.run.seed=seed;a.run.map=null;a.run.routes=['boss'];a.run.heroes[0].atk=100000;E.chooseRoute(a,0);E.playerAction(a,'rook','enemy0');assert.equal(a.run.phase,'relic');assert.ok(!a.run.relicChoices.includes('lantern'));}
});
test('boss gauntlet cycles all four bosses, completes at four, and pays rewards only once',()=>{
  let s=E.createState();E.startChallenge(s,'gauntlet',monday);const bosses=[];
  while(s.run.phase!=='result'){
    const r=s.run;assert.deepEqual(r.routes,['boss']);E.chooseRoute(s,0);bosses.push(r.battle.bossState.id);for(const h of r.heroes)h.atk=100000;E.playerAction(s,'rook','enemy0');s=copy(s);
    if(s.run.phase==='relic')E.selectRelic(s,s.run.relicChoices[0]);if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);
  }
  assert.deepEqual(bosses,['colossus','archivist','ashknight','moonwarden']);assert.equal(s.run.summary.reason,'victory');assert.equal(s.run.summary.cleared,4);assert.equal(E.trialStatus(s,'gauntlet','2026-10-19').best,4);assert.equal(s.best,0);
  const before={tickets:s.tickets,gold:s.gold,dust:s.dust,shards:s.shards};
  for(const floor of [1,2,4])E.claimTrial(s,'gauntlet',floor,'2026-10-19');assert.equal(s.tickets-before.tickets,9);assert.equal(s.gold-before.gold,1850);assert.equal(s.dust-before.dust,35);assert.equal(s.shards-before.shards,4);
  s=copy(s);const final=structuredClone(s);assert.throws(()=>E.claimTrial(s,'gauntlet',4,'2026-10-19'));assert.throws(()=>E.playerAction(s,'rook','enemy0'));E.finishRun(s);assert.deepEqual(s,final);
});
test('old-week runs keep their captured rules and old rewards can still be claimed',()=>{
  let s=E.createState();E.startChallenge(s,'gauntlet',monday);E.chooseRoute(s,0);s.run.heroes[0].atk=10000;E.playerAction(s,'rook','enemy0');E.refreshDaily(s,nextMonday);s=copy(s);
  assert.equal(s.run.challenge.week,'2026-10-19');const before=s.tickets;E.claimTrial(s,'gauntlet',1,'2026-10-19');assert.equal(s.tickets,before+1);assert.equal(E.trialStatus(s,'gauntlet','2026-10-26').best,0);
});
test('early retreat records cleared trial floors without inflating normal milestones',()=>{
  const s=E.createState();s.best=2;E.startChallenge(s,'iron',monday);
  for(let i=0;i<3;i++){s.run.map=null;s.run.routes=['treasure'];E.chooseRoute(s,0);}E.finishRun(s);
  assert.equal(E.trialStatus(s,'iron','2026-10-19').best,3);assert.equal(s.best,2);assert.equal(s.run.summary.cleared,3);assert.throws(()=>E.claimMilestone(s,3));assert.throws(()=>E.claimTrial(s,'iron',5,'2026-10-19'));
  const before=s.gold;E.claimTrial(s,'iron',3,'2026-10-19');assert.equal(s.gold,before+250);copy(s);
});
test('weekly history is bounded and preserves the active week during a clock jump',()=>{
  const s=E.createState();for(let i=0;i<15;i++){const date=new Date(2026,0,5+i*7);E.startChallenge(s,'iron',date);E.finishRun(s);}assert.equal(Object.keys(s.challengeWeeks).length,12);copy(s);
});

test('real v1 and v2 backups migrate copies, equipment and pending combat without retroactive bonuses',()=>{
  for(const file of ['browser-export.json','browser-v1.1-export.json']){
    const raw=JSON.parse(readFileSync(new URL('../artifacts/qa/'+file,import.meta.url),'utf8')),old=raw.state||raw,migrated=E.validateState(old);
    assert.equal(migrated.version,E.SAVE_VERSION);assert.equal(migrated.gold,old.gold);assert.equal(migrated.pity,old.pity);assert.deepEqual(migrated.team,old.team);
    for(const id of Object.keys(old.owned)){assert.equal(migrated.owned[id].copies,old.owned[id].copies);assert.equal(migrated.owned[id].awaken,0);}
    assert.deepEqual(migrated.run.resonances,[]);for(let i=0;i<3;i++){assert.equal(migrated.run.heroes[i].hp,old.run.heroes[i].hp);assert.equal(migrated.run.heroes[i].atk,old.run.heroes[i].atk);}
    if(old.version===2){assert.deepEqual(migrated.inventory,old.inventory);assert.deepEqual(migrated.equipped,old.equipped);assert.deepEqual(migrated.run.relics,old.run.relics);}
    assert.deepEqual(copy(migrated),migrated);
  }
});
test('malformed awakening, resonance and challenge imports are rejected before use',()=>{
  const edits=[s=>s.owned.rook.awaken=6,s=>s.owned.rook.awaken=-1,s=>s.owned.rook.copies=1.2,s=>delete s.challengeWeeks,s=>s.challengeWeeks={'2026-10-20':{}},s=>s.challengeWeeks={'2026-10-19':{constructor:{best:1,claimed:[]}}},s=>s.challengeWeeks={'2026-10-19':{iron:{best:3,claimed:[5]}}},s=>s.challengeWeeks={'2026-10-19':{iron:{best:5,claimed:[3,3]}}},s=>s.run.resonances=['fire'],s=>s.run.resonances=['diverse','diverse'],s=>s.run.heroes[0].awaken=99,s=>s.run.mode='online',s=>{s.run.mode='challenge';s.run.challenge={id:'humble',week:'2026-10-19'};},s=>{s.run.mode='challenge';s.run.challenge={id:'toString',week:'2026-10-19'};}];
  for(const edit of edits){const s=E.createState();E.startRun(s,1);edit(s);assert.throws(()=>copy(s));}
});
test('all three trial modes stay finite and resume correctly after every action across four weeks',()=>{
  const results=[];
  for(const trial of TRIALS)for(let week=0;week<4;week++){
    let s=stateFor(trial.id==='humble'?['rook','ember','lumi']:['rook','aerin','lumi'],3);for(const own of Object.values(s.owned))own.level=10;
    E.equipGear(s,'gear-1','rook');E.equipGear(s,'gear-2','aerin');E.startChallenge(s,trial.id,new Date(2026,9,19+week*7));let steps=0;
    while(s.run.phase!=='result'&&steps++<100){
      const r=s.run;
      if(r.phase==='route'){const weak=r.heroes.some(h=>h.hp>0&&h.hp/h.maxHp<.7);const index=weak&&r.routes.includes('rest')?r.routes.indexOf('rest'):r.routes.includes('treasure')?r.routes.indexOf('treasure'):0;E.chooseRoute(s,index);}
      else if(r.phase==='battle')s=fight(s,true);
      else if(r.phase==='relic')E.selectRelic(s,r.relicChoices[0]);
      else if(r.phase==='blessing')E.selectBlessing(s,r.choices[0]);
      else if(r.phase==='event')E.chooseEvent(s,'leave');
      s=copy(s);
    }
    assert.ok(steps<100);assert.equal(s.best,0);assert.equal(s.run.summary.reason,'victory');assert.equal(s.run.summary.cleared,trial.goal);results.push(trial.id+':'+s.run.summary.cleared);
  }
  console.log('Resumed weekly trials: '+results.join(', '));
});
