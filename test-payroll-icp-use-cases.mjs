import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import M from './tools/rebuild-payroll-icps.cjs';
const prompt=JSON.parse(fs.readFileSync('ai-prompts.json','utf8')).positioning_canvas.prompt;
assert.equal(M.updatePrompt(prompt),prompt);
assert.ok(prompt.includes('at least FIVE'));assert.ok(prompt.includes('Categories:'));
const oldIcps=Array.from({length:7},(_,i)=>({id:'icp-'+i,name:'Prior '+i,rows:[{id:'row-'+i,people:'Keep in archive'}],workflowDetails:{axis:'Departments',workflows:[]}}));
const tab={positioning:{icps:structuredClone(oldIcps),selectedIcp:'icp-3',selectedCategory:'chosen-category',categories:[{name:'Unchanged'}],competitive:{stages:[{id:'keep'}]},valueRows:[{id:'keep'}]},problems:[{id:'keep'}],aiPrompt:prompt};
const body={workspaceProductId:M.PRODUCT,tabs:{[M.TAB]:tab,Keywords:{keep:true}},productWorkspaces:{[M.PRODUCT]:{tabs:{[M.TAB]:structuredClone(tab)}},other:{tabs:{preserve:true}}}};
const before=structuredClone(body),result=M.migrate(body,prompt);
assert.equal(result.changed,true);assert.equal(tab.positioning.selectedIcp,'');
assert.equal(tab.positioning.selectedCategory,'chosen-category');
for(const key of ['categories','competitive','valueRows'])assert.deepEqual(tab.positioning[key],before.tabs[M.TAB].positioning[key]);
assert.deepEqual(tab.problems,before.tabs[M.TAB].problems);
assert.deepEqual(body.productWorkspaces.other,before.productWorkspaces.other);
assert.deepEqual(body.tabs.Keywords,before.tabs.Keywords);
assert.deepEqual(body.productWorkspaces[M.PRODUCT].tabs[M.TAB],tab);
assert.deepEqual(tab.icpRevisionArchive[0].previousIcp.icps,oldIcps);
const ctx=vm.createContext({document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync('icp-table.js','utf8')+';globalThis.table=IcpTable;',ctx);
const p=tab.positioning;
assert.equal(ctx.table.groups.reduce((n,[axis])=>n+ctx.table.leaves(p,axis).length,0),18);
let populated=0,blank=0;
for(const icp of p.icps){
 assert.ok(icp.buyingTrigger);assert.equal(icp.rows.length,1);
 assert.deepEqual(icp.workflowDetails,{axis:'Departments',workflows:[]});
 for(const [axis]of ctx.table.groups)for(const leaf of ctx.table.leaves(p,axis)){
  const value=ctx.table.value(icp.rows[0],axis,leaf.id);if(value)populated++;else blank++;
 }
}
assert.ok(populated>100);assert.ok(blank>0);
assert.equal(M.migrate(body,prompt).changed,false);
assert.equal(tab.icpRevisionArchive.length,1);
assert.throws(()=>M.migrate({workspaceProductId:'other'},prompt));
console.log('PASS: seven unselected candidates, 18 renderable leaf columns, sparse cells, preserved IDs/archive/workflows, other sections/products untouched, prompt idempotence and snapshot parity.',{populated,blank});
