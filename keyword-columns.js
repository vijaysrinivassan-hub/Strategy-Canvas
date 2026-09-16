/* Shared by the browser and MCP. Column IDs, never headings, own cell data. */
(function(root, factory){ const api=factory(); if(typeof module==='object') module.exports=api; else root.KeywordColumns=api; })(globalThis, function(){
const KIND='strategy-keyword-column-settings-v1';
const names={category:['Category name','Category synonyms','Features','Reviews','Pricing'],competitor:['Alternatives','Pricing','Reviews','Features'],icp:['ICP','Synonyms','Pains','Use cases','Content angles'],value:['Value proposition','Synonyms','Proof points','Objections','Content angles']};
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
const strategyPrompt="Read this before creating or reorganizing keyword content. Confirm the client and active product, then read its positioning and existing tables. Classify by the primary promise/search intent first, page format second, and column third. Do not classify from a single word or assume every imported item is a listicle.\n\nFOUR POSITIONING CATEGORIES\nICP: “This solution is the most suitable fit for you.” Content tailored to an industry, company size/maturity, job role/team, specific use case or process. A general definition of an HR job role is education, not automatically ICP positioning.\nCategory: “Understand this category of solution and how to choose.” Explain what the category is, how it works, capabilities, available players, alternatives between solution categories, evaluation criteria, implementation and buying considerations.\nCompetitor: Content about named competing products: alternatives, reviews, pricing, switching or product capabilities. Two-company comparisons belong in Competitor vs. Competitor, not another column merely because the phrase also contains pricing or features. Generic category-vs-category comparisons stay in Category.\nValue: “Here is useful knowledge or an outcome we help you achieve.” Problems and solutions, practical education, definitions, how-to guidance, templates, and functional, monetary or strategic benefits. Education can provide value without pitching the product.\n\nPAGE FORMATS\nCategory, ICP and Value each have Listicle pages, Informational pages and Landing pages (nine tables). Competitor and Competitor vs. Competitor are the other two tables.\nListicle = a roundup or list-led piece (tools, examples, tips, options). Informational = a guide, explanation, comparison of concepts, problem-solving article or definition. Landing = a commercial/product or focused resource page: feature, integration, service, industry, role or use-case page. A guide mentioning an integration is still informational. Use primary intent to select the category; a landing-page format does not automatically mean Competitor. Do not manufacture landing pages or force equal counts across tables.\n\nCOLUMNS AND PROMPTS\nReuse the most relevant existing column before creating one. Create a universal column only when its meaning transfers across clients, industries and products (for example By industry, Evaluation & buying, How-to guides, Feature pages). Keep the set small and distinct; do not create a column per keyword, country, named industry or feature.\nUse client/product-specific columns for genuinely specialized needs (for example Indian payroll & compliance). Universal definitions are edited in Settings and locked in client tables; local columns can be edited or removed for that product. Set an accurate name, concise inclusion/exclusion instruction and sensible defaults; defaults remain overridable per article. Put only column-specific guidance in each column prompt, not a copy of this strategy prompt.\nFor overlap, choose the dominant intent and retain the whole article/keyword cluster in one destination. Flag ambiguous or off-topic items for review; preserve them rather than silently deleting them.\n\nSAFE EDITING\nKeep human-readable titles in Title and URL slugs in Slug (stored as url); never put slugs in Title (v). Preserve text, slugs, keyword IDs/metrics, statuses, author labels and decisions while moving existing cells. Batch guarded changes; never clear and reimport a board. Stack populated entries top-to-bottom within each independent column, preserving order and leaving empty cells only after its last entry; do not compact competitor matrices in a way that breaks row/company identity. Preserve Written by; do not label future content Old automatically. Read current revisions, avoid overwriting concurrent edits, and verify content counts and assignments after changes.\n";
const icpAxisPrompt="ICP AXES\nIn every ICP Listicle, Informational and Landing table, organize columns under four axes. People covers Role / Team. Technology covers Technology or the existing tech stack. Process covers Industry, Country, Use Case and Company Size. Input covers workload, volume or other input-scale columns. Do not create or route content to Maturity Stage. Treat the axis as a structural group, then use the specific column to classify the content.";
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
