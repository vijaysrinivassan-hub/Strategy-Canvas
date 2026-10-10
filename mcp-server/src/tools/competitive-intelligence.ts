import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';

const TAB = 'Competitive Intelligence';
const urlClassificationSchema = z.object({
  product:z.string().optional(), node:z.string().optional(), awarenessLevel:z.string().optional(),
  matrix:z.string().optional(), column:z.string().optional()
});
const competitorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  domain: z.string().optional().default(''),
  aliases: z.array(z.string()).optional().default([]),
  sitemaps: z.array(z.string().url()).max(100).optional().default([]),
  urls: z.array(z.string().url()).max(10000).optional().default([]),
  urlClassificationsByProduct:z.record(z.string(),z.record(z.string().url(),urlClassificationSchema)).optional(),
  source: z.string().optional().default('MCP'),
  status: z.enum(['complete','indexed_snapshot','domain_required','empty']).optional().default('complete'),
  note: z.string().optional(),
  fetchedAt: z.string().optional()
});
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);

export function registerCompetitiveIntelligenceTools(server:McpServer){
  server.registerTool('competitive_intelligence_get', {
    title:'Read competitive intelligence',
    description:'Read company-level competitor sitemap sources and discovered URLs shared across every product on this client board. Omit competitor to list every profile; supply a name for one exhaustive inventory. Keep revision before writing.',
    inputSchema:{board_id:z.string(),competitor:z.string().optional()},
    annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  }, async({board_id,competitor})=>{
    const {row,body}=await loadBoard(board_id);
    const items=Array.isArray(body.tabs[TAB]?.competitors)?body.tabs[TAB].competitors:[];
    const selected=competitor
      ? items.filter((item:any)=>String(item.name||'').toLowerCase()===competitor.toLowerCase() ||
          (item.aliases||[]).some((alias:string)=>alias.toLowerCase()===competitor.toLowerCase()))
      : items;
    return ok({client:body.client,scope:'company',revision:row.updated_at,competitors:selected});
  });

  server.registerTool('competitive_intelligence_set', {
    title:'Save one competitor URL inventory',
    description:'Create or update one company-level competitor profile shared across every product on this client board. Read first and supply revision. replace=true replaces its URL inventory; false merges and deduplicates.',
    inputSchema:{board_id:z.string(),revision:z.string(),competitor:competitorSchema,replace:z.boolean().default(true)},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}
  }, async({board_id,revision,competitor,replace})=>{
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read it again before saving.');
    const slot=body.tabs[TAB]||(body.tabs[TAB]={nodes:[],edges:[],competitors:[]});
    if(!Array.isArray(slot.competitors))slot.competitors=[];
    const lower=competitor.name.toLowerCase();
    const index=slot.competitors.findIndex((item:any)=>item.id===competitor.id ||
      String(item.name||'').toLowerCase()===lower ||
      (item.aliases||[]).some((alias:string)=>alias.toLowerCase()===lower));
    const previous=index>=0?slot.competitors[index]:null;
    const next:any={...previous,...competitor,id:competitor.id||previous?.id||uid(),
      fetchedAt:competitor.fetchedAt||new Date().toISOString()};
    if(previous&&!replace){
      next.urls=[...new Set([...(previous.urls||[]),...competitor.urls])];
      next.sitemaps=[...new Set([...(previous.sitemaps||[]),...competitor.sitemaps])];
      next.aliases=[...new Set([...(previous.aliases||[]),...competitor.aliases])];
      next.urlClassificationsByProduct={...(previous.urlClassificationsByProduct||{}),...(competitor.urlClassificationsByProduct||{})};
    }else{
      next.urls=[...new Set(competitor.urls)];
      next.sitemaps=[...new Set(competitor.sitemaps)];
      next.aliases=[...new Set(competitor.aliases)];
    }
    if(index>=0)slot.competitors[index]=next;else slot.competitors.push(next);
    slot.activeCompetitorId=next.id;
    const {data,error}=await db().from('reports')
      .update({body:JSON.stringify(body),updated_at:new Date().toISOString()})
      .eq('id',board_id).eq('updated_at',revision).select('updated_at');
    if(error)throw new ToolError(error.message);
    if(!data?.length)throw new ToolError('Concurrent edit detected; read again.');
    return ok({saved:true,revision:data[0].updated_at,competitor:next.name,sitemaps:next.sitemaps.length,urls:next.urls.length});
  });

  server.registerTool('competitive_intelligence_classify_urls', {
    title:'Classify competitor URLs for one product',
    description:'Save Product, Node, Awareness, Matrix and Column overrides for existing URLs under one product on a company board. Read the profile first and supply its revision.',
    inputSchema:{board_id:z.string(),revision:z.string(),competitor:z.string(),product:z.string().min(1),classifications:z.record(z.string().url(),urlClassificationSchema)},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}
  }, async({board_id,revision,competitor,product,classifications})=>{
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read it again before saving.');
    const item=body.tabs[TAB]?.competitors?.find((candidate:any)=>candidate.id===competitor ||
      String(candidate.name||'').toLowerCase()===competitor.toLowerCase());
    if(!item)throw new ToolError('Competitor not found on this board.');
    const known=new Set(item.urls||[]);
    const unknown=Object.keys(classifications).filter(url=>!known.has(url));
    if(unknown.length)throw new ToolError(`${unknown.length} URLs are not in the competitor inventory.`);
    item.urlClassificationsByProduct ||= {};
    item.urlClassificationsByProduct[product]={...(item.urlClassificationsByProduct[product]||{}),...classifications};
    const {data,error}=await db().from('reports')
      .update({body:JSON.stringify(body),updated_at:new Date().toISOString()})
      .eq('id',board_id).eq('updated_at',revision).select('updated_at');
    if(error)throw new ToolError(error.message);
    if(!data?.length)throw new ToolError('Concurrent edit detected; read again.');
    return ok({saved:true,revision:data[0].updated_at,competitor:item.name,product,classified:Object.keys(classifications).length});
  });
}
