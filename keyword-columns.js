/* Shared by the browser and MCP. Column IDs, never headings, own cell data. */
(function(root, factory){ const api=factory(); if(typeof module==='object') module.exports=api; else root.KeywordColumns=api; })(globalThis, function(){
const KIND='strategy-keyword-column-settings-v1';
const names={category:['Category name','Category synonyms','Features','Reviews','Pricing'],competitor:['Alternatives','Pricing','Reviews','Features'],icp:['ICP','Synonyms','Pains','Use cases','Content angles'],value:['Value proposition','Synonyms','Proof points','Objections','Content angles']};
const copy=x=>JSON.parse(JSON.stringify(x));
function seed(root){
 const out={kind:KIND,views:{}};
 for(const view of Object.keys(names)){
  const v=root?.views?.[view], cols=v?.columns || v?.types;
  out.views[view]=(cols?.filter(c=>c.name?.trim()).length ? cols.filter(c=>c.name?.trim()) : names[view].map(name=>({name})))
   .map((c,i)=>({id:'universal-'+view+'-'+i,name:c.name,instruction:c.instruction||'',defaults:{mode:c.defaults?.mode||'',articleType:root?.articleTypes?.find(t=>t.id===c.defaults?.type)?.name||'',aw:c.defaults?.aw||'',value:c.defaults?.value||''}}));
  if(view==='competitor') out.views[view].unshift({id:'universal-competitor-row',role:'row',name:v?.rowColumn?.name||'Competitor Name',instruction:v?.rowColumn?.instruction||'',defaults:{mode:'',articleType:'',aw:'',value:''}});
 }
 return out;
}
function sync(root,config){
 if(!config?.views) return root;
 root.views ||= {}; if(!root.articleTypes?.length) root.articleTypes=['Listicle','List item','Informational'].map(name=>({id:'universal-type-'+encodeURIComponent(name),name}));
 for(const [view,defs] of Object.entries(config.views)){
  const v=root.views[view] ||= {kind:view==='competitor'?'matrix':'grid',rows:[],cells:{}};
  const key=view==='competitor'?'types':'columns'; v[key] ||= [];
  const all=()=>view==='competitor'?[v.rowColumn,...v[key]].filter(Boolean):v[key];
  // Retiring a universal definition makes its existing columns local; data stays.
  for(const c of all()) if(c.universalId&&!defs.some(d=>d.id===c.universalId)) delete c.universalId;
  for(const d of defs){
   let c=d.role==='row'?(v.rowColumn ||= {}):v[key].find(c=>c.universalId===d.id);
   if(!c){
    c=v[key].find(c=>!c.universalId&&!c.local&&c.name===d.name);
    if(!c){c={id:d.id,name:d.name};v[key].push(c);}
    if(c.instruction || Object.values(c.defaults||{}).some(Boolean)) c.previousLocalSettings ||= copy({instruction:c.instruction,defaults:c.defaults});
   }
   let type='';
   if(d.defaults?.articleType){
    let t=root.articleTypes.find(t=>t.name===d.defaults.articleType);
    if(!t){t={id:'universal-type-'+encodeURIComponent(d.defaults.articleType),name:d.defaults.articleType};root.articleTypes.push(t);}
    type=t.id;
   }
   Object.assign(c,{universalId:d.id,name:d.name,instruction:d.instruction||'',defaults:{mode:d.defaults?.mode||'',type,aw:d.defaults?.aw||'',value:d.defaults?.value||''}});
  }
 }
 return root;
}
function order(v){
 const ids=v.kind==='matrix'?['__row',...(v.types||[]).map(c=>c.id)]:(v.columns||[]).map(c=>c.id);
 return [...new Set([...(v.columnOrder||[]).filter(id=>ids.includes(id)),...ids])];
}
function move(v,id,delta){const ids=order(v),i=ids.indexOf(id),j=i+delta;if(i<0||j<0||j>=ids.length)return false;[ids[i],ids[j]]=[ids[j],ids[i]];v.columnOrder=ids;if(v.kind!=='matrix')v.columns.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));return true;}
return {KIND,names,seed,sync,order,move};
});
