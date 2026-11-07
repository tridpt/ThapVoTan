import {RARITY} from './data.mjs';
import {adventureBossArt} from './creature-art.mjs';
import {resolveSkin} from './skins.mjs';
import {heroDesign} from './hero-design.mjs';
import {eliteDefinition} from './elites.mjs';

export function icon(name,size=22) {
  const paths={
    link:'M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l2-2',
    target:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v4M12 19v4M1 12h4M19 12h4',
    tower:'M8 21h8M6 21h12M8 18V9h8v9M6 9h12M8 6l4-4 4 4M10 13h4M12 13v3',
    heroes:'M15 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a3 3 0 0 1 0 6M21 20v-2a4 4 0 0 0-4-4',
    star:'m12 2 2.8 6.4L22 12l-7.2 3.6L12 22l-2.8-6.4L2 12l7.2-3.6Z',
    gift:'M3 8h18v4H3ZM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3ZM12 8h4a3 3 0 1 0-3-3Z',
    forge:'m5 3 4 4-2 3-4-3 1-4h1ZM8 9l10 10M15 4l5 5M13 7l4 4M14 3l7 7M3 21l7-7M3 18l3 3',
    quest:'M8 4H5v17h14V4h-3M8 2h8v5H8ZM8 12l2 2 5-5M8 18h8',
    settings:'m10 2-.8 3-2 .9-2.7-.9L2 9l2 2v2l-2 2 2.5 4 2.7-.9 2 .9.8 3h4l.8-3 2-.9 2.7.9 2.5-4-2-2v-2l2-2-2.5-4-2.7.9-2-.9L14 2ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    sword:'m4 20 3-3M3 14l7 7M7 17 19 5l1-4-4 1L4 14',
    shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM12 7v9M8 12h8',
    heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-9.6a5.5 5.5 0 0 0 0-7.8Z',
    coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 7h5M10 7v10M9 12h5M9 17h5',
    ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4ZM15 5v3M15 11v2M15 16v3',
    gem:'m12 2 8 6-3 11H7L4 8ZM4 8h16M12 2 8 8l4 11 4-11Z',
    arrow:'M4 12h16M14 6l6 6-6 6',
    chevron:'m9 5 7 7-7 7',
    back:'M20 12H4m6-6-6 6 6 6',
    close:'m6 6 12 12M6 18 18 6',
    check:'m5 12 4 4L20 5',
    plus:'M12 4v16M4 12h16',
    skull:'M5 15v-4a7 7 0 0 1 14 0v4l-3 2v4H8v-4ZM8 11h1M15 11h1M10 18v3M14 18v3',
    crown:'m3 6 5 4 4-7 4 7 5-4-2 12H5ZM5 22h14',
    camp:'m2 21 10-18 10 18ZM8 21l4-7 4 7M8 3l4 7 4-7',
    chest:'M3 10h18v10H3ZM3 10V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4M3 14h7m4 0h7M10 11h4v6h-4Z',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    drop:'M12 2S4 12 4 16a8 8 0 0 0 16 0c0-4-8-14-8-14Z',
    flame:'M13 2c2 8-5 8-3 13-3-1-4-4-4-4-5 8 0 11 6 11 7 0 12-9 1-20Z',
    snow:'M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3',
    leaf:'M20 3C5 1 1 9 6 16c6 7 16 1 14-13ZM4 21 16 8',
    bolt:'m13 2-9 12h7l-1 8 10-13h-8Z',
    sound:'m11 4-5 4H2v8h4l5 4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16',
    mute:'m11 4-5 4H2v8h4l5 4ZM16 9l6 6M16 15l6-6',
    download:'M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5',
    upload:'M12 16V4m-5 5 5-5 5 5M3 16v5h18v-5',
    info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    clock:'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    play:'m8 4 12 8-12 8Z',
    pause:'M8 4v16M16 4v16',
    wind:'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3',
    moon:'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
    lock:'M5 11h14v10H5ZM8 11V6a4 4 0 0 1 8 0v5M12 15v3',
    unlock:'M5 11h14v10H5ZM8 11V6a4 4 0 0 1 8 0M12 15v3',
    outfit:'m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z'
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;
}
export const elementIcon = e=>({'Phong':'wind','Thổ':'shield','Quang':'star','Hỏa':'flame','Ảnh':'moon','Băng':'snow','Lôi':'bolt'}[e]||'star');
export function heroArt(h,variant='portrait',skinId=undefined) {
  const outfit=resolveSkin(h.id,skinId??null),d=heroDesign(h.id,skinId??null),{steel,trim,cloth,eye,helm,role}=d;
  const tier=RARITY[h.rarity],rank=tier.rank,glow=tier.color,ink='#171c25',cx=107;
  const heavy=role==='guardian',robe=['sorcerer','cleric'].includes(role),rogue=role==='assassin';
  const w=heavy?29:rogue?18:22,shoulder=heavy?43:robe?27:32;
  const closed=['bastion','cathedral','winged','solar','void','eclipse'].includes(helm);
  const hood=['hood','veil','cowl','mask','antler'].includes(helm)&&!heavy;
  const weapon=h.weapon==='bow'?`<path d="M153 91q47 48-4 111" fill="none" stroke="${trim}" stroke-width="4"/><path d="m153 91 11 48-15 63M135 140h55m-6-4 6 4-6 4" fill="none" stroke="#a8b6ad" stroke-width="1.3"/>`:
    h.weapon==='shield'?`<path d="M42 202V76m-5 4 5-20 6 20" fill="none" stroke="${trim}" stroke-width="3"/><path d="m136 127 23-5 28 7-5 49-24 26-23-30Z" fill="${trim}"/><path d="m140 134 19-4 22 5-4 40-19 21-18-25Z" fill="${steel}" stroke="${ink}" stroke-width="2"/><path d="m158 140 7 18-7 19-7-19Z" fill="${eye}"/><path d="M143 139h33m-18-4v53" stroke="${trim}" stroke-width="1.4"/>`:
    h.weapon==='sword'?`<path d="m149 161 29-106 7-16 2 18-28 107Z" fill="#b7c0c5" stroke="#343e48"/><path d="m157 154 25-98" stroke="${steel}" stroke-width="3"/><path d="m141 155 28 8m-16-2-7 24" stroke="${trim}" stroke-width="4"/>`:
    h.weapon==='dagger'?`<path d="m48 152-16-52-6-11 1 19 13 47Zm112-1 19-50 7-11-2 20-16 45Z" fill="#b7c0c5" stroke="${steel}" stroke-width="2"/><path d="m35 151 16 3m106-2 16 4" stroke="${trim}" stroke-width="4"/>`:
    h.weapon==='orb'?`<circle cx="162" cy="117" r="18" fill="none" stroke="${trim}" stroke-width="2"/><path d="m162 99 12 18-12 19-12-19Z" fill="${eye}"/><path d="m162 103 3 14-3 14-3-14Z" fill="#dbe8e6"/>`:
    `<path d="M161 64v139" stroke="${ink}" stroke-width="5"/><path d="M161 64v139" stroke="${trim}" stroke-width="1.4"/><path d="m161 38 14 19-14 22-14-22Z" fill="${steel}" stroke="${trim}" stroke-width="2"/><path d="m161 45 6 12-6 14-6-14Z" fill="${eye}"/>`;
  const seal=rank>=2?`<g class="hero-crown" fill="none" stroke="${trim}"><circle cx="107" cy="64" r="43" stroke-width="1.7" stroke-dasharray="57 10"/><path d="m107 15 3 6-3 7-3-7ZM60 65l5-3 5 3-5 3Zm74 0 5-3 5 3-5 3Z" fill="${glow}" stroke="none"/></g>`:'';
  const rings=rank>=3?`<g class="celestial-orbit" fill="none" stroke="${glow}"><ellipse cx="107" cy="147" rx="78" ry="28" transform="rotate(-14 107 147)" stroke-dasharray="45 8 2 8" opacity=".65"/></g>`:'';
  const rays=rank>=4?`<g class="celestial-rays" fill="${glow}">${Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,x=107+Math.cos(a)*81,y=112+Math.sin(a)*81;return `<path d="m${x} ${y-4} 2 4-2 4-2-4Z"/>`;}).join('')}</g>`:'';
  const wings=rank>=5?`<g class="celestial-wings" fill="${steel}" stroke="${trim}" stroke-width="1.2"><path d="m82 133-39-49-20-17 10 47 36 35-28-21 16 35 24 7Zm50 0 39-49 20-17-10 47-36 35 28-21-16 35-24 7Z"/><path d="m38 90 37 57m101-57-37 57" stroke="${glow}" stroke-width="2"/></g>`:'';
  const cosmos=rank>=6?`<g class="cosmic-orbit" fill="none" stroke-width="1.4"><ellipse cx="107" cy="131" rx="94" ry="35" transform="rotate(-53 107 131)" stroke="${eye}" stroke-dasharray="65 11" opacity=".7"/><ellipse cx="107" cy="131" rx="94" ry="35" transform="rotate(53 107 131)" stroke="${glow}" stroke-dasharray="65 11" opacity=".6"/></g>`:'';
  const sparks=rank>=1?`<g class="celestial-sparks" fill="${tier.accent}">${Array.from({length:Math.min(10,rank*2)},(_,i)=>{const a=i*2.399963,x=107+Math.cos(a)*83,y=115+Math.sin(a)*87;return `<path style="--spark:${i*.27}s" d="m${x} ${y-2} 1 2-1 2-1-2Z"/>`;}).join('')}</g>`:'';
  const legs=`<path d="m89 151-6 57h18l6-48 7 48h18l-8-57Z" fill="${ink}"/><path d="m86 170 17 2-5 34-9 5-9-7Zm25 2 17-2 6 34-10 7-9-5Z" fill="${steel}" stroke="#8b9292" stroke-width=".7"/><path d="m81 205-6 13h26l-2-12Zm34 1-1 12h28l-9-13Z" fill="${steel}" stroke="${trim}" stroke-width=".7"/>`;
  const tassets=robe?`<path d="m${cx-w} 141 ${w} 8 ${w}-8 11 65-23 10-10-62-7 62-24-10Z" fill="${cloth}" stroke="${trim}"/>`:`<path d="m${cx-w} 141 22 6-6 43-23-8Zm26 6 23-6 9 41-23 8Z" fill="${steel}" stroke="${trim}" stroke-width=".8"/>`;
  const arms=[-1,1].map(sign=>`<g transform="translate(${cx} 0) scale(${sign} 1)"><path d="m${w-4} 97 18 3 12 48-9 7-13-33Z" fill="${cloth}"/><path d="m${w-3} 99 9-15 ${shoulder-w+12} 10-5 17-14 7Z" fill="${steel}" stroke="${trim}" stroke-width="1"/><path d="m${w+5} 126 13-3 6 29-14 4Z" fill="${steel}" stroke="${ink}" stroke-width="2"/><path d="m${w+10} 151 12-2 4 11-11 6-7-8Z" fill="${ink}"/>${heavy?`<path d="m${w+8} 89 1-14 5 13 4-17 5 22" fill="${trim}"/>`:''}</g>`).join('');
  const head=closed?`<path d="m91 49 5-14 20-1 10 16-3 31-16 10-17-12Z" fill="${steel}" stroke="${trim}" stroke-width=".8"/><path d="m91 57 16 3 17-3-2 10-15 4-15-4Z" fill="${ink}"/><path d="m103 43 8 0-1 36-3 5-4-5Z" fill="${trim}"/><path d="m94 74 5 6m18-6-4 6" stroke="${ink}" stroke-width="1.4"/>`:
    `${hood?`<path d="m85 53 8-18 14-8 16 8 8 18-2 32-10 8-12-6-14 6-10-10Z" fill="${cloth}" stroke="${trim}" stroke-width="1"/>`:`<path d="m89 48 8-16 12 6 11-5 8 17-3 30-10 9-22-10Z" fill="${d.hair}"/>`}<path d="m93 52 14-9 15 9-1 23-14 10-14-10Z" fill="${h.skin}"/><path d="m91 51 16-12 17 12-5 10-12-6-11 7Z" fill="${hood?cloth:steel}"/><path d="m93 65 14 4 15-4-3 15-12 8-13-9Z" fill="${rogue?ink:steel}" stroke="${trim}" stroke-width=".7"/><path d="m97 72 10 6 10-6" fill="none" stroke="${trim}" stroke-width=".8"/>`;
  const horns=['antler','horn','dragon','eclipse','crescent'].includes(helm)?`<path d="m96 43-10-9-4-16 10 13 9 6m16 6 10-9 4-16-10 13-9 6" fill="${steel}" stroke="${trim}"/>${helm==='antler'?`<path d="m88 31-10-2m7-6-7-8m47 16 10-2m-7-6 7-8" fill="none" stroke="${trim}" stroke-width="2"/>`:''}`:'';
  const crown=['cathedral','solar','star','void','ice','mitre','winged','ronin','bastion'].includes(helm)?`<path d="m92 43-3-14 10 8 8-20 8 20 10-8-3 14-15-4Z" fill="${trim}" stroke="${steel}"/>`:'';
  const costume=outfit?costumeArt(outfit):{back:'',front:''};
  return `<svg data-model-type="hero" data-model-id="${h.id}" data-appearance="dark-fantasy" data-silhouette="${role}" data-skin-tone="${h.skin}" ${skinId!==undefined?`data-skin-preview="${outfit?.id||'base'}"`:''} class="hero-art tier-${h.rarity} ${variant}" style="--rarity:${glow};--accent:${tier.accent}" viewBox="0 0 216 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="107" cy="220" rx="62" ry="9" fill="#02080e" opacity=".5"/>
  ${seal}${rays}${wings}${cosmos}${sparks}${costume.back}
  <path d="m${cx-w} 91 ${w} 10 ${w}-10 18 116-29-11-11 17-12-16-28 12Z" fill="${cloth}" stroke="${ink}" stroke-width="2"/>
  ${legs}${tassets}${arms}
  <path d="m${cx-w} 94 ${w} -11 ${w} 11-5 37-17 15-17-15Z" fill="${steel}" stroke="${trim}" stroke-width="1"/>
  <path d="m${cx-w+5} 97 ${w-5} -6 ${w-5} 6-6 13-11-4-11 4Z" fill="#92999c" opacity=".55"/>
  <path d="m89 127 18 8 18-8m-35 9 17 8 17-8" fill="none" stroke="${ink}" stroke-width="3"/>
  ${robe?`<path d="m99 91 8 8 8-8 4 43-12 9-12-9Z" fill="${cloth}" stroke="${trim}"/><path d="m107 109 4 7-4 9-4-9Z" fill="${eye}"/>`:`<path d="m${cx-w} 96 7-4 ${w*2-4} 45-7 6Z" fill="${cloth}" stroke="${trim}" stroke-width=".6"/>`}
  <path d="M85 146h44" stroke="${ink}" stroke-width="6"/><path d="m107 141 5 5-5 7-5-7Z" fill="${trim}"/>
  <path d="m89 94 3-17 15 8 15-8 4 17" fill="${steel}" stroke="${trim}"/>
  ${head}${horns}${crown}
  <path d="m95 62 8 1m9 0 8-1" stroke="${ink}" stroke-width="4"/><path d="m96 62 7 1m9 0 7-1" stroke="${eye}" stroke-width="1.5"/>
  ${weapon}${rings}${costume.front}
  </svg>`;
}
function costumeArt(s){
  const a=s.accent,c=s.color;
  const halo=`<circle cx="107" cy="62" r="45" fill="none" stroke="${a}" stroke-width="1.7" stroke-dasharray="54 8"/>`;
  if(s.hero==='rook')return {back:halo,front:`<g fill="${c}" stroke="${a}" stroke-width="1"><path d="m91 46 2-15 9 8 5-19 5 19 9-8 2 15-16-5Z"/><path d="m65 91-7-7-7 11 10 15 17-2m71-17 7-7 7 11-10 15-17-2"/><path d="m139 132 19-5 24 8-4 40-20 22-17-24Z"/><path d="M158 138v44m-13-31h26" fill="none" stroke-width="2"/></g>`};
  if(s.hero==='aerin')return {back:halo+`<path d="m86 93-34 115 34-20 21 23 21-23 33 20-33-115Z" fill="#494a78" stroke="${c}"/>`,front:`<g fill="${a}"><path d="m108 18q-16 7-8 22-19-9-6-22 6-4 14 0ZM153 91q50 48-4 111l19-35 13-26-14-30Z"/><path d="m86 53 8-18 13-7 15 7 8 18-10-6-13-9-13 9-5 34-7 6Z" fill="#5b5d91" stroke="${a}"/></g>`};
  const phoenix=s.hero==='ember';
  return {back:halo+`<g fill="${c}" stroke="${a}" stroke-width="1"><path d="M87 145 48 99 25 72l12 45 21 27-17-11 13 28 27 5Zm40 0 39-46 23-27-12 45-21 27 17-11-13 28-27 5Z"/>${phoenix?'<path d="m89 171-25 48 27-23 16 25 16-25 27 23-25-48Z"/>':''}</g>`,front:`<g fill="${a}" stroke="${c}" stroke-width="1"><path d="m94 45 1-15 9 9 3-19 3 19 9-9 2 15-14-4Z"/><path d="m90 150 17 7 17-7 9 55-26 11-26-11Z" fill="${phoenix?'#923e36':'#e5d6b0'}"/><path d="m161 35 6 16 11-5-8 16-9 9-9-9-8-16 11 5Z"/></g>`};
}
export function enemyArt(e) {
  if(e.bossId==='curse-king')return `<svg data-model-type="boss" data-model-id="curse-king" viewBox="0 0 216 240" class="hero-art enemy-art curse-king-art" aria-hidden="true"><ellipse cx="108" cy="220" rx="79" ry="11" fill="#090b15" opacity=".7"/><circle cx="108" cy="103" r="77" fill="#221723" stroke="#b786a6" stroke-width="1.4"/><circle cx="112" cy="94" r="61" fill="#11141e"/><g fill="#443047" stroke="#b99ac9" stroke-width="1.4"><path d="m68 104-25 97 31-15 34 32 33-32 31 15-25-97-39-17Z"/><path d="m79 104 29-14 28 14 12 85-40 26-41-26Z" fill="#28212e"/><path d="m78 52 30-24 31 24-6 43-25 19-26-19Z" fill="#3b3042"/><path d="m83 49-11-33 26 19 11-29 9 28 28-18-14 34Z"/><path d="m61 109-15-14-9 18 17 20 20-9m80-15 15-14 9 18-17 20-20-9"/><path d="m83 179-10 38h27l8-29 9 29h27l-11-38Z"/></g><path d="m83 65 25 12 27-12-8 22-19 10-18-11Z" fill="#11121b"/><path d="m89 78 13 3m14 0 13-3" stroke="#efb1cd" stroke-width="3"/><path d="m108 117 14 22-14 25-14-25Z" fill="#b99ac9" stroke="#edb3ca"/><path d="m108 125 6 14-6 14-6-14Z" fill="#edb3ca"/><path d="M174 58v146m-9-136 9-25 10 25-10 18Z" fill="#4e3b55" stroke="#d7accc" stroke-width="3"/><path d="m71 122-20 32 12 8 21-29m53-11 21 30 18-3-9-15-17-18" fill="#8a5a77"/><g fill="#d7a5c0"><path d="m28 94 3 7-3 7-3-7Zm160-47 3 7-3 7-3-7Zm-17 143 3 7-3 7-3-7Z"/></g></svg>`;

  if(e.bossId==='void-dragon')return `<svg data-model-type="boss" data-model-id="void-dragon" viewBox="0 0 216 240" class="hero-art enemy-art void-dragon-art" aria-hidden="true"><ellipse cx="108" cy="220" rx="85" ry="11" fill="#02080d" opacity=".65"/><circle cx="108" cy="115" r="85" fill="#b9a4ef" opacity=".06"/><path d="m80 112-30-55L7 40l11 61 18-10 5 49 20-12 15 36m60-52 30-55 43-17-11 61-18-10-5 49-20-12-15 36" fill="#383449" stroke="#8f7cb9" stroke-width="2"/><path d="M80 112 50 57 8 41m128 71 30-55 42-16" fill="none" stroke="#a9e8f4" stroke-width="2"/><path d="m82 102 26-17 26 17 15 65-22 35-19-10-19 10-22-35Z" fill="#252f43" stroke="#655e86" stroke-width="2"/><path d="m91 137 17-14 17 14-17 28Z" fill="#a9e8f4"/><path d="m87 64 21-13 22 13-3 28-19 21-20-21Z" fill="#42465e"/><path d="m88 64-14-37 23 24m32 13 14-37-23 24" fill="#9180af"/><path d="m90 78 12 3m12 0 12-3" stroke="#b9f5ff" stroke-width="4"/><path d="m96 88 12-4 12 4-4 13h-16Z" fill="#1b2235"/><path d="m77 153-19 26 12 8 18-21m51-13 19 26-12 8-18-21M89 193l-13 25h26l6-19 7 19h26l-13-25" fill="#414761"/><path d="M126 195q33 23 56 1l-17 3q-22 4-29-18" fill="#655886"/><path d="m100 98 3-5 3 5m4 0 3-5 3 5" stroke="#e8dff4" fill="none"/></svg>`;

  const elemental=adventureBossArt(e.bossId);if(elemental)return elemental;
  const boss=e.kind==='boss',wraith=e.kind==='wraith',elite=eliteDefinition(e);
  const ornaments=elite?`<g class="elite-fallback-armor" stroke="${elite.color}" stroke-width="2"><ellipse cx="108" cy="216" rx="74" ry="10" fill="none" opacity=".7"/><path d="m84 52 3-25 13 12 8-25 8 25 13-12 3 25-24-5Z" fill="#35434f"/><path d="m62 120-12-18 18 7 8-18 4 31m56-2 12-18-18 7-8-18-4 31" fill="#35434f"/>${elite.id==='guard'?'':elite.id==='rebirth'?`<circle cx="108" cy="85" r="55" fill="none" stroke-dasharray="${e.elite.revived?'8 12':'60 7'}" opacity="${e.elite.revived?'.3':'.8'}"/>`:'<path d="m54 124-15 44 20-17 13-27m90 0 15 44-20-17-13-27" fill="#ae675a"/>'}</g>`:'';
  const eliteFront=elite?`<g stroke="${elite.color}" stroke-width="2">${elite.id==='guard'&&e.shield>0?'<path d="m27 137 22-14 23 14-5 43-18 22-18-22Z" fill="#263846"/><path d="M49 136v49m-13-31h26"/>':elite.id==='rage'?'<path d="m57 123-16 49 21-15 12-33m85-1 16 49-21-15-12-33" fill="#ae675a"/>':''}<path d="m108 122 10 16-10 18-10-18Z" fill="${elite.id==='rebirth'&&e.elite.revived?'#6b627c':elite.color}"/></g>`:'';
  if(boss&&e.bossId&&e.bossId!=='colossus')return bossArt(e.bossId);
  return `<svg viewBox="0 0 216 240" class="hero-art enemy-art${elite?' elite-art elite-'+elite.id:''}" aria-hidden="true"><ellipse cx="108" cy="220" rx="70" ry="11" fill="#02080d" opacity=".6"/>${ornaments}${wraith?`<path d="M55 210 69 88q3-45 39-45t39 45l23 122-31-16-15 20-19-14-24 13Z" fill="#454461"/><path d="m74 86 34-30 34 30-9 47-26 16-27-16Z" fill="#171c2a"/><path d="m84 101 15 3m17 0 15-3" stroke="#c0a9db" stroke-width="4"/><path d="m72 135-27 41 25-9m75-32 27 41-24-9" fill="#686182"/>`:`<path d="m64 112-21 21-7 62 22 8 19-48m74-43 24 21 4 65-22 7-19-49" fill="${boss?'#6a6761':'#4b6360'}"/><path d="m66 105 42-16 42 16 8 68-24 42H81l-26-42Z" fill="${boss?'#5d615d':'#3e5353'}" stroke="#7b8c7a" stroke-width="2"/><path d="m108 112 18 25-18 30-18-30Z" fill="${boss?'#d7ac75':'#85b6a2'}"/><path d="m75 65 33-23 34 23-7 46-27 14-26-14Z" fill="#7c8677"/><path d="m79 78 29 9 29-9-10 26H90Z" fill="#192c2c"/><path d="m87 87 12 3m17 0 12-3" stroke="${boss?'#ffd6a1':'#a6d9bf'}" stroke-width="4"/><path d="m84 49-9-24 24 14 10-20 9 20 23-14-9 24" fill="${boss?'#c0a675':'#768b72'}"/><path d="m85 178-9 43h27l5-34 6 34h27l-8-43" fill="#343f40"/><path d="m52 137-19-8-5 24 13 5m123-20 24-6 5 22-14 8" fill="#8b9380"/>`}${eliteFront}</svg>`;
}
function bossArt(id){
  const c=id==='archivist'?'#b9a2d7':id==='ashknight'?'#e0a07b':'#9ec6df';
  const symbol=id==='archivist'?`<path d="m33 145 30-11 27 12v48l-27-12-30 10Zm57 1 29-12 28 11v47l-28-10-29 12Z" fill="#3e3652" stroke="${c}" stroke-width="2"/><path d="m43 151 16-5 20 8m-36 7 16-5 20 8m22-10 16-7 19 6m-35 11 16-6 19 5" stroke="${c}" opacity=".6"/><path d="M171 75v119" stroke="${c}" stroke-width="4"/><circle cx="171" cy="64" r="16" fill="none" stroke="${c}" stroke-width="2"/><path d="m171 52 5 12-5 12-5-12Z" fill="${c}"/>`:id==='ashknight'?`<path d="m148 175 29-126 11-19 3 24-30 126Z" fill="#bdc0af"/><path d="m178 43 5 15-25 104" fill="none" stroke="#f6b476" stroke-width="3"/><path d="m135 167 40 11m-20 0-7 24" stroke="${c}" stroke-width="5"/><path d="m56 126-29-8-10 28 24 25 18-10Z" fill="#5c4c45" stroke="${c}"/><path d="M70 198q-16-5-13-22 14 11 11-9 21 24 9 32m68-114q15-15 8-27 24 15 6 37" fill="${c}" opacity=".8"/>`:`<path d="M175 42v157" stroke="#aac6d1" stroke-width="4"/><path d="M174 28q45 20 10 59 14-36-10-43Z" fill="${c}"/><path d="m26 137 20-17 26 14-7 44-20 15-19-25Z" fill="#284656" stroke="${c}" stroke-width="2"/><path d="M54 138a13 13 0 1 0-5 29 15 15 0 0 1 5-29Z" fill="${c}"/>`;
  return `<svg viewBox="0 0 216 240" class="hero-art enemy-art" aria-hidden="true"><ellipse cx="108" cy="220" rx="68" ry="10" fill="#02080d" opacity=".6"/><circle cx="108" cy="100" r="76" fill="${c}" opacity=".04"/><circle cx="108" cy="80" r="55" fill="none" stroke="${c}" opacity=".2" stroke-dasharray="3 9"/><path d="m69 102-26 102 36-16 29 28 27-29 36 17-26-102Z" fill="${c}" opacity=".28"/><path d="m80 105 28-13 29 14 14 91-42 21-44-21Z" fill="${id==='ashknight'?'#4a443f':'#263443'}" stroke="${c}" stroke-width="1.5"/><path d="m83 107 25 40 28-40-8 58-20 18-21-18Z" fill="${c}" opacity=".35"/><path d="m79 52 29-19 29 19-5 42-24 20-25-20Z" fill="#293b45" stroke="${c}" stroke-width="2"/><path d="m83 68 25 10 25-10-8 22-17 9-17-9Z" fill="#101d29"/><path d="m88 79 12 3m16 0 12-3" stroke="${c}" stroke-width="3"/><path d="m85 42-8-23 24 14 7-21 9 21 23-14-9 23" fill="${c}" opacity=".8"/><path d="m84 167-9 49h27l6-33 8 33h27l-10-49" fill="#29363e"/><path d="m74 111-21 12-19 39 15 9 29-38m60-22 19 13 17 31-13 8-27-32" fill="${c}" opacity=".65"/>${symbol}<path d="m109 122 8 13-8 14-8-14Z" fill="${c}"/><circle cx="41" cy="73" r="2" fill="${c}"/><circle cx="165" cy="110" r="1.5" fill="${c}"/></svg>`;
}
export function towerArt() {
  let floors='';
  for(let i=0;i<6;i++){
    const y=435-i*53,w=154-i*13,x=300-w/2;
    floors+=`<g><path d="M${x} ${y-45}h${w}v46l-${w/2} 18-${w/2}-18Z" fill="${i%2?'#273d41':'#2c4244'}"/><path d="m300 ${y-45} ${w/2} 0v46L300 ${y+19}Z" fill="#182d34" opacity=".8"/><path d="m${x-14} ${y-47} ${w/2+14}-17 ${w/2+14} 17-14 12-${w/2} 15-${w/2}-15Z" fill="#49615b"/><path d="m${x-14} ${y-47} ${w/2+14} 17 ${w/2+14}-17M300 ${y-30}v14" stroke="#91a081" stroke-width="1" opacity=".45"/><path d="M${x+22} ${y-18}q0-14 8-14t8 14v13l-16-4Zm${w-59} 3q0-14 7-14t7 14v10l-14 5Z" fill="#b8c8a2" opacity="${.4+i*.08}"/><path d="M${x} ${y+1} 300 ${y+18} ${x+w} ${y+1}" fill="none" stroke="#57766b" stroke-width="1.3"/></g>`;
  }
  return `<svg data-model-type="tower" data-model-id="tower" class="tower-art" viewBox="0 0 600 640" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="aura"><stop stop-color="#72baa4" stop-opacity=".2"/><stop offset="1" stop-color="#72baa4" stop-opacity="0"/></radialGradient><linearGradient id="rock" x2=".4" y2="1"><stop stop-color="#354f4b"/><stop offset="1" stop-color="#101c28"/></linearGradient><linearGradient id="beam" x2="0" y2="1"><stop stop-color="#9ed8bd" stop-opacity=".5"/><stop offset="1" stop-color="#9ed8bd" stop-opacity="0"/></linearGradient></defs>
  <circle cx="300" cy="265" r="255" fill="url(#aura)"/><circle cx="300" cy="260" r="186" fill="none" stroke="#7aa58b" opacity=".12"/><circle cx="300" cy="260" r="160" fill="none" stroke="#7aa58b" stroke-dasharray="2 14" opacity=".2"/>
  <path d="M65 362 112 201l45 128 29-66 33 135m164 0 45-162 43 65 34-129 47 210" fill="#1b3035" opacity=".45"/><path d="m1 479 87-71 76 48 65-52 102 63 98-72 91 48 80-29v178H0Z" fill="#1c3236" opacity=".55"/>
  <path d="m142 472 72-39 172 1 75 45-25 45-71 33-65 64-53-50-77-42Z" fill="url(#rock)"/><path d="m142 472 103 29 55 120-53-50-77-42Zm319 7-95 35-66 107 65-64 71-33Z" fill="#172a32"/><path d="m142 472 158-53 161 60-160 54Z" fill="#3b5550"/><path d="m164 467 137-41 135 52-136 44Z" fill="#4a6559"/><path d="m186 474 114-32 104 35-103 38Z" fill="#253c3f"/>
  <ellipse cx="299" cy="501" rx="149" ry="29" fill="none" stroke="#b1bd8d" stroke-width="1" opacity=".4"/><path d="m265 524 17 21h36l20-14m-57 14-17 11 14 12h30" fill="none" stroke="#577567" stroke-width="5"/>
  ${floors}
  <path d="m254 128 46-29 46 29-46 18Z" fill="#6d8571"/><path d="M264 126V92l36-50 36 50v34l-36 14Z" fill="#304d47"/><path d="m300 42 36 50v34l-36 14Z" fill="#203b3d"/><path d="m253 91 47-64 47 64-47 16Z" fill="#758d70"/><path d="m300 27 47 64-47 16Z" fill="#45695a"/><path d="M295 87v35l10-3V84Z" fill="#d4e7b2"/><path d="M300 28V6" stroke="#c1d6a2" stroke-width="2"/>
  <path d="M267 469v-31q0-33 33-33t33 33v31l-33 12Z" fill="#122b2e" stroke="#81977a" stroke-width="3"/><path d="M281 465v-27q0-21 19-21t19 21v27l-19 7Z" fill="#90c7a4" opacity=".6"/><path d="M298 425v41" stroke="#d6e6b8" stroke-width="2"/>
  <g fill="#8cbda2"><path d="m107 306 10 20-10 27-9-27Z" opacity=".65"/><path d="m487 365 7 13-7 19-7-19Z" opacity=".5"/><path d="m402 170 7 14-7 19-7-19Z" opacity=".6"/><path d="m190 119 4 8-4 10-4-10Z" opacity=".7"/></g>
  <g fill="#cfdfac"><circle cx="195" cy="254" r="1.6"/><circle cx="400" cy="309" r="1.8"/><circle cx="231" cy="71" r="1.5"/><circle cx="378" cy="89" r="1"/><circle cx="459" cy="228" r="1.4"/><circle cx="171" cy="375" r="1.7"/><circle cx="357" cy="393" r="1.1"/><circle cx="245" cy="363" r="1.4"/></g>
  <path d="M199 471q-45 10-87 2m272 27q76 17 124-9M80 515q54 18 125 9m179 31q59-5 76-25" fill="none" stroke="#93beaa" opacity=".17" stroke-width="7" stroke-linecap="round"/>
  </svg>`;
}
