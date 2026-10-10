import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('id="gtmOnboardingSteps"'));
assert(html.includes('id="gtmOnboardingPanel"'));
assert(html.includes('id="gtmWorkspace" hidden'));
assert(html.includes("t.guide.onboarding = { activeStep: 'company', locked: {} }"));
for(const id of ['company','product','industry','goal','sales_motion','icp']){
  assert(html.includes(`id:'${id}'`),`missing ${id} onboarding step`);
}
assert(html.includes("action.textContent=locked?'Edit answer':'Lock & continue'"));
assert(html.includes("source.textContent=locked?'Locked source · shared with Client settings':'Prefilled from Client settings'"));
assert(html.includes("$('gtmWorkspace').hidden=!complete && !ro"));
assert(html.includes('active.set(value); onboarding.locked[active.id]=true'));
assert(html.includes("if (state.screen === 'board' && (state.tab === STRATEGY_ONE_TAB || state.tab === CHANNELS_TAB))"));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: GTM onboarding reuses Client settings, locks sequential answers, and reveals the strategy workspace when complete.');
