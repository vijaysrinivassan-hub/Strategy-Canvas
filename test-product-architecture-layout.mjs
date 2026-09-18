import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('.arch-flow-board{position:relative; width:max-content; min-width:1060px'));
assert(html.includes('.arch-flow-systems{position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:24px;'));
assert(html.includes('.arch-process-layer-track{display:flex; flex-direction:row; align-items:flex-start; gap:18px}'));
assert(html.includes('.arch-flow-system{position:relative; flex:0 0 1060px; width:1060px'));
assert(html.includes('.arch-flow-system{flex-basis:920px; width:920px}'));
assert(html.includes("['←','→'].forEach((label, direction) => {"));
assert(html.includes("direction ? 'Move system right' : 'Move system left'"));
assert(html.includes("if (!['earlier','supporting','pillar'].includes(system.kind)) system.kind = 'pillar'"));
assert(html.includes("{kind:'earlier',title:'Earlier process'"));
assert(html.includes("{kind:'supporting',title:'Supporting processes'"));
assert(html.includes("{kind:'pillar',title:'Pillar processes'"));
assert(html.includes("$('btnArchAddEarlier').onclick = () => addArchitectureProcess('earlier')"));
assert(html.includes("$('btnArchAddSupporting').onclick = () => addArchitectureProcess('supporting')"));
assert(html.includes("$('btnArchAddDomain').onclick = () => addArchitectureProcess('pillar')"));
assert(html.includes("['Operator','people',34],['Spreadsheet / legacy tool','technology',258]"));

const prompt=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8')).product_architecture.prompt;
assert(prompt.includes('Classify each workflow as Earlier, Supporting or Pillar.'));
assert(prompt.includes('Preserve existing current workflows as Pillar'));

const mcp=fs.readFileSync(new URL('./mcp-server/src/tools/architecture.ts',import.meta.url),'utf8');
assert(mcp.includes("kind:z.enum(['earlier','supporting','pillar']).optional()"));
console.log('PASS: Product Architecture layers earlier/supporting/pillar workflows vertically and keeps every layer horizontally scrollable.');
