import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const read = (name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('config bootstrap injects installable PWA metadata and loader', async () => {
  const config = await read('config.js');
  assert.match(config, /manifest\.webmanifest/);
  assert.match(config, /apple-mobile-web-app-capable/);
  assert.match(config, /icons\/icon-180\.png/);
  assert.match(config, /pwa\.js/);
});

test('manifest installs Casa in standalone mode with required icons', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  assert.equal(manifest.name, 'Casa');
  assert.equal(manifest.short_name, 'Casa');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(manifest.icons.some((icon) => icon.src === './icons/icon-192.png' && icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.src === './icons/icon-512.png' && icon.sizes === '512x512' && /maskable/.test(icon.purpose)));
});

test('service worker keeps app shell local and does not cache Supabase/API traffic', async () => {
  const sw = await read('sw.js');
  assert.match(sw, /CACHE_NAME/);
  assert.match(sw, /\.\/index\.html/);
  assert.match(sw, /request\.url/);
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.match(sw, /request\.method !== 'GET'/);
  assert.match(sw, /var networkFetch = fetch\(request\)/);
  assert.doesNotMatch(sw, /if \(cached\) return cached;/);
});

test('PWA icon files exist', async () => {
  await Promise.all([
    access(new URL('../icons/icon-180.png', import.meta.url)),
    access(new URL('../icons/icon-192.png', import.meta.url)),
    access(new URL('../icons/icon-512.png', import.meta.url)),
  ]);
});
