import {HERO,HEROES,RARITY,RARITIES,rarityRank} from './data.mjs';
import {heroArt,icon} from './art.mjs';
import {rarityStyle,ultimatePreviewButton} from './rarity-ui.mjs';
import {heroExchangeCost,summonFocusStatus} from './summoning.mjs';

const fmt=n=>n.toLocaleString('vi-VN',{maximumFractionDigits:3});
const roster = rarity=>[...HEROES].filter(h=>rarity==='all'||h.rarity===rarity).sort((a,b)=>rarityRank(b.rarity)-rarityRank(a.rarity));
const filters=(rarity,action)=>`<div class="summon-filters" aria-label="Lọc bậc hiếm">${['all',...RARITIES].map(r=>`<button class="${rarity===r?'active':''}" data-action="${action}" data-rarity="${r}" aria-pressed="${rarity===r}">${r==='all'?'Tất cả':r}</button>`).join('')}</div>`;

export function summonFocusPanel(s){
  const focus=summonFocusStatus(s),saved=RARITIES.filter(r=>s.summoning.guaranteed[r]);
  return `<section class="summon-focus-panel panel ${focus?.guaranteed?'promised':''}" ${focus?`style="${rarityStyle(focus.hero.rarity)}"`:''}><div><span class="eyebrow">NGÔI SAO DẪN ĐƯỜNG</span><h3>${focus?`${focus.hero.name} <small>${focus.hero.rarity}</small>`:'Bạn muốn gặp ai?'}</h3><p>${focus?(focus.guaranteed?`Đã lệch 1/1 · Lần ra đúng bậc ${focus.hero.rarity} tiếp theo chắc chắn là ${focus.hero.name}.`:`Chưa lệch · Khi ra đúng bậc ${focus.hero.rarity}, cơ hội gặp ${focus.hero.name} là ${fmt(focus.conditionalRate)}%. Lệch một lần sẽ mở bảo đảm.`):'Chọn một trong 20 anh hùng. Quay lệch ở đúng bậc mục tiêu sẽ mở bảo đảm cho lần ra bậc đó tiếp theo.'}</p>${saved.length?`<div class="summon-saved-promises">Đang giữ bảo đảm: ${saved.map(r=>`<span style="${rarityStyle(r)}">${r}</span>`).join('')}</div>`:''}<small>Bảo đảm lưu riêng theo bậc. Đổi hoặc bỏ mục tiêu vẫn giữ tiến độ; bậc cao hơn giữ nguyên kết quả và bảo đảm mục tiêu.</small></div><div class="summon-focus-controls"><button class="button primary" data-action="summon-focus-open">${icon('star',17)} ${focus?'Đổi mục tiêu':'Chọn mục tiêu'}</button>${focus?`<button class="button secondary" data-action="summon-focus-preview" data-id="${focus.hero.id}">${icon('eye',16)} Xem tướng 3D</button><button class="text-button" data-action="summon-focus-clear">Bỏ mục tiêu</button>`:''}</div></section>`;
}

export function summonFocusPicker(s,rarity='all'){
  return `<div class="modal-kicker">TRIỆU HỒI / CHỌN MỤC TIÊU</div><h2>Gọi tên ngôi sao của bạn.</h2><p class="modal-description">Chạm tướng để xem mô hình, kỹ năng và chọn mục tiêu. Có thể chọn tướng đã sở hữu để kiếm bản trùng.</p>${filters(rarity,'summon-focus-filter')}<div class="summon-roster">${roster(rarity).map(h=>`<button class="summon-choice tier-${h.rarity} ${s.summoning.target===h.id?'selected':''}" style="${rarityStyle(h.rarity)}" data-action="summon-focus-preview" data-id="${h.id}" aria-label="Xem ${h.name}, ${h.rarity}"><div>${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity}</span><strong>${h.name}</strong><small>${h.role}</small><em>${s.summoning.target===h.id?'ĐANG CHỌN':s.summoning.guaranteed[h.rarity]?'CÓ BẢO ĐẢM':s.owned[h.id]?'Đã sở hữu':'Chưa sở hữu'}</em></button>`).join('')}</div>`;
}

