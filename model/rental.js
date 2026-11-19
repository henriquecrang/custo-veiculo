(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports
    ? require('./cashflows.js') : root.CustoVeiculoCashflows);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoRental = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(cashflows) {
  'use strict';
  const { makeEvent } = cashflows;

  function subscriptionEvents(subscription, horizonMonths) {
    if (!subscription || !Number.isInteger(horizonMonths) || horizonMonths < 1) throw new Error('Locação ou horizonte inválido');
    const fields=['monthlyRent','upfrontCosts','deposit','refundedDepositPct','monthlyExtras','endCosts'];
    for(const key of fields)
      if(!Number.isFinite(subscription[key]) || subscription[key]<0 || (key==='refundedDepositPct' && subscription[key]>1))
        throw new Error('Locação tem valor inválido: '+key);
    if(!['start','end'].includes(subscription.paymentTiming)) throw new Error('Pagamento deve ser antecipado ou vencido');
    const events=[];
    if(subscription.upfrontCosts>0) events.push(makeEvent(0,-subscription.upfrontCosts,'rental-upfront','Taxas de adesão'));
    if(subscription.deposit>0) events.push(makeEvent(0,-subscription.deposit,'deposit','Caução reembolsável'));
    for(let cycle=1;cycle<=horizonMonths;cycle++){
      const month=subscription.paymentTiming==='start' ? cycle-1 : cycle;
      if(subscription.monthlyRent>0) events.push(makeEvent(month,-subscription.monthlyRent,'rent','Mensalidade '+cycle));
      if(subscription.monthlyExtras>0) events.push(makeEvent(month,-subscription.monthlyExtras,'rental-extras','Extras contratados '+cycle));
    }
    if(subscription.endCosts>0) events.push(makeEvent(horizonMonths,-subscription.endCosts,'rental-end','Custos de devolução'));
    const refund=subscription.deposit*subscription.refundedDepositPct;
    if(refund>0) events.push(makeEvent(horizonMonths,refund,'deposit-return','Devolução da caução'));
    return events;
  }

  return { subscriptionEvents };
});
