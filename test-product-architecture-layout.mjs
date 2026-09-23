import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('.arch-flow-board{position:relative; width:max-content; min-width:1060px'));
assert(html.includes('.arch-flow-systems{position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:24px;'));
assert(html.includes('.arch-system-row{position:relative; display:flex; flex-direction:row; align-items:flex-start; gap:18px;'));
assert(html.includes('.arch-flow-system{position:relative; flex:0 0 1060px; width:1060px'));
assert(html.includes('.arch-flow-system{flex-basis:920px; width:920px}'));
assert(html.includes("['←','→'].forEach((label, direction) => {"));
assert(html.includes("direction ? 'Move system right' : 'Move system left'"));
assert(html.includes("add.textContent = '+ Add process'"));
assert(html.includes("const nextRow = architecture.systems.length ? Math.max(...architecture.systems.map(system => system.row)) + 1 : 0"));
assert(html.includes("const MATURITY_ACCESS_TAB = 'Strategy 1 — Maturity Axis'"));
assert(html.includes("box.append(tabButton(MATURITY_ACCESS_TAB, 'Maturity Axis'))"));
assert(html.includes('const isArchitecture = isArchitectureTab(state.tab)'));
assert(html.includes('const tabKey = activeArchitectureTab()'));
assert(html.includes("architecture.name = 'Maturity Axis'"));
assert(html.includes('tabs[LEGACY_MATURITY_ACCESS_TAB]'));
assert(html.includes('PRODUCT_ARCHITECTURE_TAB, MATURITY_ACCESS_TAB, POSITIONING_TAB'));
assert(!html.includes('Earlier process'));
assert(!html.includes('Supporting processes'));
assert(!html.includes('Pillar processes'));

const mcp=fs.readFileSync(new URL('./mcp-server/src/tools/architecture.ts',import.meta.url),'utf8');
assert(mcp.includes('row:z.number().int().min(0).optional()'));
console.log('PASS: Product Architecture canvases form horizontal process rows and additional rows stack vertically.');
