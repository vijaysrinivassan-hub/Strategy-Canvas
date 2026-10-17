import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const prompts = JSON.parse(readFileSync(new URL('./ai-prompts.json', import.meta.url), 'utf8'));
const tools = readFileSync(new URL('./mcp-server/src/tools/architecture.ts', import.meta.url), 'utf8');

assert.match(html, /function dataPlatformMaturityArchitecture\(\)/);
assert.ok(html.includes('const uninitializedMaturity = tabKey === MATURITY_ACCESS_TAB'));
assert.ok(html.includes("const aiDataMaturity = isAiDataIndustryContext(architecture || {});"));
assert.match(html, /const uninitializedMaturity = tabKey === MATURITY_ACCESS_TAB && aiDataMaturity &&\s*!architecture\?\.maturityInitialized/);
assert.ok(html.includes("if (tabKey === MATURITY_ACCESS_TAB && (!architecture || uninitializedMaturity) && aiDataMaturity) architecture = dataPlatformMaturityArchitecture();"));
assert.ok(html.includes("architecture.name = 'Maturity Axis';"));
assert.ok(html.includes('architecture.maturityInitialized = true;'));
assert.match(html, /sample === 'blank'\)\{[\s\S]*?architecture\.maturityInitialized = true;/,
  'choosing a blank Maturity Axis must mark it initialized before rendering');
assert.match(html, /const MATURITY_DEPARTMENT_TEMPLATES/);
assert.match(html, /function maturityDepartmentsFor\(architecture\)/);
assert.match(html, /function maturityIndustriesFor\(architecture\)/);
assert.match(html, /function isAiDataIndustryContext\(architecture\)/);
assert.match(html, /function maturityIndustryConfiguration\(\)/);
assert.match(html, /const MATURITY_INDUSTRY_PROMPT/);
assert.match(html, /architecture\.industryPromptRevision = 3/);
assert.match(html, /function renderMaturityDepartments\(architecture, ro\)/);
for (const department of ['Marketing','Inventory Management','Technical SEO / AEO','Incident Response','GRC'])
  assert.ok(html.includes("'" + department + "'"), 'missing department ' + department);
assert.ok(html.includes('id="maturityDepartments"'));
assert.ok(html.includes('maturity-department-buttons'));
assert.ok(html.includes('Single Industry'));
assert.ok(html.includes('Multi-industry'));
assert.ok(html.includes("return ['E-commerce']"));
assert.ok(html.includes("if (!ro && architecture.industryMode==='multi')"));
assert.ok(html.includes('id="positioningIndustryStrip"'));
assert.ok(html.includes('function renderPositioningIndustryStrip(ro)'));
assert.ok(html.includes("pencil.textContent='\\u270e'"));
assert.ok(html.includes('host.append(edit,tabs)'));
assert.match(html, /\.positioning-industry-tabs\{[^}]*justify-content:flex-end/);
assert.ok(html.includes("config.mode==='multi'&&!ro"));
assert.ok(html.includes("architecture.industries=['E-commerce']"));
assert.ok(html.includes("architecture.aiDataIndustryCleanupRevision=1"));
/* Regression: unknown clients must not inherit the AI Data e-commerce model. */
assert.match(html, /function maturityDepartmentsFor\(architecture\)[\s\S]*return \[\];/);
assert.ok(!html.includes('return [...MATURITY_DEPARTMENT_TEMPLATES.platform];\n}\nfunction maturityIndustriesFor'),
  'unknown clients must not fall back to the platform department template');
const departmentStart = html.indexOf('const MATURITY_DEPARTMENT_TEMPLATES = {');
const departmentEnd = html.indexOf('function maturityIndustriesFor(architecture){');
const departmentSource = departmentStart >= 0 && departmentEnd > departmentStart
  ? html.slice(departmentStart, departmentEnd) : '';
assert.ok(departmentSource, 'could not load the maturity department resolver');
const departmentResolver = new Function('state', departmentSource + '\nreturn maturityDepartmentsFor;');
assert.deepEqual(
  departmentResolver({client:'Event Lead Capture Tool',clientProduct:''})({sample:'blank',name:'Maturity Axis'}),
  [],
  'an unknown board must start without the e-commerce departments'
);
assert.deepEqual(
  departmentResolver({client:'AI Data Platform',clientProduct:''})({sample:'data-maturity',name:'Maturity Axis'}),
  ['Marketing','Sales / Revenue','Merchandising','Inventory Management','Operations / Fulfilment','Finance','Customer Support'],
  'the AI Data template must retain its department set'
);
assert.ok(html.includes('Do not add raw material, input types, descriptions, maps or nested product sections.'));
for (const stage of ['L1 - Reporting', 'L2 - Analysis', 'L3 - Forecasting', 'L4 - Optimization'])
  assert.ok(html.includes(stage), 'missing maturity row ' + stage);
for (const card of ['BI / reporting platform','AI analytics platform','Data integration / ETL platform','Cloud data warehouse'])
  assert.ok(html.includes(card), 'missing technology card ' + card);
for (const example of ['Looker / Tableau / Triple Whale / Daasity / Analyst','Fivetran / Airbyte / Airflow'])
  assert.ok(html.includes(example), 'missing actor examples ' + example);
assert.ok(html.includes('architecture.aiDataTechnologyCardsRevision=1'));
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
assert.ok(prompts.maturity_technology_cards?.prompt.includes('Who or what does it?'));
assert.ok(prompts.maturity_technology_cards.prompt.includes('Triple Whale / Daasity'));
assert.ok(prompts.keyword_supporting_processes?.prompt.includes('one aggregate Supporting Processes workspace'));

assert.match(tools, /registerTool\('maturity_axis_get'/);
assert.match(tools, /registerTool\('maturity_axis_set'/);
assert.match(tools, /current\.length!==1/);
assert.match(tools, /replacementSelected:z\.boolean\(\)\.optional\(\)/);
assert.match(tools, /departments:z\.array\(z\.string\(\)\)\.optional\(\)/);
assert.match(tools, /industries:z\.array\(z\.string\(\)\)\.optional\(\)/);
assert.match(tools, /industryMode:z\.enum\(\['single','multi'\]\)\.optional\(\)/);
assert.match(tools, /maturityInitialized:z\.boolean\(\)\.optional\(\)/);
assert.match(tools, /activeIndustry:z\.string\(\)\.optional\(\)/);
assert.match(tools, /departments:architecture\.departments/);
assert.match(tools, /Preserve Departments and Industries as simple name lists/);
assert.match(tools, /Industries belong in Solution Aware ICP AEO under Industry Pages/);
assert.match(tools, /never receives industry columns/);
assert.match(tools, /A replacement process can only be selected inside a selected maturity row/);
assert.match(tools, /section === 'maturity_axis' \? MATURITY_TAB/);
assert.match(tools, /maturityInitialized:true/);
console.log('maturity axis tests passed');
