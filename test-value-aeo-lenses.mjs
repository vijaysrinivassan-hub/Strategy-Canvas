import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
for(const label of ['Process','Output','Outcome','Benefits','Tools'])assert(html.includes(`label:'${label}'`),label);
assert(html.includes('function renderValueMatrixLensToolbar(section,view)'));
assert(html.includes('function renderMatrixTopicCell(host,holder,ro,keywordLens)'));
assert(html.includes("renderMatrixTopicCell(th,col,ro,isValueAeoProcessMatrix?activeValueMatrixLens(v):'')"));
assert(html.includes("renderMatrixTopicCell(num,topicRow,ro || !!keywordStatusFilter.size,isValueAeoProcessMatrix?activeValueMatrixLens(v):'')"));
assert(html.includes("state.contentView==='value'&&state.keywordAwareness==='solution-aware'"));
assert(html.includes('const contentSlots = isValueAeoProcessMatrix ? 4 : 5'));
assert(html.includes("copy.title='Copy all keywords in the selected value layer'"));
assert(html.includes("navigator.clipboard.writeText(words.join('\\n'))"));
assert(html.includes('valueLensKeywords'));
assert(html.includes('valueLensExcludedKeywords'));
assert(html.includes('function valueLensForPageUrl(row,cell)'));
assert(html.includes('function valueLensPageUrls(cell,lens)'));
assert(html.includes("pageUrls.push({ id: uid(), url: '', traffic: '', ...(o.keywordLens?{lens:o.keywordLens}:{}) })"));
assert(!html.includes('Red Ocean'));
assert(!html.includes('Blue Ocean'));
assert(!html.includes('id="oceanSwitcher"'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: Value AEO uses a five-column viewport including the row header, five persistent keyword lenses with copy, and no ocean controls.');
