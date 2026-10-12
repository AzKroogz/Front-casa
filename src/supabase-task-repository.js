import { TaskRepository } from './task-repository.js';

export function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    assigned_to: row.assigned_to_all ? 'both' : (row.assignee_user_id || 'both'),
    due_date: row.due_date,
    due_time: row.due_time ?? null,
    repeat_type: row.repeat_type === 'none' ? null : row.repeat_type,
    repeat_interval: row.repeat_interval,
    show_days_before: row.show_days_before,
    completed: row.completed,
    completed_at: row.completed_at ?? null,
    last_completed_at: row.last_completed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function taskToRow(task) {
  const row = {
    title: task.title,
    category: task.category,
    assignee_user_id: task.assigned_to && task.assigned_to !== 'both' ? task.assigned_to : null,
    assigned_to_all: !task.assigned_to || task.assigned_to === 'both',
    due_date: task.due_date || null,
    due_time: task.due_time || null,
    repeat_type: task.repeat_type || 'none',
    repeat_interval: task.repeat_interval ?? 1,
    show_days_before: task.show_days_before ?? 7,
    completed: Boolean(task.completed),
    completed_at: task.completed_at || null,
    last_completed_at: task.last_completed_at || null,
  };
  return row;
}

export class SupabaseTaskRepository extends TaskRepository {
  constructor(client, householdId, userId) {
    super();
    this.client = client;
    this.householdId = householdId;
    this.userId = userId;
    this.channel = null;
  }

  async list() {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('household_id', this.householdId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(rowToTask);
  }

  async create(task) {
    const payload = {
      ...taskToRow(task),
      household_id: this.householdId,
      created_by: this.userId,
    };
    const { data, error } = await this.client.from('tasks').insert(payload).select('*').single();
    if (error) throw error;
    return rowToTask(data);
  }

  async update(id, patch) {
    const { data, error } = await this.client
      .from('tasks')
      .update(taskToRow(patch))
      .eq('id', id)
      .eq('household_id', this.householdId)
      .select('*')
      .single();
    if (error) throw error;
    return rowToTask(data);
  }

  async remove(id) {
    const { error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('household_id', this.householdId);
    if (error) throw error;
  }

  subscribe(callback) {
    if (this.channel) this.client.removeChannel(this.channel);
    this.channel = this.client
      .channel(`household:${this.householdId}:tasks`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tasks', filter: `household_id=eq.${this.householdId}`,
      }, async () => callback(await this.list()))
      .subscribe();
    return () => {
      if (this.channel) this.client.removeChannel(this.channel);
      this.channel = null;
    };
  }
}
