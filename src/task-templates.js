const TEMPLATES = {
  bill: { title: 'Pagar cuenta', category: 'task', datePreset: 'today' },
  shopping: { title: 'Hacer compra', category: 'shopping', datePreset: 'none' },
  pet: { title: 'Veterinaria / mascota', category: 'task', datePreset: 'none' },
  cleaning: { title: 'Limpieza', category: 'task', datePreset: 'today' },
  home: { title: 'Pendiente de casa', category: 'task', datePreset: 'none' },
};

export function getTaskTemplate(name) {
  const template = TEMPLATES[name];
  return template ? { ...template } : null;
}
