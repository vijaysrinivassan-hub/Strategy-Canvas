const {TAB,PRODUCT}=require('./rebuild-ai-data-icps.cjs');
const REV='restore-september-15-icp-cards-2026-09-16';
const cardGuidance='ICP CARD MODEL\nCreate separate candidate ICP cards. Each card has an editable name and any number of sparse rows. Every row has People, Process, Technology and Input; leave cells blank when that ICP does not need another entry, and never pad rows merely for symmetry. People means relevant roles or staffing, Process means how work is done, Technology means existing tools, and Input means the workload or population served. Select one whole ICP card after client agreement. For the selected card, maintain Buying Trigger, Industries and Use Cases. Do not create independent icpChoices, grouped table subcolumns or stage canvases.';
function migrate(body){
 if(body.client!=='AI Data Platform'||body.workspaceProductId!==PRODUCT)throw Error('Wrong target');
 const tab=body.tabs[TAB],p=tab.positioning;if(tab.legacyIcpCardRevision===REV)return {changed:false};
 const source=tab.independentIcpArchive?.positioningIcp;if(!source?.icps?.length)throw Error('Archived six-profile snapshot missing');
 tab.legacyIcpCardRestoreArchive=JSON.parse(JSON.stringify({current:{icps:p.icps,selectedIcp:p.selectedIcp,icpChoices:p.icpChoices,icpTableColumns:p.icpTableColumns,icpCustomColumns:p.icpCustomColumns,icpNestedColumns:p.icpNestedColumns},aiPrompt:tab.aiPrompt}));
 p.icps=structuredClone(source.icps);p.selectedIcp=source.selectedIcp||'';
 delete p.icpChoices;delete p.icpLegacySelection;delete p.icpTableColumns;delete p.icpCustomColumns;delete p.icpNestedColumns;
 for(const icp of p.icps){if(typeof icp.industries!=='string')icp.industries='';if(typeof icp.useCases!=='string')icp.useCases='';if(typeof icp.buyingTrigger!=='string')icp.buyingTrigger='';}
 const old=tab.aiPrompt||'',start=old.indexOf('Categories:'),canvas=old.indexOf('\n\nICP CELL CANVASES');
 const rest=start>=0?old.slice(start,canvas>start?canvas:undefined):'';
 tab.aiPrompt=cardGuidance+(rest?'\n\n'+rest:'');
 tab.legacyIcpCardRevision=REV;body.productWorkspaces[PRODUCT].tabs[TAB]=structuredClone(tab);
 return {changed:true,icps:p.icps.length,rows:p.icps.reduce((n,i)=>n+i.rows.length,0),selected:p.selectedIcp};
}
module.exports={migrate,cardGuidance,TAB,PRODUCT,REV};
