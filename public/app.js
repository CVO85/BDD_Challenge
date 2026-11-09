const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let DATA = [], sortK = 'nom', sortD = 1, shown = 50, cur = null;
const COLS = [['id', 'ID'], ['nom', 'Nom'], ['prenom', 'Prénom'], ['sexe', 'Sexe'], ['tranche', 'Âge'], ['club', 'Club'], ['anomalie', 'Contrôle']];
async function api(u, o) {
  const r = await fetch(u, { credentials: 'same-origin', ...o });
  if (r.status === 401) { showLogin(); throw 0; }
  return r.json();
}
function showLogin() { $('#login').classList.remove('hide'); $('#app').classList.add('hide'); }
$('#lf').onsubmit = async e => {
  e.preventDefault();
  const b = $('#lf button'), m = $('#lm'); b.disabled = true; m.className = ''; m.textContent = 'Envoi en cours…';
  try {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: $('#le').value }) });
    const d = await r.json().catch(() => ({}));
    m.className = r.ok ? 'ok' : 'err';
    m.textContent = r.ok ? 'Lien envoyé : consultez votre boîte mail (et les spams). Il est valable 15 minutes.' : (d.error || 'Une erreur est survenue.');
  } catch { m.className = 'err'; m.textContent = 'Connexion impossible, réessayez.'; }
  b.disabled = false;
};
$('#out').onclick = async () => { await fetch('/api/logout', { method: 'POST' }); location.reload(); };
function opts(sel, vals) { [...new Set(vals)].filter(Boolean).sort().forEach(v => sel.append(new Option(v, v))); }
async function init() {
  try { await api('/api/me'); DATA = await api('/api/data?action=list'); } catch { return; }
  $('#login').classList.add('hide'); $('#app').classList.remove('hide');
  opts($('#fs'), DATA.map(r => r.sexe)); opts($('#ft'), DATA.map(r => r.tranche)); opts($('#fc'), DATA.map(r => r.club));
  const th = $('#th');
  COLS.forEach(([k, l]) => { const h = el('th', '', l); h.onclick = () => { sortD = sortK === k ? -sortD : 1; sortK = k; render(); }; th.append(h); });
  th.append(el('th', '', ''));
  render();
}
['q', 'fs', 'ft', 'fc', 'fa'].forEach(i => $('#' + i).oninput = () => { shown = 50; render(); });
$('#pg').onclick = () => { shown += 50; render(); };
const SV = d => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = { user: SV('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'), flag: SV('<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>') };
const btn = (cls, icon, label) => { const b = el('button', 'btn ' + cls); b.innerHTML = ICON[icon]; b.append(label); return b; };
function render() {
  const q = norm($('#q').value), f = { sexe: $('#fs').value, tranche: $('#ft').value, club: $('#fc').value };
  let L = DATA.filter(r => (!q || norm([r.id, r.nom, r.prenom, r.club].join(' ')).includes(q)) && Object.entries(f).every(([k, v]) => !v || r[k] === v) && ($('#fa').value !== 'ko' || (r.anomalie && !r.anomalie.startsWith('OK'))));
  L.sort((a, b) => (a[sortK] || '').localeCompare(b[sortK] || '', 'fr') * sortD);
  $('#cnt').textContent = `${L.length} coureur(s) sur ${DATA.length}`;
  const tb = $('#tb'); tb.replaceChildren();
  L.slice(0, shown).forEach(r => {
    const tr = el('tr');
    COLS.forEach(([k]) => {
      const td = el('td');
      if (k === 'sexe' && r.sexe) { const g = r.sexe.toLowerCase().startsWith('f') ? 'f' : 'm', p = el('span', 'sx ' + g, g.toUpperCase()); p.title = r.sexe; p.setAttribute('aria-label', r.sexe); td.append(p); }
      else if (k === 'anomalie') td.append(el('span', 'pill' + (r.anomalie.startsWith('OK') ? '' : ' ko'), r.anomalie.replace(/^[^\p{L}]+/u, '')));
      else td.textContent = r[k];
      tr.append(td);
    });
    const td = el('td'), v = btn('', 'user', 'Contacts'), s = btn('er', 'flag', 'Erreur ?');
    v.onclick = async () => {
      const d = await api('/api/data?action=reveal&id=' + encodeURIComponent(r.id)), w = el('span', 'contact');
      const m = el('a', '', d.email); m.href = 'mailto:' + d.email; const t = el('a', '', d.tel); t.href = 'tel:' + d.tel.replace(/\s/g, '');
      w.append(m, ' · ', t, ' · né(e) le ' + d.naissance); v.replaceWith(w);
    };
    s.onclick = () => { cur = r; $('#ci').textContent = `${r.id} – ${r.prenom} ${r.nom}`; $('#cm').textContent = ''; $('#dg').showModal(); };
    td.append(v, ' ', s); tr.append(td); tb.append(tr);
  });
  $('#pg').classList.toggle('hide', L.length <= shown);
}
$('#cx').onclick = () => $('#dg').close();
$('#cf').onsubmit = async e => {
  e.preventDefault();
  const r = await fetch('/api/correction', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: cur.id, nom: `${cur.prenom} ${cur.nom}`, champ: $('#cch').value, valeur: $('#cv').value, commentaire: $('#cc').value, website: $('#cw').value }) });
  const d = await r.json(); $('#cm').textContent = d.ok ? 'Correction envoyée, merci !' : d.error; if (d.ok) { $('#cv').value = ''; $('#cc').value = ''; }
};
const tab = n => { $('#v1').classList.toggle('hide', n !== 1); $('#v2').classList.toggle('hide', n !== 2); $('#t1').classList.toggle('on', n === 1); $('#t2').classList.toggle('on', n === 2); if (n === 2) stats(); };
$('#t1').onclick = () => tab(1); $('#t2').onclick = () => tab(2);
function bars(title, data) {
  const c = el('div', 'card'), max = Math.max(...data.map(d => d[1]), 1); c.append(el('h3', '', title));
  data.forEach(([k, n]) => { const r = el('div', 'row'), b = el('div', 'b'); b.style.width = (n / max * 45) + '%'; r.append(el('span', '', k), b, el('span', '', n)); c.append(r); });
  return c;
}
async function stats() {
  const s = await api('/api/data?action=stats'), g = el('div', 'grid');
  const k = el('div', 'card'); k.append(el('h3', '', `${s.total} coureurs`), el('p', s.anomalies ? 'warn' : '', `${s.anomalies} avec anomalie (${Math.round(s.anomalies / s.total * 100)} %)`));
  g.append(k, bars('Sexe', s.sexe), bars('Tranche d’âge', s.tranche), bars('Top 10 clubs', s.club), bars('Statut email', s.statut), bars('Anomalies', s.typeAnomalie), bars('Inscriptions par jour', s.inscriptions));
  $('#st').replaceChildren(g);
}
init();
