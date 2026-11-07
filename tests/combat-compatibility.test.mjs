import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import {combatTrace,traceScenarios} from './combat-trace-helper.mjs';

test('60 real action traces match the released 1.18 engine for every hero, RNG, combat state and reward',()=>{
  const baseline=JSON.parse(readFileSync(new URL('../artifacts/qa/combat-baseline-v1.18.json',import.meta.url),'utf8'));
  assert.equal(baseline.apkSha256,'8d1dccf4ce5780f762fa8dc4ae698ff1fe4d3b0ef984ff407998c0610c18a37d');assert.equal(baseline.scenarios.length,60);
  for(const [index,scenario] of traceScenarios.entries())assert.deepEqual(combatTrace(E,scenario),baseline.scenarios[index].trace,JSON.stringify(scenario));
});
