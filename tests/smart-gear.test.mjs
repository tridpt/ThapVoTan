import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as data from '../js/data.mjs';
import {equipmentPage,smartGearDialog,gearDetail,equipmentComparison} from '../js/expansion-ui.mjs';
import * as Old from '../artifacts/qa/smart-gear-legacy-v1.37.0/js/engine.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const rich=()=>{const s=E.createState();s.gold=100000;s.dust=10000;for(const id of Object.keys(s.armory.marks))s.armory.marks[id]=100;return s;};

test('smart gear recommendations are deterministic, cover every direction and include a three-slot plan',()=>{
  const s=rich();for(const id of ['set-ember-weapon','set-ember-armor','set-ember-charm','set-mirror-weapon','set-mirror-armor','set-mirror-charm'])E.forgeGear(s,id);
  const first=E.recommendGear(s,'rook','damage');
  assert.deepEqual(first.ids,{weapon:'gear-4',armor:'gear-5',charm:'gear-6'});
  assert.equal(first.targetSet,'ember');
  assert.ok(Object.values(first.choices).every(g=>g&&data.GEAR_BASE[g.base]));
  for(const direction of ['damage','tank','support']){
    const again=E.recommendGear(s,'rook',direction);assert.deepEqual(again,E.recommendGear(s,'rook',direction));
    assert.deepEqual(Object.keys(again.ids).sort(),['armor','charm','weapon']);assert.ok(again.directionName);
  }
  copy(s);
});

test('recommendations keep a locked current slot and reject invalid direction or hero without mutating the account',()=>{
  const s=rich();const before=structuredClone(s);E.equipGear(s,'gear-1','rook');E.toggleGearLock(s,'gear-1');
  const plan=E.recommendGear(s,'rook','damage');assert.equal(plan.ids.weapon,'gear-1');assert.deepEqual(plan.locked,['weapon']);
  assert.throws(()=>E.recommendGear(s,'rook','burst'),/Hướng xây/);assert.throws(()=>E.recommendGear(s,'missing','damage'),/Anh hùng/);assert.deepEqual(s.lockedGear,['gear-1']);assert.deepEqual(s.inventory,before.inventory);copy(s);
});

test('smart equip applies the chosen plan atomically, keeps locked favorites and refuses an active journey',()=>{
  const s=rich();for(const id of ['set-bastion-weapon','set-bastion-armor','set-bastion-charm'])E.forgeGear(s,id);
  E.equipGear(s,'gear-1','rook');E.toggleGearLock(s,'gear-1');const before=structuredClone(s);const plan=E.applyGearRecommendation(s,'rook','tank');
  assert.equal(plan.direction,'tank');assert.equal(s.equipped.rook.weapon,'gear-1');assert.equal(E.gearLocked(s,'gear-1'),true);assert.equal(E.gearLoadout(s,'rook').sets.find(e=>e.id==='bastion')?.count,2);
  copy(s);
  const equipped=structuredClone(s.equipped.rook);E.startRun(s,42);assert.throws(()=>E.applyGearRecommendation(s,'rook','damage'),/kết thúc chuyến đi/);assert.deepEqual(s.equipped.rook,equipped);E.finishRun(s);copy(s);
  const lockBefore=structuredClone(s);assert.throws(()=>E.dismantleGear(s,'gear-1'),/đã khóa/);assert.deepEqual(s,lockBefore);
});

test('locking protects manual replacement and removal until explicitly unlocked',()=>{
  const s=E.createState();E.equipGear(s,'gear-1','rook');E.toggleGearLock(s,'gear-1');const before=structuredClone(s);
  assert.throws(()=>E.equipGear(s,'gear-1','aerin'),/đã khóa/);assert.throws(()=>E.unequipGear(s,'gear-1'),/đã khóa/);assert.throws(()=>E.dismantleGear(s,'gear-1'),/đã khóa/);assert.deepEqual(s,before);
  assert.equal(E.toggleGearLock(s,'gear-1'),false);E.equipGear(s,'gear-1','aerin');assert.equal(E.gearOwner(s,'gear-1'),'aerin');copy(s);
});

test('v27 saves migrate to v28 with an empty lock list and malformed lock lists are rejected',()=>{
  const s=E.createState();const old=structuredClone(s);old.version=27;delete old.lockedGear;const migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.lockedGear,[]);assert.equal(old.version,27);assert.equal(Object.hasOwn(old,'lockedGear'),false);
  for(const mutate of [a=>delete a.lockedGear,a=>a.lockedGear=['missing'],a=>a.lockedGear=['gear-1','gear-1'],a=>a.lockedGear=[1],a=>a.lockedGear={}]){const broken=E.createState();mutate(broken);assert.throws(()=>copy(broken),/Kho trang bị|Danh sách/);}
});

test('equipment and smart dialog markup expose directions, protected gear, set and before-after preview',()=>{
  const s=rich();for(const id of ['set-ember-weapon','set-ember-armor','set-ember-charm'])E.forgeGear(s,id);E.toggleGearLock(s,'gear-1');
  const page=equipmentPage(s,'rook','all'),dialog=smartGearDialog(s,'rook','damage');
  for(const direction of ['damage','tank','support'])assert.match(page,new RegExp(`data-direction="${direction}"`));
  assert.match(page,/TRANG BỊ NHANH THÔNG MINH/);assert.match(page,/gear-lock-mark/);assert.match(dialog,/ĐANG CÓ/);assert.match(dialog,/SAU KHI MẶC/);assert.match(dialog,/Xác nhận mặc bộ/);assert.match(dialog,/Bộ Tro tàn|Tro tàn/);assert.equal((dialog.match(/smart-choice-row/g)||[]).length,3);
});

