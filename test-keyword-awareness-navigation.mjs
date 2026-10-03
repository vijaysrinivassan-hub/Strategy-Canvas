import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

for (const label of ['Problem Unaware', 'Problem Aware', 'Solution Aware', 'Category-aware', 'Competitor Aware']){
  assert.ok(html.includes(label), `missing ${label} navigation`);
}
assert.ok(html.includes("['icp','value'].forEach(viewId =>"));
assert.ok(html.includes("keywordMode = layer === 'solution-aware' ? 'aeo' : 'seo';"));
assert.ok(html.includes("const key = 'problem-unaware:' + state.contentView;"));
assert.ok(html.includes('root.awarenessViews[key] = JSON.parse(JSON.stringify(root.views[state.contentView]));'));
assert.ok(html.includes("{!!state.keywordAwareness") === false);
assert.ok(html.includes("(!!state.keywordAwareness && ['icp','value'].includes(state.contentView))"));
assert.ok(html.includes('keywordAwareness: state.keywordAwareness'));
assert.ok(html.includes('keywordAwarenessOpen: state.keywordAwarenessOpen'));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: five awareness destinations, two-card layers, mode routing, independent Problem Unaware data, and persistence.');
