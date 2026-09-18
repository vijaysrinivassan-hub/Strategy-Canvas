import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('.arch-flow-board{position:relative; width:max-content; min-width:1060px'));
assert(html.includes('.arch-flow-systems{position:relative; display:flex; flex-direction:row; align-items:flex-start; gap:18px}'));
assert(html.includes('.arch-flow-system{position:relative; flex:0 0 1060px; width:1060px'));
assert(html.includes('.arch-flow-system{flex-basis:920px; width:920px}'));
assert(html.includes("['←','→'].forEach((label, direction) => {"));
assert(html.includes("direction ? 'Move system right' : 'Move system left'"));
assert(!html.includes('.arch-flow-systems{position:relative; display:flex; flex-direction:column'));
console.log('PASS: Product Architecture systems form one horizontally scrollable row with left/right ordering controls.');
