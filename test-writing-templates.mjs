import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert.ok(html.includes("const WRITING_TEMPLATES_TITLE = '[Internal] Writing templates';"));
assert.ok(html.includes("templateTitle.textContent = 'Writing Templates'"));
assert.ok(html.includes("templateHost.id = 'writingTemplatesHost'"));
assert.ok(html.includes('function renderWritingTemplates()'));
assert.ok(html.includes("add.textContent = '+ New template'"));
assert.ok(html.includes("textarea.placeholder = 'Paste the complete writing template here"));
assert.ok(html.includes("save.textContent = 'Save template'"));
assert.ok(html.includes("r.title !== WRITING_TEMPLATES_TITLE"));
assert.ok(html.includes(".in('title', ['[Internal] Universal keyword columns', WRITING_TEMPLATES_TITLE])"));
assert.ok(html.includes("body:JSON.stringify({version:1,kind:WRITING_TEMPLATES_KIND,templates:writingTemplates})"));

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(source => source.trim());
scripts.forEach(source => new vm.Script(source));
console.log('PASS: Settings includes persisted selectable Writing Templates with a single paste field.');
