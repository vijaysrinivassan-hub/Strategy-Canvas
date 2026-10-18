/* Client onboarding flow: the only form a client fills in by hand.
   A · What you have: 1 Products, with the main goal and how they sell.
   B · What you want: 2 Market system (what you sell × what it changes for the buyer), 3 Market map (segments and
   the awareness × value picture). 4 Review & hand-off: a summary, then the AI fills the rest stage by stage.
   Every answer is stored in the board fields the rest of the strategy already reads. */
const OBF_STEPS=[
 {id:'product',group:'have',label:'Products',sub:'What you sell, how, and your goal',kicker:'What you have',
  question:'What are you selling, and what does it do?',
  detail:'Add each product you want to take to market, with a sentence or two on what it does. Then two quick questions about how you sell and what you want first.'},
 {id:'market',group:'want',label:'Market system',sub:'Who you sell to, and what you change for them',kicker:'What you want',
  question:'What does your product change for the buyer?',
  detail:'Every business runs on four things: technology, process, people and input. Pick what you sell, then the one thing it most changes for your buyer. Where they cross is your market.'},
 {id:'market_mapping',group:'want',label:'Market map',sub:'Segments and the market picture',kicker:'What you want',
  question:'Which markets are you looking at?',
  detail:'Describe the segments you could sell into. Each one lands somewhere on the picture below. There is no right or wrong spot: it simply shows the trade-off.'},
 {id:'review',group:'review',label:'Review & hand-off',sub:'Confirm, then the AI builds the strategy',kicker:'Review & hand-off',
  question:'Here’s what we heard. Ready to build?',
  detail:'Check both halves. Once you confirm, the AI fills the strategy one stage at a time, and you only step in once: to pick the maturity level you want to win.'}
];
const OBF_GOALS=[['Customer Acquisition','Win new customers','More leads, demos and sales'],
 ['Brand Perception','Change how you’re seen','Shift perception and sentiment']];
const OBF_MOTIONS=[['slg','Sales-led (SLG)','A demo or sales call comes first'],['plg','Product-led (PLG)','They sign up and try it themselves']];
const OBF_SIZES=[['enterprise','Enterprise'],['mid','Mid-market'],['smb','Small business']];
const OBF_AXES=[['technology','Technology'],['process','Process'],['people','People'],['input','Input']];
/* Countries with large B2B budgets; used only for the rough first placement of a segment on the market picture. */
const OBF_HIGH_BUDGET=new Set('US CA GB DE FR NL SE CH NO DK FI IE AT BE LU IS AU NZ JP SG KR IL AE'.split(' '));
let obfHighlight='all';

function obfEl(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el;}
function obfButton(className,text,onClick){const b=obfEl('button',className,text);b.type='button';if(onClick)b.onclick=onClick;return b;}
function obfRerender(){markDirty();renderGtmOnboarding();}
function obfFilled(value){return String(value||'').trim().length>0;}

function obfState(){
 const onboarding=strategyOneState().onboarding;
 if(!Array.isArray(onboarding.companySizes))onboarding.companySizes=[];
 if(!onboarding.marketMap||typeof onboarding.marketMap!=='object')onboarding.marketMap={positions:{}};
 if(!onboarding.marketMap.positions||typeof onboarding.marketMap.positions!=='object')onboarding.marketMap.positions={};
 if(!OBF_STEPS.some(step=>step.id===onboarding.activeStep))onboarding.activeStep='product';
 return onboarding;
}
function obfSellingAxis(){return evolutionState().axis||brandRadarState().sourceAxis||'';}
function obfMarketModel(){
 const selling=obfSellingAxis(),buying=activeBuyingIndustryAxis();
 return INDUSTRY_FIT_MARKETS.find(model=>model.selling===selling&&model.buying===buying)||null;
}
function obfAudience(){return brandRadarState().marketAudience==='b2c'?'b2c':'b2b';}
function obfShortMarket(name){return String(name||'').replace(/\s+market$/i,'');}
/* Short names that fit a matrix cell; the full market name shows in the result panel. */
const OBF_CELL_NAMES={
 b2b:{'technology-technology':'IT / Infrastructure','technology-process':'B2B SaaS','technology-people':'Workforce software','technology-input':'Data infrastructure',
  'process-technology':'Integration services','process-process':'Agencies / services','process-people':'Training / coaching','process-input':'Operations / supply chain',
  'people-technology':'IT staffing','people-process':'Consulting','people-people':'Talent / workforce','people-input':'Skilled services',
  'input-technology':'Tech components','input-process':'Data & information','input-people':'Workplace goods','input-input':'Commodities'},
 b2c:{'technology-technology':'Consumer tech','technology-process':'Consumer software','technology-people':'Personal apps','technology-input':'Personal data tools',
  'process-technology':'Tech services','process-process':'Managed services','process-people':'Coaching / education','process-input':'Household services',
  'people-technology':'Expert tech help','people-process':'Professional services','people-people':'Care / wellness','people-input':'Craft / production',
  'input-technology':'Device components','input-process':'Information / subscriptions','input-people':'Consumer goods','input-input':'Household materials'}
};
function obfCellName(model,audience){return OBF_CELL_NAMES[audience]?.[model.selling+'-'+model.buying]||obfShortMarket(model[audience].market);}
function obfAxisLabel(id){return (OBF_AXES.find(axis=>axis[0]===id)||['',''])[1];}
function obfIndustryNames(architecture){
 return (architecture?.industries||[]).map(value=>String(value||'').trim()).filter(name=>name&&!/^industry$/i.test(name));
}

