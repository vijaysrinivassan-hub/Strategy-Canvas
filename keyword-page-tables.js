/* Split plain keyword grids without dropping cell content or metadata. */
(function(root){
  const groups = [
    {id:'listicle', label:'Listicle pages', type:'Listicle'},
    {id:'informational', label:'Informational pages', type:'Informational'},
    {id:'landing', label:'Landing pages', type:'Landing page'}
  ];
  function groupFor(type, types, fallback='listicle'){
    const name=String(types.find(t=>t.id===type)?.name || type || '').toLowerCase();
    if (/informational|informative/.test(name)) return 'informational';
    if (/landing|service page|feature page|use case page/.test(name)) return 'landing';
    if (/listicle|list item/.test(name)) return 'listicle';
    return fallback;
  }
  function split(view,types,uid){
    let changed=false;
    const rows=[];
    for(const row of view.rows){
      const fallback=groups.some(g=>g.id===row.pageGroup)?row.pageGroup:'listicle';
      const buckets=new Map();
      for(const [column,cell] of Object.entries(row.cells || {})){
        const col=view.columns.find(c=>c.id===column);
        const type=typeof cell==='string'?col?.defaults?.type:cell?.type;
        const group=groupFor(type,types,fallback);
        if(!buckets.has(group)) buckets.set(group,{});
        buckets.get(group)[column]=cell;
      }
      if(!buckets.size) buckets.set(fallback,{});
      let first=true;
      for(const [pageGroup,cells] of buckets){
        if(first && buckets.size===1 && row.pageGroup===pageGroup){rows.push(row);}
        else {rows.push({...row,id:first?row.id:uid(),pageGroup,cells});changed=true;}
        first=false;
      }
    }
    if(changed) view.rows=rows;
    return changed;
  }
  const api={groups,groupFor,split};
  if(typeof module!=='undefined') module.exports=api;
  root.KeywordPageTables=api;
})(typeof globalThis!=='undefined'?globalThis:this);
