import { writeFile } from 'node:fs/promises';

const fetchedAt = new Date().toISOString();
const decodeXml = value => value
  .replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&apos;', "'");
const locs = xml => [...xml.matchAll(/<loc>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/loc>/gi)]
  .map(match => decodeXml(match[1].trim()));
const canonical = value => {
  try {
    const url = new URL(value);
    url.hash = ''; url.search = '';
    return url.href.replace(/\/$/, '') || url.href;
  } catch { return ''; }
};
async function text(url){
  const response = await fetch(url, { headers: { 'user-agent': 'StrategyCanvasResearch/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}
async function sitemapInventory(name, domain, root, aliases = []){
  const pending = [root], seenMaps = new Set(), urls = new Set();
  while (pending.length){
    const sitemap = pending.shift();
    if (seenMaps.has(sitemap)) continue;
    seenMaps.add(sitemap);
    const found = locs(await text(sitemap));
    found.forEach(value => {
      if (/\.xml(?:$|\?)/i.test(value)) {
        if (!seenMaps.has(value)) pending.push(value);
      } else {
        const clean = canonical(value);
        if (clean) urls.add(clean);
      }
    });
  }
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name, domain, aliases, sitemaps: [...seenMaps],
    urls: [...urls].sort(), source: 'Public XML sitemap', fetchedAt, status: 'complete'
  };
}
async function commonCrawlInventory(){
  const collections = await (await fetch('https://index.commoncrawl.org/collinfo.json')).json();
  const collection = collections[0];
  const endpoint = collection['cdx-api'] +
    '?url=beomniscient.com%2F*&output=json&filter=status%3A200&collapse=urlkey';
  const lines = (await text(endpoint)).split('\n').filter(Boolean);
  const urls = new Set();
  lines.forEach(line => {
    try {
      const record = JSON.parse(line);
      if (record.mime && record.mime !== 'text/html') return;
      const clean = canonical(record.url);
      if (clean && /^https?:\/\/(?:www\.)?beomniscient\.com(?:\/|$)/i.test(clean)) urls.add(clean);
    } catch {}
  });
  return {
    id: 'omniscient', name: 'Omniscient', domain: 'https://beomniscient.com',
    aliases: ['Omniscient Digital'],
    sitemaps: ['https://beomniscient.com/sitemap.xml'],
    urls: [...urls].sort(), source: `Common Crawl ${collection.id}; live sitemap is Cloudflare-protected`,
    fetchedAt, status: 'indexed_snapshot'
  };
}

const competitors = [];
competitors.push(await sitemapInventory('Graphite', 'https://graphite.io', 'https://graphite.io/sitemap.xml'));
competitors.push({
  id: 'the-optimization-agency', name: 'The Optimization Agency', domain: '', aliases: [],
  sitemaps: [], urls: [], source: 'Awaiting a verified domain', fetchedAt, status: 'domain_required',
  note: 'No active agency domain could be verified for this exact name. Add the intended domain to fetch its sitemap.'
});
competitors.push(await sitemapInventory('First Page Sage', 'https://firstpagesage.com', 'https://firstpagesage.com/sitemap.xml'));
competitors.push(await sitemapInventory('Triple Dot', 'https://www.tripledart.com', 'https://www.tripledart.com/sitemap.xml', ['TripleDart']));
competitors.push(await sitemapInventory('Omnious', 'https://www.omnius.so', 'https://www.omnius.so/sitemap.xml', ['Omnius']));
competitors.push(await commonCrawlInventory());

const output = 'window.CompetitiveIntelligenceSeed = ' + JSON.stringify({
  id: 'us-auaeo-agencies-2026-09-24',
  client: 'US AUAEO',
  product: 'Answer Engine Optimization Agency',
  fetchedAt,
  competitors
}, null, 2) + ';\n';
await writeFile(new URL('../competitive-intelligence-seed.js', import.meta.url), output, 'utf8');
console.log(competitors.map(item => `${item.name}: ${item.urls.length} URLs, ${item.sitemaps.length} sitemap(s), ${item.status}`).join('\n'));
