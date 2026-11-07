import {HERO} from './data.mjs';
import {icon} from './art.mjs';
import {bossParts,bossPartName,BOSS_PART_IDS,BOSS_PARTS} from './boss-parts.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const target=(r,id)=>r.battle.enemies.find(e=>e.id===id&&e.hp>0)||r.battle.enemies.find(e=>e.hp>0);
export function battleQuickTeam(r,selected,auto=false){
  return `<div class="battle-quick-team" role="group" aria-label="Chọn anh hùng hành động">${r.heroes.map(h=>{
    const used=r.battle.used.includes(h.id),down=h.hp<=0,ready=h.energy>=100&&!used&&!down;
    return `<button type="button" class="quick-hero ${selected===h.id?'selected':''} ${ready?'skill-ready':''}" data-action="actor" data-id="${h.id}" aria-pressed="${selected===h.id}" aria-label="Chọn ${HERO[h.id].name}, ${down?'đã gục':used?'đã hành động':`${h.energy}/100 năng lượng`}" ${down||used||auto?'disabled':''}><span>${HERO[h.id].name}${selected===h.id?icon('check',12):ready?icon('star',12):''}</span><small>${down?'Đã gục':used?'Đã đánh':ready?'Kỹ năng sẵn sàng':h.energy+'/100 năng lượng'}</small></button>`;
  }).join('')}</div>`;
}
export function battleTargetControl(r,id,auto=false){
  const e=target(r,id),p=e?.kind==='boss'?bossParts(r):null;
  return `<button type="button" class="battle-target-control" data-action="target-picker" aria-label="Chọn địch hoặc bộ phận boss" aria-haspopup="dialog" ${auto||!e?'disabled':''}>${icon('target',18)}<span><small>MỤC TIÊU${p?' · '+BOSS_PARTS[p.selected].label:''}</small><strong>${esc(e?.name||'Không còn địch')}</strong></span>${icon('chevron',16)}</button>`;
}
export function battleTargetDialog(r,id){
  const chosen=target(r,id),p=bossParts(r),boss=r.battle.enemies[0];
  return `<section class="battle-target-dialog"><div class="modal-kicker">CHIẾN THUẬT / CHỌN MỤC TIÊU</div><h2>Nhắm đòn kế tiếp</h2><p class="modal-description">Chọn địch hoặc vùng giáp. Chọn mục tiêu không tiêu hao lượt hay năng lượng.</p><div class="touch-target-list" role="group" aria-label="Địch còn sống">${r.battle.enemies.filter(e=>e.hp>0).map(e=>`<button type="button" class="touch-target ${e.id===chosen?.id?'selected':''}" data-action="touch-target" data-id="${e.id}" aria-pressed="${e.id===chosen?.id}"><span>${icon(e.kind==='boss'?'crown':'sword',19)}<strong>${esc(e.name)}</strong>${e.id===chosen?.id?icon('check',17):''}</span><small>${Math.ceil(e.hp)} / ${e.maxHp} HP${e.shield?' · '+e.shield+' khiên':''}</small><i class="touch-target-health" aria-hidden="true"><i style="width:${e.hp/e.maxHp*100}%"></i></i></button>`).join('')}</div>${p&&boss?.hp>0?`<h3>Giáp của ${esc(boss.name)}</h3><div class="touch-part-list" role="group" aria-label="Chọn bộ phận boss">${BOSS_PART_IDS.map(part=>`<button type="button" class="touch-part ${p.selected===part&&chosen?.kind==='boss'?'selected':''}" data-action="touch-part" data-part="${part}" aria-pressed="${p.selected===part&&chosen?.kind==='boss'}"><span>${icon(BOSS_PARTS[part].icon,19)}<strong>${bossPartName(r.battle.bossState.id,part)}</strong></span><small>${p[part].hp===0?'Đã phá':p[part].hp+' / '+p[part].maxHp+' độ bền'}</small><em>${BOSS_PARTS[part].effect}</em></button>`).join('')}</div>`:''}</section>`;
}
