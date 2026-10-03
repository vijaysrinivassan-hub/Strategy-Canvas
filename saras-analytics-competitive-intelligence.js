/* Board-scoped Saras Analytics sitemap import for Competitive Intelligence. */
(function(root){
  'use strict';
  const REVISION='saras-analytics-sitemap-2026-10-03-v1';
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\/$/,'');
  const clone=value=>JSON.parse(JSON.stringify(value));
  let pending;
  function matchesBoard(values){return (values||[]).some(value=>normalize(value)==='ai data platform');}
  function loadProfile(){
    const find=source=>(source?.profiles||[]).find(profile=>profile.id==='saras-analytics');
    const ready=find(root.CompetitiveIntelligenceClassifications);
    if(ready)return Promise.resolve(clone(ready));
    if(!pending)pending=fetch('competitive-intelligence-classifications.json',{cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error('Could not load the Saras Analytics sitemap profile.');return response.json();})
      .then(source=>{root.CompetitiveIntelligenceClassifications=source;const profile=find(source);if(!profile)throw new Error('Saras Analytics profile is missing.');return clone(profile);});
    return pending;
  }
  function apply(tab,profile){
    if(!tab||!profile)return false;
    tab.competitors=Array.isArray(tab.competitors)?tab.competitors:[];
    const before=JSON.stringify(tab);
    const index=tab.competitors.findIndex(item=>normalize(item.domain)===normalize(profile.domain)||normalize(item.name)===normalize(profile.name));
    if(index>=0)tab.competitors[index]={...tab.competitors[index],...profile,urls:[...new Set(profile.urls||[])],sitemaps:[...new Set(profile.sitemaps||[])]};
    else tab.competitors.push(profile);
    if(!tab.activeCompetitorId)tab.activeCompetitorId=profile.id;
    return before!==JSON.stringify(tab);
  }
  root.SarasAnalyticsCompetitiveIntelligence={REVISION,matchesBoard,loadProfile,apply};
})(typeof globalThis!=='undefined'?globalThis:this);
