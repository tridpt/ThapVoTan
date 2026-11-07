import {ANOMALIES,anomalyForFloor,anomalyBasicEnergy} from './anomalies.mjs';
import {icon} from './art.mjs';

export function anomalyBanner(r,{forecast=false}={}){
  const a=anomalyForFloor(r);if(!a)return '';
  const next=anomalyForFloor(r,a.end+1);
  return `<section class="anomaly-banner anomaly-${a.id}" style="--anomaly:${a.color}" aria-label="Dị biến chặng hiện tại"><div class="anomaly-current"><div class="anomaly-emblem" aria-hidden="true">${icon(a.icon,28)}</div><div class="anomaly-copy"><span class="anomaly-kicker">DỊ BIẾN · TẦNG ${a.start}–${a.end}</span><strong>${a.name}</strong><p><b>${a.benefit}</b><span>${a.cost}</span></p></div><button class="icon-button" data-action="anomaly-info" aria-label="Xem luật dị biến">${icon('info',19)}</button></div>${forecast&&next?`<div class="anomaly-forecast">${icon(next.icon,15)}<span>Chặng kế · Tầng ${next.start}–${next.end}</span><strong>${next.name}</strong></div>`:''}</section>`;
}
export function anomalyDetail(r){
  const current=anomalyForFloor(r);if(!current)return '';
  const next=anomalyForFloor(r,current.end+1);
  return `<div class="modal-kicker">LUẬT CHẶNG THÁP</div><h2>Dị biến tháp</h2><p class="modal-description">Hiện tại: <b>${current.name}</b>, tầng ${current.start}–${current.end}.${next?` Tiếp theo: <b>${next.name}</b>, tầng ${next.start}–${next.end}.`:''} Dị biến tự đổi sau mỗi chặng 5 tầng, kể cả tầng boss.</p><div class="anomaly-rules">${ANOMALIES.map(a=>`<article class="anomaly-rule ${a.id===current.id?'is-current':''}" style="--anomaly:${a.color}"><div>${icon(a.icon,24)}<h3>${a.name}</h3>${a.id===current.id?'<span>ĐANG ÁP DỤNG</span>':''}</div><p class="anomaly-gain">${a.benefit}</p><p class="anomaly-loss">${a.cost}</p><p>${a.detail}</p><small>${a.hint}</small></article>`).join('')}</div><div class="info-block"><p>Thứ tự đã chốt khi khởi hành, luân phiên đủ ba dị biến rồi lặp lại. Mở bản đồ, đọc luật hoặc tải lại game không đổi thứ tự. Các hệ số kết hợp theo phép nhân với chúc phúc, cổ vật và khế ước; mỗi hiệu ứng chỉ tính một lần.</p></div><button class="button primary full" data-action="close">Đã hiểu ${icon('check',17)}</button>`;
}
export function anomalyRunInfo(r){
  const a=anomalyForFloor(r);if(!a)return '';
  return `<div class="info-block anomaly-run-info" style="--anomaly:${a.color}"><strong>${icon(a.icon,18)} ${a.name} · Tầng ${a.start}–${a.end}</strong><p>${a.benefit}. ${a.cost}.</p><button class="text-button" data-action="anomaly-info">Xem luật và chặng kế ${icon('chevron',14)}</button></div>`;
}
export function anomalyActionHint(r){
  return anomalyBasicEnergy(r)?'<p class="anomaly-action-hint">'+icon('bolt',14)+' Mạch mana: mỗi đòn thường hồi thêm 15 năng lượng, tối đa 100.</p>':'';
}
