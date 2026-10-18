/* September 15 ICP card renderer retained independently of later table experiments. */
/* Use cases are classified from the market down to the click: each row names where (industry), who (department),
   what (business process), the individual (persona) and how (the step-by-step scenario, including what goes wrong).
   Technographics live in each ICP row's Technology axis, so the use-case table does not repeat them. */
const ICP_USE_CASE_COLUMNS=[['industry','Industry','Where','Which market the capability delivers value in'],
 ['department','Department / Function','Who','Which team operates or benefits from it'],
 ['process','Business process','What','The workflow, problem or objective it addresses'],
 ['persona','Persona / User','Individual','The exact user and the goal they are trying to reach'],
 ['scenario','Interaction / Scenario','How','Step by step: inputs → actions → outputs, plus the edge cases']];
/* The third row of a selected ICP: why they buy now, what the companies look like, and who signs. */
const ICP_BUYING_FIELDS=[['buyingTrigger','Buying Trigger','What makes this customer start looking for a solution?'],
 ['firmographics','Firmographics','Industry, company size, region, activity volume'],
 ['economicBuyer','Economic Buyer','Who owns the budget and signs off']];
/* Older cards kept "Segment: use case" text plus firmographics and economic buyer on every use-case row.
   Split the segment into Industry, keep the rest as the Business process, and lift firmographics and the
   economic buyer up to the card (one line per industry) so the five-level table stays clean. */
function migrateIcpUseCaseLevels(icp){
 if(icp.useCaseLevels===1)return false;
 const rows=Array.isArray(icp.useCaseRows)?icp.useCaseRows:[];
 const lift=key=>{
  if(String(icp[key]||'').trim())return;
  const lines=[...new Set(rows.map(row=>{const value=String(row?.[key]||'').trim();if(!value)return '';
   const industry=String(row.industry||String(row.useCase||'').split(':')[0]||'').trim();
   return industry&&rows.length>1?industry+': '+value:value;}).filter(Boolean))];
  icp[key]=lines.join('\n');
 };
 lift('firmographics');lift('economicBuyer');
 icp.useCaseRows=rows.map(row=>{
  const next=Object.assign({},row||{});const text=String(next.useCase||'').trim();
  if(text&&!next.industry&&!next.process){const at=text.indexOf(':');
   if(at>0){next.industry=text.slice(0,at).trim();next.process=text.slice(at+1).trim();}else next.process=text;}
  delete next.useCase;delete next.firmographics;delete next.economicBuyer;delete next.technographics;
  return Object.assign(newIcpUseCaseRow(),next);
 });
 icp.useCaseLevels=1;return true;
}
const ICP_AXES=[['people','People','Only the people in the buying department who run or approve this process'],
 ['process','Process','The process this ICP runs'],
 ['input','Input','Volume, quality and types of data the process needs'],
 ['technology','Technology','Technology (technographics) needed to run the process']];
/* The buying axis chosen in onboarding is not written here: it carries over from the Maturity Axis row in the
   same position as this ICP card. The other three axes describe what that process requires. */
function maturityAxisCarryover(index){
 if(typeof state==='undefined'||typeof MATURITY_ACCESS_TAB==='undefined')return '';
 const architecture=state.tabs?.[MATURITY_ACCESS_TAB]?.architecture;
 if(!architecture||!Array.isArray(architecture.systems))return '';
 const system=[...architecture.systems].sort((a,b)=>(Number(a.row)||0)-(Number(b.row)||0))[index];
 if(!system)return '';
 const nodes=(architecture.nodes||[]).filter(node=>node.systemId===system.id).sort((a,b)=>(a.x-b.x)||(a.y-b.y));
 const name=node=>String((typeof maturityProcessName==='function'?maturityProcessName(node):'')||node.label||'').trim();
 const pillars=nodes.filter(node=>node.processRole==='pillar');
 const current=pillars.find(node=>node.pillarState==='current');
 const inherited=pillars.filter(node=>node!==current).map(name);
 const supporting=nodes.filter(node=>node.processRole!=='pillar').map(name);
 return [system.name,
  current?'Core process: '+name(current)+(current.label&&current.label!==name(current)?' ('+current.label+')':''):'',
  inherited.length?'Builds on: '+inherited.join(' → '):'',
  supporting.length?'Supported by: '+[...new Set(supporting)].join(', '):''].filter(Boolean).join('\n');
}
function newIcpUseCaseRow(){return {id:typeof uid==='function'?uid():'uc-'+Math.random().toString(36).slice(2,10),industry:'',department:'',process:'',persona:'',scenario:''};}
/* Selected card: row 2 is the five-level Use Cases table, row 3 is Buying Trigger, Firmographics and Economic Buyer. */
function renderLegacyIcpDetails(icp,ro){
 const details=document.createElement('div');details.className='icp-details';
 details.append(renderIcpUseCases(icp,ro));
 ICP_BUYING_FIELDS.forEach(([key,title,placeholder])=>{
  const field=document.createElement('label');field.className='icp-detail-field';
  const caption=document.createElement('span');caption.textContent=title;
  const input=positioningTextarea(icp[key]||'',placeholder,ro,value=>{if(!ro)icp[key]=value;});input.rows=4;
  field.append(caption,input);details.append(field);
 });
 return details;
}
/* Segments such as industries or company types sit at every maturity level, so they are use cases inside the
   maturity-based ICP card rather than ICP cards of their own. */
