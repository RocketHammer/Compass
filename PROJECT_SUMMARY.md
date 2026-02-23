# Compass PWA — Project Summary

A Progressive Web App compass for Android that reads device GPS and orientation sensors to point an arrow at a fixed destination. Works fully offline via service worker caching. Deployed on GitHub Pages at `https://rockethammer.github.io/Compass/`.

## Architecture

Single-page vanilla JS app with no build tools or dependencies. All logic lives in four files plus a service worker:

- **index.html** — PWA shell with SVG compass arrow, status badges, input controls, cast-a-point picker
- **styles.css** — Dark theme (#1a1a2e bg, #e94560 accent), mobile-first flexbox layout, max-width 480px
- **app.js** — All application logic (~1300 lines): state management, sensor APIs, math, rendering, input parsing, cast feature
- **sw.js** — Cache-first service worker for offline support. Cache version must be bumped on every deploy.
- **manifest.json** — PWA manifest with standalone display, portrait orientation, icons at `icons/icon-192.png` and `icons/icon-512.png`

### Core Pattern

A flat `state` object is read every frame by a `requestAnimationFrame` render loop. Sensor callbacks (GPS, orientation) write to state; the render function reads state and updates the DOM. All DOM writes happen in `render()` to keep everything data-driven.

```
State ← Sensors (GPS, orientation)
State → render() → DOM updates (every frame)
```

## Features Built (in order)

### 1. Destination Input Parsing (`parseDestinationInput`)
Multi-format parser that accepts:
- **Raw decimal coordinates**: `40.7128, -74.0060`
- **DMS notation**: `42°11'36.0"N 88°04'03.9"W` (handles Unicode prime/double-prime characters)
- **Google Maps URLs**: `@lat,lng` notation and `?q=lat,lng` query params
- **Full Plus Codes**: `87G8Q2PQ+VX` (includes a complete Open Location Code decoder)

Short Plus Codes (e.g., `Q9WP+GG9`) are intentionally unsupported — they require a geocoding database to resolve the city reference.

### 2. Device Orientation Layer (`getDeviceHeading`)
Dual-listener strategy that attaches both `deviceorientationabsolute` and `deviceorientation` simultaneously, with a 5-tier heading source hierarchy:

1. **Tier 1 — `deviceorientationabsolute` event** (Android, best quality)
2. **Tier 2 — `webkitCompassHeading`** (iOS Safari proprietary)
3. **Tier 3 — standard event with `event.absolute === true`** (Firefox Android)
4. **Tier 4 — non-absolute alpha** (last resort, unreliable)
5. **Tier 5 — unavailable**

**Critical detail**: The W3C spec defines `event.alpha` as increasing *counter-clockwise*. Compass headings increase *clockwise*. All handlers apply `(360 - event.alpha) % 360` to convert. This was a bug that caused east/west inversion in the initial implementation.

iOS requires a user gesture to grant compass permission via `DeviceOrientationEvent.requestPermission()` — the app shows a permission button when needed.

### 3. Bearing Calculation (`calculateBearing`)
Forward azimuth using spherical trigonometry (the navigation triangle). Takes two lat/lng pairs and returns bearing in degrees 0-360. Extensively commented with geometric explanations.

### 4. Distance Calculation (`calculateDistance`)
Haversine formula for great-circle distance. Returns meters.

### 5. Point Projection (`projectPoint`)
The inverse of bearing+distance — given a start point, compass bearing, and distance in meters, computes the destination lat/lng. Uses the spherical law of cosines (direct geodesic problem). Used by the cast-a-point feature.

### 6. Compass Rendering
- SVG arrow rotated via CSS `transform: rotate()` driven by `requestAnimationFrame`
- Exponential lerp (factor 0.2) for smooth rotation
- Shortest-path normalization `((diff % 360) + 540) % 360 - 180` prevents 359°→1° full-spin
- Arrow formula: `arrowAngle = bearing - deviceHeading`
- Arrow is hidden (opacity 0) until a destination is set, then fades in via CSS transition

### 7. Cast a Point (v0.5)
Gesture-activated feature for projecting a waypoint by aiming the phone and selecting a distance:

- **Activation**: 3 upward swipes over the compass area (50px min delta, 500ms max per swipe, all within 2 seconds)
- **UI transition**: Arrow fades out, ring stays, distance picker appears centered in the ring
- **Distance picker**: 5-label vertical drum (far/near/center/near/far with graduated font sizes). Touch-drag with momentum scrolling and decay animation.
- **Adaptive distance steps** (~92 values): 10-100m (5m steps), 100-500m (25m), 500-1km (50m), 1-5km (250m), 5-20km (1km), 20-100km (5km). Minimum 10m accounts for GPS accuracy.
- **Bearing display**: Shows live device heading during cast mode so user can aim
- **Cast action**: Takes current heading + selected distance → `projectPoint()` → sets as destination
- **Controls**: Cancel (ghost button) and Cast (accent fill button) replace the normal footer
- CSS class `.cast-active` on `#app` controls all visibility toggling

### 8. Service Worker & Offline
Cache-first strategy. Pre-caches all app assets on install. Old caches are deleted on activation. Cache name must be bumped (`compass-vN`) on every code change to invalidate the old cache on users' phones.

### 9. Version Display
`#app-version` element in the footer shows current version (e.g., `v0.5`). Used to confirm updates have propagated to the phone. Bump both the version string in index.html and `CACHE_NAME` in sw.js on every deploy.

## Deployment

Hosted on GitHub Pages from the `main` branch at `github.com/RocketHammer/Compass`. After pushing, GitHub Pages redeploys automatically (~30 seconds). Users may need to unregister the old service worker at `chrome://serviceworker-internals/` if the cache is stubborn.

## Known Considerations

- **HTTPS required**: Sensor APIs (geolocation, device orientation) only work over HTTPS or localhost. GitHub Pages provides HTTPS. For local testing, use a self-signed cert with `http-server --ssl`.
- **Alpha inversion**: Always use `(360 - event.alpha) % 360` when converting W3C alpha to compass heading. Raw alpha is counter-clockwise; compass headings are clockwise.
- **Service worker caching**: The cache-first strategy means code updates require bumping the cache version in `sw.js`. Users may need to close and reopen the app twice, or manually clear site data.
- **Short Plus Codes**: Not supported. Would require a geocoding database to resolve city references.
