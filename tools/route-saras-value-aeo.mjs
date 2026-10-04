import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const auditTarget=path.join(root,'tools','saras-keyword-taxonomy-audit.json');
const source=JSON.parse(fs.readFileSync(target,'utf8'));

const routes={
  '/saras-daton/pricing':['Revenue and profitability analysis','Sales'],
  '/lp/what-is-saras-iq':['Analysis','Features'],
  '/lp/saras-iq-demo':['Product and SKU performance analysis','Features'],
  '/lp/ltv-audit':['Customer lifetime-value analysis','Marketing'],
  '/saras-iq/pricing':['Revenue and profitability analysis','Features'],
  '/lp/saras-iq-essentials':['Analysis','Capabilities'],
  '/lp/q4-plan':['Comparative analysis','Finance'],
  '/lp/saras-iq-24-questions':['Diagnostic analysis','Finance'],
  '/saras-iq/customer-analytics':['Cohort analysis','Marketing'],
  '/saras-iq/contribution-margin':['Revenue and profitability analysis','Finance'],
  '/saras-iq/sales-and-marketing-analytics':['Marketing-performance analysis','Marketing'],
  '/saras-iq/inventory-product-planning':['Product and SKU performance analysis','Product'],
  '/saras-iq':['Descriptive analysis','Capabilities'],
  '/ai-ready-data-foundation':['Analysis','Product']
};

for(const [pathname,[hierarchy,axis]] of Object.entries(routes)){
  const url='https://www.sarasanalytics.com'+pathname;
  const meta=source.classifications[url];
  if(!meta)throw new Error('Missing Saras Analytics classification: '+url);
  Object.assign(meta,{workspace:'ai-data-platform',awareness:'solution-aware',section:'Value AEO',pageType:'Landing page',hierarchy,axis,topicGroup:url,groupSize:1,covered:false});
  delete meta.icpSegment;
}

const counters=new Map();
for(const meta of Object.values(source.classifications))if(meta.workspace==='ai-data-platform'){
  const key=[meta.awareness,meta.section,meta.pageType,meta.hierarchy,meta.axis].join('|');
  meta.groupOrder=counters.get(key)||0;
  counters.set(key,meta.groupOrder+1);
}
source.version=Math.max(Number(source.version)||1,8);
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');

if(fs.existsSync(auditTarget)){
  const audit=JSON.parse(fs.readFileSync(auditTarget,'utf8'));
  const ai=Object.entries(source.classifications).filter(([,meta])=>meta.workspace==='ai-data-platform');
  audit.revision='saras-keyword-taxonomy-v2';
  audit.counts=Object.fromEntries(Object.entries(Object.groupBy(ai,([,meta])=>meta.section)).map(([key,items])=>[key,items.length]));
  audit.rules.valueAeo='Read every commercial page. Route standalone product capabilities and features into the first two-column Value AEO section. Route department-specific use cases and outcomes into the process-by-department matrix beneath it; keep category definitions and integrations in Category AEO.';
  fs.writeFileSync(auditTarget,JSON.stringify(audit,null,2)+'\n');
}

console.log(`Routed ${Object.keys(routes).length} Saras Analytics pages to Value AEO.`);
