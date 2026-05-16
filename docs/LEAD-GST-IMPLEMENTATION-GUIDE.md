# Revue Early Access — Implementation Guide

Reference document for completing **lead capture (name, email, optional GST) → GSTVerify → Google Sheets → Razorpay**.

**Do not start a phase without explicit approval**, unless the user says to implement it.

---

## Locked product decisions

| Topic | Decision |
|-------|----------|
| GST | Optional via checkbox: *"I have a GST number (optional)"* |
| GST API | **GSTVerify** — `GET https://gstverify.co.in/api/v1/verify/{GSTIN}` |
| GST fails / inactive / 502 | **Block payment** (policy A) with clear message |
| Confirmation UI | **None** — save then open Razorpay |
| Sheets integration | **Google Apps Script** webhook (not service account) |
| After payment | **Update same row** with `payment_status`, `razorpay_order_id`, `razorpay_payment_id` |
| Email in modal | Pre-fill from Brevo (`capturedEmail`), **editable** |

---

## Progress tracker

| Phase | Description | Status |
|-------|-------------|--------|
| **1** | GSTVerify key, Google Sheet, Apps Script webhook | User setup (verify Postman append/update works) |
| **2** | Backend `POST /api/gst/lookup` | **Done** |
| **3** | Backend Sheets: save + update | **Done** |
| **4** | Razorpay order notes (`name`, `gstin`) | **Done** |
| **5** | Frontend modal form UI | **Done** |
| **6** | Frontend API client + payment flow | **Done** |
| **7** | Post-payment sheet update | **Done** |
| **8** | Security hardening | Partial (GST rate limit done) |
| **9** | Deployment (Vercel env vars) | **In progress** |
| **10** | End-to-end testing | Not started |

---

## Environment variables

### `backend/.env` (local) and Vercel (production)

| Variable | Required for | Notes |
|----------|----------------|-------|
| `RAZORPAY_KEY_ID` | Payments | Existing |
| `RAZORPAY_KEY_SECRET` | Payments | Existing |
| `FRONTEND_URL` | CORS | e.g. `https://revuesuite.com`, local static origin for dev |
| `GSTVERIFY_API_KEY` | GST lookup | From [gstverify.co.in/dev-api](https://gstverify.co.in/dev-api/) |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Phase 3 | Apps Script `/exec` URL — **not in code yet** |
| `PORT` | Local server | Default `3000` |

### Frontend (Phase 6)

| Config | Notes |
|--------|-------|
| `API_BASE_URL` in `payment-api-client.js` | `https://revuesuite.com` prod; `http://localhost:3000` local |

---

## Google Sheet schema

**Row 1 headers (exact order):**

| Col | Header |
|-----|--------|
| A | timestamp |
| B | name |
| C | email |
| D | gstin |
| E | company |
| F | address |
| G | plan |
| H | payment_status |
| I | razorpay_order_id |
| J | razorpay_payment_id |

**`payment_status` values:** `pending` → `paid`

---

## Apps Script contract (Phase 1.3)

**Webhook:** `POST` JSON to `GOOGLE_SHEETS_WEBHOOK_URL` (follow redirects in Node with `redirect: 'follow'`).

### Append (before Razorpay)

```json
{
  "action": "append",
  "timestamp": "2026-05-15T12:30:00.000Z",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "gstin": "",
  "company": "",
  "address": "",
  "plan": "studio",
  "payment_status": "pending"
}
```

**Response:** `{ "success": true, "rowId": 5 }`

### Update (after payment success)

```json
{
  "action": "update",
  "rowId": 5,
  "payment_status": "paid",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx"
}
```

**Postman:** Method `POST`, Body raw JSON, enable **Follow redirects**.

---

## API reference (current + planned)

### Done: `POST /api/gst/lookup`

**Files:**
- `backend/routes/gstRoutes.js`
- `backend/controllers/gstController.js`
- `backend/services/gstVerifyService.js`
- `backend/middleware/validation.js` → `validateGstLookup`
- `api/gst/lookup.js` (Vercel)

**Body:** `{ "gstin": "27AAPFU0939F1ZV" }`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "gstin": "...",
    "company": "...",
    "tradeName": "...",
    "address": "...",
    "status": "Active"
  }
}
```

**Error codes:** `INVALID_GSTIN`, `GST_NOT_ACTIVE`, `GST_PROVIDER_AUTH_ERROR`, `GST_PROVIDER_UNAVAILABLE`, `GST_API_KEY_MISSING`, etc.

**Rate limit:** 10 / 15 min per IP

**Local test:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/gst/lookup" -Method POST -ContentType "application/json" -Body '{"gstin":"27AAPFU0939F1ZV"}'
```

---

### Phase 3: `POST /api/leads/save`

