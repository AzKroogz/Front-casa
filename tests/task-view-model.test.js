import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboard } from '../src/task-view-model.js';

const today = '2026-10-11';
let n = 0;
const make = (overrides = {}) => ({
  id: `t${++n}`,
  title: 'Tarea',
  category: 'task',
  assigned_to: 'both',
  due_date: null,
  repeat_type: null,
  repeat_interval: 1,
  show_days_before: 7,
  completed: false,
  ...overrides,
});

test('distribuye tareas entre Hoy, Esta semana y Compras', () => {
  const dashboard = buildDashboard([
    make({ title: 'Sin fecha' }),
    make({ title: 'Atrasada', due_date: '2026-10-10' }),
    make({ title: 'Hoy', due_date: today }),
    make({ title: 'Semana', due_date: '2026-10-15' }),
    make({ title: 'Después', due_date: '2026-10-25' }),
    make({ title: 'Leche', category: 'shopping' }),
  ], today);

  assert.deepEqual(dashboard.today.map(x => x.title), ['Atrasada', 'Hoy', 'Sin fecha']);
  assert.deepEqual(dashboard.week.map(x => x.title), ['Semana']);
  assert.deepEqual(dashboard.shopping.map(x => x.title), ['Leche']);
});

test('excluye tareas completadas y recurrentes fuera de su ventana', () => {
  const dashboard = buildDashboard([
    make({ title: 'Hecha', completed: true }),
    make({ title: 'Recurrente futura', due_date: '2026-10-30', repeat_type: 'monthly', show_days_before: 7 }),
    make({ title: 'Recurrente visible', due_date: '2026-10-16', repeat_type: 'weekly', show_days_before: 7 }),
  ], today);

  assert.deepEqual(dashboard.today, []);
  assert.deepEqual(dashboard.week.map(x => x.title), ['Recurrente visible']);
});

test('ordena Hoy por urgencia: más vencidas primero, luego hoy y sin fecha', () => {
  const dashboard = buildDashboard([
    make({ title: 'Hoy', due_date: today }),
    make({ title: 'Sin fecha' }),
    make({ title: 'Ayer', due_date: '2026-10-10' }),
    make({ title: 'Hace tres días', due_date: '2026-10-08' }),
  ], today);
  assert.deepEqual(dashboard.today.map(x => x.title), ['Hace tres días', 'Ayer', 'Hoy', 'Sin fecha']);
});

test('informa el próximo recordatorio aunque todavía esté oculto', () => {
  const hidden = make({ title: 'Pagar veterinario', due_date: '2026-10-25', repeat_type: 'monthly', show_days_before: 7 });
  const dashboard = buildDashboard([hidden], today);
  assert.equal(dashboard.nextReminder.title, 'Pagar veterinario');
  assert.equal(dashboard.nextReminder.due_date, '2026-10-25');
  assert.equal(dashboard.pendingCount, 0);
});
