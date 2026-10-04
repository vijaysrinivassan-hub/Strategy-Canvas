(function(global){
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const makeId = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
  const cleanUrl = value => {
    let text = String(value || '').trim();
    if (!text) return '';
    if (!/^https?:\/\//i.test(text)) text = 'https://' + text;
    try { return new URL(text).href; } catch { return ''; }
  };
  let classificationLoad;
  function loadClassifications(){
    if (global.CompetitiveIntelligenceClassifications) return Promise.resolve(global.CompetitiveIntelligenceClassifications);
    if (!classificationLoad){
      classificationLoad = fetch('competitive-intelligence-classifications.json', {cache:'no-store'})
        .then(response => {
          if (!response.ok) throw new Error('Could not load Competitive Intelligence classifications.');
          return response.json();
        })
        .then(data => { global.CompetitiveIntelligenceClassifications = data; return data; })
        .catch(error => { console.error(error); return null; });
    }
    return classificationLoad;
  }
  function classificationOf(value){
    return global.CompetitiveIntelligenceClassifications?.classifications?.[String(value || '').replace(/\/$/,'')] || null;
  }
  const snapshotDates = item => Object.keys(item?.trafficSnapshots || {}).sort();
  function snapshotTraffic(item,date,url){
    const snapshot = item?.trafficSnapshots?.[date];
    if (!snapshot || typeof snapshot !== 'object') return null;
    const key = String(url || '').trim().replace(/\/$/,'').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(snapshot,key)) return snapshot[key];
    return null;
  }
  function normalize(tab){
    global.HighPriorityLinks?.normalize(tab);
    if (!Array.isArray(tab.competitors)) tab.competitors = [];
    tab.competitors.forEach(item => {
      item.id ||= makeId(); item.name ||= 'Untitled competitor'; item.domain ||= '';
      item.aliases = Array.isArray(item.aliases) ? item.aliases : [];
      item.sitemaps = [...new Set(Array.isArray(item.sitemaps) ? item.sitemaps.filter(Boolean) : [])];
      item.urls = [...new Set(Array.isArray(item.urls) ? item.urls.filter(Boolean) : [])];
      item.status ||= item.urls.length ? 'complete' : 'empty';
      item.source ||= 'Manual';
    });
    if (!tab.activeCompetitorId || !tab.competitors.some(item => item.id === tab.activeCompetitorId)){
      tab.activeCompetitorId = tab.competitors[0]?.id || '';
    }
    return tab;
  }
  function ensure(tab, client, product){
    normalize(tab);
    const seed = global.CompetitiveIntelligenceSeed;
    const productName = String(product || '').trim().toLowerCase();
    const clientName = String(client || '').trim().toLowerCase();
    const matches = seed && (clientName === 'aeo agency' ||
      [seed.product.toLowerCase(), 'aeo agency'].includes(productName));
    if (!tab.competitors.length && matches){
      const profiles = global.CompetitiveIntelligenceClassifications?.profiles?.filter(profile => !profile.workspace || profile.workspace === 'aeo-agency');
      if (Array.isArray(profiles) && profiles.length){
        const priorByDomain = new Map(seed.competitors
          .filter(item => item.domain)
          .map(item => [String(item.domain).replace(/\/$/,'').toLowerCase(),item]));
        tab.competitors = profiles.map(profile => {
          const prior = priorByDomain.get(String(profile.domain || '').replace(/\/$/,'').toLowerCase());
          const urls = [...new Set(profile.urls || [])];
          return {
            ...(prior ? clone(prior) : {}), ...clone(profile),
            aliases: [...new Set([...(prior?.aliases || []),...(profile.aliases || [])])],
            sitemaps: [...new Set([...(prior?.sitemaps || []),...(profile.sitemaps || [])])],
            urls,
            source: profile.source || prior?.source || 'Imported URL classification workbook',
            fetchedAt: profile.fetchedAt || prior?.fetchedAt || global.CompetitiveIntelligenceClassifications.classifiedAt || '',
            status: profile.status || (urls.length ? 'complete' : prior?.status || 'empty')
          };
        });
      } else {
        tab.competitors = clone(seed.competitors);
      }
      tab.activeCompetitorId = tab.competitors[0]?.id || '';
      tab.seedId = seed.id; tab.seededAt = seed.fetchedAt;
      return true;
    }
    return false;
  }
  const statusLabel = status => ({
    complete:'Sitemap complete', indexed_snapshot:'Indexed snapshot',
    domain_required:'Domain required', empty:'Empty'
  }[status] || status.replaceAll('_',' '));
  function render(host, tab, options = {}){
    normalize(tab); host.innerHTML = '';
    const ro = !!options.readOnly, changed = () => options.onChange?.();
    const board = document.createElement('div'); board.className = 'ci-board';
    const list = document.createElement('aside'); list.className = 'ci-list';
    const listHead = document.createElement('div'); listHead.className = 'ci-list-head';
    const listTitle = document.createElement('b'); listTitle.textContent = 'Competitors';
    const listSub = document.createElement('span'); listSub.textContent = tab.competitors.length + ' intelligence profiles';
    listHead.append(listTitle,listSub); list.append(listHead);
    tab.competitors.forEach(item => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'ci-competitor' + (item.id === tab.activeCompetitorId ? ' on' : '');
      const copy = document.createElement('span'), name = document.createElement('strong'), domain = document.createElement('small');
      name.textContent = item.name; domain.textContent = item.domain || 'Domain required'; copy.append(name,domain);
      const count = document.createElement('em'); count.textContent = item.urls.length;
      button.append(copy,count); button.onclick = () => { tab.activeCompetitorId = item.id; render(host,tab,options); };
      list.append(button);
    });
    const detail = document.createElement('main'); detail.className = 'ci-detail';
    const active = tab.competitors.find(item => item.id === tab.activeCompetitorId);
    if (!active){
      const empty = document.createElement('div'); empty.className = 'ci-empty';
      empty.innerHTML = '<div><b>No competitors yet</b>Add the first competitor to begin its sitemap and URL inventory.</div>';
      detail.append(empty); board.append(list,detail); host.append(board); return;
    }
    const head = document.createElement('div'); head.className = 'ci-detail-head';
    const identity = document.createElement('div'); identity.className = 'ci-identity';
    const name = document.createElement('input'); name.className = 'ci-name'; name.value = active.name; name.readOnly = ro;
    name.oninput = () => { active.name = name.value; changed(); };
    const domain = document.createElement('input'); domain.className = 'ci-domain'; domain.value = active.domain;
    domain.placeholder = 'Add the verified company domain'; domain.readOnly = ro;
    domain.onchange = () => { active.domain = cleanUrl(domain.value) || domain.value.trim(); changed(); render(host,tab,options); };
    identity.append(name,domain);
    if (active.aliases.length){
      const alias = document.createElement('span'); alias.className = 'ci-alias';
      alias.textContent = 'Verified as ' + active.aliases.join(', '); identity.append(alias);
    }
    const status = document.createElement('span'); status.className = 'ci-status' +
      (active.status === 'domain_required' ? ' warn' : active.status === 'indexed_snapshot' ? ' snapshot' : '');
    status.textContent = statusLabel(active.status); head.append(identity,status); detail.append(head);
    const summary = document.createElement('div'); summary.className = 'ci-summary';
    [[active.urls.length,'Discovered URLs'],[active.sitemaps.length,'Sitemaps'],[
      active.fetchedAt ? new Date(active.fetchedAt).toLocaleDateString() : '-','Last researched'
    ]].forEach(([value,label]) => {
      const stat = document.createElement('div'); stat.className = 'ci-stat';
      const b = document.createElement('b'); b.textContent = value; const s = document.createElement('span'); s.textContent = label;
      stat.append(b,s); summary.append(stat);
    }); detail.append(summary);
    if (active.note){ const note = document.createElement('div'); note.className = 'ci-note'; note.textContent = active.note; detail.append(note); }
    const siteSection = document.createElement('section'); siteSection.className = 'ci-section';
    const siteHead = document.createElement('div'); siteHead.className = 'ci-section-head';
    const siteTitle = document.createElement('h4'); siteTitle.textContent = 'Sitemaps';
    const siteSource = document.createElement('span'); siteSource.textContent = active.source;
    const spacer = document.createElement('span'); spacer.className = 'spacer'; siteHead.append(siteTitle,siteSource,spacer);
    if (!ro){
      const add = document.createElement('button'); add.type = 'button'; add.textContent = '+ Sitemap';
      add.onclick = () => {
        const url = cleanUrl(prompt('Paste the sitemap URL') || ''); if (!url) return;
        if (!active.sitemaps.includes(url)) active.sitemaps.push(url); changed(); render(host,tab,options);
      }; siteHead.append(add);
    }
    const sites = document.createElement('div'); sites.className = 'ci-sitemaps';
    if (!active.sitemaps.length){ const none = document.createElement('span'); none.className = 'ci-domain'; none.textContent = 'No verified sitemap yet.'; sites.append(none); }
    active.sitemaps.forEach((url,index) => {
      const chip = document.createElement('div'); chip.className = 'ci-sitemap';
      const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = url;
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2,'0'); chip.append(number,link); sites.append(chip);
    });
    siteSection.append(siteHead,sites); detail.append(siteSection);
    const tools = document.createElement('div'); tools.className = 'ci-tools';
    const search = document.createElement('input'); search.type = 'search'; search.className = 'ci-search'; search.placeholder = "Filter this competitor's URLs...";
    const addUrl = document.createElement('button'); addUrl.type = 'button'; addUrl.textContent = '+ URL'; addUrl.hidden = ro;
    addUrl.onclick = () => {
      const url = cleanUrl(prompt('Paste a page URL') || ''); if (!url) return;
      if (!active.urls.includes(url)) active.urls.push(url); changed(); render(host,tab,options);
    };
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy URLs';
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(active.urls.join('\n')); options.toast?.(active.urls.length + ' URLs copied.'); }
      catch { options.toast?.('Clipboard permission was not available.', true); }
    };
    tools.append(search,addUrl,copy); detail.append(tools);
    const wrap = document.createElement('div'); wrap.className = 'ci-url-wrap';
    const table = document.createElement('table'); table.className = 'ci-url-table';
    const trafficDates = snapshotDates(active);
    const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>Priority</th><th>#</th><th>URL</th><th>Strategic section</th><th>Page type</th><th>Classification</th></tr>';
    const headRow = thead.querySelector('tr');
    trafficDates.forEach(date => { const th = document.createElement('th'); th.className = 'ci-traffic-date'; th.textContent = date; th.title = 'Current organic traffic fetched on ' + date; headRow.append(th); });
    const body = document.createElement('tbody'); table.append(thead,body); wrap.append(table); detail.append(wrap);
    const draw = () => {
      const query = search.value.trim().toLowerCase(); body.innerHTML = '';
      const visible = active.urls.filter(url => {
        const meta = classificationOf(url);
        const haystack = [url,meta?.section,meta?.pageType,meta?.hierarchy,meta?.axis].filter(Boolean).join(' ').toLowerCase();
        return !query || haystack.includes(query);
      });
      visible.forEach((url,index) => {
        const meta = classificationOf(url);
        const row = document.createElement('tr'), priority = document.createElement('td'), num = document.createElement('td'), cell = document.createElement('td');
        const section = document.createElement('td'), pageType = document.createElement('td'), classification = document.createElement('td');
        const star = document.createElement('button'); star.type = 'button'; star.className = 'ci-priority-star';
        const paintStar = () => {
          const starred = !!global.HighPriorityLinks?.has(tab,url);
          star.textContent = starred ? '★' : '☆'; star.classList.toggle('on',starred);
          star.setAttribute('aria-pressed',String(starred));
          star.setAttribute('aria-label',starred ? 'Remove high-priority link' : 'Mark as high-priority link');
          star.title = starred ? 'High-priority link' : 'Mark as high-priority link';
        };
        star.disabled = ro;
        star.onpointerdown = event => event.stopPropagation();
        star.onclick = event => {
          event.preventDefault(); event.stopPropagation();
          if (ro) return;
          global.HighPriorityLinks?.toggle(tab,url); changed(); paintStar();
        };
        paintStar(); priority.append(star);
        num.textContent = String(index + 1); const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = url;
        const sectionCode = document.createElement('code'); sectionCode.textContent = meta?.section || 'Unclassified';
        const pageTypeCode = document.createElement('code'); pageTypeCode.textContent = meta?.pageType || 'Unclassified';
        const classificationCode = document.createElement('code'); classificationCode.textContent = [meta?.hierarchy,meta?.axis].filter(Boolean).join(' · ') || 'Unclassified';
        cell.append(link); section.append(sectionCode); pageType.append(pageTypeCode); classification.append(classificationCode);
        row.append(priority,num,cell,section,pageType,classification);
        trafficDates.forEach(date => {
          const traffic = snapshotTraffic(active,date,url), trafficCell = document.createElement('td');
          trafficCell.className = 'ci-organic-traffic';
          trafficCell.textContent = traffic == null ? '—' : Number(traffic).toLocaleString();
          trafficCell.title = traffic == null ? 'No measurement in this snapshot' : 'Current organic traffic';
          row.append(trafficCell);
        });
        body.append(row);
      });
    };
    search.oninput = draw; draw(); board.append(list,detail); host.append(board);
  }
  global.CompetitiveIntelligence = { ensure, normalize, render, loadClassifications, classificationOf };
})(window);
