import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const prompts = JSON.parse(readFileSync(new URL('./ai-prompts.json', import.meta.url), 'utf8'));
const tools = readFileSync(new URL('./mcp-server/src/tools/architecture.ts', import.meta.url), 'utf8');

assert.match(html, /function dataPlatformMaturityArchitecture\(\)/);
assert.match(html, /function maturityDepartmentTemplates\(\)/);
assert.match(html, /function renderMaturityDepartments\(architecture, ro\)/);
for (const map of ['Platform','Agency','SOC Platform']) assert.ok(html.includes("name:'" + map + "'"));
for (const department of ['Marketing','Inventory Management','Technical SEO / AEO','Incident Response','GRC'])
  assert.ok(html.includes("'" + department + "'"), 'missing department ' + department);
assert.ok(html.includes("id=\"maturityDepartments\""));
for (const stage of ['L1 - Reporting', 'L2 - Analysis', 'L3 - Forecasting', 'L4 - Optimization'])
  assert.ok(html.includes(stage), 'missing maturity row ' + stage);
for (const field of ['processRole', 'pillarState', 'actorType', 'nodalBenefit', 'capabilities'])
  assert.ok(html.includes(field), 'missing maturity field ' + field);
assert.match(html, /data-process-role="supporting"/);
assert.match(html, /data-pillar-state="inherited"/);
assert.match(html, /data-pillar-state="current"/);
assert.match(html, /maturity-row-check/);
assert.match(html, /maturity-replace-check/);
assert.match(html, /node\.replacementSelected = replaceCheckbox\.checked/);
assert.match(html, /if \(!system\.selected\).*replacementSelected = false/s);
assert.match(html, /state\.tab === MATURITY_ACCESS_TAB \? 'maturity_axis'/);

assert.ok(prompts.maturity_axis?.prompt);
for (const phrase of ['PILLAR PROCESS', 'SUPPORTING PROCESS', 'Nodal benefits', 'department map', 'raw material', 'maturity_axis_set'])
  assert.ok(prompts.maturity_axis.prompt.includes(phrase), 'prompt missing ' + phrase);

assert.match(tools, /registerTool\('maturity_axis_get'/);
assert.match(tools, /registerTool\('maturity_axis_set'/);
assert.match(tools, /current\.length!==1/);
assert.match(tools, /replacementSelected:z\.boolean\(\)\.optional\(\)/);
assert.match(tools, /departments:z\.array\(z\.object/);
assert.match(tools, /department_maps:architecture\.departments/);
assert.match(tools, /A replacement process can only be selected inside a selected maturity row/);
assert.match(tools, /section === 'maturity_axis' \? MATURITY_TAB/);
console.log('maturity axis tests passed');
