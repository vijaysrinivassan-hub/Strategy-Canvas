/* Shared explicit keyword assignments; underlying keyword records are retained. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KeywordAssignments=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function cells(tabs){
  const out=[];
  for(const v of Object.values(tabs?.['Content Strategy']?.views||{})){
   for(const cell of Object.values(v.cells||{}))if(cell&&typeof cell==='object')out.push(cell);
   const valid=new Set((v.rows||[]).map(r=>r.id));
   for(const [key,cell] of Object.entries(v.comparisonCells||{})){try{if(JSON.parse(key).every(id=>valid.has(id)))out.push(cell);}catch{}}
   for(const row of v.rows||[])for(const cell of Object.values(row.cells||{}))if(cell&&typeof cell==='object')out.push(cell);
  }return out;
 }
 function assigned(body){
  const ids=new Set(),tabs=[body.tabs];
  for(const [id,w] of Object.entries(body.productWorkspaces||{}))if(id!==body.workspaceProductId)tabs.push(w.tabs);
  for(const t of tabs)for(const cell of cells(t))for(const id of cell.kws||[])ids.add(String(id));
  return ids;
 }
 function move(tabs,target,ids){
  const wanted=new Set(ids.map(String));
  for(const cell of cells(tabs))if(cell!==target&&Array.isArray(cell.kws))cell.kws=cell.kws.filter(id=>!wanted.has(String(id)));
  target.kws=[...new Set([...(target.kws||[]).map(String),...wanted])];
 }
 return {cells,assigned,move};
});
