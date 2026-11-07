import {withoutCombatReport} from './legacy-report-helper.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {SKINS} from '../js/skins.mjs';
import {wardrobePage,heroSkinEntry} from '../js/skins-ui.mjs';
import {heroArt} from '../js/art.mjs';
import {HERO} from '../js/data.mjs';
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function unlock(){const s=E.createState();s.best=10;s.armory.hunts.colossus={best:1,clears:3};s.armory.hunts.ashknight={best:1,clears:3};return s;}
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}
function win(s,id,tier=1){E.startHunt(s,id,tier,42);s.run.heroes[0].atk=100000;E.playerAction(s,'rook','enemy0');assert.equal(s.run.summary.reason,'victory');}

test('tower costume milestones unlock only after the exact floor is completed',()=>{
  const s=E.createState();E.startRun(s,42);Object.assign(s.run.heroes[0],{atk:100000,hp:100000,maxHp:100000});
  for(let floor=1;floor<=10;floor++){
    const r=s.run;assert.equal(r.floor,floor);E.chooseRoute(s,r.routes.findIndex(n=>n==='battle'||n==='boss'));
    while(r.phase==='battle'){if(r.battle.used.includes('rook'))E.enemyTurn(s);if(r.phase==='battle')E.playerAction(s,'rook',r.battle.enemies.find(e=>e.hp>0).id);}
    if(r.phase==='contract')E.selectContract(s,null,r.floor);
    if(r.phase==='relic')E.selectRelic(s,r.relicChoices[0]);
    assert.equal(s.best,floor-1);assert.equal(E.skinProgress(s,'rook-guardian').unlocked,floor>5);
    E.selectBlessing(s,r.choices[0]);assert.equal(s.best,floor);
    assert.equal(E.skinProgress(s,'rook-guardian').unlocked,floor>=5);
    assert.equal(E.skinProgress(s,'aerin-moon').unlocked,floor>=10);
  }
  assert.equal(E.skinProgress(s,'lumi-dawn').unlocked,false);assert.equal(E.skinProgress(s,'ember-phoenix').unlocked,false);copy(s);
});

test('three actual hunt victories unlock the matching costume across difficulties without consuming progress',()=>{
  const s=E.createState();
  for(const [boss,skin] of [['colossus','lumi-dawn'],['ashknight','ember-phoenix']]){
    for(const [i,tier] of [1,2,1].entries()){win(s,boss,tier);assert.equal(E.skinProgress(s,skin).current,i+1);assert.equal(E.skinProgress(s,skin).unlocked,i===2);copy(s);}
    const before=structuredClone(s.armory);E.equipSkin(s,E.SKIN[skin].hero,skin);assert.deepEqual(s.armory,before);
  }
  assert.equal(s.best,0);assert.equal(E.skinProgress(s,'rook-guardian').unlocked,false);copy(s);
});

test('retreating and winning a training simulation cannot unlock costumes on the real account',()=>{
  const s=E.createState();E.startHunt(s,'colossus',1,42);E.finishRun(s);assert.equal(s.armory.hunts.colossus.clears,0);
  const before=structuredClone(s),practice=E.createTrainingState(s);practice.run.heroes[0].atk=100000;E.playerAction(practice,'rook','enemy0');
  assert.equal(practice.run.phase,'result');assert.equal(practice.armory.hunts.colossus.clears,0);assert.deepEqual(s,before);assert.ok(SKINS.every(v=>!E.skinProgress(s,v.id).unlocked));
});

test('equipping during a live journey changes only account appearance and preserves deterministic combat',()=>{
  const s=unlock();E.startHunt(s,'ashknight',1,73);E.playerAction(s,'rook','enemy0');const plain=structuredClone(s),before=structuredClone(s);
  for(const skin of SKINS)E.equipSkin(s,skin.hero,skin.id);
  assert.deepEqual({...s,skins:before.skins},before);assert.deepEqual(s.run,before.run);
  for(const hero of s.run.heroes){assert.deepEqual(E.heroStats(s,hero.id),E.heroStats(plain,hero.id));}
  E.playerAction(s,'aerin','enemy0');E.playerAction(plain,'aerin','enemy0');E.enemyTurn(s);E.enemyTurn(plain);assert.deepEqual(s.run,plain.run);
  assert.deepEqual(copy(s),s);E.equipSkin(s,'rook',null);assert.equal(s.skins.rook,null);assert.deepEqual(s.run,plain.run);
});

