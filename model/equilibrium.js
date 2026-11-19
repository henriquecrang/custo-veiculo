(function(root, factory) {
  const browser=typeof module !== 'object' || !module.exports;
  const api=factory(browser?root.CustoVeiculoEngine:require('./scenario-engine.js'),
    browser?root.CustoVeiculoResale:require('./resale.js'));
  if(!browser)module.exports=api;
  root.CustoVeiculoEquilibrium=api;
})(typeof globalThis !== 'undefined' ? globalThis : this,function(engine,resale){
 'use strict';
 const {runScenario}=engine;
 const {referenceResalePrice}=resale;
 const PURCHASE_IDS=['cash-private','cash-dealer','loan-private','loan-dealer'];
 function deepCopy(c){return JSON.parse(JSON.stringify(c))}
 function validPurchaseId(id){if(!PURCHASE_IDS.includes(id))throw new Error('Estratégia de compra inválida')}

 // Mensalidade constante capaz de empatar o CE de uma compra; inclui extras, depósito e taxas.
 function breakEvenMonthlyRent(cfg,purchaseId){
  validPurchaseId(purchaseId);
  const purchase=runScenario(cfg,purchaseId);
  const zero=deepCopy(cfg);zero.subscription.monthlyRent=0;
  const one=deepCopy(cfg);one.subscription.monthlyRent=1;
  const base=runScenario(zero,'subscription').economic.equivalentCost;
  const slope=runScenario(one,'subscription').economic.equivalentCost-base;
  if(!Number.isFinite(slope)||slope<=0)return null;
  const monthlyRent=(purchase.economic.equivalentCost-base)/slope;
  return monthlyRent>=0 && Number.isFinite(monthlyRent)
   ? {purchaseId,monthlyRent,purchaseCost:purchase.economic.equivalentCost,baselineRentalCost:base}
   : null;
 }

 // Preço referência de mercado no mês N, antes de desconto de canal, que empata com aluguel.
 function breakEvenResalePrice(cfg,purchaseId){
  validPurchaseId(purchaseId);
  const target=runScenario(cfg,'subscription').economic.equivalentCost;
  const test0=deepCopy(cfg);
  const test1=deepCopy(cfg);
  test0.vehicle.residualMethod='fixed';test0.vehicle.residualPrice=0;
  test1.vehicle.residualMethod='fixed';test1.vehicle.residualPrice=1;
  const ce0=runScenario(test0,purchaseId).economic.equivalentCost;
  const slope=runScenario(test1,purchaseId).economic.equivalentCost-ce0;
  if(!Number.isFinite(slope)||slope>=-1e-10)return null;
  const requiredReferencePrice=(target-ce0)/slope;
  if(!Number.isFinite(requiredReferencePrice)||requiredReferencePrice<0)return null;
  const channel=purchaseId.endsWith('dealer')?'dealer':'private';
  const discount=channel==='dealer'?cfg.resale.dealerDiscountPct:cfg.resale.privateDiscountPct;
  const fixed=channel==='dealer'?cfg.resale.dealerFixedCosts:cfg.resale.privateFixedCosts;
  return {purchaseId,requiredReferencePrice,requiredNetSale:requiredReferencePrice*(1-discount)-fixed,
   baselineReferencePrice:referenceResalePrice(cfg.vehicle,cfg.horizonMonths),
   rentalCost:target};
 }
 return {PURCHASE_IDS,breakEvenMonthlyRent,breakEvenResalePrice};
});
