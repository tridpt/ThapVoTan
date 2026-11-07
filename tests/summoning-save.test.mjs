import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import {legacySummonCases} from './summoning-legacy-helper.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

for(const fixture of legacySummonCases())test(`APK save v${fixture.version} ${fixture.kind}: migrate a neutral contract with exact run, economy, pity and next combat action`,()=>{
  const old=fixture.create(),before=structuredClone(old),s=E.validateState(JSON.parse(JSON.stringify(old)));assert.equal(old.version,fixture.version);assert.equal(s.version,E.SAVE_VERSION);assert.deepEqual(old,before);assert.deepEqual(s.summoning,E.starterSummoning());
  for(const key of Object.keys(old).filter(k=>!['version','raids','run'].includes(k)))assert.deepEqual(s[key],old[key],key);
  assert.deepEqual(s.run,fixture.version===16&&old.run?{...old.run,raid:null}:old.run);if(fixture.version===19)assert.deepEqual(s.raids,old.raids);assert.deepEqual(E.validateState(JSON.parse(JSON.stringify(s))),s);
  if(old.run?.phase==='battle'){const h=old.run.heroes.find(v=>v.hp>0&&!old.run.battle.used.includes(v.id));const skill=h.energy>=100,part=fixture.Old.bossParts(old.run)?'core':null;fixture.Old.playerAction(old,h.id,'enemy0',skill,part);E.playerAction(s,h.id,'enemy0',skill,part);assert.deepEqual(withoutCombatReport(s.run),withoutCombatReport(old.run));assert.equal(s.gold,old.gold);assert.equal(s.tickets,old.tickets);assert.equal(s.shards,old.shards);}
});

test('archived v2 save reaches the current version with a neutral target and the original inventory without changing its source',()=>{
  const raw=JSON.parse(readFileSync(new URL('../artifacts/qa/browser-v1.1-backup.json',import.meta.url),'utf8')),old=raw.state||raw,before=structuredClone(old),s=E.validateState(old);assert.equal(old.version,2);assert.equal(s.version,E.SAVE_VERSION);assert.deepEqual(old,before);assert.deepEqual(s.summoning,E.starterSummoning());assert.deepEqual(s.inventory,old.inventory);assert.deepEqual(E.validateState(JSON.parse(JSON.stringify(s))),s);
});

test('historical saves cannot inject earned target contracts or exchange history before their introduction',()=>{
  const fixture=legacySummonCases().find(v=>v.version===19);
  for(const change of [s=>s.summoning={...E.starterSummoning(),target:'astra'},s=>s.summoning={...E.starterSummoning(),guaranteed:{...E.starterSummoning().guaranteed,EX:true}},s=>s.summoning={...E.starterSummoning(),exchanged:['aerin']},s=>s.summoning={}]){const s=fixture.create();change(s);const before=structuredClone(s);assert.throws(()=>E.validateState(s));assert.deepEqual(s,before);}
});
