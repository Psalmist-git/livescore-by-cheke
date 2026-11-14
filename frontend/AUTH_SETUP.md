# LiveScore by Cheke — Supabase Authentication Setup

The frontend uses Supabase Auth with cookie-based sessions through `@supabase/ssr`.

## 1. Create a Supabase project

Create a project at https://supabase.com/dashboard. In the project dashboard, open **Project Settings → API** (or the Connect dialog) and copy:

- Project URL
- Publishable key

Do not use a secret/service-role key in the browser or in a `NEXT_PUBLIC_*` variable.

## 2. Configure local environment

In `frontend/.env.local`, add the following alongside the existing football and YouTube keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The `.env.local` file is ignored by Git. Never commit it or paste secret keys into chat.

## 3. Configure Auth redirect URLs

In Supabase **Authentication → URL Configuration**:

- Set the Site URL to `http://localhost:3000` for local development.
- Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
- Add the deployed website origin and its `/auth/callback` path before production use.

For example, if the deployed site is `https://example.com`, allow `https://example.com/auth/callback`.

## 4. Create the profiles table

Open the Supabase **SQL Editor**, paste the contents of:

`supabase/migrations/202611130001_create_profiles.sql`

Then run it. This creates a profile row automatically when a new Auth user is registered and applies row-level security so users can only read or update their own profile.

## 5. Install and run

From the `frontend` directory:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/register` — create an account
- `http://localhost:3000/login` — sign in
- `http://localhost:3000/forgot-password` — request a reset email
- `http://localhost:3000/account` — signed-in account page

If email confirmation is enabled, new users must open the confirmation email before they can sign in. The email link returns through `/auth/callback`.

## 6. Production deployment

Add the same two public Supabase values to the frontend hosting provider's environment variables. Keep the football and YouTube API keys configured separately. Add the production callback URL to Supabase's allowed redirect URLs, then redeploy.

## Security notes

- Supabase manages password hashing and authentication tokens.
- The Next.js 16 `src/proxy.ts` refreshes cookie-backed sessions.
- Server-side account access verifies the user with `auth.getUser()`.
- The profiles table has row-level security enabled.
- Never expose a Supabase secret/service-role key to client-side code.
