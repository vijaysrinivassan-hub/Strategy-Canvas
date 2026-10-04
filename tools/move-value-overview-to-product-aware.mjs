import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const source=JSON.parse(fs.readFileSync(target,'utf8'));
const routes=new Map([
  ['https://www.sarasanalytics.com/lp/what-is-saras-iq','Features'],
  ['https://www.sarasanalytics.com/lp/saras-iq-demo','Features'],
  ['https://www.sarasanalytics.com/saras-iq/pricing','Features'],
  ['https://www.sarasanalytics.com/lp/saras-iq-essentials','Capabilities'],
  ['https://www.sarasanalytics.com/saras-iq','Capabilities']
]);

for(const [url,axis] of routes){
  const record=source.classifications[url];
  if(!record)throw new Error(`Missing URL classification: ${url}`);
  Object.assign(record,{
    workspace:'ai-data-platform',
    awareness:'category-aware',
    section:'Category AEO',
    pageType:'Listicle',
    hierarchy:'Data Analysis',
    axis
  });
  delete record.icpSegment;
}

const counters=new Map();
for(const record of Object.values(source.classifications))if(record.workspace==='ai-data-platform'){
  const key=[record.awareness,record.section,record.pageType,record.hierarchy,record.axis].join('|');
  record.groupOrder=counters.get(key)||0;
  counters.set(key,record.groupOrder+1);
}
source.version=Math.max(Number(source.version)||1,9);
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');
console.log(JSON.stringify({moved:routes.size,destination:'Product Aware > Listicle pages',columns:{Capabilities:2,Features:3}},null,2));
