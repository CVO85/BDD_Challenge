const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let DATA = [], sortK = 'nom', sortD = 1, shown = 100, cur = null;
const COLS = [['id', 'ID'], ['nom', 'Nom'], ['prenom', 'Prénom'], ['sexe', 'Sexe'], ['tranche', 'Âge'], ['club', 'Club'], ['anomalie', 'Contrôle']];
async function api(u, o) {
  const r = await fetch(u, { credentials: 'same-origin', ...o });
  if (r.status === 401) { showLogin(); throw 0; }
  return r.json();
}
function showLogin() { document.body.classList.remove('in'); $('#login').classList.remove('hide'); $('#app').classList.add('hide'); }
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
  $('#login').classList.add('hide'); $('#app').classList.remove('hide'); document.body.classList.add('in'); $('#capn').textContent = `${DATA.length} coureurs inscrits`;
  opts($('#fs'), DATA.map(r => r.sexe)); opts($('#ft'), DATA.map(r => r.tranche)); opts($('#fc'), DATA.map(r => r.club)); opts($('#fm'), DATA.map(r => r.statut)); opts($('#fa'), DATA.map(r => r.anomalie).filter(a => a && !a.startsWith('OK')));
  const th = $('#th');
  COLS.forEach(([k, l]) => { const h = el('th', '', l); h.onclick = () => { sortD = sortK === k ? -sortD : 1; sortK = k; render(); }; th.append(h); });
  th.append(el('th', 'act', ''));
  render();
}
['q', 'fs', 'ft', 'fc', 'fa', 'fm'].forEach(i => $('#' + i).oninput = () => { shown = 100; render(); });
$('#pg').onclick = () => { shown += 100; render(); };
const SV = d => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = { user: SV('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'), flag: SV('<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>') };
ICON.dl = SV('<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>');
const REV = {}; let VIEW = [];
const okF = r => { const v = $('#fa').value; return !v || (v === 'ko' ? r.anomalie && !r.anomalie.startsWith('OK') : v === 'ok' ? r.anomalie.startsWith('OK') : r.anomalie === v); };
const btn = (cls, icon, label) => { const b = el('button', 'btn ' + cls); b.innerHTML = ICON[icon]; b.append(label); return b; };
function render() {
  const q = norm($('#q').value), f = { sexe: $('#fs').value, tranche: $('#ft').value, club: $('#fc').value };
  let L = DATA.filter(r => (!q || norm([r.id, r.nom, r.prenom, r.club].join(' ')).includes(q)) && Object.entries(f).every(([k, v]) => !v || r[k] === v) && okF(r) && (!$('#fm').value || r.statut === $('#fm').value));
  L.sort((a, b) => (a[sortK] || '').localeCompare(b[sortK] || '', 'fr') * sortD);
  $('#cnt').textContent = `${L.length} coureur(s) sur ${DATA.length}`; VIEW = L; const x = $('#ex'); x.innerHTML = ICON.dl; x.append(` Exporter (${L.length})`); x.disabled = !L.length;
  const tb = $('#tb'); tb.replaceChildren();
  L.slice(0, shown).forEach(r => {
    const tr = el('tr');
    COLS.forEach(([k]) => {
      const td = el('td');
      if (k === 'sexe' && r.sexe) { const g = r.sexe.toLowerCase().startsWith('f') ? 'f' : 'm', p = el('span', 'sx ' + g, g.toUpperCase()); p.title = r.sexe; p.setAttribute('aria-label', r.sexe); td.append(p); }
      else if (k === 'anomalie') { const a = r.anomalie.replace(/^[^\p{L}]+/u, ''), p = el('span', 'pill cut' + (r.anomalie.startsWith('OK') ? '' : ' ko'), a); p.title = a; td.append(p); }
      else if (k === 'club') { const c = el('span', 'cut', r.club); c.title = r.club; td.append(c); }
      else if (k === 'tranche') td.textContent = r.tranche.replace(/^\d+\s*-\s*/, '');
      else td.textContent = r[k];
      tr.append(td);
    });
    const td = el('td', 'act'), v = btn('', 'user', 'Contacts'), s = btn('er', 'flag', 'Erreur ?');
    v.onclick = async () => {
      const nx = tr.nextElementSibling;
      if (nx && nx.classList.contains('det')) { nx.remove(); return; }
      const d = REV[r.id] || (REV[r.id] = await api('/api/data?action=reveal&id=' + encodeURIComponent(r.id)));
      const dr = el('tr', 'det'), c = el('td'); c.colSpan = COLS.length + 1;
      const m = el('a', '', d.email); m.href = 'mailto:' + d.email;
      const t = el('a', '', d.tel); t.href = 'tel:' + (d.tel || '').replace(/\s/g, '');
      c.append(el('span', 'dl', 'Email :'), m, el('span', 'dl', 'Téléphone :'), t, el('span', 'dl', 'Né(e) le :'), el('b', '', d.naissance));
      dr.append(c); tr.after(dr);
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
$('#t1').onclick = () => { $('#back').classList.add('hide'); tab(1); }; $('#t2').onclick = () => tab(2);
const NS = 'http://www.w3.org/2000/svg', pc = (n, t) => Math.round(n / (t || 1) * 100) + ' %';
const csv = v => { v = String(v ?? ''); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
$('#ex').onclick = async () => {
  const b = $('#ex'); b.disabled = true;
  try {
    const D = await api('/api/data?action=export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: VIEW.map(r => r.id) }) }), m = Object.fromEntries(D.map(d => [d.id, d]));
    const H = ['ID', 'Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Email', 'Téléphone', "Tranche d'âge", 'Club', 'Anomalies', 'Statut email'], K = ['id', 'nom', 'prenom', 'sexe', 'naissance', 'email', 'tel', 'tranche', 'club', 'anomalie', 'statut'];
    const t = '\ufeff' + [H, ...VIEW.map(r => m[r.id]).filter(Boolean).map(r => K.map(k => r[k]))].map(l => l.map(csv).join(';')).join('\r\n');
    const a = el('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = `coureurs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } finally { b.disabled = false; }
};
function bars(title, data, total, pick, color) {
  const c = el('div', 'card wide'), max = Math.max(...data.map(d => d[1]), 1); c.append(el('h3', '', title));
  data.forEach(([k, n, key]) => {
    const r = el('div', 'bi'), t = el('div', 'bt'), tr = el('div', 'tr'), b = el('div', 'b');
    b.style.width = (n / max * 100) + '%'; if (color) b.style.background = color; tr.append(b);
    t.append(tr, el('span', 'bv', `${n} (${pc(n, total)})`)); r.append(el('div', 'bl', k), t);
    if (pick) { r.classList.add('clk'); r.onclick = () => pick(key ?? k); }
    c.append(r);
  });
  return c;
}
function donut(title, data, colorOf, pick) {
  const c = el('div', 'card'), tot = data.reduce((s, d) => s + d[1], 0) || 1, w = el('div', 'dn'), lg = el('div', 'lg'), svg = document.createElementNS(NS, 'svg');
  c.append(el('h3', '', title)); svg.setAttribute('viewBox', '0 0 42 42'); svg.setAttribute('width', 160); svg.setAttribute('height', 160);
  let off = 25;
  data.forEach(([k, n], i) => {
    const p = n / tot * 100, ci = document.createElementNS(NS, 'circle'), col = colorOf(k, i);
    ci.setAttribute('cx', 21); ci.setAttribute('cy', 21); ci.setAttribute('r', 15.915); ci.setAttribute('fill', 'none'); ci.setAttribute('stroke-width', 7);
    ci.setAttribute('stroke-dasharray', `${p} ${100 - p}`); ci.setAttribute('stroke-dashoffset', off); ci.style.stroke = col; off -= p; svg.append(ci); if (pick) { ci.style.cursor = 'pointer'; ci.onclick = () => pick(k); }
    const d = el('div'), dot = el('span', 'dot'); dot.style.background = col; d.append(dot, `${k} : ${n} (${pc(n, tot)})`); if (pick) { d.classList.add('clk'); d.onclick = () => pick(k); } lg.append(d);
  });
  const t = document.createElementNS(NS, 'text'); t.setAttribute('x', 21); t.setAttribute('y', 23.5); t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', 7); t.setAttribute('font-weight', 700); t.style.fill = 'var(--fg)'; t.textContent = tot; svg.append(t);
  w.append(svg, lg); c.append(w); return c;
}
function vcols(title, data, color, pick) {
  const c = el('div', 'card' + (data.length > 8 ? ' wide' : '')), max = Math.max(...data.map(d => d[1]), 1), w = el('div', 'vc'); c.append(el('h3', '', title));
  data.forEach(([k, n, key]) => { const col = el('div', 'col'), b = el('div', 'vb'); if (pick) { col.classList.add('clk'); col.onclick = () => pick(key ?? k); } b.style.height = Math.max(n / max * 140, 2) + 'px'; b.style.background = color; col.title = `${k} : ${n}`; col.append(el('small', '', n), b, el('small', '', k)); w.append(col); });
  c.append(w); return c;
}
const kpi = (l, v, cls) => { const c = el('div', 'card kpi'); c.append(el('div', 'n ' + (cls || ''), v), el('div', '', l)); return c; };
const OTH = ['var(--or)', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444', '#14b8a6'];
const SEXC = k => /^f/i.test(k) ? '#ec4899' : /^m/i.test(k) ? '#3b82f6' : '#9ca3af';
let S = null, sub = 1;
$('#s1').onclick = () => { sub = 1; drawStats(); }; $('#s2').onclick = () => { sub = 2; drawStats(); };
async function stats() { S = await api('/api/data?action=stats'); drawStats(); }
function go(f) {
  ['q', 'fs', 'ft', 'fc', 'fa', 'fm'].forEach(i => { $('#' + i).value = ''; });
  Object.entries(f).forEach(([i, v]) => { $('#' + i).value = v; });
  shown = 100; tab(1); $('#back').classList.remove('hide'); render();
}
$('#bk').onclick = () => { ['q', 'fs', 'ft', 'fc', 'fa', 'fm'].forEach(i => { $('#' + i).value = ''; }); $('#back').classList.add('hide'); tab(2); };
function drawStats() {
  $('#s1').classList.toggle('on', sub === 1); $('#s2').classList.toggle('on', sub === 2);
  const k = el('div', 'kpis'), g = el('div', 'grid'), ok = S.total - S.anomalies, h = el('p', 'hint', 'Cliquez sur un élément d’un graphique pour afficher les coureurs correspondants.');
  if (sub === 1) {
    k.append(kpi('coureurs inscrits', S.total), kpi('clubs différents', S.nbClubs), kpi(`autre asso / sans club (${pc(S.autre, S.total)})`, S.autre), kpi('mineurs', S.mineurs));
    g.append(donut('Répartition par sexe', S.sexe, SEXC, v => go({ fs: v })),
      vcols('Tranches d’âge', S.tranche.map(([a, n]) => [a.replace(/^\d+\s*-\s*/, ''), n, a]), 'var(--ac)', v => go({ ft: v })),
      bars('Top 10 clubs (hors « autre asso »)', S.club, S.total, v => go({ fc: v })));
  } else {
    k.append(kpi('inscriptions', S.total), kpi(`sans anomalie (${pc(ok, S.total)})`, ok, 'ok'), kpi(`avec anomalie (${pc(S.anomalies, S.total)})`, S.anomalies, S.anomalies ? 'warn' : 'ok'));
    g.append(donut('Qualité des inscriptions', [['Sans anomalie', ok], ['Avec anomalie', S.anomalies]], a => a.startsWith('Sans') ? 'var(--ac)' : 'var(--or)', v => go({ fa: v.startsWith('Sans') ? 'ok' : 'ko' })),
      donut('Statut des emails', S.statut, (a, i) => a === 'Envoyé' ? 'var(--ac)' : OTH[i % OTH.length], v => go({ fm: v })));
    if (S.typeAnomalie.length) g.append(bars('Types d’anomalies', S.typeAnomalie.map(([a, n]) => [a.replace(/^[^\p{L}]+/u, ''), n, a]), S.anomalies, v => go({ fa: v }), 'var(--or)'));
    g.append(vcols('Inscriptions par jour', S.inscriptions.map(([a, n]) => [a.slice(0, 5), n]), 'var(--or)'));
  }
  $('#st').replaceChildren(h, k, g);
}
init();
