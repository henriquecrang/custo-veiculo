'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { monthlyRateFromAnnual, annuityFactor, evaluateCashFlows, makeEvent } = require('../model/cashflows.js');
const near = (actual, expected, eps=1e-6) => assert.ok(Math.abs(actual-expected)<eps, actual + ' difere de ' + expected);

test('R=0 implica custo nominal igual custo equivalente', () => {
  const result = evaluateCashFlows([
    makeEvent(0,-10000,'purchase','Compra'),
    makeEvent(5,-1000,'expense','IPVA'),
    makeEvent(12,8000,'sale','Revenda')
  ],12,0);
  near(result.equivalentCost,3000);
  near(result.nominalCost,3000);
  near(result.opportunityCost,0);
  near(result.monthlyEquivalent,250);
  near(result.maxCapitalNeed,11000);
});

test('aplicação da mesma oportunidade a pagamentos recorrentes de aluguel e financiamento', () => {
  const annual = Math.pow(1.01,12)-1;
  const installments = Array.from({length:12},(_,i)=>makeEvent(i+1,-1000,'installment','Mensalidade'));
  const r = evaluateCashFlows(installments,12,annual);
  near(r.monthlyEquivalent,1000,1e-7);
  near(r.equivalentCost,1000*annuityFactor(12,0.01));
  assert.ok(r.opportunityCost>0);
  assert.equal(r.contributions[11].opportunityCost,0);
  assert.ok(r.contributions[0].opportunityCost>r.contributions[1].opportunityCost);
});

test('mensalidade antecipada tem fator distinto de vencida', () => {
  const annual = Math.pow(1.01,12)-1;
  const installments = Array.from({length:12},(_,i)=>makeEvent(i,-1000,'rent','Aluguel antecipado'));
  const r = evaluateCashFlows(installments,12,annual);
  near(r.equivalentCost,1000*annuityFactor(12,0.01,'start'));
  assert.ok(r.monthlyEquivalent>1000);
});

test('caução integralmente devolvida mantém somente custo de oportunidade', () => {
  const annual = Math.pow(1.01,12)-1;
  const r=evaluateCashFlows([makeEvent(0,-2000,'deposit','Caução'),makeEvent(12,2000,'deposit-return','Devolução')],12,annual);
  near(r.nominalCost,0);
  near(r.equivalentCost,2000*(Math.pow(1.01,12)-1));
});

test('entradas positivas no fim diminuem CE na mesma proporção e contribuições reconciliam', () => {
  const base=[makeEvent(0,-5000,'purchase','Compra'),makeEvent(12,3000,'sale','Revenda')];
  const a=evaluateCashFlows(base,12,0.11);
  const b=evaluateCashFlows([...base,makeEvent(12,100,'sale','Aumento de revenda')],12,0.11);
  near(a.equivalentCost-b.equivalentCost,100);
  near(a.contributions.reduce((s,c)=>s+c.equivalentCost,0),a.equivalentCost);
  near(a.timeline.reduce((s,r)=>s+r.cashFlow,0),-a.nominalCost);
});

test('valida horizonte, eventos e taxas', () => {
  assert.throws(()=>evaluateCashFlows([makeEvent(0,-100,'expense','Gasto')],0,0),/Horizonte/);
  assert.throws(()=>evaluateCashFlows([makeEvent(13,-100,'expense','Gasto')],12,0),/fora do horizonte/);
  assert.throws(()=>monthlyRateFromAnnual(-0.01),/inválida/);
  assert.throws(()=>makeEvent(0,Infinity,'expense','Gasto'),/finito/);
  near(monthlyRateFromAnnual(0.1126),Math.pow(1.1126,1/12)-1);
});
