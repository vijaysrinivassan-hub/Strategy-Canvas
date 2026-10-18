import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const cards=fs.readFileSync(new URL('./icp-cards.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./icp-cards.css',import.meta.url),'utf8');
const prompts=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8'));
// Use cases are classified on five levels; buying trigger, firmographics and economic buyer form the third row.
for (const key of ['industry','department','process','persona','scenario']) assert(cards.includes("['"+key+"',"), key+' use-case level');
for (const key of ['buyingTrigger','firmographics','economicBuyer']) assert(cards.includes("['"+key+"','"), key+' third-row field');
assert(cards.indexOf('details.append(renderIcpUseCases(icp,ro));')<cards.indexOf('ICP_BUYING_FIELDS.forEach'), 'use cases come before the buying row');
assert(!cards.includes("['industries','Industries'"), 'Industries is now the first use-case level');
assert(html.includes('migrateIcpUseCaseLevels(icp)'), 'old use-case rows migrate to five levels');
assert(!cards.includes("['technographics','Technographics'"), 'technographics are no longer a use-case column');
assert(cards.includes("details.append(renderIcpUseCases(icp,ro));"), 'selected ICP shows the use-case table');
assert(!cards.includes("['useCases','Use Cases'"), 'use cases are no longer a single text box');
assert(html.includes('icp.useCaseRows = String(icp.useCases || \'\').trim()'), 'old use-case text migrates into the first row');
assert(css.includes('.icp-use-cases{grid-column:1/-1'), 'use-case table spans the full card width');
// Every ICP row shows People, Process, Input and Technology; the buying axis is locked and carried from the Maturity Axis.
for (const axis of ["['people','People'","['process','Process'","['input','Input'","['technology','Technology'"]) assert(cards.includes(axis), axis+' axis');
assert(cards.includes("if(key===activeAxis){"), 'the buying axis is locked');
assert(cards.includes("label.textContent=labelText+' · from Maturity Axis';"));
assert(cards.includes('function maturityAxisCarryover(index)'), 'locked value comes from the matching Maturity Axis row');
assert(prompts.positioning_canvas.prompt.includes('one ICP card per Maturity Axis row'));
assert(prompts.positioning_canvas.prompt.includes('Every row shows four axes'));
assert(prompts.positioning_canvas.prompt.includes('Firmographics') && prompts.positioning_canvas.prompt.includes('Economic Buyer'));
assert(prompts.positioning_canvas.prompt.includes('USE CASE LEVELS') && prompts.positioning_canvas.prompt.includes('Interaction / Scenario'));
assert(html.includes('t.icpMaturityPromptRevision !== 5'), 'saved canvas prompts are updated');
// Only the ICP card for the selected Maturity Axis row is filled completely; the others get their first row only.
assert(prompts.positioning_canvas.prompt.includes('FILL DEPTH') && prompts.positioning_canvas.prompt.includes('Every other card gets its first row only'));
assert(prompts.positioning_canvas.prompt.includes('Never erase content that is already there.'));
// People names each role with a headcount and what it does; every use-case cell states the use case, not a bare label.
assert(prompts.positioning_canvas.prompt.includes('how many of them there typically are and what each one does'));
assert(prompts.positioning_canvas.prompt.includes('never a bare label'));
assert(cards.includes("'Industry: what companies in it use the product for'") && cards.includes("'Department: what this team uses it for'"));
console.log('PASS: ICP rows show four axes; use cases classify Industry → Department → Process → Persona → Scenario; buying trigger, firmographics and economic buyer sit in the third row.');
