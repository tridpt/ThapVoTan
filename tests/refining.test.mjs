import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/refining-legacy-v1.40.0/js/engine.mjs';
import {GEAR_RARITY,GEAR_SLOTS,GEAR_BASE} from '../js/data.mjs';
import {refiningDialog,refiningEntry,refiningResume} from '../js/refining-ui.mjs';
import {gearDetail,equipmentPage} from '../js/expansion-ui.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const rich=()=>{const s=E.createState();s.gold=1000000;s.dust=100000;s.armory.essence=10000;for(const k of Object.keys(s.armory.marks))s.armory.marks[k]=1000;return s;};
const atomic=(s,fn,pattern)=>{const before=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,before);};
const roll=(s,id='gear-1',line=0,draw=.5)=>E.rollGearRefining(s,id,line,E.refiningReceipt(s,id,line),()=>draw);
const settle=(s,choice='new')=>{const p=s.refining.pending;return E.resolveGearRefining(s,p.id,choice,E.refiningReceipt(s,p.id,p.line));};
function make(s,rarity,base){
  const primary=GEAR_SLOTS[GEAR_BASE[base].slot].stat,pool=['atk','maxHp','def'].filter(k=>k!==primary).concat(['crit','drain','energy']);
  const g={id:'gear-'+s.nextGearId++,base,rarity,level:10,quality:113,affixes:pool.slice(0,GEAR_RARITY[rarity].affixes).map(stat=>({stat,value:stat==='maxHp'?12:2}))};s.inventory.push(g);return g;
}

test('inspection and line selection are read-only and never expose or sample the next result',()=>{
  const s=rich(),before=structuredClone(s),random=Math.random;Math.random=()=>{throw new Error('inspection sampled RNG');};
  try{for(let i=0;i<3;i++){const p=E.previewGearRefining(s,'gear-1');assert.deepEqual(p.range,{min:7,max:20});assert.deepEqual(p.cost,{gold:80,dust:2});assert.equal(Object.hasOwn(p,'newValue'),false);refiningDialog(s,'gear-1');gearDetail(s,'gear-1','rook');equipmentPage(s,'rook','all');}}
  finally{Math.random=random;}
  assert.deepEqual(s,before);assert.deepEqual(copy(s),s);
});

for(const rarity of Object.keys(GEAR_RARITY))for(const base of ['dawnblade','mossguard','sunpendant'])test(`${rarity} ${base}: every secondary line can reach both stated bounds, keeping item identity and all other affixes`,()=>{
  const original=rich(),g=make(original,rarity,base);E.equipGear(original,g.id,'rook');E.validateEquipment(original);
  for(let line=0;line<g.affixes.length;line++)for(const draw of [0,.5,1-Number.EPSILON]){
    const s=structuredClone(original),before=structuredClone(s),plan=E.previewGearRefining(s,g.id,line),paid=roll(s,g.id,line,draw);
    assert.ok(paid.newValue>=plan.range.min&&paid.newValue<=plan.range.max);assert.equal(s.gold,before.gold-plan.cost.gold);assert.equal(s.dust,before.dust-plan.cost.dust);
    if(draw===0)assert.equal(paid.newValue,plan.range.min);if(draw>.99)assert.equal(paid.newValue,plan.range.max);
    assert.deepEqual(s.inventory,before.inventory);assert.deepEqual(copy(s),s);const again=structuredClone(before);assert.deepEqual(roll(again,g.id,line,draw),paid);
    paid.newValue=-10;assert.notEqual(s.refining.pending.newValue,-10);const value=s.refining.pending.newValue;
    settle(s);const expected=structuredClone(g);expected.affixes[line].value=value;assert.deepEqual(s.inventory.find(a=>a.id===g.id),expected);assert.equal(E.gearOwner(s,g.id),'rook');
    for(const key of Object.keys(s).filter(k=>!['gold','dust','refining','inventory'].includes(k)))assert.deepEqual(s[key],before[key],key);
    assert.deepEqual(s.refining,{rolls:1,pending:null});assert.deepEqual(copy(s),s);
  }
});

