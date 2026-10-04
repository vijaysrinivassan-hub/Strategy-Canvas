import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const auditPath=path.join(os.tmpdir(),'saras-page-audit.json');
if(!fs.existsSync(auditPath))throw new Error('Run tools/audit-saras-pages.mjs first.');
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
const pages=new Map((audit.results||[]).map(item=>[item.url.replace(/\/$/,''),item]));
const profile=(source.profiles||[]).find(item=>item.id==='saras-analytics');
if(!profile)throw new Error('Saras Analytics profile is missing.');
const routeFor=url=>{
  const pathname=new URL(url).pathname.replace(/\/$/,'')||'/';
  const seo={
    '/blog/ecommerce-analytics':['Category SEO','Informational','E-commerce Data Analytics','Category name'],
    '/blog/why-ootb-ecommerce-analytics-tools-break-at-scale':['Category SEO','Informational','E-commerce Data Analytics','Features & buying criteria']
  };
  const listicles={
    '/blog/ecommerce-analytics-software':['E-commerce Data Analytics','Category name'],
    '/blog/ecommerce-analytics-dashboard':['E-commerce Data Analytics','Category synonyms'],
    '/blog/ecommerce-analytics-tools':['E-commerce Data Analytics','Category synonyms'],
    '/blog/ecommerce-reporting-tools':['E-commerce Data Analytics','Category synonyms']
  };
  if(seo[pathname])return seo[pathname];
  if(listicles[pathname])return ['Category AEO','Listicle',...listicles[pathname]];
  if(/^\/(daton|connectors)\//.test(pathname)||['/saras-daton/sources','/claude-bigquery'].includes(pathname))return ['Category AEO','Landing page','Data Integration & ETL','Integration pages'];
  if(['/products','/saras-daton','/saras-iq-mcp','/saras-ad'].includes(pathname))return ['Category AEO','Landing page','E-commerce Data Analytics','Feature pages'];
  if(['/saras-consulting','/saras-data-engineering','/talk-to-data-consultants'].includes(pathname))return ['Category AEO','Landing page','E-commerce Data Analytics Services','Service pages'];
  return null;
};
const selected=[],failed=[];let reviewed=0;
for(const raw of profile.urls||[]){
  const url=raw.replace(/\/$/,'');
  const page=pages.get(url);reviewed++;
  if(!page?.status){
    failed.push({url,error:page?.error||'Page was not readable'});
    const meta=source.classifications[url];
    if(meta)Object.assign(meta,{workspace:'ai-data-platform',awareness:'non-seo',section:'Corporate & Non-SEO',pageType:'Corporate',hierarchy:'Broken / 404',axis:'404',auditStatus:'unreadable',auditedAt:audit.auditedAt});
    continue;
  }
  const route=routeFor(url);if(!route)continue;
  const [section,pageType,hierarchy,axis]=route,meta=source.classifications[url];
  if(!meta)throw new Error('Missing classification for '+url);
  Object.assign(meta,{workspace:'ai-data-platform',awareness:'category-aware',section,pageType,hierarchy,axis,topicGroup:url,topic:page.h1||page.title||meta.topic,groupSize:1,covered:false,auditStatus:'read',auditTitle:page.title,auditH1:page.h1,auditDescription:page.description,auditedAt:audit.auditedAt});
  delete meta.icpSegment;
  selected.push({url,section,pageType,hierarchy,axis,title:page.title,h1:page.h1,description:page.description});
}
const counters=new Map();
for(const item of selected){const key=[item.section,item.pageType,item.hierarchy,item.axis].join('|'),meta=source.classifications[item.url];meta.groupOrder=counters.get(key)||0;counters.set(key,meta.groupOrder+1);}
source.version=Math.max(Number(source.version)||1,6);
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');
const manifest={revision:'saras-category-aware-v1',auditedAt:audit.auditedAt,totalUrls:(profile.urls||[]).length,reviewed,read:reviewed-failed.length,failed,criteria:{category:'E-commerce Data Analytics',rule:'Actual page title, H1, description and body were fetched before classification. Category intent must be primary.',precedence:['Competitor Aware','Category Aware','ICP','Value','Corporate & Non-SEO']},selected};
fs.writeFileSync(path.join(root,'tools','saras-category-aware-audit.json'),JSON.stringify(manifest,null,2)+'\n');
const counts=Object.groupBy(selected,item=>item.section);
console.log(JSON.stringify({reviewed,read:reviewed-failed.length,failed:failed.length,selected:selected.length,counts:Object.fromEntries(Object.entries(counts).map(([key,items])=>[key,items.length]))},null,2));
