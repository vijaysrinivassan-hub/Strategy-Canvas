const fs = require('node:fs');
const path = require('node:path');

const source = process.argv[2];
const target = process.argv[3] || path.resolve(__dirname, '..', 'ai-data-icp-matrix.js');
if (!source) throw new Error('Usage: node tools/extract-ai-data-icp-matrix.cjs <source.html> [target.js]');

const html = fs.readFileSync(source, 'utf8');
const start = html.indexOf('<div class="tv" id="tv-icp">');
const end = html.indexOf('<div class="tv" id="tv-category">', start);
if (start < 0 || end < 0) throw new Error('ICP matrix section not found.');
const section = html.slice(start, end);

function decode(value) {
  return String(value || '')
    .replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&rarr;/g, '→')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
function keywords(attrs) {
  const match = /data-kw="([^"]*)"/.exec(attrs);
  return match ? match[1].split('|').map(decode).filter(Boolean) : [];
}

const columns = [];
const headerRe = /<div class="mh dept[^\"]*"([^>]*)>([\s\S]*?)<\/div><\/div>/g;
for (const match of section.matchAll(headerRe)) {
  const group = /data-group="([^"]+)"/.exec(match[1])?.[1];
  const name = /<span class="dn">([\s\S]*?)<\/span>/.exec(match[2])?.[1];
  if (!group || !name) continue;
  columns.push({ id: `ai-icp-${group}-${decode(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: decode(name), matrixGroup: group, keywordIdeas: keywords(match[1]) });
}

const tokens = [...section.matchAll(/<div class="(rowlabel|cell)"([^>]*)>([\s\S]*?)(?=<div class="(?:rowlabel|cell)"|<\/div><\/div>\s*<\/div>|<\/div>\s*<\/div>\s*<\/div>)/g)];
const rows = [];
let row = null;
for (const token of tokens) {
  const kind = token[1], attrs = token[2], body = token[3];
  if (kind === 'rowlabel') {
    if (row) rows.push(row);
    const name = decode(/<span class="dn">([\s\S]*?)<\/span>/.exec(body)?.[1]);
    row = {
      id: `ai-icp-row-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      description: decode(/<span class="df">([\s\S]*?)<\/span>/.exec(body)?.[1]),
      keywordIdeas: keywords(attrs),
      cells: []
    };
    continue;
  }
  if (!row || row.cells.length >= columns.length) continue;
  const badge = decode(/<span class="tp[^\"]*">([\s\S]*?)<\/span>/.exec(body)?.[1]);
  const who = decode(/<span class="who">([\s\S]*?)<\/span>/.exec(body)?.[1]);
  const actorBlock = /<div class="actor">([\s\S]*?)<\/div>/.exec(body)?.[1] || '';
  const role = decode(actorBlock.replace(/<span class="tp[^\"]*">[\s\S]*?<\/span>/, '').replace(/<span class="who">[\s\S]*?<\/span>/, '').replace(/^\s*·\s*/, ''));
  row.cells.push({
    title: decode(/<p class="proc">([\s\S]*?)<\/p>/.exec(body)?.[1]),
    actorType: badge === 'P' ? 'person' : badge === 'T/P' ? 'technology_or_person' : 'technology',
    actor: [who, role].filter(Boolean).join(' · '),
    keywordIdeas: keywords(attrs)
  });
}
if (row) rows.push(row);

if (columns.length !== 12 || rows.length !== 5 || rows.some(item => item.cells.length !== 12)) {
  throw new Error(`Expected a 12 x 5 matrix; found ${columns.length} columns and rows ${rows.map(item => item.cells.length).join(',')}.`);
}

const data = { revision: 'ai-data-icp-matrix-v1', client: 'AI Data Platform', productId: '0jgsw8bx554d', columns, rows };
const output = `/* Generated from the supplied ICP matrix. Re-run tools/extract-ai-data-icp-matrix.cjs to refresh. */\n(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.AiDataIcpMatrix=api;})(globalThis,function(){\nconst data=${JSON.stringify(data, null, 2)};\nconst copy=value=>JSON.parse(JSON.stringify(value));\nfunction ensure(content,client,productId){\n if(String(client||'').trim().toLowerCase()!==data.client.toLowerCase()||String(productId||'')!==data.productId)return false;\n const view=content?.views?.icp;if(!view||view.icpMatrixRevision===data.revision)return false;\n view.pageColumns ||= {};view.pageOrders ||= {};\n view.icpMatrixArchive ||= [];\n view.icpMatrixArchive.push({revision:data.revision,at:new Date().toISOString(),pageColumns:{listicle:copy(view.pageColumns.listicle||[]),landing:copy(view.pageColumns.landing||[])},rows:copy((view.rows||[]).filter(row=>row.pageGroup!=='informational'))});\n view.pageColumns.matrix=data.columns.map(column=>({...copy(column),local:true,defaults:{mode:'aeo',type:'',aw:''}}));\n view.pageOrders.matrix=view.pageColumns.matrix.map(column=>column.id);\n view.rows=(view.rows||[]).filter(row=>row.pageGroup==='informational');\n for(const sourceRow of data.rows){\n  const cells={};sourceRow.cells.forEach((sourceCell,index)=>{const column=data.columns[index];cells[column.id]={v:sourceCell.title,url:'',mode:'aeo',type:'',on:false,aw:'',st:'',writtenBy:'',cfg:true,kws:[],keywordIdeas:copy(sourceCell.keywordIdeas),actorType:sourceCell.actorType,actor:sourceCell.actor,icpSource:{kind:'sample-matrix',row:sourceRow.name,column:column.name}};});\n  view.rows.push({id:sourceRow.id,pageGroup:'matrix',name:sourceRow.name,description:sourceRow.description,keywordIdeas:copy(sourceRow.keywordIdeas),cells});\n }\n view.icpMatrixRevision=data.revision;return true;\n}\nreturn {data,ensure};\n});\n`;
fs.writeFileSync(target, output);
console.log(`Wrote ${target}: ${columns.length} columns, ${rows.length} rows, ${rows.length * columns.length} cells.`);
