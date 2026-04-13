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
3. Add the favicon: `<link rel="icon" type="image/webp" href="/favicon.webp" />`
4. Define `:root` tokens at the top of the couple's CSS to establish their color palette
5. Each page is fully self-contained — inline the countdown and RSVP JS directly in the HTML `<script>` tag (see sofia-and-carlos pattern)

## Smooth Scroll

All pages use JS-driven ease-in/out scroll (quadratic bezier) instead of CSS `scroll-behavior: smooth`. Set `html { scroll-behavior: auto }` in CSS. Add this to every page's `<script>` block:

```js
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + start - 72;
    const duration = 800;
    let startTime = null;
    const ease = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const step = ts => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      window.scrollTo(0, start + (end - start) * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
});
```

The `- 72` offset accounts for the fixed nav height.

## Preloader

Every page must include the animated gold preloader. Pattern from `sofia-and-carlos`:
- CSS: `.preloader-overlay` + `.loader` + `flowe-one/two/three` keyframes in the couple's CSS file. Uses `var(--bg)` for background and `var(--gold)` for the spinner color.
- HTML: `<div id="page-preloader" class="preloader-overlay">` with three SVGs (`#pegtopone`, `#pegtoptwo`, `#pegtopthree`). Each SVG must use **unique** gradient/filter/mask IDs (suffix `-a`, `-b`, `-c`) to avoid conflicts.
- JS: `window.addEventListener('load', () => setTimeout(() => preloader.classList.add('hidden'), 300))`

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

## RSVP Form — Required Fields

The RSVP form must include a **Phone Number** field (optional, `type="tel"`) after the email field:

```html
<div class="rsvp-field">
  <label class="rsvp-label" for="rsvp-phone">Phone Number</label>
  <input class="rsvp-input" type="tel" id="rsvp-phone" placeholder="+1 (555) 000-0000" />
</div>
```

Standard field order: Full Name → Email → Phone Number → Will you attend? → Number of guests → Message.

## RSVP Form — Plus-One Restriction

The "Number of guests" field must always indicate that a plus-one is only permitted if the invitation explicitly allows it:

```html
<select class="rsvp-input" id="rsvp-guests">
  <option value="1">Just me (1)</option>
  <option value="2">With a plus-one (2) — only if your invitation permits</option>
</select>
<p class="rsvp-hint">A plus-one may only be brought if your invitation explicitly includes one.</p>
```

Add `.rsvp-hint` to the couple's CSS:

```css
.rsvp-hint {
  margin: 6px 0 0;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
  font-family: 'Outfit', sans-serif;
  line-height: 1.4;
}
```

## Contact Cards

Use inline SVG icons — never emojis. The icon span uses `.contact-card-icon` with `color: var(--gold)` and `svg { display: block }`. Standard icons: person SVG for bride/groom, clipboard SVG for coordinator.

## Functional Add-Ons (Patterns)

### Background Music
Place the mp3 inside the couple's folder. Add an `<audio>` element and a floating `.music-btn` button (bottom-right corner). Toggle play/pause and the `.playing` class + pulsing animation in JS. Pattern from `anna-and-marco`.

Always include tab visibility handling — pause when tab hides, resume only if audio was playing when user left:

```js
let _musicPausedByTab = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!audio.paused) { audio.pause(); _musicPausedByTab = true; }
  } else {
    if (_musicPausedByTab) { audio.play(); _musicPausedByTab = false; }
  }
});
```

### Meal Selection
Add a `<select id="rsvp-meal">` field in the RSVP grid. Add a second meal field (`id="rsvp-meal-guest2"`) with class `rsvp-meal-guest2` (hidden by default). In JS, listen to the guests dropdown: show the second field when value is `'2'`, hide and reset it otherwise.

```css
.rsvp-meal-guest2 { display: none; }
.rsvp-meal-guest2.visible { display: flex; }
```

### Featured Video
Add a `.video-section` with a `.video-wrapper` containing an `<iframe>`. Aspect ratio 16/9. Pattern from `anna-and-marco`.

### Gift Registry
Add a `.registry` section with `.registry-cards` (3-column grid). Each card has an icon, name, description, and link. Pattern from `anna-and-marco`.

### Calendar Integration
Add `.calendar-add` below the schedule grid with two `.calendar-btn` links: Google Calendar (constructed URL) and Apple Calendar (generated `.ics` Blob). Build both in JS after `DOMContentLoaded`. Pattern from `anna-and-marco`.

## Build Tooling (Future Consideration)

There is currently no bundler or build step. As more couple pages are added, a lightweight bundler (e.g., Vite) would enable shared HTML component templates, CSS base layers with per-couple overrides, and minification — reducing copy-paste overhead between pages.
