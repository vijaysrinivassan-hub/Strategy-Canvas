import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const auditPath=path.join(os.tmpdir(),'saras-page-audit.json');
if(!fs.existsSync(auditPath))throw new Error('Run tools/audit-saras-pages.mjs first.');
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const profile=(source.profiles||[]).find(item=>item.id==='saras-analytics');
if(!profile)throw new Error('Saras Analytics profile is missing.');
const pages=new Map((audit.results||[]).map(page=>[page.url.replace(/\/$/,''),page]));
if(profile.urls.length!==770||pages.size!==770)throw new Error(`Expected the complete 770-URL audit; profile=${profile.urls.length}, audit=${pages.size}.`);

const clean=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const seoTopicAxis=(pathname,page)=>{
  const text=clean([pathname,page?.title,page?.h1,page?.description].join(' '));
  if(/(?:^|\s)(?:vs|versus)(?:\s|$)|comparison|compare/.test(text))return 'Topic vs Topic';
  if(/trend|future|statistics|benchmark/.test(text))return 'Trends';
  if(/^\/how-to\//i.test(pathname)||/how to|made easy|step by step/.test(text))return 'How To Articles';
  if(/guide|checklist|playbook/.test(text))return 'Guides';
  return 'Explainers';
};
const utility=/^\/(?:lp\/thank-you|thank-you|404|search|wp-json)(?:\/|$)/i;
const comparison=pathname=>/^\/vs\//i.test(pathname)||/(?:^|\/)saras-(?:iq|pulse)-vs-[^/]+$/i.test(pathname);
const competitorPricing={
  '/blog/triple-whale-pricing':'Triple Whale / Moby AI',
  '/blog/northbeam-pricing':'Northbeam',
  '/blog/airbyte-pricing':'Airbyte'
};
const icpRoutes={
  '/solutions/amazon-brands':['Landing page','Industry','E-commerce'],
  '/solutions/amazon-agencies':['Landing page','Role / Team','Agencies'],
  '/lp/ai-ecommerce-brands':['Landing page','Industry','E-commerce'],
  '/lp/saras-iq-ai-analyst':['Landing page','Role / Team','Data & Analytics'],
  '/blog/5-snowflake-etl-tools':['Listicle','Technology','Snowflake'],
  '/blog/ai-tools-for-ecommerce':['Listicle','Industry','E-commerce'],
  '/blog/best-etl-tools-for-shopify':['Listicle','Technology','Shopify'],
  '/blog/ecommerce-data-platform-for-enterprise':['Landing page','Company size','Enterprise'],
  '/blog/enterprise-shopify-analytics-platform':['Landing page','Company size','Enterprise'],
  '/blog/netsuite-mcp-ai-connector-service':['Landing page','Technology','NetSuite'],
  '/blog/shopify-marketing-tools':['Listicle','Technology','Shopify'],
  '/blog/top-5-free-etl-tools-for-mysql':['Listicle','Technology','MySQL']
};
const categoryRoutes={
  '/blog/10-benefits-of-using-etl-tools':['Category SEO','Informational','Data Integration & ETL','Features & buying criteria'],
  '/blog/10-best-etl-tools-for-data-warehousing':['Category AEO','Listicle','Data Integration & ETL','Category name'],
  '/blog/best-etl-tools':['Category AEO','Listicle','Data Integration & ETL','Category name'],
  '/blog/customer-behavior-analysis-tools':['Category AEO','Listicle','Customer Analytics Software','Category synonyms'],
};
const ownValueListicle={
  '/blog/cohort-analysis-software':['Cohort analysis','Product'],
  '/blog/customer-segmentation-software':['Segmentation analysis','Marketing']
};
const valueSeoRoutes={
  '/glossary/pricing-strategy':['problem-unaware','General Value','Explainers'],
  '/blog/how-returns-distort-contribution-margin-pricing':['problem-aware','Revenue & Profitability','Explainers']
};
const ownValueLanding={
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
const competitorFromPath=pathname=>{
  const leaf=pathname.split('/').filter(Boolean).pop()||'';
  return leaf.replace(/^saras-(?:iq|pulse)-vs-/i,'').replace(/-(?:pricing|reviews?|alternatives?)$/i,'').split('-').map(word=>word[0]?.toUpperCase()+word.slice(1)).join(' ')
    .replace(/^Triple Whale(?: Moby Ai)?$/,'Triple Whale / Moby AI').replace(/^Polar Analytics$/,'Polar Analytics');
};
const apply=(meta,patch)=>Object.assign(meta,patch,{workspace:'ai-data-platform',topicGroup:meta.topicGroup||'',groupSize:1,covered:false});
const moves=[];
for(const raw of profile.urls){
  const url=raw.replace(/\/$/,'');
  const page=pages.get(url),meta=source.classifications[url];
  if(!meta)throw new Error('Missing classification for '+url);
  const pathname=new URL(url).pathname.replace(/\/$/,'')||'/';
  const before=[meta.section,meta.pageType,meta.hierarchy,meta.axis,meta.icpSegment||''].join('|');
  if(page?.status){
    meta.auditStatus='read';meta.auditTitle=page.title;meta.auditH1=page.h1;meta.auditDescription=page.description;meta.auditedAt=audit.auditedAt;
    meta.topic=page.h1||page.title||meta.topic;
  }
  if(!page?.status||utility.test(pathname)){
    apply(meta,{awareness:'non-seo',section:'Corporate & Non-SEO',pageType:'Corporate',hierarchy:page?.status?'Utility / conversion':'Broken / 404',axis:page?.status?'Thank-you / utility':'404'});
    delete meta.icpSegment;
  }else if(comparison(pathname)){
    const competitor=competitorFromPath(pathname);
    apply(meta,{awareness:'competitor-aware',section:'Competitor AEO',pageType:'Comparison',hierarchy:competitor,axis:'Competitor vs Competitor'});
    delete meta.icpSegment;
  }else if(competitorPricing[pathname]){
    apply(meta,{awareness:'competitor-aware',section:'Competitor AEO',pageType:'Pricing',hierarchy:competitorPricing[pathname],axis:'Pricing'});
    delete meta.icpSegment;
  }else if(icpRoutes[pathname]){
    const [pageType,hierarchy,icpSegment]=icpRoutes[pathname];
    apply(meta,{awareness:'solution-aware',section:'ICP AEO',pageType,hierarchy,axis:icpSegment,icpSegment});
  }else if(ownValueListicle[pathname]){
    const [hierarchy,axis]=ownValueListicle[pathname];
    apply(meta,{awareness:'solution-aware',section:'Value AEO',pageType:'Listicle',hierarchy,axis});delete meta.icpSegment;
  }else if(categoryRoutes[pathname]){
    const [section,pageType,hierarchy,axis]=categoryRoutes[pathname];
    apply(meta,{awareness:'category-aware',section,pageType,hierarchy,axis});delete meta.icpSegment;
  }else if(valueSeoRoutes[pathname]){
    const [awareness,hierarchy,axis]=valueSeoRoutes[pathname];
    apply(meta,{awareness,section:'Value SEO',pageType:'Informational',hierarchy,axis});delete meta.icpSegment;
  }else if(ownValueLanding[pathname]){
    const [hierarchy,axis]=ownValueLanding[pathname];
    apply(meta,{awareness:'solution-aware',section:'Value AEO',pageType:'Landing page',hierarchy,axis});delete meta.icpSegment;
  }
  if(meta.section==='ICP SEO')meta.axis=seoTopicAxis(pathname,page);
  // AEO is commercial/list-led only. Any residual informational AEO record is
  // moved to the matching SEO section instead of being silently displayed.
  if(/^(?:ICP|Value) AEO$/.test(meta.section)&&meta.pageType==='Informational'){
    meta.section=meta.section.replace(' AEO',' SEO');meta.awareness='problem-aware';delete meta.icpSegment;
  }
  const after=[meta.section,meta.pageType,meta.hierarchy,meta.axis,meta.icpSegment||''].join('|');
  if(before!==after)moves.push({url,before,after});
}

const counters=new Map();
for(const meta of Object.values(source.classifications))if(meta.workspace==='ai-data-platform'){
  const key=[meta.awareness,meta.section,meta.pageType,meta.hierarchy,meta.axis].join('|');
  meta.groupOrder=counters.get(key)||0;counters.set(key,meta.groupOrder+1);
}
const ai=Object.entries(source.classifications).filter(([,meta])=>meta.workspace==='ai-data-platform');
const badAeo=ai.filter(([,meta])=>/^(?:ICP|Value) AEO$/.test(meta.section)&&!['Listicle','Landing page'].includes(meta.pageType));
const thankKeywords=ai.filter(([url,meta])=>/thank-you/i.test(url)&&meta.section!=='Corporate & Non-SEO');
const badIcp=ai.filter(([,meta])=>meta.section==='ICP AEO'&&(!meta.icpSegment||!['Industry','Company size','Role / Team','Technology'].includes(meta.hierarchy)));
if(badAeo.length||thankKeywords.length||badIcp.length)throw new Error(JSON.stringify({badAeo,thankKeywords,badIcp},null,2));
source.version=Math.max(Number(source.version)||1,7);
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');
const counts=Object.fromEntries(Object.entries(Object.groupBy(ai,([,meta])=>meta.section)).map(([key,items])=>[key,items.length]));
const manifest={revision:'saras-keyword-taxonomy-v1',auditedAt:audit.auditedAt,reviewed:profile.urls.length,read:[...pages.values()].filter(page=>page.status).length,moves,counts,rules:{comparison:'Direct vendor-vendor URLs live only in Competitor vs Competitor.',utility:'Thank-you and utility pages are Corporate & Non-SEO.',aeo:'ICP AEO and Value AEO accept only Listicle or Landing page.',icp:'Industry, Company size, Role / Team and Technology are independent; every ICP AEO URL has an explicit segment.'}};
fs.writeFileSync(path.join(root,'tools','saras-keyword-taxonomy-audit.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({reviewed:manifest.reviewed,read:manifest.read,moved:moves.length,counts},null,2));
