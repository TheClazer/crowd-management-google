# Scripts

## Database (optional — Supabase only)

CrowdGuard runs fully offline in demo mode with **no database**. These SQL files
are only needed if you wire up a live Supabase project (set
`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`).

Run them in order against your Postgres/Supabase database:

| File | Purpose |
| --- | --- |
| `01-create-tables.sql` | Schema: events, users, zones, incidents, crowd density, anomalies, lost persons. |
| `02-seed-data.sql` | Seed rows for the demo event so a fresh database is immediately usable. |

```bash
# Example: pipe into psql (or paste into the Supabase SQL editor)
psql "$DATABASE_URL" -f scripts/01-create-tables.sql
psql "$DATABASE_URL" -f scripts/02-seed-data.sql
```

## Smoke tests (`test-*.js` / `test_*.js` in the repo root)

Lightweight scripts that hit the running app over HTTP to sanity-check the AI
pipeline end to end. They are **not** a unit-test suite — they print
human-readable output you eyeball.

**Prerequisites for every script:**
1. Start the dev server first: `npm run dev` (serves `http://localhost:3000`).
2. Node 18+ (they use the built-in global `fetch`).
3. No env or Python backend required — every route has graceful demo fallbacks,
   so the scripts pass in pure demo mode.

| Script | Exercises |
| --- | --- |
| `test-simple.js` | `/api/chat` — RAG retrieval for a fire-extinguisher question. |
| `test-fire.js` | `/api/chat` — RAG fire-safety retrieval. |
| `test-rag.js` | `/api/chat` — RAG medical (allergic reaction). |
| `test-final.js` | `/api/chat` — asserts a complete, non-truncated answer. |
| `test-debug.js` | `/api/chat` — prints retrieved blocks + similarity scores. |
| `test_predict_api.js` | `/api/crowd-density` — XGBoost 15-min forecasts. |
| `test_routing_integration.js` | `/api/planned-route` — crowd-aware routing. |

```bash
npm run dev                 # terminal 1
node test_predict_api.js    # terminal 2
node test_routing_integration.js
node test-simple.js
```
