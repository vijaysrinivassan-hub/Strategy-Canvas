import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Columns from './keyword-columns.js';

assert.equal(Matrix.data.revision,'ai-data-positioning-matrices-v16');
assert.equal(Matrix.data.icpColumns.length,11);
assert.deepEqual([...new Set(Matrix.data.icpColumns.map(c=>c.matrixGroup))],['ind','tech','size','people','input']);
assert.deepEqual(Matrix.data.icpColumns.slice(0,5).map(c=>[c.name,c.matrixGroup]),[
 ['E-commerce','ind'],['Agencies','ind'],['Amazon','tech'],['SMB','size'],['Enterprise','size']
]);
assert.deepEqual(Matrix.data.icpColumns.slice(-2).map(c=>[c.name,c.matrixGroup]),[['People','people'],['Input','input']]);
assert(!Matrix.data.icpColumns.some(c=>/data\s*(?:&|and)?\s*analytics/i.test(c.name)||c.matrixGroup==='ctry'));
assert.equal(Matrix.data.valueColumns.length,4);
assert.deepEqual(Matrix.data.valueColumns.map(c=>c.matrixGroup),['use','use','use','use']);
assert.deepEqual(Matrix.data.valueColumns.map(c=>c.name),['Marketing','Product','Sales','Finance']);
assert.deepEqual(Matrix.data.productListicleColumns.map(c=>c.name),['Capabilities','Features']);
assert.deepEqual(Matrix.data.productLandingColumns.map(c=>c.name),['Capabilities','Features']);
assert.equal(Matrix.data.icpRows.length,5);assert.equal(Matrix.data.valueRows.length,15);
assert.equal(Matrix.data.icpRows.flatMap(r=>r.cells).length,55);assert.equal(Matrix.data.valueRows.flatMap(r=>r.cells).length,60);
assert.equal(Matrix.data.valueRows[0].name,'Analysis');
assert.equal(Matrix.data.valueRows[0].processLevel,'process');
assert.deepEqual(Matrix.data.valueRows.slice(1).map(r=>r.name),Matrix.data.analysisTaxonomy.subProcesses.map(r=>r.name));
assert.ok(Matrix.data.valueRows.slice(1).every(r=>r.parentProcess==='Analysis'&&r.processLevel==='subprocess'));
assert.match(Columns.strategyPrompt,/Processes and use cases belong to Value/);
assert.match(Columns.strategyPrompt,/named competitor/);
assert.match(Columns.strategyPrompt,/first available cell/);
assert.match(Columns.strategyPrompt,/canonical competitor list/);
assert.match(Columns.strategyPrompt,/actual flagship category/);
assert.match(Columns.strategyPrompt,/never copy an AI Layer product into Capital Layer/);
assert.match(Columns.strategyPrompt,/Agency-fit pages belong under Industry Pages/);
assert.match(Columns.strategyPrompt,/Enterprise and SMB belong under Company Size/);
assert.match(Columns.strategyPrompt,/Amazon belongs under Technology/);
assert.match(Columns.strategyPrompt,/VALUE SEO CATEGORY AXIS/);
assert.match(Columns.strategyPrompt,/same selected Maturity Axis category hierarchy/);
assert.ok(Columns.names.category.includes('Integration pages'));

