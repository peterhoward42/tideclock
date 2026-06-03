# tideclock

Source for **[The Tide Dial](https://thetidedial.page)** — a static web app that shows UK coastal tide times as a visual “instrument”, emphasising the relationship between now and the next high or low tide while still showing the full day. See [`docs/specs/elevator-pitch.md`](docs/specs/elevator-pitch.md) for the product story.

**Live site:** [https://thetidedial.page](https://thetidedial.page) (Looe, Cornwall is preselected on first visit.)

## About the app

The Tide Dial is for people who live in or visit UK coastal areas. It does not aim to surface data you cannot already get from tide tables or other apps; its character comes from how the day is presented — a 24-hour curve with markers for highs and lows, and pointers for the current time, the next tidal event, and the interval between them.

In the app menu, **Tide Nerd** and **Software Nerd** explain tides and how the software is built for curious visitors. This repository README is aimed at people working on or deploying the code.

## Stack

- **Svelte 5** + **Vite** — single-page application (hash routing), built to static assets in `dist/`
- **Runtime tide data** — fetched from a separate [tide proxy](https://github.com/peterhoward42/tideproxy) (WorldTides upstream); not bundled in this repo
- **Town list** — baked into the client build (`tools/towns2/` — see [`tools/towns2/README.md`](tools/towns2/README.md))

End-user technical overview: [Software Nerd](https://thetidedial.page/#/softwarenerd) in the live app (also `#/softwarenerd`). Tide background: [Tide Nerd](https://thetidedial.page/#/tidenerd).

## Local storage

All persistence is in the browser’s **`localStorage`** on the user’s device — nothing is sent to a first-party server for storage.

| Key | Purpose |
|-----|---------|
| `current-location` | The town you chose for tide display (JSON snapshot). |
| `tide-extremes-at-location` | Cached high/low extremes for the current civil day, to avoid refetching when possible. |
| `tideclock.keepScreenAwake` | Optional “keep screen awake” preference for the home tide view. |
| `tideclock.proxyUserId` | Opaque per-browser installation id (ULID) for telemetry correlation. |

On a first visit with empty storage, the app shows tides for **Looe, Cornwall** until you pick another location (see **Location** in the menu). Cookie policy, safety wording, tide-data copyright, and related notices are on the in-app **[About](https://thetidedial.page/#/about)** page (`#/about`), not duplicated here.

**Runtime telemetry:** anonymous product events (route visits, location picks, errors, etc.) are POSTed to a separate ingest API when `VITE_TELEMETRY_BASE_URL` is configured at build time. Payload shape: [`src/infrastructure/telemetry/telemetryPayload.ts`](src/infrastructure/telemetry/telemetryPayload.ts).

## Getting started

```bash
git clone git@github.com:peterhoward42/tideclock.git
cd tideclock
npm install
cp .env.example .env   # set VITE_TIDE_PROXY_BASE_URL and VITE_TELEMETRY_BASE_URL
npm test
npm run dev
```

Opens the Vite dev server (default [http://localhost:5173](http://localhost:5173)) with hot reload. Dev-only URL query parameters for diagram and tide-load previews are listed under [Developer previews](#developer-previews) below.

**`npm run preview`** serves the already-built production output from `dist/` locally. Use it after `npm run build` when you want to check the static bundle (routing, assets, env-injected values) without deploying. It is not used for day-to-day feature work — use `npm run dev` for that.

## Build and deploy

```bash
npm run build
```

Produces `dist/` for static hosting.

**Hosting:** [Vercel](https://vercel.com/) — static build on **git push**, single production environment. The live site is [thetidedial.page](https://thetidedial.page).

**Build-time configuration:** set `VITE_TIDE_PROXY_BASE_URL` and `VITE_TELEMETRY_BASE_URL` (see [`.env.example`](.env.example)) so the client knows where to request `/v1/tides` and POST `/v1/events`. Configure the same variables in the Vercel project for production builds.

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/specs/elevator-pitch.md`](docs/specs/elevator-pitch.md) | Product introduction |
| [`docs/specs/tide-diagram.md`](docs/specs/tide-diagram.md) | Home diagram behaviour and layout |
| [`src/ui/README.md`](src/ui/README.md) | Shell, routes, operator notice (contributors) |
| [`build/README.md`](build/README.md) | Vite build, env vars, Vercel deploy, build commit |
| [`tools/towns2/README.md`](tools/towns2/README.md) | Location data tooling (not runtime) |

In-app routes **Tide Nerd** and **Software Nerd** cover tide background and technical architecture for visitors.

## Licence

This repository is licensed under the **MIT License**. See [`LICENSE`](LICENSE).

Tide times are fetched at runtime from a separate proxy (WorldTides upstream) and are **not**
distributed as part of this repository.

The baked town list shipped in the client build is compiled from curated sources and geocoding
passes, including OpenStreetMap via Nominatim. © OpenStreetMap contributors; OpenStreetMap data is
licensed under the Open Data Commons Open Database License (ODbL). See
[`openstreetmap.org/copyright`](https://www.openstreetmap.org/copyright).

---

## Operator notice (production)

To show visitors that the app is unavailable (no tides, no navigation): edit **`src/ui/operatorNoticeConfig.ts`**, set **`OPERATOR_NOTICE_ACTIVE`** to **`true`**, commit, and **redeploy**. Set it back to **`false`** when done. Edit **`src/ui/operatorNoticeCopy.ts`** if you need different wording.

---

## Developer previews

Dev only (`npm run dev`; not production or `vite preview`). Paste a URL to force a Home diagram branch or a fake tide-load outcome.

**Diagram** (`diagramPreview`)

- http://localhost:5173/#/?diagramPreview=no-more-tides-today — no more tides today
- http://localhost:5173/#/?diagramPreview=time-delta-short — Now label + radial hidden (under 5 min before next)
- http://localhost:5173/#/?diagramPreview=time-delta-medium — Now label hidden, radial shown (5 min–1 hr)
- http://localhost:5173/#/?diagramPreview=atypical-tide-day — atypical / “Tricky tides today”

**Tide load** (`tideUxPreview`)

- http://localhost:5173/#/home?tideUxPreview=load-failed — load error
- http://localhost:5173/#/home?tideUxPreview=load-stuck — loading stuck
- http://localhost:5173/#/home?tideUxPreview=no-extremes-today — no extremes today
- http://localhost:5173/#/home?tideUxPreview=quota-exhausted — quota exhausted
