import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('What is the axis of product evolution?'));
assert(html.includes('id="btnRadarAxis"'));
assert(html.includes('Product evolution axis'));
assert(html.includes('id="positioningEvolutionHost"'));
assert(html.includes('id="positioningRadarHost"'));
assert(html.includes("$('positioningEvolutionHost').append($('evoPane').querySelector('.evo-canvas'))"));
assert(html.includes("$('positioningRadarHost').append($('brandRadarPane').querySelector('.radar-canvas'))"));
assert(!html.includes("box.append(tabButton(BRAND_RADAR_TAB, 'Brand Radar'))"));
assert(html.includes('renderPositioning();\n    renderEvolution();\n    renderBrandRadar();'));

const start=html.indexOf('const RADAR_AXES = [');
const end=html.indexOf('let radarDragSide',start);
assert(start>0&&end>start);
const tab='Strategy 1 — Brand Radar';
const state={tabs:{[tab]:{evolution:{axis:'technology'}}}};
const ctx=vm.createContext({state,BRAND_RADAR_TAB:tab});
vm.runInContext(html.slice(start,end),ctx);
const radar=ctx.brandRadarState();
assert.equal(radar.axis,'technology');
radar.axis='people';
assert.equal(state.tabs[tab].evolution.axis,'technology');
state.tabs[tab].evolution.axis='input';
assert.equal(ctx.brandRadarState().axis,'people');

const render=html.slice(html.indexOf('function renderBrandRadar()'),html.indexOf("$('btnOpenProductEvolution')"));
assert(render.includes('const radar = brandRadarState()'));
assert(!render.includes('const evo = evolutionState()'));
assert(render.includes("radar.axis || 'technology'"));
console.log('PASS: Product Evolution and Brand Radar use independent, persisted axis selections.');
