import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalTaskRepository } from '../src/local-task-repository.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function baseTask(overrides = {}) {
  return {
    title: 'Comprar pan',
    category: 'shopping',
    assigned_to: 'both',
    due_date: null,
    repeat_type: null,
    repeat_interval: 1,
    show_days_before: 7,
    completed: false,
    ...overrides,
  };
}

test('crea y lista tareas persistidas', async () => {
  const repo = new LocalTaskRepository({ storage: memoryStorage() });
  const created = await repo.create(baseTask());
  const list = await repo.list();
  assert.ok(created.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Comprar pan');
});

test('actualiza una tarea existente sin mutar el objeto original', async () => {
  const repo = new LocalTaskRepository({ storage: memoryStorage() });
  const created = await repo.create(baseTask());
  const updated = await repo.update(created.id, { title: 'Comprar leche' });
  assert.equal(updated.title, 'Comprar leche');
  assert.equal(created.title, 'Comprar pan');
});

test('elimina una tarea y una segunda eliminación es segura', async () => {
  const repo = new LocalTaskRepository({ storage: memoryStorage() });
  const created = await repo.create(baseTask());
  assert.equal(await repo.remove(created.id), true);
  assert.equal(await repo.remove(created.id), false);
  assert.deepEqual(await repo.list(), []);
});

test('suscribe cambios y permite cancelar la suscripción', async () => {
  const repo = new LocalTaskRepository({ storage: memoryStorage() });
  const snapshots = [];
  const unsubscribe = repo.subscribe(tasks => snapshots.push(tasks));
  await repo.create(baseTask());
  unsubscribe();
  await repo.create(baseTask({ title: 'No debe notificar' }));
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0][0].title, 'Comprar pan');
});

test('dos instancias con el mismo storage ven los datos persistidos', async () => {
  const storage = memoryStorage();
  const first = new LocalTaskRepository({ storage });
  const second = new LocalTaskRepository({ storage });
  await first.create(baseTask());
  assert.equal((await second.list()).length, 1);
});

test('usa almacenamiento de respaldo si el navegador bloquea localStorage', async () => {
  const blockedWindow = {};
  Object.defineProperty(blockedWindow, 'localStorage', {
    get() { throw new DOMException('Access denied', 'SecurityError'); }
  });
  const { safeBrowserStorage } = await import('../src/local-task-repository.js');
  const storage = safeBrowserStorage(blockedWindow);
  storage.setItem('x', '1');
  assert.equal(storage.getItem('x'), '1');
});
