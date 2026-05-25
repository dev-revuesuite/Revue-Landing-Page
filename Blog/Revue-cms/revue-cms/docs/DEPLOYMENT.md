# Deployment Guide — Revue CMS

Production deployment uses **Supabase** (database, auth, storage) + **Vercel** (Next.js hosting). End-to-end setup takes about 20 minutes.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a region close to your audience (e.g. `eu-west-2` for Europe, `ap-south-1` for India).
3. Copy the **Project URL**, **anon public key**, and **service_role key** from **Settings → API**. You'll paste these into `.env.local` and Vercel later.

## 2. Run the schema

In the Supabase dashboard → **SQL Editor**:

```bash
# From the local repo:
supabase/schema.sql      # creates tables, enums, RLS, triggers, indexes
supabase/seed.sql        # empty by default (no sample content)
```

Paste `schema.sql` into a new SQL query and run.

To remove sample data already in the database, run `supabase/clear-dummy-data.sql` once in the SQL Editor.

Verify in **Table Editor** that you see: `users`, `authors`, `posts`, `categories`, `tags`, `post_tags`, `revisions`, `media`, `settings`.

## 3. Create the storage bucket

Storage → **New bucket**:

| Field         | Value     |
| ------------- | --------- |
| Name          | `media`   |
| Public bucket | ✅ enabled |

Then add a storage policy so authenticated users can upload. Storage → **Policies** → **media** → **New policy**:

```sql
-- Policy name: authenticated_upload
-- Allowed operation: INSERT
-- Target roles: authenticated
-- USING / WITH CHECK:
bucket_id = 'media'
```

Public read is automatic because the bucket is marked public.

## 4. Create the CMS admin user (single user)

1. Authentication → **Users** → **Add user** → `admin@revuesuite.com` + password.
2. Disable public signup: **Authentication → Providers → Email** → turn off “Allow new users to sign up”.
3. Set `ALLOWED_CMS_EMAIL=admin@revuesuite.com` in `.env.local` and Vercel (must match exactly).
4. In SQL Editor, promote to admin:

```sql
update public.users
set role = 'admin'
where email = 'admin@revuesuite.com';
```

(The `users` row is auto-created by the trigger when the auth user is added. If missing, log in once or insert manually.)

Only `ALLOWED_CMS_EMAIL` can access `/cms`. Other Supabase Auth users get “not authorized” even with a valid password.

## 5. Local development

```bash
cp .env.example .env.local
# Fill in the three Supabase values + NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm install
npm run dev
```

Visit `http://localhost:3000/blog` (public) and `http://localhost:3000/login` → `/cms` (admin).

## 6. Deploy to Vercel

1. Push the repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment Variables** — add all five:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://revuesuite.com`)
   - `ALLOWED_CMS_EMAIL` (`admin@revuesuite.com`)
5. Deploy.

After the first deploy, set the production domain (e.g. `blog.revuesuite.com`) in **Settings → Domains** and update `NEXT_PUBLIC_SITE_URL` to match. Redeploy so sitemap/RSS/JSON-LD reflect the canonical host.

## 7. Post-deploy checks

- `/sitemap.xml` — should list `/blog`, every published post, and category/tag/author archives.
- `/rss.xml` — should validate at [validator.w3.org/feed](https://validator.w3.org/feed/).
- `/blog` — Lighthouse Performance ≥ 90, Accessibility ≥ 95.
- View source on any published article: confirm `<script type="application/ld+json">` Article block, OG tags, canonical URL.

## 8. Ongoing operations

**Changing the CMS admin**: create the user in Supabase Auth, update `ALLOWED_CMS_EMAIL`, and run the `update public.users set role = 'admin'` SQL for that email.

Public signup on `/login` is disabled in the app. Do not enable open sign-up in Supabase if you want a single-operator CMS.

**Backups**: Supabase takes daily backups on paid plans. For self-managed backups: `pg_dump` against the connection string in **Settings → Database**.

**On-demand revalidation**: published posts use `revalidate = 60` (1 minute). Server actions also call `revalidatePath()` after saves so changes are reflected immediately for editors viewing the live site.

**Custom domain**: point a `CNAME` from `blog.revuesuite.com` → `cname.vercel-dns.com`. Vercel auto-provisions the TLS cert.

---

## Architecture recap

```
 ┌────────────────────────┐         ┌──────────────────────────┐
 │ Next.js 15 (App Router)│  RLS    │ Supabase (Postgres + RLS)│
 │  ├── /blog  (ISR)      │ ──────▶ │  ├── posts, categories…  │
 │  ├── /cms   (auth)     │         │  ├── tsvector search     │
 │  ├── /sitemap.xml      │         │  └── auth.users sync     │
 │  └── /rss.xml          │         └──────────────────────────┘
 │                        │
 │  TipTap editor ────────┼────▶ Supabase Storage (`media` bucket)
 │  Tailwind + Shadcn UI  │
 └────────────────────────┘
        ▲
        │ deploys
        │
   Vercel (Edge)
```

All public reads pass through RLS policies that only expose `published` posts whose `published_at <= now()`. Authenticated editors/admins see everything via separate policies.
