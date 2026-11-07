import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as V18 from '../artifacts/qa/void-dragon-legacy-v1.23.0/engine.mjs';
import * as V17 from '../artifacts/qa/void-dragon-legacy-v1.22.0/engine.mjs';
import {HEROES} from '../js/data.mjs';
const wallet=s=>[s.gold,s.tickets,s.shards,s.dust,s.armory.essence,s.nextGearId];
function account(Old){const s=Old.createState();for(const h of HEROES)s.owned[h.id]={level:50,copies:0,awaken:0};Old.autoRaidTeams(s);return s;}
function power(s){for(const t of s.run.raid.teams)for(const h of t.heroes)h.atk=100000;for(const h of s.run.heroes)h.atk=100000;}
function clear(Old,s){let steps=0;while(s.run.phase==='battle'&&steps++<40){const r=s.run,h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),e=r.battle.enemies.find(e=>e.hp>0);if(h)Old.playerAction(s,h.id,e.id,false,e.kind==='boss'?Old.recommendedBossPart(r):null);else Old.enemyTurn(s);}assert.notEqual(s.run.phase,'battle');}
function scenario(Old,kind){
  const s=account(Old);Old.startRaid(s,1,42);if(kind==='battle')return s;
  power(s);clear(Old,s);if(kind==='relay-intro')return s;Old.dismissVictory(s);if(kind==='relay-done')return s;Old.continueRaid(s,0);if(kind==='stage-two')return s;clear(Old,s);Old.dismissVictory(s);Old.continueRaid(s,1);if(kind==='stage-three')return s;
  if(kind==='retreat'){Old.finishRun(s);return s;}if(kind==='defeat'){for(const h of s.run.heroes)h.hp=0;Old.enemyTurn(s);return s;}
  clear(Old,s);if(kind==='claimed')Old.claimAllRaidMissions(s,1);return s;
}
const kinds=['battle','relay-intro','relay-done','stage-two','stage-three','victory','retreat','defeat'];
for(const [Old,version] of [[V18,18],[V17,17]])for(const kind of kinds)test(`released APK save v${version}: ${kind} gains an empty dragon ledger while its run, RNG and wallet stay exact`,()=>{
  const old=scenario(Old,kind),before=structuredClone(old),migrated=E.validateState(JSON.parse(JSON.stringify(old)));assert.equal(old.version,version);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(old,before);assert.deepEqual(migrated.run,old.run);assert.deepEqual(wallet(migrated),wallet(old));assert.deepEqual(migrated.inventory,old.inventory);assert.deepEqual(migrated.raids.teams,old.raids.teams);assert.deepEqual(migrated.raids.fronts,old.raids.fronts);assert.deepEqual(migrated.raids.dragon,E.starterDragonRaids());
  assert.equal(Object.hasOwn(migrated.run.raid,'boss'),false);assert.equal(E.raidUnlocked(migrated,1,'void-dragon'),false);assert.deepEqual(E.validateState(JSON.parse(JSON.stringify(migrated))),migrated);
  if(kind==='battle'){Old.playerAction(old,old.run.heroes[0].id,'enemy0',true,'core');E.playerAction(migrated,migrated.run.heroes[0].id,'enemy0',true,'core');assert.deepEqual(migrated.run,old.run);}
  if(kind==='stage-three'){clear(Old,old);clear(E,migrated);assert.deepEqual(migrated.run,old.run);assert.deepEqual(wallet(migrated),wallet(old));}
});

test('released v18 mission claims and unlocked Tam An elite migrate without being paid or erased',()=>{
  const s=scenario(V18,'claimed');V18.startRaid(s,2,99);power(s);for(let i=0;i<3;i++){clear(V18,s);if(i<2){V18.dismissVictory(s);V18.continueRaid(s,i);}}V18.claimRaidMission(s,2,'first');const before=structuredClone(s),m=E.validateState(s);assert.deepEqual(s,before);assert.deepEqual(m.raids.records,s.raids.records);assert.deepEqual(m.run,s.run);assert.deepEqual(wallet(m),wallet(s));assert.equal(E.raidUnlocked(m,1,'void-dragon'),true);assert.equal(E.readyRaidMissions(m,'void-dragon').length,0);
});

test('v18 migration rejects injected dragon data and malformed historical ledgers without mutating source',()=>{
  for(const alter of [s=>s.raids.dragon=E.starterDragonRaids(),s=>s.raids.extra=0,s=>delete s.raids.records,s=>s.raids.records[0].claimed=['first']]){const s=account(V18);alter(s);const before=structuredClone(s);assert.throws(()=>E.validateState(s));assert.deepEqual(s,before);}
});
