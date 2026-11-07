import {HERO} from './data.mjs';

export const TALENT_BRANCHES=[
  {id:'offense',name:'Sát thương',icon:'sword',color:'#e2aa88',desc:'Đánh mạnh hơn, tăng sát thương trực tiếp và chí mạng.'},
  {id:'defense',name:'Chống chịu',icon:'shield',color:'#a6c7a2',desc:'Thêm sinh lực, phòng thủ và giảm sát thương nhận.'},
  {id:'support',name:'Hỗ trợ',icon:'star',color:'#a9c8df',desc:'Sẵn sàng kỹ năng sớm, hồi phục và tiếp năng lượng cho đội.'}
];
export const TALENT_NODES=[
  {id:'force',branch:'offense',name:'Vũ lực',icon:'sword',cost:1,level:2,requires:null,effect:'atk',step:.02,desc:'Tăng 2% tấn công mỗi bậc.'},
  {id:'pierce',branch:'offense',name:'Khai phá',icon:'bolt',cost:3,level:10,requires:'force',effect:'damage',step:.02,desc:'Tăng 2% sát thương trực tiếp mỗi bậc.'},
  {id:'precision',branch:'offense',name:'Tâm điểm',icon:'eye',cost:5,level:20,requires:'pierce',effect:'crit',step:.02,desc:'Thêm 2 điểm % tỉ lệ chí mạng mỗi bậc; tổng tỉ lệ tối đa 80%.'},
  {id:'vitality',branch:'defense',name:'Sinh lực',icon:'heart',cost:1,level:2,requires:null,effect:'hp',step:.03,desc:'Tăng 3% sinh lực tối đa mỗi bậc.'},
  {id:'iron',branch:'defense',name:'Thiết giáp',icon:'shield',cost:3,level:10,requires:'vitality',effect:'def',step:1,desc:'Thêm 1 phòng thủ mỗi bậc.'},
  {id:'resolve',branch:'defense',name:'Bất khuất',icon:'shield',cost:5,level:20,requires:'iron',effect:'guard',step:.02,desc:'Giảm 2% sát thương từ đòn địch mỗi bậc, trước khi khiên hấp thụ.'},
  {id:'tempo',branch:'support',name:'Khởi nhịp',icon:'bolt',cost:1,level:2,requires:null,effect:'openingEnergy',step:3,desc:'Bắt đầu chuyến đi với thêm 3 năng lượng mỗi bậc.'},
  {id:'nurture',branch:'support',name:'Nuôi dưỡng',icon:'heart',cost:3,level:10,requires:'tempo',effect:'aid',step:.04,desc:'Tăng 4% hồi máu và khiên do anh hùng tạo ra mỗi bậc, gồm hiệu ứng trang bị. Không tăng hỗ trợ từ linh thú hoặc đền nghỉ.'},
  {id:'inspire',branch:'support',name:'Tiếp lửa',icon:'star',cost:5,level:20,requires:'nurture',effect:'teamEnergy',step:2,desc:'Sau khi dùng kỹ năng, mỗi đồng đội khác còn sống nhận 2 năng lượng mỗi bậc.'}
];
export const TALENT=Object.fromEntries(TALENT_NODES.map(n=>[n.id,n]));
export const TALENT_MAX_RANK=5;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export const talentPoints=level=>Math.max(0,level-1);
export const heroTalents=(s,id)=>s.talents?.[id]||{};
export const talentSpent=nodes=>Object.entries(nodes||{}).reduce((sum,[id,rank])=>sum+(TALENT[id]?.cost||0)*rank,0);
export function talentStatus(s,id){
  const level=s.owned[id]?.level||1,nodes=heroTalents(s,id),total=talentPoints(level),spent=talentSpent(nodes);
  return {level,nodes,total,spent,available:total-spent};
}
export function talentBonuses(nodes){
  const out={atk:0,damage:0,crit:0,hp:0,def:0,guard:0,openingEnergy:0,aid:0,teamEnergy:0};
  for(const node of TALENT_NODES)out[node.effect]=(nodes?.[node.id]||0)*node.step;
  return out;
}
export const fighterTalents=h=>talentBonuses(h?.talents?.nodes);
export const snapshotTalents=(s,id)=>({level:s.owned[id].level,nodes:{...heroTalents(s,id)}});
export function talentBlocker(s,id,nodeId){
  if(!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id))return 'Bạn chưa sở hữu anh hùng này.';
  if(!Object.hasOwn(TALENT,nodeId))return 'Thiên phú không hợp lệ.';
  const node=TALENT[nodeId],t=talentStatus(s,id);
  if((t.nodes[nodeId]||0)>=TALENT_MAX_RANK)return 'Đã đạt bậc tối đa.';
  if(t.level<node.level)return 'Cần anh hùng cấp '+node.level+'.';
  if(node.requires&&(t.nodes[node.requires]||0)<3)return 'Cần '+TALENT[node.requires].name+' bậc 3/5.';
  if(t.available<node.cost)return 'Cần '+node.cost+' điểm thiên phú; đang còn '+t.available+'.';
  return '';
}
export function learnTalent(s,id,nodeId){
  if(s.run?.training)throw new Error('Không thể đổi thiên phú thật trong phòng thử.');
  const error=talentBlocker(s,id,nodeId);if(error)throw new Error(error);
  const nodes={...heroTalents(s,id)};nodes[nodeId]=(nodes[nodeId]||0)+1;
  s.talents[id]=nodes;return nodes[nodeId];
}
export function talentResetCost(s,id){const spent=talentStatus(s,id).spent;return spent?150+spent*10:0;}
export function resetTalents(s,id){
  if(s.run?.training)throw new Error('Không thể đổi thiên phú thật trong phòng thử.');
  if(!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id))throw new Error('Bạn chưa sở hữu anh hùng này.');
  const spent=talentStatus(s,id).spent,cost=talentResetCost(s,id);
  if(!spent)throw new Error('Anh hùng chưa dùng điểm thiên phú.');
  if(!Number.isSafeInteger(s.gold)||s.gold<cost)throw new Error('Chưa đủ vàng để đặt lại thiên phú.');
  s.gold-=cost;delete s.talents[id];return {points:spent,gold:cost};
}
function validNodes(nodes,level){
  return record(nodes)&&Object.entries(nodes).every(([id,rank])=>Object.hasOwn(TALENT,id)&&Number.isInteger(rank)&&rank>=1&&rank<=TALENT_MAX_RANK&&level>=TALENT[id].level&&(!TALENT[id].requires||(nodes[TALENT[id].requires]||0)>=3))&&talentSpent(nodes)<=talentPoints(level);
}
export function validateTalents(s){
  if(!record(s.talents)||Object.entries(s.talents).some(([id,nodes])=>!Object.hasOwn(HERO,id)||!Object.hasOwn(s.owned,id)||!validNodes(nodes,s.owned[id].level)))throw new Error('Thiên phú anh hùng không hợp lệ.');
  for(const h of s.run?.heroes||[]){
    if(h.talents===null)continue;
    const t=h.talents;
    if(!record(t)||Object.keys(t).length!==2||!Number.isInteger(t.level)||t.level<1||t.level>100||t.level>s.owned[h.id].level||!validNodes(t.nodes,t.level))throw new Error('Thiên phú trong chuyến đi không hợp lệ.');
  }
}
