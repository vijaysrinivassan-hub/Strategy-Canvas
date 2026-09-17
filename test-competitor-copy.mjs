import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ctx=vm.createContext({
  gridCellKeywords:(title,ids)=>(ids||[]).map(keyword=>({keyword}))
});
vm.runInContext(fs.readFileSync(new URL('./competitor-comparison.js',import.meta.url),'utf8'),ctx);

assert.deepEqual(Array.from(ctx.competitorNameVariants('DarwinBox')),['DarwinBox','Darwin Box']);
assert.deepEqual(Array.from(ctx.competitorNameVariants('Keka')),['Keka']);
assert.deepEqual(Array.from(ctx.competitorNameVariants('Facto HR')),['Facto HR']);
assert.deepEqual(Array.from(ctx.competitorNameVariants('SAP SuccessFactors')),['SAP SuccessFactors','SAP Success Factors']);
assert.deepEqual(Array.from(ctx.competitorNameVariants('Google Sheets')),['Google Sheets']);

const model={
 rows:[
  {id:'darwin',name:'DarwinBox'},
  {id:'keka',name:'Keka'},
  {id:'sap',name:'SAP SuccessFactors'},
  {id:'google',name:'Google Sheets'}
 ],
 types:[
  {id:'alternatives',name:'alternatives'},
  {id:'reviews',name:'reviews'},
  {id:'pricing',name:'pricing'}
 ],
 cells:{},
 comparisonCells:{}
};
const output=ctx.competitorClipboardText(model);
assert(output.includes('DarwinBox alternatives,Darwin Box alternatives'));
assert(output.includes('DarwinBox reviews,Darwin Box reviews'));
assert(output.includes('DarwinBox pricing,Darwin Box pricing'));
assert(output.includes('Keka reviews'));
assert(output.includes('SAP SuccessFactors pricing,SAP Success Factors pricing'));
assert(output.includes('Google Sheets alternatives'));
assert(!output.includes('GoogleSheets'));
assert(!output.includes('\n'));

const pairs=ctx.comparisonClipboardText(model);
assert(pairs.includes('Keka vs DarwinBox,Keka vs Darwin Box'));
assert(pairs.includes('SAP SuccessFactors vs DarwinBox,SAP Success Factors vs DarwinBox,SAP SuccessFactors vs Darwin Box,SAP Success Factors vs Darwin Box'));
assert(!pairs.includes('vs.'));
assert(!pairs.includes('\n'));

const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert(html.includes("copyToolbar.id = 'competitorTableToolbar'"));
assert(html.includes('competitorClipboardText(m)'));
console.log('PASS: competitor copy exports article phrases and comparison phrases with safe brand-name variants.');