**Purpose:** Append row to Google Sheet before Razorpay.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "plan": "freelancer|studio",
  "gstin": "",
  "company": "",
  "address": ""
}
```

**Validation:**
- `name` — min 2 chars
- `email` — `validateEmail()`
- `plan` — `freelancer` | `studio`
- If `gstin` non-empty → require `company` + `address` (from prior GST lookup)

**Response:** `{ "success": true, "data": { "rowId": 5 } }`

**Files to create:**
- `backend/services/googleSheetsService.js`
- `backend/controllers/leadController.js`
- `backend/routes/leadRoutes.js`
- `api/leads/save.js`

**Register in `backend/server.js`:**
```js
app.use('/api/leads', leadsLimiter, leadRoutes);
```
Suggested limit: 10 / 15 min (same as GST).

**Service implementation notes:**
- `fetch(GOOGLE_SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), redirect: 'follow' })`
- Parse JSON; if `!success` throw operational error
- Never expose webhook URL to frontend

---

### Phase 3: `POST /api/leads/update`

**Purpose:** Update row H, I, J after `verifyPayment` succeeds.

**Body:**
```json
{
  "rowId": 5,
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx"
}
```

**Response:** `{ "success": true }`

**Files to create:**
- `leadController.updateLead` (or separate handler)
- `api/leads/update.js`

---

## Phase 4 — Razorpay order notes

**Files:** `backend/controllers/orderController.js`, `backend/middleware/validation.js`, `api/orders/create.js`

**Change:** Accept optional `name`, `gstin` in `POST /api/orders/create` body; add to Razorpay `notes` with existing `email`, `plan`.

**Frontend (Phase 6):** Pass `name`, `gstin` in `createOrder()` body.

---

## Phase 5 — Frontend modal UI

**File:** `index.html` — insert section **before** `#m-cta-btn` (modal section S5).

**Elements:**
| ID | Type | Notes |
|----|------|-------|
| `lead-name` | text input | Required |
| `lead-email` | email input | Required; pre-fill in `openModal(email)` |
| `has-gst` | checkbox | Label: "I have a GST number (optional)" |
| `lead-gstin` | text input | Hidden until checked; maxlength 15 |
| `lead-form-error` | div | Inline errors |

**Script (inline or `lead-form.js`):**
- Toggle `#lead-gstin` visibility on `#has-gst` change; clear GSTIN when unchecked
- `openModal(email)` → set `#lead-email.value = email`

**File:** `style.css` — form layout, `.lead-gst-field.hidden`, error styles

---

## Phase 6 — Frontend flow

### `payment-api-client.js`

Add:
```js
async function lookupGst(gstin) { ... }      // POST /api/gst/lookup
async function saveLead(payload) { ... }    // POST /api/leads/save → rowId
async function updateLeadPayment(rowId, orderId, paymentId) { ... }
```

Extend `createOrder(plan, email, { name, gstin })` for Phase 4.

### `payment-manager.js`

**Extend `paymentState`:**
```js
leadRowId: null,
leadName: null,
leadGstin: null,
```

**Replace CTA handler** with `handleContinueToPayment()`:

```
1. Read name, email, selectedPlan, hasGst, gstin
2. Validate name + email (client)
3. If hasGst:
     showLoading('Verifying GST...')
     data = await lookupGst(gstin)
     company, address = data
   Else:
     gstin, company, address = ''
4. showLoading('Saving your details...')
   { rowId } = await saveLead({ name, email, plan, gstin, company, address })
5. paymentState.leadRowId = rowId
6. initializePayment(plan, email, { name, gstin })
```

**Wire in `index.html`:** `#m-cta-btn` → `handleContinueToPayment` (not direct `initializePayment`).

### User-facing error messages (policy A)

| Case | Message |
|------|---------|
| Invalid GST format | Please enter a valid 15-character GSTIN. |
| GST 422 | This GSTIN doesn't look valid. Please check and try again. |
| GST not Active | This GST registration isn't active. Please use an active GSTIN or continue without GST. |
| GST 502 / 503 | GST verification is temporarily unavailable. Try again or continue without GST. |
| Sheet save fail | We couldn't save your details. Please try again before paying. |

---

## Phase 7 — After Razorpay success

**File:** `payment-manager.js` → `handlePaymentSuccess`

After successful `verifyPayment()`:
```js
await updateLeadPayment(
  paymentState.leadRowId,
  response.razorpay_order_id,
  response.razorpay_payment_id
);
```

If update fails: still show payment success; log error (optional toast: "Payment received; we'll confirm by email").

---

## End-to-end flow (target)

```
Brevo form submit → openModal(capturedEmail)
User fills name, email, [optional GST]
Click "Continue to Secure My Spot"
  → [if GST] POST /api/gst/lookup
  → POST /api/leads/save (pending) → rowId
  → POST /api/orders/create → Razorpay modal
  → POST /api/payment/verify
  → POST /api/leads/update (paid + IDs)
```

---

## Phase 8 — Security checklist

