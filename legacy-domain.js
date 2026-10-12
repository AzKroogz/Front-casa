(function (L) {
  'use strict';
  function pad(value) { return value < 10 ? '0' + value : String(value); }
  function parseDate(value) {
    var p = String(value || '').split('-');
    return p.length === 3 ? { year: Number(p[0]), month: Number(p[1]), day: Number(p[2]) } : null;
  }
  function isoToday() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function prettyDate(value, shortMonth) {
    var p = parseDate(value);
    var months = shortMonth ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] : ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var weekdays = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var d;
    if (!p) return '';
    if (shortMonth) return p.day + ' ' + months[p.month - 1];
    d = new Date(p.year, p.month - 1, p.day);
    return weekdays[d.getDay()] + ', ' + p.day + ' de ' + months[p.month - 1];
  }
  function dayNumber(value) {
    var p = parseDate(value);
    return Date.UTC(p.year, p.month - 1, p.day) / 86400000;
  }
  function classifyTask(task, today) {
    var delta;
    if (!task.due_date) return 'unscheduled';
    delta = dayNumber(task.due_date) - dayNumber(today);
    if (delta < 0) return 'overdue';
    if (delta === 0) return 'today';
    return delta <= 7 ? 'week' : 'later';
  }
  function isTaskVisible(task, today) {
    var delta;
    if (task.completed) return false;
    if (!task.repeat_type || !task.due_date) return true;
    delta = dayNumber(task.due_date) - dayNumber(today);
    if (delta <= 0) return true;
    return delta <= Math.max(0, Number(task.show_days_before || 0));
  }
  function addDays(value, amount) {
    var p = parseDate(value);
    var d = new Date(Date.UTC(p.year, p.month - 1, p.day + amount));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function addMonths(value, amount) {
    var p = parseDate(value);
    var raw = p.month - 1 + amount;
    var year = p.year + Math.floor(raw / 12);
    var monthIndex = ((raw % 12) + 12) % 12;
    var maxDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    return year + '-' + pad(monthIndex + 1) + '-' + pad(Math.min(p.day, maxDay));
  }

  function resolveQuickDate(preset, today) { if (preset==='none') return null; if (preset==='today') return today; if (preset==='tomorrow') return addDays(today,1); if (preset==='week') return addDays(today,7); return null; }
  function parseManualDate(value) { var m=/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(String(value||'')),day,month,year,d;if(!m)return null;day=Number(m[1]);month=Number(m[2]);year=Number(m[3]);d=new Date(Date.UTC(year,month-1,day));if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day)return null;return year+'-'+pad(month)+'-'+pad(day); }
  function formatManualDate(value) { var p=parseDate(value); return p ? pad(p.day)+'/'+pad(p.month)+'/'+p.year : ''; }
  function inferDatePreset(value,today) { if(!value)return 'none'; if(value===today)return 'today'; if(value===addDays(today,1))return 'tomorrow'; if(value===addDays(today,7))return 'week'; return 'custom'; }

  var ICONS={home:{key:'home',emoji:'🏠',label:'Casa'},bill:{key:'bill',emoji:'💸',label:'Pago'},shopping:{key:'shopping',emoji:'🛒',label:'Compra'},cleaning:{key:'cleaning',emoji:'🧼',label:'Limpieza'},pet:{key:'pet',emoji:'🐾',label:'Mascota'},reminder:{key:'reminder',emoji:'📅',label:'Recordatorio'},repair:{key:'repair',emoji:'🔧',label:'Arreglo'},other:{key:'other',emoji:'📦',label:'Otro'},vehicle:{key:'vehicle',emoji:'🚗',label:'Vehículo'},health:{key:'health',emoji:'🩺',label:'Salud'},paperwork:{key:'paperwork',emoji:'📄',label:'Trámite'},event:{key:'event',emoji:'🎉',label:'Evento'}};
  function normalizeIconKey(value){return ICONS[value]?value:'other';}
  function getTaskIcon(value){return ICONS[normalizeIconKey(value)];}

  function nextDueDate(task) {
    var n = Math.max(1, Number(task.repeat_interval || 1));
    if (task.repeat_type === 'daily') return addDays(task.due_date, n);
    if (task.repeat_type === 'weekly') return addDays(task.due_date, n * 7);
    if (task.repeat_type === 'monthly') return addMonths(task.due_date, n);
    return task.due_date;
  }
  function copyObject(source) {
    var out = {}, key;
    for (key in source) if (Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
    return out;
  }
  function completeTask(task, today) {
    var out = copyObject(task);
    if (task.repeat_type && task.last_completed_at === today) return out;
    if (!task.repeat_type) { out.completed = true; out.completed_at = today; return out; }
    out.due_date = nextDueDate(task); out.completed = false; out.last_completed_at = today; return out;
  }
  function rowToTask(row) {
    return { id:row.id, title:row.title, category:row.category, icon_key:normalizeIconKey(row.icon_key), assigned_to:row.assigned_to_all ? 'both' : (row.assignee_user_id || 'both'), due_date:row.due_date, due_time:row.due_time || null, repeat_type:row.repeat_type === 'none' ? null : row.repeat_type, repeat_interval:row.repeat_interval, show_days_before:row.show_days_before, completed:!!row.completed, completed_at:row.completed_at || null, last_completed_at:row.last_completed_at || null, created_at:row.created_at, updated_at:row.updated_at };
  }
  function taskToRow(task) {
    return { title:task.title, category:task.category, icon_key:normalizeIconKey(task.icon_key), assignee_user_id:task.assigned_to && task.assigned_to !== 'both' ? task.assigned_to : null, assigned_to_all:!task.assigned_to || task.assigned_to === 'both', due_date:task.due_date || null, due_time:task.due_time || null, repeat_type:task.repeat_type || 'none', repeat_interval:task.repeat_interval || 1, show_days_before:typeof task.show_days_before === 'number' ? task.show_days_before : 7, completed:!!task.completed, completed_at:task.completed_at || null, last_completed_at:task.last_completed_at || null };
  }
  function compareTasks(a, b) {
    if (!a.due_date && !b.due_date) return String(a.title).localeCompare(String(b.title));
    if (!a.due_date) return 1; if (!b.due_date) return -1;
    if (a.due_date < b.due_date) return -1; if (a.due_date > b.due_date) return 1;
    return String(a.title).localeCompare(String(b.title));
  }
  function buildDashboard(tasks, today) {
    var todayTasks=[], week=[], shopping=[], upcoming=[], i, task, type;
    for (i=0;i<tasks.length;i+=1) {
      task=tasks[i]; if (!task.completed && task.due_date) upcoming.push(task);
      if (!isTaskVisible(task,today)) continue;
      if (task.category === 'shopping') shopping.push(task);
      else { type=classifyTask(task,today); if (type==='overdue'||type==='today'||type==='unscheduled') todayTasks.push(task); if (type==='week') week.push(task); }
    }
    todayTasks.sort(compareTasks); week.sort(compareTasks); shopping.sort(compareTasks); upcoming.sort(compareTasks);
    return { today:todayTasks, week:week, shopping:shopping, pendingCount:todayTasks.length+week.length+shopping.length, nextReminder:upcoming.length ? upcoming[0] : null };
  }
  L.normalizeIconKey=normalizeIconKey; L.getTaskIcon=getTaskIcon; L.pad=pad; L.isoToday=isoToday; L.resolveQuickDate=resolveQuickDate; L.parseManualDate=parseManualDate; L.formatManualDate=formatManualDate; L.inferDatePreset=inferDatePreset; L.prettyDate=prettyDate; L.classifyTask=classifyTask; L.completeTask=completeTask; L.rowToTask=rowToTask; L.taskToRow=taskToRow; L.buildDashboard=buildDashboard;
}(window.CasaLegacy = window.CasaLegacy || {}));
