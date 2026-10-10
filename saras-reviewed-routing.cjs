const KeywordColumns=require('./keyword-columns.js');
const Repository=require('./shared-url-repository.js');
const CONTENT='Content Strategy',CI='Competitive Intelligence',MATURITY='Strategy 1 — Maturity Axis';
const clone=value=>JSON.parse(JSON.stringify(value));
const REVISION='saras-topic-review-2026-10-10';
const grid=()=>({kind:'grid',rows:[],columns:[],pageColumns:{},pageOrders:{}});
const emptyProjection=()=>({views:{category:grid(),product:grid(),icp:grid(),value:grid(),competitor:{kind:'matrix',rows:[],types:[],cells:{},comparisonCells:{}}},awarenessViews:{}});
function appendPrompt(prior){return String(prior||'').includes('COMPETITIVE INTELLIGENCE — TOPIC RELEVANCE AND NODE ROUTING')?prior:KeywordColumns.competitiveIntelligencePrompt+'\n\n'+String(prior||'').trim();}
function apply(body,asset,prompt){
  if(body.client!=='AI Data Platform')throw Error('This review belongs to AI Data Platform.');
  if(body.clientProduct!=='AI Layer'||body.workspaceProductId!=='0jgsw8bx554d')throw Error('AI Layer must be the active product.');
  const profile=body.tabs[CI]?.competitors?.find(item=>item.id==='saras-analytics');
  const sourceProfile=asset.profiles.find(item=>item.id==='saras-analytics');
  if(!profile||profile.urls.length!==770||sourceProfile.urls.length!==770||profile.urls.some(url=>!sourceProfile.urls.includes(url)))throw Error('The live Saras inventory differs from the reviewed inventory.');
  const root=body.tabs[CONTENT]||=(emptyProjection());
  if(root.activeKeywordNodeId){root.keywordNodeWorkspaces||={};root.keywordNodeWorkspaces[root.activeKeywordNodeId]=clone({views:root.views,awarenessViews:root.awarenessViews||{}});}
  const reviewed=new Set(sourceProfile.urls),reviewedStates={};
  function detach(object){
    if(!object||typeof object!=='object')return;
    if(Array.isArray(object.repositoryQueries)){
      const moved=object.repositoryQueries.filter(query=>reviewed.has(query.topicGroup));
      for(const query of moved)reviewedStates[query.topicGroup]||=Object.fromEntries(['st','aw','type','writtenBy','repositoryUrlOverrides'].filter(key=>object[key]!=null).map(key=>[key,clone(object[key])]));
      object.repositoryQueries=object.repositoryQueries.filter(query=>!reviewed.has(query.topicGroup));
    }
    for(const [key,value] of Object.entries(object)){
      if(value&&typeof value==='object'&&!Array.isArray(value)&&Array.isArray(value.repositoryQueries)&&!value.repositoryQueries.length&&!value.v&&!value.url&&!value.kws?.length&&!value.pageUrls?.length&&!(value.valueLensKeywords&&Object.values(value.valueLensKeywords).some(ids=>ids?.length))){delete object[key];continue;}
      detach(value);
    }
  }
  detach(root);
  globalThis.CompetitiveIntelligenceClassifications=asset;
  const architecture=body.tabs[MATURITY]?.architecture,selected=architecture?.nodes?.filter(node=>node.replacementSelected&&node.processRole==='pillar')||[];
  const nodeIds=[...selected.map(node=>node.id),'supporting-processes'];
  for(const id of ['ai-maturity-l2-reporting','ai-maturity-l2-analysis'])if(!nodeIds.includes(id))throw Error('The reviewed Reporting and Analysis selections changed.');
  const types=root.articleTypes||=([]);
  for(const name of ['Informational','Landing page','Listicle','Competitor'])if(!types.some(type=>type.name===name))types.push({id:'review-type-'+name.toLowerCase().replaceAll(' ','-'),name});
  root.keywordNodeWorkspaces||={};
  for(const keywordNodeId of nodeIds){
    const projection=root.keywordNodeWorkspaces[keywordNodeId]||=emptyProjection();projection.views||={};projection.awarenessViews||={};
    for(const [id,view] of Object.entries(emptyProjection().views))projection.views[id]||=view;
    const options={product:'AI Data Platform',keywordNodeId,reviewedStates,uid:()=>Math.random().toString(36).slice(2,12)};
    for(const contentView of ['product','category'])for(const mode of contentView==='product'?['aeo']:['aeo','seo'])Repository.installMappings(projection,types,{...options,contentView,mode,activeView:projection.views[contentView]});
    for(const awareness of ['problem-unaware','problem-aware','solution-aware'])for(const contentView of ['icp','value']){
      const key=awareness+':'+contentView;
      const activeView=awareness==='solution-aware'?projection.views[contentView]:(projection.awarenessViews[key]||=grid());
      for(const mode of ['seo','aeo'])Repository.installMappings(projection,types,{...options,awareness,contentView,mode,activeView});
    }
    Repository.installCompetitorMappings(projection,types,options);
    projection.routingInstruction=prompt||appendPrompt(root.routingInstruction);
  }
  root.activeKeywordNodeId=nodeIds.includes(root.activeKeywordNodeId)?root.activeKeywordNodeId:nodeIds[0];
  Object.assign(root,clone(root.keywordNodeWorkspaces[root.activeKeywordNodeId]));
  root.routingInstruction=prompt||appendPrompt(root.routingInstruction);root.sarasReviewedRoutingRevision=REVISION;root.supportingKeywordWorkspaceRevision=1;
  profile.urlClassificationsByProduct||={};profile.urlClassificationsByProduct['AI Layer']||={};
  for(const url of sourceProfile.urls){const row=asset.classifications[url];profile.urlClassificationsByProduct['AI Layer'][url]=Object.fromEntries(['node','nodeId','supportingNode','supportingNodeId','awarenessLevel','matrix','column','pageTitle','pageDescription','reviewNotes','classificationRevision'].map(field=>[field,row[field]||'']));}
  profile.note=sourceProfile.note;
  body.tabs[CI].urlRoutingPromptsByProduct||={};body.tabs[CI].urlRoutingPromptsByProduct['AI Layer']=KeywordColumns.competitiveIntelligencePrompt;
  if(body.productWorkspaces?.[body.workspaceProductId]?.tabs)body.productWorkspaces[body.workspaceProductId].tabs[CONTENT]=clone(root);
  return verify(body,asset);
}
function verify(body,asset){
  const root=body.tabs[CONTENT],profile=asset.profiles.find(item=>item.id==='saras-analytics'),reviewed=new Set(profile.urls),placements=[];
  const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function check(cell,nodeId,viewId,column,awareness){
    for(const query of cell?.repositoryQueries||[]){
      if(!reviewed.has(query.topicGroup))continue;
      const row=asset.classifications[query.topicGroup],matrix=viewId==='product'?'Product Aware':viewId==='competitor'?'Competitor AEO':({category:'Category',icp:'ICP',value:'Value'}[viewId])+' '+String(cell.mode).toUpperCase();
      if(matrix!==row.matrix||normalize(column)!==normalize(row.column)||query.awareness!==row.awareness||query.section!==row.section||(viewId!=='competitor'&&awareness!==row.awareness))throw Error('Reviewed destination mismatch: '+query.topicGroup+' '+JSON.stringify({matrix,column,awareness,expected:row.matrix+' / '+row.column+' / '+row.awareness}));
      placements.push({url:query.topicGroup,nodeId});
    }
  }
  function viewCheck(view,nodeId,viewId,awareness){
    if(viewId==='competitor'){
      for(const [key,cell] of Object.entries(view.cells||{}))check(cell,nodeId,viewId,view.types?.find(type=>type.id===key.split('|')[1])?.name,'competitor-aware');
      for(const cell of Object.values(view.comparisonCells||{}))check(cell,nodeId,viewId,'Competitor vs Competitor','competitor-aware');
    }else for(const row of view.rows||[])for(const [columnId,cell] of Object.entries(row.cells||{}))check(cell,nodeId,viewId,[...(view.pageColumns?.[row.pageGroup]||[]),...(view.columns||[])].find(column=>column.id===columnId)?.name,awareness);
  }
  for(const [nodeId,projection] of Object.entries(root.keywordNodeWorkspaces||{})){
    for(const [viewId,view] of Object.entries(projection.views||{}))viewCheck(view,nodeId,viewId,['category','product'].includes(viewId)?'category-aware':'solution-aware');
    for(const [key,view] of Object.entries(projection.awarenessViews||{})){const [awareness,viewId]=key.split(':');viewCheck(view,nodeId,viewId,awareness);}
  }
  const byUrl=new Map();for(const item of placements){const prior=byUrl.get(item.url)||[];prior.push(item.nodeId);byUrl.set(item.url,prior);}
  for(const url of reviewed){const row=asset.classifications[url],found=byUrl.get(url)||[];if(row.matrix==='Corporate & Non-SEO'){if(found.length)throw Error('Non-SEO URL leaked into Keywords: '+url);}else if(found.length!==1||found[0]!==row.nodeId)throw Error('URL must appear once at its reviewed node: '+url+' '+JSON.stringify(found));}
  const saved=body.tabs[CI]?.competitors?.find(item=>item.id==='saras-analytics')?.urlClassificationsByProduct?.['AI Layer']||{};
  for(const url of reviewed)for(const field of ['node','nodeId','supportingNode','supportingNodeId','awarenessLevel','matrix','column'])if(saved[url]?.[field]!==asset.classifications[url][field])throw Error('Saved classification differs: '+url+' '+field);
  return {classified:reviewed.size,mapped:placements.length,nonSeo:61,nodeCounts:Object.fromEntries(['ai-maturity-l2-reporting','ai-maturity-l2-analysis','supporting-processes'].map(id=>[id,placements.filter(item=>item.nodeId===id).length]))};
}
module.exports={apply,verify,appendPrompt,REVISION};
