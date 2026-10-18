import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';

const TAB = 'Strategy 1 — Brand Strategy';
const SIZES = [['enterprise','Enterprise'],['mid','Mid-market'],['smb','Small business']];

/* Onboarding answers live on the Brand Strategy tab at guide.onboarding. That tab is shared by every
   product, but if a product workspace ever holds a copy of it, that copy must move with the live tab. */
function onboardingOf(tab:any){return tab?.guide?.onboarding||null;}
/* Same segments as obfSegments in onboarding-flow.js: every country × company size is one dot. */
function segmentsOf(body:any){
  const onboarding=onboardingOf(body.tabs?.[TAB])||{};
  const codes=(body.clientMarkets||[]).filter(Boolean);
  const chosen=Array.isArray(onboarding.companySizes)?onboarding.companySizes:[];
  const sizes=SIZES.filter(size=>chosen.includes(size[0]));
  if(!codes.length&&!sizes.length)return [];
  const segments:{key:string,country:string,size:string,label:string}[]=[];
  (codes.length?codes:['']).forEach((code:string)=>(sizes.length?sizes:[['','']]).forEach(([size,label])=>{
    segments.push({key:(code||'any')+'|'+(size||'any'),country:code,size,label:[code,label].filter(Boolean).join(' · ')});
  }));
  return segments;
}
function savedPositions(body:any){return onboardingOf(body.tabs?.[TAB])?.marketMap?.positions||{};}
function writePositions(tab:any, positions:any){
  tab.guide ||= {opened:false};
  const onboarding=tab.guide.onboarding ||= {activeStep:'product',locked:{}};
  onboarding.marketMap ||= {positions:{}};
  onboarding.marketMap.positions=JSON.parse(JSON.stringify(positions));
}
async function onboardingPrompt(){
  return JSON.parse(await readFile(new URL('../../../ai-prompts.json', import.meta.url), 'utf8')).gtm_strategy_seo;
}

export function registerOnboardingMarketMapTools(server:McpServer){
  server.registerTool('onboarding_market_map_get', {
    title:'Read onboarding market map',
    description:'Read the onboarding Market map: one segment per country (board clientMarkets) × company size (enterprise, mid, smb) the client picked, each with its saved dot position. x is buyer awareness from 0 (least aware) to 1 (most aware); y is value delivered from 0 to 1 (what the product gives minus what the buyer pays and expects). source is "ai" (placed by the AI), "you" (the client dragged it; never overwrite) or missing (the app shows a rough built-in estimate). Keep revision for onboarding_market_map_set.',
    inputSchema:{board_id:z.string()},
    annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  }, async({board_id})=>{
    const {row,body}=await loadBoard(board_id);
    const positions=savedPositions(body);
    const segments=segmentsOf(body).map(segment=>({...segment,position:positions[segment.key]||null}));
    return ok({client:body.client,revision:row.updated_at,countries:(body.clientMarkets||[]).filter(Boolean),
      company_sizes:onboardingOf(body.tabs?.[TAB])?.companySizes||[],segments,ai_prompt:await onboardingPrompt()});
  });
  server.registerTool('onboarding_market_map_set', {
    title:'Place onboarding market map dots',
    description:'Place Market map dots for segments from onboarding_market_map_get. Read first and supply its revision. Each position gives a segment key ("US|enterprise") with x (buyer awareness 0..1) and y (value delivered 0..1); it is saved with source "ai". Segments the client dragged (source "you") are skipped and reported, unless override_client is true because the client asked for the AI to re-place them. Segments you do not send are kept.',
    inputSchema:{board_id:z.string(),revision:z.string(),
      positions:z.array(z.object({key:z.string().min(1),x:z.number().min(0).max(1),y:z.number().min(0).max(1)})).min(1),
      override_client:z.boolean().default(false)},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}
  }, async({board_id,revision,positions,override_client})=>{
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read it again before saving.');
    const valid=new Set(segmentsOf(body).map(segment=>segment.key));
    const unknown=positions.filter(position=>!valid.has(position.key)).map(position=>position.key);
    if(unknown.length)throw new ToolError('Unknown segment keys: '+unknown.join(', ')+'. Valid keys: '+([...valid].join(', ')||'none (pick countries and company sizes first)')+'.');
    const next={...savedPositions(body)},placed:string[]=[],skipped:string[]=[];
    for(const position of positions){
      if(next[position.key]?.source==='you'&&!override_client){skipped.push(position.key);continue;}
      next[position.key]={x:Math.round(position.x*1000)/1000,y:Math.round(position.y*1000)/1000,source:'ai'};
      placed.push(position.key);
    }
    if(!placed.length)return ok({saved:false,revision,placed,skipped_client_placed:skipped});
    body.tabs ||= {};
    writePositions(body.tabs[TAB] ||= {nodes:[],edges:[]},next);
    for(const workspace of Object.values<any>(body.productWorkspaces||{})){
      if(workspace?.tabs?.[TAB])writePositions(workspace.tabs[TAB],next);
    }
    const {data,error}=await db().from('reports').update({body:JSON.stringify(body),updated_at:new Date().toISOString()})
      .eq('id',board_id).eq('updated_at',revision).select('updated_at');
    if(error)throw new ToolError(error.message);
    if(!data?.length)throw new ToolError('Concurrent edit detected; read again.');
    return ok({saved:true,revision:data[0].updated_at,placed,skipped_client_placed:skipped});
  });
}
