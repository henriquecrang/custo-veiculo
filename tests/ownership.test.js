'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {ownershipEvents}=require('../model/ownership.js');
const {createDefaultConfig}=require('../model/config.js');
const sum=e=>e.reduce((s,x)=>s+x.amount,0);

test('carro parado tem IPVA, seguro e manutenção mas nenhum custo por km',()=>{
 const c=createDefaultConfig().ownership;
 const e=ownershipEvents(c,12);
 assert.equal(e.some(x=>x.category==='usage'),false);
 assert.equal(sum(e),-(3200+4400+1200));
 assert.equal(e.filter(x=>x.category==='ipva').length,1);
 assert.equal(e.filter(x=>x.category==='insurance').length,1);
});

test('custo variável apenas quando distância é positiva',()=>{
 const c=createDefaultConfig().ownership;
 c.kmPerMonth=1000;c.costPerKm=0.25;
 const e=ownershipEvents(c,12);
 assert.equal(e.filter(x=>x.category==='usage').length,12);
 assert.equal(sum(e),-(3200+4400+1200+3000));
});

test('incidência anual respeita calendário sem duplicar documentação',()=>{
 const c=createDefaultConfig().ownership;
 c.insuranceFirstMonth=6;c.licensingAnnual=200;c.licensingFirstMonth=3;
 const e=ownershipEvents(c,26);
 assert.deepEqual(e.filter(x=>x.category==='ipva').map(x=>x.month),[1,13,25]);
 assert.deepEqual(e.filter(x=>x.category==='insurance').map(x=>x.month),[6,18]);
 assert.deepEqual(e.filter(x=>x.category==='licensing').map(x=>x.month),[3,15]);
});

test('rejeita mês anual inválido',()=>{
 const c=createDefaultConfig().ownership;
 c.ipvaFirstMonth=0;
 assert.throws(()=>ownershipEvents(c,12),/inválida/);
});
