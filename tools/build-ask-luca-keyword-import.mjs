import fs from 'node:fs';
import path from 'node:path';

const [, , inputPath, outputPath, auditPath] = process.argv;
if (!inputPath || !outputPath || !auditPath) {
  throw new Error('Usage: node tools/build-ask-luca-keyword-import.mjs <input.csv> <output.js> <audit.json>');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

const clean = value => String(value || '').trim().replace(/\s+/g, ' ');
const normalized = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function normalizeUrl(value) {
  let text = clean(value);
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  const parsed = new URL(text);
  parsed.protocol = 'https:';
  parsed.hash = ''; parsed.search = '';
  return parsed.href.replace(/\/$/, '');
}

const rows = parseCsv(fs.readFileSync(inputPath, 'utf8'));
const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').trim());
const index = Object.fromEntries(headers.map((header, position) => [header, position]));
for (const required of ['Article Type', 'Primary Keyword', 'Secondary Keyword', 'Article Title', 'Page Link']) {
  if (index[required] == null) throw new Error(`CSV is missing ${required}.`);
}

const competitors = [
  ['wayflyer', 'Wayflyer'], ['clearco', 'Clearco'], ['triple whale', 'Triple Whale'],
  ['outfund', 'Outfund'], ['payability', 'Payability'], ['8fig', '8fig'],
  ['lifetimely', 'Lifetimely'], ['glew', 'Glew'], ['polar analytics', 'Polar Analytics'],
  ['lebesgue', 'Lebesgue'], ['databox', 'Databox'], ['daasity', 'Daasity'],
  ['supermetrics', 'Supermetrics'], ['google analytics alternatives', 'Google Analytics']
];

const capitalPattern = /\b(funding|funded|capital|financ(?:e|ing)|lender|lending|loan|credit|factoring|invoice fund|merchant cash advance|underwriting|wayflyer|clearco|outfund|payability|8fig)\b/i;
const unawarePattern = /\b(why|drowning|starving|lying|missing|wrong|fragmented|unpredictable|not more dashboards|feels smart until|blind spot|killing roi)\b/i;

function competitorRoute(text) {
  const candidate = competitors.find(([needle]) => normalized(text).includes(needle));
  if (!candidate || !/\b(alternatives?|reviews?|pricing|\bvs\b|versus)\b/i.test(text)) return null;
  let axis = /\bvs\b|versus/i.test(text) ? 'Competitor vs Competitor' : /alternative/i.test(text) ? 'Alternatives' : /review/i.test(text) ? 'Reviews' : 'Pricing';
  return { competitor: candidate[1], axis, comparison: axis === 'Competitor vs Competitor' ? ['Ask Luca', candidate[1]] : undefined };
}

function technology(text) {
  if (/\bshopify\b/i.test(text)) return 'Shopify';
  if (/\bamazon\b/i.test(text)) return 'Amazon';
  if (/\bfacebook|\bmeta\b/i.test(text)) return 'Meta';
  if (/google analytics|\bga4\b/i.test(text)) return 'Google Analytics';
  return '';
}

function seoAxis(title, keyword) {
  const text = `${title} ${keyword}`;
  if (/\bvs\b|versus|compared/i.test(text)) return 'Topic vs Topic';
  if (/\bhow to\b|step.by.step|setup|add google|playbook|framework/i.test(text)) return 'How To Articles';
  if (/\b2026\b|trend|future/i.test(text)) return 'Trends';
  if (/\bguide\b|explained|what is|decoded|complete/i.test(text)) return 'Guides';
  return 'Explainers';
}

function analysisProcess(text) {
  if (/cohort/i.test(text)) return ['Cohort analysis', 'Marketing'];
  if (/segment/i.test(text)) return ['Segmentation analysis', 'Marketing'];
  if (/churn|retention/i.test(text)) return ['Retention and churn analysis', 'Marketing'];
  if (/lifetime value|\bltv\b/i.test(text)) return ['Customer lifetime-value analysis', 'Marketing'];
  if (/attribution|cross.channel|omnichannel|conversion track|customer journey/i.test(text)) return ['Attribution analysis', 'Marketing'];
  if (/funnel/i.test(text)) return ['Funnel analysis', 'Marketing'];
  if (/customer behavior/i.test(text)) return ['Segmentation analysis', 'Marketing'];
  if (/profit|margin|unit economics|cash flow forecasting/i.test(text)) return ['Revenue and profitability analysis', 'Finance'];
  if (/monitor|anomal|trend/i.test(text)) return ['Anomaly and trend analysis', 'Product'];
  if (/report|dashboard|visualization|descriptive/i.test(text)) return ['Descriptive analysis', 'Finance'];
  if (/marketing|roas|cac|campaign/i.test(text)) return ['Marketing-performance analysis', 'Marketing'];
  if (/product|sku|inventory|demand forecast/i.test(text)) return ['Product and SKU performance analysis', 'Product'];
  return null;
}

function valueHierarchy(text) {
  return analysisProcess(text)?.[0] || (/integration|api|etl|data collection|data management/i.test(text) ? 'Data integration and normalization' :
    /fund|capital|loan|financ|credit/i.test(text) ? 'Funding and capital planning' : 'Business performance analysis');
}

function categoryName(text, capital) {
  if (capital) return 'E-commerce financing';
  if (/etl|integration|data collection|data management|api/i.test(text)) return 'Data Integration & ETL';
  if (/business intelligence|\bbi\b/i.test(text)) return 'E-commerce Business Intelligence';
  if (/ai agent|agentic/i.test(text)) return 'AI Agents for E-commerce';
  return 'E-commerce Data Analytics';
}

function isDirectCategoryEducation(text) {
  return /what is an ai co.founder|ecommerce (website )?analytics|ecommerce data analytics|ecommerce business intelligence|ecommerce data (integration|management|collection)|ecommerce reporting|predictive analytics for ecommerce|conversational analytics for ecommerce|ecommerce data visualization|ecommerce omnichannel analytics/i.test(text);
}

function classify(item) {
  const text = `${item.primaryKeyword} ${item.secondaryKeyword} ${item.title} ${item.url}`;
  const coreText = `${item.primaryKeyword} ${item.title} ${item.url}`;
  const capital = capitalPattern.test(text);
  const workspace = capital ? 'ai-data-capital' : 'ai-data-platform';
  const competitor = competitorRoute(coreText);
  if (competitor) return {
    workspace, awareness: 'competitor-aware', section: 'Competitor AEO', pageType: competitor.axis,
    hierarchy: competitor.competitor, axis: competitor.axis, ...(competitor.comparison ? {comparison: competitor.comparison} : {})
  };

  if (/what is luca ai|meet luca/i.test(text)) return {
    workspace: 'ai-data-platform', awareness: 'category-aware', section: 'Category AEO', pageType: 'Landing page',
    hierarchy: 'AI co-founder for e-commerce', axis: 'Product pages'
  };

  const isListicle = normalized(item.articleType) === 'listicle';
  const tech = technology(coreText);
  if (isListicle) {
    if (tech && !capital) return {
      workspace, awareness: 'solution-aware', section: 'ICP AEO', pageType: 'Listicle',
      hierarchy: 'Technology', icpSegment: tech, axis: tech
    };
    if (/small (?:ecommerce )?business|\bsme\b/i.test(text)) return {
      workspace, awareness: 'solution-aware', section: 'ICP AEO', pageType: 'Listicle',
      hierarchy: 'Company size', icpSegment: 'SMB', axis: 'SMB'
    };
    const process = !capital && analysisProcess(text);
    if (process && /cohort|segment|behavior|cross.channel|omnichannel|report|dashboard|monitor|cash flow forecast/i.test(text)) return {
      workspace, awareness: 'solution-aware', section: 'Value AEO', pageType: 'Listicle',
      hierarchy: process[0], axis: process[1]
    };
    return {
      workspace, awareness: 'category-aware', section: 'Category AEO', pageType: 'Listicle',
      hierarchy: categoryName(text, capital), axis: 'Category Names'
    };
  }

  const axis = seoAxis(item.title, item.primaryKeyword);
  if (tech && !/shopify sidekick|chatgpt/i.test(text)) return {
    workspace, awareness: 'problem-aware', section: 'ICP SEO', pageType: 'Informational',
    hierarchy: 'Technology', icpSegment: tech, axis
  };
  if (/founder|operator|store owner|data team|\bsme\b/i.test(coreText) && !isDirectCategoryEducation(coreText)) return {
    workspace, awareness: unawarePattern.test(coreText) ? 'problem-unaware' : 'problem-aware', section: 'ICP SEO', pageType: 'Informational',
    hierarchy: 'Role / Team', icpSegment: /data team/i.test(coreText) ? 'Data & Analytics' : 'E-commerce founders and operators', axis
  };
  if ((!unawarePattern.test(coreText) && isDirectCategoryEducation(coreText)) || (capital && /explained|types|provider|alternative lender|non.bank credit|revenue based financing|invoice funding|merchant cash advance|underwriting|startup business loan|business loans? for cash flow/i.test(coreText))) return {
    workspace, awareness: 'category-aware', section: 'Category SEO', pageType: 'Informational',
    hierarchy: categoryName(text, capital), axis
  };
  return {
    workspace, awareness: unawarePattern.test(text) ? 'problem-unaware' : 'problem-aware', section: 'Value SEO', pageType: 'Informational',
    hierarchy: valueHierarchy(text), axis
  };
}

const classifications = {};
const imported = [];
for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
  const row = rows[rowIndex];
  const rawUrl = row[index['Page Link']];
  if (!clean(rawUrl)) continue;
  const item = {
    url: normalizeUrl(rawUrl), articleType: clean(row[index['Article Type']]),
    primaryKeyword: clean(row[index['Primary Keyword']]), secondaryKeyword: clean(row[index['Secondary Keyword']]),
    title: clean(row[index['Article Title']]), sourceRow: rowIndex + 2
  };
  const route = classify(item);
  classifications[item.url] = {
    ...route, topicGroup: item.url, topic: item.title, groupOrder: 0, groupSize: 1, covered: true,
    representedCompany: 'Ask Luca', primaryKeyword: item.primaryKeyword, secondaryKeyword: item.secondaryKeyword,
    sourceSheet: path.basename(inputPath), sourceCell: `row ${item.sourceRow}`
  };
  imported.push({...item, ...route});
}

