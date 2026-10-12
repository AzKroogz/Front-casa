import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTaskVisible,
  classifyTask,
  nextDueDate,
  completeTask,
} from '../src/task-domain.js';

const today = '2026-10-11';
const task = (overrides = {}) => ({
  id: 't1',
  title: 'Tarea',
  category: 'task',
  due_date: null,
  repeat_type: null,
  repeat_interval: 1,
  show_days_before: 7,
  completed: false,
  ...overrides,
});

test('una tarea sin fecha permanece visible y se clasifica como pendiente sin fecha', () => {
  const value = task();
  assert.equal(isTaskVisible(value, today), true);
  assert.equal(classifyTask(value, today), 'unscheduled');
});

test('clasifica tareas vencidas, de hoy y de esta semana', () => {
  assert.equal(classifyTask(task({ due_date: '2026-10-10' }), today), 'overdue');
  assert.equal(classifyTask(task({ due_date: '2026-10-11' }), today), 'today');
  assert.equal(classifyTask(task({ due_date: '2026-10-16' }), today), 'week');
  assert.equal(classifyTask(task({ due_date: '2026-10-22' }), today), 'later');
});

test('una recurrente se oculta fuera de su ventana y aparece al entrar en ella', () => {
  const recurring = task({ due_date: '2026-10-20', repeat_type: 'monthly', show_days_before: 7 });
  assert.equal(isTaskVisible(recurring, '2026-10-12'), false);
  assert.equal(isTaskVisible(recurring, '2026-10-13'), true);
});

test('show_days_before cero muestra la recurrente solamente el día de vencimiento o si está atrasada', () => {
  const recurring = task({ due_date: '2026-10-20', repeat_type: 'monthly', show_days_before: 0 });
  assert.equal(isTaskVisible(recurring, '2026-10-19'), false);
  assert.equal(isTaskVisible(recurring, '2026-10-20'), true);
  assert.equal(isTaskVisible(recurring, '2026-10-21'), true);
});

test('una tarea completada no se muestra', () => {
  assert.equal(isTaskVisible(task({ completed: true }), today), false);
});

test('calcula próxima fecha semanal respetando repeat_interval', () => {
  assert.equal(nextDueDate(task({ due_date: '2026-10-11', repeat_type: 'weekly', repeat_interval: 2 })), '2026-10-25');
});

test('calcula próxima fecha mensual conservando el día cuando existe', () => {
  assert.equal(nextDueDate(task({ due_date: '2026-10-11', repeat_type: 'monthly', repeat_interval: 1 })), '2026-11-11');
});

test('una fecha mensual del 31 se ajusta al último día válido del mes', () => {
  assert.equal(nextDueDate(task({ due_date: '2026-01-31', repeat_type: 'monthly', repeat_interval: 1 })), '2026-02-28');
});

test('calcula recurrencia diaria personalizada con repeat_interval', () => {
  assert.equal(nextDueDate(task({ due_date: '2026-10-11', repeat_type: 'daily', repeat_interval: 10 })), '2026-10-21');
});

test('completar una tarea simple la marca como finalizada', () => {
  const result = completeTask(task({ due_date: '2026-10-11' }), today);
  assert.equal(result.completed, true);
  assert.equal(result.due_date, '2026-10-11');
});

test('completar una recurrente avanza la fecha y vuelve a dejarla pendiente', () => {
  const result = completeTask(task({ due_date: '2026-10-11', repeat_type: 'weekly' }), today);
  assert.equal(result.completed, false);
  assert.equal(result.due_date, '2026-10-18');
  assert.equal(result.last_completed_at, today);
});

import { normalizeTaskInput } from '../src/task-domain.js';

test('normaliza una tarea simple con valores por defecto', () => {
  const result = normalizeTaskInput({ title: '  Lavar platos  ' });
  assert.deepEqual(result, {
    title: 'Lavar platos',
    category: 'task',
    icon_key: 'other',
    assigned_to: 'both',
    due_date: null,
    repeat_type: null,
    repeat_interval: 1,
    show_days_before: 7,
    completed: false,
  });
});

test('normaliza una compra y fecha opcional', () => {
  const result = normalizeTaskInput({
    title: 'Arena de Otto',
    category: 'shopping',
    assigned_to: 'nico',
    due_date: '2026-10-18',
  });
  assert.equal(result.category, 'shopping');
  assert.equal(result.assigned_to, 'nico');
  assert.equal(result.due_date, '2026-10-18');
});

test('normaliza la categoría visual elegida y rechaza claves no soportadas', () => {
  assert.equal(normalizeTaskInput({ title: 'Service', icon_key: 'vehicle' }).icon_key, 'vehicle');
  assert.equal(normalizeTaskInput({ title: 'Algo', icon_key: 'inventado' }).icon_key, 'other');
});

test('rechaza títulos vacíos', () => {
  assert.throws(() => normalizeTaskInput({ title: '   ' }), /título/i);
});

test('normaliza recurrencia con intervalo y ventana de aparición', () => {
  const result = normalizeTaskInput({
    title: 'Pagar veterinario',
    due_date: '2026-10-20',
    repeat_type: 'monthly',
    repeat_interval: '2',
    show_days_before: '5',
  });
  assert.equal(result.repeat_type, 'monthly');
  assert.equal(result.repeat_interval, 2);
  assert.equal(result.show_days_before, 5);
});

test('no permite recurrencia sin fecha de vencimiento', () => {
  assert.throws(() => normalizeTaskInput({ title: 'Algo', repeat_type: 'weekly' }), /fecha/i);
});

test('completar dos veces una recurrente el mismo día no avanza dos ocurrencias', () => {
  const recurring = task({ due_date: '2026-10-11', repeat_type: 'weekly' });
  const once = completeTask(recurring, today);
  const twice = completeTask(once, today);
  assert.equal(once.due_date, '2026-10-18');
  assert.equal(twice.due_date, '2026-10-18');
});

test('acepta un id real de usuario como asignación', () => {
  const result = normalizeTaskInput({ title: 'Sacar basura', assigned_to: '8b3d-user-id' });
  assert.equal(result.assigned_to, '8b3d-user-id');
});
