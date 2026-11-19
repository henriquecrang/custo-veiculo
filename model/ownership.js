(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports
    ? require('./cashflows.js') : root.CustoVeiculoCashflows);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoOwnership = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(cashflows) {
  'use strict';
  const { makeEvent } = cashflows;

  function ownershipEvents(ownership, horizonMonths) {
    if(!ownership || !Number.isInteger(horizonMonths) || horizonMonths < 1) throw new Error('Configuração de posse inválida');
    const events = [];
    const annual=[['ipvaAnnual','ipvaFirstMonth','ipva','IPVA'],
      ['insuranceAnnual','insuranceFirstMonth','insurance','Seguro'],
      ['licensingAnnual','licensingFirstMonth','licensing','Licenciamento']];
    for(const [amountKey,firstKey,category,description] of annual) {
      const amount = ownership[amountKey];
      const firstMonth = ownership[firstKey];
      if(!Number.isFinite(amount) || amount<0 || !Number.isInteger(firstMonth) || firstMonth<1 || firstMonth>12)
        throw new Error('Despesa anual inválida: '+amountKey);
      for(let m=firstMonth;m<=horizonMonths;m+=12)
        if(amount>0) events.push(makeEvent(m,-amount,category,description));
    }
    const monthly = [
      ['maintenanceMonthly','maintenance','Manutenção preventiva por tempo'],
      ['garageMonthly','garage','Garagem']
    ];
    for(const [key] of monthly) if(!Number.isFinite(ownership[key]) || ownership[key]<0)
      throw new Error('Despesa mensal inválida: '+key);
    if(!Number.isFinite(ownership.kmPerMonth) || ownership.kmPerMonth<0 ||
       !Number.isFinite(ownership.costPerKm) || ownership.costPerKm<0)
      throw new Error('Quilometragem e custo/km inválidos');
    for(let m=1;m<=horizonMonths;m++) {
      for(const [key,category,description] of monthly)
        if(ownership[key]>0) events.push(makeEvent(m,-ownership[key],category,description));
      if(ownership.kmPerMonth*ownership.costPerKm>0)
        events.push(makeEvent(m,-ownership.kmPerMonth*ownership.costPerKm,'usage','Custo variável por km'));
    }
    return events;
  }

  return { ownershipEvents };
});
