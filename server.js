require('dotenv').config();
const express = require('express');
const path = require('path');
const { resolveImageUrl } = require('./lib/puzzle');

const app = express();
const PORT = 3000;

function getDailyImageUrl() {
  return resolveImageUrl(process.env.IMAGE_URL);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  const imageUrl = getDailyImageUrl();
  res.json({ imageUrl });
});

app.get('/api/cache-status', (req, res) => {
  const imageUrl = getDailyImageUrl();
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  res.json({ strategy: 'date-seeded', imageUrl, date });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`City Puzzle running at http://localhost:${PORT}`);
  });
}

module.exports = app;
