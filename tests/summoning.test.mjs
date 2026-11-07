import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import * as Old from '../artifacts/qa/summon-legacy-v1.24.0/engine.mjs';
import {HERO,HEROES,RARITY,RARITIES,HIGH_PITY,rarityRank} from '../js/data.mjs';
import * as UI from '../js/summoning-ui.mjs';
import {withoutCombatReport} from './legacy-report-helper.mjs';

export function heroRng(id){
  const h=HERO[id],pool=HEROES.filter(v=>v.rarity===h.rarity),higher=RARITIES.filter(r=>rarityRank(r)>rarityRank(h.rarity)).reduce((n,r)=>n+RARITY[r].rate,0);
  let calls=0;const rng=()=>calls++%2===0?(higher+RARITY[h.rarity].rate/2)/100:(pool.indexOf(h)+.25)/pool.length;
  rng.calls=()=>calls;return rng;
}
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function sequence(ids){const values=ids.flatMap(id=>{const rng=heroRng(id);return [rng(),rng()];});let i=0;return ()=>values[i++%values.length];}
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
const withoutSummoning=s=>{const c=withoutCombatReport(s);delete c.summoning;delete c.version;return c;};

test('a fresh account has independent opt-in contracts and no exchange rewards',()=>{
  const a=E.createState(),b=E.createState();assert.equal(a.version,E.SAVE_VERSION);assert.deepEqual(a.summoning,E.starterSummoning());assert.equal(E.summonFocusStatus(a),null);
  E.setSummonTarget(a,'astra');a.summoning.guaranteed.SSR=true;a.summoning.exchanged.push('aerin');assert.deepEqual(b.summoning,E.starterSummoning());
});

test('without a target 1000 real pulls match APK 1.24 results, RNG calls, resources and every old counter exactly',()=>{
  const old=Old.createState(),s=E.validateState(old);old.tickets=s.tickets=1000;let oldCalls=0,calls=0;const a=seeded(0x12345678),b=seeded(0x12345678);
  for(let n=0;n<100;n++)assert.deepEqual(E.summon(s,10,()=>{calls++;return a();}),Old.summon(old,10,()=>{oldCalls++;return b();}));
  assert.equal(calls,2000);assert.equal(calls,oldCalls);assert.deepEqual(withoutSummoning(s),withoutSummoning(old));assert.deepEqual(s.summoning,E.starterSummoning());
});

for(const rarity of RARITIES)test(`${rarity} target: miss, guaranteed unlock and guaranteed duplicate preserve rewards and use two RNG calls per pull`,()=>{
  const pool=HEROES.filter(h=>h.rarity===rarity),target=pool.at(-1),other=pool[0],s=E.createState(),rng=heroRng(other.id);
  E.setSummonTarget(s,target.id);const before=structuredClone(s);const miss=E.summon(s,1,rng)[0];assert.equal(miss.id,other.id);assert.deepEqual(miss.focus,{id:target.id,outcome:'miss'});assert.equal(s.summoning.guaranteed[rarity],true);assert.equal(s.owned[target.id],undefined);
  const hit=E.summon(s,1,rng)[0];assert.equal(hit.id,target.id);assert.equal(hit.isNew,true);assert.equal(hit.focus.outcome,'guaranteed');assert.equal(s.summoning.guaranteed[rarity],false);
  E.summon(s,1,rng);const wallet={gold:s.gold,shards:s.shards},otherCopies=s.owned[other.id].copies,dup=E.summon(s,1,rng)[0];
  assert.equal(dup.id,target.id);assert.equal(dup.isNew,false);assert.equal(dup.focus.outcome,'guaranteed');assert.equal(s.owned[target.id].copies,1);assert.equal(s.owned[other.id].copies,otherCopies);
  assert.equal(s.gold-wallet.gold,RARITY[rarity].gold);assert.equal(s.shards-wallet.shards,RARITY[rarity].shards);assert.equal(rng.calls(),8);assert.equal(s.tickets,before.tickets-4);assert.equal(s.totalSummons,4);assert.equal(s.daily.summons,4);assert.deepEqual(copy(s),s);
});

