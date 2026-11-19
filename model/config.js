(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoConfig = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const SCHEMA_VERSION = 1;
  const SCENARIOS = Object.freeze([
    'cash-private', 'cash-dealer', 'loan-private', 'loan-dealer', 'subscription'
  ]);

  function createDefaultConfig() {
    return {
      schemaVersion: SCHEMA_VERSION,
      name: 'Rio — seminovo R$ 80 mil, carro parado (simulação)',
      horizonMonths: 12,
      selectedScenarioIds: [...SCENARIOS],
      vehicle: {
        name: 'Seminovo hipotético de R$ 80 mil',
        price: 80000,
        ageYears: 3,
        residualMethod: 'fixed',
        residualPrice: 72000,
        annualDepreciationRate: 0.10
      },
      financing: {
        downPayment: 16000,
        termMonths: 36,
        monthlyInterestRate: 0.0196,
        amortization: 'price',
        financedCosts: 0,
        upfrontCosts: 0,
        payoffCosts: 0,
        // IOF não tem alíquota legal presumida: informar valor ou taxas comprovadas.
        iof: { mode: 'manual', amount: 0, financed: false,
          additionalRate: 0, dailyRate: 0, daysPerMonth: 30, maxDays: 365 }
      },
      purchase: { initialCosts: 0 },
      ownership: {
        ipvaAnnual: 3200,
        ipvaFirstMonth: 1,
        insuranceAnnual: 4400,
        insuranceFirstMonth: 1,
        licensingAnnual: 0,
        licensingFirstMonth: 1,
        maintenanceMonthly: 100,
        garageMonthly: 0,
        kmPerMonth: 0,
        costPerKm: 0
      },
      resale: {
        privateDiscountPct: 0,
        privateFixedCosts: 300,
        dealerDiscountPct: 0.15,
        dealerFixedCosts: 0
      },
      subscription: {
        vehicleName: 'Argo 1.0 (não equivalente ao carro adquirido)',
        monthlyRent: 2299,
        paymentTiming: 'end',
        upfrontCosts: 0,
        deposit: 0,
        refundedDepositPct: 1,
        monthlyExtras: 0,
        endCosts: 0,
        included: ['ipva', 'insurance', 'maintenance', 'licensing']
      },
      economics: {
        opportunityAnnualNet: 0.1126,
        inflationAnnual: 0.043
      }
    };
  }

  const validators = {
    horizonMonths: [1, 60, true],
    'vehicle.price': [0, Infinity],
    'vehicle.ageYears': [0, 100],
    'vehicle.residualPrice': [0, Infinity],
    'vehicle.annualDepreciationRate': [0, 1],
    'financing.downPayment': [0, Infinity],
    'financing.termMonths': [1, 600, true],
    'financing.monthlyInterestRate': [0, 2],
    'financing.financedCosts': [0, Infinity],
    'financing.upfrontCosts': [0, Infinity],
    'financing.payoffCosts': [0, Infinity],
    'financing.iof.amount': [0, Infinity],
    'financing.iof.additionalRate': [0, 1],
    'financing.iof.dailyRate': [0, 1],
    'financing.iof.daysPerMonth': [1, 31, true],
    'financing.iof.maxDays': [1, 3650, true],
    'purchase.initialCosts': [0, Infinity],
    'ownership.ipvaAnnual': [0, Infinity],
    'ownership.ipvaFirstMonth': [1, 12, true],
    'ownership.insuranceAnnual': [0, Infinity],
    'ownership.insuranceFirstMonth': [1, 12, true],
    'ownership.licensingAnnual': [0, Infinity],
    'ownership.licensingFirstMonth': [1, 12, true],
    'ownership.maintenanceMonthly': [0, Infinity],
    'ownership.garageMonthly': [0, Infinity],
    'ownership.kmPerMonth': [0, Infinity],
    'ownership.costPerKm': [0, Infinity],
    'resale.privateDiscountPct': [0, 1],
    'resale.privateFixedCosts': [0, Infinity],
    'resale.dealerDiscountPct': [0, 1],
    'resale.dealerFixedCosts': [0, Infinity],
    'subscription.monthlyRent': [0, Infinity],
    'subscription.upfrontCosts': [0, Infinity],
    'subscription.deposit': [0, Infinity],
    'subscription.refundedDepositPct': [0, 1],
    'subscription.monthlyExtras': [0, Infinity],
    'subscription.endCosts': [0, Infinity],
    'economics.opportunityAnnualNet': [0, 100],
    'economics.inflationAnnual': [0, 100]
  };

  function field(obj, path) {
    return path.split('.').reduce((v, part) => v == null ? undefined : v[part], obj);
  }

  function validateConfig(cfg) {
    const errors = [];
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) return ['A simulação precisa ser um objeto JSON'];
    if (cfg.schemaVersion !== SCHEMA_VERSION) errors.push('schemaVersion incompatível; migração explícita necessária');
    if (typeof cfg.name !== 'string' || !cfg.name.trim() || cfg.name.length > 200) errors.push('name deve ter entre 1 e 200 caracteres');
    for (const [path, [min, max, integer]] of Object.entries(validators)) {
      const n = field(cfg, path);
      if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
        errors.push(path + ' inválido: esperado número ' + (integer ? 'inteiro ' : '') + 'de ' + min + ' a ' + max);
      }
    }
    if (!Array.isArray(cfg.selectedScenarioIds) || cfg.selectedScenarioIds.length === 0 ||
        cfg.selectedScenarioIds.some(id => !SCENARIOS.includes(id)) ||
        new Set(cfg.selectedScenarioIds).size !== cfg.selectedScenarioIds.length) {
      errors.push('selectedScenarioIds precisa conter IDs conhecidos, sem duplicatas');
    }
    if (!['fixed','annual-rate'].includes(field(cfg,'vehicle.residualMethod'))) errors.push('vehicle.residualMethod inválido');
    if (!['price','sac'].includes(field(cfg,'financing.amortization'))) errors.push('financing.amortization inválido');
    if (!['manual','amortization-proxy'].includes(field(cfg,'financing.iof.mode'))) errors.push('financing.iof.mode inválido');
    if (typeof field(cfg,'financing.iof.financed') !== 'boolean') errors.push('financing.iof.financed inválido');
    if (!['start','end'].includes(field(cfg,'subscription.paymentTiming'))) errors.push('subscription.paymentTiming inválido');
    for (const key of ['vehicle.name','subscription.vehicleName']) {
      if (typeof field(cfg,key) !== 'string') errors.push(key + ' precisa ser texto');
    }
    if (!Array.isArray(field(cfg,'subscription.included')) ||
        field(cfg,'subscription.included').some(x => !['ipva','insurance','maintenance','licensing','garage'].includes(x))) {
      errors.push('subscription.included inválido');
    }
    if (typeof field(cfg,'vehicle.price') === 'number' && typeof field(cfg,'financing.downPayment') === 'number' &&
        cfg.financing.downPayment > cfg.vehicle.price) errors.push('financing.downPayment supera vehicle.price');
    return errors;
  }

  function assertValidConfig(cfg) {
    const errors = validateConfig(cfg);
    if (errors.length) throw new Error('Configuração inválida: ' + errors.join('; '));
    return cfg;
  }

  return { SCHEMA_VERSION, SCENARIOS, createDefaultConfig, validateConfig, assertValidConfig };
});
