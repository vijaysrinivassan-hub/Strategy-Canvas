import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import Matrix from './ai-data-icp-matrix.js';

const base=JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const audit=JSON.parse(fs.readFileSync(new URL('./tools/ask-luca-keyword-import-audit.json',import.meta.url),'utf8'));
const context=vm.createContext({globalThis:{CompetitiveIntelligenceClassifications:base},console,URL});
vm.runInContext(fs.readFileSync(new URL('./ask-luca-keyword-import.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./shared-url-repository.js',import.meta.url),'utf8'),context);
const repo=context.globalThis.SharedUrlRepository,records=repo.records().filter(record=>record.competitorId==='ask-luca');

assert.equal(records.length,140);
assert.equal(new Set(records.map(record=>record.url)).size,140);
assert(records.every(record=>record.covered&&record.represented&&record.competitor==='Ask Luca'&&record.topic));
assert.equal(records.filter(record=>new URL(record.url).hostname==='ask-luca.com').length,135);
assert.equal(records.filter(record=>new URL(record.url).hostname==='content.maximuslabs.ai').length,5);
assert.equal(records.filter(record=>record.workspace==='ai-data-platform').length,106);
assert.equal(records.filter(record=>record.workspace==='ai-data-capital').length,34);
assert.deepEqual(JSON.parse(JSON.stringify(audit.sections)),{
  'Value SEO':34,'ICP SEO':26,'Category AEO':21,'Category SEO':23,
  'ICP AEO':8,'Competitor AEO':16,'Value AEO':12
});
assert.equal(repo.workspaceFor('Capital Layer'),'ai-data-capital');

const types=[{id:'list',name:'Listicle'},{id:'land',name:'Landing page'},{id:'info',name:'Informational'},{id:'comp',name:'Competitor'}];
let nextId=0;
const makeRoot=product=>{
  const root={views:{product:{columns:[],rows:[]},category:{columns:[],rows:[]},icp:{columns:[],rows:[]},value:{columns:[],rows:[]},competitor:{rows:[],types:[],cells:{},comparisonCells:{}}}};
  if(product==='AI Data Platform')Matrix.ensure(root,'AI Data Platform','0jgsw8bx554d');
  return root;
};
const routed=new Map();
function collect(root){
  for(const view of Object.values(root.views)){
    for(const cell of [...(view.rows||[]).flatMap(row=>Object.values(row.cells||{})),...Object.values(view.cells||{}),...Object.values(view.comparisonCells||{})]){
      const owned=repo.resolve(cell?.repositoryQueries||[]).filter(record=>record.competitorId==='ask-luca');
      if(!owned.length)continue;
      assert.equal(cell.st,'written');
      assert(owned.some(record=>record.url===cell.url),`Expected represented URL in Slug: ${cell.url}`);
      assert(owned.some(record=>record.topic===cell.v),`Expected published title in Title: ${cell.v}`);
      owned.forEach(record=>routed.set(record.url,cell));
    }
  }
}
function route(product,contentView,awareness,mode){
  const root=makeRoot(product),active=root.views[contentView];
  repo.installMappings(root,types,{product,contentView,awareness,mode,activeView:active,uid:()=>`row-${++nextId}`,categoryTaxonomy:{primary:['E-commerce Data Analytics'],supporting:['Data Integration & ETL']}});
  collect(root);
}
for(const product of ['AI Data Platform','Capital Layer']){
  route(product,'product','category-aware','aeo');
  route(product,'category','category-aware','aeo');
  route(product,'category','category-aware','seo');
  route(product,'icp','problem-unaware','seo');
  route(product,'icp','problem-aware','seo');
  route(product,'icp','solution-aware','aeo');
  route(product,'value','problem-unaware','seo');
  route(product,'value','problem-aware','seo');
  route(product,'value','solution-aware','aeo');
  const root=makeRoot(product);
  assert.equal(repo.installCompetitorMappings(root,types,{product,uid:()=>`competitor-${++nextId}`}),records.some(record=>record.workspace===repo.workspaceFor(product)&&record.section==='Competitor AEO'));
  collect(root);
}
assert.equal(routed.size,140);
assert.equal(routed.get('https://ask-luca.com/blogs/what-is-luca-ai-the-ai-co-founder-for-e-commerce-explained').v,'What Is Luca AI? The AI Co-Founder for E-commerce Explained');
assert.equal(routed.get('https://ask-luca.com/blogs/luca-ai-vs-wayflyer').st,'written');

