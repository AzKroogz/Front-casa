import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const legacyFiles = ['legacy-domain.js', 'legacy-render.js', 'legacy-api.js', 'legacy-app.js'];

test('incluye fallbacks JavaScript nomodule para navegadores antiguos', () => {
  for (const file of legacyFiles) assert.match(html, new RegExp('nomodule src="\\./' + file.replace('.', '\\.') + '"'));
});

test('incluye estilos legacy activables sin CSS moderno', () => {
  assert.match(html, /legacy\.css/);
  assert.match(css + html, /legacy-browser/);
});

test('los scripts legacy evitan sintaxis moderna crítica', () => {
  for (const file of legacyFiles) {
    const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /=>|\basync\b|\bawait\b|\?\.|\?\?|\bclass\s|`|\bconst\b|\blet\b/, file);
  }
});
