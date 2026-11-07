import * as E from '../js/engine.mjs';
import {HEROES} from '../js/data.mjs';
export const DRAGON='void-dragon';
export const teams=[['rook','aerin','lumi'],['ember','kira','raiden'],['thorne','bryn','seraph']];
export const roundtrip=s=>E.validateState(JSON.parse(JSON.stringify(s)));
export function account({unlocked=true,level=50,scales=0}={}){
  const s=E.createState();s.welcome=true;s.gold=1000000;s.dust=100000;s.armory.essence=1000;
  for(const h of HEROES)s.owned[h.id]={level,copies:0,awaken:0};s.raids.teams=structuredClone(teams);
  if(unlocked)for(const tier of [0,1])s.raids.records[tier]={clears:1,bestRounds:15,fullParty:false,claimed:[]};
  if(scales){s.raids.dragon.records[0]={clears:scales,bestRounds:15,fullParty:false,claimed:[]};s.raids.dragon.scales=scales;}
  return s;
}
export function overpower(s,atk=100000){for(const t of s.run.raid.teams)for(const h of t.heroes)h.atk=atk;for(const h of s.run.heroes)h.atk=atk;}
export function clearStage(s){
  let count=0;while(s.run.phase==='battle'&&count++<100){const r=s.run,actor=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),enemy=r.battle.enemies.find(e=>e.hp>0);if(actor)E.playerAction(s,actor.id,enemy.id,false,enemy.kind==='boss'?E.recommendedBossPart(r):null);else E.enemyTurn(s);}
  if(s.run.phase==='battle')throw new Error('Stage did not end');
}
export function reachStage(s,stage){E.startRaid(s,1,42,DRAGON);overpower(s);for(let i=0;i<stage;i++){clearStage(s);E.dismissVictory(s);E.continueRaid(s,i);}return s;}
export function win(s,tier=1){E.startRaid(s,tier,42,DRAGON);overpower(s);for(let i=0;i<3;i++){clearStage(s);if(i<2){E.dismissVictory(s);E.continueRaid(s,i);}}return s;}
export function wearVoid(s,ids=s.team){for(const id of ids)for(const slot of ['weapon','armor','charm']){const g=E.forgeGear(s,'set-void-'+slot);E.equipGear(s,g.id,id);}}
export function sturdy(s){const e=s.run.battle.enemies[0];e.hp=e.maxHp=100000;e.atk=0;s.run.battle.bossState.parts=E.createBossParts(e);return e;}
