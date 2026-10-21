/* Keywords › Cluster: a two-layer topical map of what the client has written.
   Outer layer — every published article, under the two reasons a person
   searches: to learn (Informational) or to decide what to buy (Commercial).
   Inner layer — the money pages plus the commercial pages. Commercial pages
   are the same circles in both layers (a double ring marks them), so the two
   layers read as one map; the 3D view stacks them and joins those circles.
   Articles come from the shared URL repository: records published by the
   represented company. Topics added here are saved by the host page. */
(function(global){
  'use strict';

  const STAGES=[
    {id:'problem-unaware',label:'Problem Unaware',intent:'informational',open:{kind:'awareness',id:'problem-unaware'}},
    {id:'problem-aware',label:'Problem Aware',intent:'informational',open:{kind:'awareness',id:'problem-aware'}},
    {id:'solution-aware',label:'Solution Aware',intent:'commercial',open:{kind:'awareness',id:'solution-aware'}},
    {id:'category-aware',label:'Category Aware',intent:'commercial',open:{kind:'view',id:'category'}},
    {id:'product-aware',label:'Product Aware',intent:'commercial',open:{kind:'view',id:'product'}},
    {id:'competitor-aware',label:'Competitor Aware',intent:'commercial',open:{kind:'view',id:'competitor'}}
  ];
  const INTENTS=[
    {id:'informational',label:'Informational',question:'They want to know something'},
    {id:'commercial',label:'Commercial',question:'They want to know what to buy'}
  ];

  const clean=value=>String(value||'').trim();
  const norm=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const slug=value=>norm(value).replace(/\s+/g,'-');

  /* Product Aware pages are filed as Category AEO landing pages, or as
     capability/feature listicles — the same rule the sidebar counts use. */
  function stageOf(record,pageGroup){
    if(record.awareness==='category-aware'){
      const group=pageGroup?pageGroup(record.pageType):'';
      if(record.section==='Category AEO'&&(group==='landing'||['capabilities','features'].includes(norm(record.axis))))return 'product-aware';
      return 'category-aware';
    }
    return STAGES.some(stage=>stage.id===record.awareness)?record.awareness:'';
  }

  function article(record){
    return {id:record.id||record.url,url:clean(record.url),title:clean(record.topic)||clean(record.url),
      type:clean(record.pageType),axis:clean(record.axis),topic:clean(record.hierarchy),
      keyword:clean(record.primaryKeyword)};
  }

  function writtenArticles(records,options={}){
    const workspace=options.workspace||'';
    const seen=new Set(),out=[];
    for(const record of records||[]){
      if(!record||!record.represented)continue;
      if(workspace&&record.workspace!==workspace)continue;
      if(options.matches&&!options.matches(record))continue;
      const stage=stageOf(record,options.pageGroup);
      if(!stage)continue;
      const key=clean(record.url)||record.id;
      if(seen.has(key))continue;seen.add(key);
      out.push({...article(record),stage});
    }
    return out;
  }

  function node(id,label,kind,extra={}){return {id,label,kind,articles:[],children:[],...extra};}
  function groupBy(items,keyOf){
    const map=new Map();
    for(const item of items){const key=keyOf(item)||'General';if(!map.has(key))map.set(key,[]);map.get(key).push(item);}
    return [...map.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));
  }
  function leafTopics(parentId,items,keyOf,intent){
    return groupBy(items,keyOf).map(([label,list])=>{
      const leaf=node(parentId+'/'+slug(label),label,'topic',{intent});leaf.articles=list;return leaf;
    });
  }

  /* A competitor named in the matrix and the one an article was written about
     are the same company when either name contains the other, so
     "Triple Whale / Moby AI" collects the "Triple Whale" articles. */
  function sameCompany(a,b){
    const parts=value=>clean(value).split('/').map(norm).filter(Boolean);
    return parts(a).some(x=>parts(b).some(y=>x===y||x.includes(y)||y.includes(x)));
  }

  function buildTree(articles,options={}){
    const root=node('root',options.client||'Articles','root',{layer:'outer'});
    const intents={};
    for(const intent of INTENTS){intents[intent.id]=node(intent.id,intent.label,'intent',{intent:intent.id,question:intent.question});root.children.push(intents[intent.id]);}
    const byStage=id=>articles.filter(item=>item.stage===id);

    for(const stage of STAGES.filter(item=>item.intent==='informational')){
      const stageNode=node(stage.id,stage.label,'stage',{intent:stage.intent,open:stage.open});
      stageNode.children=leafTopics(stage.id,byStage(stage.id),item=>item.topic,'informational');
      intents.informational.children.push(stageNode);
    }

    const commercial=intents.commercial;
    /* Commercial runs Category -> Competitors -> each competitor, because a
       buyer who knows the category compares the companies inside it. */
    const category=node('category-aware','Category','stage',{intent:'commercial',open:{kind:'view',id:'category'}});
    for(const [label,list] of groupBy(byStage('category-aware'),item=>item.topic)){
      const named=node('category-aware/'+slug(label),label,'category',{intent:'commercial'});
      named.children=leafTopics(named.id,list,item=>item.axis,'commercial');
      named.articles=named.children.length>1?[]:list;
      if(named.children.length<=1)named.children=[];
      category.children.push(named);
    }
    const competitors=node('competitor-aware','Competitors','stage',{intent:'commercial',open:{kind:'view',id:'competitor'}});
    const competitorArticles=byStage('competitor-aware');
    const names=[];
    for(const name of options.competitors||[])if(clean(name)&&!names.some(item=>sameCompany(item,name)))names.push(clean(name));
    for(const item of competitorArticles)if(item.topic&&!names.some(name=>sameCompany(name,item.topic)))names.push(item.topic);
    const claimed=new Set();
    const competitorNodes=names.map(name=>{
      const leaf=node('competitor-aware/'+slug(name),name,'competitor',{intent:'commercial'});
      leaf.articles=competitorArticles.filter(item=>!claimed.has(item.id)&&sameCompany(name,item.topic));
      leaf.articles.forEach(item=>claimed.add(item.id));
      return leaf;
    });
    competitorNodes.sort((a,b)=>b.articles.length-a.articles.length||a.label.localeCompare(b.label));
    competitors.children=competitorNodes;
    category.children.push(competitors);
    commercial.children.push(category);

    const solution=node('solution-aware','Solution Aware','stage',{intent:'commercial',open:{kind:'awareness',id:'solution-aware'}});
    solution.children=leafTopics('solution-aware',byStage('solution-aware'),item=>[item.topic,item.axis].filter(Boolean).join(' · '),'commercial');
    commercial.children.push(solution);
    const product=node('product-aware','Product Aware','stage',{intent:'commercial',open:{kind:'view',id:'product'}});
    product.children=leafTopics('product-aware',byStage('product-aware'),item=>item.topic,'commercial');
    commercial.children.push(product);

    count(root);
    return root;
  }

  /* ---------------- inner layer: money and commercial pages ---------------- */
  const NOT_MONEY=/\/(blogs?|blog-categories|tags?|categor(y|ies)|authors?|page)(\/|$)|privacy|terms|cookie|legal|careers|jobs|sitemap|log-?in|sign-?in|sign-?up|\.xml$/i;
  function pageTitle(url){
    const path=String(url||'').replace(/^[a-z]+:\/\/[^/]+/i,'').split(/[?#]/)[0];
    const last=path.replace(/\/+$/,'').split('/').filter(Boolean).pop()||'';
    if(!last)return 'Home';
    const words=last.replace(/[-_]+/g,' ').trim();
    return words.charAt(0).toUpperCase()+words.slice(1);
  }
  /* The client's own site pages that sell, plus anything starred as high
     priority. Starred pages always count, even a blog post. */
  function moneyPages(urls,starred){
    const out=[],seen=new Set();
    const add=(url,isStarred)=>{
      const key=clean(url).replace(/\/+$/,'').toLowerCase();
      if(!key||seen.has(key))return;
      if(!isStarred&&NOT_MONEY.test(key))return;
      seen.add(key);out.push({id:clean(url),url:clean(url),title:pageTitle(url),type:isStarred?'High priority':'Money page'});
    };
    (starred||[]).forEach(url=>add(url,true));
    (urls||[]).forEach(url=>add(url,false));
    const order=page=>page.title==='Home'?0:/pricing/i.test(page.url)?1:2;
    return out.sort((a,b)=>order(a)-order(b)||a.title.localeCompare(b.title));
  }

  /* The inner layer reuses the outer layer's commercial circles (same
     objects, same ids), so a commercial page is one circle shown twice. */
  function buildInner(outer,pages,options={}){
    const root=node('inner-root',options.client||'Money pages','root',{layer:'inner'});
    const money=node('money-pages','Money pages','stage',{intent:'money'});
    const articleUrls=new Set(articlesUnder(outer).map(a=>a.url.replace(/\/+$/,'').toLowerCase()));
    money.children=pages.map(page=>{
      const leaf=node('page:'+page.url.replace(/\/+$/,'').toLowerCase(),page.title,'page',{intent:'money',url:page.url});
      leaf.articles=[page];
      if(articleUrls.has(page.url.replace(/\/+$/,'').toLowerCase()))leaf.alsoArticle=true;
      return leaf;
    });
    root.children.push(money);
    const commercial=find(outer,'commercial');
    for(const child of commercial?commercial.children:[])root.children.push(child);
    count(root);
    return root;
  }
  /* every circle under the inner layer's commercial branches is shared with the outer layer */
  function dualIds(inner){
    const ids=new Set();
    for(const top of inner.children){if(top.id==='money-pages')continue;(function walk(n){ids.add(n.id);n.children.forEach(walk);})(top);}
    return ids;
  }

  /* Topics added from the canvas hang under any circle, including other added topics. */
  function applyTopics(trees,topics){
    const pending=(topics||[]).filter(t=>t&&t.id&&clean(t.label));
    let placed=true;
    const added=new Map();
    while(placed&&pending.length){
      placed=false;
      for(let i=pending.length-1;i>=0;i--){
        const topic=pending[i];
        const parents=trees.map(tree=>find(tree,topic.parentId)).filter(Boolean);
        if(!parents.length)continue;
        const parent=parents[0];
        const leaf=added.get(topic.id)||node('topic:'+topic.id,clean(topic.label),'custom',{intent:parent.intent||'',custom:true,topicId:topic.id});
        added.set(topic.id,leaf);
        for(const p of new Set(parents))if(!p.children.includes(leaf))p.children.push(leaf);
        pending.splice(i,1);placed=true;
      }
    }
    trees.forEach(count);
    return pending;   /* topics whose parent no longer exists */
  }

  function count(item){
    const ids=new Set(item.articles.map(a=>a.id));
    for(const child of item.children)for(const id of count(child))ids.add(id);
    item.total=ids.size;item.ids=ids;return ids;
  }
  function articlesUnder(item){
    const seen=new Set(),out=[];
    (function walk(n){for(const a of n.articles)if(!seen.has(a.id)){seen.add(a.id);out.push(a);}n.children.forEach(walk);})(item);
    return out;
  }
  function find(item,id){if(item.id===id)return item;for(const child of item.children){const hit=find(child,id);if(hit)return hit;}return null;}
  function pathTo(item,id,trail=[]){
    if(item.id===id)return [...trail,item];
    for(const child of item.children){const hit=pathTo(child,id,[...trail,item]);if(hit)return hit;}
    return null;
  }

  /* Radial topical map: the centre circle is the site, each ring is one level
     deeper, and every open branch gets a slice of the circle in proportion to
     the circles it shows. Rings widen when the outer ring gets crowded. */
  const RING=150,MIN_ARC=30;
  function radial(root,expanded){
    const leafCache=new Map();
    const isOpen=n=>expanded.has(n.id)&&n.children.length>0;
    const leaves=n=>{if(leafCache.has(n))return leafCache.get(n);const v=isOpen(n)?n.children.reduce((s,c)=>s+leaves(c),0):1;leafCache.set(n,v);return v;};
    let maxDepth=0;(function depth(n,d){maxDepth=Math.max(maxDepth,d);if(isOpen(n))n.children.forEach(c=>depth(c,d+1));})(root,0);
    /* with the centre split evenly, the busiest half sets how wide the rings must be */
    const crowd=isOpen(root)?Math.max(...root.children.map(leaves))*root.children.length:1;
    const ring=Math.max(RING,maxDepth?MIN_ARC*crowd/(2*Math.PI*maxDepth):RING);
    const placed=[],links=[];
    (function walk(n,d,a0,a1,parent){
      const angle=(a0+a1)/2,r=d*ring;
      const spot={item:n,depth:d,angle,x:r*Math.cos(angle),y:r*Math.sin(angle),open:isOpen(n)};
      placed.push(spot);if(parent)links.push({a:parent,b:spot});
      if(!spot.open)return;
      let a=a0;
      /* the centre splits its circle evenly (Informational one half, Commercial the other);
         deeper rings share their slice by how many circles each branch shows */
      for(const child of n.children){const span=d===0?(a1-a0)/n.children.length:(a1-a0)*leaves(child)/leaves(n);walk(child,d+1,a,a+span,spot);a+=span;}
    })(root,0,-Math.PI/2,Math.PI*1.5,null);
    return {placed,links,ring,depth:maxDepth,radius:maxDepth*ring};
  }
  function nodeRadius(spot){
    if(spot.depth===0)return 30;
    if(spot.depth===1)return 21;
    if(spot.item.custom)return 8;
    return 7+Math.min(13,Math.sqrt(spot.item.total||0)*2.4);
  }

  /* ---------------- rendering ---------------- */
  const SVG='http://www.w3.org/2000/svg';
  const view={mode:'outer',expanded:null,selected:'',pan:null,yaw:-0.5,boardKey:''};
  const STORE='sb-intent-cluster-v2';
  function remember(){
    try{localStorage.setItem(STORE,JSON.stringify({boardKey:view.boardKey,mode:view.mode,expanded:[...(view.expanded||[])],selected:view.selected,yaw:view.yaw}));}catch(e){}
  }
  function recall(boardKey){
    try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&saved.boardKey===boardKey)return saved;}catch(e){}
    return null;
  }
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function svgEl(tag,attrs={},cls){const e=document.createElementNS(SVG,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(cls)e.setAttribute('class',cls);return e;}
  const short=(text,max)=>text.length>max?text.slice(0,max-1)+'…':text;

  function render(host,ctx){
    if(view.boardKey!==ctx.boardKey){
      const saved=recall(ctx.boardKey);
      view.boardKey=ctx.boardKey;view.pan=null;
      view.mode=['outer','inner','3d'].includes(saved?.mode)?saved.mode:'outer';
      view.expanded=new Set(saved?.expanded?.length?saved.expanded:['root','inner-root','informational','commercial','category-aware','money-pages']);
      view.selected=saved?.selected||'';
      view.yaw=Number.isFinite(saved?.yaw)?saved.yaw:-0.5;
    }
    host.replaceChildren();
    host.className='intent-page';
    if(!ctx.workspace){
      host.append(el('div','intent-empty','No written articles are linked to this board yet. Articles appear here once the client’s published URLs are imported into Competitive Intelligence.'));
      return;
    }
    const articles=writtenArticles(ctx.records,ctx);
    const outer=buildTree(articles,{client:ctx.client,competitors:ctx.competitors});
    const inner=buildInner(outer,moneyPages(ctx.siteUrls,ctx.starred),{client:ctx.client});
    applyTopics([outer,inner],ctx.topics);
    renderMap(host,{outer,inner,dual:dualIds(inner)},ctx);
  }

  function renderMap(host,maps,ctx){
    const shell=el('div','intent-cluster');
    const stage=el('div','intent-stage-area');
    const svg=svgEl('svg',{},'tm-svg');
    const scene=svgEl('g',{},'tm-scene');svg.append(scene);
    const panel=el('aside','intent-panel');
    const views=el('div','tm-views');views.setAttribute('role','group');views.setAttribute('aria-label','Map view');
    const tools=el('div','intent-tools');
    stage.append(svg,views,tools);shell.append(stage,panel);host.append(shell);
    const canEdit=!ctx.readOnly;

    const findAny=id=>find(maps.outer,id)||find(maps.inner,id);
    if(view.selected&&!findAny(view.selected))view.selected='';
    const toneOf=item=>item.kind==='root'?'root':item.intent||'';

    const apply=()=>{scene.setAttribute('transform','translate('+view.pan.x+' '+view.pan.y+') scale('+view.pan.z+')');};
    const bounds=()=>{
      if(view.mode==='3d'){const g=geometry3d();return {w:g.width,h:g.height};}
      const r=radial(view.mode==='inner'?maps.inner:maps.outer,view.expanded).radius+150;return {w:2*r,h:2*r};
    };
    const fit=()=>{
      const box=stage.getBoundingClientRect(),w=box.width||900,h=box.height||600,b=bounds();
      const z=Math.max(.2,Math.min(1.2,(w-60)/b.w,(h-90)/b.h));
      view.pan={x:w/2,y:h/2+20,z};apply();
    };

    /* opening a branch: the clicked circle stays under the pointer's view */
    const toggle=(item,spot)=>{
      if(!item.children.length)return;
      if(!spot||!spot.open)view.expanded.add(item.id);
      else if(view.selected===item.id)view.expanded.delete(item.id);
    };
    const select=(item,spot)=>{toggle(item,spot);view.selected=item.id;remember();draw();showPanel();};

    const addTopic=parent=>{
      if(!canEdit)return;
      const underCompetitors=parent.id==='competitor-aware';
      const name=prompt(underCompetitors?'New competitor (it is added to the Competitor Aware table too)':'New topic under “'+parent.label+'”');
      if(name===null||!clean(name))return;
      view.expanded.add(parent.id);view.selected=parent.id;remember();
      if(underCompetitors)ctx.onAddCompetitor&&ctx.onAddCompetitor(clean(name));
      else ctx.onAddTopic&&ctx.onAddTopic({parentId:parent.id,label:clean(name)});
    };

    function drawNode(parent,spot,opts={}){
      const item=spot.item,r=(opts.scale||1)*nodeRadius(spot);
      const dual=maps.dual.has(item.id);
      const g=svgEl('g',{transform:'translate('+opts.x+' '+opts.y+')'},
        'tm-node '+item.kind+' '+toneOf(item)+(item.total||item.custom||spot.depth<2?'':' empty')+(dual?' dual':'')+(view.selected===item.id?' selected':''));
      g.dataset.nodeId=item.id;
      const title=svgEl('title');title.textContent=item.label+' — '+item.total+' '+(item.total===1?'page':'pages')+(dual?' · in both layers':'');g.append(title);
      if(dual)g.append(svgEl('circle',{r:r+4.5},'tm-dual-ring'));
      g.append(svgEl('circle',{r},'tm-dot'));
      if(r>=13&&item.total){const t=svgEl('text',{'text-anchor':'middle',dy:'.35em'},'tm-count');t.textContent=String(item.total);g.append(t);}
      if(opts.label!==false){
        const label=svgEl('text',{},'tm-label');label.textContent=short(item.label,spot.depth<=1?24:30);
        if(spot.depth<=2||opts.flatLabels){label.setAttribute('text-anchor','middle');label.setAttribute('y',String(r+15));}
        else{
          const deg=spot.angle*180/Math.PI,left=Math.cos(spot.angle)<0;
          label.setAttribute('transform','rotate('+(left?deg+180:deg)+')');
          label.setAttribute('text-anchor',left?'end':'start');label.setAttribute('x',String(left?-(r+7):r+7));label.setAttribute('dy','.35em');
        }
        g.append(label);
      }
      if(canEdit&&opts.plus!==false){
        const plus=svgEl('g',{transform:'translate('+(r*.72+3)+' '+(-r*.72-3)+')'},'tm-plus');
        const pt=svgEl('title');pt.textContent=item.id==='competitor-aware'?'Add a competitor':'Add a topic under '+item.label;plus.append(pt);
        plus.append(svgEl('circle',{r:7.5}),svgEl('path',{d:'M-3.5 0H3.5M0 -3.5V3.5'}));
        plus.addEventListener('click',event=>{event.stopPropagation();addTopic(item);});
        plus.addEventListener('pointerdown',event=>event.stopPropagation());
        g.append(plus);
      }
      g.addEventListener('click',event=>{event.stopPropagation();select(item,spot);});
      g.addEventListener('pointerdown',event=>event.stopPropagation());
      parent.append(g);
    }

    function drawFlat(){
      const tree=view.mode==='inner'?maps.inner:maps.outer;
      const {placed,links,radius,ring,depth}=radial(tree,view.expanded);
      /* faint guide circles: one per ring of the topical map */
      for(let d=1;d<=depth;d++)scene.append(svgEl('circle',{r:d*ring},'tm-guide'));
      const lines=svgEl('g',{},'tm-links');
      for(const link of links)lines.append(svgEl('line',{x1:link.a.x,y1:link.a.y,x2:link.b.x,y2:link.b.y},'tm-link '+toneOf(link.b.item)));
      scene.append(lines);
      const dots=svgEl('g');scene.append(dots);
      for(const spot of placed)drawNode(dots,spot,{x:spot.x,y:spot.y});
      const tag=svgEl('text',{x:0,y:-(radius+78),'text-anchor':'middle'},'tm-layer-tag');
      tag.textContent=view.mode==='inner'?'INNER LAYER · MONEY & COMMERCIAL PAGES':'OUTER LAYER · ALL ARTICLES';
      scene.append(tag);
    }

    /* 3D: both maps lie on tilted discs, outer above inner. Points are
       projected by hand (turn by yaw, squash by tilt) so one flat SVG can
       draw the straight lines that join a circle to its twin below. */
    const TILT=.38;
    function geometry3d(){
      const o=radial(maps.outer,view.expanded),i=radial(maps.inner,view.expanded);
      const R=Math.max(o.radius,i.radius)+70,gap=Math.max(260,R*.9);
      return {o,i,R,gap,width:2*R+120,height:2*R*TILT+gap+220};
    }
    function draw3d(){
      const {o,i,R,gap}=geometry3d();
      const cos=Math.cos(view.yaw),sin=Math.sin(view.yaw);
      const at=(spot,h)=>({x:spot.x*cos-spot.y*sin,y:(spot.x*sin+spot.y*cos)*TILT+h});
      const hOuter=-gap/2,hInner=gap/2;
      const layer=(layout,h,name,cls)=>{
        const g=svgEl('g',{},'tm-layer '+cls);
        g.append(svgEl('ellipse',{cx:0,cy:h,rx:R,ry:R*TILT},'tm-disc'));
        const tag=svgEl('text',{x:-R+10,y:h-R*TILT-10},'tm-layer-tag');tag.textContent=name;g.append(tag);
        for(const link of layout.links){const a=at(link.a,h),b=at(link.b,h);g.append(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y},'tm-link '+toneOf(link.b.item)));}
        const sorted=[...layout.placed].sort((p,q)=>at(p,h).y-at(q,h).y);
        for(const spot of sorted){const p=at(spot,h);drawNode(g,spot,{x:p.x,y:p.y,scale:.8,flatLabels:true,label:spot.depth<=1||view.selected===spot.item.id,plus:false});}
        return g;
      };
      scene.append(layer(i,hInner,'INNER LAYER · MONEY & COMMERCIAL PAGES','inner'));
      /* one circle, two layers: join each commercial circle to its twin */
      const below=new Map(i.placed.map(spot=>[spot.item.id,spot]));
      const ties=svgEl('g',{},'tm-ties');
      for(const spot of o.placed){
        const twin=below.get(spot.item.id);if(!twin||!maps.dual.has(spot.item.id))continue;
        const a=at(spot,hOuter),b=at(twin,hInner);
        ties.append(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y},'tm-tie'));
      }
      scene.append(ties);
      scene.append(layer(o,hOuter,'OUTER LAYER · ALL ARTICLES','outer'));
    }

    const draw=()=>{
      scene.replaceChildren();
      if(view.mode==='3d')draw3d();else drawFlat();
      views.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.mode===view.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===view.mode));});
      stage.classList.toggle('rotating',view.mode==='3d');
    };

    const showPanel=()=>{
      panel.replaceChildren();
      const item=view.selected?findAny(view.selected):null;
      if(!item){
        panel.append(el('span','intent-kicker','Topical map'),el('h3',null,'Pick a circle'),
          el('p','intent-panel-note','Click a circle to see its pages and to open or close its branch. Use the + on a circle to add a topic under it.'));
        const legend=el('div','intent-legend');
        [['informational','Informational','They want to know something'],['commercial','Commercial','They want to know what to buy'],['money','Money pages','Pages that sell'],['dual','Double ring','The same page sits in both layers']].forEach(([cls,label,text])=>{
          const row=el('div','intent-legend-row '+cls);row.append(el('span','intent-dot'),el('strong',null,label),el('span',null,text));legend.append(row);
        });
        panel.append(legend);return;
      }
      const trail=(pathTo(maps.outer,item.id)||pathTo(maps.inner,item.id)||[]).slice(1,-1).map(n=>n.label).join(' › ');
      panel.append(el('span','intent-kicker',trail||'Topical map'),el('h3',null,item.label));
      const list=articlesUnder(item);
      const where=maps.dual.has(item.id)?' · in both layers':item.intent==='money'?' · inner layer':'';
      panel.append(el('p','intent-panel-note',list.length+' '+(list.length===1?'page':'pages')+where+(item.question?' · '+item.question:'')));
      const actions=el('div','intent-panel-actions');
      if(canEdit){const add=el('button','intent-panel-open',item.id==='competitor-aware'?'+ Add competitor':'+ Add topic');add.type='button';add.onclick=()=>addTopic(item);actions.append(add);}
      if(item.open){const open=el('button','intent-panel-open','Open in Matrix →');open.type='button';open.onclick=()=>ctx.onOpen&&ctx.onOpen(item.open);actions.append(open);}
      if(canEdit&&item.custom){const del=el('button','intent-panel-open danger','Remove topic');del.type='button';del.onclick=()=>{if(confirm('Remove “'+item.label+'” and anything added under it?')){view.selected='';remember();ctx.onRemoveTopic&&ctx.onRemoveTopic(item.topicId);}};actions.append(del);}
      if(actions.children.length)panel.append(actions);
      if(item.custom&&!list.length)panel.append(el('div','intent-none','A topic you added. Nothing is written under it yet.'));
      else if(!list.length)panel.append(el('div','intent-none','No pages written here yet.'));
      const ul=el('ol','intent-articles');
      for(const a of list){
        const li=el('li');
        const link=el(a.url?'a':'span','intent-article-title',a.title);
        if(a.url){link.href=a.url;link.target='_blank';link.rel='noopener';}
        const meta=el('span','intent-article-meta',[a.type,a.axis&&a.axis!==a.type?a.axis:'',item.kind==='topic'||item.kind==='competitor'?'':a.topic].filter(Boolean).join(' · '));
        li.append(link,meta);ul.append(li);
      }
      panel.append(ul);
    };

    for(const [mode,label] of [['3d','3D'],['outer','Outer'],['inner','Inner']]){
      const b=el('button',null,label);b.type='button';b.dataset.mode=mode;
      b.onclick=()=>{if(view.mode===mode)return;view.mode=mode;remember();draw();fit();};
      views.append(b);
    }

    /* pan and zoom: drag the background, scroll or pinch; in 3D, dragging turns the map */
    const zoomAt=(factor,cx,cy)=>{
      const z=Math.max(.15,Math.min(3,view.pan.z*factor));
      view.pan.x=cx-(cx-view.pan.x)*(z/view.pan.z);view.pan.y=cy-(cy-view.pan.y)*(z/view.pan.z);view.pan.z=z;apply();
    };
    stage.addEventListener('wheel',event=>{
      event.preventDefault();
      const box=stage.getBoundingClientRect();
      if(event.ctrlKey||event.metaKey||view.mode==='3d')zoomAt(Math.exp(-event.deltaY*.0025*(event.ctrlKey?4:1)),event.clientX-box.left,event.clientY-box.top);
      else{view.pan.x-=event.deltaX;view.pan.y-=event.deltaY;apply();}
    },{passive:false});
    let drag=null;
    stage.addEventListener('pointerdown',event=>{
      if(event.target.closest('.intent-tools,.tm-views'))return;
      drag={x:event.clientX,y:event.clientY,px:view.pan.x,py:view.pan.y,yaw:view.yaw,moved:false};
      stage.setPointerCapture(event.pointerId);stage.classList.add('panning');
    });
    stage.addEventListener('pointermove',event=>{
      if(!drag)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
      if(view.mode==='3d'&&!event.shiftKey){view.yaw=drag.yaw+dx*.008;view.pan.y=drag.py+dy;draw();apply();}
      else{view.pan.x=drag.px+dx;view.pan.y=drag.py+dy;apply();}
    });
    const end=()=>{if(drag&&drag.moved&&view.mode==='3d')remember();if(drag&&!drag.moved&&view.selected){view.selected='';remember();draw();showPanel();}drag=null;stage.classList.remove('panning');};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('panning');});

    const tool=(label,title,fn)=>{const b=el('button',null,label);b.type='button';b.title=title;b.onclick=fn;tools.append(b);};
    tool('+','Zoom in',()=>{const r=stage.getBoundingClientRect();zoomAt(1.2,r.width/2,r.height/2);});
    tool('−','Zoom out',()=>{const r=stage.getBoundingClientRect();zoomAt(1/1.2,r.width/2,r.height/2);});
    tool('Fit','Fit the whole map',fit);
    tool('Expand all','Open every branch',()=>{for(const tree of [maps.outer,maps.inner])(function walk(n){if(n.children.length)view.expanded.add(n.id);n.children.forEach(walk);})(tree);remember();draw();fit();});
    tool('Collapse','Show only the first ring',()=>{view.expanded=new Set(['root','inner-root']);remember();draw();fit();});

    draw();showPanel();
    if(view.pan)apply();else if(stage.getBoundingClientRect().width)fit();else requestAnimationFrame(fit);
  }

  global.IntentCluster={STAGES,INTENTS,stageOf,writtenArticles,buildTree,moneyPages,buildInner,dualIds,applyTopics,radial,articlesUnder,find,render};
})(typeof globalThis!=='undefined'?globalThis:this);
