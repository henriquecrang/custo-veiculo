'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createSchedule,balanceAfterPayments,settlementAt}=require('../model/financing.js');
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,a+' vs '+b);

test('Price 64 mil 1,96% a.m. em 36 meses: parcela e saldo após 12',()=>{
  const s=createSchedule({principal:64000,monthlyInterestRate:0.0196,termMonths:36,amortization:'price'});
  near(s.rows[1].payment,2494.801210565998);
  near(balanceAfterPayments(s,12),47400.99823346491);
  near(s.rows.slice(1,13).reduce((s,x)=>s+x.interest,0),13338.612760256889);
  near(s.balance,0,1e-7);
  near(s.totalAmortization,64000);
});

test('SAC amortiza principal linearmente e parcelas decrescem',()=>{
  const s=createSchedule({principal:12000,monthlyInterestRate:0.01,termMonths:12,amortization:'sac'});
  near(s.rows[1].payment,1120);
  near(s.rows[2].payment,1110);
  near(s.rows[6].endingBalance,6000);
  near(s.rows[12].endingBalance,0);
  near(s.totalAmortization,12000);
});

test('Taxa zero e quitação antecipada sem juros futuros',()=>{
  const s=createSchedule({principal:36000,monthlyInterestRate:0,termMonths:36});
  near(s.rows[1].payment,1000);
  near(balanceAfterPayments(s,12),24000);
  near(settlementAt(s,12,200).totalDue,24200);
  near(balanceAfterPayments(s,50),0);
});

test('Financiamento totalmente quitado não gera saldo fictício',()=>{
  const s=createSchedule({principal:1200,monthlyInterestRate:0.03,termMonths:6});
  near(settlementAt(s,12).totalDue,0);
  for(let i=1;i<=6;i++) near(s.rows[i].payment,s.rows[i].amortization+s.rows[i].interest);
});

test('Inputs inválidos falham sem produzir NaN',()=>{
  assert.throws(()=>createSchedule({principal:-10,monthlyInterestRate:0.01,termMonths:12}),/Principal/);
  assert.throws(()=>createSchedule({principal:10000,monthlyInterestRate:NaN,termMonths:12}),/Taxa/);
  assert.throws(()=>createSchedule({principal:10000,monthlyInterestRate:0,termMonths:0}),/Prazo/);
});
