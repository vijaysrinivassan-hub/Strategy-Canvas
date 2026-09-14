import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import K from './keyword-columns.js';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
let normalizations=0;
const ctx=vm.createContext({state:{tabs:{content:{articleTypes:[{id:'a',name:'Article'}]}}},CONTENT_TAB:'content',contentRoot:()=>{normalizations++;throw Error('Unexpected full normalization')},uid:()=>'',DEFAULT_ARTICLE_TYPES:[]});
vm.runInContext(html.slice(html.indexOf('function articleTypes(){'),html.indexOf('function columnTools(')),ctx);
for(let i=0;i<10000;i++)ctx.articleTypes();
assert.equal(normalizations,0);
// Refresh renders once and ignores older requests after a table switch.
let renders=0;const pending=[],state={boardId:'a',contentView:'category',tab:'content',screen:'board'};
const table={setAttribute(){},removeAttribute(){}},setup={};
const refresh=vm.createContext({state,CONTENT_TAB:'content',$:id=>id==='mxTable'?table:setup,loadKeywords:()=>new Promise(r=>pending.push(r)),renderContentView:()=>renders++});
vm.runInContext(html.slice(html.indexOf('let matrixRefreshRequest ='),html.indexOf('function renderContentView(){')),refresh);
const first=refresh.refreshMatrix();assert.equal(renders,0);
state.contentView='icp';const second=refresh.refreshMatrix();
pending[0](null);await first;assert.equal(renders,0);
pending[1](null);await second;assert.equal(renders,1);
// Reorder moves existing cell nodes instead of invoking a renderer.
const rows=Array.from({length:100},(_,i)=>({children:[{id:'n'+i},{id:'a'+i},{id:'b'+i}],append(x){this.children=this.children.filter(c=>c!==x);this.children.push(x);}}));
const old=rows.map(r=>r.children.slice());
const grid={querySelectorAll:s=>s==='tr'?rows:[],querySelector:()=>null};
const move=vm.createContext({KeywordColumns:K});
vm.runInContext(fs.readFileSync(new URL('./keyword-columns-ui.js',import.meta.url),'utf8'),move);
move.moveKeywordTableColumns(grid,['a','b'],['b','a']);
rows.forEach((row,i)=>{assert.equal(row.children[0],old[i][0]);assert.equal(row.children[1],old[i][2]);assert.equal(row.children[2],old[i][1]);});
// Header arrows retain their direction and move only the selected column.
const view={columns:[{id:'a'},{id:'b'},{id:'c'}]};
const controls=vm.createContext({
 KeywordColumns:K,CONTENT_TAB:'content',state:{contentView:'category',tabs:{content:{views:{category:view}}}},
 readOnly:()=>false,markDirty:()=>{},$:()=>grid,
 document:{createElement:()=>({children:[],dataset:{},setAttribute(){},append(b){this.children.push(b);}})}
});
vm.runInContext(fs.readFileSync(new URL('./keyword-columns-ui.js',import.meta.url),'utf8'),controls);
controls.moveKeywordTableColumns=()=>{};
const arrows=controls.keywordOrderTools(view.columns[1]).children;
assert.equal(arrows[0].textContent,'‹');assert.equal(arrows[1].textContent,'›');
assert.equal(arrows[0].className,'column-move column-move-left');
assert.equal(arrows[1].className,'column-move column-move-right');
arrows[0].onclick({stopPropagation(){}});
assert.deepEqual(K.order(view),['b','a','c']);
controls.keywordOrderTools(view.columns.find(c=>c.id==='b')).children[1].onclick({stopPropagation(){}});
assert.deepEqual(K.order(view),['a','b','c']);
assert.match(html,/\.column-move-left\{left:2px\}/);
assert.match(html,/\.column-move-right\{right:2px\}/);
const save=html.slice(html.indexOf('let boardSaveInFlight'),html.indexOf('async function newBoard'));
assert(!save.includes('refreshBoards()'));
console.log('PASS: 10,000 dropdown reads trigger 0 table normalizations; one render per load; stale loads ignored; 100 rows reordered with identical cell nodes; autosave has no directory fetch.');
