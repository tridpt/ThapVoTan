import {HERO,GEAR_BASE,GEAR_SLOTS} from './data.mjs';
import {equipGear,unequipGear,gearOwner,gearLocked} from './equipment.mjs';

export const GEAR_PRESET_NAMES=Object.freeze(['Leo tháp','Săn boss','Đột kích']);
export const starterGearPresets=()=>({});
const slots=Object.keys(GEAR_SLOTS);
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>record(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const validName=n=>typeof n==='string'&&n===n.trim()&&n.length>0&&n.length<=24&&!/[\u0000-\u001f\u007f]/.test(n);
const validSlot=n=>Number.isInteger(n)&&n>=0&&n<3;
function assertHero(s,hero){if(typeof hero!=='string'||!Object.hasOwn(HERO,hero)||!Object.hasOwn(s.owned,hero))throw new Error('Anh hùng lưu trang bị không hợp lệ.');}
function assertSlot(s,hero,slot){assertHero(s,hero);if(!validSlot(slot))throw new Error('Ô bộ trang bị không hợp lệ.');}
function currentIds(s,hero){return Object.fromEntries(slots.map(slot=>[slot,s.equipped[hero]?.[slot]||null]));}
function gearReference(s,id){const g=s.inventory.find(g=>g.id===id);return g?{id:g.id,base:g.base}:null;}
function savedPreset(s,hero,slot){return s.gearPresets[hero]?.[slot]||null;}
function requirePreset(s,hero,slot){assertSlot(s,hero,slot);const p=savedPreset(s,hero,slot);if(!p)throw new Error('Ô này chưa lưu bộ trang bị.');return p;}
function assertReceipt(actual,expected){if(expected!==undefined&&expected!==actual)throw new Error('Bộ trang bị đã thay đổi. Hãy mở lại bảng xem trước.');}

export function snapshotHeroGear(s,hero){
  assertHero(s,hero);const ids=currentIds(s,hero);
  return Object.fromEntries(slots.map(k=>[k,ids[k]?gearReference(s,ids[k]):null]));
}
export function validateSavedHeroGear(s,hero,gear){
  assertHero(s,hero);if(!exact(gear,slots))throw new Error('Bộ trang bị đã lưu không hợp lệ.');
  const seen=new Set();
  for(const key of slots){
    const ref=gear[key];if(ref===null)continue;
    if(!exact(ref,['id','base'])||typeof ref.id!=='string'||!/^gear-[1-9]\d*$/.test(ref.id)||!Number.isSafeInteger(Number(ref.id.slice(5)))||Number(ref.id.slice(5))>=s.nextGearId||typeof ref.base!=='string'||!Object.hasOwn(GEAR_BASE,ref.base))throw new Error('Món trong bộ trang bị đã lưu không hợp lệ.');
    const base=GEAR_BASE[ref.base],item=s.inventory.find(g=>g.id===ref.id);
    if(base.slot!==key||base.hero&&base.hero!==hero||item&&item.base!==ref.base||seen.has(ref.id))throw new Error('Vị trí trong bộ trang bị đã lưu không hợp lệ.');
    seen.add(ref.id);
  }
}

export function gearPresetSlots(s,hero){assertHero(s,hero);return structuredClone(s.gearPresets[hero]||[null,null,null]);}
export function gearPresetReceipt(s,hero,slot){
  assertSlot(s,hero,slot);
  return JSON.stringify({hero,slot,preset:savedPreset(s,hero,slot),gear:slots.map(k=>{const id=s.equipped[hero]?.[k];return id?s.inventory.find(g=>g.id===id)||null:null;})});
}
export function saveGearPreset(s,hero,slot,expected=undefined){
  assertSlot(s,hero,slot);assertReceipt(gearPresetReceipt(s,hero,slot),expected);
  const name=savedPreset(s,hero,slot)?.name||GEAR_PRESET_NAMES[slot];
  const p={name,gear:snapshotHeroGear(s,hero)};
  s.gearPresets[hero]||=[null,null,null];s.gearPresets[hero][slot]=p;return structuredClone(p);
}
export function renameGearPreset(s,hero,slot,name){
  const p=requirePreset(s,hero,slot);if(typeof name!=='string'||!validName(name.trim()))throw new Error('Tên bộ trang bị cần 1–24 ký tự.');
  const next=name.trim();if(p.name===next)return false;p.name=next;return true;
}
export function deleteGearPreset(s,hero,slot,expected=undefined){
  const p=requirePreset(s,hero,slot);assertReceipt(gearPresetReceipt(s,hero,slot),expected);
  s.gearPresets[hero][slot]=null;if(s.gearPresets[hero].every(v=>v===null))delete s.gearPresets[hero];return p.name;
}
export function previewSavedHeroGear(s,hero,saved){
  validateSavedHeroGear(s,hero,saved);const current=currentIds(s,hero),ids={},rows=[],issues=[];
  for(const key of slots){
    const desired=saved[key],currentId=current[key],gear=desired?s.inventory.find(g=>g.id===desired.id)||null:null,owner=desired?gearOwner(s,desired.id):null;
    let issue=null;
    if(desired&&(!gear||gear.base!==desired.base))issue='missing';
    else if(desired&&owner&&owner!==hero)issue='owner';
    else if(currentId!==desired?.id&&currentId&&gearLocked(s,currentId))issue='locked';
    ids[key]=issue?currentId:desired?.id||null;
    const row={slot:key,desired:desired?{...desired}:null,current:currentId?gearReference(s,currentId):null,gear,owner,issue,final:ids[key],changed:ids[key]!==currentId};
    rows.push(row);if(issue)issues.push({slot:key,reason:issue,owner});
  }
  return {hero,ids,current,rows,issues,changes:rows.filter(r=>r.changed).length};
}
export function previewGearPreset(s,hero,slot){
  const preset=requirePreset(s,hero,slot),plan=previewSavedHeroGear(s,hero,preset.gear),{current,ids}=plan;
  const watched=[...new Set([...Object.values(current),...Object.values(preset.gear).map(g=>g?.id)].filter(Boolean))].sort();
  const stamp=JSON.stringify({hero,slot,preset,current,ids,gear:watched.map(id=>({id,gear:s.inventory.find(g=>g.id===id)||null,owner:gearOwner(s,id),locked:gearLocked(s,id)})),heroStats:s.owned[hero],talents:s.talents[hero]||{},meta:s.meta});
  return {...plan,slot,name:preset.name,stamp};
}
export function applyGearPreset(s,hero,slot,expected=undefined){
  if(s.run&&s.run.phase!=='result')throw new Error('Hãy kết thúc chuyến đi trước khi đổi bộ trang bị.');
  const plan=previewGearPreset(s,hero,slot);assertReceipt(plan.stamp,expected);
  for(const row of plan.rows){if(!row.changed)continue;if(row.final)equipGear(s,row.final,hero);else if(plan.current[row.slot])unequipGear(s,plan.current[row.slot]);}
  return plan;
}
export function validateGearPresets(s){
  if(!record(s.gearPresets))throw new Error('Bộ trang bị đã lưu không hợp lệ.');
  for(const [hero,list] of Object.entries(s.gearPresets)){
    assertHero(s,hero);
    if(!Array.isArray(list)||list.length!==3)throw new Error('Danh sách bộ trang bị cần đúng 3 ô.');
    for(const p of list){
      if(p===null)continue;
      if(!exact(p,['name','gear'])||!validName(p.name)||!exact(p.gear,slots))throw new Error('Bộ trang bị đã lưu không hợp lệ.');
      validateSavedHeroGear(s,hero,p.gear);
    }
  }
}