export function summonFocusDetail(s,id){
  const h=HERO[id],same=s.summoning.target===id,guaranteed=s.summoning.guaranteed[h.rarity],pool=HEROES.filter(v=>v.rarity===h.rarity).length;
  return `<div class="hero-detail summon-focus-detail tier-${h.rarity}" style="${rarityStyle(h.rarity)}"><div class="detail-art">${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity} · ${RARITY[h.rarity].name}</span><h2>${h.name}</h2><p class="detail-subtitle">${h.title} · ${h.role}</p><div class="skill-detail">${icon('star',24)}<div><strong>${h.skill}</strong><p>${h.desc}</p></div></div><div class="summon-contract ${guaranteed?'promised':''}"><strong>${guaranteed?`Bảo đảm ${h.rarity} đã sẵn sàng`:'Một lần lệch, một lời hẹn'}</strong><p>${guaranteed?`Sau khi chọn, lần ra đúng bậc ${h.rarity} tiếp theo chắc chắn là ${h.name}.`:`Nếu ra ${h.rarity} khác ${h.name}, lần ra đúng ${h.rarity} tiếp theo sẽ là ${h.name}.`}</p><small>Chưa có bảo đảm: ${fmt(100/pool)}% khi ra đúng ${h.rarity}; tỉ lệ cơ bản ${fmt(RARITY[h.rarity].rate/pool)}% mỗi lượt trước bảo đảm bậc hiếm. Tỉ lệ ra bậc ${h.rarity} vẫn là ${fmt(RARITY[h.rarity].rate)}%. Bậc khác không tiêu hao bảo đảm này.</small></div>${ultimatePreviewButton(h)}<button class="button primary full" data-action="summon-focus-set" data-id="${id}" ${same?'disabled':''}>${same?'Đang là mục tiêu':`Chọn ${h.name} làm mục tiêu`}</button><button class="text-button full" data-action="summon-focus-open">${icon('arrow',15)} Danh sách mục tiêu</button></div>`;
}

export function summonExchangeEntry(s){
  const missing=HEROES.filter(h=>!s.owned[h.id]).length;
  return `<button class="summon-exchange-entry panel" data-action="summon-exchange-open"><span class="summon-exchange-symbol">${icon('gem',28)}</span><span><strong>Đổi tinh thạch · Gặp người còn thiếu</strong><small>${missing?`${missing} anh hùng chưa sở hữu`:'Đã sưu tầm đủ 20 anh hùng'} · Bạn có ${fmt(s.shards)} tinh thạch</small></span>${icon('arrow',20)}</button>`;
}

export function summonExchangeShop(s,rarity='all'){
  return `<div class="modal-kicker">CỔNG TINH TÚ / ĐỔI ANH HÙNG</div><h2>Một cuộc gặp chắc chắn.</h2><div class="summon-exchange-wallet">${icon('gem',22)} <strong>${fmt(s.shards)}</strong> tinh thạch</div><p class="modal-description">Bản trùng tặng tinh thạch. Dùng tinh thạch để mở trực tiếp một tướng chưa có; đây là tài nguyên dùng chung với ấn ký và thức tỉnh. Chạm tướng để xem và xác nhận giá.</p>${filters(rarity,'summon-exchange-filter')}<div class="summon-roster">${roster(rarity).map(h=>{const owned=!!s.owned[h.id],cost=heroExchangeCost(h.id);return `<button class="summon-choice tier-${h.rarity} ${owned?'collected':''}" style="${rarityStyle(h.rarity)}" data-action="summon-exchange-detail" data-id="${h.id}" ${owned?'disabled':''} aria-label="${h.name}, ${h.rarity}, ${owned?'đã sở hữu':`${fmt(cost)} tinh thạch`}"><div>${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity}</span><strong>${h.name}</strong><small>${h.role}</small><em>${owned?(s.summoning.exchanged.includes(h.id)?'ĐÃ ĐỔI':'ĐÃ SỞ HỮU'):`${icon('gem',12)} ${fmt(cost)}`}</em>${!owned&&s.shards<cost?`<small>Còn thiếu ${fmt(cost-s.shards)}</small>`:''}</button>`;}).join('')}</div>`;
}

