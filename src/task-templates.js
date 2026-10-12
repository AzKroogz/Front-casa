const TEMPLATES = {
  bill: { title: 'Pagar cuenta', category: 'task', datePreset: 'today', iconKey: 'bill' },
  shopping: { title: 'Hacer compra', category: 'shopping', datePreset: 'none', iconKey: 'shopping' },
  pet: { title: 'Veterinaria / mascota', category: 'task', datePreset: 'none', iconKey: 'pet' },
  cleaning: { title: 'Limpieza', category: 'task', datePreset: 'today', iconKey: 'cleaning' },
  home: { title: 'Pendiente de casa', category: 'task', datePreset: 'none', iconKey: 'home' },
};

export function getTaskTemplate(name) {
  const template = TEMPLATES[name];
  return template ? { ...template } : null;
}
