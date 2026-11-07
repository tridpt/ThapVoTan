import {HERO,GEAR_SLOTS,GEAR_BASES,GEAR_BASE,GEAR_RARITY} from './data.mjs';
import {recordTutorialProgress} from './onboarding.mjs';

export const GEAR_LIMIT=120;
export const GEAR_MAX_LEVEL=10;
export const GEAR_TIERS=Object.keys(GEAR_RARITY);
export const GEAR_TRAIT_CAPS={crit:30,drain:20,energy:25};
export const GEAR_BUILD_DIRECTIONS=Object.freeze({
  damage:Object.freeze({id:'damage',name:'Sát thương',icon:'sword',description:'Ưu tiên ATK, chí mạng và bộ đồ tạo áp lực liên tục.',targetSets:['ember','bloodmoon'],weights:Object.freeze({atk:1.8,maxHp:.08,def:.08,crit:8,drain:5,energy:1.6})}),
  tank:Object.freeze({id:'tank',name:'Chống chịu',icon:'shield',description:'Ưu tiên sinh lực, phòng thủ và hiệu ứng phòng vệ.',targetSets:['bastion','mirror'],weights:Object.freeze({atk:.12,maxHp:.72,def:2.4,crit:.4,drain:.4,energy:.6})}),
  support:Object.freeze({id:'support',name:'Hỗ trợ',icon:'heart',description:'Ưu tiên năng lượng, sinh lực và hiệu ứng giữ nhịp cho cả đội.',targetSets:['mirror','bastion'],weights:Object.freeze({atk:.22,maxHp:.5,def:1.25,crit:.2,drain:.5,energy:3.8})})
});
const basic=['atk','maxHp','def'],special=Object.keys(GEAR_TRAIT_CAPS);
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function starterEquipment(){
  return {dust:8,nextGearId:4,inventory:[
    {id:'gear-1',base:'dawnblade',rarity:'R',level:0,quality:100,affixes:[{stat:'maxHp',value:12}]},
    {id:'gear-2',base:'mossguard',rarity:'R',level:0,quality:100,affixes:[{stat:'def',value:2}]},
    {id:'gear-3',base:'sunpendant',rarity:'R',level:0,quality:100,affixes:[{stat:'atk',value:3}]}
  ],equipped:{},lockedGear:[]};
}
export function validateEquipment(s){
  if(!integer(s.dust,0,1e9)||!integer(s.nextGearId,1,1e9)||!Array.isArray(s.inventory)||s.inventory.length>GEAR_LIMIT||!s.equipped||typeof s.equipped!=='object'||Array.isArray(s.equipped)||!Array.isArray(s.lockedGear))throw new Error('Kho trang bị không hợp lệ.');
  const seen=new Set(),signatures=new Set();
  for(const g of s.inventory){
    const base=GEAR_BASE[g?.base],rank=GEAR_TIERS.indexOf(g?.rarity);
    if(!Object.hasOwn(GEAR_BASE,g?.base)||!Object.hasOwn(GEAR_RARITY,g.rarity)||!/^gear-[1-9]\d*$/.test(g.id)||Number(g.id.slice(5))>=s.nextGearId||seen.has(g.id)||!integer(g.level,0,GEAR_MAX_LEVEL)||!integer(g.quality,85,115)||!Array.isArray(g.affixes)||g.affixes.length!==GEAR_RARITY[g.rarity].affixes||(base.crafted&&rank<2))throw new Error('Trang bị không hợp lệ.');
    if(base.hero){if(signatures.has(base.hero))throw new Error('Trấn phái bị trùng trong kho.');signatures.add(base.hero);}
    const stats=new Set();
    for(const a of g.affixes){if(!a||![...basic,...(rank>=3?special:[])].includes(a.stat)||a.stat===GEAR_SLOTS[base.slot].stat||stats.has(a.stat)||!integer(a.value,1,special.includes(a.stat)?20:rank>=3?1000:100))throw new Error('Thuộc tính trang bị không hợp lệ.');stats.add(a.stat);}
    if(rank>=3&&basic.filter(k=>k!==GEAR_SLOTS[base.slot].stat).some(k=>!stats.has(k)))throw new Error('Trang bị cao cấp thiếu thuộc tính cơ bản.');
    seen.add(g.id);
  }
  if(new Set(s.lockedGear).size!==s.lockedGear.length||s.lockedGear.some(id=>typeof id!=='string'||!seen.has(id)))throw new Error('Danh sách trang bị khóa không hợp lệ.');
  const assigned=new Set();
  for(const [hero,slots] of Object.entries(s.equipped)){
    if(!Object.hasOwn(HERO,hero)||!Object.hasOwn(s.owned,hero)||!slots||typeof slots!=='object'||Array.isArray(slots))throw new Error('Người mặc trang bị không hợp lệ.');
    for(const [slot,id] of Object.entries(slots)){
      const gear=s.inventory.find(g=>g.id===id);
      if(!GEAR_SLOTS[slot]||!gear||GEAR_BASE[gear.base].slot!==slot||assigned.has(id)||(GEAR_BASE[gear.base].hero&&GEAR_BASE[gear.base].hero!==hero))throw new Error('Vị trí trang bị không hợp lệ.');
      assigned.add(id);
    }
  }
}
export function gearStats(g){
  const stats={atk:0,maxHp:0,def:0},slot=GEAR_SLOTS[GEAR_BASE[g.base].slot],growth=1+g.level*.12;
  const primary=Math.round(slot.base*GEAR_RARITY[g.rarity].scale*g.quality/100);
  stats[slot.stat]=primary+g.level*Math.max(1,Math.round(primary*.12));
  for(const a of g.affixes)if(basic.includes(a.stat))stats[a.stat]+=Math.round(a.value*growth);
  return stats;
}
export function gearTraits(g){
  const traits={crit:0,drain:0,energy:0};
  for(const a of g.affixes)if(special.includes(a.stat))traits[a.stat]+=Math.round(a.value*(1+g.level*.04));
  return traits;
}
export function gearBonus(s,hero){
  const bonus={atk:0,maxHp:0,def:0};
  for(const id of Object.values(s.equipped[hero]||{})){
    const gear=s.inventory.find(g=>g.id===id);if(!gear)continue;
    const stats=gearStats(gear);for(const k of Object.keys(bonus))bonus[k]+=stats[k];
  }
  return bonus;
}
export function gearOwner(s,id){return Object.keys(s.equipped).find(hero=>Object.values(s.equipped[hero]).includes(id))||null;}
export function gearLocked(s,id){return Array.isArray(s.lockedGear)&&s.lockedGear.includes(id);}
function getGear(s,id){const gear=s.inventory.find(g=>g.id===id);if(!gear)throw new Error('Trang bị này không còn trong kho.');return gear;}
export function toggleGearLock(s,id){
  getGear(s,id);s.lockedGear||=[];const index=s.lockedGear.indexOf(id);
  if(index>=0){s.lockedGear.splice(index,1);return false;}
  s.lockedGear.push(id);return true;
}
export function equipGear(s,id,hero){
  if(!s.owned[hero])throw new Error('Bạn chưa sở hữu anh hùng này.');
  const g=getGear(s,id),slot=GEAR_BASE[g.base].slot;
  if(GEAR_BASE[g.base].hero&&GEAR_BASE[g.base].hero!==hero)throw new Error('Trấn phái chỉ có thể trang bị cho '+HERO[GEAR_BASE[g.base].hero].name+'.');
  const owner=gearOwner(s,id);
  if(gearLocked(s,id)&&owner&&owner!==hero)throw new Error('Trang bị đã khóa. Hãy mở khóa trước khi chuyển cho anh hùng khác.');
  const currentId=s.equipped[hero]?.[slot];
  if(currentId&&currentId!==id&&gearLocked(s,currentId))throw new Error('Trang bị hiện tại đã khóa. Hãy mở khóa trước khi thay món khác.');
  for(const slots of Object.values(s.equipped))for(const key of Object.keys(slots))if(slots[key]===id)delete slots[key];
  s.equipped[hero]||={};s.equipped[hero][slot]=id;
  recordTutorialProgress(s,'gear');
}
export function unequipGear(s,id){getGear(s,id);if(gearLocked(s,id))throw new Error('Trang bị đã khóa. Hãy mở khóa trước khi tháo.');for(const slots of Object.values(s.equipped))for(const key of Object.keys(slots))if(slots[key]===id)delete slots[key];}
export function gearUpgradeCost(g){const tier=GEAR_RARITY[g.rarity];return {gold:80*(g.level+1)*tier.upgrade,dust:2+g.level+tier.dustExtra};}
export function upgradeGear(s,id){
  if(s.refining?.pending?.id===id)throw new Error('Hãy chọn kết quả tẩy luyện trước khi nâng cấp.');
  const g=getGear(s,id);if(g.level>=GEAR_MAX_LEVEL)throw new Error('Trang bị đã đạt cấp tối đa.');
  const cost=gearUpgradeCost(g);
  if(s.gold<cost.gold||s.dust<cost.dust)throw new Error('Chưa đủ vàng hoặc bụi rèn. Phân rã trang bị thừa để nhận bụi.');
  s.gold-=cost.gold;s.dust-=cost.dust;g.level++;return cost;
}
export function dismantleValue(g){return GEAR_RARITY[g.rarity].dust+g.level*2;}
export function dismantleGear(s,id){
  if(s.refining?.pending?.id===id)throw new Error('Hãy chọn kết quả tẩy luyện trước khi phân rã.');
  const g=getGear(s,id);if(gearLocked(s,id))throw new Error('Trang bị đã khóa. Hãy mở khóa trước khi phân rã.');if(gearOwner(s,id))throw new Error('Hãy tháo trang bị khỏi anh hùng trước khi phân rã.');
  const dust=dismantleValue(g);s.inventory.splice(s.inventory.indexOf(g),1);s.dust+=dust;return dust;
}