/* What the client has answered, step by step. Drives the ticks, the Onboarding percentage and Continue. */
function obfChecks(){
 const products=channelState().products;
 const named=products.length>0&&products.every(product=>{const name=String(product.name||'').trim();return name&&!/^(new product|product name)$/i.test(name);});
 const onboarding=obfState();
 return {
  product:[named,OBF_GOALS.some(goal=>goal[0]===state.clientGoal),['slg','plg'].includes(state.clientSalesMotion)],
  market:[!!obfMarketModel()],
  market_mapping:[obfIndustryNames(state.tabs[MATURITY_ACCESS_TAB]?.architecture).length>0,onboarding.companySizes.length>0,state.clientMarkets.filter(Boolean).length>0]
 };
}
function obfStepDone(id){
 if(id==='review')return obfState().confirmed===true;
 const checks=obfChecks()[id];return !!checks&&checks.every(Boolean);
}
function obfShare(part,whole){return whole?Math.round(100*part/whole):0;}
/* How far each strategy stage has been filled. Read straight from saved board data so nothing is created by looking. */
function obfStagePercents(){
 const checks=Object.values(obfChecks()).flat();
 const architecture=state.tabs[PRODUCT_ARCHITECTURE_TAB]?.architecture||{};
 const nodes=(architecture.nodes||[]).filter(node=>node&&node.type!=='people');
 const product=nodes.length?Math.round(40+60*nodes.filter(node=>(node.capabilities||[]).filter(obfFilled).length>=2).length/nodes.length):0;
 const maturity=state.tabs[MATURITY_ACCESS_TAB]?.architecture||{},rows=maturity.systems||[],steps=maturity.nodes||[];
 const readyRows=rows.filter(row=>steps.filter(node=>node.systemId===row.id&&node.processRole==='pillar'&&node.pillarState==='current').length===1);
 const positioningTab=state.tabs[POSITIONING_TAB]||{},positioning=positioningTab.positioning||{};
 const canvas=[(positioning.icps||[]).some(icp=>(icp.rows||[]).some(row=>obfFilled(row.people)||obfFilled(row.input)||obfFilled(row.technology))),
  (positioning.categories||[]).some(category=>obfFilled(category.name)),(positioning.competitive?.stages||[]).some(stage=>obfFilled(stage.competitors)),
  (positioning.valueRows||[]).some(row=>obfFilled(row.functional)),(positioningTab.problems||[]).some(problem=>obfFilled(problem.problem))];
 const fields=state.tabs[POSITIONING_DOCUMENT_TAB]?.fields||{};
 const documentFilled=POSITIONING_DOCUMENT_FIELDS.filter(([key])=>{const value=fields[key];
  if(typeof value==='string')return obfFilled(value);
  return !!value&&typeof value==='object'&&Object.values(value).some(item=>typeof item==='string'?obfFilled(item):Array.isArray(item)&&item.length>0);}).length;
 return {onboarding:obfShare(checks.filter(Boolean).length,checks.length),product,maturity:obfShare(readyRows.length,rows.length),
  canvas:obfShare(canvas.filter(Boolean).length,canvas.length),document:obfShare(documentFilled,POSITIONING_DOCUMENT_FIELDS.length)};
}
const OBF_STAGES=[['onboarding','Onboarding','you fill'],['product','Product architecture'],['maturity','Maturity axis'],
 ['canvas','Positioning canvas'],['document','Positioning document']];
function obfStageTab(key){return {product:PRODUCT_ARCHITECTURE_TAB,maturity:MATURITY_ACCESS_TAB,canvas:POSITIONING_TAB,document:POSITIONING_DOCUMENT_TAB}[key];}

