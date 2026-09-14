import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';

const TAB = 'Strategy 1 — Product Architecture';
export async function architecturePrompts() {
  return JSON.parse(await readFile(new URL('../../../ai-prompts.json', import.meta.url), 'utf8')).product_architecture;
}
const architectureSchema = z.object({
  name: z.string().min(1), summary: z.string(),
  systems: z.array(z.object({id:z.string().min(1),name:z.string().min(1),height:z.number().min(230)})),
  nodes: z.array(z.object({id:z.string().min(1),systemId:z.string(),label:z.string().min(1),type:z.enum(['technology','people']),x:z.number().min(10),y:z.number().min(54)})),
  edges: z.array(z.object({id:z.string().min(1),from:z.string(),to:z.string(),label:z.string().min(1)})),
  groups: z.array(z.object({id:z.string().min(1),systemId:z.string(),name:z.string().min(1),nodeIds:z.array(z.string()).min(2)}))
});
export function registerArchitectureTools(server:McpServer) {
  server.registerTool('ai_prompts_get', {
    title:'Read AI Prompts', description:'Read the same reusable Product Architecture prompt shown by the AI Prompts button. Use before building architecture.',
    inputSchema:{}, annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  }, async()=>ok(await architecturePrompts()));
  server.registerTool('product_architecture_get', {
    title:'Read product architecture workflows', description:'Read the Strategy Product Architecture workflow editor (not the older generic canvas), plus its AI prompt. Keep revision for a subsequent write.',
    inputSchema:{board_id:z.string()}, annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  }, async({board_id})=>{
    const {row,body}=await loadBoard(board_id);
    return ok({client:body.client,revision:row.updated_at,architecture:body.tabs[TAB]?.architecture||null,ai_prompt:await architecturePrompts()});
  });
  server.registerTool('product_architecture_set', {
    title:'Save product architecture workflows',
    description:'Save the complete workflow architecture to Strategy Product Architecture. Read first, preserve existing work unless replacement was requested, and supply its revision. Rows are workflows; nodes are Technology or People; edge labels are outputs. Keep 154px-wide nodes and groups inside row bounds with space between labels. Omitted prior nodes are removed.',
    inputSchema:{board_id:z.string(),revision:z.string(),architecture:architectureSchema},
    annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false}
  }, async({board_id,revision,architecture})=>{
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read it again before saving.');
    const unique=(items:{id:string}[])=>new Set(items.map(i=>i.id)).size===items.length;
    if(![architecture.systems,architecture.nodes,architecture.edges,architecture.groups].every(unique))throw new ToolError('Duplicate ids.');
    const nodes=new Map(architecture.nodes.map(n=>[n.id,n]));
    for(const n of architecture.nodes){
      const system=architecture.systems.find(s=>s.id===n.systemId);
      if(!system || n.y+96>system.height || n.x+176>1060)throw new ToolError('Node falls outside its workflow row.');
    }
    for(const e of architecture.edges)if(!nodes.has(e.from)||!nodes.has(e.to)||e.from===e.to)throw new ToolError('Invalid connector endpoints.');
    for(const g of architecture.groups)if(new Set(g.nodeIds).size!==g.nodeIds.length||g.nodeIds.some(id=>!nodes.has(id)||nodes.get(id)!.systemId!==g.systemId))throw new ToolError('Group members must belong to the same workflow.');
    const slot=body.tabs[TAB]||(body.tabs[TAB]={nodes:[],edges:[]});
    slot.architecture={...slot.architecture,...architecture,version:3,sample:'blank',nodes:architecture.nodes.map(n=>({...n,width:154}))};
    const {data,error}=await db().from('reports').update({body:JSON.stringify(body),updated_at:new Date().toISOString()}).eq('id',board_id).eq('updated_at',revision).select('updated_at');
    if(error)throw new ToolError(error.message);
    if(!data?.length)throw new ToolError('Concurrent edit detected; read again.');
    return ok({saved:true,revision:data[0].updated_at,systems:architecture.systems.length,nodes:architecture.nodes.length,connections:architecture.edges.length});
  });
}
