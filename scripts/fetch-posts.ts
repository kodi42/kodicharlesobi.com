#!/usr/bin/env tsx
/**
 * Build-time: pull all Google Docs from the configured Drive folder, export
 * each as HTML, sanitize, and write to src/content/posts/<slug>.json.
 *
 * Runs automatically via the "prebuild" npm script before `astro build`.
 * Can also be run standalone: `npm run fetch-posts`.
 */
import 'dotenv/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listFolderDocs, exportDocAsHtml } from '../src/lib/drive.js';
import { cleanDriveHtml, extractExcerpt, wordCount, parseFrontmatter } from '../src/lib/sanitize.js';
import { slugify, readingTime } from '../src/lib/posts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'src', 'content', 'posts');

async function main() {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    console.warn('[fetch-posts] DRIVE_FOLDER_ID not set — skipping fetch. Dev build will show an empty state.');
    await mkdir(OUT_DIR, { recursive: true });
    return;
  }

  console.log(`[fetch-posts] Listing docs in folder ${folderId}…`);
  const docs = await listFolderDocs(folderId);
  console.log(`[fetch-posts] Found ${docs.length} doc(s).`);

  // Clear out old posts so renamed/deleted docs don't linger.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  // Slug-collision guard: if two docs slugify to the same value, append a short id.
  const usedSlugs = new Set<string>();

  for (const doc of docs) {
    const rawHtml = await exportDocAsHtml(doc.id);
    const cleaned = cleanDriveHtml(rawHtml);
    const { meta, body: html } = parseFrontmatter(cleaned);
    const words = wordCount(html);

    let slug = slugify(doc.name);
    if (usedSlugs.has(slug)) slug = `${slug}-${doc.id.slice(0, 6)}`;
    usedSlugs.add(slug);

    const record = {
      slug,
      title: meta.title ?? doc.name,
      date: doc.modifiedTime,
      created: doc.createdTime,
      driveId: doc.id,
      readTime: readingTime(words),
      excerpt: meta.blurb ?? extractExcerpt(html),
      category: (meta.category ?? 'ESSAY').toUpperCase(),
      html,
    };

    const outFile = resolve(OUT_DIR, `${slug}.json`);
    await writeFile(outFile, JSON.stringify(record, null, 2));
    console.log(`[fetch-posts] Wrote ${slug} (${words} words)`);
  }

  console.log(`[fetch-posts] Done. ${docs.length} post(s) written to src/content/posts.`);
}

main().catch((err) => {
  console.error('[fetch-posts] Failed:', err);
  process.exit(1);
});
