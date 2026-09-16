const layouts=require('./ai-data-technology-canvas-layouts.json');
const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const REV='icp-canvas-process-names-2026-09-16';
function nameOf(text){const value=String(text||'').trim(),cut=value.indexOf(' — ');return cut<0?value:value.slice(0,cut).trim();}
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong target');
 const tab=body.tabs[TAB],p=tab.positioning;if(tab.icpCanvasLabelRevision===REV)return {changed:false};
 if(tab.icpCellCanvasRevision!=='icp-cell-canvases-2026-09-16')throw Error('Canvas layout required');
 tab.icpCanvasLabelArchive=JSON.parse(JSON.stringify({technologyChoices:Object.fromEntries(Object.entries(p.icpChoices.columns).filter(([key])=>key.startsWith('["technology"'))),aiPrompt:tab.aiPrompt}));
 let cells=0,nodes=0;
 for(const usecase of layouts){
  const key=JSON.stringify(['technology',JSON.stringify(['useCases',usecase.id])]),list=p.icpChoices.columns[key];
  if(!list)throw Error('Missing '+usecase.id);
  for(const option of list){
   if(!option.canvas?.nodes?.length)throw Error('Missing canvas in '+usecase.id);
   for(const node of option.canvas.nodes){node.text=nameOf(node.text);nodes++;}
   option.text=option.canvas.nodes.map(n=>n.text).filter(Boolean).join('\n\nParallel branch: ');cells++;
  }
 }
 const oldPrompt=tab.aiPrompt||'',marker='AI DATA PLATFORM: TECHNOLOGY / USE CASES ONLY';
 const preserved=oldPrompt.includes(marker)?oldPrompt.slice(oldPrompt.indexOf(marker)):oldPrompt;
 tab.aiPrompt='ICP CANVAS LABELS\nInside every ICP stage canvas, write only the concise process or activity name, such as Lifecycle diagnosis or Retention prediction. Do not put source data, transformations, outputs, explanations, caveats or sentences inside the card. Keep detailed logic in internal research or the archived workflow, not in the visible node. Multiple cards in one stage still mean parallel branches.\n\n'+preserved;
 tab.icpCanvasLabelRevision=REV;body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,cells,nodes};
}
module.exports={migrate,nameOf,TAB,PRODUCT,REV};
