# Tide Dial telemetry ingest contract (v1)

Contract between **The Tide Dial** browser client and the **telemetry ingest service**.
Copy this file (or link to it) when requesting changes to the injector.

**Client source of truth:** `src/infrastructure/telemetry/`  
**Build config:** `VITE_TELEMETRY_BASE_URL` — origin only, no trailing slash

---

## HTTP

```
POST {VITE_TELEMETRY_BASE_URL}/v1/events
Content-Type: application/json
Accept: application/json
```

| Item | Value |
|------|--------|
| Method | `POST` |
| Path | `/v1/events` |
| Auth | None (v1) |
| Body | One JSON event object per request |
| Client behaviour | Fire-and-forget; `keepalive: true`; no retries; failures swallowed |
| CORS | Must allow browser POST from app origin (`https://thetidedial.page`, plus dev if needed) |

Any `2xx` response is acceptable. Client does not read the response body.

---

## Request body

Flat JSON. No nested context. No free-form error text. No PII.

### Fields

| Field | Required | Type | Rules |
|-------|----------|------|-------|
| `eventId` | yes | string | UUID v4 (`crypto.randomUUID()`) — unique per emission |
| `type` | yes | string | Closed enum — see [Event types](#event-types) |
| `occurredAt` | yes | string | UTC ISO-8601 (`new Date().toISOString()`) |
| `proxyUserId` | yes | string | 26-char ULID; pattern `^[0-7][0-9A-HJKMNP-TV-Z]{25}$` |
| `errorQualification` | conditional | string | Required when `type` is `error`. Must be **absent** otherwise |

### Validation

1. `type === "error"` → `errorQualification` required.
2. `type !== "error"` → `errorQualification` must not be present.
3. Unknown enum values: **TBD by ingest service** (reject 400 vs quarantine).
4. `eventId` is the natural idempotency key if ingest dedupes.

---

## Event types

Stable snake_case strings. No per-type payload fields.

| `type` | Meaning |
|--------|---------|
| `loaded` | App booted in this tab (once per full page load) |
| `set_custom_loc` | User chose a town via Location picker |
| `opened_menu_from_diagram` | Opened home menu from SVG diagram trigger |
| `opened_menu_from_header` | Opened header menu on a non-home route |
| `visited_stick_on_wall` | Navigated to `#/onwall` |
| `used_screen_awake` | User enabled “Keep screen awake” |
| `used_really_full` | User entered “Really fullscreen” on home |
| `visited_story` | Navigated to `#/story` |
| `clicked_thru_to_coffee` | Buy Me a Coffee click on **Story page only** |
| `clicked_thru_to_drawexact` | DrawExact outbound click on Story page |
| `visited_tide_nerd` | Navigated to `#/tidenerd` |
| `visited_sw_nerd` | Navigated to `#/softwarenerd` |
| `visited_about` | Navigated to `#/about` |
| `visited_contact` | Opened Contact panel in a menu |
| `error` | User-visible failure — see [Error qualifications](#error-qualifications) |

Client does **not** dedupe by type. Same installation may emit the same type many times.

---

## Error qualifications

Only when `type === "error"`.

| `errorQualification` | Meaning |
|----------------------|---------|
| `tide_load_failed` | Tide fetch failed |
| `tide_quota_exhausted` | Upstream tide credits exhausted |
| `diagram_render_failed` | Diagram generation/render failed |

---

## Examples

**Product event:**

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "visited_story",
  "occurredAt": "2026-06-02T12:00:00.000Z",
  "proxyUserId": "01ARZ3NDEKTSV4RRFFQ69G5FAV"
}
```

**Error event:**

```json
{
  "eventId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "type": "error",
  "occurredAt": "2026-06-02T12:01:00.000Z",
  "proxyUserId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "errorQualification": "tide_load_failed"
}
```

---

## Client skip conditions

No POST is sent when:

- `VITE_TELEMETRY_BASE_URL` is unset or empty at build time, or
- `proxyUserId` cannot be persisted (e.g. `localStorage` blocked)

---

## Out of scope (v1)

Not sent unless we agree an extension:

- Identity, email, town/location, coordinates
- User agent, viewport, referrer, IP
- Error messages or stack traces
- Session id (correlate via `proxyUserId` + time)
- Batched events (always one event per POST)

---

## Open questions for ingest service

1. Preferred success status — `204` vs `201`?
2. Invalid payload — `400` with problem JSON, or accept-and-quarantine?
3. Auth — API key, origin trust only, or public + rate limit?
4. Rate limits — per `proxyUserId`, per IP, global?
5. Storage — flat log vs normalized columns for `type` / `errorQualification`?
6. Versioning — is `/v1/events` stable, or plan `/v2` for breaking changes?

---

## Change request template

```
Contract: docs/specs/telem-contract.md (v1)
Requested change:
Breaking?: yes / no
Client follow-up needed?: yes / no
```
