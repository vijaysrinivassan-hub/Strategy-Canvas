import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const asset=JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const saras=asset.profiles.find(profile=>profile.id==='saras-analytics');
assert(saras);
assert.equal(saras.urls.length,770);
assert.equal(new Set(saras.urls).size,770);
assert.deepEqual(saras.sitemaps,['https://www.sarasanalytics.com/sitemap.xml']);
assert(saras.urls.every(url=>url==='https://www.sarasanalytics.com'||url.startsWith('https://www.sarasanalytics.com/')));

const records=Object.entries(asset.classifications).filter(([,meta])=>meta.workspace==='ai-data-platform');
assert.equal(records.length,770);
assert.equal(records.filter(([,meta])=>meta.section==='Corporate & Non-SEO').length,12);
assert(records.every(([,meta])=>meta.awareness&&meta.topicGroup&&meta.topic));
assert(records.filter(([,meta])=>meta.section!=='Corporate & Non-SEO').every(([,meta])=>/^(ICP|Value) (SEO|AEO)$/.test(meta.section)));
assert(records.filter(([,meta])=>meta.section!=='Corporate & Non-SEO').every(([,meta])=>['problem-unaware','problem-aware','solution-aware'].includes(meta.awareness)));

const source=fs.readFileSync(new URL('./shared-url-repository.js',import.meta.url),'utf8');
const context=vm.createContext({globalThis:{CompetitiveIntelligenceClassifications:asset},console});
vm.runInContext(source,context);
const repo=context.globalThis.SharedUrlRepository;
const types=[{id:'list',name:'Listicle'},{id:'land',name:'Landing page'},{id:'info',name:'Informational'}];
let n=0;
const root={views:{category:{columns:[],rows:[]},competitor:{columns:[],rows:[]},icp:{columns:[],rows:[]},value:{columns:[],rows:[]}}};
const active={columns:[],rows:[]};
assert.equal(repo.installMappings(root,types,{product:'AI Data Platform',uid:()=>`row-${++n}`,awareness:'problem-aware',contentView:'icp',mode:'seo',activeView:active}),true);
const cells=active.rows.flatMap(row=>Object.values(row.cells||{}));
assert(cells.length>0);
assert(cells.every(cell=>cell.repositoryQueries.length===1));
const urls=cells.flatMap(cell=>repo.resolve(cell.repositoryQueries));
assert.equal(urls.length,repo.query({workspace:'ai-data-platform',awareness:'problem-aware',section:'ICP SEO'}).length);
assert(cells.every(cell=>repo.resolve(cell.repositoryQueries).length===1));

const seedSource=fs.readFileSync(new URL('./saras-analytics-competitive-intelligence.js',import.meta.url),'utf8');
assert(seedSource.includes("REVISION='saras-analytics-sitemap-2026-10-03-v1'"));
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('<script src="saras-analytics-competitive-intelligence.js"></script>'));
assert(html.includes('await ensureSarasAnalyticsCompetitiveIntelligenceSeed();'));
console.log('PASS: all 770 Saras Analytics sitemap URLs are scoped to AI Data Platform and every keyword cell resolves one article.');
