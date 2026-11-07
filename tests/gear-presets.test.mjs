import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/gear-presets-legacy-v1.38.0/js/engine.mjs';
import {gearPresetsPanel,gearPresetDialog,gearPresetManageDialog} from '../js/gear-presets-ui.mjs';

const copy=s=>E.validateState(structuredClone(s));
const rich=()=>{const s=E.createState();s.gold=100000;s.dust=10000;s.armory.essence=1000;for(const key of Object.keys(s.armory.marks))s.armory.marks[key]=100;return s;};
const wear=(s,hero='rook')=>{for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,hero);};
const strip=(s,hero='rook')=>{for(const id of Object.values(s.equipped[hero]||{}))E.unequipGear(s,id);};
const atomic=(s,fn,pattern)=>{const before=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,before);};

test('each hero has three independent named equipment slots and returned data cannot mutate saved gear',()=>{
  const s=E.createState(),fresh=E.createState();assert.deepEqual(E.gearPresetSlots(s,'rook'),[null,null,null]);wear(s);const first=E.saveGearPreset(s,'rook',0);
  assert.equal(first.name,'Leo tháp');assert.deepEqual(first.gear.weapon,{id:'gear-1',base:'dawnblade'});E.saveGearPreset(s,'rook',1);E.saveGearPreset(s,'rook',2);E.saveGearPreset(s,'lumi',0);
  first.gear.weapon.id='missing';const list=E.gearPresetSlots(s,'rook');list[1].name='changed';assert.equal(s.gearPresets.rook[0].gear.weapon.id,'gear-1');assert.equal(s.gearPresets.rook[1].name,'Săn boss');assert.equal(s.gearPresets.rook[2].name,'Đột kích');assert.equal(s.gearPresets.lumi[0].gear.weapon,null);assert.deepEqual(fresh.gearPresets,{});copy(s);
});

test('saving, renaming and deleting change only saved sets and preserve an active battle and economy',()=>{
  const s=rich();wear(s);E.toggleGearLock(s,'gear-1');E.startHunt(s,'colossus',1,42);const before=structuredClone(s);
  E.saveGearPreset(s,'rook',0);assert.equal(E.renameGearPreset(s,'rook',0,'  Phá giáp 🔥  '),true);assert.equal(s.gearPresets.rook[0].name,'Phá giáp 🔥');assert.equal(E.renameGearPreset(s,'rook',0,'Phá giáp 🔥'),false);E.saveGearPreset(s,'rook',0);assert.equal(s.gearPresets.rook[0].name,'Phá giáp 🔥');copy(s);
  assert.equal(E.deleteGearPreset(s,'rook',0),'Phá giáp 🔥');assert.deepEqual(s,before);copy(s);
});

test('applying a full saved set restores all slots once with current upgrade and evolution stats',()=>{
  const s=rich();wear(s);E.saveGearPreset(s,'rook',0);strip(s);s.inventory[0].level=4;E.evolveGear(s,'gear-1');const before=structuredClone(s),plan=E.previewGearPreset(s,'rook',0);assert.equal(plan.changes,3);assert.equal(plan.issues.length,0);assert.deepEqual(s,before);
  const html=gearPresetDialog(s,'rook',0,plan);const applied=E.applyGearPreset(s,'rook',0,plan.stamp);assert.equal(applied.changes,3);assert.deepEqual(s.equipped.rook,{weapon:'gear-1',armor:'gear-2',charm:'gear-3'});assert.ok(html.includes(`${E.heroStats(s,'rook').atk} ATK`));assert.equal(s.inventory[0].rarity,'SR');
  const equipped=structuredClone(s);assert.equal(E.applyGearPreset(s,'rook',0).changes,0);assert.deepEqual(s,equipped);copy(s);
});

