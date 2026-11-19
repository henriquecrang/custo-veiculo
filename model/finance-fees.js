(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CustoVeiculoFinanceFees = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  // Proxy de IOF parametrizado: NÃO constitui cálculo legal ou cotação bancária.
  // Sem calendário real/dados de contrato, o modo manual é preferido.
  function calculateIof(schedule, policy) {
    if(!schedule || !Array.isArray(schedule.rows) || !policy) throw new Error('Política de IOF inválida');
    if(!['manual','amortization-proxy'].includes(policy.mode)) throw new Error('Modo de IOF desconhecido');
    if(policy.mode==='manual') {
      if(!Number.isFinite(policy.amount) || policy.amount<0) throw new Error('Valor manual de IOF inválido');
      return { amount:policy.amount, mode:policy.mode, detail:'Valor informado, sem inferência legal' };
    }
    const fields=['additionalRate','dailyRate','daysPerMonth','maxDays'];
    if(fields.some(k=>!Number.isFinite(policy[k]) || policy[k]<0) ||
       !Number.isInteger(policy.daysPerMonth) || policy.daysPerMonth<1 ||
       !Number.isInteger(policy.maxDays) || policy.maxDays<1)
       throw new Error('Alíquotas ou calendário de proxy IOF inválidos');
    let dailyComponent=0;
    for(const row of schedule.rows.slice(1)) {
      const days=Math.min(policy.maxDays,row.month*policy.daysPerMonth);
      dailyComponent+=row.amortization*policy.dailyRate*days;
    }
    const additionalComponent=schedule.principal*policy.additionalRate;
    return {amount:additionalComponent+dailyComponent,additionalComponent,dailyComponent,
      mode:policy.mode,detail:'Proxy com 30 dias por mês por padrão; confirmar contrato e legislação'};
  }

  // Retorno efetivo estimado de fluxos mensais do financiamento, não CET regulatório auditado.
  function approximateCET(grossCreditReceived, monthlyPayments, upfrontCharges=0) {
    if(!Number.isFinite(grossCreditReceived)||grossCreditReceived<0 ||
       !Number.isFinite(upfrontCharges)||upfrontCharges<0 ||
       !Array.isArray(monthlyPayments) ||
       monthlyPayments.some(x=>!Number.isFinite(x)||x<0)) throw new Error('Fluxos de CET inválidos');
    const netCredit=grossCreditReceived-upfrontCharges;
    if(netCredit<=0) return null;
    const pv=(rate)=>monthlyPayments.reduce((sum,payment,index)=>sum+payment/Math.pow(1+rate,index+1),0);
    const atZero=pv(0);
    if(atZero+1e-8<netCredit) return null; // rendimento implícito negativo não representado
    if(Math.abs(atZero-netCredit)<1e-8) return {monthly:0,annual:0,netCredit};
    let low=0,high=1;
    while(pv(high)>netCredit && high<100) high*=2;
    if(pv(high)>netCredit) return null;
    for(let k=0;k<160;k++) {
      const mid=(low+high)/2;
      if(pv(mid)>netCredit)low=mid;else high=mid;
    }
    const monthly=(low+high)/2;
    return {monthly,annual:Math.pow(1+monthly,12)-1,netCredit};
  }

  return {calculateIof,approximateCET};
});
