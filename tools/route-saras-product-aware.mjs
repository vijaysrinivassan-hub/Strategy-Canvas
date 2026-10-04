import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const routes={
  'https://www.sarasanalytics.com/products':'Product pages',
  'https://www.sarasanalytics.com/saras-daton':'Product pages',
  'https://www.sarasanalytics.com/saras-ad':'Product pages',
  'https://www.sarasanalytics.com/saras-iq-mcp':'Feature pages'
};

for(const [url,axis] of Object.entries(routes)){
  const meta=source.classifications?.[url];
  if(!meta)throw new Error('Missing Saras Analytics classification: '+url);
  Object.assign(meta,{workspace:'ai-data-platform',awareness:'category-aware',section:'Category AEO',pageType:'Landing page',hierarchy:'E-commerce Data Analytics',axis});
}
const counters=new Map();
for(const meta of Object.values(source.classifications||{})){
  if(meta.workspace!=='ai-data-platform'||meta.awareness!=='category-aware'||meta.section!=='Category AEO'||meta.pageType!=='Landing page')continue;
  const key=[meta.section,meta.pageType,meta.hierarchy,meta.axis].join('|');
  meta.groupOrder=counters.get(key)||0;counters.set(key,meta.groupOrder+1);
}
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(routes).map(([url,axis])=>[url,source.classifications[url].axis])),null,2));
