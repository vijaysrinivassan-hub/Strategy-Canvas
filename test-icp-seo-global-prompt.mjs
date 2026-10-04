import assert from 'node:assert/strict';
import KeywordColumns from './keyword-columns.js';

const prompt = KeywordColumns.strategyPrompt;
const seeded = KeywordColumns.seed();

assert.equal(KeywordColumns.PROMPT_REVISION, 'keyword-taxonomy-v6');
for (const phrase of [
  'ICP SEO MATRIX — ALL CLIENTS AND PRODUCTS',
  'true two-axis matrix',
  'parent dimension',
  'merged vertical group',
  'horizontal axis',
  'intersection of its correct vertical ICP segment and horizontal topic bucket',
  'every existing and future client',
  'copy the layout rule, never another client\'s labels or content',
  'compact populated cells upward',
]) assert.ok(prompt.includes(phrase), `shared prompt missing: ${phrase}`);

assert.ok(seeded.routingInstruction.includes(prompt));
assert.ok(seeded.routingInstruction.includes(KeywordColumns.comparisonRouting));
assert.ok(KeywordColumns.comparisonRouting.includes('exactly one unordered comparison cell'));
assert.ok(KeywordColumns.comparisonRouting.includes('every other named player'));

console.log('PASS: every client inherits the hierarchical two-axis ICP SEO matrix prompt.');
