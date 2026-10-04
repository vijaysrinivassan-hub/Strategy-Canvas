import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const prompts = JSON.parse(readFileSync(new URL('./ai-prompts.json', import.meta.url), 'utf8'));
const tools = readFileSync(new URL('./mcp-server/src/tools/architecture.ts', import.meta.url), 'utf8');

assert.match(html, /function dataPlatformMaturityArchitecture\(\)/);
assert.ok(html.includes('const uninitializedMaturity = tabKey === MATURITY_ACCESS_TAB'));
assert.ok(html.includes("if (tabKey === MATURITY_ACCESS_TAB && (!architecture || uninitializedMaturity)) architecture = dataPlatformMaturityArchitecture();"));
assert.match(html, /const MATURITY_DEPARTMENT_TEMPLATES/);
assert.match(html, /function maturityDepartmentsFor\(architecture\)/);
assert.match(html, /function maturityIndustriesFor\(architecture\)/);
assert.match(html, /function isAiDataIndustryContext\(architecture\)/);
assert.match(html, /function maturityIndustryConfiguration\(\)/);
assert.match(html, /const MATURITY_INDUSTRY_PROMPT/);
assert.match(html, /architecture\.industryPromptRevision = 2/);
assert.match(html, /function renderMaturityDepartments\(architecture, ro\)/);
for (const department of ['Marketing','Inventory Management','Technical SEO / AEO','Incident Response','GRC'])
  assert.ok(html.includes("'" + department + "'"), 'missing department ' + department);
assert.ok(html.includes('id="maturityDepartments"'));
assert.ok(html.includes('maturity-department-buttons'));
assert.ok(html.includes('Single Industry'));
assert.ok(html.includes('Multi-industry'));
assert.ok(html.includes("return ['E-commerce']"));
assert.ok(html.includes("if (!ro && architecture.industryMode==='multi')"));
assert.ok(html.includes("architecture.industries=['E-commerce']"));
assert.ok(html.includes("architecture.aiDataIndustryCleanupRevision=1"));
assert.ok(html.includes('Do not add raw material, input types, descriptions, maps or nested product sections.'));
for (const stage of ['L1 - Reporting', 'L2 - Analysis', 'L3 - Forecasting', 'L4 - Optimization'])
  assert.ok(html.includes(stage), 'missing maturity row ' + stage);
for (const field of ['processRole', 'pillarState', 'actorType', 'capabilities'])
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
for (const phrase of ['PILLAR PROCESS', 'SUPPORTING PROCESS', 'Features when the actor is technology', 'Departments and Industries', 'Single Industry', 'Multi-industry', 'maturity_axis_set'])
  assert.ok(prompts.maturity_axis.prompt.includes(phrase), 'prompt missing ' + phrase);
assert.ok(!prompts.maturity_axis.prompt.includes('define department maps'));
assert.ok(!prompts.maturity_axis.prompt.includes('major input types'));

assert.match(tools, /registerTool\('maturity_axis_get'/);
assert.match(tools, /registerTool\('maturity_axis_set'/);
assert.match(tools, /current\.length!==1/);
assert.match(tools, /replacementSelected:z\.boolean\(\)\.optional\(\)/);
assert.match(tools, /departments:z\.array\(z\.string\(\)\)\.optional\(\)/);
assert.match(tools, /industries:z\.array\(z\.string\(\)\)\.optional\(\)/);
assert.match(tools, /industryMode:z\.enum\(\['single','multi'\]\)\.optional\(\)/);
assert.match(tools, /activeIndustry:z\.string\(\)\.optional\(\)/);
assert.match(tools, /departments:architecture\.departments/);
assert.match(tools, /Preserve Departments and Industries as simple name lists/);
assert.match(tools, /Show department columns once, then industry columns/);
assert.match(tools, /Never duplicate department columns for an industry/);
assert.match(tools, /A replacement process can only be selected inside a selected maturity row/);
assert.match(tools, /section === 'maturity_axis' \? MATURITY_TAB/);
console.log('maturity axis tests passed');
