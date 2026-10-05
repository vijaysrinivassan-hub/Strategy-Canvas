import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Metrics from './ai-data-search-metrics.js';
import ValueSeed from './ai-data-value-keywords.js';

assert.equal(Metrics.REVISION, 'ai-data-search-suggestions-v4');
assert.equal(Metrics.records.length, 2613);
assert.equal(Metrics.keywordRows().length, 2613);
assert.equal(new Set(Metrics.records.map(row => `${row.keyword.toLowerCase()}|${row.country}`)).size, 2613);

const bestTools = Metrics.records.find(row => row.keyword === 'best marketing analytics tools');
assert.deepEqual(
  [bestTools.volume, bestTools.kd, bestTools.cpc, bestTools.traffic_potential],
  [400, 24, 0.4, 2800]
);
assert.equal(bestTools.data.global_volume, 700);
assert.equal(bestTools.data.global_traffic_potential, 4200);
assert(bestTools.data.serp_features.includes('AI Overview'));
assert(bestTools.data.source_files[0].includes('ai-finance-anoma'));

const marketingAnalytics = Metrics.records.find(row => row.keyword === 'what is marketing analytics');
assert.equal(marketingAnalytics.data.cps, 0.8);
const noisySuggestion = Metrics.records.find(row => row.keyword === '2025 ai content');
assert(noisySuggestion);
assert.equal(noisySuggestion.matrix_eligible, false);
assert.equal(noisySuggestion.data.matrix_eligible, false);
for (const record of Metrics.records) {
  assert(record.process && record.department && record.lens, record.keyword);
  assert(Array.isArray(record.data.source_files) && record.data.source_files.length, record.keyword);
}

const content = {views:{
  product:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},
  icp:{kind:'grid',pageColumns:{matrix:[]},pageOrders:{},rows:[]},
  value:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},
  category:{kind:'grid',pageColumns:{landing:[]},pageOrders:{},rows:[]}
}};
assert.equal(Matrix.ensure(content, Metrics.CLIENT, Metrics.PRODUCT_ID), true);
const db = Metrics.keywordRows().map((row, index) => ({...row, id:`search-metric-${index}`,source:'ai-data-search-suggestions-2026-10-04'}));
const seedDb = ValueSeed.keywordRows().map((row, index) => ({...row, id:`value-seed-${index}`,source:'ai-data-value-keyword-lenses'}));
assert.equal(ValueSeed.apply(content, seedDb), true);
assert.equal(Metrics.apply(content, [...seedDb, ...db]), true);
assert.equal(ValueSeed.apply(content, [...seedDb, ...db], {processOnly:true,clearOtherLenses:true}), true);
const assigned = [];
for (const row of content.views.value.rows.filter(row => row.pageGroup === 'matrix')) {
  for (const cell of Object.values(row.cells || {})) {
    assigned.push(...(cell.kws || []));
    for (const ids of Object.values(cell.valueLensKeywords || {})) assigned.push(...ids);
  }
}
const importedAssignments = assigned.filter(id => String(id).startsWith('search-metric-'));
assert(importedAssignments.length > 0);
assert(importedAssignments.length <= 300);
assert(new Set(importedAssignments).size >= importedAssignments.length - 5);
assert(!importedAssignments.includes(`search-metric-${Metrics.records.indexOf(noisySuggestion)}`));

const lenses = ['process','output','outcome','benefits','tools'];
const idsFor = (cell, lens) => lens === 'process' ? (cell.kws || []) : (cell.valueLensKeywords?.[lens] || []);
assert(content.views.value.rows.filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.values(row.cells||{})).every(cell=>idsFor(cell,'process').length>=25));
assert(content.views.value.rows.filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.values(row.cells||{})).every(cell=>['output','outcome','benefits','tools'].every(lens=>idsFor(cell,lens).length===0)));
const matrixRows = content.views.value.rows.filter(row => row.pageGroup === 'matrix');
const matrixColumns = content.views.value.pageColumns.matrix;
for (const holder of [...matrixRows, ...matrixColumns]) {
  for(const lens of lenses){
    const ids = idsFor(holder.topicCell, lens);
    assert.equal(ids.length, lens==='process'?5:0, `${holder.name} ${lens}`);
  }
}

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert(html.includes('<script src="ai-data-search-metrics.js?v=search-metrics-v4"></script>'));
assert(html.includes('await ensureAiDataSearchMetricsSeed();'));
assert(html.includes("saveKeywords(api.keywordRows(),'ai-data-search-suggestions-2026-10-04')"));
assert(html.includes(".select('id,keyword,selected,volume,kd,cpc,traffic_potential,parent_topic,intent,country,source,data')"));
assert(html.includes("{ key: 'cps',"));
assert(html.includes("{ key: 'global_traffic_potential',"));
assert(html.includes('for (let from = 0; from < toInsert.length; from += 400)'));
assert(html.includes('for (let from = 0; from < toUpdate.length; from += 20)'));
assert(html.includes('function renderMatrixTopicCell(host,holder,ro,keywordLens)'));
assert(html.includes("keywordLens:keywordLens||''"));
assert(html.includes('{processOnly:true,clearOtherLenses:true}'));

console.log('PASS: all 2,613 suggestions retain their metrics while only ranked, relevant terms enter five-keyword matrix cells.');
