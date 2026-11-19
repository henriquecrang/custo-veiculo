'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createDefaultConfig,validateConfig}=require('../model/config.js');
const engine=require('../model/scenario-engine.js');
const comparable=require('../model/comparability.js');

test('preset Rio distingue usado do zero-quilômetro e não afirma superioridade absoluta',()=>{
 const cfg=createDefaultConfig();
 const result=engine.compareScenarios(cfg);
 assert.equal(result.comparability.status,'mismatch');
 assert.equal(result.comparability.comparable,false);
 assert.ok(result.warnings.some(x=>x.includes('novo')||x.includes('zero-quilômetro')));
 assert.equal(result.comparability.coverage.length,5);
 assert.equal(result.comparability.coverage.find(x=>x.scenarioId==='subscription').modeledMonths,12);
 assert.equal(result.comparability.coverage.find(x=>x.scenarioId==='subscription').contractMonths,12);
});
test('categoria e contrato divergentes impedem equivalência mesmo quando confirmado',()=>{
 const cfg=createDefaultConfig();
 cfg.vehicle.category='sedan';
 cfg.subscription.equivalenceConfirmed=true;
 cfg.subscription.contractMonths=24;
 const out=engine.compareScenarios(cfg);
 assert.equal(out.comparability.status,'mismatch');
 assert.ok(out.warnings.some(x=>x.includes('Categorias')));
 assert.ok(out.warnings.some(x=>x.includes('24 meses')));
});
test('equivalência só é confirmada por usuário e com informações consistentes',()=>{
 const cfg=createDefaultConfig();
 cfg.vehicle.category='compact';
 cfg.vehicle.condition='new';
 cfg.subscription.category='compact';
 cfg.subscription.condition='new';
 cfg.subscription.vehicleName=cfg.vehicle.name;
 assert.equal(engine.compareScenarios(cfg).comparability.status,'unverified');
 cfg.subscription.equivalenceConfirmed=true;
 const out=engine.compareScenarios(cfg);
 assert.equal(out.comparability.status,'confirmed');
 assert.deepEqual(out.warnings,[]);
});
test('versão antiga de JSON não é rejeitada nem presumida como contrato conhecido',()=>{
 const cfg=createDefaultConfig();
 delete cfg.vehicle.category;delete cfg.vehicle.condition;
 delete cfg.subscription.category;delete cfg.subscription.condition;
 delete cfg.subscription.contractMonths;delete cfg.subscription.equivalenceConfirmed;
 assert.deepEqual(validateConfig(cfg),[]);
 const out=engine.compareScenarios(cfg);
 assert.equal(out.comparability.comparable,false);
 assert.equal(out.comparability.coverage.find(x=>x.scenarioId==='subscription').contractMonths,null);
 assert.ok(out.warnings.some(x=>x.includes('não informado')));
});
test('comparação de apenas compra ou apenas assinatura não gera alerta cruzado',()=>{
 const cfg=createDefaultConfig();
 cfg.selectedScenarioIds=['subscription'];
 assert.equal(engine.compareScenarios(cfg).comparability.status,'not-applicable');
 assert.deepEqual(engine.compareScenarios(cfg).warnings,[]);
});
test('campos opcionais inválidos são recusados sem mudar versão',()=>{
 const cfg=createDefaultConfig();
 cfg.vehicle.category='spaceship';
 cfg.subscription.contractMonths=0;
 cfg.subscription.equivalenceConfirmed='true';
 const errors=validateConfig(cfg);
 assert.ok(errors.some(x=>x.includes('vehicle.category')));
 assert.ok(errors.some(x=>x.includes('contractMonths')));
 assert.ok(errors.some(x=>x.includes('equivalenceConfirmed')));
});