function renderObfJourney(host){
 host.replaceChildren();const percents=obfStagePercents();
 OBF_STAGES.forEach(([key,label,note],index)=>{
  const stage=obfButton('obf-stage'+(key==='onboarding'?' current':''),null,key==='onboarding'?null:()=>switchTab(obfStageTab(key)));
  stage.title=key==='onboarding'?'You are here':'Open '+label;
  const head=obfEl('span','obf-stage-head'),name=obfEl('span','obf-stage-name',(index+1)+' · '+label);
  if(note)name.append(obfEl('em','',' · '+note));
  head.append(name,obfEl('b','obf-stage-pct',percents[key]+'%'));
  const bar=obfEl('span','obf-stage-bar'),fill=obfEl('span','obf-stage-fill');fill.style.width=percents[key]+'%';bar.append(fill);
  stage.setAttribute('aria-label',label+': '+percents[key]+'% filled');
  stage.append(head,bar);host.append(stage);
 });
}
function obfRailStep(step,onboarding){
 const active=onboarding.activeStep===step.id,done=obfStepDone(step.id);
 const button=obfButton('obf-rail-step'+(active?' active':'')+(done?' done':''),null,()=>{onboarding.activeStep=step.id;obfRerender();});
 if(active)button.setAttribute('aria-current','step');
 const copy=obfEl('span','obf-rail-copy');copy.append(obfEl('b','',step.label),obfEl('small','',step.sub));
 button.append(obfEl('span','obf-rail-num',done&&!active?'✓':String(OBF_STEPS.indexOf(step)+1)),copy);
 return button;
}
function renderObfRail(host,onboarding){
 host.replaceChildren();
 [['have','A · What you have'],['want','B · What you want']].forEach(([group,title])=>{
  host.append(obfEl('span','obf-rail-group',title));
  OBF_STEPS.filter(step=>step.group===group).forEach(step=>host.append(obfRailStep(step,onboarding)));
 });
 const review=obfRailStep(OBF_STEPS[3],onboarding);review.classList.add('obf-rail-review');host.append(review);
 const note=obfEl('div','obf-rail-note');
 note.append(obfEl('b','','About 15 minutes'),obfEl('span','','You answer steps 1–3. After you confirm, the AI fills product architecture, the maturity axis and both positioning pages.'));
 host.append(note);
}

function renderGtmOnboarding(){
 const host=$('gtmOnboardingPanel');if(!host)return;
 const onboarding=obfState(),ro=readOnly();
 renderObfJourney($('obfJourney'));renderObfRail($('gtmOnboardingSteps'),onboarding);
 const step=OBF_STEPS.find(item=>item.id===onboarding.activeStep)||OBF_STEPS[0],index=OBF_STEPS.indexOf(step);
 host.replaceChildren();
 const question=obfEl('header','obf-question');
 question.append(obfEl('span','obf-kicker','Step '+(index+1)+' of '+OBF_STEPS.length+' · '+step.kicker),obfEl('h4','',step.question),obfEl('p','',step.detail));
 const body=obfEl('div','obf-step obf-step-'+step.id);host.append(question,body);
 if(step.id==='product')renderObfProducts(body,ro);
 else if(step.id==='market')renderObfMarketSystem(body,ro);
 else if(step.id==='market_mapping')renderObfMarketMap(body,ro);
 else renderObfReview(body);
 host.append(renderObfFooter(step,index,onboarding,ro));
 $('gtmWorkspace').hidden=true;
}
function renderObfFooter(step,index,onboarding,ro){
 const footer=obfEl('footer','obf-footer');footer.append(obfEl('span','obf-saved',ro?'Read-only view':'Saved automatically'));
 const actions=obfEl('div','obf-actions');
 const back=obfButton('obf-back','Back',()=>{onboarding.activeStep=OBF_STEPS[index-1].id;obfRerender();});back.disabled=index===0;
 const next=OBF_STEPS[index+1];
 const label=step.id==='review'?(onboarding.confirmed?'Open Product architecture':'Confirm & start building'):next.id==='review'?'Review my answers':'Continue to '+next.label;
 const go=obfButton('obf-continue',label,()=>{
  if(step.id==='review'){
   if(onboarding.confirmed||ro){switchTab(PRODUCT_ARCHITECTURE_TAB);return;}
   const missing=OBF_STEPS.slice(0,3).find(item=>!obfStepDone(item.id));
   if(missing){toast('Finish “'+missing.label+'” first.',true);onboarding.activeStep=missing.id;renderGtmOnboarding();return;}
   onboarding.confirmed=true;OBF_STEPS.forEach(item=>{onboarding.locked[item.id]=true;});
   toast('Onboarding confirmed. Next: ask the AI to fill Product architecture.');obfRerender();renderBrand();renderTabs();return;
  }
  if(!ro&&!obfValidate(step))return;
  if(!ro)onboarding.locked[step.id]=true;
  onboarding.activeStep=next.id;obfRerender();if(!ro){renderBrand();renderTabs();}
  $('chanPane')?.scrollTo?.({top:0});
 });
 actions.append(back,go);footer.append(actions);return footer;
}
function obfValidate(step){
 if(step.id==='product'){
  const catalog=channelState(),names=catalog.products.map(product=>String(product.name||'').trim());
  if(!names.length||names.some(name=>!name||/^(new product|product name)$/i.test(name))){toast('Name each product before you continue.',true);return false;}
  if(!validProductNames(catalog.products))return false;
  state.clientProduct=activeGtmProduct(catalog)?.name||names[0];
  if(!OBF_GOALS.some(goal=>goal[0]===state.clientGoal)){toast('Choose the main goal.',true);return false;}
  if(!['slg','plg'].includes(state.clientSalesMotion)){toast('Choose how you sell: SLG or PLG.',true);return false;}
  return true;
 }
 if(step.id==='market'){if(!obfMarketModel()){toast('Pick the cell where what you sell meets what it changes.',true);return false;}return true;}
 if(step.id==='market_mapping'){
  const architecture=productArchitectureState(MATURITY_ACCESS_TAB),names=obfIndustryNames(architecture);
  if(!names.length){toast('Add at least one industry.',true);return false;}
  if(new Set(names.map(name=>name.toLowerCase())).size!==names.length){toast('Use a different name for each industry.',true);return false;}
  architecture.industries=names;architecture.industryMode=names.length>1?'multi':'single';
  if(!names.includes(architecture.activeIndustry))architecture.activeIndustry=names[0];
  if(!obfState().companySizes.length){toast('Choose at least one company size.',true);return false;}
  state.clientMarkets=state.clientMarkets.filter(Boolean);
  if(!state.clientMarkets.length){toast('Choose at least one country.',true);return false;}
  return true;
 }
 return true;
}

