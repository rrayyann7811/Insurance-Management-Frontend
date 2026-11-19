import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateProductionApiUrl } from '../config/api-url.js';

test('production API configuration requires a public HTTPS /api URL', () => {
  assert.doesNotThrow(() => validateProductionApiUrl('https://insurance-api.example.test/api'));
  for (const value of [undefined, 'http://api.example.test/api', 'https://localhost/api',
    'https://api.localhost/api', 'https://127.0.0.1/api', 'https://[::1]/api',
    'https://user:pass@api.example.test/api', 'https://api.example.test/', 'https://api.example.test/api?test=1']) {
    assert.throws(() => validateProductionApiUrl(value), /VITE_API_URL/);
  }
});
