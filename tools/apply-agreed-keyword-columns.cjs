const K=require('../keyword-columns.js'), C=require('./compact-keyword-columns.cjs'), crypto=require('node:crypto');
const id=(...p)=>'agreed-'+crypto.createHash('sha256').update(p.join('|')).digest('hex').slice(0,16);
const split=s=>s.split('|');
const schema={
icp:{listicle:split('Role / Team|Technology|Industry|Country|Use Case|Company Size'),informational:split('Role / Team|Technology|Industry|Country|Use Case|Company Size'),landing:split('Role / Team|Technology|Industry|Country|Use Case|Company Size')},
value:{listicle:split('Best for Achieving an Outcome|Best for Reducing a Problem'),informational:split('Why the Problem Happens|How to Achieve the Outcome|How to Measure the Outcome'),landing:split('Feature Pages|Integration Pages|Service Pages|Product Pages|Tools & Templates')},
category:{listicle:split('Category Names|Category Synonyms|Adjacent Categories'),informational:split('What the Category Is|How It Works|Minimum Capabilities|Category Boundaries|Internal Selection Factors|External Selection Factors|Category Evolution & Trends'),landing:split('Feature Pages|Integration Pages|Service Pages|Product Pages')}};
const guidance={
Industry:'Fit for a specific industry and its operating needs.',
Country:'Fit for jurisdiction, language, coverage or regulatory needs; a country suffix alone does not override primary intent.',
'Use Case':'Fit for a specific job, process or operating situation; distinguish the situation from its benefit.',
'Company Size':'Fit by employee count, workload or organizational scale; size is not maturity.',
'Role / Team':'Fit for a buyer role or team; generic job definitions are not ICP.',
Technology:'Fit with installed tools and environment; explaining a connector belongs in Integration Pages.',
'Doing It Yourself':'Nuances and trade-offs when this specific segment performs the work itself.',
'Segment-Specific Problems':'Problems particular to an industry, role, size or situation, not generic pains.',
'Segment-Specific Outcomes':'Positive results particular to a segment, not generic benefits.',
'Segment-Specific Requirements':'Segment-specific constraints, deployment, compliance, procurement or evaluation needs.',
'Best for Achieving an Outcome':'List-led choices, approaches or tools organized by the positive outcome achieved.',
'Best for Reducing a Problem':'List-led choices, approaches or tools organized by the pain, risk or disadvantage reduced.',
'Why the Problem Happens':'Causes and mechanisms behind a problem; not general dictionary definitions.',
'How to Achieve the Outcome':'Practical guidance and steps to achieve a result or address a problem.',
'How to Measure the Outcome':'Metrics, benchmarks, calculations and evaluation of whether results improved.',
'Feature Pages':'A focused capability landing page; Category explains the capability, Value explains its benefit. Choose one primary home.',
'Integration Pages':'A connection landing page; Category explains interoperability, Value explains the enabled outcome. How-to articles remain informational.',
'Service Pages':'A commercial service landing page; Category explains the service type, Value explains results.',
'Product Pages':'A product landing page; Category explains the offered solution, Value explains benefits. Not general education.',
'Tools & Templates':'A focused calculator, usable checklist, downloadable template or assessment; discussing templates is not a resource landing page.',
'Category Names':'Roundups under actual category or subcategory names.',
'Category Synonyms':'Roundups using genuinely equivalent labels for the same solution. Related categories are not automatically synonyms.',
'Adjacent Categories':'Neighboring, complementary or substitute categories. Unrelated research remains local.',
'What the Category Is':'Definition, purpose and scope of the solution category, not every industry term.',
'How It Works':'Mechanisms, workflows, architecture, implementation and operation.',
'Minimum Capabilities':'Baseline capabilities expected from the category, not every advanced feature.',
'Category Boundaries':'What the category does not cover, its limits and differences from adjacent categories.',
'Internal Selection Factors':'Buyer-controlled budget, team, workload, data, stack and readiness.',
'External Selection Factors':'Regulation, geography, standards, ecosystem and environmental constraints.',
'Category Evolution & Trends':'Changes in category technology, process, inputs, people and market direction.'
};
function configure(cfg){
K.ensurePageViews(cfg);
for(const [v,gs]of Object.entries(schema))for(const [g,names]of Object.entries(gs))cfg.pageViews[v][g]=names.map(name=>({id:id(v,g,name),name,...(v==='icp'?{axis:K.inferIcpAxis(name)}:{}),instruction:guidance[name]+' Format: '+g+'. Reuse this column; preserve existing article decisions.',defaults:{mode:'seo',articleType:g==='landing'?'Landing page':g==='listicle'?'Listicle':'Informational',aw:''}}));
const marker='\n\nAPPROVED UNIVERSAL COLUMN MAP\n';
cfg.routingInstruction=(cfg.routingInstruction||K.strategyPrompt).split(marker)[0]+marker+Object.entries(schema).flatMap(([v,gs])=>Object.entries(gs).map(([g,ns])=>v+' / '+g+': '+ns.join('; '))).join('\n')+'\nUse these exact headings. Keep specialized educational topics local if none fits. Do not invent synonym intent or force entries into empty columns. Preserve content and decisions; compact independent columns after moves.';
return cfg;
}
function route(view,group,column,cell){
const s=String(cell.url||cell.v||'').replace(/[-_/]+/g,' ').toLowerCase(), out=(name,g=group,local=false)=>({view,group:g,name,local});
if(view==='icp'){
 if(/\b(tally|sap|salesforce|hubspot|snowflake|bigquery|existing stack|tech stack)\b/.test(s))return out('Technology');
 if(/\b(smb|small business|mid market|enterprise|company size|employee count|headcount)\b/.test(s))return out('Company Size');
 const c=column.toLowerCase();
 return out(c.includes('industry')?'Industry':c.includes('size')?'Company Size':c.includes('role')?'Role / Team':c.includes('use')?'Use Case':'Country');
}
if(view==='value'){
 if(group==='landing')return out({'Feature pages':'Feature Pages','Integration pages':'Integration Pages','Service pages':'Service Pages','Product pages':'Product Pages','Resources & tools':'Tools & Templates'}[column]||column);
 if(group==='listicle')return out(/\b(reduc\w*|avoid|pain|mistakes?|challenges?|problems?|burnout|bias|anxiety|theft|costs?|fraud)\b/.test(s)?'Best for Reducing a Problem':'Best for Achieving an Outcome');
 if(column==='Indian payroll & compliance'||column==='HR Glossary'||column==='HR Education & Trends')return out(column,group,true);
 if(column==='Glossary & concepts')return out('HR Glossary',group,true);
 if(['Trends & insights','Practical education'].includes(column)&&!/\b(how|why|achiev\w*|improv\w*|benefits?|cause\w*|problems?|metrics?|measur\w*|roi)\b/.test(s))return out('HR Education & Trends',group,true);
 if(/\b(measur\w*|metrics?|kpis?|calculate|calculating|calculation|roi|benchmark\w*|indicators?)\b/.test(s))return out('How to Measure the Outcome');
 if(column==='Problems & solutions'&&!/\b(how to|ways to|strategies|tips|fix|prevent|avoid)\b/.test(s)||/\b(why|causes?|reasons?)\b/.test(s))return out('Why the Problem Happens');
 return out('How to Achieve the Outcome');
}
if(group==='landing')return out(/\bintegrat/.test(s)?'Integration Pages':/\bservices?\b/.test(s)?'Service Pages':'Product Pages');
if(group==='listicle'){
 if(column==='Features & capabilities')return out('Minimum Capabilities','informational');
 if(column==='Adjacent-market research')return out(column,group,true);
 return out(/\b(crm|recruitment service|outsourcing companies|employee communications)\b/.test(s)?'Adjacent Categories':'Category Names');
}
if(/\b(vs|versus|boundaries|limitations|pros and cons|misconceptions)\b/.test(s))return out('Category Boundaries');
if(column==='Trends & comparisons'||column==='Category Evolution & Trends'||/\b(trends?|evolving|future)\b/.test(s))return out('Category Evolution & Trends');
if(column==='Implementation & integrations'||column==='How It Works'||/\b(how does|operate|how it works)\b/.test(s))return out('How It Works');
if(/\b(features?|capabilities|must haves|things.*should have)\b/.test(s))return out('Minimum Capabilities');
if(['Evaluation & buying','Internal Selection Factors','External Selection Factors'].includes(column))return out(/\b(regulat\w*|compliance|laws?|external|market conditions)\b/.test(s)?'External Selection Factors':'Internal Selection Factors');
return out('What the Category Is');
}
function migrate(root,cfg){
const plan=[];
for(const view of ['category','icp','value']){
 const v=root.views?.[view];if(!v)continue;
 for(const row of v.rows||[])for(const [key,cell]of Object.entries(row.cells||{})){
  if(!C.populated(cell))continue;
  const group=row.pageGroup||'listicle',column=(v.pageColumns?.[group]||v.columns||[]).find(c=>c.id===key)?.name||'';
  plan.push({view,row,key,cell,group,to:route(view,group,column,cell)});
 }
}
K.sync(root,cfg);
// Relocate source bindings in memory; never clear or reimport a backend board.
for(const e of plan)delete e.row.cells[e.key];
const counts={};
for(const e of plan){
 const v=root.views[e.to.view],page=K.pageView(v,e.to.group);
 let col=page.columns.find(c=>c.name===e.to.name&&(e.to.local||c.universalId));
 if(!col){col={id:id('local',e.view,e.to.group,e.to.name),name:e.to.name,local:true,instruction:'Client-specific '+e.to.name+'. Preserve these specialized entries rather than forcing an unrelated universal classification.',defaults:{}};page.columns.push(col);}
 let row=v.rows.find(r=>r.pageGroup===e.to.group&&!r.cells[col.id]);
 if(!row){row={id:id(e.row.id,e.key,e.to.group,e.to.name),pageGroup:e.to.group,cells:{}};v.rows.push(row);}
 row.cells[col.id]=e.cell;
 if(e.to.group!==e.group){const name=e.to.group==='landing'?'Landing page':e.to.group==='listicle'?'Listicle':'Informational';e.cell.type=root.articleTypes.find(t=>t.name===name).id;}
 const label=e.to.view+'/'+e.to.group+'/'+e.to.name;counts[label]=(counts[label]||0)+1;
}
for(const view of ['category','icp','value']){
 const v=root.views[view];if(!v)continue;
 for(const group of ['listicle','informational','landing']){
  const page=K.pageView(v,group),order=new Map(cfg.pageViews[view][group].map((d,i)=>[d.id,i]));
  page.columns=page.columns.filter(c=>order.has(c.universalId)||v.rows.some(r=>r.pageGroup===group&&r.cells?.[c.id]));
  page.columns.sort((a,b)=>(order.get(a.universalId)??999)-(order.get(b.universalId)??999));
  page.columnOrder=page.columns.map(c=>c.id);
 }
 C.compact(v);
}
return {moved:plan.length,counts};
}
module.exports={schema,guidance,configure,route,migrate};
