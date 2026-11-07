import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/team-loadouts-legacy-v1.39.0/js/engine.mjs';
import {teamPresetsPanel} from '../js/preferences-ui.mjs';
import {teamPresetDialog,teamPresetManageDialog} from '../js/team-loadouts-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
const rich=()=>{const s=E.createState();s.gold=1000000;s.dust=100000;s.shards=10000;s.armory.essence=10000;for(const key of Object.keys(s.armory.marks))s.armory.marks[key]=1000;return s;};
const atomic=(s,fn,pattern)=>{const before=structuredClone(s);assert.throws(fn,pattern);assert.deepEqual(s,before);};
const starters=s=>{for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,'rook');};
function strip(s){for(const slots of Object.values(s.equipped))for(const id of Object.values(slots))E.unequipGear(s,id);}
function dress(s){for(const hero of s.team)for(const slot of ['weapon','armor','charm']){const gear=E.forgeGear(s,slot==='weapon'?'signature-'+hero:'set-bastion-'+slot);E.equipGear(s,gear.id,hero);}}
const untouched=(actual,before)=>{for(const key of ['gold','tickets','shards','dust','owned','inventory','nextGearId','gearPresets','lockedGear','campaign','raids','daily','run','summoning','achievements'])assert.deepEqual(actual[key],before[key],key);};

test('three teams capture nine independent gear slots, positions and pets without aliasing hero loadouts',()=>{
  const s=rich();dress(s);E.saveGearPreset(s,'rook',0);const returned=E.saveTeamPreset(s,0,'  Đội bình minh  ');
  assert.equal(returned.name,'Đội bình minh');assert.equal(Object.values(returned.gear).flatMap(Object.values).filter(Boolean).length,9);
  const original=structuredClone(s.presets[0]);returned.gear.rook.weapon.id='changed';returned.formation.front=2;returned.team[0]='ember';assert.deepEqual(s.presets[0],original);
  strip(s);E.setTeamSlot(s,'ember',0);E.setFormation(s,2);s.adventure.equipped=null;E.saveTeamPreset(s,1);E.saveTeamPreset(s,2);
  assert.equal(s.presets[1].gear.ember.weapon,null);assert.equal(s.presets[1].pet,null);assert.equal(s.presets[1].formation.front,2);assert.deepEqual(s.presets[0],original);
  E.renameGearPreset(s,'rook',0,'Khác');E.deleteGearPreset(s,'rook',0);assert.deepEqual(s.presets[0],original);copy(s);
});

test('preview is pure, isolated from edits to returned data and includes every resulting slot',()=>{
  const s=rich();dress(s);E.saveTeamPreset(s,0);strip(s);const before=structuredClone(s),plan=E.previewTeamPreset(s,0);
  assert.equal(plan.gearChanges,9);assert.equal(plan.issues.length,0);assert.equal(plan.changed,true);assert.deepEqual(s,before);
  plan.heroes[0].rows[0].gear.level=10;plan.heroes[0].rows[0].desired.id='changed';plan.equipped.rook.weapon='changed';plan.team[0]='ember';plan.formation.front=2;assert.deepEqual(s,before);
});

test('one application restores team, formation, pet and all nine previewed gear slots atomically',()=>{
  const s=rich();dress(s);E.setFormation(s,2);E.saveTeamPreset(s,0);const saved=structuredClone(s.presets[0]);strip(s);E.setTeamSlot(s,'ember',0);E.setFormation(s,1);s.adventure.equipped=null;
  const before=structuredClone(s),plan=E.previewTeamPreset(s,0);assert.equal(plan.teamChanged,true);assert.equal(plan.petChanged,true);assert.equal(plan.formationChanged,true);
  assert.equal(E.applyTeamPreset(s,0,plan.stamp),saved.name);assert.deepEqual(s.team,saved.team);assert.deepEqual(s.formation,saved.formation);assert.equal(s.adventure.equipped,saved.pet);assert.deepEqual(s.equipped,plan.equipped);untouched(s,before);copy(s);
  E.startRun(s,42);assert.deepEqual(s.run.resonances,E.teamResonances(saved.team));for(const hero of s.run.heroes)assert.deepEqual(hero.loadout,E.gearLoadout(s,hero.id));copy(s);
});

test('saved gear uses current upgrades, evolution, talents and hero progression rather than old stats',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);strip(s);s.inventory[0].level=4;E.evolveGear(s,'gear-1');E.upgradeHero(s,'rook');E.learnTalent(s,'rook','force');E.upgradeMeta(s,'health');
  const plan=E.previewTeamPreset(s,0),after={...s,equipped:plan.equipped},expected=E.heroStats(after,'rook');assert.equal(s.inventory[0].rarity,'SR');
  const html=teamPresetDialog(s,0,plan);assert.ok(html.includes(`<td>${expected.atk}</td>`));E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(E.heroStats(s,'rook'),expected);copy(s);
});

