import {HEROES,HERO,RARITY,RARITIES,HIGH_PITY,rarityRank} from './data.mjs';
import {icon,heroArt} from './art.mjs';
import {hasUltimate} from './ultimate-data.mjs';

export const rarityStyle=r=>`--rarity:${RARITY[r].color};--accent:${RARITY[r].accent}`;
export const ultimatePreviewButton=h=>hasUltimate(h.id)?`<button class="button secondary full ultimate-preview" data-action="preview-ultimate" data-id="${h.id}">${icon('star',17)} Xem chiêu cuối 3D</button>`:'';
export const bestPull=pulls=>pulls.reduce((best,p)=>rarityRank(p.rarity)>rarityRank(best.rarity)?p:best,pulls[0]);
export const rarityTitle=r=>({R:'Một ngôi sao vừa đến.',SR:'Bụi sao dệt nên cuộc gặp.',SSR:'Huyền thoại đã thức giấc.',UR:'Cực quang mở lối.',LR:'Mặt trời gọi tên truyền thuyết.',MR:'Thiên giới dang đôi cánh.',EX:'Vũ trụ chào đón khởi nguyên.'}[r]);
export function rarityPity(s){
  return `<details class="high-pity panel"><summary><span>${icon('star',18)} Bảo đảm bậc cao</span><small>UR / LR / MR / EX</small>${icon('chevron',15)}</summary><div class="high-pity-grid">${Object.entries(HIGH_PITY).map(([r,cap])=>`<div style="${rarityStyle(r)}"><div><span class="rarity-label ${r}">${r}+</span><b>${s.highPity[r]}<small> / ${cap}</small></b></div><div class="pity-track"><i style="width:${s.highPity[r]/cap*100}%"></i></div><p>Còn tối đa <strong>${cap-s.highPity[r]}</strong> lượt${r==='EX'?' để gặp EX':` để gặp ${r} trở lên`}</p></div>`).join('')}</div><p class="pity-explanation">Mỗi lượt cùng tăng tất cả bộ đếm. Nhận bậc cao sẽ đặt lại bảo đảm của bậc đó và các bậc thấp hơn. Bảo đảm không hạ bậc kết quả.</p></details>`;
}
export function rarityGallery(){
  return `<div class="rarity-journey">${[...RARITIES].reverse().map(r=>`<button data-action="preview-rarity" data-id="${HEROES.find(h=>h.rarity===r).id}" style="${rarityStyle(r)}" aria-label="Xem hiệu ứng ${r}"><span>${r}</span><i></i><small>${RARITY[r].name}</small></button>`).join('')}</div><p class="rarity-preview-note">${icon('eye',13)} Chạm một bậc để xem trước hiệu ứng triệu hồi.</p>`;
}
export function portalContent(r,preview=false){
  const d=RARITY[r];return `<div class="portal-view rarity-scene tier-${r}" style="${rarityStyle(r)}"><div class="portal-cosmos" aria-hidden="true"><i></i><i></i><i></i></div><div class="portal-ring"><div>${icon(rarityRank(r)>=4?'crown':'star',64)}</div></div><span class="rarity-label ${r}">${r} · ${d.name}</span><div class="eyebrow">${preview?'XEM TRƯỚC HIỆU ỨNG':'ĐANG KẾT NỐI NHỮNG VÌ SAO'}</div><h2>${rarityTitle(r)}</h2><p>${d.effect}</p></div>`;
}
export function showcaseContent(id){
  const h=HERO[id],d=RARITY[h.rarity];return `<div class="summon-showcase rarity-scene tier-${h.rarity}" style="${rarityStyle(h.rarity)}"><div class="eyebrow">XEM TRƯỚC / ${d.name.toUpperCase()}</div><div class="showcase-art">${heroArt(h)}</div><span class="rarity-label ${h.rarity}">${h.rarity} · ${d.name}</span><h2>${h.name}</h2><p class="showcase-title">${h.title}</p><p class="showcase-effect">${d.effect}</p><p class="preview-disclaimer">Đây là bản xem hiệu ứng. Anh hùng và vé giữ nguyên.</p>${ultimatePreviewButton(h)}<button class="button secondary full" data-action="hero" data-id="${id}">Chi tiết anh hùng ${icon('arrow',17)}</button></div>`;
}
export function skillScene(h){
  const d=RARITY[h.rarity];return `<div class="skill-cinematic tier-${h.rarity}" style="${rarityStyle(h.rarity)}" aria-hidden="true"><div class="skill-sigil">${icon('star',60)}</div><span>${h.name} <b>${h.rarity}</b></span><strong>${h.skill}</strong><i></i></div>`;
}
