# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Eventful

Eventful is a platform that creates bespoke wedding websites for couples. Each couple gets their own subdirectory with a fully custom look and feel.

## Project Structure

```
/                          ← Eventful marketing site
  index.html               ← Landing page
  styles.css               ← Shared CSS for root pages (landing + form)
  script.js                ← JS for the RSVP form on the landing page
  form/index.html          ← Lead-gen inquiry form for prospective couples (uses styles.css)
  logo.webp / favicon.webp / eventful.webp / pexels-junerydocto.webp / Perfect.mp3

sofia-and-carlos/          ← Example couple page
  index.html               ← Self-contained wedding page
  sofia-carlos.css         ← Custom CSS for this couple only
```

## Two Distinct CSS Systems

**Root pages** (`index.html`, `form/index.html`) share `styles.css`:
- Fonts: Cormorant Garamond + Outfit
- Color tokens: `--primary` (sage green `#5F7161`), `--gold`, `--rose`, `--champagne`

**Couple pages** each have their own CSS:
- Fonts can differ per couple (Sofia uses Great Vibes + Cormorant Infant + Outfit)
- Each page defines its own `:root` tokens for full visual identity control
- Goal: move toward a shared base wedding CSS that couples' pages override via their own token values, rather than duplicating all structure

## Deployment

VS Code → GitHub → Vercel. No build step. All files are served as-is.

CSS paths in couple pages must use absolute URLs (e.g., `/sofia-and-carlos/sofia-carlos.css`) to avoid Vercel trailing-slash routing issues.

## Adding a New Couple's Page

1. Create `[couple-name]/index.html` and `[couple-name]/[couple-name].css`
2. Link the CSS with an absolute path: `href="/[couple-name]/[couple-name].css"`
3. Define `:root` tokens at the top of the couple's CSS to establish their color palette
4. Each page is fully self-contained — inline the countdown and RSVP JS directly in the HTML `<script>` tag (see sofia-and-carlos pattern)

## Build Tooling (Future Consideration)

There is currently no bundler or build step. As more couple pages are added, a lightweight bundler (e.g., Vite) would enable shared HTML component templates, CSS base layers with per-couple overrides, and minification — reducing copy-paste overhead between pages.