test('recommendations exclude another hero signature and never borrow equipment from another hero',()=>{
  const s=rich(),wrong=E.forgeGear(s,'signature-lumi');wrong.level=10;
  E.equipGear(s,'gear-2','aerin');const before=structuredClone(s),plan=E.recommendGear(s,'rook','support');
  assert.notEqual(plan.ids.weapon,wrong.id);assert.equal(plan.ids.armor,null);assert.doesNotThrow(()=>smartGearDialog(s,'rook','support'));assert.deepEqual(s,before);
  E.applyGearRecommendation(s,'rook','support');assert.deepEqual(s.equipped.aerin,before.equipped.aerin);assert.equal(E.gearOwner(s,wrong.id),null);copy(s);
});

test('partial and empty inventories preview usable slots without stealing or inventing gear',()=>{
  for(const keep of [[],['gear-1'],['gear-1','gear-3']]){
    const s=E.createState();s.inventory=s.inventory.filter(g=>keep.includes(g.id));const before=structuredClone(s),plan=E.recommendGear(s,'rook','damage');
    assert.deepEqual(Object.values(plan.ids).filter(Boolean).sort(),keep);assert.doesNotThrow(()=>smartGearDialog(s,'rook','damage'));assert.deepEqual(s,before);
    E.applyGearRecommendation(s,'rook','damage');assert.deepEqual(Object.values(s.equipped.rook||{}).sort(),keep);copy(s);
  }
});

test('full set bonuses remain eligible behind more than twelve stronger standalone weapons',()=>{
  const s=rich();for(const slot of ['weapon','armor','charm'])E.forgeGear(s,'set-ember-'+slot);
  for(let i=0;i<13;i++)s.inventory.push({id:'gear-'+s.nextGearId++,base:'dawnblade',rarity:'SSR',level:7,quality:100,affixes:[{stat:'maxHp',value:24},{stat:'def',value:3}]});
  const plan=E.applyGearRecommendation(s,'rook','damage');assert.equal(data.GEAR_BASE[plan.choices.weapon.base].set,'ember');assert.deepEqual(E.gearLoadout(s,'rook').sets,[{id:'ember',count:3}]);copy(s);
});

test('recommendations value only usable traits after caps and keep equal current gear',()=>{
  const s=E.createState();
  for(const g of s.inventory){const primary=data.GEAR_SLOTS[data.GEAR_BASE[g.base].slot].stat;g.rarity='UR';g.affixes=['atk','maxHp','def'].filter(k=>k!==primary).map(stat=>({stat,value:stat==='maxHp'?24:5}));g.affixes.push({stat:'crit',value:g.id==='gear-3'?20:15});}
  const energy={...structuredClone(s.inventory[2]),id:'gear-'+s.nextGearId++};energy.affixes[2]={stat:'energy',value:20};s.inventory.push(energy);
  for(const id of ['gear-1','gear-2']){E.equipGear(s,id,'rook');E.toggleGearLock(s,id);}
  const plan=E.applyGearRecommendation(s,'rook','damage');assert.equal(plan.ids.charm,energy.id);assert.deepEqual(E.gearLoadout(s,'rook').affixes,{crit:30,drain:0,energy:20});
  const twin={...structuredClone(energy),id:'gear-'+s.nextGearId++};s.inventory.push(twin);E.equipGear(s,twin.id,'rook');assert.equal(E.recommendGear(s,'rook','damage').ids.charm,twin.id);assert.equal(E.recommendGear(s,'rook','damage').changes,0);copy(s);
});

test('a stale reviewed recommendation rejects before changing any equipment or account data',()=>{
  const s=rich(),plan=E.recommendGear(s,'rook','damage');for(const slot of ['weapon','armor','charm'])E.forgeGear(s,'set-ember-'+slot);
  const before=structuredClone(s);assert.throws(()=>E.applyGearRecommendation(s,'rook','damage',plan.ids),/đã thay đổi/);assert.deepEqual(s,before);copy(s);
});

test('locked gear details remain openable for unlocking while replacement, transfer and removal are disabled',()=>{
  const s=rich();E.equipGear(s,'gear-1','rook');E.toggleGearLock(s,'gear-1');const replacement=E.forgeGear(s,'set-ember-weapon'),before=structuredClone(s);
  assert.equal(equipmentComparison(s,s.inventory[0],'aerin'),null);assert.equal(equipmentComparison(s,replacement,'rook'),null);
  assert.match(gearDetail(s,'gear-1','aerin'),/data-action="equip-gear"[^>]*disabled/);assert.match(gearDetail(s,'gear-1','rook'),/data-action="unequip-gear"[^>]*disabled/);assert.match(gearDetail(s,replacement.id,'rook'),/data-action="equip-gear"[^>]*disabled/);assert.deepEqual(s,before);
});

for(const phase of ['fresh','route','battle','pending-guard','counter','contract','result'])test(`released v27 ${phase} migrates with an empty lock list and preserves the exact account and journey`,()=>{
  const old=Old.createState();Old.equipGear(old,'gear-1','rook');
  if(phase!=='fresh')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){
    old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);
    if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}
    if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}
  }
  if(phase==='result')Old.finishRun(old);
  const frozen=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);assert.deepEqual(migrated.lockedGear,[]);const projected=structuredClone(migrated);projected.version=27;delete projected.lockedGear;delete projected.gearPresets;if(JSON.stringify(projected.refining)===JSON.stringify({rolls:0,pending:null}))delete projected.refining;if(JSON.stringify(projected.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete projected.loginRewards;if(JSON.stringify(projected.bonds)==='{}')delete projected.bonds;if(JSON.stringify(projected.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete projected.season;assert.deepEqual(projected,old);assert.deepEqual(old,frozen);assert.deepEqual(copy(migrated),migrated);
});
