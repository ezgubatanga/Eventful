# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Style

Keep all responses minimal. No preamble, no summaries, no filler.

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

## Mobile Nav (Hamburger)

All wedding pages must include a hamburger menu for mobile (`≤768px`). Pattern from `sofia-and-carlos`:
- Button: `.nav-hamburger#nav-hamburger` with 3 `<span>` children
- Menu: `<ul class="nav-links" id="nav-links">`
- CSS: hamburger + animated open state in the couple's CSS file
- JS: toggle `.open` on both elements; close on any link click; inline in the page `<script>` block

## Social Sharing Meta Tags

Every page (root and couple pages) must include Open Graph and Twitter Card meta tags. For couple pages, source the values as follows:

- `og:title` / `twitter:title` — from the page `<title>`
- `og:description` / `twitter:description` — from the `.hero-location` text
- `og:image` / `twitter:image` — from the hero section background image URL, resized to `w=1200`
- `og:type` — always `website`
- `twitter:card` — always `summary_large_image`

```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://eventful.page/[couple-slug]" />
<meta property="og:title" content="[Title]" />
<meta property="og:description" content="[Location]" />
<meta property="og:image" content="[Hero image URL ?w=1200]" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Title]" />
<meta name="twitter:description" content="[Location]" />
<meta name="twitter:image" content="[Hero image URL ?w=1200]" />
```

## Build Tooling (Future Consideration)

There is currently no bundler or build step. As more couple pages are added, a lightweight bundler (e.g., Vite) would enable shared HTML component templates, CSS base layers with per-couple overrides, and minification — reducing copy-paste overhead between pages.