test('a paid result survives repeated inspection, reload and export/import without paying again; keeping never refunds',()=>{
  let s=rich();const before=structuredClone(s);roll(s);const paid=structuredClone(s),receipt=E.refiningReceipt(s,'gear-1',0);
  atomic(s,()=>E.rollGearRefining(s,'gear-2',0,E.refiningReceipt(s,'gear-2',0)),/đang chờ/);
  for(let i=0;i<4;i++){refiningDialog(s,'gear-1',0);refiningResume(s);s=copy(s);assert.deepEqual(s,paid);}
  E.resolveGearRefining(s,'gear-1','old',receipt);assert.deepEqual(s.inventory,before.inventory);assert.equal(s.gold,paid.gold);assert.equal(s.dust,paid.dust);
  atomic(s,()=>E.resolveGearRefining(s,'gear-1','old',receipt),/Không có/);assert.equal(s.refining.rolls,1);
  const cost=E.gearRefiningCost(s.inventory[0]);roll(s);assert.equal(s.gold,paid.gold-cost.gold);assert.equal(s.refining.rolls,2);
});

test('lower and equal rolls can be accepted deliberately; no result is silently rerolled',()=>{
  const s=rich(),id='gear-1';s.inventory[0].affixes[0].value=20;
  roll(s,id,0,0);assert.equal(s.refining.pending.newValue,7);settle(s);assert.equal(s.inventory[0].affixes[0].value,7);
  roll(s,id,0,0);assert.equal(s.refining.pending.newValue,7);settle(s);assert.equal(s.inventory[0].affixes[0].value,7);assert.equal(s.refining.rolls,2);copy(s);
});

for(const [name,mutate] of [
  ['gold',s=>s.gold--],['dust',s=>s.dust--],['selected value',s=>s.inventory[0].affixes[0].value++],['level',s=>s.inventory[0].level++],
  ['other item',s=>s.inventory[1].quality++],['owner',s=>E.equipGear(s,'gear-1','aerin')],['lock',s=>E.toggleGearLock(s,'gear-1')],
  ['owner level',s=>s.owned.rook.level++],['meta',s=>s.meta.attack++]
])test(`stale ${name} previews reject before charging or drawing RNG`,()=>{
  const s=rich(),receipt=E.refiningReceipt(s,'gear-1',0);mutate(s);let calls=0;
  atomic(s,()=>E.rollGearRefining(s,'gear-1',0,receipt,()=>{calls++;return .5;}),/thay đổi/);assert.equal(calls,0);
});

test('locked gear cannot start a roll; locking after paying permits keeping but requires unlock to accept',()=>{
  const s=rich();E.toggleGearLock(s,'gear-1');atomic(s,()=>roll(s),/Mở khóa/);E.toggleGearLock(s,'gear-1');roll(s);const oldReceipt=E.refiningReceipt(s,'gear-1',0);
  E.toggleGearLock(s,'gear-1');atomic(s,()=>E.resolveGearRefining(s,'gear-1','new',oldReceipt),/thay đổi/);atomic(s,()=>settle(s),/Mở khóa/);assert.deepEqual(copy(s),s);settle(s,'old');
  E.toggleGearLock(s,'gear-1');roll(s);E.toggleGearLock(s,'gear-1');E.toggleGearLock(s,'gear-1');settle(s);copy(s);
});

test('pending item blocks upgrading, evolving and dismantling; other items remain usable and owner transfers remain explicit',()=>{
  const s=rich();s.inventory[0].level=10;roll(s);const pending=structuredClone(s.refining.pending);
  for(const fn of [E.upgradeGear,E.evolveGear,E.dismantleGear])atomic(s,()=>fn(s,'gear-1'),/tẩy luyện/);
  E.upgradeGear(s,'gear-2');E.equipGear(s,'gear-1','rook');E.equipGear(s,'gear-1','aerin');assert.deepEqual(s.refining.pending,pending);settle(s);assert.equal(E.gearOwner(s,'gear-1'),'aerin');E.validateEquipment(s);copy(s);
});

for(const [name,change] of [
  ['missing item',s=>s.inventory.shift()],['missing line',()=>{}],['fractional line',()=>{}],['string line',()=>{}],['gold short',s=>s.gold=79],['dust short',s=>s.dust=1],['roll limit',s=>s.refining.rolls=1e9]
])test(`invalid or unavailable roll: ${name} is atomic`,()=>{
  const s=rich();change(s);const line=name==='missing line'?7:name==='fractional line'?.5:name==='string line'?'0':0;
  atomic(s,()=>roll(s,'gear-1',line));
});
for(const draw of [-1,1,NaN,Infinity,'0.5'])test(`invalid random draw ${String(draw)} does not charge or store a result`,()=>{const s=rich();atomic(s,()=>roll(s,'gear-1',0,draw));});

