/* One-time keyword population for AI Data Platform > Solution Aware > Value AEO. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AiDataValueKeywords=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const REVISION='ai-data-value-keyword-lenses-v4';
  const CLIENT='AI Data Platform';
  const PRODUCT_ID='0jgsw8bx554d';
  const COUNTRY='us';
  const LENSES=['process','output','outcome','benefits','tools'];
  const departments=[
    {id:'ai-icp-use-marketing',name:'Marketing',search:'marketing analytics',artifact:'marketing performance report',outcome:'marketing performance visibility',benefit:'improve marketing ROI'},
    {id:'ai-icp-use-product',name:'Product',search:'product analytics',artifact:'product performance report',outcome:'product decision insight',benefit:'improve product decisions'},
    {id:'ai-icp-use-sales',name:'Sales',search:'sales analytics',artifact:'sales performance report',outcome:'sales pipeline visibility',benefit:'improve sales performance'},
    {id:'ai-icp-use-finance',name:'Finance',search:'financial analytics',artifact:'financial performance report',outcome:'profitability visibility',benefit:'improve financial decisions'}
  ];
  const processes=[
    {name:'Analysis',search:'data analysis',artifact:'analytics report',outcome:'decision insight',benefit:'improve decision quality'},
    {name:'Descriptive analysis',search:'descriptive analytics',artifact:'performance summary',outcome:'performance visibility',benefit:'understand past performance'},
    {name:'Diagnostic analysis',search:'diagnostic analytics',artifact:'driver diagnosis',outcome:'cause clarity',benefit:'explain performance changes'},
    {name:'Cohort analysis',search:'cohort analysis',artifact:'cohort performance report',outcome:'cohort behavior insight',benefit:'compare customer groups'},
    {name:'Funnel analysis',search:'funnel analysis',artifact:'conversion funnel report',outcome:'conversion bottleneck visibility',benefit:'reduce funnel drop off'},
    {name:'Attribution analysis',search:'attribution analysis',artifact:'attribution report',outcome:'channel contribution clarity',benefit:'optimize resource allocation'},
    {name:'Segmentation analysis',search:'segmentation analysis',artifact:'segment profile',outcome:'audience differentiation',benefit:'improve audience targeting'},
    {name:'Retention and churn analysis',search:'retention and churn analysis',artifact:'retention report',outcome:'churn risk visibility',benefit:'improve customer retention'},
    {name:'Customer lifetime-value analysis',search:'customer lifetime value analysis',artifact:'lifetime value forecast',outcome:'customer value visibility',benefit:'maximize customer lifetime value'},
    {name:'Product and SKU performance analysis',search:'product and SKU performance analysis',artifact:'product performance scorecard',outcome:'product profitability visibility',benefit:'optimize product assortment'},
    {name:'Marketing-performance analysis',search:'marketing performance analysis',artifact:'marketing performance dashboard',outcome:'marketing efficiency visibility',benefit:'improve campaign ROI'},
    {name:'Revenue and profitability analysis',search:'revenue and profitability analysis',artifact:'profitability report',outcome:'profit driver visibility',benefit:'improve profit margins'},
    {name:'Anomaly and trend analysis',search:'anomaly and trend analysis',artifact:'anomaly alert report',outcome:'early change detection',benefit:'respond to changes faster'},
    {name:'Root-cause analysis',search:'root cause analysis',artifact:'root cause report',outcome:'causal clarity',benefit:'resolve performance issues faster'},
    {name:'Comparative analysis',search:'comparative analysis',artifact:'comparison report',outcome:'benchmark visibility',benefit:'improve comparative decisions'}
  ];
  const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
  const normalize=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const unique=values=>[...new Set(values.map(clean).filter(Boolean))];
  function lensKeywords(process,department){
    const dept=department.name.toLowerCase(),search=process.search,artifact=process.artifact,outcome=process.outcome,benefit=process.benefit;
    return {
      process:unique([
        dept+' '+search,
        search+' for '+dept,
        'how to do '+search+' in '+dept,
        'AI '+search+' for '+dept,
        dept+' '+search+' best practices'
      ]),
      output:unique([
        dept+' '+artifact,
        artifact+' for '+dept,
        'automated '+dept+' '+artifact,
        dept+' '+artifact+' template',
        dept+' '+artifact+' dashboard'
      ]),
      outcome:unique([
        dept+' '+outcome,
        outcome+' for '+dept,
        'improve '+dept+' '+outcome,
        dept+' '+outcome+' insights',
        'AI '+dept+' '+outcome
      ]),
      benefits:unique([
        benefit+' in '+dept,
        'how to '+benefit+' in '+dept,
        dept+' '+benefit,
        'benefits of '+search+' for '+dept,
        'use '+search+' to '+benefit+' in '+dept
      ]),
      tools:unique([
        dept+' '+search+' software',
        search+' tools for '+dept,
        'AI '+dept+' '+search+' platform',
        dept+' '+search+' tool',
        'best '+dept+' '+search+' tools'
      ])
    };
  }
  function headerLensKeywords(item){
    const search=item.search,artifact=item.artifact,outcome=item.outcome,benefit=item.benefit;
    return {
      process:unique([search,'what is '+search,search+' methods','how '+search+' works','AI '+search]),
      output:unique([artifact,artifact+' template',artifact+' example','automated '+artifact,artifact+' dashboard']),
      outcome:unique([outcome,'how to achieve '+outcome,'measure '+outcome,'AI-powered '+outcome,outcome+' benchmarks']),
      benefits:unique([benefit,'benefits of '+search,'business value of '+search,'how '+search+' improves decisions',search+' ROI']),
      tools:unique([search+' tools',search+' software','AI '+search+' platform','best '+search+' tools',search+' solution'])
    };
  }
  const records=[];
  for(const process of processes)for(const department of departments){
    const byLens=lensKeywords(process,department);
    for(const lens of LENSES)for(const keyword of byLens[lens])records.push({process:process.name,department:department.name,columnId:department.id,lens,keyword});
  }
  const headerRecords=[];
  for(const process of processes){
    const byLens=headerLensKeywords(process);
    for(const lens of LENSES)for(const keyword of byLens[lens])headerRecords.push({scope:'row',name:process.name,lens,keyword});
  }
  for(const department of departments){
    const byLens=headerLensKeywords(department);
    for(const lens of LENSES)for(const keyword of byLens[lens])headerRecords.push({scope:'column',name:department.name,columnId:department.id,lens,keyword});
  }
  const keywordKey=(keyword,country)=>normalize(keyword)+'|'+String(country||COUNTRY).toLowerCase();
  function keywordRows(){
    return [...records,...headerRecords].map(record=>({keyword:record.keyword,volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:record.process||record.name,intent:'I, C',country:COUNTRY}));
  }
  function matches(client,productId){return normalize(client)===normalize(CLIENT)&&String(productId||'')===PRODUCT_ID;}
  function apply(contentRoot,keywordRowsFromDb){
    const view=contentRoot?.views?.value;if(!view)return false;
    const rows=(view.rows||[]).filter(row=>row.pageGroup==='matrix');
    const columns=view.pageColumns?.matrix||view.columns||[];
    const rowByName=new Map(rows.map(row=>[normalize(row.name),row]));
    const columnByName=new Map(columns.map(column=>[normalize(column.name),column]));
    const byKeyword=new Map((keywordRowsFromDb||[]).map(row=>[keywordKey(row.keyword,row.country),row]));
    let changed=false;
    for(const record of records){
      const row=rowByName.get(normalize(record.process));
      const column=columns.find(item=>item.id===record.columnId)||columnByName.get(normalize(record.department));
      const keyword=byKeyword.get(keywordKey(record.keyword,COUNTRY));
      if(!row||!column||keyword?.id==null)continue;
      row.cells ||= {};
      const cell=row.cells[column.id]&&typeof row.cells[column.id]==='object'?row.cells[column.id]:(row.cells[column.id]={mode:'aeo',cfg:true,kws:[],pageUrls:[]});
      const target=record.lens==='process'?(cell.kws ||= []):((cell.valueLensKeywords ||= {})[record.lens] ||= []);
      if(!target.map(String).includes(String(keyword.id))){target.push(keyword.id);changed=true;}
    }
    const topicCell=holder=>holder.topicCell||=( {v:String(holder.name||''),url:'',mode:'aeo',type:'',on:false,aw:'',st:'',writtenBy:'',cfg:true,kws:[],valueLensKeywords:{}} );
    for(const holder of [...rows,...columns]){
      const scope=rows.includes(holder)?'row':'column',cell=topicCell(holder);
      for(const lens of LENSES){
        const desired=headerRecords.filter(record=>record.scope===scope&&record.lens===lens&&(scope==='row'?normalize(record.name)===normalize(holder.name):record.columnId===holder.id)).map(record=>byKeyword.get(keywordKey(record.keyword,COUNTRY))?.id).filter(id=>id!=null).map(String);
        const current=(lens==='process'?(cell.kws||[]):((cell.valueLensKeywords||{})[lens]||[])).map(String);
        if(JSON.stringify(current)!==JSON.stringify(desired)){
          if(lens==='process')cell.kws=desired;else{cell.valueLensKeywords||={};cell.valueLensKeywords[lens]=desired;}changed=true;
        }
      }
    }
    return changed;
  }
  return {REVISION,CLIENT,PRODUCT_ID,COUNTRY,LENSES,departments,processes,records,headerRecords,lensKeywords,headerLensKeywords,keywordRows,matches,apply};
});
