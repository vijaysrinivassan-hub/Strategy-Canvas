import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),m=require('./tools/shorten-icp-canvas-labels.cjs'),layouts=require('./tools/ai-data-technology-canvas-layouts.json');
assert.equal(m.nameOf('Lifecycle diagnosis — orders → joins → output'),'Lifecycle diagnosis');
assert.equal(m.nameOf('Attribution-model comparison'),'Attribution-model comparison');
const p={icpChoices:{columns:{}},icps:[],selectedIcp:''};
for(const usecase of layouts){
 const key=JSON.stringify(['technology',JSON.stringify(['useCases',usecase.id])]);
 p.icpChoices.columns[key]=usecase.stages.map((branch,s)=>({id:'s'+s,text:branch.join('\n\nParallel branch: '),selected:false,canvas:{version:1,nodes:branch.map((text,n)=>({id:'n'+n,text}))}}));
}
p.icpChoices.columns[JSON.stringify(['input','maturity'])]=[{id:'data',text:'Data',selected:false}];
const TAB=m.TAB,PRODUCT=m.PRODUCT,b={client:'AI Data Platform',workspaceProductId:PRODUCT,tabs:{[TAB]:{positioning:p,icpCellCanvasRevision:'icp-cell-canvases-2026-09-16',aiPrompt:'ICP CELL CANVASES\nOld long rule\n\nAI DATA PLATFORM: TECHNOLOGY / USE CASES ONLY\nKeep this.'}},productWorkspaces:{[PRODUCT]:{tabs:{}}}};
assert.deepEqual(m.migrate(b),{changed:true,cells:25,nodes:31});
assert.equal(m.migrate(b).changed,false);
const all=Object.values(p.icpChoices.columns).flat(),nodes=all.flatMap(o=>o.canvas?.nodes||[]);
assert.equal(nodes.length,31);assert.ok(nodes.every(n=>!n.text.includes(' — ')));
const retention=p.icpChoices.columns[JSON.stringify(['technology',JSON.stringify(['useCases','retention-planning'])])];
assert.deepEqual(retention[1].canvas.nodes.map(n=>n.text),['Lifecycle diagnosis','Retention prediction']);
assert.equal(retention[1].text,'Lifecycle diagnosis\n\nParallel branch: Retention prediction');
assert.equal(b.tabs[TAB].icpCanvasLabelArchive.technologyChoices[JSON.stringify(['technology',JSON.stringify(['useCases','retention-planning'])])][1].canvas.nodes[0].text.includes(' — '),true);
assert.equal(b.tabs[TAB].aiPrompt.includes('Old long rule'),false);
assert.equal(b.tabs[TAB].aiPrompt.includes('AI DATA PLATFORM: TECHNOLOGY / USE CASES ONLY'),true);
assert.deepEqual(b.tabs[TAB],b.productWorkspaces[PRODUCT].tabs[TAB]);
console.log('PASS: 31 process-name labels, branch preservation, full-text archive, prompt cleanup, workspace mirror and idempotence.');
