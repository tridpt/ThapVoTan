import {eliteDefinition,eliteAttackMultiplier,eliteEligible,eliteReward} from './elites.mjs';
import {gearDropChances} from './equipment.mjs';
import {icon} from './art.mjs';
import {hasContract} from './contracts.mjs';

const fmt=n=>n.toLocaleString('vi-VN');
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function eliteStatus(e){
  if(e.hp<=0)return 'Đã hạ gục';
  if(e.elite?.trait==='rage')return `Sức đánh +${Math.round((eliteAttackMultiplier(e)-1)*100)}%`;
  if(e.elite?.trait==='guard')return e.shield>0?`Khiên ${fmt(e.shield)} · Bảo hộ đồng bọn −35% sát thương`:'Khiên đã vỡ · Bảo hộ đã tắt';
  return e.elite?.revived?'Đã dùng hồi sinh':'Còn 1 lượt hồi sinh';
}
export function eliteBadge(e){
  const def=eliteDefinition(e);if(!def)return '';
  return `<span class="elite-unit-badge" style="--elite:${def.color}" aria-label="Tinh anh ${def.name}">${icon(def.icon,12)} ${def.name}${e.elite.revived?' · II':''}</span>`;
}
export function eliteBanner(r){
  const e=r.battle?.enemies.find(e=>eliteDefinition(e));if(!e)return '';
  const def=eliteDefinition(e);
  return `<button type="button" class="elite-banner ${e.hp<=0?'is-defeated':''}" data-action="elite-info" data-id="${e.id}" style="--elite:${def.color}" aria-label="Xem cách khắc chế tinh anh ${def.name}"><span class="elite-banner-icon">${icon(def.icon,23)}</span><span><small>QUÁI TINH ANH</small><strong>${def.name} <i>·</i> ${esc(e.name)}</strong><em>${eliteStatus(e)}</em></span><span class="elite-more">Khắc chế ${icon('info',17)}</span></button>`;
}
export function eliteDetail(r,id){
  const e=r?.battle?.enemies.find(e=>e.id===id),def=eliteDefinition(e);if(!def)return '';
  const bonus=eliteReward(r),rates=gearDropChances(r.floor,'champion').map(([rarity,p])=>`${rarity} ${Math.round(p*100)}%`).join(' · '),ambition=hasContract(r,'ambition');
  return `<div class="elite-detail" style="--elite:${def.color}"><div class="modal-kicker">QUÁI TINH ANH / TẦNG ${r.floor}</div><div class="elite-detail-emblem">${icon(def.icon,42)}</div><h2>${def.name}</h2><p class="detail-subtitle">${esc(e.name)}</p><div class="info-block"><p>${def.desc}</p><strong>${eliteStatus(e)}</strong></div><div class="skill-detail">${icon('eye',24)}<div><strong>Cách khắc chế</strong><p>${def.counter}</p></div></div><p class="modal-description">Thắng cả trận để nhận thêm ${fmt(bonus.gold)} vàng${ambition?' gốc':''}, ${bonus.dust} bụi rèn và chắc chắn 1 trang bị có tỉ lệ hiếm cao hơn.${ambition?' Tham vọng cộng 40% trên tổng vàng trận đấu.':''}</p><p class="upgrade-note">Tỉ lệ trang bị: ${rates}. Quà tinh anh được nhận một lần khi chiến thắng.</p></div>`;
}
export function eliteRouteNote(r,node=r?.node,floor=r?.floor){
  if(!eliteEligible(r,node,floor))return '';
  return `<p class="elite-route-note">${icon('shield',15)} ${node==='elite'?'Chắc chắn có 1 quái tinh anh mang đặc tính.':'28% gặp 1 quái tinh anh mang đặc tính.'} Thắng nhận thêm vàng, bụi rèn và 1 trang bị có tỉ lệ hiếm cao hơn.</p>`;
}
export function eliteRewardNote(r){
  const bonus=r?.lastReward?.eliteBonus;if(!bonus)return '';
  const def=eliteDefinition(r.battle?.enemies.find(e=>e.elite?.trait===bonus.trait)),ambition=hasContract(r,'ambition');if(!def)return '';
  return `<p class="elite-reward-note" style="--elite:${def.color}">${icon(def.icon,18)} <span>Đã hạ tinh anh ${def.name}: ${ambition?'thưởng gốc thêm':'thưởng thêm'} <b>${fmt(bonus.gold)} vàng</b> và <b>${bonus.dust} bụi rèn</b>, đã tính trong tổng thưởng.${ambition?' Tham vọng +40% đã áp dụng trên tổng vàng.':''} Trang bị dùng tỉ lệ rơi tinh anh.</span></p>`;
}
