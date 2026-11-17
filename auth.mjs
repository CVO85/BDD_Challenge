import { sign, verify, session, allowed, json, log, mail, limited } from './_lib.mjs';
export const config = { path: ['/api/auth', '/api/verify', '/api/logout', '/api/me'] };
const cookie = (v, age) => `sess=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
export default async req => {
  const u = new URL(req.url);
  if (u.pathname === '/api/me') { const s = session(req); return s ? json({ email: s.email }) : json({ error: 'auth' }, 401); }
  if (u.pathname === '/api/logout') return json({ ok: 1 }, 200, { 'set-cookie': cookie('', 0) });
  if (u.pathname === '/api/verify') {
    const p = verify(u.searchParams.get('t'));
    if (!p || p.typ !== 'login' || !allowed(p.email)) return new Response('Lien invalide ou expiré.', { status: 400 });
    log('login', p.email);
    return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': cookie(sign({ email: p.email }, 8 * 3600e3), 28800), 'cache-control': 'no-store' } });
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const ip = req.headers.get('x-nf-client-connection-ip') || 'x';
  const { email = '' } = await req.json().catch(() => ({}));
  const e = String(email).trim().toLowerCase();
  if (limited('auth:' + ip, 5) || limited('auth:' + e, 3)) return json({ error: 'Trop de tentatives, réessayez plus tard.' }, 429);
  if (!allowed(e)) {
    log('link_refused', e);
    return json({ error: "Cette adresse n'est pas autorisée. Vérifiez la saisie ou contactez l'organisation du challenge." }, 403);
  }
  const link = `${process.env.SITE_URL}/api/verify?t=${sign({ typ: 'login', email: e }, 15 * 60e3)}`;
  const r = await mail(e, 'Connexion – Challenge CO', `Bonjour,\n\nVoici votre lien de connexion (valable 15 minutes) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`);
  log('link_sent', e, { ok: r.ok });
  return r.ok ? json({ ok: 1 }) : json({ error: "L'envoi du mail a échoué, réessayez ou contactez l'organisation." }, 502);
};