// Existing boards may already contain the Saras/base repository revision.
// The Luca overlay must invalidate that old migration and put represented
// pages ahead of competitor evidence rather than hiding them on later pages.
const existingBoard=makeRoot('AI Data Platform');
existingBoard.sharedUrlRepositoryRevisions={
  'ai-data-platform:category-aware:product:aeo':`${base.classifiedAt}:ai-data-platform:category-aware:product:aeo:v14`
};
repo.installMappings(existingBoard,types,{product:'AI Data Platform',contentView:'product',awareness:'category-aware',mode:'aeo',activeView:existingBoard.views.product,uid:()=>`existing-${++nextId}`,categoryTaxonomy:{primary:['E-commerce Data Analytics'],supporting:['Data Integration & ETL']}});
const productColumn=existingBoard.views.product.pageColumns.landing.find(column=>column.name==='Product pages');
const firstProductCell=existingBoard.views.product.rows.filter(row=>row.pageGroup==='landing').map(row=>row.cells?.[productColumn.id]).find(Boolean);
assert(firstProductCell,'Expected a populated Product pages cell.');
assert.equal(firstProductCell.url,'https://ask-luca.com/blogs/what-is-luca-ai-the-ai-co-founder-for-e-commerce-explained');
assert.equal(firstProductCell.st,'written');
assert(repo.resolve(firstProductCell.repositoryQueries).every(record=>record.represented));
// A stale saved competitor slug must not win when the Luca migration runs.
firstProductCell.url='https://www.sarasanalytics.com/stale-competitor-slug';
existingBoard.sharedUrlRepositoryRevisions['ai-data-platform:category-aware:product:aeo']=`${base.classifiedAt}:${context.globalThis.AskLucaKeywordImport.REVISION}:ai-data-platform:category-aware:product:aeo:v19`;
repo.installMappings(existingBoard,types,{product:'AI Data Platform',contentView:'product',awareness:'category-aware',mode:'aeo',activeView:existingBoard.views.product,uid:()=>`repair-${++nextId}`,categoryTaxonomy:{primary:['E-commerce Data Analytics'],supporting:['Data Integration & ETL']}});
const repairedProductCell=existingBoard.views.product.rows.filter(row=>row.pageGroup==='landing').map(row=>row.cells?.[productColumn.id]).find(cell=>repo.resolve(cell?.repositoryQueries||[]).some(record=>record.url==='https://ask-luca.com/blogs/what-is-luca-ai-the-ai-co-founder-for-e-commerce-explained'));
assert.equal(repairedProductCell.url,'https://ask-luca.com/blogs/what-is-luca-ai-the-ai-co-founder-for-e-commerce-explained');
assert.equal(repairedProductCell.st,'written');
const featureColumn=existingBoard.views.product.pageColumns.landing.find(column=>column.name==='Feature pages');
const firstSarasFeature=existingBoard.views.product.rows.filter(row=>row.pageGroup==='landing').map(row=>row.cells?.[featureColumn.id]).find(cell=>repo.resolve(cell?.repositoryQueries||[]).some(record=>record.competitorId==='saras-analytics'));
assert(firstSarasFeature,'Expected Saras competitor evidence in Feature pages.');
assert.equal(firstSarasFeature.v,'','Saras evidence must not occupy the represented company Title field.');
assert.equal(firstSarasFeature.url,'','Saras evidence must not occupy the represented company Slug field.');

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('ask-luca-keyword-import.js?v=represented-content-v1'));
assert(html.includes("return row?.represented === true"));
assert(html.includes("state.contentView === 'competitor' && window.SharedUrlRepository.installCompetitorMappings"));
console.log('PASS: all 140 Ask Luca URLs route to existing keyword surfaces with published titles, Slugs and red Already written status.');
