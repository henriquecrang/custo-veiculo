'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const guided=require('../guided-setup.js');
const model=require('../model/config.js');
const engine=require('../model/scenario-engine.js');

function answer(draft,id,value){
 const q=guided.questions(draft).find(x=>x.id===id);
 assert.ok(q,'Pergunta não encontrada: '+id);
 return guided.setAnswer(draft,q,value);
}
test('wizard é rascunho isolado e não modifica defaults',()=>{
 const a=model.createDefaultConfig(),before=JSON.stringify(a);
 let draft=guided.createDraft();
 draft=answer(draft,'price',85000);
 assert.equal(JSON.stringify(a),before);
 assert.equal(draft.config.vehicle.price,85000);
 assert.equal(model.createDefaultConfig().vehicle.price,80000);
});
test('ramos por modalidade geram apenas estratégias compatíveis',()=>{
 const cases={
  compare:5,cash:2,loan:2,subscription:1
 };
 for(const [mode,count] of Object.entries(cases)){
  let draft=guided.createDraft();
  draft=answer(draft,'mode',mode);
  const qs=guided.questions(draft);
  assert.equal(qs.some(x=>x.id==='price'),mode!=='subscription');
  assert.equal(qs.some(x=>x.id==='monthlyRent'),['subscription','compare'].includes(mode));
  assert.equal(qs.some(x=>x.id==='downPayment'),['loan','compare'].includes(mode));
  const cfg=guided.buildConfig(draft);
  assert.equal(cfg.selectedScenarioIds.length,count);
  assert.equal(engine.compareScenarios(cfg).results.length,count);
 }
});
test('edição de percentual em pontos percentuais e zero km',()=>{
 let draft=guided.createDraft();
 draft=answer(draft,'interest',1.96);
 draft=answer(draft,'opportunity',11.26);
 draft=answer(draft,'kilometers',0);
 assert.ok(Math.abs(draft.config.financing.monthlyInterestRate-.0196)<1e-12);
 assert.ok(Math.abs(draft.config.economics.opportunityAnnualNet-.1126)<1e-12);
 assert.equal(draft.config.ownership.kmPerMonth,0);
 assert.equal(guided.validateDraft(draft).length,0);
});
test('validação impede números inválidos, nome vazio e entrada acima do carro',()=>{
 let draft=guided.createDraft();
 assert.throws(()=>answer(draft,'price',''),/Valor fora/);
 assert.throws(()=>answer(draft,'price',-2),/Valor fora/);
 assert.throws(()=>answer(draft,'mode','desconhecido'),/Modalidade/);
 assert.throws(()=>answer(draft,'vehicleName','  '),/Preencha/);
 draft=answer(draft,'price',10000);
 assert.ok(guided.validateDraft(draft).length>0);
 draft=answer(draft,'downPayment',2000);
 assert.equal(guided.validateDraft(draft).length,0);
});