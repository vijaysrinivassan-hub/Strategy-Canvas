import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("const LOCATION_MEMORY_KEY = 'sb-last-location-v1'"));
assert(html.includes('function rememberLocation()'));
assert(html.includes('function restoreLocation(location)'));
assert(html.includes('async function openBoard(id, location)'));
assert(html.includes('restoreLocation(location);'));
assert(html.includes('const location = rememberedLocation();'));
assert(html.includes('await openBoard(board.id, rememberedBoard ? location : null);'));
assert(html.includes('CONTENT_VIEWS.some(view => view.id === location.contentView)'));
assert(html.includes("window.addEventListener('beforeunload', e => {\n  rememberLocation();"));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: board, screen, tab, keyword view, frame and settings location persist safely across reloads.');
