import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../js/engine.mjs';
import {HERO,HEROES,RARITY,RARITIES,HIGH_PITY,AWAKENING,rarityRank} from '../js/data.mjs';
import {heroArt} from '../js/art.mjs';
import {rarityPity,rarityGallery,portalContent,showcaseContent,bestPull} from '../js/rarity-ui.mjs';

const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function heroRng(id){
  const h=HERO[id],pool=HEROES.filter(a=>a.rarity===h.rarity);
  const prior=[...RARITIES].reverse().filter(r=>rarityRank(r)>rarityRank(h.rarity)).reduce((v,r)=>v+RARITY[r].rate,0);
  let calls=0;return ()=>calls++%2===0?(prior+RARITY[h.rarity].rate/2)/100:(pool.indexOf(h)+.2)/pool.length;
}
function abilityBattle(id,awaken=0,mode='normal'){
  const s=E.createState();s.owned[id]||={level:1,copies:0,awaken:0};s.owned[id].awaken=awaken;
  s.team=[id,'rook','aerin'];
  if(mode==='iron')E.startChallenge(s,'iron',new Date(2026,9,20));else E.startRun(s,987654);
  E.chooseRoute(s,0);const r=s.run;
  for(const h of r.heroes){h.energy=100;h.hp=1;}
  for(const e of r.battle.enemies){e.hp=e.maxHp=10000;e.def=0;}
  return s;
}

test('seven ordered rarity tiers have populated pools, complete traits and rates totaling 100%',()=>{
  assert.deepEqual(RARITIES,['R','SR','SSR','UR','LR','MR','EX']);assert.equal(HEROES.length,20);
  assert.equal(Object.values(RARITY).reduce((sum,r)=>sum+r.rate,0),100);
  for(const [i,r] of RARITIES.entries()){
    assert.equal(rarityRank(r),i);assert.ok(HEROES.some(h=>h.rarity===r));
    for(const h of HEROES.filter(h=>h.rarity===r))assert.ok(AWAKENING[h.id]?.desc);
  }
});

test('10000 stratified rolls match the published base rates exactly before pity',()=>{
  const s=E.createState();s.tickets=10000;const counts=Object.fromEntries(RARITIES.map(r=>[r,0]));
  for(let i=0;i<10000;i++){
    s.pity=s.srPity=0;for(const r of Object.keys(HIGH_PITY))s.highPity[r]=0;
    let n=0;counts[E.summon(s,1,()=>n++===0?(i+.5)/10000:.1)[0].rarity]++;
  }
  for(const r of RARITIES)assert.equal(counts[r],RARITY[r].rate*100,r);
  copy(s);
});

test('rarity boundaries include the lower edge and exclude the upper edge',()=>{
  const descending=[...RARITIES].reverse();let lower=0;
  for(const [i,r] of descending.entries()){
    for(const roll of [lower/100,(lower+RARITY[r].rate-1e-8)/100]){
      const s=E.createState();assert.equal(E.summon(s,1,()=>roll)[0].rarity,r);
    }
    lower+=RARITY[r].rate;
    if(i<descending.length-1){const s=E.createState();assert.equal(E.summon(s,1,()=>(lower+1e-8)/100)[0].rarity,descending[i+1]);}
  }
});

test('every hero is summonable; all rarities retain exact duplicate and awakening rewards',()=>{
  for(const h of HEROES){
    const s=E.createState(),rng=heroRng(h.id);delete s.owned[h.id];
    const first=E.summon(s,1,rng)[0];assert.equal(first.id,h.id);assert.equal(first.isNew,true);
    const before={gold:s.gold,shards:s.shards};const second=E.summon(s,1,rng)[0];assert.equal(second.isNew,false);
    assert.equal(s.gold-before.gold,RARITY[h.rarity].gold);assert.equal(s.shards-before.shards,RARITY[h.rarity].shards);
    assert.deepEqual(s.owned[h.id],{level:1,copies:1,awaken:0});
    s.gold+=1000;E.awakenHero(s,h.id);assert.equal(s.owned[h.id].awaken,1);
    // Restore a valid team when deliberately removing a starter for the first draw.
    copy(s);
  }
});

