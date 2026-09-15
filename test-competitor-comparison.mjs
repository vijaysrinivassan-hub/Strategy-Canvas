import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import KeywordAssignments from './keyword-assignments.js';
class El{
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.classList={toggle(){}};this.value='';}
 append(...els){for(const e of els){e.parentNode=this;this.children.push(e);}}
 set innerHTML(v){this.children=[];}
 setAttribute(){}
 querySelector(s){const c=s.split('.').at(-1);return this.children.find(e=>(e.className||'').split(' ').includes(c))||null;}
 insertBefore(el,before){el.parentNode=this;const i=this.children.indexOf(before);if(i<0)this.children.push(el);else this.children.splice(i,0,el);}
 remove(){this.parentNode.children=this.parentNode.children.filter(e=>e!==this);}
}
const host=new El('section'),m={rows:['A','B','C','D','E'].map(id=>({id,name:id}))};
let readonly=false,dirty=0;
const state={contentView:'competitor',tabs:{content:{views:{competitor:m}}}};
const select=(value,ro,save)=>{const e=new El('select');e.value=value;e.disabled=ro;e.onchange=()=>save(e.value);return e;};
const ctx=vm.createContext({KeywordAssignments,keywordRowsByIds:()=>[],state,CONTENT_TAB:'content',$:()=>host,document:{createElement:t=>new El(t)},
 readOnly:()=>readonly,markDirty:()=>dirty++,gridCellKeywords:()=>[],keywordBlock:()=>new El('div'),
 kindSelect:select,awarenessSelect:select,statusSelect:select,modeSwitch:()=>new El('div'),
 setTimeout:()=>0,clearTimeout(){}});
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
vm.runInContext(html.slice(html.indexOf('function cellState('),html.indexOf('/* What a matrix cell catches')),ctx);
vm.runInContext(html.slice(html.indexOf('function cellControls('),html.indexOf('/* Keywords as evidence')),ctx);
const sharedControls=ctx.cellControls;ctx.cellControls=(td,o)=>{td.options=o;sharedControls(td,o);};
vm.runInContext(fs.readFileSync(new URL('./competitor-comparison.js',import.meta.url),'utf8'),ctx);
const all=(e=host)=>[e,...e.children.flatMap(all)],checks=()=>all().filter(e=>e.type==='checkbox');
ctx.renderCompetitorComparison(m);
assert.equal(all().filter(e=>e.className==='comparison-null').length,15);
assert.equal(checks().length,10);
const firstCell=all().find(e=>e.options);assert.equal(firstCell.options.get().v,'B vs A');
assert.equal(firstCell.options.get().aw,'Competitor aware');assert.equal(firstCell.options.get().type,'competitor');
ctx.keywordRowsByIds=()=>[{volume:10}];assert.equal(firstCell.options.get().st,'for_review');ctx.keywordRowsByIds=()=>[];
checks()[0].checked=true;checks()[0].onchange();
assert.equal(Object.keys(m.comparisonCells).length,1);assert.equal(checks().filter(c=>c.checked).length,1);
const key=ctx.comparisonKey('A','B');assert.equal(key,ctx.comparisonKey('B','A'));
const td=all().find(e=>e.options);
td.options.set({url:'a-vs-b',writtenBy:'new',type:'listicle',aw:'Solution aware',st:'planned',mode:'seo',kws:['kw1'],v:'A vs. B'});
td.options.rerender();
assert.equal(m.comparisonCells[key].url,'a-vs-b');assert.equal(m.comparisonCells[key].writtenBy,'new');
assert.equal(all().filter(e=>e.placeholder==='Slug'&&e.value==='a-vs-b').length,1);
assert.equal(all().filter(e=>e.placeholder==='Title....'&&e.value==='A vs. B').length,1);
assert.equal(all().filter(e=>e.tag==='select').length,40);
const saved=JSON.parse(JSON.stringify(m));m.comparisonCells=saved.comparisonCells;m.rows[0].name='Renamed A';
ctx.renderCompetitorComparison(m);
assert.equal(checks().filter(e=>e.checked).length,1);assert.equal(m.comparisonCells[key].url,'a-vs-b');
readonly=true;ctx.renderCompetitorComparison(m);assert(all().filter(e=>e.tag==='input'||e.tag==='select').every(e=>e.disabled));
const before=JSON.stringify(m.comparisonCells);all().find(e=>e.options).options.set({url:'Blocked'});assert.equal(JSON.stringify(m.comparisonCells),before);
const other={rows:m.rows};state.tabs.content.views.competitor=other;ctx.renderCompetitorComparison(other);
assert.equal(checks().filter(e=>e.checked).length,0);
assert(!html.includes("caption.textContent = 'URL'"));
// Copy includes all model pairs, not only hydrated/visible cells.
let copied='';
ctx.navigator={clipboard:{writeText:async text=>{copied=text;}}};
ctx.gridCellKeywords=(title,ids)=>(ids||[]).map(id=>({keyword:'keyword '+id}));
const exportModel={rows:[{id:'a',name:'Alpha'},{id:'b',name:'Beta'},{id:'c',name:'Gamma'}],comparisonCells:{}};
exportModel.comparisonCells[ctx.comparisonKey('a','b')]={v:'Custom comparison',kws:['one','two']};
const output=ctx.comparisonClipboardText(exportModel);
assert.equal(output.split('\n').length,3);
assert(!output.includes('Proposed title'));assert(!output.includes('Keywords'));
assert(output.includes('Custom comparison,keyword one,keyword two'));
assert(output.split('\n').includes('Gamma vs Alpha'));
assert(!output.includes('Alpha vs. Alpha'));assert(!output.includes('Beta vs. Alpha'));
exportModel.comparisonCells[ctx.comparisonKey('a','c')]={v:'Compare, "carefully"',kws:[]};
assert(ctx.comparisonClipboardText(exportModel).includes('"Compare, ""carefully"""'));
exportModel.comparisonCells[ctx.comparisonKey('a','c')]={v:'Alpha vs. Gamma',kws:[]};
assert(ctx.comparisonClipboardText(exportModel).split('\n').includes('Alpha vs Gamma'));
assert(!ctx.comparisonClipboardText(exportModel).includes('vs.'));
delete exportModel.comparisonCells[ctx.comparisonKey('a','c')];
state.tabs.content.views.competitor=exportModel;
ctx.renderCompetitorComparison(exportModel);
const copy=all().find(e=>e.textContent==='Copy');
assert(copy&&!copy.disabled);await copy.onclick();assert.equal(copied,output);
assert(all().some(e=>e.textContent==='Copied'));
ctx.navigator.clipboard.writeText=async()=>{throw Error('Permission denied');};
await copy.onclick();assert(!copy.disabled);
assert(all().some(e=>e.textContent==='Could not copy. Allow clipboard access and try again.'));
readonly=false;exportModel.comparisonOthers={triple:{v:'Alpha vs Beta vs Gamma',kws:['three']}};
ctx.renderCompetitorComparison(exportModel);
assert(all().some(e=>e.tag==='th'&&e.textContent==='Others'));
const otherEditor=all().find(e=>e.options?.comparisonOtherId==='triple');assert(otherEditor);
otherEditor.options.set({st:'selected'});assert.equal(exportModel.comparisonOthers.triple.st,'selected');
assert(ctx.comparisonClipboardText(exportModel).includes('Alpha vs Beta vs Gamma,keyword three'));
console.log('PASS: clipboard export includes unique pairs, custom/default titles and keywords; read-only copying and permission errors handled.');
console.log('PASS: full shared cell fields, generated/editable titles, Slug, mirrored edits, disabled diagonal, reload persistence, read-only guard and product isolation.');
