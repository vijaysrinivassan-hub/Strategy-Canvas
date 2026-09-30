import assert from 'node:assert/strict';
import fs from 'node:fs';
import seed from './ask-luca-competitive-intelligence.js';

assert.equal(seed.REVISION,'ask-luca-sitemap-2026-09-30-v1');
assert.equal(seed.PROFILE.name,'Ask Luca');
assert.equal(seed.PROFILE.domain,'https://ask-luca.com');
assert.deepEqual(seed.PROFILE.sitemaps,['https://ask-luca.com/sitemap.xml']);
assert.equal(seed.PROFILE.urls.length,186);
assert.equal(new Set(seed.PROFILE.urls).size,186);
assert(seed.PROFILE.urls.every(url=>url==='https://ask-luca.com'||url.startsWith('https://ask-luca.com/')));
assert(seed.PROFILE.urls.includes('https://ask-luca.com/blogs/ai-native-data-platform'));
assert(seed.matchesBoard(['Other','AI Data Platform']));
assert(!seed.matchesBoard(['AEO Agency','Other board']));

const tab={nodes:[],edges:[]};
assert.equal(seed.apply(tab),true);
assert.equal(tab.competitors.length,1);
assert.equal(tab.competitors[0].urls.length,186);
assert.equal(seed.apply(tab),false);
assert.equal(tab.competitors.length,1);

const existing={competitors:[{id:'manual-id',name:'Luca',domain:'https://ask-luca.com/',aliases:['Ask Luca AI'],sitemaps:[],urls:['https://ask-luca.com/manual-page'],source:'Manual'}]};
assert.equal(seed.apply(existing),true);
assert.equal(existing.competitors.length,1);
assert.equal(existing.competitors[0].id,'manual-id');
assert.equal(existing.competitors[0].urls.length,187);
assert(existing.competitors[0].aliases.includes('Ask Luca AI'));
assert.equal(seed.apply(existing),false);

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes('<script src="ask-luca-competitive-intelligence.js"></script>'));
assert(html.includes('await ensureAskLucaCompetitiveIntelligenceSeed();'));
assert(html.includes('model.askLucaSitemapRevision === api.REVISION'));
console.log('PASS: Ask Luca imports 186 sitemap URLs into AI Data Platform Competitive Intelligence without duplicates.');