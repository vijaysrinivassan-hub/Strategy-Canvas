import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const cards=fs.readFileSync(new URL('./icp-cards.css',import.meta.url),'utf8');
const table=fs.readFileSync(new URL('./icp-table.css',import.meta.url),'utf8');
assert(html.includes('id="icpIndustryFit"'));
assert(html.includes("name:'B2B SaaS',axis:'process'"));
assert(html.includes("name:'Prosumer SaaS',axis:'people'"));
assert(html.includes("name:'Technical infrastructure providers',axis:'technology'"));
assert(html.includes("name:'Data / raw-material providers',axis:'input'"));
assert(html.includes("pages:['Use case','Country','Industry','Company size']"));
assert(html.includes('buying.axis = model.axis;'));
assert(html.includes('buying.industryModel = model.id;'));
assert(html.includes("pagesLabel.textContent = 'Pages to create'"));
assert(html.includes("previewName.textContent = selectedModel ? selectedModel.name"));
assert(html.includes("previewAxis.textContent = selectedModel ? selectedModel.axisLabel"));
assert(html.includes("previewFlow.append(document.createTextNode('Technology influences')"));
assert(html.includes('host.append(preview, modelGrid)'));
assert(!html.includes("headerTitle.textContent = 'Industry fit'"));
assert(html.includes('renderIndustryFit(ro);'));
assert(/\.icp-list\{[^}]*width:min\(820px,100%\)/.test(cards));
assert(!table.includes('.positioning>.pos-section:first-child{width:100%'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: one dynamic puzzle preview, four stacked industry options, explicit page outputs, Brand Radar sync, and inline syntax.');
