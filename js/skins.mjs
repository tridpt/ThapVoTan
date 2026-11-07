// Account cosmetics never alter a journey's combat snapshot.
export const SKINS=Object.freeze([
  Object.freeze({id:'rook-guardian',hero:'rook',name:'Vệ thần',color:'#b9d7cf',hair:'#c9d2c8',accent:'#ebcd84',icon:'shield',goal:5,source:'tower',requirement:'Vượt tầng 5',description:'Giáp ngọc trắng, vương miện hộ vệ và đại khiên mang ấn cổng tháp.'}),
  Object.freeze({id:'aerin-moon',hero:'aerin',name:'Nguyệt ảnh',color:'#a9a7e3',hair:'#e1e2f5',accent:'#d2eaff',icon:'moon',goal:10,source:'tower',requirement:'Vượt tầng 10',description:'Áo choàng đêm, cung trăng bạc và những mảnh nguyệt thạch lơ lửng.'}),
  Object.freeze({id:'lumi-dawn',hero:'lumi',name:'Bình minh',color:'#f1d5a1',hair:'#fff0d0',accent:'#fff5d9',icon:'star',goal:3,source:'colossus',requirement:'Thắng Cự nhân cổ đại 3 lần',description:'Lễ phục bình minh, đôi cánh ánh sáng và quyền trượng mặt trời.'}),
  Object.freeze({id:'ember-phoenix',hero:'ember',name:'Phượng hoàng',color:'#f09a62',hair:'#e9b85d',accent:'#ffe49b',icon:'flame',goal:3,source:'ashknight',requirement:'Thắng Kỵ sĩ tro tàn 3 lần',description:'Mão lông phượng, đôi cánh lửa và đuôi chim rực sáng theo từng chuyển động.'})
]);
export const SKIN=Object.freeze(Object.fromEntries(SKINS.map(s=>[s.id,s])));
export const starterSkins=()=>Object.fromEntries(SKINS.map(s=>[s.hero,null]));
export const skinForHero=id=>SKINS.find(s=>s.hero===id)||null;
export function resolveSkin(hero,id=null){
  if(id===null||id==='base')return null;
  if(typeof id!=='string'||!Object.hasOwn(SKIN,id)||SKIN[id].hero!==hero)throw new Error('Trang phục không phù hợp với anh hùng.');
  return SKIN[id];
}
export const equippedSkin=(s,hero)=>s?.skins?.[hero]??null;
export function skinProgress(s,id){
  if(!Object.hasOwn(SKIN,id))throw new Error('Trang phục không tồn tại.');
  const skin=SKIN[id],value=skin.source==='tower'?s.best:s.armory.hunts[skin.source].clears;
  const owned=!!s.owned[skin.hero];
  const eventUnlocked=!!s.season?.cosmetics?.includes(id);
  return {current:Math.min(value,skin.goal),goal:skin.goal,owned,eventUnlocked,unlocked:owned&&(value>=skin.goal||eventUnlocked)};
}
export function equipSkin(s,hero,id){
  if(!skinForHero(hero)||!Object.hasOwn(s.owned,hero))throw new Error('Bạn chưa sở hữu anh hùng này.');
  if(id!==null&&typeof id!=='string')throw new Error('Trang phục không hợp lệ.');
  const skin=resolveSkin(hero,id);
  if(skin&&!skinProgress(s,skin.id).unlocked)throw new Error('Chưa đạt mốc mở khóa trang phục.');
  s.skins[hero]=skin?.id||null;return skin;
}
export function validateSkins(s){
  if(!s.skins||typeof s.skins!=='object'||Array.isArray(s.skins)||Object.keys(s.skins).length!==SKINS.length||SKINS.some(skin=>!Object.hasOwn(s.skins,skin.hero)))throw new Error('Tủ trang phục không hợp lệ.');
  for(const [hero,id] of Object.entries(s.skins)){
    if(id!==null&&(typeof id!=='string'||!Object.hasOwn(SKIN,id)))throw new Error('Trang phục đã lưu không hợp lệ.');
    const skin=resolveSkin(hero,id);
    if(skin&&!skinProgress(s,skin.id).unlocked)throw new Error('Trang phục đang mặc chưa được mở khóa.');
  }
}
