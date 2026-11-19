'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig}=require('../model/config.js');
const {runScenario}=require('../model/scenario-engine.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' != '+b);
test('assinatura com caução e aluguel antecipado prende caixa no início',()=>{
 const c=createDefaultConfig();
 c.subscription.monthlyRent=2000;
 c.subscription.deposit=3000;
 c.subscription.paymentTiming='start';
 near(runScenario(c,'subscription').acquisitionCash,5000);
 c.subscription.upfrontCosts=450;
 near(runScenario(c,'subscription').acquisitionCash,5450);
});
test('compra/financiamento preservam cálculo de caixa inicial',()=>{
 const c=createDefaultConfig();
 c.purchase.initialCosts=500;
 c.financing.upfrontCosts=1000;
 near(runScenario(c,'cash-private').acquisitionCash,80500);
 near(runScenario(c,'loan-private').acquisitionCash,17500);
});
test('caução devolvida não é despesa final na taxa de oportunidade zero',()=>{
 const c=createDefaultConfig();c.economics.opportunityAnnualNet=0;
 c.subscription.monthlyRent=0;c.subscription.deposit=3000;
 const s=runScenario(c,'subscription');
 near(s.acquisitionCash,3000);
 near(s.economic.nominalCost,0);
});
