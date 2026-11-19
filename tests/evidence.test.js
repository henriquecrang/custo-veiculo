'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig,validateConfig}=require('../model/config.js');
const {compareScenarios}=require('../model/scenario-engine.js');
const guided=require('../guided-setup.js');

test('premissas inicialmente evidenciam hipóteses e custos não informados',()=>{
 const cfg=createDefaultConfig();
 assert.equal(cfg.evidence['vehicle.price'].kind,'hypothesis');
 assert.equal(cfg.evidence['financing.iof.amount'].kind,'unknown');
 assert.equal(cfg.evidence['subscription.monthlyRent'].kind,'hypothesis');
 assert.deepEqual(validateConfig(cfg),[]);
});
test('evidência não altera cálculo de nenhum cenário',()=>{
 const cfg=createDefaultConfig();
 const before=compareScenarios(cfg).results.map(x=>x.economic.equivalentCost);
 cfg.evidence['vehicle.price']={kind:'quote',asOf:'2026-11-19',url:'https://example.com/quote',note:'Exemplo'};
 const after=compareScenarios(cfg).results.map(x=>x.economic.equivalentCost);
 assert.deepEqual(after,before);
});
test('JSON v1 legado sem evidence segue importável',()=>{
 const cfg=createDefaultConfig(); delete cfg.evidence;
 assert.deepEqual(validateConfig(cfg),[]);
 assert.doesNotThrow(()=>compareScenarios(cfg));
});
test('metadados inválidos são recusados',()=>{
 const cfg=createDefaultConfig();
 cfg.evidence['vehicle.price']={kind:'promise',asOf:'19/11/2026'};
 assert.ok(validateConfig(cfg).some(x=>x.includes('evidence.vehicle.price')));
 cfg.evidence['vehicle.price']={kind:'official',url:'javascript:alert(1)'};
 assert.ok(validateConfig(cfg).some(x=>x.includes('evidence.vehicle.price')));
});
test('wizard classifica somente valores respondidos como entrada do usuário',()=>{
 let draft=guided.createDraft();
 const q=guided.questions(draft).find(x=>x.id==='price');
 draft=guided.setAnswer(draft,q,83000);
 assert.equal(draft.config.evidence['vehicle.price'].kind,'user-input');
 assert.equal(draft.config.evidence['financing.iof.amount'].kind,'unknown');
});
