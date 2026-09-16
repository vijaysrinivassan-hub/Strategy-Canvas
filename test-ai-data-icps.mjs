import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import M from './tools/rebuild-ai-data-icps.cjs';
const prompt=JSON.parse(fs.readFileSync('ai-prompts.json','utf8')).positioning_canvas.prompt;
const updated=M.updatePrompt(prompt);
assert.equal(M.updatePrompt(updated),updated);
assert.ok(updated.includes('AI DATA PLATFORM CONTEXT'));
assert.ok(updated.includes('Categories:'));assert.ok(updated.includes('at least FIVE'));
const icps=Array.from({length:6},(_,i)=>({id:'icp-'+i,name:'',rows:[{id:'row-'+i,people:''}],workflowDetails:{axis:'Departments',workflows:[{id:'draft',name:'Product',stages:[]}]}}));
const tab={positioning:{icps:structuredClone(icps),selectedIcp:'icp-2',selectedCategory:'keep-category',categories:[{id:'keep'}],competitive:{selectedStage:'keep'},valueRows:[{id:'keep'}]},problems:[{id:'evidence'}]};
const body={client:'AI Data Platform',clientProduct:'Payroll',workspaceProductId:M.PRODUCT,tabs:{[M.TAB]:tab,'Strategy 1 — Product Architecture':{architecture:{name:'AI Data Platform'}},Keywords:{keep:true}},
 productWorkspaces:{[M.PRODUCT]:{tabs:{[M.TAB]:structuredClone(tab)}},other:{tabs:{keep:true}}}};
const before=structuredClone(body);
const result=M.migrate(body,prompt);
assert.equal(result.icps,6);assert.equal(tab.positioning.selectedIcp,'');
assert.equal(body.clientProduct,'Payroll');
assert.deepEqual(body.productWorkspaces.other,before.productWorkspaces.other);
assert.deepEqual(body.tabs.Keywords,before.tabs.Keywords);
assert.deepEqual(tab.problems,before.tabs[M.TAB].problems);
for(const k of ['categories','competitive','valueRows','selectedCategory'])assert.deepEqual(tab.positioning[k],before.tabs[M.TAB].positioning[k]);
assert.deepEqual(tab.icpRevisionArchive[0].previousIcp.icps,icps);
assert.deepEqual(body.productWorkspaces[M.PRODUCT].tabs[M.TAB],tab);
const ctx=vm.createContext({document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync('icp-table.js','utf8')+';globalThis.table=IcpTable;',ctx);
assert.equal(ctx.table.groups.reduce((n,[axis])=>n+ctx.table.leaves(tab.positioning,axis).length,0),20);
let filled=0,blank=0;
for(const [i,candidate]of tab.positioning.icps.entries()){
 assert.equal(candidate.id,icps[i].id);assert.ok(candidate.buyingTrigger);
 assert.deepEqual(candidate.workflowDetails,icps[i].workflowDetails);
 for(const [axis]of ctx.table.groups)for(const leaf of ctx.table.leaves(tab.positioning,axis)){
  if(ctx.table.value(candidate.rows[0],axis,leaf.id))filled++;else blank++;
 }
}
assert.ok(filled>100&&blank>0);
assert.equal(M.migrate(body,prompt).changed,false);
assert.throws(()=>M.migrate({...body,client:'Another client'},prompt));
console.log('PASS: six unselected AI-commerce ICPs, 20 renderable columns, retained workflow drafts, label preservation, other sections/products unchanged and idempotence.',{filled,blank});
