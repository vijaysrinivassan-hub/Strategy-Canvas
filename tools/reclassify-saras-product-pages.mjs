import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const routes=new Map([
  ['https://www.sarasanalytics.com/lp/what-is-saras-iq',{awareness:'category-aware',section:'Category AEO',pageType:'Landing page',hierarchy:'Data Analysis',axis:'Product pages'}],
  ['https://www.sarasanalytics.com/lp/saras-iq-essentials',{awareness:'category-aware',section:'Category AEO',pageType:'Landing page',hierarchy:'Data Analysis',axis:'Feature pages'}],
  ['https://www.sarasanalytics.com/saras-iq',{awareness:'category-aware',section:'Category AEO',pageType:'Landing page',hierarchy:'Data Analysis',axis:'Product pages'}],
  ['https://www.sarasanalytics.com/lp/saras-iq-demo',{awareness:'non-seo',section:'Corporate & Non-SEO',pageType:'Non-SEO',hierarchy:'Saras iQ',axis:'Demo'}],
  ['https://www.sarasanalytics.com/saras-iq/pricing',{awareness:'non-seo',section:'Corporate & Non-SEO',pageType:'Non-SEO',hierarchy:'Saras iQ',axis:'Pricing'}]
]);

for(const [url,route] of routes){
  const record=source.classifications[url];
  if(!record)throw new Error(`Missing URL classification: ${url}`);
  Object.assign(record,{workspace:'ai-data-platform',...route});
  delete record.icpSegment;
}

const counters=new Map();
for(const record of Object.values(source.classifications))if(record.workspace==='ai-data-platform'){
  const key=[record.awareness,record.section,record.pageType,record.hierarchy,record.axis].join('|');
  record.groupOrder=counters.get(key)||0;
  counters.set(key,record.groupOrder+1);
}
source.version=Math.max(Number(source.version)||1,10);
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');
console.log(JSON.stringify({reclassified:routes.size,productPages:2,featurePages:1,nonSeo:2},null,2));
