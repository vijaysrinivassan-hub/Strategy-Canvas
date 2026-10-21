import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Every Maturity Axis row carries a Firmographic Proxies card (revenue, employees, SMB / mid-market /
// enterprise) in its top-left corner, and nodes are kept clear of it.
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const pick = name => {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start > 0, name + ' exists');
  let depth = 0, i = html.indexOf('{', start);
  for (; i < html.length; i++){ if (html[i] === '{') depth++; else if (html[i] === '}' && --depth === 0) break; }
  return html.slice(start, i + 1);
};
const constants = html.match(/const FIRMOGRAPHIC_SEGMENTS = [^\n]*\n[^\n]*FIRMOGRAPHIC_GUTTER = 226;/);
assert.ok(constants, 'segment list and card bounds are defined');
const context = vm.createContext({});
vm.runInContext(constants[0] + '\n' + pick('normaliseFirmographicProxies') + '\n' + pick('firmographicMinX') +
  '\nthis.normalise = normaliseFirmographicProxies; this.minX = firmographicMinX; this.segments = FIRMOGRAPHIC_SEGMENTS;', context);

const segments = context.segments.map(segment => segment[1]).join('|');
assert.equal(segments, 'Not classified|SMB|Mid-market|Enterprise');
const clean = context.normalise({ revenue: '$10M–$50M', employees: 50, segment: 'mid_market', extra: 'x' });
assert.equal([clean.revenue, clean.employees, clean.segment].join('|'), '$10M–$50M|50|mid_market');
assert.equal(Object.keys(clean).join('|'), 'revenue|employees|segment');
assert.equal(context.normalise({ segment: 'huge' }).segment, '', 'unknown segment is cleared');
assert.equal(context.normalise(null).revenue, '');
assert.equal(context.minX(60), 226, 'nodes beside the card start right of it');
assert.equal(context.minX(300), 10, 'nodes below the card may use the left edge');

assert.ok(html.includes("if (state.tab === MATURITY_ACCESS_TAB) row.append(renderFirmographicProxies(system));"), 'card renders in maturity rows only');
assert.ok(html.includes("title.textContent = 'Firmographic Proxies'"));
assert.ok(html.includes('if (state.tab === MATURITY_ACCESS_TAB) node.x = Math.max(firmographicMinX(node.y), node.x);'), 'drag keeps clear of the card');
assert.ok(html.includes('if (system.firmographicLayout === 1) return;'), 'existing rows shift once');
assert.ok(html.includes('.firmographic-card{position:absolute;'));

const tool = fs.readFileSync(new URL('./mcp-server/src/tools/architecture.ts', import.meta.url), 'utf8');
assert.ok(tool.includes("firmographicProxies:z.object({revenue:z.string(),employees:z.string(),segment:z.enum(['','smb','mid_market','enterprise'])}).optional()"), 'server keeps the card');
assert.ok(tool.includes('covers the Firmographic Proxies card'), 'server rejects nodes over the card');
const prompts = JSON.parse(fs.readFileSync(new URL('./ai-prompts.json', import.meta.url), 'utf8'));
assert.ok(prompts.maturity_axis.prompt.includes('FIRMOGRAPHIC PROXIES'), 'maturity prompt explains the card');
console.log('PASS: maturity rows carry Firmographic Proxies and nodes stay clear of the card.');
