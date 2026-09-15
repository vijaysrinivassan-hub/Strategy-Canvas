import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const document = {createElement(tag){return {tag,children:[],append(...items){this.children.push(...items)}}}};
let dirty = 0;
const ctx = vm.createContext({document,markDirty:()=>dirty++});
vm.runInContext(html.slice(html.indexOf('function positioningTextarea('),html.indexOf('function renderPositioning(){')),ctx);
const a = {id:'a'}, b = {id:'b'};
let details = ctx.renderIcpDetails(a,false);
assert.equal(details.children.length,3);
for (const [i,key] of ['buyingTrigger','industries','useCases'].entries()){
 const field=details.children[i];
 assert.equal(field.tag,'label');
 field.children[1].oninput({target:{value:key+' detail'}});
 assert.equal(a[key],key+' detail');
}
assert.equal(dirty,3);
assert.equal(ctx.renderIcpDetails(b,false).children[0].children[1].value,'');
const restored=JSON.parse(JSON.stringify(a));
assert.equal(ctx.renderIcpDetails(restored,false).children[0].children[1].value,'buyingTrigger detail');
const readOnly=ctx.renderIcpDetails(a,true).children[0].children[1];
assert.equal(readOnly.readOnly,true);
readOnly.oninput({target:{value:'blocked'}});
assert.equal(a.buyingTrigger,'buyingTrigger detail');
assert.ok(html.includes('if (selected) card.append(renderIcpDetails(icp, ro));'));
assert.ok(html.includes("ev.target.closest('input,textarea,label,button')"));
console.log('PASS: selected ICP details, isolated values, serialization, read-only and editing click guard');