test('fresh financial actions require a matching receipt and a paid decision requires the right item and valid choice',()=>{
  const s=rich();for(const receipt of [undefined,null,'forged'])atomic(s,()=>E.rollGearRefining(s,'gear-1',0,receipt));roll(s);
  const p=s.refining.pending;for(const choice of ['refund',null,true])atomic(s,()=>E.resolveGearRefining(s,p.id,choice,E.refiningReceipt(s,p.id,p.line)));
  atomic(s,()=>E.resolveGearRefining(s,'gear-2','new',E.refiningReceipt(s,'gear-2',0)));atomic(s,()=>E.resolveGearRefining(s,p.id,'new','forged'));
});

test('signature, set, level and saved item references retain current refined stats; stale preset comparisons cannot apply',()=>{
  const s=rich(),g=E.forgeGear(s,'signature-rook');g.level=10;E.equipGear(s,g.id,'rook');E.saveGearPreset(s,'rook',0);E.saveTeamPreset(s,0);
  const identity={...structuredClone(g),affixes:null},gearPreset=structuredClone(s.gearPresets),teamPreset=structuredClone(s.presets),gearReceipt=E.previewGearPreset(s,'rook',0).stamp,teamReceipt=E.previewTeamPreset(s,0).stamp,before=E.heroStats(s,'rook');
  const line=g.affixes.findIndex(a=>a.stat==='maxHp');roll(s,g.id,line,1-Number.EPSILON);settle(s);
  assert.deepEqual({...g,affixes:null},identity);assert.deepEqual(s.gearPresets,gearPreset);assert.deepEqual(s.presets,teamPreset);assert.ok(E.heroStats(s,'rook').maxHp>=before.maxHp);
  assert.equal(E.gearLoadout(s,'rook').signature,'rook');atomic(s,()=>E.applyGearPreset(s,'rook',0,gearReceipt));atomic(s,()=>E.applyTeamPreset(s,0,teamReceipt));copy(s);
});

test('trait caps and upgraded basic values use existing stat calculations after accepting a result',()=>{
  const s=rich(),g=make(s,'EX','dawnblade');g.affixes.find(a=>a.stat==='crit').value=20;E.equipGear(s,g.id,'rook');
  const armor=make(s,'EX','mossguard');armor.affixes.find(a=>a.stat==='crit').value=20;E.equipGear(s,armor.id,'rook');
  const line=g.affixes.findIndex(a=>a.stat==='crit');roll(s,g.id,line,0);settle(s);assert.equal(g.affixes[line].value,5);assert.equal(E.gearTraits(g).crit,7);assert.equal(E.gearLoadout(s,'rook').affixes.crit,30);copy(s);
});

test('account refining does not change the current run, battle RNG, existing loot report, heroes or subsequent action results',()=>{
  const s=rich();E.equipGear(s,'gear-1','rook');E.startRun(s,42);s.run.map=null;s.run.floor=5;s.run.routes=['boss'];E.chooseRoute(s,0);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');
  const lootId=s.run.lastReward.loot.gear.id;s.gold=1000000;s.dust=100000;const loot=structuredClone(s.run.lastReward),journey=structuredClone(s.run);roll(s,lootId,0);settle(s);assert.deepEqual(s.run,journey);assert.deepEqual(s.run.lastReward,loot);copy(s);
  E.finishRun(s);E.startRun(s,42);s.run.map=null;s.run.routes=['battle'];E.chooseRoute(s,0);const plain=structuredClone(s),before=structuredClone(s.run),summoning=structuredClone(s.summoning);roll(s);settle(s);assert.deepEqual(s.run,before);assert.deepEqual(s.summoning,summoning);
  assert.deepEqual(E.playerAction(s,'rook','enemy0'),E.playerAction(plain,'rook','enemy0'));assert.deepEqual(s.run,plain.run);copy(s);
});

test('training clears paid results only in its private copy and rejects every refinement mutation',()=>{
  const source=rich();roll(source);const before=structuredClone(source),training=E.createTrainingState(source,{set:'bastion'});assert.deepEqual(training.refining,E.starterRefining());assert.deepEqual(source,before);
  const id=training.inventory[0].id;atomic(training,()=>roll(training,id),/Phòng thử/);atomic(training,()=>E.resolveGearRefining(training,id,'old','anything'),/Phòng thử/);assert.deepEqual(source,before);E.validateRefining(training);E.validateEquipment(training);
});

