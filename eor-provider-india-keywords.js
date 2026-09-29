/* One-time, board-scoped seed for the EOR provider India competitor matrix. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EorProviderIndiaKeywords=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const REVISION='eor-provider-india-keywords-v1';
  const COUNTRY='in';
  const competitors=['Rippling','Remote','Deel','Globalization Partners','Velocity Global','Multiplier','Papaya Global','WiseMonk'];
  const records=[
    {keyword:'rippling pricing',volume:1500,kd:10,cpc:8,traffic_potential:800,parent_topic:'rippling pricing',intent:'I, C',company:'Rippling',articleType:'Pricing'},
    {keyword:'remote reviews',volume:900,kd:5,cpc:1.3,traffic_potential:400,parent_topic:'remote reviews',intent:'I, C',company:'Remote',articleType:'Reviews'},
    {keyword:'rippling reviews',volume:800,kd:0,cpc:14,traffic_potential:700,parent_topic:'rippling reviews',intent:'I, C',company:'Rippling',articleType:'Reviews'},
    {keyword:'deel pricing',volume:500,kd:8,cpc:90,traffic_potential:400,parent_topic:'deel company',intent:'I, C',company:'Deel',articleType:'Pricing'},
    {keyword:'remote pricing',volume:450,kd:0,cpc:19,traffic_potential:300,parent_topic:'remote pricing',intent:'I, C',company:'Remote',articleType:'Pricing'},
    {keyword:'deel reviews',volume:300,kd:6,cpc:40,traffic_potential:90,parent_topic:'deel reviews',intent:'I, C',company:'Deel',articleType:'Reviews'},
    {keyword:'globalization partners reviews',volume:200,kd:1,cpc:90,traffic_potential:80,parent_topic:'globalization partners reviews',intent:'I, C',company:'Globalization Partners',articleType:'Reviews'},
    {keyword:'rippling features',volume:150,kd:4,cpc:12,traffic_potential:159000,parent_topic:'rippling',intent:'I, C',company:'Rippling',articleType:'Features'},
    {keyword:'deel features',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,company:'Deel',articleType:'Features'},
    {keyword:'velocity global pricing',volume:100,kd:0,cpc:45,traffic_potential:40,parent_topic:'velocity global pricing',intent:'I, C',company:'Velocity Global',articleType:'Pricing'},
    {keyword:'multiplier reviews',volume:90,kd:3,cpc:0.35,traffic_potential:30,parent_topic:'multiplier reviews',intent:'I, C',company:'Multiplier',articleType:'Reviews'},
    {keyword:'papaya global reviews',volume:80,kd:6,cpc:35,traffic_potential:100,parent_topic:'papaya global review',intent:'I, C',company:'Papaya Global',articleType:'Reviews'},
    {keyword:'remote features',volume:50,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I',company:'Remote',articleType:'Features'},
    {keyword:'velocity global reviews',volume:40,kd:0,cpc:12,traffic_potential:20,parent_topic:'velocity global reviews',intent:'I, C',company:'Velocity Global',articleType:'Reviews'},
    {keyword:'globalization partners pricing',volume:40,kd:null,cpc:25,traffic_potential:null,parent_topic:null,intent:null,company:'Globalization Partners',articleType:'Pricing'},
    {keyword:'multiplier pricing',volume:40,kd:0,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',company:'Multiplier',articleType:'Pricing'},
    {keyword:'papaya global features',volume:30,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,company:'Papaya Global',articleType:'Features'},
    {keyword:'wisemonk reviews',volume:20,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,company:'WiseMonk',articleType:'Reviews'},
    {keyword:'papaya global pricing',volume:10,kd:2,cpc:19,traffic_potential:0,parent_topic:'papaya global pricing',intent:'I, C',company:'Papaya Global',articleType:'Pricing'},
    {keyword:'deel alternatives',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,company:'Deel',articleType:'Alternatives'},
    {keyword:'globalization partners alternatives',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,company:'Globalization Partners',articleType:'Alternatives'},
    {keyword:'rippling vs deel',volume:600,kd:2,cpc:40,traffic_potential:500,parent_topic:'rippling vs deel',intent:'I, C',comparison:['Rippling','Deel']},
    {keyword:'remote vs deel',volume:200,kd:0,cpc:80,traffic_potential:100,parent_topic:'remote vs deel',intent:'I, C',comparison:['Remote','Deel']},
    {keyword:'multiplier vs deel',volume:150,kd:null,cpc:19,traffic_potential:null,parent_topic:null,intent:'I',comparison:['Multiplier','Deel']},
    {keyword:'globalization partners vs rippling',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Globalization Partners','Rippling']},
    {keyword:'globalization partners vs deel',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Globalization Partners','Deel']},
    {keyword:'globalization partners vs remote',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Globalization Partners','Remote']},
    {keyword:'papaya global vs deel',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Papaya Global','Deel']},
    {keyword:'globalization partners vs papaya global',volume:100,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Globalization Partners','Papaya Global']},
    {keyword:'globalization partners vs velocity global',volume:90,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Globalization Partners','Velocity Global']},
    {keyword:'remote vs rippling',volume:90,kd:0,cpc:null,traffic_potential:null,parent_topic:null,intent:'I',comparison:['Remote','Rippling']},
    {keyword:'velocity global vs deel',volume:20,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Velocity Global','Deel']},
    {keyword:'papaya global vs rippling',volume:10,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Papaya Global','Rippling']},
    {keyword:'papaya global vs remote',volume:10,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:'I, C',comparison:['Papaya Global','Remote']},
    {keyword:'multiplier vs remote',volume:10,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Multiplier','Remote']},
    {keyword:'multiplier vs rippling',volume:10,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Multiplier','Rippling']},
    {keyword:'deel vs wisemonk',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Deel','WiseMonk']},
    {keyword:'globalization partners vs multiplier',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Globalization Partners','Multiplier']},
    {keyword:'globalization partners vs wisemonk',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Globalization Partners','WiseMonk']},
    {keyword:'multiplier vs wisemonk',volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:null,intent:null,comparison:['Multiplier','WiseMonk']}
  ];
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const keywordKey=(keyword,country)=>normalize(keyword)+'|'+String(country||COUNTRY).toLowerCase();
  const title=value=>String(value||'').replace(/\b\w/g,letter=>letter.toUpperCase());
  const unique=values=>[...new Set(values.filter(value=>value!=null).map(String))];
  function matchesBoard(values){return (values||[]).some(value=>normalize(value)==='eor provider india');}
  function keywordRows(){
    return records.map(record=>({
      keyword:record.keyword,volume:record.volume,kd:record.kd,cpc:record.cpc,
      traffic_potential:record.traffic_potential,parent_topic:record.parent_topic,
      intent:record.intent,country:COUNTRY
    }));
  }
  function ensureNamed(items,name,make){
    let item=(items||[]).find(value=>normalize(value.name)===normalize(name));
    if(item)return item;
    item=(items||[]).find(value=>!String(value.name||'').trim());
    if(item){item.name=name;return item;}
    item=make(name);items.push(item);return item;
  }
  function mergeCell(current,record,id,defaults){
    current=current&&typeof current==='object'?current:{};
    return {...current,v:current.v||title(record.keyword),mode:current.mode||'aeo',
      type:current.type||defaults.type||'',aw:current.aw||defaults.aw||'Competitor aware',
      st:current.st||'for_review',cfg:true,kws:unique([...(current.kws||[]),id])};
  }
  function apply(contentRoot,keywordRowsFromDb,uid,defaults={}){
    const matrix=contentRoot?.views?.competitor;if(!matrix)return false;
    matrix.rows ||= [];matrix.types ||= [];matrix.cells ||= {};matrix.comparisonCells ||= {};
    const byKeyword=new Map((keywordRowsFromDb||[]).map(row=>[keywordKey(row.keyword,row.country),row]));
    const rowByName=new Map();
    for(const name of competitors){
      const row=ensureNamed(matrix.rows,name,value=>({id:uid(),name:value}));
      rowByName.set(normalize(name),row);
    }
    const typeByName=new Map();
    for(const name of ['Alternatives','Reviews','Pricing','Features']){
      typeByName.set(normalize(name),ensureNamed(matrix.types,name,value=>({id:uid(),name:value})));
    }
    let changed=false;
    for(const record of records){
      const keyword=byKeyword.get(keywordKey(record.keyword,COUNTRY));if(!keyword?.id)continue;
      if(record.comparison){
        const a=rowByName.get(normalize(record.comparison[0])),b=rowByName.get(normalize(record.comparison[1]));
        if(!a||!b)continue;
        const key=JSON.stringify([a.id,b.id].sort()),before=JSON.stringify(matrix.comparisonCells[key]||{});
        matrix.comparisonCells[key]=mergeCell(matrix.comparisonCells[key],record,keyword.id,defaults);
        if(JSON.stringify(matrix.comparisonCells[key])!==before)changed=true;
      }else{
        const company=rowByName.get(normalize(record.company)),type=typeByName.get(normalize(record.articleType));
        if(!company||!type)continue;
        const key=company.id+'|'+type.id,before=JSON.stringify(matrix.cells[key]||{});
        matrix.cells[key]=mergeCell(matrix.cells[key],record,keyword.id,defaults);
        if(JSON.stringify(matrix.cells[key])!==before)changed=true;
      }
    }
    return changed;
  }
  return {REVISION,COUNTRY,competitors,records,keywordRows,matchesBoard,apply};
});
