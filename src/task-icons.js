export const TASK_ICONS = [
  { key: 'home', emoji: '🏠', label: 'Casa' },
  { key: 'bill', emoji: '💸', label: 'Pago' },
  { key: 'shopping', emoji: '🛒', label: 'Compra' },
  { key: 'cleaning', emoji: '🧼', label: 'Limpieza' },
  { key: 'pet', emoji: '🐾', label: 'Mascota' },
  { key: 'reminder', emoji: '📅', label: 'Recordatorio' },
  { key: 'repair', emoji: '🔧', label: 'Arreglo' },
  { key: 'other', emoji: '📦', label: 'Otro' },
  { key: 'vehicle', emoji: '🚗', label: 'Vehículo' },
  { key: 'health', emoji: '🩺', label: 'Salud' },
  { key: 'paperwork', emoji: '📄', label: 'Trámite' },
  { key: 'event', emoji: '🎉', label: 'Evento' },
];

const BY_KEY = new Map(TASK_ICONS.map(item => [item.key, item]));

export function normalizeIconKey(value) {
  return BY_KEY.has(value) ? value : 'other';
}

export function getTaskIcon(value) {
  const item = BY_KEY.get(normalizeIconKey(value));
  return { ...item };
}
