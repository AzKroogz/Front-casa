import { SupabaseTaskRepository } from './src/supabase-task-repository.js';
import { createSupabaseBrowserClient, ensureOwnProfile, loadHouseholdContext } from './src/supabase-client.js';
import { buildDashboard } from './src/task-view-model.js';
import { classifyTask, completeTask, normalizeTaskInput } from './src/task-domain.js';
import { shouldEnterIdle } from './src/idle.js';
import { formatManualDate, inferDatePreset, parseManualDate, resolveQuickDate } from './src/quick-date.js';
import { getTaskTemplate } from './src/task-templates.js';

let client = null;
let repo = null;
let repoUnsubscribe = null;
let tasks = [];
let memberNames = new Map();
let editingId = null;
const inFlight = new Set();
const IDLE_TIMEOUT_MS = 60000;
let lastInteraction = Date.now();
let sleeping = false;

const refs = {
  appShell: document.querySelector('#app-shell'), authScreen: document.querySelector('#auth-screen'),
  loginForm: document.querySelector('#login-form'), loginEmail: document.querySelector('#login-email'), loginPassword: document.querySelector('#login-password'),
  loginError: document.querySelector('#login-error'), signoutButton: document.querySelector('#signout-button'),
  date: document.querySelector('#date-line'), status: document.querySelector('#connection-status'),
  pending: document.querySelector('#pending-count'), reminder: document.querySelector('#next-reminder'),
  todayList: document.querySelector('#today-list'), weekList: document.querySelector('#week-list'), shoppingList: document.querySelector('#shopping-list'),
  todayCount: document.querySelector('#today-count'), weekCount: document.querySelector('#week-count'), shoppingCount: document.querySelector('#shopping-count'),
  addButton: document.querySelector('#add-button'), modal: document.querySelector('#task-modal'), form: document.querySelector('#task-form'),
  formTitle: document.querySelector('#form-title'), closeModal: document.querySelector('#close-modal'), cancelModal: document.querySelector('#cancel-modal'),
  title: document.querySelector('#task-title'), category: document.querySelector('#task-category'), assigned: document.querySelector('#task-assigned'),
  due: document.querySelector('#task-due'), dueManual: document.querySelector('#task-due-manual'), manualDateWrap: document.querySelector('#manual-date-wrap'),
  datePresetButtons: [...document.querySelectorAll('[data-date-preset]')], templateButtons: [...document.querySelectorAll('[data-task-template]')],
  repeat: document.querySelector('#task-repeat'), repeatInterval: document.querySelector('#task-repeat-interval'),
  showBefore: document.querySelector('#task-show-before'), recurrenceFields: document.querySelector('#recurrence-fields'), error: document.querySelector('#form-error'),
  sleepScreen: document.querySelector('#sleep-screen'), sleepClock: document.querySelector('#sleep-clock'), sleepDate: document.querySelector('#sleep-date'),
  sleepPending: document.querySelector('#sleep-pending'), sleepReminder: document.querySelector('#sleep-reminder'),
};

function isoToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function prettyDate(value, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-UY', options).format(new Date(year, month - 1, day));
}

function assigneeLabel(value) {
  if (!value || value === 'both') return 'Ambos';
  return memberNames.get(value) || 'Integrante';
}

function populateAssignees(members = []) {
  memberNames = new Map(members.map(member => [member.userId, member.displayName]));
  refs.assigned.replaceChildren();
  const both = new Option('Ambos', 'both');
  refs.assigned.append(both);
  members.forEach(member => refs.assigned.append(new Option(member.displayName, member.userId)));
}

function repeatLabel(task) {
  if (!task.repeat_type) return null;
  const count = task.repeat_interval || 1;
  if (task.repeat_type === 'daily') return `Cada ${count} día${count === 1 ? '' : 's'}`;
  if (task.repeat_type === 'weekly') return `Cada ${count} semana${count === 1 ? '' : 's'}`;
  if (task.repeat_type === 'monthly') return `Cada ${count} mes${count === 1 ? '' : 'es'}`;
  return 'Recurrente';
}

