import { classifyTask, isTaskVisible } from './task-domain.js';

function compareDue(a, b) {
  if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title, 'es');
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return a.due_date.localeCompare(b.due_date) || a.title.localeCompare(b.title, 'es');
}

export function buildDashboard(tasks, today) {
  const active = tasks.filter(task => !task.completed);
  const visible = active.filter(task => isTaskVisible(task, today));

  const shopping = visible
    .filter(task => task.category === 'shopping')
    .sort(compareDue);

  const regular = visible.filter(task => task.category !== 'shopping');

  const todayTasks = regular
    .filter(task => ['overdue', 'today', 'unscheduled'].includes(classifyTask(task, today)))
    .sort(compareDue);

  const week = regular
    .filter(task => classifyTask(task, today) === 'week')
    .sort(compareDue);

  const upcoming = active
    .filter(task => task.due_date)
    .sort(compareDue);

  return {
    today: todayTasks,
    week,
    shopping,
    pendingCount: todayTasks.length + week.length + shopping.length,
    nextReminder: upcoming[0] ?? null,
  };
}
