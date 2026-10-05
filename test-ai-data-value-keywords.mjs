import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Seed from './ai-data-value-keywords.js';

assert.equal(Seed.REVISION,'ai-data-value-keyword-lenses-v6');
assert.equal(Seed.processes.length,15);
assert.equal(Seed.departments.length,4);
assert.deepEqual(Seed.LENSES,['process','output','outcome','benefits','tools']);
assert.equal(Seed.records.length,1500);
assert.equal(Seed.headerRecords.length,95);
assert.equal(Seed.keywordRows().length,1595);
for(const process of Seed.processes)for(const department of Seed.departments)for(const lens of Seed.LENSES){
  const matching=Seed.records.filter(record=>record.process===process.name&&record.department===department.name&&record.lens===lens);
  assert.equal(matching.length,lens==='process'?25:0);
  if(lens==='process'){
    const groups=[...new Set(matching.map(record=>record.intentGroup))];
    assert.equal(groups.length,5);
    for(const group of groups)assert.equal(matching.filter(record=>record.intentGroup===group).length,5);
  }
}

const content={views:{product:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},icp:{kind:'grid',pageColumns:{matrix:[]},pageOrders:{},rows:[]},value:{kind:'grid',pageColumns:{},pageOrders:{},rows:[]},category:{kind:'grid',pageColumns:{landing:[]},pageOrders:{},rows:[]}}};
assert.equal(Matrix.ensure(content,Seed.CLIENT,Seed.PRODUCT_ID),true);
const db=Seed.keywordRows().map((row,index)=>({...row,id:'value-keyword-'+index}));
assert.equal(Seed.apply(content,db),true);
const cells=content.views.value.rows.filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.values(row.cells||{}));
assert.equal(cells.length,60);
assert(cells.every(cell=>cell.kws.length===25));
for(const lens of ['output','outcome','benefits','tools'])assert(cells.every(cell=>(cell.valueLensKeywords[lens]||[]).length===0),lens);
const holders=[...content.views.value.rows.filter(row=>row.pageGroup==='matrix'),...content.views.value.pageColumns.matrix];
const headerIds=(holder,lens)=>lens==='process'?(holder.topicCell.kws||[]):(holder.topicCell.valueLensKeywords?.[lens]||[]);
for(const holder of holders)for(const lens of Seed.LENSES)assert.equal(headerIds(holder,lens).length,lens==='process'?5:0,holder.name+' '+lens);
assert.notDeepEqual(headerIds(content.views.value.rows.find(row=>row.name==='Analysis'),'process'),headerIds(content.views.value.pageColumns.matrix.find(column=>column.name==='Marketing'),'process'));
assert.equal(Seed.apply(content,db),false);

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('<script src="ai-data-value-keywords.js?v=value-keywords-v6"></script>'));
assert(html.includes("heading.className='kw-intent-label'"));
assert(html.includes('await ensureAiDataValueKeywordSeed();'));
assert(html.includes("saveKeywords(missing,'ai-data-value-keyword-lenses')"));
assert(html.includes(".range(from,from+pageSize-1)"));
assert(html.includes("const rows=[],pageSize=1000,maxRows=10000"));
console.log('PASS: all 60 Value AEO cells receive five named Process intents with five variants each while the other four lenses stay empty.');
