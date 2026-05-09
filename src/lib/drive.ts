import { google, type drive_v3 } from 'googleapis';

/**
 * Decode the service account JSON from env. Accepts either raw JSON or
 * base64-encoded JSON (Cloudflare dashboard env vars are easier to paste b64).
 */
function loadServiceAccount(): Record<string, unknown> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf-8');
  return JSON.parse(jsonText);
}

export function getDriveClient(): drive_v3.Drive {
  const creds = loadServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

export interface DriveDocMeta {
  id: string;
  name: string;
  modifiedTime: string;
  createdTime: string;
}

export async function listFolderDocs(folderId: string): Promise<DriveDocMeta[]> {
  const drive = getDriveClient();
  const out: DriveDocMeta[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: 'nextPageToken, files(id, name, modifiedTime, createdTime)',
      pageSize: 100,
      pageToken,
    });
    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      out.push({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime ?? new Date().toISOString(),
        createdTime: f.createdTime ?? new Date().toISOString(),
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return out;
}

export async function exportDocAsHtml(fileId: string): Promise<string> {
  const drive = getDriveClient();
  const res = await drive.files.export(
    { fileId, mimeType: 'text/html' },
    { responseType: 'text' },
  );
  // Drive export returns the raw HTML as the body.
  return typeof res.data === 'string' ? res.data : String(res.data);
}
