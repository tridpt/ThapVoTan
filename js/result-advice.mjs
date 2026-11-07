import {HERO} from './data.mjs';
import {icon} from './art.mjs';
import {talentStatus} from './talents.mjs';
import {expeditionForHero} from './expeditions.mjs';
import {heroUpgradePrice} from './balance.mjs';

const fmt=n=>new Intl.NumberFormat('vi-VN').format(n);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tank=h=>['shield','guard'].includes(HERO[h.id]?.kind);
const damageHero=h=>!['heal','shield','guard'].includes(HERO[h.id]?.kind);
export function resultAdvice(s){
  const r=s.run;if(r?.phase!=='result'||r.summary?.reason!=='defeat'||r.training)return [];
  const tips=[],b=r.battle,stats=b?.statistics,rows=stats?.rows,exact=stats&&!stats.partial;
  const add=(id,title,evidence,suggestion,action)=>tips.push({id,title,evidence,suggestion,action});
  const teamIds=r.heroes.map(h=>h.id),available=id=>Object.hasOwn(HERO,id)&&Object.hasOwn(s.owned,id)&&!teamIds.includes(id)&&!expeditionForHero(s,id)&&!(r.challenge?.id==='humble'&&HERO[id].rarity!=='R');
  const candidate=kind=>Object.keys(s.owned).filter(available).filter(id=>HERO[id].kind===kind).sort((a,b)=>s.owned[b].level-s.owned[a].level)[0];
  if(!r.heroes.some(h=>HERO[h.id].kind==='heal')){
    const id=candidate('heal');if(id)add('healer','Thử thêm một tướng hồi máu','Ba tướng trong trận vừa rồi không có vai trò trị liệu.',`Bạn đã sở hữu ${HERO[id].name}. Thử thay một vị trí và dùng kỹ năng khi đội mất máu.`,{name:'hero',id,label:`Xem ${HERO[id].name}`});
  }
  const front=r.formation?r.heroes.slice(0,r.formation.front):[],backTank=r.heroes.find((h,i)=>tank(h)&&i>=r.formation?.front);
  if(front.length&&!front.some(tank)&&backTank)add('formation','Đưa hộ vệ lên hàng trước',`${HERO[backTank.id].name} đang ở hàng sau; hàng trước không có hộ vệ.`, 'Thử đổi hàng để hộ vệ nhận các đòn nhắm hàng trước. Đòn xuyên hàng vẫn có thể đánh tướng phía sau.',{name:'nav',page:'heroes',label:'Sắp xếp đội hình'});
  const unused=r.heroes.map(h=>({id:h.id,...talentStatus(s,h.id)})).filter(t=>t.available>0).sort((a,b)=>b.available-a.available)[0];
  if(unused)add('talents','Dùng điểm thiên phú đang có',`${HERO[unused.id].name} hiện còn ${unused.available} điểm chưa dùng.`,`${tank({id:unused.id})?'Sinh lực tăng chống chịu':HERO[unused.id].kind==='heal'?'Khởi nhịp giúp sẵn sàng kỹ năng sớm':'Vũ lực tăng tấn công'}. Chọn nhánh phù hợp rồi bắt đầu chuyến mới.`,{name:'talent-info',id:unused.id,label:'Mở thiên phú'});
  const boss=b?.enemies?.find(e=>e.kind==='boss'),parts=b?.bossState?.parts;
  if(boss?.hp>0&&parts?.head?.hp>0&&b.round>=3)add('boss','Thử phá giáp đầu để lấy nhịp',`${boss.name} còn giáp đầu ${fmt(parts.head.hp)}/${fmt(parts.head.maxHp)} khi trận kết thúc.`, 'Trong lần đấu tới, chọn giáp đầu làm mục tiêu. Phá đầu làm boss mất thăng bằng và bỏ lượt; phá tay giảm sức đánh, phá lõi tăng sát thương trực tiếp.',{name:'boss-info',label:'Đọc cơ chế boss'});
  const attackers=r.heroes.filter(damageHero).sort((a,b)=>exact?(rows?.[b.id]?.damage||0)-(rows?.[a.id]?.damage||0):0);
  const unarmed=attackers.find(h=>h.loadout&&h.loadout.weaponRarity===null&&!s.equipped[h.id]?.weapon);
  if(unarmed)add('equipment','Bổ sung vũ khí cho tướng gây sát thương',`${HERO[unarmed.id].name} chưa mang vũ khí khi khởi hành và hiện vẫn trống ô này.`, 'Xem vũ khí trong túi và dùng Trang bị nhanh để so sánh. Trang bị thường cũng giúp tăng chỉ số; không cần tướng hiếm.',{name:'go-equipment',id:unarmed.id,slot:'weapon',label:'Xem vũ khí'});
  const totalHp=b?.enemies?.reduce((n,e)=>n+e.maxHp,0)||0,left=b?.enemies?.reduce((n,e)=>n+e.hp,0)||0;
  if(exact&&b.round>=6&&totalHp>0&&left/totalHp>=.3){
    const id=attackers.find(h=>s.owned[h.id].level<100&&s.gold>=heroUpgradePrice(s.owned[h.id].level))?.id;
    add('pressure','Tăng áp lực trong trận dài',`Trận tới vòng ${b.round}; địch còn ${Math.round(left/totalHp*100)}% tổng HP.`,id?`Bạn có đủ vàng nâng ${HERO[id].name} từ cấp ${s.owned[id].level} lên ${s.owned[id].level+1} (${fmt(heroUpgradePrice(s.owned[id].level))} vàng). Hoặc thử chúc phúc sát thương thay cho tài nguyên.`:'Thử Lưỡi kiếm thức tỉnh hoặc Tĩnh lặng trước bão; ưu tiên dồn đòn vào một địch để giảm số kẻ tấn công.',id?{name:'hero',id,label:'Xem nâng cấp'}:{name:'nav',page:'heroes',label:'Xem đội hình'});
  }
  if(!tips.length)add('practice','Thử lại chiến thuật trước khi leo tiếp',exact?`Trận vừa rồi kết thúc ở vòng ${b.round}.`:'Trận này chưa có đầy đủ thống kê đóng góp.', 'Vào phòng thử miễn phí để so sánh đội hình, thời điểm hồi máu và cách phá giáp boss.',{name:'nav',page:'training',label:'Vào phòng thử'});
  return tips.slice(0,3);
}
export function resultAdvicePanel(s){
  const tips=resultAdvice(s);if(!tips.length)return '';
  return `<section class="result-advice panel" aria-labelledby="result-advice-title"><header><span class="eyebrow">CHUẨN BỊ LẦN TỚI</span><h2 id="result-advice-title">Một cách khác để tiến xa</h2><p>Gợi ý từ trận cuối và những gì bạn đang có.</p></header><ol>${tips.map((t,i)=>`<li data-advice="${t.id}"><span class="result-advice-number">${i+1}</span><div><h3>${esc(t.title)}</h3><p class="result-advice-evidence">${esc(t.evidence)}</p><p>${esc(t.suggestion)}</p><button class="button secondary" data-action="${t.action.name}" ${t.action.id?`data-id="${t.action.id}"`:''} ${t.action.page?`data-page="${t.action.page}"`:''} ${t.action.slot?`data-slot="${t.action.slot}"`:''}>${esc(t.action.label)} ${icon('arrow',16)}</button></div></li>`).join('')}</ol><p class="result-advice-note">Trang bị, cấp và thiên phú mới áp dụng khi bắt đầu chuyến đi tiếp theo.</p></section>`;
}