test('a natural target hit starts no guarantee and can award a normal duplicate',()=>{
  const s=E.createState();E.setSummonTarget(s,'aerin');const rng=heroRng('aerin'),p=E.summon(s,1,rng)[0];assert.equal(p.focus.outcome,'hit');assert.equal(p.isNew,false);assert.equal(s.owned.aerin.copies,1);assert.equal(s.summoning.guaranteed.SR,false);assert.equal(rng.calls(),2);
});

test('target contracts stay with each rarity through switching, opt-out, natural hits while opted out and reload',()=>{
  let s=E.createState();s.tickets=30;E.setSummonTarget(s,'astra');E.summon(s,1,heroRng('nyx'));E.setSummonTarget(s,'lyra');E.summon(s,1,heroRng('orion'));
  assert.equal(s.summoning.guaranteed.SSR,true);assert.equal(s.summoning.guaranteed.MR,true);const ledger=structuredClone(s.summoning.guaranteed),wallet=withoutSummoning(s);
  E.setSummonTarget(s,'kael');assert.deepEqual(s.summoning.guaranteed,ledger);assert.deepEqual(withoutSummoning(s),wallet);E.setSummonTarget(s,null);
  const opted=E.summon(s,1,heroRng('astra'))[0];assert.equal(Object.hasOwn(opted,'focus'),false);assert.deepEqual(s.summoning.guaranteed,ledger);s=copy(s);
  E.setSummonTarget(s,'kael');assert.equal(E.summon(s,1,heroRng('nyx'))[0].id,'kael');assert.equal(s.summoning.guaranteed.SSR,false);assert.equal(s.summoning.guaranteed.MR,true);
  E.setSummonTarget(s,'orion');assert.equal(E.summon(s,1,heroRng('lyra'))[0].id,'orion');assert.ok(Object.values(s.summoning.guaranteed).every(v=>!v));
});

test('rarity pity can open or redeem a contract; a higher result is never downgraded or charged to it',()=>{
  const s=E.createState();s.tickets=30;E.setSummonTarget(s,'astra');s.pity=49;let p=E.summon(s,1,()=>.99)[0];assert.equal(p.rarity,'SSR');assert.equal(p.id,'kael');assert.equal(p.focus.outcome,'miss');assert.equal(s.pity,0);
  s.pity=49;const high=E.summon(s,1,heroRng('aion'))[0];assert.equal(high.id,'aion');assert.equal(Object.hasOwn(high,'focus'),false);assert.equal(s.summoning.guaranteed.SSR,true);assert.equal(s.pity,0);
  const low=E.summon(s,1,heroRng('rook'))[0];assert.equal(low.id,'rook');assert.equal(s.summoning.guaranteed.SSR,true);
  s.pity=49;p=E.summon(s,1,()=>.99)[0];assert.equal(p.id,'astra');assert.equal(p.focus.outcome,'guaranteed');assert.equal(s.summoning.guaranteed.SSR,false);
  E.setSummonTarget(s,'eira');s.summoning.guaranteed.UR=true;s.highPity.LR=HIGH_PITY.LR-1;p=E.summon(s,1,()=>.99)[0];assert.equal(p.rarity,'LR');assert.equal(s.summoning.guaranteed.UR,true);assert.equal(p.focus,undefined);
});

test('SR pity passes over an R target without opening or spending its saved guarantee',()=>{
  const s=E.createState();E.setSummonTarget(s,'kira');s.summoning.guaranteed.R=true;s.srPity=9;assert.equal(E.summon(s,1,heroRng('rook'))[0].rarity,'SR');assert.equal(s.summoning.guaranteed.R,true);assert.equal(E.summon(s,1,heroRng('rook'))[0].id,'kira');
});

