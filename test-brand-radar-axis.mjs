import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
assert(html.includes('id="btnRadarAxis"'));
assert(!html.includes('id="btnOpenProductEvolution"'));
assert(!html.includes('id="positioningEvolutionHost"'));
assert(!html.includes('id="positioningDocumentEvolutionHost"'));
assert(html.includes('id="positioningValueEvolutionHost"'));
assert(html.includes("$('positioningValueEvolutionHost').append($('evoPane').querySelector('.evo-canvas'))"));
assert(html.includes('id="positioningRadarHost"'));
assert(html.includes("$('positioningRadarHost').append($('brandRadarPane').querySelector('.radar-canvas'))"));
assert(!html.includes("box.append(tabButton(BRAND_RADAR_TAB, 'Brand Radar'))"));
assert(html.includes("{ id: 'brand_radar', label: 'Brand Data', fields: [], view: 'brand_radar' }"));
assert(html.includes("if (isBrandRadar){\n    $('tabTitle').textContent = section.label;\n    renderBrandRadar();"));

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
console.log('PASS: Brand Radar remains in Positioning Document while Product Evolution lives with USP in Value Positioning.');
