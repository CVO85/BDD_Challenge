import crypto from 'node:crypto';
const b64 = b => Buffer.from(b).toString('base64url');
const hmac = b => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(b).digest('base64url');
export const sign = (p, ms) => { const b = b64(JSON.stringify({ ...p, exp: Date.now() + ms })); return b + '.' + hmac(b); };
export const verify = t => {
  try {
    const [b, s] = (t || '').split('.'); const e = hmac(b);
    if (!s || s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url')); return p.exp > Date.now() ? p : null;
  } catch { return null; }
};
export const session = req => {
  const m = (req.headers.get('cookie') || '').match(/(?:^|; )sess=([^;]+)/);
  return m ? verify(m[1]) : null;
};
export const allowed = e => (process.env.ORGANISATEURS || '').toLowerCase().split(',').map(x => x.trim()).includes(e);
export const json = (d, status = 200, h = {}) => new Response(JSON.stringify(d), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
export const log = (evt, user, extra = {}) => console.log(JSON.stringify({ evt, user, ...extra, t: new Date().toISOString() }));
export const mail = (to, subject, text, reply_to) => fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
  body: JSON.stringify({
    sender: { name: 'Challenge CO', email: process.env.MAIL_FROM },
    to: [{ email: to }], subject, textContent: text,
    ...(reply_to ? { replyTo: { email: reply_to } } : {})
  })
});
const hits = new Map();
export const limited = (k, max, ms = 600000) => {
  const now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms); a.push(now); hits.set(k, a); return a.length > max;
};
let cache = { t: 0, rows: [] };
export async function rows() {
  if (Date.now() - cache.t < 300000) return cache.rows;
  const k = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT), now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const s = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(k.private_key, 'base64url');
  const tk = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${c}.${s}` }) })).json();
  const r = await (await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/${encodeURIComponent(process.env.SHEET_TAB || 'Feuil1')}`, { headers: { authorization: 'Bearer ' + tk.access_token } })).json();
  const [H, ...L] = r.values;
  cache = { t: Date.now(), rows: L.map(l => Object.fromEntries(H.map((x, i) => [x.trim(), l[i] || '']))) };
  return cache.rows;
}
