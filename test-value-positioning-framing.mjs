import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(!html.includes('const VALUE_POSITIONING_FRAME_LIMIT'));
assert(!html.includes("framingTitle.textContent='Framing'"));
assert(!html.includes('data-value-framing'));
assert(html.includes("{ id: 'framing', label: 'Perception and Framing', fields: ['framing'] }"));
assert(html.includes("const IDEAL_BRAND_PERCEPTION_ID = 'ideal_brand_perception'"));
assert(html.includes("const DEFAULT_FRAMING_COUNT = 2"));
assert(html.includes("const FRAMING_NAME_PLACEHOLDERS = ['Brand Level Framing','Capability, Value, Category']"));
assert(html.includes("idealButton.textContent='Ideal Brand Perception'"));
assert(html.includes("label.textContent='Brand Level Framing'"));
assert(html.includes("frameName.placeholder=framingFramePlaceholder(frameIndex)"));
assert(html.includes("fields.framing_frames.push({id,label:'',text:''})"));
assert(html.includes('positioning.valueFramingRevision !== 2'));
assert(html.includes('(Array.isArray(row.frames)?row.frames:[])'));
assert(html.includes('delete row.frames'));
assert(html.includes("const defaultNames=['capability','value','category']"));
assert(html.includes('tab.fields.framing_frames.splice(1,3,combined)'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: per-value framing is removed, migrated and restored as Ideal Brand Perception plus brand-level and placeholder-named frames.');
