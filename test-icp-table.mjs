import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(tag){return this.children.find(n=>n.tag===tag)||null;}
 focus(){this.focused=true;}
}
const all=n=>n.children.flatMap(c=>[c,...all(c)]);
const host=new Element('div');let readonly=false,dirty=0,id=0,opened=null;
const p={selectedIcp:'a',icps:[{id:'a',name:'Small',buyingTrigger:'Hiring',rows:[{id:'r1',people:'One HR',process:'Manual',technology:'Excel',input:'20 employees'},{id:'r2',technology:'Email'}]},{id:'b',name:'Large',rows:[{id:'r3',people:'HR team'}]}]};
const listeners={};
const ctx=vm.createContext({document:{createElement:t=>new Element(t),addEventListener:(type,fn)=>{listeners[type]=fn;},querySelectorAll:()=>all(host).filter(n=>n.tag==='details'&&n.open)},$:()=>host,readOnly:()=>readonly,markDirty:()=>dirty++,uid:()=>String(++id),confirm:()=>true,
 renderPositioning:()=>ctx.renderIcpTable(p,readonly),selectPositioningIcp:id=>{p.selectedIcp=id;ctx.renderIcpTable(p,readonly)},openIcpWorkflowPage:icp=>opened=icp});
vm.runInContext(html.slice(html.indexOf('function newPositioningIcp(){'),html.indexOf('function newPositioningCategory(){')),ctx);
vm.runInContext(html.slice(html.indexOf('function positioningTextarea('),html.indexOf('function renderIcpDetails(')),ctx);
vm.runInContext(fs.readFileSync(new URL('./icp-table.js',import.meta.url),'utf8'),ctx);
ctx.renderIcpTable(p,false);
assert.equal(host.children[0].tag,'table');
assert.equal(host.children[0].children.filter(n=>n.tag==='tbody').length,2);
const bodies=()=>host.children[0].children.filter(n=>n.tag==='tbody');
assert.equal(bodies()[0].children[0].children[0].rowSpan,2);
assert.equal(host.children[0].children[0].children[0].children.at(-1).textContent,'Buying Trigger');
assert.equal(bodies()[0].children[0].children.at(-1).className,'icp-table-trigger');
assert.equal(bodies()[0].children[0].children.at(-1).rowSpan,2);
assert.ok(bodies()[0].className.includes('selected'));
const menu=key=>all(host).find(n=>n.dataset.group===key);
menu('people').children[0].onclick({preventDefault(){}});
assert.equal(menu('people').open,true);
listeners.pointerdown({target:{closest:()=>menu('people')}});
assert.equal(menu('people').open,true);
menu('process').children[0].onclick({preventDefault(){}});
assert.equal(menu('people').open,false);
assert.equal(menu('process').open,true);
listeners.pointerdown({target:{closest:()=>null}});
assert.equal(menu('process').open,false);
menu('people').children[0].onclick({preventDefault(){}});
listeners.keydown({key:'Escape'});
assert.equal(menu('people').open,false);
assert.equal(menu('people').children[0].focused,true);
menu('people').children[0].onclick({preventDefault(){}});
listeners.focusin({target:{closest:()=>null}});
assert.equal(menu('people').open,false);
function check(key,label,checked){
 const line=all(menu(key)).find(n=>n.tag==='label'&&n.children[1]?.textContent===label);
 line.children[0].checked=checked;line.children[0].onchange();
}
assert.equal(host.children[0].children[0].children.length,1);
check('process','Industries',true);check('process','Departments',true);
assert.deepEqual([...p.icpTableColumns.process],['industries','departments']);
assert.equal(p.icps[0].rows[0].process,'Manual');
assert.equal(menu('people').children[0].textContent,'People ▾');
let field=all(host).find(n=>n.attrs['aria-label']==='ICP 1, row 1, Process, Industries');
field.oninput({target:{value:'Retail'}});
assert.equal(p.icps[0].rows[0].dimensions.process.industries,'Retail');
check('process','Industries',false);check('process','Industries',true);
field=all(host).find(n=>n.attrs['aria-label']==='ICP 1, row 1, Process, Industries');
assert.equal(field.value,'Retail');
const normalized=ctx.newPositioningIcpRow(JSON.parse(JSON.stringify(p.icps[0].rows[0])));
assert.equal(normalized.dimensions.process.industries,'Retail');
assert.equal(normalized.process,'Manual');
const trigger=all(host).find(n=>n.attrs['aria-label']==='ICP 1 buying trigger');
trigger.oninput({target:{value:'Expansion'}});assert.equal(p.icps[0].buyingTrigger,'Expansion');
all(host).find(n=>n.textContent==='View More').onclick();assert.equal(opened,p.icps[0]);
all(host).find(n=>n.textContent==='Select ICP').onclick({stopPropagation(){}});
assert.equal(p.selectedIcp,'b');
const oldRows=p.icps[0].rows.length;
all(host).find(n=>n.textContent==='+ Add row').onclick({stopPropagation(){}});
assert.equal(p.icps[0].rows.length,oldRows+1);
const custom=all(menu('technology')).find(n=>n.placeholder==='Custom subcolumn');custom.value='Integrations';
all(menu('technology')).find(n=>n.textContent==='+ Add subcolumn').onclick({stopPropagation(){}});
assert.equal(p.icpCustomColumns.technology[0].name,'Integrations');
const childMenu=()=>all(host).find(n=>n.tag==='details'&&n.children[0]?.textContent==='Industries ▾');
for(const name of ['Mining','SaaS','Retail','Manufacturing','Healthcare']){
 const childInput=all(childMenu()).find(n=>n.attrs['aria-label']==='Process / Industries new child column');
 childInput.value=name;
 all(childMenu()).find(n=>n.textContent==='+ Add child column').onclick({stopPropagation(){}});
}
assert.equal(p.icpNestedColumns.process.industries.length,5);
assert.equal(host.children[0].children[0].children.length,3);
let mining=all(host).find(n=>n.attrs['aria-label']==='ICP 1, row 1, Process, Industries / Mining');
mining.oninput({target:{value:'Mine reporting flow'}});
const miningId=p.icpNestedColumns.process.industries[0].id;
assert.equal(p.icps[0].rows[0].dimensions.process[JSON.stringify(['industries',miningId])],'Mine reporting flow');
assert.equal(p.icps[0].rows[0].dimensions.process.industries,'Retail');
all(host).find(n=>n.attrs['aria-label']==='Remove Process / Industries / Mining').onclick({stopPropagation(){}});
assert.ok(!all(host).some(n=>n.attrs['aria-label']==='ICP 1, row 1, Process, Industries / Mining'));
const miningChoice=all(childMenu()).find(n=>n.tag==='label'&&n.children[1]?.textContent==='Mining');
miningChoice.children[0].checked=true;miningChoice.children[0].onchange();
mining=all(host).find(n=>n.attrs['aria-label']==='ICP 1, row 1, Process, Industries / Mining');
assert.equal(mining.value,'Mine reporting flow');
const reloaded=ctx.newPositioningIcpRow(JSON.parse(JSON.stringify(p.icps[0].rows[0])));
assert.equal(reloaded.dimensions.process[JSON.stringify(['industries',miningId])],'Mine reporting flow');
check('process','Industries',false);check('process','Departments',false);
assert.equal(p.icpTableColumns.process.length,0);
assert.ok(all(host).some(n=>n.tag==='textarea'&&n.value==='Manual'));
check('process','Industries',true);
assert.ok(all(host).some(n=>n.tag==='textarea'&&n.value==='Mine reporting flow'));
readonly=true;ctx.renderIcpTable(p,true);
assert.ok(all(host).filter(n=>n.tag==='textarea').every(n=>n.readOnly));
assert.ok(all(host).filter(n=>n.type==='checkbox').every(n=>n.disabled));
assert.ok(!all(host).some(n=>n.textContent==='+ Add row'));
assert.ok(dirty>0);
console.log('PASS: grouped ICP table, independent multi-select subcolumns, custom columns, sparse rows, hidden-data retention, normalization/reload, trigger edits, selection, details navigation and read-only.');