/* Shared form pieces. */
function obfRow(title,help){
 const row=obfEl('div','obf-row'),label=obfEl('div','obf-row-label'),body=obfEl('div','obf-row-body');
 label.append(obfEl('b','',title),obfEl('small','',help));row.append(label,body);return {row,body};
}
function obfChoiceRow(title,help,options,current,ro,set){
 const {row,body}=obfRow(title,help);body.classList.add('obf-choice-pair');body.setAttribute('role','radiogroup');body.setAttribute('aria-label',title);
 options.forEach(([value,label,detail])=>{
  const on=current===value,choice=obfButton('obf-choice'+(on?' on':''),null,()=>{set(value);obfRerender();});
  choice.setAttribute('role','radio');choice.setAttribute('aria-checked',on?'true':'false');choice.disabled=ro;
  choice.append(obfEl('b','',label),obfEl('small','',detail));body.append(choice);
 });
 return row;
}
function obfSegmented(options,current,ro,set,label){
 const group=obfEl('div','obf-segmented');group.setAttribute('role','group');group.setAttribute('aria-label',label);
 options.forEach(([value,text])=>{const button=obfButton(value===current?'on':'',text,()=>{set(value);obfRerender();});
  button.disabled=ro;button.setAttribute('aria-pressed',value===current?'true':'false');group.append(button);});
 return group;
}
function obfChip(text,ro,onRemove){
 const chip=obfEl('span','obf-chip on',text);
 if(!ro){const remove=obfButton('','×',onRemove);remove.setAttribute('aria-label','Remove '+text);chip.append(remove);}
 return chip;
}

/* Step 1 · Products, main goal and how they sell. */
function renderObfProducts(host,ro){
 const catalog=ensureProductWorkspace(),list=obfEl('div','obf-products');
 catalog.products.slice(0,3).forEach(product=>{
  const active=product.id===catalog.activeProductId,card=obfEl('div','obf-product'+(active?' active':''));
  const nameField=obfEl('label','obf-field obf-product-name');nameField.append(obfEl('span','obf-label','Product name'));
  const name=document.createElement('input');name.type='text';name.value=product.name||'';name.placeholder='e.g. Event Reports';name.disabled=ro;
  name.oninput=()=>{product.name=name.value;if(product.id===catalog.activeProductId)state.clientProduct=name.value;markDirty();};nameField.append(name);
  const descField=obfEl('label','obf-field obf-product-desc');descField.append(obfEl('span','obf-label','What it does'));
  const description=document.createElement('textarea');description.value=product.description||'';description.disabled=ro;
  description.placeholder='In one or two sentences: who uses it, and what changes for them.';
  description.oninput=()=>{product.description=description.value;markDirty();};descField.append(description);
  card.append(nameField,descField);
  if(catalog.products.length>1){
   const side=obfEl('div','obf-product-side');
   const pick=obfButton('obf-product-active',active?'Active workspace':'Make active',()=>{activateProduct(product.id);obfRerender();renderChannels();});
   pick.disabled=ro||active;pick.title='The active product controls Product Architecture, Maturity Axis, Positioning and Keywords.';
   const remove=obfButton('obf-product-remove','×',()=>{removeGtmProduct(product.id);renderGtmOnboarding();});
   remove.disabled=ro;remove.setAttribute('aria-label','Remove '+(product.name||'this product'));
   side.append(pick,remove);card.append(side);
  }
  list.append(card);
 });
 if(catalog.products.length<3&&!ro){
  list.append(obfButton('obf-add-product','+ Add another product',()=>{
   const product={id:uid(),name:'',description:''};catalog.products.push(product);activateProduct(product.id);obfRerender();renderChannels();
   requestAnimationFrame(()=>{const inputs=$('gtmOnboardingPanel')?.querySelectorAll('.obf-product input');inputs?.[inputs.length-1]?.focus();});
  }));
 }
 const questions=obfEl('div','obf-card obf-questions');
 questions.append(obfChoiceRow('Main goal','What should we achieve first?',OBF_GOALS,state.clientGoal,ro,value=>{state.clientGoal=value;}),
  obfChoiceRow('How you sell','How does a customer usually start?',OBF_MOTIONS,state.clientSalesMotion,ro,value=>{state.clientSalesMotion=value;}));
 host.append(list,questions);
}

