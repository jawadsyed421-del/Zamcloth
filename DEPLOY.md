# Deploying ZamCloth on Vercel

One Vercel project runs everything. The built website is served from `dist`, and every `/api/...` request goes to the Express app through [api/index.js](api/index.js) as a serverless function (see [vercel.json](vercel.json)). Product photos are stored in MongoDB Atlas, so nothing depends on a server disk.

## 1. Before you start
- MongoDB Atlas cluster with a database user, and Network Access set to `0.0.0.0/0` (Vercel's addresses change).
- This repo pushed to GitHub.
- Your Cashfree keys (test keys are fine for a demo).

## 2. Create the project
1. Go to https://vercel.com/new and import the `Zamcloth` repository from GitHub.
2. Vercel reads `vercel.json`, so the defaults are right:
   - Framework preset: **Vite** (or Other)
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add the environment variables below before the first deploy.

## 3. Add environment variables
In **Project → Settings → Environment Variables**, add these for the **Production** environment (and Preview if you use it). Never put them in GitHub.

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string, ending in `/zamcloth?retryWrites=true&w=majority` |
| `ADMIN_USERNAME` | the admin username you want |
| `ADMIN_PASSWORD` | a strong admin password |
| `ADMIN_TOKEN_SECRET` | 32+ random characters (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `CASHFREE_APP_ID` | Cashfree dashboard > Developers > API Keys. Production App IDs are plain digits/letters; test ones start with `TEST`. Paste it exactly, with nothing added in front. |
| `CASHFREE_SECRET_KEY` | same page (`cfsk_ma_prod_…` for live, `cfsk_ma_test_…` for test) |
| `CASHFREE_ENV` | `sandbox` for test keys, `production` for live keys. It must match the keys. |
| `SITE_URL` | your website address with no trailing `/`, e.g. `https://www.zamcloth.com` |
| `SMTP_USER` | Gmail address that sends the order emails |
| `SMTP_PASS` | that Gmail's 16-letter App Password (not the normal password) |
| `OWNER_EMAIL` | where new-order alerts go, e.g. `zamcloth5@gmail.com` |
| `COMPANY_GSTIN` | Optional company GSTIN shown in receipts and monthly Excel reports |

Do not set `PORT`; it is only used when running the server locally.

**Changing a variable does not affect the live site until you redeploy:** Deployments → ⋯ on the latest deployment → **Redeploy**.

## 4. Deploy and check
1. Click **Deploy**. The first build takes a minute or two.
2. Open the project's `https://<project>.vercel.app` link (or your own domain).
3. Go to `/admin`, sign in, and upload a product photo.
4. Reload the site: the product should show with its photo.
5. Register a customer at `/register`, add a product to the bag, and try checkout.

## 5. Notes
- **Cashfree:** use sandbox (test) keys first. Switch `CASHFREE_ENV` to `production` with live keys only after Cashfree approves your account. In the Cashfree dashboard:
  - **Developers → Whitelisting:** add your live domain, or production checkout may be blocked.
  - **Developers → Webhooks:** set `https://YOUR-SITE/api/payment/webhook`.
- **"Could not start the payment":** almost always wrong Cashfree keys. Check the function logs in Vercel (Project → Logs) for `Cashfree create failed`; a `401 authentication Failed` means the App ID, secret key or `CASHFREE_ENV` don't match.
- **Upload size:** Vercel functions accept request bodies up to about 4.5 MB, so keep product photos under that.
- **Changing the admin password:** edit `ADMIN_PASSWORD` in Vercel's Environment Variables and redeploy. The server saves the new password to the database on start.
- **Updating the site:** push to GitHub; Vercel redeploys automatically.
- **Run locally:** `npm run dev` (uses your local `.env`, see `.env.example`).
- **Check the database from your computer:** `npm run check:db` (uses your local `.env`).
