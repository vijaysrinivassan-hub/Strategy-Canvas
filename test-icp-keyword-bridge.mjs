import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const KeywordColumns=require('./keyword-columns.js');
const ctx=vm.createContext({KeywordColumns});
vm.runInContext(fs.readFileSync('icp-keyword-bridge.js','utf8')+'\nglobalThis.bridge=IcpKeywordBridge;',ctx);
const b=ctx.bridge;
let id=0;const uid=()=>String(++id);
const root={views:{icp:{kind:'grid',rows:[],columns:[]}},articleTypes:[]};
const source={icpId:'icp1',rowId:'r1',axis:'process',column:'inventory',text:'Process: Demand forecasting\nNext stage',label:'Inventory'};
assert.equal(b.topic(source.text),'Demand forecasting');
for(const format of ['listicle','service','informational']){
 const ideas=b.suggest('demand forecasting',format);
 const result=b.add(root,source,format,'aeo','Demand forecasting',ideas,uid);
 assert.equal(result.created,true);
 assert.equal(result.row.pageGroup,b.formats[format].group);
 assert.equal(result.cell.kws.length,0);
 assert.equal(result.cell.keywordIdeas.length,3);
 assert.equal(result.cell.st,'for_review');
 assert.equal(b.add(root,source,format,'aeo','Duplicate',[],uid).created,false);
 assert.equal(result.cell.v.includes('Duplicate'),false);
}
assert.equal(b.add(root,source,'service','seo','Demand forecasting',[],uid).created,true);
assert.equal(root.views.icp.rows.length,4);
assert.throws(()=>b.add(root,source,'wrong','aeo','x',[],uid));
const other={views:{icp:{kind:'grid',rows:[],columns:[]}},articleTypes:[]};
assert.equal(b.add(other,source,'service','aeo','Demand forecasting',[],uid).created,true);
assert.equal(root.views.icp.rows.length,4);
const html=fs.readFileSync('index.html','utf8');
vm.runInContext(html.slice(html.indexOf('function cellOf('),html.indexOf('function renderArticleTypes(')),ctx);
const result=b.find(root.views.icp,b.key(source),'service','aeo');
ctx.setCellIn(result.row,result.column,{url:'demand-forecasting'});
assert.equal(result.row.cells[result.column].keywordIdeas.length,3);
assert.equal(result.row.cells[result.column].icpSource.key,b.key(source));
assert.equal(result.row.cells[result.column].url,'demand-forecasting');
assert.match(fs.readFileSync('icp-keyword-bridge.js','utf8'),/state.workspaceProductId!==product/);
assert.match(fs.readFileSync('icp-keyword-bridge.js','utf8'),/if\(readOnly\(\)\)return/);
const m=require('./tools/refine-ai-processes.cjs');
const before={client:'AI Data Platform',workspaceProductId:m.PRODUCT,tabs:{[m.TAB]:{aiPrompt:'Original',positioning:{selectedIcp:'',icps:Array.from({length:6},(_,i)=>({id:String(i),process:'prior',rows:[{id:'r'+i,process:'prior',dimensions:{process:{'[\"departments\",\"inventory\"]':'stock data',unrelated:'keep'}}}],workflowDetails:{keep:true}}))}}},productWorkspaces:{[m.PRODUCT]:{tabs:{}}}};
assert.equal(m.migrate(before).cells,6);
assert.match(before.tabs[m.TAB].positioning.icps[3].rows[0].dimensions.process['["departments","inventory"]'],/^Process: Demand forecasting and replenishment simulation/);
assert.equal(before.tabs[m.TAB].positioning.icps[0].rows[0].dimensions.process.unrelated,'keep');
assert.equal(before.tabs[m.TAB].positioning.icps[0].workflowDetails.keep,true);
assert.deepEqual(before.tabs[m.TAB],before.productWorkspaces[m.PRODUCT].tabs[m.TAB]);
assert.equal(m.migrate(before).changed,false);
console.log('PASS: format/channel routing, sparse placement, deduplication, product isolation, suggestions without metrics, metadata persistence, guarded process refinement and idempotence.');

class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 get value(){return this._value??(this.tag==='select'?this.children[0]?.value:'')??'';}
 set value(v){this._value=v;}
 remove(){this.removed=true;}
 close(){this.onclose?.();}
 showModal(){this.open=true;}
 focus(){}
}
const body=new Element('body');const descendants=n=>n.children.flatMap(c=>[c,...descendants(c)]);
let readonly=false,dirty=0,navigations=0;
const uiRoot={views:{icp:{kind:'grid',rows:[],columns:[]}},articleTypes:[]};
const state={boardId:'board',workspaceProductId:'product',tabs:{keywords:uiRoot}};
Object.assign(ctx,{state,CONTENT_TAB:'keywords',keywordMode:'aeo',readOnly:()=>readonly,uid,contentRoot:()=>uiRoot,markDirty:()=>dirty++,switchContentView:()=>navigations++,requestAnimationFrame:fn=>fn(),
 document:{body,createElement:t=>new Element(t),getElementById:id=>body.children.find(n=>n.id===id&&!n.removed)}});
const latest=()=>body.children.at(-1);
const button=(dialog,label)=>descendants(dialog).find(n=>n.tag==='button'&&n.textContent===label);
ctx.openIcpKeywordBrief(source);
button(latest(),'Cancel').onclick();assert.equal(uiRoot.views.icp.rows.length,0);
ctx.openIcpKeywordBrief(source);
state.workspaceProductId='other';button(latest(),'Add to Keywords').onclick();assert.equal(uiRoot.views.icp.rows.length,0);
assert.match(descendants(latest()).find(n=>n.attrs.role==='alert').textContent,/changed/);
state.workspaceProductId='product';button(latest(),'Add to Keywords').onclick();
assert.equal(uiRoot.views.icp.rows.length,1);assert.equal(dirty,1);assert.equal(navigations,1);
ctx.openIcpKeywordBrief(source);button(latest(),'Add to Keywords').onclick();
assert.equal(uiRoot.views.icp.rows.length,1);assert.equal(dirty,1);
readonly=true;const count=body.children.length;ctx.openIcpKeywordBrief(source);assert.equal(body.children.length,count);
console.log('PASS: picker cancel, client/product-change guard, confirm, duplicate confirm and read-only interactions.');
