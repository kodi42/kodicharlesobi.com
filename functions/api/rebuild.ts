/**
 * Cloudflare Pages Function: GET/POST /api/rebuild?key=<WEBHOOK_TOKEN>
 *
 * Manual rebuild trigger. Handy when the Drive webhook misses something,
 * or as a cron target. Requires the same shared secret as the webhook.
 */
interface Env {
  WEBHOOK_TOKEN: string;
  DEPLOY_HOOK_URL: string;
}

async function trigger(env: Env, key: string | null): Promise<Response> {
  if (!env.WEBHOOK_TOKEN || key !== env.WEBHOOK_TOKEN) {
    return new Response('Forbidden', { status: 403 });
  }
  if (!env.DEPLOY_HOOK_URL) {
    return new Response('Deploy hook not configured', { status: 500 });
  }
  const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
  return new Response(res.ok ? 'Rebuild triggered' : `Deploy hook failed: ${res.status}`, {
    status: res.ok ? 200 : 502,
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  return trigger(env, url.searchParams.get('key'));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  return trigger(env, url.searchParams.get('key'));
};
