import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('id="settingsSubnav"'));
assert(html.includes('class="settings-subnav nav-flyout-menu"'));
assert(html.includes("{ id: 'clients', label: 'Clients', section: 'setClients' }"));
assert(html.includes("{ id: 'templates', label: 'Writing Templates', section: 'setWritingTemplates' }"));
assert(html.includes("{ id: 'columns', label: 'Universal Keyword Columns', section: 'setUniversalColumns' }"));
assert(html.includes("{ id: 'atypes', label: 'Article Types', section: 'setTypes' }"));
assert(html.includes("{ id: 'mcp', label: 'MCP', section: 'setMcp' }"));
assert(html.includes("columnSection.id = 'setUniversalColumns'"));
assert(html.includes("button.dataset.settingsPart = item.id"));
assert(html.includes("nav.classList.add('settings-parent')"));
assert(!html.includes("const chev = document.createElement('span'); chev.className = 'chev'; chev.textContent = '\\u25b6'; nav.append(chev)"));
assert(html.includes("section.hidden = item.id !== active.id"));
assert(html.includes("state.settingsPart = SETTINGS_SECTIONS.some(item => item.id === id) ? id : 'clients'"));
assert(!html.includes("el.scrollIntoView({ block: 'start' })"));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match=>match[1]).filter(code=>code.trim());
scripts.forEach(code=>new vm.Script(code));
console.log('PASS: Settings is a nested sidebar group with independently rendered pages.');
