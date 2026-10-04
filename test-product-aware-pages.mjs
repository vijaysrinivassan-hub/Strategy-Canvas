import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("{ id: 'product', label: 'Product Aware'"));
assert(html.includes("['category','product','competitor'].forEach(viewId =>"));
assert(html.includes("const PRODUCT_AWARE_MIGRATION='value-overview-to-product-aware-v2'"));
assert(html.includes("const moved=(category.rows||[]).filter(row=>row.pageGroup==='landing')"));
assert(html.includes("category.rows=(category.rows||[]).filter(row=>row.pageGroup!=='landing')"));
assert(html.includes("const movedListicleRows=valueOverviewRows.map(row=>"));
assert(html.includes("delete value.pageColumns['value-overview']"));
assert(html.includes("name:'Capabilities'"));
assert(html.includes("name:'Features'"));
assert(html.includes("if (id === 'product') keywordMode = 'aeo'"));
assert(html.includes("state.contentView === 'product' ||"));
assert(/shared-url-repository\.js\?v=[^"']+/.test(html));
assert(html.includes("categoryTaxonomy:selectedMaturityCategoryTaxonomy()"));

const research=html.indexOf("{ kind: 'label',  text: 'Research' }");
const frames=html.indexOf("{ kind: 'group',  id: 'frames'",research);
const canvas=html.indexOf("{ kind: 'canvas-tabs', id: 'canvas'",research);
assert(research>=0&&frames>research&&canvas>frames,'Canvas must be an expandable group below Research > Frames.');
assert(html.includes("const open=!!state.navOpen.canvas"));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: Product Aware owns landing pages and Canvas is nested beneath Research > Frames.');
