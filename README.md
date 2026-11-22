# Billing Soft

A simple, fast GST billing web app (installable PWA) for any business — bills, customers, stock, payments and reports.

**Live demo:** https://billingsoft.web.app
Demo login: `demo@billing.com` / `demo@123`

## Features

- **Dashboard** — today's sales, this month's sales, total pending, low stock, recent bills
- **Products & Categories** — manage your own categories (default HSN / GST per category), units, rates, stock
- **Customers** — name, mobile, address, state, GSTIN, full ledger with running balance
- **New Bill** — editable rates, discount, GST on/off, CGST+SGST or IGST chosen automatically from the customer's state, vehicle no. & e-way bill no., partial payment (Cash / UPI / Bank / Cheque) with the rest going to pending, bill numbers that restart every financial year
- **Invoice** — clean A4 tax invoice with amount in words, bank/UPI details and signature area; Print, Save PDF, Share on WhatsApp, Delete (restores stock and balance)
- **Payments** — receive payments, pending list with WhatsApp reminders
- **Stock** — auto-reduced on billing, "Add stock", low stock alerts, stock log
- **Reports** — sales by date range with GST totals, pending by customer, stock value; CSV export
- **Settings** — business name, logo, address, state, GSTIN, phone, bank/UPI, bill prefix, terms
- **PWA** — installable on mobile/desktop, works offline (service worker precache + Firestore offline cache)

Indian formats throughout: ₹1,00,000 and DD-MM-YYYY.

## Tech stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4) with static export (`output: "export"`)
- Firebase Auth (email/password) + Cloud Firestore
- Firebase Hosting

## Project structure

```
app/            pages (detail pages use ?id= query params, no dynamic routes)
components/     Shell (auth guard, nav, PWA install), UI kit, forms, icons
lib/            firebase init, data hooks & types, GST calc, formatting
public/         manifest, icons, service worker template
tools/          seed.mjs (demo data), postbuild.mjs (SW precache), icons.mjs
firestore.rules only signed-in users can read/write
```

## Run locally

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build                      # next build + postbuild (service worker precache)
firebase deploy --only hosting     # deploys ./out to the "billingsoft" site
firebase deploy --only firestore,auth
```

## Demo data

```bash
node tools/seed.mjs   # creates the demo login and resets all demo data
```

> Firebase web config in `lib/firebase.ts` is a public client identifier; data access is protected by `firestore.rules`.

---

Built by Brighton Solution.
