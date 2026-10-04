/* Board-scoped Saras Analytics sitemap import for Competitive Intelligence. */
(function(root){
  'use strict';
  const REVISION='saras-analytics-sitemap-2026-10-04-v7';
  const FOCAL_COMPETITOR='Saras Analytics';
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\/$/,'');
  const comparisonName=value=>normalize(value)==='triple whale / moby ai'?'Triple Whale':String(value||'').trim();
  const clone=value=>JSON.parse(JSON.stringify(value));
  let pending;
  function matchesBoard(values){return (values||[]).some(value=>normalize(value)==='ai data platform');}
  function loadProfile(){
    const find=source=>(source?.profiles||[]).find(profile=>profile.id==='saras-analytics');
    const ready=find(root.CompetitiveIntelligenceClassifications);
    if(ready)return Promise.resolve(clone(ready));
    if(!pending)pending=fetch('competitive-intelligence-classifications.json',{cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error('Could not load the Saras Analytics sitemap profile.');return response.json();})
      .then(source=>{root.CompetitiveIntelligenceClassifications=source;const profile=find(source);if(!profile)throw new Error('Saras Analytics profile is missing.');return clone(profile);});
    return pending;
  }
  function apply(tab,profile){
    if(!tab||!profile)return false;
    profile=clone(profile);
    root.SarasAnalyticsOrganicTraffic?.applyProfile(profile);
    tab.competitors=Array.isArray(tab.competitors)?tab.competitors:[];
    const before=JSON.stringify(tab);
    const index=tab.competitors.findIndex(item=>normalize(item.domain)===normalize(profile.domain)||normalize(item.name)===normalize(profile.name));
    if(index>=0)tab.competitors[index]={...tab.competitors[index],...profile,urls:[...new Set(profile.urls||[])],sitemaps:[...new Set(profile.sitemaps||[])]};
    else tab.competitors.push(profile);
    if(!tab.activeCompetitorId)tab.activeCompetitorId=profile.id;
    return before!==JSON.stringify(tab);
  }
  function competitorRecords(source){
    return Object.entries(source?.classifications||{}).filter(([,meta])=>meta.workspace==='ai-data-platform'&&meta.section==='Competitor AEO')
      .map(([url,meta])=>({url,name:String(meta.hierarchy||'').trim(),meta})).filter(item=>item.name);
  }
  const isDirectComparison=item=>/(?:^|\/)vs\/|(?:^|[-/])vs(?:[-/?#]|$)|\bversus\b/i.test(String(item.url||'').replace(/^https?:\/\/[^/]+/i,''));
  const repositoryQuery=item=>({workspace:'ai-data-platform',awareness:'competitor-aware',section:'Competitor AEO',pageType:item.meta.pageType,hierarchy:item.meta.hierarchy,axis:item.meta.axis,topicGroup:item.meta.topicGroup});
  function applyStrategy(positioningTab,content,source,uid){
    if(!positioningTab||!content?.views?.competitor)return false;
    const records=competitorRecords(source),names=[FOCAL_COMPETITOR,...new Set(records.map(item=>item.name).filter(name=>normalize(name)!==normalize(FOCAL_COMPETITOR)))];
    if(!names.length)return false;
    const before=JSON.stringify({positioning:positioningTab.positioning,category:content.views.category,competitor:content.views.competitor});
    const positioning=positioningTab.positioning&&typeof positioningTab.positioning==='object'?positioningTab.positioning:(positioningTab.positioning={selectedIcp:'',selectedCategory:'',icps:[],categories:[]});
    positioning.categories=Array.isArray(positioning.categories)?positioning.categories:[];
    let category=positioning.categories.find(item=>item.id===positioning.selectedCategory)||positioning.categories.find(item=>String(item.name||'').trim())||positioning.categories[0];
    if(!category){category={id:uid(),name:'AI data analytics platform',maturity:'',competitors:[]};positioning.categories.push(category);}
    if(!category.id)category.id=uid();
    const oldCompetitors=positioning.categories.flatMap(item=>Array.isArray(item.competitors)?item.competitors:[]);
    const oldByName=new Map(oldCompetitors.map(item=>[normalize(item.name),item]));
    const oldNames=new Set(oldCompetitors.map(item=>normalize(item.name)).filter(Boolean));
    positioning.categories.forEach(item=>{item.competitors=[];});
    category.competitors=names.map(name=>{const old=oldByName.get(normalize(name));return {id:old?.id||uid(),name,contentRowId:old?.contentRowId||''};});
    positioning.selectedCategory=category.id;

    const matrix=content.views.competitor;
    matrix.rows=Array.isArray(matrix.rows)?matrix.rows:[];matrix.types=Array.isArray(matrix.types)?matrix.types:[];matrix.cells=matrix.cells&&typeof matrix.cells==='object'?matrix.cells:{};
    const typeByName=new Map();
    for(const name of ['Alternatives','Reviews','Pricing','Features']){
      let type=matrix.types.find(item=>normalize(item.name)===normalize(name));
      if(!type){type={id:uid(),name};matrix.types.push(type);}
      typeByName.set(normalize(name),type);
    }
    const priorRows=new Map(matrix.rows.filter(row=>names.some(name=>normalize(name)===normalize(row.name))).map(row=>[normalize(row.name),row]));
    const removedIds=new Set(matrix.rows.filter(row=>row.positioningCompetitorId||oldNames.has(normalize(row.name))).map(row=>row.id));
    const retained=matrix.rows.filter(row=>String(row.name||'').trim()&&!removedIds.has(row.id)&&!names.some(name=>normalize(name)===normalize(row.name)));
    for(const key of Object.keys(matrix.cells))if(removedIds.has(key.split('|')[0]))delete matrix.cells[key];
    const canonical=category.competitors.map(competitor=>{
      const row=priorRows.get(normalize(competitor.name))||{id:uid(),name:competitor.name};
      row.name=competitor.name;row.positioningCompetitorId=competitor.id;row.positioningCategoryId=category.id;competitor.contentRowId=row.id;
      const grouped=new Map();
      for(const item of records.filter(item=>normalize(item.name)===normalize(competitor.name)&&!isDirectComparison(item))){const axis=item.meta.axis||'Alternatives';if(!grouped.has(axis))grouped.set(axis,[]);grouped.get(axis).push(item);}
      for(const [axis,items] of grouped){const type=typeByName.get(normalize(axis))||typeByName.get('alternatives');const queries=items.map(repositoryQuery);matrix.cells[row.id+'|'+type.id]={...(matrix.cells[row.id+'|'+type.id]||{}),v:competitor.name+' '+axis.toLowerCase(),url:'',mode:'aeo',type:'',on:false,aw:'',st:'for_review',writtenBy:'',cfg:true,kws:[],repositoryQueries:queries,repositoryUrlOverrides:{}};}
      return row;
    });
    matrix.rows=[...canonical,...retained];
    matrix.comparisonCells=matrix.comparisonCells&&typeof matrix.comparisonCells==='object'?matrix.comparisonCells:{};
    content.articleTypes=Array.isArray(content.articleTypes)?content.articleTypes:[];
    let competitorType=content.articleTypes.find(item=>normalize(item.name)==='competitor');
    if(!competitorType){competitorType={id:'competitor',name:'Competitor'};while(content.articleTypes.some(item=>item.id===competitorType.id))competitorType.id+='_';content.articleTypes.push(competitorType);}
    const focalRow=canonical.find(row=>normalize(row.name)===normalize(FOCAL_COMPETITOR));
    if(focalRow)for(const opponent of canonical){
      if(opponent.id===focalRow.id)continue;
      const key=JSON.stringify([focalRow.id,opponent.id].sort());
      const existing=matrix.comparisonCells[key]&&typeof matrix.comparisonCells[key]==='object'?matrix.comparisonCells[key]:{};
      const queries=records.filter(item=>normalize(item.name)===normalize(opponent.name)&&isDirectComparison(item)).map(repositoryQuery);
      const generatedTitle=FOCAL_COMPETITOR+' vs '+comparisonName(opponent.name);
      const customTitle=existing.v!==undefined&&String(existing.v).trim()!==generatedTitle;
      const manualContent=customTitle||!!String(existing.url||'').trim()||(Array.isArray(existing.kws)&&existing.kws.length)||(Array.isArray(existing.pageUrls)&&existing.pageUrls.length)||existing.on===true||!!String(existing.writtenBy||'').trim();
      const explicitStatus=String(existing.st||'').trim()&&!(existing.st==='for_review'&&!manualContent&&!queries.length)?existing.st:'';
      if(!queries.length&&!manualContent&&!explicitStatus){delete matrix.comparisonCells[key];continue;}
      matrix.comparisonCells[key]={...existing,v:existing.v===undefined?generatedTitle:existing.v,mode:existing.mode||'aeo',type:existing.type||competitorType.id,aw:existing.aw||'Competitor aware',st:explicitStatus||(queries.length||manualContent?'for_review':''),on:existing.on||false,writtenBy:existing.writtenBy||'',url:existing.url||'',kws:Array.isArray(existing.kws)?existing.kws:[],cfg:true,repositoryQueries:queries,repositoryUrlOverrides:existing.repositoryUrlOverrides||{}};
    }

    const categoryView=content.views.category;
    if(categoryView)for(const row of categoryView.rows||[])for(const [id,cell] of Object.entries(row.cells||{})){
      const value=normalize(typeof cell==='string'?cell:cell?.v);
      if(value&&oldNames.has(value))delete row.cells[id];
    }
    return before!==JSON.stringify({positioning:positioningTab.positioning,category:content.views.category,competitor:content.views.competitor});
  }
  root.SarasAnalyticsCompetitiveIntelligence={REVISION,FOCAL_COMPETITOR,matchesBoard,loadProfile,apply,competitorRecords,applyStrategy};
})(typeof globalThis!=='undefined'?globalThis:this);