test('missing or borrowed items keep current slots while the other saved slots apply without borrowing',()=>{
  const s=rich();wear(s);E.saveGearPreset(s,'rook',0);strip(s);E.equipGear(s,'gear-1','aerin');E.dismantleGear(s,'gear-2');const armor=E.forgeGear(s,'set-bastion-armor');E.equipGear(s,armor.id,'rook');const before=structuredClone(s),plan=E.previewGearPreset(s,'rook',0);
  assert.deepEqual(plan.issues,[{slot:'weapon',reason:'owner',owner:'aerin'},{slot:'armor',reason:'missing',owner:null}]);assert.deepEqual(plan.ids,{weapon:null,armor:armor.id,charm:'gear-3'});assert.deepEqual(s,before);assert.match(gearPresetDialog(s,'rook',0),/Aerin đang mặc/);assert.match(gearPresetDialog(s,'rook',0),/không còn trong kho/);
  E.applyGearPreset(s,'rook',0,plan.stamp);assert.equal(s.equipped.aerin.weapon,'gear-1');assert.equal(s.equipped.rook.armor,armor.id);assert.equal(s.equipped.rook.charm,'gear-3');copy(s);
});

test('a locked current item survives a conflicting saved item and an empty saved slot',()=>{
  const s=rich();E.saveGearPreset(s,'rook',0);wear(s);E.saveGearPreset(s,'rook',1);const other=E.forgeGear(s,'set-ember-weapon');E.equipGear(s,other.id,'rook');E.toggleGearLock(s,other.id);
  for(const slot of [0,1]){const plan=E.previewGearPreset(s,'rook',slot);assert.equal(plan.ids.weapon,other.id);assert.equal(plan.rows[0].issue,'locked');E.applyGearPreset(s,'rook',slot,plan.stamp);assert.equal(s.equipped.rook.weapon,other.id);}
  assert.deepEqual(s.lockedGear,[other.id]);copy(s);
});

test('saved empty slots remove unlocked equipment and report exactly what remains',()=>{
  const s=E.createState();E.saveGearPreset(s,'rook',0);wear(s);E.toggleGearLock(s,'gear-2');const plan=E.previewGearPreset(s,'rook',0);assert.equal(plan.changes,2);assert.equal(plan.issues.length,1);assert.match(gearPresetDialog(s,'rook',0,plan),/Tháo món hiện tại/);E.applyGearPreset(s,'rook',0,plan.stamp);assert.deepEqual(s.equipped.rook,{armor:'gear-2'});copy(s);
});

test('all unavailable saved slots are a no-op and locked loose gear can still be equipped',()=>{
  const s=E.createState();wear(s);E.saveGearPreset(s,'rook',0);strip(s);for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,'aerin');const before=structuredClone(s);assert.equal(E.applyGearPreset(s,'rook',0).changes,0);assert.deepEqual(s,before);
  strip(s,'aerin');E.toggleGearLock(s,'gear-1');E.applyGearPreset(s,'rook',0);assert.equal(s.equipped.rook.weapon,'gear-1');assert.deepEqual(s.lockedGear,['gear-1']);copy(s);
});

for(const [name,mutate] of [
  ['a current lock',s=>{E.equipGear(s,'gear-1','rook');E.toggleGearLock(s,'gear-1');}],
  ['another owner',s=>E.equipGear(s,'gear-2','aerin')],
  ['a deleted item',s=>E.dismantleGear(s,'gear-2')],
  ['item upgrade',s=>E.upgradeGear(s,'gear-1')],
  ['preset rename',s=>E.renameGearPreset(s,'rook',0,'Đổi tên')],
  ['hero level',s=>E.upgradeHero(s,'rook')],
  ['preset overwrite',s=>E.saveGearPreset(s,'rook',0)]
])test(`a preview becomes stale after ${name} and cannot partially apply`,()=>{
  const s=rich();wear(s);E.saveGearPreset(s,'rook',0);strip(s);const plan=E.previewGearPreset(s,'rook',0);mutate(s);atomic(s,()=>E.applyGearPreset(s,'rook',0,plan.stamp),/đã thay đổi/);copy(s);
});

