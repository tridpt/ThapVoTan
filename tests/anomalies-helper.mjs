import * as E from '../js/engine.mjs';

export function condition(r,id){
  const ids=E.ANOMALIES.map(a=>a.id),slot=Math.floor((r.floor-1)/5)%3;
  r.anomalyRules=1;r.anomalyOrder=ids.filter(a=>a!==id);r.anomalyOrder.splice(slot,0,id);return r;
}
export function neutral(s){const out=structuredClone(s);delete out.run.anomalyRules;delete out.run.anomalyOrder;delete out.lockedGear;delete out.gearPresets;if(JSON.stringify(out.refining)===JSON.stringify({rolls:0,pending:null}))delete out.refining;if(JSON.stringify(out.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete out.loginRewards;if(JSON.stringify(out.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete out.season;return out;}
export const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
export function encounter(id,{floor=1,node='battle',seed=42,team=['rook','aerin','lumi'],prepare=null}={}){
  const s=E.createState();s.welcome=true;s.team=[...team];for(const h of team)s.owned[h]??={level:1,copies:0,awaken:0};
  E.startRun(s,seed);delete s.run.balanceRules;Object.assign(s.run,{floor,cleared:floor-1,map:null,routes:[node]});condition(s.run,id);prepare?.(s.run,s);E.chooseRoute(s,0);return s;
}
export function combat(id,options={}){
  const s=encounter(id,options),r=s.run;r.relics=[];r.buffs=[];delete r.eliteRules;r.resonances=[];
  for(const h of r.heroes)Object.assign(h,{atk:100,def:0,maxHp:1000,hp:700,energy:100,shield:0,loadout:null,talents:null,awaken:0});
  for(const e of r.battle.enemies)Object.assign(e,{hp:1000000,maxHp:1000000,atk:100,def:0,shield:0,intent:0,freeze:0});return s;
}
export function step(engine,s){
  const r=s.run;if(engine.victoryPending(r)){engine.dismissVictory(s);return 'victory';}
  if(r.phase==='route'){const i=r.routes.findIndex(n=>n==='battle'||n==='boss');engine.chooseRoute(s,i<0?0:i);return 'route';}
  if(r.phase==='contract'){engine.selectContract(s,engine.availableContracts(r)[0]?.id??null,r.floor);return 'contract';}
  if(r.phase==='relic'){engine.selectRelic(s,r.relicChoices[0]);return 'relic';}
  if(r.phase==='blessing'){engine.selectBlessing(s,['renew','might','vitality','armor','focus'].find(id=>r.choices.includes(id))||r.choices[0]);return 'blessing';}
  if(r.phase==='event'){engine.chooseEvent(s,'leave');return 'event';}
  if(r.phase!=='battle')throw new Error('Unexpected phase '+r.phase);
  const target=engine.autoEnemyTarget(r),h=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),pair=engine.recommendedLink(r);
  if(engine.shouldUsePet(r)){engine.petAction(s);return 'pet';}
  if(pair){engine.linkAction(s,...pair.ids,target.id);return 'link';}
  if(h){engine.playerAction(s,h.id,target.id,h.energy>=100&&(!['lumi','eira'].includes(h.id)||r.heroes.some(a=>a.hp/a.maxHp<.8)));return 'hero';}
  engine.enemyTurn(s);return 'enemy';
}