function metaChip(text, extraClass = '') {
  const chip = document.createElement('span');
  chip.className = `meta-chip ${extraClass}`.trim();
  chip.textContent = text;
  return chip;
}

function taskCard(task, today) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.id = task.id;
  const complete = document.createElement('button');
  complete.className = 'task-complete'; complete.type = 'button'; complete.dataset.action = 'complete';
  complete.setAttribute('aria-label', `Completar ${task.title}`); complete.textContent = '✓';
  const main = document.createElement('div'); main.className = 'task-main';
  const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title; main.append(title);
  const meta = document.createElement('div'); meta.className = 'task-meta'; meta.append(metaChip(assigneeLabel(task.assigned_to)));
  if (task.due_date) {
    const classification = classifyTask(task, today);
    const label = classification === 'overdue' ? `Venció ${prettyDate(task.due_date, { day: 'numeric', month: 'short' })}` : prettyDate(task.due_date, { day: 'numeric', month: 'short' });
    meta.append(metaChip(label, classification === 'overdue' ? 'overdue' : ''));
  }
  const recurrence = repeatLabel(task);
  if (recurrence) meta.append(metaChip(`↻ ${recurrence}`, 'recurring'));
  main.append(meta);
  const actions = document.createElement('div'); actions.className = 'task-actions';
  const edit = document.createElement('button'); edit.className = 'mini-button'; edit.type = 'button'; edit.dataset.action = 'edit'; edit.setAttribute('aria-label', `Editar ${task.title}`); edit.textContent = '✎';
  const remove = document.createElement('button'); remove.className = 'mini-button delete'; remove.type = 'button'; remove.dataset.action = 'delete'; remove.setAttribute('aria-label', `Eliminar ${task.title}`); remove.textContent = '×';
  actions.append(edit, remove);
  card.append(complete, main, actions);
  return card;
}

function renderList(element, values, emptyMessage, today) {
  element.replaceChildren();
  if (!values.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = emptyMessage; element.append(empty); return;
  }
  values.forEach(task => element.append(taskCard(task, today)));
}

function render() {
  const today = isoToday();
  const dashboard = buildDashboard(tasks, today);
  refs.date.textContent = prettyDate(today);
  refs.pending.textContent = dashboard.pendingCount;
  refs.todayCount.textContent = dashboard.today.length; refs.weekCount.textContent = dashboard.week.length; refs.shoppingCount.textContent = dashboard.shopping.length;
  refs.reminder.textContent = dashboard.nextReminder ? `${dashboard.nextReminder.title} · ${prettyDate(dashboard.nextReminder.due_date, { day: 'numeric', month: 'short' })}` : 'Nada programado';
  renderList(refs.todayList, dashboard.today, 'Nada urgente. Buen momento para no inventar tareas.', today);
  renderList(refs.weekList, dashboard.week, 'La semana está despejada.', today);
  renderList(refs.shoppingList, dashboard.shopping, 'La lista de compras está vacía.', today);
}

