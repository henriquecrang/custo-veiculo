'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('README e plano inicial estão presentes', () => {
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8'), /custo-veiculo/);
  const plan = fs.readFileSync(path.join(__dirname, '..', 'docs', 'plano-projeto.md'), 'utf8');
  assert.match(plan, /Custo Veículo/);
  assert.match(plan, /fluxo de caixa/i);
});
