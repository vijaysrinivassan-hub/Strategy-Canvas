import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('id="gtmOnboardingSteps"'));
assert(html.includes('id="gtmOnboardingPanel"'));
assert(html.includes('id="gtmWorkspace" hidden'));
assert(html.includes("t.guide.onboarding = { activeStep: 'product', locked: {} }"));
for(const id of ['product','industries','market','channels']){
  assert(html.includes(`id:'${id}'`),`missing ${id} onboarding step`);
}
assert(!html.includes("id:'company', label:'Company'"));
assert(!html.includes("id:'setup', label:'GTM setup'"));
assert(html.includes("if (onboarding.activeStep === 'company') onboarding.activeStep='product'"));
assert(html.includes("description.placeholder='Enter the product source text, description, notes, or other onboarding context'"));
assert(html.includes("product.description=description.value"));
assert(!html.includes("id:'icp', label:'Primary ICP'"));
assert(html.includes("type:'products'"));
assert(html.includes("type:'industries'"));
assert(html.includes("type:'market'"));
assert(html.includes("type:'channels'"));
assert(html.includes("if (t.products.length >= 3){ toast('This GTM flow supports up to 3 products.'"));
assert(html.includes("$('btnAddGtmProduct').hidden = readOnly() || t.products.length >= 3"));
assert(html.includes("fit.id='gtmIndustryFit'"));
assert(!html.includes('function renderGtmSetupStep(host, locked, ro)'));
assert(html.includes('function renderGtmIndustryStep(host, locked, ro)'));
assert(html.includes("if (['setup','industry','goal','sales_motion','icp'].includes(onboarding.activeStep)) onboarding.activeStep='industries'"));
assert(html.includes("active.type==='industries'?'Shared with Maturity Axis and Positioning Canvas'"));
assert(!html.includes('<section class="gtm-market-system" aria-labelledby="gtmMarketSystemTitle">'));
for(const activity of ['AI visibility and citation audit','Prompt and answer monitoring','Entity and topical authority','Answer-ready content','Citation and mention building','Schema and technical readiness']){
  assert(html.includes(`'${activity}'`),`missing AEO activity: ${activity}`);
}
assert(html.includes("action.textContent=locked?'Edit answer':'Lock & continue'"));
assert(html.includes("const sourceLabel=active.type==='market'"));
assert(html.includes("$('gtmWorkspace').hidden=!complete && !ro"));
assert(html.includes('if (!validateGtmOnboardingStep(active,control)) return;'));
assert(html.includes("if (state.screen === 'board' && (state.tab === STRATEGY_ONE_TAB || state.tab === CHANNELS_TAB))"));

const prompts=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8'));
const gtmPrompt=prompts.gtm_strategy_seo?.prompt || '';
assert(gtmPrompt.includes('attached DOZ requirements prompt'));
assert(gtmPrompt.includes('attached first-output prompt'));
assert(gtmPrompt.includes('between one and three named products'));
assert(gtmPrompt.includes('do not create a separate Company onboarding step'));
assert(gtmPrompt.includes('supplied source text, description, notes'));
assert(gtmPrompt.includes('Single Industry or Multi Industry'));
assert(gtmPrompt.includes('Do not create a separate Primary ICP onboarding step'));
assert(gtmPrompt.includes('Treat the selling component/buying component choice and the 4x4 market matrix as one step'));
assert(gtmPrompt.includes('compact B2B/B2C switch'));
assert(gtmPrompt.includes('Choose Inbound, Outbound or both'));
assert(gtmPrompt.includes('If AEO is selected'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: GTM onboarding supports product text, shared industry mode, B2B/B2C market examples, channels and AEO workstreams without Company or GTM Setup steps.');
