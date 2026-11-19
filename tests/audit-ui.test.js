'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('memória usa eventos tipados mensais e exporta CSV do cenário selecionado',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.match(html,/id="auditPanel"/);
 assert.match(html,/id="downloadCsv"/);
 assert.match(app,/e\.timeline\.map/);
 assert.match(app,/e\.contributions\.map/);
 assert.match(app,/lastComparison\.results\.find/);
 assert.match(app,/text\/csv/);
 assert.match(app,/c\.equivalentCost/);
 assert.match(app,/c\.opportunityCost/);
 assert.doesNotMatch(app,/Math\.pow\(/);
});