test('one and ten draws remain identical with targets for all seven tiers, including reloads between ten-pulls',()=>{
  for(const rarity of RARITIES){let a=E.createState(),b=E.createState();a.tickets=b.tickets=240;const id=HEROES.filter(h=>h.rarity===rarity).at(-1).id;E.setSummonTarget(a,id);E.setSummonTarget(b,id);const ra=seeded(42),rb=seeded(42),one=[],ten=[];
    for(let i=0;i<240;i++)one.push(...E.summon(a,1,ra));for(let i=0;i<24;i++){ten.push(...E.summon(b,10,rb));b=copy(b);}assert.deepEqual(ten,one,rarity);assert.deepEqual(b,a,rarity);
  }
  const s=E.createState();E.setSummonTarget(s,'astra');const pulls=E.summon(s,10,heroRng('nyx'));assert.equal(pulls.filter(p=>p.id==='astra').length,5);assert.equal(pulls.filter(p=>p.focus?.outcome==='guaranteed').length,5);assert.equal(s.summoning.guaranteed.SSR,false);
});

test('invalid target and pull requests are atomic, including an expired daily record',()=>{
  for(const id of ['constructor','__proto__','toString','unknown','',0,{},undefined]){const s=E.createState(),before=structuredClone(s);assert.throws(()=>E.setSummonTarget(s,id));assert.deepEqual(s,before);}
  for(const count of [0,2,9,-1,'1',NaN,10]){const s=E.createState();s.tickets=3;s.daily.day='2000-01-01';E.setSummonTarget(s,'astra');s.summoning.guaranteed.SSR=true;const before=structuredClone(s);assert.throws(()=>E.summon(s,count));assert.deepEqual(s,before);}
  const s=E.createState();s.summoning.target='constructor';const before=structuredClone(s);assert.throws(()=>E.summon(s));assert.deepEqual(s,before);
});

test('all seven exchange tiers charge the advertised currency once and unlock a level-one hero without rolling',()=>{
  for(const rarity of RARITIES){const s=E.createState(),id=HEROES.filter(h=>h.rarity===rarity).at(-1).id,cost=E.HERO_EXCHANGE_COST[rarity];assert.equal(E.heroExchangeCost(id),cost);s.shards=cost;
    const expected=structuredClone(s);expected.shards=0;expected.owned[id]={level:1,copies:0,awaken:0};expected.summoning.exchanged.push(id);
    assert.deepEqual(E.exchangeHero(s,id,cost),{id,cost});assert.deepEqual(s,expected);assert.deepEqual(copy(s),s);const before=structuredClone(s);assert.throws(()=>E.exchangeHero(s,id,cost),/đã sở hữu/);assert.deepEqual(s,before);
  }
});

test('exchange never changes active snapshots, saved guarantees, RNG, teams, duplicate copies or quest progress',()=>{
  for(const mode of ['tower','raid']){const s=E.createState();s.shards=5000;s.owned.rook.copies=9;E.setSummonTarget(s,'astra');s.summoning.guaranteed.SSR=true;
    if(mode==='tower'){E.startRun(s,42);E.chooseRoute(s,0);}else{for(const h of HEROES.slice(0,9))s.owned[h.id]={level:20,copies:0,awaken:0};E.autoRaidTeams(s);E.startRaid(s,1,42);}
    const expected=structuredClone(s),cost=E.heroExchangeCost('eclipse');expected.shards-=cost;expected.owned.eclipse={level:1,copies:0,awaken:0};expected.summoning.exchanged.push('eclipse');
    E.exchangeHero(s,'eclipse',cost);assert.deepEqual(s,expected);assert.deepEqual(copy(s),s);
  }
});

test('exchange validates ownership, quote, currency and hero IDs before any mutation',()=>{
  for(const [id,cost,shards] of [['astra',299,500],['astra','300',500],['astra',300,299],['rook',25,500],['constructor',0,500],['__proto__',0,500],['astra',300,NaN],['astra',300,1.5],['astra',300,Infinity],['astra',undefined,500]]){
    const s=E.createState();s.shards=shards;const before=structuredClone(s);assert.throws(()=>E.exchangeHero(s,id,cost));assert.deepEqual(s,before);
  }
});

