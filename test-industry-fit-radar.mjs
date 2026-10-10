import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
assert(html.includes("fit.id='gtmIndustryFit'"));
assert(!html.includes('id="icpIndustryFit"'));
assert(html.includes("id:'market', label:'Market system'"));
assert(html.includes('selling component and buying component together'));
for(const market of ['IT / Infrastructure market','B2B SaaS market','Consumer technology market','Consumer software market','Personal enablement app market','Consumer professional services market','Personal Care / Wellness market','Household Materials market']){
  assert(html.includes(`market:'${market}'`),`missing market example: ${market}`);
}
assert.equal((html.match(/selling:'(?:technology|process|people|input)',buying:'(?:technology|process|people|input)',b2b:\{market:/g)||[]).length,16);
assert.equal((html.match(/,b2c:\{market:/g)||[]).length,16);
assert(html.includes("buying.marketAudience = 'b2b'"));
assert(html.includes("[['b2b','B2B'],['b2c','B2C']]"));
assert(html.includes("grid.className = 'industry-market-grid'"));
assert(html.includes("button.className = 'industry-market-cell'"));
assert(html.includes("evolutionState().axis = model.selling;"));
assert(html.includes("buying.buyingAxis = model.buying;"));
assert(html.includes("buying.industryModel = model.selling + '-' + model.buying;"));
assert(html.includes("renderIndustryFit(readOnly());\n  const t = channelState();"));
assert(html.includes("sharedPagesLabel.textContent = 'Pages to create'"));
assert(/\.industry-market-grid\{[^}]*grid-template-columns:126px repeat\(4,minmax\(174px,1fr\)\)/.test(html));
assert(/\.industry-market-cell\{[^}]*min-height:112px/.test(html));
assert(!html.includes('<section class="gtm-market-system"'));
assert(html.includes("renderGtmMarketStep(panel,locked,ro)"));
assert(html.includes('.gtm-onboarding-market .industry-fit{display:grid;grid-template-columns:minmax(0,1fr)'));
assert(html.includes('.gtm-onboarding-market .industry-market-grid{grid-template-columns:104px repeat(4,minmax(0,1fr));width:100%;min-width:0}'));
assert(html.includes('renderIcpCards(p, ro, activeBuyingIndustryAxis())'));
assert(html.includes("rowHead.className = 'industry-market-row'"));
assert(html.includes("column.className = 'industry-market-column'"));
assert(html.includes('white-space:normal; overflow-wrap:anywhere'));

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(source=>source.trim());
scripts.forEach(source=>new vm.Script(source));
console.log('PASS: GTM Strategy hosts a responsive selectable 4x4 market matrix with 16 B2B and 16 B2C examples and preserved axis links.');
