# FORMA Furniture & Interior: storefront (client side)

React + Vite + Tailwind + Supabase. Customer store plus a secure admin panel at `/admin`. Customer accounts, reviews and coupons come in later steps.

## 1. Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into /dist
```
`.env` is already filled with your Supabase URL and publishable key. It is git-ignored. Use `.env.example` as the template on other machines.

## 2. Set up the database (required, once)
Supabase Dashboard > SQL Editor > New query:
1. Paste all of `supabase/schema.sql` and click Run.
2. Paste all of `supabase/seed.sql` and click Run (sample products, marked as demo).
3. Reload the site. Products, categories and settings now come from Supabase.

Security: Row Level Security is on for every table. Browsers can only read published products, categories and settings. Orders are created only through the `place_order` function, which re-reads prices and stock from the database, blocks overselling, and ignores retries with the same order key.

## 3. Admin panel setup (required, once)
1. Supabase SQL Editor: paste all of `supabase/admin.sql` and Run. It adds admin roles, admin-only policies, the `product-images` storage bucket, and the dashboard/order functions.
2. Create your admin login: Dashboard > Authentication > Users > Add user (email + password, tick Auto Confirm User).
3. Make that user an admin by running this in the SQL Editor (use your email):
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com' on conflict do nothing;
   ```
4. Open `/admin/login` and sign in. Signing up on the store never gives admin access: roles can only be added from the SQL Editor.

Admin features: dashboard stats, products (create, edit, publish/hide, delete, images, stock, price), categories, orders (status flow, internal notes, cancel with automatic stock return), customers, and settings (brand name, logo, favicon, tab title, shipping, homepage text).
No new environment variables are needed. Never put a service_role key in the frontend or in `.env`.

## 4. Deploy to Vercel
1. Push to GitHub (`.env` is ignored).
2. Vercel > Add New Project > import the repo (Framework: Vite).
3. Settings > Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy.
4. `vercel.json` already routes all paths to the app, so page refreshes work.

## Troubleshooting
- Empty store or "We could not load this": run schema.sql, then seed.sql.
- Env values not picked up: restart `npm run dev` after editing `.env`.
- Order error "function place_order not found": re-run schema.sql, then wait a few seconds for the API schema cache.
- Favicon/title changes: use Admin > Settings. Browsers cache favicons, so use a hard refresh.
- "Access denied" after login: the user is not in `user_roles`. Run step 3 above.
- Image upload fails: run `admin.sql` (it creates the `product-images` bucket and policies). Files must be JPG, PNG or WebP under 5 MB.
- Admin login says "Invalid login credentials": confirm the user exists and was auto-confirmed in Authentication > Users.
