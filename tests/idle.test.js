import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldEnterIdle } from '../src/idle.js';

test('entra en reposo al superar el tiempo de inactividad', () => {
  assert.equal(shouldEnterIdle(0, 60001, 60000), true);
});

test('permanece activo antes del límite', () => {
  assert.equal(shouldEnterIdle(1000, 60999, 60000), false);
});
