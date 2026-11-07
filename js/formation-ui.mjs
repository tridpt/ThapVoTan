import {HERO} from './data.mjs';
import {icon,heroArt} from './art.mjs';
import {formationBlocker,heroRow,coverMultiplier,formationTarget,enemyPierces} from './formation.mjs';

export function formationPanel(s){
  const locked=formationBlocker(s),front=s.formation.front;
  return `<section class="formation-editor panel"><div class="formation-heading"><div><span class="eyebrow">ĐỘI HÌNH CHIẾN THUẬT</span><h2>Ai sẽ giữ tuyến đầu?</h2></div>${icon('shield',27)}</div><div class="formation-choices" role="group" aria-label="Bố trí hàng trước và hàng sau">${[1,2].map(n=>`<button data-action="formation-layout" data-front="${n}" aria-pressed="${front===n}" class="${front===n?'active':''}" ${locked?'disabled':''}><strong>${n} trước · ${3-n} sau</strong><span>${n===1?'Một tướng giữ tuyến':'Chia sẻ áp lực tuyến đầu'}</span></button>`).join('')}</div><div class="formation-board"><div class="formation-direction">${icon('sword',14)} HƯỚNG KẺ ĐỊCH</div>${['front','back'].map(row=>`<div class="formation-line ${row}"><span>${row==='front'?'HÀNG TRƯỚC':'HÀNG SAU'}</span><div>${s.team.map((id,i)=>{if((i<front?'front':'back')!==row)return '';const h=HERO[id],other=row==='front'?front:0;return `<article class="formation-member" style="--hero:${h.color}"><button data-action="hero" data-id="${id}"><div>${heroArt(h)}</div><strong>${h.name}</strong><small>${h.role}</small></button><button class="formation-swap" data-action="formation-swap" data-first="${i}" data-second="${other}" aria-label="Đổi hàng ${h.name} với ${HERO[s.team[other]].name}" ${locked?'disabled':''}>${icon('arrow',12)} Đổi với ${HERO[s.team[other]].name}</button></article>`;}).join('')}</div></div>`).join('')}</div><p class="formation-rules">Đòn đơn thường ưu tiên hàng trước. Hàng sau giảm 15% sát thương khi còn người phía trước. Đòn xuyên hàng ưu tiên hàng sau và bỏ qua che chắn. Không tăng sát thương của đội.</p>${locked?`<p class="formation-locked">${icon('lock',14)} ${locked} Bố trí đã chốt được giữ trong chuyến.</p>`:'<p class="formation-hint">Chạm Đổi với để đổi hàng hai tướng, hoặc mở chi tiết tướng để xếp vào một vị trí cụ thể. Bố trí áp dụng từ chuyến mới.</p>'}</section>`;
}
export function formationBattleStatus(run){
  if(!run.formation)return '<div class="formation-status legacy">Chuyến cũ · Giữ luật vị trí cũ đến hết chuyến.</div>';
  return `<div class="formation-status"><span>${icon('heroes',15)} ${run.formation.front} trước · ${3-run.formation.front} sau</span><span>${run.heroes.some(h=>h.hp>0&&heroRow(run,h.id)==='front')?'Hàng sau được che chắn −15%':'Tuyến trước đã gục · Mất che chắn'}</span></div>`;
}
export function formationBadge(run,hero){
  const row=heroRow(run,hero.id);return row?`<span class="formation-badge ${row}">${row==='front'?'TRƯỚC':'SAU'}${hero.hp>0&&coverMultiplier(run,hero)<1?' · −15%':''}</span>`:'';
}
export function enemyFormationIntent(run,enemy){
  const target=formationTarget(run,enemy);return `${enemyPierces(run,enemy)?'Xuyên hàng':'Đánh đơn'} → ${target?HERO[target.id].name:'—'}`;
}
