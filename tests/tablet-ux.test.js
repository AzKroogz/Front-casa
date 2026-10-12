import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const legacyCss = fs.readFileSync(new URL('../legacy.css', import.meta.url), 'utf8');
const portraitCss = fs.readFileSync(new URL('../tablet-portrait.css', import.meta.url), 'utf8');

test('la creación usa fechas rápidas y evita el date picker nativo', () => {
  assert.doesNotMatch(html, /id="task-due"[^>]+type="date"/);
  for (const preset of ['none', 'today', 'tomorrow', 'week', 'custom']) {
    assert.match(html, new RegExp('data-date-preset="' + preset + '"'));
  }
  assert.match(html, /id="task-due-manual"/);
});

test('ofrece plantillas rápidas de tareas domésticas', () => {
  for (const template of ['bill', 'shopping', 'pet', 'cleaning', 'home']) {
    assert.match(html, new RegExp('data-task-template="' + template + '"'));
  }
});

test('prioriza el tablero sobre el saludo y mantiene acciones del modal visibles', () => {
  assert.doesNotMatch(html, />Hola, equipo</);
  assert.match(css, /\.modal-actions[\s\S]*position:\s*sticky/);
  assert.match(legacyCss, /\.legacy-browser \.modal-actions[\s\S]*position:\s*fixed/);
});

test('el modo reposo funciona como reloj de pared legible a distancia', () => {
  assert.match(css, /\.sleep-clock\s*\{[^}]*font-size:\s*clamp\(120px,\s*24vw,\s*280px\)/s);
  assert.match(legacyCss, /\.legacy-browser \.sleep-clock\s*\{[^}]*font-size:\s*24vw/s);
});

test('el modal legacy de tablet sigue siendo desplazable al desplegar recurrencia', () => {
  assert.match(legacyCss, /\.legacy-browser\.mode-tablet \.modal-backdrop\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(legacyCss, /\.legacy-browser\.mode-tablet \.task-modal\s*\{[^}]*max-height:\s*calc\(100vh - 24px\)[^}]*overflow-y:\s*auto/s);
  assert.match(legacyCss, /\.legacy-browser #task-form\s*\{[^}]*padding-bottom:\s*92px/s);
});

test('la creación ofrece 12 categorías visuales y las tarjetas renderizan icono', () => {
  for (const icon of ['home','bill','shopping','cleaning','pet','reminder','repair','other','vehicle','health','paperwork','event']) {
    assert.match(html, new RegExp('data-icon-key="' + icon + '"'));
  }
  const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const legacyRender = fs.readFileSync(new URL('../legacy-render.js', import.meta.url), 'utf8');
  assert.match(app, /task-icon/);
  assert.match(legacyRender, /task-icon/);
});

test('tablet portrait prioriza tareas y deja compras como widget expandible', () => {
  assert.match(html, /id="shopping-toggle"/);
  assert.match(portraitCss, /\.mode-tablet \.board\s*\{[^}]*grid-template-columns:\s*1fr[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)\s+150px/s);
  assert.match(portraitCss, /\.mode-tablet\.shopping-expanded \.column-today[\s\S]*display:\s*none/);
  assert.match(portraitCss, /\.mode-tablet\.shopping-expanded \.column-shopping\s*\{[^}]*height:\s*100%/s);
  assert.match(portraitCss, /\.legacy-browser\.mode-tablet \.column-shopping\s*\{[^}]*height:\s*150px/s);
});

test('tarjetas reservan espacio fijo para completar, icono, texto y acciones', () => {
  assert.match(portraitCss, /\.mode-tablet \.task-card\s*\{[^}]*grid-template-columns:\s*48px\s+52px\s+minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(portraitCss, /\.mode-tablet \.task-icon\s*\{[^}]*width:\s*48px[^}]*height:\s*48px[^}]*border-radius:/s);
  assert.match(portraitCss, /\.legacy-browser\.mode-tablet \.task-complete\s*\{[^}]*flex:\s*0\s+0\s+48px/s);
  assert.match(portraitCss, /\.legacy-browser\.mode-tablet \.task-icon\s*\{[^}]*width:\s*48px[^}]*height:\s*48px/s);
});