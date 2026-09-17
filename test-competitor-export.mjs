import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const keywordRows = {
  a1: {id:'a1',keyword:'darwinbox alternatives',volume:120},
  a2: {id:'a2',keyword:'darwin box alternatives',volume:30},
  a3: {id:'a3',keyword:'darwinbox alternative india',volume:10},
  r1: {id:'r1',keyword:'darwinbox reviews india',volume:40},
  v1: {id:'v1',keyword:'keka vs darwinbox',volume:25}
};
const written = [];
let exportedRows;
const ctx = vm.createContext({
  STATUS: [{id:'for_review',label:'For review'}],
  articleTypes: () => [{id:'competitor',name:'Competitor'}],
  defaultsFor: () => ({}),
  cellState: (bucket,key,defaults={}) => ({mode:'aeo',type:'',on:false,aw:'',st:'',writtenBy:'',url:'',kws:[],...(defaults||{}),...(bucket.cells?.[key]||{})}),
  matrixCellKeywords: (_company,_type,_text,ids) => (ids||[]).map(id=>keywordRows[id]),
  gridCellKeywords: (_title,ids) => (ids||[]).map(id=>keywordRows[id]),
  XLSX: {
    utils: {
      aoa_to_sheet: rows => { exportedRows=rows; return {}; },
      book_new: () => ({}),
      book_append_sheet: () => {}
    },
    writeFile: (_book,name) => written.push(name)
  }
});
vm.runInContext(fs.readFileSync(new URL('./competitor-comparison.js',import.meta.url),'utf8'),ctx);

const model = {
  rows: [{id:'darwin',name:'DarwinBox'},{id:'keka',name:'Keka'}],
  types: [{id:'alternatives',name:'Alternatives'},{id:'reviews',name:'Reviews'}],
  cells: {
    'darwin|alternatives': {mode:'seo',type:'competitor',st:'for_review',on:true,aw:'Competitor aware',writtenBy:'old',url:'darwinbox-alternatives',kws:['a1','a2','a3']},
    'darwin|reviews': {v:'DarwinBox Reviews India',mode:'aeo',type:'competitor',writtenBy:'new',kws:['r1']}
  },
  comparisonCells: {
    '["darwin","keka"]': {v:'Keka vs DarwinBox',mode:'seo',type:'competitor',kws:['v1']}
  },
  comparisonOthers: {}
};

const data=ctx.competitorExportData(model);
assert.equal(data.main.length,2);
assert.equal(data.main[0][0],'DarwinBox');
assert.equal(data.main[0][1],'DarwinBox Alternatives');
assert.equal(data.main[0][2],'darwinbox alternatives, darwin box alternatives, darwinbox alternative india');
assert.equal(data.main[0][3],160);
assert.equal(data.main[0][4],'SEO');
assert.equal(data.main[0][5],'For review');
assert.equal(data.main[0][6],'Yes');
assert.equal(data.main[0][7],'Alternatives');
assert.equal(data.main[0][8],'Competitor');
assert.equal(data.main[0][9],'Competitor aware');
assert.equal(data.main[0][10],'Old');
assert.equal(data.main[0][11],'darwinbox-alternatives');
assert.equal(data.comparisons.length,1);
assert.equal(data.comparisons[0][0],'Keka vs DarwinBox');

const result=ctx.downloadCompetitorWorkbook(model,{client:'Full-stack HCM Platform',product:'Payroll'});
assert.deepEqual({...result},{mainRows:2,comparisonRows:1});
assert.equal(written[0],'Full-stack HCM Platform-Payroll-competitor-keywords.xlsx');
assert.equal(exportedRows[0][0],'Competitor');
assert(exportedRows.some(row=>row[0]==='Competitor vs. Competitor'));

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("exportButton.textContent = 'Export Page'"));
assert(html.includes('xlsx.full.min.js'));
console.log('PASS: competitor page exports two Excel tables with cell metadata and comma-separated keywords.');
