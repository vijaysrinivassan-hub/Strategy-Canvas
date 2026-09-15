/* Non-destructive migration: retired cell payloads remain recoverable on the view. */
const A=require('../keyword-assignments.js');
function migrate(root,keywords){
 const v=root.views?.competitor;if(!v)return {columns:0,assigned:0,pending:0};
 const removed=(v.types||[]).filter(c=>/^comparison(?:\s+\d+)?$/i.test(c.name.trim()));
 const retired=new Set(removed.map(c=>c.id));
 v.comparisonCells ||= {};v.comparisonArchive ||= [];v.comparisonUnresolved ||= [];
 const tabs={'Content Strategy':root},defaults=A.comparisonDefaults(root);
 const targetFor=pair=>{
  const target=v.comparisonCells[JSON.stringify(pair)] ||= {};
  if(!target.type)target.type=defaults.type;if(!target.aw)target.aw=defaults.aw;return target;
 };
 let assigned=0;
 for(const [key,raw] of Object.entries(v.cells||{})){
  const title=typeof raw==='string'?raw:raw?.v||'';
  if(!retired.has(key.split('|')[1])&&!A.isComparison(title))continue;
  if(!v.comparisonArchive.some(x=>x.key===key))v.comparisonArchive.push({key,column:v.types.find(c=>c.id===key.split('|')[1]),cell:JSON.parse(JSON.stringify(raw))});
  const pair=A.comparisonPair(title,v.rows);
  if(pair){
   const target=targetFor(pair);
   if(!target.v){const named=pair.map(id=>v.rows.find(r=>r.id===id)).sort((a,b)=>v.rows.indexOf(b)-v.rows.indexOf(a));target.v=named.map(r=>r.name).join(' vs ');}
   for(const field of ['url','writtenBy','st'])if(!target[field]&&raw?.[field])target[field]=raw[field];
   if(raw?.on)target.on=true;
   if(raw?.kws?.length)A.move(tabs,target,raw.kws);
  }else if(title.trim()&&!v.comparisonUnresolved.some(x=>x.key===key))v.comparisonUnresolved.push({key,title,reason:'Needs explicit competitor mapping',cell:JSON.parse(JSON.stringify(raw))});
  delete v.cells[key];
 }
 for(const k of keywords){
  if(!A.isComparison(k.keyword))continue;
  const pair=A.comparisonPair(k.keyword,v.rows);if(!pair)continue;
  const target=targetFor(pair);
  A.move(tabs,target,[k.id]);
  if(!target.st&&Number(k.volume)>0)target.st='for_review';
  assigned++;
 }
 v.types=(v.types||[]).filter(c=>!retired.has(c.id));
 if(v.columnOrder)v.columnOrder=v.columnOrder.filter(id=>!retired.has(id));
 return {columns:removed.length,assigned,pending:v.comparisonUnresolved.length,archived:v.comparisonArchive.length};
}
function migrateOthers(root){
 const v=root.views?.competitor;if(!v)return {others:0,columns:0};
 v.comparisonOthers ||= {};
 for(const item of v.comparisonUnresolved||[]){
  const key='legacy-'+item.key;
  if(!v.comparisonOthers[key])v.comparisonOthers[key]={...(item.cell&&typeof item.cell==='object'?item.cell:{}),v:item.title,...A.comparisonDefaults(root)};
 }
 delete v.comparisonUnresolved;
 const removed=(v.types||[]).filter(c=>/^switching\s+\d+$/i.test(c.name.trim()));
 const base=v.types?.find(c=>/^switching$/i.test(c.name.trim()));
 if(removed.length&&!base)throw Error('Switching column is missing');
 v.retiredSwitchingArchive ||= [];
 for(const col of removed){
  for(const [key,raw] of Object.entries(v.cells||{})){
   if(key.split('|')[1]!==col.id)continue;
   if(!v.retiredSwitchingArchive.some(x=>x.key===key))v.retiredSwitchingArchive.push({key,column:col,cell:JSON.parse(JSON.stringify(raw))});
   const id='others-'+key.split('|')[0]+'-'+col.id;
   if(!v.rows.some(r=>r.id===id))v.rows.push({id,name:'Others',role:'others',sourceCompetitorId:key.split('|')[0]});
   v.cells[id+'|'+base.id]=raw;delete v.cells[key];
  }
 }
 v.types=v.types.filter(c=>!removed.some(d=>d.id===c.id));
 if(v.columnOrder)v.columnOrder=v.columnOrder.filter(id=>!removed.some(d=>d.id===id));
 return {others:Object.keys(v.comparisonOthers).length,columns:removed.length,overflowRows:v.rows.filter(r=>r.role==='others').length};
}
module.exports={migrate,migrateOthers};
