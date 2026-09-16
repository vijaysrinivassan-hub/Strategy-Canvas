const cases=require('./ai-data-technology-use-cases.json');
const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const REV='technology-use-cases-2026-09-16';
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong target');
 const tab=body.tabs[TAB],p=tab.positioning;
 if(tab.technologyUseCaseRevision===REV)return {changed:false};
 if(!p.icpChoices?.columns)throw Error('Independent choice model required');
 tab.technologyUseCaseArchive=JSON.parse(JSON.stringify({icpTableColumns:p.icpTableColumns,icpNestedColumns:p.icpNestedColumns,icpChoices:p.icpChoices,aiPrompt:tab.aiPrompt}));
 p.icpTableColumns={people:[],process:[],technology:['useCases'],input:[]};
 p.icpNestedColumns ||= {};p.icpNestedColumns.technology ||= {};
 p.icpNestedColumns.technology.useCases=cases.map(c=>({id:c.id,name:c.name}));
 let count=0;
 for(const c of cases){const key=JSON.stringify(['technology',JSON.stringify(['useCases',c.id])]);if(p.icpChoices.columns[key]?.length)throw Error('Target use case already has content');p.icpChoices.columns[key]=c.stages.map((text,i)=>({id:'tech-usecase-'+c.id+'-'+(i+1),text,selected:false}));count+=c.stages.length;}
 const inputKey=JSON.stringify(['input','maturity']);
 if(!p.icpChoices.columns[inputKey]?.length)p.icpChoices.columns[inputKey]=[{id:'core-input-data',text:'Data',selected:false}];
 tab.aiPrompt='AI DATA PLATFORM: TECHNOLOGY / USE CASES ONLY\nFor this client, only Technology has a sub-axis: Use Cases. Each child column is a concrete data-driven use case, not a department or generic software stack. More than one use case may belong to Marketing and none is required for an irrelevant department. People, Process and Input remain unsplit primary axes; the core input is Data. Do not expand or refill those axes unless asked. Preserve their hidden prior content.\n\nFor each use case, give independent selectable stages describing source data -> technology/transformation -> analytical output -> reviewed decision. Show how the same use case develops from reporting to diagnosis and, only where justified, validated prediction, simulation or approved execution. Do not force equal stage counts or claim every use case needs AI. Inventory planning is one use-case column, not a department-wide catch-all. Keep all new options unselected. These are simulations, not verified shipped capabilities; connectors, reliable history, permissions, validation and write-back support are prerequisites.\n\n'+(tab.aiPrompt||'');
 tab.technologyUseCaseRevision=REV;
 body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,useCases:cases.length,technologyOptions:count};
}
module.exports={migrate,TAB,PRODUCT,REV};
