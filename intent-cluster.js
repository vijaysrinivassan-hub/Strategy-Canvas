/* Keywords › Cluster: one topical map of the keyword matrix. The centre splits
   into the two reasons a person searches — to learn (Informational) or to
   decide what to buy (Commercial) — and each ring is one level deeper: stage,
   topic, competitor. Circles carry the articles already published (from the
   shared URL repository) and the articles planned in the matrix tables, and
   a star marks a page starred as high priority. The side panel is drawn by
   the host page with the same cell fields the matrix uses, so editing here is
   editing the matrix. */
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
  const urlKey=value=>clean(value).replace(/\/+$/,'').toLowerCase();

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
      keyword:clean(record.primaryKeyword),written:true};
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
      const key=urlKey(record.url)||record.id;
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

  /* A competitor named in the matrix and the one an article was written about
     are the same company when either name contains the other, so
     "Triple Whale / Moby AI" collects the "Triple Whale" articles. */
  function sameCompany(a,b){
    const parts=value=>clean(value).split('/').map(norm).filter(Boolean);
    return parts(a).some(x=>parts(b).some(y=>x===y||x.includes(y)||y.includes(x)));
  }

  /* options.planned: [{stage, topic, item}] — titled matrix cells. A planned
     cell whose slug is already a published article is not listed twice. */
  function buildTree(articles,options={}){
    const root=node('root',options.client||'Articles','root');
    const intents={};
    for(const intent of INTENTS){intents[intent.id]=node(intent.id,intent.label,'intent',{intent:intent.id,question:intent.question});root.children.push(intents[intent.id]);}
    const published=new Set(articles.map(a=>urlKey(a.url)).filter(Boolean));
    const planned=(options.planned||[]).filter(p=>p&&p.item&&!(p.item.url&&published.has(urlKey(p.item.url))));
    const stageNodes={};
    const stageNode=(stage,label,parent)=>{const n=node(stage.id,label,'stage',{intent:stage.intent,open:stage.open,stage:stage.id});stageNodes[stage.id]=n;parent.children.push(n);return n;};
    /* topics come from published articles and from matrix rows alike */
    const topicsFor=(parent,stageId,kind)=>{
      const map=new Map();
      const add=(label,item)=>{
        const key=norm(label)||'general';
        if(!map.has(key))map.set(key,node(parent.id+'/'+slug(label||'General'),clean(label)||'General',kind,{intent:parent.intent,stage:stageId}));
        if(item)map.get(key).articles.push(item);
      };
      articles.filter(a=>a.stage===stageId).forEach(a=>add(a.topic,a));
      planned.filter(p=>p.stage===stageId).forEach(p=>add(p.topic,p.item));
      (options.topics||[]).filter(t=>t.stage===stageId).forEach(t=>add(t.topic,null));
      parent.children=[...map.values()].sort((a,b)=>b.articles.length-a.articles.length||a.label.localeCompare(b.label));
    };

    for(const stage of STAGES.filter(item=>item.intent==='informational'))topicsFor(stageNode(stage,stage.label,intents.informational),stage.id,'topic');

    /* Commercial runs Category -> Competitors -> each competitor, because a
       buyer who knows the category compares the companies inside it. */
    const commercial=intents.commercial;
    const category=stageNode(STAGES[3],'Category',commercial);
    topicsFor(category,'category-aware','category');
    const competitors=node('competitor-aware','Competitors','stage',{intent:'commercial',open:STAGES[5].open,stage:'competitor-aware'});
    stageNodes['competitor-aware']=competitors;
    const competitorItems=[...articles.filter(a=>a.stage==='competitor-aware'),...planned.filter(p=>p.stage==='competitor-aware').map(p=>({...p.item,topic:p.topic}))];
    const names=[];
    for(const name of options.competitors||[])if(clean(name)&&!names.some(item=>sameCompany(item,name)))names.push(clean(name));
    for(const item of competitorItems)if(item.topic&&!names.some(name=>sameCompany(name,item.topic)))names.push(item.topic);
    const claimed=new Set();
    competitors.children=names.map(name=>{
      const leaf=node('competitor-aware/'+slug(name),name,'competitor',{intent:'commercial',stage:'competitor-aware',inMatrix:(options.competitors||[]).some(n=>clean(n)===name)});
      leaf.articles=competitorItems.filter(item=>!claimed.has(item.id)&&sameCompany(name,item.topic));
      leaf.articles.forEach(item=>claimed.add(item.id));
      return leaf;
    }).sort((a,b)=>b.articles.length-a.articles.length||a.label.localeCompare(b.label));
    category.children.push(competitors);
    topicsFor(stageNode(STAGES[2],'Solution Aware',commercial),'solution-aware','topic');
    topicsFor(stageNode(STAGES[4],'Product Aware',commercial),'product-aware','topic');

    const starred=new Set((options.starred||[]).map(urlKey));
    (function mark(n){for(const a of n.articles)a.starred=!!(a.url&&starred.has(urlKey(a.url)));n.children.forEach(mark);})(root);
    count(root);
    return root;
  }

  function count(item){
    const ids=new Set(item.articles.map(a=>a.id));
    let star=item.articles.some(a=>a.starred);
    for(const child of item.children){for(const id of count(child))ids.add(id);star=star||child.starred;}
    item.total=ids.size;item.ids=ids;item.starred=star;return ids;
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

  /* Radial map: centre circle, one ring per level. The centre splits evenly
     between the two intents; deeper rings share their slice by how many
     circles each branch shows, and widen when the busiest half is crowded. */
  const RING=150,MIN_ARC=30;
  function radial(root,expanded){
    const leafCache=new Map();
    const isOpen=n=>expanded.has(n.id)&&n.children.length>0;
    const leaves=n=>{if(leafCache.has(n))return leafCache.get(n);const v=isOpen(n)?n.children.reduce((s,c)=>s+leaves(c),0):1;leafCache.set(n,v);return v;};
    let maxDepth=0;(function depth(n,d){maxDepth=Math.max(maxDepth,d);if(isOpen(n))n.children.forEach(c=>depth(c,d+1));})(root,0);
    const crowd=isOpen(root)?Math.max(...root.children.map(leaves))*root.children.length:1;
    const ring=Math.max(RING,maxDepth?MIN_ARC*crowd/(2*Math.PI*maxDepth):RING);
    const placed=[],links=[];
    (function walk(n,d,a0,a1,parent){
      const angle=(a0+a1)/2,r=d*ring;
      const spot={item:n,depth:d,angle,x:r*Math.cos(angle),y:r*Math.sin(angle),open:isOpen(n)};
      placed.push(spot);if(parent)links.push({a:parent,b:spot});
      if(!spot.open)return;
      let a=a0;
      for(const child of n.children){const span=d===0?(a1-a0)/n.children.length:(a1-a0)*leaves(child)/leaves(n);walk(child,d+1,a,a+span,spot);a+=span;}
    })(root,0,-Math.PI/2,Math.PI*1.5,null);
    return {placed,links,ring,depth:maxDepth,radius:maxDepth*ring};
  }
  function nodeRadius(spot){
    if(spot.depth===0)return 28;
    if(spot.depth===1)return 20;
    return 7+Math.min(12,Math.sqrt(spot.item.total||0)*2.3);
  }

  /* ---------------- rendering ---------------- */
  const SVG='http://www.w3.org/2000/svg';
  const view={expanded:null,selected:'',pan:null,boardKey:''};
  const STORE='sb-intent-cluster-v3';
  function remember(){
    try{localStorage.setItem(STORE,JSON.stringify({boardKey:view.boardKey,expanded:[...(view.expanded||[])],selected:view.selected}));}catch(e){}
  }
  function recall(boardKey){
    try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&saved.boardKey===boardKey)return saved;}catch(e){}
    return null;
  }
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function svgEl(tag,attrs={},cls){const e=document.createElementNS(SVG,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(cls)e.setAttribute('class',cls);return e;}
  const short=(text,max)=>text.length>max?text.slice(0,max-1)+'…':text;
  const editable=item=>item.kind!=='root'&&item.kind!=='intent';

  /* Selecting from outside (after the host adds a topic) keeps the map in step. */
  function focus(id){view.pendingFocus=id;}

  function render(host,ctx){
    if(view.boardKey!==ctx.boardKey){
      const saved=recall(ctx.boardKey);
      view.boardKey=ctx.boardKey;view.pan=null;
      view.expanded=new Set(saved?.expanded?.length?saved.expanded:['root','informational','commercial','category-aware']);
      view.selected=saved?.selected||'';
    }
    host.replaceChildren();
    host.className='intent-page';
    const articles=ctx.workspace?writtenArticles(ctx.records,ctx):[];
    const tree=buildTree(articles,{client:ctx.client,competitors:ctx.competitors,planned:ctx.planned,topics:ctx.topics,starred:ctx.starred});
    if(view.pendingFocus){const trail=pathTo(tree,view.pendingFocus);if(trail){trail.slice(0,-1).forEach(n=>view.expanded.add(n.id));view.selected=view.pendingFocus;remember();}view.pendingFocus='';}
    renderMap(host,tree,ctx);
  }

  function renderMap(host,tree,ctx){
    const shell=el('div','intent-cluster');
    const stage=el('div','intent-stage-area');
    const svg=svgEl('svg',{},'tm-svg');
    const scene=svgEl('g',{},'tm-scene');svg.append(scene);
    const panel=el('aside','intent-panel');
    const tools=el('div','intent-tools');
    stage.append(svg,tools);shell.append(stage,panel);host.append(shell);
    const canEdit=!ctx.readOnly;
    if(view.selected&&!find(tree,view.selected))view.selected='';

    const apply=()=>{scene.setAttribute('transform','translate('+view.pan.x+' '+view.pan.y+') scale('+view.pan.z+')');};
    const fit=()=>{
      const box=stage.getBoundingClientRect(),w=box.width||900,h=box.height||600;
      const r=radial(tree,view.expanded).radius+140;
      const z=Math.max(.2,Math.min(1.2,(w-40)/(2*r),(h-40)/(2*r)));
      view.pan={x:w/2,y:h/2,z};apply();
    };
    const select=(item,spot,adding)=>{
      if(item.children.length){
        if(!spot||!spot.open)view.expanded.add(item.id);
        else if(view.selected===item.id&&!adding)view.expanded.delete(item.id);
      }
      view.selected=item.id;remember();draw();showPanel(adding);
    };

    function drawNode(parent,spot){
      const item=spot.item,r=nodeRadius(spot);
      const g=svgEl('g',{transform:'translate('+spot.x+' '+spot.y+')'},
        'tm-node '+item.kind+' '+(item.kind==='root'?'root':item.intent||'')+(item.total||spot.depth<2?'':' empty')+(view.selected===item.id?' selected':''));
      g.dataset.nodeId=item.id;
      const title=svgEl('title');title.textContent=item.label+' — '+item.total+' '+(item.total===1?'article':'articles')+(item.starred?' · has high-priority pages':'');g.append(title);
      g.append(svgEl('circle',{r},'tm-dot'));
      if(r>=13&&item.total){const t=svgEl('text',{'text-anchor':'middle',dy:'.35em'},'tm-count');t.textContent=String(item.total);g.append(t);}
      if(item.starred){const s=svgEl('text',{x:-r*.72-2,y:-r*.72+2,'text-anchor':'middle'},'tm-star');s.textContent='★';g.append(s);}
      const label=svgEl('text',{},'tm-label');label.textContent=short(item.label,spot.depth<=1?24:30);
      if(spot.depth<=2){label.setAttribute('text-anchor','middle');label.setAttribute('y',String(r+14));}
      else{
        const deg=spot.angle*180/Math.PI,left=Math.cos(spot.angle)<0;
        label.setAttribute('transform','rotate('+(left?deg+180:deg)+')');
        label.setAttribute('text-anchor',left?'end':'start');label.setAttribute('x',String(left?-(r+7):r+7));label.setAttribute('dy','.35em');
      }
      g.append(label);
      if(canEdit&&editable(item)){
        const plus=svgEl('g',{transform:'translate('+(r*.72+3)+' '+(-r*.72-3)+')'},'tm-plus');
        const pt=svgEl('title');pt.textContent=item.kind==='stage'?(item.id==='competitor-aware'?'Add a competitor':'Add a topic to '+item.label):'Add an article to '+item.label;plus.append(pt);
        plus.append(svgEl('circle',{r:7.5}),svgEl('path',{d:'M-3.5 0H3.5M0 -3.5V3.5'}));
        plus.addEventListener('click',event=>{event.stopPropagation();select(item,spot,true);});
        plus.addEventListener('pointerdown',event=>event.stopPropagation());
        g.append(plus);
      }
      g.addEventListener('click',event=>{event.stopPropagation();select(item,spot,false);});
      g.addEventListener('pointerdown',event=>event.stopPropagation());
      parent.append(g);
    }

    const draw=()=>{
      scene.replaceChildren();
      const {placed,links,ring,depth}=radial(tree,view.expanded);
      for(let d=1;d<=depth;d++)scene.append(svgEl('circle',{r:d*ring},'tm-guide'));
      const lines=svgEl('g');
      for(const link of links)lines.append(svgEl('line',{x1:link.a.x,y1:link.a.y,x2:link.b.x,y2:link.b.y},'tm-link '+(link.b.item.intent||'')));
      scene.append(lines);
      const dots=svgEl('g');scene.append(dots);
      for(const spot of placed)drawNode(dots,spot);
    };

    const showPanel=adding=>{
      panel.replaceChildren();
      const item=view.selected?find(tree,view.selected):null;
      if(!item){
        panel.append(el('span','intent-kicker','Cluster'),el('h3',null,'Pick a circle'),
          el('p','intent-panel-note','Click a circle to open its branch and edit its articles. The + on a circle adds a topic, a competitor or an article, with the same fields as the matrix.'));
        const legend=el('div','intent-legend');
        [['informational','Informational','They want to know something'],['commercial','Commercial','They want to know what to buy'],['star','★ High priority','Starred pages']].forEach(([cls,label,text])=>{
          const row=el('div','intent-legend-row '+cls);row.append(el('span','intent-dot'),el('strong',null,label),el('span',null,text));legend.append(row);
        });
        panel.append(legend);return;
      }
      const trail=(pathTo(tree,item.id)||[]).slice(1,-1).map(n=>n.label).join(' › ');
      panel.append(el('span','intent-kicker',trail||'Cluster'),el('h3',null,item.label));
      const list=articlesUnder(item),written=list.filter(a=>a.written);
      panel.append(el('p','intent-panel-note',written.length+' published · '+(list.length-written.length)+' planned in the matrix'+(item.question?' · '+item.question:'')));
      if(item.open){const open=el('button','intent-panel-open','Open in Matrix →');open.type='button';open.onclick=()=>ctx.onOpen&&ctx.onOpen(item.open);panel.append(open);}
      /* the host draws the matrix fields for this circle */
      if(editable(item)&&ctx.renderEditor){
        const editor=el('div','intent-editor');panel.append(editor);
        ctx.renderEditor(editor,{item,adding,refresh:()=>{remember();ctx.onChange&&ctx.onChange();},select:id=>{focus(id);ctx.onChange&&ctx.onChange();}});
      }
      if(written.length){
        panel.append(el('h4','intent-panel-sub','Published'));
        const ul=el('ol','intent-articles');
        for(const a of written){
          const li=el('li');
          const top=el('div','intent-article-top');
          const link=el(a.url?'a':'span','intent-article-title',a.title);
          if(a.url){link.href=a.url;link.target='_blank';link.rel='noopener';}
          top.append(link);
          if(a.url&&ctx.onStar){
            const star=el('button','intent-star'+(a.starred?' on':''),a.starred?'★':'☆');star.type='button';
            star.title=a.starred?'Remove from high-priority links':'Mark as a high-priority link';star.disabled=!canEdit;
            star.onclick=()=>{ctx.onStar(a.url);};
            top.append(star);
          }
          li.append(top,el('span','intent-article-meta',[a.type,a.axis&&a.axis!==a.type?a.axis:'',item.kind==='topic'||item.kind==='competitor'?'':a.topic].filter(Boolean).join(' · ')));
          ul.append(li);
        }
        panel.append(ul);
      }
    };

    /* pan and zoom: drag the background, scroll or pinch to move, Ctrl+scroll to zoom */
    const zoomAt=(factor,cx,cy)=>{
      const z=Math.max(.15,Math.min(3,view.pan.z*factor));
      view.pan.x=cx-(cx-view.pan.x)*(z/view.pan.z);view.pan.y=cy-(cy-view.pan.y)*(z/view.pan.z);view.pan.z=z;apply();
    };
    stage.addEventListener('wheel',event=>{
      event.preventDefault();
      const box=stage.getBoundingClientRect();
      if(event.ctrlKey||event.metaKey)zoomAt(Math.exp(-event.deltaY*.01),event.clientX-box.left,event.clientY-box.top);
      else{view.pan.x-=event.deltaX;view.pan.y-=event.deltaY;apply();}
    },{passive:false});
    let drag=null;
    stage.addEventListener('pointerdown',event=>{
      if(event.target.closest('.intent-tools'))return;
      drag={x:event.clientX,y:event.clientY,px:view.pan.x,py:view.pan.y,moved:false};
      stage.setPointerCapture(event.pointerId);stage.classList.add('panning');
    });
    stage.addEventListener('pointermove',event=>{
      if(!drag)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
      view.pan.x=drag.px+dx;view.pan.y=drag.py+dy;apply();
    });
    const end=()=>{if(drag&&!drag.moved&&view.selected){view.selected='';remember();draw();showPanel();}drag=null;stage.classList.remove('panning');};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('panning');});

    const tool=(label,title,fn)=>{const b=el('button',null,label);b.type='button';b.title=title;b.onclick=fn;tools.append(b);};
    tool('+','Zoom in',()=>{const r=stage.getBoundingClientRect();zoomAt(1.2,r.width/2,r.height/2);});
    tool('−','Zoom out',()=>{const r=stage.getBoundingClientRect();zoomAt(1/1.2,r.width/2,r.height/2);});
    tool('Fit','Fit the whole map',fit);
    tool('Expand all','Open every branch',()=>{(function walk(n){if(n.children.length)view.expanded.add(n.id);n.children.forEach(walk);})(tree);remember();draw();fit();});
    tool('Collapse','Show only the two intents',()=>{view.expanded=new Set(['root']);remember();draw();fit();});

    draw();showPanel();
    if(view.pan)apply();else if(stage.getBoundingClientRect().width)fit();else requestAnimationFrame(fit);
  }

  global.IntentCluster={STAGES,INTENTS,stageOf,writtenArticles,buildTree,radial,articlesUnder,find,focus,sameCompany,render};
})(typeof globalThis!=='undefined'?globalThis:this);
