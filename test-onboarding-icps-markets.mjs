import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const boards=fs.readFileSync(new URL('./mcp-server/src/tools/boards.ts',import.meta.url),'utf8');
// New board fields survive save and reload.
for (const key of ['clientIcps','clientMarketType','clientMarkets']) {
  assert(html.includes(key+': state.'+key), key+' is serialized');
  assert(html.includes('state.'+key+' = (d') || html.includes('state.'+key+' = d &&'), key+' is hydrated');
}
assert(html.includes("state.clientIcps = [];") && html.includes("state.clientMarkets = [];"), 'new boards start empty');
// Onboarding controls.
assert(html.includes("add.textContent='+ Add ICP'"));
assert(html.includes("tag.textContent='ICP '+(index+1)"), 'ICPs are labelled by position');
assert(html.includes("field('Red Ocean or Blue Ocean',ocean)"));
assert(html.includes("renderGtmGeoMarkets(host, false, ro);"));
assert(html.includes("return [['ALL', label('ALL')], ['US', label('US')], ['IN', label('IN')], ...rest];"), 'All countries, U.S., India come first');
assert(html.includes("toast('Choose Red Ocean or Blue Ocean.',true)") && html.includes("toast('Add at least one ICP.',true)"));
assert(html.includes("toast('Choose at least one geographic market.',true)"));
// Country list: 249 unique ISO codes including the U.S. and India.
const codes=html.match(/const GEO_COUNTRY_CODES = \(([\s\S]*?)\)\.split/)[1].replace(/['+\s]+/g,' ').trim().split(' ');
assert.equal(new Set(codes).size, codes.length, 'no duplicate country codes');
assert(codes.length >= 245 && codes.includes('US') && codes.includes('IN'));
// MCP board summary reports the answers.
assert(boards.includes('geographic_markets:') && boards.includes('icps: Array.isArray(body.clientIcps)'));
// Keyword main-process sets follow the onboarding ICPs, not the number of ticked maturity nodes.
assert(html.includes("label:icps.length === 1 ? 'Main Process'"), 'a single ICP gives one Main Process set');
assert(html.includes("else if (nodes[0].icp) root.keywordNodeWorkspaces[target] = cloneKeywordNodeProjection(root);"), 'existing keywords carry into the ICP set');
const columns=fs.readFileSync(new URL('./keyword-columns.js',import.meta.url),'utf8');
assert(columns.includes('ICP KEYWORD WORKSPACES') && columns.includes("icpProcessWorkspacePrompt+'\\n\\n'+"));
// Industries moved from the Positioning Canvas into onboarding Market Mapping.
assert(!html.includes('id="positioningIndustryStrip"'));
assert(html.includes("sectionTitle.textContent='Departments & Industries'"));
assert(html.includes('renderMaturityDepartments(productArchitectureState(MATURITY_ACCESS_TAB), ro, editor, renderGtmOnboarding);'), 'departments and industries are edited in Market Mapping');
assert(!html.includes('id="maturityDepartments"') && !html.includes('renderMaturityDepartments(architecture,ro);'), 'the Maturity Axis no longer shows the editor');
assert(!html.includes('function renderPositioningIndustryStrip'), 'the pencil strip that redirected to Maturity Axis is gone');
assert(html.includes('renderGtmGeoMarkets(host, false, ro);'), 'markets stay editable after locking');
console.log('PASS: onboarding asks for ICPs (+/×), Red or Blue Ocean, geographic markets (All countries, U.S., India first) and industries; keyword sets follow the ICPs.');
