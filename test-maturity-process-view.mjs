import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const tool = fs.readFileSync(new URL('./mcp-server/src/tools/architecture.ts', import.meta.url), 'utf8');
const prompts = JSON.parse(fs.readFileSync(new URL('./ai-prompts.json', import.meta.url), 'utf8'));

assert(html.includes('id="btnMaturityProcessView"'));
assert(html.includes("processView.textContent = processNode.label + ' · Process view'"));
assert(html.includes('checkedViewNodes.length === 1'));
assert(html.includes('function renderMaturityProcessDetail(system, node, architecture)'));
assert(html.includes("processButton.textContent = processNode.label + (activeViewNode ? ' · Canvas view' : ' · Process view')"));
assert(html.includes("['Descriptive analysis','What happened?']"));
assert(html.includes("['Comparative analysis','Period versus period, segment versus segment, or product versus product.']"));
assert.equal((html.match(/^\s*\['[^']+ analysis'/gm) || []).length, 14);
assert(html.includes("node.subProcesses.push({id:uid(),name:'New sub-process',description:''})"));
assert(html.includes("node.subProcesses.splice(index,1)"));
assert(tool.includes('subProcesses:z.array(z.object'));
assert(prompts.maturity_axis.prompt.includes('editable subProcesses list'));
assert(prompts.maturity_axis.prompt.includes('comparative analysis'));

console.log('PASS: selected Maturity Axis process cards open a row-scoped editable subprocess view with Analysis seeded.');
