const crypto=require('node:crypto');
const K=require('../keyword-columns.js');

const groups={listicle:'Listicle',informational:'Informational',landing:'Landing page'};
const columns=[
 {name:'Role / Team',axis:'people',instruction:'Fit for a buyer role or team; generic job definitions are not ICP positioning.'},
 {name:'Technology',axis:'technology',instruction:'Fit with the installed technology or tool stack. Explanations of a connector belong in Integration Pages.'},
 {name:'Industry',axis:'process',instruction:'Fit for an industry whose operating process changes the use of the product.'},
 {name:'Country',axis:'process',instruction:'Fit for a country, jurisdiction, language, coverage or regulatory process.'},
 {name:'Use Case',axis:'process',instruction:'Fit for a specific job, workflow or operating situation; distinguish the process from its benefit.'},
 {name:'Company Size',axis:'process',instruction:'Fit by employee count, workload, data volume or organizational scale.'}
];
const stableId=(group,name)=>'icp-axis-'+crypto.createHash('sha256').update(group+'|'+name).digest('hex').slice(0,16);
const populated=cell=>!!cell&&(String(cell.v||'').trim()||String(cell.url||'').trim()||(cell.kws||[]).length||cell.on||cell.st||cell.type||cell.aw||cell.by);
const retiredNames=new Set(['Maturity Stage','Doing It Yourself','Segment-Specific Problems','Segment-Specific Outcomes','Segment-Specific Requirements','ICP','Column','Industry Pages','Use cases','Content angles']);

function configure(config){
 K.ensurePageViews(config);
 for(const [group,articleType] of Object.entries(groups)){
  const before=config.pageViews.icp[group]||[];
  config.pageViews.icp[group]=columns.map(spec=>{
   const existing=before.find(d=>d.name===spec.name||(spec.name==='Technology'&&d.name==='Existing Tech Stack'));
   return {
    id:existing?.id||stableId(group,spec.name),
    name:spec.name,
    axis:spec.axis,
    instruction:spec.instruction+' Format: '+group+'. Reuse this column and preserve existing article decisions.',
    defaults:{mode:existing?.defaults?.mode||'seo',articleType,aw:existing?.defaults?.aw||''}
   };
  });
 }
 const marker='\n\nICP KEYWORD AXES\n';
 const rule='Use four grouped axes in every ICP table. People: Role / Team. Technology: Technology. Process: Industry, Country, Use Case, Company Size. Input: workload, volume or other input-scale columns. Do not create or route content to Maturity Stage. Choose the axis first and the specific column second.';
 config.routingInstruction=(config.routingInstruction||K.strategyPrompt).split(marker)[0]+marker+rule;
 return config;
}

function migrateRoot(contentRoot,config){
 const view=contentRoot?.views?.icp;if(!view)return {removed:0,preserved:0};
 K.sync(contentRoot,config);
 let removed=0,preserved=0;
 for(const group of Object.keys(groups)){
  const page=K.pageView(view,group);
  for(const col of page.columns){
   col.axis=K.ICP_AXIS_ORDER.includes(col.axis)?col.axis:K.inferIcpAxis(col.name);
   if(col.name==='Existing Tech Stack')col.name='Technology';
  }
  page.columns=page.columns.filter(col=>{
   if(!retiredNames.has(col.name))return true;
   const used=(view.rows||[]).some(row=>(row.pageGroup||'listicle')===group&&populated(row.cells?.[col.id]));
   if(used){
    if(col.name==='Maturity Stage')col.name='Maturity Stage (retired)';
    col.axis=col.name==='Maturity Stage (retired)'?'input':'process';preserved++;return true;
   }
   for(const row of view.rows||[])if((row.pageGroup||'listicle')===group&&row.cells)delete row.cells[col.id];
   removed++;return false;
  });
  const ids=new Set(page.columns.map(c=>c.id));
  page.columnOrder=K.sortIcpColumns(page.columns).map(c=>c.id).filter(id=>ids.has(id));
  page.columns=page.columnOrder.map(id=>page.columns.find(c=>c.id===id));
 }
 return {removed,preserved};
}

function migrateBoard(board,config){
 const roots=[];
 if(board.tabs?.['Content Strategy'])roots.push(board.tabs['Content Strategy']);
 for(const workspace of Object.values(board.productWorkspaces||{}))if(workspace?.tabs?.['Content Strategy'])roots.push(workspace.tabs['Content Strategy']);
 return roots.reduce((sum,root)=>{const next=migrateRoot(root,config);sum.removed+=next.removed;sum.preserved+=next.preserved;return sum;},{removed:0,preserved:0});
}

module.exports={columns,groups,configure,migrateRoot,migrateBoard};
