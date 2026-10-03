import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'competitive-intelligence-classifications.json');
const sitemapUrl = 'https://www.sarasanalytics.com/sitemap.xml';
const workspace = 'ai-data-platform';

const xml = await fetch(sitemapUrl).then(response => {
  if (!response.ok) throw new Error(`Sitemap request failed: ${response.status}`);
  return response.text();
});
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gsi)]
  .map(match => match[1].trim().replace(/\/$/, ''))
  .filter(Boolean);
if (urls.length !== 770) throw new Error(`Expected 770 sitemap URLs, received ${urls.length}.`);

const clean = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const title = url => {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
  const leaf = pathname.split('/').pop() || 'Saras Analytics';
  return leaf.split('-').filter(Boolean).map(word => word.length <= 3 && /^(ai|bi|etl|elt|api|mcp|roi|ltv|sql|cpa|cpc|kpi|sku|dsp|mws|sp)$/.test(word) ? word.toUpperCase() : word[0]?.toUpperCase() + word.slice(1)).join(' ');
};
const isCorporate = pathname => /^\/?$|^\/(about|contact-us|privacy|terms-of-use|partners|authors(?:\/|$)|events(?:\/|$)|events-confrences|case-study(?:\/|$)|case-studies-old|customers(?:\/|$)|testimonial-strip-layout|podcast(?:\/|$)|ebooks(?:\/|$)|ebook-lp)(?:\/|$)/i.test(pathname);
const isSolution = (pathname, text) => /^\/(products|saras-daton|saras-iq|saras-iq-mcp|saras-data-engineering|saras-consulting|saras-ad|solutions|connectors|lp|talk-to-data-consultants|claude-bigquery|vs)(?:\/|$)/i.test(pathname)
  || /\b(alternative|alternatives|pricing|platform|software|tool|tools|connector|integration service|consulting service|data engineering service)\b/.test(text);
const isIcp = text => /\b(amazon|shopify|ecommerce|e commerce|retail|agency|agencies|brand|brands|seller|sellers|merchant|marketing team|finance team|data team|analyst|enterprise|small business|smb|mid market|bigquery|snowflake|redshift|tableau|power bi|looker|hubspot|salesforce|google ads|facebook ads|tiktok|klaviyo|stripe|netsuite|quickbooks|mysql|postgres|mongodb|oracle|microsoft|adobe|adjust|appsflyer|magento|woocommerce|walmart)\b/.test(text);
const icpDimension = text => {
  if (/\b(enterprise|small business|smb|mid market)\b/.test(text)) return ['Company size', /enterprise/.test(text) ? 'Enterprise' : /mid market/.test(text) ? 'Mid-market' : 'SMB'];
  if (/\b(analyst|marketing team|finance team|data team|agency|agencies)\b/.test(text)) return ['Role / Team', /agency|agencies/.test(text) ? 'Agencies' : /marketing/.test(text) ? 'Marketing' : /finance/.test(text) ? 'Finance' : 'Data & Analytics'];
  if (/\b(amazon|shopify|ecommerce|e commerce|retail|brand|brands|seller|sellers|merchant|walmart)\b/.test(text)) return ['Industry', 'E-commerce & Retail'];
  return ['Technology', /snowflake/.test(text) ? 'Snowflake' : /bigquery/.test(text) ? 'BigQuery' : /redshift/.test(text) ? 'Amazon Redshift' : /shopify/.test(text) ? 'Shopify' : /amazon/.test(text) ? 'Amazon' : /tableau|power bi|looker/.test(text) ? 'Business Intelligence Tools' : 'Data Stack Technology'];
};
const valueHierarchy = text => {
  if (/\b(ingest|etl|elt|connector|integrat|pipeline|migration|extract|load|source to|to bigquery|to snowflake|to redshift)\b/.test(text)) return 'Data Integration & Ingestion';
  if (/\b(customer|cohort|retention|churn|lifetime value|ltv|segmentation)\b/.test(text)) return 'Customer Analytics';
  if (/\b(marketing|advertis|campaign|attribution|roas|acos|conversion rate)\b/.test(text)) return 'Marketing Analytics';
  if (/\b(revenue|profit|margin|finance|cost|working capital)\b/.test(text)) return 'Revenue & Profitability';
  if (/\b(forecast|predict|inventory|demand planning)\b/.test(text)) return 'Forecasting & Planning';
  if (/\b(report|dashboard|visuali|business intelligence|\bbi\b)\b/.test(text)) return 'Reporting & BI';
  if (/\b(ai|agent|mcp|natural language|talk to data|claude)\b/.test(text)) return 'AI Analytics';
  if (/\b(data warehouse|data engineering|database|schema|sql|api)\b/.test(text)) return 'Data Engineering';
  if (/\b(analysis|analytics|metric|kpi|insight)\b/.test(text)) return 'Data Analysis';
  return 'General Value';
};
const valueAxis = text => /\bvs\b|versus|comparison|compare/.test(text) ? 'Topic vs Topic' : /trend|future|statistics/.test(text) ? 'Trends' : /how to|made easy|step by step/.test(text) ? 'How To Articles' : /guide|checklist/.test(text) ? 'Guides' : 'Explainers';
const pageType = (pathname, text, awareness) => {
  if (/\b(best|top|tools|platforms|alternatives)\b/.test(text) || /alternative(?:s)?$/.test(pathname)) return 'Listicle';
  return awareness === 'solution-aware' ? 'Landing page' : 'Informational';
};

