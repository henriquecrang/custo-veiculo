'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig}=require('../model/config.js');
const {runScenario,compareScenarios}=require('../model/scenario-engine.js');
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<eps,a+' vs '+b);

function neutral() {
 const c=createDefaultConfig();
 c.economics.opportunityAnnualNet=0;
 c.ownership.ipvaAnnual=0;c.ownership.insuranceAnnual=0;
 c.ownership.maintenanceMonthly=0;
 c.resale.privateFixedCosts=0;
 return c;
}

test('base sem despesas: à vista = depreciação; financiamento = depreciação + juros pagos',()=>{
 const c=neutral();
 const cash=runScenario(c,'cash-private');
 const loan=runScenario(c,'loan-private');
 near(cash.economic.nominalCost,8000);
 near(loan.economic.nominalCost,8000+13338.612760256889);
 near(loan.debtSettlement.remainingPrincipal,47400.99823346491);
 near(loan.terminalNetFromSale,72000-47400.99823346491);
 assert.equal(loan.events.filter(x=>x.category==='installment').length,12);
 assert.ok(loan.estimatedCet.monthly>0);
});

test('loja desconta 15% após desvalorização e mantém custos de propriedade idênticos',()=>{
 const c=neutral();
 const p=runScenario(c,'loan-private'),d=runScenario(c,'loan-dealer');
 near(d.sale.grossSale,61200);
 near(d.economic.nominalCost-p.economic.nominalCost,10800);
});

test('desembolso mensal de locação tem oportunidade e nenhum custo de IPVA extra',()=>{
 const c=createDefaultConfig();
 const sub=runScenario(c,'subscription');
 const cash=runScenario(c,'cash-private');
 assert.equal(sub.events.filter(x=>x.category==='ipva').length,0);
 assert.equal(sub.events.filter(x=>x.category==='rent').length,12);
 assert.ok(sub.economic.opportunityCost>0);
 assert.ok(cash.events.some(x=>x.category==='ipva'));
 near(sub.economic.nominalCost,2299*12);
});

test('custo de oportunidade reage a cada parcela sem dupla contagem',()=>{
 const c=neutral();
 c.economics.opportunityAnnualNet=0.1126;
 const loan=runScenario(c,'loan-private');
 const sub=runScenario(c,'subscription');
 near(loan.economic.equivalentCost-loan.economic.nominalCost,loan.economic.opportunityCost);
 near(sub.economic.equivalentCost-sub.economic.nominalCost,sub.economic.opportunityCost);
 near(loan.economic.contributions.reduce((s,x)=>s+x.equivalentCost,0),loan.economic.equivalentCost);
});

test('IOF pode ser pago à vista ou financiado sem duplicidade',()=>{
 const c=neutral();c.financing.iof.amount=1000;
 c.financing.iof.financed=false;
 const upfront=runScenario(c,'loan-private');
 near(upfront.loan.principal,64000);
 assert.ok(upfront.events.some(x=>x.category==='financing-fees'&&x.amount===-1000));
 c.financing.iof.financed=true;
 const financed=runScenario(c,'loan-private');
 near(financed.loan.principal,65000);
 assert.equal(financed.events.some(x=>x.category==='financing-fees'&&x.amount===-1000),false);
 assert.ok(financed.loan.schedule.rows[1].payment>upfront.loan.schedule.rows[1].payment);
});

test('comparação selecionada, cenário mais barato e alerta de equivalência',()=>{
 const c=createDefaultConfig();
 const x=compareScenarios(c);
 assert.equal(x.results.length,5);
 assert.deepEqual(x.rankedScenarioIds.map(id=>x.results.some(v=>v.id===id)),[true,true,true,true,true]);
 assert.ok(x.warnings.length>0);
 assert.equal(x.comparability.status,'mismatch');
 c.selectedScenarioIds=['cash-private'];
 assert.equal(compareScenarios(c).leastCostScenarioId,'cash-private');
 assert.equal(compareScenarios(c).results.length,1);
});

test('Financiamento com prazo menor do que horizonte não quita dívida de novo',()=>{
 const c=neutral();c.financing.termMonths=6;
 const x=runScenario(c,'loan-private');
 near(x.debtSettlement.totalDue,0);
 assert.equal(x.events.filter(v=>v.category==='installment').length,6);
 assert.equal(x.events.filter(v=>v.category==='debt-payoff').length,0);
});
