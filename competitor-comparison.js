/* Pairwise articles share data by stable competitor IDs. Editors load on demand. */
function comparisonKey(a,b){return a===b?null:JSON.stringify([a,b].sort());}
// Export from model data, including cells that have not been scrolled into view.
function comparisonClipboardText(m){
 const companies=m.rows.filter(c=>c.role!=='others'&&String(c.name||'').trim().toLowerCase()!=='others'&&(c.name||'').trim()), rows=[];
 for(let i=0;i<companies.length;i++)for(let j=i+1;j<companies.length;j++){
  const a=companies[i],b=companies[j],pair=b.name+' vs '+a.name;
  const cell=m.comparisonCells?.[comparisonKey(a.id,b.id)]||{};
  const title=cell.v===undefined?pair:cell.v;
  const keywords=gridCellKeywords(title,cell.kws).map(r=>r.keyword);
  if(cell.v===undefined)keywords.push(...gridCellKeywords(a.name+' vs '+b.name,cell.kws).map(r=>r.keyword));
  rows.push([...new Set([title,...keywords].filter(value=>String(value??'').trim()).map(value=>String(value).replace(/\b(vs|versus)\.(?=\s|$)/gi,'$1')))]);
 }
 for(const cell of Object.values(m.comparisonOthers||{})){const keywords=gridCellKeywords(cell.v,cell.kws).map(k=>k.keyword);rows.push([...new Set([cell.v,...keywords].filter(Boolean))]);}
 const field=value=>{const s=String(value??'');return /[,\t\r\n"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
 return rows.filter(row=>row.length).map(row=>row.map(field).join(',')).join('\n');
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
 const defaults=KeywordAssignments.comparisonDefaults(state.tabs[CONTENT_TAB]);
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
    ro:readOnly(),get,set,seed:()=>get().v||title,comparisonOtherId:entry.other?key:null,
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
