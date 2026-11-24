/* Central de Campanhas — interface */
const E = window.Engine;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------------- ícones (traço único, 1.75) ---------------- */
const IC = {
  chev: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>', play: '<path d="M7 4.5v15l12-7.5z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  sliders: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  compare: '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  flask: '<path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5l-5.1-10.1a2 2 0 0 1-.2-.9V2M8.5 2h7M7 16h10"/>',
  spark: '<path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4M21 2l-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3M12 9v4M12 17h.01"/>',
  layers: '<path d="m12.8 2.2a2 2 0 0 0-1.7 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.7 0l8.6-3.9a1 1 0 0 0 0-1.8z"/><path d="m22 17.6-9.2 4.2a2 2 0 0 1-1.7 0L2 17.6M22 12.6l-9.2 4.2a2 2 0 0 1-1.7 0L2 12.6"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
  plus: '<path d="M5 12h14M12 5v14"/>', present: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>', trello: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3.5" height="9" rx=".5"/><rect x="13.5" y="7" width="3.5" height="5.5" rx=".5"/>', users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="${n === "play" ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;

const PLAT = { meta: { label: "Meta Ads", short: "Meta" }, google: { label: "Google Ads", short: "Google" }, linkedin: { label: "LinkedIn Ads", short: "LinkedIn" }, organico: { label: "Orgânico", short: "Orgânico" } };
const PLATS = ["meta", "google", "linkedin", "organico"];
const hasPlat = (c, p) => (p === "organico" ? (c.organico ? c.organico.length : c.reporteiId ? 1 : 0) : (c[p] || []).length);
const PERIODS = [
  { k: "7d", label: "7 dias" }, { k: "14d", label: "14 dias" }, { k: "30d", label: "30 dias" }, { k: "mes", label: "Este mês" }, { k: "mesant", label: "Mês passado" }, { k: "custom", label: "Personalizado" },
];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function range(k) {
  if (k === "custom" && st.custom && st.custom.start) return { ...st.custom };
  if (k === "custom") k = "7d";
  const t = new Date(); const end = new Date(t); let start = new Date(t);
  if (k === "7d") start.setDate(t.getDate() - 6);
  else if (k === "14d") start.setDate(t.getDate() - 13);
  else if (k === "30d") start.setDate(t.getDate() - 29);
  else if (k === "mes") start = new Date(t.getFullYear(), t.getMonth(), 1);
  else if (k === "mesant") { start = new Date(t.getFullYear(), t.getMonth() - 1, 1); end.setTime(new Date(t.getFullYear(), t.getMonth(), 0).getTime()); }
  return { start: iso(start), end: iso(end) };
}
const br = (s) => (s ? s.slice(8, 10) + "/" + s.slice(5, 7) : "");
// período anterior: o mesmo número de dias logo antes (no "mês passado", o mês retrasado inteiro)
function prevRange() {
  const r = range(st.period); const d0 = new Date(r.start + "T12:00:00"), d1 = new Date(r.end + "T12:00:00");
  if (st.period === "mesant") { const a = new Date(d0.getFullYear(), d0.getMonth() - 1, 1), b = new Date(d0.getFullYear(), d0.getMonth(), 0); return { start: iso(a), end: iso(b) }; }
  const days = Math.round((d1 - d0) / 864e5) + 1; const e = new Date(d0); e.setDate(e.getDate() - 1); const s2 = new Date(e); s2.setDate(s2.getDate() - days + 1);
  return { start: iso(s2), end: iso(e) };
}

/* ---------------- estado ---------------- */
const st = { leadsSheet: {}, leads: {}, leadsTab: {}, leadsAll: {}, present: false, done: {}, appr: {}, doneOpen: new Set(), clients: [], keys: {}, cur: null, platform: "meta", period: "7d", data: {}, loading: {}, strat: {}, stratLoading: false, view: "client", q: "", drawer: null, showVault: false };
const dkey = (p) => { const r = range(st.period); return `${st.cur}|${p}|${r.start}|${r.end}`; };
const pkey = (p) => { const r = prevRange(); return `${st.cur}|${p}|${r.start}|${r.end}`; };
// métricas do período anterior indexadas por campanha/conjunto (para a comparação)
const _pidx = {};
function prevIdx(p) {
  const k = pkey(p); const d = st.data[k]; if (!st.compare || !d || !d.accounts) return null;
  if (_pidx[k] && _pidx[k].d === d) return _pidx[k].m;
  const m = {}; d.accounts.forEach((a) => { m["a:" + a.accountId] = a; a.campaigns.forEach((cp) => { m["c:" + cp.id] = cp.metrics; (cp.sets || []).forEach((x) => { m["s:" + x.id] = x.metrics; }); }); });
  _pidx[k] = { d, m }; return m;
}
const LOWER_BETTER = /custo|cpc|cpl|cpm|cpa|\/conv|\/lead|\/engaj/i;
function chg(v, pv, col, opt = {}) {
  if (!st.compare || pv == null || v == null || !Number.isFinite(pv)) return "";
  const neutral = opt.neutral || (col && /^(spend|_spend)$/.test(col.k || "")) || (col && /invest/i.test(col.label || ""));
  const lower = col && LOWER_BETTER.test((col.label || "") + " " + (col.k || ""));
  if (col && col.fmt === "pct") { const df = v - pv; if (Math.abs(df) < 0.005) return `<small class="cd">=</small>`; const good = lower ? df < 0 : df > 0;
    return `<small class="cd ${neutral ? "" : good ? "up" : "down"}">${df > 0 ? "+" : ""}${E.fmt(df, "dec")} p.p.</small>`; }
  if (!pv) return v ? `<small class="cd ${neutral ? "" : lower ? "down" : "up"}">novo</small>` : `<small class="cd">=</small>`;
  const r = (v - pv) / Math.abs(pv) * 100; if (Math.abs(r) < 0.5) return `<small class="cd">=</small>`;
  const good = lower ? r < 0 : r > 0;
  return `<small class="cd ${neutral ? "" : good ? "up" : "down"}" title="Antes: ${esc(E.fmt(pv, (col && col.fmt) || "int"))}">${r > 0 ? "+" : ""}${E.fmt(r, Math.abs(r) >= 100 ? "int" : "dec1")}%</small>`;
}
const curClient = () => st.clients.find((c) => c.key === st.cur);

function toast(msg, kind = "") {
  const t = $("#toast"); t.className = "toast show " + kind; t.innerHTML = esc(msg);
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = "toast " + kind), kind === "err" ? 6500 : 3200);
}
async function safe(fn, label) {
  try { return await fn(); } catch (e) { toast((label ? label + ": " : "") + String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""), "err"); return null; }
}

/* ---------------- boot ---------------- */
function applyTheme() { document.documentElement.dataset.theme = st.theme === "light" ? "light" : "dark"; }
function showUpdateOverlay(title, notes) {
  let el = document.getElementById("upd"); if (!el) { el = document.createElement("div"); el.id = "upd"; el.className = "upd"; document.body.appendChild(el); }
  el.innerHTML = `<div class="upd-in"><span class="brand-mark big" aria-hidden="true"></span><h2>${esc(title)}</h2>${notes ? `<p>${esc(notes)}</p>` : ""}<p class="upd-sub"><span class="spin"></span> O app reinicia sozinho em alguns segundos.</p></div>`;
}
async function runUpdate(r) {
  showUpdateOverlay(`Atualizando para a versão ${r.latest}…`, r.notes);
  const res = await api6.updateApply().catch((e) => ({ error: e.message }));
  if (res && res.error) { const el = document.getElementById("upd"); if (el) el.remove(); toast("Não consegui atualizar agora: " + res.error, "err"); }
}
// procura atualização toda vez que o app abre; se achar, aplica e reinicia
async function autoUpdate() {
  const r = await api6.updateCheck().catch(() => null);
  if (r && r.hasUpdate) await runUpdate(r);
}
async function boot() {
  autoUpdate();
  const [clients, keys, ui] = await Promise.all([api.clientsList(), api.keysStatus(), api.uiGet()]);
  Object.assign(st, { clients: clients || [], keys, period: ui.period || "7d", platform: ui.platform || "meta", stratFull: !!ui.stratFull, custom: ui.custom || null, theme: ui.theme === "light" ? "light" : "dark", compare: !!ui.compare });
  applyTheme();
  if (ui.cur && st.clients.some((c) => c.key === ui.cur)) st.cur = ui.cur;
  renderRail();
  if (!st.clients.length) { st.view = keys.reportei ? "welcome" : "settings"; renderMain(); return; }
  if (!st.cur) st.cur = (st.clients.find((c) => c.active !== false && (c.meta || []).length + (c.google || []).length + (c.linkedin || []).length) || st.clients[0]).key;
  selectClient(st.cur);
  api.metaTokenInfo().then((r) => { st.keys.metaExpiresAt = r && r.expiresAt; renderRail(); });
}

/* ---------------- rail ---------------- */
function platDots(c) {
  return ["meta", "google", "linkedin"].map((p) => `<i class="pd pd-${p} ${(c[p] || []).length ? "on" : ""}" title="${PLAT[p].short}${(c[p] || []).length ? "" : " sem conta"}"></i>`).join("");
}
function metaWarn() {
  const exp = st.keys.metaExpiresAt; if (!exp) return "";
  const days = (exp * 1000 - Date.now()) / 864e5;
  if (days > 7) return "";
  return `<button class="rail-warn" data-act="settings">${icon("alert")}<span>${days <= 0 ? "Token do Meta venceu" : `Token do Meta vence em ${days < 1 ? "menos de 1 dia" : Math.ceil(days) + " dias"}`}</span></button>`;
}
function renderRail() {
  const q = st.q.trim().toLowerCase();
  const inactive = st.clients.filter((c) => c.active === false).length;
  const list = st.clients.filter((c) => (!q || c.name.toLowerCase().includes(q)) && (st.showInactive || c.active !== false || c.key === st.cur));
  $("#rail").innerHTML = `
    <div class="brand"><span class="brand-mark" aria-hidden="true"></span><div><b>Central</b><span>de Campanhas</span></div></div>
    <label class="search">${icon("search")}<input id="q" placeholder="Buscar cliente" value="${esc(st.q)}" autocomplete="off" /></label>
    <nav class="clients" aria-label="Clientes">
      ${list.map((c) => `<button class="client ${c.key === st.cur && st.view === "client" ? "sel" : ""} ${c.active === false ? "off" : ""}" data-client="${esc(c.key)}"><span class="cname">${esc(c.name)}</span><span class="dots">${platDots(c)}</span></button>`).join("") || `<p class="muted pad">Nenhum cliente${q ? " com esse nome" : ""}.</p>`}
    </nav>
    ${inactive ? `<button class="rail-inact" data-act="toggle-inactive">${st.showInactive ? "Esconder" : "Mostrar"} inativos (${inactive})</button>` : ""}
    ${metaWarn()}
    <button class="rail-foot rail-theme" data-act="theme" title="Trocar entre tema claro e escuro">${icon(st.theme === "light" ? "moon" : "sun")}<span>${st.theme === "light" ? "Modo escuro" : "Modo claro"}</span></button>
    <button class="rail-foot ${st.view === "settings" ? "sel" : ""}" data-act="settings">${icon("sliders")}<span>Configurações</span></button>`;
  const qi = $("#q"); qi.oninput = () => { st.q = qi.value; const pos = qi.selectionStart; renderRail(); const n = $("#q"); n.focus(); n.setSelectionRange(pos, pos); };
}

/* ---------------- cliente ---------------- */
function selectClient(key) {
  st.cur = key; st.view = "client"; st.showVault = false; closeDrawer();
  api.uiSet({ cur: key });
  renderRail(); renderMain();
  PLATS.forEach((p) => loadPlatform(p));
  loadStrategy(); loadDone(); loadAppr(); loadLeads();
}
async function loadLeads(force) {
  const c = curClient(); if (!c) return;
  const r = range(st.period); const k = `${c.key}|${r.start}|${r.end}`;
  if (!force && st.leads[k]) return;
  if (!c.trelloBoardId && !c.leadsSheetId) { st.leads[k] = { skip: true }; return; }
  st.leads[k] = { loading: true }; paint();
  const res = await safe(() => api4.leadsGet({ key: c.key, ...r }), "Leads");
  st.leads[k] = res || { ok: false, reason: "Não consegui ler a planilha agora." }; paint();
}
async function loadDone(force) {
  const c = curClient(); if (!c) return;
  if (!force && st.done[c.key]) return;
  if (!c.trelloBoardId || !st.keys.trello) { st.done[c.key] = { skip: true }; return; }
  st.done[c.key] = { loading: true }; paint();
  const r = await safe(() => api3.trelloDone({ key: c.key }), "Trello");
  st.done[c.key] = r || { ok: false, reason: "Não consegui ler o Trello agora." }; paint();
}
async function loadAppr(force) {
  const c = curClient(); if (!c) return;
  if (!force && st.appr[c.key]) return;
  if (!c.trelloBoardId || !st.keys.trello) { st.appr[c.key] = { skip: true }; return; }
  st.appr[c.key] = { loading: true }; paint();
  const r = await safe(() => api3.trelloApproval({ key: c.key }), "Trello");
  st.appr[c.key] = r || { ok: false, reason: "Não consegui ler o Trello agora." }; paint();
}
async function loadPlatform(p, force) {
  const c = curClient(); if (!c) return;
  const k = dkey(p);
  if (!force && (st.data[k] || st.loading[k])) { if (st.compare && st.data[k]) loadPrev(p); return; }
  if (!hasPlat(c, p)) { st.data[k] = { accounts: [], networks: [], notes: [], empty: true }; return paint(); }
  st.loading[k] = true; paint();
  const r = range(st.period);
  const res = await safe(() => api.platform({ key: c.key, platform: p, ...r }), PLAT[p].label);
  st.loading[k] = false; st.data[k] = res || { accounts: [], networks: [], notes: ["Não foi possível carregar."] };
  if (st.compare) loadPrev(p);
  if (p === "organico" && res && res.organico) c.organico = res.organico;
  paint();
}
async function loadPrev(p, force) {
  const c = curClient(); if (!c || p === "organico" || !hasPlat(c, p)) return; // o orgânico já vem com o período anterior
  const k = pkey(p); if (!force && (st.data[k] || st.loading[k])) return;
  st.loading[k] = true;
  const res = await safe(() => api.platform({ key: c.key, platform: p, ...prevRange() }), PLAT[p].label + " (período anterior)");
  st.loading[k] = false; st.data[k] = res || { accounts: [], notes: [] }; paint();
}
let _paintQ = false;
// setTimeout em vez de requestAnimationFrame: o rAF para quando a janela está em segundo plano
function paint() { if (_paintQ) return; _paintQ = true; setTimeout(() => { _paintQ = false; if (st.view === "client") renderMain(true); }, 16); }

async function loadStrategy(force) {
  const c = curClient(); if (!c) return;
  if (!force && st.strat[c.key]) return;
  const r = await safe(() => api.strategy({ key: c.key }));
  st.strat[c.key] = r || { available: false }; paint();
}
async function genStrategy() {
  const c = curClient(); st.stratLoading = true; paint();
  const names = []; ["meta", "google", "linkedin"].forEach((p) => { const d = st.data[dkey(p)]; (d && d.accounts || []).forEach((a) => a.campaigns.forEach((x) => names.push({ plataforma: PLAT[p].short, campanha: x.name, destino: x.formType ? E.FORM_LABEL[x.formType] : undefined, conjuntos: (x.sets || []).filter((s) => !/^(Anúncios|Todos os anúncios|Recursos)/.test(s.name)).map((s) => s.name) }))); });
  const recent = []; const lim = Date.now() - 60 * 864e5;
  ["meta", "google", "linkedin"].forEach((p) => { const d = st.data[dkey(p)]; (d && d.accounts || []).forEach((a) => a.campaigns.forEach((cp) => {
    if (cp.start && new Date(cp.start).getTime() > lim) recent.push({ plataforma: PLAT[p].short, campanha: cp.name, anuncio: "", criadoEm: cp.start, status: cp.status });
    (cp.sets || []).forEach((s2) => (s2.ads || []).forEach((ad) => { if (ad.created && new Date(ad.created).getTime() > lim) recent.push({ plataforma: PLAT[p].short, campanha: cp.name, conjunto: s2.name, anuncio: ad.name, criadoEm: ad.created, status: ad.status }); }));
  })); });
  recent.sort((x, y) => String(y.criadoEm).localeCompare(String(x.criadoEm)));
  const r = await safe(() => api.strategyAI({ key: c.key, campaigns: names, recentAds: recent }), "Leitura estratégica");
  st.stratLoading = false;
  if (r) { st.strat[c.key] = { ...(st.strat[c.key] || {}), ai: r, aiStale: false }; toast("Leitura estratégica atualizada."); }
  paint();
}

