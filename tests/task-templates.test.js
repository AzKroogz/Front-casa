import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskTemplate } from '../src/task-templates.js';

test('devuelve plantillas domésticas editables con categoría adecuada', () => {
  assert.deepEqual(getTaskTemplate('bill'), { title: 'Pagar cuenta', category: 'task', datePreset: 'today', iconKey: 'bill' });
  assert.deepEqual(getTaskTemplate('shopping'), { title: 'Hacer compra', category: 'shopping', datePreset: 'none', iconKey: 'shopping' });
  assert.deepEqual(getTaskTemplate('pet'), { title: 'Veterinaria / mascota', category: 'task', datePreset: 'none', iconKey: 'pet' });
});

test('rechaza una plantilla desconocida', () => {
  assert.equal(getTaskTemplate('otro'), null);
});
