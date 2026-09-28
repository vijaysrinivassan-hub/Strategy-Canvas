import assert from 'node:assert/strict';
import fs from 'node:fs';

const asset = JSON.parse(fs.readFileSync(new URL('./competitive-intelligence-classifications.json', import.meta.url), 'utf8'));
const rows = Object.entries(asset.classifications);
const audit = asset.routingAudit?.categorySeoCleanup;

assert.deepEqual(
  {before:audit?.before,remaining:audit?.remaining,movedToIcp:audit?.movedToIcp,movedToValue:audit?.movedToValue},
  {before:642,remaining:89,movedToIcp:98,movedToValue:455}
);
assert.equal(rows.length, 7880);
assert.equal(rows.filter(([,meta]) => meta.section === 'Category SEO').length, 89);
assert.equal(rows.filter(([,meta]) => meta.section === 'ICP SEO').length, 880);
assert.equal(rows.filter(([,meta]) => meta.section === 'Value SEO').length, 3268);
assert(rows.filter(([,meta]) => meta.section === 'Category SEO').every(([,meta]) =>
  meta.classificationReason === 'Category-level education' && meta.classificationRuleVersion === 'category-level-v1'
));
const moved = rows.filter(([,meta]) => meta.originalSection === 'Category SEO');
assert.equal(moved.length, 553);
assert(moved.every(([,meta]) => ['ICP SEO','Value SEO'].includes(meta.section)));
assert(moved.filter(([,meta]) => meta.section === 'ICP SEO').every(([,meta]) =>
  ['Industry','Country','Company size','Technology','Role / Team','Process / Use case','General ICP'].includes(meta.hierarchy)
));
assert.equal(asset.classifications['https://beomniscient.com/blog/content-optimization'].section, 'Value SEO');
assert.equal(asset.classifications['https://beomniscient.com/blog/freelancer-vs-agency-vs-in-house'].section, 'ICP SEO');
assert.equal(asset.classifications['https://beomniscient.com/blog/freelancer-vs-agency-vs-in-house'].hierarchy, 'Role / Team');
assert.equal(asset.classifications['https://discoveredlabs.com/blog/what-is-answer-engine-optimization-aeo-complete-guide'].section, 'Category SEO');
assert.equal(asset.classifications['https://beomniscient.com/blog/seo-audit'].section, 'Value SEO');

const topicGroups = new Map();
for (const [, meta] of rows) {
  if (!meta.topicGroup) continue;
  const route = [meta.section, meta.hierarchy, meta.axis, meta.groupOrder].join('|');
  if (!topicGroups.has(meta.topicGroup)) topicGroups.set(meta.topicGroup, new Set());
  topicGroups.get(meta.topicGroup).add(route);
}
assert([...topicGroups.values()].every(routes => routes.size === 1));

console.log('PASS: Category SEO contains only direct category education; audience-fit and within-category URLs moved to ICP SEO or Value SEO.');
