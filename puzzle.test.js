'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { getConfig, generateSolvable, isSolved, isSolvable, resolveImageUrl } = require('./lib/puzzle');
const { createSpotifyClient } = require('./lib/spotify');
const app = require('./server');

// ── Grid dimensions ───────────────────────────────────────────────────────────

test('easy mode: grid is 3×3', () => {
  const { grid, total } = getConfig('easy');
  assert.equal(grid, 3);
  assert.equal(total, 9);
});

test('hard mode: grid is 4×4', () => {
  const { grid, total } = getConfig('hard');
  assert.equal(grid, 4);
  assert.equal(total, 16);
});

test('unknown mode defaults to easy (3×3)', () => {
  const { grid, total } = getConfig(undefined);
  assert.equal(grid, 3);
  assert.equal(total, 9);
});

// ── Image URL ─────────────────────────────────────────────────────────────────

test('easy mode: image URL has correct format', () => {
  const url = resolveImageUrl();
  assert.match(url, /^https:\/\/picsum\.photos\/seed\/\d{8}\/800\/800$/);
});

test('hard mode: image URL has correct format', () => {
  const url = resolveImageUrl();
  assert.match(url, /^https:\/\/picsum\.photos\/seed\/\d{8}\/800\/800$/);
});

test('image URL respects custom template via env', () => {
  const url = resolveImageUrl('https://example.com/img/{DATE}.jpg');
  assert.match(url, /^https:\/\/example\.com\/img\/\d{8}\.jpg$/);
});

test('image URL date uses UTC', () => {
  const url = resolveImageUrl();
  const d = new Date();
  const expected = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  assert.match(url, new RegExp(`/seed/${expected}/`));
});

test('image URL without template returns deterministic picsum URL', () => {
  const url1 = resolveImageUrl();
  const url2 = resolveImageUrl();
  assert.equal(url1, url2, 'same URL called twice in same day');
});

// ── Server config API ─────────────────────────────────────────────────────────

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => resolve(server));
  });
}

function getJson(port, path) {
  return fetch(`http://127.0.0.1:${port}${path}`).then(r => r.json());
}

test('GET /api/config defaults to city source and returns meta', async () => {
  const server = await listen(app);
  try {
    const port = server.address().port;
    const json = await getJson(port, '/api/config');
    assert.ok(json.imageUrl);
    assert.equal(json.meta.source, 'city');
    assert.match(json.meta.dateSeed, /^\d{8}$/);
  } finally {
    await new Promise(r => server.close(r));
  }
});

test('GET /api/config?source=music returns fallback meta when spotify not configured', async () => {
  const server = await listen(app);
  try {
    const port = server.address().port;
    const json = await getJson(port, '/api/config?source=music');
    assert.ok(json.imageUrl);
    assert.equal(json.meta.source, 'music');
    assert.equal(json.meta.fallback, 'city');
    assert.ok(json.meta.error);
  } finally {
    await new Promise(r => server.close(r));
  }
});

// ── Tile generation ───────────────────────────────────────────────────────────

test('easy mode: generates exactly 9 tiles', () => {
  const { grid, total } = getConfig('easy');
  const tiles = generateSolvable(grid);
  assert.equal(tiles.length, total);
});

test('hard mode: generates exactly 16 tiles', () => {
  const { grid, total } = getConfig('hard');
  const tiles = generateSolvable(grid);
  assert.equal(tiles.length, total);
});

test('easy mode: tiles contain all values 0–8', () => {
  const { grid, total } = getConfig('easy');
  const tiles = generateSolvable(grid);
  const sorted = [...tiles].sort((a, b) => a - b);
  assert.deepEqual(sorted, Array.from({ length: total }, (_, i) => i));
});

test('hard mode: tiles contain all values 0–15', () => {
  const { grid, total } = getConfig('hard');
  const tiles = generateSolvable(grid);
  const sorted = [...tiles].sort((a, b) => a - b);
  assert.deepEqual(sorted, Array.from({ length: total }, (_, i) => i));
});

test('easy mode: generated tiles are solvable', () => {
  const { grid } = getConfig('easy');
  const tiles = generateSolvable(grid);
  assert.equal(isSolvable(tiles, grid), true);
});

test('hard mode: generated tiles are solvable', () => {
  const { grid } = getConfig('hard');
  const tiles = generateSolvable(grid);
  assert.equal(isSolvable(tiles, grid), true);
});

test('easy mode: generated tiles are not already solved', () => {
  const { grid } = getConfig('easy');
  const tiles = generateSolvable(grid);
  assert.equal(isSolved(tiles), false);
});

test('hard mode: generated tiles are not already solved', () => {
  const { grid } = getConfig('hard');
  const tiles = generateSolvable(grid);
  assert.equal(isSolved(tiles), false);
});

// ── Spotify token caching (mocked) ────────────────────────────────────────────

test('spotify client caches token and avoids duplicate token requests', async () => {
  let tokenCalls = 0;

  const fetchMock = async (url) => {
    if (String(url).includes('accounts.spotify.com/api/token')) {
      tokenCalls++;
      return {
        ok: true,
        json: async () => ({ access_token: 't1', expires_in: 3600 }),
      };
    }
    throw new Error(`Unexpected fetch to ${url}`);
  };

  const client = createSpotifyClient({
    clientId: 'id',
    clientSecret: 'secret',
    fetchImpl: fetchMock,
  });

  const [a, b] = await Promise.all([client.getAccessToken(), client.getAccessToken()]);
  assert.equal(a, 't1');
  assert.equal(b, 't1');
  assert.equal(tokenCalls, 1);
});

test('spotify token live check (opt-in)', async (t) => {
  if (process.env.SPOTIFY_LIVE_TEST !== '1') {
    t.skip('Set SPOTIFY_LIVE_TEST=1 to run live Spotify auth test');
    return;
  }

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    t.skip('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET');
    return;
  }

  const client = createSpotifyClient({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const token = await client.getAccessToken();
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 20);
});
