import {resolveSkin} from './skins.mjs';
import {HERO,RARITY} from './data.mjs';

export const HERO_ULTIMATES=Object.freeze({
  rook:Object.freeze({theme:'bastion',tag:'THÀNH LŨY BẤT KHUẤT',color:'#c5ac79',accent:'#f5e0ab',duration:2450}),
  aerin:Object.freeze({theme:'arrowstorm',tag:'MŨI TÊN XUYÊN BẦU TRỜI',color:'#83bda4',accent:'#d2f3d8',duration:2550}),
  lumi:Object.freeze({theme:'daybreak',tag:'ÁNH SÁNG TRỞ VỀ',color:'#9bcbd0',accent:'#fff0be',duration:2550}),
  ember:Object.freeze({theme:'phoenix',tag:'PHƯỢNG HOÀNG THỨC GIẤC',color:'#df9074',accent:'#ffe1a0',duration:2650}),
  kira:Object.freeze({theme:'shadowcross',tag:'MỘT NHÁT CHÉM TRONG ĐÊM',color:'#b49fcf',accent:'#e5d9ff',duration:2400}),
  bryn:Object.freeze({theme:'iceprison',tag:'KHI MÙA ĐÔNG KHÉP LẠI',color:'#99c6e1',accent:'#e4faff',duration:2600}),
  raiden:Object.freeze({theme:'thundercut',tag:'SẤM CHỚP TRÊN LƯỠI KIẾM',color:'#b4a5df',accent:'#f2dcff',duration:2500}),
  seraph:Object.freeze({theme:'sacredhymn',tag:'LỜI CA ĐÁNH THỨC HY VỌNG',color:'#e0c994',accent:'#fff4d4',duration:2700}),
  thorne:Object.freeze({theme:'ancientroots',tag:'RỪNG GIÀ ĐỨNG DẬY',color:'#8ca990',accent:'#d1efb7',duration:2750}),
  astra:Object.freeze({theme:'starfall',tag:'NGÀN SAO CÙNG RƠI XUỐNG',color:'#e3c58a',accent:'#e1dcff',duration:2850}),
  nyx:Object.freeze({theme:'darkcrown',tag:'BÓNG TỐI NUỐT MẶT TRỜI',color:'#b7a1d9',accent:'#f0c0e8',duration:2700}),
  kael:Object.freeze({theme:'blazingblade',tag:'LƯỠI KIẾM MANG CÁNH LỬA',color:'#dc9271',accent:'#ffdc8e',duration:2800}),
  eira:Object.freeze({theme:'auroraspring',tag:'SUỐI NGUỒN DƯỚI CỰC QUANG',color:'#8ee4ed',accent:'#d4b7ff',duration:3000}),
  veyron:Object.freeze({theme:'stormlances',tag:'THƯƠNG TRỜI XÉ MÀN GIÔNG',color:'#8fc3ff',accent:'#edf3ff',duration:2900}),
  solis:Object.freeze({theme:'solarbloom',tag:'VẠN VẬT DƯỚI THÁI DƯƠNG',color:'#ffa867',accent:'#fff1a5',duration:3150}),
  selene:Object.freeze({theme:'bloodmoon',tag:'LƯỠNG ĐAO DƯỚI TRĂNG MÁU',color:'#ff9fb3',accent:'#ffd9ed',duration:3050})
});
export const ULTIMATES=Object.freeze({
  ...HERO_ULTIMATES,
  orion:Object.freeze({theme:'gate',tag:'THIÊN MÔN KHAI MỞ',color:'#d6b8ff',accent:'#ffe0a0'}),
  lyra:Object.freeze({theme:'symphony',tag:'KHÚC CA CỦA CÁC VÌ SAO',color:'#b5e8cf',accent:'#d8baff'}),
  aion:Object.freeze({theme:'cosmos',tag:'KHI VŨ TRỤ THỨC GIẤC',color:'#b6e9ff',accent:'#ffb9e4'}),
  eclipse:Object.freeze({theme:'singularity',tag:'ÁNH SÁNG SAU CÙNG',color:'#e9a9ee',accent:'#9ccfff'})
});
export const hasUltimate=id=>Object.hasOwn(ULTIMATES,id);
export const hasHeroUltimate=id=>Object.hasOwn(HERO_ULTIMATES,id);
export function ultimateSpec(id,{skin=null}={}){
  if(!hasUltimate(id))return null;
  const outfit=resolveSkin(id,skin);
  return {...ULTIMATES[id],color:outfit?.color||ULTIMATES[id].color,accent:outfit?.accent||ULTIMATES[id].accent,costume:outfit?.name||null,rank:RARITY[HERO[id].rarity].rank};
}
