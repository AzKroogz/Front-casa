import test from 'node:test';
import assert from 'node:assert/strict';
import { TASK_ICONS, getTaskIcon, normalizeIconKey } from '../src/task-icons.js';

test('ofrece las 12 categorías visuales acordadas', () => {
  assert.deepEqual(TASK_ICONS.map(item => item.key), [
    'home', 'bill', 'shopping', 'cleaning', 'pet', 'reminder',
    'repair', 'other', 'vehicle', 'health', 'paperwork', 'event',
  ]);
});

test('resuelve emoji y etiqueta y cae en otro para claves desconocidas', () => {
  assert.deepEqual(getTaskIcon('vehicle'), { key: 'vehicle', emoji: '🚗', label: 'Vehículo' });
  assert.equal(normalizeIconKey('pet'), 'pet');
  assert.equal(normalizeIconKey('desconocido'), 'other');
  assert.deepEqual(getTaskIcon('desconocido'), { key: 'other', emoji: '📦', label: 'Otro' });
});