test('missing, foreign-owned and locked slots retain current gear while available slots and team choices apply',()=>{
  const s=rich();E.equipGear(s,'gear-1','rook');E.equipGear(s,'gear-2','aerin');E.equipGear(s,'gear-3','lumi');E.saveTeamPreset(s,0);strip(s);
  E.equipGear(s,'gear-1','ember');E.dismantleGear(s,'gear-2');const armor=E.forgeGear(s,'set-bastion-armor');E.equipGear(s,armor.id,'rook');E.toggleGearLock(s,armor.id);E.setTeamSlot(s,'ember',0);s.adventure.equipped=null;
  const plan=E.previewTeamPreset(s,0);assert.equal(plan.gearChanges,1);assert.deepEqual(plan.issues.map(i=>i.reason),['owner','locked','missing']);
  const html=teamPresetDialog(s,0,plan);assert.match(html,/Ember đang mặc/);assert.match(html,/không còn trong kho/);assert.match(html,/Trang bị hiện tại đã khóa/);assert.match(html,/Đổi đội & 1 ô khả dụng/);
  E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(s.equipped,plan.equipped);assert.equal(s.equipped.ember.weapon,'gear-1');assert.equal(s.equipped.rook.armor,armor.id);assert.equal(s.equipped.lumi.charm,'gear-3');assert.deepEqual(s.team,['rook','aerin','lumi']);assert.equal(s.adventure.equipped,'mossling');copy(s);
});

test('equipment held by another member of the target team is never silently transferred or swapped',()=>{
  const s=rich(),other=E.forgeGear(s,'set-ember-weapon');E.equipGear(s,'gear-1','rook');E.equipGear(s,other.id,'aerin');E.saveTeamPreset(s,0);strip(s);E.equipGear(s,other.id,'rook');E.equipGear(s,'gear-1','aerin');
  const before=structuredClone(s),plan=E.previewTeamPreset(s,0);assert.equal(plan.gearChanges,0);assert.equal(plan.issues.length,2);assert.equal(plan.changed,false);E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(s,before);copy(s);
});

test('explicitly saved empty slots remove unlocked gear while locked items and unrelated heroes remain',()=>{
  const s=E.createState();E.saveTeamPreset(s,0);E.equipGear(s,'gear-1','rook');E.equipGear(s,'gear-2','aerin');E.equipGear(s,'gear-3','lumi');E.toggleGearLock(s,'gear-2');const plan=E.previewTeamPreset(s,0);
  assert.equal(plan.gearChanges,2);assert.equal(plan.issues[0].reason,'locked');assert.match(teamPresetDialog(s,0),/Tháo món hiện tại/);E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(s.equipped,{rook:{},aerin:{armor:'gear-2'},lumi:{}});copy(s);
});

test('a fully unavailable preset and an already matching preset are exact no-ops',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);const matched=structuredClone(s);assert.equal(E.previewTeamPreset(s,0).changed,false);E.applyTeamPreset(s,0);assert.deepEqual(s,matched);
  strip(s);for(const id of ['gear-1','gear-2','gear-3'])E.equipGear(s,id,'ember');const before=structuredClone(s),plan=E.previewTeamPreset(s,0);assert.equal(plan.changed,false);assert.equal(plan.issues.length,3);E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(s,before);copy(s);
});

test('loose locked items remain eligible for their saved owner without removing their lock',()=>{
  const s=E.createState();starters(s);E.saveTeamPreset(s,0);strip(s);E.toggleGearLock(s,'gear-1');const plan=E.previewTeamPreset(s,0);assert.equal(plan.gearChanges,3);E.applyTeamPreset(s,0,plan.stamp);assert.equal(s.equipped.rook.weapon,'gear-1');assert.deepEqual(s.lockedGear,['gear-1']);copy(s);
});

test('overwriting and deleting a team preserve its name, other teams, hero gear presets and live combat',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0,'Riêng');E.saveTeamPreset(s,1);E.saveGearPreset(s,'rook',0);E.startHunt(s,'colossus',1,42);const before=structuredClone(s);
  E.renameTeamPreset(s,0,'  Mới  ');assert.equal(E.renameTeamPreset(s,0,'Mới'),false);E.saveTeamPreset(s,0,s.presets[0].name,E.teamPresetReceipt(s,0));E.deleteTeamPreset(s,0,E.teamPresetReceipt(s,0));
  assert.equal(s.presets[0],null);assert.deepEqual(s.presets[1],before.presets[1]);untouched(s,before);assert.deepEqual(s.equipped,before.equipped);copy(s);
});

