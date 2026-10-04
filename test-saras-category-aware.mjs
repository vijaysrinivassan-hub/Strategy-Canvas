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
assert.equal(records.filter(([,meta])=>meta.section==='Category AEO').length,218);
assert.equal(records.filter(([,meta])=>meta.section==='Category SEO').length,2);
assert(records.filter(([,meta])=>/^Category /.test(meta.section)).every(([,meta])=>meta.awareness==='category-aware'&&meta.auditStatus==='read'&&meta.auditTitle));
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-analytics-software'].axis,'Category name');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-reporting-tools'].axis,'Category synonyms');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-data-engineering'].axis,'Service pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/daton/shopify'].axis,'Integration pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/blog/ecommerce-analytics'].section,'Category SEO');
assert(!records.filter(([,meta])=>/^Category /.test(meta.section)).some(([url])=>/alternative|\/vs\//i.test(url)));

const source=fs.readFileSync(new URL('./shared-url-repository.js',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.match(appSource,/shared-url-repository\.js\?v=category-aware-hydration-v2/);
assert.match(appSource,/const categoryMode = state\.contentView === 'category' \? keywordMode : ''/);
const context=vm.createContext({globalThis:{CompetitiveIntelligenceClassifications:asset},console});
vm.runInContext(source,context);
const repo=context.globalThis.SharedUrlRepository;
const types=[{id:'list',name:'Listicle'},{id:'land',name:'Landing page'},{id:'info',name:'Informational'}];
const make=()=>({columns:[],rows:[]});let n=0;
const aeo=make(),rootAeo={views:{category:aeo,icp:make(),value:make()}};
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`aeo-${++n}`,contentView:'category',mode:'aeo',activeView:aeo}),true);
const aeoCells=aeo.rows.flatMap(row=>Object.values(row.cells||{}));
const mappedAeo=aeoCells.flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
const expectedAeo=repo.query({workspace:'ai-data-platform',awareness:'category-aware',section:'Category AEO'});
assert.equal(mappedAeo.length,218,'Missing: '+expectedAeo.filter(item=>!mappedAeo.some(mapped=>mapped.url===item.url)).map(item=>item.url).join(', '));
assert(aeo.pageColumns.listicle.some(column=>column.name==='Category name'));
assert(aeo.pageColumns.listicle.some(column=>column.name==='Category synonyms'));
assert(aeo.pageColumns.landing.some(column=>column.name==='Feature pages'));
assert(aeo.pageColumns.landing.some(column=>column.name==='Integration pages'));
assert(aeo.pageColumns.landing.some(column=>column.name==='Service pages'));

// Category Aware AEO and SEO share one saved view. Switching to SEO must not
// make the later AEO refresh accept SEO cells as if they were AEO cells.
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`toggle-seo-${++n}`,contentView:'category',mode:'seo',activeView:aeo}),true);
assert.equal(repo.installMappings(rootAeo,types,{product:'AI Data Platform',uid:()=>`toggle-aeo-${++n}`,contentView:'category',mode:'aeo',activeView:aeo}),false);
const toggledCells=aeo.rows.flatMap(row=>Object.values(row.cells||{}));
const toggledAeo=toggledCells.filter(cell=>cell.mode==='aeo').flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
const toggledSeo=toggledCells.filter(cell=>cell.mode==='seo').flatMap(cell=>repo.resolve(cell.repositoryQueries||[]));
assert.equal(toggledAeo.length,218);
assert.equal(toggledSeo.length,2);
assert(toggledAeo.every(item=>item.section==='Category AEO'));
assert(toggledSeo.every(item=>item.section==='Category SEO'));

const seo=make(),rootSeo={views:{category:seo,icp:make(),value:make()}};
assert.equal(repo.installMappings(rootSeo,types,{product:'AI Data Platform',uid:()=>`seo-${++n}`,contentView:'category',mode:'seo',activeView:seo}),true);
const seoCells=seo.rows.flatMap(row=>Object.values(row.cells||{}));
assert.equal(seoCells.flatMap(cell=>repo.resolve(cell.repositoryQueries||[])).length,2);
assert.match(KeywordColumns.strategyPrompt,/Read each source page itself/);

console.log('PASS: all 770 Saras pages were audited and 220 genuine category pages populate AI Data Platform Category Aware without competitor leakage.');
