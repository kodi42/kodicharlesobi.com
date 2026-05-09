# Kodi Blog

A personal blog where **publishing = dropping a Google Doc into a Drive folder**. No CMS, no markdown editing, no git commits.

Built on:
- **Astro** static site, deployed on **Cloudflare Pages** (free tier)
- **Google Drive API** with a service account — folder is the source of truth
- **Pages Function webhook** + **Drive push notifications** → rebuild on change
- **cccMedias design system** — ember color ramp, warm-paper backgrounds, editorial type

---

## How it works

```
Drop doc in Drive folder
        ↓
Drive push notification → /api/drive-webhook
        ↓
Cloudflare Deploy Hook fires
        ↓
Build runs: scripts/fetch-posts.ts
  - lists every Google Doc in the folder
  - exports each as HTML
  - sanitizes and writes src/content/posts/<slug>.json
        ↓
Astro builds static pages
        ↓
Deployed to the edge
```

Filename = post title. Drive `modifiedTime` = post date. Slug is derived from the title.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Google Cloud service account

1. In [GCP Console](https://console.cloud.google.com/), create a project (or reuse one).
2. Enable the **Google Drive API** for the project.
3. Create a **Service Account**, then generate a **JSON key** and download it.
4. In your Google Drive, create a folder (e.g. "Kodi Blog Posts") and **share it with the service account's email** (Viewer access is enough).

### 3. Configure secrets

Copy `.env.example` to `.env` and fill in:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the whole JSON key (or base64-encode it first).
- `DRIVE_FOLDER_ID` — from the folder URL: `https://drive.google.com/drive/folders/<THIS>`.
- `DEPLOY_HOOK_URL` — create in Cloudflare Pages → Settings → Builds & deployments → Deploy hooks.
- `WEBHOOK_TOKEN` — any long random string. `openssl rand -hex 32`.
- `WEBHOOK_URL` — the public URL of `/api/drive-webhook` (known only after first deploy).

### 4. Run locally

```bash
npm run fetch-posts   # pull docs from Drive
npm run dev           # http://localhost:4321
```

### 5. Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare dashboard → Pages → **Create project** → connect the repo.
3. Build command: `npm run build` · output dir: `dist`.
4. In **Settings → Environment variables**, set all four secrets.
5. Deploy. Your site will be at `https://<project>.pages.dev`.

### 6. Register the Drive watch channel (one-time)

After first deploy, set `WEBHOOK_URL` in `.env` to your deployed URL and run:

```bash
npm run register-watch
```

Drive will now POST to `/api/drive-webhook` whenever the folder changes. Channels expire in ~7 days — re-run this command, or set up a cron Worker that hits `/api/rebuild?key=$WEBHOOK_TOKEN` as a fallback.

---

## Project layout

```
.
├── src/
│   ├── styles/
│   │   ├── colors_and_type.css   # design system tokens (verbatim)
│   │   └── global.css             # site styles, adapted from reader UI kit
│   ├── lib/
│   │   ├── drive.ts               # Google Drive client
│   │   ├── sanitize.ts            # Drive-HTML → safe prose HTML
│   │   └── posts.ts               # slugify, reading time, date format
│   ├── content/
│   │   ├── config.ts              # Astro content collection schema
│   │   └── posts/                 # generated .json files (gitignored)
│   ├── components/                # BaseLayout, TopNav, Hero, ArticleCard, …
│   └── pages/
│       ├── index.astro            # hero + 3 recent posts
│       └── posts/[slug].astro     # individual article
├── functions/api/
│   ├── drive-webhook.ts           # Cloudflare Pages Function
│   └── rebuild.ts                 # manual rebuild trigger
├── scripts/
│   ├── fetch-posts.ts             # prebuild step
│   └── register-watch.ts          # one-shot Drive channel setup
└── public/assets/                 # logos, icons
```

---

## Design notes

Uses the **cccMedias** design system as the visual base:
- Primary accent: `--ember-700` (#D00000)
- Logo dot: `--ember-400` (#F48C06)
- Background: warm paper `--paper` (#FDFBF6) · inverse: `--ink-900` (#03071E)
- Type: Helvetica for UI, DM Serif Display for editorial, Space Grotesk for eyebrows/meta, Times for prose
- Square corners, pills only for tags, no bouncy motion

Tokens live in `src/styles/colors_and_type.css` — don't edit them without a brand reason.

---

## Known limitations

- **Renamed doc = new URL.** The slug is derived from the filename, so renaming a doc after publishing breaks its URL. Add a redirect if that matters.
- **No drafts.** Everything in the folder is live. Keep WIPs in a separate folder.
- **Embedded images.** Drive exports images as public Drive-hosted URLs; they will load but are served by Google, not Cloudflare.
- **Watch channels expire.** Re-register every ~7 days, or rely on the manual rebuild endpoint.