/* Step 2 · Market system: what you sell (rows) × what it most changes for the buyer (columns). */
function renderObfMarketSystem(host,ro){
 const radar=brandRadarState(),audience=obfAudience(),selling=obfSellingAxis(),buying=activeBuyingIndustryAxis();
 const wrap=obfEl('div','obf-market-system'),matrix=obfEl('div','obf-card obf-matrix'),head=obfEl('div','obf-matrix-head');
 head.append(obfEl('b','','You sell ↓ · It changes for the buyer →'),obfSegmented([['b2b','B2B'],['b2c','B2C']],audience,ro,value=>{radar.marketAudience=value;},'Market examples'));
 const grid=obfEl('div','obf-matrix-grid');grid.setAttribute('role','grid');grid.setAttribute('aria-label','What you sell by what it changes for the buyer');
 grid.append(obfEl('span','obf-matrix-corner'));
 OBF_AXES.forEach(([id,label])=>grid.append(obfEl('span','obf-matrix-col'+(id===buying?' on':''),label)));
 OBF_AXES.forEach(([sellId,sellLabel])=>{
  grid.append(obfEl('span','obf-matrix-row'+(sellId===selling?' on':''),sellLabel));
  OBF_AXES.forEach(([buyId])=>{
   const model=INDUSTRY_FIT_MARKETS.find(item=>item.selling===sellId&&item.buying===buyId),content=model[audience],on=sellId===selling&&buyId===buying;
   const cell=obfButton('obf-matrix-cell'+(on?' on':''),null,()=>{
    evolutionState().axis=sellId;radar.sourceAxis=sellId;radar.buyingAxis=buyId;radar.axis=buyId;
    radar.industryModel=sellId+'-'+buyId;radar.industrySelectionMode='card';obfRerender();
    [renderPositioning,renderEvolution,renderBrandRadar].forEach(fn=>{if(typeof fn==='function')fn();});
   });
   cell.disabled=ro;cell.title=content.example;cell.setAttribute('aria-pressed',on?'true':'false');
   cell.setAttribute('aria-label',obfShortMarket(content.market)+'. Example: '+content.example);
   cell.append(obfEl('span','',obfCellName(model,audience)));if(on)cell.append(obfEl('small','','Your market'));
   grid.append(cell);
  });
 });
 matrix.append(head,grid);
 const model=obfMarketModel(),result=obfEl('aside','obf-card obf-result'+(model?' on':''));result.append(obfEl('span','obf-kicker','Your market'));
 if(model){
  const content=model[audience],buyLabel=obfAxisLabel(model.buying);
  result.append(obfEl('h5','',obfShortMarket(content.market)),
   obfEl('p','','You sell '+obfAxisLabel(model.selling).toLowerCase()+'. It mostly changes the buyer’s '+buyLabel.toLowerCase()+'.'),
   obfEl('p','obf-result-example','For example: '+content.example+'.'));
  const lock=obfEl('div','obf-result-lock');
  lock.append(obfEl('b','','Buying axis: '+buyLabel+' (locked)'),obfEl('small','','Every ICP card is built around the buyer’s '+buyLabel.toLowerCase()+', carried over from the Maturity Axis.'));
  result.append(lock);
 } else result.append(obfEl('p','','Pick the cell where what you sell meets what it changes for the buyer.'));
 wrap.append(matrix,result);host.append(wrap);
}

