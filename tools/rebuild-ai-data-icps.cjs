const candidates=require('./ai-data-platform-icps.json');
const TAB='Strategy 1 — Positioning Canvas',PRODUCT='0jgsw8bx554d',REVISION='ai-commerce-icps-2026-09-16';
function updatePrompt(prompt){
 const marker='\n\nAI DATA PLATFORM CONTEXT';
 return prompt.split(marker)[0]
 .replace('For payroll, distinguish HR/payroll staff (People) from employees whose pay is processed (Input).','For e-commerce data platforms, People means business operators, buyers and data owners; Input means orders, customers, events, products, stock and other authorised business data.')
 .replace('workforce mix, geography','source diversity, geography')
 .replace("the buyer's existing HRIS, attendance, accounting/ERP and integration or migration requirements","the buyer's commerce, advertising, CRM, operations and warehouse/BI stack")
 .replace('Process > Industries > Manufacturing / SaaS','Process > Departments > Marketing / Inventory / Purchasing')
 .replace('Payroll software for SMBs or Attendance-linked payroll for manufacturers','AI analytics for small e-commerce stores or Inventory decision support for catalogue-heavy merchants')
 +marker+'\nThe product is an AI data platform for e-commerce, joining authorised sources through a semantic layer and delivering reviewed intelligence. The current architecture names Shopify, Meta Ads, Google Ads and Klaviyo; those are proposed design nodes, not certification of shipped connectors. Preserve the analyst review step.\n\nMap candidate operating contexts, not one compulsory growth ladder: founder-led stores, paid-growth DTC, repeat-purchase/subscription brands, inventory-heavy merchants, omnichannel retailers and multi-brand/data-team businesses. Scale, catalogue complexity, buying model and data maturity can overlap. Use workload/source diversity rather than invented revenue thresholds. Distinguish current tools from proposed use cases.\n\nFor Process, show how Marketing, E-commerce/Merchandising, CRM/Retention, Inventory, Purchasing, Finance and Customer Service use different inputs and make different decisions. Add retail-model variations only where workflow changes; an entire e-commerce-only audience does not need unrelated industry columns. People separates buyer, operator and data steward. Technology separates source coverage and integration requirements. Input covers scale/page angle, data readiness and access/freshness needs. Include buying triggers, leave inapplicable cells blank and keep selectedIcp empty until the user chooses. Do not create Keywords pages.\n\nFor each AI use case, distinguish descriptive reporting, diagnostic hypotheses, forecasts, simulations and approved actions. Require sufficient relevant history, reliable identifiers, validation and uncertainty for predictions; state scenario assumptions; correlations do not prove causation. Supplier, inventory, POS, marketplace, finance and support connectors are extensions to verify. Do not promise arbitrary AI capabilities, accurate predictions, universal compatibility, unrestricted personal-data use or autonomous spending/pricing/orders/refunds. Write-back requires supported APIs, explicit approval, permissions and limits.\n\nSave only this product\'s ICP table and editable prompt with a revision guard and recoverable prior snapshot. Preserve existing workflow drafts, product labels, categories, competitive/value positioning and other products. Verify active-tab and workspace copies match. Flag mismatched labels without silently renaming products.';
}
function migrate(body,defaultPrompt){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Unexpected board/product');
 if(body.tabs?.['Strategy 1 — Product Architecture']?.architecture?.name!=='AI Data Platform')throw Error('Architecture does not match target');
 const tab=body.tabs[TAB],p=tab?.positioning;
 if(!p||p.icps?.length!==6)throw Error('Unexpected existing ICP structure');
 if(tab.icpUseCaseRevision===REVISION)return {changed:false};
 const clone=v=>JSON.parse(JSON.stringify(v));
 tab.icpRevisionArchive ||= [];
 tab.icpRevisionArchive.push({revision:REVISION,previousIcp:clone({icps:p.icps,selectedIcp:p.selectedIcp,icpTableColumns:p.icpTableColumns,icpCustomColumns:p.icpCustomColumns,icpNestedColumns:p.icpNestedColumns}),previousPrompt:tab.aiPrompt||''});
 p.icpCustomColumns ||= {};p.icpNestedColumns ||= {};
 const custom=(axis,id,name)=>{
  p.icpCustomColumns[axis] ||= [];
  if(!p.icpCustomColumns[axis].some(c=>c.id===id))p.icpCustomColumns[axis].push({id,name});
 };
 custom('people','commerce-roles','Roles');
 custom('process','commerce-model','Retail Model');
 custom('technology','commerce-stack','Existing Stack / Requirements');
 custom('input','commerce-scale','Scale / Use-Case Page');
 custom('input','commerce-quality','Data Readiness');
 custom('input','commerce-controls','Access / Freshness / Controls');
 const members={
 people:{'commerce-roles':[['buyer','Buyer / Sponsor'],['operator','Business Operators'],['steward','Data / Technical Owner']]},
 process:{departments:[['marketing','Marketing / Acquisition'],['product','E-commerce / Merchandising'],['crm','CRM / Retention'],['inventory','Inventory'],['purchase','Purchasing'],['finance','Finance'],['support','Customer Service']],'commerce-model':[['seasonal','One-Off / Seasonal'],['repeat','Repeat / Subscription'],['omnichannel','Multi-Channel / Location']]},
 technology:{'commerce-stack':[['store','Commerce Sources'],['growth','Advertising / CRM'],['operations','Operational Sources'],['data','Warehouse / BI / Activation']]}
 };
 for(const [axis,dims]of Object.entries(members)){
  p.icpNestedColumns[axis] ||= {};
  for(const [dim,list]of Object.entries(dims)){
   const old=p.icpNestedColumns[axis][dim]||[];
   p.icpNestedColumns[axis][dim]=[...list.map(([id,name])=>({id,name})),...old.filter(c=>!list.some(([id])=>id===c.id)).map(c=>({...c,hidden:true}))];
  }
 }
 p.icpTableColumns={people:['commerce-roles'],process:['departments','commerce-model'],technology:['commerce-stack'],input:['commerce-scale','commerce-quality','commerce-controls']};
 p.icps=candidates.map((c,i)=>{
  const prior=p.icps[i],row={id:prior.rows?.[0]?.id||prior.id+'-row',people:c.roles[0],process:c.departments[0],technology:c.technology[0],input:c.size,
   dimensions:{people:{},process:{},technology:{},input:{'commerce-scale':c.size,'commerce-quality':c.quality,'commerce-controls':c.controls}}};
  const assign=(axis,dim,values)=>members[axis][dim].forEach(([id],j)=>{if(values[j])row.dimensions[axis][JSON.stringify([dim,id])]=values[j];});
  assign('people','commerce-roles',c.roles);assign('process','departments',c.departments);assign('process','commerce-model',c.models);assign('technology','commerce-stack',c.technology);
  return {...prior,name:c.name,rows:[row],people:row.people,process:row.process,technology:row.technology,input:row.input,buyingTrigger:c.trigger,
   planningNote:'Candidate ICP/use-case hypotheses, not a compulsory maturity ladder or verified shipped feature list. Source names and integration requirements need validation. Sparse cells are intentional. Page angles are not search-demand research or published pages.'};
 });
 p.selectedIcp='';
 tab.aiPrompt=updatePrompt(tab.aiPrompt||defaultPrompt);tab.icpUseCaseRevision=REVISION;
 tab.positioningResearch ||= {};
 tab.positioningResearch.icpUseCaseSegmentation={updatedAt:'2026-09-16',status:'Candidate ICP options; none selected',
 basis:'User description, current proposed AI Data Platform architecture, and official commerce/AI documentation. Segmentation and page ideas are analyst hypotheses.',
 sources:[
 {url:'https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/inventory-reports',supports:'Product/variant, stock and location data support distinct inventory questions, with source-specific history and latency limits.'},
 {url:'https://help.klaviyo.com/hc/en-us/articles/360020919731',supports:'Predictive customer analytics depends on available customer/order data and eligibility; not an unconditional guarantee.'},
 {url:'https://kb.triplewhale.com/en/articles/11932150-what-are-moby-actions',supports:'AI execution is bounded by supported actions and connected-platform capabilities, not arbitrary AI power.'}
 ],limitations:'No named compatibility, causal lift, forecast accuracy or autonomous action claimed for this product. Other board labels/categories were not corrected because only the ICP exercise was requested.'};
 if(!body.productWorkspaces?.[PRODUCT]?.tabs)throw Error('Missing target workspace');
 body.productWorkspaces[PRODUCT].tabs[TAB]=clone(tab);
 return {changed:true,icps:p.icps.length,visibleColumns:20,selectedIcp:'',archiveEntries:tab.icpRevisionArchive.length};
}
module.exports={migrate,updatePrompt,TAB,PRODUCT,REVISION};
