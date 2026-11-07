import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
import {PET} from '../js/adventure-data.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';
import {victoryPage,mvpPanel} from '../js/victory-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const total=(r,field,journey=false)=>Object.values((journey?r.statistics:r.battle.statistics).rows).reduce((n,row)=>n+row[field],0);
function battle(team=['rook','aerin','lumi']){const s=E.createState();for(const h of HEROES)s.owned[h.id]={level:1,copies:0,awaken:0};s.team=team;E.startHunt(s,'colossus',1,42);return s;}
function kill(s){const h=s.run.heroes.find(h=>h.hp>0);s.run.battle.used=[];h.atk=100000;return E.playerAction(s,h.id,'enemy0');}
function legacy(s){const old=withoutCombatReport(s);old.version=14;return old;}

test('MVP counts effective HP damage and excludes shields, overkill and post-victory healing',()=>{
  const s=battle(),r=s.run,e=r.battle.enemies[0];e.shield=10000;E.playerAction(s,'rook','enemy0');assert.equal(r.battle.statistics.rows.rook.damage,0);
  e.shield=0;e.hp=7;const events=kill(s);assert.equal(events[0].value,7);assert.equal(r.battle.statistics.rows.rook.damage,7);assert.equal(total(r,'damage'),7);assert.equal(total(r,'healing'),0);assert.deepEqual(r.statistics.rows,r.battle.statistics.rows);assert.equal(r.victory.stage,'intro');copy(s);
});

test('direct shield skills and overheal conversion credit actual increases to their caster',()=>{
  const s=battle(),r=s.run;for(const h of r.heroes)h.energy=100;
  E.playerAction(s,'rook','enemy0',true);const shields=r.heroes.reduce((n,h)=>n+h.shield,0);assert.equal(r.battle.statistics.rows.rook.shield,shields);assert.ok(shields>0);
  r.relics=['chalice'];r.heroes[0].hp-=12;r.heroes[1].hp-=5;const before=r.heroes.map(h=>({hp:h.hp,shield:h.shield}));E.playerAction(s,'lumi','enemy0',true);
  assert.equal(r.battle.statistics.rows.lumi.healing,17);assert.equal(r.battle.statistics.rows.lumi.shield,r.heroes.reduce((n,h,i)=>n+h.shield-before[i].shield,0));assert.ok(r.battle.statistics.rows.lumi.shield>0);assert.equal(r.battle.statistics.rows.effects.healing,0);copy(s);
});

test('combo damage credits each actual caster and combined support does not double-count events',()=>{
  const s=battle(),r=s.run;r.link.charge=100;const events=E.linkAction(s,'aerin','rook','enemy0');
  for(const id of ['rook','aerin'])assert.equal(r.battle.statistics.rows[id].damage,events.filter(e=>e.actor===id).reduce((n,e)=>n+e.value,0));assert.equal(total(r,'damage'),events.filter(e=>e.actor).reduce((n,e)=>n+e.value,0));
  const support=battle(),v=support.run;v.link.charge=100;v.heroes.forEach(h=>h.hp-=80);const hp=v.heroes.reduce((n,h)=>n+h.hp,0);E.linkAction(support,'rook','lumi','enemy0');
  assert.equal(total(v,'healing'),v.heroes.reduce((n,h)=>n+h.hp,0)-hp);assert.equal(total(v,'shield'),v.heroes.reduce((n,h)=>n+h.shield,0));assert.ok(v.battle.statistics.rows.rook.shield>0);assert.ok(v.battle.statistics.rows.lumi.shield>0);assert.equal(v.battle.statistics.rows.effects.shield,0);copy(support);
});

test('a burn keeps the caster of its strongest active power across reloads and weaker applications',()=>{
  let s=battle(['ember','raiden','lumi']),r=s.run,e=r.battle.enemies[0];r.heroes[0].energy=100;E.playerAction(s,'ember','enemy0',true);assert.deepEqual(e.burnSource,{ember:1});
  e.burnPower=40;r.buffs=['flame'];r.heroes[1].atk=1;E.playerAction(s,'raiden','enemy0');assert.deepEqual(e.burnSource,{ember:1});s=copy(s);r=s.run;e=r.battle.enemies[0];e.freeze=1;const before=r.battle.statistics.rows.ember.damage,actual=E.enemyTurn(s)[0].value;assert.equal(r.battle.statistics.rows.ember.damage,before+actual);assert.equal(r.battle.statistics.rows.effects.damage,0);copy(s);
});

test('combo burn divides actual DOT proportionally and conserves each damage point',()=>{
  const s=battle(['ember','raiden','lumi']),r=s.run;r.link.charge=100;const spec=E.linkForPair('ember','raiden');assert.ok(spec.burn);E.linkAction(s,'ember','raiden','enemy0');const e=r.battle.enemies[0];assert.deepEqual(e.burnSource,{ember:r.heroes[0].atk,raiden:r.heroes[1].atk});e.freeze=1;const before=total(r,'damage'),damage=E.enemyTurn(s)[0].value;assert.equal(total(r,'damage')-before,damage);assert.equal(r.battle.statistics.rows.effects.damage,0);copy(s);
});