function directionOf(id){if(typeof id!=='string'||!Object.hasOwn(GEAR_BUILD_DIRECTIONS,id))throw new Error('Hướng xây tướng không hợp lệ.');return GEAR_BUILD_DIRECTIONS[id];}
function targetSetFor(hero,direction){
  const role=HERO[hero]?.role||'';
  if(direction.id==='damage')return direction.targetSets[role==='Sát thủ'?1:0];
  return role==='Hộ vệ'?'bastion':'mirror';
}
function localGearScore(g,hero,direction){
  if(!g)return -Infinity;
  const stats=gearStats(g),traits=gearTraits(g),w=direction.weights,base=GEAR_BASE[g.base];
  let score=stats.atk*w.atk+stats.maxHp*w.maxHp+stats.def*w.def+traits.crit*w.crit+traits.drain*w.drain+traits.energy*w.energy;
  if(base.hero===hero)score+=direction.id==='damage'?125:direction.id==='support'?90:65;
  if(base.set===targetSetFor(hero,direction))score+=direction.id==='damage'?34:28;
  score+=GEAR_RARITY[g.rarity].scale*3+g.level*1.25+g.quality/100;
  return score;
}
function loadoutScore(choices,hero,direction,scores){
  const counts={},traits={crit:0,drain:0,energy:0};let score=0,signature=false;
  for(const g of Object.values(choices)){if(!g)continue;const item=scores.get(g.id);score+=item.score;for(const key of special)traits[key]+=item.traits[key];const base=GEAR_BASE[g.base];if(base.set)counts[base.set]=(counts[base.set]||0)+1;if(base.hero===hero)signature=true;}
  for(const key of special)score-=Math.max(0,traits[key]-GEAR_TRAIT_CAPS[key])*direction.weights[key];
  const target=targetSetFor(hero,direction),count=counts[target]||0;
  if(count>=2)score+=direction.id==='tank'?145:direction.id==='support'?125:115;
  if(count>=3)score+=direction.id==='tank'?230:direction.id==='support'?210:195;
  for(const [set,n] of Object.entries(counts))if(set!==target&&n>=2)score+=n===3?42:18;
  if(signature)score+=direction.id==='damage'?85:direction.id==='support'?65:55;
  return score;
}
function candidateGear(s,hero,slot){
  const current=s.equipped[hero]?.[slot],currentGear=s.inventory.find(g=>g.id===current);
  if(currentGear&&gearLocked(s,currentGear.id))return [currentGear];
  const options=s.inventory.filter(g=>{const base=GEAR_BASE[g.base];return base.slot===slot&&(!base.hero||base.hero===hero);}).filter(g=>{const owner=gearOwner(s,g.id);return owner===null||owner===hero;});
  return options.length?options:[null];
}
export function recommendGear(s,hero,directionId='damage'){
  if(!s.owned?.[hero]||!Object.hasOwn(HERO,hero))throw new Error('Anh hùng không hợp lệ.');
  const direction=directionOf(directionId),slots=Object.keys(GEAR_SLOTS),options=Object.fromEntries(slots.map(slot=>[slot,candidateGear(s,hero,slot)]));
  const scores=new Map(Object.values(options).flat().filter(Boolean).map(g=>[g.id,{score:localGearScore(g,hero,direction),traits:gearTraits(g)}]));
  let best=null;
  for(const weapon of options.weapon)for(const armor of options.armor)for(const charm of options.charm){
    const choices={weapon,armor,charm},score=loadoutScore(choices,hero,direction,scores),ids=slots.map(slot=>choices[slot]?.id||''),changes=slots.filter(slot=>(choices[slot]?.id||null)!==(s.equipped[hero]?.[slot]||null)).length;
    if(!best||score>best.score||score===best.score&&(changes<best.changes||changes===best.changes&&ids.join('|')<best.ids.join('|')))best={score,ids,choices,changes};
  }
  const current=Object.fromEntries(slots.map(slot=>[slot,s.inventory.find(g=>g.id===s.equipped[hero]?.[slot])||null]));
  return {hero,direction:direction.id,directionName:direction.name,targetSet:targetSetFor(hero,direction),choices:best.choices,ids:Object.fromEntries(slots.map(slot=>[slot,best.choices[slot]?.id||null])),current,score:Math.round(best.score*100)/100,changes:best.changes,locked:slots.filter(slot=>current[slot]&&gearLocked(s,current[slot].id))};
}
export function applyGearRecommendation(s,hero,directionId='damage',expectedIds=undefined){
  if(s.run&&s.run.phase!=='result')throw new Error('Hãy kết thúc chuyến đi trước khi đổi bộ trang bị.');
  const plan=recommendGear(s,hero,directionId);
  if(expectedIds!==undefined&&Object.keys(GEAR_SLOTS).some(slot=>expectedIds?.[slot]!==plan.ids[slot]))throw new Error('Bộ đề xuất đã thay đổi. Hãy mở lại bảng xem trước.');
  for(const slot of Object.keys(GEAR_SLOTS)){const gear=plan.choices[slot];if(gear&&s.equipped[hero]?.[slot]!==gear.id)equipGear(s,gear.id,hero);}
  return plan;
}
const EVOLUTION=[
  {level:2,gold:180,dust:5,essence:2},{level:3,gold:360,dust:10,essence:4},
  {level:4,gold:700,dust:20,essence:8},{level:5,gold:1200,dust:35,essence:14},
  {level:6,gold:2000,dust:55,essence:24},{level:7,gold:3200,dust:85,essence:40}
];
export function gearEvolutionCost(g){const rank=GEAR_TIERS.indexOf(g.rarity);return EVOLUTION[rank]?{...EVOLUTION[rank],rarity:GEAR_TIERS[rank+1]}:null;}
function affixValue(stat,rarity,rng){
  const scale=GEAR_RARITY[rarity].scale;
  return Math.max(1,Math.round((stat==='maxHp'?10:stat==='atk'?2:stat==='def'?1:stat==='drain'?.7:1)*scale*(.8+rng()*.8)));
}
function fillAffixes(affixes,base,rarity,rng){
  const pool=basic.filter(stat=>stat!==GEAR_SLOTS[base.slot].stat&&!affixes.some(a=>a.stat===stat));
  while(affixes.length<Math.min(2,GEAR_RARITY[rarity].affixes)){
    const stat=pool.splice(Math.floor(rng()*pool.length),1)[0];affixes.push({stat,value:affixValue(stat,rarity,rng)});
  }
  const traits=special.filter(stat=>!affixes.some(a=>a.stat===stat));
  while(affixes.length<GEAR_RARITY[rarity].affixes){const stat=traits.splice(Math.floor(rng()*traits.length),1)[0];affixes.push({stat,value:affixValue(stat,rarity,rng)});}
  return affixes;
}
// Preview and evolution share an item seed, so reopening cannot reroll a new line.
export function previewGearEvolution(g){
  const cost=gearEvolutionCost(g);if(!cost)return null;
  let seed=2166136261;for(const ch of `${g.id}:${g.base}:${g.quality}:${cost.rarity}`)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},ratio=GEAR_RARITY[cost.rarity].scale/GEAR_RARITY[g.rarity].scale;
  const affixes=g.affixes.map(a=>({stat:a.stat,value:Math.min(special.includes(a.stat)?20:GEAR_TIERS.indexOf(cost.rarity)>=3?1000:100,Math.max(a.value,Math.round(a.value*ratio)))}));
  return {...g,rarity:cost.rarity,affixes:fillAffixes(affixes,GEAR_BASE[g.base],cost.rarity,rng)};
}
export function evolveGear(s,id){
  if(s.refining?.pending?.id===id)throw new Error('Hãy chọn kết quả tẩy luyện trước khi tiến hóa.');
  const g=getGear(s,id),cost=gearEvolutionCost(g);
  if(!cost)throw new Error('Trang bị đã đạt bậc EX.');
  if(g.level<cost.level)throw new Error(`Hãy nâng trang bị lên +${cost.level} trước khi tiến hóa.`);
  if(s.gold<cost.gold||s.dust<cost.dust||s.armory.essence<cost.essence)throw new Error('Chưa đủ vàng, bụi rèn hoặc Tinh hoa boss.');
  const next=previewGearEvolution(g);s.gold-=cost.gold;s.dust-=cost.dust;s.armory.essence-=cost.essence;Object.assign(g,next);return g;
}
export function gearDropChances(floor,source){
  if(source==='champion')return [...(floor>=50?[['LR',.01]]:[]),...(floor>=25?[['UR',.04]]:[]),['SSR',.08],['SR',.62],['R',.3-(floor>=25?.04:0)-(floor>=50?.01:0)]];
  const boss=source==='boss',elite=source==='elite',high=[];
  if(boss){if(floor>=60)high.push(['MR',.015]);if(floor>=40)high.push(['LR',.04]);if(floor>=15)high.push(['UR',Math.min(.16,.04+(floor-15)*.002)]);}
  else if(floor>=25){if(elite&&floor>=50)high.push(['LR',.005]);high.push(['UR',elite?.025:.01]);}
  const total=high.reduce((n,[,p])=>n+p,0),ssr=boss?Math.min(.35,.08+floor*.003):elite?.04:.02;
  return boss?[...high,['SSR',ssr],['SR',1-total-ssr]]:[...high,['SSR',ssr],['SR',elite?.41:.2],['R',(elite?.55:.78)-total]];
}
export function dropGear(s,rng,floor,source){
  const roll=rng();let threshold=0,rarity='R';
  for(const [tier,chance] of gearDropChances(floor,source)){threshold+=chance;if(roll<threshold){rarity=tier;break;}}
  return dropGearAtRarity(s,rng,rarity);
}
export function dropGearAtRarity(s,rng,rarity){
  if(!Object.hasOwn(GEAR_RARITY,rarity))throw new Error('Bậc rương trang bị không hợp lệ.');
  const bases=GEAR_BASES.filter(g=>!g.crafted),base=bases[Math.floor(rng()*bases.length)];
  const affixes=fillAffixes([],base,rarity,rng);
  const gear={id:'gear-'+s.nextGearId++,base:base.id,rarity,level:0,quality:85+Math.floor(rng()*31),affixes};
  if(s.inventory.length>=GEAR_LIMIT){const dust=dismantleValue(gear);s.dust+=dust;return {gear,dust,converted:true};}
  s.inventory.push(gear);return {gear,dust:0,converted:false};
}
