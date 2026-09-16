/* ICP-specific workflows. No data is copied into Product Architecture. */
const IcpWorkflows = {
  defaults: ['Industries', 'Departments', 'Countries', 'Functions'],
  model(icp){
    const source = icp.workflowDetails || {};
    return {axis: source.axis || 'Departments',
      axes: Array.isArray(source.axes) ? source.axes : [],
      workflows: Array.isArray(source.workflows) ? source.workflows : []};
  },
  stage(){return {id:uid(), name:'Stage 1', nodes:[], edges:[]};},
  workflow(axis){
    const stage=this.stage();
    return {id:uid(),axis,name:'',stages:[stage],activeStage:stage.id,chosenStage:'',useCase:''};
  },
  removeNode(stage,id){
    stage.nodes=stage.nodes.filter(n=>n.id!==id);
    stage.edges=stage.edges.filter(e=>e.from!==id&&e.to!==id);
  }
};
let icpWorkflowPage = null;
function closeIcpWorkflowPage(){
  if (!icpWorkflowPage) return;
  const {page,opener}=icpWorkflowPage;
  page.remove(); icpWorkflowPage=null;
  $('positioningPane').hidden=false;
  opener?.focus();
}
function openIcpWorkflowPage(icp){
  closeIcpWorkflowPage();
  const model=IcpWorkflows.model(icp), tab=state.tabs[POSITIONING_TAB];
  const ro=readOnly();
  const page=document.createElement('div');page.className='icp-workflow-page';
  const opener=document.activeElement;
  icpWorkflowPage={page,opener};
  $('positioningPane').hidden=true;
  $('positioningPane').after(page);
  const valid=()=>icpWorkflowPage?.page===page&&state.tabs[POSITIONING_TAB]===tab&&!readOnly();
  const save=()=>{if(!valid())return;icp.workflowDetails=model;markDirty();};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const button=(text,action,write=true)=>{
    const b=el('button','',text);b.type='button';b.disabled=write&&ro;
    b.onclick=()=>{if(write&&!valid())return;action();};return b;
  };
  const textField=(value,placeholder,onchange,multiline=false)=>{
    const n=el(multiline?'textarea':'input');n.value=value||'';n.placeholder=placeholder;n.readOnly=ro;
    n.setAttribute('aria-label',placeholder);
    n.oninput=()=>{if(!valid())return;onchange(n.value);save();};return n;
  };
  const top=el('header','icp-workflow-header');
  top.append(button('Back to Positioning Canvas',()=>{closeIcpWorkflowPage();renderPositioning();},false),
    el('h2','',icp.name||'ICP details'));
  page.append(top,el('p','icp-workflow-help','Choose how inputs differ, map each workflow through its maturity stages, then mark the stage you want to serve as a use case.'));
  const buying=el('label','icp-workflow-field');buying.append(el('span','','Buying triggers'),
    textField(icp.buyingTrigger,'What event or change makes this ICP look for a solution?',v=>{icp.buyingTrigger=v;},true));
  page.append(buying);
  if(icp.industries||icp.useCases){
    const notes=el('details','icp-workflow-legacy');notes.append(el('summary','','Previous industries and use-case notes'));
    for(const [key,label] of [['industries','Industries'],['useCases','Use cases']]){
      const field=el('label','icp-workflow-field');field.append(el('span','',label),textField(icp[key],label,v=>{icp[key]=v;},true));notes.append(field);
    }page.append(notes);
  }
  const controls=el('div','icp-workflow-controls'), axisLabel=el('label','icp-workflow-field');
  const select=el('select');select.setAttribute('aria-label','Input differentiation axis');
  const fillAxes=()=>{
    select.replaceChildren();
    [...new Set([...IcpWorkflows.defaults,...model.axes,model.axis])].forEach(axis=>{
      const o=el('option','',axis);o.value=axis;select.append(o);
    });select.value=model.axis;
  };
  fillAxes();axisLabel.append(el('span','','Input differentiation axis'),select);
  const custom=el('input');custom.placeholder='Custom axis';custom.setAttribute('aria-label','Custom differentiation axis');custom.disabled=ro;
  const addAxis=()=>{const value=custom.value.trim();if(!value)return;model.axes=[...new Set([...model.axes,value])];model.axis=value;custom.value='';save();fillAxes();renderRows();};
  controls.append(axisLabel,custom,button('+ Add custom axis',addAxis));
  custom.onkeydown=e=>{if(e.key==='Enter'&&valid())addAxis();};
  controls.append(button('+ Add workflow row',()=>{model.workflows.push(IcpWorkflows.workflow(model.axis));save();renderRows();}));
  page.append(controls);
  const rows=el('div','icp-workflow-rows');page.append(rows);
  select.onchange=()=>{model.axis=select.value;save();renderRows();};
  function renderRows(){
    rows.replaceChildren();
    const visible=model.workflows.filter(w=>w.axis===model.axis);
    if(!visible.length)rows.append(el('p','icp-workflow-empty','No workflows for this axis yet. Add a row for a department, industry, country or other input segment.'));
    visible.forEach((workflow,index)=>{
      const section=el('section','icp-workflow-row');
      const head=el('div','icp-workflow-controls');
      head.append(el('strong','','Workflow '+(index+1)),textField(workflow.name,'Name this workflow or segment (e.g. Marketing)',v=>{workflow.name=v;}));
      head.append(button('Remove workflow',()=>{if(!confirm('Remove this workflow and its stages?'))return;model.workflows=model.workflows.filter(w=>w.id!==workflow.id);save();renderRows();}));
      section.append(head);
      const tabs=el('div','icp-workflow-controls');
      let stage=workflow.stages.find(s=>s.id===workflow.activeStage)||workflow.stages[0];
      workflow.stages.forEach(s=>{
        const b=button(s.name||'Untitled stage',()=>{workflow.activeStage=s.id;save();renderRows();},false);
        b.classList.toggle('on',s===stage);b.setAttribute('aria-pressed',String(s===stage));tabs.append(b);
      });
      tabs.append(button('+ Maturity stage',()=>{const next=IcpWorkflows.stage();next.name='Stage '+(workflow.stages.length+1);workflow.stages.push(next);workflow.activeStage=next.id;save();renderRows();}));
      section.append(tabs);
      if(!stage){rows.append(section);return;}
      const stageHead=el('div','icp-workflow-controls');
      stageHead.append(textField(stage.name,'Maturity stage name',v=>{stage.name=v;}));
      const choose=button(workflow.chosenStage===stage.id?'Selected use case':'Choose this stage as use case',()=>{
        workflow.chosenStage=workflow.chosenStage===stage.id?'':stage.id;save();renderRows();
      });choose.classList.toggle('on',workflow.chosenStage===stage.id);stageHead.append(choose);
      if(workflow.stages.length>1)stageHead.append(button('Remove stage',()=>{
        if(!confirm('Remove this maturity stage and its diagram?'))return;
        workflow.stages=workflow.stages.filter(s=>s.id!==stage.id);
        if(workflow.chosenStage===stage.id)workflow.chosenStage='';
        workflow.activeStage=workflow.stages[0].id;save();renderRows();
      }));
      section.append(stageHead);
      if(workflow.chosenStage){
        const chosen=workflow.stages.find(s=>s.id===workflow.chosenStage);
        const useCase=el('label','icp-workflow-field');
        useCase.append(el('span','','Chosen use case · '+(chosen?.name||'')),textField(workflow.useCase,'Describe the process you will serve as a use case',v=>{workflow.useCase=v;},true));
        section.append(useCase);
      }
      drawFlow(section,stage,workflow);
      rows.append(section);
    });
  }
  function drawFlow(section,stage,workflow){
    const toolbar=el('div','icp-workflow-controls');
    const type=el('select');type.setAttribute('aria-label','New node type');
    ['Input','Technology','People','Step','Output'].forEach(t=>{const o=el('option','',t);o.value=t;type.append(o);});
    toolbar.append(type,button('+ Add node',()=>{
      const i=stage.nodes.length;stage.nodes.push({id:uid(),name:'',type:type.value,x:40+(i%4)*240,y:40+Math.floor(i/4)*150});
      save();renderRows();
    }));
    toolbar.append(el('small','','Drag nodes to arrange. Use Connect, then click the destination node. Select a connector to label or delete it.'));
    section.append(toolbar);
    const scroll=el('div','icp-flow-scroll');scroll.style.height=(workflow.height||360)+'px';
    const canvas=el('div','icp-flow-canvas');canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Data-flow canvas');
    const width=Math.max(1000,...stage.nodes.map(n=>n.x+260));
    const height=Math.max(320,...stage.nodes.map(n=>n.y+180));
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width',width);svg.setAttribute('height',height);svg.classList.add('icp-flow-edges');
    canvas.append(svg);scroll.append(canvas);section.append(scroll);
    let connecting=null,selectedEdge=null;
    const editor=el('div','icp-workflow-controls');section.append(editor);
    const nodeElements=new Map();
    function paintEdges(){
      svg.replaceChildren();
      for(const edge of stage.edges){
        const from=stage.nodes.find(n=>n.id===edge.from),to=stage.nodes.find(n=>n.id===edge.to);if(!from||!to)continue;
        const x=from.x+190,y=from.y+45,tx=to.x,ty=to.y+45,m=(x+tx)/2;
        const path=document.createElementNS(svg.namespaceURI,'path');
        path.setAttribute('d','M '+x+' '+y+' C '+m+' '+y+', '+m+' '+ty+', '+tx+' '+ty);
        path.setAttribute('class',selectedEdge===edge.id?'selected':'');
        path.onclick=()=>{selectedEdge=edge.id;connecting=null;paintEdges();edgeEditor(edge);canvas.focus();};
        svg.append(path);
        const arrow=document.createElementNS(svg.namespaceURI,'path');
        arrow.setAttribute('d','M '+(tx-8)+' '+(ty-5)+' L '+tx+' '+ty+' L '+(tx-8)+' '+(ty+5));arrow.classList.add('arrow');svg.append(arrow);
        if(edge.label){
          const text=document.createElementNS(svg.namespaceURI,'text');
          text.setAttribute('x',m);text.setAttribute('y',(y+ty)/2-10);text.setAttribute('text-anchor','middle');text.textContent=edge.label;svg.append(text);
        }
      }
    }
    function edgeEditor(edge){
      editor.replaceChildren(el('span','','Connector output'),textField(edge.label,'What data flows through this connector?',v=>{edge.label=v;paintEdges();}),
        button('Delete connector',()=>{stage.edges=stage.edges.filter(e=>e.id!==edge.id);save();renderRows();}));
    }
    stage.nodes.forEach(node=>{
      const box=el('div','icp-flow-node');box.style.left=node.x+'px';box.style.top=node.y+'px';nodeElements.set(node.id,box);
      const drag=el('div','icp-flow-drag',node.type||'Step');drag.title='Drag to move';
      box.append(drag,textField(node.name,'Node name',v=>{node.name=v;}));
      const actions=el('div','icp-flow-actions');
      actions.append(button('Connect',()=>{connecting=node.id;editor.replaceChildren(el('span','','Click the destination node to connect.'));}));
      actions.append(button('Remove',()=>{IcpWorkflows.removeNode(stage,node.id);save();renderRows();}));box.append(actions);
      box.onclick=e=>{
        if(!connecting||connecting===node.id||!valid())return;
        e.stopPropagation();
        if(!stage.edges.some(edge=>edge.from===connecting&&edge.to===node.id))stage.edges.push({id:uid(),from:connecting,to:node.id,label:''});
        connecting=null;save();renderRows();
      };
      drag.onpointerdown=e=>{
        if(ro||!valid()||e.button!==0)return;e.preventDefault();drag.setPointerCapture(e.pointerId);
        const startX=e.clientX,startY=e.clientY,x=node.x,y=node.y;
        drag.onpointermove=move=>{
          node.x=Math.max(10,x+move.clientX-startX);node.y=Math.max(10,y+move.clientY-startY);
          box.style.left=node.x+'px';box.style.top=node.y+'px';
          canvas.style.width=Math.max(width,node.x+260)+'px';canvas.style.height=Math.max(height,node.y+180)+'px';
          svg.setAttribute('width',Math.max(width,node.x+260));svg.setAttribute('height',Math.max(height,node.y+180));paintEdges();
        };
        drag.onpointerup=()=>{drag.onpointermove=null;drag.onpointerup=null;save();};
        drag.onpointercancel=()=>{drag.onpointermove=null;drag.onpointerup=null;save();};
      };
      canvas.append(box);
    });
    canvas.onkeydown=e=>{
      if(e.target.closest('input,textarea,select,button'))return;
      if((e.key==='Backspace'||e.key==='Delete')&&selectedEdge&&valid()){
        e.preventDefault();stage.edges=stage.edges.filter(edge=>edge.id!==selectedEdge);save();renderRows();
      }
      if(e.key==='Escape'){connecting=null;selectedEdge=null;editor.replaceChildren();paintEdges();}
    };
    const size=el('input');size.type='range';size.min=260;size.max=900;size.value=workflow.height||360;size.disabled=ro;
    size.setAttribute('aria-label','Workflow canvas height');
    size.oninput=()=>{if(!valid())return;workflow.height=Number(size.value);scroll.style.height=workflow.height+'px';save();};
    const sizeLabel=el('label','icp-workflow-size');sizeLabel.append(el('span','','Canvas height'),size);section.append(sizeLabel);
    paintEdges();
  }
  renderRows();
  top.querySelector('button').focus();
}
