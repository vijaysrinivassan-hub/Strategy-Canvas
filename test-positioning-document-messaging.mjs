import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes("['messaging_framework', 'Awareness Messaging Framework', 'messaging']"));
assert.ok(html.includes("{ id: 'messaging_framework', label: 'Awareness Messaging Framework', fields: ['messaging_framework'] }"));
for (const field of [
  "['problem_unaware', 'Problem unaware']",
  "['problem_aware', 'Problem-aware']",
  "['solution_aware', 'Solution-aware']",
  "['category_aware', 'Category-aware']",
  "['competitor_aware', 'Competitor-aware']"
]) assert.ok(html.includes(field), `missing ${field}`);
assert.ok(html.includes("stack.className = 'messaging-framework-fields'"));
assert.ok(html.includes("subwrapper.className = 'messaging-framework-subfield'"));
assert.ok(html.includes("fields[field[0]][subfield[0]] = event.target.value"));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));
console.log('PASS: Positioning Document persists a five-part Awareness Messaging Framework field.');
