import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const legacyCss = fs.readFileSync(new URL('../legacy.css', import.meta.url), 'utf8');
const portraitCss = fs.readFileSync(new URL('../tablet-portrait.css', import.meta.url), 'utf8');
const tabletCss = css + '\n' + portraitCss;
const tabletLegacyCss = legacyCss + '\n' + portraitCss;

test('el atributo hidden siempre gana sobre layouts CSS modernos', () => {
  assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s);
});

test('la URL mode=tablet activa una clase explícita antes del render', () => {
  assert.match(html, /mode=tablet/);
  assert.match(html, /mode-tablet/);
  assert.match(html, /mode-phone/);
});

test('el modo tablet fija la página y deja scroll sólo dentro de las listas', () => {
  assert.match(tabletCss, /\.mode-tablet[\s\S]*body[\s\S]*overflow:\s*hidden/s);
  assert.match(tabletCss, /\.mode-tablet[\s\S]*\.app-shell[\s\S]*height:\s*100vh/s);
  assert.match(tabletCss, /\.mode-tablet[\s\S]*\.board[\s\S]*grid-template-columns:\s*1fr/s);
  assert.match(tabletCss, /\.mode-tablet[\s\S]*\.task-list[\s\S]*overflow-y:\s*auto/s);
  assert.match(tabletCss, /\.mode-tablet[\s\S]*\.summary-strip[\s\S]*display:\s*none/s);
});

test('el fallback legacy conserva layout vertical y scroll interno en modo tablet', () => {
  assert.match(tabletLegacyCss, /\.legacy-browser\.mode-tablet[\s\S]*body[\s\S]*overflow:\s*hidden/s);
  assert.match(tabletLegacyCss, /\.legacy-browser\.mode-tablet[\s\S]*\.column[\s\S]*float:\s*none/s);
  assert.match(tabletLegacyCss, /\.legacy-browser\.mode-tablet[\s\S]*\.column-shopping[\s\S]*height:\s*150px/s);
  assert.match(tabletLegacyCss, /\.legacy-browser\.mode-tablet[\s\S]*\.task-list[\s\S]*overflow-y:\s*auto/s);
});