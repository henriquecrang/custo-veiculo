(function(){
'use strict';
const defaults=window.CustoVeiculoConfig;
const engine=window.CustoVeiculoEngine;
const equilibrium=window.CustoVeiculoEquilibrium;
const sensitivity=window.CustoVeiculoSensitivity;
const guided=window.CustoVeiculoGuided;
const charts=window.CustoVeiculoCharts;
if(!defaults || !engine)throw new Error('Módulos do simulador ausentes');
const STORAGE_KEY='custo-veiculo-simulacao-v1';
function readSavedState(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  defaults.assertValidConfig(parsed);
  return parsed;
 }catch(error){return null}
}
let state=readSavedState() || defaults.createDefaultConfig();
function saveCurrentState(){
 try{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const status=document.getElementById('saveStatus');
  if(status)status.textContent='Premissas salvas neste navegador';
 }catch(error){
  const status=document.getElementById('saveStatus');
  if(status)status.textContent='Salvamento local indisponível; exporte o JSON';
 }
}
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
  {path:'vehicle.category',label:'Categoria',type:'select',options:[['unknown','Não informado'],['compact','Hatch / compacto'],['sedan','Sedã'],['suv','SUV'],['other','Outro']]},
  {path:'vehicle.condition',label:'Condição do carro comprado',type:'select',options:[['unknown','Não informado'],['new','Zero-quilômetro'],['used','Seminovo / usado']]},
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
  {path:'subscription.category',label:'Categoria da assinatura',type:'select',options:[['unknown','Não informado'],['compact','Hatch / compacto'],['sedan','Sedã'],['suv','SUV'],['other','Outro']]},
  {path:'subscription.condition',label:'Condição do veículo alugado',type:'select',options:[['unknown','Não informado'],['new','Zero-quilômetro'],['used','Seminovo / usado']]},
  {path:'subscription.contractMonths',label:'Prazo contratual declarado',unit:'meses',step:1,help:'Informativo: o motor sempre simula pagamentos por todo o horizonte. Se forem diferentes, reveja renovações e multas.'},
  {path:'subscription.equivalenceConfirmed',label:'Confirmei veículos equivalentes',type:'select',bool:true,options:[['false','Não — ainda não conferi'],['true','Sim — conferi itens e coberturas']],wide:true,help:'Só marque Sim após verificar proposta, características e cobertura. Condição/categoria/prazo divergentes continuam sinalizados.'},
  {path:'subscription.monthlyRent',label:'Mensalidade de locação',unit:'R$',prefix:true,step:100},
  {path:'subscription.paymentTiming',label:'Vencimento mensal',type:'select',options:[['end','Fim do mês'],['start','Início do mês']]},
  {path:'subscription.upfrontCosts',label:'Adesão/taxas iniciais',unit:'R$',prefix:true,step:100},
  {path:'subscription.deposit',label:'Caução',unit:'R$',prefix:true,step:100},
  {path:'subscription.refundedDepositPct',label:'Caução devolvida',unit:'%',pct:true,step:5},
  {path:'subscription.monthlyExtras',label:'Extras mensais certos',unit:'R$',prefix:true,step:50},
  {path:'subscription.endCosts',label:'Custos de devolução',unit:'R$',prefix:true,step:100}
 ]}
];
function get(path){
 const value=path.split('.').reduce((x,k)=>x?.[k],state);
 if(value!==undefined)return value;
 const standard=defaults.createDefaultConfig();
 return path==='subscription.contractMonths'?'':path.split('.').reduce((x,k)=>x?.[k],standard);
}
function set(path,value){const keys=path.split('.');let x=state;for(const k of keys.slice(0,-1))x=x[k];x[keys[keys.length-1]]=value}
function el(id){return document.getElementById(id)}
function fieldMarkup(field){
 const v=get(field.path);
 const ev=state.evidence?.[field.path];
 const sourceNames={'hypothesis':'Hipótese ilustrativa','official':'Fonte oficial','quote':'Proposta comercial','user-input':'Informado por você','derived':'Derivado','unknown':'Não informado'};
 const sourceText=ev?((sourceNames[ev.kind]||'Origem não definida')+(ev.asOf?' · '+ev.asOf:'')+(ev.note?' · '+ev.note:'')):'Origem não documentada · confirme antes da decisão';
 const value=field.pct ? (v*100) : v;
 const input=field.type==='select'
  ? '<select data-path="'+field.path+'">'+field.options.map(([key,label])=>'<option value="'+key+'" '+(String(v)===key?'selected':'')+'>'+label+'</option>').join('')+'</select>'
  : '<input data-path="'+field.path+'" type="'+(field.type==='text'?'text':'number')+'" '+(field.type==='text'?'':'step="'+(field.step||1)+'"')+' value="'+String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')+'">';
 return '<label class="field '+(field.wide?'wide':'')+'"><span class="field-label">'+field.label+'</span><span class="control">'+
  (field.prefix?'<span class="unit prefix">'+field.unit+'</span>':'')+input+
  (!field.prefix&&field.unit?'<span class="unit">'+field.unit+'</span>':'')+'</span>'+
  (field.help?'<span class="helper">'+field.help+'</span>':'')+'<span class="source-note">'+escapeCell(sourceText)+'</span></label>';
}
function renderForm(){
 el('inputSections').innerHTML=groups.map((g,i)=>'<details class="config-section" '+(i<2?'open':'')+'><summary>'+g.title+'</summary><div class="config-fields">'+g.fields.map(fieldMarkup).join('')+'</div></details>').join('');
 el('scenarioSelector').innerHTML='<h3>Estratégias comparadas</h3>'+defaults.SCENARIOS.map(id=>
  '<label class="strategy-option"><input type="checkbox" data-strategy="'+id+'" '+(state.selectedScenarioIds.includes(id)?'checked':'')+'><span>'+scenarioNames[id]+'</span></label>'
 ).join('');
}
let lastComparison=null;
let auditedScenario=null;
function escapeCell(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function renderAudit(comp){
 const chosen=comp.results.find(x=>x.id===auditedScenario)||comp.results[0];
 auditedScenario=chosen.id;
 const e=chosen.economic;
 const selector='<label class="audit-selector">Estratégia <select id="auditScenario">'+comp.results.map(s=>'<option value="'+s.id+'" '+(s.id===auditedScenario?'selected':'')+'>'+scenarioNames[s.id]+'</option>').join('')+'</select></label>';
 const rows=e.timeline.map(row=>{
  const descriptions=row.events.map(v=>escapeCell(v.description)+': '+money(v.amount)).join('; ')||'—';
  return '<tr><td>'+row.month+'</td><td title="'+descriptions+'">'+row.events.length+' evento(s)</td><td>'+money(row.cashFlow)+'</td><td>'+money(row.cumulativeCashFlow)+'</td><td>'+money(row.opportunityCost)+'</td><td>'+money(row.equivalentCost)+'</td></tr>';
 }).join('');
 el('auditPanel').innerHTML=selector+'<div class="table-scroll"><table class="audit-table"><thead><tr><th>Mês</th><th>Lançamentos</th><th>Caixa líquido</th><th>Caixa acumulado</th><th>Oportunidade</th><th>Custo equivalente</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><th>Total</th><td></td><td>'+money(-e.nominalCost)+'</td><td></td><td>'+money(e.opportunityCost)+'</td><td>'+money(e.equivalentCost)+'</td></tr></tfoot></table></div>'+
 '<details class="events-expand"><summary>Ver todos os lançamentos individuais ('+e.contributions.length+')</summary><div class="table-scroll"><table class="audit-table"><thead><tr><th>Mês</th><th>Categoria</th><th>Descrição</th><th>Fluxo de caixa</th><th>Custo equivalente</th><th>Oportunidade</th></tr></thead><tbody>'+
 e.contributions.map(c=>'<tr><td>'+c.month+'</td><td>'+escapeCell(c.category)+'</td><td>'+escapeCell(c.description)+'</td><td>'+money(c.amount)+'</td><td>'+money(c.equivalentCost)+'</td><td>'+money(c.opportunityCost)+'</td></tr>').join('')+
 '</tbody></table></div></details>';
}
function renderCharts(comp){
 if(!charts)return;
 el("comparisonChart").innerHTML=charts.makeBars(comp.results,scenarioNames);
 const selected=comp.results.find(x=>x.id===auditedScenario)||comp.results[0];
 el("timelineChart").innerHTML=charts.makeTimeline(selected);
}

function renderSensitivity(cfg){
 if(!sensitivity)return;
 const data=sensitivity.calculate(cfg);
 const heads=data.resaleFactors.map(f=>'<th scope="col">'+(100*f).toFixed(0)+'%<small>'+money(data.baseResalePrice*f)+'</small></th>').join('');
 const rows=data.rows.map((row,r)=>'<tr><th scope="row">'+(100*row.rentFactor).toFixed(0)+'%<small>'+money(data.baseMonthlyRent*row.rentFactor)+'/mês</small></th>'+
 row.cells.map((cell,c)=>{
  const isBase=r===2&&c===2;
  const label=scenarioNames[cell.winnerId]||cell.winnerId;
  return '<td class="'+(isBase?'sensitivity-base':'')+'" title="'+escapeCell('Vencedor: '+label+'; custo equivalente '+money(cell.cost))+'">'+
   '<span class="sensitivity-winner">'+escapeCell(label)+'</span><small>'+money(cell.cost)+'</small></td>';
 }).join('')+'</tr>').join('');
 el('sensitivityPanel').innerHTML='<div class="table-scroll"><table class="sensitivity-table"><caption>Vencedor financeiro por hipótese. Colunas: preço de revenda de referência; linhas: mensalidade do aluguel. 100% é o cenário atual. Os valores menores de custo são preferíveis.</caption><thead><tr><th scope="col">Aluguel \\ Revenda</th>'+heads+'</tr></thead><tbody>'+rows+'</tbody></table></div><p class="chart-note">A grade considera todas as estratégias selecionadas. Não representa probabilidade dos preços; altere os valores-base nos campos acima para estudar outras hipóteses.</p>';
}

function renderBreakEven(cfg,comp){
 if(!comp.results.some(x=>x.id==='subscription')){el('breakEvenPanel').innerHTML='';return}
 const purchases=comp.results.filter(x=>x.id!=='subscription');
 if(!purchases.length){el('breakEvenPanel').innerHTML='';return}
 const rows=purchases.map(x=>{
  const rental=equilibrium.breakEvenMonthlyRent(cfg,x.id);
  const sale=equilibrium.breakEvenResalePrice(cfg,x.id);
  return '<tr><td>'+scenarioNames[x.id]+'</td><td>'+(rental?money(rental.monthlyRent):'Sem solução')+'</td><td>'+(sale?money(sale.requiredReferencePrice):'Sem solução')+'</td></tr>';
 }).join('');
 el('breakEvenPanel').innerHTML='<section class="equilibrium-panel"><span class="eyebrow">04 · PONTOS DE EQUILÍBRIO</span><h3>Quando a decisão muda?</h3><p>Aluguel mensal que empata com a compra e preço referência de revenda que empata com o aluguel configurado. Mesmo horizonte e oportunidade financeira.</p><div class="table-scroll"><table class="audit-table"><thead><tr><th>Estratégia de compra</th><th>Aluguel de equilíbrio/mês</th><th>Revenda referência de equilíbrio</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
}
function renderResults(){
 const err=defaults.validateConfig(state);
 const errors=el('errors');
 if(err.length){errors.hidden=false;errors.textContent='Corrija as premissas:\n'+err.join('\n');return}
 errors.hidden=true;
 saveCurrentState();
 const result=engine.compareScenarios(state);
 lastComparison=result;
 const index=Object.fromEntries(result.results.map(x=>[x.id,x]));
 const winner=index[result.leastCostScenarioId];
 const runner=result.rankedScenarioIds[1] ? index[result.rankedScenarioIds[1]] : null;
 el('resultSummary').innerHTML='<div class="summary"><span class="eyebrow">'+((result.comparability?.status==='mismatch'||result.comparability?.status==='unverified')?'MENOR CUSTO SIMULADO · EQUIVALÊNCIA NÃO CONFIRMADA':'MENOR CUSTO ECONÔMICO')+'</span><div class="big">'+scenarioNames[winner.id]+'</div><p>Considerando '+state.horizonMonths+' meses e taxa alternativa de '+percent(state.economics.opportunityAnnualNet)+' líquida a.a.</p><div class="stats"><div><small>Total equivalente</small><strong>'+money(winner.economic.equivalentCost)+'</strong></div><div><small>Mensal equivalente</small><strong>'+money(winner.economic.monthlyEquivalent)+'</strong></div>'+(runner?'<div><small>Diferença para o 2º</small><strong>'+money(runner.economic.equivalentCost-winner.economic.equivalentCost)+'</strong></div>':'')+'</div></div>';
 el('resultCards').innerHTML=result.results.map(s=>{
  const e=s.economic;
  const financial=s.loan ? '<span>Parcela inicial: '+money(s.loan.schedule.rows[1].payment)+'</span><span>Saldo para quitar: '+money(s.debtSettlement.remainingPrincipal)+'</span>' : '';
  const sale=s.sale ? '<span>Revenda líquida: '+money(s.sale.netProceeds)+'</span><span>Disponível após quitar: '+money(s.terminalNetFromSale)+'</span>' : '';
  return '<article class="result-card '+(s.id===winner.id?'best':'')+'"><div class="top"><div><div class="name">'+scenarioNames[s.id]+'</div>'+(s.id===winner.id?'<div class="best-tag">MENOR CUSTO</div>':'')+'</div><div class="total">'+money(e.equivalentCost)+'</div></div>'+
  '<div class="meta"><span>Mensal equivalente: '+money(e.monthlyEquivalent)+'</span><span>Desembolso líquido nominal: '+money(e.nominalCost)+'</span><span>Custo de oportunidade: '+money(e.opportunityCost)+'</span></div>'+
  '<div class="result-details"><span>Disponibilidade modelada: <strong>'+state.horizonMonths+' meses</strong></span>'+(s.id==='subscription'?'<span>Prazo de assinatura declarado: <strong>'+((state.subscription.contractMonths??null)===null?'não informado':state.subscription.contractMonths+' meses')+'</strong></span>':'')+'<span>Capital de caixa máximo exigido: <strong>'+money(e.maxCapitalNeed)+'</strong></span><span>Saída no início: <strong>'+money(s.acquisitionCash)+'</strong></span>'+financial+sale+'</div>'+
  '</article>';
 }).join('');
 el('resultWarnings').innerHTML=result.warnings.length?'<div class="warning-panel"><strong>Atenção à comparabilidade:</strong><ul>'+result.warnings.map(x=>'<li>'+escapeCell(x)+'</li>').join('')+'</ul><p>Todos os cenários simulados fornecem veículo por '+state.horizonMonths+' meses. Isso não garante que o contrato de assinatura permita essa duração; verifique a proposta.</p></div>':'';
 renderAudit(result);
 renderCharts(result);
 renderBreakEven(state,result);
 renderSensitivity(state);
}
function handleEditor(evt){
 const control=evt.target.closest('[data-path]');
 if(!control)return;
 const descriptor=groups.flatMap(g=>g.fields).find(f=>f.path===control.dataset.path);
 if(!descriptor)return;
 const v=descriptor.type==='text'||descriptor.type==='select'
  ? (descriptor.bool?control.value==='true':control.value) : (control.value.trim()===''?NaN:Number(control.value)/(descriptor.pct?100:1));
 set(descriptor.path,v);
 state.evidence??={};
 state.evidence[descriptor.path]={kind:'user-input',asOf:new Date().toISOString().slice(0,10),note:'Valor editado no simulador'};
 const note=control.closest('.field')?.querySelector('.source-note');
 if(note)note.textContent='Informado por você · '+state.evidence[descriptor.path].asOf+' · Valor editado no simulador';
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
el('auditPanel').addEventListener('change',event=>{
 if(event.target.id==='auditScenario' && lastComparison){
  auditedScenario=event.target.value;
  renderAudit(lastComparison);
  renderCharts(lastComparison);
 }
});
el('downloadCsv').addEventListener('click',()=>{
 if(!lastComparison)return;
 const s=lastComparison.results.find(x=>x.id===auditedScenario)||lastComparison.results[0];
 const q=x=>'"'+String(x).replace(/"/g,'""')+'"';
 const rows=[['mes','categoria','descricao','fluxo_caixa','custo_nominal','custo_equivalente','oportunidade']];
 for(const c of s.economic.contributions)
  rows.push([c.month,c.category,c.description,c.amount,c.nominalCost,c.equivalentCost,c.opportunityCost]);
 const text=rows.map(row=>row.map(q).join(',')).join(String.fromCharCode(10));
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='custo-veiculo-memoria-'+s.id+'.csv';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),0);
});
el('restoreButton').addEventListener('click',()=>{
 if(!window.confirm('Restaurar as premissas ilustrativas? Baixe um JSON antes se quiser preservar sua simulação.')) return;
 state=defaults.createDefaultConfig();
 renderForm();renderResults();
});
el('exportButton').addEventListener('click',()=>{
 if(defaults.validateConfig(state).length){window.alert('Corrija os campos inválidos antes de exportar.');return}
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;
 link.download='custo-veiculo-simulacao.json';
 document.body.appendChild(link);
 link.click();
 link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),0);
});
el('importButton').addEventListener('click',()=>el('importFile').click());
el('importFile').addEventListener('change',async event=>{
 const file=event.target.files?.[0];
 if(!file)return;
 try{
  const candidate=JSON.parse(await file.text());
  defaults.assertValidConfig(candidate);
  if(!window.confirm('Substituir a simulação atual pelo JSON importado? Faça um backup se necessário.'))return;
  // Um input editado pode emitir "change" ao perder o foco quando renderForm()
  // substitui seus nós. Consuma esse evento ANTES de aplicar o JSON importado,
  // evitando que a edição antiga sobrescreva a simulação recém-carregada.
  const active=document.activeElement;
  if(active?.closest?.('#inputSections'))active.blur();
  const previous=state;
  state=candidate;
  // Commitir o estado validado ANTES de reconstruir os campos. A atualização
  // visual posterior não deve impedir a persistência da importação.
  saveCurrentState();
  try {
   renderForm();renderResults();
   const status=el('saveStatus');
   if(status)status.textContent='Simulação importada e salva neste navegador';
  } catch(renderError) {
   state=previous;
   saveCurrentState();
   renderForm();renderResults();
   throw renderError;
  }
 }catch(error){
  const errors=el('errors');
  errors.hidden=false;
  errors.textContent='Não foi possível importar: '+error.message;
 }finally{
  event.target.value='';
 }
});

