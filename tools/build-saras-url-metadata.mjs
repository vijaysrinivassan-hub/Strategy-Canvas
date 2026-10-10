import { readFile, writeFile } from 'node:fs/promises';

const [sourcePath, outputPath] = process.argv.slice(2);
if (!sourcePath || !outputPath) throw new Error('Usage: node build-saras-url-metadata.mjs source.json output.json');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const urls = Object.entries(source.classifications).filter(([url]) => {
  try { return new URL(url).hostname === 'www.sarasanalytics.com'; } catch { return false; }
});
const awarenessLabels = {
  'problem-unaware':'Problem unaware', 'problem-aware':'Problem aware',
  'solution-aware':'Solution aware', 'category-aware':'Category aware',
  'competitor-aware':'Competitor aware', 'product-aware':'Product aware'
};
const metadata = {};
for (const [url, old] of urls){
  const prior = old.previousRouting || old;
  const path = new URL(url).pathname.toLowerCase();
  const focus = [path,old.auditTitle,old.auditH1,old.topic].filter(Boolean).join(' ').toLowerCase();
  const corporate = prior.section === 'Corporate & Non-SEO' ||
    /^\/(authors|events|case-study|podcast|ebooks)(\/|$)/.test(path) ||
    /^\/(privacy|terms-of-use|contact|partners|careers)(\/|$)/.test(path) ||
    /^\/(products|why-saras|glossary|blog|case-studies)$/.test(path);
  const daton = /^\/(daton|saras-daton|how-to|connectors)(\/|$)/.test(path) ||
    /\bdaton\b|\belt\b|\betl\b|data ingestion|data integration|data pipeline|data warehouse|data connector/.test(focus);
  const pulse = /(^|[/-])pulse([/-]|$)/.test(path) || /\bsaras pulse\b/.test(focus);
  const services = /^\/(saras-consulting|saras-data-engineering|talk-to-data-consultants)/.test(path);
  const iq = /saras-iq|saras-iq-mcp|claude-bigquery/.test(path) ||
    /\bsaras iq\b|\biq analyst\b|\biq mcp\b/.test(focus);
  const analytics = /ai analyst|ai analytics|analytics platform|analytics tools?|ecommerce analytics|e-commerce analytics|conversational analytics|talk to data|data analyst|business intelligence platform|ai agents? for data|ai agents? for ecommerce|mcp server.*ecommerce data/.test(focus);
  let product = 'Corporate';
  if (pulse) product = 'Different Product: Pulse';
  else if (corporate && !/^\/saras-iq\/pricing$/.test(path)) product = 'Corporate';
  else if (iq) product = 'Saras iQ — AI Layer match';
  else if (daton) product = 'Different Product: Daton';
  else if (services) product = 'Different Product: Services';
  else if (!corporate && analytics) product = 'Saras iQ — AI Layer relevant';
  else if (!corporate) product = 'Different Product: Other Saras content';
  const match = product.startsWith('Saras iQ — AI Layer');
  let node = '';
  let awareness = 'Non-SEO';
  let matrix = 'Corporate & Non-SEO';
  let column = corporate ? 'Corporate' : 'Different Product';
  if (match && (corporate || /^\/(saras-iq\/pricing|lp\/saras-iq-demo|lp\/thank-you)$/.test(path))){
    column = /saras-iq\/pricing/.test(path) ? 'Pricing' : /saras-iq-demo/.test(path) ? 'Demo' : 'Corporate';
  } else if (match){
    node = /mcp|claude|integration/.test(focus) ? 'Embedded product SDK' :
      /alert|recommend|decision|action/.test(focus) ? 'Decision delivery API' :
      /semantic|metric|definition|dashboard|report|cohort|margin|profit|customer/.test(focus) ? 'Semantic modelling layer' : 'AI analytics agent';
    awareness = awarenessLabels[prior.awareness] || 'Solution aware';
    matrix = prior.section || 'Value SEO';
    column = prior.axis || 'Content angles';
    if (/^\/(saras-iq|lp\/what-is-saras-iq)$/.test(path)){
      awareness = 'Product aware'; matrix = 'Product Aware'; column = 'Product Pages';
    } else if (/^\/(saras-iq\/|saras-iq-mcp|lp\/saras-iq-essentials|lp\/saras-iq-ai-analyst)/.test(path)){
      awareness = 'Product aware'; matrix = 'Product Aware'; column = 'Feature Pages';
    } else if (/\/blog\/saras-iq-vs-|\/vs\//.test(path) || matrix === 'Competitor AEO'){
      matrix = 'Competitor AEO';
      awareness = 'Competitor aware';
      column = prior.pageType === 'Comparison' ? 'Comparison' :
        ['Alternatives','Pricing','Reviews','Features'].includes(prior.pageType) ? prior.pageType : 'Alternatives';
    } else if (matrix === 'Value SEO' || matrix === 'ICP SEO'){
      column = prior.axis || 'Explainers';
    } else if (matrix === 'ICP AEO'){
      column = 'Industry Pages';
    } else if (matrix === 'Value AEO'){
      column = prior.axis || 'General';
    } else if (matrix === 'Category AEO' || matrix === 'Category SEO'){
      column = prior.axis || 'Category name';
    }
  }
  metadata[url] = {product,node,awareness,matrix,column};
}
for (const [url, item] of Object.entries(metadata)){
  const old = source.classifications[url];
  old.product = item.product;
  old.node = item.node;
  old.awarenessLevel = item.awareness;
  old.matrix = item.matrix;
  old.column = item.column;
  if (item.matrix === 'Corporate & Non-SEO' && old.section !== 'Corporate & Non-SEO'){
    old.previousRouting ||= {awareness:old.awareness,section:old.section,pageType:old.pageType,hierarchy:old.hierarchy,axis:old.axis,icpSegment:old.icpSegment};
    old.awareness = 'non-seo';
    old.section = 'Corporate & Non-SEO';
    old.pageType = 'Non-SEO';
    old.hierarchy = item.product;
    old.axis = item.column;
  }
}
source.version = Math.max(Number(source.version)||0,11);
source.classifiedAt = new Date().toISOString();
await writeFile(outputPath, JSON.stringify(source) + '\n');
const counts = Object.values(metadata).reduce((acc,row) => (acc[row.product]=(acc[row.product]||0)+1,acc),{});
console.log(JSON.stringify({urls:urls.length,counts},null,2));
