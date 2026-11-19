'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');

test('dashboard usa liquidez, oportunidade e quitação produzidas pelo motor',()=>{
 assert.match(source,/e\.maxCapitalNeed/);
 assert.match(source,/e\.opportunityCost/);
 assert.match(source,/s\.debtSettlement\.remainingPrincipal/);
 assert.match(source,/s\.terminalNetFromSale/);
 assert.match(source,/e\.nominalCost/);
 assert.match(source,/e\.monthlyEquivalent/);
 assert.doesNotMatch(source,/Math\.pow\(/);
});
