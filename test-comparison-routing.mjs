import assert from 'node:assert/strict';
import A from './keyword-assignments.js';
import M from './tools/migrate-comparison-columns.cjs';
const rows=[{id:'a',name:'Alpha'},{id:'b',name:'Beta'},{id:'c',name:'Gamma'}];
for(const s of ['Alpha vs Beta pricing','alpha-vs.-beta-reviews','Beta versus Alpha features'])assert.deepEqual(A.comparisonPair(s,rows),['a','b']);
assert.equal(A.comparisonPair('Alpha vs Beta vs Gamma',rows),null);
assert.equal(A.comparisonPair('Alpha vs Unknown',rows),null);
assert.equal(A.isComparison('advisory pricing'),false);
const root={views:{competitor:{rows,kind:'matrix',types:[{id:'compare',name:'Comparison'},{id:'compare2',name:'Comparison 2'},{id:'price',name:'Pricing'}],cells:{
 'a|compare':{v:'Alpha vs Beta',kws:['k'],st:'for_review'},
 'a|price':{v:'Alpha vs Beta pricing',kws:['j']},
 'b|compare2':{v:'Alpha vs Beta vs Gamma'}
},comparisonCells:{'["a","b"]':{v:'Keep custom title',st:'selected',kws:['old']}},columnOrder:['compare','price','compare2']}}};
const keywords=[{id:'k',keyword:'Alpha vs Beta',volume:10},{id:'j',keyword:'Alpha vs Beta pricing',volume:20}];
const out=M.migrate(root,keywords),v=root.views.competitor;
assert.equal(out.columns,2);assert.equal(out.pending,1);
assert.equal(v.comparisonCells['["a","b"]'].st,'selected');
assert.equal(v.comparisonCells['["a","b"]'].v,'Keep custom title');
assert.deepEqual(v.comparisonCells['["a","b"]'].kws.sort(),['j','k','old']);
assert.deepEqual(v.types.map(c=>c.name),['Pricing']);assert.equal(Object.keys(v.cells).length,0);
assert.equal(v.comparisonArchive.length,3);assert.equal(v.comparisonUnresolved[0].title,'Alpha vs Beta vs Gamma');
const snapshot=JSON.stringify(root);M.migrate(root,keywords);assert.equal(JSON.stringify(root),snapshot);
const overflow={views:{competitor:{rows:[{id:'a',name:'Alpha'}],types:[{id:'s',name:'Switching'},{id:'s2',name:'Switching 2'}],cells:{'a|s':{v:'First'},'a|s2':{v:'Second',st:'selected',kws:['extra']}},comparisonUnresolved:[{key:'triple',title:'Alpha vs Beta vs Gamma',cell:{kws:['triple']}}]}}};
M.migrateOthers(overflow);
const ov=overflow.views.competitor;assert.equal(ov.types.length,1);assert.equal(ov.rows.at(-1).name,'Others');
assert.equal(ov.cells['a|s'].v,'First');assert.equal(ov.cells[ov.rows.at(-1).id+'|s'].v,'Second');
assert.equal(ov.comparisonOthers['legacy-triple'].v,'Alpha vs Beta vs Gamma');
assert(A.assigned({tabs:{'Content Strategy':overflow}}).has('triple'));
const savedOverflow=JSON.stringify(overflow);M.migrateOthers(overflow);assert.equal(JSON.stringify(overflow),savedOverflow);
console.log('PASS: vs precedence, opposite-order pairs, three-way ambiguity, data preservation, status preservation, column retirement and idempotent rerun.');
