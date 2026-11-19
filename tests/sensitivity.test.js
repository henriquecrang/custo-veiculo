'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const config=require('../model/config.js');
const engine=require('../model/scenario-engine.js');
const sensitivity=require('../sensitivity.js');

test('matriz preserva entradas e replica o cenário base',()=>{
 const cfg=config.createDefaultConfig(),snapshot=JSON.stringify(cfg);
 const matrix=sensitivity.calculate(cfg);
 assert.equal(matrix.rows.length,5);
 assert.equal(matrix.rows[0].cells.length,5);
 assert.equal(JSON.stringify(cfg),snapshot);
 const center=matrix.rows[2].cells[2];
 const base=engine.compareScenarios(cfg);
 assert.equal(center.winnerId,base.leastCostScenarioId);
 for(const entry of base.results){
  assert.ok(Math.abs(center.scenarios.find(x=>x.id===entry.id).cost-entry.economic.equivalentCost)<.00001);
 }
});
test('revenda maior nunca eleva custo de cada estratégia comprada',()=>{
 const cfg=config.createDefaultConfig();
 const out=sensitivity.calculate(cfg);
 for(const row of out.rows){
  for(let j=1;j<row.cells.length;j++){
   const before=row.cells[j-1],after=row.cells[j];
   for(const id of ['cash-private','cash-dealer','loan-private','loan-dealer']){
    assert.ok(after.scenarios.find(x=>x.id===id).cost<=before.scenarios.find(x=>x.id===id).cost+1e-6);
   }
  }
 }
});
test('locação crescente só modifica custo da assinatura',()=>{
 const cfg=config.createDefaultConfig();
 const out=sensitivity.calculate(cfg);
 for(let i=1;i<out.rows.length;i++){
   const lower=out.rows[i-1].cells[2],higher=out.rows[i].cells[2];
   assert.ok(higher.scenarios.find(x=>x.id==='subscription').cost>lower.scenarios.find(x=>x.id==='subscription').cost);
   assert.equal(higher.scenarios.find(x=>x.id==='cash-private').cost,lower.scenarios.find(x=>x.id==='cash-private').cost);
 }
});
test('fator inválido bloqueado',()=>{
 assert.throws(()=>sensitivity.calculate(config.createDefaultConfig(),[1,-1],[1]),/inválido/);
});