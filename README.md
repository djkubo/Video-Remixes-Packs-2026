# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

<!-- build: trigger lovable rebuild (2026-02-15) -->

## Supabase + Edge Functions (ManyChat)

- This project uses Supabase Edge Functions:
  - `sync-manychat`: must be **public** so the website can call it (configured with `verify_jwt = false` in `supabase/config.toml`).
  - `setup-manychat`: admin-only (requires an authenticated admin token).
  - `stripe-checkout`: must be **public** so the website can redirect users to Stripe Checkout (configured with `verify_jwt = false` in `supabase/config.toml`).
    - Requires the Edge Function secret `STRIPE_SECRET_KEY` (never commit or expose this in the frontend).
  - `paypal-checkout`: must be **public** so the website can redirect users to PayPal (configured with `verify_jwt = false` in `supabase/config.toml`).
    - Requires the Edge Function secrets `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (never commit or expose the secret in the frontend).
  - `process-email-queue`: background worker for transactional emails (payment confirmation, shipping updates) using Brevo.
    - Configure secrets: `BREVO_API_KEY` (recommended) or `BREVO_SMTP_KEY` (fallback), `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `EMAIL_WORKER_TOKEN`.
    - Run via scheduler/cron with header `x-email-worker-token: <EMAIL_WORKER_TOKEN>` and body `{"limit":25}`.
  - `shippo-webhook`: receives Shippo shipping events (`track_updated` / `transaction_updated`) and syncs lead shipping status.
    - Configure security secrets:
      - `SHIPPO_WEBHOOK_TOKEN` (required unless `SHIPPO_WEBHOOK_REQUIRE_AUTH=false`)
      - `SHIPPO_HMAC_SECRET` (optional but recommended for signature verification)
      - `SHIPPO_HMAC_TOLERANCE_SECONDS` (optional, default `600`)
    - Shippo webhook URL format:
      - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/shippo-webhook?token=<SHIPPO_WEBHOOK_TOKEN>`
    - Recommended Shippo events: `track_updated` (primary), `transaction_updated` (secondary fallback).
- After publishing/deploying, you can verify `sync-manychat` is public by opening:
  - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/sync-manychat`
  - Expected response: `{"ok":true,"function":"sync-manychat"}` (if you see `{"error":"Unauthorized"}`, the function is still deployed with JWT verification enabled).

- After publishing/deploying, you can verify `stripe-checkout` is public by opening:
  - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/stripe-checkout`
  - Expected response: `{"ok":true,"function":"stripe-checkout"}`.

- After publishing/deploying, you can verify `paypal-checkout` is public by opening:
  - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/paypal-checkout`
  - Expected response: `{"ok":true,"function":"paypal-checkout"}`.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
