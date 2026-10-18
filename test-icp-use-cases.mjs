import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const cards=fs.readFileSync(new URL('./icp-cards.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./icp-cards.css',import.meta.url),'utf8');
const prompts=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8'));
// Use cases keep segments, firmographics and the economic buyer; technographics moved to the Technology axis.
for (const key of ['useCase','firmographics','economicBuyer']) assert(cards.includes("['"+key+"',"), key+' column');
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
assert(html.includes('t.icpMaturityPromptRevision !== 2'), 'saved canvas prompts are updated');
console.log('PASS: ICP rows show People, Process, Input and Technology with the buying axis carried from the Maturity Axis; use cases keep firmographics and economic buyer.');
