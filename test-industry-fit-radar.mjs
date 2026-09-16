import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const cards=fs.readFileSync(new URL('./icp-cards.css',import.meta.url),'utf8');
assert(html.includes('id="icpIndustryFit"'));
assert(html.includes("piece('selling','Selling industry'"));
assert(html.includes("piece('buying','Buying industry'"));
assert(html.includes('buying.axis = axis;'));
assert(html.includes('selling.axis = axis;'));
assert(html.includes("name:'B2B SaaS',axis:'process'"));
assert(html.includes("name:'B2C SaaS',axis:'people'"));
assert(html.includes("name:'Technical infrastructure providers',axis:'technology'"));
assert(html.includes("name:'Data / raw-material providers',axis:'input'"));
assert(html.includes('buying.axis = model.axis;'));
assert(html.includes('buying.industryModel = model.id;'));
assert(html.includes('renderIndustryFit(ro);'));
assert(/\.icp-list\{[^}]*width:min\(820px,100%\)/.test(cards));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: aligned ICP width, paired industry selector, four industry models with examples, Brand Radar sync, Product Evolution sync, and inline syntax.');
