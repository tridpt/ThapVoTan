import {HERO,RARITY} from './data.mjs';
import {icon,heroArt} from './art.mjs';
import {counterOpportunity,COUNTER_POWER} from './counter.mjs';
import {bossParts,bossPartName,BOSS_PART_IDS} from './boss-parts.mjs';

const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function counterControl(r,auto=false){
  if(!counterOpportunity(r))return '';
  return `<button class="counter-control" data-action="counter-open" ${auto?'disabled':''} aria-label="Phản công miễn lượt, một lần trong vòng này"><span class="counter-emblem">${icon('sword',23)}</span><span><strong>PHẢN CÔNG <b>1 LẦN</b></strong><small>${auto?'Auto bỏ qua · Hết hạn cuối lượt':'Đỡ hoàn hảo · Chọn tướng đánh trả'}</small></span><span class="counter-cta">150% ${icon('chevron',17)}</span></button>`;
}
export function counterSelection(r,choices={}){
  const heroId=r.heroes.find(h=>h.id===choices.heroId&&h.hp>0)?.id||r.heroes.find(h=>h.hp>0)?.id;
  const enemy=r.battle.enemies.find(e=>e.id===choices.targetId&&e.hp>0)||r.battle.enemies.find(e=>e.hp>0);
  const parts=bossParts(r),part=Object.hasOwn(choices,'partId')?choices.partId:parts?.selected;
  return {heroId,targetId:enemy?.id,partId:enemy?.kind==='boss'&&parts&&BOSS_PART_IDS.includes(part)?part:null};
}
export function counterDialog(r,choices={}){
  const receipt=counterOpportunity(r);if(!receipt)return '';
  const {heroId,targetId,partId}=counterSelection(r,choices),b=r.battle,parts=bossParts(r),target=b.enemies.find(e=>e.id===targetId);
  return `<div class="counter-dialog"><div class="modal-kicker">ĐỠ HOÀN HẢO · VÒNG ${b.round}</div><h2>Thời cơ phản công</h2><p class="modal-description">Chọn một tướng còn sống đánh trả ${COUNTER_POWER*100}% đòn thường. Không tốn lượt hay năng lượng.</p><div class="counter-heroes" role="group" aria-label="Chọn anh hùng phản công">${r.heroes.map(h=>{const def=HERO[h.id];return `<button class="counter-hero ${h.id===heroId?'selected':''}" data-action="counter-hero" data-id="${h.id}" aria-pressed="${h.id===heroId}" ${h.hp<=0?'disabled':''} style="--counter-rarity:${RARITY[def.rarity].color}"><span class="counter-portrait" aria-hidden="true">${heroArt(def)}</span><strong>${def.name}</strong><span>${def.rarity} · ${def.role}</span><small>${h.hp<=0?'Đã gục':b.used.includes(h.id)?'Đã đánh · Vẫn phản công được':'Giữ nguyên lượt đánh'}</small></button>`;}).join('')}</div><p class="counter-label">${icon('target',15)} Chọn mục tiêu</p><div class="counter-targets" role="group" aria-label="Mục tiêu phản công">${b.enemies.filter(e=>e.hp>0).map(e=>`<button data-action="counter-target" data-id="${e.id}" aria-pressed="${e.id===targetId}">${esc(e.name)}</button>`).join('')}</div>${target?.kind==='boss'&&parts?`<div class="counter-parts" role="group" aria-label="Bộ phận boss để phản công"><button data-action="counter-part" data-part="body" aria-pressed="${partId===null}">Đánh trực tiếp</button>${BOSS_PART_IDS.map(id=>`<button data-action="counter-part" data-part="${id}" aria-pressed="${partId===id}"><strong>${bossPartName(b.bossState.id,id)}</strong><small>${parts[id].hp>0?`${Math.ceil(parts[id].hp)} / ${parts[id].maxHp} giáp`:'Đã phá giáp'}</small></button>`).join('')}</div>`:''}<div class="counter-note">${icon('info',15)}<span>Chỉ một tướng được phản công. Tướng đã đánh vẫn dùng được. Cơ hội hết hạn khi kết thúc lượt này.</span></div><button class="button primary full counter-fire" data-action="counter-fire" data-id="${heroId}" data-target="${targetId}" data-part="${partId||'body'}" data-round="${receipt.round}" data-stamp="${receipt.stamp}">${icon('sword',21)} ${HERO[heroId]?.name||''} phản công<span>Không tốn lượt</span></button></div>`;
}
