// A saved order belongs to one journey. Reading a forecast never consumes combat RNG.
export const ANOMALY_RULES=1;
export const ANOMALIES=Object.freeze([
  Object.freeze({id:'bloodmoon',name:'Huyết nguyệt',icon:'moon',color:'#e6a092',benefit:'+20% mọi sát thương của đội',cost:'Địch gây thêm 20% sát thương · hồi máu trong trận giảm 25%',detail:'Đòn đánh, kỹ năng, liên kết, linh thú, thiêu đốt và phản đòn đều mạnh hơn. Hồi máu và hút máu của cả hai bên giảm 25%. Hồi sinh, nghỉ chân, sự kiện và hồi phục sau trận giữ nguyên.',hint:'Dồn sát thương, đóng băng và dùng khiên để kết thúc trận sớm.',visual:Object.freeze({accent:'#e6a092',background:'#291c2b',danger:'#421e32',glow:'#ee9b91',weather:'#efb09b'})}),
  Object.freeze({id:'frost',name:'Sương hàn',icon:'snow',color:'#afe2ed',benefit:'+30% khiên mới tạo cho đội',cost:'Tướng còn sống mất 20 năng lượng khi vào mỗi trận',detail:'Trừ năng lượng sau phần tiếp năng lượng đầu trận thông thường, trước Rễ trường sinh, tối thiểu 0. Tăng khiên từ chúc phúc, kỹ năng, liên kết, linh thú, trang bị và Chén suối nguồn; không tăng khiên của địch hoặc nhân lại khiên đã có.',hint:'Tận dụng chúc phúc Rào chắn và anh hùng tạo khiên để chờ đủ năng lượng.',visual:Object.freeze({accent:'#afe2ed',background:'#183441',danger:'#30324b',glow:'#b9eaf3',weather:'#dcf8ff'})}),
  Object.freeze({id:'mana',name:'Mạch mana',icon:'bolt',color:'#b5addf',benefit:'Đánh thường hồi thêm 15 năng lượng',cost:'Mọi kẻ địch có thêm 20% máu tối đa',detail:'Chỉ tăng năng lượng của người đánh thường, tối đa 100; kỹ năng, liên kết và linh thú không nhận thêm. Tăng máu khi tạo địch, gồm boss, tinh anh và bóng hầu theo máu boss. Giáp bộ phận và hồi sinh dùng máu tối đa đã tăng; tải lại không tăng thêm.',hint:'Ưu tiên đòn thường để xoay kỹ năng, kết hợp chúc phúc năng lượng và Đồng hồ rạn.',visual:Object.freeze({accent:'#b5addf',background:'#23233e',danger:'#35294b',glow:'#c5b7f2',weather:'#d6c5ff'})})
]);
export const ANOMALY=Object.freeze(Object.fromEntries(ANOMALIES.map(a=>[a.id,a])));
const orders=Object.freeze([
  ['bloodmoon','frost','mana'],['bloodmoon','mana','frost'],
  ['frost','bloodmoon','mana'],['frost','mana','bloodmoon'],
  ['mana','bloodmoon','frost'],['mana','frost','bloodmoon']
].map(Object.freeze));
export function starterAnomalies(seed){
  let x=(seed>>>0)||1234567;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);x=(x^(x>>>16))>>>0;
  return {anomalyRules:ANOMALY_RULES,anomalyOrder:[...orders[x%orders.length]]};
}
export const anomalyEligible=r=>r?.anomalyRules===ANOMALY_RULES&&r.mode==='normal'&&!r.challenge&&!r.dungeon&&!r.campaign&&!r.hunt&&!r.training&&!r.raid;
export function anomalyForFloor(r,floor=r?.floor){
  if(!anomalyEligible(r)||!Number.isSafeInteger(floor)||floor<1||floor>1e6)return null;
  const segment=Math.floor((floor-1)/5),id=r.anomalyOrder?.[segment%3];
  if(!Object.hasOwn(ANOMALY,id))return null;
  return {...ANOMALY[id],segment:segment+1,start:segment*5+1,end:segment*5+5};
}
export const anomalyDamageMultiplier=r=>anomalyForFloor(r)?.id==='bloodmoon'?1.2:1;
export const anomalyHealingMultiplier=r=>r?.phase==='battle'&&anomalyForFloor(r)?.id==='bloodmoon'?0.75:1;
export const anomalyShieldMultiplier=r=>anomalyForFloor(r)?.id==='frost'?1.3:1;
export const anomalyOpeningPenalty=r=>anomalyForFloor(r)?.id==='frost'?20:0;
export const anomalyBasicEnergy=r=>anomalyForFloor(r)?.id==='mana'?15:0;
export const anomalyEnemyHpMultiplier=r=>anomalyForFloor(r)?.id==='mana'?1.2:1;
export function validateAnomalies(s){
  const r=s.run;if(!r)return;
  if(!['anomalyRules','anomalyOrder'].some(k=>Object.hasOwn(r,k)))return;
  if(!anomalyEligible(r)||!Array.isArray(r.anomalyOrder)||r.anomalyOrder.length!==3||!orders.some(order=>order.every((id,i)=>r.anomalyOrder[i]===id)))throw new Error('Dị biến tháp không hợp lệ.');
}
