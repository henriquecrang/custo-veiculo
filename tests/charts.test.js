'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const charts=require('../charts.js');
const config=require('../model/config.js');
const engine=require('../model/scenario-engine.js');

test('barras com custos positivos, negativos e rótulos protegidos',()=>{
 const results=[
  {id:'a',economic:{equivalentCost:200}},
  {id:'b',economic:{equivalentCost:-70}}
 ];
 const html=charts.makeBars(results,{a:'Alugar <teste>',b:'Comprar'});
 assert.match(html,/role="img"/);
 assert.match(html,/Alugar &lt;teste&gt;/);
 assert.match(html,/negative/);
 assert.doesNotMatch(html,/<teste>/);
});
test('linhas acumuladas reconciliam com o motor',()=>{
 const cfg=config.createDefaultConfig();
 for(const id of cfg.selectedScenarioIds){
   const scenario=engine.runScenario(cfg,id);
   const points=charts.timelineSeries(scenario);
   assert.equal(points.length,cfg.horizonMonths+1);
   assert.equal(points[0].month,0);
   assert.equal(points.at(-1).month,cfg.horizonMonths);
   assert.ok(Math.abs(points.at(-1).equivalentContributions-scenario.economic.equivalentCost)<.001);
   assert.ok(Math.abs(points.at(-1).nominalCost-scenario.economic.nominalCost)<.001);
   assert.match(charts.makeTimeline(scenario),/<svg/);
 }
});
test('intervalos nulos e gráfico vazio são tratados',()=>{
 assert.equal(charts.makeBars([],{}),'');
 assert.equal(charts.makeTimeline(null),'');
 const fake={economic:{timeline:[{month:0,equivalentCost:0,cumulativeCashFlow:0},{month:1,equivalentCost:0,cumulativeCashFlow:0}]}};
 assert.match(charts.makeTimeline(fake),/chart-line/);
});