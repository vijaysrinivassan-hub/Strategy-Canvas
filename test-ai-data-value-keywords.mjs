import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Seed from './ai-data-value-keywords.js';

assert.equal(Seed.REVISION,'ai-data-value-keyword-lenses-v2');
assert.equal(Seed.processes.length,15);
assert.equal(Seed.departments.length,4);
assert.deepEqual(Seed.LENSES,['process','output','outcome','benefits','tools']);
assert.equal(Seed.records.length,1500);
assert.equal(new Set(Seed.records.map(record=>record.keyword.toLowerCase())).size,1500);
for(const process of Seed.processes)for(const department of Seed.departments)for(const lens of Seed.LENSES){
  assert.equal(Seed.records.filter(record=>record.process===process.name&&record.department===department.name&&record.lens===lens).length,5);
}

const content={views:{product:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},icp:{kind:'grid',pageColumns:{matrix:[]},pageOrders:{},rows:[]},value:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},category:{kind:'grid',pageColumns:{landing:[]},pageOrders:{},rows:[]}}};
assert.equal(Matrix.ensure(content,Seed.CLIENT,Seed.PRODUCT_ID),true);
const db=Seed.keywordRows().map((row,index)=>({...row,id:'value-keyword-'+index}));
assert.equal(Seed.apply(content,db),true);
const cells=content.views.value.rows.filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.values(row.cells||{}));
assert.equal(cells.length,60);
assert(cells.every(cell=>cell.kws.length===5));
for(const lens of ['output','outcome','benefits','tools'])assert(cells.every(cell=>cell.valueLensKeywords[lens].length===5),lens);
assert.equal(Seed.apply(content,db),false);

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('<script src="ai-data-value-keywords.js?v=value-keywords-v2"></script>'));
assert(html.includes('await ensureAiDataValueKeywordSeed();'));
assert(html.includes("saveKeywords(missing,'ai-data-value-keyword-lenses')"));
assert(html.includes(".range(from,from+pageSize-1)"));
assert(html.includes("const rows=[],pageSize=1000,maxRows=10000"));
console.log('PASS: all 60 Value AEO cells receive five keywords in each of five independent lenses.');