const use=Matrix.data.columns.slice(0,4),rest=Matrix.data.columns.slice(4);
const icpRows=Matrix.data.rows.map(row=>({id:row.id,pageGroup:'matrix',name:row.name,cells:Object.fromEntries(Matrix.data.columns.map((col,i)=>[col.id,{v:row.cells[i].title,mode:'aeo',cfg:true}]))}));
icpRows[0].cells[use[0].id].v='Preserved moved use case';icpRows[0].cells[rest[0].id].v='Preserved ICP edit';
const seoCell={v:'Preserve SEO',mode:'seo',cfg:true};const aeoCell={v:'Clear old Value AEO',mode:'aeo',cfg:true};
const content={views:{product:{kind:'grid',columns:[],pageColumns:{},pageOrders:{},rows:[]},icp:{kind:'grid',columns:[],pageColumns:{matrix:structuredClone(Matrix.data.columns)},pageOrders:{},rows:icpRows},value:{kind:'grid',columns:[],pageColumns:{informational:[{id:'guide'}]},pageOrders:{},rows:[{id:'legacy',pageGroup:'informational',cells:{seo:seoCell,aeo:aeoCell}},{id:'url-topic-row',pageGroup:'matrix',name:'Choose the right plan for you',cells:{repository:{v:'Choose the right plan for you',repositoryQueries:[{}]}}}]},category:{kind:'grid',columns:[],pageColumns:{landing:[]},pageOrders:{},rows:[]}}};
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),true);
assert.equal(content.views.icp.pageColumns.matrix.length,11);
assert.equal(content.views.value.pageColumns.matrix.length,4);
assert.deepEqual(content.views.product.pageColumns.listicle.map(column=>column.name),['Capabilities','Features']);
assert(content.views.product.pageColumns.landing.some(column=>column.name==='Capabilities'));
assert(content.views.product.pageColumns.landing.some(column=>column.name==='Features'));
assert.equal(content.views.value.pageColumns['value-overview'],undefined);
assert.equal(content.views.icp.rows.find(r=>r.id===Matrix.data.rows[0].id).cells[rest[0].id].v,'Preserved ICP edit');
assert.equal(content.views.value.rows.find(r=>r.id===Matrix.data.rows[0].id).cells[use[0].id].v,'');
assert(content.views.value.rows.filter(r=>r.pageGroup==='matrix').flatMap(r=>Object.values(r.cells||{})).every(cell=>cell.v===''));
assert.equal(content.views.value.rows.find(r=>r.id==='ai-value-process-analysis').name,'Analysis');
assert.equal(content.views.value.rows.filter(r=>r.pageGroup==='matrix'&&r.processLevel==='subprocess').length,14);
assert.equal(content.views.value.rows.filter(r=>r.pageGroup==='matrix').length,15);
assert.equal(content.views.value.rows.some(r=>r.id==='url-topic-row'),false);
assert.equal(content.views.value.rows.find(r=>r.id==='legacy').cells.seo,seoCell);
assert.equal(content.views.value.rows.find(r=>r.id==='legacy').cells.aeo,undefined);
assert.ok(content.views.category.pageColumns.landing.some(c=>c.name==='Integration pages'));
assert.match(content.views.icp.matrixAiPrompt,/Amazon under Technology/);assert.match(content.views.value.matrixAiPrompt,/Product Aware/);
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),false);
// Upgrade an already-saved Value AEO matrix: seeded/competitor titles are
// removed, while the represented company's Luca title and slug survive.
const cohort=content.views.value.rows.find(row=>row.name==='Cohort analysis');
cohort.cells[Matrix.data.valueColumns[2].id].v='Deal-vintage cohort analysis';
cohort.cells[Matrix.data.valueColumns[3].id].v='Luca represented title';
cohort.cells[Matrix.data.valueColumns[3].id].url='https://ask-luca.com/blogs/represented';
content.views.value.valueMatrixRevision='ai-data-positioning-matrices-v13';
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),true);
assert.equal(cohort.cells[Matrix.data.valueColumns[2].id].v,'');
assert.equal(cohort.cells[Matrix.data.valueColumns[3].id].v,'Luca represented title');
// Repair a previously seeded board whose saved Value AEO column projection
// was later reduced to one visible column while its subprocess cells survived.
content.views.value.pageColumns.matrix=content.views.value.pageColumns.matrix.slice(0,1);
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),true);
assert.deepEqual(content.views.value.pageColumns.matrix.slice(0,4).map(column=>column.id),Matrix.data.valueColumns.map(column=>column.id));
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),false);
// A repository-created alias must be folded into the canonical Capabilities
// column so repair does not expose a duplicate or strand imported URLs.
const aliasId='shared-url-col-value-overview-capabilities';
content.views.value.pageColumns['value-overview']=[{id:aliasId,name:'Capabilities'}];
const overviewRow={id:'overview-alias-row',pageGroup:'value-overview',cells:{[aliasId]:{v:'Imported capability',repositoryQueries:[{topicGroup:'one'}]}}};
content.views.value.rows.unshift(overviewRow);
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),true);
assert.equal(content.views.value.pageColumns['value-overview'],undefined);
assert.equal(content.views.product.pageColumns.listicle.filter(column=>column.name==='Capabilities').length,1);
assert.equal(overviewRow.cells['ai-value-capabilities'].v,'Imported capability');
assert.equal(overviewRow.cells[aliasId],undefined);
assert(content.views.product.rows.includes(overviewRow));
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const marker of ['Process matrix','value-overview','matrix-ai-prompt','Departments','Features','Capabilities','isPositioningMatrix','value-process-parent','Sub-process','ai-data-icp-matrix.js','processTaxonomyColumnIds','processTaxonomyRows'])assert.ok(html.includes(marker),marker);
assert.ok(html.includes("repositoryColumnIds.has(col.id) || processTaxonomyColumnIds.has(col.id)"));
assert.ok(html.includes("['process','subprocess'].includes(row.processLevel) ||"));
console.log('PASS: ICP audience-fit and Value process matrices retained while Capabilities/Features moved to Product Aware listicles with empty landing columns.');