test('active journeys block applying a preset and save/delete receipts reject stale overwrites',()=>{
  const s=rich();wear(s);E.saveGearPreset(s,'rook',0);strip(s);E.startRun(s,42);atomic(s,()=>E.applyGearPreset(s,'rook',0),/kết thúc chuyến đi/);E.finishRun(s);E.applyGearPreset(s,'rook',0);copy(s);
  const receipt=E.gearPresetReceipt(s,'rook',0);E.renameGearPreset(s,'rook',0,'Khác');atomic(s,()=>E.saveGearPreset(s,'rook',0,receipt),/đã thay đổi/);atomic(s,()=>E.deleteGearPreset(s,'rook',0,receipt),/đã thay đổi/);
});

test('invalid heroes, slots and names cannot mutate presets or equipped items',()=>{
  const s=E.createState();E.saveGearPreset(s,'rook',0);
  for(const hero of ['missing','astra','constructor',null,['rook']])atomic(s,()=>E.saveGearPreset(s,hero,0),/Anh hùng/);
  for(const slot of [-1,3,0.5,'0',NaN])atomic(s,()=>E.saveGearPreset(s,'rook',slot),/Ô bộ/);
  for(const name of ['', ' '.repeat(3),'x'.repeat(25),'a\nb',{},null])atomic(s,()=>E.renameGearPreset(s,'rook',0,name),/Tên bộ/);
  atomic(s,()=>E.previewGearPreset(s,'rook',1),/chưa lưu/);atomic(s,()=>E.deleteGearPreset(s,'rook',1),/chưa lưu/);copy(s);
});

test('preset UI escapes custom names and shows exact set, signature and missing-item warnings',()=>{
  const s=rich();const sig=E.forgeGear(s,'signature-rook');E.equipGear(s,sig.id,'rook');for(const key of ['armor','charm']){const g=E.forgeGear(s,'set-bastion-'+key);E.equipGear(s,g.id,'rook');}E.saveGearPreset(s,'rook',0);E.renameGearPreset(s,'rook',0,'<img src=x onerror=x>');const before=structuredClone(s);
  for(const html of [gearPresetsPanel(s,'rook'),gearPresetDialog(s,'rook',0),gearPresetManageDialog(s,'rook',0,'delete')]){assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img/);}
  assert.match(gearPresetDialog(s,'rook',0),/3\/3 món/);assert.match(gearPresetDialog(s,'rook',0),/Kỹ năng mạnh hơn 12%/);assert.deepEqual(s,before);
});

