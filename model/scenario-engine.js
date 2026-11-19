(function(root, factory) {
  const browser = typeof module !== 'object' || !module.exports;
  const api = factory(
    browser ? root.CustoVeiculoConfig : require('./config.js'),
    browser ? root.CustoVeiculoCashflows : require('./cashflows.js'),
    browser ? root.CustoVeiculoFinancing : require('./financing.js'),
    browser ? root.CustoVeiculoFinanceFees : require('./finance-fees.js'),
    browser ? root.CustoVeiculoOwnership : require('./ownership.js'),
    browser ? root.CustoVeiculoResale : require('./resale.js'),
    browser ? root.CustoVeiculoRental : require('./rental.js')
  );
  if (!browser) module.exports = api;
  root.CustoVeiculoEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(config, cashflows, financing, financeFees, ownership, resale, rental) {
  'use strict';
  if([config,cashflows,financing,financeFees,ownership,resale,rental].some(x=>!x))
    throw new Error('Todos os módulos financeiros são obrigatórios');
  const { assertValidConfig, SCENARIOS } = config;
  const { makeEvent, evaluateCashFlows } = cashflows;
  const { createSchedule, settlementAt } = financing;
  const { calculateIof, approximateCET } = financeFees;
  const { ownershipEvents } = ownership;
  const { saleProceeds } = resale;
  const { subscriptionEvents } = rental;

  function loanTerms(cfg) {
    const f=cfg.financing;
    const basePrincipal=cfg.vehicle.price-f.downPayment;
    const grossWithoutIof=basePrincipal+f.financedCosts;
    const preIof=createSchedule({principal:grossWithoutIof,monthlyInterestRate:f.monthlyInterestRate,
      termMonths:f.termMonths,amortization:f.amortization});
    const iof=calculateIof(preIof,f.iof);
    const principal=grossWithoutIof+(f.iof.financed ? iof.amount:0);
    const schedule=createSchedule({principal,monthlyInterestRate:f.monthlyInterestRate,
      termMonths:f.termMonths,amortization:f.amortization});
    const upfrontCharges=f.upfrontCosts+(f.iof.financed ? 0:iof.amount);
    const estimatedCet=basePrincipal>0
      ? approximateCET(basePrincipal,schedule.rows.slice(1).map(x=>x.payment),upfrontCharges)
      : null;
    return {basePrincipal,principal,upfrontCharges,iof,schedule,estimatedCet};
  }

  function addNonZero(events,month,amount,category,description) {
    if(amount!==0) events.push(makeEvent(month,amount,category,description));
  }

  function runScenario(cfg, scenarioId) {
    assertValidConfig(cfg);
    if(!SCENARIOS.includes(scenarioId)) throw new Error('Estratégia desconhecida: '+scenarioId);
    const N=cfg.horizonMonths;
    const events=[];
    let sale=null, debtSettlement=null, loan=null, estimatedCet=null;
    const isSubscription=scenarioId==='subscription';
    const financed=scenarioId.startsWith('loan-');
    if(isSubscription) {
      events.push(...subscriptionEvents(cfg.subscription,N));
    } else {
      const saleChannel=scenarioId.endsWith('dealer') ? 'dealer':'private';
      const vehicle=cfg.vehicle, f=cfg.financing;
      if(financed) {
        loan=loanTerms(cfg);
        estimatedCet=loan.estimatedCet;
        addNonZero(events,0,-f.downPayment,'down-payment','Entrada do financiamento');
        addNonZero(events,0,-loan.upfrontCharges,'financing-fees','IOF e despesas bancárias iniciais');
        for (const row of loan.schedule.rows.slice(1,Math.min(f.termMonths,N)+1)) {
          addNonZero(events,row.month,-row.payment,'installment','Parcela financiamento '+row.month);
        }
        debtSettlement=settlementAt(loan.schedule,N,0);
        if(debtSettlement.remainingPrincipal>1e-8) {
          addNonZero(events,N,-debtSettlement.remainingPrincipal,'debt-payoff','Quitação antecipada do saldo');
          addNonZero(events,N,-f.payoffCosts,'payoff-fees','Custos da baixa e quitação');
          debtSettlement.fees=f.payoffCosts;
          debtSettlement.totalDue+=f.payoffCosts;
        }
      } else {
        addNonZero(events,0,-vehicle.price,'purchase','Aquisição à vista');
      }
      addNonZero(events,0,-cfg.purchase.initialCosts,'purchase-fees','Custos iniciais de compra');
      events.push(...ownershipEvents(cfg.ownership,N));
      sale=saleProceeds(cfg.vehicle,cfg.resale,N,saleChannel);
      addNonZero(events,N,sale.grossSale,'sale','Recebimento bruto pela venda');
      addNonZero(events,N,-sale.fixedCosts,'sale-fees','Despesas de venda');
    }
    const economic=evaluateCashFlows(events,N,cfg.economics.opportunityAnnualNet);
    const sum = (category) => events.filter(x=>x.category===category).reduce((s,x)=>s+x.amount,0);
    const totalSaleCash=sale ? sale.netProceeds : 0;
    return {
      id: scenarioId, horizonMonths:N, events, economic, sale, debtSettlement,
      loan:loan ? { basePrincipal:loan.basePrincipal,principal:loan.principal,
        upfrontCharges:loan.upfrontCharges,iof:loan.iof,schedule:loan.schedule } : null,
      estimatedCet,
      terminalSaleCash:totalSaleCash,
      terminalNetFromSale:totalSaleCash-(debtSettlement ? debtSettlement.totalDue:0),
      // Inclui caução e primeira mensalidade antecipada na liquidez inicial.
      acquisitionCash:-events.filter(e=>e.month===0 && e.amount<0).reduce((total,e)=>total+e.amount,0)
    };
  }

  function compareScenarios(cfg) {
    assertValidConfig(cfg);
    const results=cfg.selectedScenarioIds.map(id=>runScenario(cfg,id));
    const ranked=[...results].sort((a,b)=>a.economic.equivalentCost-b.economic.equivalentCost);
    const warnings=[];
    if(cfg.selectedScenarioIds.includes('subscription') &&
      cfg.subscription.vehicleName!==cfg.vehicle.name) warnings.push('Carros/modelos comparados não são necessariamente equivalentes.');
    return { schemaVersion:cfg.schemaVersion,horizonMonths:cfg.horizonMonths,
      opportunityAnnualNet:cfg.economics.opportunityAnnualNet,
      results,rankedScenarioIds:ranked.map(x=>x.id),leastCostScenarioId:ranked[0].id,warnings };
  }

  return { loanTerms, runScenario, compareScenarios };
});
