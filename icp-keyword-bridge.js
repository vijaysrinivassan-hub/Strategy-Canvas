/* ICP cells become editable keyword briefs, never fabricated keyword metrics. */
const IcpKeywordBridge = {
 formats:{listicle:{label:'Listicle',type:'Listicle',group:'listicle'},service:{label:'Service',type:'Service page',group:'landing'},informational:{label:'Informational',type:'Informational',group:'informational'}},
 key(s){return JSON.stringify([s.icpId,s.rowId||'',s.axis,s.column||'']);},
 topic(text){return String(text||'').split(/\n/)[0].replace(/^Process:\s*/i,'').trim();},
 suggest(topic,format){
  if(!topic.trim())return [];
  if(format==='listicle')return ['best tools for '+topic,topic+' software comparison',topic+' solutions'];
  if(format==='service')return [topic+' software',topic+' solution',topic+' services'];
  return ['how '+topic+' works','how to improve '+topic,topic+' best practices'];
 },
 find(view,key,format,mode){return (view?.rows||[]).flatMap(row=>Object.entries(row.cells||{}).map(([column,cell])=>({row,column,cell}))).find(x=>x.cell?.icpSource?.key===key&&(!format||x.cell.icpSource.format===format)&&(!mode||x.cell.mode===mode));},
 add(root,source,format,mode,topic,ideas,id){
  if(!this.formats[format]||!['aeo','seo'].includes(mode)||!topic.trim())throw Error('Choose a format, channel and topic.');
  const spec=this.formats[format],view=root.views.icp,key=this.key(source);
  const existing=this.find(view,key,format,mode);
  if(existing)return {...existing,created:false};
  const page=KeywordColumns.pageView(view,spec.group);
  const preferred=spec.group==='informational'?'Segment-Specific Outcomes':source.axis==='people'?'Role / Team':source.axis==='technology'?'Existing Tech Stack':source.axis==='input'&&/scale|size/i.test(source.column)?'Company Size':'Use Case';
  let col=page.columns.find(c=>c.name.toLowerCase()===preferred.toLowerCase());
  if(!col){col={id:id(),name:preferred,local:true,instruction:'ICP-specific '+preferred.toLowerCase()+' topics. Review the draft intent and keyword suggestions before research.',defaults:{}};page.columns.push(col);if(page.columnOrder)page.columnOrder.push(col.id);}
  let type=root.articleTypes.find(t=>t.name.toLowerCase()===spec.type.toLowerCase());
  if(!type){type={id:id(),name:spec.type};root.articleTypes.push(type);}
  const clean=[...new Set(ideas.map(s=>s.trim()).filter(Boolean))];
  const title=format==='listicle'?'Best tools for '+topic:format==='service'?topic+' solution':'How to improve '+topic;
  const cell={v:title,url:'',mode,type:type.id,on:true,aw:'',st:'for_review',writtenBy:'',cfg:true,kws:[],keywordIdeas:clean,icpSource:{...source,key,format,topic,sourceText:source.text}};
  // Fill the first genuinely empty slot; never overwrite another article.
  let row=view.rows.find(r=>r.pageGroup===spec.group&&!r.cells?.[col.id]);
  if(!row){row={id:id(),pageGroup:spec.group,cells:{}};view.rows.push(row);}
  row.cells ||= {};row.cells[col.id]=cell;
  return {row,column:col.id,cell,created:true};
 }
};
let pendingIcpKeywordTarget=null;
function appendIcpKeywordControl(host,source,getText,ro){
 const label=document.createElement('label');label.className='icp-keyword-tick';
 const check=document.createElement('input');check.type='checkbox';check.disabled=ro;
 check.checked=!!IcpKeywordBridge.find(state.tabs[CONTENT_TAB]?.views?.icp,IcpKeywordBridge.key(source));
 check.setAttribute('aria-label','Create keywords for '+source.label);
 const text=document.createElement('span');text.textContent='Keywords';
 label.append(check,text);host.append(label);
 check.onchange=()=>{
  check.checked=!!IcpKeywordBridge.find(state.tabs[CONTENT_TAB]?.views?.icp,IcpKeywordBridge.key(source));
  if(ro||readOnly())return;
  openIcpKeywordBrief({...source,text:getText()});
 };
}
function openIcpKeywordBrief(source){
 if(readOnly())return;
 document.getElementById('icpKeywordBrief')?.remove();
 const board=state.boardId,product=state.workspaceProductId,tabs=state.tabs;
 const dialog=document.createElement('dialog');dialog.id='icpKeywordBrief';dialog.className='icp-keyword-dialog';
 const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const heading=make('h2','Create keyword brief');
 const context=make('p',source.label);
 const note=make('p','Draft suggestions only: not search-volume research. Service goes to Landing pages. Review and edit before adding.');
 const topic=make('input');topic.value=IcpKeywordBridge.topic(source.text);topic.placeholder='Name the process or use case';
 const format=make('select');Object.entries(IcpKeywordBridge.formats).forEach(([id,spec])=>{const o=make('option',spec.label);o.value=id;format.append(o);});
 const mode=make('select');['aeo','seo'].forEach(id=>{const o=make('option',id.toUpperCase());o.value=id;mode.append(o);});mode.value=keywordMode;
 const ideas=make('textarea');ideas.rows=6;
 const field=(name,input)=>{const l=make('label',name);l.append(input);return l;};
 const suggest=()=>{ideas.value=IcpKeywordBridge.suggest(topic.value,format.value).join('\n');};
 suggest();format.onchange=suggest;
 const regen=make('button','Refresh suggestions');regen.type='button';regen.onclick=suggest;
 const error=make('p');error.setAttribute('role','alert');
 const cancel=make('button','Cancel');cancel.type='button';cancel.onclick=()=>dialog.close();
 const save=make('button','Add to Keywords');save.type='button';
 save.onclick=()=>{
  if(readOnly()||state.boardId!==board||state.workspaceProductId!==product||state.tabs!==tabs){error.textContent='The client or product changed. Close this window and open it again.';return;}
  try{
   const result=IcpKeywordBridge.add(contentRoot(),source,format.value,mode.value,topic.value.trim(),ideas.value.split('\n'),uid);
   if(result.created)markDirty();
   pendingIcpKeywordTarget=JSON.stringify([result.cell.icpSource.key,result.cell.icpSource.format,result.cell.mode]);
   keywordMode=mode.value;dialog.close();switchContentView('icp');
  }catch(e){error.textContent=e.message;}
 };
 const actions=make('div');actions.className='icp-keyword-actions';actions.append(cancel,save);
 dialog.append(heading,context,note,field('Topic',topic),field('Page format',format),field('Keyword channel',mode),field('Suggested keywords (one per line)',ideas),regen,error,actions);
 dialog.onclose=()=>dialog.remove();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
 document.body.append(dialog);dialog.showModal();topic.focus();
}
function renderIcpKeywordIdeas(td,cell){
 td.querySelector(':scope > .icp-keyword-ideas')?.remove();
 if(cell.icpSource&&pendingIcpKeywordTarget===JSON.stringify([cell.icpSource.key,cell.icpSource.format,cell.mode])){
  pendingIcpKeywordTarget=null;
  requestAnimationFrame(()=>td.scrollIntoView({block:'center',inline:'center'}));
 }
 if(!cell.keywordIdeas?.length)return;
 const box=document.createElement('div');box.className='icp-keyword-ideas';
 const words=document.createElement('div');words.textContent=cell.keywordIdeas.join(', ');
 if(cell.icpSource?.kind==='sample-matrix'){box.classList.add('matrix-keywords');box.append(words);}else{const label=document.createElement('small');label.textContent='Keywords';box.append(label,words);}
 td.append(box);
 if(cell.icpSource)td.dataset.icpKeywordKey=encodeURIComponent(cell.icpSource.key);
}
