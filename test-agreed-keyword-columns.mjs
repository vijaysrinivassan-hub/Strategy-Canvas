import assert from 'node:assert/strict';
import A from './tools/apply-agreed-keyword-columns.cjs';
import K from './keyword-columns.js';
const cfg=A.configure(K.seed());
assert.equal(Object.values(cfg.pageViews).flatMap(Object.values).flat().length,42);
assert.ok(Object.values(cfg.pageViews).flatMap(Object.values).flat().every(c=>c.instruction.length>50));
const cases=[
 ['category','listicle','Solution roundups',{url:'best-payroll-software-india'},'Category Names'],
 ['category','informational','Evaluation & buying',{url:'hrms-buying-checklist'},'Internal Selection Factors'],
 ['icp','informational','By industry',{url:'manufacturing-hr-challenges'},'Segment-Specific Problems'],
 ['value','informational','Glossary & concepts',{url:'gross-salary'},'HR Glossary'],
 ['value','listicle','Practical tips & strategies',{url:'tips-to-reduce-payroll-errors'},'Best for Reducing a Problem']
];
for(const [v,g,col,c,want]of cases)assert.equal(A.route(v,g,col,c).name,want);
const cell={url:'best-payroll-software-india',v:'A readable title',writtenBy:'old',kws:['kw'],st:'selected',type:'list'};
const root={articleTypes:[{id:'list',name:'Listicle'}],views:{category:{kind:'grid',columns:[{id:'old',name:'Solution roundups'}],pageColumns:{listicle:[{id:'old',name:'Solution roundups'}]},rows:[{id:'r',pageGroup:'listicle',cells:{old:cell}}]},icp:{kind:'grid',columns:[],rows:[]},value:{kind:'grid',columns:[],rows:[]},competitor:{kind:'matrix',types:[],rows:[],cells:{},comparisonCells:{pair:{v:'A vs B'}}}}};
const before=JSON.stringify(cell),comparison=JSON.stringify(root.views.competitor);
A.migrate(root,cfg);
const after=root.views.category.rows.flatMap(r=>Object.values(r.cells));
assert.equal(after.length,1);assert.equal(after[0],cell);assert.equal(JSON.stringify(cell),before);
assert.equal(root.views.competitor.comparisonCells.pair.v,'A vs B');
console.log('PASS: 42 columns, distinct prompts, routing examples and in-place content preservation.');
