import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.value='';}
  append(...children){this.children.push(...children);}
  set innerHTML(v){this.children=[];}
  setAttribute(){}
  focus(){}
  select(){}
}
const host=new Element('host');
let readonly=false,dirty=0,renders=0;
const state={tabs:{},workspaceProductId:'payroll'};
const ctx=vm.createContext({state,keywordOrderTools:()=>new Element('span'),$:()=>host,document:{createElement:t=>new Element(t)},readOnly:()=>readonly,
  closeModal:()=>host.children=[],markDirty:()=>dirty++,toast:()=>{},articleTypes:()=>[],AWARENESS:['Problem aware']});
vm.runInContext(html.slice(html.indexOf('function normalizeColumnMeta'),html.indexOf('function defaultsFor')),ctx);
vm.runInContext(html.slice(html.indexOf('function columnTools'),html.indexOf('/* ---- table cells ----')),ctx);
function all(el=host){return [el,...el.children.flatMap(all)];}
function name(){return all().find(e=>e.id==='columnGuideName');}
function button(label){return all().find(e=>e.textContent===label);}
for(const table of ['category','competitor','icp','value']){
  const col={id:table,name:'Original',instruction:'Keep guidance',defaults:{mode:'aeo',type:'article',aw:'Problem aware'}};
  const cells={[col.id]:{text:'Existing keywords',mode:'seo',type:'override'}};
  const before=JSON.stringify(cells);
  const pencil=ctx.columnTools(col,col.name,()=>renders++).children[0];
  pencil.onclick({stopPropagation(){}});
  assert.equal(name().value,'Original');
  name().value='  Renamed  ';button('Save column settings').onclick();
  assert.equal(col.name,'Renamed');assert.equal(col.id,table);
  assert.equal(col.instruction,'Keep guidance');assert.equal(col.defaults.type,'article');
  assert.equal(JSON.stringify(cells),before);
  ctx.openColumnGuide(col,col.name,()=>renders++);
  assert.equal(name().value,'Renamed');name().value='Discard';button('Cancel').onclick();
  assert.equal(col.name,'Renamed');
  ctx.openColumnGuide(col,col.name,()=>renders++);
  name().value=' ';button('Save column settings').onclick();assert.equal(col.name,'Renamed');
  name().value='Wrong product';state.workspaceProductId='other';
  button('Save column settings').onclick();assert.equal(col.name,'Renamed');state.workspaceProductId='payroll';
}
const row={};ctx.openColumnGuide(row,'Competitor Name',()=>renders++);name().value='Players';
button('Save column settings').onclick();assert.equal(row.name,'Players');
assert(html.includes("cName.textContent = m.rowColumn.name || vd.label + ' Name'"));
ctx.openColumnGuide(row,row.name,()=>renders++);name().value='Wrong board';state.tabs={};
button('Save column settings').onclick();assert.equal(row.name,'Players');
readonly=true;ctx.openColumnGuide(row,row.name,()=>renders++);assert.equal(host.children.length,0);
assert.equal(ctx.columnTools(row,row.name,()=>{}).children.filter(e=>e.tag==='button').length,0);
assert.equal(dirty,5);assert.equal(renders,5);
console.log('PASS: pencil rename across four tables; IDs, cells and settings preserved; reopen, cancel, blank names, row header, read-only and stale workspace guards.');