function renderIcpUseCases(icp,ro){
 if(!Array.isArray(icp.useCaseRows))icp.useCaseRows=String(icp.useCases||'').trim()?[Object.assign(newIcpUseCaseRow(),{process:String(icp.useCases).trim()})]:[newIcpUseCaseRow()];
 if(migrateIcpUseCaseLevels(icp)&&!ro&&typeof setTimeout==='function')setTimeout(markDirty,0);
 if(!icp.useCaseRows.length)icp.useCaseRows.push(newIcpUseCaseRow());
 const section=document.createElement('section');section.className='icp-use-cases';
 const caption=document.createElement('span');caption.className='icp-use-cases-title';caption.textContent='Use Cases';section.append(caption);
 const table=document.createElement('div');table.className='icp-use-case-table';table.setAttribute('role','table');
 const head=document.createElement('div');head.className='icp-use-case-row head';head.setAttribute('role','row');
 ICP_USE_CASE_COLUMNS.forEach(([,label,level])=>{const cell=document.createElement('span');cell.setAttribute('role','columnheader');
  const name=document.createElement('b');name.textContent=label;const hint=document.createElement('small');hint.textContent='The '+level.toLowerCase();
  cell.append(name,hint);head.append(cell);});
 head.append(document.createElement('span'));table.append(head);
 icp.useCaseRows.forEach((useCase,index)=>{
  const row=document.createElement('div');row.className='icp-use-case-row';row.setAttribute('role','row');
  ICP_USE_CASE_COLUMNS.forEach(([key,label,,placeholder])=>{
   const input=positioningTextarea(useCase[key]||'',placeholder,ro,value=>{useCase[key]=value;});
   input.rows=key==='scenario'?6:4;input.setAttribute('aria-label',label+' '+(index+1));row.append(input);
  });
  if(!ro){
   const remove=document.createElement('button');remove.type='button';remove.className='icp-row-x';remove.title='Remove this use case';remove.textContent='×';
   remove.setAttribute('aria-label','Remove use case '+(index+1));
   remove.onclick=event=>{event.stopPropagation();icp.useCaseRows.splice(index,1);markDirty();renderPositioning();};row.append(remove);
  } else row.append(document.createElement('span'));
  table.append(row);
 });
 section.append(table);
 if(!ro){
  const add=document.createElement('button');add.type='button';add.className='icp-add-use-case';add.textContent='+ Add use case';
  add.onclick=event=>{event.stopPropagation();icp.useCaseRows.push(newIcpUseCaseRow());markDirty();renderPositioning();};section.append(add);
 }
 return section;
}
function renderIcpCards(p,ro,activeAxis){
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
  const carryover=activeAxis?maturityAxisCarryover(index):'';
  icp.rows.forEach((rowData,rowIndex)=>{
   const row=document.createElement('div');row.className='icp-row';
   const number=document.createElement('span');number.className='icp-row-number';number.textContent=String(rowIndex+1).padStart(2,'0');row.append(number);
   ICP_AXES.forEach(([key,labelText,placeholder])=>{
    const field=document.createElement('div');field.className='icp-field';
    const label=document.createElement('label');
    if(key===activeAxis){
     /* Locked: copied from the Maturity Axis, never edited on the canvas. */
     field.className='icp-field locked-axis';label.textContent=labelText+' · from Maturity Axis';
     const value=rowIndex===0?carryover:'';
     if(rowIndex===0&&value&&rowData[key]!==value){rowData[key]=value;syncLegacyIcpFields(icp);if(!ro)setTimeout(markDirty,0);}
     const locked=positioningTextarea(value,value?'':'Add a matching Maturity Axis row',true,()=>{});
     locked.rows=5;locked.setAttribute('aria-label',labelText+' (locked, from Maturity Axis)');
     field.append(label,locked);row.append(field);return;
    }
    label.textContent=labelText;
    const input=positioningTextarea(rowData[key],placeholder,ro,value=>{rowData[key]=value;if(rowIndex===0)syncLegacyIcpFields(icp);});
    input.rows=5;input.setAttribute('aria-label',labelText+' '+(rowIndex+1));
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
