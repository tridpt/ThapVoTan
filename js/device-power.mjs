// Anonymous device limits only. These choices never enter the account save.
export function normalizeDevicePower(value){
  const data=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return {lowRam:data.lowRam===true,memoryGB:Number.isFinite(data.memoryGB)&&data.memoryGB>=.25&&data.memoryGB<=256?data.memoryGB:null,
    powerSave:data.powerSave===true,thermal:Number.isInteger(data.thermal)&&data.thermal>=0&&data.thermal<=6?data.thermal:0};
}
export function readDevicePower(bridge,deviceNavigator){
  if(bridge===undefined)try{bridge=globalThis.AndroidDevice;}catch{}
  if(deviceNavigator===undefined)try{deviceNavigator=globalThis.navigator;}catch{}
  let data={};
  try{const raw=bridge?.profile?.();if(typeof raw==='string'&&raw.length<2048)data=JSON.parse(raw);}catch{}
  const profile=normalizeDevicePower(data);
  if(profile.memoryGB===null)try{profile.memoryGB=normalizeDevicePower({memoryGB:deviceNavigator?.deviceMemory}).memoryGB;}catch{}
  return profile;
}
export function devicePowerPolicy({automatic=true,batterySaver=false}={},value={}){
  const profile=normalizeDevicePower(value),saving=batterySaver===true||profile.powerSave,hot=profile.thermal>=2;
  const memoryFloor=automatic?(profile.lowRam||profile.memoryGB!==null&&profile.memoryGB<=2?2:profile.memoryGB!==null&&profile.memoryGB<=3?1:0):0;
  const floor=Math.max(memoryFloor,saving?2:0,profile.thermal>=4?3:hot?2:0),constrained=floor>0;
  const reason=profile.thermal>=4?'Máy đang rất nóng':hot?'Máy đang nóng':profile.powerSave?'Tiết kiệm pin Android':batterySaver?'Tiết kiệm pin':memoryFloor?'Thiết bị ít RAM':null;
  return {floor,maxFps:profile.thermal>=4?20:constrained?30:60,reason,warmModels:!constrained,thumbnailSize:constrained?192:288,
    cinematics:!saving&&!hot,quietIdle:saving||hot};
}
export function sceneFrameInterval(graphics,policy,mode){
  return policy.quietIdle&&['lobby','map','preview','victory'].includes(mode)?Math.max(graphics.frameInterval,1000/15):graphics.frameInterval;
}
