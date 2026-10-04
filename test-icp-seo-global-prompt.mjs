import assert from 'node:assert/strict';
import KeywordColumns from './keyword-columns.js';

const prompt = KeywordColumns.strategyPrompt;
const seeded = KeywordColumns.seed();

assert.equal(KeywordColumns.PROMPT_REVISION, 'keyword-taxonomy-v19');
for (const phrase of [
  'ICP SEO MATRIX — ALL CLIENTS AND PRODUCTS',
  'true two-axis matrix',
  'parent dimension',
  'merged vertical group',
  'horizontal axis',
  'intersection of its correct vertical ICP segment and horizontal topic header',
  'every existing and future client',
  'copy the layout rule, never another client\'s labels or content',
  'compact populated cells upward',
]) assert.ok(prompt.includes(phrase), `shared prompt missing: ${phrase}`);

assert.ok(seeded.routingInstruction.includes(prompt));
assert.ok(seeded.routingInstruction.includes(KeywordColumns.comparisonRouting));
assert.ok(KeywordColumns.comparisonRouting.includes('exactly one unordered comparison cell'));
assert.ok(KeywordColumns.comparisonRouting.includes('every other named player'));
assert.ok(KeywordColumns.comparisonRouting.includes('move that URL and its metadata into the matching pair cell'));
assert.ok(KeywordColumns.comparisonRouting.includes('without content keeps the empty Status placeholder and remains white'));
assert.ok(prompt.includes('CATEGORY AWARE'));
assert.ok(prompt.includes('never decide from the URL slug alone'));
assert.ok(prompt.includes('Category name contains roundups using the prime category wording'));
assert.ok(prompt.includes('Category synonyms contains equivalent category roundups'));
assert.ok(prompt.includes('selected pillar-process card is the Prime category'));
assert.ok(prompt.includes('label it Supporting process'));
assert.ok(prompt.includes('Strategy & Research is not a category'));
assert.ok(prompt.includes('SOLUTION AWARE MATRICES'));
assert.ok(prompt.includes('actual flagship category'));
assert.ok(prompt.includes('never copy an AI Layer product into Capital Layer'));
assert.ok(prompt.includes('ICP AEO and Value AEO accept only genuine listicles and commercial landing pages'));
assert.ok(prompt.includes('agencies are Role / Team, enterprise is Company Size'));
assert.ok(prompt.includes('thank-you, confirmation, utility'));
assert.ok(prompt.includes('ICP SEO must use exactly the same horizontal topic headers as Value SEO'));
assert.ok(prompt.includes('Guides, How To Articles, Explainers, Trends, and Topic vs Topic'));

console.log('PASS: every client inherits the hierarchical two-axis ICP SEO matrix prompt.');