function updateSleepView() {
  const now = new Date();
  const today = isoToday();
  const dashboard = buildDashboard(tasks, today);
  refs.sleepClock.textContent = new Intl.DateTimeFormat('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  refs.sleepDate.textContent = prettyDate(today);
  refs.sleepPending.textContent = `${dashboard.pendingCount} pendiente${dashboard.pendingCount === 1 ? '' : 's'}`;
  refs.sleepReminder.textContent = dashboard.nextReminder ? `${dashboard.nextReminder.title} · ${prettyDate(dashboard.nextReminder.due_date, { day: 'numeric', month: 'short' })}` : 'Sin recordatorios próximos';
}

function enterSleep() { if (sleeping || !refs.modal.hidden) return; sleeping = true; updateSleepView(); refs.sleepScreen.hidden = false; }
function wake() { lastInteraction = Date.now(); if (!sleeping) return; sleeping = false; refs.sleepScreen.hidden = true; }
function noteInteraction(event) { if (sleeping) { event.preventDefault(); wake(); return; } lastInteraction = Date.now(); }
function updateConnectionStatus() { const online = navigator.onLine; refs.status.textContent = online ? '● En línea' : '● Sin conexión'; refs.status.classList.toggle('offline', !online); }

function setDatePreset(preset, existingDate = '') {
  refs.datePresetButtons.forEach(button => button.classList.toggle('active', button.dataset.datePreset === preset));
  const custom = preset === 'custom';
  refs.manualDateWrap.hidden = !custom;
  if (custom) {
    const value = existingDate || refs.due.value;
    refs.due.value = value || '';
    refs.dueManual.value = formatManualDate(value);
    return;
  }
  refs.dueManual.value = '';
  refs.due.value = resolveQuickDate(preset, isoToday()) || '';
}

function syncManualDate() {
  const value = refs.dueManual.value.trim();
  if (!value) { refs.due.value = ''; return true; }
  const parsed = parseManualDate(value);
  if (!parsed) return false;
  refs.due.value = parsed;
  return true;
}

function applyTaskTemplate(name) {
  const template = getTaskTemplate(name);
  if (!template) return;
  refs.title.value = template.title;
  refs.category.value = template.category;
  setDatePreset(template.datePreset);
  refs.title.focus();
  refs.title.select();
}

function updateRecurrenceFields() {
  refs.recurrenceFields.hidden = !refs.repeat.value;
  if (refs.repeat.value && !refs.due.value) refs.due.value = isoToday();
}

function openModal(task = null) {
  editingId = task ? task.id : null;
  refs.form.reset(); refs.error.hidden = true;
  refs.formTitle.textContent = task ? 'Editar tarea' : 'Nueva tarea';
  refs.title.value = task ? task.title : '';
  refs.category.value = task ? task.category : 'task'; refs.assigned.value = task ? task.assigned_to : 'both'; refs.due.value = task && task.due_date ? task.due_date : '';
  const preset = inferDatePreset(refs.due.value || null, isoToday());
  setDatePreset(preset, refs.due.value);
  refs.repeat.value = task && task.repeat_type ? task.repeat_type : ''; refs.repeatInterval.value = task ? (task.repeat_interval || 1) : 1; refs.showBefore.value = task ? (task.show_days_before ?? 7) : 7;
  updateRecurrenceFields(); refs.modal.hidden = false; document.body.classList.add('modal-open');
  setTimeout(() => refs.title.focus(), 0);
}

function closeModal() { refs.modal.hidden = true; document.body.classList.remove('modal-open'); editingId = null; refs.error.hidden = true; }

async function handleSubmit(event) {
  event.preventDefault();
  refs.error.hidden = true;
  try {
    if (!refs.manualDateWrap.hidden && !syncManualDate()) throw new Error('Usá una fecha válida con formato dd/mm/aaaa.');
    const normalized = normalizeTaskInput({ title: refs.title.value, category: refs.category.value, assigned_to: refs.assigned.value, due_date: refs.due.value, repeat_type: refs.repeat.value, repeat_interval: refs.repeatInterval.value, show_days_before: refs.showBefore.value });
    if (editingId) await repo.update(editingId, normalized); else await repo.create(normalized);
    closeModal();
  } catch (error) { refs.error.textContent = error.message || 'No se pudo guardar la tarea.'; refs.error.hidden = false; }
}

async function handleTaskAction(event) {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const card = button.closest('.task-card'); if (!card) return;
  const id = card.dataset.id; const task = tasks.find(item => item.id === id);
  if (!task || inFlight.has(`${id}:${button.dataset.action}`)) return;
  if (button.dataset.action === 'edit') { openModal(task); return; }
  if (button.dataset.action === 'delete') { if (!window.confirm(`¿Eliminar “${task.title}”?`)) return; inFlight.add(`${id}:delete`); try { await repo.remove(id); } finally { inFlight.delete(`${id}:delete`); } return; }
  if (button.dataset.action === 'complete') { inFlight.add(`${id}:complete`); button.disabled = true; try { await repo.update(id, completeTask(task, isoToday())); } finally { inFlight.delete(`${id}:complete`); } }
}

function setAuthError(message = '') { refs.loginError.textContent = message; refs.loginError.hidden = !message; }
function showLogin(message = '') { if (repoUnsubscribe) repoUnsubscribe(); repoUnsubscribe = null; repo = null; tasks = []; memberNames = new Map(); refs.appShell.hidden = true; refs.authScreen.hidden = false; setAuthError(message); }

async function openHousehold(user) {
  await ensureOwnProfile(client, user);
  const context = await loadHouseholdContext(client, user);
  if (!context) { showLogin('Tu cuenta existe, pero todavía no tiene acceso a Casa.'); return; }
  populateAssignees(context.members);
  repo = new SupabaseTaskRepository(client, context.householdId, user.id);
  tasks = await repo.list();
  if (repoUnsubscribe) repoUnsubscribe();
  repoUnsubscribe = repo.subscribe(next => { tasks = next; render(); updateSleepView(); });
  refs.authScreen.hidden = true; refs.appShell.hidden = false; setAuthError(''); updateConnectionStatus(); render(); updateSleepView();
}

async function handleSession(session) { if (!session?.user) { showLogin(); return; } try { await openHousehold(session.user); } catch (error) { console.error(error); showLogin('No se pudo cargar Casa. Revisá tu acceso e intentá de nuevo.'); } }

async function handleLogin(event) {
  event.preventDefault(); setAuthError('');
  const button = refs.loginForm.querySelector('button[type="submit"]'); button.disabled = true;
  try { const { data, error } = await client.auth.signInWithPassword({ email: refs.loginEmail.value.trim(), password: refs.loginPassword.value }); if (error) throw error; await handleSession(data.session); refs.loginPassword.value = ''; }
  catch (error) { setAuthError(error?.message || 'No se pudo iniciar sesión.'); }
  finally { button.disabled = false; }
}

async function init() {
  try { client = createSupabaseBrowserClient(window); } catch (error) { showLogin(error.message); return; }
  refs.loginForm.addEventListener('submit', handleLogin);
  refs.signoutButton.addEventListener('click', async () => { await client.auth.signOut(); showLogin(); });
  client.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT') showLogin(); if (event === 'SIGNED_IN' && session?.user && refs.appShell.hidden) queueMicrotask(() => handleSession(session)); });
  const { data, error } = await client.auth.getSession(); if (error) { showLogin(error.message); return; } await handleSession(data.session);
}

window.addEventListener('online', updateConnectionStatus); window.addEventListener('offline', updateConnectionStatus);
['pointerdown', 'keydown', 'touchstart'].forEach(type => window.addEventListener(type, noteInteraction, { passive: false }));
setInterval(() => { if (!sleeping && shouldEnterIdle(lastInteraction, Date.now(), IDLE_TIMEOUT_MS)) enterSleep(); if (sleeping) updateSleepView(); }, 1000);
refs.addButton.addEventListener('click', () => openModal()); refs.closeModal.addEventListener('click', closeModal); refs.cancelModal.addEventListener('click', closeModal);
refs.repeat.addEventListener('change', updateRecurrenceFields); refs.form.addEventListener('submit', handleSubmit);
refs.datePresetButtons.forEach(button => button.addEventListener('click', () => setDatePreset(button.dataset.datePreset, refs.due.value)));
refs.dueManual.addEventListener('blur', () => { if (syncManualDate()) refs.error.hidden = true; });
refs.templateButtons.forEach(button => button.addEventListener('click', () => applyTaskTemplate(button.dataset.taskTemplate)));
[refs.todayList, refs.weekList, refs.shoppingList].forEach(list => list.addEventListener('click', handleTaskAction));
refs.modal.addEventListener('click', event => { if (event.target === refs.modal) closeModal(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !refs.modal.hidden) closeModal(); });

init();
