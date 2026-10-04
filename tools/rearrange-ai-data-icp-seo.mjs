import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'competitive-intelligence-classifications.json');
const source = JSON.parse(fs.readFileSync(target, 'utf8'));
const clean = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const topicBucket = (url, meta) => {
  const text = clean([new URL(url).pathname, meta.topic].join(' '));
  if (/\b(ingest|etl|elt|connector|integrat|pipeline|migration|extract|load|source to|to bigquery|to snowflake|to redshift)\b/.test(text)) return 'Data Integration & Ingestion';
  if (/\b(customer|cohort|retention|churn|lifetime value|ltv|segmentation)\b/.test(text)) return 'Customer Analytics';
  if (/\b(marketing|advertis|campaign|attribution|roas|acos|conversion rate)\b/.test(text)) return 'Marketing Analytics';
  if (/\b(revenue|profit|margin|finance|cost|working capital)\b/.test(text)) return 'Revenue & Profitability';
  if (/\b(forecast|predict|inventory|demand planning)\b/.test(text)) return 'Forecasting & Planning';
  if (/\b(report|dashboard|visuali|business intelligence|bi)\b/.test(text)) return 'Reporting & BI';
  if (/\b(ai|agent|mcp|natural language|talk to data|claude)\b/.test(text)) return 'AI Analytics';
  if (/\b(data warehouse|data engineering|database|schema|sql|api)\b/.test(text)) return 'Data Engineering';
  if (/\b(analysis|analytics|metric|kpi|insight)\b/.test(text)) return 'Data Analysis';
  return 'General Data & Analytics';
};

let changed = 0;
const counts = {};
for (const [url, meta] of Object.entries(source.classifications || {})) {
  if (meta.workspace !== 'ai-data-platform' || meta.section !== 'ICP SEO' || !['problem-unaware','problem-aware'].includes(meta.awareness)) continue;
  if (!meta.icpSegment) meta.icpSegment = meta.axis || 'General ICP';
  meta.axis = topicBucket(url, meta);
  const key = [meta.awareness, meta.hierarchy, meta.icpSegment, meta.axis].join('|');
  meta.groupOrder = counts[key] || 0;
  counts[key] = meta.groupOrder + 1;
  changed++;
}
source.version = Math.max(Number(source.version) || 1, 5);
source.classifiedAt = new Date().toISOString();
fs.writeFileSync(target, JSON.stringify(source) + '\n');
console.log(JSON.stringify({changed, groups:Object.keys(counts).length}, null, 2));
