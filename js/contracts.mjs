// Only newly started normal tower journeys opt in. No contract operation draws RNG.
export const CONTRACT_RULES=1;
export const CONTRACTS=Object.freeze([
  Object.freeze({id:'blood',name:'Huyết chiến',icon:'sword',color:'#e6a08c',title:'Sức mạnh từ vết thương',benefit:'+25% mọi sát thương của đội',cost:'−15% máu tối đa của cả đội',detail:'Tăng sát thương từ đòn đánh, kỹ năng, liên kết, linh thú, thiêu đốt và phản đòn. Máu hiện tại chỉ bị hạ xuống nếu vượt trần mới; không hồi máu hoặc hồi sinh.',hint:'Hợp với hút máu, khiên và đội dồn sát thương.'}),
  Object.freeze({id:'ambition',name:'Tham vọng',icon:'coin',color:'#dac187',title:'Đổi hiểm nguy lấy kho báu',benefit:'+40% vàng từ trận đấu và kho báu',cost:'Kẻ địch gây thêm 15% sát thương',detail:'Tăng toàn bộ vàng trận đấu, gồm thưởng tinh anh và chúc phúc tăng vàng, cùng vàng kho báu từ sau khi ký. Không tăng quà nhiệm vụ, triệu hồi hoặc viễn chinh. Phần thưởng boss vừa hạ đã được trả trước khi ký.',hint:'Hợp với đội chống chịu, hồi phục và đường kho báu.'}),
  Object.freeze({id:'sacrifice',name:'Đánh đổi sinh lực',icon:'flame',color:'#baa2dc',title:'Thiêu máu, thức tỉnh quyền năng',benefit:'+30% sát thương, hồi máu và khiên từ kỹ năng anh hùng',cost:'Mỗi lần dùng kỹ năng mất 5% máu tối đa',detail:'Trừ máu trước khi thi triển, xuyên khiên, làm tròn lên và luôn chừa ít nhất 1 máu. Tăng cả hiệu ứng thức tỉnh và trấn phái của kỹ năng; hút máu theo sát thương giữ nguyên tỷ lệ. Không tăng nội tại trang bị, liên kết hoặc kỹ năng linh thú; các hành động này cũng không mất máu.',hint:'Hợp với kỹ năng diện rộng, trị liệu và Chén suối nguồn.'})
]);
export const CONTRACT=Object.freeze(Object.fromEntries(CONTRACTS.map(c=>[c.id,c])));
export const contractEligible=r=>r?.contractRules===CONTRACT_RULES&&r.mode==='normal'&&!r.challenge&&!r.dungeon&&!r.campaign&&!r.hunt&&!r.training&&!r.raid;
export const hasContract=(r,id)=>contractEligible(r)&&!!r.contracts?.some(c=>c.id===id);
export const availableContracts=r=>contractEligible(r)?CONTRACTS.filter(c=>!hasContract(r,c.id)):[];
export const contractDamageMultiplier=r=>hasContract(r,'blood')?1.25:1;
export const contractEnemyMultiplier=r=>hasContract(r,'ambition')?1.15:1;
export const contractSkillMultiplier=r=>hasContract(r,'sacrifice')?1.3:1;
export const contractGold=(r,gold)=>hasContract(r,'ambition')?Math.round(gold*1.4):gold;
export const contractMaxHp=hp=>Math.max(1,Math.round(hp*.85));
export function contractSkillCost(r,h){
  return hasContract(r,'sacrifice')?Math.min(Math.max(0,h.hp-1),Math.max(1,Math.ceil(h.maxHp*.05))):0;
}
export function offerContracts(r){
  if(!contractEligible(r)||r.phase!=='battle'||r.node!=='boss'||r.floor%5!==0||!r.victory||!r.lastReward?.boss||r.battle.enemies.some(e=>e.hp>0)||!availableContracts(r).length)return false;
  r.contractOffer={floor:r.floor};r.phase='contract';return true;
}
// Validation and phase advancement belong to the engine; this applies a reviewed choice once.
export function acceptContract(r,id){
  if(!contractEligible(r)||r.phase!=='contract'||r.contractOffer?.floor!==r.floor||!availableContracts(r).some(c=>c.id===id))throw new Error('Khế ước không còn khả dụng.');
  r.contracts.push({id,floor:r.floor});
  if(id==='blood')for(const h of r.heroes){h.maxHp=contractMaxHp(h.maxHp);h.hp=Math.min(h.hp,h.maxHp);}
}
export function validateContracts(s){
  const r=s.run;if(!r)return;
  const fail=()=>{throw new Error('Khế ước bóng tối không hợp lệ.');};
  const fields=['contractRules','contracts','contractOffer'];
  if(!fields.some(k=>Object.hasOwn(r,k))){if(r.phase==='contract')fail();return;}
  if(!fields.every(k=>Object.hasOwn(r,k))||!contractEligible(r)||!Array.isArray(r.contracts)||r.contracts.length>CONTRACTS.length)fail();
  const ids=new Set(),floors=new Set();let previous=0;
  for(const c of r.contracts){
    if(!c||Array.isArray(c)||Object.keys(c).sort().join(',')!=='floor,id'||!Object.hasOwn(CONTRACT,c.id)||ids.has(c.id)||!Number.isSafeInteger(c.floor)||c.floor<5||c.floor%5!==0||c.floor>r.floor||c.floor<=previous||floors.has(c.floor))fail();
    if(c.floor<r.floor&&c.floor>r.cleared)fail();
    if(c.floor===r.floor&&(!['relic','blessing','result'].includes(r.phase)||r.node!=='boss'||!r.victory||!r.lastReward?.boss))fail();
    ids.add(c.id);floors.add(c.floor);previous=c.floor;
  }
  const offer=r.contractOffer;
  if(offer!==null){
    if(!offer||Array.isArray(offer)||Object.keys(offer).join(',')!=='floor'||offer.floor!==r.floor||r.floor%5!==0||r.phase!=='contract'||r.node!=='boss'||floors.has(r.floor)||!availableContracts(r).length||!r.victory||!r.lastReward?.boss||!r.battle?.enemies?.length||r.battle.enemies[0].kind!=='boss'||r.battle.enemies.some(e=>e.hp!==0))fail();
  }else if(r.phase==='contract')fail();
}
