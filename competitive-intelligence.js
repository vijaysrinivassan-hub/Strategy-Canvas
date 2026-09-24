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
  function normalize(tab){
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
    const matches = seed && String(client || '').trim().toLowerCase() === seed.client.toLowerCase() &&
      String(product || '').trim().toLowerCase() === seed.product.toLowerCase();
    if (!tab.competitors.length && matches){
      tab.competitors = clone(seed.competitors);
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
  function sectionOf(value){
    try {
      const parts = new URL(value).pathname.split('/').filter(Boolean);
      return parts[0] || 'Homepage';
    } catch { return 'Other'; }
  }
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
    const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>#</th><th>URL</th><th>Section</th></tr>';
    const body = document.createElement('tbody'); table.append(thead,body); wrap.append(table); detail.append(wrap);
    const draw = () => {
      const query = search.value.trim().toLowerCase(); body.innerHTML = '';
      active.urls.filter(url => !query || url.toLowerCase().includes(query)).forEach((url,index) => {
        const row = document.createElement('tr'), num = document.createElement('td'), cell = document.createElement('td'), type = document.createElement('td');
        num.textContent = String(index + 1); const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = url;
        const code = document.createElement('code'); code.textContent = sectionOf(url); cell.append(link); type.append(code); row.append(num,cell,type); body.append(row);
      });
    };
    search.oninput = draw; draw(); board.append(list,detail); host.append(board);
  }
  global.CompetitiveIntelligence = { ensure, normalize, render };
})(window);
