# RunwayPilot — 13-week cash forecasting with PayPal receivables and an AI CFO memo


**Live demo:** https://runwaypilot-phi.vercel.app
Paste or import weekly cash data, set an opening balance and a cash floor, and RunwayPilot shows runway, the lowest balance, a chart, and concrete CFO actions (defer, draw credit, negotiate the biggest pre-breach outflow). Pro adds scenarios (receivables delay, cost cuts); Firm adds multi-client workspaces for fractional-CFO firms.

## PayPal + AI (PayPal AI Hackathon build)
- **PayPal Invoicing API (sandbox):** `/api/invoices` pulls open invoices (DRAFT/SENT/UNPAID/PARTIALLY_PAID) and the UI adds them to the forecast as expected inflows in their due week. `/api/invoice-action` **sends** drafts or **reminds** on sent invoices; rows due before a forecast cash-floor breach are flagged in red. `/api/seed` creates demo draft invoices (example.com recipients only).
- **AI CFO memo:** `/api/memo` sends a precomputed forecast summary + invoices to OpenAI (`gpt-4o-mini`, JSON mode) for a weekly memo (Position / Risk / Actions) and a chase order with reasons. A deterministic priority score (overdue, due-before-breach, draft, size) is the fallback.
- **Safety:** credentials live only in Vercel env vars (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `OPENAI_API_KEY`; see `.env.example`). The public demo can only contact `example.com` sandbox recipients. Without PayPal env vars, the app uses a clearly labeled **MOCK** dataset.

## Architecture
- **Vercel serverless functions** in `api/` (Node, no dependencies) for PayPal and AI calls.
- **Static SPA** (`index.html`, `app.js`) deployable to any edge host (Vercel), no server needed for the MVP.
- **Forecast engine** (`engine.js`): pure functions, integer cents (no float drift), shared by browser and Node tests.
- **State**: per-workspace data in `localStorage` (`runwaypilot.v1`).
- **Planned production schema** (Postgres): `orgs(id, plan, stripe_customer)`, `workspaces(id, org_id, name, opening_cents, floor_cents)`, `cash_rows(workspace_id, week, inflow_cents, outflow_cents, memo)`, `alerts(workspace_id, week, message, sent_at)`.

## Monetization
Free ($0, 1 workspace) → Pro ($29/mo: scenarios, weekly email alerts) → Firm ($149/mo: 25 client workspaces, white-label PDF packs). Target: fractional-CFO and bookkeeping firms that each bring 10–40 SMB clients.

## Run locally
```bash
npm test            # 5 engine tests
npx serve .         # or open index.html
```
Query params for demos: `?plan=Pro&delay=2&cut=15`. Deploy: `vercel --prod` (static).

MIT licensed.