test('active journeys and expedition heroes block application before any team or gear changes',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);strip(s);E.startRun(s,42);const plan=E.previewTeamPreset(s,0);assert.match(plan.blocked,/chuyến đang chơi/);atomic(s,()=>E.applyTeamPreset(s,0,plan.stamp),/chuyến đang chơi/);E.finishRun(s);E.applyTeamPreset(s,0);copy(s);
  const busy=rich();E.setTeamSlot(busy,'ember',0);E.saveTeamPreset(busy,0);E.setTeamSlot(busy,'rook',0);E.dispatchExpedition(busy,'mist-path','ember',0,Date.now());assert.match(E.previewTeamPreset(busy,0).blocked,/Ember/);atomic(busy,()=>E.applyTeamPreset(busy,0),/Ember/);E.recallExpedition(busy,0);E.applyTeamPreset(busy,0);assert.equal(busy.team[0],'ember');copy(busy);
});

for(const [name,mutate] of [
  ['a gear upgrade',s=>E.upgradeGear(s,'gear-1')],['a gear evolution',s=>{s.inventory[0].level=4;E.evolveGear(s,'gear-1');}],
  ['a current owner',s=>E.equipGear(s,'gear-1','ember')],['a lock',s=>E.toggleGearLock(s,'gear-1')],['a dismantled item',s=>E.dismantleGear(s,'gear-1')],
  ['a hero level',s=>E.upgradeHero(s,'rook')],['a pet level',s=>s.adventure.pets.mossling.level++],['a talent',s=>{s.owned.rook.level=2;E.learnTalent(s,'rook','force');}],
  ['a meta upgrade',s=>s.meta.attack++],['team membership',s=>E.setTeamSlot(s,'ember',0)],['a formation',s=>E.setFormation(s,2)],
  ['a pet selection',s=>s.adventure.equipped=null],['a preset name',s=>E.renameTeamPreset(s,0,'Khác')],['an overwrite',s=>E.saveTeamPreset(s,0)],['a deletion',s=>E.deleteTeamPreset(s,0)]
])test(`reviewed team application rejects ${name} without partial mutation`,()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);strip(s);const plan=E.previewTeamPreset(s,0);mutate(s);atomic(s,()=>E.applyTeamPreset(s,0,plan.stamp));copy(s);
});

test('save and delete confirmations reject stale receipts and invalid slots cannot mutate teams',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);const receipt=E.teamPresetReceipt(s,0);E.renameTeamPreset(s,0,'Mới');atomic(s,()=>E.saveTeamPreset(s,0,'Khác',receipt),/đã thay đổi/);atomic(s,()=>E.deleteTeamPreset(s,0,receipt),/đã thay đổi/);
  for(const slot of [-1,3,.5,'0',NaN,null])for(const fn of [()=>E.saveTeamPreset(s,slot),()=>E.previewTeamPreset(s,slot),()=>E.applyTeamPreset(s,slot),()=>E.deleteTeamPreset(s,slot),()=>E.teamPresetReceipt(s,slot)])atomic(s,fn);copy(s);
});

test('team UI escapes custom names and shows resonance, six hero stats, set and signature effects',()=>{
  const s=rich();dress(s);E.saveTeamPreset(s,0,'<img src=x onerror=x>');strip(s);const before=structuredClone(s);
  for(const html of [teamPresetsPanel(s),teamPresetDialog(s,0),teamPresetManageDialog(s,0,'save'),teamPresetManageDialog(s,0,'delete')]){assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);}
  const html=teamPresetDialog(s,0);for(const label of ['Cộng hưởng','Tổng chỉ số ngoài trận','Tỉ lệ chí mạng','Hút máu','Hồi năng lượng / đòn thường','3/3 món','Kỹ năng mạnh hơn 12%'])assert.ok(html.includes(label),label);assert.match(teamPresetsPanel(s),/9\/9 món đã lưu/);assert.deepEqual(s,before);
});

test('missing gear references persist through export/import and practice clears team snapshots without changing the account',()=>{
  const s=rich();starters(s);E.saveTeamPreset(s,0);strip(s);E.dismantleGear(s,'gear-1');E.saveGearPreset(s,'rook',0);const restored=copy(s);assert.deepEqual(restored,s);assert.equal(E.previewTeamPreset(restored,0).issues[0].reason,'missing');
  const before=structuredClone(s),practice=E.createTrainingState(s);assert.deepEqual(practice.presets,[null,null,null]);assert.deepEqual(practice.gearPresets,{});assert.deepEqual(s,before);E.validatePreferences(practice);E.validateGearPresets(practice);E.validateEquipment(practice);
});

