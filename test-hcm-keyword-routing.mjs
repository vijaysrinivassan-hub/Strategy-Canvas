import assert from 'node:assert/strict';
import R from './tools/reorganize-hcm-keywords.cjs';
import K from './keyword-columns.js';
for(const [slug,view,group,column]of [
 ['best-hrms-manufacturing-companies-india','icp','listicle','By industry'],
 ['hrms-buying-checklist-before-purchase','category','informational','Evaluation & buying'],
 ['ctc-calculator','value','landing','Resources & tools'],
 ['provident-fund','value','informational','Indian payroll & compliance'],
 ['gross-salary','value','informational','Glossary & concepts'],
 ['payroll-software-for-remote-hybrid-teams','icp','landing','Use-case pages'],
 ['employee-self-service-portal-hr-software-india','value','landing','Feature pages'],
 ['performance-management-software-vs-traditional-methods','category','informational','Trends & comparisons'],
 ['9-box-model','value','informational','Glossary & concepts'],
 ['top-attendance-management-system-in-india','category','listicle','Solution roundups']
]){const c=R.classify(slug);assert.deepEqual([c.view,c.group,c.column],[view,group,column]);}
const cfg=R.configure(K.seed());
const original={v:'Keep title',url:'ctc-calculator',kws:['kw'],st:'selected',on:true,aw:'Problem aware',writtenBy:'old',mode:'seo'};
const root={articleTypes:[],views:{
 category:{kind:'grid',columns:[{id:'c',name:'Old'}],rows:[{id:'keep-row-id',cells:{c:original}}]},
 value:{kind:'grid',columns:[],rows:[]},icp:{kind:'grid',columns:[],rows:[]},
 competitor:{kind:'matrix',rows:[],types:[],cells:{},comparisonCells:{pair:{v:'A vs B',kws:['comparison-kw']}}}
}};
const comparison=JSON.stringify(root.views.competitor.comparisonCells);
R.migrate(root,cfg);
const entry=R.entries(root)[0];assert.equal(entry.row.id,'keep-row-id');assert.equal(entry.cell,original);
assert.deepEqual({...entry.cell,type:undefined},{...original,type:undefined});
assert.equal(root.views.category.rows.length,0);
assert.equal(JSON.stringify(root.views.competitor.comparisonCells),comparison);
const saved=JSON.stringify(root);R.migrate(root,cfg);assert.equal(JSON.stringify(root),saved);
assert.ok(!JSON.stringify(cfg.pageViews).includes('Indian payroll'));
console.log('PASS: reviewed routing examples; in-place cells and row IDs; decisions and comparisons preserved; repeat-run stability; reusable universal schema.');
