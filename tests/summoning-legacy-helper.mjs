import * as V16 from '../artifacts/qa/summon-legacy-v1.21.0/engine.mjs';
import * as V19 from '../artifacts/qa/summon-legacy-v1.24.0/engine.mjs';
import {HEROES} from '../js/data.mjs';

function clear(Old,s){
  let n=0;while(s.run.phase==='battle'&&n++<100){const r=s.run,h=r.heroes.find(v=>v.hp>0&&!r.battle.used.includes(v.id)),enemy=r.battle.enemies.find(v=>v.hp>0);if(h)Old.playerAction(s,h.id,enemy.id,false,enemy.kind==='boss'?Old.recommendedBossPart(r):null);else Old.enemyTurn(s);}
  if(s.run.phase==='battle')throw new Error('Legacy battle did not end');
}
function power(s){for(const h of s.run.heroes)h.atk=100000;if(s.run.raid)for(const team of s.run.raid.teams)for(const h of team.heroes)h.atk=100000;}
function account(Old){const s=Old.createState();s.gold=100000;s.shards=777;s.tickets=100;Old.summon(s,10,()=>.99);s.pity=31;s.srPity=6;for(const r of Object.keys(s.highPity))s.highPity[r]=17;return s;}
function scenario(Old,kind){
  const s=account(Old);if(kind==='gacha-ledger')return s;
  if(kind.startsWith('tower')){Old.startRun(s,42);if(kind!=='tower-route')Old.chooseRoute(s,0);if(kind==='tower-result')Old.finishRun(s);return s;}
  if(kind.startsWith('hunt')){Old.startHunt(s,'colossus',1,42);if(kind==='hunt-loot'){power(s);clear(Old,s);Old.advanceVictory(s);}return s;}
  for(const h of HEROES)s.owned[h.id]={level:50,copies:0,awaken:0};Old.autoRaidTeams(s);
  const dragon=kind.startsWith('dragon'),boss=dragon?'void-dragon':'tam-an';if(dragon)for(const i of [0,1])s.raids.records[i]={clears:1,bestRounds:15,fullParty:false,claimed:[]};
  Old.startRaid(s,1,42,boss);if(kind.endsWith('battle'))return s;
  power(s);clear(Old,s);if(kind.endsWith('relay'))return s;Old.dismissVictory(s);if(kind.endsWith('relay-done'))return s;Old.continueRaid(s,0);if(kind.endsWith('stage-two'))return s;
  clear(Old,s);Old.dismissVictory(s);Old.continueRaid(s,1);if(kind.endsWith('stage-three'))return s;clear(Old,s);
  if(kind.endsWith('loot'))Old.advanceVictory(s);else if(kind.endsWith('claimed')){Old.dismissVictory(s);Old.claimAllRaidMissions(s,1,boss);}return s;
}
export function legacySummonCases(){
  return [
    ...['gacha-ledger','tower-route','tower-battle','tower-result','hunt-battle','hunt-loot'].map(kind=>({Old:V16,version:16,kind})),
    ...['gacha-ledger','tower-route','tower-battle','tower-result','hunt-loot','raid-battle','raid-relay','raid-relay-done','raid-loot','dragon-battle','dragon-relay','dragon-stage-two','dragon-stage-three','dragon-loot','dragon-claimed'].map(kind=>({Old:V19,version:19,kind}))
  ].map(v=>({...v,create:()=>scenario(v.Old,v.kind)}));
}
