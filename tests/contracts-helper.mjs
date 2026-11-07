import * as E from '../js/engine.mjs';

export const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
export function offer({engine=E,floor=5,seed=42,team=['rook','aerin','lumi']}={}){
  const s=engine.createState();s.welcome=true;s.team=[...team];
  for(const id of team)s.owned[id]??={level:1,copies:0,awaken:0};
  engine.startRun(s,seed);delete s.run.balanceRules;delete s.run.anomalyRules;delete s.run.anomalyOrder;boss(s,floor,engine);return s;
}
export function boss(s,floor,engine=E){
  const r=s.run;Object.assign(r,{floor,cleared:floor-1,map:null,phase:'route',node:null,battle:null,victory:null,lastReward:null,routes:['boss']});
  engine.chooseRoute(s,0);r.battle.enemies[0].hp=1;
  engine.playerAction(s,r.heroes.find(h=>h.hp>0).id,'enemy0');engine.dismissVictory(s);return s;
}
export function sign(s,id){
  E.selectContract(s,id,s.run.floor);
  if(s.run.phase==='relic')E.selectRelic(s,s.run.relicChoices[0]);
  if(s.run.phase==='blessing')E.selectBlessing(s,s.run.choices[0]);return s;
}
export function combat(ids=[],{team=['rook','aerin','lumi'],node='battle',seed=42}={}){
  const s=offer({team,seed});
  if(!ids.length)sign(s,null);
  for(const [i,id] of ids.entries()){if(i)boss(s,5*(i+1));sign(s,id);}
  const r=s.run;r.relics=[];r.buffs=[];delete r.eliteRules;
  Object.assign(r,{phase:'route',node:null,routes:[node]});E.chooseRoute(s,0);
  for(const h of r.heroes)Object.assign(h,{atk:100,def:0,maxHp:1000,hp:900,energy:100,shield:0,loadout:null,talents:null,awaken:0});
  for(const e of r.battle.enemies)Object.assign(e,{...(node==='boss'?{}:{hp:1000000,maxHp:1000000}),atk:100,def:0,shield:0,intent:0,freeze:0});
  return s;
}
export function neutral(s){const out=structuredClone(s);out.run.contracts=[];delete out.lockedGear;delete out.gearPresets;if(JSON.stringify(out.refining)===JSON.stringify({rolls:0,pending:null}))delete out.refining;if(JSON.stringify(out.loginRewards)===JSON.stringify({lastDay:null,streak:0,totalClaims:0}))delete out.loginRewards;if(JSON.stringify(out.season)===JSON.stringify({anchor:null,lastDay:null,wallet:0,fragments:{astra:0,nyx:0},cosmetics:[],aura:false,current:null}))delete out.season;return out;}
export const atomic=(s,fn)=>{const before=structuredClone(s);try{fn();throw new Error('Expected rejection');}catch(error){if(error.message==='Expected rejection')throw error;}if(JSON.stringify(s)!==JSON.stringify(before))throw new Error('Rejected action changed state');};
