'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createDefaultConfig, validateConfig, assertValidConfig, SCENARIOS } = require('../model/config.js');

test('preset Rio é válido e editável de forma independente', () => {
  const a = createDefaultConfig();
  const b = createDefaultConfig();
  assert.deepEqual(validateConfig(a), []);
  a.selectedScenarioIds.pop();
  a.vehicle.price = 60000;
  assert.equal(b.vehicle.price, 80000);
  assert.equal(b.selectedScenarioIds.length, SCENARIOS.length);
});

test('rejeita entrada superior ao preço, juros negativos e horizonte fracionário', () => {
  const c = createDefaultConfig();
  c.financing.downPayment = 90000;
  c.financing.monthlyInterestRate = -0.01;
  c.horizonMonths = 12.5;
  assert.ok(validateConfig(c).some(x => x.includes('downPayment')));
  assert.ok(validateConfig(c).some(x => x.includes('monthlyInterestRate')));
  assert.ok(validateConfig(c).some(x => x.includes('horizonMonths')));
});

test('rejeita NaN, Infinity, versões incompatíveis e valores não numéricos', () => {
  const c = createDefaultConfig();
  c.ownership.insuranceAnnual = NaN;
  c.resale.dealerDiscountPct = Infinity;
  c.schemaVersion = 2;
  assert.equal(validateConfig(c).length, 3);
  assert.throws(() => assertValidConfig(c), /Configuração inválida/);
  assert.ok(validateConfig(null).length);
});

test('schema sinaliza financiamento SAC/Price e aluguel antecipado ou vencido', () => {
  const c = createDefaultConfig();
  c.financing.amortization = 'sac';
  c.subscription.paymentTiming = 'start';
  assert.deepEqual(validateConfig(c), []);
  c.subscription.paymentTiming = 'unknown';
  assert.ok(validateConfig(c).some(x => x.includes('paymentTiming')));
});
