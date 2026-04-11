require('dotenv').config();
const express = require('express');
const path = require('path');
const { resolveImageUrl } = require('./lib/puzzle');

const app = express();
const PORT = 3000;

const imageCache = { url: null, date: null };
let cacheExpireTimer = null;

function msUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight - now;
}

async function getDailyImageUrl() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (imageCache.date === today) return imageCache.url;

  const resolved = resolveImageUrl(process.env.IMAGE_URL);
  const response = await fetch(resolved, { method: 'HEAD' });
  const finalUrl = response.url;

  imageCache.url = finalUrl;
  imageCache.date = today;

  if (cacheExpireTimer) clearTimeout(cacheExpireTimer);
  cacheExpireTimer = setTimeout(() => {
    imageCache.url = null;
    imageCache.date = null;
    cacheExpireTimer = null;
  }, msUntilMidnightUTC());
  if (cacheExpireTimer.unref) cacheExpireTimer.unref();

  return imageCache.url;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', async (req, res) => {
  const imageUrl = await getDailyImageUrl();
  res.json({ imageUrl });
});

app.get('/api/cache-status', (req, res) => {
  res.json({
    cachedDate: imageCache.date,
    cachedUrl: imageCache.url,
    msUntilExpiry: imageCache.date ? msUntilMidnightUTC() : null,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`City Puzzle running at http://localhost:${PORT}`);
  });
}

module.exports = { app, getDailyImageUrl, imageCache };
