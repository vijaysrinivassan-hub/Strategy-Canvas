/* Pairwise articles share data by stable competitor IDs. Editors load on demand. */
function comparisonKey(a,b){return a===b?null:JSON.stringify([a,b].sort());}
function uniqueClipboardValues(values){
 const seen=new Set();
 return values.filter(value=>{
  const clean=String(value??'').trim();if(!clean)return false;
  const key=clean.toLowerCase();if(seen.has(key))return false;
  seen.add(key);return true;
 });
}
function competitorNameVariants(name){
 const clean=String(name||'').trim().replace(/\s+/g,' ');if(!clean)return [];
 const known={
  'darwinbox':['DarwinBox','Darwin Box'],'darwin box':['DarwinBox','Darwin Box'],
  'sap successfactors':['SAP SuccessFactors','SAP Success Factors'],
  'sap success factors':['SAP SuccessFactors','SAP Success Factors']
 };
 const split=clean.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/\s+/g,' ');
 return uniqueClipboardValues([clean,...(known[clean.toLowerCase()]||[]),split]);
}
function escapeClipboardPattern(value){return String(value).replace(/[.*+?^$}(){|[\]\\]/g,'\\$&');}
function competitorPhraseVariants(value,companies){
 let phrases=[String(value??'').trim().replace(/\b(vs|versus)\.(?=\s|$)/gi,'$1')];
 for(const company of companies||[]){
  const aliases=competitorNameVariants(company.name);if(aliases.length<2)continue;
  const pattern=new RegExp('(^|[^A-Za-z0-9])('+aliases.slice().sort((a,b)=>b.length-a.length).map(escapeClipboardPattern).join('|')+')(?=$|[^A-Za-z0-9])','gi');
  const expanded=[];
  for(const phrase of phrases){
   if(!pattern.test(phrase)){pattern.lastIndex=0;expanded.push(phrase);continue;}
   pattern.lastIndex=0;
   for(const alias of aliases)expanded.push(phrase.replace(pattern,(match,prefix)=>prefix+alias));
  }
  phrases=uniqueClipboardValues(expanded);
 }
 return uniqueClipboardValues(phrases);
}
function clipboardField(value){const s=String(value??'');return /[,\t\r\n"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function competitorClipboardText(m){
 const companies=m.rows.filter(c=>c.role!=='others'&&String(c.name||'').trim().toLowerCase()!=='others'&&String(c.name||'').trim());
 const rows=[];
 for(const company of companies){
  const values=[];
  for(const type of m.types||[]){
   const cell=m.cells?.[company.id+'|'+type.id]||{};
   const generated=competitorNameVariants(company.name).map(name=>(name+' '+String(type.name||'').trim()).trim());
   const title=String(cell.v||'').trim();
   values.push(...(title?competitorPhraseVariants(title,companies):generated));
   for(const keyword of gridCellKeywords(title,cell.kws).map(row=>row.keyword))values.push(...competitorPhraseVariants(keyword,companies));
  }
  const unique=uniqueClipboardValues(values);if(unique.length)rows.push(unique.map(clipboardField).join(','));
 }
 return rows.flat().map(clipboardField).join(',');
}

/* Build the page export from saved model data rather than the visible DOM. This
   keeps lazy/off-screen cells in the workbook and avoids exporting blank rows. */
function exportStatusName(id){
 const item=(typeof STATUS!=='undefined'?STATUS:[]).find(value=>value.id===id);
 return item?item.label:'';
}
function exportArticleTypeName(id){
 const item=(typeof articleTypes==='function'?articleTypes():[]).find(value=>value.id===id);
 return item?item.name:'';
}
function exportWrittenByName(value){
 return value==='old'?'Old':value==='new'?'New':'';
}
function exportKeywordValues(rows){
 const unique=[],seen=new Set();let volume=0;
 for(const row of rows||[]){
  const value=String(row.keyword||'').trim(),key=value.toLowerCase();
  if(value&&!seen.has(key)){seen.add(key);unique.push(value);}
  const amount=Number(row.volume);if(Number.isFinite(amount))volume+=amount;
 }
 return {keywords:unique.join(', '),volume};
}
function exportCellRow(first,title,tableName,cell,keywordRows){
 const values=exportKeywordValues(keywordRows);
 return [first,title,values.keywords,values.volume,(cell.mode||'aeo').toUpperCase(),
  exportStatusName(cell.st),cell.on?'Yes':'No',tableName,exportArticleTypeName(cell.type),
  cell.aw||'',exportWrittenByName(cell.writtenBy),cell.url||''];
}
function competitorExportData(m){
 const companies=(m.rows||[]).filter(company=>company.role!=='others'&&String(company.name||'').trim().toLowerCase()!=='others'&&String(company.name||'').trim());
 const main=[];
 for(const company of companies)for(const type of m.types||[]){
  const key=company.id+'|'+type.id,raw=m.cells?.[key];
  const cell=cellState(m,key,typeof defaultsFor==='function'?defaultsFor(type):{});
  const keywords=matrixCellKeywords(company,type,cell.v||cell.url,cell.kws);
  if(!raw&&!keywords.length)continue;
  const title=String(cell.v||'').trim()||String(company.name||'').trim()+' '+String(type.name||'').trim();
  main.push(exportCellRow(String(company.name||'').trim(),title,String(type.name||'').trim(),cell,keywords));
 }
 const comparisons=[];
 for(let i=0;i<companies.length;i++)for(let j=i+1;j<companies.length;j++){
  const a=companies[i],b=companies[j],key=comparisonKey(a.id,b.id),raw=m.comparisonCells?.[key]||{};
  const fallback=b.name+' vs '+a.name;
  const cell=cellState({cells:m.comparisonCells||{}},key,{mode:'aeo'});
  const title=String(raw.v===undefined?fallback:cell.v).trim()||fallback;
  let keywords=gridCellKeywords(title,cell.kws);
  if(raw.v===undefined)keywords=keywords.concat(gridCellKeywords(a.name+' vs '+b.name,cell.kws));
  const uniqueIds=new Set();keywords=keywords.filter(row=>{const id=row.id==null?String(row.keyword||'').toLowerCase():String(row.id);if(uniqueIds.has(id))return false;uniqueIds.add(id);return true;});
  comparisons.push(exportCellRow(fallback,title,'Competitor vs. Competitor',cell,keywords));
 }
 for(const [id] of Object.entries(m.comparisonOthers||{})){
  const cell=cellState({cells:m.comparisonOthers},id,{mode:'aeo'}),title=String(cell.v||'').trim();
  if(!title&&!cell.kws.length)continue;
  comparisons.push(exportCellRow('Others',title,'Competitor vs. Competitor',cell,gridCellKeywords(title,cell.kws)));
 }
 return {main,comparisons};
}
function safeWorkbookName(value){
 return String(value||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,80)||'Competitor';
}
function downloadCompetitorWorkbook(m,meta){
 if(typeof XLSX==='undefined')throw new Error('Excel library did not load');
 const data=competitorExportData(m),headers=['Competitor Name','Title','Keywords','Search Volume','SEO/AEO','Status','Selected','Table','Type','Awareness Stage','Written By','Slug'];
 const comparisonHeaders=headers.slice();comparisonHeaders[0]='Comparison';
 const rows=[['Competitor'],headers,...data.main,[],['Competitor vs. Competitor'],comparisonHeaders,...data.comparisons];
 const sheet=XLSX.utils.aoa_to_sheet(rows);
 sheet['!cols']=[{wch:24},{wch:38},{wch:70},{wch:15},{wch:12},{wch:20},{wch:12},{wch:28},{wch:20},{wch:22},{wch:14},{wch:36}];
 sheet['!autofilter']={ref:'A2:L'+Math.max(2,2+data.main.length)};
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,'Competitor');
 const prefix=[meta?.client,meta?.product,'competitor-keywords'].filter(Boolean).join('-');
 XLSX.writeFile(workbook,safeWorkbookName(prefix)+'.xlsx',{compression:true});
 return {mainRows:data.main.length,comparisonRows:data.comparisons.length};
}
// Export from model data, including cells that have not been scrolled into view.
function comparisonClipboardText(m){
 const companies=m.rows.filter(c=>c.role!=='others'&&String(c.name||'').trim().toLowerCase()!=='others'&&(c.name||'').trim()), rows=[];
 for(let i=0;i<companies.length;i++)for(let j=i+1;j<companies.length;j++){
  const a=companies[i],b=companies[j],pair=b.name+' vs '+a.name;
  const cell=m.comparisonCells?.[comparisonKey(a.id,b.id)]||{};
  const title=cell.v===undefined?pair:cell.v;
  const keywords=gridCellKeywords(title,cell.kws).map(r=>r.keyword);
  if(cell.v===undefined)keywords.push(...gridCellKeywords(a.name+' vs '+b.name,cell.kws).map(r=>r.keyword));
  rows.push(uniqueClipboardValues([title,...keywords].flatMap(value=>competitorPhraseVariants(value,companies))));
 }
 for(const cell of Object.values(m.comparisonOthers||{})){const keywords=gridCellKeywords(cell.v,cell.kws).map(k=>k.keyword);rows.push(uniqueClipboardValues([cell.v,...keywords].flatMap(value=>competitorPhraseVariants(value,companies))));}
 return rows.flat().map(clipboardField).join(',');
}
let comparisonObserver=null, comparisonCellObserver=null, comparisonRender=0;
function renderCompetitorComparison(m){
 const host=$('competitorComparison'), generation=++comparisonRender;
 comparisonObserver?.disconnect();comparisonCellObserver?.disconnect();
 comparisonObserver=null;comparisonCellObserver=null;
 host.hidden=false;host.innerHTML='';
 const heading=document.createElement('h3');heading.textContent='Competitor vs. Competitor';
 const note=document.createElement('p');note.textContent='Plan comparison articles. Each competitor pair appears once. Self-comparisons and repeated pairs are not applicable.';
 const toolbar=document.createElement('div');toolbar.className='comparison-toolbar';
 const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';
 copy.setAttribute('aria-label','Copy all comparisons, proposed titles and keywords');
 const status=document.createElement('span');status.className='comparison-copy-status';status.setAttribute('role','status');
 copy.disabled=m.rows.filter(c=>c.role!=='others'&&String(c.name||'').trim().toLowerCase()!=='others'&&(c.name||'').trim()).length<2&&!Object.keys(m.comparisonOthers||{}).length;
 copy.onclick=async()=>{
  if(generation!==comparisonRender)return;
  copy.disabled=true;
  try{await navigator.clipboard.writeText(comparisonClipboardText(m));status.textContent='Copied';}
  catch{status.textContent='Could not copy. Allow clipboard access and try again.';}
  finally{copy.disabled=false;}
 };
 toolbar.append(heading,status,copy);host.append(toolbar,note);
 m.comparisonOthers ||= {};
 const companies=m.rows.filter(c=>c.role!=='others'&&String(c.name||'').trim().toLowerCase()!=='others'&&(c.name||'').trim());
 if(companies.length<2){const empty=document.createElement('p');empty.textContent='Add at least two named competitors in the table above.';host.append(empty);}
 m.comparisonCells ||= {};
 const defaults={...KeywordAssignments.comparisonDefaults(state.tabs[CONTENT_TAB]),mode:keywordMode};
 let built=false;
 const valid=()=>generation===comparisonRender&&!host.hidden&&state.contentView==='competitor'&&state.tabs[CONTENT_TAB]?.views?.competitor===m;
 const build=()=>{
  if(built||!valid())return;built=true;
  const scroller=document.createElement('div');scroller.className='comparison-scroll';
  const table=document.createElement('table');table.className='comparison-table';
  table.setAttribute('aria-label','Competitor vs. Competitor');table.style.width=(companies.length+1)*310+'px';
  const thead=document.createElement('thead'),head=document.createElement('tr');
  const corner=document.createElement('th');corner.textContent='Competitor';head.append(corner);
  for(const company of companies){const th=document.createElement('th');th.scope='col';th.textContent=company.name;head.append(th);}
  if(!companies.length){const th=document.createElement('th');th.textContent='Articles';head.append(th);}
  thead.append(head);table.append(thead);
  const tbody=document.createElement('tbody'),mirrors=new Map(),pending=new Map();
  const bucket={cells:m.comparisonCells};
  function paint(entry){
   if(!valid())return;
   entry.hydrated=true;const {td,key,title}=entry;td.innerHTML='';td.className='gr-cell';
   const cellBucket=entry.other?{cells:m.comparisonOthers}:bucket;
   const get=()=>{
    const value=cellState(cellBucket,key,defaults);
    const raw=cellBucket.cells[key]||{};
    if(!raw.type)value.type=defaults.type;
    if(!raw.aw)value.aw=defaults.aw;
    if(raw.st===undefined && keywordRowsByIds(raw.kws).some(k=>Number(k.volume)>0))value.st='for_review';
    if(cellBucket.cells[key]?.v===undefined)value.v=title;
    return value;
   };
   const updateFlags=()=>{const c=get();td.classList.toggle('planned',!!c.on);td.classList.toggle('written',c.st==='written');};
   const set=patch=>{
    if(readOnly()||!valid())return;
    setCellState(cellBucket,key,{...get(),...patch,cfg:true});
    updateFlags();
    for(const other of mirrors.get(key)||[])if(other!==entry&&other.hydrated)paint(other);
   };
   const input=document.createElement('input');input.type='text';input.value=get().v;
   input.placeholder='Title....';input.disabled=readOnly();input.setAttribute('aria-label','Comparison title');td.append(input);
   const keywords=document.createElement('div');keywords.className='gr-kws';td.append(keywords);
   const refreshKeywords=()=>{keywords.innerHTML='';const c=get();keywords.append(keywordBlock(gridCellKeywords(c.v,c.kws)));};
   refreshKeywords();updateFlags();
   let timer;
   input.oninput=()=>{
    if(readOnly()||!valid())return;
    set({v:input.value});markDirty();clearTimeout(timer);
    timer=setTimeout(()=>{if(valid()&&input.parentNode===td)refreshKeywords();},250);
   };
   cellControls(td,{
    ro:readOnly(),inlineMode:true,get,set,seed:()=>get().v||title,comparisonOtherId:entry.other?key:null,
    refreshEmpty:updateFlags,
    rerender:()=>{paint(entry);for(const other of mirrors.get(key)||[])if(other!==entry&&other.hydrated)paint(other);}
   });
  }
  for(const a of companies){
   const tr=document.createElement('tr'),rh=document.createElement('th');rh.scope='row';rh.textContent=a.name;tr.append(rh);
   for(const b of companies){
    const td=document.createElement('td'),key=comparisonKey(a.id,b.id);
    if(key===null){td.className='comparison-null';td.textContent='—';td.title='Not applicable: same company';td.setAttribute('aria-label',a.name+' vs. itself: not applicable');tr.append(td);continue;}
    if(companies.indexOf(b)>companies.indexOf(a)){td.className='comparison-null';td.textContent='';td.setAttribute('aria-label','Repeated pair omitted');tr.append(td);continue;}
    const entry={td,key,title:a.name+' vs '+b.name,hydrated:false};
    td.className='comparison-pending';td.textContent=entry.title;
    if(!mirrors.has(key))mirrors.set(key,[]);mirrors.get(key).push(entry);
    pending.set(td,entry);tr.append(td);
   }
   tbody.append(tr);
  }
  const otherRow=document.createElement('tr'),otherHead=document.createElement('th');
  otherHead.scope='row';otherHead.textContent='Others';
  if(!readOnly()){const add=document.createElement('button');add.type='button';add.textContent='+';add.setAttribute('aria-label','Add Others article');
   add.onclick=()=>{if(!valid())return;const id=uid();m.comparisonOthers[id]={v:'',...defaults};markDirty();renderCompetitorComparison(m);};otherHead.append(add);}
  otherRow.append(otherHead);
  const otherCell=document.createElement('td');otherCell.colSpan=Math.max(1,companies.length);
  for(const [key,cell] of Object.entries(m.comparisonOthers)){
   const box=document.createElement('div');box.style.maxWidth='620px';box.style.marginBottom='12px';
   const entry={td:box,key,title:cell.v||'',other:true,hydrated:false};pending.set(box,entry);otherCell.append(box);
  }
  otherRow.append(otherCell);tbody.append(otherRow);
  table.append(tbody);scroller.append(table);host.append(scroller);
  if(typeof IntersectionObserver==='function'){
   comparisonCellObserver=new IntersectionObserver(entries=>{
    if(!valid())return;
    for(const item of entries)if(item.isIntersecting){const entry=pending.get(item.target);if(entry&&!entry.hydrated)paint(entry);comparisonCellObserver?.unobserve(item.target);}
   },{rootMargin:'200px'});
   for(const td of pending.keys())comparisonCellObserver.observe(td);
  }else for(const entry of pending.values())paint(entry);
 };
 if(typeof IntersectionObserver==='function'){
  comparisonObserver=new IntersectionObserver(entries=>{
   if(generation===comparisonRender&&entries.some(e=>e.isIntersecting)){comparisonObserver?.disconnect();comparisonObserver=null;build();}
  },{rootMargin:'300px'});comparisonObserver.observe(host);
 }else build();
}
