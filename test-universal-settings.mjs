import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import K from './keyword-columns.js';
class El{
 constructor(tag){this.tag=tag;this.children=[];this.value='';this.style={};}
 append(...els){els.forEach(e=>{e.parent=this;this.children.push(e)});}
 set innerHTML(v){this.children=[];}
 get lastChild(){return this.children.at(-1);}
 remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
 setAttribute(){}
}
const host=new El('div'), records=new Map();let dirty=0,readonly=false,n=0;
const state={user:{id:'user-a'},ownerId:'user-a',tabs:{},productWorkspaces:{second:{tabs:{}}}};
const sb={from(){let filters=[],payload,insert=false;return{
 update(p){payload=p;return this;},insert(p){payload=p;insert=true;return this;},
 eq(k,v){filters.push([k,v]);return this;},
 async select(){
  if(insert){if(records.has(payload.id))return {error:{message:'duplicate'},data:[]};}
  else {const old=[...records.values()].find(r=>filters.every(([k,v])=>r[k]===v));if(!old)return {data:[]};payload={...old,...payload};}
  records.set(payload.id,structuredClone(payload));return {data:[structuredClone(payload)]};
 }}}};
const ctx=vm.createContext({state,sb,KeywordColumns:K,crypto:webcrypto,TextEncoder,CONTENT_TAB:'Content Strategy',
 $:()=>host,document:{createElement:t=>new El(t)},uid:()=>String(++n),
 articleTypes:()=>[{id:'listicle',name:'Listicle'},{id:'info',name:'Informational'}],clientView:()=>readonly,toast:()=>{},markDirty:()=>dirty++,AWARENESS:['Problem aware']});
vm.runInContext(fs.readFileSync(new URL('./keyword-columns-ui.js',import.meta.url),'utf8'),ctx);
ctx.readKeywordSettings([]);ctx.renderUniversalColumns();
const all=(e=host)=>[e,...e.children.flatMap(all)];
assert.equal(all().filter(e=>e.tag==='table').length,10);
const draft=K.seed();draft.views.category[0].instruction='Shared guidance';
await ctx.saveUniversalColumns(draft,null);assert.equal(records.size,1);
assert.equal(state.tabs['Content Strategy'].views.category.columns[0].instruction,'Shared guidance');
assert.equal(state.productWorkspaces.second.tabs['Content Strategy'].views.category.columns[0].instruction,'Shared guidance');
const old=structuredClone([...records.values()][0]);
records.get(old.id).updated_at='newer revision';
const changed=structuredClone(draft);changed.views.category[0].name='Must not overwrite';
assert.equal(await ctx.saveUniversalColumns(changed,old),false);
assert.equal(JSON.parse(records.get(old.id).body).views.category[0].name,'Category name');
state.user={id:'user-b'};state.ownerId='user-b';ctx.readKeywordSettings([...records.values()]);
assert.equal(ctx.activeUniversalColumns(),null);
readonly=true;await ctx.saveUniversalColumns(draft,null);assert.equal(records.size,1);
assert.equal(dirty,1);
console.log('PASS: ten Settings tables, persisted owner-scoped templates, inactive product sync, concurrent-save rejection and cross-owner isolation.');
