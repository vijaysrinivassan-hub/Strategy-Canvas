import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("['trust_signals', 'Trust Signals']"));
assert(html.includes("['framing', 'Framing']"));
assert(html.includes("navOpen: { strategy1: false, brand: false, content: false, positioningDocument: false"));
assert(html.includes("const documentParent = groupButton('Positioning Document'"));
assert(html.includes("{ id: 'core', label: 'Positioning', fields: POSITIONING_DOCUMENT_CORE_KEYS }"));
assert(html.includes("const documentMenu = document.createElement('div'); documentMenu.className = 'nav-flyout-menu positioning-document-subnav'"));
assert(html.includes("documentMenu.append(subButton(section.label"));
assert(html.includes("POSITIONING_DOCUMENT_FIELDS.filter(field => section.fields.includes(field[0])).forEach(field =>"));
assert(html.includes("positioningDocumentPart: state.positioningDocumentPart || 'core'"));
assert(html.includes("}, false);"));

const tool=fs.readFileSync(new URL('./mcp-server/src/tools/positioning-document.ts',import.meta.url),'utf8');
assert(tool.includes('"trust_signals"'));
assert(tool.includes('"framing"'));
assert(tool.includes('Read the seven narrative fields'));
const prompt=JSON.parse(fs.readFileSync(new URL('./ai-prompts.json',import.meta.url),'utf8')).positioning_document.prompt;
assert(prompt.includes('Trust Signals'));
assert(prompt.includes('Framing'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: Positioning Document uses field sub-navigation and persists Trust Signals and Framing.');
