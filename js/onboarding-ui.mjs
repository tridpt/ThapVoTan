import {HERO,RARITY} from './data.mjs';
import {icon,heroArt} from './art.mjs';
import {rarityStyle,ultimatePreviewButton} from './rarity-ui.mjs';
import {TUTORIAL_STEPS,NOVICE_MISSIONS,NOVICE_SSR,tutorialStep,noviceMissionStatus,noviceSsrReady,noviceReady} from './onboarding.mjs';

const fmt=n=>n.toLocaleString('vi-VN');
const select=(action,extra='')=>`[data-action="${action}"]${extra}:not([disabled])`;
export function tutorialDialogKind(html){return html.includes('data-action="assign"')?'team':html.includes('data-action="equip-gear"')?'gear':html.includes('data-action="unequip-gear"')?'gear-equipped':html.includes('data-action="confirm-end"')?'end':'other';}
export function tutorialCue(s,{page='home',modal=false,dialog='other',selectedHero=null}={}){
  const step=tutorialStep(s);if(!step||s.run?.mode==='training')return null;
  const destinations={summon:'summon',team:'heroes',gear:'forge',depart:'home',route:'tower',target:'tower',attack:'tower',end:'tower',skill:'tower'};
  const cue={step,page:destinations[step],title:({summon:'Gọi đồng đội đầu tiên',team:'Xếp đội hình ba người',gear:'Mặc trang bị trước chuyến đi',depart:'Bước vào Tháp Vô Tận',route:'Chọn một lối chiến đấu',target:'Chạm kẻ địch để chọn mục tiêu',attack:'Đánh thường để tích năng lượng',end:'Cả đội hành động, rồi hết lượt',skill:'Đủ 100 năng lượng: dùng kỹ năng'})[step],text:'',selectors:[]};
  if(modal){
    if(step==='team'&&dialog==='team'){cue.text=s.run&&s.run.phase!=='result'?'Đội hình đã chốt trong chuyến đi. Đóng cửa sổ, tiếp tục hoặc trở về sảnh trước khi xếp đội.':'Chạm một vị trí để xếp anh hùng vào đội. Chọn tướng đang ở vị trí khác sẽ đổi chỗ.';cue.selectors=[select(s.run&&s.run.phase!=='result'?'close':'assign')];return cue;}
    if(step==='gear'&&dialog==='gear'){cue.text='Chạm Trang bị để mặc món này. Chỉ số sẽ áp dụng từ chuyến đi mới.';cue.selectors=[select('equip-gear')];return cue;}
    if(step==='gear'&&dialog==='gear-equipped'){cue.text='Món này đang mặc sẵn. Chạm Tháo trang bị, rồi mặc lại để thực hành bước này; cả hai thao tác đều miễn phí.';cue.selectors=[select('unequip-gear')];return cue;}
    if(step==='end'&&dialog==='end'){cue.text='Bạn có thể đóng để cho các tướng còn lại hành động, hoặc xác nhận nhường lượt cho địch.';cue.selectors=[select('close'),select('confirm-end')];return cue;}
    cue.text='Đóng cửa sổ này để tiếp tục bước hướng dẫn đang lưu.';cue.selectors=[select('close')];return cue;
  }
  if(step==='summon'){cue.text=s.tickets?'Dùng 1 vé triệu hồi. Kết quả được lưu trước hoạt cảnh; tướng trùng vẫn có ích để thức tỉnh.':'Bạn cần 1 vé. Có thể nhận vé ở Nhiệm vụ, hoặc bỏ qua hướng dẫn để chơi và kiếm thêm.';cue.selectors=[select('summon','[data-count="1"]')];}
  if(step==='team'){
    const active=s.run&&s.run.phase!=='result';cue.text=active?'Đội hình đã chốt trong chuyến đi. Hoàn thành hoặc trở về sảnh trước khi xếp đội; hướng dẫn sẽ giữ bước này.':'Chạm một anh hùng đã có, rồi chọn vị trí trong mục Xếp vào đội hình. Hộ vệ, sát thương và trị liệu là khởi đầu dễ chơi.';
    cue.selectors=[select('hero',`[data-id="${s.team[0]}"]`)];
    if(active){cue.page='tower';cue.selectors=[select('retreat')];}
  }
  if(step==='gear'){cue.text=s.inventory.length?'Chọn một món trong kho rồi chạm Trang bị. Ba món khởi đầu có thể mặc ngay, không tốn vàng.':'Kho đang trống. Kiếm đồ từ kho báu hoặc boss rồi quay lại; có thể bỏ qua hướng dẫn để tiếp tục chơi.';cue.selectors=[select('gear')];}
  const r=s.run,combatSteps=['route','target','attack','end','skill'];
  if(step==='depart'||combatSteps.includes(step)){
    if(!r||r.phase==='result'){
      cue.page='home';cue.text='Chạm vào cổng tháp để bắt đầu một chuyến Tháp thường. Đội hình và trang bị được chốt lúc khởi hành.';cue.selectors=[select('start')];return cue;
    }
    if(r.mode!=='normal'){
      cue.page='tower';cue.text='Hướng dẫn chiến đấu dùng Tháp thường. Bạn có thể hoàn thành chuyến hiện tại rồi quay lại; bước học vẫn được giữ.';cue.selectors=[select('run-info')];return cue;
    }
    cue.page='tower';
    if(r.victory&&r.victory.stage!=='done'){
      cue.text='Đã thắng! Mở rương và xem chiến lợi phẩm để tiếp tục. Hướng dẫn giữ nguyên khi chuyển sang trận sau.';cue.selectors=[select('victory-next'),select('victory-skip')];return cue;
    }
    if(r.phase==='route'){
      const index=Math.max(0,r.routes.findIndex(v=>v==='battle'));
      cue.routeIndex=index;cue.text='Chọn lối Chiến đấu để học ra đòn. Với bản đồ 3D, chạm đảo để xem rồi bấm Đi đến tầng.';cue.selectors=[select('route',`[data-index="${index}"]`),'.tower-map-node.map-available'];return cue;
    }
    if(r.phase==='blessing'||r.phase==='relic'||r.phase==='event'){
      cue.text='Chọn chúc phúc, cổ vật hoặc quyết định sự kiện để tiếp tục hành trình. Bước chiến đấu sẽ nối lại ở trận tiếp theo.';cue.selectors=[select(r.phase==='blessing'?'blessing':r.phase==='relic'?'choose-relic':'event')];return cue;
    }
    if(r.phase==='battle'){
      const usable=r.heroes.filter(h=>h.hp>0&&!r.battle.used.includes(h.id)),current=usable.find(h=>h.id===selectedHero),ready=usable.find(h=>h.energy>=100);
      if(step==='route'||step==='depart'){cue.text='Bạn đã ở trong trận. Chọn kẻ địch; hướng dẫn sẽ nối sang thao tác chiến đấu.';cue.selectors=[select('target')];return cue;}
      if(step==='target'){cue.text='Chạm một kẻ địch còn sống. Khung sáng cho biết mục tiêu của đòn đánh kế tiếp.';cue.selectors=[select('target')];return cue;}
      if(!usable.length){cue.text='Các tướng đã hành động. Kết thúc lượt để địch ra chiêu, sau đó cả đội có lượt mới.';cue.selectors=[select('end-turn')];return cue;}
      if(step==='end'){cue.text='Mỗi tướng hành động một lần mỗi lượt. Cho các đồng đội còn lại đánh trước khi kết thúc lượt.';cue.selectors=current?[select('attack')]:[select('actor',`[data-id="${usable[0].id}"]`)];return cue;}
      if(step==='skill'&&ready){cue.text=`${HERO[ready.id].name} đã đủ 100 năng lượng. Chọn tướng này rồi bấm Kỹ năng để thi triển chiêu.`;cue.selectors=current?.energy>=100?[select('skill')]:[select('actor',`[data-id="${ready.id}"]`)];return cue;}
      cue.text=step==='skill'?'Đánh thường để nạp đủ 100 năng lượng. Nếu tướng đã hành động, dùng đồng đội rồi kết thúc lượt.':'Chọn một tướng còn lượt rồi bấm Đánh thường. Đòn đánh thường tạo năng lượng cho kỹ năng.';
      cue.selectors=current?[select('attack')]:[select('actor',`[data-id="${usable[0].id}"]`)];return cue;
    }
  }
  return cue;
}

