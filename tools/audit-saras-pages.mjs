import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'competitive-intelligence-classifications.json'),'utf8'));
const profile=(source.profiles||[]).find(item=>item.id==='saras-analytics');
if(!profile)throw new Error('Saras Analytics profile is missing.');
const target=path.join(os.tmpdir(),'saras-page-audit.json');
const decode=value=>String(value||'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
const capture=(html,pattern)=>decode((html.match(pattern)||[])[1]||'');
const parse=html=>{
  const title=capture(html,/<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1=capture(html,/<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g,' ');
  const description=decode((html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["']/i)||html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i)||[])[1]||'');
  const text=decode(html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<svg\b[\s\S]*?<\/svg>/gi,' ').replace(/<!--([\s\S]*?)-->/g,' ').replace(/<[^>]+>/g,' ')).slice(0,16000);
  return {title,h1,description,text};
};
async function read(url){
  let last='';
  for(let attempt=0;attempt<3;attempt++)try{
    const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(25000),headers:{'user-agent':'Mozilla/5.0 Strategy Canvas category audit'}});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const html=await response.text();
    return {url,status:response.status,finalUrl:response.url,...parse(html)};
  }catch(error){last=String(error.message||error);}
  return {url,status:0,error:last,title:'',h1:'',description:'',text:''};
}

const urls=[...new Set(profile.urls||[])],results=new Array(urls.length);let next=0,done=0;
async function worker(){while(true){const index=next++;if(index>=urls.length)return;results[index]=await read(urls[index]);done++;if(done%25===0||done===urls.length)console.log(`AUDIT ${done}/${urls.length}`);}}
await Promise.all(Array.from({length:12},worker));
fs.writeFileSync(target,JSON.stringify({auditedAt:new Date().toISOString(),source:'Live Saras Analytics pages',results},null,2));
const failed=results.filter(item=>!item.status);
console.log(JSON.stringify({target,urls:urls.length,read:urls.length-failed.length,failed:failed.length,failures:failed.map(item=>({url:item.url,error:item.error}))},null,2));
