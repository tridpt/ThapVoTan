import {writeFileSync} from 'node:fs';
import * as Current from '../js/engine.mjs';
import * as Previous from '../artifacts/qa/balance-legacy-v1.46.0/js/engine.mjs';
import {HERO} from '../js/data.mjs';

const args=process.argv.slice(2),output=args[0]||'artifacts/qa/tower-balance-v1.47.json',seeds=Array.from({length:30},(_,i)=>i+1);
const weights={might:9,barrier:9,focus:8,armor:8,vitality:7,renew:6,energy:5,frost:5,flame:4,crit:4,vamp:3,execute:3,courage:2,fortune:1};
export function playTower(E,{seed=42,level=1,cap=20,gear=false}={}){
  const s=E.createState();for(const id of s.team)s.owned[id].level=level;
  if(gear){E.equipGear(s,'gear-1','aerin');E.equipGear(s,'gear-2','rook');E.equipGear(s,'gear-3','lumi');}
  E.startRun(s,seed);let steps=0,rounds=0;
  while(s.run.phase!=='result'&&s.run.floor<=cap&&steps++<4000){
    const r=s.run;
    if(E.victoryPending(r)){E.dismissVictory(s);continue;}
    if(r.phase==='route'){
      const injured=r.heroes.some(h=>h.hp/h.maxHp<.7),priority=injured?['rest','battle','treasure','event','elite','boss']:['battle','rest','treasure','event','elite','boss'];
      const node=priority.find(n=>r.routes.includes(n));E.chooseRoute(s,r.routes.indexOf(node));
    }else if(r.phase==='battle'){
      const actor=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),enemy=E.autoEnemyTarget(r),pair=E.recommendedLink(r),part=enemy?.kind==='boss'?E.recommendedBossPart(r):null;
      if(E.shouldUsePet(r))E.petAction(s);
      else if(pair)E.linkAction(s,...pair.ids,enemy.id,part);
      else if(actor){const skill=actor.energy>=100&&(HERO[actor.id].kind!=='heal'||r.heroes.some(h=>h.hp/h.maxHp<.8));E.playerAction(s,actor.id,enemy.id,skill,part);}
      else{rounds++;E.enemyTurn(s);}
    }else if(r.phase==='blessing'){const choice=[...r.choices].sort((a,b)=>weights[b]-weights[a])[0];E.selectBlessing(s,choice);}
    else if(r.phase==='relic')E.selectRelic(s,r.relicChoices.includes('root')?'root':r.relicChoices[0]);
    else if(r.phase==='contract')E.selectContract(s,null,r.floor);
    else if(r.phase==='event')E.chooseEvent(s,'risk');
    else throw new Error(`Unknown phase ${r.phase}`);
  }
  if(steps>=4000)throw new Error('Simulation did not end');
  E.validateState(s);
  return {seed,level,gear,cleared:Math.min(cap,s.run.summary?.cleared??s.run.cleared),floor:s.run.floor,reason:s.run.summary?.reason??'cap',gold:s.run.goldEarned,tickets:s.run.ticketsEarned,rounds,steps};
}
export function audit(){
  const scenarios=[{level:1,gear:false},{level:3,gear:true},{level:5,gear:true},{level:10,gear:true},{level:15,gear:true}];
  const results=scenarios.map(config=>{
    const releases=Object.fromEntries([['previous',Previous],['current',Current]].map(([label,E])=>{
      const runs=seeds.map(seed=>playTower(E,{...config,seed})),sorted=runs.map(r=>r.cleared).sort((a,b)=>a-b);
      return [label,{min:sorted[0],median:sorted[Math.floor(sorted.length/2)],max:sorted.at(-1),clears:Object.fromEntries([5,10,15,20].map(f=>[f,runs.filter(r=>r.cleared>=f).length])),meanGold:Math.round(runs.reduce((n,r)=>n+r.gold,0)/runs.length),runs}];
    }));return {...config,...releases};
  });
  const costs=Object.fromEntries([['previous',Previous],['current',Current]].map(([label,E])=>[label,[3,5,10,15,20].map(target=>{const s=E.createState();let gold=0;for(let level=1;level<target;level++){s.owned.rook.level=level;gold+=E.upgradeCost(s,'rook');}return {target,perHero:gold,team:gold*3};})]));
  return {seedCount:seeds.length,scenarioCount:results.length,pairedRuns:results.length*seeds.length,policy:'Auto combat; choose rest under 70% HP, else battle; fixed combat blessing priorities; refuse contracts; no gacha, payments, stat cheats or timed guard.',limits:'Offline deterministic simulations, not player telemetry or real-device play.',results,costs};
}
if(process.argv[1]?.endsWith('tower-balance-audit.mjs')){const result=audit();writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,results:result.results.map(({previous,current,...config})=>({...config,previous:{...previous,runs:undefined},current:{...current,runs:undefined}}))},null,2));}
