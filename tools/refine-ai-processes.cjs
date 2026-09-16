const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const REVISION='named-process-evolution-2026-09-16';
const ladders={
 marketing:['Acquisition performance reporting','Acquisition-efficiency diagnosis','Cohort-quality analysis','Stock-aware campaign planning','Cross-channel attribution analysis','Governed budget scenario planning'],
 product:['Product sales reporting','Conversion and returns diagnosis','Basket and reorder analysis','Assortment scenario planning','Channel assortment comparison','Cross-brand assortment experimentation'],
 crm:['Repeat-purchase reporting','Lifecycle campaign diagnosis','Retention and churn modelling','Availability-aware audience planning','Cross-channel cohort analysis','Governed retention experimentation'],
 inventory:['Stock monitoring','Demand and availability diagnosis','Repeat-demand analysis','Demand forecasting and replenishment simulation','Multi-location inventory allocation','Constrained inventory scenario planning'],
 purchase:['Reorder requirement reporting','Supplier and lead-time diagnosis','Scheduled replenishment planning','Purchase-order optimisation scenarios','Consolidated procurement planning','Constrained sourcing scenario planning'],
 finance:['Sales and margin reporting','Contribution-margin diagnosis','Cohort payback analysis','Inventory working-capital planning','Channel settlement reconciliation','Multi-entity financial scenario planning'],
 support:['Support query reporting','Return-reason diagnosis','Retention-impact analysis','Product issue root-cause investigation','Cross-channel service analysis','Governed service improvement planning']
};
const progression={
 marketing:'Performance reporting -> efficiency diagnosis -> cohort analysis -> budget scenarios -> reviewed experiments',
 product:'Sales reporting -> conversion diagnosis -> basket analysis -> assortment scenarios -> reviewed experiments',
 crm:'Repeat-rate reporting -> lifecycle diagnosis -> retention modelling -> intervention scenarios -> reviewed campaigns',
 inventory:'Stock reporting -> stockout/overstock diagnosis -> demand forecasting -> replenishment simulation -> reviewed replenishment/allocation',
 purchase:'Reorder reporting -> supplier/lead-time analysis -> demand-linked purchasing -> sourcing scenarios -> approved purchase orders',
 finance:'Revenue reporting -> margin diagnosis -> payback analysis -> cash/working-capital scenarios -> reviewed financial planning',
 support:'Query reporting -> issue classification -> root-cause analysis -> service intervention planning -> reviewed task routing'
};
const guidance='NAME THE PROCESS AND ITS EVOLUTION\nA department is a context, not a process. Name the concrete activity in each Process cell, then describe how that same activity develops: reporting -> diagnosis -> prediction (where feasible) -> scenario planning -> approved action. For Inventory, distinguish stock monitoring, demand forecasting, replenishment planning and allocation; these are related processes, not synonyms. Show the relevant activity for each ICP and its inputs, decision and next capability. Department, company size and maturity are independent: a large company can still report manually, and a small specialist can forecast. Leave unsupported/inapplicable stages blank; prediction needs relevant history and validation, and execution needs supported integrations and approval.\n\nCELL-TO-KEYWORDS\nWhen the user ticks a cell, preview an editable topic and unresearched keyword ideas. Listicle routes to ICP Listicle pages, Service to ICP Landing pages, Informational to ICP Informational pages. Preserve the chosen AEO/SEO channel. Treat these as initial ICP-specific briefs, not verified search demand or shipped-feature claims. Reuse suitable columns, create local columns only when needed, avoid duplicate briefs from the same source/format/channel, and never replace measured keyword data with suggested phrases. The user can refine intent before research.';
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong client/product');
 const tab=body.tabs[TAB],p=tab.positioning;
 if(tab.processEvolutionRevision===REVISION)return {changed:false};
 if(p.icps.length!==6)throw Error('Unexpected ICP count');
 const previous=p.icps.map(i=>({id:i.id,process:i.process,rows:i.rows.map(r=>({id:r.id,process:r.process,dimensions:r.dimensions?.process}))}));
 tab.processEvolutionArchive={revision:REVISION,previous,aiPrompt:tab.aiPrompt};
 let count=0;
 p.icps.forEach((icp,index)=>{
  icp.rows.forEach(row=>{
   for(const [department,names] of Object.entries(ladders)){
    const key=JSON.stringify(['departments',department]),old=row.dimensions?.process?.[key];
    if(!old)continue;
    row.dimensions.process[key]='Process: '+names[index]+'\nEvolution path: '+progression[department]+'\nIn this ICP: '+old;
    count++;
   }
   row.process=row.dimensions?.process?.[JSON.stringify(['departments','marketing'])]||row.process;
  });
  icp.process=icp.rows[0].process;
 });
 tab.aiPrompt=(tab.aiPrompt||'')+'\n\n'+guidance;
 tab.processEvolutionRevision=REVISION;
 body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,cells:count};
}
module.exports={migrate,ladders,progression,guidance,TAB,PRODUCT,REVISION};
