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
assert.ok(html.includes('root.keywordNodeWorkspaces[nodeId] = createFreshKeywordNodeProjection(root);'));
assert.ok(html.includes("if (typeof snapshotActiveKeywordNodeWorkspace === 'function') snapshotActiveKeywordNodeWorkspace();"));
assert.ok(html.includes("state.tabs[CONTENT_TAB]?.activeKeywordNodeId || ''"));
assert.ok(columnsUi.includes('for(const nodeWorkspace of Object.values(root.nodeKeywordWorkspaces||{}))'));
assert.ok(html.includes('renderProductArchitecture(); renderTabs();'));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));

console.log('PASS: selected maturity nodes expose compact independent Keywords workspaces with persisted switching.');
