import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {counterControl,counterDialog,counterSelection} from '../js/counter-ui.mjs';
import {guardBattle,guardedTurn} from './timing-guard-helper.mjs';

const ready=()=>{const s=guardBattle();guardedTurn(s);return s;};
test('counter control is contextual, describes expiry for Auto and never mutates game state',()=>{
  const s=guardBattle();assert.equal(counterControl(s.run),'');guardedTurn(s);const before=structuredClone(s);
  assert.match(counterControl(s.run),/data-action="counter-open"/);assert.match(counterControl(s.run),/150%/);assert.doesNotMatch(counterControl(s.run),/disabled/);
  assert.match(counterControl(s.run,true),/disabled/);assert.match(counterControl(s.run,true),/Hết hạn cuối lượt/);assert.deepEqual(s,before);
});
test('dialog lists all three heroes and explicitly permits used actors, disabling dead ones',()=>{
  const s=ready();s.run.battle.used=['rook'];s.run.heroes[1].hp=0;const before=structuredClone(s),html=counterDialog(s.run,{heroId:'rook'});
  assert.equal((html.match(/data-action="counter-hero"/g)||[]).length,3);assert.match(html,/data-id="aerin" aria-pressed="false" disabled/);assert.match(html,/Đã đánh · Vẫn phản công được/);assert.match(html,/Không tốn lượt/);assert.match(html,/hết hạn khi kết thúc lượt/);assert.deepEqual(s,before);
});
test('dialog selection resolves living actors and targets, keeps body selection and shows all boss parts',()=>{
  const s=ready(),r=s.run;r.battle.used=r.heroes.map(h=>h.id);r.heroes[0].hp=0;
  assert.deepEqual(counterSelection(r,{heroId:'rook',targetId:'missing'}),{heroId:'aerin',targetId:'enemy0',partId:'head'});
  assert.equal(counterSelection(r,{partId:null}).partId,null);const html=counterDialog(r,{partId:'arms'});
  assert.match(html,/data-part="arms" aria-pressed="true"/);assert.equal((html.match(/data-action="counter-part"/g)||[]).length,4);assert.match(html,/data-round="2"/);assert.match(html,new RegExp('data-stamp="'+r.battle.counter.stamp+'"'));
});
test('minion names are escaped and minion targets omit boss parts',()=>{
  const s=ready(),r=s.run;r.battle.enemies.push({...structuredClone(r.battle.enemies[0]),id:'enemy1',kind:'wraith',name:'<img src=x onerror=alert(1)>'});
  const html=counterDialog(r,{targetId:'enemy1',partId:'head'});assert.equal(counterSelection(r,{targetId:'enemy1',partId:'head'}).partId,null);assert.doesNotMatch(html,/data-action="counter-part"/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);
});
test('consumed and expired tokens have no actionable counter markup',()=>{
  for(const end of [s=>E.counterAction(s,'rook','enemy0',E.counterOpportunity(s.run)),s=>E.enemyTurn(s),s=>E.finishRun(s)]){
    const s=ready();end(s);assert.equal(counterDialog(s.run),'');assert.equal(counterControl(s.run),'');
  }
});
