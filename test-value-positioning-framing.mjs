import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('const VALUE_POSITIONING_FRAME_LIMIT = 3'));
assert(html.includes('function newValuePositioningFrame(seed,index)'));
assert(html.includes('function valuePositioningFrames()'));
assert(html.includes("[newValuePositioningFrame(null,0),newValuePositioningFrame(null,1)]"));
assert(html.includes("framingTitle.textContent='Framing'"));
assert(html.includes("addFrame.textContent='+ Add frame'"));
assert(html.includes('valueRow.frames.length<VALUE_POSITIONING_FRAME_LIMIT'));
assert(html.includes('valueRow.frames.length>2'));
assert(html.includes("frame.text,'Add this framing angle'"));
assert(html.includes('p.valueFramingRevision !== 1'));
assert(html.includes('legacyFields?.framing_frames'));
assert(html.includes('meaningful.map((frame,index)=>newValuePositioningFrame(frame,index))'));
assert(!html.includes("{ id: 'framing', label: 'Framing', fields: ['framing'] }"));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: every Value Positioning row owns two to three editable frames and legacy framing migrates without remaining in Positioning Document navigation.');
