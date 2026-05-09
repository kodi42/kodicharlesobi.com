# TODO

Open items from the initial build session. Prioritized loosely — do the setup steps before the polish.

---

## 🔴 Design — come back to

### Hero sticker collage: mobile responsiveness
Current implementation ([src/styles/sticker-journal.css](src/styles/sticker-journal.css)) keeps the collage in the hero grid at all screen sizes using `aspect-ratio` + percentage positions + container queries (cqw). On very narrow viewports (<480px) the wells get small enough that the in-well labels auto-hide below 280px collage width, which keeps the silhouettes clean but loses information. Not fully satisfied.

**Things to try:**
- Let the collage break out of the grid below some threshold and become a smaller decorative band to the right of / around the title (abs-positioned accent)
- Reduce number of stickers on mobile (show 2–3 hero wells instead of 4 + note + pill + stamp)
- Try a different composition entirely on mobile — e.g., one larger blob with the "real, slow, human." note overlapping
- Experiment with `grid-template-columns: 1fr min(35%, 220px)` so the collage has a fixed min-width and the text column absorbs the rest
- Consider hiding the collage entirely below ~400px and letting the H1 own the hero

Files: [Hero.astro](src/components/sticker/Hero.astro), [sticker-journal.css](src/styles/sticker-journal.css) (sections: `.sj-collage`, `@container collage`, mobile media queries)

---

## 🟠 Setup & deploy

- [ ] **Create a Google Cloud project** + enable the Drive API
- [ ] **Create a service account**, generate a JSON key, download it
- [ ] **Share the Drive "posts" folder** with the service account's email (Viewer role)
- [ ] **Copy `.env.example` → `.env`** and fill in `GOOGLE_SERVICE_ACCOUNT_JSON`, `DRIVE_FOLDER_ID`
- [ ] **Run `npm run fetch-posts`** locally to confirm Drive → content pipeline works
- [ ] **Push repo to GitHub**
- [ ] **Connect the repo to Cloudflare Pages**, set all env vars in the dashboard
- [ ] **Create a Deploy Hook** in Cloudflare Pages → copy URL into `DEPLOY_HOOK_URL` env var
- [ ] **Set `WEBHOOK_URL`** in `.env` to the deployed `/api/drive-webhook` URL
- [ ] **Run `npm run register-watch`** once to register the Drive push channel
- [ ] **Re-register the watch channel every ~7 days** (channels expire), or set up a cron worker

---

## 🟡 Content — swap placeholders

- [ ] **Ticker strip** — hardcoded in [Ticker.astro](src/components/sticker/Ticker.astro) (`"Currently reading East of Eden"`, `"Zone 2 for 45 min"`, etc.)
- [ ] **About section copy** — in [About.astro](src/components/sticker/About.astro) (bio text, "think slowly in a world that doesn't")
- [ ] **About topic chips** — `"• Books I underline"`, `"• Podcasts I rewind"`, etc.
- [ ] **Hero stats** — in [Hero.astro](src/components/sticker/Hero.astro) ("letters so far", "writing slowly", "folder, no cms")
- [ ] **Hero eyebrow** — `"Letter NNN, out this morning"` uses `latestNumber` but is otherwise static copy
- [ ] **Decorative collage labels** — `"Book I'm in"`, `"Trail at 6am"`, `"Coffee"`, `"Today's light"`, plus `"real, slow, human."` note
- [ ] **TopStrip copy** — `"FILED UNDER: NOTES TO SELF"`, `"LIVE · WRITING NOW"`
- [ ] **Subscribe CTA** — currently just an anchor to `#subscribe` but there's no subscribe section. Either build one or change the CTA
- [ ] **About photo** — the flame-blob is a gradient placeholder, no real image

---

## 🟢 Assets & branding

- [ ] **Replace `public/assets/logo-ccc-medias.svg`** with your own wordmark (currently the cccMedias design-system placeholder)
- [ ] **Replace `public/assets/mark-dot.svg`** if you want a different favicon
- [ ] **Upload licensed fonts** if you have them (see [colors_and_type.css](src/styles/colors_and_type.css) top comment):
  - `fonts/MADE-Sunflower.otf` — would replace DM Serif Display for display headlines
  - `fonts/Flamboyan.otf` — would replace Pinyon Script
  - `fonts/VCR_OSD_MONO.ttf` — would replace VT323
