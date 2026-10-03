import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('./competitive-intelligence.js',import.meta.url),'utf8');
const seedSource=fs.readFileSync(new URL('./competitive-intelligence-seed.js',import.meta.url),'utf8');
const classificationAsset=JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const mcp=fs.readFileSync(new URL('./mcp-server/src/tools/competitive-intelligence.ts',import.meta.url),'utf8');
const server=fs.readFileSync(new URL('./mcp-server/src/index.ts',import.meta.url),'utf8');
const lib=fs.readFileSync(new URL('./mcp-server/src/lib.ts',import.meta.url),'utf8');

const context=vm.createContext({window:{},URL,console});
vm.runInContext(seedSource,context);
vm.runInContext(source,context);
const seed=context.window.CompetitiveIntelligenceSeed;
assert.equal(seed.client,'US AUAEO');
assert.equal(seed.product,'Answer Engine Optimization Agency');
assert.deepEqual(Array.from(seed.competitors,item=>item.name),[
  'Graphite','The Optimization Agency','First Page Sage','Triple Dot','Omnious','Omniscient'
]);
assert.equal(seed.competitors.find(item=>item.name==='Graphite').urls.length,47);
assert(seed.competitors.find(item=>item.name==='First Page Sage').urls.length>=840);
assert(seed.competitors.find(item=>item.name==='Triple Dot').urls.length>=620);
assert(seed.competitors.find(item=>item.name==='Omnious').urls.length>=330);
assert(seed.competitors.find(item=>item.name==='Omniscient').urls.length>=160);
assert.equal(seed.competitors.find(item=>item.name==='The Optimization Agency').status,'domain_required');
assert(seed.competitors.reduce((sum,item)=>sum+item.urls.length,0)>=2000);
assert.equal(classificationAsset.profiles.length,15);
assert.equal(Object.keys(classificationAsset.classifications).length,8650);
assert.equal(classificationAsset.classifications['https://www.omnius.so/blog/best-answer-engine-optimization-agencies'].section,'Category AEO');
context.window.CompetitiveIntelligenceClassifications=classificationAsset;
assert.equal(context.window.CompetitiveIntelligence.classificationOf('https://www.omnius.so/blog/best-answer-engine-optimization-agencies').pageType,'Listicle');

const tab={nodes:[],edges:[]};
assert.equal(context.window.CompetitiveIntelligence.ensure(tab,'US AUAEO','Answer Engine Optimization Agency'),true);
assert.equal(tab.competitors.length,14);
assert.equal(tab.competitors.reduce((sum,item)=>sum+item.urls.length,0),7880);
assert.equal(tab.competitors.find(item=>item.name==='Graphite').sitemaps.length,1);
const renamedBoard={nodes:[],edges:[]};
assert.equal(context.window.CompetitiveIntelligence.ensure(renamedBoard,'AEO Agency','Different product'),true);
assert.equal(renamedBoard.competitors.length,14);
assert.equal(renamedBoard.competitors.find(item=>item.name==='Omniscient').urls.length,737);
const isolated={nodes:[],edges:[]};
assert.equal(context.window.CompetitiveIntelligence.ensure(isolated,'Another client','Different product'),false);
assert.equal(isolated.competitors.length,0);

assert(html.includes("const COMPETITIVE_INTELLIGENCE_TAB = 'Competitive Intelligence'"));
assert(html.includes("{ kind: 'tab',    name: COMPETITIVE_INTELLIGENCE_TAB }"));
assert(html.includes('id="ciPane"'));
assert(html.includes('renderCompetitiveIntelligence()'));
assert(html.includes('COMPETITIVE_INTELLIGENCE_TAB, BRAND_RADAR_TAB'));
assert(html.includes("'btnCiAddCompetitor'"));
assert(source.includes('Strategic section'));
assert(source.includes('Page type'));
assert(!source.includes('sectionOf(url)'));
assert(mcp.includes("competitive_intelligence_get"));
assert(mcp.includes("competitive_intelligence_set"));
assert(mcp.includes("scope:'company'"));
assert(mcp.includes('shared across every product'));
assert(mcp.includes(".eq('updated_at',revision)"));
assert(server.includes('registerCompetitiveIntelligenceTools(server)'));
assert(lib.includes('"Competitive Intelligence"'));
console.log('PASS: company-scoped Competitive Intelligence panel, workbook classifications, strategic sections, sitemap provenance, unresolved-domain guard, role UI and revision-safe MCP access.');
