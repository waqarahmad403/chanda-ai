// Chanda proxy — Cloudflare Worker (free plan is enough).
// Groq key lives here as an encrypted secret, never in the GitHub repo, so it can't get leaked/revoked.
//
// Setup (dash.cloudflare.com → Workers & Pages → Create → "Hello World" worker → paste this file → Deploy):
//   Settings → Variables and Secrets:
//     GROQ_API_KEY     (Secret)  gsk_...            — one key, or several separated by commas
//     APP_TOKEN        (Secret)  any password       — same value goes in Chanda Settings → "Proxy password"
//     ALLOWED_ORIGINS  (Text)    https://<username>.github.io
// Then in Chanda Settings → Advanced: Proxy URL = https://<worker-name>.<account>.workers.dev

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const originOk = !allowed.length || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originOk && origin ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Chanda-Token',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST' || !originOk) return json({ error: 'forbidden' }, 403);
    if (env.APP_TOKEN && request.headers.get('X-Chanda-Token') !== env.APP_TOKEN) return json({ error: 'bad token' }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
    const { system, messages } = body || {};
    if (typeof system !== 'string' || !Array.isArray(messages) || messages.length > 60) return json({ error: 'bad request' }, 400);

    const keys = (env.GROQ_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
    let last = { status: 500, detail: 'no GROQ_API_KEY configured' };
    for (const key of keys) {
      for (const model of MODELS) {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({
            model, temperature: 0.9, max_tokens: 800,
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: system }, ...messages]
          })
        });
        if (res.ok) {
          const d = await res.json();
          return json({ text: d.choices?.[0]?.message?.content || '', model });
        }
        last = { status: res.status, detail: (await res.text()).slice(0, 300) };
        if (res.status === 401 || res.status === 403) break; // dead key → next key
      }
    }
    return json({ error: 'upstream', ...last }, last.status === 429 ? 429 : 502);
  }
};
