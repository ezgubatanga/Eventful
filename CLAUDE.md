Compressing manually per caveman rules.

# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repo.

## Communication Style

Minimal responses. No preamble, no summaries, no filler.

## What is Eventful

Platform builds bespoke wedding websites. Each couple gets own subdirectory, custom look and feel.

## Project Structure

```
/                          ← Eventful marketing site
  index.html               ← Landing page
  styles.css               ← Shared CSS for root pages
  script.js                ← JS for the RSVP form on the landing page
  logo.webp / favicon.webp / eventful.webp / pexels-junerydocto.webp / Perfect.mp3

onboarding/index.html      ← Lead-gen onboarding flow for prospective couples

anna-and-marco/            ← Demo couple page
  index.html               ← Self-contained wedding page
  anna-marco.css           ← Custom CSS for this couple only
  dashboard/index.html     ← RSVP dashboard demo
```

## Two Distinct CSS Systems

**Root pages** (`index.html`, `onboarding/index.html`) share `styles.css`:
- Fonts: Bricolage Grotesque + Outfit
- Color tokens: `--primary` (sage green `#5F7161`), `--gold`, `--rose`, `--champagne`

**Couple pages** each have own CSS:
- Fonts differ per couple (Anna & Marco: Parisienne + Cormorant Infant + Outfit)
- Each page defines own `:root` tokens for full visual identity
- Goal: shared base wedding CSS couples override via own tokens, not full duplication

## Deployment

VS Code → GitHub → Vercel. No build step. Files served as-is.

CSS paths in couple pages must use absolute URLs (e.g., `/anna-and-marco/anna-marco.css`) — avoids Vercel trailing-slash routing issues.

## Adding a New Couple's Page

1. Create `[couple-name]/index.html` and `[couple-name]/[couple-name].css`
2. Link CSS with absolute path: `href="/[couple-name]/[couple-name].css"`
3. Add favicon: `<link rel="icon" type="image/webp" href="/favicon.webp" />`
4. Define `:root` tokens at top of couple's CSS for color palette
5. Pages fully self-contained — inline countdown and RSVP JS in `<script>` tag (see anna-and-marco)

## Smooth Scroll

All pages use JS-driven ease-in/out scroll (quadratic bezier), not CSS `scroll-behavior: smooth`. Set `html { scroll-behavior: auto }`. Add to every page's `<script>` block:

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

`- 72` offset = fixed nav height.

## Preloader

Every page needs animated gold preloader. Pattern from `anna-and-marco`:
- CSS: `.preloader-overlay` + `.loader` + `flowe-one/two/three` keyframes in couple's CSS. Uses `var(--bg)` background, `var(--gold)` spinner.
- HTML: `<div id="page-preloader" class="preloader-overlay">` with three SVGs (`#pegtopone`, `#pegtoptwo`, `#pegtopthree`). Each SVG needs **unique** gradient/filter/mask IDs (suffix `-a`, `-b`, `-c`) to avoid conflicts.
- JS: `window.addEventListener('load', () => setTimeout(() => preloader.classList.add('hidden'), 300))`

## Mobile Nav (Hamburger)

All wedding pages need hamburger menu for mobile (`≤768px`). Pattern from `anna-and-marco`:
- Button: `.nav-hamburger#nav-hamburger` with 3 `<span>` children
- Menu: `<ul class="nav-links" id="nav-links">`
- CSS: hamburger + animated open state in couple's CSS
- JS: toggle `.open` on both elements; close on link click; inline in `<script>` block

## Social Sharing Meta Tags

Every page needs Open Graph and Twitter Card meta tags. Couple page values:

- `og:title` / `twitter:title` — from page `<title>`
- `og:description` / `twitter:description` — from `.hero-location` text
- `og:image` / `twitter:image` — hero background image URL, resized to `w=1200`
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

RSVP must include **Phone Number** field (optional, `type="tel"`) after email:

```html
<div class="rsvp-field">
  <label class="rsvp-label" for="rsvp-phone">Phone Number</label>
  <input class="rsvp-input" type="tel" id="rsvp-phone" placeholder="+1 (555) 000-0000" />
</div>
```

Field order: Full Name → Email → Phone Number → Will you attend? → Number of guests → Message.

## RSVP Form — Plus-One Restriction

"Number of guests" must indicate plus-one only if invitation allows:

```html
<select class="rsvp-input" id="rsvp-guests">
  <option value="1">Just me (1)</option>
  <option value="2">With a plus-one (2) — only if your invitation permits</option>
</select>
<p class="rsvp-hint">A plus-one may only be brought if your invitation explicitly includes one.</p>
```

Add `.rsvp-hint` to couple's CSS:

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

Inline SVG icons only — no emojis. Icon span uses `.contact-card-icon` with `color: var(--gold)` and `svg { display: block }`. Standard: person SVG for bride/groom, clipboard SVG for coordinator.

## Functional Add-Ons (Patterns)

### Background Music
mp3 in couple's folder. Add `<audio>` + floating `.music-btn` (bottom-right). Toggle play/pause and `.playing` class + pulse animation in JS. Pattern from `anna-and-marco`.

Include tab visibility handling — pause on hide, resume only if was playing:

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
Add `<select id="rsvp-meal">` in RSVP grid. Add second meal field (`id="rsvp-meal-guest2"`, class `rsvp-meal-guest2`, hidden by default). JS: show second field when guests = `'2'`, hide and reset otherwise.

```css
.rsvp-meal-guest2 { display: none; }
.rsvp-meal-guest2.visible { display: flex; }
```

### Featured Video
`.video-section` with `.video-wrapper` containing `<iframe>`. Aspect ratio 16/9. Pattern from `anna-and-marco`.

### Gift Registry
`.registry` section with `.registry-cards` (3-column grid). Each card: icon, name, description, link. Pattern from `anna-and-marco`.

## Build Tooling (Future Consideration)

No bundler or build step. As pages grow, lightweight bundler (e.g., Vite) would enable shared HTML templates, CSS base layers with per-couple overrides, minification — cuts copy-paste overhead.