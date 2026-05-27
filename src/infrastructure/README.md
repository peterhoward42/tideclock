# Infrastructure (`src/infrastructure/`)

Small browser adapters with no product UI. The UI shell depends on these; domain code should not import from here except routing.

## Router (`router.js`)

Hash-based SPA routing for static hosting (no server rewrite required).

| Export | Role |
|--------|------|
| `route` | Svelte writable store of {@link RouteId}. |
| `parseHash` | Normalise `#/…` (and bare segments) to a route id; unknown → `home`. |
| `syncRouteFromHash` | Read `window.location.hash`, update store, rewrite legacy segments. |
| `navigate` | Set `location.hash` to `/{id}`. |
| `attachHashListener` | `hashchange` + initial sync; returns unsubscribe. |

**Legacy behaviour:** `#/location2` → `#/location`; placeholder hashes (`settings`, `acknowledgements`, `support`, `cookies`) → `#/home`.

Tests: `router.test.js`. Consumer map: [`../ui/README.md`](../ui/README.md).
