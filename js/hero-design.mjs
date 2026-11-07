import {HERO} from './data.mjs';
import {resolveSkin} from './skins.mjs';

// Presentation only. Combat, rarity odds and saved hero records keep their existing data.
export const HERO_DESIGNS=Object.freeze(Object.fromEntries(Object.entries({
  rook:{role:'guardian',helm:'bastion',cloth:'#343c32',steel:'#51585d',trim:'#a89566',eye:'#d5bb7e',crest:'gate'},
  thorne:{role:'guardian',helm:'antler',cloth:'#253c33',steel:'#3e554b',trim:'#9d9b73',eye:'#a6cc89',crest:'root'},
  orion:{role:'guardian',helm:'cathedral',cloth:'#342e47',steel:'#545362',trim:'#b6a184',eye:'#c7acff',crest:'gate'},
  aerin:{role:'ranger',helm:'hood',cloth:'#284239',steel:'#455952',trim:'#b6b293',eye:'#bfdbac',crest:'leaf'},
  lumi:{role:'cleric',helm:'veil',cloth:'#31424a',steel:'#657077',trim:'#b7c4bf',eye:'#a8d9df',crest:'sun'},
  ember:{role:'sorcerer',helm:'cowl',cloth:'#492b2b',steel:'#514047',trim:'#a67d59',eye:'#f0a16c',crest:'flame'},
  kira:{role:'assassin',helm:'mask',cloth:'#2e2a3e',steel:'#4a4659',trim:'#8f88a0',eye:'#baa0e3',crest:'moon'},
  bryn:{role:'sorcerer',helm:'ice',cloth:'#2d3e50',steel:'#566777',trim:'#9aafb8',eye:'#9edee9',crest:'frost'},
  raiden:{role:'knight',helm:'ronin',cloth:'#302e46',steel:'#4b5262',trim:'#a5a0b3',eye:'#bda7f3',crest:'thunder'},
  seraph:{role:'cleric',helm:'mitre',cloth:'#453d30',steel:'#605f56',trim:'#c1ae79',eye:'#e6d3a0',crest:'sun'},
  astra:{role:'sorcerer',helm:'star',cloth:'#353044',steel:'#5c5563',trim:'#c0a36d',eye:'#eed697',crest:'star'},
  nyx:{role:'assassin',helm:'horn',cloth:'#3d2945',steel:'#514451',trim:'#ad8aaf',eye:'#cfaaec',crest:'moon'},
  kael:{role:'knight',helm:'dragon',cloth:'#4c292a',steel:'#61514b',trim:'#bd8e62',eye:'#ffb078',crest:'flame'},
  eira:{role:'cleric',helm:'ice',cloth:'#2e464b',steel:'#617879',trim:'#b4d0cb',eye:'#9aeeee',crest:'frost'},
  veyron:{role:'knight',helm:'winged',cloth:'#293c56',steel:'#526276',trim:'#9db7d4',eye:'#96cfff',crest:'thunder'},
  solis:{role:'sorcerer',helm:'solar',cloth:'#50342d',steel:'#766246',trim:'#c6a16b',eye:'#ffd496',crest:'sun'},
  selene:{role:'assassin',helm:'crescent',cloth:'#482b3b',steel:'#5e4d63',trim:'#c292a3',eye:'#f4a6bb',crest:'moon'},
  lyra:{role:'sorcerer',helm:'antler',cloth:'#313947',steel:'#5a6170',trim:'#afadb9',eye:'#d2bdff',crest:'star'},
  aion:{role:'sorcerer',helm:'void',cloth:'#2b303b',steel:'#6d6870',trim:'#c5b18c',eye:'#cfedff',crest:'star'},
  eclipse:{role:'assassin',helm:'eclipse',cloth:'#38283f',steel:'#574762',trim:'#b897b7',eye:'#f4beef',crest:'moon'}
}).map(([id,design])=>[id,Object.freeze(design)])));

export function heroDesign(id,skinId=null){
  const h=HERO[id],base=HERO_DESIGNS[id];if(!h||!base)throw new Error('Tạo hình anh hùng không tồn tại.');
  const outfit=resolveSkin(id,skinId);
  return {...base,id,hair:outfit?.hair||h.hair,skin:h.skin,accent:outfit?.color||base.eye,
    ...(outfit?{steel:outfit.color,trim:outfit.accent}:{}),outfit:outfit?.id||null};
}