const invalid=[
  ['missing root',s=>delete s.refining],['null root',s=>s.refining=null],['array root',s=>s.refining=[]],['extra root',s=>s.refining.extra=1],['missing count',s=>delete s.refining.rolls],['missing pending',s=>delete s.refining.pending],
  ['negative count',s=>s.refining.rolls=-1],['fractional count',s=>s.refining.rolls=.5],['huge count',s=>s.refining.rolls=1e9+1],['string count',s=>s.refining.rolls='1'],
  ['array result',s=>s.refining.pending=[]],['extra result',s=>s.refining.pending.extra=1],['missing result value',s=>delete s.refining.pending.newValue],['missing item',s=>s.refining.pending.id='gear-999'],
  ['string line',s=>s.refining.pending.line='0'],['negative line',s=>s.refining.pending.line=-1],['fractional line',s=>s.refining.pending.line=.5],['unknown stat',s=>s.refining.pending.stat='atk'],
  ['wrong old value',s=>s.refining.pending.oldValue++],['low new value',s=>s.refining.pending.newValue=0],['high new value',s=>s.refining.pending.newValue=21],['string new value',s=>s.refining.pending.newValue='12'],
  ['wrong roll',s=>s.refining.pending.roll++],['zero paid count',s=>s.refining.rolls=0],['forged item snapshot',s=>s.refining.pending.itemStamp='{}'],['changed item',s=>s.inventory[0].quality++]
];
for(const [name,mutate] of invalid)test(`save schema rejects ${name} without mutating the imported data`,()=>{const s=rich();roll(s);mutate(s);atomic(s,()=>copy(s));});

test('refining UI shows price, range, raw and upgraded values, payment receipt, decisions and pending entry without mutations',()=>{
  const s=rich();s.inventory[0].level=10;E.equipGear(s,'gear-1','rook');let before=structuredClone(s),html=refiningDialog(s,'gear-1',0,7);
  for(const label of ['80 vàng','2 bụi rèn','7 → 20','Ở cấp +10','thấp hơn hoặc bằng','data-token="7"'])assert.ok(html.includes(label),label);assert.deepEqual(s,before);
  roll(s);before=structuredClone(s);html=refiningDialog(s,'gear-1',0,8);for(const label of ['Đã trả','GIỮ CŨ','KẾT QUẢ MỚI','refine-keep','refine-accept','Chỉ số ngoài trận','không hoàn nguyên liệu'])assert.ok(html.includes(label),label);
  assert.match(refiningResume(s),/refine-open/);assert.match(refiningEntry(s,s.inventory[0]),/Chọn kết quả đã lưu/);assert.match(equipmentPage(s,'rook','all'),/Kết quả tẩy luyện đang chờ/);
  for(const action of ['upgrade-gear','evolve-gear','dismantle-gear'])assert.match(gearDetail(s,'gear-1','rook'),new RegExp(`data-action="${action}"[^>]*disabled`));assert.deepEqual(s,before);
});

test('HTML escapes item names and neutral legacy projections retain real refining progress',()=>{
  const s=rich(),base=GEAR_BASE.dawnblade,name=base.name;base.name='<img src=x onerror=x>';
  try{assert.match(refiningDialog(s,'gear-1'),/&lt;img/);assert.doesNotMatch(refiningDialog(s,'gear-1'),/<img src=x/);roll(s);assert.match(refiningResume(s),/&lt;img/);}finally{base.name=name;}
  assert.deepEqual(withoutCombatReport(s).refining,s.refining);assert.equal(Object.hasOwn(withoutCombatReport(E.createState()),'refining'),false);
});

for(const phase of ['idle','route','battle','pending-guard','counter','contract','result'])test(`released 1.40 / v30 ${phase} migrates with exact account, team loadouts, locks, combat and RNG`,()=>{
  const old=Old.createState();Old.equipGear(old,'gear-1','rook');Old.toggleGearLock(old,'gear-1');Old.saveGearPreset(old,'rook',0);Old.saveTeamPreset(old,0,'Đội cũ');
  if(phase!=='idle')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){
    old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);
    if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}
    if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}
  }
  if(phase==='result')Old.finishRun(old);Old.validateState(old);const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.refining,E.starterRefining());assert.deepEqual(migrated.loginRewards,E.starterLoginRewards());
  const projected=structuredClone(migrated);delete projected.refining;delete projected.loginRewards;if(JSON.stringify(projected.bonds)==='{}')delete projected.bonds;if(JSON.stringify(projected.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete projected.season;projected.version=30;assert.deepEqual(projected,old);assert.deepEqual(old,before);assert.deepEqual(copy(migrated),migrated);
});
