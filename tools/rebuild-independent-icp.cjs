const data=require('./ai-data-platform-choices.json');
const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const guidance="INDEPENDENT ICP CHOICES\nDo not create fixed ICP 1-6 personas or make horizontally aligned cells a customer profile. Each visible leaf column owns an independent list of options and may contain a different number of entries. People describes roles, ownership and staffing (including no dedicated person); Process names real activities and their evolution within each department; Technology describes existing stack/readiness; Input describes volume, complexity, quality and access requirements. Do not equate company size with process maturity. Populate meaningful options only, without padding other columns to match. Buying triggers are independent options in the last column.\n\nThe user defines the ICP by selecting zero, one or multiple options per column. Never preselect options during research. Multiple selections are alternatives or coverage within that column, not proof that every selected condition coexists in one company; validate combinations with the user. Preserve the keyword tick as a separate action from Include in ICP. The saved icpChoices.columns dictionary is keyed by JSON.stringify([axis, leafId]); each option has a stable id, text and selected flag. Only visible selected populated options define the current ICP. Maintain the composed-icp compatibility profile for downstream documents, but do not display it as a named persona column. Preserve existing keywords, other positioning sections and other products; archive old profiles before a requested rebuild. No invented integrations, native AI capabilities, search volumes or customer results.";
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong client/product');
 const tab=body.tabs[TAB],p=tab.positioning;
 if(tab.independentIcpRevision==='2026-09-16-v1')return {changed:false};
 tab.independentIcpArchive={positioningIcp:structuredClone({icps:p.icps,selectedIcp:p.selectedIcp,icpChoices:p.icpChoices,icpTableColumns:p.icpTableColumns,icpCustomColumns:p.icpCustomColumns,icpNestedColumns:p.icpNestedColumns}),aiPrompt:tab.aiPrompt};
 p.icpChoices={version:1,columns:{}};let n=0;
 function add(axis,column,texts){p.icpChoices.columns[JSON.stringify([axis,column])]=texts.map(text=>({id:'commerce-choice-'+(++n),text,selected:false}));}
 for(const [axis,dims]of Object.entries(data.groups))for(const [dim,values]of Object.entries(dims)){
  if(Array.isArray(values))add(axis,dim,values);
  else for(const [member,texts]of Object.entries(values))add(axis,JSON.stringify([dim,member]),texts);
 }
 add('trigger','maturity',data.triggers);
 p.icpTableColumns.process=['departments'];
 p.icps=[];p.selectedIcp='';
 tab.aiPrompt=guidance+'\n\nPRODUCT CONTEXT\nAI Data Platform connects authorised e-commerce sources for reviewed analysis and decision support. Shopify, Meta Ads, Google Ads and Klaviyo appear in its proposed architecture, not as proof of shipped integrations. Inventory, supplier, finance and service extensions need verification. Process options show possible activities and progression, not features already delivered. Leave all choices unselected for the user. Preserve existing category, competitor, value and evidence work.';
 const oldPrompt=tab.independentIcpArchive.aiPrompt||'';
 const start=oldPrompt.indexOf('Categories:');
 const end=oldPrompt.indexOf('\n\nAI DATA PLATFORM CONTEXT');
 if(start>=0)tab.aiPrompt+='\n\n'+oldPrompt.slice(start,end>start?end:undefined);
 tab.independentIcpArchive=JSON.parse(JSON.stringify(tab.independentIcpArchive));
 tab.independentIcpRevision='2026-09-16-v1';
 body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,columns:Object.keys(p.icpChoices.columns).length,options:n};
}
module.exports={migrate,guidance,TAB,PRODUCT};
