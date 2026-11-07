import {createHash} from 'node:crypto';
import {HEROES} from '../js/data.mjs';
import {SIGNATURES} from '../js/armory-data.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

export function combatTrace(E,{id,seed,mode,index}){
  const s=E.createState();s.gold=100000;s.dust=10000;s.best=50;for(const hero of HEROES)s.owned[hero.id]={level:10,copies:0,awaken:1};for(const boss of Object.keys(s.armory.marks))s.armory.marks[boss]=100;
  s.team=[id,...['rook','ember','lumi','aerin'].filter(hero=>hero!==id).slice(0,2)];const sig=SIGNATURES[id];
  for(const slot of ['weapon','armor','charm']){const gear=E.forgeGear(s,slot==='weapon'?'signature-'+id:`set-${sig.set}-${slot}`);E.equipGear(s,gear.id,id);}
  s.adventure.equipped='mossling';for(let i=0;i<3;i++)E.learnTalent(s,id,'tempo');E.learnTalent(s,id,'nurture');E.learnTalent(s,id,'force');
  if(mode==='hunt')E.startHunt(s,['colossus','archivist','ashknight','moonwarden'][index%4],1,seed);
  else if(mode==='campaign'){s.campaign.cleared=2;E.startCampaign(s,3,seed);E.advanceCampaignStory(s,true);}
  else E.startRun(s,seed);
  // This immutable 1.18 baseline exercises journeys under their original rules.
  // New contract journeys have separate action, reward and resume coverage.
  if(mode==='normal'&&s.run.contractRules===1&&s.run.contracts.length===0&&s.run.contractOffer===null){delete s.run.contractRules;delete s.run.contracts;delete s.run.contractOffer;}
  // Opt out of 1.47 early-floor balancing and 1.34 conditions before exercising the immutable 1.18 journey rules.
  if(mode==='normal'){delete s.run.balanceRules;delete s.run.anomalyRules;delete s.run.anomalyOrder;}
  const trace=[],record=action=>{const value=withoutCombatReport(s);delete value.version;value.daily.day='fixed';value.run.started=123;trace.push({action,sha256:createHash('sha256').update(JSON.stringify(value)).digest('hex')});};
  record('start');for(let step=0;step<45;step++){
    const r=s.run;if(r.phase==='result')break;
    if(r.phase==='route'){const route=r.routes.findIndex(n=>n==='battle'||n==='boss'||n==='elite');E.chooseRoute(s,route>=0?route:0);record('route');}
    else if(r.phase==='relic'){E.selectRelic(s,r.relicChoices[0]);record('relic');}
    else if(r.phase==='blessing'){E.selectBlessing(s,r.choices[0]);record('blessing');if(mode==='normal'&&r.floor>5)break;}
    else if(r.phase==='event'){E.chooseEvent(s,'leave');record('event');}
    else if(r.phase==='story'){E.advanceCampaignStory(s,true);record('story');}
    else if(r.phase==='battle'){
      const enemy=r.battle.enemies.find(e=>e.hp>0),actor=r.heroes.find(h=>h.hp>0&&!r.battle.used.includes(h.id)),pair=E.recommendedLink(r);let action;
      if(E.shouldUsePet(r)){E.petAction(s);action='pet';}
      else if(pair){E.linkAction(s,...pair.ids,enemy.id,E.bossParts(r)&&enemy.kind==='boss'?'arms':null);action='link';}
      else if(actor){E.playerAction(s,actor.id,enemy.id,actor.energy>=100,E.bossParts(r)&&enemy.kind==='boss'?'core':null);action=actor.id;}
      else {E.enemyTurn(s);action='enemy';}
      record(action);
    }
  }
  return trace;
}
export const traceScenarios=HEROES.flatMap((hero,index)=>[1,42,3735928559].map((seed,i)=>({id:hero.id,index,seed,mode:['normal','hunt','campaign'][i]})));
