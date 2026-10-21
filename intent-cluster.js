/* Keywords › Cluster: every written article drawn as a canvas under the two
   reasons a person searches — to learn something (Informational) or to decide
   what to buy (Commercial). Data comes from the shared URL repository: records
   published by the represented company are the articles already written.
   Nothing here writes to the board. */
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
  function leafTopics(parentId,items,keyOf){
    return groupBy(items,keyOf).map(([label,list])=>{
      const leaf=node(parentId+'/'+norm(label).replace(/\s+/g,'-'),label,'topic');leaf.articles=list;return leaf;
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
    const root=node('root',options.client||'Search intent','root');
    const intents={};
    for(const intent of INTENTS){intents[intent.id]=node(intent.id,intent.label,'intent',{intent:intent.id,question:intent.question});root.children.push(intents[intent.id]);}
    const byStage=id=>articles.filter(item=>item.stage===id);

    for(const stage of STAGES.filter(item=>item.intent==='informational')){
      const stageNode=node(stage.id,stage.label,'stage',{intent:stage.intent,open:stage.open});
      stageNode.children=leafTopics(stage.id,byStage(stage.id),item=>item.topic);
      intents.informational.children.push(stageNode);
    }

    const commercial=intents.commercial;
    /* Commercial runs Category -> Competitors -> each competitor, because a
       buyer who knows the category compares the companies inside it. */
    const category=node('category-aware','Category','stage',{intent:'commercial',open:{kind:'view',id:'category'}});
    for(const [label,list] of groupBy(byStage('category-aware'),item=>item.topic)){
      const named=node('category-aware/'+norm(label).replace(/\s+/g,'-'),label,'category',{intent:'commercial'});
      named.children=leafTopics(named.id,list,item=>item.axis);
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
      const leaf=node('competitor-aware/'+norm(name).replace(/\s+/g,'-'),name,'competitor',{intent:'commercial'});
      leaf.articles=competitorArticles.filter(item=>!claimed.has(item.id)&&sameCompany(name,item.topic));
      leaf.articles.forEach(item=>claimed.add(item.id));
      return leaf;
    });
    competitorNodes.sort((a,b)=>b.articles.length-a.articles.length||a.label.localeCompare(b.label));
    competitors.children=competitorNodes;
    category.children.push(competitors);
    commercial.children.push(category);

    const solution=node('solution-aware','Solution Aware','stage',{intent:'commercial',open:{kind:'awareness',id:'solution-aware'}});
    solution.children=leafTopics('solution-aware',byStage('solution-aware'),item=>[item.topic,item.axis].filter(Boolean).join(' · '));
    commercial.children.push(solution);
    const product=node('product-aware','Product Aware','stage',{intent:'commercial',open:{kind:'view',id:'product'}});
    product.children=leafTopics('product-aware',byStage('product-aware'),item=>item.topic);
    commercial.children.push(product);

    count(root);
    return root;
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

  /* Left-to-right tidy tree: leaves take one row each, a parent sits midway
     between its first and last visible child. */
  const COL=290,ROW=46,NODE_W=226;
  function layout(root,expanded){
    const placed=[],edges=[];let row=0;
    (function walk(item,depth){
      const open=expanded.has(item.id)&&item.children.length;
      const visible=open?item.children:[];
      let y;
      if(!visible.length){y=row*ROW;row++;}
      else{
        const ys=visible.map(child=>walk(child,depth+1));
        y=(ys[0]+ys[ys.length-1])/2;
        visible.forEach((child,index)=>edges.push({from:item.id,to:child.id,y1:y,y2:ys[index],x1:depth*COL,x2:(depth+1)*COL}));
      }
      placed.push({item,x:depth*COL,y,depth,open:!!open});
      return y;
    })(root,0);
    return {placed,edges,width:(Math.max(0,...placed.map(p=>p.depth))+1)*COL,height:row*ROW};
  }

  /* ---------------- rendering ---------------- */
  const view={expanded:null,selected:'',pan:null,boardKey:''};
  const STORE='sb-intent-cluster-v1';
  function remember(){
    try{localStorage.setItem(STORE,JSON.stringify({boardKey:view.boardKey,expanded:[...(view.expanded||[])],selected:view.selected}));}catch(e){}
  }
  function recall(boardKey){
    try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&saved.boardKey===boardKey)return saved;}catch(e){}
    return null;
  }
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}

  function render(host,ctx){
    if(view.boardKey!==ctx.boardKey){
      const saved=recall(ctx.boardKey);
      view.boardKey=ctx.boardKey;view.pan=null;
      view.expanded=new Set(saved?.expanded?.length?saved.expanded:['root','informational','commercial','category-aware']);
      view.selected=saved?.selected||'';
    }
    const articles=writtenArticles(ctx.records,ctx);
    const tree=buildTree(articles,{client:ctx.client,competitors:ctx.competitors});
    host.replaceChildren();
    host.className='intent-page';
    if(!ctx.workspace){
      host.append(el('div','intent-empty','No written articles are linked to this board yet. Articles appear here once the client’s published URLs are imported into Competitive Intelligence.'));
      return;
    }
    renderCluster(host,tree,ctx);
  }

  function renderCluster(host,tree,ctx){
    const shell=el('div','intent-cluster');
    const stage=el('div','intent-stage-area');
    const world=el('div','intent-world');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('intent-edges');
    const panel=el('aside','intent-panel');
    const tools=el('div','intent-tools');
    stage.append(world,tools);shell.append(stage,panel);host.append(shell);

    if(!view.selected||!find(tree,view.selected))view.selected='';
    const draw=()=>{
      const {placed,edges,width,height}=layout(tree,view.expanded);
      world.replaceChildren(svg);
      svg.setAttribute('width',String(width+NODE_W));svg.setAttribute('height',String(height+ROW));
      svg.innerHTML='<defs><marker id="intentArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>';
      const tone=id=>find(tree,id)?.intent||'';
      for(const edge of edges){
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        const x1=edge.x1+NODE_W,y1=edge.y1+ROW/2,x2=edge.x2-6,y2=edge.y2+ROW/2,mid=(x1+x2)/2;
        path.setAttribute('d','M'+x1+' '+y1+' C'+mid+' '+y1+' '+mid+' '+y2+' '+x2+' '+y2);
        path.setAttribute('class','intent-edge '+tone(edge.to));path.setAttribute('marker-end','url(#intentArrow)');
        svg.append(path);
      }
      for(const spot of placed){
        const item=spot.item;
        const card=el('button','intent-node '+item.kind+' '+(item.intent||'')+(item.total?'':' empty')+(view.selected===item.id?' selected':''));
        card.type='button';card.style.left=spot.x+'px';card.style.top=spot.y+'px';card.dataset.nodeId=item.id;
        const label=el('span','intent-node-label',item.label);
        const badge=el('span','intent-node-count',String(item.total));
        card.append(label,badge);
        if(item.children.length){const caret=el('span','intent-caret',spot.open?'−':'+');caret.title=spot.open?'Collapse':'Expand';card.append(caret);}
        card.title=item.label+' — '+item.total+' written '+(item.total===1?'article':'articles');
        card.onclick=event=>{
          event.stopPropagation();
          /* the caret toggles; a closed node opens; clicking the selected open node closes it */
          if(item.children.length){
            const onCaret=event.target.classList.contains('intent-caret');
            if(!spot.open)view.expanded.add(item.id);
            else if(onCaret||view.selected===item.id)view.expanded.delete(item.id);
          }
          view.selected=item.id;remember();draw();showPanel();
          /* opening a branch re-flows the tree; keep the clicked node where it was */
          const moved=layout(tree,view.expanded).placed.find(p=>p.item===item);
          if(moved&&view.pan){
            view.pan.y+=(spot.y-moved.y)*view.pan.z;
            /* and slide left far enough that a newly opened column is on screen */
            const right=(moved.x+COL+NODE_W)*view.pan.z+view.pan.x,room=stage.getBoundingClientRect().width-24;
            if(moved.open&&right>room)view.pan.x-=right-room;
            apply();
          }
        };
        world.append(card);
      }
      world.style.width=(width+NODE_W)+'px';world.style.height=(height+ROW)+'px';
    };

    const showPanel=()=>{
      panel.replaceChildren();
      const item=view.selected?find(tree,view.selected):null;
      if(!item){
        panel.append(el('span','intent-kicker','Cluster'),el('h3',null,'Pick a node'),
          el('p','intent-panel-note','Click a circle to see the articles written under it. Click it again, or its + / −, to open or close its branch.'));
        const legend=el('div','intent-legend');
        INTENTS.forEach(intent=>{const row=el('div','intent-legend-row '+intent.id);row.append(el('span','intent-dot'),el('strong',null,intent.label),el('span',null,intent.question));legend.append(row);});
        panel.append(legend);return;
      }
      const trail=(pathTo(tree,item.id)||[]).slice(1).map(n=>n.label).join(' › ');
      panel.append(el('span','intent-kicker',trail||'Search intent'),el('h3',null,item.label));
      const list=articlesUnder(item);
      panel.append(el('p','intent-panel-note',list.length+' written '+(list.length===1?'article':'articles')+(item.question?' · '+item.question:'')));
      if(item.open){const open=el('button','intent-panel-open','Open this table →');open.type='button';open.onclick=()=>ctx.onOpen&&ctx.onOpen(item.open);panel.append(open);}
      const ul=el('ol','intent-articles');
      for(const a of list){
        const li=el('li');
        const link=el(a.url?'a':'span','intent-article-title',a.title);
        if(a.url){link.href=a.url;link.target='_blank';link.rel='noopener';}
        const meta=el('span','intent-article-meta',[a.type,a.axis&&a.axis!==a.type?a.axis:'',item.kind==='topic'||item.kind==='competitor'?'':a.topic].filter(Boolean).join(' · '));
        li.append(link,meta);ul.append(li);
      }
      if(!list.length)panel.append(el('div','intent-none','No articles written here yet.'));
      panel.append(ul);
    };

    /* pan and zoom: drag the background, scroll or pinch to move, Ctrl+scroll to zoom */
    const apply=()=>{world.style.transform='translate('+view.pan.x+'px,'+view.pan.y+'px) scale('+view.pan.z+')';};
    /* Fit shows everything; the first view stays readable instead, keeping
       the starting node level with the middle of the screen. */
    const fit=readable=>{
      const {placed,width,height}=layout(tree,view.expanded);
      const box=stage.getBoundingClientRect();
      const w=box.width||900,h=box.height||600;
      let z=Math.max(.35,Math.min(1.1,(w-80)/(width+NODE_W),(h-80)/(height+ROW)));
      if(readable===true&&z<.8){
        z=.8;const rootY=(placed.find(spot=>spot.item===tree)?.y||0)+ROW/2;
        view.pan={x:40,y:h/2-rootY*z,z};
      }else view.pan={x:40,y:Math.max(30,(h-(height+ROW)*z)/2),z};
      apply();
    };
    const zoomAt=(factor,cx,cy)=>{
      const z=Math.max(.25,Math.min(2.5,view.pan.z*factor));
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
      if(event.target.closest('.intent-node,.intent-tools'))return;
      drag={x:event.clientX,y:event.clientY,px:view.pan.x,py:view.pan.y};stage.setPointerCapture(event.pointerId);stage.classList.add('panning');
    });
    stage.addEventListener('pointermove',event=>{if(!drag)return;view.pan.x=drag.px+event.clientX-drag.x;view.pan.y=drag.py+event.clientY-drag.y;apply();});
    const end=()=>{drag=null;stage.classList.remove('panning');};
    stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
    stage.addEventListener('click',event=>{if(event.target===stage||event.target===world||event.target===svg){view.selected='';remember();draw();showPanel();}});

    const tool=(label,title,fn)=>{const b=el('button',null,label);b.type='button';b.title=title;b.onclick=fn;tools.append(b);};
    tool('+','Zoom in',()=>{const r=stage.getBoundingClientRect();zoomAt(1.2,r.width/2,r.height/2);});
    tool('−','Zoom out',()=>{const r=stage.getBoundingClientRect();zoomAt(1/1.2,r.width/2,r.height/2);});
    tool('Fit','Fit the whole cluster',()=>fit());
    tool('Expand all','Open every branch',()=>{(function walk(n){if(n.children.length)view.expanded.add(n.id);n.children.forEach(walk);})(tree);remember();draw();fit();});
    tool('Collapse','Show only the two intents',()=>{view.expanded=new Set(['root']);remember();draw();fit();});

    draw();showPanel();
    if(view.pan)apply();else if(stage.getBoundingClientRect().width)fit(true);else requestAnimationFrame(()=>fit(true));
  }

  global.IntentCluster={STAGES,INTENTS,stageOf,writtenArticles,buildTree,layout,articlesUnder,find,render};
})(typeof globalThis!=='undefined'?globalThis:this);
