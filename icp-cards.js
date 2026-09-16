/* September 15 ICP card renderer retained independently of later table experiments. */
function renderLegacyIcpDetails(icp,ro){
 const details=document.createElement('div');details.className='icp-details';
 [['buyingTrigger','Buying Trigger','What makes this customer start looking for a solution?'],['industries','Industries','Which industries does this ICP belong to?'],['useCases','Use Cases','What would they use the product for?']].forEach(([key,title,placeholder])=>{
  const field=document.createElement('label');field.className='icp-detail-field';
  const caption=document.createElement('span');caption.textContent=title;
  const input=positioningTextarea(icp[key]||'',placeholder,ro,value=>{if(!ro)icp[key]=value;});input.rows=3;
  field.append(caption,input);details.append(field);
 });
 return details;
}
function renderIcpCards(p,ro){
 const host=$('positioningIcps');host.replaceChildren();host.className='icp-list';
 p.icps.forEach((icp,index)=>{
  const selected=p.selectedIcp===icp.id,card=document.createElement('article');
  card.className='icp-card'+(selected?' on':'');card.tabIndex=ro?-1:0;card.setAttribute('role','button');card.setAttribute('aria-pressed',String(selected));
  card.onclick=event=>{if(ro||event.target.closest('input,textarea,label,button'))return;selectPositioningIcp(icp.id);};
  card.onkeydown=event=>{if(event.target!==card||!['Enter',' '].includes(event.key))return;event.preventDefault();selectPositioningIcp(icp.id);};
  const head=document.createElement('div');head.className='icp-card-head';
  const nameField=document.createElement('div');nameField.className='icp-name icp-field';
  const nameLabel=document.createElement('label');nameLabel.textContent='ICP '+(index+1);
  const name=positioningInput(icp.name,'ICP name / maturity stage',ro,value=>{icp.name=value;},'icp-title');
  nameField.append(nameLabel,name);head.append(nameField);card.append(head);
  const rows=document.createElement('div');rows.className='icp-rows';
  icp.rows.forEach((rowData,rowIndex)=>{
   const row=document.createElement('div');row.className='icp-row';
   const number=document.createElement('span');number.className='icp-row-number';number.textContent=String(rowIndex+1).padStart(2,'0');row.append(number);
   [['people','People'],['process','Process'],['technology','Technology'],['input','Input']].forEach(([key,labelText])=>{
    const field=document.createElement('div');field.className='icp-field';
    const label=document.createElement('label');label.textContent=labelText;
    const input=positioningInput(rowData[key],labelText+' maturity',ro,value=>{rowData[key]=value;if(rowIndex===0)syncLegacyIcpFields(icp);});
    field.append(label,input);row.append(field);
   });
   if(!ro){
    const remove=document.createElement('button');remove.type='button';remove.className='icp-row-x';remove.title='Remove this row';remove.setAttribute('aria-label','Remove ICP row '+(rowIndex+1));remove.textContent='×';
    remove.onclick=event=>{event.stopPropagation();if(icp.rows.length===1)icp.rows[0]=newPositioningIcpRow();else icp.rows.splice(rowIndex,1);syncLegacyIcpFields(icp);markDirty();renderPositioning();};row.append(remove);
   }
   rows.append(row);
  });
  card.append(rows);
  if(selected)card.append(renderLegacyIcpDetails(icp,ro));
  if(!ro){
   const add=document.createElement('button');add.type='button';add.className='icp-add-row';add.textContent='+ Add row';add.onclick=event=>{event.stopPropagation();icp.rows.push(newPositioningIcpRow());markDirty();renderPositioning();};card.append(add);
  }
  if(selected){const status=document.createElement('span');status.className='icp-selected';status.textContent='Selected ICP';card.append(status);}
  if(!ro){
   const remove=document.createElement('button');remove.type='button';remove.className='pos-x';remove.title='Remove this ICP';remove.textContent='×';
   remove.onclick=()=>{if((icp.name||'').trim()&&!confirm('Remove this ICP?'))return;p.icps=p.icps.filter(x=>x.id!==icp.id);if(p.selectedIcp===icp.id)p.selectedIcp='';if(!p.icps.length)p.icps.push(newPositioningIcp());markDirty();renderPositioning();};card.append(remove);
  }
  host.append(card);
 });
}
