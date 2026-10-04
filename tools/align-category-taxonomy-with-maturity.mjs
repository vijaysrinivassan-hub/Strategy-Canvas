import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const target=path.join(root,'competitive-intelligence-classifications.json');
const auditTarget=path.join(root,'tools','saras-category-aware-audit.json');
const source=JSON.parse(fs.readFileSync(target,'utf8'));

for(const [url,meta] of Object.entries(source.classifications||{})){
  if(meta.workspace!=='ai-data-platform')continue;
  if(url==='https://www.sarasanalytics.com/blog/customer-behavior-analysis-tools'){
    Object.assign(meta,{awareness:'solution-aware',section:'Value AEO',pageType:'Listicle',hierarchy:'Segmentation analysis',axis:'Marketing'});
    delete meta.icpSegment;
    continue;
  }
  if(meta.awareness==='category-aware'&&/^Category (?:AEO|SEO)$/.test(meta.section||'')&&
    ['E-commerce Data Analytics','E-commerce Data Analytics Services','Customer Analytics Software'].includes(meta.hierarchy)){
    meta.hierarchy='Data Analysis';
  }
}

const counters=new Map();
for(const meta of Object.values(source.classifications||{})){
  if(meta.workspace!=='ai-data-platform')continue;
  const key=[meta.awareness,meta.section,meta.pageType,meta.hierarchy,meta.axis].join('|');
  meta.groupOrder=counters.get(key)||0;
  counters.set(key,meta.groupOrder+1);
}
source.classifiedAt=new Date().toISOString();
fs.writeFileSync(target,JSON.stringify(source)+'\n');

if(fs.existsSync(auditTarget)){
  const audit=JSON.parse(fs.readFileSync(auditTarget,'utf8'));
  audit.revision='saras-category-aware-v2';
  audit.criteria={
    category:'Data Analysis',
    supportingProcess:'Data Integration & ETL',
    rule:'The selected Maturity Axis pillar is the Prime category. Only actual supporting-process cards may create secondary category rows.',
    precedence:audit.criteria?.precedence||['Competitor Aware','Category Aware','ICP','Value','Corporate & Non-SEO']
  };
  audit.selected=(audit.selected||[]).filter(item=>item.url!=='https://www.sarasanalytics.com/blog/customer-behavior-analysis-tools').map(item=>({
    ...item,
    hierarchy:['E-commerce Data Analytics','E-commerce Data Analytics Services','Customer Analytics Software'].includes(item.hierarchy)?'Data Analysis':item.hierarchy
  }));
  fs.writeFileSync(auditTarget,JSON.stringify(audit,null,2)+'\n');
}

const categoryCounts={};
for(const meta of Object.values(source.classifications||{})){
  if(meta.workspace!=='ai-data-platform'||meta.awareness!=='category-aware'||!/^Category /.test(meta.section||''))continue;
  const key=meta.hierarchy;
  categoryCounts[key]=(categoryCounts[key]||0)+1;
}
console.log(JSON.stringify({categoryCounts,customerBehavior:source.classifications['https://www.sarasanalytics.com/blog/customer-behavior-analysis-tools']},null,2));