let guidedDraft=null;
let guidedStep=0;
function renderGuided(){
 if(!guidedDraft||!guided)return;
 const questions=guided.questions(guidedDraft),review=guidedStep>=questions.length;
 const error=el('guidedError');error.hidden=true;error.textContent='';
 el('guidedProgress').textContent=review?'Revisão final':'Pergunta '+(guidedStep+1)+' de '+questions.length;
 el('guidedBack').disabled=guidedStep===0;
 el('guidedNext').textContent=review?'Criar simulação':'Continuar';
 if(review){
  el('guidedTitle').textContent='Revisar escolhas';
  el('guidedBody').innerHTML='<p>Estas escolhas vão gerar uma nova simulação a partir de referências ilustrativas. Revise taxas, contratos e custos detalhados no editor avançado.</p><div class="guided-review">'+questions.map((q,i)=>{
   const value=guided.displayValue(guidedDraft,q);
   const formatted=q.type==='select'?(q.options.find(v=>v.value===value)?.label||value):String(value)+(q.unit?' '+q.unit:'');
   return '<button type="button" class="guided-review-row" data-guided-edit="'+i+'"><span>'+escapeCell(q.label)+'</span><strong>'+escapeCell(formatted)+'</strong></button>';
  }).join('')+'</div>';
  return;
 }
 const q=questions[guidedStep];
 el('guidedTitle').textContent=q.label;
 const current=guided.displayValue(guidedDraft,q);
 const ctrl=q.type==='select'
  ?'<select id="guidedAnswer">'+q.options.map(x=>'<option value="'+escapeCell(x.value)+'"'+(x.value===current?' selected':'')+'>'+escapeCell(x.label)+'</option>').join('')+'</select>'
  :'<input id="guidedAnswer" type="'+(q.type==='text'?'text':'number')+'" value="'+escapeCell(current)+'"'+(q.type==='number'?' min="'+(q.min??0)+'"'+(q.max!==undefined?' max="'+q.max+'"':'')+' step="'+(q.step||1)+'"':'')+' aria-label="'+escapeCell(q.label)+'">';
 el('guidedBody').innerHTML='<div class="guided-question"><label for="guidedAnswer">'+escapeCell(q.label)+'</label>'+ctrl+(q.unit?'<span class="guided-unit">'+escapeCell(q.unit)+'</span>':'')+(q.help?'<p class="helper">'+escapeCell(q.help)+'</p>':'')+'</div>';
 el('guidedAnswer')?.focus();
}
function guidedAdvance(){
 if(!guidedDraft)return;
 const questions=guided.questions(guidedDraft);
 const err=el('guidedError');
 if(guidedStep>=questions.length){
  try{
   const next=guided.buildConfig(guidedDraft);
   state=next;
   renderForm();renderResults();
   el('guidedDialog').close();
   guidedDraft=null;
  }catch(e){err.hidden=false;err.textContent=e.message;}
  return;
 }
 try{
  const input=el('guidedAnswer');
  const newDraft=guided.setAnswer(guidedDraft,questions[guidedStep],input.value);
  guidedDraft=newDraft;
  guidedStep=Math.min(guidedStep+1,guided.questions(guidedDraft).length);
  renderGuided();
 }catch(e){err.hidden=false;err.textContent=e.message}
}
el('openGuidedSetup').addEventListener('click',()=>{
 if(!guided){window.alert('Assistente indisponível');return}
 guidedDraft=guided.createDraft();
 guidedStep=0;
 el('guidedDialog').showModal();
 renderGuided();
});
el('guidedClose').addEventListener('click',()=>el('guidedDialog').close());
el('guidedDialog').addEventListener('close',()=>{guidedDraft=null;guidedStep=0});
el('guidedBack').addEventListener('click',()=>{if(guidedDraft){guidedStep=Math.max(0,guidedStep-1);renderGuided()}});
el('guidedNext').addEventListener('click',guidedAdvance);
el('guidedBackup').addEventListener('click',()=>el('exportButton').click());
el('guidedBody').addEventListener('click',e=>{
 const button=e.target.closest('[data-guided-edit]');
 if(!button||!guidedDraft)return;
 guidedStep=Number(button.dataset.guidedEdit);
 renderGuided();
});
el('guidedBody').addEventListener('keydown',e=>{
 if(e.key==='Enter'&&e.target.id==='guidedAnswer'&&e.target.tagName!=='TEXTAREA'){
  e.preventDefault();guidedAdvance();
 }
});

renderForm();renderResults();
})();
