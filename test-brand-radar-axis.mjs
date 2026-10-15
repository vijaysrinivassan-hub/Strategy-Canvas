import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
assert(html.includes('id="btnRadarAxis"'));
assert(!html.includes('id="btnOpenProductEvolution"'));
assert(!html.includes('id="positioningEvolutionHost"'));
assert(html.includes('id="positioningRadarHost"'));
assert(html.includes("$('positioningRadarHost').append($('brandRadarPane').querySelector('.radar-canvas'))"));
assert(!html.includes("box.append(tabButton(BRAND_RADAR_TAB, 'Brand Radar'))"));
assert(html.includes('renderPositioning();\n    renderBrandRadar();'));

const renderStart=html.indexOf('function renderBrandRadar()');
const render=html.slice(renderStart,html.indexOf("$('btnRadarAxis')",renderStart));
assert(render.includes('const radar = brandRadarState()'));
assert(render.includes('radar.axis = activeBuyingIndustryAxis();'));
assert(render.includes("radar.axis || 'technology'"));
const evolution=html.slice(html.indexOf('function renderEvolution('),html.indexOf("$('btnEvoChange')"));
assert(evolution.includes('renderPositioning();'));
assert(!evolution.includes('renderBrandRadar();'));
assert(html.includes("if (!svg || !map || !market || !map.clientWidth || !map.clientHeight) return;"));
assert(!html.includes("$('brandRadarPane').hidden) return"));
assert(html.includes('radar.buyingAxis = axis.id;'));
console.log('PASS: Product Evolution is removed from Positioning Canvas while Buying Industry continues to control Brand Radar and ICP cards.');