test('each high-tier guarantee promotes a low roll and resets exactly the eligible counters',()=>{
  for(const [tier,cap] of Object.entries(HIGH_PITY)){
    const s=E.createState();s.pity=49;s.srPity=9;s.highPity[tier]=cap-1;
    const result=E.summon(s,1,()=>.99)[0];assert.equal(result.rarity,tier);
    assert.equal(s.pity,0);assert.equal(s.srPity,0);
    for(const r of Object.keys(HIGH_PITY))assert.equal(s.highPity[r],rarityRank(r)<=rarityRank(tier)?0:1);
    copy(s);
  }
});

test('simultaneous guarantees use the highest tier and never downgrade a natural result',()=>{
  for(const natural of ['aion','lyra','eira']){
    const s=E.createState();s.pity=49;s.srPity=9;s.highPity.UR=119;
    assert.equal(E.summon(s,1,heroRng(natural))[0].id,natural);
  }
  const s=E.createState();s.pity=49;s.srPity=9;
  for(const [r,cap] of Object.entries(HIGH_PITY))s.highPity[r]=cap-1;
  assert.equal(E.summon(s,1,()=>.99)[0].rarity,'EX');assert.ok(Object.values(s.highPity).every(v=>v===0));
});

test('960 unlucky draws reach EX with all guarantees bounded and saveable along the way',()=>{
  let s=E.createState();s.tickets=960;let result;
  for(let i=0;i<96;i++){result=E.summon(s,10,()=>.99);s=copy(s);}
  assert.equal(result.at(-1).rarity,'EX');assert.equal(s.totalSummons,960);assert.equal(s.highPity.EX,0);assert.equal(s.tickets,0);
});

test('single pulls and ten-pulls share identical rolls, guarantees and rewards',()=>{
  const a=E.createState(),b=E.createState();a.tickets=b.tickets=1000;
  let x=8675309,y=x;const rng=key=>()=>{if(key==='a'){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/2**32;}y=(Math.imul(y,1664525)+1013904223)>>>0;return y/2**32;};
  const ra=rng('a'),rb=rng('b'),one=[],ten=[];
  for(let i=0;i<1000;i++)one.push(...E.summon(a,1,ra));
  for(let i=0;i<100;i++)ten.push(...E.summon(b,10,rb));
  assert.deepEqual(one,ten);assert.deepEqual(copy(a),copy(b));
});

test('v3 migration credits historical draws once, preserves progress and refreshes expired daily quests',()=>{
  const raw=JSON.parse(readFileSync(new URL('../artifacts/qa/browser-v1.2-baseline.json',import.meta.url),'utf8'));
  const old=raw.state||raw;old.version=3;delete old.highPity;
  const s=E.validateState(old);assert.equal(s.version,E.SAVE_VERSION);
  for(const key of Object.keys(old).filter(k=>!['version','run','daily','settings'].includes(k)))assert.deepEqual(s[key],old[key],key);
  assert.deepEqual(s.settings,{...old.settings,graphics:E.starterGraphics()});
  assert.deepEqual(s.daily,old.daily.day===E.dayKey()?old.daily:{day:E.dayKey(),battles:0,summons:0,runs:0,claimed:[]});
  const sameDay=structuredClone(old);sameDay.daily.day=E.dayKey();assert.deepEqual(E.validateState(sameDay).daily,sameDay.daily);
  assert.deepEqual(withoutCombatReport(s.run),withoutCombatReport({...old.run,map:null,formation:null,link:E.starterLink(),pet:null,dungeon:null,hunt:null,training:null,campaign:null,heroes:old.run.heroes.map(h=>({...h,loadout:null,talents:null}))}));
  for(const [r,cap] of Object.entries(HIGH_PITY))assert.equal(s.highPity[r],Math.min(old.totalSummons,cap-1));
  assert.deepEqual(copy(s),s);
  const veteran=structuredClone(old);veteran.totalSummons=5000;
  const v=E.validateState(veteran);assert.equal(E.summon(v,1,()=>.99)[0].rarity,'EX');
  assert.deepEqual(copy(v).highPity,v.highPity);
});

test('malformed high-tier guarantees are rejected without changing the input',()=>{
  for(const change of [s=>delete s.highPity,s=>s.highPity=[],s=>s.highPity.UR=120,s=>s.highPity.EX=-1,s=>s.highPity.MR=.5,s=>s.highPity.LR=NaN,s=>s.highPity.unknown=0]){
    const s=E.createState();change(s);const before=structuredClone(s);assert.throws(()=>E.validateState(s));assert.deepEqual(s,before);
  }
});

