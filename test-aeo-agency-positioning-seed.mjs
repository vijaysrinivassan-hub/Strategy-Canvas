import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert(html.includes('function seedAeoAgencyPositioning(p)'));
assert(html.includes("String(state.client || '').trim().toLowerCase() !== 'aeo agency'"));
assert(html.includes("String(state.clientProduct || '').trim().toLowerCase() !== 'answer engine optimization agency'"));
assert(html.includes('if (hasIcp || hasCategory || hasCompetitive) return false'));
assert(html.includes("name:'B2B marketing leaders evolving SEO into AI search'"));
assert(html.includes("name:'Integrated organic growth and AI influence partners'"));
assert(html.includes("competitors:'Proposed position for the AEO Agency'"));
assert(html.includes("p.selectedIcp = ''"));
assert(html.includes("p.selectedCategory = ''"));
assert(html.includes("Object.assign(tab.radar,{axis:'process',sourceAxis:'process',buyingAxis:'process'"));
assert(html.includes('if (seededAeoAgency && !readOnly()) setTimeout(markDirty, 0)'));
assert(!html.includes("p.valueRows = [{functional:'AEO"));

console.log('PASS: guarded AEO Agency positioning seed maps ICPs, categories, competitive evolution and Process-to-Process axes without selecting an ICP/category or populating value rows.');