test('locked, wrong-hero, malformed and unowned equip requests reject without partial writes',()=>{
  const s=E.createState();
  for(const [hero,id] of [['rook','rook-guardian'],['rook','aerin-moon'],['rook','constructor'],['rook',['rook-guardian']],['rook',undefined],['constructor',null],['aion',null]])atomic(s,()=>E.equipSkin(s,hero,id));
  s.best=10;delete s.owned.ember;atomic(s,()=>E.equipSkin(s,'ember','ember-phoenix'));E.equipSkin(s,'rook','rook-guardian');assert.equal(s.skins.rook,'rook-guardian');
});

test('v13 validates exact costume keys, matching heroes and permanent unlocks, keeping imports atomic',()=>{
  const valid=unlock();for(const skin of SKINS)E.equipSkin(valid,skin.hero,skin.id);assert.deepEqual(copy(valid),valid);
  const bad=[s=>delete s.skins,s=>s.skins=[],s=>delete s.skins.rook,s=>s.skins.aion=null,s=>s.skins.rook='aerin-moon',s=>s.skins.rook='base',s=>s.skins.rook=undefined,s=>s.skins.rook=['rook-guardian'],s=>s.best=4,s=>s.armory.hunts.colossus.clears=2,s=>s.skins.rook='__proto__'];
  for(const alter of bad){const s=structuredClone(valid);alter(s);const before=structuredClone(s);assert.throws(()=>E.validateState(s));assert.deepEqual(s,before);}
});

test('v12 migration adds fresh cosmetic choices once and preserves every phase of the existing journey',()=>{
  for(const phase of ['route','battle','blessing','relic','event','story','result']){
    const s=unlock();E.startRun(s,42);E.chooseRoute(s,0);s.run.phase=phase;
    if(phase==='blessing')s.run.choices=['might','armor','energy'];
    if(phase==='relic')s.run.relicChoices=['lantern'];
    if(phase==='story'){s.run.phase='battle';E.finishRun(s);E.startCampaign(s,1,42);}
    if(phase==='result'){s.run.phase='battle';E.finishRun(s);}
    s.run.map=null;s.version=12;delete s.skins;const before=structuredClone(s),m=copy(s);
    assert.deepEqual(s,before);assert.deepEqual(withoutCombatReport(m.run),withoutCombatReport(s.run));assert.deepEqual(withoutCombatReport(m),withoutCombatReport({...s,version:E.SAVE_VERSION,skins:E.starterSkins()}));assert.deepEqual(copy(m),m);
  }
});

test('wardrobe previews locked outfits and the explicit base without changing the account',()=>{
  const s=E.createState(),before=structuredClone(s),html=wardrobePage(s,'ember');
  assert.match(html,/data-skin-preview="ember-phoenix"/);assert.match(html,/Chưa mở khóa/);assert.match(html,/aria-valuenow="0"/);assert.match(html,/data-page="hunts"/);
  assert.match(html,/data-action="skin-equip"[^>]*disabled/);assert.equal((html.match(/data-action="skin-select"/g)||[]).length,4);
  assert.match(wardrobePage(s,'ember',true),/data-skin-preview="base"/);assert.equal(heroSkinEntry(s,'aion'),'');assert.deepEqual(s,before);
  const ready=unlock();E.equipSkin(ready,'ember','ember-phoenix');assert.match(wardrobePage(ready,'ember'),/Đang mặc/);assert.match(wardrobePage(ready,'ember',true),/Mặc trang phục/);
});

test('SVG fallback changes costume silhouettes and palettes while retaining the hero skin tone and data',()=>{
  for(const skin of SKINS){const h=HERO[skin.hero],before=structuredClone(h),base=heroArt(h,'portrait',null),outfit=heroArt(h,'portrait',skin.id);assert.notEqual(outfit,base);assert.match(outfit,new RegExp(skin.color));assert.match(outfit,new RegExp(h.skin));assert.ok((outfit.match(/<path/g)||[]).length>(base.match(/<path/g)||[]).length);assert.deepEqual(h,before);}
});