const source = JSON.parse(fs.readFileSync(target, 'utf8'));
for (const [url, meta] of Object.entries(source.classifications || {})) {
  if (meta?.workspace === workspace || url.includes('sarasanalytics.com')) delete source.classifications[url];
}
source.profiles = (source.profiles || []).filter(profile => profile.workspace !== workspace && !String(profile.domain || '').includes('sarasanalytics.com'));

const counters = new Map();
for (const url of urls) {
  const parsed = new URL(url);
  const pathname = parsed.pathname.replace(/\/$/, '') || '/';
  const text = clean(pathname);
  if (isCorporate(pathname)) {
    source.classifications[url] = {workspace, awareness:'non-seo', section:'Corporate & Non-SEO', pageType:'Corporate', hierarchy:'Corporate', axis:'Corporate', topicGroup:url, topic:title(url), groupOrder:0, groupSize:1, covered:false, traffic:''};
    continue;
  }
  const awareness = isSolution(pathname, text) ? 'solution-aware' : (/^\/glossary(?:\/|$)/.test(pathname) || /\b(what is|meaning|definition|explained|overview|benefits|importance|types of)\b/.test(text) ? 'problem-unaware' : 'problem-aware');
  const icp = isIcp(text);
  const [dimension, dimensionValue] = icp ? icpDimension(text) : ['', ''];
  const hierarchy = icp ? dimension : valueHierarchy(text);
  const axis = icp ? dimensionValue : valueAxis(text);
  const mode = awareness === 'solution-aware' ? 'AEO' : 'SEO';
  const section = `${icp ? 'ICP' : 'Value'} ${mode}`;
  const format = pageType(pathname, text, awareness);
  const key = [awareness, section, hierarchy, axis].join('|');
  const groupOrder = counters.get(key) || 0;
  counters.set(key, groupOrder + 1);
  source.classifications[url] = {workspace, awareness, section, pageType:format, hierarchy, axis, topicGroup:url, topic:title(url), groupOrder, groupSize:1, covered:false, traffic:''};
}

source.profiles.push({
  id:'saras-analytics', name:'Saras Analytics', domain:'https://www.sarasanalytics.com', aliases:['Saras Analytics','Daton'], workspace,
  sitemaps:[sitemapUrl], urls, source:'Published sitemap.xml', fetchedAt:new Date().toISOString(), status:'complete',
  note:'Complete URL inventory from the sitemap declared by Saras Analytics. URLs are classified by awareness and ICP-versus-value intent.'
});
source.version = Math.max(Number(source.version) || 1, 4);
source.classifiedAt = new Date().toISOString();
source.source = `${source.source || 'URL classification repository'}; Saras Analytics published sitemap`;
fs.writeFileSync(target, JSON.stringify(source) + '\n');

const counts = {};
for (const meta of Object.values(source.classifications)) if (meta.workspace === workspace) {
  const key = `${meta.awareness} | ${meta.section}`;
  counts[key] = (counts[key] || 0) + 1;
}
console.log(JSON.stringify({urls:urls.length, counts}, null, 2));
