/* Compact pairwise planning matrix; no article editors are created per pair. */
function comparisonKey(a,b){return a===b?null:JSON.stringify([a,b].sort());}
let comparisonObserver=null, comparisonRender=0;
function renderCompetitorComparison(m){
 const host=$('competitorComparison'), generation=++comparisonRender;
 if(comparisonObserver){comparisonObserver.disconnect();comparisonObserver=null;}
 host.hidden=false;host.innerHTML='';
 const heading=document.createElement('h3');heading.textContent='Competitor vs. Competitor';
 const note=document.createElement('p');note.textContent='Mark comparisons to write. Mirrored pairs share one selection; self-comparisons are not applicable.';
 host.append(heading,note);
 const companies=m.rows.filter(c=>(c.name||'').trim());
 if(companies.length<2){const empty=document.createElement('p');empty.textContent='Add at least two named competitors in the table above.';host.append(empty);return;}
 m.comparisonCells ||= {};
 let built=false;
 const build=()=>{
  if(built||generation!==comparisonRender||host.hidden||state.contentView!=='competitor')return;
  built=true;
  const scroller=document.createElement('div');scroller.className='comparison-scroll';
  const table=document.createElement('table');table.className='comparison-table';
  table.setAttribute('aria-label','Competitor vs. Competitor');
  table.style.width=(companies.length+1)*190+'px';
  const thead=document.createElement('thead'),head=document.createElement('tr');
  const corner=document.createElement('th');corner.textContent='Competitor';head.append(corner);
  for(const company of companies){const th=document.createElement('th');th.scope='col';th.textContent=company.name;head.append(th);}
  thead.append(head);table.append(thead);
  const tbody=document.createElement('tbody'),mirrors=new Map();
  for(const a of companies){
   const tr=document.createElement('tr'),rh=document.createElement('th');rh.scope='row';rh.textContent=a.name;tr.append(rh);
   for(const b of companies){
    const td=document.createElement('td'),key=comparisonKey(a.id,b.id);
    if(key===null){td.className='comparison-null';td.textContent='—';td.title='Not applicable: same company';td.setAttribute('aria-label',a.name+' vs. itself: not applicable');tr.append(td);continue;}
    const label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span');
    text.textContent=a.name+' vs. '+b.name;check.type='checkbox';
    check.checked=!!m.comparisonCells[key]?.on;check.disabled=readOnly();
    check.setAttribute('aria-label','Write '+text.textContent);
    td.classList.toggle('planned',check.checked);
    if(!mirrors.has(key))mirrors.set(key,[]);
    mirrors.get(key).push({td,check});
    check.onchange=()=>{
     if(readOnly()||state.tabs[CONTENT_TAB]?.views?.competitor!==m)return;
     m.comparisonCells[key]={...m.comparisonCells[key],on:check.checked};
     for(const item of mirrors.get(key)){item.check.checked=check.checked;item.td.classList.toggle('planned',check.checked);}
     markDirty();
    };
    label.append(check,text);td.append(label);tr.append(td);
   }
   tbody.append(tr);
  }
  table.append(tbody);scroller.append(table);host.append(scroller);
 };
 if(typeof IntersectionObserver==='function'){
  comparisonObserver=new IntersectionObserver(entries=>{
   if(generation===comparisonRender&&entries.some(e=>e.isIntersecting)){comparisonObserver?.disconnect();comparisonObserver=null;build();}
  },{rootMargin:'300px'});comparisonObserver.observe(host);
 }else build();
}
