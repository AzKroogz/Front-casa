function parseIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function addIsoDays(value, amount) {
  const parsed = parseIso(value);
  if (!parsed) return null;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + amount));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function resolveQuickDate(preset, today) {
  if (preset === 'none') return null;
  if (preset === 'today') return today;
  if (preset === 'tomorrow') return addIsoDays(today, 1);
  if (preset === 'week') return addIsoDays(today, 7);
  return null;
}

export function parseManualDate(value) {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(String(value || ''));
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function formatManualDate(value) {
  const parsed = parseIso(value);
  return parsed ? `${pad(parsed.day)}/${pad(parsed.month)}/${parsed.year}` : '';
}

export function inferDatePreset(value, today) {
  if (!value) return 'none';
  if (value === today) return 'today';
  if (value === addIsoDays(today, 1)) return 'tomorrow';
  if (value === addIsoDays(today, 7)) return 'week';
  return 'custom';
}