/* destino do lead (Meta): formulário nativo 40% · site/LP 10%, pelo gasto majoritário */
function acctCtx(p, a) {
  if (p === "google") return { mixedSearch: a.campaigns.some((c) => c.channel === "SEARCH") };
  if (p === "meta") {
    const sp = (t) => a.campaigns.filter((c) => c.formType === t).reduce((n, c) => n + ((c.metrics || {}).spend || 0) + 0.001, 0);
    const mixed = a.campaigns.some((c) => c.formType === "native") && a.campaigns.some((c) => c.formType === "site");
    return { formType: sp("native") >= sp("site") ? "native" : "site", mixed };
  }
  return {};
}
const formLabel = (cp) => (cp.formMixed ? "Form. nativo + site" : cp.formType === "native" ? "Formulário nativo" : cp.formType === "site" ? "Site/LP" : "");
/* totais de uma conta */
function sumM(list) {
  const t = {}; list.filter(Boolean).forEach((m) => Object.entries(m).forEach(([k, v]) => { if (typeof v === "number" && !["frequency", "impressionShare", "lostBudget", "lostRank"].includes(k)) t[k] = (t[k] || 0) + v; }));
  return t;
}
const isEng = (cp) => E.isEngage(cp);
const realCamps = (a) => a.campaigns.filter((c) => c.id !== "rp-sem" && c.id !== "rp-ads");
function accountTotals(p, a) {
  if (p === "linkedin" && a.totals && a.totals.spend != null) return a.totals;
  return sumM(a.campaigns.map((c) => c.metrics));
}
function platformSummary(p) {
  const d = st.data[dkey(p)]; if (!d) return null;
  const accs = d.accounts || [];
  const tot = sumM(accs.map((a) => accountTotals(p, a)));
  const camps = accs.reduce((n, a) => n + a.campaigns.filter((c) => !String(c.id).startsWith("rp-sem") && c.id !== "rp-ads").length, 0);
  const ctx = acctCtx(p, { campaigns: accs.flatMap((a) => a.campaigns) });
  let diag = accs.length ? E.diagnose(p, tot, ctx) : null;
  if (accs.some((a) => a.campaigns.some(isEng))) {
    const resC = accs.flatMap((a) => realCamps(a).filter((c) => !isEng(c)));
    diag = resC.length ? E.diagnose(p, sumM(resC.map((c) => c.metrics)), ctx) : { kind: "none", steps: [], engOnly: true };
  }
  return { tot, camps, diag };
}

