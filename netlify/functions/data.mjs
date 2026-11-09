import { session, json, log, rows } from './_lib.mjs';
export const config = { path: '/api/data' };
const count = (a, f) => { const m = {}; a.forEach(r => { const k = f(r) || '(vide)'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
export default async req => {
  const s = session(req); if (!s) return json({ error: 'auth' }, 401);
  const u = new URL(req.url), a = u.searchParams.get('action'), R = await rows();
  if (a === 'list') {
    log('list', s.email);
    return json(R.map(r => ({ id: r.ID_Coureur, nom: r.Nom, prenom: r['Prénom'], sexe: r.Sexe, club: r.Club, tranche: r['Tranche Age'], anomalie: r.Anomalies, statut: r.Statut_Email })));
  }
  if (a === 'reveal') {
    const r = R.find(x => x.ID_Coureur === u.searchParams.get('id')); if (!r) return json({ error: 'nf' }, 404);
    log('reveal', s.email, { id: r.ID_Coureur });
    return json({ email: r.Email, tel: r['Téléphone'], naissance: r.Date_Naissance });
  }
  if (a === 'stats') {
    const ko = R.filter(r => r.Anomalies && !r.Anomalies.startsWith('OK'));
    return json({
      total: R.length, anomalies: ko.length,
      sexe: count(R, r => r.Sexe), tranche: count(R, r => r['Tranche Age']).sort((x, y) => x[0].localeCompare(y[0])),
      club: count(R, r => r.Club).slice(0, 10), statut: count(R, r => r.Statut_Email),
      typeAnomalie: count(ko, r => r.Anomalies),
      inscriptions: count(R, r => (r.Date_Envoi || '').slice(0, 10)).sort((x, y) => x[0].split('/').reverse().join().localeCompare(y[0].split('/').reverse().join()))
    });
  }
  return json({ error: 'action' }, 400);
};
