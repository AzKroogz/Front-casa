import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../tablet-portrait.css', import.meta.url), 'utf8');

test('carga overrides portrait después del fallback legacy', () => {
  const legacy = html.indexOf('./legacy.css');
  const portrait = html.indexOf('./tablet-portrait.css');
  assert.ok(legacy >= 0);
  assert.ok(portrait > legacy);
});

test('portrait usa tareas apiladas y compras compactas expandibles', () => {
  assert.match(css, /\.mode-tablet \.board[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /grid-template-rows:\s*minmax\(0, 1fr\) minmax\(0, 1fr\) 150px/);
  assert.match(css, /\.mode-tablet \.column-shopping[\s\S]*height:\s*150px/);
  assert.match(css, /\.mode-tablet\.shopping-expanded \.column-today/);
  assert.match(css, /\.mode-tablet\.shopping-expanded \.column-shopping[\s\S]*height:\s*100%/);
});

test('portrait reserva espacio fijo para completar icono contenido y acciones', () => {
  assert.match(css, /grid-template-columns:\s*48px 52px minmax\(0, 1fr\) auto/);
  assert.match(css, /\.mode-tablet \.task-icon[\s\S]*width:\s*48px[\s\S]*height:\s*48px/);
  assert.match(css, /\.legacy-browser\.mode-tablet \.task-complete[\s\S]*flex:\s*0 0 48px/);
  assert.match(css, /\.legacy-browser\.mode-tablet \.task-icon[\s\S]*flex:\s*0 0 48px/);
});