test('signature echoes and reflection are credited to the hero who produced them',()=>{
  const s=battle(['kira','rook','lumi']),r=s.run,h=r.heroes[0];h.atk=10;h.energy=100;h.loadout={signature:'kira',sets:[{id:'bloodmoon',count:1}]};const events=E.playerAction(s,'kira','enemy0',true);assert.equal(events.length,2);assert.equal(r.battle.statistics.rows.kira.damage,events.reduce((n,e)=>n+e.value,0));
  const mirror=battle(),v=mirror.run;v.relics=['mirror'];v.heroes[0].shield=1;v.battle.enemies[0].intent=0;E.enemyTurn(mirror);assert.ok(v.battle.statistics.rows.rook.damage>0);assert.equal(v.battle.statistics.rows.effects.damage,0);copy(mirror);
});

test('pet healing, shields and damage have their own row and do not borrow hero talent bonuses',()=>{
  for(const kind of ['heal','shield','burn','drain','freeze']){
    const pet=Object.values(PET).find(p=>p.kind===kind);assert.ok(pet,kind);const s=battle(),r=s.run;r.pet={id:pet.id,level:1,nextRound:1};r.heroes.forEach(h=>h.hp-=70);const hp=r.heroes.reduce((n,h)=>n+h.hp,0);const events=E.petAction(s),row=r.battle.statistics.rows.pet;
    assert.equal(row.healing,r.heroes.reduce((n,h)=>n+h.hp,0)-hp);assert.equal(row.shield,r.heroes.reduce((n,h)=>n+h.shield,0));assert.equal(row.damage,events.filter(e=>e.target.startsWith('enemy')).reduce((n,e)=>n+e.value,0));for(const h of r.heroes)assert.deepEqual(r.battle.statistics.rows[h.id],{damage:0,healing:0,shield:0});assert.equal(total(r,'damage'),row.damage);
  }
});

test('opening shields and relic healing are shared; rest and victory recovery do not inflate MVP',()=>{
  const s=E.createState();E.startRun(s,42);const r=s.run;r.buffs=['barrier'];r.relics=['root'];r.heroes.forEach(h=>h.hp-=50);E.chooseRoute(s,0);assert.equal(r.battle.statistics.rows.effects.shield,r.heroes.reduce((n,h)=>n+h.shield,0));assert.ok(r.battle.statistics.rows.effects.healing>0);
  while(r.phase==='battle'){const h=r.heroes.find(h=>!r.battle.used.includes(h.id));if(h){h.atk=100000;E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id);}else E.enemyTurn(s);}
  const totalBefore=structuredClone(r.statistics);E.selectBlessing(s,r.choices[0]);r.map=null;r.routes=['rest'];E.chooseRoute(s,0);assert.deepEqual(r.statistics,totalBefore);
});

test('journey totals accumulate across battles while each new battle starts at zero',()=>{
  const s=E.createState();E.startRun(s,42);E.chooseRoute(s,0);const r=s.run;for(const h of r.heroes){if(r.phase!=='battle')break;h.atk=100000;E.playerAction(s,h.id,r.battle.enemies.find(e=>e.hp>0).id);}const totals=structuredClone(r.statistics);E.dismissVictory(s);E.selectBlessing(s,r.choices[0]);r.map=null;r.routes=['battle'];E.chooseRoute(s,0);assert.equal(total(r,'damage'),0);assert.deepEqual(r.statistics,totals);E.playerAction(s,'rook','enemy0');assert.equal(total(r,'damage',true),Object.values(totals.rows).reduce((n,row)=>n+row.damage,0)+total(r,'damage'));E.finishRun(s);copy(s);
});

test('v14 migration preserves gameplay in every saved phase and honestly marks old statistics as partial',()=>{
  for(const phase of ['route','battle','blessing','relic','event','story','result']){
    const s=E.createState();E.startRun(s,42);s.run.map=null;if(phase==='story'){E.finishRun(s);E.startCampaign(s,1,42);}else if(phase==='battle')E.chooseRoute(s,0);else if(phase==='blessing'){s.run.routes=['rest'];E.chooseRoute(s,0);}else if(phase==='event'){s.run.routes=['event'];E.chooseRoute(s,0);}else if(phase==='result')E.finishRun(s);else if(phase==='relic'){s.run.floor=5;s.run.routes=['boss'];E.chooseRoute(s,0);kill(s);E.selectContract(s,null,s.run.floor);}
    const old=legacy(s),before=structuredClone(old),migrated=copy(old);assert.deepEqual(old,before);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(withoutCombatReport({...migrated,version:14}),old);assert.equal(migrated.run.statistics.partial,true);assert.equal(migrated.run.victory,null);if(migrated.run.battle)assert.equal(migrated.run.battle.statistics.partial,true);assert.deepEqual(copy(migrated),migrated);
  }
});