export function tutorialCoach(s,context={}){
  const cue=tutorialCue(s,context);if(!cue)return '';
  const n=s.onboarding.completed.length+1;
  return `<aside class="tutorial-coach" aria-label="Hướng dẫn tân thủ"><div class="tutorial-step-number">${n}<small>/${TUTORIAL_STEPS.length}</small></div><div class="tutorial-copy"><span>HỌC NGAY KHI CHƠI · TỰ ĐỘNG LƯU</span><strong>${cue.title}</strong><p id="tutorial-instruction${context.modal?'-modal':''}">${cue.text}</p></div><div class="tutorial-controls"><button class="button primary" data-action="tutorial-go">${context.modal||context.page===cue.page?'Chỉ nút cần chạm':'Đi tới bước này'} ${icon('arrow',15)}</button><button class="text-button" data-action="tutorial-skip">Bỏ qua hướng dẫn</button></div></aside>`;
}

export function mountTutorialHighlight(s,context,doc,scroll=false){
  for(const el of doc.querySelectorAll('.tutorial-highlight')){el.classList.remove('tutorial-highlight');el.removeAttribute('aria-describedby');el.querySelector('.tutorial-pointer')?.remove();}
  const cue=tutorialCue(s,context);if(!cue||!context.modal&&context.page!==cue.page)return false;
  const root=context.modal?doc.querySelector('.modal')||doc:doc;
  const target=cue.selectors.map(selector=>root.querySelector(selector)).find(Boolean);if(!target)return false;
  target.classList.add('tutorial-highlight');target.setAttribute('aria-describedby',context.modal?'tutorial-instruction-modal':'tutorial-instruction');
  const pointer=doc.createElement('span');pointer.className='tutorial-pointer';pointer.textContent='CHẠM';pointer.setAttribute('aria-hidden','true');target.append(pointer);
  if(scroll){target.scrollIntoView?.({block:'center',behavior:'instant'});target.focus?.({preventScroll:true});}return true;
}

