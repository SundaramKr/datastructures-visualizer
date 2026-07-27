# Whiteboard backend

Auth client scripts and Supabase Edge Functions for **@bmsce.ac.in** login and presentation management.

```
backend/
  auth/          → frontend config + login UI logic (loaded by index.html)
  supabase/      → SQL schema + Edge Functions (deploy with Supabase CLI)
```

## Endpoints (after deploy)

### Auth Endpoints
- **POST** `password-signup` — create account (rejects duplicate emails with 409). Returns `session_token`.
- **POST** `password-login` — verify email/password. Returns `session_token`.

### Presentation Endpoints (require `Authorization: Bearer <session_token>` header)
- **POST** `create-presentation` — create new presentation with Google Slides URL
- **POST** `get-presentations` — get user's presentations
- **POST** `save-slide-config` — save visualizer configuration for a slide
- **POST** `delete-presentation` — delete a presentation by ID

### Public Endpoints (no auth required)
- **POST** `get-public-presentation` — get presentation by share token

URLs:

- `https://<PROJECT_REF>.functions.supabase.co/password-signup`
- `https://<PROJECT_REF>.functions.supabase.co/password-login`
- `https://<PROJECT_REF>.functions.supabase.co/create-presentation`
- `https://<PROJECT_REF>.functions.supabase.co/get-presentations`
- `https://<PROJECT_REF>.functions.supabase.co/get-public-presentation`
- `https://<PROJECT_REF>.functions.supabase.co/save-slide-config`
- `https://<PROJECT_REF>.functions.supabase.co/delete-presentation`

Non-`@bmsce.ac.in` emails are rejected with HTTP 403.

## Deploy step by step

### 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick org, name, database password, region
3. Copy **Reference ID** from **Project Settings → General**

### 2. Create the database tables

1. Open **SQL Editor** in the Supabase dashboard
2. Paste and run `supabase/sql/schema.sql` from this folder
3. Paste and run `supabase/sql/migration_session_tokens.sql` (adds session token auth)
4. Confirm `public.users`, `public.presentations`, `public.slide_configs`, and `public.session_tokens` exist under **Table Editor**

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
supabase functions deploy create-presentation
supabase functions deploy get-presentations
supabase functions deploy get-public-presentation
supabase functions deploy save-slide-config
supabase functions deploy delete-presentation
```

### 5. Set function secrets

Copy the **service_role** key from **Project Settings → API** (never commit this key).

```powershell
supabase secrets set PROJECT_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

Redeploy all functions after setting secrets.

### 6. Point the frontend at your project

Edit `auth/config.js` in this folder and replace `YOUR_PROJECT_REF`:

```javascript
window.AUTH_CONFIG = {
  projectRef: 'your-actual-project-ref',
};
```

### 7. Configure hosting for public URLs

For public presentation URLs (`/present/[share_token]`) to work, you need to configure your hosting provider to handle client-side routing:

**GitHub Pages:** Add a `_redirects` file in the repo root with:
```
/* /index.html 200
```

**Netlify:** Add a `netlify.toml` file in the repo root with:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Vercel:** Add a `vercel.json` file in the repo root with:
```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

### 8. Host the whiteboard site

Deploy the **whole whiteboard repo root** (not just `backend/`). GitHub Pages / Netlify / Vercel should use the repo root as the publish directory so `index.html` and `backend/auth/` are both served.

**Local test** (from repo root):

```powershell
cd "c:\Transfer\Sites\whiteboard"
npx serve .
```

## New Features

### Teacher Dashboard
- Teachers can create presentations by providing a title and Google Slides URL
- Google Slides are embedded in an iframe for seamless viewing
- Presentations can be opened, edited, or deleted
- Each presentation gets a unique share token for public access

### Presentation Viewer
- Split view with Google Slides iframe and visualizer
- Toggle between slides view and visualizer view
- Teachers can save visualizer configurations per slide
- Share button generates public URLs

### Public Access
- Public URLs: `domain.com/present/[share_token]`
- No authentication required for viewers
- Read-only mode (no editing capabilities)
- Perfect for classroom presentations

### Database Schema
- `presentations`: Stores presentation metadata and Google Slides URLs
- `slide_configs`: Links visualizer configurations to specific slides
- Row Level Security (RLS) ensures teachers can only edit their own presentations

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
| Public URLs return 404 | Configure client-side routing (see step 7) |
| Google Slides not embedding | Ensure Google Slides URL is public and shared |
