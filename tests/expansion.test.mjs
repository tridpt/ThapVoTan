import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {GEAR_BASE,RELICS,bossForFloor} from '../js/data.mjs';

const roundTrip=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function battle(floor=1,relics=[]){
  const s=E.createState();E.startRun(s,426193);delete s.run.anomalyRules;delete s.run.anomalyOrder;s.run.floor=floor;s.run.relics=relics;s.run.map=null;s.run.routes=[floor%5===0?'boss':'battle'];E.chooseRoute(s,0);return s;
}
function oldSave(s){
  const old=structuredClone(s);old.version=1;
  for(const k of ['dust','nextGearId','inventory','equipped'])delete old[k];
  if(old.run){for(const k of ['relics','relicChoices','relicUsed','gearFound'])delete old.run[k];
    if(old.run.battle){delete old.run.battle.bossState;delete old.run.battle.relicSkillUsed;for(const e of old.run.battle.enemies){delete e.shield;delete e.deathHandled;}}
  }return old;
}
test('v1 migration preserves currency, pity, heroes and a partially played battle',()=>{
  const s=battle();s.gold=4312;s.pity=37;E.playerAction(s,'rook','enemy0');
  const before=oldSave(s),migrated=E.validateState(before);
  assert.equal(migrated.version,E.SAVE_VERSION);assert.equal(migrated.gold,4312);assert.equal(migrated.pity,37);assert.deepEqual(migrated.owned,s.owned);
  assert.deepEqual(migrated.run.battle.used,['rook']);assert.equal(migrated.run.battle.enemies[0].hp,s.run.battle.enemies[0].hp);assert.deepEqual(migrated.run.heroes,s.run.heroes.map(h=>({...h,loadout:null,talents:null})));
  assert.equal(migrated.inventory.length,3);assert.equal(roundTrip(migrated).inventory.length,3);assert.equal(before.version,1);
});
test('legacy bosses finish under their original rules; new floors use new bosses',()=>{
  const migrated=E.validateState(oldSave(battle(5)));assert.equal(migrated.run.battle.bossState,null);
  E.enemyTurn(migrated);assert.equal(migrated.run.phase,'battle');assert.equal(roundTrip(migrated).run.battle.round,2);
  assert.equal(E.bossInfo(battle(10).run).id,'archivist');assert.equal(bossForFloor(25).id,'colossus');
});
test('equipping and transferring enforces one owner and snapshots active run stats',()=>{
  const s=E.createState(),base=E.heroStats(s,'rook');E.equipGear(s,'gear-1','rook');
  assert.equal(E.heroStats(s,'rook').atk,base.atk+8);assert.equal(E.heroStats(s,'rook').maxHp,base.maxHp+12);
  E.startRun(s,5);const snapshot=structuredClone(s.run.heroes);
  E.equipGear(s,'gear-1','aerin');assert.equal(E.gearOwner(s,'gear-1'),'aerin');assert.equal(s.equipped.rook.weapon,undefined);assert.deepEqual(s.run.heroes,snapshot);
  E.unequipGear(s,'gear-1');assert.equal(E.gearOwner(s,'gear-1'),null);assert.deepEqual(roundTrip(s).run.heroes,snapshot);
});
test('upgrading consumes exact materials, increases stats, and stops at +10',()=>{
  const s=E.createState(),g=s.inventory[0],before=E.gearStats(g),cost=E.gearUpgradeCost(g);s.gold=1e6;s.dust=1000;
  const gold=s.gold,dust=s.dust;E.upgradeGear(s,g.id);assert.equal(s.gold,gold-cost.gold);assert.equal(s.dust,dust-cost.dust);assert.ok(E.gearStats(g).atk>before.atk);
  while(g.level<10)E.upgradeGear(s,g.id);const snapshot=structuredClone(s);assert.throws(()=>E.upgradeGear(s,g.id),/tối đa/);assert.deepEqual(s,snapshot);
});
test('failed upgrades do not spend anything and equipped gear cannot be dismantled',()=>{
  const s=E.createState();s.dust=0;const before=structuredClone(s);assert.throws(()=>E.upgradeGear(s,'gear-1'),/Chưa đủ/);assert.deepEqual(s,before);
  E.equipGear(s,'gear-1','rook');assert.throws(()=>E.dismantleGear(s,'gear-1'),/tháo/);E.unequipGear(s,'gear-1');
  const dust=E.dismantleGear(s,'gear-1');assert.equal(dust,3);assert.equal(s.inventory.length,2);assert.equal(s.dust,3);assert.throws(()=>E.dismantleGear(s,'gear-1'));
});
test('every equipment upgrade improves the primary stat even for low-stat accessories',()=>{
  const s=E.createState();s.gold=1e7;s.dust=100000;
  for(const base of ['dawnblade','mossguard','sunpendant'])for(const rarity of ['R','SR','SSR']){
    const g=E.dropGear(s,()=>.5,5,'boss').gear;g.base=base;g.rarity=rarity;
    const primary=base==='dawnblade'?'atk':base==='mossguard'?'maxHp':'def';
    while(g.level<10){const value=E.gearStats(g)[primary];E.upgradeGear(s,g.id);assert.ok(E.gearStats(g)[primary]>value);}
  }
});
test('treasure always drops persistent equipment and a full inventory converts safely',()=>{
  const s=E.createState();E.startRun(s,1);const result=E.chooseRoute(s,1);assert.ok(result.loot.gear);assert.equal(s.inventory.length,4);assert.equal(s.run.gearFound,1);
  while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,3,'treasure');
  const before=s.dust,id=s.nextGearId,loot=E.dropGear(s,()=>.5,5,'boss');assert.equal(loot.converted,true);assert.equal(loot.gear.rarity,'SR');assert.equal(s.dust,before+8);assert.equal(s.inventory.length,E.GEAR_LIMIT);assert.equal(s.nextGearId,id+1);
  E.finishRun(s);assert.equal(roundTrip(s).inventory.length,E.GEAR_LIMIT);
});
test('random gear keeps valid unique affixes, slots, qualities and boss rarity',()=>{
  const s=E.createState();let seed=5243;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<100;i++){
    const source=i%3===0?'boss':i%3===1?'elite':'treasure',loot=E.dropGear(s,rng,i+1,source),g=loot.gear;
    if(source==='boss')assert.notEqual(g.rarity,'R');assert.ok(GEAR_BASE[g.base]);assert.equal(g.affixes.length,new Set(g.affixes.map(a=>a.stat)).size);assert.ok(g.quality>=85&&g.quality<=115);
  }roundTrip(s);
});
test('corrupted gear and double ownership are rejected on import',()=>{
  for(const mutate of [s=>s.inventory[0].quality=999,s=>s.inventory[0].affixes[0].stat='html',s=>s.inventory[0].level=11,s=>s.equipped={rook:{weapon:'gear-1'},aerin:{weapon:'gear-1'}},s=>s.equipped={rook:{armor:'gear-1'}},s=>s.inventory.push(structuredClone(s.inventory[0])),s=>s.dust=-1]){
    const s=E.createState();mutate(s);assert.throws(()=>roundTrip(s));
  }
});
test('boss rewards offer unique unowned relics before a blessing and pay once',()=>{
  const s=battle(5,['mirror']),r=s.run;r.heroes[0].atk=10000;const gold=s.gold;
  E.playerAction(s,'rook','enemy0');assert.equal(r.phase,'contract');E.selectContract(s,null,r.floor);assert.equal(r.phase,'relic');assert.equal(r.relicChoices.length,3);assert.equal(new Set(r.relicChoices).size,3);assert.ok(!r.relicChoices.includes('mirror'));
  assert.equal(s.inventory.length,4);assert.ok(s.gold>gold);const rewardGold=s.gold;
  const resumed=roundTrip(s);assert.equal(resumed.run.phase,'relic');E.selectRelic(resumed,resumed.run.relicChoices[0]);assert.equal(resumed.run.phase,'blessing');assert.equal(resumed.gold,rewardGold);
  assert.throws(()=>E.selectRelic(resumed,'mirror'));E.selectBlessing(resumed,resumed.run.choices[0]);assert.equal(resumed.run.floor,6);
});
test('collecting all relics does not block subsequent boss rewards or retreat records',()=>{
  const s=battle(5,RELICS.map(a=>a.id));s.run.heroes[0].atk=10000;E.playerAction(s,'rook','enemy0');assert.equal(s.run.phase,'contract');E.selectContract(s,null,s.run.floor);assert.equal(s.run.phase,'blessing');E.finishRun(s);assert.equal(s.run.summary.cleared,5);
  const fresh=battle(5);fresh.run.heroes[0].atk=10000;E.playerAction(fresh,'rook','enemy0');E.selectContract(fresh,null,fresh.run.floor);assert.equal(fresh.run.phase,'relic');E.finishRun(fresh);assert.equal(fresh.run.summary.cleared,5);assert.equal(fresh.best,5);
});
test('overhealing creates a capped shield without reducing stronger existing shields',()=>{
  const s=battle(1,['chalice']),r=s.run;r.heroes[2].energy=100;E.playerAction(s,'lumi','enemy0',true);
  for(const h of r.heroes)assert.equal(h.shield,Math.round(Math.round(h.maxHp*.3)*.6));
  E.enemyTurn(s);for(const h of r.heroes){h.hp=h.maxHp;h.shield=h.maxHp;}r.heroes[2].energy=100;E.playerAction(s,'lumi','enemy0',true);assert.ok(r.heroes.every(h=>h.shield===h.maxHp));
});
test('shield break reflects damage and kill energy triggers only once',()=>{
  const s=battle(1,['mirror','spark']),r=s.run,e=r.battle.enemies[0],h=r.heroes[0];
  r.battle.enemies[1].hp=0;r.battle.enemies[1].deathHandled=true;e.hp=5;e.intent=0;e.atk=20;h.shield=1;h.energy=0;
  E.enemyTurn(s);assert.equal(e.hp,0);assert.equal(h.energy,20);assert.equal(r.phase,'blessing');const wins=s.wins;assert.throws(()=>E.enemyTurn(s));assert.equal(s.wins,wins);
});
test('burn explosions chain once per death and reward energy for each kill',()=>{
  const s=battle(3,['cinder','spark']),r=s.run;
  for(const h of r.heroes)h.energy=0;
  for(const e of r.battle.enemies){e.hp=1;e.burn=1;e.burnPower=10;}
  E.enemyTurn(s);assert.equal(r.phase,'blessing');assert.ok(r.battle.enemies.every(e=>e.deathHandled));assert.ok(r.heroes.every(h=>h.energy===60));
});
test('hourglass refunds the first skill per round, including after resume',()=>{
  const s=battle(5,['hourglass']);for(const h of s.run.heroes)h.energy=100;
  E.playerAction(s,'rook','enemy0',true);assert.equal(s.run.heroes[0].energy,35);
  const restored=roundTrip(s);E.playerAction(restored,'lumi','enemy0',true);assert.equal(restored.run.heroes[2].energy,0);E.enemyTurn(restored);restored.run.heroes[2].energy=100;
  E.playerAction(restored,'lumi','enemy0',true);assert.equal(restored.run.heroes[2].energy,35);
});
test('lantern revives once for the entire expedition and remembers use after resume',()=>{
  const s=battle(1,['lantern']),r=s.run,h=r.heroes[0];h.hp=1;
  for(const e of r.battle.enemies){e.intent=0;e.atk=20;}
  E.enemyTurn(s);assert.equal(r.relicUsed.lantern,true);assert.ok(h.hp>0);
  const restored=roundTrip(s);restored.run.heroes[0].hp=1;E.enemyTurn(restored);assert.equal(restored.run.heroes[0].hp,0);assert.equal(restored.run.relicUsed.lantern,true);
});
test('prism adds damage against frozen targets and extra energy; root applies once on entry',()=>{
  const s=battle(5,['prism']),control=battle(5);s.run.battle.enemies[0].freeze=1;s.run.heroes[0].energy=0;control.run.heroes[0].energy=0;
  const event=E.playerAction(s,'rook','enemy0')[0],base=E.playerAction(control,'rook','enemy0')[0];assert.ok(event.value>base.value);assert.equal(s.run.heroes[0].energy,55);assert.equal(control.run.heroes[0].energy,35);
  const rooted=E.createState();E.startRun(rooted,2);rooted.run.relics=['root','chalice'];rooted.run.heroes[0].hp=0;E.chooseRoute(rooted,0);assert.equal(rooted.run.heroes[0].hp,Math.round(rooted.run.heroes[0].maxHp*.12));
  assert.equal(rooted.run.heroes[1].energy,100);assert.ok(rooted.run.heroes[1].shield>0);const hp=rooted.run.heroes[0].hp;assert.equal(roundTrip(rooted).run.heroes[0].hp,hp);
});
test('colossus telegraphs a quake and two skills interrupt it across save/resume',()=>{
  const s=battle(5),r=s.run;E.enemyTurn(s);assert.equal(E.bossInfo(r).move,'charge');E.enemyTurn(s);assert.equal(E.bossInfo(r).move,'quake');
  for(const h of r.heroes){h.energy=100;h.atk=10;}
  E.playerAction(s,'rook','enemy0',true);assert.equal(E.bossInfo(r).stagger,1);
  const resumed=roundTrip(s);E.playerAction(resumed,'aerin','enemy0',true);assert.equal(E.bossInfo(resumed.run).move,'stunned');const hp=resumed.run.heroes.map(h=>h.hp);E.enemyTurn(resumed);assert.deepEqual(resumed.run.heroes.map(h=>h.hp),hp);assert.equal(E.bossInfo(resumed.run).move,'strike');
});
test('freezing cancels a telegraphed quake and the second phase triggers only once',()=>{
  const s=battle(5),r=s.run;E.enemyTurn(s);E.enemyTurn(s);r.battle.enemies[0].freeze=1;const hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.deepEqual(r.heroes.map(h=>h.hp),hp);assert.equal(E.bossInfo(r).move,'strike');
  const e=r.battle.enemies[0];e.hp=Math.round(e.maxHp*.51);r.heroes[0].atk=20;E.playerAction(s,'rook',e.id);assert.equal(E.bossInfo(r).phase,2);assert.equal(roundTrip(s).run.battle.bossState.phase,2);
});
test('archivist minions arrive without attacking immediately and shield their boss',()=>{
  const s=battle(10),r=s.run,hp=r.heroes.map(h=>h.hp);E.enemyTurn(s);assert.equal(r.battle.enemies.length,3);assert.deepEqual(r.heroes.map(h=>h.hp),hp);
  const unguarded=structuredClone(s);for(const e of unguarded.run.battle.enemies.slice(1)){e.hp=0;e.deathHandled=true;}
  const guardedDamage=E.playerAction(s,'rook','enemy0')[0].value,normalDamage=E.playerAction(unguarded,'rook','enemy0')[0].value;assert.ok(guardedDamage<normalDamage);
  for(let i=0;i<7;i++){for(const h of r.heroes){h.hp=h.maxHp=100000;}E.enemyTurn(s);roundTrip(s);assert.ok(r.battle.enemies.length<=3);assert.deepEqual(r.battle.enemies.map(e=>e.id),['enemy0','enemy1','enemy2']);}
});
test('ash knight siphon heals from health lost, with shields preventing the drain',()=>{
  const s=battle(15),r=s.run,e=r.battle.enemies[0];r.battle.bossState.move='siphon';e.hp-=200;
  E.formationTarget(r,e).shield=10000;const before=e.hp;E.enemyTurn(s);assert.equal(e.hp,before);
  r.battle.bossState.move='siphon';const h=E.formationTarget(r,e);h.shield=0;h.hp=h.maxHp=10000;const hp=h.hp;
  E.enemyTurn(s);assert.equal(e.hp-before,Math.round((hp-h.hp)*.5));
});
test('moon boss shields absorb normal attacks and damaging skills break the barrier',()=>{
  const s=battle(20),r=s.run,e=r.battle.enemies[0];E.enemyTurn(s);assert.ok(e.shield>0);const before=e.hp,shield=e.shield;
  E.playerAction(s,'rook',e.id);assert.equal(e.hp,before);assert.ok(e.shield<shield);
  r.heroes[1].energy=100;E.playerAction(s,'aerin',e.id,true);assert.equal(e.shield,0);assert.ok(e.hp<before);roundTrip(s);
});
test('equipped gear, relics, boss intents, charges and shields all survive serialization',()=>{
  let s=E.createState();E.equipGear(s,'gear-1','rook');E.startRun(s,124);s.run.floor=20;s.run.map=null;s.run.routes=['boss'];s.run.relics=['chalice','lantern'];E.chooseRoute(s,0);E.enemyTurn(s);
  assert.deepEqual(roundTrip(s),s);s=roundTrip(s);s.run.battle.bossState.move='javascript';assert.throws(()=>roundTrip(s));
});
test('v1 route, blessing, event and result saves migrate without losing their pending choices',()=>{
  for(const phase of ['route','blessing','event','result']){
    const s=E.createState();E.startRun(s,10);
    if(phase==='blessing'){s.run.map=null;s.run.routes=['rest'];E.chooseRoute(s,0);}
    if(phase==='event'){s.run.map=null;s.run.routes=['event'];E.chooseRoute(s,0);}
    if(phase==='result')E.finishRun(s);
    const restored=E.validateState(oldSave(s));assert.equal(restored.run.phase,phase);assert.deepEqual(restored.run.choices,s.run.choices);assert.equal(restored.run.floor,s.run.floor);roundTrip(restored);
  }
});
test('invalid relics, loot metadata and inherited object keys are rejected',()=>{
  const invalidRelic=battle();invalidRelic.run.relics=['toString'];assert.throws(()=>roundTrip(invalidRelic));
  const s=battle(5);s.run.heroes[0].atk=10000;E.playerAction(s,'rook','enemy0');s.run.lastReward.loot.gear.base='constructor';assert.throws(()=>roundTrip(s));
  const invalidHero=E.createState();invalidHero.owned.constructor={level:1,copies:0};assert.throws(()=>roundTrip(invalidHero));
  const invalidChoices=battle();invalidChoices.run.phase='relic';invalidChoices.run.relicChoices=['mirror','mirror'];assert.throws(()=>roundTrip(invalidChoices));
});
test('a reflected hit crossing the knight phase threshold keeps the next siphon telegraph',()=>{
  const s=battle(15,['mirror']),r=s.run,e=r.battle.enemies[0];e.hp=Math.round(e.maxHp*.51);const h=E.formationTarget(r,e);h.shield=1;h.atk=200;
  E.enemyTurn(s);assert.equal(E.bossInfo(r).phase,2);assert.equal(E.bossInfo(r).move,'siphon');roundTrip(s);
});
test('25 geared expeditions with all relic combos remain finite and resumable at every boundary',()=>{
  for(let seed=1;seed<=25;seed++){
    let s=E.createState();for(const h of Object.values(s.owned))h.level=8;
    E.equipGear(s,'gear-1','aerin');E.equipGear(s,'gear-2','rook');E.equipGear(s,'gear-3','lumi');E.startRun(s,seed*7183);s.run.relics=RELICS.map(a=>a.id);let steps=0;
    while(s.run.phase!=='result'&&s.run.floor<=45&&steps++<5000){
      const r=s.run;
      if(r.phase==='route')E.chooseRoute(s,0);
      else if(r.phase==='contract')E.selectContract(s,null,r.floor);
      else if(r.phase==='blessing')E.selectBlessing(s,r.choices[0]);
      else if(r.phase==='event')E.chooseEvent(s,'leave');
      else if(r.phase==='battle'){
        const h=r.heroes.find(a=>a.hp>0&&!r.battle.used.includes(a.id));
        if(!h)E.enemyTurn(s);else{const enemy=r.battle.enemies.filter(e=>e.hp>0).sort((a,b)=>a.hp-b.hp)[0];E.playerAction(s,h.id,enemy.id,h.energy>=100&&(h.id!=='lumi'||r.heroes.some(a=>a.hp/a.maxHp<.8)));}
      }
      s=roundTrip(s);
    }
    assert.ok(steps<5000);assert.ok(s.gold>=0);assert.ok(s.dust>=0);assert.ok(s.run.heroes.every(h=>Number.isFinite(h.hp)&&Number.isFinite(h.shield)));
  }
});
