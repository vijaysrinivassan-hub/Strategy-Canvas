import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import KeywordColumns from './keyword-columns.js';

const asset=JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const manifest=JSON.parse(fs.readFileSync(new URL('./tools/saras-category-aware-audit.json',import.meta.url),'utf8'));
const records=Object.entries(asset.classifications).filter(([,meta])=>meta.workspace==='ai-data-platform');
assert.equal(records.length,770);
assert.equal(manifest.totalUrls,770);
assert.equal(manifest.reviewed,770);
assert.equal(manifest.read,768);
assert.equal(manifest.failed.length,2);
assert.equal(manifest.selected.length,220);
assert.equal(records.filter(([,meta])=>meta.section==='Category AEO').length,217);
assert.equal(records.filter(([,meta])=>meta.section==='Category SEO').length,3);
assert(records.filter(([,meta])=>/^Category /.test(meta.section)).every(([,meta])=>meta.awareness==='category-aware'&&meta.auditStatus==='read'&&meta.auditTitle));
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-analytics-software'].axis,'Category name');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-reporting-tools'].axis,'Category synonyms');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-data-engineering'].axis,'Service pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/daton/shopify'].axis,'Integration pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/products'].axis,'Product pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-daton'].axis,'Product pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-ad'].axis,'Product pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-analytics'].section,'Category SEO');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/customer-behavior-analysis-tools'].section,'Value AEO');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/customer-behavior-analysis-tools'].hierarchy,'Segmentation analysis');
assert.deepEqual([...new Set(records.filter(([,meta])=>/^Category /.test(meta.section)).map(([,meta])=>meta.hierarchy))].sort(),['Data Analysis','Data Integration & ETL']);
assert(!records.filter(([,meta])=>/^Category /.test(meta.section)).some(([url])=>/alternative|\/vs\//i.test(url)));

const source=fs.readFileSync(new URL('./shared-url-repository.js',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.match(appSource,/shared-url-repository\.js\?v=saras-product-pages-v14/);
assert.match(appSource,/const categoryMode = \['product','category'\]\.includes\(state\.contentView\) \? keywordMode : ''/);
const context=vm.createContext({globalThis:{CompetitiveIntelligenceClassifications:asset},console});
vm.runInContext(source,context);
const repo=context.globalThis.SharedUrlRepository;
const types=[{id:'list',name:'Listicle'},{id:'land',name:'Landing page'},{id:'info',name:'Informational'}];
const make=()=>({columns:[],rows:[]});let n=0;
const categoryTaxonomy={primary:['Data Analysis'],supporting:['Data Integration & ETL']};
const aeo=make(),product=make(),rootAeo={views:{product,category:aeo,icp:make(),value:make()}};
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`aeo-${++n}`,contentView:'category',mode:'aeo',activeView:aeo,categoryTaxonomy}),true);
const aeoCells=aeo.rows.flatMap(row=>Object.values(row.cells||{}));
const mappedAeo=aeoCells.flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
const expectedAeo=repo.query({workspace:'ai-data-platform',awareness:'category-aware',section:'Category AEO'});
const belongsInProduct=item=>repo.pageGroup(item.pageType)==='landing'||['capabilities','features'].includes(String(item.axis).toLowerCase());
assert.equal(mappedAeo.length,expectedAeo.filter(item=>!belongsInProduct(item)).length,'Missing: '+expectedAeo.filter(item=>!belongsInProduct(item)&&!mappedAeo.some(mapped=>mapped.url===item.url)).map(item=>item.url).join(', '));
assert(aeo.pageColumns.listicle.some(column=>column.name==='Category name'));
assert(aeo.pageColumns.listicle.some(column=>column.name==='Category synonyms'));
assert.deepEqual([...new Set(aeo.rows.filter(row=>row.pageGroup==='listicle').map(row=>[row.repositorySuperHierarchy,row.repositoryHierarchy].join('|')))],['Prime category|Data Analysis','Supporting process|Data Integration & ETL']);
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`product-${++n}`,contentView:'product',mode:'aeo',activeView:product,categoryTaxonomy}),true);
const mappedProduct=product.rows.flatMap(row=>Object.values(row.cells||{})).flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
assert.equal(mappedProduct.length,expectedAeo.filter(belongsInProduct).length);
assert.deepEqual(Array.from(product.pageColumns.listicle,column=>column.name),['Capabilities','Features']);
assert(product.pageColumns.landing.some(column=>column.name==='Feature pages'));
assert(product.pageColumns.landing.some(column=>column.name==='Integration pages'));
assert(product.pageColumns.landing.some(column=>column.name==='Service pages'));
assert(product.pageColumns.landing.some(column=>column.name==='Capabilities'));
assert(product.pageColumns.landing.some(column=>column.name==='Features'));
const productPageColumn=product.pageColumns.landing.find(column=>column.name==='Product pages');
assert(productPageColumn);
assert.equal(product.rows.flatMap(row=>repo.resolve(row.cells?.[productPageColumn.id]?.repositoryQueries||[])).length,5);
for(const column of product.pageColumns.landing){
  const count=product.rows.filter(row=>row.cells?.[column.id]?.repositoryQueries?.length).length;
  if(count)assert(product.rows[0].cells?.[column.id]?.repositoryQueries?.length,`${column.name} must start in the first Product Aware row`);
}

// Category Aware AEO and SEO share one saved view. Switching to SEO must not
// make the later AEO refresh accept SEO cells as if they were AEO cells.
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`toggle-seo-${++n}`,contentView:'category',mode:'seo',activeView:aeo,categoryTaxonomy}),true);
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`toggle-aeo-${++n}`,contentView:'category',mode:'aeo',activeView:aeo,categoryTaxonomy}),false);
const toggledCells=aeo.rows.flatMap(row=>Object.values(row.cells||{}));
const toggledAeo=toggledCells.filter(cell=>cell.mode==='aeo').flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
const toggledSeo=toggledCells.filter(cell=>cell.mode==='seo').flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
assert.equal(toggledAeo.length,expectedAeo.filter(item=>!belongsInProduct(item)).length);
assert.equal(toggledSeo.length,3);
assert(toggledAeo.every(item=>item.section==='Category AEO'));
assert(toggledSeo.every(item=>item.section==='Category SEO'));

const seo=make(),rootSeo={views:{category:seo,icp:make(),value:make()}};
assert.equal(repo.installMappings(rootSeo,types,{product:'AI Data Platform',uid:()=>`seo-${++n}`,contentView:'category',mode:'seo',activeView:seo,categoryTaxonomy}),true);
const seoCells=seo.rows.flatMap(row=>Object.values(row.cells||{}));
assert.equal(seoCells.flatMap(cell=>repo.resolve(cell.repositoryQueries||[])).length,3);
assert.match(KeywordColumns.strategyPrompt,/Read each source page itself/);
assert.match(KeywordColumns.strategyPrompt,/selected pillar-process card is the Prime category/);
assert.match(KeywordColumns.strategyPrompt,/Strategy & Research is not a category/);

console.log('PASS: audited Saras category listicles stay in Category Aware while product landing pages populate Product Aware without duplication.');
