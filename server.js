require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

function resolveImageUrl() {
  const template = process.env.IMAGE_URL || 'https://picsum.photos/seed/{DATE}/800/800';
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return template.replace('{DATE}', date);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({ imageUrl: resolveImageUrl() });
});

app.listen(PORT, () => {
  console.log(`City Puzzle running at http://localhost:${PORT}`);
});
