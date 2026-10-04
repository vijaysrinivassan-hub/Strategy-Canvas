/* Shared by the browser and MCP. Column IDs, never headings, own cell data. */
(function(root, factory){ const api=factory(); if(typeof module==='object') module.exports=api; else root.KeywordColumns=api; })(globalThis, function(){
const KIND='strategy-keyword-column-settings-v1';
const PROMPT_REVISION='keyword-taxonomy-v12';
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
const comparisonRouting='Route every genuine two-company vs/versus keyword or URL, including pricing and other modifiers, to its single Competitor vs Competitor cell. If a direct-comparison URL is currently attached to Alternatives, Reviews, Pricing or Features, move that URL and its metadata into the matching pair cell and remove it from the standard competitor cell; ordinary alternatives, review, pricing and feature URLs remain in their original columns. When a competitor is added, show exactly one unordered comparison cell between that competitor and every other named player in the canonical matrix, with a readable “[new competitor] vs [existing competitor]” title; never create self-comparisons or mirrored duplicates. Status and color depend on content: a comparison cell containing an imported URL, assigned keyword, or manually entered content defaults to For review and appears yellow. A comparison cell without content keeps the empty Status placeholder and remains white. Preserve every explicitly chosen status. Put three-way comparisons or additional articles that need a separate entry in an Others row at the bottom of the relevant table. Reuse existing columns: use Switching, not Switching 2. Preserve metrics, URLs, statuses and existing decisions in any pair cell that already exists. Keep routing rules here, not repeated in column prompts.';
const placementPrompt='PLACEMENT AND COMPACTION\nWhenever URLs, keywords or topics are imported, moved or reclassified, fill each destination column from its first available cell. Never leave an empty cell above a populated cell or strand populated cells midway down a column. Compact each column independently while preserving its axis, metadata, status and URL ownership. Put one URL in one content cell unless the source explicitly groups multiple URLs as equivalent coverage of the same topic.';
const competitorSourcePrompt='COMPETITOR SOURCE OF TRUTH\nThe selected category in Positioning Canvas owns the canonical competitor list. Sync those names into Competitor Aware; do not maintain a second unrelated competitor list in Category Aware. Any topic containing a named competitor belongs in Competitor Aware, including alternatives, reviews, pricing, features and direct comparisons. A company name never becomes Category Aware merely because the company sells within that category. When research reveals a competitor, reconcile it in Positioning Canvas first, then sync the Competitor Aware matrix.';
const categoryAwarePrompt='CATEGORY AWARE\nCategory Aware is for a buyer who already knows the solution category and is learning, evaluating, or purchasing within that category. It is not a catch-all for every page that mentions the category. Read each source page itself—including its title, H1, description, and substantive body—before classifying it; never decide from the URL slug alone. Keep competitor-specific pages in Competitor Aware, audience-fit pages in ICP, and problem/use-case/outcome education in Value unless the page\'s primary purpose is to define or evaluate the category.\n\nFor AEO listicles, Category name contains roundups using the primary category wording, such as “10 best e-commerce data analytics tools.” Category synonyms contains equivalent category roundups expressed with materially different category wording, such as e-commerce analytics software, dashboards, reporting tools, or closely adjacent category terms. A page may discuss one or several categories when its primary purpose is category comparison or selection.\n\nFor AEO landing pages, use category-level Feature pages, Integration pages, Service pages, or another accurate landing-page column. These pages must sell or explain a capability expected from the category, an integration offered by the category, or a service within the category—not merely a narrow outcome for one ICP.\n\nFor SEO informational pages, include direct category definitions, how the category works, category boundaries, buying criteria, expected features, and category-level pricing guidance. Do not move a product-specific price page into Category Aware merely because it contains a price.';
const icpSeoMatrixPrompt='ICP SEO MATRIX — ALL CLIENTS AND PRODUCTS\nAlways arrange ICP SEO as a true two-axis matrix; never reduce it to a flat list or a horizontal-only table. In both Problem Unaware and Problem Aware, ICP SEO must use exactly the same horizontal topic headers as Value SEO: Guides, How To Articles, Explainers, Trends, and Topic vs Topic. The horizontal axis is therefore identical in ICP SEO and Value SEO; the URLs differ and only the header structure is shared. Build the vertical axis as a client-specific ICP hierarchy. Use a parent dimension such as Industry, Company Size, Process / Use Case, Country, Technology, or Role / Team, then place the relevant child segments beneath it. Display the parent as a merged vertical group and each child as its own row header. Place every keyword, topic, or URL only at the intersection of its correct vertical ICP segment and horizontal topic header. Reuse this structure for every existing and future client while deriving the actual dimensions, child segments and departments from that client\'s positioning, maturity axis, product, and source data; copy the layout rule, never another client\'s labels or content. Fill each vertical-group/column intersection from its first available row, compact populated cells upward, and do not leave empty rows above populated cells. Preserve the same hierarchy when filtering and repack matching cells at the top without blank gaps. Do not create a second ICP SEO table when the existing one can be enriched.';
const solutionAwareMatrixPrompt='SOLUTION AWARE MATRICES\nBuild the axes from the client’s actual flagship category and product scope, never from a generic multi-industry template. Use the category or categories the product genuinely serves as the grouped vertical axis; one flagship category means one vertical category. For ICP AEO, create horizontal columns only for evidenced fit dimensions such as the actual industry, company or team size, role/team and installed technology. Never add a country or industry without evidence. For Value AEO, retain the same category axis and classify commercial product pages by what the product actually does: capabilities, features, processes/use cases, and benefits/outcomes. Populate from the first available cells and hide unused template axes. Keep content only in the active product workspace; never copy an AI Layer product into Capital Layer.';
const urlAuditPrompt='URL AUDIT AND AEO ELIGIBILITY\nRead the full URL inventory and the actual title, H1, description and page content before routing; never classify from a keyword in the slug alone. ICP AEO and Value AEO accept only genuine listicles and commercial landing pages. Informational guides, glossaries and educational articles belong in the appropriate SEO table even when the slug contains tools, software or pricing. Keep Industry, Company Size, Role / Team and Technology independent and store an explicit segment for every ICP AEO URL: agencies are Role / Team, enterprise is Company Size, and a data-stack product is Technology. A thank-you, confirmation, utility, search or broken page is Corporate & Non-SEO and never appears in Keywords. Any direct vendor-vendor comparison belongs only in Competitor vs Competitor. A named competitor pricing page belongs in that competitor’s Pricing cell, not Value.';
const strategyPrompt="Read this before creating or reorganizing keyword content. Confirm the client and active product, then classify by primary search intent first, page format second, and column third.\n\nFOUR POSITIONING CATEGORIES\nICP means ‘this product is for you.’ Put audience-fit content here when the fit is defined by industry, country, company size (SMB, mid-market or enterprise), role/team, or installed technology. A process, use case, problem, benefit or outcome does not become ICP merely because an ICP experiences it.\nValue explains what the product helps someone do or obtain. Put processes and use cases, nodal benefits, capabilities, problems, desired outcomes, how-to education, and functional, monetary or strategic benefits here. Nodal benefit means the direct benefit created by a specific process node. Capability means what the product, technology or person can actually do at that node.\nCategory explains the solution category. Put category names and synonyms, category definitions and boundaries, evaluation criteria, feature pages, integration pages and capability-led category pages here.\nCompetitor requires a named competitor. Put [Competitor] alternatives, reviews, pricing and features here. Put two-company comparisons in the single Competitor vs Competitor cell; put three-way comparisons in Others. Do not route a named competitor term to Category, ICP or Value because it also contains a feature, industry or benefit.\n\nAEO AND SEO\nAEO directly positions the product, its category, fit or value. SEO leads with useful education and positions the product within that value. Preserve SEO when reorganizing AEO unless the user explicitly asks to change SEO.\n\nPAGE FORMATS\nListicle = roundup or list-led piece. Informational = guide, explanation, definition or problem-solving article. Landing = commercial or focused feature, integration, service, product, industry, role or country page. Use primary intent to choose the positioning category; page format alone does not decide it.\n\nSAFE EDITING\nKeep readable titles in Title and URL slugs in Slug. Preserve keyword IDs, metrics, statuses, author labels and decisions while moving cells. Reuse existing universal columns when possible. Create a universal column only when its meaning transfers across clients; otherwise create a client/product-specific column. Never clear and reimport a board when a guarded move can preserve data.\n";
const icpAxisPrompt="ICP AXES\nICP contains only audience-fit dimensions: Industry and Country under Process, Role / Team under People, Technology under Technology, and Company Size under Input. Processes and use cases belong to Value. Do not create or route content to Maturity Stage.";
const copy=x=>JSON.parse(JSON.stringify(x));
function seed(root){
 const out={kind:KIND,promptRevision:PROMPT_REVISION,views:{}};
 for(const view of Object.keys(names)){
  const v=root?.views?.[view], cols=v?.columns || v?.types;
  out.views[view]=(cols?.filter(c=>c.name?.trim()).length ? cols.filter(c=>c.name?.trim()) : names[view].map(name=>({name})))
   .map((c,i)=>({id:'universal-'+view+'-'+i,name:c.name,instruction:c.instruction||'',...(view==='icp'?{axis:c.axis||inferIcpAxis(c.name)}:{}),defaults:{mode:c.defaults?.mode||'',articleType:root?.articleTypes?.find(t=>t.id===c.defaults?.type)?.name||'',aw:c.defaults?.aw||''}}));
  if(view==='competitor') out.views[view].unshift({id:'universal-competitor-row',role:'row',name:v?.rowColumn?.name||'Competitor Name',instruction:v?.rowColumn?.instruction||'',defaults:{mode:'',articleType:'',aw:''}});
 }
 out.routingInstruction=placementPrompt+'\n\n'+competitorSourcePrompt+'\n\n'+categoryAwarePrompt+'\n\n'+solutionAwareMatrixPrompt+'\n\n'+urlAuditPrompt+'\n\n'+strategyPrompt+'\n\n'+icpAxisPrompt+'\n\n'+icpSeoMatrixPrompt+'\n\n'+comparisonRouting;
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
return {KIND,PROMPT_REVISION,names,seed,sync,order,move,comparisonRouting,strategyPrompt:placementPrompt+'\n\n'+competitorSourcePrompt+'\n\n'+categoryAwarePrompt+'\n\n'+solutionAwareMatrixPrompt+'\n\n'+urlAuditPrompt+'\n\n'+strategyPrompt+'\n\n'+icpAxisPrompt+'\n\n'+icpSeoMatrixPrompt,ensurePageViews,pageView,ICP_AXIS_ORDER,ICP_AXIS_LABELS,inferIcpAxis,sortIcpColumns};
});