const profile = {
  id: 'ask-luca', name: 'Ask Luca', domain: 'https://ask-luca.com', aliases: ['Luca', 'Luca AI', 'Loka'],
  workspace: 'ai-data-platform', urls: imported.map(item => item.url), source: path.basename(inputPath)
};
const audit = {
  source: path.basename(inputPath), importedAt: '2026-10-04', rows: imported.length,
  uniqueUrls: new Set(imported.map(item => item.url)).size,
  domains: Object.fromEntries(Object.entries(Object.groupBy(imported, item => new URL(item.url).hostname)).map(([key,values])=>[key,values.length])),
  workspaces: Object.fromEntries(Object.entries(Object.groupBy(imported, item => item.workspace)).map(([key,values])=>[key,values.length])),
  sections: Object.fromEntries(Object.entries(Object.groupBy(imported, item => item.section)).map(([key,values])=>[key,values.length])),
  awareness: Object.fromEntries(Object.entries(Object.groupBy(imported, item => item.awareness)).map(([key,values])=>[key,values.length])),
  routes: imported
};

const output = `/* Generated from ${path.basename(inputPath)}. Represented-company URLs are covered content. */\n` +
`(function(root){'use strict';const REVISION='ask-luca-keyword-import-2026-10-04-v1';` +
`const PROFILE=${JSON.stringify(profile)};const classifications=${JSON.stringify(classifications)};` +
`root.AskLucaKeywordImport={REVISION,PROFILE,classifications};})(typeof globalThis!=='undefined'?globalThis:this);\n`;
fs.writeFileSync(outputPath, output);
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
console.log(JSON.stringify({rows: imported.length, sections: audit.sections, workspaces: audit.workspaces}));
