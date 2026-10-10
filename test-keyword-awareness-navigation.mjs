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
assert.ok(html.includes('const AWARENESS_VALUE_AEO_REVISION=2'));
assert.ok(html.includes('function ensureAwarenessValueAeoMatrices(root)'));
assert.ok(html.includes('function cloneValueAeoStructure(source)'));
assert.ok(html.includes('function restoreLegacyValueContent(structure,legacy)'));
assert.ok(html.includes('restoreLegacyValueContent(cloneValueAeoStructure(projection.views.value),legacy)'));
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

const migrationContext = vm.createContext({
  normalizePageUrls: rows => Array.isArray(rows) ? rows : [],
  normalizeValueLensKeywordMap: value => value && typeof value === 'object' ? value : {},
  normalizeValueLensStatusMap: value => value && typeof value === 'object' ? value : {},
  keywordCountCellFilled: cell => !!(cell && (cell.v || cell.url || cell.repositoryQueries?.length || cell.pageUrls?.length || cell.kws?.length))
});
vm.runInContext(html.slice(html.indexOf('const AWARENESS_VALUE_AEO_REVISION=2;'),html.indexOf('function matrixState(){')),migrationContext);
const solution = {
  activeValueMatrixLens:'tools',
  pageColumns:{matrix:[{id:'marketing',name:'Marketing',topicCell:{v:'Copied header value',kws:['solution-header']}}]},
  pageOrders:{matrix:['marketing']},
  rows:[{id:'marketing-performance',name:'Marketing-performance analysis',pageGroup:'matrix',processLevel:'subprocess',topicCell:{v:'Copied row value',kws:['solution-row']},cells:{marketing:{v:'Solution value',url:'https://solution.example',st:'for_review',kws:['solution-keyword'],repositoryQueries:[{topicGroup:'solution'}]}}}]
};
const legacy = {rows:[{name:'Marketing Analytics',cells:{explainers:{v:'Original destination value',repositoryQueries:[{hierarchy:'Marketing Analytics',axis:'Explainers',topicGroup:'original-url'}],st:'for_review'}}}]};
const structured = migrationContext.cloneValueAeoStructure(solution);
assert.equal(structured.rows[0].cells.marketing.v,'');
assert.equal(structured.rows[0].topicCell,undefined);
const restored = migrationContext.restoreLegacyValueContent(structured,legacy);
assert.equal(restored.rows[0].cells.marketing.v,'Original destination value');
assert.deepEqual(JSON.parse(JSON.stringify(restored.rows[0].cells.marketing.repositoryQueries)),[{hierarchy:'Marketing Analytics',axis:'Explainers',topicGroup:'original-url'}]);
assert.ok(!JSON.stringify(restored).includes('Solution value'));
assert.ok(!JSON.stringify(restored).includes('solution-keyword'));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: full-page awareness destinations, traffic-goal choices, Value AEO routing, independent awareness data, and persistence.');
