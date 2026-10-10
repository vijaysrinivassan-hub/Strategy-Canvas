import assert from 'node:assert/strict';
import fs from 'node:fs';
import Reviewed from './saras-reviewed-routing.cjs';
import Repository from './shared-url-repository.js';
const asset=JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const profile=asset.profiles.find(item=>item.id==='saras-analytics');
const rows=profile.urls.map(url=>asset.classifications[url]);
assert.equal(rows.length,770);assert.equal(new Set(profile.urls).size,770);
assert.deepEqual(Object.fromEntries(['BI / reporting platform','AI analytics platform','Supporting Processes','Out of scope'].map(node=>[node,rows.filter(row=>row.node===node).length])),{'BI / reporting platform':71,'AI analytics platform':136,'Supporting Processes':502,'Out of scope':61});
assert(rows.every(row=>row.classificationRevision===Reviewed.REVISION));
assert(rows.filter(row=>row.node==='Supporting Processes').every(row=>row.supportingNode&&row.supportingNodeId));
assert(rows.filter(row=>row.node!=='Supporting Processes').every(row=>!row.supportingNode&&!row.supportingNodeId));
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-daton'].node,'Supporting Processes');
const grid=()=>({kind:'grid',rows:[],columns:[],pageColumns:{},pageOrders:{}});
const primary='ai-maturity-l2-reporting',analysis='ai-maturity-l2-analysis';
const statusUrl=profile.urls.find(url=>asset.classifications[url].node==='AI analytics platform'&&asset.classifications[url].matrix==='Value SEO');
const body={client:'AI Data Platform',clientProduct:'AI Layer',workspaceProductId:'0jgsw8bx554d',productWorkspaces:{capital:{tabs:{sentinel:'preserve'}}},tabs:{
  'Competitive Intelligence':{competitors:[{...profile,trafficSnapshots:{'2026-10-04':{sentinel:1}}},{id:'other',urls:['https://example.com']}]},
  'Strategy 1 — Maturity Axis':{architecture:{nodes:[{id:primary,replacementSelected:true,processRole:'pillar'},{id:analysis,replacementSelected:true,processRole:'pillar'}]}},
  'Content Strategy':{activeKeywordNodeId:primary,views:{category:grid(),product:grid(),icp:grid(),value:{...grid(),rows:[{id:'manual',cells:{manual:{v:'Keep manual keyword',kws:['keep-id']}},pageGroup:'informational'},{id:'old',cells:{old:{st:'approved',writtenBy:'reviewer',repositoryQueries:[{topicGroup:statusUrl}]}},pageGroup:'informational'}]},competitor:{rows:[],types:[],cells:{},comparisonCells:{}}},awarenessViews:{}}
}};
const untouched=JSON.stringify(body.productWorkspaces);
const result=Reviewed.apply(body,asset,'Existing custom prompt');
assert.equal(result.mapped,709);assert.equal(result.nonSeo,61);assert.deepEqual(result.nodeCounts,{[primary]:71,[analysis]:136,'supporting-processes':502});
assert.equal(JSON.stringify(body.productWorkspaces),untouched);
assert.deepEqual(body.tabs['Competitive Intelligence'].competitors[0].trafficSnapshots,{'2026-10-04':{sentinel:1}});
assert.deepEqual(body.tabs['Competitive Intelligence'].competitors[1],{id:'other',urls:['https://example.com']});
assert(body.tabs['Content Strategy'].views.value.rows.some(row=>row.cells.manual?.kws.includes('keep-id')));
let preserved=false;
function walk(value){if(!value||typeof value!=='object')return;if(value.repositoryQueries?.some(query=>query.topicGroup===statusUrl)){assert.equal(value.st,'approved');assert.equal(value.writtenBy,'reviewer');preserved=true;}Object.values(value).forEach(walk);}
walk(body.tabs['Content Strategy'].keywordNodeWorkspaces);assert(preserved);
assert.equal(Object.keys(body.tabs['Competitive Intelligence'].competitors[0].urlClassificationsByProduct['AI Layer']).length,770);
assert.equal(Reviewed.apply(body,asset,'Existing custom prompt').mapped,709,'Reapplying must not duplicate URLs');
const icp=body.tabs['Content Strategy'].keywordNodeWorkspaces[analysis].views.icp;
icp.pageColumns.landing||=[];icp.pageColumns.landing.push({id:'universal-industry',name:'Industry'});
assert.equal(Reviewed.apply(body,asset,'Existing custom prompt').mapped,709,'Exact reviewed columns must survive universal aliases');
globalThis.CompetitiveIntelligenceClassifications=asset;
for(const row of Repository.records().filter(row=>row.classificationRevision))for(const node of [primary,analysis,'supporting-processes'])assert.equal(Repository.matchesNode(row,{keywordNodeId:node}),row.nodeId===node);
console.log('PASS: 770 reviewed classifications, exact 709 unique placements, supporting actors, preserved manual content/status/traffic/products, and idempotency.');
