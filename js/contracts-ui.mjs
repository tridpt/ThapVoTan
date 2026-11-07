import {CONTRACTS,CONTRACT,contractEligible,hasContract,contractMaxHp,contractSkillCost} from './contracts.mjs';
import {HERO} from './data.mjs';
import {icon} from './art.mjs';

const fmt=n=>n.toLocaleString('vi-VN');
// Code-native seals keep the altar available offline without a second graphics renderer.
export function contractSeal(id,size=104){
  const def=Object.hasOwn(CONTRACT,id)?CONTRACT[id]:null;if(!def)return '';
  const glyph=id==='blood'?[-42,42].map(angle=>`<g transform="rotate(${angle} 52 52)"><path d="m52 18 6 11v28l-6 6-6-6V29Z"/><path d="M39 61h26M52 64v15m-5 0h10"/></g>`).join(''):id==='ambition'?'<path d="m26 39 9 27h34l9-27-17 9-9-22-9 22Z"/><path d="M35 73h34m-25-9 8-10 8 10"/>':'<path d="M52 22c10 18 24 26 24 41a24 24 0 0 1-48 0c0-15 14-23 24-41Z"/><path d="M52 46c5 9 12 13 12 21a12 12 0 0 1-24 0c0-8 7-12 12-21Z"/>';
  return `<svg class="contract-seal" width="${size}" height="${size}" viewBox="0 0 104 104" aria-hidden="true" style="--contract:${def.color}"><circle cx="52" cy="52" r="49" fill="#10232c"/><g fill="none" stroke="currentColor"><circle class="contract-seal-ring" cx="52" cy="52" r="47" stroke-dasharray="2 8"/><circle cx="52" cy="52" r="40" opacity=".6"/><path d="m52 6 40 69H12Z" opacity=".15"/><path d="M12 30h12m56 44h12M30 12v12m44 56v12" opacity=".4"/></g><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</g><path d="m52 4 3 5-3 5-3-5Zm0 86 3 5-3 5-3-5Z" fill="currentColor"/></svg>`;
}
function terms(def){return `<div class="contract-terms"><div class="contract-benefit">${icon('star',17)}<span><small>NHẬN ĐƯỢC</small><strong>${def.benefit}</strong></span></div><div class="contract-price">${icon('heart',17)}<span><small>CÁI GIÁ</small><strong>${def.cost}</strong></span></div></div>`;}
function hpPreview(r){
  return `<div class="contract-hp-preview"><h3>Máu sau khi ký</h3><div class="contract-hp-scroll"><table><thead><tr><th scope="col">Anh hùng</th><th scope="col">Máu tối đa</th><th scope="col">Máu hiện tại</th></tr></thead><tbody>${r.heroes.map(h=>`<tr><th scope="row">${HERO[h.id].name}</th><td>${fmt(h.maxHp)} → <b>${fmt(contractMaxHp(h.maxHp))}</b></td><td>${h.hp===0?'Đã gục · Giữ 0':`${fmt(h.hp)} → ${fmt(Math.min(h.hp,contractMaxHp(h.maxHp)))}`}</td></tr>`).join('')}</tbody></table></div><p>Chúc phúc tăng máu nhận sau đó vẫn dùng trần máu đã giảm này.</p></div>`;
}
export function contractPage(r){
  if(r?.phase!=='contract'||!contractEligible(r))return '';
  return `<section class="contract-page" aria-labelledby="contract-title"><header class="contract-heading"><span>${icon('moon',17)} GIAO ƯỚC SAU BOSS · TẦNG ${r.floor}</span><div class="contract-altar" aria-hidden="true">${contractSeal('sacrifice',124)}<i></i></div><h1 id="contract-title">Khế ước bóng tối</h1><p>Tháp ban sức mạnh. Bạn chọn cái giá.</p><small>Ký 1 khế ước hoặc bỏ qua, rồi chọn cổ vật và chúc phúc.</small></header><div class="contract-grid">${CONTRACTS.map((def,i)=>{const signed=hasContract(r,def.id);return `<article class="contract-card ${signed?'is-signed':''}" style="--contract:${def.color}"><span class="contract-number">GIAO ƯỚC ${String(i+1).padStart(2,'0')}${signed?' · ĐÃ KÝ':''}</span>${contractSeal(def.id)}<p class="contract-card-title">${def.title}</p><h2>${def.name}</h2>${terms(def)}<p class="contract-hint">${def.hint}</p><button type="button" class="button ${signed?'secondary':'primary'}" data-action="contract-review" data-id="${def.id}" data-floor="${r.floor}" ${signed?'disabled':''}>${signed?icon('check',17)+' Đang có hiệu lực':'Xem trước khi ký '+icon('arrow',17)}</button></article>`;}).join('')}</div><div class="contract-footer"><p>${icon('info',17)}<span>Mỗi loại chỉ ký một lần. Các khế ước kết hợp với nhau, chúc phúc và cổ vật; kết thúc khi rời chuyến đi. Phần thưởng boss vừa rồi đã được lưu.</span></p><button type="button" class="button secondary" data-action="contract-skip" data-floor="${r.floor}">Bỏ qua · Chọn cổ vật ${icon('arrow',17)}</button></div>${contractTray(r)}</section>`;
}
export function contractDetail(r,id,{review=false}={}){
  const def=Object.hasOwn(CONTRACT,id)?CONTRACT[id]:null,signed=hasContract(r,id);
  if(!def||!contractEligible(r)||(review?(r.phase!=='contract'||!r.contractOffer||signed):!signed))return '';
  return `<div class="contract-detail" style="--contract:${def.color}"><div class="modal-kicker">KHẾ ƯỚC BÓNG TỐI / ${review?'XEM TRƯỚC KHI KÝ':'ĐÃ KÝ Ở TẦNG '+r.contracts.find(c=>c.id===id).floor}</div>${contractSeal(id,92)}<h2>${def.name}</h2><p class="detail-subtitle">${def.title}</p>${terms(def)}<p class="modal-description">${def.detail}</p>${review&&id==='blood'?hpPreview(r):''}<div class="contract-combo">${icon('star',18)}<span>${def.hint}</span></div><p class="contract-duration">Có hiệu lực đến hết chuyến đi. Không thể hủy giữa chuyến. Mỗi loại chỉ ký một lần.</p>${review?`<div class="confirm-buttons"><button type="button" class="button secondary" data-action="close">Cân nhắc lại</button><button type="button" class="button primary" data-action="contract-confirm" data-id="${id}" data-floor="${r.floor}">Ký khế ước ${icon('moon',17)}</button></div>`:''}</div>`;
}
export function contractTray(r){
  if(!contractEligible(r)||!r.contracts.length)return '';
  return `<div class="contract-tray" aria-label="Khế ước của chuyến đi"><span>${icon('moon',15)} KHẾ ƯỚC</span>${r.contracts.map(c=>{const def=CONTRACT[c.id];return `<button type="button" data-action="contract-info" data-id="${c.id}" style="--contract:${def.color}" aria-label="Xem khế ước ${def.name}">${icon(def.icon,15)}<span>${def.name}</span>${icon('info',12)}</button>`;}).join('')}</div>`;
}
export function contractRunInfo(r){
  if(!contractEligible(r))return '';
  return `<h3>${r.contracts.length}/3 khế ước đã ký</h3>${r.contracts.length?`<div class="contract-info-list">${r.contracts.map(c=>{const def=CONTRACT[c.id];return `<button type="button" data-action="contract-info" data-id="${c.id}" style="--contract:${def.color}"><strong>${icon(def.icon,17)} ${def.name} <small>· Tầng ${c.floor}</small></strong><span>${def.benefit}</span><em>${def.cost}</em></button>`;}).join('')}</div>`:'<p class="modal-description">Sau mỗi boss, chọn khế ước để nhận sức mạnh kèm một cái giá. Có thể bỏ qua.</p>'}`;
}
export function contractSkillHint(r,h){
  if(!h||!hasContract(r,'sacrifice'))return '';
  const cost=contractSkillCost(r,h);
  return `<p class="contract-skill-hint">${icon('flame',14)}<span>Kỹ năng +30% sức mạnh · Hiến <b>${fmt(cost)} máu</b> trước khi dùng · Luôn còn ít nhất 1 máu</span></p>`;
}
