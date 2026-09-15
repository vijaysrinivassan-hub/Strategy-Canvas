/* Compact independent article columns, retaining the original cell objects and order. */
function populated(c){
 return typeof c==='string'?!!c.trim():!!(c && (c.v||c.url||c.kws?.length));
}
function compact(view){
 const output=[];
 for(const group of ['listicle','informational','landing']){
  const rows=(view.rows||[]).filter(r=>(r.pageGroup||'listicle')===group);
  const columns=[...new Set(rows.flatMap(r=>Object.keys(r.cells||{})))];
  const queues=columns.map(key=>{
   const values=rows.map(r=>r.cells?.[key]).filter(c=>c!==undefined && c!==null && c!=='');
   return [key,[...values.filter(populated),...values.filter(c=>!populated(c))]];
  });
  const height=Math.max(0,...queues.map(([,cells])=>cells.length));
  // Reuse row IDs. A row is just a visual slot, not an article identity.
  const packed=rows.slice(0,height).map(r=>({...r,pageGroup:group,cells:{}}));
  for(const [key,cells] of queues)cells.forEach((cell,i)=>packed[i].cells[key]=cell);
  output.push(...packed);
 }
 // Unknown future groups are not discarded.
 output.push(...(view.rows||[]).filter(r=>r.pageGroup&&!['listicle','informational','landing'].includes(r.pageGroup)));
 view.rows=output;
}
module.exports={compact,populated};
