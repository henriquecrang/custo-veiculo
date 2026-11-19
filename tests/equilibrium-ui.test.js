'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('UI expõe aluguel e revenda de equilíbrio por motor separado',()=>{
 assert.match(read('index.html'),/model\/equilibrium\.js/);
 assert.match(read('index.html'),/id="breakEvenPanel"/);
 assert.match(read('app.js'),/equilibrium\.breakEvenMonthlyRent/);
 assert.match(read('app.js'),/equilibrium\.breakEvenResalePrice/);
});
