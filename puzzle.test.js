'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { getConfig, generateSolvable, isSolved, isSolvable, resolveImageUrl } = require('./lib/puzzle');
const { getDailyImageUrl, imageCache } = require('./server');

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

// ── Server image cache ────────────────────────────────────────────────────────

test('getDailyImageUrl: returns cached URL without fetching on cache hit', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const cachedUrl = 'https://cached.example.com/image.jpg';
  imageCache.date = today;
  imageCache.url = cachedUrl;

  let fetchCalled = false;
  const origFetch = global.fetch;
  global.fetch = async () => { fetchCalled = true; return { url: 'https://should-not-be-called' }; };

  try {
    const result = await getDailyImageUrl();
    assert.equal(result, cachedUrl, 'should return cached URL');
    assert.equal(fetchCalled, false, 'fetch should not be called on cache hit');
  } finally {
    global.fetch = origFetch;
    imageCache.date = null;
    imageCache.url = null;
  }
});

test('getDailyImageUrl: fetches and caches URL on cache miss', async () => {
  imageCache.date = null;
  imageCache.url = null;

  const finalUrl = 'https://final.example.com/image.jpg';
  const origFetch = global.fetch;
  global.fetch = async () => ({ url: finalUrl });

  try {
    const result = await getDailyImageUrl();
    const today = new Date().toISOString().slice(0, 10);
    assert.equal(result, finalUrl, 'should return the resolved final URL');
    assert.equal(imageCache.date, today, 'cache date should be set to today');
    assert.equal(imageCache.url, finalUrl, 'cache URL should be stored');
  } finally {
    global.fetch = origFetch;
    imageCache.date = null;
    imageCache.url = null;
  }
});
