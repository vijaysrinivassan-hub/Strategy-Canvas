import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

assert(html.includes("const COMMUNICATION_STRATEGY_TAB = 'Strategy 1 — Communication Strategy'"));
assert(!html.includes("tabButton(COMMUNICATION_STRATEGY_TAB, 'Communication Strategy')"));
assert(html.includes('COMMUNICATION_STRATEGY_TAB, BRAND_RADAR_TAB, CONTENT_TAB'));
assert(html.includes("const isCommunication = isPositioningDocument && activePositioningDocumentSection().id === 'communication_strategy'"));
assert(html.includes("if (isCommunication) renderCommunicationStrategyCanvas()"));
assert(html.includes("framework.onclick = () => openPositioningDocumentField('messaging_framework')"));
assert(html.includes("{ id: 'communication_strategy', label: 'Communication Strategy', fields: [], view: 'communication' }"));
assert(html.includes("$('positioningDocumentPage').append($('communicationPane'))"));

for (const awareness of ['Competitor-aware','Category-aware','Solution-aware','Problem-aware'])
  assert(html.includes(awareness), 'missing awareness message ' + awareness);
for (const factor of ['Writing Style','Framing','Buying Trigger','Offer'])
  assert(html.includes(factor), 'missing fixed messaging input ' + factor);

assert(html.includes('.comm-stump{position:absolute; left:50%; bottom:0; width:1px;'));
assert(html.includes('.comm-wicket::after'));
assert(html.includes('.comm-wicket-stage{height:220px; margin-top:10px; perspective:none}'));
assert(html.includes('function renderCommunicationStrategyCanvas()'));
assert(html.includes("['competitive_positioning','Competitive Positioning']"));
assert(html.includes("['value_positioning','Value Positioning']"));
assert(html.includes("['category_positioning','Category Positioning']"));
assert(html.includes("['icp_positioning','ICP Positioning']"));
assert(html.includes("['Problem-aware','Solution-aware','Category-aware','Competitor-aware']"));
assert(html.includes('.comm-stage{width:2400px; min-height:1200px; margin:0; overflow:visible}'));
assert(html.includes('.comm-positioning-sources{position:absolute;'));
assert(html.includes("fragments.forEach(fragment => add(fragment,framework,'right','left'"));
assert(html.includes('function makeCommunicationNodeDraggable(element,key,model)'));
assert(html.includes('element.setPointerCapture(event.pointerId)'));
assert(html.includes("model.canvasPositions[key] = { x:Math.round(offsetX), y:Math.round(offsetY) }"));
assert(html.includes("makeCommunicationNodeDraggable(card,'message:' + message.id,model)"));
assert(html.includes("makeCommunicationNodeDraggable(panel,'perception:' + perception.id,model)"));
assert(html.includes('drawCommunicationWires();'));
assert(html.includes("const COMMUNICATION_FACTORS = ['Writing Style','Framing','Buying Trigger','Offer']"));
assert(html.includes('function syncCommunicationPerceptionFrames(model,fields)'));
assert(html.includes("frameId:frame.id,name:frame.label"));
assert(html.includes("axisName.readOnly = true"));
assert(html.includes("axisName.title='Pulled from Positioning Document > Framing'"));
assert(html.includes("sourceHint.textContent='Frames are managed in Positioning Document > Framing.'"));
assert(html.includes(".comm-canvas-node::before,.comm-canvas-node::after{display:none}"));
assert(html.includes("stroke-dasharray:none; pointer-events:stroke; cursor:pointer"));
assert(html.includes(".comm-wire.selected{stroke:#202320; stroke-width:3}"));
assert(html.includes("let selectedCommunicationConnector = ''"));
assert(html.includes("if (!Array.isArray(model.deletedConnectors)) model.deletedConnectors = []"));
assert(html.includes("if (event.key !== 'Backspace' && event.key !== 'Delete') return"));
assert(html.includes("model.deletedConnectors.push(selectedCommunicationConnector)"));
assert(html.includes('btnCommAddFactor" type="button" hidden'));
assert(html.includes('btnCommAddPerception" type="button" hidden'));
assert(html.includes(".comm-canvas-framework .comm-framework{display:block; width:100%; min-height:72px"));
assert(html.includes("function communicationPath(from, to, fromSide = 'right', toSide = 'left')"));
assert(html.includes("const startVector = vectors[fromSide] || vectors.right"));
assert(html.includes("const endVector = vectors[toSide] || vectors.left"));
assert(html.includes("fromSide || 'right',toSide || 'left'"));
assert(html.includes("const perceptionWidth = Math.max(340,...model.perceptions.map(perception =>"));
assert(html.includes("panel.style.width = Math.max(340,56 + Math.max(1,perception.axes.length) * 92) + 'px'"));
assert(html.includes("stage.querySelectorAll('[data-comm-perception]')"));
assert(html.includes("stage.querySelectorAll('[data-comm-factor]')"));
assert(html.includes("messageName,name:messageName+' Offer'"));
assert(html.includes("offerTitle.innerHTML='<strong>Offer</strong><span>One per audience state</span>'"));
assert(html.includes("card.dataset.commOffer=offer.id; card.dataset.commMessage=message.id"));
assert(html.includes("add(message,offer,'right','left'"));
assert(html.includes("offerNodes.forEach(offer=>add(offer,perception"));
assert(html.includes("flow.append(sources,frameworkWrap,factorList,messageHub,offerHub,perceptions)"));
assert(html.includes("$('btnCommAddFactor').hidden = true"));
assert(html.includes('.comm-axis-name{top:auto; bottom:-33px;'));
assert(/COMMUNICATION_STRATEGY_TAB,[\s\S]{0,120}BRAND_RADAR_TAB\]\.indexOf\(state\.tab\) === -1/.test(html));

console.log('PASS: Communication Strategy connects positioning directly to fixed messaging inputs, awareness-specific offers and frame-driven perception stumps.');
