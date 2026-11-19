'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig,validateConfig}=require('../model/config.js');
const {createSchedule}=require('../model/financing.js');
const {calculateIof,approximateCET}=require('../model/finance-fees.js');
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,a+' vs '+b);

test('IOF manual não pressupõe taxas e permite escolha de financiar',()=>{
 const c=createDefaultConfig();
 assert.deepEqual(validateConfig(c),[]);
 const s=createSchedule({principal:64000,monthlyInterestRate:0.0196,termMonths:36});
 near(calculateIof(s,c.financing.iof).amount,0);
 c.financing.iof.amount=1937;c.financing.iof.financed=true;
 near(calculateIof(s,c.financing.iof).amount,1937);
 assert.deepEqual(validateConfig(c),[]);
});

test('proxy IOF soma alíquota adicional e dias sobre amortizações',()=>{
 const s=createSchedule({principal:1200,monthlyInterestRate:0,termMonths:2});
 const p={mode:'amortization-proxy',additionalRate:0.01,dailyRate:0.0001,daysPerMonth:30,maxDays:365};
 const a=calculateIof(s,p);
 near(a.additionalComponent,12);
 near(a.dailyComponent,600*30*.0001+600*60*.0001);
 near(a.amount,17.4);
});

test('CET aproximado sem taxas reflete juros mensais e taxas aumentam CET',()=>{
 const s=createSchedule({principal:64000,monthlyInterestRate:0.0196,termMonths:36});
 const payments=s.rows.slice(1).map(r=>r.payment);
 const noFee=approximateCET(64000,payments,0);
 const fee=approximateCET(64000,payments,1000);
 near(noFee.monthly,0.0196,1e-9);
 assert.ok(fee.monthly>noFee.monthly);
});

test('Juros zero retornam CET zero e custos negativos são rejeitados',()=>{
 const s=createSchedule({principal:1200,monthlyInterestRate:0,termMonths:12});
 near(approximateCET(1200,s.rows.slice(1).map(r=>r.payment)).monthly,0);
 assert.throws(()=>approximateCET(100,[110],-1),/inválidos/);
});

test('IOF inválido ou política desconhecida falham',()=>{
 const s=createSchedule({principal:1200,monthlyInterestRate:0,termMonths:2});
 assert.throws(()=>calculateIof(s,{mode:'manual',amount:-1}),/inválido/);
 assert.throws(()=>calculateIof(s,{mode:'qualquer'}),/desconhecido/);
});
