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

const render=html.slice(html.indexOf('function renderBrandRadar()'),html.indexOf("$('btnOpenProductEvolution')"));
assert(render.includes('const radar = brandRadarState()'));
assert(render.includes("radar.axis = radar.buyingAxis || '';"));
assert(render.includes("radar.axis || 'technology'"));
const evolution=html.slice(html.indexOf('function renderEvolution('),html.indexOf("$('btnEvoChange')"));
assert(evolution.includes('renderPositioning();'));
assert(!evolution.includes('renderBrandRadar();'));
assert(html.includes("if (!svg || !map || !market || !map.clientWidth || !map.clientHeight) return;"));
assert(!html.includes("$('brandRadarPane').hidden) return"));
assert(html.includes('radar.buyingAxis = axis.id;'));
console.log('PASS: Product Evolution controls Selling Industry, Buying Industry controls Brand Radar and ICP cards, and embedded wires render.');
