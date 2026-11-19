(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./model/config.js'):root.CustoVeiculoConfig);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.CustoVeiculoGuided=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
 'use strict';
 const MODES=Object.freeze([
  {value:'compare',label:'Comparar todas as alternativas'},
  {value:'cash',label:'Comprar à vista (particular × loja)'},
  {value:'loan',label:'Financiar (particular × loja)'},
  {value:'subscription',label:'Assinatura de carro'}
 ]);
 const BUY=['cash','loan','compare'],LOAN=['loan','compare'],RENT=['subscription','compare'];
 const choices=Object.freeze([
  {id:'mode',label:'O que você quer comparar?',type:'select',options:MODES,help:'Todas as estratégias poderão ser ligadas novamente no editor avançado.'},
  {id:'horizon',path:'horizonMonths',label:'Por quantos meses você quer comparar?',type:'number',unit:'meses',min:1,max:60,step:1},
  {id:'vehicleName',path:'vehicle.name',label:'Qual carro você considera comprar?',type:'text',when:BUY,help:'O nome serve para identificar o carro. Pode ser um seminovo hipotético.'},
  {id:'price',path:'vehicle.price',label:'Quanto custa o veículo?',type:'number',unit:'R$',min:1,step:1000,when:BUY},
  {id:'downPayment',path:'financing.downPayment',label:'Quanto pretende dar de entrada?',type:'number',unit:'R$',min:0,step:1000,when:LOAN},
  {id:'term',path:'financing.termMonths',label:'Em quantos meses financiar?',type:'number',unit:'meses',min:1,max:600,step:1,when:LOAN},
  {id:'interest',path:'financing.monthlyInterestRate',label:'Qual a taxa de juros mensal?',type:'number',unit:'% ao mês',pct:true,min:0,max:200,step:.01,when:LOAN,help:'Informe juros da proposta; IOF e custos bancários são editados depois.'},
  {id:'residual',path:'vehicle.residualPrice',label:'Por quanto estima revender o carro ao final?',type:'number',unit:'R$',min:0,step:1000,when:BUY,help:'Premissa de revenda particular antes de taxas e descontos.'},
  {id:'dealerDiscount',path:'resale.dealerDiscountPct',label:'Qual desconto estima na venda para loja?',type:'number',unit:'%',pct:true,min:0,max:100,step:1,when:BUY},
  {id:'subscriptionName',path:'subscription.vehicleName',label:'Qual carro seria alugado?',type:'text',when:RENT,help:'Nomeie o veículo para identificar diferenças em relação ao carro comprado.'},
  {id:'monthlyRent',path:'subscription.monthlyRent',label:'Qual o valor da mensalidade de assinatura?',type:'number',unit:'R$/mês',min:0,step:100,when:RENT},
  {id:'opportunity',path:'economics.opportunityAnnualNet',label:'Quanto renderia seu dinheiro em outra aplicação?',type:'number',unit:'% líquido ao ano',pct:true,min:0,max:10000,step:.1,help:'A mesma rentabilidade alternativa será aplicada às parcelas de todos os cenários.'},
  {id:'kilometers',path:'ownership.kmPerMonth',label:'Quantos quilômetros pretende dirigir por mês?',type:'number',unit:'km/mês',min:0,step:100,help:'Zero simula o carro parado: mantém despesas de propriedade por tempo.'}
 ]);
 function createDraft(){
  const config=model.createDefaultConfig();
  return {mode:'compare',config};
 }
 function questions(draft){
  return choices.filter(x=>!x.when||x.when.includes(draft.mode));
 }
 function getAnswer(draft,question){
  if(question.id==='mode')return draft.mode;
  return question.path.split('.').reduce((v,k)=>v?.[k],draft.config);
 }
 function displayValue(draft,question){
  const v=getAnswer(draft,question);
  return question.pct ? v*100:v;
 }
 function setAnswer(draft,question,raw){
  const next=structuredClone(draft);
  if(question.id==='mode'){
   if(!MODES.some(x=>x.value===raw))throw new Error('Modalidade desconhecida');
   next.mode=raw;
   return next;
  }
  const parsed=question.type==='text'?String(raw).trim():Number(raw);
  if(question.type==='number' && (raw===''||!Number.isFinite(parsed)||parsed<(question.min??0)||parsed>(question.max??Number.MAX_VALUE)||((question.step===1)&&!Number.isInteger(parsed))))throw new Error('Valor fora do intervalo permitido');
  if(question.type==='text'&&!parsed)throw new Error('Preencha o nome');
  const result=question.pct?parsed/100:parsed;
  const path=question.path.split('.');
  let target=next.config;
  for(const key of path.slice(0,-1))target=target[key];
  target[path.at(-1)]=result;
  return next;
 }
 function buildConfig(draft){
  const cfg=structuredClone(draft.config);
  const ids={
   compare:['cash-private','cash-dealer','loan-private','loan-dealer','subscription'],
   cash:['cash-private','cash-dealer'],
   loan:['loan-private','loan-dealer'],
   subscription:['subscription']
  };
  cfg.selectedScenarioIds=ids[draft.mode];
  cfg.name='Simulação guiada — '+draft.mode+' — '+cfg.horizonMonths+' meses';
  if(BUY.includes(draft.mode))cfg.vehicle.residualMethod='fixed';
  model.assertValidConfig(cfg);
  return cfg;
 }
 function validateDraft(draft){
  const errors=[];
  try{buildConfig(draft)}catch(e){errors.push(e.message)}
  return errors;
 }
 return {MODES,createDraft,questions,getAnswer,displayValue,setAnswer,buildConfig,validateDraft};
});