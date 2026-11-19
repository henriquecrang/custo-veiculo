'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig}=require('../model/config.js');
const {runScenario}=require('../model/scenario-engine.js');
const {breakEvenMonthlyRent,breakEvenResalePrice}=require('../model/equilibrium.js');
const near=(a,b,e=1e-5)=>assert.ok(Math.abs(a-b)<e,a+' != '+b);
function neutral(){
 const c=createDefaultConfig();
 c.economics.opportunityAnnualNet=0;
 c.ownership.ipvaAnnual=0;c.ownership.insuranceAnnual=0;c.ownership.maintenanceMonthly=0;
 c.resale.privateFixedCosts=0;c.resale.dealerFixedCosts=0;
 return c;
}
test('equilíbrio aluguel com compra à vista é desvalorização dividida por 12',()=>{
 const c=neutral();
 const x=breakEvenMonthlyRent(c,'cash-private');
 near(x.monthlyRent,8000/12);
 c.subscription.monthlyRent=x.monthlyRent;
 near(runScenario(c,'subscription').economic.equivalentCost,runScenario(c,'cash-private').economic.equivalentCost);
});

test('equilíbrio de revenda retorna valor que reproduz o custo do aluguel',()=>{
 const c=neutral();
 const x=breakEvenResalePrice(c,'cash-private');
 near(x.requiredReferencePrice,80000-2299*12);
 c.vehicle.residualPrice=x.requiredReferencePrice;
 near(runScenario(c,'subscription').economic.equivalentCost,runScenario(c,'cash-private').economic.equivalentCost);
});

test('desconto de loja incide sobre referência pré-desconto ao calcular equilíbrio',()=>{
 const c=neutral();
 const x=breakEvenResalePrice(c,'cash-dealer');
 near(x.requiredReferencePrice,(80000-2299*12)/0.85);
 near(x.requiredNetSale,80000-2299*12);
});

test('break-even com custo de oportunidade preserva precisão financeira',()=>{
 const c=createDefaultConfig();
 for(const id of ['loan-private','loan-dealer','cash-private','cash-dealer']){
  const x=breakEvenMonthlyRent(c,id);
  assert.ok(x.monthlyRent>=0);
  const clone=JSON.parse(JSON.stringify(c));
  clone.subscription.monthlyRent=x.monthlyRent;
  near(runScenario(clone,'subscription').economic.equivalentCost,runScenario(clone,id).economic.equivalentCost,.0001);
  const y=breakEvenResalePrice(c,id);
  assert.ok(y.requiredReferencePrice>=0);
  const cc=JSON.parse(JSON.stringify(c));
  cc.vehicle.residualMethod='fixed';cc.vehicle.residualPrice=y.requiredReferencePrice;
  near(runScenario(cc,id).economic.equivalentCost,runScenario(cc,'subscription').economic.equivalentCost,.0001);
 }
});

test('não inventa solução se a assinatura tiver custos fixos acima da compra',()=>{
 const c=neutral();c.subscription.upfrontCosts=50000;
 assert.equal(breakEvenMonthlyRent(c,'cash-private'),null);
 c.subscription.upfrontCosts=0;c.resale.dealerDiscountPct=1;
 assert.equal(breakEvenResalePrice(c,'cash-dealer'),null);
});

test('rejeita estratégia não comprada',()=>{
 const c=createDefaultConfig();
 assert.throws(()=>breakEvenMonthlyRent(c,'subscription'),/inválida/);
});