- [ ] `GSTVERIFY_API_KEY` server-only
- [ ] `GOOGLE_SHEETS_WEBHOOK_URL` server-only
- [ ] Rate limits on `/api/leads/*` and `/api/gst/*`
- [ ] Optional: shared `WEBHOOK_SECRET` in Apps Script + backend
- [ ] Privacy line under lead form
- [ ] Do not commit `backend/.env`

---

## Phase 9 — Deployment

### A. Push code (required)

New routes under `api/gst/` and `api/leads/` must be on `master` before Vercel can serve them:

```bash
git add api/gst api/leads backend/services backend/controllers backend/routes ...
git commit -m "Add GST lookup and Google Sheets lead APIs for production"
git push origin master
```

### B. Vercel environment variables

In [Vercel Dashboard](https://vercel.com) → project → **Settings** → **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `RAZORPAY_KEY_ID` | Test: `rzp_test_...` — Live when ready: `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Matching secret from Razorpay dashboard |
| `FRONTEND_URL` | `https://revuesuite.com` (add `https://www.revuesuite.com` comma-separated if you use www) |
| `GSTVERIFY_API_KEY` | From GSTVerify dashboard |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Apps Script `/exec` URL |
| `NODE_ENV` | `production` (optional; Vercel sets this) |

Redeploy after adding or changing env vars.

### C. Confirm routes (after deploy)

| Route | Method | Quick check |
|-------|--------|-------------|
| `/api/gst/lookup` | POST | 400 with empty body = route exists |
| `/api/leads/save` | POST | 400 validation = route exists |
| `/api/leads/update` | POST | 400 validation = route exists |
| `/api/orders/create` | POST | existing |
| `/api/payment/verify` | POST | existing |

Example (PowerShell):

```powershell
Invoke-WebRequest -Uri "https://revuesuite.com/api/leads/save" -Method POST -ContentType "application/json" -Body "{}"
```

Expect **400** (validation), not **404**.

### D. Frontend on production

- `payment-api-client.js` uses `window.location.origin` on non-localhost (same domain as API).
- `razorpay-checkout.js` must use the **same mode** as backend keys (test vs live).
- Checkout logo uses `https://revuesuite.com/assets/logo-dark.webp` when testing locally.

### E. Apps Script

Redeploy the script in Google Apps Script if you changed the sheet handler (Deploy → New deployment → Web app). The `/exec` URL can stay the same.

### F. CLI deploy (optional)

```bash
vercel login
vercel link
vercel --prod
```

---

## Phase 10 — Testing checklist

| # | Scenario | Expected |
|---|----------|----------|
| 1 | GST lookup valid key + GSTIN | 200, company + address |
| 2 | No GST checkbox | save row, empty gst columns, Razorpay |
| 3 | GST checked, invalid format | 400, no save, no Razorpay |
| 4 | GST checked, verify fails | Error, no Razorpay |
| 5 | Sheet save fails | Error, no Razorpay |
| 6 | Payment success | Row H/I/J = paid + IDs |
| 7 | Dismiss Razorpay | Row stays `pending` |
| 8 | Port 3000 in use | `netstat` + `taskkill` or change `PORT` |

---

## Existing codebase map (payment)

| File | Role |
|------|------|
| `index.html` | Modal, Brevo, `#m-cta-btn`, payment scripts |
| `payment-manager.js` | `initializePayment`, success/failure handlers |
| `payment-api-client.js` | `createOrder`, `verifyPayment` |
| `razorpay-checkout.js` | Razorpay modal (`RAZORPAY_KEY_ID` public) |
| `payment-ui-manager.js` | Loading / success / error overlays |
| `backend/server.js` | Express app, routes, limiters |
| `api/orders/create.js` | Vercel order creation |
| `api/payment/verify.js` | Vercel payment verify |

---

## Implementation order (recommended)

1. **Phase 3** — `googleSheetsService` + `/api/leads/save` + `/api/leads/update` + test with Postman
2. **Phase 4** — order notes
3. **Phase 5 + 6** — modal + `handleContinueToPayment`
4. **Phase 7** — update sheet after payment
5. **Phase 9–10** — deploy + full E2E

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| `GST_PROVIDER_AUTH_ERROR` | Invalid `GSTVERIFY_API_KEY` | New key from GSTVerify dashboard; restart server |
| `EADDRINUSE :3000` | Old node process | `netstat -ano \| findstr :3000` then `taskkill /PID n /F` |
| Apps Script 302 / empty body | Redirect not followed | `fetch(..., { redirect: 'follow' })` |
| GST 502 from GSTVerify | Upstream down | Retry later; user can uncheck GST (policy A: block if GST required) |
| `.env` not loading | Wrong cwd | `server.js` uses `path.join(__dirname, '.env')` ✅ |

---

*Last updated: Phases 4–7 complete (frontend + payment flow). Phases 8–10 (security review, deploy, E2E) pending.*

**GSTVerify credits:** Conserve remaining free calls — test Phase 3 with `/api/leads/*` only; avoid repeated `/api/gst/lookup` during dev.