export function noviceHomeCard(s){
  if(s.onboarding.ssr&&s.onboarding.status==='done')return '';
  const ready=noviceReady(s),active=s.onboarding.status==='active',done=s.onboarding.status==='done';
  return `<section class="novice-home panel ${ready?'ready':''}"><span class="novice-emblem">${icon('star',30)}</span><div><span class="eyebrow">HÀNH TRÌNH TÂN THỦ · ${s.onboarding.claimed.length}/${NOVICE_MISSIONS.length}</span><h2>Mười tầng. Một lời hẹn SSR.</h2><p>${done?'Bạn đã nắm cách chơi. Tiếp tục các mục tiêu đầu tiên để chọn đồng đội SSR.':'Học từng thao tác, kiếm vé từ năm mục tiêu và chọn một SSR sau tầng 10.'}</p></div><div><button class="button ${ready?'primary':'secondary'}" data-action="novice-open">${ready?'Có quà đang chờ':'Xem mục tiêu'}</button>${!done?`<button class="text-button" data-action="${active?'tutorial-go':'tutorial-begin'}">${active?'Tiếp tục hướng dẫn':s.onboarding.status==='skipped'?'Học tiếp bước đang dở':'Bắt đầu hướng dẫn'}</button>`:''}</div></section>`;
}

