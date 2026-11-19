'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig}=require('../model/config.js');
const {compareScenarios,runScenario}=require('../model/scenario-engine.js');
const {createSchedule}=require('../model/financing.js');
const {evaluateCashFlows,makeEvent}=require('../model/cashflows.js');
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,a+' != '+b);
function modelWithoutOperatingCosts(){
 const c=createDefaultConfig();
 c.ownership.ipvaAnnual=0;c.ownership.insuranceAnnual=0;
 c.ownership.maintenanceMonthly=0;c.ownership.licensingAnnual=0;
 c.resale.privateFixedCosts=0;c.resale.dealerFixedCosts=0;
 c.financing.financedCosts=0;c.financing.upfrontCosts=0;
 c.financing.payoffCosts=0;c.financing.iof.amount=0;
 return c;
}

test('referência independente: 80k, 16k de entrada e saída no 12º mês',()=>{
 const c=modelWithoutOperatingCosts();
 c.economics.opportunityAnnualNet=0;
 const x=compareScenarios(c);
 const index=Object.fromEntries(x.results.map(s=>[s.id,s]));
 near(index['cash-private'].economic.nominalCost,8000);
 near(index['cash-dealer'].economic.nominalCost,18800);
 near(index['loan-private'].economic.nominalCost,21338.6127602569,1e-4);
 near(index['loan-dealer'].economic.nominalCost,32138.6127602569,1e-4);
 near(index.subscription.economic.nominalCost,27588);
 near(index['loan-private'].loan.schedule.rows[1].payment,2494.801210566,1e-5);
 near(index['loan-private'].debtSettlement.remainingPrincipal,47400.9982334649,1e-4);
});

test('identidade contábil: valor inicial - revenda + juros corridos (para cenários sem taxas)',()=>{
 for(const price of [40000,60000,80000,100000]) {
  for(const downPct of [0,0.2,0.5,1]) {
   const c=modelWithoutOperatingCosts();
   c.economics.opportunityAnnualNet=0;
   c.vehicle.price=price;c.vehicle.residualPrice=price*0.9;
   c.financing.downPayment=price*downPct;
   for(const horizon of [6,12,24]) {
    c.horizonMonths=horizon;
    const x=runScenario(c,'loan-private');
    const interest=x.loan.schedule.rows.slice(1,Math.min(horizon,c.financing.termMonths)+1)
      .reduce((s,row)=>s+row.interest,0);
    near(x.economic.nominalCost,price-price*.9+interest,0.0001);
    near(x.loan.schedule.rows.at(-1).endingBalance,0,0.0001);
   }
  }
 }
});

test('invariante do equivalente mensal e da taxa anual/mensal',()=>{
 const c=createDefaultConfig();
 const rent=runScenario(c,'subscription');
 const r=rent.economic.opportunityMonthlyNet;
 const N=c.horizonMonths;
 const factor=((Math.pow(1+r,N)-1)/r);
 near(rent.economic.monthlyEquivalent,c.subscription.monthlyRent,1e-7);
 near(rent.economic.equivalentCost/factor,c.subscription.monthlyRent,1e-7);
});

test('custo por km zero e custos fixos permanecem mesmo com carro parado',()=>{
 const c=createDefaultConfig();
 c.ownership.kmPerMonth=0;c.ownership.costPerKm=100;
 const x=runScenario(c,'cash-private');
 assert.equal(x.events.filter(e=>e.category==='usage').length,0);
 assert.equal(x.events.filter(e=>e.category==='insurance').length,1);
 assert.equal(x.events.filter(e=>e.category==='ipva').length,1);
 assert.equal(x.events.filter(e=>e.category==='maintenance').length,12);
});

test('aumento de revenda reduz custo econômico exatamente um a um no mês terminal',()=>{
 const c=createDefaultConfig();
 const baseline=runScenario(c,'loan-private');
 c.vehicle.residualPrice+=4500;
 const better=runScenario(c,'loan-private');
 near(baseline.economic.equivalentCost-better.economic.equivalentCost,4500);
});

test('capital necessário inclui aporte quando liquidação vale menos que dívida',()=>{
 const c=modelWithoutOperatingCosts();
 c.horizonMonths=1;
 c.vehicle.residualPrice=1000;
 const s=runScenario(c,'loan-private');
 assert.ok(s.terminalNetFromSale<0);
 assert.ok(s.debtSettlement.remainingPrincipal>1000);
 assert.ok(s.economic.maxCapitalNeed>c.financing.downPayment);
});

test('reconciliação de todos os eventos e cenários',()=>{
 const c=createDefaultConfig();
 for(const scenario of compareScenarios(c).results) {
  const e=scenario.economic;
  near(e.timeline.reduce((s,row)=>s+row.cashFlow,0),-e.nominalCost);
  near(e.contributions.reduce((s,row)=>s+row.equivalentCost,0),e.equivalentCost);
  near(e.contributions.reduce((s,row)=>s+row.opportunityCost,0),e.opportunityCost);
  near(e.equivalentCost-e.nominalCost,e.opportunityCost);
 }
});

test('série que recebe renda positiva pode ter custo econômico negativo',()=>{
 const x=evaluateCashFlows([makeEvent(0,-1000,'purchase','Compra'),makeEvent(12,1500,'sale','Venda')],12,0);
 near(x.equivalentCost,-500);
 assert.ok(x.monthlyEquivalent<0);
});

test('saldos Price/SAC satisfazem pagamento = amortização + juros em todos os períodos',()=>{
 for(const amortization of ['price','sac'])for(const interest of [0,0.005,0.0196]) {
  const s=createSchedule({principal:64000,monthlyInterestRate:interest,termMonths:36,amortization});
  near(s.totalAmortization,64000,1e-5);
  for(const row of s.rows.slice(1)) {
   near(row.payment,row.amortization+row.interest);
   near(row.beginningBalance-row.amortization,row.endingBalance);
  }
 }
});
