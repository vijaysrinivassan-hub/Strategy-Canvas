/* Shared company-level high-priority URL state for Keywords, Competitive Intelligence and Positioning Document. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HighPriorityLinks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function clean(value){return String(value||'').trim();}
  function parts(value){
    const raw=clean(value);if(!raw)return {raw:'',full:'',path:''};
    try{
      const url=new URL(raw);
      const path=(url.pathname||'/').replace(/\/+$/,'')||'/';
      return {raw,full:(url.origin.toLowerCase()+path+url.search).replace(/\/$/,''),path:(path+url.search).toLowerCase()};
    }catch{
      const stripped=raw.split('#')[0].replace(/^\/+/,'').replace(/\/+$/,'');
      return {raw,full:'',path:('/'+stripped).toLowerCase()};
    }
  }
  function same(a,b){
    const left=parts(a),right=parts(b);
    if(!left.raw||!right.raw)return false;
    if(left.full&&right.full)return left.full===right.full;
    return !!left.path&&left.path===right.path;
  }
  function normalize(model){
    if(!model||typeof model!=='object')return [];
    const out=[];
    for(const value of Array.isArray(model.highPriorityUrls)?model.highPriorityUrls:[]){
      const url=clean(value);if(url&&!out.some(existing=>same(existing,url)))out.push(url);
    }
    model.highPriorityUrls=out;
    return out;
  }
  function list(model){return normalize(model).slice();}
  function has(model,url){return normalize(model).some(value=>same(value,url));}
  function toggle(model,url){
    const target=clean(url);if(!target)return false;
    const values=normalize(model),remaining=values.filter(value=>!same(value,target));
    if(remaining.length!==values.length){model.highPriorityUrls=remaining;return false;}
    model.highPriorityUrls=[...values,target];return true;
  }
  function isInternalSlug(value){return !!clean(value);}
  return {parts,same,normalize,list,has,toggle,isInternalSlug};
});