test('a direct exchange of the selected target keeps its guarantee for future duplicates',()=>{
  const s=E.createState();s.shards=300;E.setSummonTarget(s,'astra');E.summon(s,1,heroRng('nyx'));E.exchangeHero(s,'astra',300);assert.equal(s.summoning.guaranteed.SSR,true);const p=E.summon(s,1,heroRng('kael'))[0];assert.equal(p.id,'astra');assert.equal(p.isNew,false);assert.equal(s.owned.astra.copies,1);assert.equal(p.focus.outcome,'guaranteed');
});

test('training clones cannot mutate gacha targets, exchange heroes or spend tickets through engine APIs',()=>{
  const s=E.createState();s.shards=5000;const training=E.createTrainingState(s),before=structuredClone(training);for(const fn of [()=>E.setSummonTarget(training,'astra'),()=>E.exchangeHero(training,'astra',300),()=>E.summon(training,1)]){assert.throws(fn,/phòng thử/);assert.deepEqual(training,before);}assert.equal(s.summoning.target,null);assert.equal(s.tickets,15);
});

test('current save validates the full contract and exchange ledger without silently repairing malformed fields',()=>{
  const alterations=[s=>delete s.summoning,s=>s.summoning=null,s=>s.summoning=[],s=>delete s.summoning.target,s=>s.summoning.extra=0,s=>s.summoning.target='constructor',s=>s.summoning.target='__proto__',s=>s.summoning.target=2,s=>delete s.summoning.guaranteed,s=>s.summoning.guaranteed=[],s=>s.summoning.guaranteed.SSR=1,s=>s.summoning.guaranteed.EX=null,s=>delete s.summoning.guaranteed.R,s=>s.summoning.guaranteed.fake=false,s=>delete s.summoning.exchanged,s=>s.summoning.exchanged='astra',s=>s.summoning.exchanged=['astra'],s=>s.summoning.exchanged=['constructor'],s=>s.summoning.exchanged=['aerin','aerin']];
  for(const alter of alterations){const s=E.createState();alter(s);const before=structuredClone(s);assert.throws(()=>E.validateState(s),/triệu hồi/);assert.deepEqual(s,before);}
});

test('combat comparison projects out only the exact neutral contract, keeping nonempty progress visible',()=>{
  const s=E.createState();assert.equal(Object.hasOwn(withoutCombatReport(s),'summoning'),false);
  for(const change of [s=>E.setSummonTarget(s,'astra'),s=>s.summoning.guaranteed.EX=true,s=>s.summoning.exchanged.push('aerin'),s=>s.summoning.extra=0]){const value=E.createState();change(value);assert.deepEqual(withoutCombatReport(value).summoning,value.summoning);}
});

test('target details and shops cover 20 hero previews, exact rates, all prices and read-only locked states',()=>{
  const s=E.createState(),before=structuredClone(s);assert.equal((UI.summonFocusPicker(s).match(/data-action="summon-focus-preview"/g)||[]).length,20);
  for(const h of HEROES){const detail=UI.summonFocusDetail(s,h.id),cost=E.heroExchangeCost(h.id),exchange=UI.summonExchangeDialog(s,h.id);assert.match(detail,new RegExp(`data-model-id="${h.id}"`));assert.ok(detail.includes(h.skill));assert.match(detail,/data-action="preview-ultimate"/);assert.ok(exchange.includes(cost.toLocaleString('vi-VN')));assert.match(exchange,/data-cost="\d+" disabled/);}
  assert.match(UI.summonFocusDetail(s,'astra'),/33,333%/);assert.match(UI.summonFocusDetail(s,'astra'),/1% mỗi lượt/);assert.match(UI.summonFocusDetail(s,'aion'),/0,025%/);
  assert.match(UI.summonExchangeShop(s),/dùng chung với ấn ký và thức tỉnh/);assert.match(UI.summonExchangeEntry(s),/16 anh hùng/);assert.deepEqual(s,before);
  E.setSummonTarget(s,'astra');s.summoning.guaranteed.SSR=true;assert.match(UI.summonFocusPanel(s),/Đã lệch 1\/1/);assert.match(UI.summonFocusDetail(s,'kael'),/Bảo đảm SSR đã sẵn sàng/);assert.match(UI.summonFocusRules(),/chuyển bảo đảm cho tướng mới/);
});
