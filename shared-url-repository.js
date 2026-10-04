(function(global){
  'use strict';
  const normalizeUrl=value=>String(value||'').trim().replace(/\/$/,'');
  const normalizeName=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
  const slug=value=>normalizeName(value).trim().replace(/\s+/g,'-')||'general';
  const workspaceFor=product=>/\bai data platform\b/i.test(String(product||''))?'ai-data-platform':/answer engine optimization agency|\baeo agency\b/i.test(String(product||''))?'aeo-agency':'';
  const productMatches=product=>!!workspaceFor(product);
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
    (source.profiles||[]).forEach(profile=>(profile.urls||[]).forEach(url=>owners.set(normalizeUrl(url),{competitorId:profile.id||'',competitor:profile.name||'',workspace:profile.workspace||'aeo-agency'})));
    indexedRecords=Object.entries(source.classifications||{}).map(([url,meta])=>{
      const owner=owners.get(normalizeUrl(url))||{};
      return {id:normalizeUrl(url),url,traffic:meta.traffic||'',shared:true,competitorId:owner.competitorId||'',competitor:owner.competitor||'',workspace:meta.workspace||owner.workspace||'aeo-agency',awareness:meta.awareness||'',
        section:meta.section||'',pageType:meta.pageType||'',hierarchy:meta.hierarchy||'General',axis:meta.axis||'General',icpSegment:meta.icpSegment||'',
        topicGroup:meta.topicGroup||normalizeUrl(url),topic:meta.topic||meta.hierarchy||'URL topic',groupOrder:Number(meta.groupOrder)||0,
        groupSize:Number(meta.groupSize)||1,covered:!!meta.covered,sourceSheet:meta.sourceSheet||'',sourceCell:meta.sourceCell||''};
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
    return records().filter(record=>(!spec.workspace||record.workspace===spec.workspace)&&(!spec.awareness||record.awareness===spec.awareness)&&(!spec.section||record.section===spec.section)&&(!spec.pageType||record.pageType===spec.pageType)
      &&(!spec.hierarchy||record.hierarchy===spec.hierarchy)&&(!spec.axis||record.axis===spec.axis)
      &&(!spec.topicGroup||record.topicGroup===spec.topicGroup));
  }
  function resolve(queries,overrides){
    const seen=new Set(),out=[];
    (Array.isArray(queries)?queries:queries?[queries]:[]).forEach(spec=>query(spec).forEach(record=>{
      if(seen.has(record.id))return;seen.add(record.id);
      const patch=overrides&&typeof overrides==='object'?overrides[record.id]:null;
      if(patch?.deleted)return;
      out.push(patch?{...record,url:patch.url==null?record.url:String(patch.url),traffic:patch.traffic==null?record.traffic:String(patch.traffic)}:record);
    }));return out;
  }
  const matrixGroup=(view,axis)=>{
    const name=normalizeName(axis);
    if(view==='value')return /benefit/.test(name)?'benefit':/capabilit/.test(name)?'cap':'use';
    if(/countr/.test(name))return 'ctry';
    if(/tech/.test(name))return 'tech';
    if(/company size|size/.test(name))return 'size';
    if(/role|team|people/.test(name))return 'role';
    if(/process|use case/.test(name))return 'process';
    return 'ind';
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
    }
    if(group==='matrix'&&!column.matrixGroup)column.matrixGroup=matrixGroup(viewId,axis);
    const guidance='Workbook URL grouping: create one content cell per URL unless the source workbook explicitly groups URLs between separator lines. Keep every separator-delimited URL group in one cell. A group containing a Maximus Labs URL is already covered and appears red. Store the Maximus Labs URL in the Slug field and keep only competitor URLs in the URL evidence list. Keep URL and keyword evidence editable and removable.';
    if(!String(column.instruction||'').includes('Workbook URL grouping:'))column.instruction=(String(column.instruction||'').trim()+' '+guidance).trim();
    return column;
  }
  function hasUserContent(cell){
    if(!cell||typeof cell!=='object')return false;
    return !!(cell.url||cell.slug||cell.st||cell.aw||cell.writtenBy||cell.actor||cell.on
      ||(Array.isArray(cell.kws)&&cell.kws.length)||(Array.isArray(cell.excludedKws)&&cell.excludedKws.length)
      ||(Array.isArray(cell.pageUrls)&&cell.pageUrls.length)||(cell.repositoryUrlOverrides&&Object.keys(cell.repositoryUrlOverrides).length));
  }
  function clearPreviousMappings(root){
    Object.values(root.views||{}).forEach(view=>{
      view.rows=(view.rows||[]).filter(row=>{
        if(!row.repositoryHierarchy)return true;
        for(const [id,cell] of Object.entries(row.cells||{}))if(cell?.repositoryQueries?.length)delete row.cells[id];
        if(Object.values(row.cells||{}).some(cell=>hasUserContent(cell)||cell?.v)){delete row.repositoryHierarchy;delete row.repositoryRowSlot;return true;}
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
  function captureRepositoryState(root){
    const saved=new Map();
    Object.values(root.views||{}).forEach(view=>(view.rows||[]).forEach(row=>Object.values(row.cells||{}).forEach(cell=>{
      for(const query of cell?.repositoryQueries||[]){if(!query.topicGroup||saved.has(query.topicGroup))continue;const snapshot={...cell};delete snapshot.repositoryQueries;saved.set(query.topicGroup,snapshot);}
    })));
    return saved;
  }
  const CATEGORY_DEPARTMENT_ORDER=['Strategy & Research','Account Management','Technical SEO / AEO','Content','Digital PR / Authority','Analytics & Reporting','Client Success'];
  const categoryDepartment=record=>{
    const name=normalizeName(record.hierarchy);
    if(/digital pr|link building|backlink|authority/.test(name))return 'Digital PR / Authority';
    if(/analytics|measurement|conversion rate|reporting/.test(name))return 'Analytics & Reporting';
    if(/content marketing|seo content|copywriting|editorial/.test(name))return 'Content';
    if(/revops|crm|account management/.test(name))return 'Account Management';
    if(/answer engine|aeo|technical seo|programmatic seo|seo and aeo tools|search engine optimization/.test(name))return 'Technical SEO / AEO';
    if(/client success|customer success/.test(name))return 'Client Success';
    return 'Strategy & Research';
  };
  const usesRepositoryAxis=(viewId,group)=>viewId==='category'||(viewId==='icp'&&(group==='informational'||group==='matrix'))||(viewId==='value'&&group==='informational');
  const ICP_DIMENSION_ORDER=['Industry','Company size','Process / Use case','Country','Technology','Role / Team','General ICP'];
  const ICP_MATRIX_GROUP_ORDER=['ind','size','process','ctry','tech','role'];
  const INDUSTRY_ORDER=['B2B SaaS','Fintech & Financial Services','Healthcare & Life Sciences','E-commerce & Retail','Cybersecurity','HR Tech','MarTech & AdTech','Technology & Software','Aerospace & Aviation','Agriculture & AgTech','Automotive','Construction & Home Services','Education & EdTech','Energy, Environment & Utilities','Manufacturing & Industrial','Real Estate & PropTech','Logistics & Transportation','Crypto & Web3','Telecom & IT Services','Media & Entertainment','Professional Services','Consumer','B2B Services','Other Industry'];
  const industryValue=record=>{
    const name=normalizeName(record.topic||record.url);
    if(/fintech|financial service|banking|bank |insurance|wealth|private equity|investment compan|finance industr/.test(name))return 'Fintech & Financial Services';
    if(/health|medical|medtech|pharma|dental|life science|biotech|biohacking|longevity|hospital|patient|surgeon|dermat|rehab|senior living|nursing home|veterinar|wellness/.test(name))return 'Healthcare & Life Sciences';
    if(/ecommerce|e commerce|retail|consumer retail|shopify/.test(name))return 'E-commerce & Retail';
    if(/cyber|security|trust safety/.test(name))return 'Cybersecurity';
    if(/hr tech|hrtech|recruit|human resource|staffing/.test(name))return 'HR Tech';
    if(/martech|adtech|advertising/.test(name))return 'MarTech & AdTech';
    if(/aerospace|aviation|airline/.test(name))return 'Aerospace & Aviation';
    if(/agtech|agriculture|farming/.test(name))return 'Agriculture & AgTech';
    if(/automotive|dealership|car dealer/.test(name))return 'Automotive';
    if(/construction|contractor|home service|home builder|hvac|pest control|electrical contractor|campground|self storage/.test(name))return 'Construction & Home Services';
    if(/education|edtech|higher ed|college|university|school/.test(name))return 'Education & EdTech';
    if(/energy|environment|cleantech|solar|oil gas|recycling|waste management|water wastewater|utility/.test(name))return 'Energy, Environment & Utilities';
    if(/manufactur|industrial|heavy equipment|pcb design|robotic/.test(name))return 'Manufacturing & Industrial';
    if(/real estate|property management|proptech/.test(name))return 'Real Estate & PropTech';
    if(/logistics|transportation|trucking|supply chain|marine|maritime|boat|yacht/.test(name))return 'Logistics & Transportation';
    if(/crypto|web3|blockchain|nft/.test(name))return 'Crypto & Web3';
    if(/telecom|managed service|msp |hosting compan|it compan/.test(name))return 'Telecom & IT Services';
    if(/media publisher|entertainment|gaming|video game/.test(name))return 'Media & Entertainment';
    if(/b2b saas|saas/.test(name))return 'B2B SaaS';
    if(/software|technology|tech company|ai compan|business intelligence|salestech|crm |erp |developer|cloud|api/.test(name))return 'Technology & Software';
    if(/legal|law firm|attorney|consulting|professional service|accounting|copywriting|pr agenc/.test(name))return 'Professional Services';
    if(/beauty|consumer|food|restaurant|hospitality|hotel|travel|fashion|cosmetic brand|luxury brand|pet brand|cbd|cannabis/.test(name))return 'Consumer';
    if(/b2b/.test(name))return 'B2B Services';
    return 'Other Industry';
  };
  const companySizeValue=record=>{const name=normalizeName(record.topic||record.url);if(/enterprise|large business|large company/.test(name))return 'Enterprise';if(/mid market|midmarket|scaleup|scale up/.test(name))return 'Mid-market';return 'SMB';};
  const processDepartment=record=>{
    const name=normalizeName([record.hierarchy,record.topic].join(' '));
    if(/digital pr|link building|backlink|authority/.test(name))return 'Digital PR / Authority';
    if(/analytics|measurement|attribution|conversion rate|reporting/.test(name))return 'Analytics & Reporting';
    if(/content|copywriting|editorial|newsletter|podcast/.test(name))return 'Content';
    if(/revops|crm|account management/.test(name))return 'Account Management';
    if(/client success|customer success/.test(name))return 'Client Success';
    if(/answer engine|aeo|technical seo|programmatic seo|seo tool|chatgpt for seo/.test(name))return 'Technical SEO / AEO';
    return 'Strategy & Research';
  };
  const icpDimensionValue=(record,dimension)=>{const name=normalizeName(dimension);if(/industry/.test(name))return industryValue(record);if(/company size/.test(name))return companySizeValue(record);if(/process|use case/.test(name))return processDepartment(record);return dimension||'General ICP';};
  const childOrder=(group,value)=>{if(group==='size')return ['SMB','Mid-market','Enterprise'].indexOf(value);if(group==='process')return CATEGORY_DEPARTMENT_ORDER.indexOf(value);if(group==='ind'){const index=INDUSTRY_ORDER.indexOf(value);return index<0?INDUSTRY_ORDER.length:index;}return 0;};
  const valueSeoAwarenessGroup=axis=>{const name=normalizeName(axis);if(/topic vs topic|topic versus topic/.test(name))return 'product';if(/guide|how to/.test(name))return 'solution';return 'problem';};
  const awarenessForGroup=group=>group==='product'?'Product aware':group==='solution'?'Solution aware':'Problem aware';
  function mappedRowsFirst(view,viewId){
    const rows=view.rows||[],groups=['listicle','landing','informational','matrix'];
    groups.forEach(group=>{
      const positions=[];rows.forEach((row,index)=>{if(row.pageGroup===group)positions.push(index);});
      const ordered=positions.map(index=>rows[index]).sort((a,b)=>{
        const mapped=Number(!!b.repositoryHierarchy)-Number(!!a.repositoryHierarchy);
        if(mapped)return mapped;
        if(usesRepositoryAxis(viewId,group)&&a.repositoryHierarchy&&b.repositoryHierarchy){
          if(viewId==='category'){
            const ar=CATEGORY_DEPARTMENT_ORDER.indexOf(a.repositoryHierarchy),br=CATEGORY_DEPARTMENT_ORDER.indexOf(b.repositoryHierarchy);
            return (ar<0?999:ar)-(br<0?999:br)||Number(a.repositoryRowSlot||0)-Number(b.repositoryRowSlot||0);
          }
          if(viewId==='value')return String(a.repositoryHierarchy).localeCompare(String(b.repositoryHierarchy))||Number(a.repositoryRowSlot||0)-Number(b.repositoryRowSlot||0);
          if(group==='matrix'){const ar=CATEGORY_DEPARTMENT_ORDER.indexOf(a.repositoryHierarchy),br=CATEGORY_DEPARTMENT_ORDER.indexOf(b.repositoryHierarchy);return (ar<0?999:ar)-(br<0?999:br)||Number(a.repositoryRowSlot||0)-Number(b.repositoryRowSlot||0);}
          const ag=a.repositorySuperHierarchy||a.repositoryHierarchy,bg=b.repositorySuperHierarchy||b.repositoryHierarchy;
          const ar=ICP_DIMENSION_ORDER.indexOf(ag),br=ICP_DIMENSION_ORDER.indexOf(bg);
          if(ar!==br)return (ar<0?999:ar)-(br<0?999:br);
          const groupCode=matrixGroup('icp',ag),ac=childOrder(groupCode,a.repositoryHierarchy),bc=childOrder(groupCode,b.repositoryHierarchy);
          return ac-bc||String(a.repositoryHierarchy).localeCompare(String(b.repositoryHierarchy))||Number(a.repositoryRowSlot||0)-Number(b.repositoryRowSlot||0);
        }
        return 0;
      });
      positions.forEach((position,index)=>{rows[position]=ordered[index];});
    });
  }
  function applyRepositoryStatuses(root){
    Object.values(root.views||{}).forEach(view=>(view.rows||[]).forEach(row=>Object.values(row.cells||{}).forEach(cell=>{
      if(!cell?.repositoryQueries?.length)return;
      const imported=resolve(cell.repositoryQueries,cell.repositoryUrlOverrides);
      const manualCount=Array.isArray(cell.pageUrls)?cell.pageUrls.filter(item=>String(item?.url||'').trim()).length:0;
      cell.st=imported.some(item=>item.covered)?'written':imported.length+manualCount>2?'plus_2':'for_review';
    })));
  }
  function compactRepositoryCells(view,viewId){
    const rows=view.rows||[];
    for(const group of ['listicle','landing','informational','matrix']){
      const generated=rows.filter(row=>row.pageGroup===group&&row.repositoryHierarchy);
      if(!generated.length)continue;
      const batches=usesRepositoryAxis(viewId,group)
        ? [...new Set(generated.map(row=>viewId==='icp'?(row.repositorySuperHierarchy||'General ICP')+'|'+row.repositoryHierarchy:row.repositoryHierarchy))].map(key=>generated.filter(row=>(viewId==='icp'?(row.repositorySuperHierarchy||'General ICP')+'|'+row.repositoryHierarchy:row.repositoryHierarchy)===key))
        : [generated];
      const redundant=new Set();
      for(const batch of batches){
        const columnIds=[...new Set(batch.flatMap(row=>Object.keys(row.cells||{})))];
        const packed=new Map(columnIds.map(id=>[id,batch.map(row=>row.cells?.[id]).filter(cell=>cell?.repositoryQueries?.length)]));
        batch.forEach(row=>columnIds.forEach(id=>delete row.cells[id]));
        const needed=Math.max(0,...[...packed.values()].map(cells=>cells.length));
        for(let index=0;index<needed;index++)for(const id of columnIds){const cell=packed.get(id)[index];if(cell)batch[index].cells[id]=cell;}
        batch.slice(0,needed).forEach((row,index)=>{row.repositoryRowSlot=index;const first=Object.values(row.cells||{})[0];if(group==='matrix'&&first?.v)row.name=first.v;});
        batch.slice(needed).forEach(row=>redundant.add(row));
      }
      if(redundant.size)view.rows=view.rows.filter(row=>!redundant.has(row));
    }
    const matrixColumns=view.pageColumns?.matrix;
    if(Array.isArray(matrixColumns)){
      const used=new Set((view.rows||[]).filter(row=>row.pageGroup==='matrix').flatMap(row=>Object.keys(row.cells||{})));
      view.pageColumns.matrix=matrixColumns.filter(column=>column.matrixGroup||used.has(column.id));
      if(Array.isArray(view.pageOrders?.matrix))view.pageOrders.matrix=view.pageOrders.matrix.filter(id=>view.pageColumns.matrix.some(column=>column.id===id));
    }
  }
  function ensureRow(view,group,hierarchy,slot,uid,superHierarchy){
    view.rows ||= [];
    let row=view.rows.find(item=>item.pageGroup===group&&item.repositoryHierarchy===hierarchy&&(!superHierarchy||item.repositorySuperHierarchy===superHierarchy)&&Number(item.repositoryRowSlot||0)===Number(slot||0));
    if(!row){
      row=view.rows.find(item=>item.pageGroup===group&&!item.repositoryHierarchy&&group!=='matrix'&&!Object.keys(item.cells||{}).length);
      if(!row){row={id:uid(),pageGroup:group,cells:{}};view.rows.push(row);}
      row.repositoryHierarchy=hierarchy;if(superHierarchy)row.repositorySuperHierarchy=superHierarchy;row.repositoryRowSlot=Number(slot)||0;if(group==='matrix'&&!row.name)row.name=hierarchy;
    }row.cells ||= {};return row;
  }
  function sortIcpMatrixColumns(view){
    const columns=view.pageColumns?.matrix;if(!Array.isArray(columns))return;
    columns.sort((a,b)=>{const ag=ICP_MATRIX_GROUP_ORDER.indexOf(a.matrixGroup),bg=ICP_MATRIX_GROUP_ORDER.indexOf(b.matrixGroup);if(ag!==bg)return (ag<0?999:ag)-(bg<0?999:bg);const ac=childOrder(a.matrixGroup,a.name),bc=childOrder(b.matrixGroup,b.name);return ac-bc||String(a.name).localeCompare(String(b.name));});
    view.pageOrders ||= {};view.pageOrders.matrix=columns.map(column=>column.id);
  }
  function sortValueSeoColumns(view){
    const columns=view.pageColumns?.informational;if(!Array.isArray(columns))return;const order=['problem','solution','product'];
    columns.sort((a,b)=>{const ai=order.indexOf(a.awarenessGroup),bi=order.indexOf(b.awarenessGroup);return (ai<0?999:ai)-(bi<0?999:bi)||String(a.name).localeCompare(String(b.name));});
    view.pageOrders ||= {};view.pageOrders.informational=columns.map(column=>column.id);
  }
  function installMappings(root,types,options={}){
    if(!root?.views||!productMatches(options.product)||!data())return false;
    const workspace=workspaceFor(options.product);
    if(workspace==='ai-data-platform')return installScopedMappings(root,types,{...options,workspace});
    const revision=(data().classifiedAt||'classification')+':maximus-url-to-slug-v1';
    if(root.sharedUrlRepositoryRevision===revision)return false;
    const preserved=captureRepositoryState(root);
    clearPreviousMappings(root);
    const uid=options.uid||(()=>Math.random().toString(36).slice(2));
    let linked=0;
    const dimensionValues=new Map();
    records().filter(record=>record.workspace===workspace).forEach(record=>{
      if(record.section==='Corporate & Non-SEO')return;
      const match=/^(Category|ICP|Value) (AEO|SEO)$/.exec(record.section);if(!match)return;
      const viewId=match[1].toLowerCase(),mode=match[2].toLowerCase(),format=pageGroup(record.pageType);if(!format)return;
      const view=root.views[viewId];if(!view)return;
      const group=mode==='aeo'&&(viewId==='icp'||viewId==='value')?'matrix':format;
      const sourceDimension=viewId==='icp'?(mode==='aeo'?record.axis:record.hierarchy):'';
      const dimensionKey=[record.section,record.topicGroup,sourceDimension].join('|');
      if(viewId==='icp'&&!dimensionValues.has(dimensionKey))dimensionValues.set(dimensionKey,icpDimensionValue(record,sourceDimension));
      const dimensionValue=viewId==='icp'?dimensionValues.get(dimensionKey):'';
      const columnName=viewId==='icp'&&mode==='aeo'?dimensionValue:record.axis;
      const column=ensureColumn(viewId,view,group,columnName,mode,types);
      if(viewId==='icp'&&group==='matrix'){column.matrixGroup=matrixGroup('icp',sourceDimension);column.repositoryDimension=sourceDimension;}
      if(viewId==='value'&&mode==='seo'){column.awarenessGroup=valueSeoAwarenessGroup(record.axis);column.repositoryAwareness=awarenessForGroup(column.awarenessGroup);}
      const rowHierarchy=viewId==='category'?categoryDepartment(record):viewId==='icp'&&mode==='aeo'?processDepartment(record):viewId==='icp'&&mode==='seo'?dimensionValue:record.hierarchy;
      const rowSuperHierarchy=viewId==='icp'&&mode==='seo'?sourceDimension:undefined;
      const row=ensureRow(view,group,rowHierarchy,record.groupOrder,uid,rowSuperHierarchy);
      const current=row.cells[column.id]&&typeof row.cells[column.id]==='object'?row.cells[column.id]:{};
      const saved=preserved.get(record.topicGroup)||{};
      const spec={workspace,section:record.section,pageType:record.pageType,hierarchy:record.hierarchy,axis:record.axis,topicGroup:record.topicGroup};
      const queries=Array.isArray(current.repositoryQueries)?current.repositoryQueries.slice():[];
      if(!queries.some(item=>JSON.stringify(item)===JSON.stringify(spec)))queries.push(spec);
      const awareness=viewId==='value'&&mode==='seo'?awarenessForGroup(valueSeoAwarenessGroup(record.axis)):'';
      const maximusUrl=normalizeName(record.competitor)==='maximus labs'?record.url:'';
      row.cells[column.id]={...current,...saved,v:saved.v||current.v||record.topic||record.hierarchy,url:saved.url||current.url||maximusUrl,mode,type:saved.type||current.type||typeId(types,format),aw:saved.aw||current.aw||awareness,cfg:true,repositoryQueries:queries};linked++;
    });
    Object.entries(root.views).forEach(([viewId,view])=>compactRepositoryCells(view,viewId));
    const categoryView=root.views.category;
    if(categoryView)for(const group of ['listicle','landing','informational']){
      if(!(categoryView.rows||[]).some(row=>row.pageGroup===group&&row.repositoryHierarchy))continue;
      CATEGORY_DEPARTMENT_ORDER.forEach(department=>ensureRow(categoryView,group,department,0,uid));
    }
    const icpView=root.views.icp;
    if(icpView){
      ['SMB','Mid-market','Enterprise'].forEach(value=>ensureRow(icpView,'informational',value,0,uid,'Company size'));
      CATEGORY_DEPARTMENT_ORDER.forEach(value=>ensureRow(icpView,'informational',value,0,uid,'Process / Use case'));
      CATEGORY_DEPARTMENT_ORDER.forEach(value=>ensureRow(icpView,'matrix',value,0,uid));
      for(const value of ['SMB','Mid-market','Enterprise']){const column=ensureColumn('icp',icpView,'matrix',value,'aeo',types);column.matrixGroup='size';column.repositoryDimension='Company size';}
      for(const value of CATEGORY_DEPARTMENT_ORDER){const column=ensureColumn('icp',icpView,'matrix',value,'aeo',types);column.matrixGroup='process';column.repositoryDimension='Process / Use case';}
      sortIcpMatrixColumns(icpView);
    }
    if(root.views.value)sortValueSeoColumns(root.views.value);
    Object.entries(root.views).forEach(([viewId,view])=>mappedRowsFirst(view,viewId));
    applyRepositoryStatuses(root);
    root.sharedUrlRepositoryRevision=revision;root.sharedUrlLinkedCount=linked;return true;
  }
  function hasScopedMappings(view,workspace,awareness){
    return !!view&&(view.rows||[]).some(row=>Object.values(row.cells||{}).some(cell=>(cell?.repositoryQueries||[]).some(query=>query.workspace===workspace&&query.awareness===awareness)));
  }
  function clearScopedMappings(view,workspace,awareness){
    if(!view)return;
    (view.rows||[]).forEach(row=>Object.entries(row.cells||{}).forEach(([id,cell])=>{
      if((cell?.repositoryQueries||[]).some(query=>query.workspace===workspace&&query.awareness===awareness))delete row.cells[id];
    }));
    view.rows=(view.rows||[]).filter(row=>!row.repositoryWorkspace||row.repositoryWorkspace!==workspace||Object.values(row.cells||{}).some(hasUserContent));
  }
  function installScopedMappings(root,types,options){
    const workspace=options.workspace,awareness=options.awareness||'problem-aware',viewId=options.contentView;
    if(!['icp','value'].includes(viewId)||!options.activeView)return false;
    const mode=awareness==='solution-aware'?'aeo':'seo';
    const scope=[workspace,awareness,viewId,mode].join(':');
    const revision=(data().classifiedAt||'classification')+':'+scope+':v3';
    root.sharedUrlRepositoryRevisions ||= {};
    if(root.sharedUrlRepositoryRevisions[scope]===revision&&hasScopedMappings(options.activeView,workspace,awareness))return false;
    const view=options.activeView,uid=options.uid||(()=>Math.random().toString(36).slice(2));
    // Problem Unaware starts as an editable copy of the SEO view. Remove the
    // copied Problem Aware repository cells before installing its own URLs.
    if(awareness==='problem-unaware')clearScopedMappings(view,workspace,'problem-aware');
    clearScopedMappings(view,workspace,awareness);
    let linked=0;
    records().filter(record=>record.workspace===workspace&&record.awareness===awareness&&record.section===sectionFor(viewId,mode)).forEach(record=>{
      if(record.section==='Corporate & Non-SEO')return;
      const format=pageGroup(record.pageType);if(!format)return;
      const group=mode==='aeo'?'matrix':'informational';
      const column=ensureColumn(viewId,view,group,record.axis||'General',mode,types);
      if(group==='matrix')column.matrixGroup=matrixGroup(viewId,record.hierarchy);
      const rowHierarchy=viewId==='icp'&&mode==='seo'?(record.icpSegment||record.hierarchy||'General ICP'):(record.hierarchy||'General');
      const rowSuperHierarchy=viewId==='icp'&&mode==='seo'?(record.hierarchy||'General ICP'):(viewId==='icp'?record.hierarchy:undefined);
      const row=ensureRow(view,group,rowHierarchy,record.groupOrder,uid,rowSuperHierarchy);
      row.repositoryWorkspace=workspace;
      const current=row.cells[column.id]&&typeof row.cells[column.id]==='object'?row.cells[column.id]:{};
      const spec={workspace,awareness,section:record.section,pageType:record.pageType,hierarchy:record.hierarchy,axis:record.axis,topicGroup:record.topicGroup};
      row.cells[column.id]={...current,v:record.topic||record.hierarchy,url:'',mode,type:current.type||typeId(types,format),cfg:true,repositoryQueries:[spec]};
      linked++;
    });
    compactRepositoryCells(view,viewId);
    mappedRowsFirst(view,viewId);
    applyRepositoryStatuses({views:{[viewId]:view}});
    root.sharedUrlRepositoryRevisions[scope]=revision;
    root.sharedUrlLinkedCount=(root.sharedUrlLinkedCount||0)+linked;
    return true;
  }
  global.SharedUrlRepository={load,records,query,resolve,installMappings,productMatches,workspaceFor,pageGroup,sectionFor};
  if(typeof module!=='undefined')module.exports=global.SharedUrlRepository;
})(typeof globalThis!=='undefined'?globalThis:this);
