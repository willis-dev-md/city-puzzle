 'use strict';
 
 const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
 const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
 
 function clampInt(n, { min, max, fallback }) {
   const v = Number.parseInt(n, 10);
   if (!Number.isFinite(v)) return fallback;
   return Math.max(min, Math.min(max, v));
 }
 
 function pickRandom(arr, rng = Math.random) {
   if (!arr || arr.length === 0) return null;
   const idx = Math.floor(rng() * arr.length);
   return arr[idx] ?? null;
 }
 
 function pickWeighted(items, weightFn, rng = Math.random) {
   if (!items || items.length === 0) return null;
   const weights = items.map(it => Math.max(0, Number(weightFn(it)) || 0));
   const total = weights.reduce((a, b) => a + b, 0);
   if (total <= 0) return pickRandom(items, rng);
   let r = rng() * total;
   for (let i = 0; i < items.length; i++) {
     r -= weights[i];
     if (r <= 0) return items[i];
   }
   return items[items.length - 1] ?? null;
 }
 
 function createSpotifyClient({
   clientId,
   clientSecret,
   fetchImpl = globalThis.fetch,
   now = () => Date.now(),
 } = {}) {
   if (!fetchImpl) throw new Error('Spotify client requires fetch');
  const normalizedClientId = (clientId ?? '').toString().trim();
  const normalizedClientSecret = (clientSecret ?? '').toString().trim();

  if (!normalizedClientId || !normalizedClientSecret) {
     throw new Error('Missing Spotify credentials (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)');
   }
 
   /** @type {{ accessToken: string, expiresAtMs: number } | null} */
   let tokenCache = null;
   /** @type {Promise<string> | null} */
   let tokenInFlight = null;
 
   async function getAccessToken() {
     const t = now();
     if (tokenCache && tokenCache.expiresAtMs - t > 30_000) return tokenCache.accessToken;
     if (tokenInFlight) return tokenInFlight;
 
     tokenInFlight = (async () => {
       const body = new URLSearchParams({ grant_type: 'client_credentials' });
       const res = await fetchImpl(SPOTIFY_TOKEN_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
         },
        // Use the same credential style as the user's working curl:
        // grant_type=client_credentials&client_id=...&client_secret=...
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: normalizedClientId,
          client_secret: normalizedClientSecret,
        }),
       });
 
       if (!res.ok) {
         const txt = await res.text().catch(() => '');
         throw new Error(`Spotify token request failed (${res.status}): ${txt || res.statusText}`);
       }
 
       const json = await res.json();
       const accessToken = json.access_token;
       const expiresIn = Number(json.expires_in) || 3600;
       if (!accessToken) throw new Error('Spotify token response missing access_token');
 
       tokenCache = { accessToken, expiresAtMs: now() + expiresIn * 1000 };
       return accessToken;
     })();
 
     try {
       return await tokenInFlight;
     } finally {
       tokenInFlight = null;
     }
   }
 
   async function apiGet(path) {
     const accessToken = await getAccessToken();
     const res = await fetchImpl(`${SPOTIFY_API_BASE}${path}`, {
       headers: { Authorization: `Bearer ${accessToken}` },
     });
     if (!res.ok) {
       const txt = await res.text().catch(() => '');
       throw new Error(`Spotify API GET ${path} failed (${res.status}): ${txt || res.statusText}`);
     }
     return res.json();
   }
 
   async function searchPlaylists(query, { limit = 10 } = {}) {
     const q = encodeURIComponent(query);
     const l = clampInt(limit, { min: 1, max: 50, fallback: 10 });
     const json = await apiGet(`/search?q=${q}&type=playlist&limit=${l}`);
     return json?.playlists?.items ?? [];
   }
 
   async function getPlaylistTracks(playlistId, { limit = 100 } = {}) {
     const l = clampInt(limit, { min: 1, max: 100, fallback: 100 });
     // Keep fields tight: we only need album images + names/artists.
     const fields = encodeURIComponent('items(track(album(images,name,artists(name))))');
     const json = await apiGet(`/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${l}&fields=${fields}`);
     return json?.items ?? [];
   }
 
  async function searchTracksByYear(year, { limit = 10, market = 'UK' } = {}) {
     const y = clampInt(year, { min: 1960, max: 3000, fallback: year });
     const q = encodeURIComponent(`year:${y}`);
    // Spotify Search currently rejects higher limits (e.g. 50). Keep conservative.
    const l = clampInt(limit, { min: 1, max: 10, fallback: 10 });
    const m = encodeURIComponent((market ?? 'US').toString());
    const json = await apiGet(`/search?q=${q}&type=track&market=${m}&limit=${l}`);
    return json?.tracks?.items ?? [];
   }
 
   return {
     getAccessToken,
     searchPlaylists,
     getPlaylistTracks,
     searchTracksByYear,
   };
 }
 
 function randomYear({ minYear = 1960, maxYear = new Date().getUTCFullYear() - 1, rng = Math.random } = {}) {
   const min = clampInt(minYear, { min: 1900, max: 3000, fallback: 1960 });
   const max = clampInt(maxYear, { min: min, max: 3000, fallback: new Date().getUTCFullYear() - 1 });
   return min + Math.floor(rng() * (max - min + 1));
 }
 
 function bestAlbumImageUrl(images) {
   if (!Array.isArray(images) || images.length === 0) return null;
   // Prefer medium-ish sizes for performance; fallback to first.
   const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
   const preferred = sorted.find(i => (i.width || 0) <= 640) || sorted[sorted.length - 1] || sorted[0];
   return preferred?.url ?? null;
 }
 
 async function getRandomAlbumCoverFromYear({
   client,
   year,
   rng = Math.random,
 } = {}) {
   if (!client) throw new Error('Missing spotify client');
   if (!Number.isFinite(year)) throw new Error('Missing year');
 
   const queries = [
     `"Top 100" album ${year}`,
     `top albums ${year}`,
     `best albums ${year}`,
     `year ${year} albums`,
   ];
 
   let playlistPick = null;
   for (const q of queries) {
     const playlists = await client.searchPlaylists(q, { limit: 10 });
     const usable = playlists
       .filter(p => p && p.id && p.tracks && typeof p.tracks.total === 'number')
       .slice(0, 10);
     if (usable.length) {
       // Weight toward larger playlists (more “top 100”-like).
       playlistPick = pickWeighted(usable, p => p.tracks.total, rng);
       break;
     }
   }
 
   if (playlistPick?.id) {
     const items = await client.getPlaylistTracks(playlistPick.id, { limit: 100 });
     const albums = items
       .map(it => it?.track?.album)
       .filter(a => a && Array.isArray(a.images) && a.images.length);
 
     const album = pickRandom(albums, rng);
     const imageUrl = bestAlbumImageUrl(album?.images);
     if (imageUrl) {
       const artistName = (album?.artists?.[0]?.name) || null;
       return {
         imageUrl,
         meta: {
           source: 'music',
           year,
           playlistId: playlistPick.id,
           playlistName: playlistPick.name || null,
           albumName: album?.name || null,
           artistName,
         },
       };
     }
   }
 
   // Fallback: random track search constrained by year.
   const tracks = await client.searchTracksByYear(year, { limit: 50 });
   const albums = tracks
     .map(t => t?.album)
     .filter(a => a && Array.isArray(a.images) && a.images.length);
   const album = pickRandom(albums, rng);
   const imageUrl = bestAlbumImageUrl(album?.images);
   if (!imageUrl) throw new Error('No album images found for year');
 
   const artistName = (album?.artists?.[0]?.name) || null;
   return {
     imageUrl,
     meta: {
       source: 'music',
       year,
       playlistId: null,
       playlistName: null,
       albumName: album?.name || null,
       artistName,
     },
   };
 }
 
 module.exports = {
   createSpotifyClient,
   randomYear,
   getRandomAlbumCoverFromYear,
   bestAlbumImageUrl,
 };
