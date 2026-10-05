import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const comparison = fs.readFileSync(new URL('./competitor-comparison.js', import.meta.url), 'utf8');

assert.match(html, /const ARTICLES_TAB = 'Articles'/, 'Articles should be a first-class panel');
assert.match(html, /\{ kind: 'label',\s+text: 'Write' \}[\s\S]*?name: ARTICLES_TAB/, 'Write > Articles should appear after Keywords');
assert.match(html, /id="articlesPane"[\s\S]*?id="articlesHost"/, 'Articles should have a dedicated table pane');
assert.match(html, /className = 'gr-send-write'/, 'keyword cells should render the send-for-review icon');
assert.match(html, /valueLensStatusPatch\(current,o\.keywordLens,'review'\) : \{st:'review'\}/, 'sending should set Sent for review in normal and value-lens cells');
assert.match(html, /previous = list\.find\(item => item\.primaryKey === primaryKey\)/, 'sending the same source cell should update instead of duplicate');
assert.match(html, /key:\['grid'/, 'all ordinary keyword matrices should provide a stable source key');
assert.match(html, /key:\['competitor'/, 'the competitor article matrix should provide a stable source key');
assert.match(comparison, /key:\['competitor-comparison'/, 'the competitor-vs-competitor matrix should provide a stable source key');
assert.match(html, /\['Title','Slug','Primary keyword','Keywords','Article type','Awareness','Matrix location','Status','Sent'\]/, 'writing table should expose the requested planning fields');

console.log('PASS: every keyword matrix can send a deduplicated cell to Write > Articles and mark it Sent for review.');
