import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('id="gtmOnboardingSteps"'));
assert(html.includes('id="gtmOnboardingPanel"'));
assert(html.includes('id="gtmWorkspace" hidden'));
assert(html.includes("t.guide.onboarding = { activeStep: 'company', locked: {} }"));
for(const id of ['company','product','industry','goal','sales_motion','icp','market','channels']){
  assert(html.includes(`id:'${id}'`),`missing ${id} onboarding step`);
}
assert(html.includes("type:'products'"));
assert(html.includes("type:'market'"));
assert(html.includes("type:'channels'"));
assert(html.includes("if (t.products.length >= 3){ toast('This GTM flow supports up to 3 products.'"));
assert(html.includes("$('btnAddGtmProduct').hidden = readOnly() || t.products.length >= 3"));
assert(html.includes("fit.id='gtmIndustryFit'"));
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
assert(gtmPrompt.includes('Treat the selling component/buying component choice and the 4x4 market matrix as one step'));
assert(gtmPrompt.includes('Choose Inbound, Outbound or both'));
assert(gtmPrompt.includes('If AEO is selected'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: GTM onboarding supports 1-3 products, one embedded market-system step, inbound/outbound channels and AEO workstreams.');
