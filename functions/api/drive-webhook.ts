/**
 * Cloudflare Pages Function: POST /api/drive-webhook
 *
 * Receives Drive push notifications. Verifies the shared secret token,
 * then hits the Cloudflare Pages Deploy Hook to trigger a rebuild.
 *
 * Env vars (set in Cloudflare dashboard):
 *   - WEBHOOK_TOKEN   — must match the token used at channel registration
 *   - DEPLOY_HOOK_URL — the Pages project's Deploy Hook URL
 */
interface Env {
  WEBHOOK_TOKEN: string;
  DEPLOY_HOOK_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Drive sends its shared-secret token in this header.
  const token = request.headers.get('x-goog-channel-token');
  if (!env.WEBHOOK_TOKEN || token !== env.WEBHOOK_TOKEN) {
    return new Response('Forbidden', { status: 403 });
  }

  // The 'sync' event fires right after registration — ignore it; it doesn't
  // represent a content change.
  const resourceState = request.headers.get('x-goog-resource-state');
  if (resourceState === 'sync') {
    return new Response('Sync acknowledged', { status: 200 });
  }

  if (!env.DEPLOY_HOOK_URL) {
    return new Response('Deploy hook not configured', { status: 500 });
  }

  // Fire and forget — Drive only cares about 2xx.
  const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
  if (!res.ok) {
    return new Response(`Deploy hook failed: ${res.status}`, { status: 502 });
  }

  return new Response('Rebuild triggered', { status: 200 });
};

// Drive may send GET/HEAD pings during channel setup in some configurations.
export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response('ok', { status: 200 });
};