- [ ] **Brand review** — the `kodi` wordmark in the nav + the orange brand mark are Helvetica + ember-400 (from the cccMedias system). Confirm this matches what you actually want for your personal brand, or change

---

## 🔵 Future features

- [ ] **Edit all page copy via a single Markdown file** — every string on the landing page should be editable by changing one MD/YAML file and pushing to GitHub. Pushing to main triggers the Cloudflare Pages rebuild (same mechanism as the Drive webhook), and the site updates.

  **Must cover every piece of copy, down to the buttons.** Specifically:
  - **TopStrip:** volume/date line, "LIVE · WRITING NOW", "FILED UNDER: NOTES TO SELF"
  - **Nav:** brand wordmark (`kodi`), tagline (`a little notebook`), every nav link label (Latest, Writing, About), Subscribe CTA text
  - **Hero:** eyebrow ("Letter NNN, out this morning"), H1 in all its parts (`"Hi. I keep"`, `"notes"`, the Pinyon-script `"on"`, `"what I'm learning."`), dek paragraph, primary CTA label (`"Read the latest"`), soft-link label (`"or meet me briefly →"`), all three stat numbers + labels
  - **Collage:** "This week" hint, well labels ("Book I'm in", "Trail at 6am", "Coffee", "Today's light"), "real, slow, human." script note, "ONE FOLDER · ONE DOC · LIVE" pill, "FREE NEVER SPAM" stamp text
  - **Ticker:** every marquee item (DM-Serif and Space-Grotesk lines)
  - **About:** eyebrow tag, H2 in parts (including the Pinyon-script "out loud"), both body paragraphs, every topic chip, primary CTA label ("Start with my favorites →"), "or keep scrolling," script accent
  - **Feed:** section title parts ("Recently", "on my mind"), count link text, card "ESSAY" tag label, "min read" suffix, "open →" card CTA, bottom "Read every letter (all N) →" link
  - **Footer:** colophon line (`© 2026–YYYY · KODI · DROPPED INTO A FOLDER`)
  - **Page meta:** `<title>` and `<meta description>`
  - **Empty state:** "nothing yet," + fallback paragraph for when there are 0 posts

  **Suggested implementation:**
  - Single source file at `src/content/site.yaml` (or `src/content/site.md` with YAML frontmatter)
  - Typed content collection entry (extend [src/content/config.ts](src/content/config.ts)) so components get autocomplete + build-time validation when strings are missing
  - Each component imports the site content and reads its strings, rather than hardcoding them
  - For rich bits like the H1 (mixed fonts and the underline swoosh), use a small set of well-named fields (`hero.title.before`, `hero.title.underlined`, `hero.title.script`, `hero.title.after`) rather than a single blob

- [ ] **Archive page** — `/posts/archive` listing every post (intentionally out of scope for MVP)
- [ ] **RSS feed** — trivial to add from the content collection
- [ ] **Email subscribe form** — Buttondown / ConvertKit / Mailchimp embed in a `#subscribe` section
- [ ] **Draft/published toggle** — right now everything in the folder is live. Could look at a `[draft]` prefix convention or a separate drafts folder
- [ ] **Redirect handling for renamed docs** — renaming a doc changes its slug and breaks the old URL. Could persist `driveId → slug` mapping and serve 301s
- [ ] **Image optimization** — Drive exports images as base64 or Drive-hosted URLs. Could download + optimize + host on Cloudflare
- [ ] **OG images** — per-post social cards generated from title + excerpt
- [ ] **Analytics** — Cloudflare Web Analytics is free and privacy-friendly

---

## ✅ Completed this session

- Scaffolded Astro project structure (package.json, astro.config, tsconfig)
- Implemented Drive client, sanitize, posts utilities ([src/lib/](src/lib))
- `fetch-posts` prebuild script + `register-watch` one-shot
- Content collection schema
- Ported cccMedias design system (colors_and_type.css + assets)
- Built Sticker Journal landing: TopStrip, StickerNav, Hero, Ticker, About, Feed, StickerFooter
- Article page with reader styling (BaseLayout + TopNav + ReadingProgress + Byline + Footer)
- Cloudflare Pages Functions for Drive webhook + manual rebuild
- wrangler.toml, .env.example, [README.md](README.md)
- Responsive refactor of landing page (fluid typography, container queries on collage)
- Removed three-column footer link section
