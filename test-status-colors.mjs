import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const ctx=vm.createContext({document:{createElement:()=>({dataset:{},children:[],setAttribute(){},append(el){this.children.push(el);},classList:{toggle(){}}})}});
vm.runInContext(html.slice(html.indexOf('const STATUS = ['),html.indexOf('/* The controls every content cell carries')),ctx);
const ids=['written','review','progress','planned','for_review','selected','rejected'];
const colors=new Set();
for(const id of ids){
 let saved;
 const select=ctx.statusSelect(id,false,value=>saved=value);
 assert.equal(select.dataset.status,id);assert.equal(select.children.length,8);
 assert.equal(select.children.find(o=>o.value===id).dataset.status,id);
 select.value='selected';select.onchange();assert.equal(saved,'selected');assert.equal(select.dataset.status,'selected');
 select.value='';select.onchange();assert.equal(select.dataset.status,'');
 const rule=html.split('.gr-status[data-status="'+id+'"]')[1].split('}')[0];
 const color=rule.match(/--status-bg:(#[0-9a-f]+)/)[1];colors.add(color);
}
assert.equal(colors.size,7);
assert.equal(ctx.statusSelect('unknown',true,()=>{}).dataset.status,'');
assert.equal(ctx.statusSelect('review',true,()=>{}).disabled,true);
console.log('PASS: seven unique status colors; saved/default/disabled controls; color changes immediately and resets when cleared.');
