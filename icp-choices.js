/* Independent column choices; visual row positions never imply an ICP. */
const IcpChoices={
 id:'composed-icp',
 key(axis,column){return JSON.stringify([axis,column]);},
 columns(p){return [...IcpTable.groups.flatMap(([axis,label])=>IcpTable.leaves(p,axis).map(c=>({axis,column:c.id,label:label+(c.name?' / '+c.name:'')}))),{axis:'trigger',column:'maturity',label:'Buying Trigger'}];},
 migrate(p){
  if(p.icpChoices)return false;
  p.icpChoices={version:1,columns:{}};
  for(const icp of p.icps||[]){
   for(const row of icp.rows||[]){
    for(const [axis]of IcpTable.groups){
     const values={maturity:row[axis]||'',...(row.dimensions?.[axis]||{})};
     for(const [column,text]of Object.entries(values)){
      if(!text.trim())continue;
      const list=p.icpChoices.columns[this.key(axis,column)] ||= [];
      const existing=list.find(x=>x.text===text);
      if(existing){if(p.selectedIcp===icp.id)existing.selected=true;continue;}
      list.push({id:uid(),text,selected:p.selectedIcp===icp.id,source:{icpId:icp.id,rowId:row.id,axis,column}});
     }
    }
   }
   if(icp.buyingTrigger?.trim()){
    const list=p.icpChoices.columns[this.key('trigger','maturity')] ||= [];
    list.push({id:uid(),text:icp.buyingTrigger,selected:p.selectedIcp===icp.id});
   }
  }
  p.icpLegacySelection=p.selectedIcp||'';
  this.sync(p);return true;
 },
 list(p,col){return p.icpChoices.columns[this.key(col.axis,col.column)]||[];},
 selected(p){return this.columns(p).flatMap(c=>this.list(p,c).filter(x=>x.selected&&x.text.trim()).map(x=>({...c,option:x})));},
 sync(p){
  const selected=this.selected(p),prior=p.icps.find(i=>i.id===this.id);
  if(!selected.length){p.selectedIcp='';if(prior){prior.rows=[{id:this.id+'-row',people:'',process:'',technology:'',input:'',dimensions:{}}];prior.buyingTrigger='';}return;}
  const row={id:this.id+'-row',people:'',process:'',technology:'',input:'',dimensions:{}};
  let trigger='';
  for(const c of this.columns(p)){
   const text=this.list(p,c).filter(x=>x.selected&&x.text.trim()).map(x=>x.text).join('\n\n');
   if(c.axis==='trigger'){trigger=text;continue;}
   row.dimensions[c.axis] ||= {};row.dimensions[c.axis][c.column]=text;
   if(text)row[c.axis]+=(row[c.axis]?'\n\n':'')+c.label+': '+text;
  }
  const composite={...prior,id:this.id,name:'Selected ICP',rows:[row],people:row.people,process:row.process,technology:row.technology,input:row.input,buyingTrigger:trigger,selectionMode:'independent-cells'};
  if(prior)Object.assign(prior,composite);else p.icps.push(composite);
  p.selectedIcp=this.id;
 }
};
function renderIcpChoicesBody(p,ro,table,el,button,save){
 const columns=IcpChoices.columns(p),body=el('tbody');
 const summary=el('caption');summary.className='icp-choice-summary';
 const updateSummary=()=>{summary.textContent=IcpChoices.selected(p).length+' choices selected. Rows are independent; select any combination across columns.';};
 updateSummary();table.prepend(summary);
 const count=Math.max(0,...columns.map(c=>IcpChoices.list(p,c).length));
 for(let index=0;index<count;index++){
  const tr=el('tr');
  for(const col of columns){
   const td=el('td'),list=IcpChoices.list(p,col),option=list[index];
   if(option){
    td.className='icp-choice-cell'+(option.selected?' chosen':'');
    const label=el('label'),tick=el('input');tick.type='checkbox';tick.checked=!!option.selected;tick.disabled=ro;
    label.className='icp-choice-select';tick.setAttribute('aria-label','Select '+col.label+' option '+(index+1));
    tick.onchange=()=>{if(ro||readOnly())return;option.selected=tick.checked;IcpChoices.sync(p);markDirty();td.classList.toggle('chosen',tick.checked);updateSummary();};
    label.append(tick,el('span','Include in ICP'));td.append(label);
    const input=positioningTextarea(option.text,'Add an option',ro,v=>{option.text=v;IcpChoices.sync(p);updateSummary();});
    input.setAttribute('aria-label',col.label+' option '+(index+1));td.append(input);
    appendIcpKeywordControl(td,{...(option.source||{icpId:IcpChoices.id,rowId:option.id,axis:col.axis,column:col.column}),label:col.label},()=>option.text,ro);
    if(!ro)td.append(button('Remove',()=>{if(!confirm('Remove this option?'))return;list.splice(index,1);save();}));
   }else td.className='icp-choice-empty';
   tr.append(td);
  }
  body.append(tr);
 }
 const addRow=el('tr');
 columns.forEach(col=>{
  const td=el('td');
  if(!ro)td.append(button('+ Add option',()=>{const key=IcpChoices.key(col.axis,col.column);(p.icpChoices.columns[key] ||= []).push({id:uid(),text:'',selected:false});save();}));
  addRow.append(td);
 });
 body.append(addRow);table.append(body);
 const footer=el('tfoot'),tr=el('tr'),td=el('td');td.colSpan=columns.length;
 const more=button('View selected ICP details',()=>{
  IcpChoices.sync(p);const icp=p.icps.find(i=>i.id===p.selectedIcp);
  if(icp)openIcpWorkflowPage(icp);else alert('Select at least one populated option first.');
 });
 more.disabled=false;more.onclick=()=>{const icp=p.icps.find(i=>i.id===p.selectedIcp);if(icp)openIcpWorkflowPage(icp);else alert('Select at least one populated option first.');};
 td.append(more);
 if(!ro)td.append(button('Clear selections',()=>{for(const list of Object.values(p.icpChoices.columns))for(const o of list)o.selected=false;save();}));
 tr.append(td);footer.append(tr);table.append(footer);
}
