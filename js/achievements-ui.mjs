import {achievementStatuses} from './achievements.mjs';
import {icon} from './art.mjs';

const number=n=>new Intl.NumberFormat('vi-VN').format(n);
const reward=(value,iconName,label)=>value?`<span>${icon(iconName,13)} ${number(value)} ${label}</span>`:'';

export function achievementReward(value){
  return [reward(value.tickets,'ticket','vé'),reward(value.gold,'coin','vàng'),reward(value.shards,'gem','tinh thạch')].join('');
}

function achievementCard(a){
  const width=Math.min(100,a.progress/a.goal*100);
  return `<article class="achievement-card ${a.claimed?'is-claimed':''} ${a.ready?'is-ready':''}" style="--achievement:${a.color}">
    <div class="achievement-card-top">
      <div class="achievement-badge" data-tier="${a.tier}">${icon(a.icon,23)}<small>${a.tier}</small></div>
      <div><span class="achievement-tier">BẬC ${a.tier}</span><h3>${a.title}</h3></div>
      ${a.claimed?`<span class="achievement-check">${icon('check',15)}</span>`:''}
    </div>
    <p>${a.description}</p>
    <div class="achievement-progress">
      <div class="achievement-progress-label"><span>${number(a.progress)} / ${number(a.goal)}</span><small>${a.complete?'Đã hoàn thành':'Đang tiến tới'}</small></div>
      <div class="achievement-track" role="progressbar" aria-label="${a.title}" aria-valuemin="0" aria-valuemax="${a.goal}" aria-valuenow="${a.progress}"><i style="width:${width}%"></i></div>
    </div>
    <div class="achievement-card-foot">
      <span class="achievement-reward">${achievementReward(a.reward)}</span>
      <button class="button compact ${a.ready?'primary':'secondary'}" data-action="claim-achievement" data-id="${a.id}" aria-label="${a.claimed?'Đã nhận':a.ready?'Nhận thưởng':'Chưa hoàn thành'}: ${a.title}" ${a.ready?'':'disabled'}>${a.claimed?'Đã nhận':a.ready?'Nhận thưởng':icon('lock',13)}</button>
    </div>
  </article>`;
}

export function achievementBook(s){
  const statuses=achievementStatuses(s),ready=statuses.filter(a=>a.ready),claimed=statuses.filter(a=>a.claimed).length;
  const ordered=[...statuses].sort((a,b)=>Number(b.ready)-Number(a.ready)||Number(b.complete)-Number(a.complete)||b.progress/b.goal-a.progress/a.goal);
  return `<section class="achievement-book panel" aria-labelledby="achievement-title">
    <div class="achievement-book-heading">
      <div><span class="eyebrow">DI SẢN / HUY HIỆU</span><h2 id="achievement-title">Sổ thành tựu dài hạn</h2><p>Mỗi chuyến đi để lại một dấu ấn. Hoàn thành mục tiêu, nhận thưởng một lần và sưu tầm huy hiệu.</p></div>
      <div class="achievement-count"><strong>${claimed}<small> / ${statuses.length}</small></strong><span>đã khắc dấu</span></div>
    </div>
    <div class="achievement-stats">
      <span>${icon('tower',15)} Kỷ lục <b>${number(s.best)}</b> tầng</span>
      <span>${icon('skull',15)} Boss <b>${number(s.achievements.stats.bosses)}</b></span>
      <span>${icon('star',15)} Triệu hồi <b>${number(s.totalSummons)}</b></span>
    </div>
    ${ready.length?`<div class="achievement-ready-note">${icon('crown',16)} ${ready.length} huy hiệu đang chờ nhận thưởng</div>`:''}
    <div class="achievement-grid">${ordered.map(achievementCard).join('')}</div>
    <p class="achievement-footnote">Kỷ lục tầng, lượt triệu hồi và anh hùng đã có được tính ngay. Boss, phá giáp, đỡ đòn, phản công và đột kích bắt đầu ghi từ bản này. Phòng thử không ghi vào sổ.</p>
  </section>`;
}
