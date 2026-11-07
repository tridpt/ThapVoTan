import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO,HEROES} from '../js/data.mjs';
import {T,disposeScene} from '../js/models3d.mjs';
import {ULTIMATES,ultimateMarkup,createUltimateScene,animateUltimate} from '../js/ultimate3d.mjs';
import {ultimatePreviewButton,showcaseContent} from '../js/rarity-ui.mjs';

test('all 20 heroes have an individual ultimate theme and an accessible skip control',()=>{
  assert.deepEqual(Object.keys(ULTIMATES).sort(),HEROES.map(h=>h.id).sort());
  assert.equal(new Set(Object.values(ULTIMATES).map(s=>s.theme)).size,20);assert.equal(createUltimateScene('missing'),null);assert.equal(ultimateMarkup('missing'),'');
  for(const id of Object.keys(ULTIMATES)){const html=ultimateMarkup(id);assert.ok(html.includes(HERO[id].skill));assert.ok(html.includes('role="dialog"'));assert.ok(html.includes('aria-modal="true"'));assert.ok(html.includes('aria-labelledby="ultimate-title"'));assert.ok(html.includes('Bỏ qua'));assert.ok(html.includes('type="button"'));}
});

test('ultimate previews are available for every supported hero without ownership or gameplay state',()=>{
  for(const h of HEROES){const button=ultimatePreviewButton(h),html=showcaseContent(h.id);if(ULTIMATES[h.id]){assert.ok(button.includes('data-action="preview-ultimate"'));assert.ok(button.includes(`data-id="${h.id}"`));assert.ok(html.includes(button));}else assert.equal(button,'');}
});

test('all 20 models, signature spell props and rarity auras stay inside phone, tablet and desktop cameras',()=>{
  for(const id of Object.keys(ULTIMATES))for(const aspect of [360/780,768/1024,1280/800,780/360]){
    const view=createUltimateScene(id,aspect);let count=0,vertices=0;view.scene.traverse(o=>{if(o.isMesh){count++;vertices+=o.geometry.attributes.position.count;}});assert.ok(count<170,`${id} mesh budget: ${count}`);assert.ok(vertices<200000,`${id} vertex budget: ${vertices}`);
    for(const elapsed of [0,.35,1.1,2,2.35]){
      animateUltimate(view,elapsed);const bounds=new T.Box3().setFromObject(view.model);bounds.expandByObject(view.aura.root);for(const node of view.action?.focus||[])if(node.visible)bounds.expandByObject(node);for(const {node} of view.moving)if(node.visible)bounds.expandByObject(node);
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new T.Vector3(x,y,z).project(view.camera);assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${id} framed at ${aspect}/${elapsed}: ${p.toArray()}`);
      }
    }
    disposeScene(view.scene);
  }
});

test('cinematic animation is deterministic, resets reduced motion and releases only transient resources',()=>{
  const data=structuredClone(HERO);
  for(const id of Object.keys(ULTIMATES)){
    const view=createUltimateScene(id),snapshot=()=>view.moving.map(p=>[...p.node.position.toArray(),...p.node.rotation.toArray(),...p.node.scale.toArray()]);
    animateUltimate(view,1.4);const pose=snapshot();for(let n=0;n<100;n++)animateUltimate(view,1.4);assert.deepEqual(snapshot(),pose);
    animateUltimate(view,1,{reducedMotion:true});const still=snapshot();animateUltimate(view,2,{reducedMotion:true});assert.deepEqual(snapshot(),still);
    const geometry=new Set(),materials=new Set();let freedGeometry=0,freedMaterials=0;
    view.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared3d)geometry.add(o.geometry);if(o.material&&!o.material.userData.shared3d)materials.add(o.material);});
    geometry.forEach(g=>g.addEventListener('dispose',()=>freedGeometry++));materials.forEach(m=>m.addEventListener('dispose',()=>freedMaterials++));disposeScene(view.scene);assert.equal(freedGeometry,geometry.size);assert.equal(freedMaterials,materials.size);
    const next=createUltimateScene(id);animateUltimate(next,.5);assert.ok(new T.Box3().setFromObject(next.model).getSize(new T.Vector3()).y>3);disposeScene(next.scene);
  }
  assert.deepEqual(HERO,data);
});