/* ---------------- render principal ---------------- */
function renderMain(keepScroll) {
  const m = $("#main"); const y = m.scrollTop;
  if (st.view === "settings") { m.innerHTML = settingsHTML(); bindSettings(); return; }
  if (st.view === "welcome") { m.innerHTML = welcomeHTML(); return; }
  const c = curClient(); if (!c) { m.innerHTML = welcomeHTML(); return; }
  m.innerHTML = `
    <header class="top">
      <div class="title">
        <h1>${esc(c.name)}</h1>
        <p class="sub"><span class="internal">${c.reporteiName ? `Reportei: ${esc(c.reporteiName)}` : `<span class="warn-t">Sem projeto no Reportei vinculado</span>`}${c.tier ? ` · Tier ${c.tier}` : ""} · </span>${br(range(st.period).start)} a ${br(range(st.period).end)}</p>
      </div>
      <div class="top-actions">
        <div class="client-tools">
          ${c.trelloUrl || c.trelloBoardId ? `<a class="btn ghost sm" href="${esc(c.trelloUrl || "https://trello.com/b/" + c.trelloBoardId)}" target="_blank" title="${esc(c.trelloBoardName || "Board no Trello")}">${icon("trello")}Trello</a>` : `<button class="btn ghost sm" data-act="pick-trello-cur">${icon("trello")}Vincular Trello</button>`}
          <label class="switch" title="Clientes inativos saem da lista lateral e da rotina P.O. (daily, touchs, combinados)"><input type="checkbox" data-act="active-cur" ${c.active !== false ? "checked" : ""}/><span class="sw"></span>Ativo na carteira</label>
        </div>
        <div class="seg" role="tablist" aria-label="Período">${PERIODS.map((p) => `<button role="tab" aria-selected="${st.period === p.k}" data-period="${p.k}">${p.label}</button>`).join("")}</div>
        ${st.period === "custom" ? `<div class="custom-range"><input type="date" id="dStart" value="${range("custom").start}" max="${iso(new Date())}" aria-label="Data inicial"/><span>até</span><input type="date" id="dEnd" value="${range("custom").end}" max="${iso(new Date())}" aria-label="Data final"/><button class="btn primary sm" data-act="apply-range">Aplicar</button></div>` : ""}
        <button class="btn ghost sm cmp-btn ${st.compare ? "on" : ""}" data-act="compare" aria-pressed="${!!st.compare}" title="${st.compare ? `Comparando com ${br(prevRange().start)} a ${br(prevRange().end)}` : "Mostra a variação de cada número contra o período anterior de mesmo tamanho"}">${icon("compare")}${st.compare ? `vs ${br(prevRange().start)}–${br(prevRange().end)}` : "Comparar"}</button>
        <button class="btn icon-only" data-act="refresh" title="Atualizar dados">${icon("refresh")}</button>
        <button class="btn ghost sm internal-btn" data-act="present" title="Esconde a lista de clientes e as ferramentas internas (Cmd+Shift+P)">${icon("present")}Apresentar</button>
      </div>
    </header>
    ${strategyHTML(c)}
    ${apprHTML(c)}
    ${doneHTML(c)}
    ${leadsHTML(c)}
    <nav class="ptabs" role="tablist">${PLATS.map((p) => ptabHTML(c, p)).join("")}</nav>
    <section class="pbody" id="pbody">${platformHTML(c, st.platform)}</section>`;
  if (keepScroll) m.scrollTop = y;
  restoreOpen();
}
function ptabHTML(c, p) {
  if (p === "organico") return orgTabHTML(c);
  const has = (c[p] || []).length; const k = dkey(p); const s = platformSummary(p); const load = st.loading[k];
  const dg = s && s.diag;
  const pd = st.compare && st.data[pkey(p)]; const ptot = pd && pd.accounts ? sumM(pd.accounts.map((a) => accountTotals(p, a))) : null;
  const flag = !has ? `<em class="pt-none">sem conta</em>` : load && !s ? `<span class="spin"></span>` : s ? `<span class="pt-val">${E.fmt(s.tot.spend, "money")}${ptot ? chg(s.tot.spend, ptot.spend, null, { neutral: true }) : ""}</span><span class="pt-sub">${s.camps} ativa${s.camps === 1 ? "" : "s"}${dg && dg.kind === "bad" ? ` · <b class="bad">${esc(dg.rate)}</b>` : dg && dg.kind === "ok" ? ` · <b class="good">no benchmark</b>` : dg && dg.engOnly ? ` · só engajamento` : ""}</span>` : "";
  return `<button role="tab" class="ptab pt-${p}" aria-selected="${st.platform === p}" data-plat="${p}" ${has ? "" : "data-empty"}><span class="pt-name"><i class="pd pd-${p} on"></i>${PLAT[p].short}</span>${flag}</button>`;
}

/* ---------------- linha do tempo de cada frente ---------------- */
function parseDM(dm) {
  const m = /^(\d{1,2})\/(\d{1,2})/.exec(dm || ""); if (!m) return null;
  const t = new Date(); const d = new Date(t.getFullYear(), Number(m[2]) - 1, Number(m[1]));
  if (d.getTime() - t.getTime() > 7 * 864e5) d.setFullYear(t.getFullYear() - 1);
  return d;
}
const daysSince = (dm) => { const d = parseDM(dm); return d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 864e5)) : null; };
const agoTxt = (n) => (n === 0 ? "hoje" : n === 1 ? "há 1 dia" : `há ${n} dias`);
function whenLine(f) {
  const n = f.ativadoEm ? daysSince(f.ativadoEm) : null;
  if (f.status === "validado" || f.status === "descartado") return f.ativadoEm ? `rodou desde ${f.ativadoEm}` : "";
  if (f.ativadoEm) return n === 0 ? "ativado hoje" : n == null ? `no ar desde ${f.ativadoEm}` : `no ar ${agoTxt(n)}`;
  const c = f.combinadoEm ? daysSince(f.combinadoEm) : null;
  const comb = f.combinadoEm ? `combinado ${c == null ? "em " + f.combinadoEm : agoTxt(c)}` : "";
  // "testando" sem data de ativação: a frente roda, mas o dia exato não consta nas notas
  if (f.status === "testando") return comb ? `em teste · ${comb}` : "em teste";
  return comb ? `${comb} · ainda não no ar` : "";
}
const frontMeta = (f) => `${esc(f.plataforma)}${f.combinadoEm ? ` · combinado em ${esc(f.combinadoEm)}` : f.desde ? ` · desde ${esc(f.desde)}` : ""}${f.ativadoEm ? ` · no ar desde ${esc(f.ativadoEm)}` : ""}`;
const TLK = { combinado: "c", ativado: "a", ajustado: "j", acompanhado: "m", resultado: "r", bloqueio: "b" };
function fTimeline(f) {
  const seenEv = new Set();
  const ev = (f.eventos || []).filter((e) => { if (!e || !e.data) return false; const k = e.data + "|" + String(e.rotulo).toLowerCase(); if (seenEv.has(k)) return false; seenEv.add(k); return true; });
  if (!ev.length) { if (f.combinadoEm) ev.push({ data: f.combinadoEm, rotulo: "Combinado" }); if (f.ativadoEm) ev.push({ data: f.ativadoEm, rotulo: "Ativado" }); }
  if (!ev.length && !f.situacao && !f.proximo) return "";
  const steps = ev.map((e) => `<li class="tl-step k-${TLK[String(e.rotulo || "").toLowerCase()] || "x"}"><i></i><b>${esc(e.data)}</b><span>${esc(e.rotulo || "")}</span>${e.texto ? `<small>${esc(e.texto)}${e.fonte ? ` · ${esc(e.fonte)}` : ""}</small>` : ""}</li>`).join("");
  const w = whenLine(f);
  return `<div class="ftl"><ol class="tl">${steps}<li class="tl-step now"><i></i><b>Hoje</b>${w ? `<span>${esc(w)}</span>` : ""}</li></ol>${f.situacao ? `<p class="ftl-row"><label>Situação</label>${esc(f.situacao)}</p>` : ""}${f.proximo ? `<p class="ftl-row"><label>Próximo passo</label>${esc(f.proximo)}</p>` : ""}</div>`;
}

/* ---------------- estratégia (cofre) ---------------- */
const STATUS = { testando: "Testando", planejado: "Planejado", validado: "Validado", descartado: "Descartado" };
function strategyHTML(c) {
  const s = st.strat[c.key];
  if (!s || !s.available) return "";
  const ai = s.ai || s.aiPrev;
  const b = s.bundle || {};
  const head = `
    <div class="strat-head">
      <div><h2>O que estamos atacando</h2>
      <p class="sub">${ai ? `Leitura gerada em ${new Date(ai.geradoEm).toLocaleDateString("pt-BR")} a partir do cofre${s.aiStale ? ` · <span class="warn-t">o cofre mudou desde então</span>` : ""}` : "A partir do histórico, das reuniões e dos combinados do cofre Clientes P.O."}</p></div>
      <div class="strat-actions">
        <button class="btn ghost" data-act="vault">${icon("folder")}Abrir no Obsidian</button>
        <button class="btn ghost" data-act="toggle-vault">${st.showVault ? "Esconder notas" : "Ver notas do cofre"}</button>
        <button class="btn ${ai && !s.aiStale && ai.v >= 3 ? "ghost" : "primary"}" data-act="gen-strat" ${st.stratLoading ? "disabled" : ""}>${st.stratLoading ? `<span class="spin"></span>Lendo o cofre…` : `${icon("spark")}${ai ? (ai.v >= 3 ? "Atualizar leitura" : "Atualizar leitura (com linha do tempo)") : "Gerar leitura estratégica"}`}</button>
      </div>
    </div>`;
  const fr = ai && ai.frentes && ai.frentes.length ? `
    ${ai.resumo ? `<p class="strat-sum">${esc(ai.resumo)}</p>` : ""}
    ${!st.stratFull ? `<ol class="fronts compact">${ai.frentes.map((f, i) => `
      <li class="front-c" id="front-${i}" data-act="strat-full" title="${esc(f.hipotese)}"><span class="fc-st"><span class="pill st-${esc(f.status)}">${STATUS[f.status] || esc(f.status)}</span>${whenLine(f) ? `<small>${esc(whenLine(f))}</small>` : ""}</span><span class="f-plat">${esc(f.plataforma)}</span><span class="fc-g">${esc(f.gargalo)}</span><span class="fc-arrow">${icon("chev")}</span><span class="fc-s">${esc(f.solucao)}</span>${f.situacao ? `<span class="fc-now"><label>Hoje</label>${esc(f.situacao)}</span>` : ""}</li>`).join("")}</ol>
      <button class="linkish more-l" data-act="strat-full">Ver hipóteses, evidências e próximos passos</button>` : `
    <ol class="fronts">${ai.frentes.map((f, i) => `
      <li class="front st-${esc(f.status)}" id="front-${i}">
        <div class="f-meta"><span class="pill st-${esc(f.status)}">${STATUS[f.status] || esc(f.status)}</span><span class="f-plat">${frontMeta(f)}</span></div>
        <div class="f-chain">
          <div><label>Gargalo</label><p>${esc(f.gargalo)}</p></div>
          <div><label>Hipótese</label><p>${esc(f.hipotese)}</p></div>
          <div><label>Solução</label><p>${esc(f.solucao)}</p></div>
        </div>
        ${fTimeline(f)}
        ${f.evidencia || (f.campanhas || []).length ? `<div class="f-foot">${f.evidencia ? `<span class="f-ev">${esc(f.evidencia)}</span>` : ""}${(f.campanhas || []).map((n) => `<span class="chip">${icon("layers")}${esc(n)}</span>`).join("")}${(f.conjuntos || []).map((n) => `<span class="chip">${icon("users")}${esc(n)}</span>`).join("")}</div>` : ""}
      </li>`).join("")}</ol>
    ${(ai.proximos || []).length ? `<div class="next"><label>Próximos passos</label><ul>${ai.proximos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <button class="linkish more-l" data-act="strat-full">Mostrar resumido</button>`}` :
    `<div class="strat-empty">${b.visaoGeral || b.meetings && b.meetings.length ? `<p>As notas deste cliente estão no cofre. Gere a leitura para ver cada gargalo com a hipótese e a solução lado a lado, ligados às campanhas.</p>` : `<p>Ainda não há histórico nem reunião registrada para este cliente no cofre.</p>`}</div>`;
  const vault = st.showVault ? `<div class="vault">
      ${b.visaoGeral ? `<h3>Gargalo por semana</h3>${md(b.visaoGeral)}` : ""}
      ${b.ultimaSemana ? `<h3>Última semana registrada</h3>${md(b.ultimaSemana.replace(/^## .*\n/, ""))}` : ""}
      ${(b.meetings || []).slice(0, 2).map((m) => m.diagnostico ? `<h3>Diagnóstico da reunião de ${br(m.date)}</h3>${md(m.diagnostico)}` : "").join("")}
      ${b.emAberto ? `<h3>Em aberto</h3>${md(b.emAberto)}` : ""}
    </div>` : "";
  return `<section class="strat">${head}${fr}${vault}</section>`;
}
/* ---------------- leads da planilha de acompanhamento ---------------- */
const platOfTab = (n) => { const t = String(n || "").toLowerCase(); return /meta|facebook|instagram/.test(t) ? "meta" : /google/.test(t) ? "google" : /linkedin/.test(t) ? "linkedin" : ""; };
function mqlChip(l) {
  if (l.mqlSrc === "cor") return l.mql === "sim" ? `<span class="yn sim" title="Marcado em verde na planilha">MQL</span>` : `<span class="yn nao fora" title="${l.roleOut ? "Cargo marcado em vermelho na planilha" : "Marcado em vermelho na planilha"}">Fora do perfil</span>`;
  return yn(l.mql);
}
function yn(v, labels) {
  const L = Object.assign({ sim: "Sim", nao: "Não", aguardando: "Ag. qualificação", outro: "—" }, labels || {});
  if (!v) return `<span class="yn empty" title="O cliente ainda não preencheu">—</span>`;
  return `<span class="yn ${v}">${esc(L[v] || v)}</span>`;
}
function leadsHTML(c) {
  const r = range(st.period); const d = st.leads[`${c.key}|${r.start}|${r.end}`];
  if (!d || d.skip) return "";
  const head = (sub, extra) => `<section class="leads"><div class="done-head"><div><h2>Leads da planilha</h2><p class="sub">${sub}</p></div>${extra || ""}</div>`;
  if (d.loading) return head(`<span class="spin"></span> Lendo a planilha de acompanhamento…`) + `</section>`;
  const link = d.sheetUrl ? `<a class="btn ghost sm internal-btn" href="${esc(d.sheetUrl)}" target="_blank">${icon("ext")}Abrir planilha</a>` : "";
  const apiOff = d.apiOff ? `<div class="note internal-btn">${icon("alert")}<span>Para ler as <b>cores</b> da planilha e as planilhas privadas, ative a API do Google Sheets no seu projeto do Google (1 clique) e volte aqui.</span><button class="btn ghost sm" data-act="open-url" data-url="${esc(d.apiOff.url)}">Ativar a API</button></div>` : "";
  if (!d.ok) return head(esc(d.reason || ""), link) + apiOff + (d.private && !st.keys.sheets ? `<div class="sheet-form"><button class="btn primary sm" data-act="sheets-connect">Conectar minha conta do Google</button><span class="hint">Só leitura de planilhas. Você aprova no navegador.</span></div>` : "") + (d.needSheet ? `<div class="sheet-form"><input id="sheetUrl" placeholder="Colar o link da planilha de acompanhamento" autocomplete="off"/><button class="btn primary sm" data-act="set-sheet">Usar esta planilha</button></div>` : "") + `</section>`;
  const sheets = d.sheets;
  const sh = sheets.find((x) => x.id === st.leadsSheet[c.key]) || sheets.find((x) => x.tabs.some((t) => t.leads.length)) || sheets[0];
  const totalAll = sheets.reduce((a, x) => a + x.tabs.reduce((b, t) => b + t.leads.length, 0), 0);
  const link2 = `<a class="btn ghost sm internal-btn" href="${esc(sh.url)}" target="_blank">${icon("ext")}Abrir planilha</a>`;
  const withLeads = sh.tabs.filter((t) => t.leads.length); const tabs = withLeads.length ? withLeads : sh.tabs.slice(0, 6); const hiddenTabs = sh.tabs.length - tabs.length;
  const all = tabs.flatMap((t) => t.leads.map((l) => ({ ...l, tab: t.name }))).sort((a, b) => b.date.localeCompare(a.date));
  const sel = st.leadsTab[c.key] || (tabs.length > 4 ? (tabs.find((t) => platOfTab(t.name) === st.platform) || tabs[0]).name : "__all");
  const tab = sel === "__all" ? null : tabs.find((t) => t.name === sel);
  const leads = tab ? tab.leads.map((l) => ({ ...l, tab: tab.name })) : all;
  const has = (k) => (tab ? tab.has[k] : tabs.some((t) => t.has[k]));
  const n = (k, v) => leads.filter((l) => l[k] === v).length;
  const meet = leads.filter((l) => l.meeting === "sim" || l.sql === "sim").length;
  const noFill = has("mql") ? n("mql", "") : 0;
  const kpi = (label, val, cls, hint) => `<div class="kpi ${cls || ""}" ${hint ? `title="${esc(hint)}"` : ""}><i>${label}</i><b>${val}</b></div>`;
  const shown = st.leadsAll[c.key] ? leads : leads.slice(0, 80);
  const noDate = tab ? tab.noDate : tabs.reduce((a, t) => a + t.noDate, 0);
  const showCompany = has("company"), showSql = tabs.some((t) => t.has.sql);
  const sales = leads.filter((l) => l.sale === "sim"); const showSale = sales.length > 0 || tabs.some((t) => t.has.sale);
  const saleSum = sales.reduce((a, l) => a + (l.saleValue || 0), 0);
  const byColor = leads.filter((l) => l.mqlSrc === "cor").length;
  const showIcp = tabs.some((t) => t.has.icp);
  return head(`${all.length} lead${all.length === 1 ? "" : "s"}${sheets.length > 1 ? ` nesta planilha (${totalAll} em ${sheets.length} planilhas)` : ""} entre ${br(r.start)} e ${br(r.end)}${noDate ? ` · ${noDate} sem data na planilha` : ""}${hiddenTabs > 0 ? ` · ${hiddenTabs} aba${hiddenTabs > 1 ? "s" : ""} sem leads no período` : ""} · atualizado às ${new Date(d.fetchedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, link2) + apiOff + (sheets.length > 1 ? `<div class="lsheets" role="tablist" aria-label="Planilhas do cliente">${sheets.map((x) => `<button role="tab" aria-selected="${x.id === sh.id}" data-act="leads-sheet" data-id="${esc(x.id)}" title="${esc(x.docTitle || x.label)}">${icon("layers")}${esc(x.label)}<span>${x.tabs.reduce((b, t) => b + t.leads.length, 0)}</span></button>`).join("")}</div>` : "") + ((d.skipped || []).filter((x) => x.error && x.error !== "sem abas de leads").map((x) => `<p class="hint warn-t">${esc(x.label)}: ${esc(x.error)}</p>`).join("")) + `
    <div class="ltabs" role="tablist"><button role="tab" aria-selected="${!tab}" data-act="leads-tab" data-tab="__all">Todas<span>${all.length}</span></button>${tabs.map((t) => `<button role="tab" aria-selected="${tab && tab.name === t.name}" data-act="leads-tab" data-tab="${esc(t.name)}">${esc(t.name)}<span>${t.leads.length}</span></button>`).join("")}</div>
    ${byColor || leads.some((l) => l.roleOut) ? `<p class="hint legend"><i class="lg g"></i>verde = MQL <i class="lg r"></i>vermelho = fora do perfil (cargo vermelho também conta) · lido das cores da planilha${byColor ? ` em ${byColor} lead${byColor > 1 ? "s" : ""}` : ""}</p>` : ""}
    ${!tab && tabs.length > 3 ? `<p class="hint">Somando todas as abas: o mesmo lead pode aparecer em mais de uma. Para contar sem repetição, escolha a aba da plataforma.</p>` : ""}
    <div class="lkpis">
      ${kpi("Leads", leads.length)}
      ${has("mql") ? kpi("MQL (qualificados)", n("mql", "sim"), "good") + kpi("Ag. qualificação", n("mql", "aguardando"), n("mql", "aguardando") ? "warn" : "") + kpi("Não qualificados", n("mql", "nao")) : ""}
      ${has("meeting") || showSql ? kpi(showSql ? "Reuniões / SQL" : "Reuniões", meet, meet ? "good" : "") : ""}
      ${showSale ? kpi("Vendas", sales.length, sales.length ? "good" : "", "Coluna de venda, valor aprovado ou 'contrato fechado' nas observações") : ""}
      ${saleSum > 0 ? kpi("Valor fechado", E.fmt(saleSum, "money"), "good") : ""}
      ${has("mql") ? kpi("Sem preenchimento", noFill, noFill ? "warn" : "", "Leads em que o cliente ainda não marcou se é qualificado") : ""}
    </div>
    ${leads.length ? `<div class="ltable-wrap"><table class="ltable"><thead><tr><th>Data</th><th>Lead</th>${showCompany ? "<th>Empresa</th>" : ""}<th>Origem</th>${showIcp ? "<th>Perfil</th>" : ""}<th>MQL</th><th>${showSql ? "Reunião / SQL" : "Reunião"}</th>${showSale ? "<th>Venda</th>" : ""}<th>Status</th><th>Observações</th></tr></thead><tbody>
      ${shown.map((l) => { const meetV = l.meeting === "sim" || l.sql === "sim" ? "sim" : (l.meeting || l.sql); const obs = [l.notes, l.lost ? `Perda: ${l.lost}` : ""].filter(Boolean).join(" · ");
        return `<tr><td class="ld-d">${br(l.date)}</td><td class="ld-n"><b>${esc(l.name || "—")}</b>${l.role ? `<small class="${l.roleOut ? "role-out" : ""}" ${l.roleOut ? 'title="Cargo marcado em vermelho na planilha: fora do perfil"' : ""}>${esc(l.role)}</small>` : ""}</td>${showCompany ? `<td>${esc(l.company || "—")}</td>` : ""}
        <td class="ld-o"><span>${esc(l.campaign || l.creative || "—")}</span>${l.campaign && l.creative ? `<small>${esc(l.creative)}</small>` : ""}${!tab ? `<small class="ld-tab">${esc(l.tab)}</small>` : ""}</td>
        ${showIcp ? `<td>${yn(l.icp, { sim: "Dentro", nao: "Fora" })}</td>` : ""}<td>${mqlChip(l)}</td><td>${yn(meetV)}</td>${showSale ? `<td>${l.sale === "sim" ? `<span class="yn sale" title="${l.saleSrc === "obs" ? "Detectado nas observações" : "Coluna de venda"}">Venda${l.saleValue ? ` · ${esc(E.fmt(l.saleValue, "money"))}` : ""}</span>` : `<span class="yn empty">—</span>`}</td>` : ""}<td class="ld-s">${esc(l.status || "—")}</td><td class="ld-obs" title="${esc(obs)}">${obs ? esc(obs) : "—"}</td></tr>`; }).join("")}
    </tbody></table></div>${leads.length > shown.length ? `<button class="linkish more-l" data-act="leads-all">Mostrar todos os ${leads.length} leads</button>` : ""}`
    : `<p class="hint">Nenhum lead ${tab ? "nesta aba " : ""}entre ${br(r.start)} e ${br(r.end)}.${(() => { const last = (tab ? [tab] : tabs).map((t) => t.lastDate).filter(Boolean).sort().pop(); return last ? ` O último lead registrado ${tab ? "nesta aba" : "na planilha"} é de <b>${new Date(last + "T12:00:00").toLocaleDateString("pt-BR")}</b>${last < r.start ? ": a planilha pode estar desatualizada." : "."}` : ""; })()}</p>`}
  </section>`;
}

/* ---------------- feito na semana (Trello) ---------------- */
const TL = { yellow: "#E2B203", red: "#E5484D", blue: "#5B8BFF", green: "#3DD68C", purple: "#A78BFA", orange: "#F5873B", sky: "#38BDF8", lime: "#A3E635", pink: "#F472B6", black: "#A7B0C0", "": "#A7B0C0" };
const fmtD = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "");
function doneHTML(c) {
  const d = st.done[c.key];
  if (!d || d.skip) return "";
  if (d.loading) return `<section class="done"><div class="done-head"><div><h2>Feito na semana</h2><p class="sub"><span class="spin"></span> Lendo o Trello…</p></div></div></section>`;
  if (!d.ok) return `<section class="done"><div class="done-head"><div><h2>Feito na semana</h2><p class="sub">${esc(d.reason || "")}</p></div></div></section>`;
  const cards = [...d.cards].sort((a, b) => (b.due || b.last || "").localeCompare(a.due || a.last || ""));
  const groups = {};
  cards.forEach((k) => { const l = k.labels[0]; const key = l ? (l.name || l.color || "Geral") : "Geral"; (groups[key] = groups[key] || { color: l ? l.color : "", items: [] }).items.push(k); });
  const names = Object.keys(groups).sort((a, b) => (a === "Geral") - (b === "Geral") || a.localeCompare(b, "pt-BR"));
  const row = (k) => {
    const open = st.doneOpen.has(k.id); const ck = k.items.length ? `${k.items.filter((i) => i.done).length}/${k.items.length}` : "";
    const hasMore = !!k.desc.trim() || k.items.length || (k.comments || []).length;
    return `<div class="drow ${open ? "open" : ""}">
      <div class="drow-main">
        <span class="dstate ${k.done ? "ok" : ""}" title="${k.done ? "Concluído no Trello" : "Sem marcação de concluído"}">${k.done ? icon("check") : ""}</span>
        <button class="dtitle" ${hasMore ? `data-act="done-toggle" data-id="${esc(k.id)}"` : "disabled"} title="${hasMore ? "Ver detalhes" : ""}">${esc(k.name)}</button>
        <span class="dmeta">${commentBadge(k)}${ck ? `<span class="dchk">${icon("check")}${ck}</span>` : ""}<span class="ddate">${fmtD(k.due || k.last)}</span>
        <a class="dlink" href="${esc(k.url)}" target="_blank" title="Abrir o card no Trello" aria-label="Abrir o card no Trello">${icon("ext")}</a></span>
      </div>
      ${open ? `<div class="drow-more">${k.desc.trim() ? `<div class="dmd">${md(k.desc)}</div>` : ""}${k.items.length ? `<ul class="ditems">${k.items.map((i) => `<li class="${i.done ? "done" : ""}">${i.done ? icon("check") : `<i></i>`}${esc(i.name)}</li>`).join("")}</ul>` : ""}${commentsHTML(k.comments)}</div>` : ""}
    </div>`;
  };
  return `<section class="done">
    <div class="done-head">
      <div><h2>Feito na semana</h2><p class="sub">${cards.length} entrega${cards.length === 1 ? "" : "s"} registrada${cards.length === 1 ? "" : "s"} no Trello · lista "${esc(d.listName)}"</p></div>
      <a class="btn ghost sm internal-btn" href="${esc(d.listUrl)}" target="_blank">${icon("trello")}Abrir board</a>
    </div>
    <div class="dgroups">${names.map((n) => `<div class="dgroup"><h3><i style="background:${TL[groups[n].color] || TL[""]}"></i>${esc(n)}<span>${groups[n].items.length}</span></h3>${groups[n].items.map(row).join("")}</div>`).join("") || `<p class="hint">Nenhum card nesta lista.</p>`}</div>
  </section>`;
}
/* ---------------- em aprovação (Trello) ---------------- */
const daysAgo = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso)) / 864e5)) : null);
const commentBadge = (k) => ((k.comments || []).length ? `<span class="dcom" title="${k.comments.length} comentário${k.comments.length === 1 ? "" : "s"} no card">${icon("chat")}${k.comments.length}</span>` : "");
function commentsHTML(list) {
  if (!list || !list.length) return "";
  return `<div class="dcomments"><h5>Comentários</h5>${list.map((m) => `<div class="dcm"><div class="dcm-h"><b>${esc(m.who)}</b><span>${fmtD(m.date)}</span></div><div class="dmd">${md(m.text)}</div></div>`).join("")}</div>`;
}
function apprHTML(c) {
  const d = st.appr[c.key];
  if (!d || d.skip) return "";
  const head = (sub, extra = "") => `<div class="done-head"><div><h2>Em aprovação</h2><p class="sub">${sub}</p></div>${extra}</div>`;
  if (d.loading) return `<section class="done appr">${head(`<span class="spin"></span> Lendo o Trello…`)}</section>`;
  if (!d.ok) return `<section class="done appr">${head(esc(d.reason || ""))}</section>`;
  const all = d.lists.flatMap((l) => l.cards);
  const nCom = all.reduce((a, k) => a + k.comments.length, 0);
  const row = (k) => {
    const open = st.doneOpen.has(k.id);
    const dd = daysAgo(k.since || k.last);
    const wait = dd == null ? "" : k.since ? (dd === 0 ? "entrou hoje" : `há ${dd} dia${dd === 1 ? "" : "s"}`) : `sem mexer há ${dd} dia${dd === 1 ? "" : "s"}`;
    const late = k.since && dd >= 5;
    const lab = k.labels[0];
    const last = k.comments[0];
    const hasMore = !!k.desc.trim() || k.items.length || k.comments.length;
    return `<div class="drow ${open ? "open" : ""}">
      <div class="drow-main">
        <span class="dstate dot" style="--c:${TL[lab ? lab.color : ""] || TL[""]}" title="${esc(lab ? lab.name || lab.color : "Sem etiqueta")}"></span>
        <button class="dtitle" ${hasMore ? `data-act="done-toggle" data-id="${esc(k.id)}"` : "disabled"} title="${hasMore ? "Ver detalhes e comentários" : ""}">${esc(k.name)}</button>
        <span class="dmeta">${commentBadge(k)}<span class="dwait ${late ? "late" : ""}" title="${k.since ? "Na aprovação desde " + fmtD(k.since) : "Última atividade em " + fmtD(k.last)}">${wait}</span>
        <a class="dlink" href="${esc(k.url)}" target="_blank" title="Abrir o card no Trello" aria-label="Abrir o card no Trello">${icon("ext")}</a></span>
      </div>
      ${last && !open ? `<button class="dlast" data-act="done-toggle" data-id="${esc(k.id)}"><b>${esc(last.who)}</b> · ${fmtD(last.date)} — ${esc(last.text.replace(/\s+/g, " ").slice(0, 170))}${last.text.length > 170 ? "…" : ""}${k.comments.length > 1 ? ` <span>+${k.comments.length - 1}</span>` : ""}</button>` : ""}
      ${open ? `<div class="drow-more">${k.desc.trim() ? `<div class="dmd">${md(k.desc)}</div>` : ""}${k.items.length ? `<ul class="ditems">${k.items.map((i) => `<li class="${i.done ? "done" : ""}">${i.done ? icon("check") : `<i></i>`}${esc(i.name)}</li>`).join("")}</ul>` : ""}${commentsHTML(k.comments)}</div>` : ""}
    </div>`;
  };
  const sub = `${all.length} card${all.length === 1 ? "" : "s"} aguardando aprovação${nCom ? ` · ${nCom} comentário${nCom === 1 ? "" : "s"}` : ""}`;
  return `<section class="done appr">
    ${head(sub, `<a class="btn ghost sm internal-btn" href="${esc(d.boardUrl)}" target="_blank">${icon("trello")}Abrir board</a>`)}
    ${all.length ? `<div class="dgroups">${d.lists.filter((l) => l.cards.length).map((l) => `<div class="dgroup"><h3><i style="background:var(--amber, #E2B203)"></i>${esc(l.name)}<span>${l.cards.length}</span></h3>${[...l.cards].sort((a, b) => (a.since || a.last || "").localeCompare(b.since || b.last || "")).map(row).join("")}</div>`).join("")}</div>` : `<p class="hint">Nada aguardando aprovação agora.</p>`}
  </section>`;
}
function md(src) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_, a, __, b) => `<span class="wl">${b || a}</span>`).replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/_(.+?)_/g, "<i>$1</i>");
  const lines = String(src).split("\n"); let out = "", i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
      const body = rows.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      out += `<div class="mdt"><table><thead><tr>${cells(body[0]).map((x) => `<th>${inline(x)}</th>`).join("")}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((x) => `<td>${inline(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      continue;
    }
    if (/^\s*[-*] /.test(l)) { let li = ""; while (i < lines.length && /^\s*[-*] /.test(lines[i])) li += `<li>${inline(lines[i++].replace(/^\s*[-*] /, ""))}</li>`; out += `<ul>${li}</ul>`; continue; }
    if (/^#{3,4} /.test(l)) { out += `<h4>${inline(l.replace(/^#+ /, ""))}</h4>`; i++; continue; }
    if (/^---/.test(l) || !l.trim()) { i++; continue; }
    out += `<p>${inline(l.replace(/^> ?/, ""))}</p>`; i++;
  }
  return out;
}
// frentes da leitura estratégica indexadas por campanha e por público (conjunto), sem repetir a mesma frente
function frontsIndex() {
  const s = st.strat[st.cur]; const ai = s && (s.ai || s.aiPrev); const byCamp = {}, bySet = {};
  const seen = new Set();
  (ai && ai.frentes || []).forEach((f, i) => {
    const k = (f.gargalo || "").toLowerCase().replace(/[^a-z0-9à-ú]+/g, " ").trim().slice(0, 60);
    if (seen.has(k)) return; seen.add(k);
    (f.campanhas || []).forEach((n) => (byCamp[n] = byCamp[n] || []).push({ ...f, i }));
    (f.conjuntos || []).forEach((n) => (bySet[n] = bySet[n] || []).push({ ...f, i }));
  });
  return { byCamp, bySet };
}
function frontsFor(cp) {
  const ix = frontsIndex(); const setNames = new Set((cp.sets || []).map((s) => s.name));
  const camp = (ix.byCamp[cp.name] || []).filter((f) => !(f.conjuntos || []).some((n) => setNames.has(n)));
  const sets = {}; (cp.sets || []).forEach((s) => { if (ix.bySet[s.name]) sets[s.id] = ix.bySet[s.name]; });
  const total = new Set([...camp, ...Object.values(sets).flat()].map((f) => f.i)).size;
  return { camp, sets, total };
}
function frontsChip(list) {
  if (!list || !list.length) return "";
  const st0 = list.some((f) => f.status === "testando") ? "testando" : list[0].status;
  return `<span class="tests"><span class="test-chip st-${esc(st0)}" title="${esc(list.map((f) => f.gargalo).join(" · "))}">${icon("flask")}${list.length} frente${list.length > 1 ? "s" : ""} em andamento</span></span>`;
}
function frontsBlock(list, lvl) {
  if (!list || !list.length) return "";
  return `<div class="fblock ${lvl}">${list.map((f) => `
    <div class="fcard st-${esc(f.status)}">
      <div class="f-meta"><span class="pill st-${esc(f.status)}">${STATUS[f.status] || esc(f.status)}</span><span class="f-plat">${frontMeta(f)}</span></div>
      <div class="f-chain">
        <div><label>Gargalo</label><p>${esc(f.gargalo)}</p></div>
        <div><label>Hipótese</label><p>${esc(f.hipotese)}</p></div>
        <div><label>Solução</label><p>${esc(f.solucao)}</p></div>
      </div>
      ${fTimeline(f)}
      ${f.evidencia ? `<p class="f-ev">${esc(f.evidencia)}</p>` : ""}
    </div>`).join("")}</div>`;
}

