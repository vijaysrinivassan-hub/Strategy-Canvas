import { readFile } from 'node:fs/promises';

const source=JSON.parse(await readFile(new URL('../competitive-intelligence-classifications.json',import.meta.url),'utf8'));
const urls=source.profiles.find(item=>item.id==='saras-analytics')?.urls;
if(!Array.isArray(urls)||urls.length!==770)throw new Error('SaraS URL inventory changed.');
const fields=['product','node','awarenessLevel','matrix','column'];
let hash=2166136261;
for(const url of urls)for(const char of url+'\n'){
  hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);
}
const dictionary=[],lookup=new Map(),indexes=[];
for(const url of urls){
  const meta=source.classifications[url];
  if(!meta)throw new Error(`Missing classification for ${url}`);
  const tuple=fields.map(field=>meta[field]||'');
  const key=JSON.stringify(tuple);
  if(!lookup.has(key)){lookup.set(key,dictionary.length);dictionary.push(tuple);}
  indexes.push(lookup.get(key));
}
console.log('[CI-SARAS-AI-LAYER-V1]'+JSON.stringify({urlsHash:(hash>>>0).toString(16),dictionary,indexes})+'[/CI-SARAS-AI-LAYER-V1]');
