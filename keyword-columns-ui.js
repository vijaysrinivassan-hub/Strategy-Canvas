/* Owner-wide Keyword column definitions use an internal, RLS-protected settings record. */
let keywordSettingsRecord=null, keywordSettings=null;
function readKeywordSettings(records){
 keywordSettingsRecord=records.find(r=>r.owner_id===state.user?.id && (()=>{try{return JSON.parse(r.body).kind===KeywordColumns.KIND;}catch{return false;}})())||null;
 keywordSettings=keywordSettingsRecord?JSON.parse(keywordSettingsRecord.body):null;
 if(keywordSettings){
  KeywordColumns.ensurePageViews(keywordSettings);
  for(const defs of Object.values(keywordSettings.pageViews?.icp||{})){
   for(const column of defs)if(String(column.name||'').trim().toLowerCase()==='company size')column.axis='process';
  }
  for(const column of keywordSettings.views?.icp||[]){
   if(String(column.name||'').trim().toLowerCase()==='company size')column.axis='process';
  }
 }
}
function isKeywordSettingsRecord(r){try{return JSON.parse(r.body).kind===KeywordColumns.KIND;}catch{return false;}}
function activeUniversalColumns(){
 return state.user && (!state.ownerId || state.ownerId===state.user.id) ? keywordSettings : null;
}
function syncUniversalWorkspaces(){
 const config=activeUniversalColumns();if(!config)return;
 KeywordColumns.sync(state.tabs[CONTENT_TAB] ||= {},config);
 for(const w of Object.values(state.productWorkspaces||{})) {w.tabs ||= {};KeywordColumns.sync(w.tabs[CONTENT_TAB] ||= {},config);}
}
function keywordOrderTools(col, rerender){
 const wrap=document.createElement('span');wrap.className='column-order';
 if(readOnly())return wrap;
 const base=state.tabs[CONTENT_TAB].views[state.contentView];
 const group=Object.keys(base.pageColumns||{}).find(g=>base.pageColumns[g].includes(col));
 const v=group?KeywordColumns.pageView(base,group):base, id=col===v.rowColumn?'__row':col.id, ids=KeywordColumns.order(v);
 for(const [text,step] of [['‹',-1],['›',1]]){
  const b=document.createElement('button');b.type='button';b.className='column-move '+(step<0?'column-move-left':'column-move-right');b.textContent=text;
  b.title=step<0?'Move column left':'Move column right';b.setAttribute('aria-label',b.title);
  b.dataset.columnId=id; b.dataset.columnStep=String(step);
  b.disabled=ids.indexOf(id)+step<0||ids.indexOf(id)+step>=ids.length;
  b.onclick=e=>{
   e.stopPropagation();
   if(readOnly() || state.tabs[CONTENT_TAB]?.views[state.contentView] !== base)return;
   const before=KeywordColumns.order(v);
   if(KeywordColumns.move(v,id,step)){
    if (v.kind === 'grid') rerender();
    else moveKeywordTableColumns($('mxTable'),before,KeywordColumns.order(v));
    markDirty();
   }
  };
  wrap.append(b);
 }
 return wrap;
}
function moveKeywordTableColumns(table,before,after){
 // Move the existing nodes: preserve input values, listeners and keyword blocks.
 const index=new Map(before.map((id,i)=>[id,i+1]));
 for(const row of table.querySelectorAll('tr')){
  const cells=Array.from(row.children);
  if(cells.length!==before.length+1)continue;
  for(const id of after)row.append(cells[index.get(id)]);
 }
 const cg=table.querySelector('colgroup');
 if(cg){const cols=Array.from(cg.children);for(const id of after)cg.append(cols[index.get(id)]);}
 for(const b of table.querySelectorAll('[data-column-step]')){
  const next=after.indexOf(b.dataset.columnId)+Number(b.dataset.columnStep);
  b.disabled=next<0||next>=after.length;
 }
}
function applyKeywordMatrixOrder(table,v){
 const original=['__row',...v.types.map(t=>t.id)],ids=KeywordColumns.order(v);
 for(const row of table.querySelectorAll('tr')){
  const cells=Array.from(row.children);if(cells.length!==original.length+1)continue;
  for(const id of ids) row.append(cells[1+original.indexOf(id)]);
 }
 const cg=table.querySelector('colgroup');
 if(cg){const cols=Array.from(cg.children);for(const id of ids)cg.append(cols[1+original.indexOf(id)]);}
}
async function saveUniversalColumns(draft, expected){
 if(!state.user||clientView())return;
 const owner=state.user.id;
 const payload={owner_id:owner,title:'[Internal] Universal keyword columns',body:JSON.stringify(draft),updated_at:new Date().toISOString()};
 let result;
 if(expected) result=await sb.from('reports').update(payload).eq('id',expected.id).eq('owner_id',owner).eq('updated_at',expected.updated_at).select('id,owner_id,title,body,updated_at');
 else {
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner+KeywordColumns.KIND)));
  const hex=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
  payload.id=hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  result=await sb.from('reports').insert(payload).select('id,owner_id,title,body,updated_at');
 }
 if(result.error||!result.data?.length){toast('Settings not saved. Reload settings before retrying: '+(result.error?.message||'Another session changed them.'),true);return false;}
 if(state.user?.id!==owner)return false;
 keywordSettingsRecord=result.data[0];keywordSettings=draft;
 // Loaded products refresh now; unopened clients inherit when opened, without bulk overwrites.
 if(!state.ownerId||state.ownerId===owner){
  syncUniversalWorkspaces();
  markDirty();
 }
 toast('Universal columns saved for your clients and products.');
 renderUniversalColumns();return true;
}
function renderKeywordStrategyPrompt(){
 const host=$('clientKeywordPrompts');if(!host)return;host.innerHTML='';
 if(!state.user||clientView())return;
 const heading=document.createElement('h4');heading.textContent='AI Prompts — Keyword strategy';
 const note=document.createElement('p');note.textContent='Shared high-level instructions for all your clients and products. Read this first, then the relevant column prompt. MCP: ai_prompts_get → keywords.';
 const input=document.createElement('textarea');
 input.setAttribute('aria-label','Keyword strategy AI prompt');
 input.value=keywordSettings?.routingInstruction ?? (KeywordColumns.strategyPrompt+'\n\n'+KeywordColumns.comparisonRouting);
 const expected=keywordSettingsRecord;
 const save=document.createElement('button');save.className='primary';save.textContent='Save AI prompt';
 save.onclick=async()=>{
  if(!input.value.trim()){toast('The AI prompt cannot be empty.',true);return;}
  save.disabled=true;
  try{
   const draft=JSON.parse(JSON.stringify(keywordSettings||KeywordColumns.seed(state.tabs?.[CONTENT_TAB])));
   draft.routingInstruction=input.value;
   if(await saveUniversalColumns(draft,expected))renderKeywordStrategyPrompt();
  }catch(e){toast('Prompt not saved: '+e.message,true);}finally{save.disabled=false;}
 };
 host.append(heading,note,input,save);
}

