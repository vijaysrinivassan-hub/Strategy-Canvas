/* Field-only migration. Comparisons, IDs, metrics and assignments are untouched. */
function moveSlugs(body){
 const result={moved:0,conflicts:0};
 const tabs=[body.tabs,...Object.values(body.productWorkspaces||{}).map(w=>w.tabs)];
 for(const workspace of tabs)for(const tab of Object.values(workspace||{})){
  for(const [view,v] of Object.entries(tab.views||{})){
   if(!['category','competitor','icp','value'].includes(view))continue;
   const maps=view==='competitor'?[v.cells||{}]:(v.rows||[]).map(r=>r.cells||{});
   for(const cells of maps)for(const [key,raw] of Object.entries(cells)){
    const title=typeof raw==='string'?raw:raw?.v;
    if(typeof title!=='string'||!/^\/?[a-z0-9]+(?:[-_/][a-z0-9]+)*\/?$/.test(title.trim()))continue;
    if(raw?.url && raw.url!==title){result.conflicts++;continue;}
    if(typeof raw==='string')cells[key]={v:'',url:title};
    else {raw.url=title;raw.v='';}
    result.moved++;
   }
  }
 }
 return result;
}
module.exports={moveSlugs};
