'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {assertValidConfig}=require('../model/config.js');
const {compareScenarios}=require('../model/scenario-engine.js');

for(const file of ['rio-80k-12m.json','rio-60k-12m.json']){
 test('preset '+file+' válido e recalculável',()=>{
  const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','presets',file),'utf8'));
  assert.doesNotThrow(()=>assertValidConfig(cfg));
  const result=compareScenarios(cfg);
  assert.equal(result.results.length,5);
  assert.ok(result.results.every(s=>Number.isFinite(s.economic.equivalentCost)));
  assert.equal(cfg.ownership.kmPerMonth,0);
  assert.ok(result.warnings.length>0);
 });
}
