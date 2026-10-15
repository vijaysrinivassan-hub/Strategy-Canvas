import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("['trust_signals', 'Trust Signals']"));
assert(html.includes("['framing', 'Framing']"));
assert(html.includes("['usp', 'USP']"));
assert(html.includes("{ id: 'usp', label: 'USP', fields: ['usp'] }"));
assert(html.includes("['offer', 'Offer']"));
assert(html.includes("{ id: 'offer', label: 'Offer', fields: ['offer'] }"));
assert(html.includes("['distribution_plate', 'Distribution Plate', 'distribution']"));
for(const label of ['50 words','100 words','200 words','400 words'])assert(html.includes(`'${label}'`));
assert(html.includes("navOpen: { strategy1: false, brand: false, content: false, positioningDocument: false"));
assert(html.includes("box.append(tabButton(POSITIONING_DOCUMENT_TAB, 'Positioning Document'))"));
assert(html.includes("{ id: 'core', label: 'Positioning', fields: POSITIONING_DOCUMENT_CORE_KEYS }"));
assert(html.includes("{ id: 'brand_radar', label: 'Brand Radar', fields: [], view: 'brand_radar' }"));
assert(html.includes("{ id: 'communication_strategy', label: 'Communication Strategy', fields: [], view: 'communication' }"));
assert(html.includes('class="positioning-document-index-nav" id="positioningDocumentIndex"'));
assert(html.includes('function renderPositioningDocumentNavigation()'));
assert(html.includes("button.onclick = () => openPositioningDocumentField(section.id)"));
assert(!html.includes("const documentMenu = document.createElement('div'); documentMenu.className = 'nav-flyout-menu positioning-document-subnav'"));
assert(!html.includes("box.append(tabButton(COMMUNICATION_STRATEGY_TAB, 'Communication Strategy'))"));
assert(html.includes("POSITIONING_DOCUMENT_FIELDS.filter(field => section.fields.includes(field[0])).forEach(field =>"));
assert(html.includes("positioningDocumentPart: state.positioningDocumentPart || 'core'"));
assert(html.includes("$('positioningDocumentPage').append($('communicationPane'))"));
assert(html.includes('class="positioning-radar-host positioning-document-radar-host" id="positioningRadarHost" hidden'));

const tool=fs.readFileSync(new URL('./mcp-server/src/tools/positioning-document.ts',import.meta.url),'utf8');
assert(tool.includes('"trust_signals"'));
assert(tool.includes('"framing"'));
assert(tool.includes('"usp"'));
assert(tool.includes('"offer"'));
assert(tool.includes('"words_50"'));
assert(tool.includes('"words_400"'));
assert(tool.includes('Read the nine narrative fields and Distribution Plate'));
const prompt=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8')).positioning_document.prompt;
assert(prompt.includes('Trust Signals'));
assert(prompt.includes('Framing'));
assert(prompt.includes('USP'));
assert(prompt.includes('Offer'));
assert(prompt.includes('Distribution Plate'));
for(const length of ['50-word','100-word','200-word','400-word'])assert(prompt.includes(length));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: Positioning Document uses field sub-navigation and persists Trust Signals and Framing.');
