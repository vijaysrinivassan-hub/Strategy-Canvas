import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
class El{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.classList={toggle(){}};}
 append(...els){this.children.push(...els);}
 set innerHTML(v){this.children=[];}
 setAttribute(){}
}
const host=new El('section'),m={rows:['A','B','C','D','E'].map(id=>({id,name:id}))};
let readonly=false,dirty=0;
const state={contentView:'competitor',tabs:{content:{views:{competitor:m}}}};
const ctx=vm.createContext({state,CONTENT_TAB:'content',$:()=>host,document:{createElement:t=>new El(t)},readOnly:()=>readonly,markDirty:()=>dirty++});
vm.runInContext(fs.readFileSync(new URL('./competitor-comparison.js',import.meta.url),'utf8'),ctx);
const all=(e=host)=>[e,...e.children.flatMap(all)];
ctx.renderCompetitorComparison(m);
assert.equal(all().filter(e=>e.className==='comparison-null').length,5);
let checks=all().filter(e=>e.tag==='input');assert.equal(checks.length,20);
checks[0].checked=true;checks[0].onchange();
assert.equal(Object.keys(m.comparisonCells).length,1);
assert.equal(checks.filter(c=>c.checked).length,2);
assert.equal(ctx.comparisonKey('A','B'),ctx.comparisonKey('B','A'));
const saved=JSON.parse(JSON.stringify(m));m.comparisonCells=saved.comparisonCells;m.rows[0].name='Renamed A';
ctx.renderCompetitorComparison(m);
assert.equal(all().filter(e=>e.tag==='input'&&e.checked).length,2);
assert(all().some(e=>e.textContent==='Renamed A vs. B'));
readonly=true;ctx.renderCompetitorComparison(m);checks=all().filter(e=>e.tag==='input');
assert(checks.every(c=>c.disabled));checks[0].checked=false;checks[0].onchange();assert.equal(dirty,1);
const other={rows:m.rows};state.tabs.content.views.competitor=other;
ctx.renderCompetitorComparison(other);assert.equal(all().filter(e=>e.tag==='input'&&e.checked).length,0);
m.rows=m.rows.slice(0,1);ctx.renderCompetitorComparison(m);assert.equal(all().filter(e=>e.tag==='input').length,0);
const ui=fs.readFileSync(new URL('./keyword-columns-ui.js',import.meta.url),'utf8');
assert(!ui.includes("'Default text'"));assert(ui.includes("'Default article type'"));
assert(ui.includes('articleTypes().map(t=>t.name)'));
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(!html.includes('Default cell text'));assert(!html.includes("v: d.value || ''"));
console.log('PASS: 5x5 competitors, disabled diagonal, mirrored selection, stable IDs after rename/reload, read-only guard, product isolation and article-type dropdown.');
