# Deploying ZamCloth on Render

One Render web service runs everything: the Express API and the built website. Product photos are stored in MongoDB Atlas, so they are not lost when Render restarts the server.

## 1. Before you start
- MongoDB Atlas cluster with a database user, and Network Access set to `0.0.0.0/0` (Render's addresses change).
- This repo pushed to GitHub.
- Your Cashfree keys (test keys are fine for a demo).

## 2. Create the service
1. Go to https://dashboard.render.com and choose **New → Blueprint** (or **New → Web Service**).
2. Connect your GitHub account and pick the `Zamcloth` repository.
3. Blueprint: Render reads `render.yaml` and fills in everything below.
   Web Service: use these settings:
   - Runtime: **Node**
   - Build command: `npm install --include=dev && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/products`
   - Plan: Free (see notes below)

## 3. Add environment variables
In the service's **Environment** tab, add these. Never put them in GitHub.

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string, ending in `/zamcloth?retryWrites=true&w=majority` |
| `ADMIN_USERNAME` | the admin username you want |
| `ADMIN_PASSWORD` | a strong admin password |
| `ADMIN_TOKEN_SECRET` | 32+ random characters (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `CASHFREE_APP_ID` | Cashfree dashboard > Developers > API Keys |
| `CASHFREE_SECRET_KEY` | same page |
| `CASHFREE_ENV` | `sandbox` for testing, `production` for real payments |
| `SITE_URL` | your website address, e.g. `https://www.zamcloth.com` |

Do not set `PORT`. Render sets it.

## 4. Deploy and check
1. Click **Create / Deploy**. The first build takes a few minutes.
2. Open the `https://<your-service>.onrender.com` link.
3. Go to `/admin`, sign in, and upload a product photo.
4. Reload the site: the product should show with its photo.
5. Register a customer at `/register`, add a product to the bag, and try checkout.

## 5. Notes
- **Free plan sleeps** after 15 minutes without visitors; the next visit takes about 30 seconds to wake it. Use a paid plan for a real store.
- **Cashfree:** use sandbox (test) keys first. Switch `CASHFREE_ENV` to `production` with live keys only after Cashfree approves your account. Add `https://YOUR-SITE/api/payment/webhook` as the webhook URL in the Cashfree dashboard.
- **Changing the admin password:** edit `ADMIN_PASSWORD` in Render's Environment tab and redeploy. The server saves the new password to the database on start.
- **Updating the site:** push to GitHub; Render redeploys automatically.
- **Check the database from your computer:** `npm run check:db` (uses your local `.env`).
