(function(root, factory) {
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CustoVeiculoComparability=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const normalize=x=>typeof x==='string'?x.trim().toLocaleLowerCase('pt-BR'):'';
 function assess(cfg,selectedIds){
  const N=cfg.horizonMonths;
  const hasRent=selectedIds.includes('subscription');
  const hasBuy=selectedIds.some(id=>id!=='subscription');
  const purchase={category:cfg.vehicle.category||'unknown',condition:cfg.vehicle.condition||'unknown'};
  const rented={category:cfg.subscription.category||'unknown',condition:cfg.subscription.condition||'unknown'};
  // JSON antigos não tinham prazo informado: assumimos apenas o horizonte modelado;
  // ele NÃO é evidência de prazo contratual confirmado.
  const hasContractTerm=Number.isInteger(cfg.subscription.contractMonths);
  const term=hasContractTerm?cfg.subscription.contractMonths:null;
  const coverage=selectedIds.map(id=>({scenarioId:id,modeledMonths:N,contractMonths:id==='subscription'?term:null}));
  if(!hasRent||!hasBuy){
   return {status:'not-applicable',comparable:null,coverage,warnings:[],confirmed:false};
  }
  const warnings=[],mismatches=[];
  const purchaseName=normalize(cfg.vehicle.name),rentalName=normalize(cfg.subscription.vehicleName);
  if(purchase.category!=='unknown'&&rented.category!=='unknown'&&purchase.category!==rented.category){
   mismatches.push('Categorias diferentes: compra '+purchase.category+' × assinatura '+rented.category+'.');
  } else if(purchase.category==='unknown'||rented.category==='unknown') {
   warnings.push('Categoria de ao menos um veículo não informada; equivalência não verificada.');
  }
  if(purchase.condition!=='unknown'&&rented.condition!=='unknown'&&purchase.condition!==rented.condition){
   mismatches.push('Condições diferentes (zero-quilômetro × seminovo).');
  } else if(purchase.condition==='unknown'||rented.condition==='unknown'){
   warnings.push('Condição novo/seminovo não confirmada para ambos os veículos.');
  }
  if(term!==null&&term!==N){
   mismatches.push('Assinatura declarada para '+term+' meses, mas o motor cobra '+N+' mensalidades; renovações, multas e reajustes não estão estimados.');
  } else if(term===null){
   warnings.push('Prazo contratual da assinatura não informado; o motor assume '+N+' meses de pagamentos e disponibilidade.');
  }
  if(purchaseName!==rentalName){
   warnings.push('Modelos diferentes ou não identificados; compare equipamentos, idade, quilometragem e coberturas.');
  }
  const confirmed=cfg.subscription.equivalenceConfirmed===true;
  const status=mismatches.length?'mismatch':(confirmed?'confirmed':'unverified');
  if(status==='unverified'){
   warnings.unshift('A equivalência entre carro comprado e assinado ainda não foi confirmada.');
  } else if(status==='mismatch'){
   warnings.unshift('A comparação reúne alternativas com diferenças relevantes; o menor custo não representa, sozinho, a melhor escolha.');
  }
  return {
   status,comparable:status==='confirmed',coverage,warnings:[...warnings,...mismatches],
   confirmed,details:{purchase,rented,modeledMonths:N,contractMonths:term}
  };
 }
 return {assess};
});