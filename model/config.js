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
    const base = {
      schemaVersion: SCHEMA_VERSION,
      name: 'Rio — seminovo R$ 80 mil, carro parado (simulação)',
      horizonMonths: 12,
      selectedScenarioIds: [...SCENARIOS],
      vehicle: {
        name: 'Seminovo hipotético de R$ 80 mil',
        category: 'unknown',
        condition: 'used',
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
        category: 'compact',
        condition: 'new',
        contractMonths: 12,
        equivalenceConfirmed: false,
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
    // Classificação documental não afeta os cálculos financeiros.
    base.evidence = {
      'vehicle.price': {kind:'hypothesis',asOf:'2026-11-19',note:'Carro hipotético, não anúncio verificado'},
      'vehicle.residualPrice': {kind:'hypothesis',asOf:'2026-11-19',note:'Revenda projetada (10% em 12 meses)'},
      'financing.monthlyInterestRate': {kind:'hypothesis',asOf:'2026-11-19',note:'Taxa ilustrativa; conferir CET e proposta do banco'},
      'financing.iof.amount': {kind:'unknown',asOf:'2026-11-19',note:'Zero significa IOF não informado, não isenção'},
      'financing.upfrontCosts': {kind:'unknown',asOf:'2026-11-19',note:'Tarifas bancárias ainda não informadas'},
      'purchase.initialCosts': {kind:'unknown',asOf:'2026-11-19',note:'Transferência e vistoria ainda não orçadas'},
      'ownership.ipvaAnnual': {kind:'hypothesis',asOf:'2026-11-19',note:'Provisão 4% do valor de compra; confirmar base de incidência RJ'},
      'ownership.insuranceAnnual': {kind:'hypothesis',asOf:'2026-11-19',note:'Provisão, não cotação de seguro'},
      'ownership.licensingAnnual': {kind:'unknown',asOf:'2026-11-19',note:'Licenciamento ainda não informado'},
      'ownership.maintenanceMonthly': {kind:'hypothesis',asOf:'2026-11-19',note:'Provisão mensal por tempo, carro parado'},
      'resale.privateFixedCosts': {kind:'hypothesis',asOf:'2026-11-19',note:'Provisão para anúncios'},
      'resale.dealerDiscountPct': {kind:'hypothesis',asOf:'2026-11-19',note:'Desconto de loja estimado, não oferta vinculante'},
      'subscription.monthlyRent': {kind:'hypothesis',asOf:'2026-11-19',note:'Referência ilustrativa de Argo, não carro equivalente'},
      'economics.opportunityAnnualNet': {kind:'hypothesis',asOf:'2026-11-19',note:'Retorno alternativo líquido assumido, não garantido'}
    };
    return base;
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
    // Metadados opcionais: JSONs versão 1 anteriores continuam importáveis.
    const categories=['unknown','compact','sedan','suv','other'];
    const conditions=['unknown','new','used'];
    for(const key of ['vehicle.category','subscription.category']){
      const value=field(cfg,key);
      if(value!==undefined&&!categories.includes(value))errors.push(key+' inválido');
    }
    for(const key of ['vehicle.condition','subscription.condition']){
      const value=field(cfg,key);
      if(value!==undefined&&!conditions.includes(value))errors.push(key+' inválido');
    }
    const contract=field(cfg,'subscription.contractMonths');
    if(contract!==undefined&&(!Number.isInteger(contract)||contract<1||contract>60))
      errors.push('subscription.contractMonths inválido: usar entre 1 e 60');
    const confirmed=field(cfg,'subscription.equivalenceConfirmed');
    if(confirmed!==undefined&&typeof confirmed!=='boolean')
      errors.push('subscription.equivalenceConfirmed precisa ser booleano');
    if(cfg.evidence!==undefined){
      if(!cfg.evidence || typeof cfg.evidence!=='object' || Array.isArray(cfg.evidence)){
        errors.push('evidence deve ser um objeto por caminho');
      } else {
        for(const [path,entry] of Object.entries(cfg.evidence)){
          if(!entry || typeof entry!=='object' || Array.isArray(entry) ||
              !['hypothesis','official','quote','user-input','derived','unknown'].includes(entry.kind) ||
              (entry.asOf!==undefined && (typeof entry.asOf!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(entry.asOf))) ||
              (entry.note!==undefined && (typeof entry.note!=='string'||entry.note.length>600)) ||
              (entry.url!==undefined && (typeof entry.url!=='string'||!/^https:\/\/[^ <>]+$/.test(entry.url)))){
            errors.push('evidence.'+path+' inválido');
          }
        }
      }
    }
    return errors;
  }

  function assertValidConfig(cfg) {
    const errors = validateConfig(cfg);
    if (errors.length) throw new Error('Configuração inválida: ' + errors.join('; '));
    return cfg;
  }

  return { SCHEMA_VERSION, SCENARIOS, createDefaultConfig, validateConfig, assertValidConfig };
});