/* Step 3 · Market map: the segments, then where each one sits on awareness × value. */
function renderObfMarketMap(host,ro){
 const onboarding=obfState(),radar=brandRadarState(),architecture=productArchitectureState(MATURITY_ACCESS_TAB),card=obfEl('div','obf-card obf-segments');
 let field=obfRow('Business type','Carried over from Step 2');
 field.body.append(obfSegmented([['b2b','B2B'],['b2c','B2C']],obfAudience(),ro,value=>{radar.marketAudience=value;},'Business type'));card.append(field.row);

 field=obfRow('Industries','One, or several');
 const names=obfIndustryNames(architecture),industries=obfEl('div','obf-chips');
 names.forEach(name=>industries.append(obfChip(name,ro,()=>{
  architecture.industries=names.filter(item=>item!==name);architecture.industryMode=architecture.industries.length>1?'multi':'single';
  if(!architecture.industries.includes(architecture.activeIndustry))architecture.activeIndustry=architecture.industries[0]||'';obfRerender();
 })));
 if(!ro){
  const input=document.createElement('input');input.type='text';input.className='obf-chip-input';input.setAttribute('aria-label','Add an industry');
  input.placeholder=names.length?'+ Add industry':'Type an industry, press Enter';
  input.onkeydown=event=>{
   if(event.key!=='Enter')return;event.preventDefault();const value=input.value.trim();if(!value)return;
   if(names.some(name=>name.toLowerCase()===value.toLowerCase())){toast('That industry is already listed.',true);return;}
   architecture.industries=[...names,value];architecture.industryMode=architecture.industries.length>1?'multi':'single';
   if(!architecture.industries.includes(architecture.activeIndustry))architecture.activeIndustry=architecture.industries[0];
   obfRerender();requestAnimationFrame(()=>$('gtmOnboardingPanel')?.querySelector('.obf-chip-input')?.focus());
  };
  industries.append(input);
 }
 field.body.append(industries);card.append(field.row);

 field=obfRow('Company size','Same fix, very different worth');const sizes=obfEl('div','obf-chips');
 OBF_SIZES.forEach(([id,label])=>{
  const on=onboarding.companySizes.includes(id);
  const chip=obfButton('obf-chip'+(on?' on':''),label,()=>{onboarding.companySizes=on?onboarding.companySizes.filter(item=>item!==id):[...onboarding.companySizes,id];obfRerender();});
  chip.disabled=ro;chip.setAttribute('aria-pressed',on?'true':'false');sizes.append(chip);
 });
 field.body.append(sizes);card.append(field.row);

 field=obfRow('Countries','All countries, U.S., India, then A–Z');
 const codes=state.clientMarkets.filter(Boolean),countries=obfEl('div','obf-chips');
 codes.forEach(code=>countries.append(obfChip(geoMarketLabel(code),ro,()=>{state.clientMarkets=codes.filter(item=>item!==code);obfRerender();})));
 if(!ro&&!codes.includes('ALL')){
  const select=document.createElement('select');select.className='obf-country-select';select.setAttribute('aria-label','Add a country');
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Add country';select.append(placeholder);
  geoMarketOptions().forEach(([value,label])=>{
   if(codes.includes(value)||(value==='ALL'&&codes.length))return;
   const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);
  });
  select.onchange=()=>{if(!select.value)return;state.clientMarkets=select.value==='ALL'?['ALL']:[...codes,select.value];obfRerender();};
  countries.append(select);
 }
 field.body.append(countries);card.append(field.row);
 host.append(card,renderObfPicture(onboarding,ro));
}
/* Every country × company size the client picked is one segment (one dot). */
function obfSegments(onboarding){
 const codes=state.clientMarkets.filter(Boolean),sizes=OBF_SIZES.filter(size=>onboarding.companySizes.includes(size[0]));
 if(!codes.length&&!sizes.length)return [];
 const segments=[];
 (codes.length?codes:['']).forEach(code=>(sizes.length?sizes:[['','']]).forEach(([size,sizeLabel])=>{
  segments.push({key:(code||'any')+'|'+(size||'any'),code,size,label:[code?geoMarketLabel(code):'',sizeLabel].filter(Boolean).join(' · ')});
 }));
 return segments;
}
/* A rough first placement until the AI (or the client) places the segment: bigger companies and bigger-budget countries
   get more from the same fix; buyers who already know the market expect more, so the gap they feel is smaller. */
