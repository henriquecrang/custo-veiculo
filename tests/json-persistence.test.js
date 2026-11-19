'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('autosave/export/import exibem controles e validação antes de substituir',()=>{
 const html=read('index.html'),app=read('app.js');
 for(const id of ['exportButton','importButton','importFile','saveStatus'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/localStorage\.setItem/);
 assert.match(app,/defaults\.assertValidConfig\(candidate\)/);
 assert.match(app,/window\.confirm/);
 assert.match(app,/URL\.createObjectURL/);
 assert.match(app,/JSON\.stringify\(state/);
});

test('schemaVersion desconhecido rejeitado sem alteração implícita',()=>{
 const {createDefaultConfig,assertValidConfig}=require('../model/config.js');
 const source=createDefaultConfig(),snapshot=JSON.stringify(source);
 const wrong=JSON.parse(snapshot);wrong.schemaVersion=999;
 assert.throws(()=>assertValidConfig(wrong),/schemaVersion/);
 assert.equal(JSON.stringify(source),snapshot);
});
