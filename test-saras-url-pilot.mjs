import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const asset = JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const profile = asset.profiles.find(item => item.id === 'saras-analytics');
const urls = profile.urls;
assert.equal(urls.length,770);
assert.equal(new Set(urls).size,770);
const fields = ['product','node','awarenessLevel','matrix','column'];
const nodes = new Set(['AI analytics agent','Semantic modelling layer','Decision delivery API','Embedded product SDK']);
for (const url of urls){
  const row = asset.classifications[url];
  assert(row,`Missing ${url}`);
  for (const field of fields) assert.equal(typeof row[field],'string',`${url}: ${field}`);
  if (row.product.startsWith('Different Product:') || row.product === 'Corporate'){
    assert.equal(row.node,'');
    assert.equal(row.awarenessLevel,'Non-SEO');
    assert.equal(row.matrix,'Corporate & Non-SEO');
    assert.equal(row.section,'Corporate & Non-SEO');
  } else {
    assert(row.product.startsWith('Saras iQ — AI Layer'));
    if (row.matrix !== 'Corporate & Non-SEO') assert(nodes.has(row.node),`${url}: ${row.node}`);
  }
}
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-iq'].matrix,'Product Aware');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-iq'].column,'Product Pages');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-daton'].matrix,'Corporate & Non-SEO');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-daton'].product,'Different Product: Daton');
assert.equal(asset.classifications['https://www.sarasanalytics.com/saras-iq/pricing'].column,'Pricing');
const repositorySource=fs.readFileSync(new URL('./shared-url-repository.js',import.meta.url),'utf8');
const context=vm.createContext({globalThis:{CompetitiveIntelligenceClassifications:asset},console});
vm.runInContext(repositorySource,context);
const repository=context.globalThis.SharedUrlRepository;
assert.equal(repository.query({workspace:'ai-data-platform',section:'Category AEO'}).length,9);
assert.equal(repository.query({workspace:'ai-data-platform',section:'Corporate & Non-SEO'}).length,731);
const marker=execFileSync(process.execPath,[fileURLToPath(new URL('./tools/build-saras-mcp-note.mjs',import.meta.url))],{encoding:'utf8'}).trim();
const uiSource=fs.readFileSync(new URL('./competitive-intelligence.js',import.meta.url),'utf8');
const uiContext=vm.createContext({window:{CompetitiveIntelligenceClassifications:asset},URL,console});
vm.runInContext(uiSource,uiContext);
const tab={competitors:[{id:'saras-analytics',name:'Saras Analytics',urls:[...urls],sitemaps:[],note:'Original note\n'+marker}]};
assert.equal(uiContext.window.CompetitiveIntelligence.ensure(tab,'AI Data Platform','AI Layer'),true);
assert.equal(Object.keys(tab.competitors[0].urlClassificationsByProduct['AI Layer']).length,770);
assert.equal(tab.competitors[0].urlClassificationsByProduct['AI Layer']['https://www.sarasanalytics.com/saras-iq'].column,'Product Pages');
assert.equal(tab.competitors[0].note,'Original note');
assert.equal(uiContext.window.CompetitiveIntelligence.ensure(tab,'AI Data Platform','AI Layer'),false);
console.log('PASS: 770 Saras URLs have product-scoped, five-field classifications; nonmatching products route to Corporate & Non-SEO.');