function obfEstimate(segment){
 const code=segment.code&&segment.code!=='ALL'?segment.code:'';
 const awareness={enterprise:.75,mid:.5,smb:.25}[segment.size]??.5;
 const countryAwareness=code==='US'?.1:OBF_HIGH_BUDGET.has(code)?.03:code==='IN'?-.12:code?-.06:0;
 const budget=!code?.75:code==='US'?1:OBF_HIGH_BUDGET.has(code)?.85:code==='IN'?.45:.55;
 const x=Math.min(.94,Math.max(.06,awareness+countryAwareness));
 const y=Math.min(.94,Math.max(.06,({enterprise:.9,mid:.65,smb:.38}[segment.size]??.65)*budget-.35*(x-.5)));
 return {x,y,source:'estimate'};
}
function obfPosition(onboarding,segment){
 const saved=onboarding.marketMap.positions[segment.key];
 return saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)?saved:obfEstimate(segment);
}
function obfPlaceDot(dot,x,y){dot.style.left=(x*100)+'%';dot.style.top=((1-y)*100)+'%';dot.classList.toggle('flip',x>.62);}
function obfSavePosition(onboarding,segment,x,y){
 onboarding.marketMap.positions[segment.key]={x:Math.round(x*1000)/1000,y:Math.round(y*1000)/1000,source:'you'};obfRerender();
}
function obfMakeDraggable(dot,plot,onboarding,segment,start){
 let dragging=false,moved=false,x=start.x,y=start.y;
 dot.onpointerdown=event=>{dragging=true;moved=false;dot.setPointerCapture?.(event.pointerId);dot.classList.add('dragging');};
 dot.onpointermove=event=>{
  if(!dragging)return;const box=plot.getBoundingClientRect();
  x=Math.min(.98,Math.max(.02,(event.clientX-box.left)/box.width));y=Math.min(.98,Math.max(.02,1-(event.clientY-box.top)/box.height));
  moved=true;obfPlaceDot(dot,x,y);
 };
 dot.onpointerup=()=>{if(!dragging)return;dragging=false;dot.classList.remove('dragging');if(moved)obfSavePosition(onboarding,segment,x,y);};
 dot.onkeydown=event=>{
  const step=event.shiftKey?.1:.02,moves={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,step],ArrowDown:[0,-step]}[event.key];
  if(!moves)return;event.preventDefault();
  obfSavePosition(onboarding,segment,Math.min(.98,Math.max(.02,x+moves[0])),Math.min(.98,Math.max(.02,y+moves[1])));
  requestAnimationFrame(()=>$('gtmOnboardingPanel')?.querySelector('.obf-dot[data-key="'+segment.key+'"]')?.focus());
 };
 dot.ondblclick=()=>{if(onboarding.marketMap.positions[segment.key]){delete onboarding.marketMap.positions[segment.key];obfRerender();}};
}
function renderObfPicture(onboarding,ro){
 const card=obfEl('section','obf-card obf-picture'),segments=obfSegments(onboarding),head=obfEl('div','obf-picture-head'),title=obfEl('div','obf-picture-title');
 title.append(obfEl('b','','Where your segments sit'),obfEl('small','',ro?'Each dot is one segment.':'Each dot is one segment. Drag one if it sits in the wrong place; double-click to reset it.'));
 const filters=obfEl('div','obf-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Highlight segments');
 const options=[['all','All'],...state.clientMarkets.filter(Boolean).map(code=>[code,geoMarketLabel(code)]),...OBF_SIZES.filter(size=>onboarding.companySizes.includes(size[0]))];
 if(!options.some(option=>option[0]===obfHighlight))obfHighlight='all';
 options.forEach(([value,label])=>{const on=value===obfHighlight,button=obfButton(on?'on':'',label,()=>{obfHighlight=value;renderGtmOnboarding();});
  button.setAttribute('aria-pressed',on?'true':'false');filters.append(button);});
 head.append(title,filters);
 const body=obfEl('div','obf-picture-body'),column=obfEl('div','obf-plot-column'),plot=obfEl('div','obf-plot');
 plot.setAttribute('aria-label','Market picture: buyer awareness from least to most aware, against value delivered. '+segments.length+' segment'+(segments.length===1?'':'s')+'.');
 [25,50,75].forEach(percent=>{const v=obfEl('span','obf-grid v'),h=obfEl('span','obf-grid h');v.style.left=percent+'%';h.style.top=percent+'%';plot.append(v,h);});
 plot.append(obfEl('span','obf-plot-label top','↑ More value delivered'),obfEl('span','obf-plot-label bottom','Less value delivered'),
  obfEl('span','obf-plot-note tl','Expects little, so the same product feels like a lot'),obfEl('span','obf-plot-note br','Knows every competitor, so expects a lot already'));
 if(!segments.length)plot.append(obfEl('span','obf-plot-empty','Choose countries and company sizes above to place your segments.'));
 segments.forEach(segment=>{
  const position=obfPosition(onboarding,segment),match=obfHighlight==='all'||segment.code===obfHighlight||segment.size===obfHighlight;
  const dot=obfButton('obf-dot'+(match?' on':'')+(position.source==='you'?' moved':''));dot.dataset.key=segment.key;
  const who=position.source==='you'?'placed by you':position.source==='ai'?'placed by the AI':'rough estimate';
  dot.title=segment.label+' · '+who;dot.setAttribute('aria-label',segment.label+': awareness '+Math.round(position.x*100)+'%, value '+Math.round(position.y*100)+'%, '+who);
  dot.append(obfEl('i'),obfEl('span','',segment.label));obfPlaceDot(dot,position.x,position.y);
  if(!ro)obfMakeDraggable(dot,plot,onboarding,segment,position);else dot.disabled=true;
  plot.append(dot);
 });
 const axis=obfEl('div','obf-xaxis');axis.append(obfEl('span','','Least aware'),obfEl('b','','Buyer awareness'),obfEl('span','','Most aware →'));
 column.append(plot,axis);
 const explain=obfEl('aside','obf-explain');
 explain.append(obfEl('span','obf-kicker','What is value?'),obfEl('h5','','What you give, minus what they pay and expect.'));
 [['Company size moves it','Fixing the same headache is worth far more to an enterprise than to a small shop.'],
  ['Geography moves it','The same fix earns much more where budgets are bigger, like the U.S.'],
  ['Awareness moves it','What you give stays the same. A buyer who knows every option expects more, so the gap shrinks; one who expects little feels you over-deliver.']]
  .forEach(([heading,text],index)=>{const item=obfEl('div','obf-explain-item'+(index===2?' last':''));item.append(obfEl('b','',heading),obfEl('small','',text));explain.append(item);});
 body.append(column,explain);card.append(head,body);
 requestAnimationFrame(()=>obfDeclutter(plot));
 return card;
}
/* Nudge labels up or down until no two segment names print over each other (highlighted ones keep their place first). */
function obfDeclutter(plot){
 const labels=[...plot.querySelectorAll('.obf-dot.on span'),...plot.querySelectorAll('.obf-dot:not(.on) span')],placed=[];
 labels.forEach(label=>{
  let box=null;
  for(const shift of [0,20,-20,40,-40,60,-60]){
   label.style.transform=shift?'translateY('+shift+'px)':'';box=label.getBoundingClientRect();
   if(!placed.some(other=>box.left<other.right+4&&box.right>other.left-4&&box.top<other.bottom+2&&box.bottom>other.top-2))break;
  }
  placed.push(box);
 });
}

