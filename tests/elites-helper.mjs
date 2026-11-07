import * as E from '../js/engine.mjs';

export const ELITE_SEEDS={guard:1,rebirth:2,rage:5};
export function encounter(trait='guard',{floor=11,node='elite',seed=ELITE_SEEDS[trait],engine=E,team=null}={}){
  const s=engine.createState();if(team){s.team=[...team];for(const id of team)s.owned[id]??={level:1,copies:0,awaken:0};}engine.startRun(s,seed);delete s.run.balanceRules;delete s.run.anomalyRules;delete s.run.anomalyOrder;
  Object.assign(s.run,{floor,map:null,routes:[node]});engine.chooseRoute(s,0);return s;
}
export const champion=s=>s.run.battle.enemies.find(e=>e.elite);
export const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
export function win(s,engine=E){
  for(const h of s.run.heroes){h.atk=100000;h.maxHp=h.hp=100000;}
  let steps=0;
  while(s.run.phase==='battle'&&steps++<30){
    const h=s.run.heroes.find(h=>h.hp>0&&!s.run.battle.used.includes(h.id)),e=s.run.battle.enemies.find(e=>e.hp>0);
    if(h)engine.playerAction(s,h.id,e.id);else engine.enemyTurn(s);
  }
  if(s.run.phase==='battle')throw new Error('Test encounter did not finish.');return s;
}
