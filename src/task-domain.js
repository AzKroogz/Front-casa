import { normalizeIconKey } from './task-icons.js';

function parseDateParts(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function toUtcDay(value) {
  const parts = parseDateParts(value);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000;
}

function daysBetween(from, to) {
  return toUtcDay(to) - toUtcDay(from);
}

function addDays(value, amount) {
  const parts = parseDateParts(value);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return formatDate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(value, amount) {
  const parts = parseDateParts(value);
  const zeroBased = parts.month - 1 + amount;
  const targetYear = parts.year + Math.floor(zeroBased / 12);
  const targetMonthIndex = ((zeroBased % 12) + 12) % 12;
  const targetMonth = targetMonthIndex + 1;
  const targetDay = Math.min(parts.day, daysInMonth(targetYear, targetMonth));
  return formatDate({ year: targetYear, month: targetMonth, day: targetDay });
}

export function classifyTask(task, today) {
  if (!task.due_date) return 'unscheduled';
  const delta = daysBetween(today, task.due_date);
  if (delta < 0) return 'overdue';
  if (delta === 0) return 'today';
  if (delta <= 7) return 'week';
  return 'later';
}

export function isTaskVisible(task, today) {
  if (task.completed) return false;
  if (!task.repeat_type || !task.due_date) return true;
  const delta = daysBetween(today, task.due_date);
  if (delta <= 0) return true;
  const windowDays = Math.max(0, Number(task.show_days_before ?? 7));
  return delta <= windowDays;
}

export function nextDueDate(task) {
  if (!task.due_date || !task.repeat_type) return task.due_date ?? null;
  const interval = Math.max(1, Number(task.repeat_interval ?? 1));

  switch (task.repeat_type) {
    case 'daily':
      return addDays(task.due_date, interval);
    case 'weekly':
      return addDays(task.due_date, interval * 7);
    case 'monthly':
      return addMonths(task.due_date, interval);
    default:
      return task.due_date;
  }
}

export function completeTask(task, today) {
  if (task.repeat_type && task.last_completed_at === today) return { ...task };

  if (!task.repeat_type) {
    return { ...task, completed: true, completed_at: today };
  }

  return {
    ...task,
    due_date: nextDueDate(task),
    completed: false,
    last_completed_at: today,
  };
}


export function normalizeTaskInput(input) {
  const title = String(input.title ?? '').trim();
  if (!title) throw new Error('El título es obligatorio');

  const dueDate = input.due_date ? String(input.due_date) : null;
  const repeatType = input.repeat_type ? String(input.repeat_type) : null;
  if (repeatType && !dueDate) throw new Error('Una tarea recurrente necesita fecha');

  return {
    title,
    category: input.category === 'shopping' ? 'shopping' : 'task',
    icon_key: normalizeIconKey(input.icon_key),
    assigned_to: String(input.assigned_to || 'both'),
    due_date: dueDate,
    repeat_type: ['daily', 'weekly', 'monthly'].includes(repeatType) ? repeatType : null,
    repeat_interval: Math.max(1, Number.parseInt(input.repeat_interval ?? 1, 10) || 1),
    show_days_before: Math.max(0, Number.parseInt(input.show_days_before ?? 7, 10) || 0),
    completed: false,
  };
}
