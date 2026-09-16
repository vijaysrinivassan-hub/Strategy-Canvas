import assert from 'node:assert/strict';
import K from './keyword-columns.js';
import A from './tools/apply-icp-keyword-axes.cjs';

const config=K.seed();
K.ensurePageViews(config);
config.pageViews.icp.informational=[
 {id:'old-problem',name:'Segment-Specific Problems',defaults:{articleType:'Informational'}},
 {id:'old-maturity',name:'Maturity Stage',defaults:{articleType:'Informational'}},
 {id:'old-stack',name:'Existing Tech Stack',defaults:{articleType:'Informational'}}
];
const cell={v:'Keep this problem'};
const root={articleTypes:[],views:{icp:{kind:'grid',columns:[],pageColumns:{informational:[
 {id:'old-problem',name:'Segment-Specific Problems',universalId:'old-problem'},
 {id:'old-maturity',name:'Maturity Stage',universalId:'old-maturity'},
 {id:'old-stack',name:'Existing Tech Stack',universalId:'old-stack'}
]},pageOrders:{},rows:[{id:'r1',pageGroup:'informational',cells:{'old-problem':cell}}]}}};
A.configure(config);
const result=A.migrateRoot(root,config);
const page=K.pageView(root.views.icp,'informational');
assert.deepEqual(config.pageViews.icp.informational.map(d=>[d.axis,d.name]),[
 ['people','Role / Team'],['technology','Technology'],['process','Industry'],['process','Country'],['process','Use Case'],['input','Company Size']
]);
assert(result.removed>=1);
assert.equal(page.columns.some(c=>c.name==='Maturity Stage'),false);
assert.equal(page.columns.find(c=>c.name==='Segment-Specific Problems').axis,'process');
assert.equal(root.views.icp.rows[0].cells['old-problem'],cell);
assert.deepEqual(K.sortIcpColumns(page.columns).map(c=>c.axis||K.inferIcpAxis(c.name)),['people','technology','process','process','process','process','input']);
assert(K.strategyPrompt.includes('ICP AXES'));
console.log('PASS: ICP keyword axes, shared columns, non-destructive legacy preservation, maturity removal, and stable cell data.');
