# City Puzzle

## Prerequisites

- Node.js (recommended: latest LTS)
- npm

## Install

From this directory:

```bash
npm install
```

## Run tests

```bash
npm test
```

## Start locally

This app serves the static site from `public/` and exposes a small API on port `3000`.

```bash
node server.js
```

Then open `http://localhost:3000`.

## Configuration (optional)

The API returns an image URL derived from `IMAGE_URL`. If you don’t set it, the app will fall back to its default behavior in `lib/puzzle`.

Set it for a single run:

```bash
IMAGE_URL="https://example.com/image.jpg" node server.js
```

Or create a `.env` file in this folder:

```env
IMAGE_URL=https://example.com/image.jpg
```

## Optional: add an npm start script

If you prefer `npm start`, add this to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

Then:

```bash
npm start
```
