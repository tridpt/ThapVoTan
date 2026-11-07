import {HERO,RARITY,GEAR_BASE,STAT_NAMES} from './data.mjs';
import * as E from './engine.mjs';
import {icon} from './art.mjs';

const fmt=n=>new Intl.NumberFormat('vi-VN').format(n);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=k=>['crit','drain'].includes(k)?'%':k==='energy'?' NL':'';
const display=(k,n)=>`${fmt(n)}${unit(k)}`;
const valueAtLevel=(g,k,v)=>Math.round(v*(1+g.level*(['crit','drain','energy'].includes(k)?.04:.12)));
const values=g=>({...E.gearStats(g),...E.gearTraits(g)});
const attrs=(id,line,token)=>`data-id="${esc(id)}" data-line="${line}" data-token="${token}"`;
function table(before,after){
  return `<div class="gear-table-wrap"><table class="gear-comparison-table"><thead><tr><th scope="col">Chỉ số</th><th scope="col">Giữ cũ</th><th scope="col">Nhận mới</th><th scope="col">Chênh lệch</th></tr></thead><tbody>${Object.keys(STAT_NAMES).map(k=>{const diff=after[k]-before[k];return `<tr><th scope="row">${esc(STAT_NAMES[k])}</th><td>${display(k,before[k])}</td><td>${display(k,after[k])}</td><td class="${diff>0?'positive':diff<0?'negative':''}">${diff?`${diff>0?'+':''}${display(k,diff)}`:'—'}</td></tr>`;}).join('')}</tbody></table></div>`;
}
export function refiningResume(s){
  const p=s.refining.pending;if(!p)return '';
  const g=s.inventory.find(g=>g.id===p.id);if(!g)return '';
  return `<div class="refining-resume" role="status">${icon('forge',23)}<div><strong>Kết quả tẩy luyện đang chờ</strong><span>${esc(GEAR_BASE[g.base].name)} · ${esc(STAT_NAMES[p.stat])} · Đã trả phí</span></div><button class="button secondary" data-action="refine-open" data-id="${esc(p.id)}">Chọn kết quả ${icon('arrow',15)}</button></div>`;
}
export function refiningEntry(s,g){
  const p=s.refining.pending,same=p?.id===g.id,locked=E.gearLocked(s,g.id);
  return `<section class="refining-entry"><div class="eyebrow">TẨY LUYỆN TRANG BỊ</div><h3>${icon('forge',20)} Rèn lại một dòng phụ</h3><p>Giữ loại chỉ số, quay lại giá trị bằng vàng và bụi rèn. So sánh rồi chọn giữ cũ hoặc nhận mới.</p><button class="button secondary full" data-action="refine-open" data-id="${esc(same?g.id:p?.id||g.id)}" ${locked&&!same&&!p?'disabled':''}>${same?'Chọn kết quả đã lưu':p?'Chọn xong lượt đang chờ':locked?'Mở khóa để tẩy luyện':'Tẩy luyện · '+g.affixes.length+' dòng có thể chọn'} ${icon(same?'check':'forge',17)}</button></section>`;
}
export function refiningDialog(s,id,line=0,token=0){
  const g=s.inventory.find(g=>g.id===id);if(!g)throw new Error('Trang bị này không còn trong kho.');
  const p=s.refining.pending?.id===id?s.refining.pending:null;if(p)line=p.line;
  const plan=E.previewGearRefining(s,id,line),stat=plan.stat,range=plan.range,cost=plan.cost;
  const heading=`<div class="refining-dialog" style="--refine:${RARITY[g.rarity].color}"><div class="modal-kicker">XƯỞNG RÈN / TẨY LUYỆN</div><div class="refining-title"><span class="refining-sigil">${icon('forge',32)}</span><div><h2>${esc(GEAR_BASE[g.base].name)}</h2><p>${g.rarity} · +${g.level} · Phẩm chất ${g.quality}%${plan.owner?' · '+esc(HERO[plan.owner].name)+' đang mặc':''}</p></div></div>`;
  const note='<p class="upgrade-note">Giữ nguyên bậc, cấp, phẩm chất, bộ đồ, trấn phái và người mặc. Chỉ số mới áp dụng từ chuyến đi tiếp theo.</p>';
  if(p){
    const next=structuredClone(g);next.affixes[line].value=p.newValue;
    const diff=p.newValue-p.oldValue,afterState=structuredClone(s);afterState.inventory[afterState.inventory.findIndex(a=>a.id===id)]=next;
    const owner=plan.owner,ownerTable=owner?`<details class="refining-owner"><summary>${esc(HERO[owner].name)} · Chỉ số ngoài trận trước/sau</summary>${table({...E.heroStats(s,owner),...E.gearLoadout(s,owner).affixes},{...E.heroStats(afterState,owner),...E.gearLoadout(afterState,owner).affixes})}<p class="upgrade-note">Phần cộng từ đồ tối đa 30% chí mạng, 20% hút máu và +25 năng lượng mỗi đòn thường.</p></details>`:'';
    return `${heading}<div class="refining-paid" role="status">${icon('check',17)} Đã trả ${fmt(cost.gold)} vàng + ${cost.dust} bụi rèn · Lượt ${fmt(p.roll)}</div><p class="refining-stat">Dòng ${line+1} · ${esc(STAT_NAMES[stat])}</p><div class="refining-results"><div><span>GIỮ CŨ</span><strong>${display(stat,p.oldValue)}</strong><small>Ở +${g.level}: +${display(stat,valueAtLevel(g,stat,p.oldValue))}</small></div><div class="refining-new ${diff<0?'is-lower':''}"><span>KẾT QUẢ MỚI</span><strong>${display(stat,p.newValue)}</strong><small>Ở +${g.level}: +${display(stat,valueAtLevel(g,stat,p.newValue))}</small><b>${diff>0?'Tăng +'+display(stat,diff):diff<0?'Giảm '+display(stat,diff):'Giá trị không đổi'}</b></div></div><details open><summary>Chỉ số trang bị ở +${g.level}</summary>${table(values(g),values(next))}</details>${ownerTable}${plan.locked?'<p class="refining-warning">Món này đang khóa. Bạn có thể giữ cũ hoặc mở lại chi tiết món đồ để mở khóa trước khi nhận mới.</p>':''}<div class="refining-decisions"><button class="button secondary" data-action="refine-keep" ${attrs(id,line,token)}>Giữ cũ</button><button class="button primary" data-action="refine-accept" ${attrs(id,line,token)} ${plan.locked?'disabled':''}>Nhận mới ${icon('check',16)}</button></div><p class="refining-help">Cả hai lựa chọn đều kết thúc lượt đã trả phí, không hoàn nguyên liệu. Kết quả đã lưu: đóng bảng hoặc mở lại game vẫn chọn tiếp được.</p><button class="text-button full" data-action="gear" data-id="${esc(id)}">${plan.locked?'Về món đồ để mở khóa':'Về chi tiết món đồ'}</button>${note}</div>`;
  }
  const canRoll=!plan.blocked&&plan.affordable;
  return `${heading}<p class="modal-description">Chọn một dòng phụ để quay lại giá trị. Loại chỉ số và các dòng khác giữ nguyên.</p><div class="refining-lines" aria-label="Chọn dòng phụ">${g.affixes.map((a,i)=>`<button class="${line===i?'is-selected':''}" data-action="refine-line" ${attrs(id,i,token)} aria-pressed="${line===i}"><span>DÒNG ${i+1}<strong>${esc(STAT_NAMES[a.stat])}</strong></span><b>+${display(a.stat,a.value)}</b></button>`).join('')}</div><div class="refining-range"><span>KHOẢNG CÓ THỂ NHẬN · ${esc(STAT_NAMES[stat])}</span><strong>${display(stat,range.min)} → ${display(stat,range.max)}</strong><small>Ở cấp +${g.level}: +${display(stat,valueAtLevel(g,stat,range.min))} → +${display(stat,valueAtLevel(g,stat,range.max))}</small></div><p class="refining-help">Các giá trị trong khoảng có cơ hội bằng nhau. Kết quả có thể thấp hơn hoặc bằng hiện tại; sau khi quay bạn được chọn giữ cũ hoặc nhận mới.</p><div class="refining-cost"><span class="${s.gold>=cost.gold?'enough':''}">${icon('coin',17)} ${fmt(cost.gold)} vàng <small>Có ${fmt(s.gold)}</small></span><span class="${s.dust>=cost.dust?'enough':''}">${icon('forge',17)} ${cost.dust} bụi rèn <small>Có ${fmt(s.dust)}</small></span></div>${plan.blocked?`<p class="refining-warning">${esc(plan.blocked)}</p>`:!plan.affordable?'<p class="refining-warning">Chưa đủ nguyên liệu. Săn boss và phân rã đồ thừa để nhận thêm bụi rèn.</p>':''}${s.refining.pending?`<button class="button secondary full" data-action="refine-open" data-id="${esc(s.refining.pending.id)}">Về kết quả đang chờ</button>`:''}<button class="button primary full" data-action="refine-roll" ${attrs(id,line,token)} ${canRoll?'':'disabled'}>Trả phí & tẩy luyện ${icon('forge',18)}</button><p class="refining-help">Chỉ khi bấm quay mới trừ phí. Chưa chọn xong kết quả thì chưa thể quay lượt khác.</p>${note}</div>`;
}
