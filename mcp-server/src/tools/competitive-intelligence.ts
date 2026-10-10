import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db, loadBoard, ok, ToolError } from '../lib.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const ReviewedRouting=createRequire(import.meta.url)('../../../saras-reviewed-routing.cjs');
const KeywordColumns=createRequire(import.meta.url)('../../../keyword-columns.js');

const TAB = 'Competitive Intelligence';
const urlClassificationSchema = z.object({
  product:z.string().optional(), node:z.string().optional(), nodeId:z.string().optional(), supportingNode:z.string().optional(), supportingNodeId:z.string().optional(), awarenessLevel:z.string().optional(),
  matrix:z.string().optional(), column:z.string().optional(),pageTitle:z.string().optional(),pageDescription:z.string().optional(),reviewNotes:z.string().optional()
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
  server.registerTool('competitive_intelligence_verify_review',{
    title:'Verify the saved Saras review',
    description:'Read back the saved SaraS review and validate every primary node, awareness, matrix and column. Compare unrelated tabs, other products, other competitors and traffic against the local recovery snapshot.',
    inputSchema:{board_id:z.string(),backup_path:z.string().min(1)},
    annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true}
  },async({board_id,backup_path})=>{
    const {row,body}=await loadBoard(board_id);
    const asset=JSON.parse(await readFile(new URL('../../../competitive-intelligence-classifications.json',import.meta.url),'utf8'));
    const snapshot=JSON.parse(await readFile(backup_path,'utf8'));
    if(snapshot.board.id!==board_id)throw new ToolError('Recovery snapshot belongs to a different board.');
    const before=JSON.parse(snapshot.board.body),same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
    const checks:any={};
    checks.otherProducts=Object.entries(before.productWorkspaces||{}).every(([id,workspace])=>id===before.workspaceProductId||same(workspace,body.productWorkspaces?.[id]));
    checks.unrelatedTabs=Object.entries(before.tabs).every(([tab,value])=>['Content Strategy',TAB].includes(tab)||same(value,body.tabs[tab]));
    checks.otherCompetitors=before.tabs[TAB].competitors.filter((item:any)=>item.id!=='saras-analytics').every((item:any)=>same(item,body.tabs[TAB].competitors.find((next:any)=>next.id===item.id)));
    const old=before.tabs[TAB].competitors.find((item:any)=>item.id==='saras-analytics'),next=body.tabs[TAB].competitors.find((item:any)=>item.id==='saras-analytics');
    checks.inventory=same(old.urls,next.urls);checks.traffic=same(old.trafficSnapshots,next.trafficSnapshots);
    checks.prompt=body.tabs[TAB].urlRoutingPromptsByProduct?.['AI Layer']===KeywordColumns.competitiveIntelligencePrompt;
    if(Object.values(checks).some(value=>!value))throw new ToolError('Preservation verification failed: '+JSON.stringify(checks));
    return ok({verified:true,revision:row.updated_at,...ReviewedRouting.verify(body,asset),preserved:checks});
  });
  server.registerTool('competitive_intelligence_apply_review',{
    title:'Apply the reviewed Saras URL inventory',
    description:'Apply the reviewed 770-URL Saras Analytics inventory to AI Data Platform / AI Layer, populate each relevant URL once in its primary node and matrix, and update classification prompts. Requires a current board revision and saves a local recovery snapshot before a guarded write.',
    inputSchema:{board_id:z.string(),revision:z.string(),backup_path:z.string().min(1),dry_run:z.boolean().default(false)},
    annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true}
  },async({board_id,revision,backup_path,dry_run})=>{
    const {row,body}=await loadBoard(board_id);
    if(row.updated_at!==revision)throw new ToolError('Board changed. Read again before applying the review.');
    const asset=JSON.parse(await readFile(new URL('../../../competitive-intelligence-classifications.json',import.meta.url),'utf8'));
    const settings=await db().from('reports').select('id,body,updated_at').eq('owner_id',row.owner_id).eq('title','[Internal] Universal keyword columns').limit(1).single();
    if(settings.error)throw new ToolError(settings.error.message);
    const config=JSON.parse(settings.data.body),prior=JSON.parse(JSON.stringify(config));
    config.routingInstruction=ReviewedRouting.appendPrompt(config.routingInstruction);config.promptRevision=KeywordColumns.PROMPT_REVISION;
    const result=ReviewedRouting.apply(body,asset,config.routingInstruction);
    if(dry_run)return ok({saved:false,dry_run:true,revision,...result});
    await writeFile(backup_path,JSON.stringify({board:row,keywordSettings:{...settings.data,body:JSON.stringify(prior)}},null,2),{flag:'wx'});
    if(JSON.stringify(config)!==JSON.stringify(prior)){
      const savedPrompt=await db().from('reports').update({body:JSON.stringify(config),updated_at:new Date().toISOString()}).eq('id',settings.data.id).eq('updated_at',settings.data.updated_at).select('updated_at');
      if(savedPrompt.error||!savedPrompt.data?.length)throw new ToolError(savedPrompt.error?.message||'The keyword prompt changed; read again.');
    }
    let saved:any;
    for(let attempt=0;attempt<3;attempt++){
      saved=await db().from('reports').update({body:JSON.stringify(body),updated_at:new Date().toISOString()}).eq('id',board_id).eq('updated_at',revision).select('updated_at');
      if(!saved.error||!/statement timeout/i.test(saved.error.message))break;
    }
    if(saved.error||!saved.data?.length)throw new ToolError(saved.error?.message||'Concurrent board edit detected. Read the board again before retrying.');
    return ok({saved:true,revision:saved.data[0].updated_at,...result});
  });
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
