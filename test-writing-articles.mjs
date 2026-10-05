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
assert.match(html, /writingArticles\(false\)\.length/, 'the Articles badge should use a read-only queue lookup');
assert.doesNotMatch(
  html.match(/function writingArticles\(create=true\)\{[\s\S]*?\n\}/)?.[0] || '',
  /contentRoot\(/,
  'reading the Articles queue must not run keyword-matrix migrations'
);
assert.match(html, /state\.boardId \|\| state\.boardCreationArmed/, 'autosave should run only for an opened or explicitly created board');
assert.match(html, /if \(!state\.boardId && !state\.boardCreationArmed\)/, 'saveBoard should reject implicit report creation');
assert.match(html, /r\.title === 'XYZ Strategy Board'[\s\S]*?ACCIDENTAL_XYZ_BOARD_AFTER/, 'bug-created XYZ placeholders should be quarantined without deleting reports');

console.log('PASS: every keyword matrix can send a deduplicated cell to Write > Articles and mark it Sent for review.');
