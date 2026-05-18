# Mixed Up: landing, design, and monetization

This document is the living roadmap for marketing entry, visual consistency, and revenue. It matches the agreed URL split: **the game stays at `/`**, and **the marketing landing page is served from a separate path** (see URL map below).

## Goals

1. **Landing** — A lightweight page for campaigns and social links, with a clear **logo and “Play” control that navigate to `/`** where the puzzle runs.
2. **Design** — Keep the product feeling **modern and minimal** (shared tokens, readable type, accessible contrast) across landing and game.
3. **Monetization** — Introduce revenue options **without harming core play**: policy first, landing-first ads, optional later in-game placements, and non-ad options (sponsors, supporters).

## URL map

| URL | Purpose |
|-----|--------|
| `/` | Live puzzle app ([public/index.html](public/index.html)). Default bookmark and local dev entry. |
| `/welcome.html` | Marketing landing: hero, logo, CTA to `/`. Use this in ads, email, and social bios. |

Visitors can open either URL directly. The landing page is the preferred **off-ramp** from paid or organic campaigns so you can measure traffic and reserve space for messaging or ads without changing the game bundle on `/`.

## Landing page (implementation summary)

- Static file: [public/welcome.html](public/welcome.html) (no server changes required; [vercel.json](vercel.json) already serves `public/`).
- **Logo**: [public/images/mixedUp_v1.png](public/images/mixedUp_v1.png) — wrapped in a link to `/` so the whole mark is clickable; a primary **Play** button also links to `/`.
- **SEO**: Basic `<title>`, meta description, and Open Graph tags on the landing page only.
- **Performance**: Logo `<img>` includes `width` / `height` to reduce layout shift; display size capped in CSS.

## Design principles

- **Shared tokens**: [public/styles/theme.css](public/styles/theme.css) holds global `:root` variables and base resets used by both the game and the landing page so color and focus treatment stay aligned.
- **Landing**: Single column, max-width content, generous vertical spacing, one accent (blue) consistent with the game.
- **Game**: Continue to evolve inside [public/index.html](public/index.html); prefer extending shared tokens over one-off colors.
- **Accessibility**: Visible focus rings, semantic headings on the landing page, sufficient contrast for text and controls.

## Advertising and monetization (phased)

Implement in order; each phase can ship independently.

| Phase | Scope | Notes |
|-------|--------|--------|
| **A — Policy** | Privacy policy, cookie/ad disclosure where required. | Required before personalized ads in EU/UK/CH; consider a CMP or non-personalized ads only. |
| **B — Landing ads** | Reserved slots on `/welcome.html` (below the fold). | Wire first: empty containers + comments for your chosen network (e.g. AdSense). Load scripts only on the landing page. |
| **C — In-game ads (optional)** | Non-intrusive areas on `/` only if needed. | Never over tiles; prefer desktop-only side/bottom; gate behind consent if personalized. |
| **D — Other revenue** | Sponsored daily art, “Supporter / remove ads” checkout, affiliates. | Often better ROI than dense display ads at low traffic. |

**Technical**: Use `async` / `defer` for third-party scripts and fixed-min-height wrappers for ad iframes to limit cumulative layout shift (CLS).

**Reality check**: At small scale, **sponsors and a clean game** usually beat aggressive ad density.

## Implementation checklist (ordered)

1. [x] Add `plan.md` (this file) at repo root.
2. [x] Copy logo to `public/images/mixedUp_v1.png` for a stable public URL.
3. [x] Add `public/welcome.html` with logo link + Play CTA to `/`, SEO + OG meta.
4. [x] Add `public/styles/theme.css` and link it from `welcome.html` and `index.html`.
5. [x] Reserve landing ad placeholders (documented in HTML; fill after legal + network approval).
6. [ ] (Later) Publish privacy policy URL and plug in ad network code.
7. [ ] (Later) Optional in-game slots and/or supporter checkout.

## Appendix

- **Environment**: Spotify and image config remain server-side ([server.js](server.js), `.env`); the landing page does not need secrets.
- **Analytics**: If you add measurement, prefer privacy-preserving, documented defaults (e.g. Plausible or self-hosted) and disclose in the privacy policy.
- **Out of scope for v1**: Auth, entitlements, automatic “ad-free” detection without a payment provider integration.
