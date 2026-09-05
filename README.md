# Revive — Revenue Recovery Engine

**Razorpay AI Buildathon 2026 · Track 03: AI Revenue Recovery**

Revive is an autonomous agent that finds revenue slipping away — failed
payments, abandoned checkouts, overdue invoices — diagnoses why, picks
the right recovery action, enforces compliance guardrails, and logs
every decision to a full audit trail.

## What it does

For every at-risk transaction in a batch, Revive runs a 5-step pipeline:

1. **Classify** — determine the root cause of failure (insufficient
   funds, card expired, bank decline, checkout abandonment, invoice
   overdue)
2. **Decide** — select the appropriate recovery action for that cause
3. **Compliance gate** — hard-coded rules, not AI-decided: max retry
   attempts, no contact outside 9am–8pm, no contact if opted out,
   disputed/VIP accounts always routed to a human
4. **Execute** — simulate the recovery action
5. **Log** — write a structured audit entry (timestamp, root cause,
   action taken, reasoning, compliance status)

## Features

- **Overview** — live KPIs (amount at risk, recovered, recovery rate,
  escalated count), a "Run Batch" button that triggers the real
  pipeline, and a scroll-scrubbed hero video
- **Breakdown** — recovery performance broken down by root cause and
  by intervention type
- **Audit Trail** — full, searchable, filterable log of every decision
  the agent made

## Tech stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript

## Running locally

**Backend**
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:4000`

**Frontend** (separate terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

Open `http://localhost:5173` in your browser, then click **Run Batch**
on the Overview tab to execute the recovery pipeline against the mock
transaction dataset.

## Project structure

```
revive-app/
├── assets/           # source video asset
├── backend/
│   └── src/
│       ├── engine.ts      # classify → decide → comply → execute pipeline
│       ├── mock-data.ts   # mock transaction dataset
│       ├── types.ts
│       └── index.ts       # Express server + API routes
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.tsx
        │   ├── OverviewTab.tsx
        │   ├── BreakdownTab.tsx
        │   ├── AuditTrailTab.tsx
        │   └── ScrollScrubVideo.tsx
        ├── api.ts
        └── App.tsx
```


## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/run-batch` | POST | Runs the recovery pipeline against the mock batch |
| `/api/stats` | GET | Returns aggregated recovery stats |
| `/api/audit-log` | GET | Returns the full, paginated decision log |
