import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';
import { architecturePrompts } from './architecture.js';

const TAB = 'Strategy 1 — Positioning Canvas';

/* Like Product Architecture, the browser keeps the selected product's Positioning Canvas in
   the live tab and in productWorkspaces. Both copies must move together. */
function activeProductTab(body:any, requestedProductId?:string){
  const productId=requestedProductId||body.workspaceProductId;
  const workspace=productId&&body.productWorkspaces?.[productId];
  return workspace?.tabs?.[TAB]||body.tabs?.[TAB]||null;
}
function writeBoth(body:any, key:'positioning'|'problems', value:any, requestedProductId?:string){
  body.tabs ||= {};
  const live=body.tabs[TAB] ||= {nodes:[],edges:[]};
  live[key]=value;
  const productId=requestedProductId||body.workspaceProductId;
  if(!productId)return;
  body.productWorkspaces ||= {};
  const workspace=body.productWorkspaces[productId] ||= {tabs:{}};
  workspace.tabs ||= {};
  const productTab=workspace.tabs[TAB] ||= {nodes:[],edges:[]};
  productTab[key]=JSON.parse(JSON.stringify(value));
}

const icpRow=z.object({id:z.string().min(1),people:z.string(),process:z.string(),technology:z.string(),input:z.string()}).passthrough();
const icp=z.object({id:z.string().min(1),name:z.string(),buyingTrigger:z.string(),industries:z.string(),useCases:z.string(),
  rows:z.array(icpRow).min(1)}).passthrough();
const category=z.object({id:z.string().min(1),name:z.string(),maturity:z.string(),
  competitors:z.array(z.object({id:z.string().min(1),name:z.string()}).passthrough())}).passthrough();
const stage=z.object({id:z.string().min(1),competitors:z.string(),architecture:z.string()}).passthrough();
const valueRow=z.object({id:z.string().min(1),functional:z.string(),benefit:z.string(),monetary:z.string(),strategic:z.string(),
  isUsp:z.boolean().optional()}).passthrough();
const positioningSchema=z.object({
  selectedIcp:z.string().optional(), selectedCategory:z.string().optional(),
  icps:z.array(icp).optional(), categories:z.array(category).optional(),
  competitive:z.object({selectedStage:z.string(),stages:z.array(stage)}).optional(),
  valueRows:z.array(valueRow).optional()
}).passthrough();
const evidence=z.object({id:z.string().min(1),type:z.enum(['url','document']),label:z.string(),url:z.string(),document:z.string()});
const problemSchema=z.object({id:z.string().min(1),problem:z.string(),evidences:z.array(evidence).min(1)}).passthrough();

export function registerPositioningCanvasTools(server:McpServer){
  server.registerTool('positioning_canvas_get', {
    title:'Read positioning canvas',
    description:'Read the active product’s Positioning Canvas: ICP cards (rows of People, Process, Technology, Input plus Buying Trigger, Industries, Use Cases), solution categories with competitors, competitive evolution stages, problems with their evidence links, and value rows (functional, benefit, monetary, strategic; one may be the USP), plus the canvas AI prompt. Keep revision for a subsequent write.',
    inputSchema:{board_id:z.string(),product_id:z.string().optional()},
    annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  }, async({board_id,product_id})=>{
    const {row,body}=await loadBoard(board_id);
    const tab=activeProductTab(body,product_id);
    return ok({client:body.client,product_id:product_id||body.workspaceProductId||null,revision:row.updated_at,
      positioning:tab?.positioning||null,problems:tab?.problems||null,ai_prompt:await architecturePrompts(body,'positioning_canvas')});
  });
  server.registerTool('positioning_canvas_set', {
    title:'Save positioning canvas',
    description:'Save the active product’s Positioning Canvas. Read first and supply its revision. positioning keys you send replace those keys (icps, categories, competitive, valueRows, selectedIcp, selectedCategory); keys you omit are kept. problems, when sent, replaces the whole problem list; value row N is the value for problem N. Leave selectedIcp and selectedCategory empty unless the user has chosen. Writes the live tab and the product workspace together.',
    inputSchema:{board_id:z.string(),product_id:z.string().optional(),revision:z.string(),
      positioning:positioningSchema.optional(),problems:z.array(problemSchema).optional()},
    annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false}
  }, async({board_id,product_id,revision,positioning,problems})=>{
    if(!positioning&&!problems)throw new ToolError('Send positioning, problems or both.');
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read it again before saving.');
    const previous=activeProductTab(body,product_id)||{};
    if(positioning){
      const merged={...(previous.positioning||{}),...positioning};
      for(const key of ['selectedIcp','selectedCategory'] as const){
        const list=key==='selectedIcp'?merged.icps:merged.categories;
        if(merged[key]&&!(list||[]).some((item:any)=>item.id===merged[key]))throw new ToolError(key+' must match an existing id.');
      }
      writeBoth(body,'positioning',merged,product_id);
    }
    if(problems)writeBoth(body,'problems',problems,product_id);
    const {data,error}=await db().from('reports').update({body:JSON.stringify(body),updated_at:new Date().toISOString()})
      .eq('id',board_id).eq('updated_at',revision).select('updated_at');
    if(error)throw new ToolError(error.message);
    if(!data?.length)throw new ToolError('Concurrent edit detected; read again.');
    const saved=activeProductTab(body,product_id);
    return ok({saved:true,product_id:product_id||body.workspaceProductId||null,revision:data[0].updated_at,
      icps:saved?.positioning?.icps?.length||0,categories:saved?.positioning?.categories?.length||0,
      stages:saved?.positioning?.competitive?.stages?.length||0,problems:saved?.problems?.length||0,
      valueRows:saved?.positioning?.valueRows?.length||0});
  });
}
