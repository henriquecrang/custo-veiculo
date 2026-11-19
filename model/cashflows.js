(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoCashflows = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const EPS = 1e-10;
  function monthlyRateFromAnnual(annualRate) {
    if (!Number.isFinite(annualRate) || annualRate < 0) throw new RangeError('Taxa anual efetiva líquida inválida');
    return Math.pow(1 + annualRate, 1 / 12) - 1;
  }

  function makeEvent(month, amount, category, description, metadata = {}) {
    if (!Number.isInteger(month) || month < 0) throw new RangeError('Mês do evento deve ser inteiro não negativo');
    if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new TypeError('Valor financeiro deve ser finito');
    if (typeof category !== 'string' || !category.trim()) throw new TypeError('Categoria obrigatória');
    if (typeof description !== 'string') throw new TypeError('Descrição inválida');
    return { month, amount, category, description, metadata: { ...metadata } };
  }

  function annuityFactor(months, monthlyRate, timing = 'end') {
    if (!Number.isInteger(months) || months < 1) throw new RangeError('Horizonte inválido');
    if (typeof monthlyRate !== 'number' || !Number.isFinite(monthlyRate) || monthlyRate < 0) throw new RangeError('Taxa mensal inválida');
    if (timing !== 'end' && timing !== 'start') throw new Error('Momento de vencimento inválido');
    const expired = Math.abs(monthlyRate) < EPS ? months : Math.expm1(months * Math.log1p(monthlyRate)) / monthlyRate;
    return timing === 'start' ? expired * (1 + monthlyRate) : expired;
  }

  function evaluateCashFlows(events, horizonMonths, opportunityAnnualNet) {
    if (!Number.isInteger(horizonMonths) || horizonMonths < 1) throw new RangeError('Horizonte precisa ser >= 1 mês');
    if (!Array.isArray(events)) throw new TypeError('Eventos precisam ser lista');
    const r = monthlyRateFromAnnual(opportunityAnnualNet);
    const timeline = Array.from({ length: horizonMonths + 1 }, (_, month) => ({
      month, cashFlow: 0, cumulativeCashFlow: 0, equivalentCost: 0,
      opportunityCost: 0, events: []
    }));
    const contributions = [];
    for (const source of events) {
      if (!source || !Number.isInteger(source.month) || source.month < 0 || source.month > horizonMonths ||
          !Number.isFinite(source.amount) || typeof source.category !== 'string') {
        throw new Error('Evento financeiro inválido ou fora do horizonte');
      }
      const event = makeEvent(source.month, source.amount, source.category, source.description || '', source.metadata);
      const factor = Math.pow(1 + r, horizonMonths - event.month);
      const nominal = -event.amount;
      const equivalent = nominal * factor;
      const opportunity = equivalent - nominal;
      contributions.push({ ...event, nominalCost: nominal, equivalentCost: equivalent, opportunityCost: opportunity });
      const row = timeline[event.month];
      row.cashFlow += event.amount;
      row.equivalentCost += equivalent;
      row.opportunityCost += opportunity;
      row.events.push(event);
    }
    let running = 0;
    let maxCapitalNeed = 0;
    for (const row of timeline) {
      running += row.cashFlow;
      row.cumulativeCashFlow = running;
      maxCapitalNeed = Math.max(maxCapitalNeed, -running);
    }
    const nominalCost = -contributions.reduce((sum, c) => sum + c.amount, 0);
    const equivalentCost = contributions.reduce((sum, c) => sum + c.equivalentCost, 0);
    const opportunityCost = equivalentCost - nominalCost;
    const monthlyEquivalent = equivalentCost / annuityFactor(horizonMonths, r);
    const presentValue = equivalentCost / Math.pow(1 + r, horizonMonths);
    return {
      horizonMonths, opportunityAnnualNet, opportunityMonthlyNet: r,
      nominalCost, equivalentCost, opportunityCost, presentValue, monthlyEquivalent,
      maxCapitalNeed, timeline, contributions
    };
  }

  return { monthlyRateFromAnnual, makeEvent, annuityFactor, evaluateCashFlows };
});
