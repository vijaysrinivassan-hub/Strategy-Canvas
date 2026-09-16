const fs=require('node:fs');
const path=require('node:path');
const candidates=require('./payroll-icp-use-cases.json');
const instructions=fs.readFileSync(path.join(__dirname,'icp-use-case-instructions.txt'),'utf8').trim();
const TAB='Strategy 1 — Positioning Canvas', PRODUCT='w3c0vlewp9wj', REVISION='payroll-use-case-segmentation-2026-09-16';
function updatePrompt(old){
 const updated=old.indexOf('ICP AND USE-CASE DIFFERENTIATION');
 const start=updated>=0?updated:old.indexOf('ICP:');
 const end=old.indexOf('\n\nCategories:',start);
 if(start>=0&&end>start)return old.slice(0,start)+instructions+old.slice(end);
 const marker='\n\nICP AND USE-CASE DIFFERENTIATION';
 return old.split(marker)[0]+'\n\n'+instructions;
}
function migrate(body,defaultPrompt){
 if(body.workspaceProductId!==PRODUCT)throw Error('Payroll must be active; no product switch performed');
 const tab=body.tabs?.[TAB],p=tab?.positioning;
 if(!p||!Array.isArray(p.icps))throw Error('Missing Payroll ICP data');
 if(tab.icpUseCaseRevision===REVISION)return {changed:false};
 if(p.icps.length!==7)throw Error('Unexpected ICP count; review live changes before migration');
 const clone=v=>JSON.parse(JSON.stringify(v));
 tab.icpRevisionArchive ||= [];
 tab.icpRevisionArchive.push({revision:REVISION,previousIcp:clone({icps:p.icps,selectedIcp:p.selectedIcp,icpTableColumns:p.icpTableColumns,icpCustomColumns:p.icpCustomColumns,icpNestedColumns:p.icpNestedColumns}),previousPrompt:tab.aiPrompt||''});
 p.icpCustomColumns ||= {};p.icpNestedColumns ||= {};
 const custom=(axis,id,name)=>{
  p.icpCustomColumns[axis] ||= [];
  if(!p.icpCustomColumns[axis].some(c=>c.id===id))p.icpCustomColumns[axis].push({id,name});
 };
 custom('people','payroll-roles','Roles');
 custom('technology','payroll-existing-stack','Existing Technology');
 custom('input','payroll-size','Size / Use-Case Page');
 custom('input','payroll-data-readiness','Data Readiness');
 custom('input','payroll-input-complexity','Workforce / Input Complexity');
 const members={
  people:{'payroll-roles':[['payroll-operator','HR / Payroll Operator'],['payroll-finance','Finance / Buyer'],['payroll-approvers','Local / Department Approvers']]},
  process:{industries:[['payroll-it','SaaS / IT Services'],['payroll-industrial','Manufacturing / Mining'],['payroll-retail','Retail / E-commerce'],['payroll-health','Healthcare'],['payroll-professional','Professional Services']],departments:[['payroll-hr-ops','HR / Payroll Operations'],['payroll-finance-ops','Finance / Treasury'],['payroll-sales-ops','Sales / Compensation']]},
  technology:{'payroll-existing-stack':[['payroll-hris','HRIS / Employee Master'],['payroll-attendance','Attendance / Workforce Tools'],['payroll-erp','Accounting / ERP'],['payroll-migration','Spreadsheets / Legacy Migration']]}
 };
 for(const [axis,dims]of Object.entries(members)){
  p.icpNestedColumns[axis] ||= {};
  for(const [dim,list]of Object.entries(dims)){
   const existing=p.icpNestedColumns[axis][dim]||[];
   p.icpNestedColumns[axis][dim]=[...list.map(([id,name])=>({id,name})),...existing.filter(c=>!list.some(([id])=>id===c.id)).map(c=>({...c,hidden:true}))];
  }
 }
 p.icpTableColumns={people:['payroll-roles'],process:['industries','departments'],technology:['payroll-existing-stack'],input:['payroll-size','payroll-data-readiness','payroll-input-complexity']};
 p.icps=candidates.map((c,index)=>{
  const prior=p.icps[index];
  const row={id:prior.rows?.[0]?.id||prior.id+'-use-case-row',people:c.people[0],process:c.departments[0],technology:c.technology[0],input:c.size,dimensions:{people:{},process:{},technology:{},input:{'payroll-size':c.size,'payroll-data-readiness':c.readiness,'payroll-input-complexity':c.complexity}}};
  const assign=(axis,dim,values)=>members[axis][dim].forEach(([id],i)=>{if(values[i])row.dimensions[axis][JSON.stringify([dim,id])]=values[i];});
  assign('people','payroll-roles',c.people);assign('process','industries',c.industries);assign('process','departments',c.departments);assign('technology','payroll-existing-stack',c.technology);
  return {...prior,name:c.name,rows:[row],people:row.people,process:row.process,technology:row.technology,input:row.input,buyingTrigger:c.trigger,
   planningNote:'Candidate operating context, not a compulsory maturity stage. Size/staffing are illustrative; scenarios can overlap. Empty cells are intentional. Technology cells describe requirements, not verified native integrations. Page angles are proposals, not keyword research or published pages.'};
 });
 p.selectedIcp='';
 tab.aiPrompt=updatePrompt(tab.aiPrompt||defaultPrompt);
 tab.icpUseCaseRevision=REVISION;
 tab.positioningResearch ||= {};
 tab.positioningResearch.icpUseCaseSegmentation={updatedAt:'2026-09-16',status:'Candidate scenarios for client selection; no ICP selected',basis:'Existing proposed product architecture plus current official product documentation. Product capability and integration claims require client validation.',sources:[
 {url:'https://www.greythr.com/manufacturing/',supports:'Manufacturing-specific attendance, shift and overtime workflow context.'},
 {url:'https://www.zoho.com/in/payroll/integrations/',supports:'Separate employee/attendance, expense, accounting and banking interfaces as ecosystem contexts, not this client\'s verified connectors.'},
 {url:'https://help.keka.com/hc/en-us/articles/41388353533073-Approval-Workflow-Maker-Checker-for-Payroll-Finalisation',supports:'Payroll preparer and reviewer/approver as distinct responsibilities.'},
 {url:'https://www.keka.com/large-companies',supports:'Multi-entity, workforce-category and pay-cycle contexts; not compulsory for all large firms.'}
 ],limitations:'Illustrative segmentation hypotheses; no exact staffing benchmarks, legal thresholds, search-volume claims, or international coverage commitments. No customer-problem evidence was added or reclassified.'};
 if(!body.productWorkspaces?.[PRODUCT]?.tabs)throw Error('Missing Payroll workspace');
 body.productWorkspaces[PRODUCT].tabs[TAB]=clone(tab);
 return {changed:true,icps:p.icps.length,selectedIcp:p.selectedIcp,visibleColumns:18,archiveEntries:tab.icpRevisionArchive.length};
}
module.exports={migrate,updatePrompt,TAB,PRODUCT,REVISION};
