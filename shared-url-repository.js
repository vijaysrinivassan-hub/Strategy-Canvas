(function(global){
  'use strict';
  const normalizeUrl=value=>String(value||'').trim().replace(/\/$/,'');
  const normalizeName=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
  const slug=value=>normalizeName(value).trim().replace(/\s+/g,'-')||'general';
  const productMatches=product=>/answer engine optimization agency/i.test(String(product||''));
  const pageGroup=value=>{
    const text=String(value||'').toLowerCase();
    if(text.includes('listicle'))return 'listicle';
    if(text.includes('landing'))return 'landing';
    if(text.includes('informational'))return 'informational';
    return '';
  };
  const sectionFor=(view,mode)=>({category:'Category',icp:'ICP',value:'Value'}[view]||'')+' '+String(mode||'aeo').toUpperCase();
  let loadPromise=null,indexedSource=null,indexedRecords=[];
  function data(){return global.CompetitiveIntelligenceClassifications||null;}
  function buildIndex(source){
    if(!source||indexedSource===source)return indexedRecords;
    const owners=new Map();
    (source.profiles||[]).forEach(profile=>(profile.urls||[]).forEach(url=>owners.set(normalizeUrl(url),{competitorId:profile.id||'',competitor:profile.name||''})));
    indexedRecords=Object.entries(source.classifications||{}).map(([url,meta])=>{
      const owner=owners.get(normalizeUrl(url))||{};
      return {id:normalizeUrl(url),url,traffic:meta.traffic||'',shared:true,competitorId:owner.competitorId||'',competitor:owner.competitor||'',
        section:meta.section||'',pageType:meta.pageType||'',hierarchy:meta.hierarchy||'General',axis:meta.axis||'General'};
    });indexedSource=source;return indexedRecords;
  }
  function load(){
    if(data())return Promise.resolve(buildIndex(data()));
    if(!loadPromise)loadPromise=fetch('competitive-intelligence-classifications.json',{cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error('Could not load the shared URL repository.');return response.json();})
      .then(source=>{global.CompetitiveIntelligenceClassifications=source;return buildIndex(source);});
    return loadPromise;
  }
  function records(){return buildIndex(data());}
  function query(spec={}){
    return records().filter(record=>(!spec.section||record.section===spec.section)&&(!spec.pageType||record.pageType===spec.pageType)
      &&(!spec.hierarchy||record.hierarchy===spec.hierarchy)&&(!spec.axis||record.axis===spec.axis));
  }
  function resolve(queries){
    const seen=new Set(),out=[];
    (Array.isArray(queries)?queries:queries?[queries]:[]).forEach(spec=>query(spec).forEach(record=>{
      if(seen.has(record.id))return;seen.add(record.id);out.push(record);
    }));return out;
  }
  const matrixGroup=(view,axis)=>{
    const name=normalizeName(axis);
    if(view==='value')return /benefit/.test(name)?'benefit':/capabilit/.test(name)?'cap':'use';
    if(/countr/.test(name))return 'ctry';if(/tech/.test(name))return 'tech';return 'ind';
  };
  const typeId=(types,group)=>{
    const wanted={listicle:/listicle/i,landing:/landing|service page|feature page|use case page/i,informational:/informational|informative/i}[group];
    return (types||[]).find(type=>wanted?.test(type.name||''))?.id||'';
  };
  function columnsFor(view,group){
    view.pageColumns ||= {};view.pageOrders ||= {};
    if(!Array.isArray(view.pageColumns[group]))view.pageColumns[group]=JSON.parse(JSON.stringify(view.columns||[]));
    return view.pageColumns[group];
  }
  const columnAliases={
    category:{
      'category name':['category name','category names','category synonyms listicle','category and synonyms listicle','category synonyms'],
      'category synonyms':['category synonyms','category synonym'],
      'capability':['capability','capabilities','feature','features','feature pages'],
      'benefit':['benefit','benefits','outcome','outcomes'],
      'country':['country','countries'],
      'technology':['technology','technologies','seo and aeo tools','seo aeo tools']
    },
    icp:{
      'industry':['industry','industries','industry pages'],
      'country':['country','countries'],
      'technology':['technology','technologies','existing tech stack','tech stack'],
      'company size':['company size','size'],
      'role team':['role team','role or team','people','person or role']
    },
    value:{
      'use cases or services':['use cases or services','use cases','use case','processes use cases','process method','processes','service pages'],
      'capability':['capability','capabilities','features'],
      'benefit':['benefit','benefits','nodal benefit','nodal benefits','outcomes'],
      'problem pain':['problem pain','problems','pain','pain points'],
      'guides':['guides','guide'],
      'how to articles':['how to articles','how to'],
      'explainers':['explainers','explainer'],
      'trends':['trends','trend'],
      'topic vs topic':['topic vs topic','topic versus topic']
    }
  };
  function aliasesFor(viewId,axis){
    const key=normalizeName(axis),aliases=columnAliases[viewId]||{};
    if(aliases[key])return aliases[key];
    for(const values of Object.values(aliases))if(values.includes(key))return values;
    return [key];
  }
  function ensureColumn(viewId,view,group,axis,mode,types){
    const columns=columnsFor(view,group),key=normalizeName(axis),aliases=aliasesFor(viewId,axis);
    let column=columns.find(item=>normalizeName(item.name)===key)
      ||columns.find(item=>aliases.includes(normalizeName(item.name)));
    if(!column){
      column={id:'shared-url-col-'+viewId+'-'+group+'-'+slug(axis),name:axis,local:true,
        defaults:{mode,type:typeId(types,group),aw:''},...(group==='matrix'?{matrixGroup:matrixGroup(viewId,axis)}:viewId==='icp'?{axis:/role|people/.test(key)?'people':/tech/.test(key)?'technology':/size|input/.test(key)?'input':'process'}:{})};
      columns.push(column);view.pageOrders[group]=columns.map(item=>item.id);
    }return column;
  }
  function hasUserContent(cell){
    if(!cell||typeof cell!=='object')return false;
    return !!(cell.url||cell.slug||cell.st||cell.aw||cell.writtenBy||cell.actor||cell.on
      ||(Array.isArray(cell.kws)&&cell.kws.length)||(Array.isArray(cell.pageUrls)&&cell.pageUrls.length));
  }
  function clearPreviousMappings(root){
    Object.values(root.views||{}).forEach(view=>{
      (view.rows||[]).forEach(row=>Object.values(row.cells||{}).forEach(cell=>{if(cell&&typeof cell==='object')delete cell.repositoryQueries;}));
      view.rows=(view.rows||[]).filter(row=>{
        if(!row.repositoryHierarchy)return true;
        const cells=Object.values(row.cells||{});
        if(cells.some(hasUserContent)){delete row.repositoryHierarchy;return true;}
        return false;
      });
      for(const group of Object.keys(view.pageColumns||{})){
        const removable=new Set((view.pageColumns[group]||[]).filter(column=>String(column.id||'').startsWith('shared-url-col-')).map(column=>column.id));
        (view.rows||[]).forEach(row=>Object.keys(row.cells||{}).forEach(id=>{if(removable.has(id)&&hasUserContent(row.cells[id]))removable.delete(id);}));
        if(removable.size){
          view.pageColumns[group]=view.pageColumns[group].filter(column=>!removable.has(column.id));
          if(Array.isArray(view.pageOrders?.[group]))view.pageOrders[group]=view.pageOrders[group].filter(id=>!removable.has(id));
          (view.rows||[]).forEach(row=>removable.forEach(id=>delete row.cells?.[id]));
        }
      }
    });
  }
  function mappedRowsFirst(view){
    const rows=view.rows||[],groups=['listicle','landing','informational','matrix'];
    groups.forEach(group=>{
      const positions=[];rows.forEach((row,index)=>{if(row.pageGroup===group)positions.push(index);});
      const ordered=positions.map(index=>rows[index]).sort((a,b)=>Number(!!b.repositoryHierarchy)-Number(!!a.repositoryHierarchy));
      positions.forEach((position,index)=>{rows[position]=ordered[index];});
    });
  }
  function ensureRow(view,group,hierarchy,uid){
    view.rows ||= [];
    let row=view.rows.find(item=>item.pageGroup===group&&(item.repositoryHierarchy===hierarchy||(group==='matrix'&&item.name===hierarchy)));
    if(!row){
      row=view.rows.find(item=>item.pageGroup===group&&!item.repositoryHierarchy&&group!=='matrix'&&!Object.keys(item.cells||{}).length);
      if(!row){row={id:uid(),pageGroup:group,cells:{}};view.rows.push(row);}
      row.repositoryHierarchy=hierarchy;if(group==='matrix'&&!row.name)row.name=hierarchy;
    }row.cells ||= {};return row;
  }
  function installMappings(root,types,options={}){
    if(!root?.views||!productMatches(options.product)||!data())return false;
    const revision=(data().classifiedAt||'classification')+':existing-cells-v2';
    if(root.sharedUrlRepositoryRevision===revision)return false;
    clearPreviousMappings(root);
    const uid=options.uid||(()=>Math.random().toString(36).slice(2));
    let linked=0;
    records().forEach(record=>{
      if(record.section==='Corporate & Non-SEO')return;
      const match=/^(Category|ICP|Value) (AEO|SEO)$/.exec(record.section);if(!match)return;
      const viewId=match[1].toLowerCase(),mode=match[2].toLowerCase(),format=pageGroup(record.pageType);if(!format)return;
      const view=root.views[viewId];if(!view)return;
      const group=mode==='aeo'&&(viewId==='icp'||viewId==='value')?'matrix':format;
      const column=ensureColumn(viewId,view,group,record.axis,mode,types);
      const row=ensureRow(view,group,record.hierarchy,uid);
      const current=row.cells[column.id]&&typeof row.cells[column.id]==='object'?row.cells[column.id]:{};
      const spec={section:record.section,pageType:record.pageType,hierarchy:record.hierarchy,axis:record.axis};
      const queries=Array.isArray(current.repositoryQueries)?current.repositoryQueries.slice():[];
      if(!queries.some(item=>JSON.stringify(item)===JSON.stringify(spec)))queries.push(spec);
      row.cells[column.id]={...current,v:current.v||record.hierarchy,mode,type:current.type||typeId(types,format),cfg:true,repositoryQueries:queries};linked++;
    });
    Object.values(root.views).forEach(mappedRowsFirst);
    root.sharedUrlRepositoryRevision=revision;root.sharedUrlLinkedCount=linked;return true;
  }
  global.SharedUrlRepository={load,records,query,resolve,installMappings,productMatches,pageGroup,sectionFor};
  if(typeof module!=='undefined')module.exports=global.SharedUrlRepository;
})(typeof globalThis!=='undefined'?globalThis:this);
