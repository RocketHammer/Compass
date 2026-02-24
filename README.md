# Compass Quest

A Progressive Web App that turns your phone into a compass pointing at any destination. Enter coordinates, paste a Google Maps link, or cast a waypoint by aiming your phone — the arrow guides you there.

Works fully offline once installed. No accounts, no servers, no tracking.

## Features

- **Multi-format destination input** — raw coordinates, DMS notation, Google Maps URLs, or Plus Codes
- **Cast a Point** — swipe up 3 times to enter cast mode, aim your phone, pick a distance, and set a waypoint in any direction
- **Offline-first** — service worker caches everything; works without a connection after first load
- **Arrival detection** — adapts to GPS accuracy; pulses gold when you've arrived
- **Achievements** — earn milestones for navigation feats, with export/import to preserve progress
- **Tap to copy** — tap any coordinate display to copy it to your clipboard

## Install

1. Open the app in Chrome on your Android device
2. Tap the three-dot menu and select "Add to Home screen"
3. The app installs as a standalone PWA and works offline

Hosted on GitHub Pages — deploys automatically from `main`.

## Tech

Single-page vanilla JS app. No frameworks, no build tools, no dependencies.

| File | Purpose |
|------|---------|
| `index.html` | PWA shell, SVG compass, overlays |
| `styles.css` | Dark theme, mobile-first layout |
| `app.js` | All logic: sensors, math, rendering, input parsing, achievements |
| `sw.js` | Cache-first service worker for offline support |
| `manifest.json` | PWA manifest (standalone, portrait) |

### Sensor Strategy

Device heading uses a 5-tier fallback hierarchy:

1. `deviceorientationabsolute` (Android — best)
2. `webkitCompassHeading` (iOS Safari)
3. Standard event with `event.absolute === true` (Firefox Android)
4. Non-absolute alpha (unreliable, last resort)
5. Unavailable

### Updating

Bump `CACHE_NAME` in `sw.js` and the version in `index.html` on every deploy. The cache-first service worker won't pick up changes otherwise.
