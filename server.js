require('dotenv').config();
const express = require('express');
const path = require('path');
const { resolveImageUrl } = require('./lib/puzzle');
const { createSpotifyClient, randomYear, getRandomAlbumCoverFromYear } = require('./lib/spotify');

const app = express();
const PORT = 3000;

function getDailyImageUrl() {
  return resolveImageUrl(process.env.IMAGE_URL);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  const source = (req.query.source || 'city').toString().toLowerCase();

  if (source !== 'music') {
    const d = new Date();
    const dateSeed = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    const imageUrl = getDailyImageUrl();
    res.json({ imageUrl, meta: { source: 'city', dateSeed } });
    return;
  }

  (async () => {
    try {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('Spotify not configured (missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)');
      }

      const client = createSpotifyClient({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      });

      const year = randomYear({
        minYear: process.env.MUSIC_MIN_YEAR,
        maxYear: process.env.MUSIC_MAX_YEAR,
      });

      const { imageUrl, meta } = await getRandomAlbumCoverFromYear({ client, year });
      res.json({ imageUrl, meta });
    } catch (err) {
      const imageUrl = getDailyImageUrl();
      res.json({
        imageUrl,
        meta: {
          source: 'music',
          error: err && err.message ? err.message : 'Spotify error',
          fallback: 'city',
        },
      });
    }
  })();
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
