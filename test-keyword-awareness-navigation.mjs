import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

for (const label of ['Problem Unaware', 'Problem Aware', 'Solution Aware', 'Category Aware', 'Competitor Aware']){
  assert.ok(html.includes(label), `missing ${label} navigation`);
}
assert.ok(html.includes('function openAwarenessLayer(layer)'));
assert.ok(html.includes('function renderAwarenessPicker()'));
assert.ok(html.includes("{id:'icp', title:'ICP'"));
assert.ok(html.includes("{id:'value', title:'Value'"));
assert.ok(html.includes("keywordMode = id === 'value' || layer === 'solution-aware' ? 'aeo' : 'seo';"));
assert.ok(html.includes("const key = state.keywordAwareness + ':' + state.contentView;"));
assert.ok(html.includes('const AWARENESS_VALUE_AEO_REVISION=1'));
assert.ok(html.includes('function ensureAwarenessValueAeoMatrices(root)'));
assert.ok(html.includes("projection.awarenessViews[key]=JSON.parse(JSON.stringify(projection.views.value))"));
assert.ok(html.includes('root.awarenessValueSeoArchive=archive'));
const repository = fs.readFileSync(new URL('./shared-url-repository.js', import.meta.url), 'utf8');
assert.ok(repository.includes("(options.mode||(awareness==='solution-aware'?'aeo':'seo'))"));
assert.ok(repository.includes("const fixedAiDataValueMatrix=workspace==='ai-data-platform'&&viewId==='value'&&mode==='aeo'"));
assert.ok(html.includes('root.awarenessViews[key] = JSON.parse(JSON.stringify(root.views[state.contentView]));'));
assert.ok(html.includes("{!!state.keywordAwareness") === false);
assert.ok(html.includes("(!!state.keywordAwareness && ['icp','value'].includes(state.contentView))"));
assert.ok(html.includes('keywordAwareness: state.keywordAwareness'));
assert.ok(html.includes('keywordAwarenessPicker: !!state.keywordAwarenessPicker'));
assert.ok(!html.includes('keywordAwarenessOpen'));
assert.ok(!html.includes('awareness-card'));
assert.ok(html.includes("const AWARENESS = ['Bofu Traffic', 'Tofu Traffic', 'Backlinks'];"));
for (const articleType of ['Guides','How-to articles','Explainers','Trends','Topic vs Topic'])
  assert.ok(html.includes(articleType), `missing ${articleType} article type`);
assert.ok(!html.includes("actorRow.className='gr-actor'"));
assert.ok(html.includes('const ICP_SEO_CELL_PREVIEW_LIMIT = 5;'));
assert.ok(html.includes("['problem-unaware','problem-aware'].includes(state.keywordAwareness)"));
assert.ok(html.includes("more.textContent = overflow.expanded ? 'Show fewer cells' : 'Show ' + overflow.remaining + ' more cells';"));
assert.ok(html.includes("keywordGridCellExpansions.add(overflow.expansionKey)"));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: full-page awareness destinations, traffic-goal choices, Value AEO routing, independent awareness data, and persistence.');