const invalid=[
  ['missing presets',s=>delete s.gearPresets],['null presets',s=>s.gearPresets=null],['array presets',s=>s.gearPresets=[]],
  ['unknown hero',s=>s.gearPresets.missing=[null,null,null]],['unowned hero',s=>s.gearPresets.astra=[null,null,null]],
  ['too many slots',s=>s.gearPresets.rook.push(null)],['missing slot',s=>s.gearPresets.rook.pop()],['object slots',s=>s.gearPresets.rook={}],
  ['missing name',s=>delete s.gearPresets.rook[0].name],['blank name',s=>s.gearPresets.rook[0].name=' '],['name wrong type',s=>s.gearPresets.rook[0].name=['a']],['long name',s=>s.gearPresets.rook[0].name='a'.repeat(25)],['control name',s=>s.gearPresets.rook[0].name='a\u0000'],
  ['extra preset field',s=>s.gearPresets.rook[0].extra=1],['missing gear slot',s=>delete s.gearPresets.rook[0].gear.armor],['extra gear slot',s=>s.gearPresets.rook[0].gear.head=null],
  ['string reference',s=>s.gearPresets.rook[0].gear.weapon='gear-1'],['array reference',s=>s.gearPresets.rook[0].gear.weapon=['gear-1','dawnblade']],['missing base',s=>delete s.gearPresets.rook[0].gear.weapon.base],['extra reference field',s=>s.gearPresets.rook[0].gear.weapon.level=0],
  ['non-string id',s=>s.gearPresets.rook[0].gear.weapon.id=['gear-1']],['invalid id',s=>s.gearPresets.rook[0].gear.weapon.id='gear-0'],['future id',s=>s.gearPresets.rook[0].gear.weapon.id='gear-4'],['unsafe id',s=>s.gearPresets.rook[0].gear.weapon.id='gear-9007199254740992'],
  ['unknown base',s=>s.gearPresets.rook[0].gear.weapon.base='missing'],['non-string base',s=>s.gearPresets.rook[0].gear.weapon.base=['dawnblade']],['wrong slot',s=>s.gearPresets.rook[0].gear.weapon.base='mossguard'],['wrong existing base',s=>s.gearPresets.rook[0].gear.weapon.base='moonstaff'],['wrong signature hero',s=>s.gearPresets.rook[0].gear.weapon.base='signature-lumi']
];
for(const [name,mutate] of invalid)test(`preset import rejects ${name} without mutating source`,()=>{const s=E.createState();wear(s);E.saveGearPreset(s,'rook',0);mutate(s);atomic(s,()=>copy(s));});

test('old v28 saves migrate to the current schema with empty gear presets, keep locks and never mutate input',()=>{
  const old=Old.createState();Old.equipGear(old,'gear-1','rook');Old.toggleGearLock(old,'gear-1');const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.gearPresets,{});assert.deepEqual(migrated.lockedGear,['gear-1']);const p=structuredClone(migrated);delete p.gearPresets;if(JSON.stringify(p.refining)===JSON.stringify({rolls:0,pending:null}))delete p.refining;if(JSON.stringify(p.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete p.loginRewards;if(JSON.stringify(p.bonds)==='{}')delete p.bonds;if(JSON.stringify(p.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete p.season;p.version=28;assert.deepEqual(p,old);assert.deepEqual(old,before);copy(migrated);
});
for(const phase of ['route','battle','pending-guard','counter','contract','result'])test(`released v28 ${phase} preserves exact account, journey and RNG when adding presets`,()=>{
  const old=Old.createState();Old.equipGear(old,'gear-1','rook');Old.toggleGearLock(old,'gear-1');Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}}
  if(phase==='result')Old.finishRun(old);const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.gearPresets,{});const projected=structuredClone(migrated);delete projected.gearPresets;if(JSON.stringify(projected.refining)===JSON.stringify({rolls:0,pending:null}))delete projected.refining;if(JSON.stringify(projected.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete projected.loginRewards;if(JSON.stringify(projected.bonds)==='{}')delete projected.bonds;if(JSON.stringify(projected.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete projected.season;projected.version=28;assert.deepEqual(projected,old);assert.deepEqual(old,before);copy(migrated);
});

test('saved missing references survive export and reload while training has no real presets or locks',()=>{
  const s=E.createState();wear(s);E.saveGearPreset(s,'rook',0);strip(s);E.dismantleGear(s,'gear-1');E.toggleGearLock(s,'gear-2');const restored=copy(s);assert.deepEqual(restored,s);assert.equal(E.previewGearPreset(restored,'rook',0).rows[0].issue,'missing');const before=structuredClone(s),practice=E.createTrainingState(s);assert.deepEqual(practice.gearPresets,{});assert.deepEqual(practice.lockedGear,[]);assert.deepEqual(s,before);
});

test('locked favorites do not invalidate a saved loot report during reload',()=>{
  const s=E.createState();E.toggleGearLock(s,'gear-1');E.startRun(s,42);s.run.map=null;s.run.routes=['treasure'];E.chooseRoute(s,0);assert.deepEqual(copy(s),s);
});
