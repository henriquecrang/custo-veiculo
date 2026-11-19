'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('node:path');
const read=f=>fs.readFileSync(p.join(__dirname,'..',f),'utf8');

test('interface carrega todos os módulos na ordem antes do editor',()=>{
 const html=read('index.html');
 const scripts=Array.from(html.matchAll(/<script defer src="([^"]+)"/g),m=>m[1]);
 assert.deepEqual(scripts,['model/config.js','model/cashflows.js','model/financing.js',
   'model/finance-fees.js','model/ownership.js','model/resale.js','model/rental.js',
   'model/scenario-engine.js','model/equilibrium.js','sensitivity.js','app.js']);
 assert.match(html,/id="inputSections"/);
 assert.match(html,/id="resultSummary"/);
});

test('editor referencia o motor e usa validação econômica única',()=>{
 const app=read('app.js');
 assert.match(app,/engine\.compareScenarios\(state\)/);
 assert.match(app,/defaults\.validateConfig\(state\)/);
 assert.match(app,/data-path/);
 assert.doesNotMatch(app,/Math\.pow\(/); // Fórmulas financeiras ficam no motor
});
