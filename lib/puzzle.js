'use strict';

/**
 * Returns grid config for a given mode.
 * easy → 3×3 (9 tiles)
 * hard → 4×4 (16 tiles)
 */
function getConfig(mode) {
  const grid = mode === 'hard' ? 4 : 3;
  return { grid, tileSize: 100, total: grid * grid };
}

function countInversions(arr) {
  let inv = 0;
  for (let i = 0; i < arr.length - 1; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
  return inv;
}

function isSolvable(arr, grid) {
  const inv = countInversions(arr);
  const emptyRow = Math.floor(arr.indexOf(0) / grid);
  const emptyRowFromBottom = grid - emptyRow;
  return (inv % 2 === 0) === (emptyRowFromBottom % 2 === 1);
}

function isSolved(arr) {
  return arr.every((v, i) => v === i);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function generateSolvable(grid) {
  const total = grid * grid;
  const arr = Array.from({ length: total }, (_, i) => i);
  do { shuffle(arr); } while (!isSolvable(arr, grid) || isSolved(arr));
  return arr;
}

/**
 * Builds the image URL from a template (defaulting to the picsum one).
 * Replaces {DATE} with YYYYMMDD of today.
 */
function resolveImageUrl(template) {
  const tmpl = template || 'https://picsum.photos/seed/{DATE}/800/800';
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return tmpl.replace('{DATE}', date);
}

module.exports = { getConfig, countInversions, isSolvable, isSolved, generateSolvable, resolveImageUrl };
