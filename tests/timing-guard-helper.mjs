import * as E from '../js/engine.mjs';
import {BOSS} from '../js/data.mjs';
import {condition} from './anomalies-helper.mjs';

export const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
export function guardBattle(id='colossus',move='quake',{anomaly=null,contracts=[]}={}){
  const s=E.createState();s.welcome=true;E.startRun(s,42);const r=s.run;
  Object.assign(r,{floor:5,cleared:4,map:null,routes:['boss']});
  if(anomaly)condition(r,anomaly);else{delete r.anomalyRules;delete r.anomalyOrder;}
  E.chooseRoute(s,0);r.buffs=[];r.relics=[];r.resonances=[];
  for(const h of r.heroes)Object.assign(h,{atk:100,def:0,maxHp:1000,hp:900,energy:20,shield:0,loadout:null,talents:null,awaken:0});
  const e=r.battle.enemies[0];Object.assign(e,{bossId:id,name:BOSS[id].name,hp:1000000,maxHp:1000000,atk:100,def:0,intent:0});
  Object.assign(r.battle.bossState,{id,move,parts:E.createBossParts(e)});
  r.contracts=contracts.map((id,i)=>({id,floor:5*(i+1)}));
  if(contracts.length){r.floor=5*(contracts.length+1);r.cleared=r.floor-1;if(anomaly)condition(r,anomaly);}
  return s;
}
export function guardedTurn(s,grade='perfect'){
  const receipt=E.beginTimingGuard(s);if(!receipt)throw new Error('Fixture has no guard opportunity');
  return E.enemyTurn(s,{...receipt,grade});
}
export const incoming=events=>events.filter(e=>['rook','aerin','lumi'].includes(e.target)&&!e.heal&&!e.shieldGrant);
