# ShopLedger

## Stack

- Node.js with CommonJS modules, Express 4, and `body-parser` for JSON requests.
- Static HTML, CSS, and plain JavaScript in `public/`.
- Local JSON storage in `data/db.json`, read and written synchronously by `lib/store.js`.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, creates, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and database export.
- `lib/coupons.js` normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` formats dates as DD/MM/YYYY, normalizes date strings, and derives fiscal years.
- `lib/inventory.js` looks up products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recalculates GST and discounts and renders printable HTML invoices.
- `lib/ledger.js` manages Khata balances, credit-limit checks, debit reversals, and settlements.
- `lib/orders.js` creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` computes checkout totals using proportional coupon allocation and GST per line.
- `lib/reports.js` summarizes the dashboard and compares saved order figures with invoice calculations.
- `lib/store.js` reads and writes the JSON database and appends audit entries.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js`. The port is `PORT` or `3000` by default.
- Run tests with `node --test`. The repository currently contains no test files, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules named in the ticket.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout applies GST by HSN after allocating the coupon discount. The invoice recalculates GST before discount and falls back to 18% when an order line has no `gstRate`.

Allowed files: `lib/invoice.js` and `lib/tax.js` only if truly needed.