const invalid=[
  ['missing gear',p=>delete p.gear],['array gear',p=>p.gear=[]],['string gear',p=>p.gear='gear-1'],['empty hero map',p=>p.gear={}],
  ['extra hero',p=>p.gear.ember={weapon:null,armor:null,charm:null}],['missing hero',p=>delete p.gear.aerin],['null hero gear',p=>p.gear.rook=null],['array hero gear',p=>p.gear.rook=[]],
  ['missing slot',p=>delete p.gear.rook.charm],['extra slot',p=>p.gear.rook.helmet=null],['string reference',p=>p.gear.rook.weapon='gear-1'],['array reference',p=>p.gear.rook.weapon=['gear-1','dawnblade']],
  ['extra reference key',p=>p.gear.rook.weapon.level=0],['missing base',p=>delete p.gear.rook.weapon.base],['wrong base type',p=>p.gear.rook.weapon.base=['dawnblade']],
  ['unknown base',p=>p.gear.rook.weapon.base='constructor'],['wrong slot',p=>p.gear.rook.weapon.base='mossguard'],['wrong existing base',p=>p.gear.rook.weapon.base='moonstaff'],
  ['wrong signature hero',p=>p.gear.rook.weapon.base='signature-lumi'],['future id',p=>p.gear.rook.weapon.id='gear-4'],['zero id',p=>p.gear.rook.weapon.id='gear-0'],
  ['wrong id type',p=>p.gear.rook.weapon.id=['gear-1']],['unsafe id',p=>p.gear.rook.weapon.id='gear-9007199254740992'],
  ['duplicate gear across heroes',p=>p.gear.aerin.weapon={...p.gear.rook.weapon}],['extra preset key',p=>p.extra=true],['whitespace name',p=>p.name=' X ']
];
for(const [name,mutate] of invalid)test(`team import rejects ${name} without changing the imported source`,()=>{
  const s=E.createState();starters(s);E.saveTeamPreset(s,0);mutate(s.presets[0]);atomic(s,()=>copy(s));
});

for(const phase of ['idle','route','battle','pending-guard','counter','contract','result'])test(`released v29 ${phase} migrates teams without inventing gear or changing the account and journey`,()=>{
  const old=Old.createState();Old.equipGear(old,'gear-1','rook');Old.toggleGearLock(old,'gear-1');Old.saveGearPreset(old,'rook',0);Old.saveTeamPreset(old,0,'Đội cũ');Old.setTeamSlot(old,'ember',0);Old.saveTeamPreset(old,1);Old.setTeamSlot(old,'rook',0);Old.setFormation(old,2);old.adventure.equipped=null;Old.saveTeamPreset(old,2);
  if(phase!=='idle')Old.startRun(old,42);
  if(['battle','pending-guard','counter','contract'].includes(phase)){
    old.run.map=null;old.run.floor=5;old.run.routes=['boss'];Old.chooseRoute(old,0);
    if(phase==='contract'){old.run.heroes[0].atk=100000;Old.playerAction(old,'rook','enemy0');}
    if(['pending-guard','counter'].includes(phase)){old.run.battle.bossState.move='quake';for(const h of old.run.heroes)h.hp=h.maxHp=10000;const receipt=Old.beginTimingGuard(old);if(phase==='counter')Old.enemyTurn(old,{...receipt,grade:'perfect'});}
  }
  if(phase==='result')Old.finishRun(old);Old.validateState(old);
  const before=structuredClone(old),migrated=copy(old);assert.equal(migrated.version,E.SAVE_VERSION);for(const p of migrated.presets)assert.equal(p.gear,null);
  const projected=structuredClone(migrated);projected.version=29;assert.deepEqual(projected.refining,E.starterRefining());delete projected.refining;assert.deepEqual(projected.loginRewards,E.starterLoginRewards());delete projected.loginRewards;if(JSON.stringify(projected.bonds)==='{}')delete projected.bonds;if(JSON.stringify(projected.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete projected.season;for(const p of projected.presets)delete p.gear;assert.deepEqual(projected,old);assert.deepEqual(old,before);assert.deepEqual(copy(migrated),migrated);
});

test('migrated teams keep equipment acquired later until explicitly saved again',()=>{
  const old=Old.createState();Old.saveTeamPreset(old,0);const s=copy(old);starters(s);E.setTeamSlot(s,'ember',0);const equipped=structuredClone(s.equipped),plan=E.previewTeamPreset(s,0);assert.equal(plan.savedGear,false);assert.equal(plan.gearChanges,0);
  assert.match(teamPresetsPanel(s),/Đội cũ · chưa lưu bộ đồ/);assert.match(teamPresetDialog(s,0),/giữ trang bị hiện tại/);E.applyTeamPreset(s,0,plan.stamp);assert.deepEqual(s.equipped,equipped);E.saveTeamPreset(s,0,s.presets[0].name);assert.equal(s.presets[0].gear.rook.weapon.id,'gear-1');copy(s);
});
