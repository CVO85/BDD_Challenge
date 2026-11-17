import { session, json, log, mail, limited } from './_lib.mjs';
export const config = { path: '/api/correction' };
const c = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').slice(0, n);
export default async req => {
  const s = session(req); if (!s) return json({ error: 'auth' }, 401);
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const b = await req.json().catch(() => ({}));
  if (b.website) return json({ ok: 1 }); // honeypot
  if (limited('corr:' + s.email, 10, 3600e3)) return json({ error: 'Trop de demandes.' }, 429);
  if (!b.id || !b.valeur) return json({ error: 'Champs manquants.' }, 400);
  const txt = `Correction signalée par ${s.email}\n\nCoureur : ${c(b.id, 20)} – ${c(b.nom, 80)}\nChamp : ${c(b.champ, 40)}\nValeur proposée : ${c(b.valeur, 200)}\nCommentaire : ${c(b.commentaire, 1000)}`;
  const r = await mail(process.env.CHALLENGE_EMAIL, `[Correction] ${c(b.id, 20)}`, txt, s.email);
  log('correction', s.email, { id: c(b.id, 20), ok: r.ok });
  return r.ok ? json({ ok: 1 }) : json({ error: 'Envoi impossible.' }, 502);
};
