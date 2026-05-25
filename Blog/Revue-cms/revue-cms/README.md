# Revue CMS & Blog

A production-ready content platform for [Revue](https://revuesuite.com) — a SaaS for creative agencies. Medium-style reading experience, full-featured CMS, and SEO infrastructure built to scale into programmatic content.

> **Stack** · Next.js 15 (App Router) · TypeScript · Tailwind + Shadcn · TipTap · Supabase (Postgres + Auth + Storage + RLS) · Vercel

---

## Highlights

- **Editorial reading experience** — Source Serif body, Inter UI, reading progress bar, table of contents, related articles, share buttons, beta-signup CTA blocks.
- **Rich CMS dashboard** — drafts/scheduled/published filters, inline category & tag management, media library with alt-text editing, settings panel.
- **TipTap editor** — headings, lists, quotes, code blocks, tables, YouTube embeds, drag-drop image uploads to Supabase Storage.
- **SEO out of the box** — dynamic `sitemap.ts`, RSS 2.0 feed, Article + FAQ + Breadcrumb JSON-LD, OG/Twitter cards, canonical URLs, per-post meta + focus keyword + robots controls.
- **Postgres full-text search** — weighted `tsvector` across title, excerpt, meta, content; updated by trigger.
- **Row-level security** — public sees only published posts; authors edit own drafts; editors publish anything; admins manage settings.
- **ISR + on-demand revalidation** — published pages revalidate every 60s and immediately after server-action saves.
- **Programmatic-SEO-ready** — content model + URL structure scales to glossary, comparison, use-case, industry pages without schema changes.

## Project structure

```
revue-cms/
├── supabase/
│   ├── schema.sql            # Tables, enums, RLS, triggers, search index
│   ├── seed.sql              # Empty (no dummy content)
│   └── clear-dummy-data.sql  # One-time SQL to wipe sample rows
├── src/
│   ├── app/
│   │   ├── (public)/         # Public blog routes
│   │   │   └── blog/
│   │   │       ├── page.tsx              # Listing + search + categories
│   │   │       ├── [slug]/page.tsx       # Article (ISR, JSON-LD, TOC)
│   │   │       ├── author/[slug]/page.tsx
│   │   │       └── tag/[slug]/page.tsx
│   │   ├── cms/                # Admin dashboard (auth-gated)
│   │   │   ├── layout.tsx               # Sidebar + role-aware nav
│   │   │   ├── page.tsx                 # Dashboard stats
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx                       # List + status tabs
│   │   │   │   ├── new/page.tsx                   # Create draft → redirect
│   │   │   │   ├── actions.ts                     # save/duplicate/delete
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/{page,editor}.tsx     # TipTap editor
│   │   │   │       └── preview/page.tsx           # Pre-publish preview
│   │   │   ├── categories/{page,manager,actions}.tsx
│   │   │   ├── tags/{page,manager,actions}.tsx
│   │   │   ├── media/{page,library,actions}.tsx
│   │   │   └── settings/{page,form,actions}.tsx
│   │   ├── login/{page,actions}.tsx
│   │   ├── sitemap.ts        # Dynamic XML sitemap
│   │   ├── robots.ts
│   │   ├── rss.xml/route.ts
│   │   ├── layout.tsx        # Root layout + fonts + org JSON-LD
│   │   └── globals.css       # prose-article + .tiptap styles
│   ├── components/
│   │   ├── site/             # Public header/footer/CTAs/progress/TOC/share
│   │   ├── editor/tiptap.tsx # Rich-text editor + toolbar + image upload
│   │   └── ui/               # Shadcn primitives (Button, Input, Card, …)
│   ├── lib/
│   │   ├── supabase/         # client / server / middleware / types
│   │   ├── seo.ts            # buildMetadata + JSON-LD builders
│   │   └── utils.ts          # cn, slugify, calcReadingTime, formatDate, …
│   └── middleware.ts         # Refreshes Supabase session cookies
├── docs/DEPLOYMENT.md
├── .env.example
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Quick start

```bash
git clone <repo>
cd revue-cms

cp .env.example .env.local
# Fill in Supabase keys + NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm install
npm run dev
```

Open `http://localhost:3000/blog` and `/login` (single admin — see `docs/DEPLOYMENT.md`).

Full Supabase + Vercel setup → **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)**.

## Roles

| Role     | Permissions                                                   |
| -------- | ------------------------------------------------------------- |
| `admin`  | Everything: posts, taxonomy, media, settings, user roles.     |
| `editor` | Create / edit / publish any post. Manage taxonomy & media.    |
| `author` | Create posts. Edit own drafts only. Cannot publish.           |
| _public_ | Read published posts only (enforced by RLS).                  |

CMS admin is configured via `ALLOWED_CMS_EMAIL`. Set `role = admin` in SQL for that user (see `docs/DEPLOYMENT.md`).

```sql
update public.users set role = 'editor' where email = 'them@revuesuite.com';
```

## Brand

| Token       | Value     |
| ----------- | --------- |
| Primary     | `#334AC0` |
| Secondary   | `#121211` |
| Light       | `#EDEDED` |
| Highlight   | `#DBFE53` |
| UI font     | Inter     |
| Serif font  | Source Serif 4 |

Editorial typography lives in `src/app/globals.css` under `.prose-article`. Brand tokens are exposed as Tailwind utilities: `brand`, `brand-50…700`, `ink`, `ink-muted`, `paper`, `mist`, `highlight`.

## Content model

A `posts` row carries everything a published article needs:

- Editorial: `title`, `slug`, `excerpt`, `content_json` (TipTap JSON), `content_html`, `featured_image`, `reading_time`.
- Lifecycle: `status` (`draft` / `scheduled` / `published` / `archived`), `published_at`, `created_at`, `updated_at`.
- Relations: `author_id` → `authors`, `category_id` → `categories`, M:N `post_tags` → `tags`.
- SEO: `meta_title`, `meta_description`, `focus_keyword`, `canonical_url`, `og_image`, `robots`, `schema_type`, `faqs` (JSONB array of `{question, answer}` pairs).
- Search: `search_vector` (auto-maintained tsvector with weighted columns).
- Audit: `revisions` row snapshot on every update.

This shape extends naturally to other content types (glossary, comparisons) — add a `content_type` column or sibling tables.

## SEO checklist

Every published article ships with:

- ✅ Article JSON-LD (headline, author, publisher, dates, image)
- ✅ FAQ JSON-LD when FAQs are present
- ✅ Breadcrumb JSON-LD
- ✅ Open Graph + Twitter card meta
- ✅ Canonical URL (post override or absolute auto-canonical)
- ✅ Reading-time estimate (Medium algorithm: ~225 wpm)
- ✅ Sitemap entry with `lastModified` and `priority`
- ✅ RSS entry with full HTML content

The organization JSON-LD is rendered globally in `src/app/layout.tsx`.

## Scripts

```bash
npm run dev      # Next.js dev server (Turbopack)
npm run build    # Production build
npm run start    # Production server (after build)
npm run lint     # ESLint
```

## License

Proprietary © Revue. All rights reserved.