test('current imports reject malformed statistics, burn credits and fake victory state atomically',()=>{
  const source=battle(),edits=[s=>delete s.run.statistics,s=>s.run.statistics.partial=0,s=>delete s.run.battle.statistics,s=>s.run.statistics.rows.rook.damage=-1,s=>s.run.statistics.rows.rook.damage=.5,s=>s.run.statistics.rows.rook.damage=1e16,s=>s.run.statistics.rows.extra={damage:0,healing:0,shield:0},s=>s.run.battle.statistics.rows.rook.damage=1,s=>s.run.battle.enemies[0].burnSource={aion:2},s=>s.run.battle.enemies[0].burnSource={rook:0},s=>s.run.battle.enemies[0].burnSource=[],s=>s.run.victory={floor:1,stage:'loot'},s=>delete s.run.victory];
  for(const edit of edits){const s=structuredClone(source);edit(s);const before=structuredClone(s);assert.throws(()=>copy(s));assert.deepEqual(s,before);}
  kill(source);for(const edit of [s=>s.run.victory.floor++,s=>s.run.victory.stage='paid',s=>s.run.battle.enemies[0].hp=1]){const s=structuredClone(source);edit(s);assert.throws(()=>copy(s));}copy(source);
});

test('opening, skipping and reopening the victory chest never grants hunt rewards twice',()=>{
  let s=battle();kill(s);const reward=E.victoryRewards(s.run),paid=structuredClone(s);assert.equal(reward.gold,s.run.summary.huntReward.gold);assert.equal(reward.marks,1);assert.equal(reward.loot,null);assert.equal(E.advanceVictory(s),'loot');s=copy(s);assert.equal(s.run.victory.stage,'loot');assert.equal(E.advanceVictory(s),'done');assert.equal(E.dismissVictory(s),false);assert.throws(()=>E.advanceVictory(s));E.finishRun(s);assert.deepEqual(withoutCombatReport(s),withoutCombatReport(paid));assert.equal(s.armory.hunts.colossus.clears,1);assert.deepEqual(copy(s),s);
});

test('a full bag reports converted gear dust and keeps one payout through immediate skip',()=>{
  const s=E.createState();while(s.inventory.length<E.GEAR_LIMIT)E.dropGear(s,()=>.5,1,'treasure');E.startRun(s,42);const r=s.run;r.map=null;r.floor=5;r.routes=['boss'];E.chooseRoute(s,0);const dust=s.dust;kill(s);assert.ok(r.lastReward.loot.converted);assert.equal(s.dust,dust+r.lastReward.loot.dust);const wallet=[s.gold,s.tickets,s.shards,s.dust,s.inventory.length];E.dismissVictory(s);assert.deepEqual([s.gold,s.tickets,s.shards,s.dust,s.inventory.length],wallet);assert.match(victoryPage({...s,run:{...r,victory:{floor:5,stage:'loot'}}}),/Đã đổi thành/);copy(s);
});

test('MVP ranks support alongside damage, excludes shared effects and exposes partial history',()=>{
  const s=battle(),r=s.run,rows=r.battle.statistics.rows;rows.rook.shield=120;rows.aerin.damage=120;rows.lumi.healing=121;rows.pet.damage=10000;assert.equal(E.contributionRanking(r).mvp,'lumi');rows.lumi.healing=0;assert.equal(E.contributionRanking(r).mvp,'rook');r.battle.statistics.partial=true;const html=mvpPanel(r);assert.match(html,/Chỉ tính đóng góp/);assert.match(html,/Linh thú/);assert.match(html,/Tạo khiên/);assert.match(html,/scope="row"/);assert.match(html,/MVP theo tổng/);
});

test('victory markup offers immediate continuation and only shows real rewards, including practice and campaign notices',()=>{
  const s=battle();kill(s);const before=structuredClone(s);let html=victoryPage(s);assert.match(html,/data-action="victory-skip"/);assert.match(html,/Mở rương/);assert.doesNotMatch(html,/victory-loot-rarity/);E.advanceVictory(s);html=victoryPage(s);assert.match(html,/Ấn săn boss/);assert.match(html,/Phần thưởng đã lưu/);assert.doesNotMatch(html,/victory-loot-rarity/);assert.deepEqual({...s,run:{...s.run,victory:before.run.victory}},before);
  const practice=E.createTrainingState(E.createState());kill(practice);E.advanceVictory(practice);assert.match(victoryPage(practice),/không nhận tài nguyên/);assert.equal(E.victoryRewards(practice.run).practice,true);
  const campaign=battle();kill(campaign);campaign.run.hunt=null;campaign.run.summary.huntReward=null;campaign.run.summary.campaignReward={first:true,stage:1};assert.match(victoryPage({...campaign,run:{...campaign.run,victory:{floor:1,stage:'loot'}}}),/Nhận thêm tại mục Chiến dịch/);
});
