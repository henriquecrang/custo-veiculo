(function(){
'use strict';
const defaults=window.CustoVeiculoConfig;
const engine=window.CustoVeiculoEngine;
if(!defaults || !engine)throw new Error('Módulos do simulador ausentes');
let state=defaults.createDefaultConfig();
const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const money=x=>BRL.format(x);
const percent=x=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(100*x)+'%';
const scenarioNames={
  'cash-private':'Comprar à vista → particular',
  'cash-dealer':'Comprar à vista → loja',
  'loan-private':'Financiar → particular',
  'loan-dealer':'Financiar → loja',
  subscription:'Assinatura de veículo'
};
const groups=[
 {title:'Dados gerais e oportunidade',fields:[
  {path:'horizonMonths',label:'Período de análise',unit:'meses',step:1},
  {path:'economics.opportunityAnnualNet',label:'Rendimento alternativo líquido',unit:'% a.a.',pct:true,step:.1,help:'Aplicado igualmente a todos os pagamentos, inclusive assinatura.'},
  {path:'economics.inflationAnnual',label:'Inflação (referência)',unit:'% a.a.',pct:true,step:.1,help:'Ainda não usada na comparação nominal.'}
 ]},
 {title:'Veículo e compra',fields:[
  {path:'vehicle.name',label:'Veículo adquirido',type:'text',wide:true},
  {path:'vehicle.price',label:'Preço de compra',unit:'R$',prefix:true,step:1000},
  {path:'vehicle.ageYears',label:'Idade aproximada',unit:'anos',step:1},
  {path:'vehicle.residualMethod',label:'Projeção de revenda',type:'select',options:[['fixed','Valor informado'],['annual-rate','Depreciação anual']],wide:true},
  {path:'vehicle.residualPrice',label:'Valor de revenda previsto',unit:'R$',prefix:true,step:1000},
  {path:'vehicle.annualDepreciationRate',label:'Depreciação anual',unit:'% a.a.',pct:true,step:.5},
  {path:'purchase.initialCosts',label:'Taxas de compra/vistoria',unit:'R$',prefix:true,step:100,help:'Não duplicar licenciamento ou despesas bancárias.'}
 ]},
 {title:'Financiamento e taxas',fields:[
  {path:'financing.downPayment',label:'Entrada',unit:'R$',prefix:true,step:1000},
  {path:'financing.termMonths',label:'Prazo do financiamento',unit:'meses',step:1},
  {path:'financing.monthlyInterestRate',label:'Juros mensais',unit:'% a.m.',pct:true,step:.01},
  {path:'financing.amortization',label:'Sistema',type:'select',options:[['price','Price'],['sac','SAC']]},
  {path:'financing.financedCosts',label:'Taxas financiadas',unit:'R$',prefix:true,step:100},
  {path:'financing.upfrontCosts',label:'Taxas à vista do banco',unit:'R$',prefix:true,step:100},
  {path:'financing.iof.amount',label:'IOF manual estimado',unit:'R$',prefix:true,step:100,help:'Padrão zero significa não informado, não isenção. O modo proxy está disponível no modelo.'},
  {path:'financing.payoffCosts',label:'Baixa e quitação antecipada',unit:'R$',prefix:true,step:100}
 ]},
 {title:'Posse, seguro e despesas',fields:[
  {path:'ownership.ipvaAnnual',label:'IPVA anual',unit:'R$',prefix:true,step:100},
  {path:'ownership.insuranceAnnual',label:'Seguro anual',unit:'R$',prefix:true,step:100},
  {path:'ownership.licensingAnnual',label:'Licenciamento anual',unit:'R$',prefix:true,step:100},
  {path:'ownership.maintenanceMonthly',label:'Manutenção mensal por tempo',unit:'R$',prefix:true,step:25},
  {path:'ownership.garageMonthly',label:'Garagem mensal',unit:'R$',prefix:true,step:50},
  {path:'ownership.kmPerMonth',label:'Quilometragem',unit:'km/mês',step:100},
  {path:'ownership.costPerKm',label:'Custo variável por km',unit:'R$/km',step:.05}
 ]},
 {title:'Revenda e custos de saída',fields:[
  {path:'resale.privateDiscountPct',label:'Desconto extra particular',unit:'%',pct:true,step:1},
  {path:'resale.privateFixedCosts',label:'Anúncios/custos particular',unit:'R$',prefix:true,step:100},
  {path:'resale.dealerDiscountPct',label:'Desconto adicional loja',unit:'%',pct:true,step:1},
  {path:'resale.dealerFixedCosts',label:'Custos adicionais loja',unit:'R$',prefix:true,step:100}
 ]},
 {title:'Assinatura / locação',fields:[
  {path:'subscription.vehicleName',label:'Veículo ofertado por assinatura',type:'text',wide:true},
  {path:'subscription.monthlyRent',label:'Mensalidade de locação',unit:'R$',prefix:true,step:100},
  {path:'subscription.paymentTiming',label:'Vencimento mensal',type:'select',options:[['end','Fim do mês'],['start','Início do mês']]},
  {path:'subscription.upfrontCosts',label:'Adesão/taxas iniciais',unit:'R$',prefix:true,step:100},
  {path:'subscription.deposit',label:'Caução',unit:'R$',prefix:true,step:100},
  {path:'subscription.refundedDepositPct',label:'Caução devolvida',unit:'%',pct:true,step:5},
  {path:'subscription.monthlyExtras',label:'Extras mensais certos',unit:'R$',prefix:true,step:50},
  {path:'subscription.endCosts',label:'Custos de devolução',unit:'R$',prefix:true,step:100}
 ]}
];
function get(path){return path.split('.').reduce((x,k)=>x?.[k],state)}
function set(path,value){const keys=path.split('.');let x=state;for(const k of keys.slice(0,-1))x=x[k];x[keys[keys.length-1]]=value}
function el(id){return document.getElementById(id)}
function fieldMarkup(field){
 const v=get(field.path);
 const value=field.pct ? (v*100) : v;
 const input=field.type==='select'
  ? '<select data-path="'+field.path+'">'+field.options.map(([key,label])=>'<option value="'+key+'" '+(v===key?'selected':'')+'>'+label+'</option>').join('')+'</select>'
  : '<input data-path="'+field.path+'" type="'+(field.type==='text'?'text':'number')+'" '+(field.type==='text'?'':'step="'+(field.step||1)+'"')+' value="'+String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')+'">';
 return '<label class="field '+(field.wide?'wide':'')+'"><span class="field-label">'+field.label+'</span><span class="control">'+
  (field.prefix?'<span class="unit prefix">'+field.unit+'</span>':'')+input+
  (!field.prefix&&field.unit?'<span class="unit">'+field.unit+'</span>':'')+'</span>'+
  (field.help?'<span class="helper">'+field.help+'</span>':'')+'</label>';
}
function renderForm(){
 el('inputSections').innerHTML=groups.map((g,i)=>'<details class="config-section" '+(i<2?'open':'')+'><summary>'+g.title+'</summary><div class="config-fields">'+g.fields.map(fieldMarkup).join('')+'</div></details>').join('');
 el('scenarioSelector').innerHTML='<h3>Estratégias comparadas</h3>'+defaults.SCENARIOS.map(id=>
  '<label class="strategy-option"><input type="checkbox" data-strategy="'+id+'" '+(state.selectedScenarioIds.includes(id)?'checked':'')+'><span>'+scenarioNames[id]+'</span></label>'
 ).join('');
}
function renderResults(){
 const err=defaults.validateConfig(state);
 const errors=el('errors');
 if(err.length){errors.hidden=false;errors.textContent='Corrija as premissas:\n'+err.join('\n');return}
 errors.hidden=true;
 const result=engine.compareScenarios(state);
 const index=Object.fromEntries(result.results.map(x=>[x.id,x]));
 const winner=index[result.leastCostScenarioId];
 const runner=result.rankedScenarioIds[1] ? index[result.rankedScenarioIds[1]] : null;
 el('resultSummary').innerHTML='<div class="summary"><span class="eyebrow">MENOR CUSTO ECONÔMICO</span><div class="big">'+scenarioNames[winner.id]+'</div><p>Considerando '+state.horizonMonths+' meses e taxa alternativa de '+percent(state.economics.opportunityAnnualNet)+' líquida a.a.</p><div class="stats"><div><small>Total equivalente</small><strong>'+money(winner.economic.equivalentCost)+'</strong></div><div><small>Mensal equivalente</small><strong>'+money(winner.economic.monthlyEquivalent)+'</strong></div>'+(runner?'<div><small>Diferença para o 2º</small><strong>'+money(runner.economic.equivalentCost-winner.economic.equivalentCost)+'</strong></div>':'')+'</div></div>';
 el('resultCards').innerHTML=result.results.map(s=>{
  const e=s.economic;
  const financial=s.loan ? '<span>Parcela inicial: '+money(s.loan.schedule.rows[1].payment)+'</span><span>Saldo para quitar: '+money(s.debtSettlement.remainingPrincipal)+'</span>' : '';
  const sale=s.sale ? '<span>Revenda líquida: '+money(s.sale.netProceeds)+'</span><span>Disponível após quitar: '+money(s.terminalNetFromSale)+'</span>' : '';
  return '<article class="result-card '+(s.id===winner.id?'best':'')+'"><div class="top"><div><div class="name">'+scenarioNames[s.id]+'</div>'+(s.id===winner.id?'<div class="best-tag">MENOR CUSTO</div>':'')+'</div><div class="total">'+money(e.equivalentCost)+'</div></div>'+
  '<div class="meta"><span>Mensal equivalente: '+money(e.monthlyEquivalent)+'</span><span>Desembolso líquido nominal: '+money(e.nominalCost)+'</span><span>Custo de oportunidade: '+money(e.opportunityCost)+'</span></div>'+
  '<div class="result-details"><span>Capital de caixa máximo exigido: <strong>'+money(e.maxCapitalNeed)+'</strong></span><span>Saída no início: <strong>'+money(s.acquisitionCash)+'</strong></span>'+financial+sale+'</div>'+
  '</article>';
 }).join('');
 el('resultWarnings').innerHTML=result.warnings.length?'<div class="warning-panel">'+result.warnings.join(' ')+'</div>':'';
}
function handleEditor(evt){
 const control=evt.target.closest('[data-path]');
 if(!control)return;
 const descriptor=groups.flatMap(g=>g.fields).find(f=>f.path===control.dataset.path);
 if(!descriptor)return;
 const v=descriptor.type==='text'||descriptor.type==='select'
  ? control.value : (control.value.trim()===''?NaN:Number(control.value)/(descriptor.pct?100:1));
 set(descriptor.path,v);
 renderResults();
}
el('inputSections').addEventListener('input',handleEditor);
el('inputSections').addEventListener('change',handleEditor);
el('scenarioSelector').addEventListener('change',evt=>{
 const id=evt.target.dataset.strategy;if(!id)return;
 const selected=new Set(state.selectedScenarioIds);
 if(evt.target.checked)selected.add(id);else selected.delete(id);
 state.selectedScenarioIds=defaults.SCENARIOS.filter(x=>selected.has(x));
 renderResults();
});
el('restoreButton').addEventListener('click',()=>{
 state=defaults.createDefaultConfig();
 renderForm();renderResults();
});
renderForm();renderResults();
})();
