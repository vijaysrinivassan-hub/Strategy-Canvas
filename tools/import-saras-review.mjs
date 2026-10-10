import fs from 'node:fs/promises';

const input=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const target=new URL('../competitive-intelligence-classifications.json',import.meta.url);
const source=JSON.parse(await fs.readFile(target,'utf8'));
const profile=source.profiles.find(item=>item.id==='saras-analytics');
if(profile.urls.length!==770||Object.keys(input.classifications).length!==770||profile.urls.some(url=>!input.classifications[url]))throw Error('Reviewed inventory must match all 770 existing Saras URLs.');
const comparisons={
  '/blog/google-analytics-vs-adobe-analytics-which-one-should-you-use':['Google Analytics','Adobe Analytics'],
  '/blog/saras-analytics-vs-northbeam':['Saras iQ','Northbeam'],
  '/blog/saras-pulse-vs-lifetimely':['Saras iQ','Lifetimely'],
  '/vs/polar-analytics':['Saras iQ','Polar Analytics'],
  '/blog/saras-iq-vs-claude-bigquery-mcp':['Saras iQ','Claude + BigQuery MCP'],
  '/blog/saras-iq-vs-triple-whale-moby-ai':['Saras iQ','Triple Whale / Moby AI'],
  '/blog/saras-iq-vs-zenlytic':['Saras iQ','Zenlytic'],
  '/blog/saras-pulse-vs-triple-whale':['Saras iQ','Triple Whale / Moby AI'],
  '/vs/triple-whale-moby-ai':['Saras iQ','Triple Whale / Moby AI'],
  '/blog/daton-vs-fivetran-pricing':['Saras Daton','Fivetran'],
  '/blog/saras-daton-vs-glew':['Saras Daton','Glew'],
  '/blog/saras-daton-vs-hevo-data':['Saras Daton','Hevo Data']
};
const order=new Map();
for(const url of profile.urls){
  const old=source.classifications[url],patch=input.classifications[url],prior=old.previousRouting||old;
  const awareness=patch.matrix==='Product Aware'?'category-aware':patch.awarenessLevel.toLowerCase().replaceAll(' ','-');
  const section=patch.matrix==='Product Aware'?'Category AEO':patch.matrix;
  const pageType=patch.matrix==='Corporate & Non-SEO'?'Non-SEO':patch.matrix.endsWith('SEO')?'Informational':patch.matrix==='Category AEO'?'Listicle':patch.matrix==='Competitor AEO'?(prior.pageType||'Informational'):'Landing page';
  const key=[patch.nodeId,awareness,patch.matrix,patch.column].join('|'),slot=order.get(key)||0;order.set(key,slot+1);
  const comparison=comparisons[new URL(url).pathname];
  if(patch.column==='Competitor vs Competitor'&&!comparison)throw Error('A comparison pair must be manually identified: '+url);
  source.classifications[url]={...old,...patch,workspace:'ai-data-platform',awareness,section,pageType,hierarchy:prior.hierarchy||old.hierarchy,axis:patch.column,icpSegment:prior.icpSegment||old.icpSegment||'',topic:old.auditH1||patch.pageTitle,topicGroup:url,groupOrder:slot,groupSize:1,classificationRevision:input.revision,...(comparison?{comparison}:{})};
  delete source.classifications[url].product;
}
source.classifiedAt=new Date().toISOString();
profile.note='770 URLs reviewed by topic for Reporting, Analysis and Supporting Processes. Supporting actors are recorded explicitly; dates alone do not exclude content. Source titles, H1s and descriptions were reviewed; live bodies were checked for representative and ambiguous pages.';
await fs.writeFile(target,JSON.stringify(source));
console.log(JSON.stringify({updated:770,revision:input.revision}));
