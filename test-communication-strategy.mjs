import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert(html.includes("const COMMUNICATION_STRATEGY_TAB = 'Strategy 1 — Communication Strategy'"));
assert(html.includes("tabButton(COMMUNICATION_STRATEGY_TAB, 'Communication Strategy')"));
assert(html.includes('COMMUNICATION_STRATEGY_TAB, BRAND_RADAR_TAB, CONTENT_TAB'));
assert(html.includes("const isCommunication = state.tab === COMMUNICATION_STRATEGY_TAB"));
assert(html.includes("if (isCommunication) renderCommunicationStrategy()"));
assert(html.includes("source.onclick = () => switchTab(POSITIONING_DOCUMENT_TAB)"));
assert(html.includes("framework.onclick = () => switchTab('Messaging Framework')"));

for (const awareness of ['Competitor-aware','Category-aware','Solution-aware','Problem-aware'])
  assert(html.includes(awareness), 'missing awareness message ' + awareness);
for (const signal of ['Trust','Accuracy','Reliability'])
  assert(html.includes("newCommunicationAxis('" + signal + "')"), 'missing default signal ' + signal);

assert(html.includes('.comm-stump{position:relative;'));
assert(html.includes('perspective:800px'));
assert(html.includes("add.textContent = '+ Add stump'"));
assert(html.includes("model.perceptions.push(newCommunicationPerception('New Brand Perception'))"));
assert(html.includes("model.factors.push(newCommunicationFactor())"));
assert(html.includes("stage.querySelectorAll('[data-comm-perception]')"));
assert(html.includes("stage.querySelectorAll('[data-comm-factor]')"));
assert(/COMMUNICATION_STRATEGY_TAB,[\s\S]{0,120}BRAND_RADAR_TAB\]\.indexOf\(state\.tab\) === -1/.test(html));

console.log('PASS: product-scoped Communication Strategy canvas, linked sources, four awareness messages, editable factors, wires and configurable 3D perception stumps.');
