import test from 'node:test';
import assert from 'node:assert/strict';
import { corsOptions } from '../config/cors.js';

const decide = (options, origin) => new Promise(resolve => options.origin(origin, (_err, ok) => resolve(ok)));

test('allows the site, extra origins and calls without Origin; blocks everything else', async () => {
  const options = corsOptions({ frontendUrl: 'https://app.exemplo.com' }, 'https://admin.exemplo.com/, http://localhost:5173');
  assert.equal(await decide(options, 'https://app.exemplo.com'), true);
  assert.equal(await decide(options, 'https://admin.exemplo.com'), true);
  assert.equal(await decide(options, 'http://localhost:5173'), true);
  assert.equal(await decide(options, undefined), true);
  assert.equal(await decide(options, 'https://malicioso.com'), false);
  assert.equal(await decide(options, 'https://app.exemplo.com.malicioso.com'), false);
});

test('without extra origins only the front URL is allowed', async () => {
  const options = corsOptions({ frontendUrl: 'https://app.exemplo.com' }, undefined);
  assert.equal(await decide(options, 'https://outro.com'), false);
});