export function summonExchangeDialog(s,id){
  const h=HERO[id],cost=heroExchangeCost(id),owned=!!s.owned[id],enough=s.shards>=cost;
  return `<div class="hero-detail summon-exchange-detail tier-${h.rarity}" style="${rarityStyle(h.rarity)}"><div class="modal-kicker">XÁC NHẬN ĐỔI ANH HÙNG</div><div class="detail-art">${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity} · ${RARITY[h.rarity].name}</span><h2>${h.name}</h2><p class="detail-subtitle">${h.title} · ${h.role}</p><div class="skill-detail">${icon('star',24)}<div><strong>${h.skill}</strong><p>${h.desc}</p></div></div>${ultimatePreviewButton(h)}<div class="summon-exchange-price"><span>Giá đổi<strong>${icon('gem',18)} ${fmt(cost)} tinh thạch</strong></span><span>Số dư sau đổi<strong>${enough?fmt(s.shards-cost):`Thiếu ${fmt(cost-s.shards)}`}</strong></span></div><p class="modal-description">Nhận ${h.name} cấp 1, chưa thức tỉnh. Đổi tướng giữ nguyên vé, bản trùng, đội hình và toàn bộ bộ đếm bảo đảm.</p><button class="button primary full" data-action="summon-exchange-confirm" data-id="${id}" data-cost="${cost}" ${owned||!enough?'disabled':''}>${owned?'Đã sở hữu':enough?`Đổi ${h.name} · ${fmt(cost)} tinh thạch`:'Chưa đủ tinh thạch'}</button><button class="text-button full" data-action="summon-exchange-open">Quay lại cửa hàng</button></div>`;
}

export function summonExchangeSuccess(id){
  const h=HERO[id];return `<div class="hero-detail tier-${h.rarity}" style="${rarityStyle(h.rarity)}"><div class="eyebrow">ĐÃ ĐỔI THÀNH CÔNG · ĐÃ LƯU</div><div class="detail-art">${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity} · ${RARITY[h.rarity].name}</span><h2>${h.name} đã đến!</h2><p class="modal-description">Anh hùng mới đang chờ trong bộ sưu tập.</p><button class="button primary full" data-action="hero" data-id="${id}">Chi tiết & xếp đội hình</button><button class="text-button full" data-action="summon-exchange-open">Tiếp tục sưu tầm</button></div>`;
}

export function summonFocusResult(pull){
  const focus=pull.focus;if(!focus)return '';
  return `<span class="summon-focus-result ${focus.outcome}" style="${rarityStyle(pull.rarity)}">${icon(focus.outcome==='miss'?'star':'check',13)} ${focus.outcome==='guaranteed'?'TRÚNG BẢO ĐẢM':focus.outcome==='hit'?'TRÚNG MỤC TIÊU':`Lệch ${HERO[focus.id].name} · Mở bảo đảm`}</span>`;
}

export function summonFocusRules(){
  return `<div class="summon-contract"><strong>Mục tiêu và bảo đảm bậc hiếm</strong><p>Chọn một tướng ở bất kỳ bậc nào. Lần ra đúng bậc đó đầu tiên chia đều cơ hội giữa các tướng cùng bậc; nếu lệch tướng, lần ra đúng bậc đó tiếp theo chắc chắn là mục tiêu hiện tại.</p><p>Tiến độ lưu riêng cho R / SR / SSR / UR / LR / MR / EX. Đổi sang tướng cùng bậc sẽ chuyển bảo đảm cho tướng mới. Bỏ mục tiêu hoặc chọn bậc khác sẽ giữ lại bảo đảm cũ, chỉ dùng khi chọn lại bậc đó. Không có mục tiêu thì không tích hoặc tiêu hao bảo đảm mục tiêu.</p><p>Các mốc SR+, SSR+ và UR+… vẫn hoạt động. Bậc cao hơn không bị đổi thành bậc mục tiêu, cũng không tiêu hao bảo đảm mục tiêu. Quay ×10 xử lý từng lượt như quay ×1, kể cả mở và dùng bảo đảm trong cùng đợt.</p></div>`;
}
