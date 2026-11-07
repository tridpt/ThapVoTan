import {HERO,GEAR_BASE,GEAR_SLOTS,STAT_NAMES,RESONANCE} from './data.mjs';
import {PET} from './adventure-data.mjs';
import * as E from './engine.mjs';
import {icon,elementIcon} from './art.mjs';
import {loadoutPanel} from './armory-ui.mjs';

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=key=>['crit','drain'].includes(key)?'%':'';
const gearName=ref=>ref?GEAR_BASE[ref.base].name:'Ô trống';
const petName=(s,id)=>id?`${PET[id].name} · Cấp ${s.adventure.pets[id].level}`:'Không mang linh thú';
function heroStats(s,hero){return {...E.heroStats(s,hero),...E.gearLoadout(s,hero).affixes};}
function teamStats(s,team){return team.reduce((sum,id)=>{const stats=E.heroStats(s,id);for(const key of Object.keys(sum))sum[key]+=stats[key];return sum;},{atk:0,maxHp:0,def:0});}
function statTable(before,after){
  return `<div class="gear-table-wrap"><table class="gear-comparison-table"><thead><tr><th scope="col">Chỉ số</th><th scope="col">Hiện tại</th><th scope="col">Sau khi đổi</th><th scope="col">Chênh lệch</th></tr></thead><tbody>${Object.entries(after).map(([key,n])=>{const delta=n-before[key];return `<tr><th scope="row">${STAT_NAMES[key]}</th><td>${before[key]}${unit(key)}</td><td>${n}${unit(key)}</td><td class="${delta>0?'positive':delta<0?'negative':''}">${delta>0?'+':''}${delta?delta+unit(key):'—'}</td></tr>`;}).join('')}</tbody></table></div>`;
}
function teamInfo(s,team,pet,formation){
  const resonances=E.teamResonances(team);
  return `<ol class="team-loadout-roster">${team.map((id,index)=>`<li style="--hero:${HERO[id].color}">${icon(elementIcon(HERO[id].element),16)}<span><strong>${HERO[id].name}</strong><small>${index<formation.front?'Hàng trước':'Hàng sau'} · Cấp ${s.owned[id].level}</small></span></li>`).join('')}</ol><p class="team-loadout-pet">${icon('heart',16)} ${petName(s,pet)}</p><div class="team-loadout-resonance"><strong>Cộng hưởng</strong>${resonances.length?resonances.map(id=>`<p>${RESONANCE[id].name}<small>${RESONANCE[id].desc}</small></p>`).join(''):'<p>Chưa kích hoạt cộng hưởng.</p>'}</div>`;
}
function gearRows(plan){
  return `<div class="gear-preset-preview-list">${plan.rows.map(row=>{
    const issue=row.issue==='missing'?'Món đã lưu không còn trong kho.':row.issue==='owner'?HERO[row.owner].name+' đang mặc món đã lưu.':row.issue==='locked'?'Trang bị hiện tại đã khóa.':'';
    return `<div class="gear-preset-preview-row ${row.issue?'has-issue':''}"><span>${icon(GEAR_SLOTS[row.slot].icon,17)} ${GEAR_SLOTS[row.slot].name}</span><div><strong>${esc(gearName(row.desired))}</strong><small>${row.issue?esc(issue+' Giữ '+gearName(row.current)+'.'):row.changed?row.final?'Mặc món đã lưu thay '+esc(gearName(row.current))+'.':'Tháo món hiện tại: '+esc(gearName(row.current))+'.':'Giữ nguyên'}</small></div>${icon(row.issue?'lock':row.changed?'arrow':'check',16)}</div>`;
  }).join('')}</div>`;
}
export function teamPresetDialog(s,slot,plan=E.previewTeamPreset(s,slot)){
  const after={...s,team:plan.team,formation:plan.formation,equipped:plan.equipped,adventure:{...s.adventure,equipped:plan.pet}};
  return `<div class="team-loadout-dialog gear-preset-dialog"><div class="modal-kicker">ĐỘI HÌNH / XEM TRƯỚC 0${slot+1}</div><h2>Dùng đội · ${esc(plan.name)}</h2><p class="modal-description">Đổi anh hùng, hàng trước/sau, linh thú và bộ đồ cùng lúc. Các ô không thể đổi sẽ giữ trang bị hiện tại.</p><div class="team-loadout-overview"><section><h3>ĐỘI HIỆN TẠI</h3>${teamInfo(s,s.team,s.adventure.equipped,s.formation)}</section><section class="after"><h3>ĐỘI SAU KHI ĐỔI</h3>${teamInfo(after,plan.team,plan.pet,plan.formation)}</section></div><h3 class="team-loadout-subtitle">Tổng chỉ số ngoài trận</h3>${statTable(teamStats(s,s.team),teamStats(after,plan.team))}<p class="team-loadout-note">Đã tính cấp, thức tỉnh, ấn ký, thiên phú và trang bị hiện tại. Cộng hưởng và các hiệu ứng trong trận được hiển thị riêng. Chí mạng, hút máu và hồi năng lượng trong bảng là phần cộng từ trang bị.</p>${!plan.savedGear?'<p class="gear-preset-warning">Đội từ bản cũ chưa lưu bộ đồ. Các tướng giữ trang bị hiện tại. Lưu lại đội để gắn thêm bộ đồ.</p>':''}<div class="team-loadout-heroes">${plan.heroes.map(hero=>`<section class="team-loadout-hero" style="--hero:${HERO[hero.hero].color}"><header><h3>${icon(elementIcon(HERO[hero.hero].element),19)} ${HERO[hero.hero].name}</h3><span>${s.team.includes(hero.hero)?'Đang trong đội':'Thêm vào đội'} · ${hero.changes} ô đổi</span></header>${statTable(heroStats(s,hero.hero),heroStats(after,hero.hero))}${plan.savedGear?gearRows(hero):''}<details class="team-loadout-effects"><summary>Hiệu ứng bộ đồ và trấn phái</summary><div class="team-loadout-effect-columns"><section><h4>Hiện tại</h4>${loadoutPanel(s,hero.hero)}</section><section><h4>Sau khi đổi</h4>${loadoutPanel(after,hero.hero)}</section></div></details></section>`).join('')}</div>${plan.issues.length?`<p class="gear-preset-warning" role="status">${icon('info',16)} ${plan.issues.length} ô cần giữ nguyên; ${plan.gearChanges} ô trang bị còn lại sẽ đổi như trên. Đội hình, hàng và linh thú vẫn đổi theo lựa chọn đã lưu.</p>`:''}${plan.blocked?`<p class="smart-journey-note">${esc(plan.blocked)}</p>`:''}<button class="button primary full" data-action="preset-confirm-apply" data-slot="${slot}" ${plan.blocked||!plan.changed?'disabled':''}>${plan.blocked?'Chưa thể đổi đội':!plan.changed?'Đội và trang bị đã khớp':plan.issues.length?'Đổi đội & '+plan.gearChanges+' ô khả dụng':'Xác nhận đổi đội & bộ đồ'} ${icon('check',17)}</button><button class="button secondary full" data-action="close">Để sau</button></div>`;
}
export function teamPresetManageDialog(s,slot,kind){
  if(!['save','delete'].includes(kind))throw new Error('Thao tác đội hình không hợp lệ.');
  const p=s.presets[slot];if(!p)throw new Error('Ô này chưa lưu đội hình.');
  const deleting=kind==='delete',team=deleting?p.team:s.team,pet=deleting?p.pet:s.adventure.equipped,formation=deleting?p.formation:s.formation;
  const count=deleting?0:team.reduce((n,id)=>n+Object.values(E.snapshotHeroGear(s,id)).filter(Boolean).length,0);
  return `<div class="team-loadout-dialog gear-preset-dialog"><div class="modal-kicker">ĐỘI HÌNH / ${deleting?'XÓA Ô LƯU':'LƯU LẠI ĐỘI & BỘ ĐỒ'}</div><h2>${deleting?'Xóa đội':'Ghi đè đội'} ${esc(p.name)}${deleting?' đã lưu?':'?'}</h2><p class="modal-description">${deleting?'Các anh hùng, linh thú và trang bị vẫn ở trong bộ sưu tập.':'Lưu ba anh hùng, bố trí hàng trước/sau, linh thú và cả chín ô trang bị hiện tại vào ô này. Bộ trước sẽ được thay thế.'}</p><div class="team-loadout-manage-info">${teamInfo(s,team,pet,formation)}</div>${!deleting?`<p class="gear-preset-warning">Đang lưu ${count}/9 món. Ô trống sẽ tháo món chưa khóa khi dùng lại đội. Các bộ đồ riêng của từng tướng vẫn được giữ.</p>`:''}<div class="confirm-buttons"><button class="button secondary" data-action="close">Giữ ${deleting?'lại':'đội cũ'}</button><button class="button primary" data-action="preset-confirm-${kind}" data-slot="${slot}">${deleting?'Xóa ô lưu':'Ghi đè'}</button></div></div>`;
}
