import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Metrics from './ai-data-search-metrics.js';

assert.equal(Metrics.REVISION, 'ai-data-search-suggestions-v2');
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
const db = Metrics.keywordRows().map((row, index) => ({...row, id:`search-metric-${index}`}));
assert.equal(Metrics.apply(content, db), true);
const assigned = [];
for (const row of content.views.value.rows.filter(row => row.pageGroup === 'matrix')) {
  for (const cell of Object.values(row.cells || {})) {
    assigned.push(...(cell.kws || []));
    for (const ids of Object.values(cell.valueLensKeywords || {})) assigned.push(...ids);
  }
}
assert.equal(assigned.length, 2613);
assert.equal(new Set(assigned).size, 2613);

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert(html.includes('<script src="ai-data-search-metrics.js?v=search-metrics-v2"></script>'));
assert(html.includes('await ensureAiDataSearchMetricsSeed();'));
assert(html.includes("saveKeywords(api.keywordRows(),'ai-data-search-suggestions-2026-10-04')"));
assert(html.includes(".select('id,keyword,selected,volume,kd,cpc,traffic_potential,parent_topic,intent,country,data')"));
assert(html.includes("{ key: 'cps',"));
assert(html.includes("{ key: 'global_traffic_potential',"));
assert(html.includes('for (let from = 0; from < toInsert.length; from += 400)'));
assert(html.includes('for (let from = 0; from < toUpdate.length; from += 20)'));

console.log('PASS: all 2,613 unique search suggestions retain the complete metric set and map once into Value AEO.');
