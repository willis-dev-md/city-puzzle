require('dotenv').config();
const express = require('express');
const path = require('path');
const { resolveImageUrl } = require('./lib/puzzle');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({ imageUrl: resolveImageUrl(process.env.IMAGE_URL) });
});

app.listen(PORT, () => {
  console.log(`City Puzzle running at http://localhost:${PORT}`);
});
