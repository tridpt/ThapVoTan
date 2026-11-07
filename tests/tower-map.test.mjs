import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {towerMapPage} from '../js/tower-map-ui.mjs';

const roundTrip=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function strong(seed=42){const s=E.createState();E.startRun(s,seed);for(const h of s.run.heroes)Object.assign(h,{atk:100000,hp:100000,maxHp:100000});return s;}
function complete(s,index){
  E.chooseRoute(s,index);
  while(s.run.phase==='battle'){
    const r=s.run,h=r.heroes.find(h=>!r.battle.used.includes(h.id)),enemy=r.battle.enemies.find(e=>e.hp>0);
    if(h)E.playerAction(s,h.id,enemy.id);else E.enemyTurn(s);
  }
  if(s.run.phase==='event')E.chooseEvent(s,'leave');
  if(s.run.phase==='contract')E.selectContract(s,null,s.run.floor);
  if(s.run.phase==='relic')E.selectRelic(s,s.run.relicChoices[0]);
  if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);
}
test('seeded five-floor graphs have no dead ends, two exits per branch and a single mandatory boss',()=>{
  for(let seed=1;seed<=100;seed++)for(const start of [1,6,11,96,999996]){
    const map=E.starterTowerMap(seed);map.start=start;const graph=E.towerSegment(map);assert.equal(graph.nodes.length,13);assert.equal(graph.rows.length,5);
    for(const row of graph.rows.slice(0,4)){assert.equal(new Set(row.map(n=>n.type)).size,3);assert.ok(row.some(n=>n.type==='battle'));for(const node of row){const exits=graph.edges.filter(e=>e.from===node.id);assert.equal(exits.length,node.row===3?1:2);if(node.row<3)assert.ok(exits.some(e=>graph.nodes.find(n=>n.id===e.to).type==='battle'));}}
    assert.deepEqual(graph.rows[4].map(n=>n.type),['boss']);assert.ok(graph.rows[2].some(n=>n.type==='rest'));
    for(const node of graph.nodes.filter(n=>n.row>0))assert.ok(graph.edges.some(e=>e.to===node.id));
    for(const edge of graph.edges)assert.equal(graph.nodes.find(n=>n.id===edge.to).row,graph.nodes.find(n=>n.id===edge.from).row+1);
  }
});
test('map previews are deterministic, differ per seed and never advance combat or loot RNG',()=>{
  const s=strong(),before=structuredClone(s),first=E.towerMapView(s.run);
  for(let i=0;i<10;i++){assert.deepEqual(E.towerMapView(s.run),first);towerMapPage(s,first.nodes[i].id);}
  assert.deepEqual(s,before);assert.notDeepEqual(E.towerSegment(E.starterTowerMap(42)),E.towerSegment(E.starterTowerMap(43)));
  assert.deepEqual(s.run.routes,['battle','treasure','elite']);
});
test('choosing an island restricts the next floor to connected exits and rejects stale or forged routes atomically',()=>{
  const s=strong();complete(s,1);const map=E.towerMapView(s.run);assert.equal(map.choices.length,2);assert.equal(s.run.floor,2);assert.deepEqual(s.run.map.path,['1:1']);
  const blocked=map.nodes.find(n=>n.floor===2&&n.status==='blocked');assert.ok(blocked);assert.equal(blocked.routeIndex,-1);
  for(const index of [-1,2,3,NaN,.5,'0']){const before=structuredClone(s);assert.throws(()=>E.chooseRoute(s,index));assert.deepEqual(s,before);}
  const forged=structuredClone(s);forged.run.routes=['treasure'];const before=structuredClone(forged);assert.throws(()=>E.chooseRoute(forged,0));assert.deepEqual(forged,before);
});
test('all 24 reachable paths play through a segment, pay the boss once and roll into a new saved segment',()=>{
  let paths=0;
  function walk(s){
    assert.deepEqual(roundTrip(s),s);
    if(s.run.floor===6){assert.equal(s.best,5);assert.equal(s.run.map.start,6);assert.deepEqual(s.run.map.path,[]);assert.equal(E.towerMapView(s.run).nodes.at(-1).floor,10);paths++;return;}
    for(let index=0;index<s.run.routes.length;index++){
      const next=structuredClone(s),floor=next.run.floor,oldTickets=next.tickets,oldShards=next.shards;complete(next,index);
      assert.equal(next.run.floor,floor+1);if(floor===5){assert.equal(next.tickets-oldTickets,3);assert.equal(next.shards-oldShards,3);}
      walk(next);
    }
  }
  walk(strong());assert.equal(paths,24);
});
test('every in-progress map phase, boss relic and mid-battle turn resumes without changing path, RNG or rewards',()=>{
  for(let seed=1;seed<=20;seed++){
    const s=strong(seed);
    while(s.run.floor<=10){
      assert.deepEqual(roundTrip(s),s);const index=s.run.routes.findIndex(n=>['event','rest','boss'].includes(n));E.chooseRoute(s,index<0?0:index);assert.deepEqual(roundTrip(s),s);
      if(s.run.phase==='battle'){
        const r=s.run;E.playerAction(s,'rook',r.battle.enemies.find(e=>e.hp>0).id);assert.deepEqual(roundTrip(s),s);
        while(r.phase==='battle'){const h=r.heroes.find(h=>!r.battle.used.includes(h.id));if(h)E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id);else E.enemyTurn(s);}
      }
      assert.deepEqual(roundTrip(s),s);if(s.run.phase==='contract'){E.selectContract(s,null,s.run.floor);assert.deepEqual(roundTrip(s),s);}if(s.run.phase==='relic'){E.selectRelic(s,s.run.relicChoices[0]);assert.deepEqual(roundTrip(s),s);}
      if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);if(s.run.phase==='event')E.chooseEvent(s,seed%2?'trade':'risk');if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);
    }
    E.finishRun(s);assert.deepEqual(roundTrip(s),s);
  }
});
test('old v13 runs keep their routes and combat through migration, while their next journey gets a map',()=>{
  for(const phase of ['route','battle','blessing','event','result']){
    const s=strong();s.run.map=null;
    if(phase==='battle')E.chooseRoute(s,0);
    if(phase==='event'){s.run.routes=['event'];E.chooseRoute(s,0);}
    if(phase==='blessing'){s.run.routes=['rest'];E.chooseRoute(s,0);}
    if(phase==='result')E.finishRun(s);
    s.version=13;delete s.run.map;const before=structuredClone(s),m=roundTrip(s);assert.deepEqual(s,before);assert.equal(m.version,E.SAVE_VERSION);assert.deepEqual(withoutCombatReport(m.run),withoutCombatReport({...s.run,map:null}));
    assert.deepEqual(roundTrip(m),m);E.finishRun(m);E.startRun(m,123);assert.ok(m.run.map);
  }
});
test('campaign, dungeons, weekly challenges, hunts and training keep their existing route systems',()=>{
  const dungeon=E.createState();E.startDungeon(dungeon,'earth',1,new Date(),42);assert.equal(dungeon.run.map,null);assert.deepEqual(dungeon.run.routes,['battle']);roundTrip(dungeon);
  const campaign=E.createState();E.startCampaign(campaign,1,42);assert.equal(campaign.run.map,null);roundTrip(campaign);
  const trial=E.createState();E.startChallenge(trial,'gauntlet');assert.equal(trial.run.map,null);assert.deepEqual(trial.run.routes,['boss']);roundTrip(trial);
  const hunt=E.createState();E.startHunt(hunt,'colossus',1,42);assert.equal(hunt.run.map,null);roundTrip(hunt);
  const before=structuredClone(hunt),practice=E.createTrainingState(hunt);assert.equal(practice.run.map,null);assert.deepEqual(hunt,before);
});
test('map save validation rejects corrupt paths, skipped floors, changed routes and mismatched active islands',()=>{
  const s=strong();complete(s,1);
  for(const alter of [s=>delete s.run.map,s=>s.run.map=[],s=>s.run.map.extra=1,s=>s.run.map.seed=0,s=>s.run.map.seed=2**32,s=>s.run.map.start=6,s=>s.run.map.path=[],s=>s.run.map.path=['1:9'],s=>s.run.map.path=['2:1'],s=>s.run.map.path=['1:1','1:1'],s=>s.run.routes=['treasure'],s=>s.run.node='battle',s=>s.run.phase='event']){
    const bad=structuredClone(s);alter(bad);const before=structuredClone(bad);assert.throws(()=>roundTrip(bad),/Bản đồ|Chuyến|Lối đi/);assert.deepEqual(bad,before);
  }
  E.chooseRoute(s,s.run.routes.indexOf('battle'));
  for(const alter of [s=>s.run.map.path.pop(),s=>s.run.node='rest',s=>s.run.map.path[1]='2:9',s=>s.run.phase='route']){const bad=structuredClone(s);alter(bad);assert.throws(()=>roundTrip(bad));}
});
test('retreat and defeat preserve selected paths, including before making a choice and during boss rewards',()=>{
  const s=strong();E.finishRun(s);assert.deepEqual(roundTrip(s),s);
  const battle=strong();E.chooseRoute(battle,0);E.finishRun(battle,'defeat');assert.deepEqual(roundTrip(battle),battle);
  const boss=strong();while(boss.run.floor<5)complete(boss,0);E.chooseRoute(boss,0);E.playerAction(boss,'rook','enemy0');assert.equal(boss.run.phase,'contract');E.finishRun(boss);assert.deepEqual(roundTrip(boss),boss);assert.equal(boss.best,5);
});
test('the map UI previews future and blocked islands without offering to enter them, and reports actual health/rewards',()=>{
  const s=strong();s.run.heroes[0].hp=0;complete(s,1);const view=E.towerMapView(s.run),blocked=view.nodes.find(n=>n.floor===2&&n.status==='blocked');
  const future=towerMapPage(s,view.nodes.at(-1).id);assert.match(future,/BOSS TẦNG 5/);assert.match(future,/Cự nhân cổ đại/);assert.doesNotMatch(future,/data-action="route"/);assert.match(future,/3 vé · 3 tinh thạch/);assert.match(future,/0% HP/);assert.equal((future.match(/data-map-node=/g)||[]).length,13);
  assert.doesNotMatch(towerMapPage(s,blocked.id),/data-action="route"/);const active=towerMapPage(s,view.choices[0].id);assert.equal((active.match(/data-action="route"/g)||[]).length,1);assert.match(active,/Đường đi tự lưu/);assert.match(active,/ĐƯỜNG ĐÃ CHỌN/);
});
