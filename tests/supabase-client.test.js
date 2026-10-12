import test from 'node:test';
import assert from 'node:assert/strict';
import { readRuntimeConfig, validateRuntimeConfig } from '../src/supabase-client.js';

test('lee la configuración runtime sin hardcodear credenciales', () => {
  const config = readRuntimeConfig({ __APP_CONFIG__: { SUPABASE_URL: ' https://example.supabase.co ', SUPABASE_PUBLISHABLE_KEY: ' key ' } });
  assert.deepEqual(config, { url: 'https://example.supabase.co', publishableKey: 'key' });
});

test('rechaza una configuración incompleta', () => {
  assert.throws(() => validateRuntimeConfig({ url: '', publishableKey: 'x' }), /SUPABASE_URL/);
  assert.throws(() => validateRuntimeConfig({ url: 'x', publishableKey: '' }), /SUPABASE_PUBLISHABLE_KEY/);
});
