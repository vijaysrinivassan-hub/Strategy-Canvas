import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const columnsUi = fs.readFileSync(new URL('./keyword-columns-ui.js', import.meta.url), 'utf8');

assert.ok(html.includes("if (item.text === 'Keywords')"));
assert.ok(html.includes('renderKeywordNodeSwitcher(l);'));
assert.ok(html.includes("node.replacementSelected === true"));
assert.ok(html.includes('function snapshotActiveKeywordNodeWorkspace()'));
assert.ok(html.includes('function createFreshKeywordNodeProjection(root)'));
assert.ok(html.includes('function switchKeywordNode(nodeId)'));
assert.ok(html.includes("const SUPPORTING_KEYWORD_NODE_ID='supporting-processes'"));
assert.ok(html.includes("label:'Supporting Processes'"));
assert.ok(html.includes("node.processRole !== 'supporting'"));
assert.ok(!html.includes("if(nodes.length || (architecture.systems || []).some(system=>system.selected===true))"));
assert.ok(html.includes('function ensureSupportingKeywordWorkspace(root)'));
assert.ok(html.includes('splitSupportingKeywordProjection(projection,terms)'));
assert.ok(html.includes("keywordNodeId:state.tabs[CONTENT_TAB]?.activeKeywordNodeId||''"));
assert.ok(html.includes('supportingTerms:supportingKeywordTerms()'));
const repository = fs.readFileSync(new URL('./shared-url-repository.js', import.meta.url), 'utf8');
assert.ok(html.includes('keyword-columns.js?v=topic-routing-v35'));
assert.ok(html.includes('shared-url-repository.js?v=topic-routing-v29'));
assert.ok(repository.includes("record.classificationRevision||record.nodeId"));
assert.ok(repository.includes("nodeId==='supporting-processes'?supporting:!supporting"));
assert.ok(repository.includes("const scope=[workspace,keywordNodeId||'default',awareness,viewId,mode].join(':')"));
assert.ok(html.includes('root.keywordNodeWorkspaces[nodeId] = createFreshKeywordNodeProjection(root);'));
assert.ok(html.includes("if (typeof snapshotActiveKeywordNodeWorkspace === 'function') snapshotActiveKeywordNodeWorkspace();"));
assert.ok(html.includes("state.tabs[CONTENT_TAB]?.activeKeywordNodeId || ''"));
assert.ok(columnsUi.includes('for(const nodeWorkspace of Object.values(root.nodeKeywordWorkspaces||{}))'));
assert.ok(html.includes('renderProductArchitecture(); renderTabs();'));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: selected maturity nodes expose compact independent Keywords workspaces with persisted switching.');
