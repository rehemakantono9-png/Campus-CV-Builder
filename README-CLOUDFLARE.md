> Branding: **NextGen Learn & Work** is the parent brand; **Campus CV Builder** remains the product name. This does not change the GitHub repository or Cloudflare Worker identifier.

# Campus CV Builder — Cloudflare migration draft (v1.1)

This update keeps the existing form, 59-programme dataset, summaries and frontend styles. It routes hosting through Cloudflare Workers with a D1 database and moves Pesapal credentials to Worker secrets.

## Set up

1. Install Node.js and run `npm install` in this folder.
2. Run `npx wrangler login`.
3. Create a database: `npx wrangler d1 create campus-cv-orders`.
4. Copy the returned database ID into `wrangler.jsonc` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
5. Run `npm run db:init` to create the tables. For local testing: `npx wrangler d1 execute campus-cv-orders --local --file=./schema.sql`.
6. Add private credentials with `npx wrangler secret put PESAPAL_CONSUMER_KEY` and `npx wrangler secret put PESAPAL_CONSUMER_SECRET`.
7. Register your deployed `https://YOUR-WORKER.workers.dev/api/pesapal-ipn` callback with Pesapal to obtain the IPN ID and add it using `npx wrangler secret put PESAPAL_IPN_ID`.
8. Deploy with `npm run deploy`. Begin with PESAPAL_ENV=SANDBOX. Do not enable live merchant payments before end-to-end tests.

## Not production-ready — important

- Gemini AI is intentionally not connected yet. The new `/api/generate-experience` endpoint responds with a clear not-configured error. The original manual CV features remain.
- Checkout is server-priced at UGX 3,000 (editable using `CV_PRICE_UGX`), never using a client-supplied price.
- Checkout details stay in the browser's localStorage so the customer must return on the same browser/device. A future version should support account or recovery flows.
- Payment status is confirmed by Pesapal's GetTransactionStatus service and cross-checked for the amount, currency, merchant reference and completion status. Notification messages alone do not unlock it.
- **The browser-based PDF is not a tamper-proof paywall.** Technically skilled users can extract local HTML/preview. Commercial release should use an authenticated server-controlled document or encrypted delivery approach. Do not treat the present client gate as strong anti-copy protection.
- The existing `html2pdf.js` PDF is A4 now, but remains image-based. Replace with a text-based ATS-readable PDF engine in the next iteration.
- Add request throttling, bot protection, monitoring, stronger input validation, a retention/deletion policy and webhook sandbox testing before launching publicly.
- Never commit real API keys to GitHub.
