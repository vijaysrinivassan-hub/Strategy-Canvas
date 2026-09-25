/* Shared by the browser and MCP. Column IDs, never headings, own cell data. */
(function(root, factory){ const api=factory(); if(typeof module==='object') module.exports=api; else root.KeywordColumns=api; })(globalThis, function(){
const KIND='strategy-keyword-column-settings-v1';
const names={category:['Category name','Category synonyms','Feature pages','Integration pages','Reviews','Pricing'],competitor:['Alternatives','Pricing','Reviews','Features'],icp:['Industry','Country','Company size','Role / Team','Technology'],value:['Processes / Use cases','Nodal benefits','Capabilities','Problems','Outcomes']};
const ICP_AXIS_ORDER=['people','technology','process','input'];
const ICP_AXIS_LABELS={people:'People',technology:'Technology',process:'Process',input:'Input'};
function inferIcpAxis(name){
 const n=String(name||'').trim().toLowerCase();
 if(n==='role / team'||n==='role/team'||n==='role or team'||n==='people')return 'people';
 if(n==='technology'||n==='existing tech stack'||n==='tech stack')return 'technology';
 if(n==='company size')return 'process';
 if(n==='input'||n==='inputs'||n==='headcount')return 'input';
 return 'process';
}
function sortIcpColumns(columns){
 return (columns||[]).map((column,index)=>({column,index,axis:ICP_AXIS_ORDER.includes(column.axis)?column.axis:inferIcpAxis(column.name)}))
  .sort((a,b)=>ICP_AXIS_ORDER.indexOf(a.axis)-ICP_AXIS_ORDER.indexOf(b.axis)||a.index-b.index)
  .map(x=>x.column);
}
const comparisonRouting='Route two-company vs/versus keywords, including pricing and other modifiers, to their single Competitor vs Competitor cell. Put three-way comparisons or additional articles that need a separate entry in an Others row at the bottom of the relevant table. Reuse existing columns: use Switching, not Switching 2. Preserve metrics and existing decisions. Comparison defaults: Competitor type, Competitor aware; positive-volume entries without a status start For review. Keep routing rules here, not repeated in column prompts.';
const strategyPrompt="Read this before creating or reorganizing keyword content. Confirm the client and active product, then classify by primary search intent first, page format second, and column third.\n\nFOUR POSITIONING CATEGORIES\nICP means ‘this product is for you.’ Put audience-fit content here when the fit is defined by industry, country, company size (SMB, mid-market or enterprise), role/team, or installed technology. A process, use case, problem, benefit or outcome does not become ICP merely because an ICP experiences it.\nValue explains what the product helps someone do or obtain. Put processes and use cases, nodal benefits, capabilities, problems, desired outcomes, how-to education, and functional, monetary or strategic benefits here. Nodal benefit means the direct benefit created by a specific process node. Capability means what the product, technology or person can actually do at that node.\nCategory explains the solution category. Put category names and synonyms, category definitions and boundaries, evaluation criteria, feature pages, integration pages and capability-led category pages here.\nCompetitor requires a named competitor. Put [Competitor] alternatives, reviews, pricing and features here. Put two-company comparisons in the single Competitor vs Competitor cell; put three-way comparisons in Others. Do not route a named competitor term to Category, ICP or Value because it also contains a feature, industry or benefit.\n\nAEO AND SEO\nAEO directly positions the product, its category, fit or value. SEO leads with useful education and positions the product within that value. Preserve SEO when reorganizing AEO unless the user explicitly asks to change SEO.\n\nPAGE FORMATS\nListicle = roundup or list-led piece. Informational = guide, explanation, definition or problem-solving article. Landing = commercial or focused feature, integration, service, product, industry, role or country page. Use primary intent to choose the positioning category; page format alone does not decide it.\n\nSAFE EDITING\nKeep readable titles in Title and URL slugs in Slug. Preserve keyword IDs, metrics, statuses, author labels and decisions while moving cells. Reuse existing universal columns when possible. Create a universal column only when its meaning transfers across clients; otherwise create a client/product-specific column. Never clear and reimport a board when a guarded move can preserve data.\n";
const icpAxisPrompt="ICP AXES\nICP contains only audience-fit dimensions: Industry and Country under Process, Role / Team under People, Technology under Technology, and Company Size under Input. Processes and use cases belong to Value. Do not create or route content to Maturity Stage.";
const copy=x=>JSON.parse(JSON.stringify(x));
function seed(root){
 const out={kind:KIND,views:{}};
 for(const view of Object.keys(names)){
  const v=root?.views?.[view], cols=v?.columns || v?.types;
  out.views[view]=(cols?.filter(c=>c.name?.trim()).length ? cols.filter(c=>c.name?.trim()) : names[view].map(name=>({name})))
   .map((c,i)=>({id:'universal-'+view+'-'+i,name:c.name,instruction:c.instruction||'',...(view==='icp'?{axis:c.axis||inferIcpAxis(c.name)}:{}),defaults:{mode:c.defaults?.mode||'',articleType:root?.articleTypes?.find(t=>t.id===c.defaults?.type)?.name||'',aw:c.defaults?.aw||''}}));
  if(view==='competitor') out.views[view].unshift({id:'universal-competitor-row',role:'row',name:v?.rowColumn?.name||'Competitor Name',instruction:v?.rowColumn?.instruction||'',defaults:{mode:'',articleType:'',aw:''}});
 }
 out.routingInstruction=strategyPrompt+'\n\n'+icpAxisPrompt+'\n\n'+comparisonRouting;
 return out;
}
const pageTypes={listicle:'Listicle',informational:'Informational',landing:'Landing page'};
function ensurePageViews(config){
 config.pageViews ||= {};
 for(const view of ['category','icp','value']){
  config.pageViews[view] ||= {};
  for(const [group,type] of Object.entries(pageTypes)){
   config.pageViews[view][group] ||= copy(config.views[view]||[]).map(d=>({...d,defaults:{...d.defaults,articleType:type}}));
  }
 }
 return config;
}
function pageView(v,group){
 v.pageColumns ||= {}; v.pageOrders ||= {};
 v.pageColumns[group] ||= copy(v.columns||[]);
 const proxy=Object.create(v);
 Object.defineProperties(proxy,{
  columns:{get:()=>v.pageColumns[group],set:x=>v.pageColumns[group]=x},
  columnOrder:{get:()=>v.pageOrders[group],set:x=>v.pageOrders[group]=x}
 });
 return proxy;
}
function sync(root,config, nested=false){
 if(!config?.views) return root;
 root.routingInstruction=config.routingInstruction||comparisonRouting;
 root.views ||= {}; if(!root.articleTypes?.length) root.articleTypes=['Listicle','List item','Informational'].map(name=>({id:'universal-type-'+encodeURIComponent(name),name}));
 for(const [view,defs] of Object.entries(config.views)){
  const v=root.views[view] ||= {kind:view==='competitor'?'matrix':'grid',rows:[],cells:{}};
  const key=view==='competitor'?'types':'columns'; v[key] ||= [];
  const all=()=>view==='competitor'?[v.rowColumn,...v[key]].filter(Boolean):v[key];
  // Retiring a universal definition makes its existing columns local; data stays.
  for(const c of all()) if(c.universalId&&!defs.some(d=>d.id===c.universalId)) delete c.universalId;
  for(const d of defs){
   let c=d.role==='row'?(v.rowColumn ||= {}):v[key].find(c=>c.universalId===d.id);
   if(!c){
    c=v[key].find(c=>!c.universalId&&!c.local&&c.name===d.name);
    if(!c){c={id:d.id,name:d.name};v[key].push(c);}
    if(c.instruction || Object.values(c.defaults||{}).some(Boolean)) c.previousLocalSettings ||= copy({instruction:c.instruction,defaults:c.defaults});
   }
   let type='';
   if(d.defaults?.articleType){
    let t=root.articleTypes.find(t=>t.name===d.defaults.articleType);
    if(!t){t={id:'universal-type-'+encodeURIComponent(d.defaults.articleType),name:d.defaults.articleType};root.articleTypes.push(t);}
    type=t.id;
   }
   Object.assign(c,{universalId:d.id,name:d.name,instruction:d.instruction||'',...(view==='icp'?{axis:ICP_AXIS_ORDER.includes(d.axis)?d.axis:inferIcpAxis(d.name)}:{}),defaults:{mode:d.defaults?.mode||'',type,aw:d.defaults?.aw||''}});
  }
 }
 if(!nested){
  ensurePageViews(config);
  for(const [view,groups] of Object.entries(config.pageViews)){
   const v=root.views[view];
   if(!v)continue;
   for(const [group,defs] of Object.entries(groups)){
    const proxy=pageView(v,group);
    sync({views:{[view]:proxy},articleTypes:root.articleTypes},{views:{[view]:defs}},true);
   }
  }
 }
 return root;
}
function order(v){
 const ids=v.kind==='matrix'?['__row',...(v.types||[]).map(c=>c.id)]:(v.columns||[]).map(c=>c.id);
 return [...new Set([...(v.columnOrder||[]).filter(id=>ids.includes(id)),...ids])];
}
function move(v,id,delta){const ids=order(v),i=ids.indexOf(id),j=i+delta;if(i<0||j<0||j>=ids.length)return false;[ids[i],ids[j]]=[ids[j],ids[i]];v.columnOrder=ids;if(v.kind!=='matrix')v.columns.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));return true;}
return {KIND,names,seed,sync,order,move,comparisonRouting,strategyPrompt:strategyPrompt+'\n\n'+icpAxisPrompt,ensurePageViews,pageView,ICP_AXIS_ORDER,ICP_AXIS_LABELS,inferIcpAxis,sortIcpColumns};
});
