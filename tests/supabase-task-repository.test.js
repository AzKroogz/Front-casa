import test from 'node:test';
import assert from 'node:assert/strict';
import { rowToTask, taskToRow } from '../src/supabase-task-repository.js';

test('rowToTask maps database recurrence and all-household assignment', () => {
  const task = rowToTask({
    id: 't1', title: 'Comprar arena', category: 'shopping', due_date: '2026-10-15',
    repeat_type: 'none', repeat_interval: 1, show_days_before: 7, completed: false,
    assigned_to_all: true, assignee_user_id: null, completed_at: null, last_completed_at: null,
  });
  assert.equal(task.assigned_to, 'both');
  assert.equal(task.repeat_type, null);
  assert.equal(task.icon_key, 'other');
});

test('rowToTask maps a real user id as assignee', () => {
  const task = rowToTask({
    id: 't2', title: 'Pagar UTE', category: 'task', due_date: null,
    repeat_type: 'monthly', repeat_interval: 1, show_days_before: 5, completed: false,
    assigned_to_all: false, assignee_user_id: 'user-123', completed_at: null, last_completed_at: '2026-09-10',
  });
  assert.equal(task.assigned_to, 'user-123');
  assert.equal(task.repeat_type, 'monthly');
  assert.equal(task.icon_key, 'other');
});

test('taskToRow maps both to assigned_to_all and null assignee', () => {
  const row = taskToRow({
    title: 'Lavar ropa', category: 'task', assigned_to: 'both', due_date: null,
    repeat_type: null, repeat_interval: 1, show_days_before: 7, completed: false,
  });
  assert.equal(row.assigned_to_all, true);
  assert.equal(row.assignee_user_id, null);
  assert.equal(row.repeat_type, 'none');
  assert.equal(row.icon_key, 'other');
});

test('taskToRow preserves a concrete user id', () => {
  const row = taskToRow({
    title: 'Sacar basura', category: 'task', assigned_to: 'user-abc', due_date: '2026-10-12',
    repeat_type: 'daily', repeat_interval: 1, show_days_before: 0, completed: false, icon_key: 'vehicle',
  });
  assert.equal(row.assigned_to_all, false);
  assert.equal(row.assignee_user_id, 'user-abc');
  assert.equal(row.icon_key, 'vehicle');
});
