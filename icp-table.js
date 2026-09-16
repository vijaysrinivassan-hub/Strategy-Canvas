/* Product-scoped ICP table; hidden subcolumns retain their data. */
const IcpTable = {
  groups:[['people','People'],['process','Process'],['technology','Technology'],['input','Input']],
  options:[['industries','Industries'],['departments','Departments'],['countries','Countries'],['functions','Functions'],['useCases','Use Cases']],
  columns(p,key){
    const saved=p.icpTableColumns?.[key];
    return Array.isArray(saved)?saved.filter(id=>id!=='maturity'):[];
  },
  children(p,key,id){return (p.icpNestedColumns?.[key]?.[id]||[]).filter(c=>!c.hidden);},
  leaves(p,key){
    const selected=this.columns(p,key);
    if(!selected.length)return [{id:'maturity',name:''}];
    const options=[...this.options,...(p.icpCustomColumns?.[key]||[]).map(c=>[c.id,c.name])];
    return selected.flatMap(id=>{
      const name=options.find(o=>o[0]===id)?.[1]||id;
      const children=this.children(p,key,id);
      return children.length?children.map(c=>({id:JSON.stringify([id,c.id]),name:name+' / '+c.name})):[{id,name}];
    });
  },
  value(row,key,column){
    return column==='maturity'?(row[key]||''):(row.dimensions?.[key]?.[column]||'');
  },
  set(row,key,column,value){
    if(column==='maturity')row[key]=value;
    else{row.dimensions ||= {};row.dimensions[key] ||= {};row.dimensions[key][column]=value;}
  }
};
function closeIcpColumnMenus(except, restoreFocus=false){
  document.querySelectorAll('#positioningIcps details[open]').forEach(menu=>{
    if(menu===except)return;
    menu.open=false;
    if(restoreFocus)menu.querySelector('summary')?.focus();
  });
}
document.addEventListener('pointerdown',event=>{
  const menu=event.target.closest?.('#positioningIcps details');
  closeIcpColumnMenus(menu);
},true);
document.addEventListener('focusin',event=>{
  closeIcpColumnMenus(event.target.closest?.('#positioningIcps details'));
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeIcpColumnMenus(null,true);
});
function renderIcpTable(p,ro){
  const host=$('positioningIcps');host.replaceChildren();host.className='icp-table-scroll';
  const table=document.createElement('table');table.className='icp-positioning-table';
  table.setAttribute('aria-label','ICP positioning');
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const button=(title,fn)=>{
    const b=el('button',title);b.type='button';b.disabled=ro;
    b.onclick=e=>{e.stopPropagation();if(!ro&&!readOnly())fn();};return b;
  };
  const save=()=>{markDirty();renderPositioning();};
  const head=el('thead'),groups=el('tr'),sub=el('tr'),nested=el('tr');
  const hasSub=IcpTable.groups.some(([key])=>IcpTable.columns(p,key).length);
  const hasNested=IcpTable.groups.some(([key])=>IcpTable.columns(p,key).some(id=>IcpTable.children(p,key,id).length));
  const depth=hasNested?3:hasSub?2:1;
  for(const title of ['ICP Name','Buying Trigger']){
    const th=el('th',title);th.rowSpan=depth;th.scope='col';th.className=title==='ICP Name'?'icp-table-name':'icp-table-trigger';groups.append(th);
  }
  IcpTable.groups.forEach(([key,label])=>{
    const selected=IcpTable.columns(p,key),th=el('th');th.colSpan=IcpTable.leaves(p,key).length;th.scope='colgroup';
    if(!selected.length)th.rowSpan=depth;
    th.className='icp-table-group';
    const menu=el('details'),summary=el('summary',label+' ▾');menu.append(summary);
    summary.onclick=event=>{
      event.preventDefault();
      const open=!menu.open;
      closeIcpColumnMenus(menu);
      menu.open=open;
    };
    const panel=el('div');panel.className='icp-column-menu';
    panel.append(el('strong','Visible subcolumns'));
    const options=[...IcpTable.options,...(p.icpCustomColumns?.[key]||[]).map(c=>[c.id,c.name])];
    options.forEach(([id,name])=>{
      const line=el('label'),check=el('input');check.type='checkbox';check.checked=selected.includes(id);check.disabled=ro;
      check.onchange=()=>{
        if(ro||readOnly())return;
        const current=IcpTable.columns(p,key);
        const next=check.checked?[...current,id]:current.filter(v=>v!==id);
        p.icpTableColumns ||= {};p.icpTableColumns[key]=next;save();
        const opened=$('positioningIcps').querySelector('[data-group="'+key+'"]');if(opened)opened.open=true;
      };
      line.append(check,el('span',name));panel.append(line);
    });
    if(!ro){
      const custom=el('input');custom.placeholder='Custom subcolumn';custom.setAttribute('aria-label',label+' custom subcolumn');
      panel.append(custom,button('+ Add subcolumn',()=>{
        const name=custom.value.trim();if(!name)return;
        const existing=options.find(([,label])=>label.toLowerCase()===name.toLowerCase());
        const id=existing?existing[0]:uid();
        if(!existing){p.icpCustomColumns ||= {};p.icpCustomColumns[key] ||= [];p.icpCustomColumns[key].push({id,name});}
        p.icpTableColumns ||= {};p.icpTableColumns[key]=[...new Set([...selected,id])];save();
      }));
    }
    panel.append(el('small','Unchecking hides a column; it does not delete its contents.'));
    menu.dataset.group=key;menu.append(panel);th.append(menu);groups.append(th);
    selected.forEach((id,index)=>{
      const title=options.find(o=>o[0]===id)?.[1]||id;
      const children=IcpTable.children(p,key,id);
      const cell=el('th');cell.scope=children.length?'colgroup':'col';
      cell.colSpan=children.length||1;
      if(!children.length)cell.rowSpan=depth-1;
      if(index===0)cell.className='icp-group-start';
      const childMenu=el('details'),childSummary=el('summary',title+' ▾');childMenu.append(childSummary);
      childSummary.onclick=e=>{e.preventDefault();const open=!childMenu.open;closeIcpColumnMenus(childMenu);childMenu.open=open;};
      const childPanel=el('div');childPanel.className='icp-column-menu';
      childPanel.append(el('strong','Columns under '+title));
      for(const child of p.icpNestedColumns?.[key]?.[id]||[]){
        const line=el('label'),check=el('input');check.type='checkbox';check.checked=!child.hidden;check.disabled=ro;
        check.onchange=()=>{if(ro||readOnly())return;child.hidden=!check.checked;save();};
        line.append(check,el('span',child.name));childPanel.append(line);
      }
      if(!ro){
        const custom=el('input');custom.placeholder=id==='industries'?'Industry name, e.g. Mining':'Name a subcolumn';
        custom.setAttribute('aria-label',label+' / '+title+' new child column');
        childPanel.append(custom,button('+ Add child column',()=>{
          const name=custom.value.trim();if(!name)return;
          p.icpNestedColumns ||= {};p.icpNestedColumns[key] ||= {};p.icpNestedColumns[key][id] ||= [];
          const list=p.icpNestedColumns[key][id];
          const existing=list.find(c=>c.name.toLowerCase()===name.toLowerCase());
          if(existing)existing.hidden=false;else list.push({id:uid(),name});
          save();
        }));
        childPanel.append(button('Remove '+title,()=>{
          p.icpTableColumns ||= {};p.icpTableColumns[key]=IcpTable.columns(p,key).filter(c=>c!==id);save();
        }));
      }
      childPanel.append(el('small','Subcolumns are optional. Removed columns retain their data and can be restored here.'));
      childMenu.append(childPanel);cell.append(childMenu);sub.append(cell);
      children.forEach(child=>{
        const leaf=el('th',child.name);leaf.scope='col';leaf.className='icp-nested-heading';
        if(!ro){
          const remove=button('×',()=>{child.hidden=true;save();});remove.setAttribute('aria-label','Remove '+label+' / '+title+' / '+child.name);leaf.append(remove);
        }
        nested.append(leaf);
      });
    });
  });
  const actions=el('th','Rows');actions.rowSpan=depth;actions.scope='col';groups.append(actions);
  head.append(groups);if(hasSub)head.append(sub);if(hasNested)head.append(nested);table.append(head);
  p.icps.forEach((icp,index)=>{
    const body=el('tbody');body.className='icp-table-block'+(p.selectedIcp===icp.id?' selected':'');
    body.setAttribute('aria-label','ICP '+(index+1));
    icp.rows.forEach((row,rowIndex)=>{
      const tr=el('tr');
      if(rowIndex===0){
        const name=el('th');name.scope='rowgroup';name.rowSpan=icp.rows.length;name.className='icp-table-name';
        name.append(el('small','ICP '+(index+1)));
        const title=positioningTextarea(icp.name,'ICP name / maturity stage',ro,v=>{icp.name=v;});title.setAttribute('aria-label','ICP '+(index+1)+' name');
        name.append(title);
        const select=button(p.selectedIcp===icp.id?'Selected ICP':'Select ICP',()=>selectPositioningIcp(icp.id));
        select.setAttribute('aria-pressed',String(p.selectedIcp===icp.id));name.append(select);
        if(p.selectedIcp===icp.id){
          const more=el('button','View More');more.type='button';more.onclick=()=>openIcpWorkflowPage(icp);name.append(more);
        }
        if(!ro){
          name.append(button('+ Add row',()=>{icp.rows.push(newPositioningIcpRow());save();}));
          name.append(button('Remove ICP',()=>{
            if(!confirm('Remove this ICP and its details?'))return;
            p.icps=p.icps.filter(item=>item.id!==icp.id);
            if(p.selectedIcp===icp.id)p.selectedIcp='';
            if(!p.icps.length)p.icps.push(newPositioningIcp());save();
          }));
        }
        const trigger=el('td');trigger.rowSpan=icp.rows.length;trigger.className='icp-table-trigger';
        const text=positioningTextarea(icp.buyingTrigger,'What triggers a purchase?',ro,v=>{icp.buyingTrigger=v;});
        text.setAttribute('aria-label','ICP '+(index+1)+' buying trigger');trigger.append(text);tr.append(name,trigger);
      }
      IcpTable.groups.forEach(([key,label])=>{
        const options=[...IcpTable.options,...(p.icpCustomColumns?.[key]||[]).map(c=>[c.id,c.name])];
        IcpTable.leaves(p,key).forEach(({id,name:columnName},columnIndex)=>{
          const td=el('td');if(columnIndex===0)td.className='icp-group-start';
          const input=positioningTextarea(IcpTable.value(row,key,id),columnName?label+' · '+columnName:label,ro,value=>{
            IcpTable.set(row,key,id,value);if(rowIndex===0&&id==='maturity')syncLegacyIcpFields(icp);
          });
          input.setAttribute('aria-label','ICP '+(index+1)+', row '+(rowIndex+1)+', '+label+', '+columnName);
          td.append(input);tr.append(td);
        });
      });
      const controls=el('td');controls.className='icp-table-row-tools';controls.append(el('small',String(rowIndex+1)));
      if(!ro)controls.append(button('×',()=>{
        if(!confirm('Remove this row and its contents?'))return;
        if(icp.rows.length===1)icp.rows[0]=newPositioningIcpRow();else icp.rows.splice(rowIndex,1);
        syncLegacyIcpFields(icp);save();
      }));
      tr.append(controls);body.append(tr);
    });
    table.append(body);
  });
  host.append(table);
}
