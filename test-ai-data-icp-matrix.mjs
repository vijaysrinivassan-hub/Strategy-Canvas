import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matrix from './ai-data-icp-matrix.js';
import Pages from './keyword-page-tables.js';

assert.equal(Matrix.data.columns.length, 12);
assert.deepEqual(Matrix.data.columns.map(column => column.matrixGroup), [
  'ind','ind','ind','ind','ctry','ctry','ctry','ctry','tech','tech','tech','tech'
]);
assert.deepEqual(Matrix.data.rows.map(row => row.name), ['Cohort','Funnel','Attribution','Retention','Segmentation']);
assert.equal(Matrix.data.rows.flatMap(row => row.cells).length, 60);
assert.ok(Matrix.data.rows.flatMap(row => row.cells).every(cell => cell.title && cell.actorType && cell.actor && cell.keywordIdeas.length === 3));

const prior={id:'prior',pageGroup:'listicle',cells:{old:{v:'keep in archive'}}};
const informational={id:'seo',pageGroup:'informational',cells:{guide:{v:'keep active'}}};
const content={views:{icp:{columns:[],rows:[prior,informational],pageColumns:{listicle:[{id:'old'}],landing:[{id:'service'}],informational:[{id:'guide'}]},pageOrders:{}}}};
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),true);
const view=content.views.icp;
assert.equal(view.pageColumns.matrix.length,12);
assert.equal(view.rows.filter(row=>row.pageGroup==='matrix').length,5);
assert.equal(view.rows.find(row=>row.id==='seo'),informational);
assert.equal(view.icpMatrixArchive.at(-1).rows[0].id,'prior');
assert.ok(view.rows.filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.values(row.cells)).every(cell=>cell.mode==='aeo'&&cell.cfg));
assert.equal(Matrix.ensure(content,'AI Data Platform','0jgsw8bx554d'),false);
assert.equal(Matrix.ensure({views:{icp:{rows:[]}}},'Other client','0jgsw8bx554d'),false);
assert.deepEqual(Pages.visibleGroups('icp','aeo'),[]);
assert.deepEqual(Pages.visibleGroups('icp','seo').map(group=>group.id),['informational']);
const splitView={rows:[view.rows.find(row=>row.pageGroup==='matrix')],pageColumns:view.pageColumns,columns:[]};
assert.equal(Pages.split(splitView,[],()=> 'new'),false);
assert.equal(splitView.rows[0].pageGroup,'matrix');

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const marker of ['ICP matrix','Entity type…','Product, tool, or analyst','actorType','matrixGroup','icp-matrix-corner','isIcpMatrix ? 220 : 46','renderMatrixTopicCell','matrixTopicCell','icp-matrix-row-topic'])assert.ok(html.includes(marker),marker);
assert.ok(html.includes('<script src="ai-data-icp-matrix.js"></script>'));
const bridge=fs.readFileSync(new URL('./icp-keyword-bridge.js',import.meta.url),'utf8');
assert.ok(bridge.includes("startsWith('sample-matrix')"));
assert.ok(!bridge.includes('Suggested keywords · unresearched'));
console.log('PASS: supplied ICP matrix imports 12 columns, 5 processes and 60 editable AEO cells; prior AEO tables archive, SEO remains active, and migration is idempotent.');
