import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

for (const source of [
  'function keywordCountCellFilled(cell)',
  'function keywordColumnFilledCount(view,pageGroup,columnId)',
  'function keywordColumnCountBadge(view,pageGroup,columnId)',
  'function keywordFilledCounts()',
  'function appendKeywordCount(button, count)',
  'function ensureKeywordCountRepository()'
]) assert.ok(html.includes(source), `missing ${source}`);

assert.ok(html.includes("appendKeywordCount(button, counts[layer.id].total);"));
assert.ok(html.includes("appendKeywordCount(b, counts[viewId].total);"));
assert.ok(html.includes("keywordFilledCounts()[state.keywordAwareness]"));
assert.ok(html.includes("count.className = 'awareness-picker-count'"));
assert.ok(html.includes("count.textContent = String(filledCounts[option.id] || 0) + ' filled cells';"));
assert.ok(html.includes("root.awarenessViews?.['problem-unaware:' + viewId]"));
assert.ok(html.includes("record.awareness === 'category-aware'"));

const start = html.indexOf('function keywordCountCellFilled(cell)');
const end = html.indexOf('function appendKeywordCount(button, count)');
const root = {
  awarenessViews:{'problem-unaware:icp':{rows:[{pageGroup:'informational',cells:{manual:{v:'Manual ICP topic'}}}]}},
  views:{
    icp:{rows:[{pageGroup:'informational',cells:{mapped:{v:'Mapped',repositoryQueries:[{}]}}},{pageGroup:'matrix',cells:{solution:{v:'Solution'}}}]},
    value:{rows:[{pageGroup:'informational',cells:{manual:{pageUrls:[{url:'https://example.com'}]}}}]},
    category:{rows:[{pageGroup:'landing',cells:{manual:{slug:'category-page'}}}]},
    competitor:{cells:{standard:{v:'Reviews'}},comparisonCells:{pair:{repositoryQueries:[{}]}}}
  }
};
const records = [
  {workspace:'ai-data-platform',awareness:'problem-unaware',section:'ICP SEO'},
  {workspace:'ai-data-platform',awareness:'problem-aware',section:'ICP SEO'},
  {workspace:'ai-data-platform',awareness:'solution-aware',section:'Value AEO'},
  {workspace:'ai-data-platform',awareness:'category-aware',section:'Category AEO'}
];
const context = vm.createContext({
  contentRoot:()=>root,
  sharedUrlBoardContext:()=> 'AI Data Platform',
  globalThis:{SharedUrlRepository:{workspaceFor:()=> 'ai-data-platform',records:()=>records}}
});
vm.runInContext(html.slice(start,end),context);
const counts = context.keywordFilledCounts();
assert.deepEqual(JSON.parse(JSON.stringify(counts['problem-unaware'])),{icp:2,value:0,total:2});
assert.deepEqual(JSON.parse(JSON.stringify(counts['problem-aware'])),{icp:1,value:1,total:2});
assert.deepEqual(JSON.parse(JSON.stringify(counts['solution-aware'])),{icp:1,value:0,total:1});
assert.equal(counts.category.total,2);
assert.equal(counts.competitor.total,2);
assert.equal(context.keywordColumnFilledCount(root.views.icp,'informational','mapped'),1);
assert.equal(context.keywordColumnFilledCount(root.views.icp,'matrix','solution'),1);
assert.equal(context.keywordColumnFilledCount(root.views.icp,'matrix','missing'),0);

assert.ok(html.includes("lab.append(b,keywordColumnCountBadge(v,group.id,col.id),columnTools"));
assert.ok(html.includes("heading.append(titleInput,keywordColumnCountBadge(v,group.id,col.id))"));
assert.ok(html.includes("badge.title=count+' filled '+(count===1?'cell':'cells')"));
assert.ok(html.includes('.keyword-column-count{'));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: keyword sidebar and awareness cards expose shared filled-cell counts.');
