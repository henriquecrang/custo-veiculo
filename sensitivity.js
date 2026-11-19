(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./model/scenario-engine.js'):root.CustoVeiculoEngine,
  typeof module==='object'&&module.exports?require('./model/resale.js'):root.CustoVeiculoResale
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CustoVeiculoSensitivity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(engine,resale){
 'use strict';
 const factors=Object.freeze([.8,.9,1,1.1,1.2]);
 function calculate(cfg,resaleFactors=factors,rentFactors=factors){
   const baseline=engine.compareScenarios(cfg);
   const basePrice=resale.referenceResalePrice(cfg.vehicle,cfg.horizonMonths);
   if(!Array.isArray(resaleFactors)||!Array.isArray(rentFactors)||!resaleFactors.length||!rentFactors.length)throw new Error('Fatores obrigatórios');
   if([...resaleFactors,...rentFactors].some(x=>!Number.isFinite(x)||x<0))throw new Error('Fator inválido');
   const rows=rentFactors.map(rentFactor=>({
     rentFactor,
     cells:resaleFactors.map(resaleFactor=>{
       const next=structuredClone(cfg);
       next.vehicle.residualMethod='fixed';
       next.vehicle.residualPrice=basePrice*resaleFactor;
       next.subscription.monthlyRent=cfg.subscription.monthlyRent*rentFactor;
       const result=engine.compareScenarios(next);
       const winner=result.results.find(x=>x.id===result.leastCostScenarioId);
       const second=result.results.filter(x=>x!==winner).sort((a,b)=>a.economic.equivalentCost-b.economic.equivalentCost)[0]||null;
       return {
         resaleFactor,rentFactor,resalePrice:next.vehicle.residualPrice,monthlyRent:next.subscription.monthlyRent,
         winnerId:winner.id,cost:winner.economic.equivalentCost,
         margin:second?second.economic.equivalentCost-winner.economic.equivalentCost:null,
         scenarios:result.results.map(x=>({id:x.id,cost:x.economic.equivalentCost}))
       };
     })
   }));
   return {baseResalePrice:basePrice,baseMonthlyRent:cfg.subscription.monthlyRent,resaleFactors:[...resaleFactors],rentFactors:[...rentFactors],rows,
     baselineWinnerId:baseline.leastCostScenarioId};
 }
 return {calculate,defaultFactors:factors};
});