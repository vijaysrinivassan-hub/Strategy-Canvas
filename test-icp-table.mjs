import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classList={toggle:(c,on)=>{this.className=(this.className||'').replace(' '+c,'')+(on?' '+c:'');}};}
 append(...x){this.children.push(...x);}prepend(...x){this.children.unshift(...x);}
 replaceChildren(...x){this.children=x;}setAttribute(k,v){this.attrs[k]=v;}
 querySelector(tag){return this.children.find(n=>n.tag===tag)||null;}focus(){}
}
const all=n=>n.children.flatMap(c=>[c,...all(c)]);
const host=new Element('div'),listeners={};let dirty=0,id=0,ro=false;
const p={icps:[{id:'old',name:'Old persona',buyingTrigger:'Manual work',rows:[{id:'r1',people:'Founder',process:'Reporting',technology:'Excel',input:'Small'},{id:'r2',process:'Forecasting'}]}],selectedIcp:''};
const ctx=vm.createContext({structuredClone,document:{createElement:t=>new Element(t),addEventListener:(k,f)=>listeners[k]=f,querySelectorAll:()=>all(host).filter(n=>n.tag==='details'&&n.open)},$:()=>host,uid:()=>String(++id),readOnly:()=>ro,markDirty:()=>dirty++,confirm:()=>true,alert:()=>{},appendIcpKeywordControl:()=>{},openIcpWorkflowPage:()=>{},
 positioningTextarea:(value,ph,readonly,fn)=>{const e=new Element('textarea');e.value=value;e.oninput=()=>fn(e.value);return e;}});
ctx.renderPositioning=()=>ctx.renderIcpTable(p,ro);
for(const file of ['icp-table.js','icp-cell-canvas.js','icp-choices.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
vm.runInContext('globalThis.choices=IcpChoices;',ctx);
ctx.renderPositioning();
assert.equal(dirty,1);
const texts=()=>all(host).map(n=>n.textContent);
assert.ok(!texts().includes('ICP Name'));assert.ok(!texts().includes('Rows'));
assert.equal(texts().at(-1),'Clear selections');
assert.equal(ctx.choices.list(p,{axis:'people',column:'maturity'}).length,1);
assert.equal(ctx.choices.list(p,{axis:'process',column:'maturity'}).length,2);
const select=()=>all(host).filter(n=>n.attrs['aria-label']?.startsWith('Select '));
select()[0].checked=true;select()[0].onchange();
assert.equal(p.selectedIcp,'composed-icp');
assert.match(p.icps.find(i=>i.id===p.selectedIcp).people,/Founder/);
const process=select().filter(n=>n.attrs['aria-label'].includes('Process'));
process.forEach(n=>{n.checked=true;n.onchange();});
assert.match(p.icps.find(i=>i.id===p.selectedIcp).process,/Reporting/);
assert.match(p.icps.find(i=>i.id===p.selectedIcp).process,/Forecasting/);
assert.equal(ctx.choices.selected(p).length,3);
const menu=all(host).find(n=>n.dataset.group==='people');
menu.children[0].onclick({preventDefault(){}});assert.equal(menu.open,true);
listeners.pointerdown({target:{closest:()=>null}});assert.equal(menu.open,false);
const add=all(host).filter(n=>n.textContent==='+ Add option')[1];
add.onclick({stopPropagation(){}});
assert.equal(ctx.choices.list(p,{axis:'process',column:'maturity'}).length,3);
assert.equal(ctx.choices.list(p,{axis:'people',column:'maturity'}).length,1);
const copied=JSON.parse(JSON.stringify(p));assert.equal(ctx.choices.migrate(copied),false);
assert.equal(ctx.choices.selected(copied).length,3);
ro=true;const before=JSON.stringify(p);ctx.renderPositioning();assert.equal(JSON.stringify(p),before);
assert.ok(select().every(n=>n.disabled));
assert.ok(!texts().includes('+ Add option'));
console.log('PASS: no persona column, unequal independent lists, multiselect, compatible selected profile, per-column add, dropdown dismissal, reload and read-only.');
