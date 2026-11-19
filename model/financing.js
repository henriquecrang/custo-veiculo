(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoFinancing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function createSchedule({principal, monthlyInterestRate, termMonths, amortization='price'}) {
    if (!Number.isFinite(principal) || principal < 0) throw new RangeError('Principal inválido');
    if (!Number.isFinite(monthlyInterestRate) || monthlyInterestRate < 0) throw new RangeError('Taxa mensal inválida');
    if (!Number.isInteger(termMonths) || termMonths < 1 || termMonths > 600) throw new RangeError('Prazo inválido');
    if (!['price', 'sac'].includes(amortization)) throw new RangeError('Sistema de amortização inválido');

    const i = monthlyInterestRate;
    const regular = amortization === 'price'
      ? (i === 0 ? principal/termMonths : principal*i/(-Math.expm1(-termMonths*Math.log1p(i))))
      : principal/termMonths;
    let balance = principal;
    let totalInterest = 0, totalPaid = 0, totalAmortization = 0;
    const rows = [{ month:0, beginningBalance: principal, interest:0, amortization:0, payment:0, endingBalance:principal }];
    for(let month=1; month<=termMonths; month++) {
      const beginningBalance = balance;
      const interest = beginningBalance*i;
      let amortized = amortization === 'sac' ? principal/termMonths : regular-interest;
      if(month === termMonths || amortized > beginningBalance) amortized = beginningBalance;
      if(amortized < -1e-8) throw new Error('Amortização negativa: revisar os parâmetros');
      const payment = interest + amortized;
      balance = Math.max(0, beginningBalance-amortized);
      totalPaid += payment;
      totalInterest += interest;
      totalAmortization += amortized;
      rows.push({ month, beginningBalance, interest, amortization:amortized, payment, endingBalance:balance });
    }
    return { principal, monthlyInterestRate:i, termMonths, amortization,
      rows, totalPaid, totalInterest, totalAmortization, balance };
  }

  function balanceAfterPayments(schedule, paidMonths) {
    if (!schedule || !Array.isArray(schedule.rows) || !Number.isInteger(paidMonths) || paidMonths < 0)
      throw new RangeError('Parâmetros da quitação inválidos');
    return schedule.rows[Math.min(paidMonths,schedule.termMonths)].endingBalance;
  }

  function settlementAt(schedule, month, payoffCosts=0) {
    if (!Number.isInteger(month) || month < 0) throw new RangeError('Mês de venda inválido');
    if (!Number.isFinite(payoffCosts) || payoffCosts < 0) throw new RangeError('Custo de quitação inválido');
    return { month, remainingPrincipal: balanceAfterPayments(schedule, month),
      fees: payoffCosts, totalDue: balanceAfterPayments(schedule, month)+payoffCosts };
  }

  return { createSchedule, balanceAfterPayments, settlementAt };
});
