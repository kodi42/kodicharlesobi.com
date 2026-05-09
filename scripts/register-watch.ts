#!/usr/bin/env tsx
/**
 * One-shot: register a Drive push notification channel against the posts
 * folder. Drive will POST to the webhook URL whenever a child doc changes.
 *
 * Run once after first deploy, and again whenever the channel expires
 * (Drive channels live ~7 days; you can also trigger this from a cron).
 *
 * Required env:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON
 *   - DRIVE_FOLDER_ID
 *   - WEBHOOK_URL         (e.g. https://your-site.pages.dev/api/drive-webhook)
 *   - WEBHOOK_TOKEN       (shared secret, verified by the webhook handler)
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { getDriveClient } from '../src/lib/drive.js';

async function main() {
  const folderId = process.env.DRIVE_FOLDER_ID;
  const webhookUrl = process.env.WEBHOOK_URL;
  const token = process.env.WEBHOOK_TOKEN;

  if (!folderId || !webhookUrl || !token) {
    throw new Error('DRIVE_FOLDER_ID, WEBHOOK_URL, and WEBHOOK_TOKEN must all be set.');
  }

  const drive = getDriveClient();
  const channelId = randomUUID();

  // Drive's file.watch works on any file, including folders. Drive will send
  // a 'sync' notification immediately, then change notifications thereafter.
  const res = await drive.files.watch({
    fileId: folderId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      token,
      // 7 days is Drive's max for push channels.
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('[register-watch] Channel registered.');
  console.log('  id:          ', res.data.id);
  console.log('  resourceId:  ', res.data.resourceId);
  console.log('  expiration:  ', new Date(Number(res.data.expiration)).toISOString());
  console.log('');
  console.log('Save the resourceId if you want to stop the channel later via drive.channels.stop.');
}

main().catch((err) => {
  console.error('[register-watch] Failed:', err);
  process.exit(1);
});