test('new heroes use their stated healing, damage, drain and shield coefficients',()=>{
  for(const id of ['veyron','solis','selene','orion','lyra','aion','eclipse']){
    const s=abilityBattle(id),h=s.run.heroes[0],def=HERO[id],events=E.playerAction(s,id,'enemy0',true);
    assert.equal(events[0].value,Math.round(h.atk*def.ability.mult*(E.hasResonance(s.run,'diverse')?1.08:1)*(events[0].crit?1.6:1)),id);
    if(def.ability.drain)assert.equal(h.hp,Math.min(h.maxHp,1+Math.round(events[0].value*def.ability.drain)));
    if(id==='orion')assert.ok(s.run.heroes.every(a=>a.shield===Math.round(h.maxHp*.32*1.25)),'Orion and Rook activate Earth resonance');
    copy(s);
  }
  const s=abilityBattle('eira'),allies=s.run.heroes;E.playerAction(s,'eira','enemy0',true);
  for(const h of allies)assert.equal(h.hp,1+Math.round(h.maxHp*.42));copy(s);
});

test('all eight new awakening traits affect battle and persist after resume',()=>{
  const eira=abilityBattle('eira',1);E.playerAction(eira,'eira','enemy0',true);assert.ok(eira.run.heroes.every(h=>h.shield===Math.round(h.maxHp*.1)));
  const veyron=abilityBattle('veyron',1);E.playerAction(veyron,'veyron','enemy0',true);assert.equal(veyron.run.heroes[0].energy,30);
  const solis=abilityBattle('solis',1);E.playerAction(solis,'solis','enemy0',true);assert.equal(solis.run.battle.enemies[0].burn,3);assert.equal(solis.run.battle.enemies[0].burnPower,Math.round(solis.run.heroes[0].atk*.35));
  const selene=abilityBattle('selene',1);E.playerAction(selene,'selene','enemy0',true);assert.equal(selene.run.heroes[0].shield,Math.round(selene.run.heroes[0].maxHp*.18));
  const orion=abilityBattle('orion',1);orion.run.heroes.forEach(h=>h.energy=0);orion.run.heroes[0].energy=100;E.playerAction(orion,'orion','enemy0',true);assert.ok(orion.run.heroes.every(h=>h.energy===20));
  const lyra=abilityBattle('lyra',1);E.playerAction(lyra,'lyra','enemy0',true);assert.ok(lyra.run.heroes.every(h=>h.hp===1+Math.round(h.maxHp*.1)));
  const base=abilityBattle('aion',0),aion=abilityBattle('aion',1);aion.run.heroes[0].atk=base.run.heroes[0].atk;
  for(const s of [base,aion])s.run.battle.enemies[0].kind='boss';
  const normal=E.playerAction(base,'aion','enemy0',true)[0].value,boost=E.playerAction(aion,'aion','enemy0',true)[0].value;assert.ok(boost>=normal*1.23);
  const eclipse=abilityBattle('eclipse',1);E.playerAction(eclipse,'eclipse','enemy0',true);assert.equal(eclipse.run.battle.enemies[0].freeze,1);
  for(const s of [eira,veyron,solis,selene,orion,lyra,aion,eclipse])copy(s);
});

test('new healer respects no-revival and new awakening upgrades preserve active snapshots',()=>{
  const s=abilityBattle('eira',1,'iron');s.run.heroes[1].hp=0;E.playerAction(s,'eira','enemy0',true);assert.equal(s.run.heroes[1].hp,0);assert.equal(s.run.heroes[1].shield,0);
  s.owned.eira.copies=5;s.gold=10000;const old=structuredClone(s.run.heroes);E.awakenHero(s,'eira');E.upgradeHero(s,'eira');assert.deepEqual(s.run.heroes,old);copy(s);
});

test('visual previews expose every rarity without mutating gameplay and gear keeps its own tiers',()=>{
  const s=E.createState(),before=structuredClone(s);rarityPity(s);rarityGallery();
  for(const r of RARITIES){const h=HEROES.find(h=>h.rarity===r),art=heroArt(h);assert.ok(art.includes('tier-'+r));assert.ok(portalContent(r,true).includes('XEM TRƯỚC'));assert.ok(showcaseContent(h.id).includes(h.name));}
  assert.deepEqual(s,before);assert.equal(bestPull([{rarity:'SSR'},{rarity:'EX'},{rarity:'UR'}]).rarity,'EX');
  const bad=structuredClone(s);bad.inventory[0].rarity='UR';assert.throws(()=>E.validateState(bad));
});
