import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.style={};this.attrs={};this.classList={toggle(){},add(){}};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 after(node){this.sibling=node;}
 remove(){this.removed=true;}
 setAttribute(k,v){this.attrs[k]=v;}
 focus(){}
 querySelector(tag){return all(this).find(n=>n.tag===tag)||null;}
 setPointerCapture(){}
}
function all(node){return node.children.flatMap(n=>[n,...all(n)]);}
const pane=new Element('div');
let dirty=0,readonly=false,sequence=0;
const ctx=vm.createContext({document:{activeElement:null,createElement:t=>new Element(t),createElementNS:(ns,t)=>{const n=new Element(t);n.namespaceURI=ns;return n;}},
 $:()=>pane,state:{tabs:{pos:{}}},POSITIONING_TAB:'pos',readOnly:()=>readonly,uid:()=>String(++sequence),markDirty:()=>dirty++,confirm:()=>true,renderPositioning(){}});
vm.runInContext(fs.readFileSync(new URL('./icp-workflows.js',import.meta.url),'utf8'),ctx);
vm.runInContext(html.slice(html.indexOf('function renderIcpDetails('),html.indexOf('function renderPositioning(){')),ctx);
const icp={name:'Growth team',buyingTrigger:'Growth',industries:'Retail',useCases:'Legacy notes'};
const card=ctx.renderIcpDetails(icp,false);
assert.equal(card.children.length,1);
assert.equal(card.children[0].textContent,'View More');
card.children[0].onclick({stopPropagation(){}});
const page=()=>pane.sibling;
const find=text=>all(page()).find(n=>n.textContent===text);
const click=text=>{const b=find(text);assert.ok(b,text);b.onclick();};
assert.equal(pane.hidden,true);
assert.ok(find('Previous industries and use-case notes'));
click('+ Add workflow row');
let model=icp.workflowDetails;
assert.equal(model.workflows.length,1);
const workflow=model.workflows[0],stage=workflow.stages[0];
click('+ Add node');click('+ Add node');
assert.equal(stage.nodes.length,2);
const source=all(page()).find(n=>n.textContent==='Connect');source.onclick();
const boxes=all(page()).filter(n=>n.className==='icp-flow-node');
boxes[1].onclick({stopPropagation(){}});
assert.equal(stage.edges.length,1);
click('+ Maturity stage');
assert.equal(workflow.stages.length,2);
click('Choose this stage as use case');
assert.equal(workflow.chosenStage,workflow.activeStage);
assert.equal(stage.nodes.length,2);
const custom=all(page()).find(n=>n.placeholder==='Custom axis');
custom.value='Business model';click('+ Add custom axis');
click('+ Add workflow row');
assert.equal(model.workflows[1].axis,'Business model');
assert.equal(model.workflows[0].axis,'Departments');
const saved=JSON.parse(JSON.stringify(icp));
ctx.closeIcpWorkflowPage();ctx.openIcpWorkflowPage(saved);
assert.equal(saved.workflowDetails.workflows[0].stages[0].edges.length,1);
assert.equal(saved.buyingTrigger,'Growth');
ctx.closeIcpWorkflowPage();
const other={name:'Other ICP'};ctx.openIcpWorkflowPage(other);
assert.equal(other.workflowDetails,undefined);
assert.ok(find('No workflows for this axis yet. Add a row for a department, industry, country or other input segment.'));
ctx.closeIcpWorkflowPage();readonly=true;ctx.openIcpWorkflowPage(saved);
assert.equal(find('+ Add workflow row').disabled,true);
const before=JSON.stringify(saved);click('+ Add workflow row');assert.equal(JSON.stringify(saved),before);
assert.ok(dirty>0);
ctx.closeIcpWorkflowPage();assert.equal(pane.hidden,false);
console.log('PASS: View More navigation, custom axes, workflows, connections, maturity selection, independent ICP data, legacy notes, save/reload and read-only.');
