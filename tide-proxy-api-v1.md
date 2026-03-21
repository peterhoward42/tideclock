# Tide Proxy API (v1)

## Endpoint
`GET /v1/tides`

## Query Parameters
- `lat` (number, required): latitude in [-90, 90]
- `lon` (number, required): longitude in [-180, 180]

## Behaviour
- Returns high and low tide extremes only
- Datum is fixed to Chart Datum (`CD`)
- Times are returned in UTC
- Coverage window:
  - Start: 00:00:00 UTC today
  - End: 00:00:00 UTC three days later (exclusive)
- No caching
- Upstream attribution is included

## Response (200)
```json
{
  "tides": [
    {
      "type": "High",
      "time": "2026-03-21T06:12:00Z",
      "heightMetres": 4.81
    }
  ],
  "datum": "CD",
  "windowStart": "2026-03-21T00:00:00Z",
  "expiresAt": "2026-03-24T00:00:00Z",
  "attribution": "Tidal predictions covered by various copyrights."
}
```

### Fields
- `tides`: array of tide extremes sorted by time
  - `type`: `"High"` or `"Low"`
  - `time`: ISO 8601 UTC timestamp
  - `heightMetres`: height in metres relative to CD
- `datum`: always `"CD"`
- `windowStart`: inclusive UTC start of forecast window
- `expiresAt`: exclusive UTC end of forecast window
- `attribution`: upstream copyright string

## Errors

### 400 Bad Request
Invalid or missing query parameters.

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "..."
  }
}
```

### 502 Bad Gateway
Upstream request failed.

```json
{
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "Failed to retrieve tidal data"
  }
}
```