/* Step 4 · Review & hand-off. */
function obfEditLink(stepId){return obfButton('obf-edit','Edit',()=>{obfState().activeStep=stepId;obfRerender();});}
function renderObfReview(host){
 const onboarding=obfState(),summary=obfEl('div','obf-summary');
 const have=obfEl('section','obf-card obf-summary-have'),haveHead=obfEl('div','obf-summary-head');
 haveHead.append(obfEl('span','obf-kicker','A · What you have'),obfEditLink('product'));have.append(haveHead);
 channelState().products.forEach(product=>have.append(obfEl('h5','',product.name||'Unnamed product'),obfEl('p','',product.description||'No description yet.')));
 const want=obfEl('section','obf-card obf-summary-want'),wantHead=obfEl('div','obf-summary-head');
 wantHead.append(obfEl('span','obf-kicker','B · What you want'),obfEditLink('market'));want.append(wantHead);
 const goal=OBF_GOALS.find(item=>item[0]===state.clientGoal),motion=OBF_MOTIONS.find(item=>item[0]===state.clientSalesMotion),model=obfMarketModel();
 const industries=obfIndustryNames(state.tabs[MATURITY_ACCESS_TAB]?.architecture);
 const sizes=onboarding.companySizes.map(id=>OBF_SIZES.find(size=>size[0]===id)?.[1]).filter(Boolean);
 [['Goal & motion',(goal?goal[1]:'No goal chosen')+' · '+(motion?motion[1]:'No sales motion')],
  ['Market',model?obfShortMarket(model[obfAudience()].market)+' · '+obfAudience().toUpperCase():'Not chosen yet'],
  ['Market map',[industries.length?industries.join(', '):'No industry',sizes.join(' & ')||'No company size',state.clientMarkets.filter(Boolean).map(geoMarketLabel).join(', ')||'No country'].join(' · ')]]
  .forEach(([label,value])=>{const row=obfEl('div','obf-summary-row');row.append(obfEl('span','',label),obfEl('b','',value));want.append(row);});
 summary.append(have,want);
 const next=obfEl('section','obf-next'),percents=obfStagePercents();next.append(obfEl('span','obf-kicker','What happens next'));
 [['product','Product architecture','AI maps the product’s systems, features and integrations.','AI · first'],
  ['maturity','Maturity axis','AI lays out the maturity levels; then you pick the one to target.','AI + you'],
  ['canvas','Positioning canvas','ICPs, categories, competitors, problems and values.','AI'],
  ['document','Positioning document','The written positioning, USPs, offer and short versions.','AI']]
  .forEach(([key,label,detail,who],index)=>{
   const row=obfButton('obf-next-row',null,()=>switchTab(obfStageTab(key)));row.title='Open '+label;
   row.append(obfEl('span','obf-next-num',String(index+2)),obfEl('b','',label),obfEl('span','obf-next-detail',detail),
    obfEl('span','obf-next-pct',percents[key]+'%'),obfEl('span','obf-next-who'+(who==='AI + you'?' you':''),who));
   next.append(row);
  });
 host.append(summary,next);
 if(onboarding.confirmed)host.append(obfEl('p','obf-confirmed','Confirmed. Ask the AI to fill Product architecture first, then each stage in order.'));
}