export function novicePanel(s){
  return `<section class="novice-panel panel"><div class="novice-heading"><div><div class="eyebrow">HÀNH TRÌNH TÂN THỦ · QUÀ NHẬN MỘT LẦN</div><h2>Mười tầng khởi đầu</h2><p>15 vé, 1.500 vàng và 1 SSR tự chọn qua năm mục tiêu. Bỏ qua hướng dẫn vẫn làm nhiệm vụ bình thường.</p></div><span>SSR</span></div><div class="novice-missions">${NOVICE_MISSIONS.map((q,index)=>{const status=noviceMissionStatus(s,q.id);return `<article class="novice-mission ${status.claimed?'claimed':status.ready?'ready':''}"><span class="novice-mission-number">${status.claimed?icon('check',18):String(index+1).padStart(2,'0')}</span><div><strong>${q.name}</strong><p>${q.desc}</p><div class="quest-track"><i style="width:${status.progress/q.goal*100}%"></i></div><small>${status.progress}/${q.goal} · ${q.tickets} vé · ${fmt(q.gold)} vàng${q.id==='floor10'?' · Mở chọn SSR':''}</small></div><button class="button compact ${status.ready?'primary':'secondary'}" data-action="novice-claim" data-id="${q.id}" ${status.ready?'':'disabled'}>${status.claimed?'Đã nhận':!status.unlocked?icon('lock',16):status.ready?'Nhận':'Đang làm'}</button></article>`;}).join('')}</div><div class="novice-ssr-prize">${icon('crown',29)}<div><strong>${s.onboarding.ssr?`Đã chọn ${HERO[s.onboarding.ssr].name}`:'Astra · Nyx · Kael — bạn chọn ai?'}</strong><p>${s.onboarding.ssr?'Quà SSR đã được lưu. Không nhận lại khi tải lại hoặc ôn hướng dẫn.':'Nhận đủ năm mục tiêu để mở một SSR. Tướng đã có sẽ thành bản trùng kèm thưởng theo bậc.'}</p></div><button class="button ${noviceSsrReady(s)?'primary':'secondary'}" data-action="novice-ssr-open" ${noviceSsrReady(s)?'':'disabled'}>${s.onboarding.ssr?'Đã nhận SSR':'Chọn SSR'}</button></div><div class="novice-guide-entry"><span>${s.onboarding.status==='done'?'Đã hoàn thành hướng dẫn 9 bước':`Hướng dẫn: ${s.onboarding.completed.length}/${TUTORIAL_STEPS.length} bước`}</span>${s.onboarding.status!=='done'?`<button class="text-button" data-action="${s.onboarding.status==='active'?'tutorial-go':'tutorial-begin'}">${s.onboarding.status==='active'?'Tiếp tục':'Bắt đầu / học tiếp'} ${icon('arrow',15)}</button>`:''}</div></section>`;
}

export function noviceSsrPicker(s){
  return `<div class="modal-kicker">QUÀ TÂN THỦ / SSR TỰ CHỌN</div><h2>Chọn một người đồng hành.</h2><p class="modal-description">Chạm để xem mô hình, kỹ năng và xác nhận. Chỉ chọn một lần; quà được lưu ngay khi nhận.</p><div class="novice-ssr-roster">${NOVICE_SSR.map(id=>{const h=HERO[id];return `<button class="summon-choice tier-SSR" style="${rarityStyle('SSR')}" data-action="novice-ssr-detail" data-id="${id}"><div>${heroArt(h)}</div><span class="rarity-label SSR">SSR</span><strong>${h.name}</strong><small>${h.role}</small><em>${s.owned[id]?'Đã có · Nhận bản trùng':'ANH HÙNG MỚI'}</em></button>`;}).join('')}</div>`;
}
export function noviceSsrDetail(s,id){
  const h=HERO[id],owned=!!s.owned[id];return `<div class="hero-detail novice-ssr-detail tier-SSR" style="--hero:${h.color};${rarityStyle('SSR')}"><div class="modal-kicker">XÁC NHẬN QUÀ SSR · MỘT LẦN DUY NHẤT</div><div class="detail-art">${heroArt(h)}</div><span class="rarity-label SSR">SSR · ${RARITY.SSR.name}</span><h2>${h.name}</h2><p class="detail-subtitle">${h.title} · ${h.role}</p><div class="skill-detail">${icon('star',24)}<div><strong>${h.skill}</strong><p>${h.desc}</p></div></div>${ultimatePreviewButton(h)}<div class="summon-contract"><strong>${owned?'Bạn đã sở hữu tướng này':'Mở một anh hùng mới'}</strong><p>${owned?`Nhận +1 bản trùng ${h.name}, +12 tinh thạch và +180 vàng. Giữ nguyên cấp, thức tỉnh và thiên phú hiện có.`:`Nhận ${h.name} cấp 1, chưa thức tỉnh. Bạn có thể xếp vào đội từ chuyến đi tiếp theo.`}</p><small>Chỉ nhận một trong ba SSR. Vé, pity và bảo đảm mục tiêu không thay đổi.</small></div><button class="button primary full" data-action="novice-ssr-confirm" data-id="${id}" ${noviceSsrReady(s)?'':'disabled'}>Xác nhận chọn ${h.name}</button><button class="text-button full" data-action="novice-ssr-open">Xem lại ba lựa chọn</button></div>`;
}
