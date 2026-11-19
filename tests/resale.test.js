'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {referenceResalePrice,saleProceeds}=require('../model/resale.js');
const {createDefaultConfig}=require('../model/config.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' vs '+b);

test('Revenda particular e loja sobre valor já depreciado',()=>{
 const c=createDefaultConfig();
 const p=saleProceeds(c.vehicle,c.resale,12,'private');
 const d=saleProceeds(c.vehicle,c.resale,12,'dealer');
 near(p.referencePrice,72000);
 near(p.netProceeds,71700);
 near(d.referencePrice,72000);
 near(d.grossSale,61200);
 near(d.netProceeds,61200);
 near(d.economicDepreciation,8000);
});

test('Curva anual composta e zero depreciação',()=>{
 const c=createDefaultConfig();
 c.vehicle.residualMethod='annual-rate';
 near(referenceResalePrice(c.vehicle,12),72000);
 near(referenceResalePrice(c.vehicle,24),64800);
 c.vehicle.annualDepreciationRate=0;
 near(referenceResalePrice(c.vehicle,60),80000);
});

test('Custo de venda não pode ser cobrado duas vezes',()=>{
 const c=createDefaultConfig();
 const p=saleProceeds(c.vehicle,c.resale,12,'private');
 near(p.grossSale-p.fixedCosts,p.netProceeds);
});

test('Valida desconto e método',()=>{
 const c=createDefaultConfig();
 c.resale.dealerDiscountPct=1.2;
 assert.throws(()=>saleProceeds(c.vehicle,c.resale,12,'dealer'),/inválido/);
 c.vehicle.residualMethod='estranho';
 assert.throws(()=>referenceResalePrice(c.vehicle,12),/desconhecido/);
});
