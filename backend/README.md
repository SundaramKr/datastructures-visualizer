# Whiteboard backend

Auth client scripts and Supabase Edge Functions for **@bmsce.ac.in** login.

```
backend/
  auth/          → frontend config + login UI logic (loaded by index.html)
  supabase/      → SQL schema + Edge Functions (deploy with Supabase CLI)
```

## Endpoints (after deploy)

- **POST** `password-signup` — create account only (rejects duplicate emails with 409)
- **POST** `password-login` — verify email/password

URLs:

- `https://<PROJECT_REF>.functions.supabase.co/password-signup`
- `https://<PROJECT_REF>.functions.supabase.co/password-login`

Non-`@bmsce.ac.in` emails are rejected with HTTP 403.

## Deploy step by step

### 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name, database password, region
3. Copy **Reference ID** from **Project Settings → General**

### 2. Create the database table

1. Open **SQL Editor** in the Supabase dashboard
2. Paste and run `supabase/sql/schema.sql` from this folder
3. Confirm `public.users` exists under **Table Editor**

### 3. Install Supabase CLI (one time)

```powershell
npm install -g supabase
```

### 4. Link and deploy Edge Functions

Run all Supabase CLI commands from **`backend/`** (this folder):

```powershell
cd "c:\Transfer\Sites\whiteboard\backend"
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy password-signup
supabase functions deploy password-login
```

### 5. Set function secrets

Copy the **service_role** key from **Project Settings → API** (never commit this key).

```powershell
supabase secrets set PROJECT_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Redeploy both functions after setting secrets.

### 6. Point the frontend at your project

Edit `auth/config.js` in this folder and replace `YOUR_PROJECT_REF`:

```javascript
window.AUTH_CONFIG = {
  projectRef: 'your-actual-project-ref',
};
```

### 7. Host the whiteboard site

Deploy the **whole whiteboard repo root** (not just `backend/`). GitHub Pages / Netlify / Vercel should use the repo root as the publish directory so `index.html` and `backend/auth/` are both served.

**Local test** (from repo root):

```powershell
cd "c:\Transfer\Sites\whiteboard"
npx serve .
```

## GitHub safety

Safe to push the full whiteboard folder **if you do not commit secrets**:

| OK to commit | Never commit |
|--------------|--------------|
| `auth/config.js` with **project ref only** | `SERVICE_ROLE_KEY` |
| Edge Function source code | `.env` files |
| SQL schema | Supabase database password |
| | `supabase/.temp/` (gitignored) |

The project ref is public (it appears in browser network requests). The service role key stays in Supabase secrets only.

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `Missing PROJECT_URL or SERVICE_ROLE_KEY` | Run `supabase secrets set ...` from `backend/` and redeploy |
| `Set your Supabase project ref` in UI | Update `backend/auth/config.js` |
| 403 on signup | Email must end with `@bmsce.ac.in` |
| 409 on signup | Email already registered — use Sign in |
| Auth scripts 404 on hosted site | Publish repo **root**, not `backend/` alone |
