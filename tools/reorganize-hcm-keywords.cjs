/* Auditable classification and in-place moves for the reviewed HCM keyword collection. */
const K=require('../keyword-columns.js');
const crypto=require('node:crypto');
const id=(...parts)=>'route-'+crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0,16);
const structure={
 category:{
  listicle:['Solution roundups','Features & capabilities'],
  informational:['Category fundamentals','Evaluation & buying','Implementation & integrations','Trends & comparisons'],
  landing:['Product & category pages','Service pages']
 },
 icp:{
  listicle:['By industry','By company size','By role or team','By use case'],
  informational:['By industry','By company size','By role or team','By use case'],
  landing:['Industry pages','Company-size pages','Role & team pages','Use-case pages']
 },
 value:{
  listicle:['Practical tips & strategies','Templates & examples','Benefits & outcomes'],
  informational:['Problems & solutions','How-to guides','Glossary & concepts','Benefits & outcomes','Trends & insights','Practical education'],
  landing:['Feature pages','Integration pages','Service pages','Resources & tools']
 }
};
const routing='Classify by primary intent, then page format. ICP demonstrates fit for an industry, company size, role/team or specific use case. Category explains the solution category, available players, capabilities, evaluation and buying. Value delivers practical education or explains problems, solutions and outcomes. Landing pages include feature, integration, service and use-case pages; a how-to article is not a landing page merely because it mentions a feature. Keep reusable columns universal; country-, industry- or client-specific topics local. Put slugs in Slug (url); reserve Title (v) for a readable article title. Preserve cell IDs, keyword IDs, metrics, status and decisions when moving; never delete/reimport the collection. ';
function configure(config){
 K.ensurePageViews(config);
 for(const [view,groups]of Object.entries(structure))for(const [group,cols]of Object.entries(groups)){
  config.pageViews[view][group]=cols.map(name=>({
   id:id('universal',view,group,name),name,
   instruction:({category:'Educate buyers about the solution category and how to evaluate it.',icp:'Demonstrate suitability for the specified buyer segment.',value:'Provide useful education or explain a problem, solution or outcome.'}[view])+' Use this column for '+name.toLowerCase()+'.',
   defaults:{mode:'seo',articleType:group==='landing'?'Landing page':group==='listicle'?'Listicle':'Informational',aw:''}
  }));
 }
 // Retain the legacy schemas for compatibility; page-specific templates own the nine grids.
 config.routingInstruction=routing+K.comparisonRouting;
 return config;
}
function classify(slug,original='value'){
 const s=slug.toLowerCase().replace(/https?:\/\/[^/]+\//,'').replace(/[^a-z0-9]+/g,' ').trim();
 const overrides={
  'employee self service portal hr software india':['value','landing','Feature pages'],
  'error free payroll software for organizations':['value','landing','Feature pages'],
  'employee onboarding automation india':['value','landing','Feature pages'],
  'hrms for 360 degree feedback':['icp','landing','Use-case pages'],
  '9 box model':['value','informational','Glossary & concepts'],
  'top enterprise ai development company':['category','listicle','Adjacent-market research',true],
  'top attendance management system in india':['category','listicle','Solution roundups'],
  'performance management software vs traditional methods':['category','informational','Trends & comparisons'],
  'top hr challenges how hr software solves':['value','listicle','Practical tips & strategies'],
  'top trends employee engagement software':['category','informational','Trends & comparisons'],
  'top performance management software trends':['category','informational','Trends & comparisons'],
  '4 questions to contemplate before investing in an hr software':['category','informational','Evaluation & buying'],
  '7 things a payroll software should have':['category','listicle','Features & capabilities'],
  'tips to pick the best expense management software for your company':['category','informational','Evaluation & buying'],
  'attendance management definitive guide':['category','informational','Category fundamentals'],
  'geofencing attendance system meaning importance':['category','informational','Category fundamentals'],
  'cloud based hr software pros and cons':['category','informational','Evaluation & buying'],
  'how does a payroll software operate':['category','informational','Category fundamentals'],
  'training management system lms know best fit':['category','informational','Evaluation & buying'],
  'get data ready for hrms implementation':['category','informational','Implementation & integrations'],
  'hrms implementation timeline india':['category','informational','Implementation & integrations'],
  'steps for implementing performance management system':['category','informational','Implementation & integrations'],
  'ai driven payroll automation for hrms success':['value','informational','Benefits & outcomes'],
  'features after sales service for hr software providers':['category','informational','Evaluation & buying'],
  'gamification the best hr tech trend of the decade':['value','informational','Trends & insights'],
  'our best reads blogs':['value','informational','Trends & insights'],
  'shrm tech 2019 best things happen unexpectedly':['value','informational','Trends & insights'],
  'posh compliance remote hybrid workplaces challenges solutions':['value','informational','Indian payroll & compliance',true],
  'upskilling hr teams for ai and automation a roadmap':['icp','informational','By role or team'],
  'sme go for automated payroll software':['icp','informational','By company size'],
  'remote work accessibility solutions':['value','informational','Problems & solutions'],
  'career pathing tools for modern employees':['value','informational','Benefits & outcomes'],
  'increase efficiency via attendance system integration':['value','informational','Benefits & outcomes'],
  'benefits integrating payroll financial tools':['value','informational','Benefits & outcomes']
 };
 if(overrides[s]){const [view,group,column,local]=overrides[s];return {view,group,column,local};}
 const software=/\b(software|hrms|hris|hcm|systems?|platforms?|tools?|automation|automated|solutions?|apps?)\b/.test(s);
 const vendor=s.match(/\b(hrone|darwinbox|greythr|keka|peoplestrong|factohr)\b/);
 if(vendor)return {view:'competitor',group:'matrix',column:/\balternatives?\b/.test(s)?'Alternatives':/\breview\b/.test(s)?'Reviews':/\bswitching|outgrowing\b/.test(s)?'Switching':'Product & company',vendor:vendor[1]};
 const industry=/\b(manufacturing|retail|d2c|bfsi|financial services?|financial service|healthcare|logistics|ites|it ites|non profits|gig economy platforms)\b/.test(s);
 const size=/\b(startups?|start ups|smes?|small scale|small business|enterprise hrms|mid market|1000 employees|100 to 1000)\b/.test(s);
 const usecase=/\b(remote|hybrid|field employees|on field|field sales|blue collar|multi entity|multi state|multi location|high volume hiring|distributed)\b/.test(s);
 const role=/\b(chros?|hr leaders?|hr managers?|people manager|talent managers?|hr professionals|hr teams?|recruiters)\b/.test(s);
 const list=/^(?:\d+\s+(?!degree|day|year|box|point model))/.test(s)||/\b(top|best)\b/.test(s)&&!/\b(best practices|best choice|best fit|best employees?|best employee will|best software award)\b/.test(s)&&!/\b(how to|choos|buy|evaluate)\w*/.test(s)
   ||/\b(ways|tips|ideas|methods|techniques|examples|templates|strategies)\b/.test(s)&&!/\b(guide|meaning|importance|definition|process strategies)\b/.test(s);
 const buying=/\b(buy|buying|buyers?|choos\w*|choic\w*|select\w*|evaluat\w*|before purchas\w*|before investing|before scal\w*|pricing|cost risk comparison)\b/.test(s);
 const educational=/\b(how|why|benefits?|advantages?|importance|guide|meaning|definition|tips|strategies|improv\w*|challenges?|problems?|trends?|future|reduces?|saves?|boost\w*|explained|practices|checklist|vs|revolution\w*)\b/.test(s);
 const landing=(!educational&&!buying&&!/\b(features?|steps|implement\w*|roadmap|ready|success|what|upskilling|career pathing)\b/.test(s)&&!list&&software&&(/\bindia\b/.test(s)||/\bfor\b/.test(s)||s==='hris software'))
  ||s==='ctc calculator';
 let audience=null;
 if(industry&&(software||/\bhr challenges|hr transformation|workforce challenges\b/.test(s)))audience='industry';
 else if(size&&(software||/\bpayroll|hr processes|hr chaos\b/.test(s)))audience='size';
 else if(usecase&&(software||/\bpayroll|expense management|workforce attendance|attendance system\b/.test(s)))audience='usecase';
 else if(role&&(software||/\bfirst time|90 day plan|selection checklist|metrics every|terms every|roadmap|guide talent|leadership challenges\b/.test(s)))audience='role';
 if(audience){
  const group=landing?'landing':list?'listicle':'informational';
  const column=({industry:group==='landing'?'Industry pages':'By industry',size:group==='landing'?'Company-size pages':'By company size',role:group==='landing'?'Role & team pages':'By role or team',usecase:group==='landing'?'Use-case pages':'By use case'})[audience];
  return {view:'icp',group,column};
 }
 if(s==='ctc calculator')return {view:'value',group:'landing',column:'Resources & tools'};
 if(landing)return {view:/\bintegrations?\b/.test(s)?'value':'category',group:'landing',column:/\bintegrations?\b/.test(s)?'Integration pages':'Product & category pages'};
 const categoryTerms=new Set(['erp','hcm','hrms','hris software','software as a service','lms learning management system','applicant tracking system','outsourcing payroll','human resource outsourcing','recruitment process outsourcing','virtual hr','payroll','workforce management','leave management','expense management','performance management']);
 const capability=software&&/\b(features?|capabilities|reporting analytics|things a payroll software)\b/.test(s);
 const categoryComparison=/\bvs\b/.test(s)&&software;
 const category=categoryTerms.has(s)||(software&&(buying||capability||categoryComparison||/\bimplementation|integrat\w*|software trends|software products globally|digital must haves\b/.test(s)))
  ||(/^(best|top)\b/.test(s)&&/\bsoftware|tools|platforms|service|outsourcing companies|management system\b/.test(s));
 if(category){
  if(list)return {view:'category',group:'listicle',column:capability?'Features & capabilities':'Solution roundups'};
  return {view:'category',group:'informational',column:buying?'Evaluation & buying':/\bintegrat\w*|implementation\b/.test(s)?'Implementation & integrations':categoryComparison||/\btrends|future\b/.test(s)?'Trends & comparisons':'Category fundamentals'};
 }
 const group=list?'listicle':'informational';
 if(group==='listicle')return {view:'value',group,column:/\btemplates?|examples?|letters?|forms?|quotes\b/.test(s)?'Templates & examples':/\bbenefits?|advantages?|outcomes\b/.test(s)?'Benefits & outcomes':'Practical tips & strategies'};
 if(/\b(provident fund|pf|epf|epfo|esi|tds|tcs|uan|itr|ecr|gratuity|professional tax|income tax|labour codes|labor laws|labour laws|minimum wages act|payment of gratuity act|posh|gst|lwf|tax submission|form (12ba|12bb|15g|15h|24g|24q|26as|26qb|27|27c|49b|64a|16|16a|16b)|union budget)\b/.test(s))return {view:'value',group,column:'Indian payroll & compliance',local:true};
 return {view:'value',group,column:/\b(how|steps|procedure|calculate|calculating|calculation|guide|setting up|set up|formulat\w*|practices|strategies|templates?|format|policy|checklist)\b/.test(s)?'How-to guides':
 /\b(challenges?|problems?|mistakes?|errors?|fraud|anxiety|burnout|avoid|fails?|fatigue|bias|obstacles|delays|risks?|pain|harassment|theft|toxic|unhappy|hurts)\b/.test(s)?'Problems & solutions':
 /\b(benefits?|advantages?|boost\w*|improv\w*|enhanc\w*|reduces?|reducing|saves?|efficien\w*|productiv\w*|empower\w*|simplif\w*|streamlin\w*|value|roi)\b/.test(s)?'Benefits & outcomes':
 /\b(trends?|future|ai|technology|technologies|blockchain|digital|covid|pandemic|2021|2022|2023|2024|2025|2026|2030|news|webinar|highlights|evolution|revolution|generative)\b/.test(s)?'Trends & insights':s.split(' ').length>4?'Practical education':'Glossary & concepts'};
}
function entries(root){
 return ['category','icp','value'].flatMap(view=>(root.views[view]?.rows||[]).flatMap(row=>Object.entries(row.cells||{}).filter(([,c])=>typeof c==='string'?c.trim():c&&(c.v||c.url||c.kws?.length)).map(([column,cell])=>({view,row,column,cell,slug:typeof cell==='string'?cell:cell.url||cell.v}))));
}
function migrate(root,config){
 const list=entries(root),plan=list.map(e=>({...e,to:classify(e.slug,e.view)}));
 K.sync(root,config);
 const stats={total:list.length,moved:0,byTable:{},byColumn:{}},audit=[];
 for(const e of plan){
  const {to,cell}=e;const source=root.views[e.view];let target=root.views[to.view];
  const before={view:e.view,row:e.row.id,column:e.column,group:e.row.pageGroup};
  if(to.view==='competitor'){
   target.types ||= [];
   let col=target.types.find(c=>c.name.toLowerCase()===to.column.toLowerCase());
   if(!col){col={id:id('local','competitor',to.column),name:to.column,local:true,instruction:'Named competitor product capabilities, company proof and news; not generic category education.',defaults:{}};target.types.push(col);}
   let row=target.rows.find(r=>r.name?.toLowerCase()===to.vendor);
   if(!row){row={id:id('competitor',to.vendor),name:to.vendor};target.rows.push(row);}
   const primaryKey=row.id+'|'+col.id;
   if(target.cells[primaryKey] && (target.cells[primaryKey].url||target.cells[primaryKey].v)){
    row={id:e.row.id,name:'Others',role:'others',competitor:to.vendor};
    target.rows.push(row);
   }
   const key=row.id+'|'+col.id;
   if(target.cells[key])throw Error('Occupied competitor destination '+key);
   delete e.row.cells[e.column];target.cells[key]=cell;
   if(!Object.keys(e.row.cells).length)source.rows.splice(source.rows.indexOf(e.row),1);
   audit.push({...before,to:{view:to.view,row:row.id,column:col.id},slug:e.slug});
  }else{
   const page=K.pageView(target,to.group);
   let col=page.columns.find(c=>c.name===to.column);
   if(!col){col={id:id('local',to.view,to.group,to.column),name:to.column,local:true,instruction:to.column==='Adjacent-market research'?'Adjacent-market topics retained for review; not part of the core HCM offering.': 'India-specific payroll, statutory deductions, tax and labour-compliance education. Keep local to this market.',defaults:{}};page.columns.push(col);}
   let row=e.row;
   if(to.view!==e.view){
    if(Object.keys(row.cells).length===1){
     source.rows.splice(source.rows.indexOf(row),1);target.rows.push(row);
    }else {row={id:id(e.row.id,e.column,to.view),cells:{}};target.rows.push(row);}
   }else if(Object.keys(row.cells).length>1 && row.pageGroup && row.pageGroup!==to.group){
    row={id:id(e.row.id,e.column,to.group),cells:{}};target.rows.push(row);
   }
   if(row.cells[col.id]&&!(row===e.row&&col.id===e.column))throw Error('Occupied grid destination');
   delete e.row.cells[e.column];row.cells[col.id]=cell;row.pageGroup=to.group;
   const typeName=to.group==='landing'?'Landing page':to.group==='listicle'?'Listicle':'Informational';
   let type=root.articleTypes.find(t=>t.name===typeName);
   if(!type){type={id:id('type',typeName),name:typeName};root.articleTypes.push(type);}
   if(typeof cell==='object')cell.type=type.id;
   audit.push({...before,to:{view:to.view,row:row.id,column:col.id,group:to.group},slug:e.slug});
  }
  stats.moved++;
  const table=to.view+'/'+to.group;
  stats.byTable[table]=(stats.byTable[table]||0)+1;
  stats.byColumn[table+'/'+to.column]=(stats.byColumn[table+'/'+to.column]||0)+1;
 }
 // Retire only empty old headers in this reviewed product; never discard populated cells.
 for(const view of ['category','icp','value']){
  const v=root.views[view];
  for(const group of ['listicle','informational','landing']){
   const page=K.pageView(v,group),desired=new Set(config.pageViews[view][group].map(d=>d.id));
   page.columns=page.columns.filter(c=>desired.has(c.universalId)||v.rows.some(r=>r.pageGroup===group && r.cells?.[c.id]));
  }
 }
 return {stats,audit};
}
module.exports={configure,classify,migrate,entries,structure,routing};
