import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const flow=fs.readFileSync(new URL('./onboarding-flow.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./onboarding-flow.css',import.meta.url),'utf8');
/* The Onboarding Form is one flow: a strategy-progress bar, a step rail, one question per screen. */
for(const id of ['gtmOnboarding','obfJourney','gtmOnboardingSteps','gtmOnboardingPanel']) assert(html.includes(`id="${id}"`),`missing #${id}`);
assert(html.includes('id="gtmWorkspace" hidden'));
assert(html.includes('<script src="onboarding-flow.js"></script>') && html.includes('<link rel="stylesheet" href="onboarding-flow.css">'));
assert(html.indexOf('<script src="onboarding-flow.js">')<html.indexOf("const PRODUCT_ARCHITECTURE_TAB = "),'the flow loads before the main script');
assert(html.includes('Tell us what you have and what you want. Then the AI builds the rest of the strategy, one stage at a time.'));
assert(!html.includes('function renderGtmOnboarding(') && flow.includes('function renderGtmOnboarding(){'),'one onboarding renderer, in onboarding-flow.js');
/* Four steps: A · What you have (Products), B · What you want (Market system, Market map), then Review & hand-off. */
for(const [id,group,label] of [['product','have','Products'],['market','want','Market system'],['market_mapping','want','Market map'],['review','review','Review & hand-off']])
  assert(flow.includes(`{id:'${id}',group:'${group}',label:'${label}'`),`missing step ${label}`);
for(const text of ['A · What you have','B · What you want','About 15 minutes']) assert(flow.includes(text));
/* Main goal and sales motion are two small questions on the Products step; ICPs, ocean and departments are not asked. */
assert(flow.includes("['Customer Acquisition','Win new customers'") && flow.includes("['Brand Perception','Change how you’re seen'"));
assert(flow.includes("['slg','Sales-led (SLG)'") && flow.includes("['plg','Product-led (PLG)'"));
for(const gone of ['+ Add ICP','Red Ocean','Blue Ocean','renderMaturityDepartments','Departments']) assert(!flow.includes(gone),`onboarding should not ask about ${gone}`);
/* Strategy progress: five stages with a percentage each, read from saved board data. */
for(const stage of ["['onboarding','Onboarding','you fill']","['product','Product architecture']","['maturity','Maturity axis']","['canvas','Positioning canvas']","['document','Positioning document']"]) assert(flow.includes(stage));
assert(flow.includes('function obfStagePercents()') && flow.includes('POSITIONING_DOCUMENT_FIELDS.filter('));
/* Market map: business type, industries, company size and countries; each country × size is a dot on awareness × value. */
for(const label of ["obfRow('Business type'","obfRow('Industries'","obfRow('Company size'","obfRow('Countries'"]) assert(flow.includes(label));
assert(flow.includes("[['enterprise','Enterprise'],['mid','Mid-market'],['smb','Small business']]"));
assert(flow.includes('function obfSegments(onboarding)') && flow.includes('function obfEstimate(segment)'));
assert(flow.includes("onboarding.marketMap.positions[segment.key]={x:") && flow.includes("source:'you'"),'a dragged dot keeps its place');
assert(flow.includes('dot.ondblclick=') && flow.includes('dot.onkeydown='),'dots reset on double-click and move with the arrow keys');
for(const text of ['↑ More value delivered','Least aware','Most aware →','What you give, minus what they pay and expect.']) assert(flow.includes(text));
assert(!flow.includes('recommended') && !flow.includes('Win head-on'),'the picture shows the trade-off without picking a quadrant');
/* Review: summary of both halves, then the AI stages; confirming marks onboarding done. */
assert(flow.includes("'Confirm & start building'") && flow.includes('onboarding.confirmed=true'));
assert(flow.includes("['maturity','Maturity axis','AI lays out the maturity levels; then you pick the one to target.','AI + you']"));
assert(css.includes('.obf-body{display:grid;grid-template-columns:262px minmax(0,1fr)') && css.includes('.obf-plot{position:relative'));
assert(css.includes('.obf button{white-space:normal'),'board button defaults are overridden inside the flow');
assert(html.includes("t.guide.onboarding = { activeStep: 'product', locked: {} }"));
assert(html.includes("if (onboarding.activeStep === 'company') onboarding.activeStep='product'"));
assert(html.includes("if (t.products.length >= 3){ toast('This GTM flow supports up to 3 products.'"));
assert(html.includes("$('btnAddGtmProduct').hidden = readOnly() || t.products.length >= 3"));
for(const activity of ['AI visibility and citation audit','Prompt and answer monitoring','Entity and topical authority','Answer-ready content','Citation and mention building','Schema and technical readiness']){
  assert(html.includes(`'${activity}'`),`missing AEO activity: ${activity}`);
}
assert(html.includes("{ kind: 'tab',    name: 'Channel Strategy', label: 'GTM Strategy' }"));
assert(html.includes("box.append(tabButton(STRATEGY_ONE_TAB, 'Onboarding Form'))"));
assert(html.includes('function renderChannelFrame()'));
assert(html.includes('renderGtmChannelsStep(host,false,readOnly(),renderChannelFrame)'));
new vm.Script(flow);

const prompts=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8'));
const gtmPrompt=prompts.gtm_strategy_seo?.prompt || '';
assert(gtmPrompt.includes('attached DOZ requirements prompt'));
assert(gtmPrompt.includes('attached first-output prompt'));
assert(gtmPrompt.includes('between one and three named products'));
assert(gtmPrompt.includes('do not create a separate Company onboarding step'));
assert(gtmPrompt.includes('supplied source text, description, notes'));
assert(gtmPrompt.includes('Single Industry or Multi Industry'));
assert(gtmPrompt.includes('Do not create a separate Primary ICP onboarding step'));
assert(gtmPrompt.includes('Treat the selling component/buying component choice, the compact GTM question panel and the 4x4 market matrix as one step'));
assert(gtmPrompt.includes('Do not create standalone GTM Setup, Industries or Channels steps'));
assert(gtmPrompt.includes('compact B2B/B2C switch'));
assert(gtmPrompt.includes('Do not create or display a separate dotted GTM strategy canvas beneath the onboarding flow'));
assert(gtmPrompt.includes('Do not create standalone GTM Setup, Industries or Channels steps'));
assert(gtmPrompt.includes('RESEARCH > GTM STRATEGY'));
assert(gtmPrompt.includes('Manage Channels outside the Onboarding Form'));
assert(gtmPrompt.includes('Choose Inbound, Outbound or both'));
assert(gtmPrompt.includes('If AEO is selected'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: Onboarding is four steps (Products, Market system, Market map, Review) with strategy progress; Research GTM Strategy owns the channel controls.');
