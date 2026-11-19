'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig}=require('../model/config.js');
const {subscriptionEvents}=require('../model/rental.js');
const {evaluateCashFlows}=require('../model/cashflows.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' vs '+b);

test('12 mensalidades vencidas não geram taxa inicial fictícia',()=>{
 const c=createDefaultConfig();
 const e=subscriptionEvents(c.subscription,12);
 assert.equal(e.length,12);
 assert.deepEqual(e.map(x=>x.month),Array.from({length:12},(_,i)=>i+1));
 near(e.reduce((s,x)=>s+x.amount,0),-2299*12);
});

test('primeira mensalidade antecipada é cobrada no mês 0',()=>{
 const c=createDefaultConfig();
 c.subscription.paymentTiming='start';
 const e=subscriptionEvents(c.subscription,12);
 assert.equal(e[0].month,0);
 assert.equal(e[e.length-1].month,11);
 const a=evaluateCashFlows(e,12,c.economics.opportunityAnnualNet);
 assert.ok(a.monthlyEquivalent>c.subscription.monthlyRent);
});

test('caução com restituição gera custo de oportunidade mas não despesa nominal',()=>{
 const c=createDefaultConfig();
 c.subscription.monthlyRent=0;c.subscription.deposit=3000;
 const e=subscriptionEvents(c.subscription,12);
 const a=evaluateCashFlows(e,12,c.economics.opportunityAnnualNet);
 near(a.nominalCost,0);
 near(a.equivalentCost,3000*c.economics.opportunityAnnualNet);
});

test('retenção e tarifa de saída só entram quando configuradas',()=>{
 const c=createDefaultConfig();
 c.subscription.deposit=1000;c.subscription.refundedDepositPct=0.7;c.subscription.endCosts=150;
 const a=evaluateCashFlows(subscriptionEvents(c.subscription,12),12,0);
 near(a.nominalCost,12*2299+300+150);
});

test('Rejeita valores contratuais inválidos',()=>{
 const c=createDefaultConfig();
 c.subscription.deposit=-2;
 assert.throws(()=>subscriptionEvents(c.subscription,12),/inválido/);
 c.subscription.deposit=0;c.subscription.paymentTiming='unknown';
 assert.throws(()=>subscriptionEvents(c.subscription,12),/antecipado/);
});
