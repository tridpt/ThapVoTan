import {HERO} from './data.mjs';
import {validFormation} from './formation.mjs';
import {PET} from './adventure-data.mjs';
import {expeditionForHero} from './expeditions.mjs';
import {snapshotHeroGear,validateSavedHeroGear,previewSavedHeroGear} from './gear-presets.mjs';
import {equipGear,unequipGear} from './equipment.mjs';

export const PRESET_NAMES=['Leo tháp','Săn boss','Phó bản'];
export const GRAPHICS_QUALITY={low:{name:'Thấp',pixelRatio:1,capacity:40,shadowSize:256},medium:{name:'Vừa',pixelRatio:1.35,capacity:96,shadowSize:512},high:{name:'Cao',pixelRatio:2,capacity:160,shadowSize:1024}};
export const starterGraphics=()=>({quality:'medium',fps:30,shadows:true,effects:true});
export const starterPresets=()=>[null,null,null];
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const slotValid=n=>Number.isInteger(n)&&n>=0&&n<3;
const nameValid=n=>typeof n==='string'&&n===n.trim()&&n.length>=1&&n.length<=24&&!/[\u0000-\u001f\u007f]/.test(n);
export function validGraphics(g){return record(g)&&Object.keys(g).length===4&&Object.hasOwn(GRAPHICS_QUALITY,g.quality)&&[30,60].includes(g.fps)&&typeof g.shadows==='boolean'&&typeof g.effects==='boolean';}
export function graphicsProfile(g=starterGraphics(),width=400,dpr=1){
  const options=validGraphics(g)?g:starterGraphics(),q=GRAPHICS_QUALITY[options.quality];
  return {...options,pixelRatio:Math.min(Number.isFinite(dpr)&&dpr>0?dpr:1,q.pixelRatio),capacity:options.effects?q.capacity:16,shadowSize:q.shadowSize,compact:options.quality==='low'||(options.quality==='medium'&&width<700),frameInterval:1000/options.fps};
}
export function setGraphics(s,key,value){
  const next={...s.settings.graphics};
  if(key==='quality'&&Object.hasOwn(GRAPHICS_QUALITY,value)){next.quality=value;next.shadows=value!=='low';next.effects=value!=='low';}
  else if(['fps','shadows','effects'].includes(key))next[key]=value;
  else throw new Error('Tùy chọn đồ họa không hợp lệ.');
  if(!validGraphics(next))throw new Error('Tùy chọn đồ họa không hợp lệ.');s.settings.graphics=next;return {...next};
}
function validatePreset(s,p){
  if(!record(p)||Object.keys(p).length!==5||!['name','team','pet','formation','gear'].every(k=>Object.hasOwn(p,k))||!validFormation(p.formation)||!nameValid(p.name)||!Array.isArray(p.team)||p.team.length!==3||new Set(p.team).size!==3||!p.team.every(id=>typeof id==='string'&&Object.hasOwn(HERO,id)&&Object.hasOwn(s.owned,id))||!(p.pet===null||typeof p.pet==='string'&&Object.hasOwn(PET,p.pet)&&Object.hasOwn(s.adventure.pets,p.pet)))return false;
  if(p.gear===null)return true;
  if(!record(p.gear)||Object.keys(p.gear).length!==3||!p.team.every(id=>Object.hasOwn(p.gear,id)))return false;
  const seen=new Set();
  try{for(const hero of p.team){validateSavedHeroGear(s,hero,p.gear[hero]);for(const ref of Object.values(p.gear[hero]))if(ref){if(seen.has(ref.id))return false;seen.add(ref.id);}}}catch{return false;}
  return true;
}
function assertPreset(s,slot){if(!slotValid(slot)||!validatePreset(s,s.presets[slot]))throw new Error('Đội hình đã lưu không hợp lệ.');return s.presets[slot];}
function assertReceipt(s,slot,expected){if(expected!==undefined&&expected!==teamPresetReceipt(s,slot))throw new Error('Đội hình hoặc trang bị đã thay đổi. Hãy mở lại bảng xem trước.');}
export function teamPresetReceipt(s,slot){
  if(!slotValid(slot))throw new Error('Ô đội hình không hợp lệ.');
  return JSON.stringify({slot,preset:s.presets[slot],team:s.team,pet:s.adventure.equipped,formation:s.formation,equipped:s.equipped,inventory:s.inventory,lockedGear:s.lockedGear,owned:s.owned,talents:s.talents,meta:s.meta,pets:s.adventure.pets});
}
export function saveTeamPreset(s,slot,name=PRESET_NAMES[slot],expected=undefined){
  if(!slotValid(slot)||typeof name!=='string')throw new Error('Ô đội hình không hợp lệ.');
  assertReceipt(s,slot,expected);
  const preset={name:name.trim(),team:[...s.team],pet:s.adventure.equipped,formation:{...s.formation},gear:Object.fromEntries(s.team.map(hero=>[hero,snapshotHeroGear(s,hero)]))};if(!validatePreset(s,preset))throw new Error('Tên đội cần 1–24 ký tự và đội hình phải hợp lệ.');
  s.presets[slot]=preset;return structuredClone(preset);
}
export function renameTeamPreset(s,slot,name){
  if(!slotValid(slot)||!s.presets[slot]||typeof name!=='string'||!nameValid(name.trim()))throw new Error('Tên đội cần 1–24 ký tự.');const next=name.trim();if(s.presets[slot].name===next)return false;s.presets[slot].name=next;return true;
}
export function presetBlocker(s,slot){
  const p=slotValid(slot)?s.presets[slot]:null;if(!p)return 'Ô này chưa lưu đội hình.';
  if(s.run&&s.run.phase!=='result')return 'Hoàn thành hoặc rời chuyến đang chơi để đổi đội.';
  const busy=p.team.find(id=>expeditionForHero(s,id));return busy?HERO[busy].name+' đang viễn chinh. Hãy nhận thưởng hoặc thu hồi trước.':null;
}
export function previewTeamPreset(s,slot){
  const p=assertPreset(s,slot),equipped=structuredClone(s.equipped),heroes=p.team.map(hero=>{
    const plan=previewSavedHeroGear(s,hero,p.gear===null?snapshotHeroGear(s,hero):p.gear[hero]);
    for(const row of plan.rows){if(!row.changed)continue;equipped[hero]||={};if(row.final)equipped[hero][row.slot]=row.final;else delete equipped[hero][row.slot];}
    return plan;
  });
  const teamChanged=p.team.some((id,i)=>id!==s.team[i]),petChanged=p.pet!==s.adventure.equipped,formationChanged=p.formation.front!==s.formation.front,gearChanges=heroes.reduce((n,h)=>n+h.changes,0);
  return structuredClone({slot,name:p.name,team:[...p.team],pet:p.pet,formation:{...p.formation},savedGear:p.gear!==null,equipped,heroes,issues:heroes.flatMap(h=>h.issues.map(issue=>({hero:h.hero,...issue}))),teamChanged,petChanged,formationChanged,gearChanges,changed:teamChanged||petChanged||formationChanged||gearChanges>0,blocked:presetBlocker(s,slot),stamp:teamPresetReceipt(s,slot)});
}
export function applyTeamPreset(s,slot,expected=undefined){
  const p=assertPreset(s,slot);
  const blocked=presetBlocker(s,slot);if(blocked)throw new Error(blocked);
  assertReceipt(s,slot,expected);const plan=previewTeamPreset(s,slot);if(!plan.changed)return p.name;
  const draft=structuredClone(s);
  for(const hero of plan.heroes)for(const row of hero.rows){if(!row.changed)continue;if(row.final)equipGear(draft,row.final,hero.hero);else if(row.current)unequipGear(draft,row.current.id);}
  s.team=[...p.team];s.adventure.equipped=p.pet;s.formation={...p.formation};s.equipped=draft.equipped;s.onboarding=draft.onboarding;return p.name;
}
export function deleteTeamPreset(s,slot,expected=undefined){assertPreset(s,slot);assertReceipt(s,slot,expected);s.presets[slot]=null;}
export function validatePreferences(s){
  if(!validGraphics(s.settings.graphics)||!Array.isArray(s.presets)||s.presets.length!==3||s.presets.some(p=>p!==null&&!validatePreset(s,p)))throw new Error('Đồ họa hoặc đội hình lưu nhanh không hợp lệ.');
}
