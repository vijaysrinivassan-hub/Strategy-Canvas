import { z } from 'zod';
import { createRequire } from 'node:module';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';
const A=createRequire(import.meta.url)('../../../keyword-assignments.js');
const TAB='Content Strategy';
const destination=z.object({
 view:z.enum(['category','competitor','icp','value','comparison']),
 row_id:z.string().optional(),column_id:z.string().optional(),
 competitor_ids:z.array(z.string()).length(2).optional(),
 keyword_ids:z.array(z.string().uuid()).min(1).max(500),
 status:z.enum(['written','review','progress','planned','for_review','selected','rejected']).optional()
});
export function registerKeywordAssignmentTools(server:McpServer){
 server.registerTool('keyword_cells_get',{
  title:'Read keyword cells and comparison matrix',
  description:'Read active product cell IDs, comparison cells and board revision before assigning keywords. Comparison pairs are unordered; use each pair once.',
  inputSchema:{board_id:z.string()},annotations:{readOnlyHint:true}
 },async({board_id})=>{
  const {row,body}=await loadBoard(board_id);
  return ok({revision:row.updated_at,product_id:body.workspaceProductId,views:body.tabs[TAB]?.views||{}});
 });
 server.registerTool('keyword_move_to_cells',{
  title:'Move keywords into article cells',
  description:'Move existing board keyword IDs into cells on the specified ACTIVE product. Read keyword_cells_get first. Batch is atomic with revision guard. Moves remove previous explicit cell assignments within this product. Assigned records disappear from Keyword Repo but metrics remain available in their cells. Existing titles and article settings are preserved unless status is explicitly supplied. Comparison defaults are Competitor article type and Competitor aware; positive-volume keyword assignments start For review when no status exists. Comparison accepts two distinct competitor IDs in either order.',
  inputSchema:{board_id:z.string(),product_id:z.string(),revision:z.string(),assignments:z.array(destination).min(1).max(100)},
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}
 },async({board_id,product_id,revision,assignments})=>{
  const {row,body}=await loadBoard(board_id);
  if(row.updated_at!==revision)throw new ToolError('Board changed. Read again before assigning.');
  if(body.workspaceProductId!==product_id)throw new ToolError('Active product changed. Read again.');
  const ids=assignments.flatMap(a=>a.keyword_ids);
  if(new Set(ids).size!==ids.length)throw new ToolError('Assign each keyword to only one destination per batch.');
  const {data:keywords,error:readError}=await db().from('keywords').select('id,volume,keyword').eq('board_id',board_id).in('id',ids);
  if(readError)throw new ToolError(readError.message);
  if(keywords?.length!==ids.length)throw new ToolError('Some keyword IDs do not belong to this board.');
  for(const a of assignments){
   if(a.view!=='comparison' && keywords?.some(k=>a.keyword_ids.includes(k.id)&&A.isComparison(k.keyword)))throw new ToolError('Vs/versus keywords belong only in the comparison matrix, including pricing, features and reviews variants.');
   const v=body.tabs[TAB]?.views?.[a.view==='comparison'?'competitor':a.view];
   if(!v)throw new ToolError('View does not exist.');
   let target:any;
   if(a.view==='comparison'){
    const pair=a.competitor_ids;
    if(!pair||pair[0]===pair[1]||pair.some(id=>!v.rows.some((r:any)=>r.id===id)))throw new ToolError('Choose two existing, different competitors.');
    const key=JSON.stringify([...pair].sort());
    v.comparisonCells ||= {};target=v.comparisonCells[key] ||= {};
   }else{
    const r=v.rows?.find((r:any)=>r.id===a.row_id);
    const columns=v.kind==='matrix'?v.types:v.columns;
    if(!r||!columns?.some((c:any)=>c.id===a.column_id))throw new ToolError('Unknown row or column.');
    const bucket=v.kind==='matrix'?(v.cells ||= {}):(r.cells ||= {});
    const key=v.kind==='matrix'?a.row_id+'|'+a.column_id:a.column_id!;
    const old=bucket[key];target=bucket[key]=typeof old==='string'?{v:old}:old===true?{on:true}:old||{};
   }
   A.move(body.tabs,target,a.keyword_ids);
   if(a.view==='comparison'){
    const defaults=A.comparisonDefaults(body.tabs[TAB]);
    if(!target.type)target.type=defaults.type;
    if(!target.aw)target.aw=defaults.aw;
    if(target.st===undefined && keywords?.some(k=>a.keyword_ids.includes(k.id)&&Number(k.volume)>0))target.st='for_review';
   }
   if(a.status!==undefined)target.st=a.status;
  }
  const {data,error}=await db().from('reports').update({body:JSON.stringify(body),updated_at:new Date().toISOString()}).eq('id',board_id).eq('updated_at',revision).select('updated_at');
  if(error)throw new ToolError(error.message);
  if(!data?.length)throw new ToolError('Concurrent edit; nothing saved. Read again.');
  return ok({moved:ids.length,cells:assignments.length,product_id,revision:data[0].updated_at});
 });
}
