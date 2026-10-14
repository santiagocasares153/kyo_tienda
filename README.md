# KYO — clothing catalog (React + Vite + TypeScript)

A first UI prototype based on the provided visual references: black base, electric blue and crimson accents, graphic streetwear direction.

## Requirements

- Node.js 20.19+ or 22.12+
- A Supabase project (optional while previewing demo mode)

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The app shows demo products before Supabase is configured. The demo images are remote placeholders; replace them with your own product photography.

## Supabase setup

1. Create a project at https://supabase.com.
2. In Project Settings / API, copy the project URL and publishable (or anon) key into `.env`.
3. Open SQL Editor and run `supabase/schema.sql`.
4. Create a public Storage bucket called `product-images` (the SQL attempts to create it).
5. Add your store WhatsApp number to `VITE_WHATSAPP_NUMBER`, digits only with country code, without `+` or spaces.
6. Restart Vite after editing `.env`.

Example `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
VITE_WHATSAPP_NUMBER=584120000000
```

Never put a Supabase `service_role` key in a Vite environment variable. Variables beginning with `VITE_` are exposed to the browser.

## Current prototype includes

- Responsive storefront and category filters
- Demo product grid
- Cart drawer with quantity controls
- WhatsApp order message generation
- Sign-in modal using Supabase Auth once configured
- Starter SQL schema and safe default read-only RLS policy

## Not finished yet (next implementation stage)

- Admin dashboard and product create/edit/delete forms
- Secure admin role / claim and corresponding RLS policies
- Admin-only Storage upload policies
- Product detail page and selection of size/color before adding to cart
- Stock per size/color variant
- Persist cart between page reloads
- Order validation and order record creation, if needed

The current code is a UI prototype and must not be treated as a production-ready store until the admin authorization and Storage policies are configured.
