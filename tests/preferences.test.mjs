import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/engine.mjs';
import {teamPresetsPanel,graphicsSettingsPanel} from '../js/preferences-ui.mjs';
const copy=s=>E.validateState(JSON.parse(JSON.stringify(s)));
function atomic(s,fn){const before=structuredClone(s);assert.throws(fn);assert.deepEqual(s,before);}

test('all three presets capture independent teams and pets and can be applied, renamed and removed',()=>{
  const s=E.createState(),initial=structuredClone(s.team);for(let slot=0;slot<3;slot++){const p=E.saveTeamPreset(s,slot);assert.equal(p.name,E.PRESET_NAMES[slot]);p.team[0]='ember';assert.equal(s.presets[slot].team[0],initial[0]);}
  E.setTeamSlot(s,'ember',0);s.adventure.equipped=null;E.saveTeamPreset(s,1,'Đội lửa');assert.equal(s.presets[1].team[0],'ember');E.applyTeamPreset(s,0);assert.deepEqual(s.team,initial);assert.equal(s.adventure.equipped,'mossling');E.applyTeamPreset(s,1);assert.equal(s.team[0],'ember');assert.equal(s.adventure.equipped,null);E.renameTeamPreset(s,1,'  Về nhà  ');assert.equal(s.presets[1].name,'Về nhà');E.deleteTeamPreset(s,0);assert.equal(s.presets[0],null);assert.equal(s.presets[2].team[0],initial[0]);copy(s);
});

test('applying a preset rejects active journeys and expedition heroes before changing team or pet',()=>{
  const s=E.createState();E.setTeamSlot(s,'ember',0);E.saveTeamPreset(s,0);E.setTeamSlot(s,'rook',0);E.dispatchExpedition(s,'mist-path','ember',0,Date.now());atomic(s,()=>E.applyTeamPreset(s,0));assert.match(E.presetBlocker(s,0),/Ember/);E.recallExpedition(s,0);E.startRun(s,42);atomic(s,()=>E.applyTeamPreset(s,0));E.finishRun(s);E.applyTeamPreset(s,0);assert.equal(s.team[0],'ember');copy(s);
});

test('invalid slots, missing teams and unsafe preset names fail without changing any saved team',()=>{
  const s=E.createState();for(const slot of [-1,3,.5,'0',NaN])atomic(s,()=>E.saveTeamPreset(s,slot));for(const name of ['', '   ','a'.repeat(25),'x\ny'])atomic(s,()=>E.saveTeamPreset(s,0,name));atomic(s,()=>E.applyTeamPreset(s,0));atomic(s,()=>E.deleteTeamPreset(s,0));E.saveTeamPreset(s,0);atomic(s,()=>E.renameTeamPreset(s,0,''));atomic(s,()=>E.renameTeamPreset(s,0,'x\u0000y'));
});

test('preset validation rejects duplicate, unowned and unknown heroes or pets while permitting an expedition snapshot',()=>{
  const s=E.createState();E.saveTeamPreset(s,0);
  for(const alter of [s=>s.presets.push(null),s=>s.presets[0].team[0]='aion',s=>s.presets[0].team[0]='constructor',s=>s.presets[0].team[0]='lumi',s=>s.presets[0].pet='zephyr',s=>s.presets[0].name=' x ',s=>s.presets[0].name=1,s=>delete s.presets]){const bad=structuredClone(s);alter(bad);assert.throws(()=>copy(bad));}
  E.setTeamSlot(s,'ember',0);E.saveTeamPreset(s,1);E.setTeamSlot(s,'rook',0);E.dispatchExpedition(s,'mist-path','ember',0,Date.now());copy(s);assert.match(teamPresetsPanel(s),/Ember đang viễn chinh/);
});

test('graphics quality choices set appropriate defaults and independent toggles persist across reloads',()=>{
  let s=E.createState();assert.deepEqual(s.settings.graphics,E.starterGraphics());E.setGraphics(s,'quality','low');assert.deepEqual(s.settings.graphics,{quality:'low',fps:30,shadows:false,effects:false});E.setGraphics(s,'fps',60);E.setGraphics(s,'shadows',true);s=copy(s);assert.deepEqual(s.settings.graphics,{quality:'low',fps:60,shadows:true,effects:false});E.setGraphics(s,'quality','high');assert.deepEqual(s.settings.graphics,{quality:'high',fps:60,shadows:true,effects:true});E.setGraphics(s,'effects',false);assert.equal(copy(s).settings.graphics.effects,false);
});

test('graphics profiles bound resolution, particles, shadow sizes and frame intervals for mobile and desktop',()=>{
  const low=E.graphicsProfile({quality:'low',fps:30,shadows:false,effects:false},400,4),high=E.graphicsProfile({quality:'high',fps:60,shadows:true,effects:true},400,4),medium=E.graphicsProfile(E.starterGraphics(),1200,1.2);
  assert.equal(low.pixelRatio,1);assert.equal(low.capacity,16);assert.equal(low.compact,true);assert.equal(low.shadows,false);assert.equal(low.frameInterval,1000/30);assert.equal(high.pixelRatio,2);assert.equal(high.capacity,160);assert.equal(high.shadowSize,1024);assert.equal(high.frameInterval,1000/60);assert.equal(medium.pixelRatio,1.2);assert.equal(medium.compact,false);assert.equal(E.graphicsProfile(E.starterGraphics(),400,.75).pixelRatio,.75);assert.equal(E.graphicsProfile(null,400,NaN).pixelRatio,1);
});

test('invalid graphics edits and corrupted imported settings are rejected atomically',()=>{
  const s=E.createState();for(const [key,value] of [['quality','constructor'],['quality','ultra'],['fps',120],['fps','60'],['shadows',1],['effects','off'],['unknown',true]])atomic(s,()=>E.setGraphics(s,key,value));
  for(const alter of [s=>delete s.settings.graphics,s=>s.settings.graphics.fps=0,s=>s.settings.graphics.quality='constructor',s=>s.settings.graphics.extra=true,s=>s.settings.graphics.effects=null]){const bad=structuredClone(s);alter(bad);assert.throws(()=>copy(bad));}
});

test('preset and graphics actions leave economy, active combat snapshots and other presets untouched',()=>{
  const s=E.createState();E.saveTeamPreset(s,0);E.startRun(s,42);E.chooseRoute(s,0);E.playerAction(s,'rook','enemy0');const before=structuredClone(s);E.saveTeamPreset(s,1,'Chiến đấu');E.setGraphics(s,'quality','low');E.setGraphics(s,'fps',60);
  for(const key of ['run','gold','tickets','dust','shards','expeditions','campaign','owned','adventure','daily'])assert.deepEqual(s[key],before[key],key);assert.deepEqual(s.presets[0],before.presets[0]);copy(s);
});

test('preset names are escaped in HTML and graphics controls show selected quality, frame cap and toggles',()=>{
  const s=E.createState();E.saveTeamPreset(s,0,'<img src=x>');const html=teamPresetsPanel(s);assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img src=x>/);assert.match(html,/data-preset-name="0"/);E.setGraphics(s,'quality','low');E.setGraphics(s,'fps',60);const settings=graphicsSettingsPanel(s);assert.match(settings,/data-quality="low" aria-pressed="true"/);assert.match(settings,/data-fps="60" aria-pressed="true"/);assert.match(settings,/data-key="shadows" role="switch" aria-checked="false"/);
});
