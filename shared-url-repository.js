(function(global){
  'use strict';
  const normalizeUrl=value=>String(value||'').trim().replace(/\/$/,'');
  const sectionFor=(view,mode)=>{
    if(view==='nonseo') return 'Corporate & Non-SEO';
    const labels={category:'Category',icp:'ICP',value:'Value'};
    return labels[view]?labels[view]+' '+String(mode||'aeo').toUpperCase():'';
  };
  const pageGroup=value=>{
    const text=String(value||'').toLowerCase();
    if(text.includes('listicle')) return 'Listicle';
    if(text.includes('landing')) return 'Landing Page';
    if(text.includes('informational')) return 'Informational';
    return String(value||'Unclassified');
  };
  const allowedPageType=(view,mode,type)=>{
    if(view==='nonseo') return true;
    const group=pageGroup(type);
    return mode==='seo'?group==='Informational':group==='Listicle'||group==='Landing Page';
  };
  const productMatches=product=>/answer engine optimization agency/i.test(String(product||''));
  let loadPromise=null,indexedSource=null,indexedRecords=[];
  function data(){return global.CompetitiveIntelligenceClassifications||null;}
  function buildIndex(source){
    if(!source||indexedSource===source) return indexedRecords;
    const owners=new Map();
    (source.profiles||[]).forEach(profile=>(profile.urls||[]).forEach(url=>owners.set(normalizeUrl(url),{
      competitorId:profile.id||'',competitor:profile.name||'',domain:profile.domain||''
    })));
    indexedRecords=Object.entries(source.classifications||{}).map(([url,meta])=>{
      const owner=owners.get(normalizeUrl(url))||{};
      return {id:normalizeUrl(url),url,competitorId:owner.competitorId||'',competitor:owner.competitor||'',domain:owner.domain||'',
        section:meta.section||'Unclassified',pageType:meta.pageType||'Unclassified',hierarchy:meta.hierarchy||'General',
        axis:meta.axis||'General',traffic:meta.traffic||''};
    });
    indexedSource=source;return indexedRecords;
  }
  function load(){
    if(data()) return Promise.resolve(buildIndex(data()));
    if(!loadPromise) loadPromise=fetch('competitive-intelligence-classifications.json',{cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error('Could not load the shared URL repository.');return response.json();})
      .then(source=>{global.CompetitiveIntelligenceClassifications=source;return buildIndex(source);});
    return loadPromise;
  }
  function records(){return buildIndex(data());}
  function query(options={}){
    const section=options.section||sectionFor(options.view,options.mode),term=String(options.search||'').trim().toLowerCase();
    return records().filter(record=>record.section===section&&allowedPageType(options.view,options.mode,record.pageType))
      .filter(record=>!term||[record.url,record.competitor,record.pageType,record.hierarchy,record.axis].join(' ').toLowerCase().includes(term));
  }
  const unique=values=>[...new Set(values.filter(Boolean))];
  const safeClass=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function urlList(rows){
    const list=document.createElement('div');list.className='sur-url-list';
    rows.forEach(record=>{
      const line=document.createElement('div');line.className='sur-url-line';
      const link=document.createElement('a');link.href=record.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=record.url;
      const owner=document.createElement('small');owner.textContent=record.competitor||'Competitor not identified';
      line.append(link,owner);list.append(line);
    });return list;
  }
  function lazyCell(rows){
    const details=document.createElement('details');details.className='sur-cell';
    const summary=document.createElement('summary');summary.textContent=rows.length+' URL'+(rows.length===1?'':'s');details.append(summary);
    details.ontoggle=()=>{if(details.open&&details.children.length===1)details.append(urlList(rows));};return details;
  }
  function matrix(rows,pageType){
    const axes=unique(rows.map(row=>row.axis)).sort((a,b)=>a.localeCompare(b));
    const hierarchies=unique(rows.map(row=>row.hierarchy)).sort((a,b)=>a.localeCompare(b));
    const wrap=document.createElement('div');wrap.className='sur-table-wrap';
    const table=document.createElement('table');table.className='sur-table';
    const head=document.createElement('thead'),hr=document.createElement('tr'),corner=document.createElement('th');
    corner.textContent=pageType;hr.append(corner);axes.forEach(axis=>{const th=document.createElement('th');th.textContent=axis;hr.append(th);});head.append(hr);table.append(head);
    const body=document.createElement('tbody');
    hierarchies.forEach(hierarchy=>{
      const tr=document.createElement('tr'),rowHead=document.createElement('th');rowHead.textContent=hierarchy;tr.append(rowHead);
      axes.forEach(axis=>{const td=document.createElement('td'),matches=rows.filter(row=>row.hierarchy===hierarchy&&row.axis===axis);if(matches.length)td.append(lazyCell(matches));else td.className='sur-empty';tr.append(td);});body.append(tr);
    });table.append(body);wrap.append(table);return wrap;
  }
  function nonSeoGroups(rows){
    const host=document.createElement('div');host.className='sur-nonseo-groups';
    unique(rows.map(row=>row.pageType)).sort((a,b)=>a.localeCompare(b)).forEach(type=>{
      const groupRows=rows.filter(row=>row.pageType===type),details=document.createElement('details');details.className='sur-nonseo-group';
      const summary=document.createElement('summary');summary.textContent=type+' · '+groupRows.length+' URLs';details.append(summary);
      details.ontoggle=()=>{if(details.open&&details.children.length===1)details.append(urlList(groupRows));};host.append(details);
    });return host;
  }
  function paint(host,options){
    const initial=query(options);host.replaceChildren();
    const shell=document.createElement('section');shell.className='shared-url-repository';
    const head=document.createElement('div');head.className='sur-head';
    const copy=document.createElement('div'),title=document.createElement('h3'),note=document.createElement('p');
    title.textContent=options.view==='nonseo'?'Corporate & Non-SEO URLs':'Competitive URL library';
    note.textContent='One shared record set. These URLs are also shown in Competitive Intelligence.';copy.append(title,note);
    const count=document.createElement('strong');count.textContent=initial.length.toLocaleString()+' URLs';
    const search=document.createElement('input');search.type='search';search.placeholder='Filter shared URLs…';search.setAttribute('aria-label','Filter shared URLs');
    head.append(copy,count,search);shell.append(head);const content=document.createElement('div');content.className='sur-content';shell.append(content);host.append(shell);
    const draw=()=>{
      const visible=query({...options,search:search.value});content.replaceChildren();count.textContent=visible.length.toLocaleString()+' URLs';
      if(!visible.length){const empty=document.createElement('p');empty.className='sur-none';empty.textContent='No URLs match this view.';content.append(empty);return;}
      if(options.view==='nonseo'){content.append(nonSeoGroups(visible));return;}
      ['Listicle','Landing Page','Informational'].forEach(type=>{
        const typed=visible.filter(row=>pageGroup(row.pageType)===type);if(!typed.length)return;
        const section=document.createElement('section');section.className='sur-page-group sur-'+safeClass(type);
        const heading=document.createElement('h4');heading.textContent=type+' · '+typed.length.toLocaleString()+' URLs';section.append(heading,matrix(typed,type));content.append(section);
      });
    };search.oninput=draw;draw();
  }
  function render(host,options={}){
    if(!host)return Promise.resolve();
    if(!productMatches(options.product)){host.replaceChildren();host.hidden=true;return Promise.resolve();}
    host.hidden=false;host.innerHTML='<div class="sur-loading">Loading the shared URL repository…</div>';
    return load().then(()=>paint(host,options)).catch(error=>{host.innerHTML='<div class="sur-error">'+String(error.message||error)+'</div>';});
  }
  global.SharedUrlRepository={load,records,query,render,sectionFor,pageGroup,allowedPageType,productMatches};
  if(typeof module!=='undefined')module.exports=global.SharedUrlRepository;
})(typeof globalThis!=='undefined'?globalThis:this);
