import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const legacyCss = fs.readFileSync(new URL('../legacy.css', import.meta.url), 'utf8');

test('el atributo hidden siempre gana sobre layouts CSS modernos', () => {
  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s);
});

test('la URL mode=tablet activa una clase explícita antes del render', () => {
  assert.match(html, /mode=tablet/);
  assert.match(html, /mode-tablet/);
  assert.match(html, /mode-phone/);
});

test('el modo tablet fija la página y deja scroll sólo dentro de las listas', () => {
  assert.match(css, /\.mode-tablet[\s\S]*body[\s\S]*overflow:\s*hidden/s);
  assert.match(css, /\.mode-tablet[\s\S]*\.app-shell[\s\S]*height:\s*100vh/s);
  assert.match(css, /\.mode-tablet[\s\S]*\.board[\s\S]*grid-template-columns:\s*repeat\(3/s);
  assert.match(css, /\.mode-tablet[\s\S]*\.task-list[\s\S]*overflow-y:\s*auto/s);
  assert.match(css, /\.mode-tablet[\s\S]*\.summary-strip[\s\S]*display:\s*none/s);
});

test('el fallback legacy conserva tres columnas y scroll interno en modo tablet', () => {
  assert.match(legacyCss, /\.legacy-browser\.mode-tablet[\s\S]*body[\s\S]*overflow:\s*hidden/s);
  assert.match(legacyCss, /\.legacy-browser\.mode-tablet[\s\S]*\.column[\s\S]*width:\s*32/s);
  assert.match(legacyCss, /\.legacy-browser\.mode-tablet[\s\S]*\.task-list[\s\S]*overflow-y:\s*auto/s);
});
