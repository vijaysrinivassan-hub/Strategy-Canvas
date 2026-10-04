import fs from 'node:fs';
import path from 'node:path';

const [, , inputPath, outputPath, fetchDate = '2026-10-04'] = process.argv;
if (!inputPath || !outputPath) {
  throw new Error('Usage: node tools/build-saras-organic-traffic.mjs <input.csv> <output.js> [YYYY-MM-DD]');
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

function normalizeUrl(value) {
  let text = String(value || '').trim();
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  const parsed = new URL(text);
  const normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '');
  return normalized.toLowerCase();
}

const rows = parseCsv(fs.readFileSync(inputPath, 'utf8'));
const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').trim());
const pathIndex = headers.indexOf('Path');
const trafficIndex = headers.indexOf('Current organic traffic');
if (pathIndex < 0 || trafficIndex < 0) throw new Error('CSV must contain Path and Current organic traffic columns.');

const trafficByUrl = new Map();
for (const row of rows) {
  if (!row[pathIndex]) continue;
  const url = normalizeUrl(row[pathIndex]);
  const parsed = Number(String(row[trafficIndex] || '0').replaceAll(',', '').trim());
  const traffic = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
  trafficByUrl.set(url, Math.max(trafficByUrl.get(url) ?? 0, traffic));
}

const traffic = Object.fromEntries([...trafficByUrl].sort(([left], [right]) => left.localeCompare(right)));
const payload = JSON.stringify(traffic, null, 2);
const sourceName = path.basename(inputPath).replaceAll('*/', '');
const output = `/* Generated from ${sourceName}. Do not edit traffic values by hand. */
(function(root){
  'use strict';
  const FETCH_DATE=${JSON.stringify(fetchDate)};
  const SOURCE=${JSON.stringify(sourceName)};
  const TRAFFIC=Object.freeze(${payload});
  const normalizeUrl=value=>{
    let text=String(value||'').trim();if(!text)return '';
    if(!/^https?:\\/\\//i.test(text))text='https://'+text;
    try{const parsed=new URL(text);return (parsed.protocol+'//'+parsed.hostname+parsed.pathname).replace(/\\/$/,'').toLowerCase();}
    catch{return text.replace(/\\/$/,'').toLowerCase();}
  };
  const trafficFor=value=>{const key=normalizeUrl(value);return Object.prototype.hasOwnProperty.call(TRAFFIC,key)?TRAFFIC[key]:null;};
  function applyProfile(profile){
    if(!profile||typeof profile!=='object')return false;
    profile.trafficSnapshots=profile.trafficSnapshots&&typeof profile.trafficSnapshots==='object'?profile.trafficSnapshots:{};
    profile.trafficSnapshots[FETCH_DATE]={...TRAFFIC};
    profile.trafficSnapshotSources=profile.trafficSnapshotSources&&typeof profile.trafficSnapshotSources==='object'?profile.trafficSnapshotSources:{};
    profile.trafficSnapshotSources[FETCH_DATE]=SOURCE;
    return true;
  }
  root.SarasAnalyticsOrganicTraffic={FETCH_DATE,SOURCE,TRAFFIC,normalizeUrl,trafficFor,applyProfile};
})(typeof globalThis!=='undefined'?globalThis:this);
`;

fs.writeFileSync(outputPath, output);
console.log(`Wrote ${trafficByUrl.size} traffic rows to ${outputPath}`);
