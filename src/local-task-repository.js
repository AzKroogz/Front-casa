import { TaskRepository } from './task-repository.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fallbackStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}


export function safeBrowserStorage(source = globalThis) {
  try {
    return source.localStorage ?? fallbackStorage();
  } catch {
    return fallbackStorage();
  }
}

export class LocalTaskRepository extends TaskRepository {
  constructor({ storage = safeBrowserStorage(), key = 'home-dashboard.tasks' } = {}) {
    super();
    this.storage = storage;
    this.key = key;
    this.listeners = new Set();
  }

  #read() {
    const raw = this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  #write(tasks) {
    this.storage.setItem(this.key, JSON.stringify(tasks));
    const snapshot = clone(tasks);
    for (const listener of this.listeners) listener(snapshot);
  }

  async list() {
    return clone(this.#read());
  }

  async create(task) {
    const tasks = this.#read();
    const created = {
      ...clone(task),
      id: task.id ?? makeId(),
      created_at: task.created_at ?? new Date().toISOString(),
    };
    tasks.push(created);
    this.#write(tasks);
    return clone(created);
  }

  async update(id, patch) {
    const tasks = this.#read();
    const index = tasks.findIndex(item => item.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...clone(patch), id };
    this.#write(tasks);
    return clone(tasks[index]);
  }

  async remove(id) {
    const tasks = this.#read();
    const next = tasks.filter(item => item.id !== id);
    if (next.length === tasks.length) return false;
    this.#write(next);
    return true;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