/* ---------------- plataforma ---------------- */
function platformHTML(c, p) {
  if (p === "organico") return organicHTML(c);
  const k = dkey(p); const d = st.data[k];
  if (!(c[p] || []).length) return emptyPlat(p);
  if (!d) return skeleton();
  const notes = (d.notes || []).map((n) => `<div class="note">${icon("alert")}<span>${esc(n)}</span></div>`).join("");
  if (!d.accounts.length) return notes + (st.loading[k] ? skeleton() : `<div class="empty"><p>Nada ativo em ${PLAT[p].short} neste período.</p></div>`);
  return notes + d.accounts.map((a, ai) => accountHTML(p, a, ai)).join("");
}
/* ---------------- orgânico (Reportei) ---------------- */
const ORG_ICON = { instagram_business: "image", facebook: "msg", linkedin: "layers", google_analytics_4: "search" };
function orgTabHTML(c) {
  const p = "organico"; const k = dkey(p); const d = st.data[k]; const has = hasPlat(c, p);
  const nets = (d && d.networks) || [];
  const fol = nets.reduce((n, x) => n + ((x.kpis.find((y) => y.id === "followers") || {}).value || 0), 0);
  const flag = !has || (d && !nets.length && !st.loading[k]) ? `<em class="pt-none">sem redes</em>` : st.loading[k] && !d ? `<span class="spin"></span>`
    : d ? `<span class="pt-val">${fol ? E.fmt(fol, "int") : nets.length}</span><span class="pt-sub">${fol ? "seguidores · " : ""}${nets.length} rede${nets.length === 1 ? "" : "s"}</span>` : "";
  return `<button role="tab" class="ptab pt-${p}" aria-selected="${st.platform === p}" data-plat="${p}" ${has ? "" : "data-empty"}><span class="pt-name"><i class="pd pd-${p} on"></i>${PLAT[p].short}</span>${flag}</button>`;
}
function deltaHTML(k) {
  if (!st.compare) return "";
  if (k.prev == null || k.stock && k.id === "followers") {
    return k.stock && k.prev != null && k.prev !== k.value ? `<span class="od ${k.value >= k.prev ? "up" : "down"}">${k.value >= k.prev ? "+" : ""}${E.fmt(k.value - k.prev, "int")}</span>` : "";
  }
  if (k.fmt === "pct") { const df = k.value - k.prev; if (Math.abs(df) < 0.01) return `<span class="od">=</span>`; return `<span class="od ${df > 0 ? "up" : "down"}">${df > 0 ? "+" : ""}${E.fmt(df, "dec")} p.p.</span>`; }
  if (k.id === "newFollowers" || k.prev <= 0) { const df = k.value - k.prev; return df ? `<span class="od ${df > 0 ? "up" : "down"}">${df > 0 ? "+" : ""}${E.fmt(df, "int")} vs anterior</span>` : `<span class="od">=</span>`; }
  const r = (k.value - k.prev) / k.prev * 100; if (Math.abs(r) < 0.5) return `<span class="od">=</span>`;
  return `<span class="od ${r > 0 ? "up" : "down"}">${r > 0 ? "+" : ""}${E.fmt(r, "dec1")}%</span>`;
}
function sparkHTML(arr) {
  if (!arr || arr.length < 4) return "";
  const W = 220, H = 44, mx = Math.max(1, ...arr); const step = W / (arr.length - 1);
  const pts = arr.map((v, i) => `${(i * step).toFixed(1)},${(H - 3 - (v / mx) * (H - 8)).toFixed(1)}`).join(" ");
  return `<svg class="ospark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,${H} ${pts} ${W},${H}" class="a"/><polyline points="${pts}" class="l"/></svg>`;
}
const brDate = (d) => { if (!d) return ""; const x = new Date(String(d).length <= 10 ? d + "T12:00:00" : d); return isNaN(x) ? "" : x.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
const TYPE_PT = { reel: "Reels", reels: "Reels", Carousel: "Carrossel", CAROUSEL_ALBUM: "Carrossel", Image: "Imagem", IMAGE: "Imagem", Video: "Vídeo", VIDEO: "Vídeo", Reel: "Reels", REELS: "Reels", album: "Álbum", photo: "Foto", video: "Vídeo", status: "Texto", link: "Link" };
function orgPostHTML(n, x, i) {
  const big = x.reach != null ? ["Alcance", x.reach] : ["Impressões", x.impressions];
  const sec = x.views != null ? ["Visualiz.", x.views] : x.impressions != null && big[0] !== "Impressões" ? ["Impr.", x.impressions] : x.clicks != null ? ["Cliques", x.clicks] : null;
  const stats = [["Interações", E.fmt(x.interactions || 0, "int")], sec ? [sec[0], E.fmt(sec[1] || 0, "int")] : null, x.rate != null ? ["Taxa", E.fmt(x.rate, "dec1") + "%"] : null].filter(Boolean);
  const extra = [x.likes != null ? `Curtidas: ${x.likes}` : "", x.comments != null ? `Comentários: ${x.comments}` : "", x.shares != null ? `Compartilhamentos: ${x.shares}` : "", x.saved != null ? `Salvos: ${x.saved}` : ""].filter(Boolean).join(" · ");
  const tag = `<${x.url ? `a href="${esc(x.url)}" target="_blank" rel="noreferrer"` : "div"} class="opost" style="--i:${Math.min(i, 10)}" title="${esc(extra)}">`;
  return `${tag}
    <span class="op-thumb ${x.image ? "" : "noimg"}">${x.image ? `<img src="${esc(x.image)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('noimg');this.remove()"/>` : ""}<span class="op-txt">${esc((x.text || "").slice(0, 140))}</span>
      ${x.type ? `<span class="badge">${esc(TYPE_PT[x.type] || x.type)}</span>` : ""}${x.date ? `<span class="badge op-date">${esc(brDate(x.date))}</span>` : ""}</span>
    <span class="op-big"><i>${big[0]}</i><b>${E.fmt(big[1] || 0, "int")}</b></span>
    <span class="op-m" style="--n:${stats.length}">${stats.map(([l, v]) => `<span><i>${l}</i><b>${v}</b></span>`).join("")}</span>
  </${x.url ? "a" : "div"}>`;
}
function organicHTML(c) {
  const p = "organico"; const k = dkey(p); const d = st.data[k];
  if (!hasPlat(c, p)) return `<div class="empty"><h3>Sem redes orgânicas neste cliente</h3><p>Conecte o Instagram, o Facebook, o LinkedIn (página) ou o GA4 do cliente no projeto dele no Reportei. A aba passa a mostrar os números na próxima atualização.</p></div>`;
  if (!d) return skeleton();
  const notes = (d.notes || []).map((n) => `<div class="note">${icon("alert")}<span>${esc(n)}</span></div>`).join("");
  if (!(d.networks || []).length) return notes + (st.loading[k] ? skeleton() : `<div class="empty"><h3>Sem redes orgânicas neste cliente</h3><p>O projeto do Reportei deste cliente só tem contas de anúncio. Para ver o orgânico, conecte o Instagram, o Facebook, o LinkedIn (página) ou o GA4 lá no Reportei e clique em atualizar.</p></div>`);
  return notes + `<p class="hint org-hint">${st.compare ? "Números do período escolhido, comparados com o período anterior de mesmo tamanho." : "Números do período escolhido. Ligue \"Comparar\" para ver a variação contra o período anterior."} Fonte: Reportei.</p>` + d.networks.map((n) => {
    const oid = `org-${n.slug}`;
    const posts = n.posts || [];
    const showAll = st.orgAll && st.orgAll[oid];
    const list = showAll ? posts : posts.slice(0, 8);
    return `<section class="onet on-${esc(n.slug)}">
      <header class="on-h"><span class="on-ic">${icon(ORG_ICON[n.slug] || "layers")}</span><span><b>${esc(n.label)}</b><small>${esc(n.name || "")}</small></span>
        ${n.trend ? `<span class="on-tr"><i>Alcance por dia</i>${sparkHTML(n.trend)}</span>` : ""}</header>
      <div class="okpis">${n.kpis.map((x) => `<div class="okpi"><i>${esc(x.label)}</i><b>${x.fmt === "pct" ? E.fmt(x.value, "pct") : E.fmt(x.value, "int")}</b>${deltaHTML(x)}</div>`).join("")}</div>
      ${posts.length ? `<div class="oposts-h"><b>Posts do período</b><span>${posts.length} post${posts.length === 1 ? "" : "s"} · do maior para o menor alcance</span></div>
        <div class="oposts">${list.map((x, i) => orgPostHTML(n, x, i)).join("")}</div>
        ${posts.length > 8 ? `<button class="btn ghost sm" data-act="org-all" data-id="${esc(oid)}">${showAll ? "Mostrar menos" : `Ver todos os ${posts.length}`}</button>` : ""}` : n.posts ? `<p class="hint">Nenhum post publicado no período.</p>` : ""}
      ${n.channels && n.channels.length ? `<div class="oposts-h"><b>De onde vêm as visitas</b><span>sessões por canal no período</span></div>
        <div class="kw-scroll"><table class="kw och"><thead><tr><th>Canal</th><th>Sessões</th><th>Usuários</th><th>Engajadas</th><th>Tx. engaj.</th><th>Eventos-chave</th></tr></thead><tbody>
        ${n.channels.map((r) => `<tr class="${r.organic ? "org" : ""}"><td class="kw-t">${esc(r.name)}${r.organic ? ` <span class="kw-m m-EXACT">orgânico</span>` : ""}</td><td>${E.fmt(r.sessions, "int")}</td><td>${E.fmt(r.users, "int")}</td><td>${E.fmt(r.engaged, "int")}</td><td>${E.fmt(r.engagementRate, "pct")}</td><td>${E.fmt(r.keyEvents, "int")}</td></tr>`).join("")}
        </tbody></table></div>` : ""}
    </section>`;
  }).join("");
}
function emptyPlat(p) {
  return `<div class="empty"><h3>Nenhuma conta de ${PLAT[p].short} neste cliente</h3><p>Se o cliente anuncia em ${PLAT[p].short}, conecte a conta no projeto dele no Reportei ou informe o ID da conta em Configurações → Clientes.</p><button class="btn ghost" data-act="settings">Abrir configurações</button></div>`;
}
const skeleton = () => `<div class="skel">${'<div class="sk-row"></div>'.repeat(5)}</div>`;

// seção de campanhas de engajamento: resumo + tabela com as métricas de engajamento (sem gargalo de leads)
function engageSection(p, a, camps, mixed) {
  const real = camps.filter((c) => c.id !== "rp-sem" && c.id !== "rp-ads");
  const agg = sumM((real.length ? real : camps).map((c) => c.metrics));
  a._engAgg = agg;
  const cols = E.columnsEngage(p, agg);
  return `<h4 class="grp">Campanhas de engajamento <span>alcance, interações e vídeo</span></h4>
    ${funnelHTML({ kind: "none", steps: E.funnelEngage(p, agg) })}
    <div class="ctable eng" style="--cols:${cols.length}">
      <div class="crow chead"><span class="c-name">Campanha</span>${cols.map((col) => `<span class="num">${col.label}</span>`).join("")}</div>
      ${camps.map((cp) => campRowHTML(p, a, cp, cols, true)).join("")}
    </div>`;
}
function accountHTML(p, a, ai) {
  const engCamps = a.campaigns.filter(isEng), resCamps = a.campaigns.filter((c) => !isEng(c));
  const mixed = engCamps.length > 0 && resCamps.length > 0;
  // com campanhas de engajamento na conta, o funil de leads usa só as campanhas de resultado
  const tot = mixed ? sumM(realCamps(a).filter((c) => !isEng(c)).map((c) => c.metrics)) : accountTotals(p, a);
  const anyMsg = p === "linkedin" && (resCamps.some((c) => c.metrics && c.metrics.sends) || (!mixed && a.totals && a.totals.sends));
  const ctx = acctCtx(p, { ...a, campaigns: resCamps.length ? resCamps : a.campaigns });
  const dg = E.diagnose(p, tot, ctx); dg.mixed = ctx.mixed;
  const pa = (prevIdx(p) || {})["a:" + a.accountId];
  if (pa) { const ptot = mixed ? sumM(realCamps(pa).filter((c) => !isEng(c)).map((c) => c.metrics)) : accountTotals(p, pa); const pd = E.diagnose(p, ptot, acctCtx(p, pa)); dg.prev = pd; }
  const cols = E.columns(p, { messages: anyMsg });
  return `<article class="acct">
    <div class="acct-head">
      <div><h3>${esc(a.accountName)}</h3><span class="src src-${a.source}">${a.source === "api" ? "Direto da plataforma" : "Via Reportei"}</span>${a.idle ? `<span class="muted"> · ${a.idle} ${a.idleLabel || "campanha"}${a.idle > 1 ? "s" : ""} sem entrega no período</span>` : ""}</div>
    </div>
    ${resCamps.length ? `${mixed ? `<h4 class="grp">Campanhas de resultado <span>leads, vendas e tráfego</span></h4>` : ""}${funnelHTML(dg)}
    <div class="ctable" style="--cols:${cols.length}">
      <div class="crow chead"><span class="c-name">Campanha</span>${cols.map((col) => `<span class="num">${col.label}</span>`).join("")}<span class="c-diag">Gargalo</span></div>
      ${resCamps.map((cp) => campRowHTML(p, a, cp, cols)).join("")}
    </div>` : ""}
    ${engCamps.length ? engageSection(p, a, engCamps, mixed) : ""}
    ${(a.messages || []).length ? `<div class="msgs"><h4>${icon("msg")}Mensagens patrocinadas</h4>${a.messages.map((m) => `<div class="msg-row"><span>${esc(m.name)}</span><span class="num">${E.fmt(m.metrics.sends, "int")} envios</span><span class="num">${E.fmt(E.pct(m.metrics.opens, m.metrics.sends), "pct")} abertura</span><span class="num">${E.fmt(E.pct(m.metrics.actionClicks, m.metrics.opens), "pct")} cliques</span></div>`).join("")}</div>` : ""}
  </article>`;
}
function funnelHTML(dg) {
  if (!dg || !dg.steps.length) return "";
  const g = dg.kind === "bad" ? dg.step : null;
  return `<div class="funnel">${dg.steps.map((s, i) => {
    const r = s.rate; const isG = g === s.label;
    const rateState = r && r.bench != null && r.value != null ? (r.min && (r.base || 0) < r.min ? "low" : r.value >= r.bench ? "good" : "bad") : "neutral";
    return `${i ? `<div class="f-link ${rateState} ${isG ? "is-g" : ""}">${r ? `<b>${E.fmt(r.value, "pct")}</b><span>${esc(r.label)}${r.bench != null ? ` · meta ${E.fmt(r.bench, "pct").replace(",00", "")}` : ""}</span>${r.note ? `<i>${dg.mixed && r.label === "Tx. preench." ? "maioria " : ""}${esc(r.note)}</i>` : ""}` : ""}</div>` : ""}
      <div class="f-step ${isG ? "is-g" : ""}"><span>${esc(s.label)}</span><b>${E.fmt(s.value, s.money ? "money" : "int")}</b>${dg.prev ? chg(s.value, ((dg.prev.steps || []).find((x) => x.label === s.label) || {}).value, { fmt: "int" }, { neutral: !!s.money }) : ""}${isG ? `<em>Gargalo</em>` : ""}</div>`;
  }).join("")}</div>`;
}
function diagPill(p, m, ctx) {
  if (!m) return `<span class="dg dg-none">—</span>`;
  const d = E.diagnose(p, m, ctx);
  if (d.kind === "bad") return `<span class="dg dg-bad" title="${esc(d.rate)} ${E.fmt(d.value, "pct")} · benchmark ${E.fmt(d.bench, "pct")}">${esc(d.rate)}</span>`;
  if (d.kind === "ok") return `<span class="dg dg-ok">${icon("check")}No benchmark</span>`;
  if (d.kind === "low") return `<span class="dg dg-low">Pouco volume</span>`;
  return `<span class="dg dg-none">—</span>`;
}
function cells(cols, m, row, cur, pm) {
  return cols.map((col) => {
    const v = m ? (col.get ? col.get(m, row) : m[col.k]) : null;
    const pv = pm ? (col.get ? col.get(pm, row) : pm[col.k]) : null;
    const bench = typeof col.bench === "function" ? col.bench(row) : col.bench;
    const benchOn = bench != null && v != null && (!col.searchOnly || !row.channel || row.channel === "SEARCH");
    const cls = benchOn ? (v >= bench ? "good" : "bad") : "";
    return `<span class="num ${cls}">${E.fmt(v, col.fmt, cur)}${pm ? chg(v, pv, col) : ""}</span>`;
  }).join("");
}
function subtitle(p, cp) {
  const bits = [];
  if (p === "meta" && cp.objective) bits.push(E.OBJ[cp.objective] || cp.objective);
  if (p === "meta" && /LEAD/.test(cp.objective || "") && formLabel(cp)) bits.push(formLabel(cp));
  if (p === "google" && cp.channel) bits.push(E.CHANNEL[cp.channel] || cp.channel);
  if (cp.budget) bits.push(cp.budget.daily ? `${E.fmt(cp.budget.daily, "money")}/dia` : `${E.fmt(cp.budget.lifetime, "money")} total`);
  const nSets = (cp.sets || []).length; const nAds = (cp.sets || []).reduce((n, s) => n + (s.ads || []).length, 0);
  if (nSets && !(p === "linkedin" && cp.id === "rp-sem")) bits.push(p === "linkedin" ? `${nSets} público${nSets > 1 ? "s" : ""}` : `${nSets} ${p === "google" ? (cp.channel === "PERFORMANCE_MAX" ? "grupo(s) de recursos" : "grupo(s)") : "conjunto(s)"}`);
  if (nAds) bits.push(`${nAds} anúncio${nAds > 1 ? "s" : ""}`);
  return bits.join(" · ");
}
function campRowHTML(p, a, cp, cols, eng) {
  const fr = frontsFor(cp);
  const ctx = { objective: cp.objective, channel: cp.channel, formType: cp.formType };
  const expandable = (cp.sets || []).length || fr.total > 0;
  const id = `c-${p}-${cp.id}`;
  return `<div class="cgroup" data-gid="${esc(id)}">
    <div class="crow camp ${expandable ? "can" : ""}" ${expandable ? `data-toggle="${esc(id)}" tabindex="0" role="button" aria-expanded="false"` : ""}>
      <span class="c-name">${expandable ? icon("chev", "chev") : `<span class="chev-sp"></span>`}<span class="status-dot ${cp.status === "ACTIVE" || cp.status === "ENABLED" ? "on" : ""}"></span>
        <span class="nm"><b title="${esc(cp.name)}">${esc(cp.name)}</b><small>${esc(subtitle(p, cp))}</small>
        ${fr.total ? frontsChip([...fr.camp, ...Object.values(fr.sets).flat()].filter((f, i, arr) => arr.findIndex((x) => x.i === f.i) === i)) : ""}</span>
      </span>
      ${cells(cols, cp.metrics, cp, a.currency, (prevIdx(p) || {})["c:" + cp.id] || (st.compare && prevIdx(p) ? {} : null))}
      ${eng ? "" : `<span class="c-diag">${diagPill(p, cp.metrics, ctx)}</span>`}
    </div>
    <div class="expand" id="${esc(id)}"><div class="expand-in"></div></div>
  </div>`;
}
function setsHTML(p, a, cp, cols, eng) {
  const fr = frontsFor(cp);
  const head = frontsBlock(fr.camp, "lvl-c");
  const liHint = p === "linkedin" && cp.guessedGroup ? `<p class="hint">Públicos ligados à campanha pelo nome e pelo investimento (o Reportei não informa o vínculo).</p>` : "";
  return `<div class="sets">${head}${liHint}${(cp.sets || []).map((s) => {
    const id = `s-${p}-${s.id}`;
    const ctx = { objective: cp.objective, channel: cp.channel, formType: s.formType || cp.formType };
    return `<div class="cgroup set" data-gid="${esc(id)}">
      <div class="crow setrow can" data-toggle="${esc(id)}" tabindex="0" role="button" aria-expanded="false">
        <span class="c-name">${icon("chev", "chev")}<span class="nm"><b title="${esc(s.name)}">${esc(s.name)}</b><small>${esc(setSub(p, s))}</small>${frontsChip(fr.sets[s.id])}</span></span>
        ${cells(cols, s.metrics, { ...s, objective: cp.objective, channel: cp.channel }, a.currency, (prevIdx(p) || {})["s:" + s.id] || (st.compare && prevIdx(p) ? {} : null))}
        ${eng ? "" : `<span class="c-diag">${diagPill(p, s.metrics, ctx)}</span>`}
      </div>
      <div class="expand" id="${esc(id)}"><div class="expand-in"></div></div>
    </div>`;
  }).join("") || `<p class="hint">Sem conjuntos ativos.</p>`}</div>`;
}
function setSub(p, s) {
  const b = [];
  if (s.budget) b.push(s.budget.daily ? `${E.fmt(s.budget.daily, "money")}/dia` : `${E.fmt(s.budget.lifetime, "money")} total`);
  if (p === "meta" && s.status && !/ACTIVE|WITH_ISSUES|IN_PROCESS|PENDING/.test(s.status)) b.unshift("Pausado (teve entrega no período)");
  if (p === "meta" && s.formType) b.push(s.formType === "native" ? "Formulário nativo (meta 40%)" : "Site/LP (meta 10%)");
  if (p === "meta" && s.optimization) b.push("Otimiza: " + s.optimization.toLowerCase().replace(/_/g, " "));
  if (p === "google" && s.kind === "assetGroup") b.push("Força do grupo: " + strengthPT(s.strength));
  if (p === "google" && (s.keywords || []).length) b.push(`${s.keywords.length} palavra${s.keywords.length === 1 ? "" : "s"}-chave`);
  b.push(`${(s.ads || []).length} anúncio${(s.ads || []).length === 1 ? "" : "s"}`);
  return b.join(" · ");
}
const strengthPT = (s) => ({ EXCELLENT: "Excelente", GOOD: "Boa", AVERAGE: "Média", POOR: "Fraca", PENDING: "Em análise" }[s] || "—");
function targetingHTML(t) {
  if (!t) return "";
  const chips = [];
  if (t.age) chips.push(["Idade", t.age]);
  if (t.geo && t.geo.length) chips.push(["Local", t.geo.join(", ")]);
  if (t.advantage) chips.push(["Público", "Advantage+ ligado"]);
  (t.audiences || []).forEach((x) => chips.push(["Público", x]));
  (t.excluded || []).forEach((x) => chips.push(["Exclui", x]));
  (t.interests || []).forEach((x) => chips.push(["Interesse", x]));
  if (!chips.length) return "";
  return `<div class="targeting">${chips.map(([k, v]) => `<span class="tchip"><i>${k}</i>${esc(v)}</span>`).join("")}</div>`;
}
const MATCH_PT = { EXACT: "Exata", PHRASE: "Frase", BROAD: "Ampla" };
const kwFmt = (k) => k.match === "EXACT" ? `[${k.text}]` : k.match === "PHRASE" ? `"${k.text}"` : k.text;
function keywordsHTML(s, cur) {
  const kw = (s && s.keywords) || [], neg = (s && s.negatives) || [];
  if (!kw.length && !neg.length) return "";
  const n = (v) => E.fmt(v, "int");
  const rows = kw.map((k) => {
    const m = k.metrics || {}; const ctr = m.impressions ? m.clicks / m.impressions : null; const cpc = m.clicks ? m.spend / m.clicks : null;
    return `<tr class="${m.impressions ? "" : "kw-zero"}"><td class="kw-t" title="${esc(k.text)}">${esc(kwFmt(k))}</td><td><span class="kw-m m-${esc(k.match || "")}">${esc(MATCH_PT[k.match] || k.match || "—")}</span></td>
      <td class="${k.qs != null && k.qs <= 4 ? "kw-bad" : ""}">${k.qs != null ? k.qs + "/10" : "—"}</td><td>${n(m.impressions || 0)}</td><td>${n(m.clicks || 0)}</td>
      <td>${ctr != null ? E.fmt(ctr * 100, "pct") : "—"}</td><td>${cpc != null ? E.fmt(cpc, "money", cur) : "—"}</td><td>${m.conversions ? E.fmt(m.conversions, "dec1") : "0"}</td><td>${E.fmt(m.spend || 0, "money", cur)}</td></tr>`;
  }).join("");
  return `<div class="kwbox">
    <p class="kw-h">${icon("search")}<b>Palavras-chave ativas</b><span>${kw.length} no grupo · métricas do período</span></p>
    ${kw.length ? `<div class="kw-scroll"><table class="kw"><thead><tr><th>Palavra-chave</th><th>Correspondência</th><th>Índice</th><th>Impr.</th><th>Cliques</th><th>CTR</th><th>CPC</th><th>Conv.</th><th>Custo</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}
    ${neg.length ? `<details class="kw-neg"><summary>Negativas do grupo (${E.fmt(neg.length, "int")})</summary><div>${neg.slice(0, 400).map((k) => `<span class="tchip">${esc(kwFmt(k))}</span>`).join("")}${neg.length > 400 ? `<span class="tchip">+${E.fmt(neg.length - 400, "int")}</span>` : ""}</div></details>` : ""}
  </div>`;
}
function creativesHTML(p, a, cp, s, ads) {
  ads = ads || (s && s.ads) || [];
  if (!ads.length) return `<p class="hint">Sem anúncios ${p === "linkedin" ? "com entrega neste público" : `ativos neste ${p === "google" ? "grupo" : "conjunto"}`}.</p>`;
  const liGuess = p === "linkedin" && s && s.guessed ? `<p class="hint">Anúncios ligados ao público pelo nome (o Reportei não informa o vínculo).</p>` : "";
  const sorted = [...ads].sort((x, y) => ((y.metrics || {}).spend || 0) - ((x.metrics || {}).spend || 0));
  return `${liGuess}<div class="cgrid ${p === "google" ? "g-" + (sorted[0].kind || "search") : ""}">${sorted.map((ad, i) => cardHTML(p, a, cp, s, ad, i)).join("")}</div>`;
}
function refOf(p, cp, s, ad) { return `${p}|${cp.id}|${s ? s.id : ""}|${ad.id}`; }
function cardHTML(p, a, cp, s, ad, i) {
  const m = ad.metrics || {}; const ref = refOf(p, cp, s, ad); const cur = a.currency;
  const style = `style="--i:${Math.min(i, 10)}"`;
  if (p === "google" && (ad.kind === "search" || !ad.kind)) {
    const host = ad.finalUrl ? ad.finalUrl.replace(/^https?:\/\//, "").split("/")[0] : "";
    return `<button class="card serp" data-ad="${esc(ref)}" ${style}>
      <span class="serp-ad"><b>Patrocinado</b> · ${esc(host)}${ad.path.length ? " › " + esc(ad.path.join(" › ")) : ""}</span>
      <span class="serp-h">${esc(ad.headlines.slice(0, 3).join(" | "))}</span>
      <span class="serp-d">${esc(ad.descriptions.slice(0, 2).join(" "))}</span>
      <span class="serp-foot"><span class="tag">${ad.headlines.length} títulos · ${ad.descriptions.length} descrições</span>${ad.strength ? `<span class="tag str-${esc(ad.strength)}">${strengthPT(ad.strength)}</span>` : ""}</span>
      ${adMetrics(p, a, cp, s, ad)}
    </button>`;
  }
  const cr = ad.creative || {};
  const img = p === "google" ? (ad.images || [])[0] || (ad.videos && ad.videos[0] ? `https://i.ytimg.com/vi/${ad.videos[0].youtube}/hqdefault.jpg` : null) : cr.thumb || cr.image;
  const type = p === "google" ? (ad.videos && ad.videos.length ? "video" : ad.kind === "pmax" ? "pmax" : "image") : cr.type;
  const badge = type === "video" ? `<span class="badge">${icon("play")}Vídeo</span>` : type === "carousel" ? `<span class="badge">${icon("layers")}Carrossel · ${cr.carousel.length}</span>` : type === "pmax" ? `<span class="badge">${icon("layers")}${(ad.images || []).length} imagens · ${(ad.headlines || []).length} títulos</span>` : "";
  const text = p === "google" ? (ad.headlines || [])[0] : (cr.bodies || [])[0] || (cr.titles || [])[0];
  if (!img && p === "linkedin") {
    return `<button class="card media" data-ad="${esc(ref)}" ${style}><span class="thumb text-thumb"><span class="badge">${icon(type === "message" ? "msg" : "image")}${type === "message" ? "Mensagem" : "Anúncio"}${ad.created ? " · desde " + br(ad.created) : ""}</span><span>${esc(ad.name)}</span></span>${adMetrics(p, a, cp, s, ad)}</button>`;
  }
  const stl = { WITH_ISSUES: "Com alerta", PENDING_REVIEW: "Em análise", IN_PROCESS: "Processando", DISAPPROVED: "Reprovado", PAUSED: "Pausado", ADSET_PAUSED: "Pausado", CAMPAIGN_PAUSED: "Pausado" }[ad.status];
  return `<button class="card media ${img ? "" : "noimg"}" data-ad="${esc(ref)}" ${style}>
    <span class="thumb">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('broken')"/>` : `<span class="ph">${icon(type === "message" ? "msg" : "image")}</span>`}${badge}${stl ? `<span class="badge st-badge" title="Status no Meta: ${esc(ad.status)}">${icon("alert")}${stl}</span>` : ""}${type === "video" ? `<span class="playbtn">${icon("play")}</span>` : ""}</span>
    <span class="c-body"><b title="${esc(ad.name)}">${esc(ad.name)}</b>${text ? `<span class="c-copy">${esc(text)}</span>` : ""}</span>
    ${adMetrics(p, a, cp, s, ad)}
  </button>`;
}
function drDiag(p, m, ctx) {
  if (!m || !(m.spend || m.impressions)) return "";
  const d = E.diagnose(p, m, ctx);
  if (d.kind === "bad") return `<p class="dr-diag bad">${diagPill(p, m, ctx)}<span>${esc(d.rate)} em <b>${E.fmt(d.value, "pct")}</b>, abaixo da meta de ${E.fmt(d.bench, "pct")}. É a primeira etapa do funil abaixo do benchmark.</span></p>`;
  if (d.kind === "ok") return `<p class="dr-diag ok">${diagPill(p, m, ctx)}<span>Todas as taxas do funil estão dentro do benchmark.</span></p>`;
  if (d.kind === "low") return `<p class="dr-diag">${diagPill(p, m, ctx)}<span>Volume ainda baixo para concluir se alguma taxa é gargalo.</span></p>`;
  return "";
}
// métricas do anúncio = as mesmas colunas da análise da campanha (com benchmark) + o gargalo do anúncio
function adCtx(cp, s) { return { objective: cp.objective, channel: cp.channel, formType: (s && s.formType) || cp.formType }; }
function adMetrics(p, a, cp, s, ad) {
  const m = ad.metrics; const cur = a.currency;
  if (!m || !(m.spend || m.impressions || m.sends)) return `<span class="mini ad"><span class="mini-empty">Sem entrega no período</span></span>`;
  const eng = isEng(cp); const ctx = adCtx(cp, s);
  const cols = (eng ? E.columnsEngage(p, a._engAgg) : E.columns(p, {})).filter((c) => c.k !== "impressionShare").slice(0, 8);
  const row = { ...ad, ...ctx };
  const items = cols.map((col) => {
    const v = col.get ? col.get(m, row) : m[col.k];
    const bench = typeof col.bench === "function" ? col.bench(row) : col.bench;
    const on = bench != null && v != null && (!col.searchOnly || !ctx.channel || ctx.channel === "SEARCH");
    return `<span><i>${esc(col.label)}</i><b class="${on ? (v >= bench ? "good" : "bad") : ""}">${E.fmt(v, col.fmt, cur)}</b></span>`;
  }).join("");
  const pill = eng ? "" : diagPill(p, m, ctx);
  return `<span class="mini ad"><span class="mini-head">${pill.includes("dg-bad") ? `<em class="gl">Gargalo</em>` : ""}${pill}</span><span class="mgrid">${items}</span></span>`;
}
function miniMetrics(p, m, cur, cp) {
  if (!m || !Object.keys(m).length) return `<span class="mini"><span><i>Sem dados no período</i></span></span>`;
  let items;
  if (isEng(cp)) {
    const e = p === "google" ? (m.engagements || m.interactions) : m.engagements; const money = (v) => E.fmt(v, "money", cur);
    if (p === "meta") items = [["Invest.", money(m.spend)], ["Engaj.", E.fmt(e, "int")], ["Tx. engaj.", E.fmt(E.pct(e, m.impressions), "pct")], m.thruplay ? ["ThruPlay", E.fmt(m.thruplay, "int")] : ["Custo/engaj.", money(E.div(m.spend, e))]];
    else if (p === "linkedin") items = [["Invest.", money(m.spend)], ["Engaj.", E.fmt(e, "int")], m.videoViews ? ["Views vídeo", E.fmt(m.videoViews, "int")] : ["Cliques", E.fmt(m.clicks, "int")], m.videoViews ? ["Custo/view", money(E.div(m.spend, m.videoViews))] : ["Custo/engaj.", money(E.div(m.spend, e))]];
    else items = [["Invest.", money(m.spend)], m.videoViews ? ["Views", E.fmt(m.videoViews, "int")] : ["Interações", E.fmt(e, "int")], m.videoViews ? ["CPV", money(E.div(m.spend, m.videoViews))] : ["Custo/engaj.", money(E.div(m.spend, e))], ["Tx. engaj.", E.fmt(E.pct(e, m.impressions), "pct")]];
  }
  else if (p === "meta") { const r = E.metaResult(m, cp.objective); items = [["Invest.", E.fmt(m.spend, "money", cur)], ["CTR", E.fmt(E.pct(m.linkClicks, m.impressions), "pct"), E.pct(m.linkClicks, m.impressions) >= 1], [r.label, E.fmt(r.value, "int")], ["Custo", E.fmt(E.div(m.spend, r.value), "money", cur)]]; }
  else if (p === "google") items = [["Invest.", E.fmt(m.spend, "money", cur)], ["CTR", E.fmt(E.pct(m.clicks, m.impressions), "pct")], ["Conv.", E.fmt(m.conversions, "dec1")], ["Custo/conv.", E.fmt(E.div(m.spend, m.conversions), "money", cur)]];
  else items = [["Invest.", E.fmt(m.spend, "money", cur)], ["Cliques", E.fmt(m.clicks, "int")], ["Leads", E.fmt(m.leads, "int")], ["CPL", E.fmt(E.div(m.spend, m.leads), "money", cur)]];
  return `<span class="mini">${items.map(([k, v, ok]) => `<span><i>${k}</i><b class="${ok === true ? "good" : ok === false ? "bad" : ""}">${v}</b></span>`).join("")}</span>`;
}

/* ---------------- abrir/fechar linhas (com animação) ---------------- */
const OPEN = new Set();
function findCtx(gid) {
  const [kind, p, ...rest] = gid.split("-"); const id = rest.join("-");
  const d = st.data[dkey(p)]; if (!d) return null;
  for (const a of d.accounts) for (const cp of a.campaigns) {
    if (kind === "c" && String(cp.id) === id) return { p, a, cp };
    for (const s of cp.sets || []) if (kind === "s" && String(s.id) === id) return { p, a, cp, s };
  }
  return null;
}
function fillExpand(gid) {
  const box = document.getElementById(gid); if (!box) return false;
  const inner = box.firstElementChild; if (inner.dataset.filled) return true;
  const c = findCtx(gid); if (!c) return false;
  const anyMsg = c.p === "linkedin";
  const eng = isEng(c.cp);
  const cols = eng ? E.columnsEngage(c.p, c.a._engAgg) : E.columns(c.p, { messages: anyMsg && c.a.campaigns.some((x) => !isEng(x) && x.metrics && x.metrics.sends) });
  inner.innerHTML = c.s ? frontsBlock(frontsFor(c.cp).sets[c.s.id], "lvl-s") + targetingHTML(c.s.targeting) + (c.p === "google" ? keywordsHTML(c.s, c.a.currency) : "") + creativesHTML(c.p, c.a, c.cp, c.s) : setsHTML(c.p, c.a, c.cp, cols, eng);
  inner.dataset.filled = "1"; return true;
}
function toggle(gid, force) {
  const box = document.getElementById(gid); if (!box) return;
  const open = force != null ? force : !box.classList.contains("open");
  if (open && !fillExpand(gid)) return;
  const row = box.previousElementSibling; row.setAttribute("aria-expanded", String(open));
  box.classList.toggle("open", open); row.classList.toggle("is-open", open);
  if (open) OPEN.add(gid); else OPEN.delete(gid);
}
function restoreOpen() {
  [...OPEN].sort((a, b) => (a[0] === "c" ? -1 : 1)).forEach((gid) => {
    const box = document.getElementById(gid); if (!box) return;
    box.classList.add("no-anim"); toggle(gid, true); requestAnimationFrame(() => box.classList.remove("no-anim"));
  });
}

/* ---------------- drawer do criativo ---------------- */
function findAd(ref) {
  const [p, cid, sid, aid] = ref.split("|"); const d = st.data[dkey(p)]; if (!d) return null;
  for (const a of d.accounts) for (const cp of a.campaigns) if (String(cp.id) === cid) for (const s of cp.sets || []) if (!sid || String(s.id) === sid) for (const ad of s.ads || []) if (String(ad.id) === aid) return { p, a, cp, s: sid ? s : null, ad };
  return null;
}
function openDrawer(ref) {
  const x = findAd(ref); if (!x) return;
  st.drawer = ref;
  const dr = $("#drawer"); dr.innerHTML = drawerHTML(x); dr.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-on");
  requestAnimationFrame(() => dr.classList.add("on"));
  bindDrawer(x);
}
function closeDrawer() {
  const dr = $("#drawer"); if (!dr) return;
  dr.querySelectorAll("video").forEach((v) => v.pause());
  dr.classList.remove("on"); dr.setAttribute("aria-hidden", "true"); document.body.classList.remove("drawer-on"); st.drawer = null;
  setTimeout(() => { if (!st.drawer) dr.innerHTML = ""; }, 380);
}
function copyBlock(label, list) {
  if (!list || !list.length) return "";
  return `<div class="copyblock"><label>${label}${list.length > 1 ? ` <span>${list.length} variações</span>` : ""}</label>${list.map((t, i) => `<div class="copytext">${list.length > 1 ? `<i>${i + 1}</i>` : ""}<p>${esc(t).replace(/\n/g, "<br>")}</p><button class="mini-btn" data-copy="${esc(t)}" title="Copiar">${icon("copy")}</button></div>`).join("")}</div>`;
}
const CTA = { LEARN_MORE: "Saiba mais", SIGN_UP: "Cadastre-se", CONTACT_US: "Fale conosco", SHOP_NOW: "Comprar agora", APPLY_NOW: "Inscreva-se", DOWNLOAD: "Baixar", GET_QUOTE: "Pedir orçamento", SUBSCRIBE: "Assinar", WHATSAPP_MESSAGE: "Enviar mensagem no WhatsApp", MESSAGE_PAGE: "Enviar mensagem", BOOK_TRAVEL: "Reservar", GET_OFFER: "Obter oferta", ORDER_NOW: "Pedir agora", SEND_MESSAGE: "Enviar mensagem", CALL_NOW: "Ligar agora", NO_BUTTON: "Sem botão" };
function drawerHTML({ p, a, cp, s, ad }) {
  const cr = ad.creative || {}; const m = ad.metrics || {}; const cur = a.currency;
  let media = "", copy = "", links = [];
  if (p === "meta") {
    if (cr.type === "carousel") media = `<div class="car" data-i="0">${cr.carousel.map((c, i) => `<figure class="slide ${i ? "" : "on"}">${c.image ? `<img src="${esc(c.image)}" alt=""/>` : ""}<figcaption>${esc(c.title)}${c.description ? `<span>${esc(c.description)}</span>` : ""}</figcaption></figure>`).join("")}<button class="car-nav prev" aria-label="Anterior">${icon("left")}</button><button class="car-nav next" aria-label="Próximo">${icon("chev")}</button><div class="car-dots">${cr.carousel.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div></div>`;
    else if (cr.type === "video") media = `<div class="vid" data-video="${esc(cr.videoId)}"><img src="${esc(cr.thumb || cr.image || "")}" alt=""/><span class="vid-load"><span class="spin"></span>Carregando vídeo…</span></div>`;
    else media = cr.image || cr.thumb ? `<img class="still" src="${esc(cr.image || cr.thumb)}" alt=""/>` : `<div class="ph big">${icon("image")}</div>`;
    copy = copyBlock("Texto principal", cr.bodies) + copyBlock("Título", cr.titles) + copyBlock("Descrição", cr.descriptions);
    if (cr.cta || cr.link) copy += `<div class="kv">${cr.cta ? `<span><i>Botão</i>${esc(CTA[cr.cta] || cr.cta)}</span>` : ""}${cr.leadForm ? `<span><i>Destino</i>Formulário instantâneo</span>` : cr.link ? `<span><i>Destino</i><a href="${esc(cr.link)}" target="_blank">${esc(cr.link.replace(/^https?:\/\//, "").slice(0, 60))}</a></span>` : ""}${cr.dynamic ? `<span><i>Formato</i>Criativo dinâmico (o Meta combina as variações)</span>` : ""}</div>`;
    if (cr.instagram) links.push(["Ver no Instagram", cr.instagram]);
    if (cr.facebook) links.push(["Ver no Facebook", cr.facebook]);
    if (!copy && a.source === "reportei") copy = `<p class="hint">Texto do anúncio indisponível pelo Reportei. Com o token do Meta válido, a copy aparece aqui.</p>`;
  } else if (p === "google") {
    const yt = (ad.videos || [])[0];
    if (yt) media = `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${esc(yt.youtube)}?rel=0" title="${esc(yt.title || "Vídeo")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    else if ((ad.images || []).length) media = `<div class="mosaic n${Math.min(ad.images.length, 4)}">${ad.images.slice(0, 4).map((u) => `<img src="${esc(u)}" alt=""/>`).join("")}${ad.images.length > 4 ? `<span class="more">+${ad.images.length - 4}</span>` : ""}</div>`;
    else { const host = ad.finalUrl ? ad.finalUrl.replace(/^https?:\/\//, "").split("/")[0] : ""; media = `<div class="serp big"><span class="serp-ad"><b>Patrocinado</b> · ${esc(host)}${ad.path.length ? " › " + esc(ad.path.join(" › ")) : ""}</span><span class="serp-h">${esc(ad.headlines.slice(0, 3).join(" | "))}</span><span class="serp-d">${esc(ad.descriptions.slice(0, 2).join(" "))}</span></div>`; }
    copy = copyBlock("Títulos", ad.headlines) + copyBlock("Descrições", ad.descriptions);
    copy += `<div class="kv">${ad.strength ? `<span><i>Força do anúncio</i>${strengthPT(ad.strength)}</span>` : ""}${ad.approval ? `<span><i>Política</i>${ad.approval === "APPROVED" ? "Aprovado" : esc(ad.approval)}</span>` : ""}${ad.business ? `<span><i>Empresa</i>${esc(ad.business)}</span>` : ""}${ad.finalUrl ? `<span><i>Página</i><a href="${esc(ad.finalUrl)}" target="_blank">${esc(ad.finalUrl.replace(/^https?:\/\//, "").slice(0, 60))}</a></span>` : ""}</div>`;
    if ((ad.videos || []).length) links.push(["Abrir no YouTube", `https://www.youtube.com/watch?v=${ad.videos[0].youtube}`]);
    if (ad.finalUrl) links.push(["Abrir a página", ad.finalUrl]);
  } else {
    if (cr.video) media = `<video src="${esc(cr.video)}" poster="${esc(cr.image || "")}" controls playsinline></video>`;
    else if (cr.image) media = `<img class="still" src="${esc(cr.image)}" alt=""/>`;
    else media = `<div class="ph big">${icon(cr.type === "message" ? "msg" : "image")}<span>${a.source === "reportei" ? "Prévia indisponível pelo Reportei" : "Sem mídia"}</span></div>`;
    copy = copyBlock("Texto do anúncio", cr.bodies) + copyBlock("Título", cr.titles);
    if (!copy) copy = `<p class="hint">${a.source === "reportei" ? "O Reportei entrega só o nome e as métricas dos anúncios do LinkedIn. Para ver a copy, conecte a API do LinkedIn em Configurações." : "Sem texto disponível."}</p>`;
    if (cr.link) links.push(["Abrir o link", cr.link]);
  }
  const eng = isEng(cp);
  const steps = eng ? E.funnelEngage(p, m) : E.funnel(p, m, { objective: cp.objective, channel: cp.channel, withLeads: p !== "linkedin" || m.leads != null });
  return `
    <header class="dr-head">
      <div class="crumbs"><span>${esc(PLAT[p].short)}</span>${icon("chev")}<span title="${esc(cp.name)}">${esc(cp.name)}</span>${s ? `${icon("chev")}<span title="${esc(s.name)}">${esc(s.name)}</span>` : ""}</div>
      <button class="btn icon-only" data-act="close-drawer" aria-label="Fechar">${icon("x")}</button>
    </header>
    <div class="dr-scroll">
      <div class="stage"><span class="brk tl"></span><span class="brk tr"></span><span class="brk bl"></span><span class="brk br"></span>${media}</div>
      <h2 class="dr-title">${esc(ad.name)}</h2>
      ${eng ? "" : drDiag(p, m, adCtx(cp, s))}
      <div class="dr-metrics">${steps.map((s2) => `<div><i>${esc(s2.label)}</i><b>${E.fmt(s2.value, s2.money ? "money" : "int", cur)}</b>${s2.rate ? `<span class="${s2.rate.bench != null && s2.rate.value != null ? (s2.rate.value >= s2.rate.bench ? "good" : "bad") : ""}">${esc(s2.rate.label)} ${E.fmt(s2.rate.value, "pct")}</span>` : ""}</div>`).join("")}${eng ? E.engageBreakdown(p, m).map((b) => `<div><i>${esc(b.label)}</i><b>${E.fmt(b.value, "int")}</b></div>`).join("") : ""}
        ${p === "meta" && m.frequency ? `<div><i>Frequência</i><b>${E.fmt(m.frequency, "dec")}</b></div>` : ""}${p === "meta" && !eng ? `<div><i>Custo por resultado</i><b>${E.fmt(E.div(m.spend, E.metaResult(m, cp.objective).value), "money", cur)}</b></div>` : ""}</div>
      ${copy}
      ${links.length ? `<div class="dr-links">${links.map(([l, u]) => `<a class="btn ghost" href="${esc(u)}" target="_blank">${icon("ext")}${l}</a>`).join("")}</div>` : ""}
    </div>`;
}
function bindDrawer({ p, ad }) {
  const dr = $("#drawer");
  const v = dr.querySelector(".vid");
  if (v) {
    const cr = ad.creative || {};
    api.metaVideo({ ids: cr.videoIds || [cr.videoId], adId: ad.id }).then((r) => {
      if (st.drawer == null || !document.body.contains(v)) return;
      if (r && r.source) v.innerHTML = `<video src="${esc(r.source)}" poster="${esc(cr.thumb || r.picture || "")}" controls autoplay muted playsinline></video>`;
      else if (r && r.preview) v.innerHTML = `<iframe class="fb-prev" src="${esc(r.preview)}" title="Prévia do anúncio no Meta" scrolling="no"></iframe>`;
      else v.querySelector(".vid-load").innerHTML = `Vídeo indisponível pela API. ${r && r.permalink ? `<a href="${esc(r.permalink)}" target="_blank">Abrir no Facebook</a>` : ""}`;
    }).catch((e) => { const l = v.querySelector(".vid-load"); if (l) l.textContent = "Não consegui carregar o vídeo: " + (e.message || e); });
  }
  const car = dr.querySelector(".car");
  if (car) {
    const slides = car.querySelectorAll(".slide"), dots = car.querySelectorAll(".car-dots i");
    const go = (d) => { let i = (Number(car.dataset.i) + d + slides.length) % slides.length; car.dataset.i = i; slides.forEach((s, k) => s.classList.toggle("on", k === i)); dots.forEach((s, k) => s.classList.toggle("on", k === i)); };
    car.querySelector(".prev").onclick = () => go(-1); car.querySelector(".next").onclick = () => go(1);
  }
}

/* ---------------- configurações ---------------- */
function keyCard(title, ok, desc, actions) {
  return `<div class="kcard ${ok ? "ok" : ""}"><div class="k-top"><span class="k-state">${ok ? icon("check") : ""}</span><b>${title}</b></div><p>${desc}</p>${actions ? `<div class="k-act">${actions}</div>` : ""}</div>`;
}
function keyForm(id, title, ok, desc, fields, saveLabel, testWhich, extra) {
  const v = (k) => esc((st.settings && st.settings[k]) || "");
  return `<div class="kcard kform ${ok ? "ok" : ""}" data-card="${id}"><div class="k-top"><span class="k-state">${ok ? icon("check") : ""}</span><b>${title}</b><button class="linkish how" data-act="guide" data-anchor="${id}">Como pegar</button></div><p>${desc}</p>
    ${fields.map(([k, label, secret, domId]) => `<label class="kf"><span>${label}</span><input ${domId ? `id="${domId}"` : ""} data-k="${k}" type="${secret ? "password" : "text"}" value="${v(k)}" placeholder="${secret ? "colar aqui" : ""}" autocomplete="off" spellcheck="false"/></label>`).join("")}
    <div class="k-act"><button class="btn ${testWhich === "googleads" ? "ghost" : "primary"} sm" data-act="key-save" data-which="${testWhich}">${saveLabel}</button>${extra || ""}</div><p class="k-msg" id="km-${id}"></p></div>`;
}
function updateSection() {
  const u = st.upd || {};
  return `<section class="set-sec"><h2>Atualizações</h2><div class="kcard upd-card"><div class="k-top"><b>Versão ${esc(u.version || "…")}</b></div>
    <p>O app procura atualizações sozinho toda vez que abre e se atualiza em alguns segundos. Se quiser forçar agora, use o botão.</p>
    <div class="k-act"><button class="btn ghost sm" data-act="upd-check">${icon("refresh")}Verificar atualização</button>${u.canRollback ? `<button class="btn ghost sm" data-act="upd-rollback">Voltar à versão anterior</button>` : ""}</div><p class="k-msg" id="km-upd"></p></div></section>`;
}
function settingsHTML() {
  const k = st.keys; const exp = k.metaExpiresAt ? new Date(k.metaExpiresAt * 1000) : null;
  const metaDesc = !k.meta ? "Sem token. Importe do Painel ou do arquivo de chaves." : exp ? `Token válido até ${exp.toLocaleDateString("pt-BR")} às ${exp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : "Token configurado.";
  return `<header class="top"><div class="title"><h1>Configurações</h1><p class="sub">Chaves, cofre e vínculo das contas de cada cliente.</p></div></header>
  ${updateSection()}
  <section class="set-sec">
    <div class="sec-head"><h2>Chaves de acesso</h2><div class="krow"><button class="btn primary sm" data-act="guide" data-anchor="">${icon("folder")}Abrir o guia passo a passo</button></div></div>
    ${!k.reportei || !k.trello ? `<div class="firststeps"><b>Primeiros passos</b><p>Comece por <b>Reportei</b> e <b>Trello</b> (liberam a lista de clientes e as contas). Depois conecte o <b>Meta</b> e o <b>Google</b>. Cada cartão tem o botão <b>Como pegar</b>, que abre o passo a passo certo.</p></div>` : ""}
    <p class="hint">As chaves ficam guardadas só neste computador. Se a Erik te mandou um arquivo de chaves, importe aqui e pule os campos que já estiverem verdes.</p>
    <div class="krow">
      ${k.painelFound ? `<button class="btn ghost sm" data-act="import-painel">${icon("download")}Importar do Painel de Mídia Paga</button>` : ""}
      <button class="btn ghost sm" data-act="import-file">${icon("upload")}Importar arquivo de chaves</button>
      <button class="btn ghost sm" data-act="export-team" title="Reportei, Gemini, Google Ads (token e client) e App do Meta. Sem tokens pessoais.">${icon("users")}Exportar para a equipe</button>
      <button class="btn ghost sm" data-act="export-file" title="Leva TUDO, inclusive seus tokens pessoais. Use só como backup seu.">${icon("key")}Exportar tudo (backup)</button>
    </div>
    <div class="kgrid k2">
      ${keyForm("reportei", "Reportei", k.reportei, "Lista os clientes e traz as contas e o LinkedIn.", [["reporteiToken", "Token da API", true]], "Salvar e testar", "reportei")}
      ${keyForm("trello", "Trello", k.trello, "Liga cada cliente ao board dele, traz o 'feito na semana' e acha as planilhas de leads.", [["trelloKey", "API Key", true], ["trelloToken", "Token", true]], "Salvar e testar", "trello")}
      ${keyForm("gemini", "Gemini (IA)", k.gemini, "Gera a leitura estratégica de cada cliente a partir do cofre.", [["geminiKey", "Chave da API", true]], "Salvar e testar", "gemini")}
      ${keyForm("meta", "Meta Ads", k.meta && (!k.metaExpiresAt || k.metaExpiresAt * 1000 > Date.now()), metaDesc, [["metaToken", "Token de acesso", true, "metaToken"], ["metaAppId", "App ID", false, "metaAppId"], ["metaAppSecret", "App Secret (para estender o token)", true, "metaAppSecret"]], "Salvar e testar", "meta", `<button class="btn ghost sm" data-act="meta-extend">Estender para 60 dias</button>`)}
      ${keyForm("google", "Google (Ads e planilhas)", k.google && k.sheets, `Ads: ${k.google ? "conectado" : "não conectado"} · Planilhas: ${k.sheets ? "conectado" : "não conectado"}. Um único login libera os dois.`, [["googleAdsDevToken", "Developer Token", true], ["googleAdsClientId", "Client ID", false], ["googleAdsClientSecret", "Client Secret", true], ["googleAdsLoginCustomerId", "ID da MCC (só números)", false]], "Salvar", "googleads", `<button class="btn primary sm" data-act="google-connect">Conectar com Google</button><button class="btn ghost sm" data-act="key-test" data-which="googleads">Testar</button>`)}
      ${keyCard("Cofre Clientes P.O.", k.vaultFound, k.vaultFound ? esc(k.vaultPath) : "Opcional (só para quem usa a rotina P.O.): pasta do cofre no Obsidian. Sem ela, o app mostra só campanhas e criativos.", `<button class="btn ghost sm" data-act="vault-pick">Escolher pasta</button>`)}
      ${keyCard("LinkedIn Ads (opcional)", k.linkedin, k.linkedin ? "API conectada: copy e mídia dos anúncios." : "Não é necessário: as campanhas e métricas do LinkedIn já vêm pelo Reportei.", k.linkedinApp ? `<button class="btn ghost sm" data-act="li-connect">Conectar pelo navegador</button>` : "")}
    </div>
  </section>
  <section class="set-sec">
    <div class="sec-head"><h2>Clientes</h2><div class="krow"><button class="btn primary" data-act="sync">${icon("refresh")}Sincronizar carteira</button><button class="btn ghost" data-act="add-trello">${icon("trello")}Adicionar do Trello</button><button class="btn ghost" data-act="add-client">${icon("plus")}Adicionar do Reportei</button></div></div>
    <p class="hint">A carteira vem do cofre Clientes P.O. e do Trello. Marque quem está ativo: os inativos saem da lista lateral e da rotina P.O. (daily, touchs e combinados), porque a chave grava no clientes.json do cofre. A última atividade do board no Trello ajuda a decidir. Cada cliente é ligado ao projeto do Reportei pelo nome, e as contas de anúncio vêm de lá.</p>
    <div class="map">
      <div class="mrow mhead"><span>Ativo</span><span>Cliente</span><span>Trello</span><span>Projeto no Reportei</span><span>Meta (act_)</span><span>Google (ID)</span><span>LinkedIn (ID)</span></div>
      ${st.clients.map((c) => `<div class="mrow ${c.active === false ? "off" : ""}" data-key="${esc(c.key)}"><label class="switch"><input type="checkbox" data-act="active-row" ${c.active !== false ? "checked" : ""}/><span class="sw"></span></label><span class="mname">${esc(c.name)}</span>
        <span class="tcell"><button class="linkish ${c.trelloBoardId ? "" : "warn-t"}" data-act="pick-trello">${c.trelloBoardName ? esc(c.trelloBoardName) : c.trelloBoardId ? "Board vinculado" : "Vincular board"}</button>${st.boardAct && st.boardAct[c.trelloBoardId] ? `<small>${ago(st.boardAct[c.trelloBoardId])}</small>` : ""}</span>
        <button class="linkish ${c.reporteiId ? "" : "warn-t"}" data-act="pick-project">${c.reporteiName ? esc(c.reporteiName) : "Vincular projeto"}</button>
        <input data-f="meta" value="${esc((c.meta || []).join(", "))}"/><input data-f="google" value="${esc((c.google || []).join(", "))}"/><input data-f="linkedin" value="${esc((c.linkedin || []).join(", "))}"/></div>`).join("")}
    </div>
  </section>
  <div id="picker"></div>`;
}
function bindSettings() {
  $("#main").querySelectorAll(".map input").forEach((inp) => inp.addEventListener("change", async () => {
    const row = inp.closest(".mrow"); const key = row.dataset.key;
    const c = await safe(() => api.clientsSetAccounts({ key, [inp.dataset.f]: inp.value }), "Salvar contas");
    if (c) { replaceClient(c); toast("Contas salvas."); }
  }));
}
function replaceClient(c) { const i = st.clients.findIndex((x) => x.key === c.key); if (i >= 0) st.clients[i] = c; else st.clients.push(c); Object.keys(st.data).forEach((k) => { if (k.startsWith(c.key + "|")) delete st.data[k]; }); renderRail(); }
async function refreshKeys() { st.keys = await api.keysStatus(); st.settings = await api.settingsGet(); }
async function openSettings() { closeDrawer(); st.view = "settings"; st.upd = await api6.updateInfo().catch(() => ({})); await refreshKeys(); renderRail(); renderMain(); loadBoardActivity(); }
async function setActive(key, active) {
  const c2 = await safe(() => api2.setActive({ key, active }), "Carteira");
  if (c2) { const i = st.clients.findIndex((x) => x.key === key); st.clients[i] = c2; renderRail(); if (st.view === "settings") renderMain(true); toast((active ? `${c2.name} está ativo na carteira.` : `${c2.name} saiu da lista de ativos.`) + (c2.vaultFolder ? " A rotina P.O. também passa a seguir isso." : "")); }
}
function ago(isoDate) {
  const d = Math.floor((Date.now() - new Date(isoDate).getTime()) / 864e5);
  return d <= 0 ? "mexido hoje no Trello" : d === 1 ? "mexido ontem no Trello" : `parado há ${d} dias no Trello`;
}
async function loadBoardActivity() {
  if (!st.keys.trello) return;
  const b = await safe(() => api2.trelloBoards(), "Trello"); if (!b) return;
  st.boards = b; st.boardAct = Object.fromEntries(b.map((x) => [x.id, x.lastActivity]));
  if (st.view === "settings") renderMain(true);
}
async function boardPicker(onPick) {
  const box = $("#picker"); box.innerHTML = `<div class="picker"><div class="pk-in"><label class="search">${icon("search")}<input id="pkq" placeholder="Buscar board no Trello"/></label><div class="pk-list"><span class="spin"></span></div><button class="btn ghost sm" data-act="pk-close">Fechar</button></div></div>`;
  const list = st.boards || (await safe(() => api2.trelloBoards(), "Trello")) || []; st.boards = list;
  const used = new Set(st.clients.map((c) => c.trelloBoardId));
  const draw = (q) => { box.querySelector(".pk-list").innerHTML = list.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || "")).slice(0, 80).map((p) => `<button class="pk-item" data-bid="${p.id}">${esc(p.name)}<span>${used.has(p.id) ? "na carteira · " : ""}${ago(p.lastActivity).replace(" no Trello", "")}</span></button>`).join("") || `<p class="muted pad">Nada encontrado.</p>`; };
  draw(""); const q = $("#pkq"); q.focus(); q.oninput = () => draw(q.value);
  box.onclick = (e) => { const it = e.target.closest(".pk-item"); if (it) { const b = list.find((x) => x.id === it.dataset.bid); box.innerHTML = ""; onPick(b); } if (e.target.closest("[data-act=pk-close]")) box.innerHTML = ""; };
}
async function projectPicker(onPick) {
  const box = $("#picker"); box.innerHTML = `<div class="picker"><div class="pk-in"><label class="search">${icon("search")}<input id="pkq" placeholder="Buscar projeto no Reportei"/></label><div class="pk-list"><span class="spin"></span></div><button class="btn ghost sm" data-act="pk-close">Fechar</button></div></div>`;
  const list = await safe(() => api.clientsProjects(), "Reportei") || [];
  const draw = (q) => { box.querySelector(".pk-list").innerHTML = list.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60).map((p) => `<button class="pk-item" data-pid="${p.id}" data-pname="${esc(p.name)}">${esc(p.name)}<span>${p.id}</span></button>`).join("") || `<p class="muted pad">Nada encontrado.</p>`; };
  draw(""); const q = $("#pkq"); q.focus(); q.oninput = () => draw(q.value);
  box.onclick = (e) => { const it = e.target.closest(".pk-item"); if (it) { box.innerHTML = ""; onPick({ id: Number(it.dataset.pid), name: it.dataset.pname }); } if (e.target.closest("[data-act=pk-close]")) box.innerHTML = ""; };
}
function welcomeHTML() {
  return `<div class="welcome"><span class="brand-mark big" aria-hidden="true"></span><h1>Central de Campanhas</h1><p>Tudo o que está ativo em Meta, Google e LinkedIn, cliente por cliente, com os criativos e o que estamos testando.</p>
  ${st.keys.reportei ? `<button class="btn primary" data-act="sync">${icon("refresh")}Sincronizar a carteira de clientes</button>` : `<button class="btn primary" data-act="settings">${icon("key")}Configurar as chaves</button>`}</div>`;
}

/* ---------------- eventos ---------------- */
document.addEventListener("click", async (e) => {
  const t = e.target;
  const cl = t.closest("[data-client]"); if (cl) return selectClient(cl.dataset.client);
  const per = t.closest("[data-period]"); if (per) {
    if (per.dataset.period === "custom") { if (!st.custom || !st.custom.start) st.custom = range(st.period === "custom" ? "7d" : st.period); st.period = "custom"; renderMain(true); $("#dStart") && $("#dStart").focus(); return; }
    st.period = per.dataset.period; api.uiSet({ period: st.period }); OPEN.clear(); renderMain(); PLATS.forEach((p) => loadPlatform(p)); loadLeads(); return;
  }
  const pl = t.closest("[data-plat]"); if (pl) { st.platform = pl.dataset.plat; api.uiSet({ platform: st.platform }); const b = $("#pbody"); renderMain(true); $("#pbody").classList.add("fade"); return; }
  const fr = t.closest("[data-front]"); if (fr) { e.stopPropagation(); const el = document.getElementById("front-" + fr.dataset.front); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } return; }
  const cp = t.closest("[data-copy]"); if (cp) { navigator.clipboard.writeText(cp.dataset.copy); toast("Texto copiado."); return; }
  const ad = t.closest("[data-ad]"); if (ad) return openDrawer(ad.dataset.ad);
  const tg = t.closest("[data-toggle]"); if (tg && !t.closest("a")) return toggle(tg.dataset.toggle);
  const a = t.closest("[data-act]"); if (!a || a.matches("input[type=checkbox]")) return;
  const act = a.dataset.act; const c = curClient();
  if (act === "settings") return openSettings();
  if (act === "close-drawer") return closeDrawer();
  if (act === "refresh") { Object.keys(st.data).forEach((k) => { if (k.startsWith(st.cur + "|")) delete st.data[k]; }); OPEN.clear(); renderMain(); PLATS.forEach((p) => loadPlatform(p, true)); loadStrategy(true); loadDone(true); loadAppr(true); loadLeads(true); return; }
  if (act === "gen-strat") return genStrategy();
  if (act === "apply-range") {
    const a1 = $("#dStart").value, b1 = $("#dEnd").value;
    if (!a1 || !b1) return toast("Escolha as duas datas.", "err");
    if (a1 > b1) return toast("A data inicial precisa ser antes da final.", "err");
    st.custom = { start: a1, end: b1 }; st.period = "custom"; api.uiSet({ period: "custom", custom: st.custom }); OPEN.clear(); renderMain();
    PLATS.forEach((p) => loadPlatform(p)); loadLeads(); return;
  }
  if (act === "compare") { st.compare = !st.compare; api.uiSet({ compare: st.compare }); if (st.compare) PLATS.forEach((p) => loadPrev(p)); renderMain(true); return; }
  if (act === "theme") { st.theme = st.theme === "light" ? "dark" : "light"; applyTheme(); api.uiSet({ theme: st.theme }); renderRail(); return; }
  if (act === "org-all") { st.orgAll = st.orgAll || {}; st.orgAll[a.dataset.id] = !st.orgAll[a.dataset.id]; renderMain(true); return; }
  if (act === "strat-full") { const id = a.id; st.stratFull = !st.stratFull; api.uiSet({ stratFull: st.stratFull }); renderMain(true); if (id) document.getElementById(id)?.scrollIntoView({ block: "center" }); return; }
  if (act === "guide") { safe(() => api7.guideOpen(a.dataset.anchor), "Guia"); return; }
  if (act === "key-save") {
    const card = a.closest(".kcard"); const patch = {}; card.querySelectorAll("input[data-k]").forEach((i) => { patch[i.dataset.k] = i.value.trim(); });
    await api.settingsSet(patch); await refreshKeys();
    const msg = card.querySelector(".k-msg"); const which = a.dataset.which;
    if (which === "googleads" || !which) { if (msg) { msg.className = "k-msg ok"; msg.textContent = "Salvo. Agora clique em Conectar com Google."; } return; }
    if (msg) { msg.className = "k-msg"; msg.innerHTML = `<span class="spin"></span> Testando…`; }
    const r = await api7.keysTest(which);
    if (msg) { msg.className = "k-msg " + (r.ok ? "ok" : "bad"); msg.textContent = r.msg; }
    if (r.ok) { await refreshKeys(); st.keys.metaExpiresAt = st.keys.metaExpiresAt; renderRail(); }
    return;
  }
  if (act === "key-test") {
    const card = a.closest(".kcard"); const msg = card.querySelector(".k-msg"); msg.className = "k-msg"; msg.innerHTML = `<span class="spin"></span> Testando…`;
    const r = await api7.keysTest(a.dataset.which); msg.className = "k-msg " + (r.ok ? "ok" : "bad"); msg.textContent = r.msg; return;
  }
  if (act === "google-connect") {
    const card = a.closest(".kcard"); const patch = {}; card.querySelectorAll("input[data-k]").forEach((i) => { patch[i.dataset.k] = i.value.trim(); }); await api.settingsSet(patch);
    a.disabled = true; const old = a.innerHTML; a.innerHTML = `<span class="spin"></span>Aguardando o navegador…`;
    const r = await safe(() => api7.googleConnect(), "Google"); a.disabled = false; a.innerHTML = old;
    if (r) { toast("Google conectado."); await refreshKeys(); renderMain(true); setTimeout(() => { const b = document.querySelector('[data-card=google] [data-act=key-test]'); b && b.click(); }, 300); }
    return;
  }
  if (act === "export-team") { const r = await safe(() => api7.keysExportTeam(), "Exportar"); if (r && r.ok) toast("Arquivo da equipe salvo em " + r.path + ". Envie só em privado."); return; }
  if (act === "upd-check") {
    const msg = document.getElementById("km-upd"); msg.className = "k-msg"; msg.innerHTML = `<span class="spin"></span> Procurando…`;
    const r = await api6.updateCheck().catch((e) => ({ error: e.message }));
    if (r.error) { msg.className = "k-msg bad"; msg.textContent = "Não consegui verificar: " + r.error; return; }
    if (r.dev) { msg.className = "k-msg"; msg.textContent = "Você está rodando do código-fonte (modo de desenvolvimento): a atualização automática fica desligada."; return; }
    if (!r.hasUpdate) { msg.className = "k-msg ok"; msg.textContent = `Você já está na versão mais recente (${r.local}).`; return; }
    msg.className = "k-msg"; msg.textContent = `Versão ${r.latest} disponível. Atualizando…`; return runUpdate(r);
  }
  if (act === "upd-rollback") { if (!confirm("Voltar para a versão anterior do app?")) return; const r = await safe(() => api6.updateRollback(), "Atualização"); if (r) showUpdateOverlay(`Voltando para a versão ${r.version}…`, ""); return; }
  if (act === "open-url") { api.open(a.dataset.url); return; }
  if (act === "sheets-connect") {
    a.disabled = true; const old = a.innerHTML; a.innerHTML = `<span class="spin"></span>Aguardando o navegador…`;
    const r = await safe(() => api5.sheetsConnect(), "Google");
    a.disabled = false; a.innerHTML = old;
    if (r) { toast("Google conectado. Lendo as planilhas…"); await refreshKeys(); st.leads = {}; if (st.view === "settings") renderMain(true); else loadLeads(true); }
    return;
  }
  if (act === "sheets-disconnect") { await api5.sheetsDisconnect(); await refreshKeys(); st.leads = {}; toast("Google desconectado."); return st.view === "settings" ? renderMain(true) : loadLeads(true); }
  if (act === "leads-sheet") { st.leadsSheet[st.cur] = a.dataset.id; delete st.leadsTab[st.cur]; return renderMain(true); }
  if (act === "leads-tab") { st.leadsTab[st.cur] = a.dataset.tab; return renderMain(true); }
  if (act === "leads-all") { st.leadsAll[st.cur] = true; return renderMain(true); }
  if (act === "set-sheet") {
    const url = ($("#sheetUrl") || {}).value || "";
    const r = await safe(() => api4.leadsSetSheet({ key: st.cur, url }), "Planilha");
    if (r) { st.clients = await api.clientsList(); st.leads = {}; loadLeads(true); toast("Planilha vinculada."); }
    return;
  }
  if (act === "present") { st.present = !st.present; document.body.classList.toggle("present", st.present); closeDrawer(); return renderMain(true); }
  if (act === "done-toggle") { const id = a.dataset.id; if (st.doneOpen.has(id)) st.doneOpen.delete(id); else st.doneOpen.add(id); return renderMain(true); }
  if (act === "toggle-vault") { st.showVault = !st.showVault; return renderMain(true); }
  if (act === "vault") return api.vaultOpen({ key: c.key });
  if (act === "sync") {
    a.disabled = true; a.innerHTML = `<span class="spin"></span>Sincronizando…`;
    const r = await safe(() => api.clientsSync(), "Sincronizar");
    if (r) { st.clients = r.clients; st.data = {}; toast(`${r.clients.length} clientes sincronizados.`); if (!st.cur && st.clients[0]) st.cur = st.clients[0].key; }
    renderRail(); if (st.view === "welcome" && st.clients.length) return selectClient(st.cur); return renderMain();
  }
  if (act === "import-painel") { const r = await safe(() => api.keysImportPainel(), "Importar"); if (r) { toast(`${r.imported} chaves importadas do Painel.`); await refreshKeys(); renderMain(); } return; }
  if (act === "import-file") { const r = await safe(() => api.keysImportFile(), "Importar"); if (r && r.ok) { toast(`${r.imported} chaves importadas.`); await refreshKeys(); renderMain(); } return; }
  if (act === "export-file") { const r = await safe(() => api.keysExport(), "Exportar"); if (r && r.ok) toast("Arquivo salvo em " + r.path); return; }
  if (act === "save-meta") { const v = $("#metaToken").value.trim(); if (!v) return; await api.settingsSet({ metaToken: v }); const r = await api.metaTokenInfo(); await refreshKeys(); st.keys.metaExpiresAt = r.expiresAt; toast(r.ok ? "Token do Meta salvo." : "Token salvo, mas o Meta não validou: " + (r.msg || ""), r.ok ? "" : "err"); st.data = {}; renderMain(); renderRail(); return; }
  if (act === "meta-extend") {
    const patch = { metaAppId: $("#metaAppId").value.trim() }; const sec = $("#metaAppSecret").value.trim(); if (sec) patch.metaAppSecret = sec;
    await api.settingsSet(patch); const r = await safe(() => api.metaExtend(), "Estender token");
    if (r) { toast(`Token do Meta estendido${r.days ? ` por ${r.days} dias` : ""}.`); const i = await api.metaTokenInfo(); await refreshKeys(); st.keys.metaExpiresAt = i.expiresAt; renderMain(); renderRail(); }
    return;
  }
  if (act === "li-connect") { const r = await safe(() => api.linkedinConnect(), "LinkedIn"); if (r) { toast(`LinkedIn conectado${r.days ? ` por ${r.days} dias` : ""}.`); await refreshKeys(); st.data = {}; renderMain(); } return; }
  if (act === "vault-pick") { const r = await api.vaultPick(); if (r) { await refreshKeys(); st.strat = {}; renderMain(); } return; }
  if (act === "pick-project") { const key = a.closest(".mrow").dataset.key; return projectPicker(async (p) => { const c2 = await safe(() => api.clientsSetProject({ key, projectId: p.id, projectName: p.name }), "Vincular"); if (c2) { replaceClient(c2); renderMain(); toast("Projeto vinculado e contas atualizadas."); } }); }
  if (act === "toggle-inactive") { st.showInactive = !st.showInactive; return renderRail(); }
  if (act === "pick-trello" || act === "pick-trello-cur") {
    const key = act === "pick-trello" ? a.closest(".mrow").dataset.key : st.cur;
    if (act === "pick-trello-cur" && !$("#picker")) $("#main").insertAdjacentHTML("beforeend", '<div id="picker"></div>');
    return boardPicker(async (b) => { const c2 = await safe(() => api2.setTrello({ key, boardId: b.id, boardName: b.name, url: b.url }), "Trello"); if (c2) { replaceClient(c2); renderMain(true); toast("Board do Trello vinculado."); } });
  }
  if (act === "add-trello") return boardPicker(async (b) => { const c2 = await safe(() => api2.addFromTrello({ boardId: b.id, boardName: b.name, url: b.url }), "Adicionar"); if (c2) { replaceClient(c2); renderMain(true); toast(`${c2.name} entrou na carteira${c2.reporteiName ? " e foi ligado ao Reportei" : ""}.`); } });
  if (act === "add-client") return projectPicker(async (p) => { const c2 = await safe(() => api.clientsAdd({ projectId: p.id, projectName: p.name }), "Adicionar"); if (c2) { replaceClient(c2); renderMain(); toast(c2.name + " adicionado."); } });
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("[data-act=active-cur]")) return setActive(st.cur, t.checked);
  if (t.matches("[data-act=active-row]")) return setActive(t.closest(".mrow").dataset.key, t.checked);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && st.drawer) return closeDrawer();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-toggle]")) { e.preventDefault(); toggle(e.target.dataset.toggle); }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); document.querySelector("[data-act=present]") ? document.querySelector("[data-act=present]").click() : document.querySelector("#presentExit").click(); return; }
  if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); $("#q") && $("#q").focus(); }
});
boot();
