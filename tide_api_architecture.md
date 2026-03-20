# Tide Data Architecture Recommendation

## Summary

The recommended architecture is:

**WorldTides API + minimal proxy server (for API key protection) + per-device client-side caching**

---

## Why this works

### 1. Matches your data requirements perfectly
You only need:
- High tide time + height
- Low tide time + height
- For today or the next few days

WorldTides provides exactly this via its *extremes* endpoint.

---

### 2. Licensing aligns with per-device caching

WorldTides allows:
- Caching a prediction for a **single user/device**
- Reusing that data on that same device

It does **not** allow:
- Server-side caching and redistribution to multiple users

Your design:
- Fetch once per device
- Store locally (e.g. localStorage / IndexedDB)
- Reuse until expiry

This fits their permitted model.

---

### 3. Avoids UKHO Discovery constraints

UKHO Discovery:
- Forbids caching entirely (including local storage)
- Requires live requests every time
- Uses station-based queries

Your design requires persistence, so Discovery is not suitable.

---

### 4. Minimal server solves the API key problem

Problem:
- Browser apps cannot securely store API keys

Solution:
- Tiny proxy endpoint:
    - Receives request from browser
    - Adds API key server-side
    - Forwards request to WorldTides
    - Returns result

This:
- Keeps your API key private
- Adds negligible cost and complexity

---

### 5. Extremely low cost and complexity

- Very low request volume
- Tiny data payloads
- Minimal infrastructure (e.g. Cloud Function)

No database required.

---

## Suggested architecture

1. Client:
    - Get user location
    - Call your proxy endpoint
    - Store response locally (with timestamp)
    - Reuse cached data until stale

2. Proxy server:
    - Stateless
    - Adds API key
    - Forwards request to WorldTides
    - Returns response

---

## Benefits

- Simple
- Cheap
- Scales naturally
- Legally aligned with API terms
- No heavy backend required

---

## Final conclusion

This approach gives you:

- The simplicity of a mostly client-side app
- The safety of protected credentials
- The efficiency of per-device caching
- The flexibility of lat/long queries

It is the best balance between:
- cost
- legality
- technical simplicity
