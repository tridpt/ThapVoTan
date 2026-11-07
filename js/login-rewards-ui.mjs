import * as E from './engine.mjs';
import {icon} from './art.mjs';

const fmt=n=>new Intl.NumberFormat('vi-VN').format(n);
const rewardText=reward=>[
  reward.gold?`${fmt(reward.gold)} vàng`:null,
  reward.tickets?`${reward.tickets} vé`:null,
  reward.dust?`${reward.dust} bụi rèn`:null,
  reward.shards?`${reward.shards} tinh thạch`:null
].filter(Boolean).join(' · ');

export function loginRewardCard(s,date=new Date()){
  const status=E.loginRewardStatus(s,date),current=status.day;
  const intro=status.training?'Thoát Phòng thử để nhận quà cho tài khoản.':status.capped?'Bạn đã đạt giới hạn lượt điểm danh.':status.clockSkew?'Ngày trên thiết bị đang lùi. Hãy kiểm tra ngày giờ trước khi điểm danh.':status.claimable?(status.missed?'Bạn đã bỏ lỡ ngày trước; chuỗi sẽ bắt đầu lại từ Ngày 1.':'Quà hôm nay đã sẵn sàng.'):'Đã nhận quà hôm nay. Ngày mai quay lại để tiếp tục chuỗi.';
  const lockedLabel=status.training?'Đang trong Phòng thử':status.capped?'Đã đạt giới hạn':status.clockSkew?'Chờ ngày hợp lệ':'Đã nhận hôm nay';
  const action=status.claimable?`<button class="button primary" data-action="claim-login-reward">${icon('gift',16)} Nhận quà hôm nay</button>`:`<button class="button secondary" disabled>${icon(status.claimed?'check':'info',16)} ${lockedLabel}</button>`;
  return `<section class="login-reward-card panel" aria-labelledby="login-reward-title"><div class="login-reward-head"><div><span class="eyebrow">NHẬT KÝ HÀNH TRÌNH / ĐIỂM DANH</span><h2 id="login-reward-title">Bảy ngày, bảy mốc tiếp sức</h2><p>${intro}</p></div><div class="login-streak"><strong>${fmt(status.streak)}</strong><small>ngày liên tiếp</small></div></div><div class="login-reward-days">${E.LOGIN_REWARDS.map(reward=>{const done=status.claimed||status.clockSkew?reward.day<=current:(!status.missed&&reward.day<current);const active=reward.day===current;return `<div class="login-reward-day ${active?'is-current ':''}${done?'is-done':''}" style="--day:${reward.day}" aria-label="Ngày ${reward.day}: ${rewardText(reward)}${done?' · Đã nhận':''}"><span class="login-day-number">${done?icon('check',15):reward.day}</span><b>Ngày ${reward.day}</b><small>${rewardText(reward)}</small></div>`;}).join('')}</div><p class="login-reward-rule">Mỗi ngày nhận một lần. Bỏ lỡ một ngày sẽ bắt đầu lại. Sau Ngày 7, lịch thưởng quay về Ngày 1.</p><div class="login-reward-foot"><span>${icon(status.claimable?'gift':'quest',16)} ${status.claimable?`Quà đang mở: Ngày ${status.day}/7`:`Đã nhận ${fmt(status.totalClaims)} lần`}</span>${action}</div></section>`;
}
