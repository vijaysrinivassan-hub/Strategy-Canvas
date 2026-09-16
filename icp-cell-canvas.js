/* Compact stage canvases inside ICP option cells. A stage may have one or many parallel nodes. */
const IcpCellCanvas={
 ensure(option,makeId=uid){
  if(option.canvas?.nodes?.length){
   option.canvas.nodes=option.canvas.nodes.filter(n=>n&&typeof n.text==='string').map(n=>({id:n.id||makeId(),text:n.text}));
   option.canvas.version=1;this.sync(option);return option.canvas;
  }
  option.canvas={version:1,nodes:option.text?.trim()?[{id:makeId(),text:option.text}]:[]};
  return option.canvas;
 },
 sync(option){
  const nodes=option.canvas?.nodes||[];
  option.text=nodes.map(n=>n.text.trim()).filter(Boolean).join('\n\nParallel branch: ');
  return option.text;
 },
 width(option){return Math.max(210,(option.canvas?.nodes?.length||1)*188+28);},
 add(option,makeId=uid){const canvas=this.ensure(option,makeId);canvas.nodes.push({id:makeId(),text:''});this.sync(option);return canvas.nodes.at(-1);},
 remove(option,nodeId){const canvas=this.ensure(option);canvas.nodes=canvas.nodes.filter(n=>n.id!==nodeId);this.sync(option);},
 render(host,option,col,ro,{el,button,onChange,onStructure}){
  const canvas=this.ensure(option),wrap=el('div');wrap.className='icp-mini-canvas';wrap.dataset.nodes=String(canvas.nodes.length);
  const toolbar=el('div');toolbar.className='icp-mini-toolbar';
  toolbar.append(el('small',canvas.nodes.length>1?'Parallel stage':'Stage canvas'));
  if(!ro)toolbar.append(button('+ Node',()=>{this.add(option);onStructure();}));
  wrap.append(toolbar);
  const nodes=el('div');nodes.className='icp-mini-nodes'+(canvas.nodes.length>1?' branch':'');
  nodes.style.setProperty('--node-count',String(Math.max(1,canvas.nodes.length)));
  for(const node of canvas.nodes){
   const card=el('article');card.className='icp-mini-node';
   const inHandle=el('span');inHandle.className='icp-node-handle in';inHandle.setAttribute('aria-hidden','true');
   const outHandle=el('span');outHandle.className='icp-node-handle out';outHandle.setAttribute('aria-hidden','true');
   const input=el('textarea');input.value=node.text;input.placeholder='Describe this branch';input.readOnly=ro;
   input.setAttribute('aria-label',col.label+' stage node');
   input.oninput=()=>{node.text=input.value;this.sync(option);onChange();};
   const meta=el('div');meta.className='icp-mini-meta';meta.append(el('span',col.axis==='technology'?'TECHNOLOGY':'OPTION'));
   if(!ro)meta.append(button('×',()=>{if(!confirm('Remove this node?'))return;this.remove(option,node.id);onStructure();}));
   card.append(inHandle,input,meta,outHandle);nodes.append(card);
  }
  if(!canvas.nodes.length){
   const empty=el('div','No nodes in this stage.');empty.className='icp-mini-empty';nodes.append(empty);
  }
  wrap.append(nodes);host.style.minWidth=this.width(option)+'px';host.style.width=this.width(option)+'px';host.append(wrap);
 }
};
