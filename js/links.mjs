import {HERO} from './data.mjs';

export const LINK_MAX=100;
export const LINK_GAIN={attack:14,skill:22};
export const LINK_ELEMENTS=[
  {id:'earth',name:'Thổ',color:'#c8b17e'},
  {id:'wind',name:'Phong',color:'#91d0ac'},
  {id:'light',name:'Quang',color:'#f0dda0'},
  {id:'fire',name:'Hỏa',color:'#f4a275'},
  {id:'shadow',name:'Ảnh',color:'#c5a5e7'},
  {id:'ice',name:'Băng',color:'#9ae5ec'},
  {id:'thunder',name:'Lôi',color:'#b7bdff'}
];
const definitions=[
  ['earth','earth','Địa thành',{power:1.35,shield:.12}],
  ['wind','wind','Thiên phong',{power:1.2,aoe:true,energy:15}],
  ['light','light','Bình minh song tinh',{power:1.2,heal:.16}],
  ['fire','fire','Song hỏa',{power:1.45,aoe:true,burn:.22}],
  ['shadow','shadow','Dạ sát',{power:2.1,drain:.2}],
  ['ice','ice','Vĩnh đông',{power:1.4,freeze:'target'}],
  ['thunder','thunder','Song lôi',{power:1.65,aoe:true}],
  ['earth','wind','Cổ thụ thức giấc',{power:1.15,aoe:true,shield:.1,energy:10}],
  ['earth','light','Thánh thành',{power:1.1,heal:.1,shield:.12}],
  ['earth','fire','Dung nham trỗi dậy',{power:1.25,aoe:true,burn:.18}],
  ['earth','shadow','Mộ thạch',{power:1.65,shield:.1}],
  ['earth','ice','Băng thành',{power:1.15,shield:.16,freeze:'target'}],
  ['earth','thunder','Địa lôi',{power:1.8,shield:.06,energy:10}],
  ['wind','light','Gió bình minh',{power:1.1,aoe:true,heal:.1,energy:10}],
  ['wind','fire','Bão lửa',{power:1.3,aoe:true,burn:.25}],
  ['wind','shadow','Ảnh phong',{power:1.55,aoe:true,drain:.12}],
  ['wind','ice','Bão tuyết',{power:1,aoe:true,freeze:'all'}],
  ['wind','thunder','Lôi bão',{power:1.7,aoe:true,energy:10}],
  ['light','fire','Nhật diệm',{power:1.15,aoe:true,heal:.08,burn:.14}],
  ['light','shadow','Nhật thực',{power:2,heal:.1}],
  ['light','ice','Cực quang',{power:1.1,heal:.18,shield:.08}],
  ['light','thunder','Thiên phạt',{power:1.8,energy:15}],
  ['fire','shadow','Hắc hỏa',{power:1.65,burn:.35,drain:.2}],
  ['fire','ice','Sốc nhiệt',{power:2.25}],
  ['fire','thunder','Hỏa lôi',{power:1.5,aoe:true,burn:.16}],
  ['shadow','ice','Đêm băng',{power:1.7,freeze:'target'}],
  ['shadow','thunder','Ám lôi',{power:1.8,drain:.25}],
  ['ice','thunder','Sét băng',{power:1.35,aoe:true,freeze:'target'}]
];
export const LINKS=Object.fromEntries(definitions.map(([a,b,name,effect])=>{
  const elements=[a,b].map(id=>LINK_ELEMENTS.find(e=>e.id===id));
  const id=[a,b].sort().join('-');return [id,{id,name,elements,...effect}];
}));
export const starterLink=()=>({charge:0,casts:0});
export function linkForPair(first,second){
  const elements=[first,second].map(id=>LINK_ELEMENTS.find(e=>e.name===HERO[id]?.element)?.id);
  return elements.every(Boolean)?LINKS[elements.sort().join('-')]:null;
}
export function gainLink(run,skill=false){
  if(!run?.link)return;
  run.link.charge=Math.min(LINK_MAX,run.link.charge+LINK_GAIN[skill?'skill':'attack']);
}
export function linkBlocker(run,first,second){
  if(run?.phase!=='battle')return 'Liên kết chỉ dùng trong trận đấu.';
  if(first===second||![first,second].every(id=>run.heroes.some(h=>h.id===id)))return 'Hãy chọn hai anh hùng khác nhau trong đội.';
  if([first,second].some(id=>run.heroes.find(h=>h.id===id).hp<=0))return 'Cả hai anh hùng phải còn sống.';
  if(run.battle.linkUsed)return 'Đã dùng liên kết trong vòng này.';
  if(run.link.charge<LINK_MAX)return `Cần thêm ${LINK_MAX-run.link.charge} điểm liên kết.`;
  return null;
}
export function linkPairs(run){
  if(!run?.heroes)return [];
  return [[0,1],[0,2],[1,2]].map(indices=>{
    const ids=indices.map(i=>run.heroes[i].id),spec=linkForPair(...ids),blocked=linkBlocker(run,...ids);
    return {ids,spec,blocked,ready:!blocked};
  });
}
export function recommendedLink(run){
  const pairs=linkPairs(run).filter(p=>p.ready);if(!pairs.length)return null;
  const hurt=run.heroes.filter(h=>h.hp>0&&h.hp/h.maxHp<.65).length,enemies=run.battle.enemies.filter(e=>e.hp>0),threat=['charge','quake','surge','lunar','volley'].includes(run.battle.bossState?.move);
  const score=spec=>spec.power*(spec.aoe?enemies.length:1)+(spec.heal||0)*hurt*5+(spec.shield||0)*2+(spec.freeze&&threat?1:0);
  return pairs.sort((a,b)=>score(b.spec)-score(a.spec))[0];
}
const percent=n=>Math.round(n*100)+'%';
export function linkDescription(spec){
  const lines=[`Mỗi tướng gây ${percent(spec.power)} ATK lên ${spec.aoe?'toàn bộ địch':'mục tiêu đã chọn'}.`];
  if(spec.burn)lines.push(`Thiêu đốt 2 lượt, mỗi lượt bằng ${percent(spec.burn)} tổng ATK hai tướng.`);
  if(spec.freeze)lines.push(`Đóng băng ${spec.freeze==='all'?'toàn bộ địch':'mục tiêu đã chọn'} trong 1 lượt.`);
  if(spec.heal)lines.push(`Hồi ${percent(spec.heal)} HP tối đa cho đồng đội còn sống.`);
  if(spec.shield)lines.push(`Cả đội còn sống nhận khiên bằng ${percent(spec.shield)} HP tối đa của từng người.`);
  if(spec.drain)lines.push(`Hai tướng chia đều lượng hồi máu bằng ${percent(spec.drain)} sát thương trực tiếp của combo.`);
  if(spec.energy)lines.push(`Cả đội còn sống nhận ${spec.energy} năng lượng.`);
  return lines;
}
export function validateLink(state){
  const r=state.run;if(!r)return;
  const l=r.link,record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  if(!record(l)||Object.keys(l).length!==2||!Number.isSafeInteger(l.charge)||l.charge<0||l.charge>LINK_MAX||!Number.isSafeInteger(l.casts)||l.casts<0||l.casts>1e9||(r.battle&&(!record(r.battle)||typeof r.battle.linkUsed!=='boolean'||(r.battle.linkUsed&&l.casts<1))))throw new Error('Trạng thái liên kết không hợp lệ.');
}