function renderUniversalColumns(){
 const host=$('keywordColumnsSettings');if(!host)return;host.innerHTML='';
 const p=document.createElement('p');p.textContent='Universal columns appear in every client/product. Edit their names, AI guidance and defaults here. Locked columns can still be reordered in Keywords. Extra columns added there stay local to that product.';
 host.append(p);
 if(!state.user||clientView())return;
 const draft=JSON.parse(JSON.stringify(keywordSettings||KeywordColumns.seed(state.tabs?.[CONTENT_TAB])));
 KeywordColumns.ensurePageViews(draft);
 const sections=[['competitor',draft.views.competitor,'competitor'],...['category','icp','value'].flatMap(v=>Object.entries(draft.pageViews[v]).map(([g,defs])=>[v+' — '+({listicle:'Listicle pages',informational:'Informational pages',landing:'Landing pages'}[g]),defs,v]))];
 const expected=keywordSettingsRecord;
 const promptHint=document.createElement('p');promptHint.textContent='High-level routing instructions are in Clients → AI Prompts. Keep the instructions below specific to each column.';host.append(promptHint);
 const note=document.createElement('p');note.textContent='Manage the dropdown choices in Settings → Article Types. Removing a universal definition makes existing copies local; it never deletes keyword content.';host.append(note);
 for(const [view,defs,baseView] of sections){
  const h=document.createElement('h4');h.textContent=view==='icp'?'ICP':view[0].toUpperCase()+view.slice(1);host.append(h);
  const scroller=document.createElement('div');scroller.style.overflowX='auto';
  const table=document.createElement('table');table.className='universal-columns-table';
  const head=document.createElement('tr');
  const headings=['Column name',...(baseView==='icp'?['ICP axis']:[]),'AI instruction','AEO / SEO','Default article type','Awareness','Order / remove'];
  headings.forEach(x=>{const th=document.createElement('th');th.textContent=x;head.append(th);});table.append(head);
  const draw=()=>{
   while(table.children.length>1)table.lastChild.remove();
   defs.forEach((d,i)=>{
    d.defaults ||= {};const tr=document.createElement('tr');
    function field(value,save,multi=false,options){
     const td=document.createElement('td'),el=document.createElement(options?'select':multi?'textarea':'input');
     if(options)for(const value of options){const o=document.createElement('option');o.value=value;o.textContent=value||'No default';el.append(o);}
     el.value=value||'';el.setAttribute('aria-label',view+' '+d.name+' '+['name','instruction','channel','article type','awareness'][tr.children.length]);
     el.oninput=()=>save(el.value);td.append(el);tr.append(td);
    }
    field(d.name,x=>d.name=x);
    if(baseView==='icp')field(d.axis||KeywordColumns.inferIcpAxis(d.name),x=>d.axis=x,false,KeywordColumns.ICP_AXIS_ORDER);
    field(d.instruction,x=>d.instruction=x,true);
    delete d.defaults.value;
    field(d.defaults.mode,x=>d.defaults.mode=x,false,['','aeo','seo']);
    field(d.defaults.articleType,x=>d.defaults.articleType=x,false,
      ['',...new Set([...articleTypes().map(t=>t.name),d.defaults.articleType].filter(Boolean))]);
    field(d.defaults.aw,x=>d.defaults.aw=x,false,['',...AWARENESS]);
    const td=document.createElement('td');
    for(const [label,delta] of [['↑',-1],['↓',1]]){
     const b=document.createElement('button');b.textContent=label;b.title=delta<0?'Move up':'Move down';b.disabled=i+delta<0||i+delta>=defs.length;
     b.onclick=()=>{[defs[i],defs[i+delta]]=[defs[i+delta],defs[i]];draw();};td.append(b);
    }
    const remove=document.createElement('button');remove.textContent='Remove';remove.disabled=d.role==='row';
    remove.title=d.role==='row'?'The competitor name column identifies rows':'Remove universal definition; keep existing client data';
    remove.onclick=()=>{defs.splice(i,1);draw();};td.append(remove);tr.append(td);table.append(tr);
   });
  };draw();scroller.append(table);host.append(scroller);
  const add=document.createElement('button');add.textContent='+ Universal '+h.textContent+' column';
  add.onclick=()=>{defs.push({id:'universal-'+uid(),name:'New column',instruction:'',...(baseView==='icp'?{axis:'process'}:{}),defaults:{}});draw();};host.append(add);
 }
 const save=document.createElement('button');save.className='primary';save.textContent='Save universal columns';
 save.onclick=async()=>{
  for(const [,defs] of sections){
   const names=defs.map(d=>d.name.trim().toLowerCase());
   if(names.some(n=>!n)||new Set(names).size!==names.length){toast('Use non-empty, unique column names within each table.',true);return;}
   defs.forEach(d=>d.name=d.name.trim());
  }
  save.disabled=true;
  try{await saveUniversalColumns(draft,expected);}catch(e){toast('Settings not saved: '+e.message,true);}finally{save.disabled=false;}
 };host.append(save);
}
