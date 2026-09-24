import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert(html.includes("const COMMUNICATION_STRATEGY_TAB = 'Strategy 1 — Communication Strategy'"));
assert(html.includes("tabButton(COMMUNICATION_STRATEGY_TAB, 'Communication Strategy')"));
assert(html.includes('COMMUNICATION_STRATEGY_TAB, BRAND_RADAR_TAB, CONTENT_TAB'));
assert(html.includes("const isCommunication = state.tab === COMMUNICATION_STRATEGY_TAB"));
assert(html.includes("if (isCommunication) renderCommunicationStrategyCanvas()"));
assert(html.includes("source.onclick = () => switchTab(POSITIONING_DOCUMENT_TAB)"));
assert(html.includes("framework.onclick = () => switchTab('Messaging Framework')"));

for (const awareness of ['Competitor-aware','Category-aware','Solution-aware','Problem-aware'])
  assert(html.includes(awareness), 'missing awareness message ' + awareness);
for (const signal of ['Trust','Accuracy','Reliability'])
  assert(html.includes("newCommunicationAxis('" + signal + "')"), 'missing default signal ' + signal);

assert(html.includes('.comm-stump{position:absolute; left:50%; bottom:0; width:1px;'));
assert(html.includes('.comm-wicket::after'));
assert(html.includes('.comm-wicket-stage{height:220px; margin-top:10px; perspective:none}'));
assert(html.includes("add.textContent = '+ Add signal'"));
assert(html.includes('function renderCommunicationStrategyCanvas()'));
assert(html.includes("['competitive_positioning','Competitive Positioning']"));
assert(html.includes("['value_positioning','Value Positioning']"));
assert(html.includes("['category_positioning','Category Positioning']"));
assert(html.includes("['icp_positioning','ICP Positioning']"));
assert(html.includes("['Problem-aware','Solution-aware','Category-aware','Competitor-aware']"));
assert(html.includes('.comm-stage{width:2400px; min-height:1200px; margin:0; overflow:visible}'));
assert(html.includes('.comm-positioning-sources{position:absolute;'));
assert(html.includes('positioningFragments.forEach(fragment => add(fragment,positioning'));
assert(html.includes('function makeCommunicationNodeDraggable(element,key,model)'));
assert(html.includes('element.setPointerCapture(event.pointerId)'));
assert(html.includes("model.canvasPositions[key] = { x:Math.round(offsetX), y:Math.round(offsetY) }"));
assert(html.includes("makeCommunicationNodeDraggable(card,'message:' + message.id,model)"));
assert(html.includes("makeCommunicationNodeDraggable(panel,'perception:' + perception.id,model)"));
assert(html.includes('drawCommunicationWires();'));
assert(html.includes("model.perceptions.push(newCommunicationPerception('New Brand Perception'))"));
assert(html.includes("model.factors.push(newCommunicationFactor())"));
assert(html.includes(".comm-canvas-node::before,.comm-canvas-node::after{display:none}"));
assert(html.includes("stroke-dasharray:none; pointer-events:stroke; cursor:pointer"));
assert(html.includes(".comm-wire.selected{stroke:#202320; stroke-width:3}"));
assert(html.includes("let selectedCommunicationConnector = ''"));
assert(html.includes("if (!Array.isArray(model.deletedConnectors)) model.deletedConnectors = []"));
assert(html.includes("if (event.key !== 'Backspace' && event.key !== 'Delete') return"));
assert(html.includes("model.deletedConnectors.push(selectedCommunicationConnector)"));
assert(html.includes("btnCommAddFactor\" type=\"button\">+ Node"));
assert(html.includes("prompt('Node name','New node')"));
assert(html.includes("newCommunicationFactor(label)"));
assert(html.includes(".comm-canvas-framework .comm-framework{display:block; width:100%; min-height:72px"));
assert(html.includes("stage.querySelectorAll('[data-comm-perception]')"));
assert(html.includes("stage.querySelectorAll('[data-comm-factor]')"));
assert(/COMMUNICATION_STRATEGY_TAB,[\s\S]{0,120}BRAND_RADAR_TAB\]\.indexOf\(state\.tab\) === -1/.test(html));

console.log('PASS: movable Communication Strategy canvas with clean notes, contained labels, addable nodes, solid selectable wires and Backspace deletion.');
