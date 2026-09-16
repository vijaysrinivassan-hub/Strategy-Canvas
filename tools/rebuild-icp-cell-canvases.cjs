const layouts=require('./ai-data-technology-canvas-layouts.json');
const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const REV='icp-cell-canvases-2026-09-16';
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong target');
 const tab=body.tabs[TAB],p=tab.positioning;if(tab.icpCellCanvasRevision===REV)return {changed:false};
 if(!p.icpChoices?.columns)throw Error('Choice model required');
 tab.icpCellCanvasArchive=JSON.parse(JSON.stringify({technologyChoices:Object.fromEntries(Object.entries(p.icpChoices.columns).filter(([k])=>k.startsWith('[\"technology\"'))),aiPrompt:tab.aiPrompt}));
 let cells=0,nodes=0;
 for(const usecase of layouts){
  const key=JSON.stringify(['technology',JSON.stringify(['useCases',usecase.id])]);
  if(!p.icpChoices.columns[key])throw Error('Missing use case '+usecase.id);
  p.icpChoices.columns[key]=usecase.stages.map((branch,stage)=>{
   const canvasNodes=branch.map((text,lane)=>({id:'canvas-'+usecase.id+'-'+(stage+1)+'-'+(lane+1),text}));nodes+=canvasNodes.length;cells++;
   return {id:'stage-'+usecase.id+'-'+(stage+1),text:branch.join('\n\nParallel branch: '),selected:false,canvas:{version:1,nodes:canvasNodes}};
  });
 }
 tab.aiPrompt='ICP CELL CANVASES\nEvery selectable ICP stage cell is a compact canvas containing one or more cards. One card is a single activity at that stage; multiple cards in the same canvas are parallel branches, not consecutive maturity steps. Use different numbers of cards and stages where the workflow requires them. Keep the stage selection and Keywords action at cell level. Cards remain editable, can be added or removed, and the table column expands to fit the widest branch.\n\nFor data use cases, preserve source data -> transformation/analysis -> output/decision in every card. Represent diagnosis and prediction as parallel branches when neither strictly depends on the other. Preserve true prerequisites as separate sequential stage cells. Do not imply that list order alone proves dependency, and do not claim integrations or models are shipped without verification.\n\n'+(tab.aiPrompt||'');
 tab.icpCellCanvasRevision=REV;body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,cells,nodes,branchedCells:layouts.flatMap(x=>x.stages).filter(x=>x.length>1).length};
}
module.exports={migrate,TAB,PRODUCT,REV};
