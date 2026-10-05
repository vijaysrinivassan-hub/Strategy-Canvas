/* One-time keyword population for AI Data Platform > Solution Aware > Value AEO. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AiDataValueKeywords=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const REVISION='ai-data-value-keyword-lenses-v7';
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
  /* Process -> sub-process -> sub-subprocess -> five close search variants.
     The matrix row supplies the sub-process; these groups are the five
     concrete sub-subprocess intents shown inside each department cell. */
  const intentTaxonomy={
    'Analysis':[
      ['Descriptive analysis','descriptive analytics','data summarization','historical data analysis','performance summary analysis'],
      ['Diagnostic analysis','diagnostic analytics','performance diagnosis','data diagnosis','why it happened analysis'],
      ['Predictive analysis','predictive analytics','forecasting analysis','future performance analysis','predictive data modeling'],
      ['Prescriptive analysis','prescriptive analytics','decision optimization analysis','recommended action analysis','optimization modeling'],
      ['Comparative analysis','comparison analysis','cross-segment analysis','period comparison analysis','benchmark comparison']
    ],
    'Descriptive analysis':[
      ['KPI summarization','KPI summary','KPI analysis','KPI performance summary','key performance indicator reporting'],
      ['Dashboard reporting','performance dashboard','business intelligence dashboard','analytics dashboard','KPI dashboard'],
      ['Periodic performance reporting','recurring performance reports','monthly performance reporting','weekly performance report','quarterly performance analysis'],
      ['Distribution analysis','data distribution analysis','frequency distribution analysis','statistical distribution analysis','distribution pattern analysis'],
      ['Historical performance summaries','historical performance analysis','past performance review','historical trend summary','performance history report']
    ],
    'Diagnostic analysis':[
      ['Drill-down analysis','data drill-down','detailed performance analysis','granular data analysis','metric drill-down'],
      ['Correlation analysis','variable correlation analysis','relationship analysis','correlation testing','data relationship analysis'],
      ['Variance decomposition','variance breakdown analysis','performance variance analysis','variance contribution analysis','source of variance analysis'],
      ['Contributing-factor analysis','performance driver analysis','factor contribution analysis','key driver analysis','influencing factor analysis'],
      ['Hypothesis testing','statistical hypothesis analysis','significance testing','A/B hypothesis testing','data hypothesis validation']
    ],
    'Cohort analysis':[
      ['Cohort definition','customer cohort creation','cohort grouping','user cohort segmentation','cohort identification'],
      ['Retention-curve analysis','cohort retention analysis','customer retention curve','user retention curve','retention trend analysis'],
      ['Cohort revenue analysis','revenue by cohort','cohort sales analysis','customer cohort revenue','cohort monetization analysis'],
      ['Behavioral progression analysis','cohort behavior analysis','user behavior over time','customer progression analysis','lifecycle behavior analysis'],
      ['Cohort comparison','compare customer cohorts','cohort performance comparison','user cohort comparison','cross-cohort analysis']
    ],
    'Funnel analysis':[
      ['Funnel-stage definition','conversion funnel stages','customer journey stages','sales funnel setup','funnel-stage mapping'],
      ['Stage conversion analysis','funnel conversion analysis','stage-to-stage conversion','conversion rate by stage','funnel progression analysis'],
      ['Drop-off analysis','funnel drop-off analysis','abandonment analysis','conversion drop-off analysis','user exit analysis'],
      ['Time-to-conversion analysis','conversion time analysis','time to purchase analysis','sales-cycle duration analysis','customer conversion timeline'],
      ['Customer-path analysis','user journey analysis','conversion path analysis','customer journey analysis','path-to-purchase analysis']
    ],
    'Attribution analysis':[
      ['Channel attribution','marketing channel attribution','channel contribution analysis','channel conversion attribution','revenue attribution by channel'],
      ['Campaign attribution','marketing campaign attribution','campaign contribution analysis','campaign conversion attribution','revenue attribution by campaign'],
      ['Touchpoint attribution','customer touchpoint analysis','marketing touchpoint attribution','conversion touchpoint analysis','journey touchpoint analysis'],
      ['Assisted-conversion analysis','assisted conversion tracking','conversion-assist analysis','indirect conversion analysis','assisted revenue analysis'],
      ['Attribution-model comparison','compare attribution models','marketing attribution model analysis','first-touch vs last-touch attribution','multi-touch attribution comparison']
    ],
    'Segmentation analysis':[
      ['Demographic segmentation','customer demographic analysis','audience demographic segmentation','demographic customer groups','demographic market segmentation'],
      ['Behavioral segmentation','customer behavior segmentation','user behavior grouping','behavioral customer analysis','behavior-based segmentation'],
      ['Value-based segmentation','customer value segmentation','high-value customer analysis','revenue-based segmentation','profitability-based customer segmentation'],
      ['Lifecycle segmentation','customer lifecycle segmentation','lifecycle-stage analysis','customer-stage segmentation','user lifecycle grouping'],
      ['Segment performance comparison','customer segment comparison','compare audience segments','segment-level performance analysis','cross-segment analysis']
    ],
    'Retention and churn analysis':[
      ['Retention-rate analysis','customer retention analysis','user retention analysis','retention tracking','customer retention measurement'],
      ['Churn prediction','customer churn prediction','predictive churn analysis','churn-risk modeling','customer attrition prediction'],
      ['Churn-driver analysis','causes of customer churn','churn factor analysis','customer attrition drivers','reasons for customer churn'],
      ['Reactivation analysis','customer win-back analysis','dormant customer analysis','customer re-engagement analysis','churned-user reactivation'],
      ['Customer survival analysis','retention survival analysis','customer lifetime survival model','time-to-churn analysis','user survival modeling']
    ],
    'Customer lifetime-value analysis':[
      ['Historical CLV analysis','historical customer lifetime value','past customer value analysis','realized lifetime-value analysis','actual CLV calculation'],
      ['Predictive CLV analysis','customer lifetime-value prediction','predictive customer-value modeling','future CLV estimation','CLV forecasting'],
      ['Cohort-level CLV analysis','CLV by cohort','cohort lifetime-value analysis','customer cohort value','lifetime value across cohorts'],
      ['Segment-level CLV analysis','CLV by customer segment','customer segment lifetime value','lifetime value segmentation','segment value analysis'],
      ['Customer payback analysis','CAC payback analysis','customer acquisition payback period','CAC recovery analysis','customer payback-period calculation']
    ],
    'Product and SKU performance analysis':[
      ['Product sales analysis','sales performance by product','product revenue analysis','product-level sales reporting','product sales performance'],
      ['SKU margin analysis','profit margin by SKU','SKU profitability analysis','product margin analysis','SKU-level gross-margin analysis'],
      ['Inventory performance analysis','inventory turnover analysis','stock performance analysis','inventory efficiency analysis','inventory KPI analysis'],
      ['Product-affinity analysis','product association analysis','frequently bought together analysis','product relationship analysis','cross-sell affinity analysis'],
      ['Assortment performance analysis','product assortment analysis','assortment optimization analysis','product mix performance','category assortment analysis']
    ],
    'Marketing-performance analysis':[
      ['Campaign performance analysis','marketing campaign analysis','campaign effectiveness analysis','campaign results reporting','campaign ROI analysis'],
      ['Channel performance analysis','marketing channel analysis','channel effectiveness analysis','channel ROI analysis','marketing channel reporting'],
      ['Conversion-rate analysis','conversion tracking','conversion performance analysis','conversion-rate tracking','website conversion analysis'],
      ['Marketing attribution analysis','marketing attribution tracking','conversion attribution analysis','revenue attribution analysis','marketing contribution analysis'],
      ['Customer-acquisition cost analysis','CAC analysis','customer acquisition cost tracking','cost per acquisition analysis','acquisition-cost reporting']
    ],
    'Revenue and profitability analysis':[
      ['Revenue growth analysis','sales growth analysis','revenue trend analysis','year-over-year revenue analysis','revenue performance analysis'],
      ['Gross-margin analysis','gross profit analysis','margin performance analysis','gross-margin reporting','gross-profit-margin analysis'],
      ['Product and SKU profitability analysis','product profitability analysis','SKU profitability analysis','profit by product','product-level profit analysis'],
      ['Customer and segment profitability analysis','customer profitability analysis','segment profitability analysis','profit by customer segment','account profitability analysis'],
      ['Cost-to-serve analysis','customer service cost analysis','fulfillment cost analysis','service delivery cost analysis','cost-to-serve calculation']
    ],
    'Anomaly and trend analysis':[
      ['Trend detection','data trend analysis','emerging trend identification','pattern detection','business trend analysis'],
      ['Seasonality analysis','seasonal trend analysis','seasonal pattern detection','demand seasonality analysis','time-series seasonality analysis'],
      ['Anomaly detection','data anomaly analysis','outlier detection','unusual pattern detection','abnormal data detection'],
      ['Change-point detection','structural break analysis','data shift detection','trend change detection','time-series change-point analysis'],
      ['Trend forecasting','predictive trend analysis','time-series forecasting','future trend prediction','business trend forecasting']
    ],
    'Root-cause analysis':[
      ['Problem definition','business problem identification','issue definition','problem-framing analysis','analytical problem statement'],
      ['Cause mapping','causal mapping','cause-and-effect analysis','issue-cause mapping','causal relationship analysis'],
      ['Five Whys analysis','5 Whys analysis','five why root-cause analysis','5 Whys problem solving','why-why analysis'],
      ['Driver validation','root-cause validation','causal-driver analysis','key driver validation','contributing-factor validation'],
      ['Corrective-action impact analysis','remediation impact analysis','corrective-action effectiveness','intervention impact analysis','solution effectiveness analysis']
    ],
    'Comparative analysis':[
      ['Period-over-period analysis','time-period comparison','month-over-month analysis','quarter-over-quarter analysis','year-over-year comparison'],
      ['Segment comparison','customer segment comparison','compare audience segments','cross-segment analysis','segment performance analysis'],
      ['Product comparison','product performance comparison','compare product performance','SKU comparison analysis','cross-product analysis'],
      ['Channel comparison','marketing channel comparison','cross-channel performance analysis','compare acquisition channels','channel effectiveness comparison'],
      ['Benchmark analysis','performance benchmarking','competitive benchmark analysis','industry benchmark comparison','benchmark performance reporting']
    ]
  };
  const clean=value=>String(value||'').trim().replace(/\s+/g,' ');
  const normalize=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const unique=values=>[...new Map(values.map(clean).filter(Boolean).map(value=>[normalize(value),value])).values()];
  function contextualize(keyword,department){
    const value=clean(keyword),name=department.name.toLowerCase();
    const present=name==='Finance'?/\b(finance|financial)\b/i.test(value):new RegExp('\\b'+name+'\\b','i').test(value);
    return present?value:name+' '+value;
  }
  function processIntentGroups(process,department){
    const groups=intentTaxonomy[process.name]||[[process.name,process.search,process.search+' methods','how '+process.search+' works','AI '+process.search]];
    return groups.map(group=>{
      const keywords=unique(group.slice(0,5).map(keyword=>contextualize(keyword,department)));
      for(const keyword of group.slice(0,5))if(keywords.length<5)keywords.push(clean(keyword)+' for '+department.name.toLowerCase());
      return {name:group[0],keywords:unique(keywords).slice(0,5)};
    });
  }
  function toolIntentGroups(process,department){
    const groups=intentTaxonomy[process.name]||[[process.name,process.search]];
    return groups.map(group=>{
      const intent=contextualize(group[0],department),alias=contextualize(group[1]||group[0],department);
      return {name:group[0],keywords:unique([
        intent+' tools',alias+' software','best '+intent+' tools','AI '+intent+' platform',intent+' solution'
      ]).slice(0,5)};
    });
  }
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
    for(const group of processIntentGroups(process,department))for(const keyword of group.keywords)records.push({process:process.name,department:department.name,columnId:department.id,lens:'process',intentGroup:group.name,keyword});
    for(const group of toolIntentGroups(process,department))for(const keyword of group.keywords)records.push({process:process.name,department:department.name,columnId:department.id,lens:'tools',intentGroup:group.name,keyword});
  }
  const headerRecords=[];
  for(const process of processes){
    const byLens=headerLensKeywords(process);
    for(const lens of ['process','tools'])for(const keyword of byLens[lens])headerRecords.push({scope:'row',name:process.name,lens,keyword});
  }
  for(const department of departments){
    const byLens=headerLensKeywords(department);
    for(const lens of ['process','tools'])for(const keyword of byLens[lens])headerRecords.push({scope:'column',name:department.name,columnId:department.id,lens,keyword});
  }
  const keywordKey=(keyword,country)=>normalize(keyword)+'|'+String(country||COUNTRY).toLowerCase();
  function keywordRows(){
    return [...records,...headerRecords].map(record=>({keyword:record.keyword,volume:null,kd:null,cpc:null,traffic_potential:null,parent_topic:record.intentGroup||record.process||record.name,intent:'I, C',country:COUNTRY,data:record.intentGroup?{value_keyword_group:record.intentGroup,value_subprocess:record.process,value_department:record.department}:undefined}));
  }
  function matches(client,productId){return normalize(client)===normalize(CLIENT)&&String(productId||'')===PRODUCT_ID;}
  function apply(contentRoot,keywordRowsFromDb,options={}){
    const view=contentRoot?.views?.value;if(!view)return false;
    const rows=(view.rows||[]).filter(row=>row.pageGroup==='matrix');
    const columns=view.pageColumns?.matrix||view.columns||[];
    const rowByName=new Map(rows.map(row=>[normalize(row.name),row]));
    const columnByName=new Map(columns.map(column=>[normalize(column.name),column]));
    const byKeyword=new Map((keywordRowsFromDb||[]).map(row=>[keywordKey(row.keyword,row.country),row]));
    let changed=false;
    if(!options.processOnly||options.clearOtherLenses){
      for(const cell of rows.flatMap(row=>Object.values(row.cells||{}))){
        cell.valueLensKeywords ||= {};
        for(const lens of ['output','outcome','benefits'])if((cell.valueLensKeywords[lens]||[]).length){cell.valueLensKeywords[lens]=[];changed=true;}
      }
      for(const holder of [...rows,...columns]){
        const cell=holder.topicCell;if(!cell)continue;cell.valueLensKeywords ||= {};
        for(const lens of ['output','outcome','benefits'])if((cell.valueLensKeywords[lens]||[]).length){cell.valueLensKeywords[lens]=[];changed=true;}
      }
    }
    for(const record of records){
      if(options.processOnly&&record.lens!=='process')continue;
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
      for(const lens of (options.processOnly?['process']:['process','tools'])){
        const desired=headerRecords.filter(record=>record.scope===scope&&record.lens===lens&&(scope==='row'?normalize(record.name)===normalize(holder.name):record.columnId===holder.id)).map(record=>byKeyword.get(keywordKey(record.keyword,COUNTRY))?.id).filter(id=>id!=null).map(String);
        const current=(lens==='process'?(cell.kws||[]):((cell.valueLensKeywords||{})[lens]||[])).map(String);
        if(JSON.stringify(current)!==JSON.stringify(desired)){
          if(lens==='process')cell.kws=desired;else{cell.valueLensKeywords||={};cell.valueLensKeywords[lens]=desired;}changed=true;
        }
      }
    }
    return changed;
  }
  return {REVISION,CLIENT,PRODUCT_ID,COUNTRY,LENSES,departments,processes,intentTaxonomy,records,headerRecords,lensKeywords,processIntentGroups,toolIntentGroups,headerLensKeywords,keywordRows,matches,apply};
});
