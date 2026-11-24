/* Central de Campanhas — processo principal (Electron)
 * Puxa as campanhas ATIVAS por cliente direto das plataformas:
 *  - Meta: Graph API (estrutura + insights + criativos com vídeo/copy)
 *  - Google Ads: API (campanhas, grupos, anúncios RSA/Display/Vídeo, grupos de recursos da PMax)
 *  - LinkedIn: API (se conectado) ou Reportei (campanhas, anúncios, mensagens)
 * E lê o cofre Obsidian "Clientes P.O." para a parte de estratégia (gargalo → hipótese → solução).
 */
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const GRAPH = "https://graph.facebook.com/v21.0";
const REPORTEI = "https://app.reportei.com/api/v2";
const GADS_VERSIONS = ["v27", "v26", "v25", "v24", "v23", "v22", "v21"];
const KEY_FIELDS = [
  "reporteiToken", "metaToken", "metaAppId", "metaAppSecret",
  "googleAdsDevToken", "googleAdsClientId", "googleAdsClientSecret", "googleAdsRefreshToken", "googleAdsLoginCustomerId",
  "linkedinToken", "linkedinClientId", "linkedinClientSecret", "geminiKey", "geminiModel", "trelloKey", "trelloToken",
];

/* ---------------------------------------------------------- */
/* Store (JSON local, sem módulo nativo)                       */
/* ---------------------------------------------------------- */
const STORE_PATH = () => path.join(app.getPath("userData"), "store.json");
const DEFAULT_STORE = () => ({
  settings: { geminiModel: "gemini-2.5-flash", vaultPath: path.join(os.homedir(), "Claude", "Clientes P.O."), metaAppId: "1418075900077970" },
  clients: [],
  strategyCache: {},
  ui: {},
});
function readStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_PATH(), "utf8"));
    const d = DEFAULT_STORE();
    return { ...d, ...raw, settings: { ...d.settings, ...(raw.settings || {}) } };
  } catch { return DEFAULT_STORE(); }
}
function writeStore(st) {
  fs.mkdirSync(path.dirname(STORE_PATH()), { recursive: true });
  fs.writeFileSync(STORE_PATH(), JSON.stringify(st, null, 2), "utf8");
}
const S = () => readStore().settings;

/* ---------------------------------------------------------- */
/* HTTP                                                        */
/* ---------------------------------------------------------- */
async function httpJson(url, opts = {}, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try { res = await fetch(url, { ...opts, signal: ctrl.signal }); }
  catch (e) { throw new Error(e.name === "AbortError" ? "a plataforma demorou demais para responder" : "sem conexão: " + e.message); }
  finally { clearTimeout(t); }
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const e = body && body.error;
    let msg;
    if (e && typeof e === "object") {
      let gads = null;
      try { (e.details || []).forEach((d) => (d.errors || []).forEach((x) => { if (!gads && x.message) gads = x.message; })); } catch {}
      msg = gads || e.error_user_msg || e.message || JSON.stringify(e);
    } else msg = (body && body.message) || (typeof e === "string" ? e : null) || String(text).slice(0, 300) || `HTTP ${res.status}`;
    const err = new Error(msg); err.status = res.status; err.body = body; throw err;
  }
  return body;
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch (e) { out[k] = { __error: e.message }; } }
  }));
  return out;
}
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const uniq = (arr) => [...new Set(arr.filter((x) => x != null && String(x).trim() !== ""))];

/* ---------------------------------------------------------- */
/* Chaves: importar do Painel / exportar / importar arquivo    */
/* ---------------------------------------------------------- */
function painelStorePath() {
  const base = process.platform === "win32" ? process.env.APPDATA : process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support") : path.join(os.homedir(), ".config");
  return path.join(base || "", "Painel Midia Paga", "store.json");
}
function applyKeys(src) {
  const st = readStore(); let n = 0;
  KEY_FIELDS.forEach((k) => { if (src[k]) { st.settings[k] = src[k]; n++; } });
  if (src.googleAdsApiVersion) st.settings.googleAdsApiVersion = src.googleAdsApiVersion;
  writeStore(st); return n;
}
ipcMain.handle("keys:status", () => {
  const s = S();
  const has = (k) => !!(s[k] && String(s[k]).trim());
  return {
    reportei: has("reporteiToken"), meta: has("metaToken"), metaExpiresAt: s.metaExpiresAt || null,
    google: has("googleAdsRefreshToken") && has("googleAdsDevToken"), linkedin: has("linkedinToken"),
    linkedinApp: has("linkedinClientId") && has("linkedinClientSecret"), gemini: has("geminiKey"), trello: has("trelloKey") && has("trelloToken"),
    metaAppSecret: has("metaAppSecret"), sheets: has("googleSheetsRefreshToken"), meetings: !!S().googleMeetingsOk, painelFound: fs.existsSync(painelStorePath()),
    vaultPath: s.vaultPath, vaultFound: !!(s.vaultPath && fs.existsSync(s.vaultPath)),
  };
});
ipcMain.handle("keys:importPainel", () => {
  const p = painelStorePath();
  if (!fs.existsSync(p)) throw new Error("Não achei o Painel de Mídia Paga neste computador.");
  const src = JSON.parse(fs.readFileSync(p, "utf8")).settings || {};
  return { imported: applyKeys(src) };
});
ipcMain.handle("keys:export", async () => {
  const s = S(); const out = { _tipo: "central-campanhas-chaves", _gerado: new Date().toISOString() };
  KEY_FIELDS.forEach((k) => { if (s[k]) out[k] = s[k]; });
  if (s.googleAdsApiVersion) out.googleAdsApiVersion = s.googleAdsApiVersion;
  const r = await dialog.showSaveDialog({ title: "Salvar arquivo de chaves", defaultPath: path.join(os.homedir(), "Desktop", "chaves-central-campanhas.json") });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, JSON.stringify(out, null, 2), { encoding: "utf8", mode: 0o600 });
  return { ok: true, path: r.filePath };
});
ipcMain.handle("keys:importFile", async () => {
  const r = await dialog.showOpenDialog({ title: "Escolha o arquivo de chaves", properties: ["openFile"], filters: [{ name: "Chaves", extensions: ["json"] }] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  const src = JSON.parse(fs.readFileSync(r.filePaths[0], "utf8"));
  if (src._tipo !== "central-campanhas-chaves") throw new Error("Esse arquivo não é um arquivo de chaves da Central de Campanhas.");
  return { ok: true, imported: applyKeys(src) };
});
ipcMain.handle("settings:get", () => {
  const s = S(); const out = {};
  Object.entries(s).forEach(([k, v]) => { out[k] = KEY_FIELDS.includes(k) && v && !["geminiModel", "metaAppId", "googleAdsLoginCustomerId"].includes(k) ? "•••• " + String(v).slice(-4) : v; });
  return out;
});
ipcMain.handle("settings:set", (_e, patch) => {
  const st = readStore();
  Object.entries(patch || {}).forEach(([k, v]) => { if (typeof v === "string" && v.startsWith("•••• ")) return; st.settings[k] = typeof v === "string" ? v.trim() : v; });
  writeStore(st); return true;
});
ipcMain.handle("ui:get", () => readStore().ui || {});
ipcMain.handle("ui:set", (_e, patch) => { const st = readStore(); st.ui = { ...(st.ui || {}), ...patch }; writeStore(st); return true; });
ipcMain.handle("open:external", (_e, url) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); });

/* ---------------------------------------------------------- */
/* Reportei                                                    */
/* ---------------------------------------------------------- */
const rpH = () => ({ Authorization: `Bearer ${S().reporteiToken}`, Accept: "application/json", "Content-Type": "application/json" });
async function reporteiProjects() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const b = await httpJson(`${REPORTEI}/projects?per_page=100&page=${page}`, { headers: rpH() });
    out.push(...(b.data || []).map((p) => ({ id: p.id, name: p.name })));
    const meta = b.meta || {};
    if (!b.data || b.data.length < 100 || (meta.last_page && page >= meta.last_page)) break;
  }
  return out;
}
const reporteiIntegrations = async (pid) => (await httpJson(`${REPORTEI}/integrations?project_id=${pid}&per_page=100`, { headers: rpH() })).data || [];
const _defs = {};
async function metricDefs(slug) {
  if (_defs[slug]) return _defs[slug];
  const b = await httpJson(`${REPORTEI}/metrics?integration_slug=${slug}`, { headers: rpH() });
  const m = {}; (b.data || []).forEach((x) => { m[x.reference_key] = x; }); return (_defs[slug] = m);
}
// extra: { reference_key: [colunas a mais] } — o Reportei aceita colunas extras nas tabelas (ex.: leads por campanha no LinkedIn)
async function reporteiGet(integrationId, slug, start, end, keys, extra = {}) {
  const defs = await metricDefs(slug);
  const objs = keys.map((k) => defs[k] && (extra[k] ? { ...defs[k], metrics: uniq([...(defs[k].metrics || []), ...extra[k]]) } : defs[k])).filter(Boolean);
  const b = await httpJson(`${REPORTEI}/metrics/get-data`, { method: "POST", headers: rpH(), body: JSON.stringify({ start, end, integration_id: integrationId, metrics: objs }) }, 90000);
  if (b && (b.code || b.exception)) throw new Error(b.code === "integration_expired" ? "a conexão desta conta expirou no Reportei (reconecte lá)" : (b.exception && b.exception.message) || b.code);
  const id2k = {}; objs.forEach((d) => { id2k[d.id] = d.reference_key; });
  const out = {}; Object.entries(b.data || {}).forEach(([k, v]) => { out[id2k[k] || k] = v; });
  return out;
}
const cell = (v) => {
  if (v == null) return null;
  if (typeof v === "object") return v.value != null ? Number(v.value) : v.text != null ? v.text : null;
  const n = Number(v); return Number.isFinite(n) ? n : v;
};
const numOf = (v) => {
  if (v == null) return null;
  if (typeof v === "object") v = v.value != null ? v.value : v.values;
  if (v && typeof v === "object") v = v.value != null ? v.value : v.current;
  const n = Number(v); return Number.isFinite(n) ? n : null;
};
function rpTable(t) {
  if (!t || !t.values) return [];
  const cols = t.columns_order || Object.keys(t.headers || {});
  return t.values.map((row) => {
    const o = {}; cols.forEach((c, i) => {
      const v = row[i];
      if (i === 0 && v && typeof v === "object") { o._name = v.text; o._image = v.image || null; o._url = v.url || null; o._id = v.id || null; }
      else o[c] = cell(v);
    }); return o;
  });
}

/* ---------------------------------------------------------- */
/* Clientes: carteira do cofre P.O. + projetos do Reportei      */
/* ---------------------------------------------------------- */
function vaultClients() {
  const p = path.join(S().vaultPath || "", "_sistema", "clientes.json");
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return []; }
}
const vaultClientsPath = () => path.join(S().vaultPath || "", "_sistema", "clientes.json");
// grava "ativo" no clientes.json da rotina P.O. (backup na 1ª vez; escrita atômica; só mexe nesse campo)
function writeVaultActive(pasta, active) {
  const p = vaultClientsPath();
  if (!fs.existsSync(p)) return false;
  const raw = fs.readFileSync(p, "utf8"); const list = JSON.parse(raw);
  const c = list.find((x) => x.pasta === pasta); if (!c) return false;
  if (c.ativo === active) return true;
  const bak = path.join(path.dirname(p), "clientes.backup-antes-da-central.json");
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, raw, "utf8");
  c.ativo = active;
  const tmp = p + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8"); fs.renameSync(tmp, p);
  return true;
}
function bestProject(name, aliases, projects) {
  const n = norm(name); const names = [n, ...(aliases || []).map(norm)];
  let best = null, score = 0;
  for (const p of projects) {
    const pn = norm(p.name);
    let s = 0;
    for (const a of names) {
      if (!a) continue;
      if (pn === a) s = Math.max(s, 100);
      else if (pn.startsWith(a) || a.startsWith(pn)) s = Math.max(s, 80);
      else if (pn.includes(a) || a.includes(pn)) s = Math.max(s, 60);
      else {
        const ta = a.split(" ").filter((w) => w.length > 2); const tp = new Set(pn.split(" "));
        const hit = ta.filter((w) => tp.has(w)).length;
        if (hit && ta.length) s = Math.max(s, 40 * hit / ta.length);
      }
    }
    if (/^tiago|teste|antigo|old/.test(pn)) s -= 15;
    if (s > score) { score = s; best = p; }
  }
  return score >= 40 ? best : null;
}
async function linkAccounts(client) {
  const ints = await reporteiIntegrations(client.reporteiId);
  const pick = (slug) => uniq(ints.filter((i) => i.slug === slug).map((i) => String(i.source_id || "")));
  client.meta = pick("facebook_ads").map((id) => (id.startsWith("act_") ? id : "act_" + id));
  // o Reportei às vezes manda "MCC-conta" (ex.: 7117959956-9464658501): a conta é o último bloco de 10 dígitos
  client.google = uniq(pick("google_adwords").map((id) => { const d = id.replace(/\D/g, ""); return d.length > 10 ? d.slice(-10) : d; }));
  client.linkedin = pick("linkedin_ads");
  client.integrations = ints.filter((i) => ["facebook_ads", "google_adwords", "linkedin_ads"].includes(i.slug)).map((i) => ({ id: i.id, slug: i.slug, name: i.name, status: i.status, sourceId: String(i.source_id || "") }));
  client.organico = ints.filter((i) => ORG[i.slug]).map((i) => ({ id: i.id, slug: i.slug, name: i.name }));
  client.linkedAt = new Date().toISOString();
}
ipcMain.handle("clients:list", () => {
  const st = readStore(); const vc = Object.fromEntries(vaultClients().map((v) => ["v:" + v.pasta, v.ativo !== false]));
  let changed = false;
  st.clients.forEach((c) => { if (c.key in vc && c.active !== vc[c.key]) { c.active = vc[c.key]; changed = true; } });
  if (changed) writeStore(st);
  return st.clients;
});
ipcMain.handle("clients:sync", async () => {
  const st = readStore();
  if (!st.settings.reporteiToken) throw new Error("Falta a chave do Reportei. Vá em Configurações.");
  const projects = await reporteiProjects();
  const vc = vaultClients();
  const prev = Object.fromEntries((st.clients || []).map((c) => [c.key, c]));
  const list = [];
  for (const v of vc) {
    const key = "v:" + v.pasta;
    const old = prev[key] || {};
    const proj = old.reporteiLocked ? { id: old.reporteiId, name: old.reporteiName } : bestProject(v.nome, v.apelidos, projects);
    const trello = old.trelloLocked ? { trelloBoardId: old.trelloBoardId, trelloBoardName: old.trelloBoardName } : { trelloBoardId: v.trelloBoardId || old.trelloBoardId || null, trelloBoardName: old.trelloBoardName || null };
    list.push({ ...old, key, name: v.nome, vaultFolder: v.pasta, tier: v.tier, reporteiId: proj ? proj.id : null, reporteiName: proj ? proj.name : null, ...trello,
      active: v.ativo !== false });
  }
  // clientes adicionados à mão (Reportei ou Trello) continuam
  (st.clients || []).filter((c) => /^[rt]:/.test(c.key)).forEach((c) => list.push(c));
  // nome do board do Trello (para mostrar e abrir)
  try { const boards = await trelloBoards(); const bm = Object.fromEntries(boards.map((b) => [b.id, b])); list.forEach((c) => { const b = bm[c.trelloBoardId]; if (b) Object.assign(c, { trelloBoardName: b.name, trelloUrl: b.url }); }); } catch {}
  await pool(list.filter((c) => c.reporteiId), 5, (c) => linkAccounts(c));
  st.clients = list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  writeStore(st);
  return { clients: st.clients, projects: projects.length };
});
ipcMain.handle("clients:projects", async () => reporteiProjects());

/* ---- Trello: board de cada cliente + quem está ativo na carteira ---- */
async function trelloBoards() {
  const s = S(); if (!s.trelloKey || !s.trelloToken) throw new Error("Falta a chave do Trello (importe do Painel ou do arquivo de chaves).");
  const r = await httpJson(`https://api.trello.com/1/members/me/boards?fields=name,url,closed,dateLastActivity,starred&filter=open&key=${encodeURIComponent(s.trelloKey)}&token=${encodeURIComponent(s.trelloToken)}`);
  return r.map((b) => ({ id: b.id, name: b.name, url: b.url, lastActivity: b.dateLastActivity, starred: b.starred }));
}
ipcMain.handle("trello:boards", async () => trelloBoards());
// lista "O que foi feito (na/durante a) semana" do board do cliente: cards com link, etiquetas, data, checklist e descrição
async function trelloDoneData(c, s) {
  if (!c || !c.trelloBoardId) return { ok: false, reason: "Este cliente ainda não tem board do Trello vinculado." };
  if (!s.trelloKey || !s.trelloToken) return { ok: false, reason: "Falta a chave do Trello." };
  const auth = `key=${encodeURIComponent(s.trelloKey)}&token=${encodeURIComponent(s.trelloToken)}`;
  const lists = await httpJson(`https://api.trello.com/1/boards/${c.trelloBoardId}/lists?filter=open&fields=name&${auth}`);
  const list = lists.find((l) => /o que foi feito/i.test(l.name)) || lists.find((l) => /feito|realizad/i.test(l.name));
  if (!list) return { ok: false, reason: 'Não achei a lista "O que foi feito na semana" neste board.', lists: lists.map((l) => l.name) };
  const cards = await httpJson(`https://api.trello.com/1/lists/${list.id}/cards?fields=name,shortUrl,url,labels,due,dueComplete,dateLastActivity,desc,badges,idShort&checklists=all&checklist_fields=name&actions=commentCard&actions_limit=50&action_fields=data,date,type&action_memberCreator_fields=fullName&${auth}`);
  return {
    ok: true, listName: list.name, listUrl: `https://trello.com/b/${c.trelloBoardId}`,
    cards: cards.map((k) => {
      const items = (k.checklists || []).flatMap((cl) => (cl.checkItems || []).map((i) => ({ name: i.name, done: i.state === "complete" })));
      return { id: k.id, name: k.name, url: k.shortUrl || k.url, labels: (k.labels || []).map((l) => ({ name: l.name || "", color: l.color || "" })), due: k.due || null, done: !!k.dueComplete, last: k.dateLastActivity, desc: k.desc || "", items, comments: trelloComments(k) };
    }),
  };
}
ipcMain.handle("trello:done", async (_e, { key }) => { const st = readStore(); return trelloDoneData(st.clients.find((x) => x.key === key), st.settings); });

// listas de aprovação ("Aguardando Aprovação", "Em aprovação", "Aguardando Aprovação EASYOPS"...): cards, comentários e desde quando estão lá
const APPROVAL_RE = /(aguardando|em)\s+aprova[cç][aã]o/i;
const trelloComments = (k) => (k.actions || []).filter((a) => a.type === "commentCard" && a.data && a.data.text)
  .map((a) => ({ who: (a.memberCreator && a.memberCreator.fullName) || "?", date: a.date, text: a.data.text }))
  .sort((a, b) => b.date.localeCompare(a.date));
async function trelloApprovalData(c, s) {
  if (!c || !c.trelloBoardId) return { ok: false, reason: "Este cliente ainda não tem board do Trello vinculado." };
  if (!s.trelloKey || !s.trelloToken) return { ok: false, reason: "Falta a chave do Trello." };
  const auth = `key=${encodeURIComponent(s.trelloKey)}&token=${encodeURIComponent(s.trelloToken)}`;
  const lists = (await httpJson(`https://api.trello.com/1/boards/${c.trelloBoardId}/lists?filter=open&fields=name&${auth}`)).filter((l) => APPROVAL_RE.test(l.name));
  if (!lists.length) return { ok: false, reason: 'Não achei lista "Aguardando Aprovação" ou "Em aprovação" neste board.' };
  const q = "fields=name,shortUrl,url,labels,due,dateLastActivity,desc,badges&checklists=all&checklist_fields=name&actions=commentCard&actions_limit=50&action_fields=data,date,type&action_memberCreator_fields=fullName";
  const [perList, moves] = await Promise.all([
    Promise.all(lists.map((l) => httpJson(`https://api.trello.com/1/lists/${l.id}/cards?${q}&${auth}`))),
    httpJson(`https://api.trello.com/1/boards/${c.trelloBoardId}/actions?filter=updateCard:idList,createCard,moveCardToBoard&fields=date,data,type&limit=1000&${auth}`).catch(() => []),
  ]);
  // data em que o card entrou na lista atual (ação mais recente que o colocou nela)
  const since = {};
  for (const a of moves) {
    const cid = a.data && a.data.card && a.data.card.id; if (!cid || since[cid]) continue;
    const lid = (a.data.listAfter && a.data.listAfter.id) || (a.data.list && a.data.list.id);
    since[cid] = { list: lid, date: a.date };
  }
  return {
    ok: true, boardUrl: `https://trello.com/b/${c.trelloBoardId}`,
    lists: lists.map((l, i) => ({
      id: l.id, name: l.name,
      cards: perList[i].map((k) => {
        const items = (k.checklists || []).flatMap((cl) => (cl.checkItems || []).map((it) => ({ name: it.name, done: it.state === "complete" })));
        const sn = since[k.id] && since[k.id].list === l.id ? since[k.id].date : null;
        return { id: k.id, name: k.name, url: k.shortUrl || k.url, labels: (k.labels || []).map((x) => ({ name: x.name || "", color: x.color || "" })), due: k.due || null, last: k.dateLastActivity, since: sn, desc: k.desc || "", items, comments: trelloComments(k) };
      }),
    })),
  };
}
ipcMain.handle("trello:approval", async (_e, { key }) => { const st = readStore(); return trelloApprovalData(st.clients.find((x) => x.key === key), st.settings); });

/* ---------------------------------------------------------- */
/* LEADS — planilha de acompanhamento do cliente               */
/* O link fica no card "Planilha de Acompanhamento" da lista "Links Úteis" do Trello.
 * Cada aba costuma ser uma plataforma (Meta, Google Ads, LinkedIn). Lê pelo link compartilhado (CSV). */
/* ---------------------------------------------------------- */
function parseCSV(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const MONTHS_EN = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const MONTHS_PT = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
function parseLeadDate(v) {
  const t = String(v || "").trim(); if (!t) return null; let m, y, mo, d;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t))) { d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; }
  else if ((m = /^([A-Za-zçÇ]+)\s+(\d{1,2})[,\s]+(\d{4})/.exec(t))) { mo = MONTHS_EN[m[1].toLowerCase()] || MONTHS_PT[norm(m[1])]; d = +m[2]; y = +m[3]; }
  else if ((m = /^(\d{1,2})\s+de\s+([A-Za-zçÇ]+)\s+de\s+(\d{4})/i.exec(t))) { d = +m[1]; mo = MONTHS_PT[norm(m[2])]; y = +m[3]; }
  else if ((m = /^(\d{5})(?:[.,]\d+)?$/.exec(t))) { const dt = new Date(Date.UTC(1899, 11, 30) + Number(m[1]) * 864e5); y = dt.getUTCFullYear(); mo = dt.getUTCMonth() + 1; d = dt.getUTCDate(); } // data como número de série do Sheets
  if (!y || !mo || !d || mo > 12 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
// sim / não / aguardando qualificação / (vazio = o cliente não preencheu)
function yesNo(v) {
  const t = norm(v); if (!t) return "";
  if (/ag.*qualif|aguard|pendente|em analise/.test(t)) return "aguardando";
  if (/^desqualific|^nao qualific|^nao e qualific|^descart|^fora d/.test(t)) return "nao";
  if (/^qualific|^mql\b|^sql\b|^dentro d/.test(t)) return "sim";
  if (t === "sim" || t === "s" || t === "yes" || t === "ok" || t.startsWith("sim ")) return "sim";
  if (t === "nao" || t === "n" || t === "no" || t.startsWith("nao") || t.startsWith("ainda nao")) return "nao";
  return "outro";
}
const sheetIdFrom = (t) => { const m = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(t || ""); return m ? m[1] : null; };
async function findSheets(c, s) {
  const found = []; const seen = new Set();
  const add = (id, label, src) => { if (id && !seen.has(id)) { seen.add(id); found.push({ id, label, src }); } };
  if (c.leadsSheetId) add(c.leadsSheetId, "Planilha adicionada à mão", "manual");
  if (c.trelloBoardId && s.trelloKey && s.trelloToken) {
    const auth = `key=${encodeURIComponent(s.trelloKey)}&token=${encodeURIComponent(s.trelloToken)}`;
    const lists = await httpJson(`https://api.trello.com/1/boards/${c.trelloBoardId}/lists?filter=open&fields=name&${auth}`);
    const list = lists.find((l) => /links?\s+[uú]teis|links?$/i.test(l.name)) || lists.find((l) => /[uú]teis|links/i.test(l.name));
    if (list) {
      const cards = await httpJson(`https://api.trello.com/1/lists/${list.id}/cards?fields=name,desc&attachments=true&attachment_fields=url&${auth}`);
      // cards com "planilha/acompanhamento" no nome primeiro, depois os demais que tenham link de planilha
      const ordered = [...cards.filter((k) => /planilha|acompanhamento|leads?/i.test(k.name)), ...cards.filter((k) => !/planilha|acompanhamento|leads?/i.test(k.name))];
      for (const k of ordered) {
        const lines = String(k.desc || "").split("\n");
        for (const line of lines) {
          const re = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/g; let m;
          while ((m = re.exec(line))) {
            // rótulo = texto antes do link na mesma linha ("Parcerias: ..."); sem rótulo, usa o nome do card
            const httpPos = line.lastIndexOf("http", m.index); const br = httpPos > 0 ? line.lastIndexOf("[", httpPos) : -1;
            const start = br >= 0 && httpPos - br <= 2 ? br : Math.max(httpPos, 0);
            const before = line.slice(0, start).replace(/[\[\]()*_`>#-]/g, "").replace(/:\s*$/, "").trim();
            add(m[1], before && before.length < 60 ? before : k.name, "trello");
          }
        }
        for (const a of k.attachments || []) { const m = sheetIdFrom(a.url); if (m) add(m, k.name, "trello"); }
      }
    }
  }
  return found;
}
const _sheetCache = {};
// classe de cor de uma cor RGB (0..1) do Sheets: "" = branco/cinza/preto (sem significado)
function colorClass(c) {
  if (!c) return ""; const r = c.red || 0, g = c.green || 0, b = c.blue || 0; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 0.12) return ""; let h; if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60;
  return h < 20 || h >= 340 ? "red" : h < 45 ? "orange" : h < 70 ? "yellow" : h < 170 ? "green" : h < 260 ? "blue" : "purple";
}
// cor que a pessoa usou na célula: o fundo; se não houver, o texto (só vermelho/verde contam)
function cellColor(fmt) { if (!fmt) return ""; const bg = colorClass(fmt.backgroundColor); if (bg) return bg; const tx = colorClass(fmt.textFormat && fmt.textFormat.foregroundColor); return tx === "red" || tx === "green" ? tx : ""; }
let _apiOff = null; // a API do Sheets pode estar desativada no projeto do Google Cloud
function noteApiOff(e) { if (e && e.status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(String(e.message))) { const m = /https:\/\/console\.(?:developers|cloud)\.google\.com\/[^\s"]+/.exec(String(e.message)); _apiOff = { url: m ? m[0].replace(/[.,]$/, "") : "https://console.cloud.google.com/apis/library/sheets.googleapis.com" }; } }
// leitura de planilhas PRIVADAS: OAuth do próprio usuário (escopo spreadsheets.readonly), guardado só neste computador
let _shAt = null;
async function sheetsToken() {
  const s = S(); if (!s.googleSheetsRefreshToken || !s.googleAdsClientId || !s.googleAdsClientSecret) return null;
  if (_shAt && _shAt.exp > Date.now()) return _shAt.tok;
  const r = await httpJson("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: s.googleAdsClientId, client_secret: s.googleAdsClientSecret, refresh_token: s.googleSheetsRefreshToken, grant_type: "refresh_token" }) });
  _shAt = { tok: r.access_token, exp: Date.now() + ((r.expires_in || 3600) - 120) * 1000 }; return _shAt.tok;
}
async function sheetsApi(urlPath) {
  const tok = await sheetsToken(); if (!tok) return null;
  return httpJson(`https://sheets.googleapis.com/v4/spreadsheets/${urlPath}`, { headers: { Authorization: `Bearer ${tok}` } });
}
ipcMain.handle("google:sheetsConnect", async () => {
  const s = S(); if (!s.googleAdsClientId || !s.googleAdsClientSecret) throw new Error("Faltam o Client ID e o Secret do Google (importe as chaves em Configurações).");
  const http = require("http"); const PORT = 42813; const redirectUri = `http://localhost:${PORT}`;
  const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({ client_id: s.googleAdsClientId, redirect_uri: redirectUri, response_type: "code", scope: "https://www.googleapis.com/auth/spreadsheets.readonly", access_type: "offline", prompt: "consent" }).toString();
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirectUri); const c = u.searchParams.get("code"); const err = u.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<html><body style="font-family:sans-serif;background:#0A0E14;color:#E8ECF3;text-align:center;padding-top:80px"><h2>${c ? "Conectado." : "Não conectou: " + (err || "cancelado")}</h2><p>Pode fechar esta aba e voltar para a Central de Campanhas.</p></body></html>`);
      server.close(); if (c) resolve(c); else reject(new Error(err || "autorização cancelada"));
    });
    server.on("error", (e) => reject(new Error(e.code === "EADDRINUSE" ? "a porta 42813 está ocupada (feche o Painel de Mídia Paga e tente de novo)" : e.message)));
    server.listen(PORT, () => shell.openExternal(authUrl));
    setTimeout(() => { try { server.close(); } catch {} reject(new Error("tempo esgotado, tente de novo")); }, 180000);
  });
  const tok = await httpJson("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ code, client_id: s.googleAdsClientId, client_secret: s.googleAdsClientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  if (!tok.refresh_token) throw new Error("O Google não devolveu a permissão de leitura; refaça a conexão.");
  const st = readStore(); st.settings.googleSheetsRefreshToken = tok.refresh_token; writeStore(st); _shAt = null;
  return { ok: true };
});
ipcMain.handle("google:sheetsDisconnect", () => { const st = readStore(); delete st.settings.googleSheetsRefreshToken; delete st.settings.googleMeetingsOk; writeStore(st); _shAt = null; return true; });
async function sheetTabs(id) {
  try { const r = await sheetsApi(`${id}?fields=properties.title,sheets.properties(sheetId,title,hidden)`); if (r && r.sheets) { const tabs = r.sheets.filter((x) => !x.properties.hidden).map((x) => ({ name: x.properties.title, gid: String(x.properties.sheetId), title: x.properties.title })); tabs.docTitle = r.properties && r.properties.title; return tabs; } }
  catch (e) { noteApiOff(e); if (e.status !== 403 && e.status !== 404 && e.status !== 401 && e.status !== 400) throw e; }
  return sheetTabsPublic(id);
}
async function sheetTabsPublic(id) {
  const html = await (await fetch(`https://docs.google.com/spreadsheets/d/${id}/htmlview`, { redirect: "follow" })).text();
  const tabs = []; const re = /items\.push\(\{name:\s*"((?:[^"\\]|\\.)*)",[^}]*?gid:\s*"(-?\d+)"/g; let m;
  while ((m = re.exec(html))) tabs.push({ name: m[1].replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\\//g, "/"), gid: m[2] });
  return tabs.length ? tabs : [{ name: "Leads", gid: "0" }];
}
async function sheetRows(id, gid, title) {
  const k = id + "|" + gid; const hit = _sheetCache[k];
  if (hit && Date.now() - hit.at < 60000) return hit;
  if (title) {
    try {
      const fields = "sheets(data(rowData(values(formattedValue,effectiveFormat(backgroundColor,textFormat(foregroundColor))))))";
      const r = await sheetsApi(`${id}?includeGridData=true&ranges=${encodeURIComponent("'" + title.replace(/'/g, "''") + "'")}&fields=${encodeURIComponent(fields)}`);
      if (r) {
        const rd = ((((r.sheets || [])[0] || {}).data || [])[0] || {}).rowData || [];
        const out = { at: Date.now(), rows: rd.map((rw) => (rw.values || []).map((v) => String(v.formattedValue ?? ""))), colors: rd.map((rw) => (rw.values || []).map((v) => cellColor(v.effectiveFormat))) };
        _sheetCache[k] = out; return out;
      }
    } catch (e) { noteApiOff(e); if (![400, 401, 403, 404].includes(e.status)) throw e; }
  }
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`, { redirect: "follow" });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok || !/csv|text\/plain/i.test(ct)) { const e = new Error("private"); e.private = true; throw e; }
  const out = { at: Date.now(), rows: parseCSV(await r.text()), colors: null }; _sheetCache[k] = out; return out;
}
const SALE_RE = /contrato\s+(fechado|assinado|ganho)|neg[oó]cio\s+fechado|\bfechou\b|\bfechamos\b|venda\s+(fechada|realizada|confirmada)|proposta\s+aprovada|\bganh(ou|amos)\b|cliente\s+fechou|fechad[oa]\s+com/i;
function saleInText(t) { const m = SALE_RE.exec(String(t || "")); if (!m) return false; const before = String(t).slice(Math.max(0, m.index - 16), m.index); return !/\b(n[aã]o|nunca|ainda\s+n[aã]o|sem)\s+(\w+\s+){0,2}$/i.test(before); }
function parseBRL(v) { let t = String(v || "").replace(/[^\d.,-]/g, ""); if (!t) return 0; if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", "."); else if (t.includes(",")) t = t.replace(",", "."); else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, ""); const n = parseFloat(t); return Number.isFinite(n) ? n : 0; }
function mapLeadTab(rows, colors) {
  const hdr = (rows[0] || []).map((h) => norm(h));
  const body = rows.slice(1).map((r, i) => ({ r, cc: colors ? colors[i + 1] || [] : null })).filter((x) => x.r.some((c) => String(c).trim()));
  const find = (...res) => { for (const re of res) { const i = hdr.findIndex((h) => re.test(h)); if (i >= 0) return i; } return -1; };
  const filled = (i) => body.filter((x) => String(x.r[i] || "").trim()).length;
  const mqlCands = hdr.map((h, i) => (/qualificad|^mql/.test(h) && !/icp/.test(h) ? i : -1)).filter((i) => i >= 0).sort((a, b) => filled(b) - filled(a));
  const col = {
    date: find(/^data$/, /^data\b/, /^created[ _]?(date|at)?$/, /^date$/, /(cadastro|captac|entrada|criacao).*(data|date)/, /data.*(cadastro|entrada|lead)/), name: find(/^nome$/, /^nome\b(?!.*empresa)/), last: find(/^sobrenome/),
    company: find(/^(nome da )?empresa$/, /^empresa/), role: find(/^cargo/), campaign: find(/^campanha/), creative: find(/^criativo/, /^id copy/), source: find(/^origem/),
    icp: find(/dentro do icp/), profile: find(/dentro ou fora/, /fora do perfil|dentro do perfil/), mql: mqlCands[0] ?? -1, meeting: find(/agendou reuni/, /reuniao/), sql: find(/^sql/, /\bsql\b/), won: find(/^venda\b/, /^fechou/, /contrato fechado/),
    value: find(/valor.*(proposta|aprovad|venda|fechad)/, /^valor/), status: find(/^status/), contacted: find(/retornou|conseguiu contato/), notes: find(/^observ/), lost: find(/motivo de perda/),
  };
  const g = (r, i) => (i >= 0 ? String(r[i] || "").trim() : "");
  const leads = body.map(({ r, cc }) => {
    // cores: a linha inteira (maioria das células coloridas) ou só algumas células (ex.: cargo em vermelho)
    let rowColor = "", cell = {};
    if (cc) {
      const counts = {}; let nonEmpty = 0;
      cc.forEach((k, i) => { if (String(r[i] || "").trim()) nonEmpty++; if (k) counts[k] = (counts[k] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= Math.max(3, Math.ceil(nonEmpty * 0.5))) rowColor = top[0];
      const at = (i) => (i >= 0 ? cc[i] || "" : "");
      cell = { name: at(col.name), role: at(col.role), company: at(col.company), mql: at(col.mql), status: at(col.status) };
    }
    const pv = norm(g(r, col.profile)); const profile = pv.startsWith("dentro") ? "sim" : pv.startsWith("fora") ? "nao" : "";
    const explicit0 = yesNo(g(r, col.mql));
    const explicit = explicit0 || (profile === "nao" ? "nao" : ""); // "Fora do perfil" na coluna de perfil = não qualificado
    const colorDecision = (k) => (k === "green" ? "sim" : k === "red" ? "nao" : "");
    const byColor = colorDecision(cell.mql) || colorDecision(rowColor) || colorDecision(cell.name) || colorDecision(cell.company) || (cell.role === "red" ? "nao" : "");
    const mql = explicit === "sim" || explicit === "nao" ? explicit : byColor || explicit;
    const mqlSrc = (explicit === "sim" || explicit === "nao") ? "coluna" : byColor ? "cor" : explicit ? "coluna" : "";
    const notes = g(r, col.notes), status = g(r, col.status);
    // venda: coluna "Venda", valor aprovado ou "contrato fechado" etc. nas observações/status
    const wonCol = yesNo(g(r, col.won)); const valor = parseBRL(g(r, col.value));
    const saleTxt = saleInText(notes) || saleInText(status) || saleInText(g(r, col.lost));
    const sale = wonCol === "sim" || valor > 0 || saleTxt ? "sim" : "";
    return {
      date: parseLeadDate(g(r, col.date)), name: [g(r, col.name), g(r, col.last)].filter(Boolean).join(" "), company: g(r, col.company), role: g(r, col.role),
      campaign: g(r, col.campaign), creative: g(r, col.creative) || g(r, col.source), icp: yesNo(g(r, col.icp)) || profile, mql, mqlSrc, roleOut: cell.role === "red", rowColor,
      meeting: yesNo(g(r, col.meeting)), sql: yesNo(g(r, col.sql)), sale, saleValue: valor, saleSrc: wonCol === "sim" || valor > 0 ? "coluna" : saleTxt ? "obs" : "",
      status, contacted: yesNo(g(r, col.contacted)), notes, lost: g(r, col.lost),
    };
  }).filter((l) => l.name || l.company);
  const isLeads = col.date >= 0 && (col.name >= 0 || col.company >= 0) && leads.length > 0; // abas de palavras-chave, cópias etc. ficam de fora
  return { isLeads, leads, has: { icp: col.icp >= 0 || col.profile >= 0, mql: col.mql >= 0 || col.profile >= 0, meeting: col.meeting >= 0, sql: col.sql >= 0, company: col.company >= 0, notes: col.notes >= 0, status: col.status >= 0, campaign: col.campaign >= 0, sale: col.won >= 0 || col.value >= 0, colors: !!colors } };
}
ipcMain.handle("leads:get", async (_e, { key, start, end }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key); if (!c) throw new Error("cliente não encontrado");
  _apiOff = null;
  let found; try { found = await findSheets(c, st.settings); } catch (e) { return { ok: false, reason: "Não consegui ler o Trello: " + e.message }; }
  if (!found.length) return { ok: false, needSheet: true, reason: 'Não achei planilhas na lista "Links Úteis" deste cliente.' };
  const sheets = await pool(found, 3, async (f) => {
    const url = `https://docs.google.com/spreadsheets/d/${f.id}/edit`;
    try {
      const tabsAll = await sheetTabs(f.id);
      const out = await pool(tabsAll, 3, async (t) => {
        const sr = await sheetRows(f.id, t.gid, t.title);
        const { leads, has, isLeads } = mapLeadTab(sr.rows, sr.colors);
        if (!isLeads) return { __skip: true, name: t.name, headers: (sr.rows[0] || []).map((h) => String(h).trim()).filter(Boolean).slice(0, 14), rows: sr.rows.length };
        const inP = leads.filter((l) => l.date && l.date >= start && l.date <= end).sort((a, b) => b.date.localeCompare(a.date));
        const dated = leads.map((l) => l.date).filter(Boolean).sort();
        const stats = { rowColor: leads.filter((l) => l.rowColor).length, colorMql: leads.filter((l) => l.mqlSrc === "cor" && l.mql === "sim").length, colorOut: leads.filter((l) => l.mqlSrc === "cor" && l.mql === "nao").length, roleOut: leads.filter((l) => l.roleOut).length, sales: leads.filter((l) => l.sale === "sim").length, explicitMql: leads.filter((l) => l.mqlSrc === "coluna" && l.mql).length };
        return { name: t.name, gid: t.gid, total: leads.length, noDate: leads.filter((l) => !l.date).length, lastDate: dated.length ? dated[dated.length - 1] : null, leads: inP, has, stats };
      });
      const bad = out.find((x) => x && x.__error);
      const skippedTabs = out.filter((x) => x && x.__skip); const leadOut = out.filter((x) => x && !x.__skip && !x.__error);
      if (bad) { if (bad.__error === "private") throw Object.assign(new Error("private"), { private: true }); return { id: f.id, label: f.label, url, error: "Não consegui ler uma das abas: " + bad.__error }; }
      return { id: f.id, label: f.label, docTitle: tabsAll.docTitle || "", url, tabs: leadOut, skippedTabs, noLeadTabs: !leadOut.length };
    } catch (e) {
      if (e.private) return { id: f.id, label: f.label, url, private: true, error: S().googleSheetsRefreshToken ? "Sua conta do Google não tem acesso a esta planilha." : "Esta planilha é privada: conecte sua conta do Google para o app poder lê-la." };
      return { id: f.id, label: f.label, url, error: "Não consegui ler: " + e.message };
    }
  });
  // rótulos repetidos: usa o título da própria planilha
  const labels = sheets.map((x) => x.label); sheets.forEach((x) => { if (labels.filter((l) => l === x.label).length > 1 && x.docTitle) x.label = x.docTitle; });
  const good = sheets.filter((x) => x.tabs && x.tabs.length);
  if (!good.length) {
    const first = sheets[0];
    return { ok: false, private: sheets.some((x) => x.private), needSheet: !sheets.some((x) => x.error), apiOff: _apiOff, sheetUrl: first.url, reason: first.error || "Essas planilhas não têm abas de leads (preciso de colunas de data e nome). Se for outra planilha, cole o link certo.", sheets };
  }
  return { ok: true, sheets: sheets.filter((x) => x.tabs && x.tabs.length), skipped: sheets.filter((x) => x.noLeadTabs || x.error).map((x) => ({ label: x.label, url: x.url, error: x.error || "sem abas de leads" })), apiOff: _apiOff, fetchedAt: new Date().toISOString(), viaApi: !!S().googleSheetsRefreshToken };
});
ipcMain.handle("leads:setSheet", (_e, { key, url }) => {
  const id = sheetIdFrom(url) || (/^[a-zA-Z0-9_-]{25,}$/.test(String(url || "").trim()) ? String(url).trim() : null);
  if (!id) throw new Error("Esse não parece um link de planilha do Google.");
  const st = readStore(); const c = st.clients.find((x) => x.key === key); if (!c) throw new Error("cliente não encontrado");
  c.leadsSheetId = id; writeStore(st); return { ok: true };
});
ipcMain.handle("clients:setTrello", (_e, { key, boardId, boardName, url }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key); if (!c) throw new Error("cliente não encontrado");
  Object.assign(c, { trelloBoardId: boardId, trelloBoardName: boardName, trelloUrl: url, trelloLocked: true }); writeStore(st); return c;
});
ipcMain.handle("clients:setActive", (_e, { key, active }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key); if (!c) throw new Error("cliente não encontrado");
  c.active = !!active;
  if (c.vaultFolder) { try { c.vaultSynced = writeVaultActive(c.vaultFolder, c.active); } catch (e) { throw new Error("Não consegui gravar no clientes.json do cofre: " + e.message); } }
  writeStore(st); return c;
});
ipcMain.handle("clients:addFromTrello", async (_e, { boardId, boardName, url }) => {
  const st = readStore();
  if (st.clients.some((c) => c.trelloBoardId === boardId)) throw new Error("Esse board já está ligado a um cliente da carteira.");
  const c = { key: "t:" + boardId, name: boardName, trelloBoardId: boardId, trelloBoardName: boardName, trelloUrl: url, trelloLocked: true, active: true };
  try { const proj = bestProject(boardName, [], await reporteiProjects()); if (proj) { Object.assign(c, { reporteiId: proj.id, reporteiName: proj.name }); await linkAccounts(c); } } catch {}
  st.clients = [...st.clients, c].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")); writeStore(st); return c;
});
ipcMain.handle("clients:add", async (_e, { projectId, projectName }) => {
  const st = readStore();
  const c = { key: "r:" + projectId, name: projectName, reporteiId: projectId, reporteiName: projectName, reporteiLocked: true };
  await linkAccounts(c);
  st.clients = [...st.clients.filter((x) => x.key !== c.key), c].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  writeStore(st); return c;
});
ipcMain.handle("clients:setProject", async (_e, { key, projectId, projectName }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key);
  if (!c) throw new Error("cliente não encontrado");
  Object.assign(c, { reporteiId: projectId, reporteiName: projectName, reporteiLocked: true });
  await linkAccounts(c); writeStore(st); return c;
});
ipcMain.handle("clients:setAccounts", (_e, { key, meta, google, linkedin }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key);
  if (!c) throw new Error("cliente não encontrado");
  const clean = (s) => uniq(String(s || "").split(/[\s,;]+/));
  if (meta != null) c.meta = clean(meta).map((id) => (id.startsWith("act_") ? id : "act_" + id));
  if (google != null) c.google = clean(google).map((id) => id.replace(/-/g, ""));
  if (linkedin != null) c.linkedin = clean(linkedin);
  writeStore(st); return c;
});

/* ---------------------------------------------------------- */
/* META                                                        */
/* ---------------------------------------------------------- */
async function graphAll(url, maxPages = 15) {
  const out = []; let next = url, n = 0;
  while (next && n++ < maxPages) { const r = await httpJson(next); out.push(...(r.data || [])); next = r.paging && r.paging.next; }
  return out;
}
// tipo da campanha: "engage" (engajamento, alcance, vídeo, seguidores) ou "result" (leads, vendas, tráfego)
const ENGAGE_OBJ = /ENGAGEMENT|AWARENESS|VIDEO_VIEWS|PAGE_LIKES|REACH|BRAND/;
const ENGAGE_OPT = /THRUPLAY|POST_ENGAGEMENT|VIDEO_VIEWS|PROFILE_VISIT|PAGE_LIKES|ENGAGED_USERS|REACH|TWO_SECOND/;
const ENGAGE_NAME = /engaj|alcance|reconhec|awareness|seguidor/i;
function metaActions(row) {
  const acts = row.actions || [];
  const a = (t) => { const x = acts.find((v) => v.action_type === t); return x ? Number(x.value) : null; };
  return {
    leads: a("lead") ?? a("onsite_conversion.lead_grouped") ?? a("offsite_conversion.fb_pixel_lead") ?? a("leadgen_grouped") ?? 0,
    purchases: a("omni_purchase") ?? a("purchase") ?? a("offsite_conversion.fb_pixel_purchase") ?? 0,
    conversations: a("onsite_conversion.messaging_conversation_started_7d") ?? 0,
    lpv: a("landing_page_view") ?? a("omni_landing_page_view") ?? 0,
    videoViews: a("video_view") ?? 0,
    engagements: a("post_engagement") ?? 0, reactions: a("post_reaction") ?? 0, comments: a("comment") ?? 0, shares: a("post") ?? 0,
    saves: a("onsite_conversion.post_save") ?? 0, pageLikes: a("like") ?? 0, video3s: a("video_view") ?? 0,
  };
}
function metaMetrics(row) {
  if (!row) return null;
  const n = (x) => (x == null || x === "" ? 0 : Number(x));
  const tp = (row.video_thruplay_watched_actions || [])[0];
  const m = { spend: n(row.spend), impressions: n(row.impressions), reach: n(row.reach), frequency: row.frequency != null ? Number(row.frequency) : null, linkClicks: n(row.inline_link_clicks), clicks: n(row.clicks), thruplay: tp ? Number(tp.value) : 0, ...metaActions(row) };
  const rv = (row.action_values || []).find((v) => v.action_type === "omni_purchase" || v.action_type === "purchase");
  m.revenue = rv ? Number(rv.value) : 0;
  return m;
}
function sumMetrics(list) {
  const t = {}; list.filter(Boolean).forEach((m) => Object.entries(m).forEach(([k, v]) => { if (typeof v === "number" && k !== "frequency") t[k] = (t[k] || 0) + v; }));
  return t;
}
function parseCreative(cr) {
  cr = cr || {};
  const oss = cr.object_story_spec || {}; const ld = oss.link_data || {}; const vd = oss.video_data || {}; const afs = cr.asset_feed_spec || {};
  const bodies = uniq([cr.body, ld.message, vd.message, ...(afs.bodies || []).map((b) => b.text)]).map((s) => s.trim());
  const titles = uniq([cr.title, ld.name, vd.title, ...(afs.titles || []).map((t) => t.text)]).map((s) => s.trim());
  const descriptions = uniq([ld.description, vd.link_description, ...(afs.descriptions || []).map((d) => d.text)]).map((s) => s.trim()).filter(Boolean);
  const ctaObj = ld.call_to_action || vd.call_to_action || {};
  const cta = ctaObj.type || cr.call_to_action_type || (afs.call_to_action_types || [])[0] || null;
  const link = ld.link || (ctaObj.value && ctaObj.value.link && !/fb\.me/.test(ctaObj.value.link) ? ctaObj.value.link : null) || ((afs.link_urls || [])[0] || {}).website_url || cr.link_url || null;
  const leadForm = !!(ctaObj.value && ctaObj.value.lead_gen_form_id);
  const carousel = (ld.child_attachments || []).map((c) => ({ image: c.picture || c.image_url || null, title: c.name || "", description: c.description || "", link: c.link || null, videoId: c.video_id || null }));
  const feedVideos = (afs.videos || []).map((v) => ({ videoId: v.video_id, thumb: v.thumbnail_url || null }));
  const feedImages = (afs.images || []).map((i) => i.url).filter(Boolean);
  // o video_id do post (video_data) é o que libera o arquivo; o do criativo às vezes é um ID interno sem "source"
  const videoIds = uniq([vd.video_id, ...feedVideos.map((v) => v.videoId), cr.video_id]);
  const videoId = videoIds[0] || null;
  const type = carousel.length > 1 ? "carousel" : videoId ? "video" : "image";
  const image = cr.image_url || ld.picture || vd.image_url || feedImages[0] || cr.thumbnail_url || null;
  const postId = cr.effective_object_story_id || null;
  return {
    type, image, thumb: cr.thumbnail_url || image, videoId, videoIds, carousel, feedVideos, feedImages,
    bodies, titles, descriptions, cta, link, leadForm, dynamic: !!(afs.bodies || afs.images || afs.videos),
    instagram: cr.instagram_permalink_url || null, facebook: postId ? `https://www.facebook.com/${postId}` : null,
  };
}
async function metaTree(accountId, start, end) {
  const tok = encodeURIComponent(S().metaToken);
  const act = String(accountId).startsWith("act_") ? accountId : "act_" + accountId;
  // "ativo" = está veiculando ou vai veicular: inclui os com alerta e em análise
  const active = encodeURIComponent(JSON.stringify(["ACTIVE", "WITH_ISSUES", "IN_PROCESS", "PENDING_REVIEW"]));
  const tr = encodeURIComponent(JSON.stringify({ since: start, until: end }));
  const insFields = "campaign_id,adset_id,ad_id,spend,impressions,reach,frequency,inline_link_clicks,clicks,actions,action_values,video_thruplay_watched_actions";
  const ins = (level) => graphAll(`${GRAPH}/${act}/insights?level=${level}&fields=${insFields}&time_range=${tr}&limit=500&access_token=${tok}`);
  const crFields = "creative.thumbnail_width(1080).thumbnail_height(1080){id,name,object_type,body,title,image_url,thumbnail_url,video_id,call_to_action_type,link_url,object_story_spec,asset_feed_spec,instagram_permalink_url,effective_object_story_id}";
  const adsetFields = `id,name,campaign_id,effective_status,daily_budget,lifetime_budget,optimization_goal,destination_type,targeting{age_min,age_max,genders,geo_locations{countries,regions,cities},flexible_spec,custom_audiences,excluded_custom_audiences,publisher_platforms,targeting_automation}`;
  const [info, camps, adsets, ads, iC, iS, iA] = await Promise.all([
    httpJson(`${GRAPH}/${act}?fields=name,currency,account_status,amount_spent&access_token=${tok}`).catch(() => ({})),
    graphAll(`${GRAPH}/${act}/campaigns?fields=id,name,objective,effective_status,daily_budget,lifetime_budget,start_time,bid_strategy&effective_status=${active}&limit=200&access_token=${tok}`),
    graphAll(`${GRAPH}/${act}/adsets?fields=${adsetFields}&effective_status=${active}&limit=300&access_token=${tok}`),
    graphAll(`${GRAPH}/${act}/ads?fields=id,name,adset_id,campaign_id,effective_status,created_time,${crFields}&effective_status=${active}&limit=150&access_token=${tok}`),
    ins("campaign"), ins("adset"), ins("ad"),
  ]);
  // conjuntos e anúncios pausados que tiveram entrega no período, dentro de campanhas ativas (ex.: pausado no meio da semana)
  const campIds = new Set(camps.map((c) => c.id)); const haveS = new Set(adsets.map((x) => x.id)); const haveA = new Set(ads.map((x) => x.id));
  const missS = iS.filter((r) => Number(r.spend) > 0 && campIds.has(r.campaign_id) && !haveS.has(r.adset_id)).map((r) => r.adset_id);
  const missA = iA.filter((r) => Number(r.spend) > 0 && campIds.has(r.campaign_id) && !haveA.has(r.ad_id)).map((r) => r.ad_id);
  const byIds = async (ids, fields) => { const out = []; for (let i = 0; i < ids.length; i += 40) { const r = await httpJson(`${GRAPH}/?ids=${ids.slice(i, i + 40).join(",")}&fields=${encodeURIComponent(fields)}&access_token=${tok}`).catch(() => ({})); out.push(...Object.values(r)); } return out; };
  const [extraS, extraA] = await Promise.all([byIds(missS, adsetFields), byIds(missA, `id,name,adset_id,campaign_id,effective_status,created_time,${crFields}`)]);
  adsets.push(...extraS); ads.push(...extraA);
  const by = (arr, k) => Object.fromEntries(arr.map((r) => [r[k], r]));
  const mC = by(iC, "campaign_id"), mS = by(iS, "adset_id"), mA = by(iA, "ad_id");
  const campaigns = camps.map((c) => {
    const sets = adsets.filter((s) => s.campaign_id === c.id).map((s) => {
      const t = s.targeting || {};
      const interests = []; (t.flexible_spec || []).forEach((f) => Object.values(f).forEach((arr) => (Array.isArray(arr) ? arr : []).forEach((x) => x && x.name && interests.push(x.name))));
      const geo = t.geo_locations || {};
      return {
        id: s.id, name: s.name, status: s.effective_status, optimization: s.optimization_goal, destination: s.destination_type,
        budget: s.daily_budget ? { daily: s.daily_budget / 100 } : s.lifetime_budget ? { lifetime: s.lifetime_budget / 100 } : null,
        targeting: {
          age: t.age_min ? `${t.age_min}–${t.age_max || "65+"}` : null,
          geo: uniq([...(geo.countries || []), ...(geo.regions || []).map((r) => r.name), ...(geo.cities || []).map((r) => r.name)]).slice(0, 8),
          interests: uniq(interests).slice(0, 14),
          audiences: (t.custom_audiences || []).map((a) => a.name).slice(0, 8),
          excluded: (t.excluded_custom_audiences || []).map((a) => a.name).slice(0, 6),
          advantage: !!(t.targeting_automation && t.targeting_automation.advantage_audience),
          platforms: t.publisher_platforms || null,
        },
        metrics: metaMetrics(mS[s.id]),
        ads: ads.filter((a) => a.adset_id === s.id).map((a) => ({ id: a.id, name: a.name, status: a.effective_status, created: a.created_time, creative: parseCreative(a.creative), metrics: metaMetrics(mA[a.id]) })),
      };
    });
    // destino do lead: formulário nativo (benchmark 40%) ou site/LP (10%)
    sets.forEach((s) => { s.formType = s.destination === "ON_AD" || s.ads.some((a) => a.creative.leadForm) || /form|nativo/i.test(s.name) ? "native" : "site"; });
    const spendBy = (t) => sets.filter((s) => s.formType === t).reduce((n, s) => n + ((s.metrics || {}).spend || 0) + 0.001, 0);
    return {
      id: c.id, name: c.name, status: c.effective_status, objective: c.objective, start: c.start_time,
      kind: ENGAGE_OBJ.test(c.objective || "") || ENGAGE_NAME.test(c.name) || (sets.length > 0 && sets.every((x) => ENGAGE_OPT.test(x.optimization || ""))) ? "engage" : "result",
      formType: !sets.length ? (/form|nativo/i.test(c.name) ? "native" : "site") : spendBy("native") >= spendBy("site") ? "native" : "site",
      formMixed: sets.some((s) => s.formType === "native") && sets.some((s) => s.formType === "site"),
      budget: c.daily_budget ? { daily: c.daily_budget / 100 } : c.lifetime_budget ? { lifetime: c.lifetime_budget / 100 } : null,
      metrics: metaMetrics(mC[c.id]) || sumMetrics(sets.map((s) => s.metrics)), sets,
    };
  });
  return { accountId: act, accountName: info.name || act, currency: info.currency || "BRL", campaigns };
}
// vídeo do criativo: tenta cada ID até achar o arquivo; se nenhum liberar, devolve a prévia oficial do anúncio
ipcMain.handle("meta:video", async (_e, { ids, adId }) => {
  const tok = encodeURIComponent(S().metaToken); let permalink = null, picture = null;
  for (const id of ids || []) {
    try {
      const r = await httpJson(`${GRAPH}/${id}?fields=source,picture,permalink_url&access_token=${tok}`);
      if (r.permalink_url) permalink = "https://www.facebook.com" + r.permalink_url;
      if (r.picture) picture = r.picture;
      if (r.source) return { source: r.source, picture: r.picture || null, permalink };
    } catch {}
  }
  if (adId) {
    try {
      const p = await httpJson(`${GRAPH}/${adId}/previews?ad_format=MOBILE_FEED_STANDARD&access_token=${tok}`);
      const m = /src="([^"]+)"/.exec(((p.data || [])[0] || {}).body || "");
      if (m) return { preview: m[1].replace(/&amp;/g, "&"), picture, permalink };
    } catch {}
  }
  return { source: null, picture, permalink };
});
ipcMain.handle("meta:tokenInfo", async () => {
  const s = S(); if (!s.metaToken) return { ok: false, msg: "sem token" };
  try {
    const r = await httpJson(`${GRAPH}/debug_token?input_token=${encodeURIComponent(s.metaToken)}&access_token=${encodeURIComponent(s.metaToken)}`);
    const d = r.data || {}; const st = readStore(); st.settings.metaExpiresAt = d.expires_at || 0; writeStore(st);
    return { ok: !!d.is_valid, expiresAt: d.expires_at || 0, app: d.application, scopes: d.scopes || [] };
  } catch (e) { return { ok: false, msg: e.message }; }
});
ipcMain.handle("meta:extendToken", async () => {
  const s = S();
  if (!s.metaAppId || !s.metaAppSecret) throw new Error("Preencha o App ID e o App Secret do app do Meta (developers.facebook.com → seu app → Configurações → Básico).");
  const r = await httpJson(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(s.metaAppId)}&client_secret=${encodeURIComponent(s.metaAppSecret)}&fb_exchange_token=${encodeURIComponent(s.metaToken)}`);
  if (!r.access_token) throw new Error("O Meta não devolveu um token novo.");
  const st = readStore(); st.settings.metaToken = r.access_token;
  st.settings.metaExpiresAt = r.expires_in ? Math.floor(Date.now() / 1000) + r.expires_in : 0; writeStore(st);
  return { ok: true, days: r.expires_in ? Math.round(r.expires_in / 86400) : null };
});

/* ---------------------------------------------------------- */
/* GOOGLE ADS                                                  */
/* ---------------------------------------------------------- */
let _gat = null;
async function gadsHeaders() {
  const s = S();
  if (!s.googleAdsDevToken || !s.googleAdsRefreshToken) throw new Error("Google Ads não conectado. Importe as chaves em Configurações.");
  if (!_gat || _gat.exp < Date.now()) {
    const r = await httpJson("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: s.googleAdsClientId, client_secret: s.googleAdsClientSecret, refresh_token: s.googleAdsRefreshToken, grant_type: "refresh_token" }) });
    _gat = { tok: r.access_token, exp: Date.now() + ((r.expires_in || 3600) - 120) * 1000 };
  }
  const h = { Authorization: `Bearer ${_gat.tok}`, "developer-token": s.googleAdsDevToken, "Content-Type": "application/json" };
  if (s.googleAdsLoginCustomerId) h["login-customer-id"] = String(s.googleAdsLoginCustomerId).replace(/-/g, "");
  return h;
}
async function gq(cid, query) {
  const s = S(); const saved = s.googleAdsApiVersion;
  const order = saved ? [saved, ...GADS_VERSIONS.filter((v) => v !== saved)] : GADS_VERSIONS;
  const headers = await gadsHeaders(); let last;
  for (const v of order) {
    try {
      const out = []; let pageToken = null, n = 0;
      do {
        const r = await httpJson(`https://googleads.googleapis.com/${v}/customers/${cid}/googleAds:search`, { method: "POST", headers, body: JSON.stringify(pageToken ? { query, pageToken } : { query }) });
        out.push(...(r.results || [])); pageToken = r.nextPageToken;
      } while (pageToken && ++n < 10);
      if (v !== saved) { const st = readStore(); st.settings.googleAdsApiVersion = v; writeStore(st); }
      return out;
    } catch (e) {
      last = e;
      if (!(e.status === 404 || /deprecat|blocked|unsupported version|not found/i.test(e.message))) throw e;
    }
  }
  throw last;
}
const gm = (m) => {
  m = m || {};
  return { spend: Number(m.costMicros || 0) / 1e6, impressions: Number(m.impressions || 0), clicks: Number(m.clicks || 0), conversions: Number(m.conversions || 0), convValue: Number(m.conversionsValue || 0),
    engagements: Number(m.engagements || 0), interactions: Number(m.interactions || 0), videoViews: Number(m.videoTrueviewViews || 0),
    impressionShare: m.searchImpressionShare != null ? Number(m.searchImpressionShare) : null, lostBudget: m.searchBudgetLostImpressionShare != null ? Number(m.searchBudgetLostImpressionShare) : null, lostRank: m.searchRankLostImpressionShare != null ? Number(m.searchRankLostImpressionShare) : null };
};
async function googleTree(customerId, start, end) {
  const cid = String(customerId).replace(/-/g, "");
  const D = `segments.date BETWEEN '${start}' AND '${end}'`;
  const M0 = "metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value";
  const M = M0 + ", metrics.engagements, metrics.interactions, metrics.video_trueview_views"; // engajamento e vídeo (campanhas de vídeo/YouTube)
  const campStructQ = `SELECT customer.descriptive_name, customer.currency_code, campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.primary_status, campaign_budget.amount_micros FROM campaign WHERE campaign.status = 'ENABLED'`;
  let campMetricsQ = `SELECT campaign.id, ${M}, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM campaign WHERE campaign.status = 'ENABLED' AND ${D}`;
  const agQ = `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, campaign.id FROM ad_group WHERE ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED'`;
  const agMQ = `SELECT ad_group.id, ${M} FROM ad_group WHERE ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED' AND ${D}`;
  const adF = "ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2, ad_group_ad.ad.responsive_display_ad.headlines, ad_group_ad.ad.responsive_display_ad.long_headline, ad_group_ad.ad.responsive_display_ad.descriptions, ad_group_ad.ad.responsive_display_ad.marketing_images, ad_group_ad.ad.responsive_display_ad.square_marketing_images, ad_group_ad.ad.responsive_display_ad.business_name, ad_group_ad.ad.image_ad.image_url, ad_group_ad.ad.video_responsive_ad.videos, ad_group_ad.ad.video_responsive_ad.headlines, ad_group_ad.ad.video_responsive_ad.long_headlines, ad_group_ad.ad.video_responsive_ad.descriptions, ad_group_ad.ad.demand_gen_multi_asset_ad.headlines, ad_group_ad.ad.demand_gen_multi_asset_ad.descriptions, ad_group_ad.ad.demand_gen_multi_asset_ad.marketing_images, ad_group_ad.ad.demand_gen_video_responsive_ad.videos, ad_group_ad.ad.demand_gen_video_responsive_ad.headlines, ad_group_ad.ad.demand_gen_video_responsive_ad.descriptions, ad_group_ad.ad_strength, ad_group_ad.policy_summary.approval_status, ad_group_ad.status, ad_group.id";
  const adQ = `SELECT ${adF} FROM ad_group_ad WHERE ad_group_ad.status = 'ENABLED' AND ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED'`;
  const adMQ = `SELECT ad_group_ad.ad.id, ad_group.id, ${M} FROM ad_group_ad WHERE ad_group_ad.status = 'ENABLED' AND campaign.status = 'ENABLED' AND ${D}`;
  const agrpQ = `SELECT asset_group.id, asset_group.name, asset_group.status, asset_group.ad_strength, asset_group.final_urls, campaign.id FROM asset_group WHERE asset_group.status = 'ENABLED' AND campaign.status = 'ENABLED'`;
  const agrpMQ = `SELECT asset_group.id, ${M0} FROM asset_group WHERE asset_group.status = 'ENABLED' AND campaign.status = 'ENABLED' AND ${D}`;
  const agaQ = `SELECT asset_group.id, asset_group_asset.field_type, asset.text_asset.text, asset.image_asset.full_size.url, asset.youtube_video_asset.youtube_video_id, asset.youtube_video_asset.youtube_video_title FROM asset_group_asset WHERE asset_group_asset.status = 'ENABLED' AND campaign.status = 'ENABLED'`;
  const kwQ = `SELECT ad_group.id, ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.negative, ad_group_criterion.quality_info.quality_score FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status = 'ENABLED' AND ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED'`;
  const kwMQ = `SELECT ad_group.id, ad_group_criterion.criterion_id, ${M0} FROM keyword_view WHERE ad_group_criterion.status = 'ENABLED' AND ad_group.status = 'ENABLED' AND campaign.status = 'ENABLED' AND ${D}`;
  const soft = (p) => p.catch((e) => { console.warn("[google]", e.message); return []; });
  // se a conta/nível não aceitar os campos de engajamento, cai para as métricas básicas
  const withFb = (q1) => gq(cid, q1).catch(() => soft(gq(cid, q1.split(M).join(M0))));
  let campM;
  try { campM = await gq(cid, campMetricsQ); } catch { campM = await withFb(`SELECT campaign.id, ${M} FROM campaign WHERE campaign.status = 'ENABLED' AND ${D}`); }
  const [campS, agS, agM, adS, adM, grpS, grpM, grpA, kwRows, kwMRows] = await Promise.all([
    gq(cid, campStructQ), soft(gq(cid, agQ)), withFb(agMQ), soft(gq(cid, adQ)), withFb(adMQ), soft(gq(cid, agrpQ)), soft(gq(cid, agrpMQ)), soft(gq(cid, agaQ)), soft(gq(cid, kwQ)), soft(gq(cid, kwMQ)),
  ]);
  // palavras-chave ativas por grupo de anúncios (positivas com métricas do período + negativas do grupo)
  const kwM = Object.fromEntries(kwMRows.map((r) => [r.adGroup.id + "~" + r.adGroupCriterion.criterionId, gm(r.metrics)]));
  const kwByGroup = {};
  kwRows.forEach((r) => {
    const c = r.adGroupCriterion || {}; const k = c.keyword || {}; if (!k.text) return;
    const g = (kwByGroup[r.adGroup.id] = kwByGroup[r.adGroup.id] || { keywords: [], negatives: [] });
    const item = { text: k.text, match: k.matchType, qs: c.qualityInfo && c.qualityInfo.qualityScore != null ? Number(c.qualityInfo.qualityScore) : null };
    if (c.negative) g.negatives.push(item); else g.keywords.push({ ...item, metrics: kwM[r.adGroup.id + "~" + c.criterionId] || gm(null) });
  });
  Object.values(kwByGroup).forEach((g) => g.keywords.sort((x, y) => y.metrics.impressions - x.metrics.impressions || x.text.localeCompare(y.text)));
  // resolve imagens/vídeos referenciados por resource name (Display / Demand Gen / Vídeo)
  const assetNames = new Set();
  const collect = (arr) => (arr || []).forEach((x) => x && x.asset && assetNames.add(x.asset));
  adS.forEach((r) => { const ad = (r.adGroupAd || {}).ad || {}; const rda = ad.responsiveDisplayAd || {}; const vra = ad.videoResponsiveAd || {}; const dg = ad.demandGenMultiAssetAd || {}; const dv = ad.demandGenVideoResponsiveAd || {};
    collect(rda.marketingImages); collect(rda.squareMarketingImages); collect(vra.videos); collect(dg.marketingImages); collect(dv.videos); });
  const assetMap = {};
  if (assetNames.size) {
    const names = [...assetNames].slice(0, 300).map((n) => `'${n}'`).join(",");
    const rows = await soft(gq(cid, `SELECT asset.resource_name, asset.image_asset.full_size.url, asset.youtube_video_asset.youtube_video_id, asset.youtube_video_asset.youtube_video_title FROM asset WHERE asset.resource_name IN (${names})`));
    rows.forEach((r) => { const a = r.asset || {}; assetMap[a.resourceName] = { image: a.imageAsset && a.imageAsset.fullSize && a.imageAsset.fullSize.url, youtube: a.youtubeVideoAsset && a.youtubeVideoAsset.youtubeVideoId, title: a.youtubeVideoAsset && a.youtubeVideoAsset.youtubeVideoTitle }; });
  }
  const txt = (arr) => (arr || []).map((h) => (typeof h === "string" ? h : h.text)).filter(Boolean);
  const res = (arr) => (arr || []).map((x) => assetMap[x.asset]).filter(Boolean);
  const mapM = (rows, f) => Object.fromEntries(rows.map((r) => [f(r), gm(r.metrics)]));
  const cM = mapM(campM, (r) => r.campaign.id), gM = mapM(agM, (r) => r.adGroup.id), aM = mapM(adM, (r) => r.adGroup.id + "~" + r.adGroupAd.ad.id), pM = mapM(grpM, (r) => r.assetGroup.id);
  const ads = adS.map((r) => {
    const a = r.adGroupAd || {}; const ad = a.ad || {};
    const rsa = ad.responsiveSearchAd, rda = ad.responsiveDisplayAd, vra = ad.videoResponsiveAd, dg = ad.demandGenMultiAssetAd, dv = ad.demandGenVideoResponsiveAd, img = ad.imageAd;
    const imgs = [...res(rda && rda.marketingImages), ...res(rda && rda.squareMarketingImages), ...res(dg && dg.marketingImages)].map((x) => x.image).filter(Boolean);
    const vids = [...res(vra && vra.videos), ...res(dv && dv.videos)].filter((x) => x.youtube);
    let kind = "search";
    if (rda || dg || img) kind = "display"; if (vra || dv) kind = "video";
    return {
      id: ad.id, adGroupId: (r.adGroup || {}).id, name: ad.name || null, type: ad.type, kind, status: a.status, strength: a.adStrength || null, approval: (a.policySummary || {}).approvalStatus || null,
      headlines: rsa ? txt(rsa.headlines) : uniq([...(rda ? [...txt(rda.headlines), rda.longHeadline && rda.longHeadline.text] : []), ...txt(vra && vra.headlines), ...txt(vra && vra.longHeadlines), ...txt(dg && dg.headlines), ...txt(dv && dv.headlines)]),
      descriptions: txt((rsa && rsa.descriptions) || (rda && rda.descriptions) || (vra && vra.descriptions) || (dg && dg.descriptions) || (dv && dv.descriptions)),
      path: rsa ? [rsa.path1, rsa.path2].filter(Boolean) : [], business: rda && rda.businessName,
      finalUrl: (ad.finalUrls || [])[0] || null, images: uniq([img && img.imageUrl, ...imgs]), videos: vids.map((v) => ({ youtube: v.youtube, title: v.title })),
      metrics: aM[(r.adGroup || {}).id + "~" + ad.id] || gm(null),
    };
  });
  const groupAssets = {};
  grpA.forEach((r) => {
    const id = r.assetGroup.id; const g = (groupAssets[id] = groupAssets[id] || { headlines: [], longHeadlines: [], descriptions: [], images: [], videos: [], business: null });
    const ft = (r.assetGroupAsset || {}).fieldType; const a = r.asset || {};
    const t = a.textAsset && a.textAsset.text; const im = a.imageAsset && a.imageAsset.fullSize && a.imageAsset.fullSize.url; const yt = a.youtubeVideoAsset && a.youtubeVideoAsset.youtubeVideoId;
    if (ft === "HEADLINE" && t) g.headlines.push(t); else if (ft === "LONG_HEADLINE" && t) g.longHeadlines.push(t); else if (ft === "DESCRIPTION" && t) g.descriptions.push(t);
    else if (ft === "BUSINESS_NAME" && t) g.business = t; else if (im) g.images.push(im); else if (yt) g.videos.push({ youtube: yt, title: a.youtubeVideoAsset.youtubeVideoTitle });
  });
  const info = (campS[0] || {}).customer || {};
  const campaigns = campS.map((r) => {
    const c = r.campaign; const type = c.advertisingChannelType;
    let sets;
    if (type === "PERFORMANCE_MAX") {
      sets = grpS.filter((g) => g.campaign.id === c.id).map((g) => {
        const A = groupAssets[g.assetGroup.id] || { headlines: [], descriptions: [], images: [], videos: [] };
        return { id: g.assetGroup.id, name: g.assetGroup.name, status: g.assetGroup.status, kind: "assetGroup", strength: g.assetGroup.adStrength, metrics: pM[g.assetGroup.id] || gm(null),
          ads: [{ id: "ag-" + g.assetGroup.id, name: "Recursos do grupo", kind: "pmax", type: "ASSET_GROUP", status: "ENABLED", strength: g.assetGroup.adStrength,
            headlines: uniq([...A.headlines, ...(A.longHeadlines || [])]), descriptions: uniq(A.descriptions), images: uniq(A.images), videos: A.videos, business: A.business, finalUrl: (g.assetGroup.finalUrls || [])[0] || null, path: [], metrics: pM[g.assetGroup.id] || gm(null) }] };
      });
    } else {
      sets = agS.filter((g) => g.campaign.id === c.id).map((g) => ({ id: g.adGroup.id, name: g.adGroup.name, status: g.adGroup.status, kind: "adGroup", type: g.adGroup.type, metrics: gM[g.adGroup.id] || gm(null), ads: ads.filter((a) => a.adGroupId === g.adGroup.id),
        keywords: (kwByGroup[g.adGroup.id] || {}).keywords || [], negatives: (kwByGroup[g.adGroup.id] || {}).negatives || [] }));
    }
    return { id: c.id, name: c.name, status: c.status, primaryStatus: c.primaryStatus, channel: type, bidding: c.biddingStrategyType,
      kind: type === "VIDEO" || ENGAGE_NAME.test(c.name) ? "engage" : "result",
      budget: r.campaignBudget && r.campaignBudget.amountMicros ? { daily: Number(r.campaignBudget.amountMicros) / 1e6 } : null,
      metrics: cM[c.id] || gm(null), sets };
  });
  return { accountId: cid, accountName: info.descriptiveName || cid, currency: info.currencyCode || "BRL", campaigns };
}

/* ---------------------------------------------------------- */
/* LINKEDIN                                                    */
/* ---------------------------------------------------------- */
// (a) API oficial, quando houver token: estrutura + copy de verdade dos anúncios
const LI_VER = "202509";
const liH = () => ({ Authorization: `Bearer ${S().linkedinToken}`, "LinkedIn-Version": LI_VER, "X-Restli-Protocol-Version": "2.0.0" });
const dParts = (d) => { const [y, m, dd] = d.split("-").map(Number); return `(year:${y},month:${m},day:${dd})`; };
async function linkedinApiTree(accountId, start, end) {
  const H = liH(); const A = `https://api.linkedin.com/rest/adAccounts/${accountId}`;
  const camps = (await httpJson(`${A}/adCampaigns?q=search&search=(status:(values:List(ACTIVE)))&pageSize=100`, { headers: H })).elements || [];
  const urns = camps.map((c) => encodeURIComponent(`urn:li:sponsoredCampaign:${c.id}`));
  let creatives = [];
  for (let i = 0; i < urns.length; i += 20) {
    const r = await httpJson(`${A}/creatives?q=criteria&campaigns=List(${urns.slice(i, i + 20).join(",")})&intendedStatuses=List(ACTIVE)&pageSize=100`, { headers: H }).catch(() => ({ elements: [] }));
    creatives.push(...(r.elements || []));
  }
  const fields = "impressions,clicks,costInLocalCurrency,oneClickLeads,oneClickLeadFormOpens,sends,opens,actionClicks,landingPageClicks,videoViews,videoCompletions,totalEngagements,reactions,comments,shares,follows,pivotValues";
  const an = async (pivot) => {
    const r = await httpJson(`https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=${pivot}&timeGranularity=ALL&dateRange=(start:${dParts(start)},end:${dParts(end)})&accounts=List(${encodeURIComponent("urn:li:sponsoredAccount:" + accountId)})&fields=${fields}`, { headers: H }).catch(() => ({ elements: [] }));
    const m = {}; (r.elements || []).forEach((e) => { const id = String((e.pivotValues || [])[0] || "").split(":").pop(); m[id] = liMetrics(e); }); return m;
  };
  const [mC, mCr] = await Promise.all([an("CAMPAIGN"), an("CREATIVE")]);
  // texto dos posts (copy), imagem e vídeo
  await pool(creatives, 6, async (cr) => {
    const ref = cr.content && cr.content.reference;
    cr._parsed = { bodies: [], titles: [], image: null, video: null, type: "image", link: null };
    if (!ref || !/urn:li:(share|ugcPost)/.test(ref)) { if (ref && /Conversation|InMail/i.test(ref)) cr._parsed.type = "message"; return; }
    const p = await httpJson(`https://api.linkedin.com/rest/posts/${encodeURIComponent(ref)}`, { headers: H });
    const P = cr._parsed; P.bodies = uniq([p.commentary]);
    const c = p.content || {};
    if (c.article) { P.titles = uniq([c.article.title]); P.link = c.article.source; P.image = null; if (c.article.thumbnail) P._img = c.article.thumbnail; }
    const media = c.media && c.media.id; if (media) P._img = media;
    if (c.multiImage) { P.type = "carousel"; P._multi = (c.multiImage.images || []).map((i) => i.id); }
    if (P._img && /image/.test(P._img)) { const im = await httpJson(`https://api.linkedin.com/rest/images/${encodeURIComponent(P._img)}`, { headers: H }).catch(() => ({})); P.image = im.downloadUrl || null; }
    if (P._img && /video/.test(P._img)) { P.type = "video"; const v = await httpJson(`https://api.linkedin.com/rest/videos/${encodeURIComponent(P._img)}`, { headers: H }).catch(() => ({})); P.video = v.downloadUrl || null; P.image = v.thumbnail || null; }
    if (c.media && c.media.title) P.titles = uniq([...P.titles, c.media.title]);
  });
  const grpList = (await httpJson(`${A}/adCampaignGroups?q=search&pageSize=100`, { headers: H }).catch(() => ({ elements: [] }))).elements || [];
  const grpName = {}; grpList.forEach((g) => { grpName[String(g.id)] = g.name; });
  const flat = camps.map((c) => ({
      id: String(c.id), name: c.name, status: c.status, objective: c.objectiveType, format: c.format || c.type,
      kind: /ENGAGEMENT|VIDEO|BRAND|AWARENESS/.test(c.objectiveType || "") || ENGAGE_NAME.test(c.name) ? "engage" : "result",
      budget: c.dailyBudget ? { daily: Number(c.dailyBudget.amount) } : c.totalBudget ? { lifetime: Number(c.totalBudget.amount) } : null,
      metrics: mC[String(c.id)] || null,
      sets: [{ id: "c" + c.id, name: "Anúncios da campanha", kind: "liCampaign", metrics: null,
        ads: creatives.filter((cr) => String(cr.campaign || "").endsWith(":" + c.id)).map((cr) => {
          const id = String(cr.id || "").split(":").pop();
          return { id, name: cr.name || (cr._parsed && cr._parsed.bodies[0] ? cr._parsed.bodies[0].slice(0, 60) : "Anúncio " + id), status: cr.intendedStatus, creative: { ...(cr._parsed || {}), link: (cr._parsed || {}).link }, metrics: mCr[id] || null };
        }) }],
      group: String(c.campaignGroup || "").split(":").pop(),
  }));
  // grupo de campanhas = "campanha"; campanha do LinkedIn = "público"; criativo = anúncio
  const by = {};
  flat.forEach((c) => { const k = (c.group || "_") + "|" + c.kind; (by[k] = by[k] || []).push(c); });
  const campaigns = Object.entries(by).map(([k, list]) => {
    const gid = k.split("|")[0];
    return { id: "g" + k.replace("|", "-"), name: grpName[gid] || "Campanhas sem grupo", status: "ACTIVE", kind: list[0].kind, metrics: sumMetrics(list.map((c) => c.metrics)),
      sets: list.map((c) => ({ id: "c" + c.id, name: c.name, status: c.status, kind: "liAudience", objective: c.objective, budget: c.budget, metrics: c.metrics, ads: c.sets[0].ads })) };
  });
  return { source: "api", accountId, campaigns };
}
function liMetrics(e) {
  const n = (v) => (v == null ? 0 : Number(v));
  return { spend: n(e.costInLocalCurrency), impressions: n(e.impressions), clicks: n(e.clicks), leads: n(e.oneClickLeads), formOpens: n(e.oneClickLeadFormOpens), sends: n(e.sends), opens: n(e.opens), actionClicks: n(e.actionClicks), lpClicks: n(e.landingPageClicks), videoViews: n(e.videoViews), videoCompletions: n(e.videoCompletions), engagements: n(e.totalEngagements), reactions: n(e.reactions), comments: n(e.comments), shares: n(e.shares), follows: n(e.follows) };
}
// (b) Reportei: campanhas + anúncios + mensagens, com os totais do funil
const LI_TOTALS = ["li_ads:impressions", "li_ads:clicks", "li_ads:cost", "li_ads:sends", "li_ads:opens", "li_ads:actionClicks", "li_ads:oneClickLeads", "li_ads:oneClickLeadFormOpens", "li_ads:landingPageClicks", "li_ads:total_engagements", "li_ads:videoViews", "li_ads:videoCompletions", "li_ads:reactions", "li_ads:comments", "li_ads:shares", "li_ads:follows"];
function tokens(s) { return norm(s).split(" ").filter((w) => w.length >= 4 && !/^\d+$/.test(w)); }
async function linkedinReporteiTree(integ, start, end) {
  const LI_EXTRA = ["oneClickLeads", "oneClickLeadFormOpens", "sends", "opens", "actionClicks", "landingPageClicks", "externalWebsiteConversions", "reactions", "comments", "shares", "follows", "videoViews", "videoCompletions", "videoStarts"];
  const d = await reporteiGet(integ.id, "linkedin_ads", start, end, [...LI_TOTALS, "li_ads:externalWebsiteConversions", "li_ads:featuredCampaigns", "li_ads:featuredCampaignGroups", "li_ads:posts", "li_ads:featuredSponsoredMessaging"],
    { "li_ads:featuredCampaigns": LI_EXTRA, "li_ads:posts": LI_EXTRA });
  const T = (k) => numOf(d["li_ads:" + k]);
  const totals = { spend: T("cost"), impressions: T("impressions"), clicks: T("clicks"), sends: T("sends"), opens: T("opens"), actionClicks: T("actionClicks"), leads: T("oneClickLeads"), formOpens: T("oneClickLeadFormOpens"), lpClicks: T("landingPageClicks"), engagements: T("total_engagements"), videoViews: T("videoViews"), videoCompletions: T("videoCompletions"), reactions: T("reactions"), comments: T("comments"), shares: T("shares"), follows: T("follows"), conversions: T("externalWebsiteConversions") };
  const n0 = (v) => Number(v || 0);
  const toM = (r) => ({ spend: n0(r.costInLocalCurrency || r.cost), impressions: n0(r.impressions), clicks: n0(r.clicks), engagements: n0(r.totalEngagements),
    leads: n0(r.oneClickLeads), formOpens: n0(r.oneClickLeadFormOpens), sends: n0(r.sends), opens: n0(r.opens), actionClicks: n0(r.actionClicks), lpClicks: n0(r.landingPageClicks), conversions: n0(r.externalWebsiteConversions),
    reactions: n0(r.reactions), comments: n0(r.comments), shares: n0(r.shares), follows: n0(r.follows), videoViews: n0(r.videoViews), videoCompletions: n0(r.videoCompletions), videoStarts: n0(r.videoStarts) });
  // engajamento: pelo nome, ou sem nenhum resultado de lead e com visualizações de vídeo
  const liKind = (name, m) => (!m.leads && !m.sends && !m.formOpens && (ENGAGE_NAME.test(name) || /visualiza[cç][aã]o|v[ií]deo/i.test(name) || m.videoViews > 0) ? "engage" : "result");
  const camps = rpTable(d["li_ads:featuredCampaigns"]).map((r) => { const metrics = toM(r); return { id: "rp-" + norm(r._name), name: r._name, metrics, kind: liKind(r._name, metrics) }; });
  const posts = rpTable(d["li_ads:posts"]).map((r) => ({ id: "post-" + norm(r._name) + (r.createdAt || ""), name: r._name, created: r.createdAt || null, creative: { type: r._image ? "image" : "text", image: r._image || null, bodies: [], titles: [] }, metrics: toM(r) }));
  const msgs = rpTable(d["li_ads:featuredSponsoredMessaging"]).map((r) => ({ id: "msg-" + norm(r._name), name: r._name, kind: "message", creative: { type: "message", bodies: [], titles: [] },
    metrics: { sends: Number(r.sends || 0), opens: Number(r.opens || 0), actionClicks: Number(r.actionClicks || 0), clicks: Number(r.clicks || 0), spend: r.costPerSends ? Number(r.costPerSends) * Number(r.sends || 0) : null } }));
  // mensagens (Conversation Ads) vêm por campanha: junta envios/aberturas/cliques na campanha de mesmo nome
  msgs.forEach((m) => { const c = camps.find((x) => norm(x.name) === norm(m.name)); if (c) { if (!c.metrics.sends) Object.assign(c.metrics, { sends: m.metrics.sends, opens: m.metrics.opens, actionClicks: m.metrics.actionClicks }); m._merged = true; } });
  // liga anúncio → campanha pelo nome (o Reportei não dá o vínculo)
  const withData = camps.filter((c) => c.metrics.impressions > 0 || c.metrics.spend > 0 || c.metrics.sends > 0 || c.metrics.videoViews > 0);
  const assign = {};
  posts.forEach((p) => {
    const tp = tokens(p.name); let best = null, sc = 0;
    withData.forEach((c) => { const tc = new Set(tokens(c.name)); const hit = tp.filter((w) => tc.has(w)).length; if (hit > sc) { sc = hit; best = c; } });
    const k = best && sc >= 1 ? best.id : withData.length === 1 ? withData[0].id : "_";
    (assign[k] = assign[k] || []).push(p);
  });
  // anúncios de vídeo sem nome de campanha vão para a única campanha de engajamento (o Reportei não informa o vínculo)
  const engCamps = withData.filter((c) => c.kind === "engage");
  if (engCamps.length === 1 && (assign._ || []).length) {
    const vid = assign._.filter((a) => (a.metrics.videoViews || 0) > 0 && !a.metrics.leads);
    if (vid.length) { assign[engCamps[0].id] = [...(assign[engCamps[0].id] || []), ...vid]; assign._ = assign._.filter((a) => !vid.includes(a)); if (!assign._.length) delete assign._; }
  }
  // anúncio sem nome de campanha cujo investimento é igual ao de uma campanha sem anúncios ligados: é dela
  (assign._ || []).slice().forEach((post) => {
    const cand = withData.filter((c) => !(assign[c.id] || []).length && Math.abs((c.metrics.spend || 0) - (post.metrics.spend || 0)) < 0.02 * Math.max(1, c.metrics.spend || 0));
    if (cand.length === 1) { assign[cand[0].id] = [post]; assign._ = assign._.filter((x) => x !== post); if (!assign._.length) delete assign._; }
  });
  // cada campanha do LinkedIn é um "público" (é nela que fica a segmentação); o grupo de campanhas é a "campanha"
  const audiences = withData.map((c) => ({ id: c.id, name: c.name, status: "ACTIVE", kind: c.kind, metrics: c.metrics, ads: assign[c.id] || [], guessedAds: true }));
  if ((assign._ || []).length) { const m = sumMetrics(assign._.map((a) => a.metrics)); audiences.push({ id: "rp-sem", name: "Anúncios sem público identificado", status: "ACTIVE", kind: liKind("", m), metrics: m, ads: assign._, orphan: true }); }
  const groups = rpTable(d["li_ads:featuredCampaignGroups"]).map((r) => ({ id: "rpg-" + norm(r._name), name: r._name, spend: n0(r.costInLocalCurrency), impressions: n0(r.impressions) }))
    .filter((g) => g.spend > 0 || g.impressions > 0);
  const campaigns = groupLiAudiences(audiences, groups);
  return { source: "reportei", accountId: integ.sourceId, accountName: integ.name, totals, campaigns, messages: msgs.filter((m) => m.metrics.sends > 0 && !m._merged), idle: camps.length - withData.length, idleLabel: "público" };
}
// Reportei não diz a que grupo cada campanha pertence: com 1 grupo vai tudo nele; com vários, liga pelo nome e depois pelo investimento que sobra
function groupLiAudiences(audiences, groups) {
  const real = audiences.filter((a) => !a.orphan), orphans = audiences.filter((a) => a.orphan);
  const by = {}; const put = (g, a) => { (by[g.id] = by[g.id] || { g, list: [] }).list.push(a); };
  let guessed = false;
  if (groups.length <= 1) { const g = groups[0] || { id: "rpg-todas", name: "Campanhas do período" }; real.forEach((a) => put(g, a)); }
  else {
    guessed = true; const left = {}; groups.forEach((g) => { left[g.id] = g.spend; });
    const rest = [];
    real.forEach((a) => {
      const ta = tokens(a.name); let best = null, sc = 0, tie = false;
      groups.forEach((g) => { const tg = new Set(tokens(g.name)); const hit = ta.filter((w) => tg.has(w)).length; if (hit > sc) { sc = hit; best = g; tie = false; } else if (hit && hit === sc) tie = true; });
      if (best && !tie) { put(best, a); left[best.id] -= a.metrics.spend || 0; } else rest.push(a);
    });
    rest.sort((x, y) => (y.metrics.spend || 0) - (x.metrics.spend || 0)).forEach((a) => {
      const sp = a.metrics.spend || 0;
      const fit = groups.filter((g) => left[g.id] >= sp - Math.max(1, 0.02 * sp)).sort((x, y) => left[x.id] - left[y.id])[0];
      const g = fit || { id: "rpg-outros", name: "Outros públicos" }; put(g, a); if (fit) left[fit.id] -= sp;
    });
  }
  const out = [];
  Object.values(by).forEach(({ g, list }) => {
    // grupo com públicos de resultado e de engajamento vira duas linhas (as colunas são diferentes)
    const res = list.filter((a) => a.kind !== "engage"), eng = list.filter((a) => a.kind === "engage");
    [[res, "result", ""], [eng, "engage", "-eng"]].forEach(([l, kind, suf]) => {
      if (!l.length) return;
      out.push({ id: g.id + suf, name: g.name, status: "ACTIVE", kind, metrics: sumMetrics(l.map((a) => a.metrics)), guessedGroup: guessed,
        sets: l.map((a) => ({ id: a.id, name: a.name, status: "ACTIVE", kind: "liAudience", metrics: a.metrics, ads: a.ads, guessed: a.guessedAds })) });
    });
  });
  orphans.forEach((a) => out.push({ id: "rp-sem", name: a.name, status: "ACTIVE", kind: a.kind, metrics: a.metrics, sets: [{ id: "rp-sem-ads", name: "Anúncios", kind: "liAudience", metrics: a.metrics, ads: a.ads }] }));
  return out.sort((x, y) => (y.metrics.spend || 0) - (x.metrics.spend || 0));
}

/* ---------------------------------------------------------- */
/* Reportei como reserva para o Meta (sem token)               */
/* ---------------------------------------------------------- */
async function metaReporteiTree(integ, start, end) {
  const d = await reporteiGet(integ.id, "facebook_ads", start, end, ["fb_ads:insights_by_campaign", "fb_ads:ads"]);
  const parseFixed = (t) => (t && t.values ? t.values : []).map((row) => {
    const head = row[0] || {}; const v = (i) => numOf(row[i]);
    return { id: head.id || norm(head.text), name: head.text, image: head.image || null, leads: v(1), spend: v(3), reach: v(4), impressions: v(5), ctr: v(6) };
  });
  const camps = parseFixed(d["fb_ads:insights_by_campaign"]);
  const ads = parseFixed(d["fb_ads:ads"]);
  const m = (r) => ({ spend: r.spend || 0, impressions: r.impressions || 0, reach: r.reach || 0, linkClicks: r.impressions && r.ctr ? Math.round(r.impressions * r.ctr / 100) : 0, leads: r.leads || 0 });
  return { source: "reportei", accountId: integ.sourceId, accountName: integ.name, campaigns: [
    ...camps.filter((c) => c.spend > 0).map((c) => ({ id: "rp-" + c.id, name: c.name, status: "ACTIVE", kind: ENGAGE_NAME.test(c.name) ? "engage" : "result", formType: /form|nativo/i.test(c.name) ? "native" : "site", metrics: m(c), sets: [] })),
    ...(ads.length ? [{ id: "rp-ads", name: "Anúncios com veiculação no período", status: "ACTIVE", metrics: null, sets: [{ id: "rp-ads-set", name: "Todos os anúncios", ads: ads.filter((a) => a.spend > 0).map((a) => ({ id: a.id, name: a.name, status: "ACTIVE", creative: { type: "image", image: a.image, thumb: a.image, bodies: [], titles: [] }, metrics: m(a) })) }] }] : []),
  ] };
}

/* ---------------------------------------------------------- */
/* Ponto único: dados de uma plataforma de um cliente          */
/* ---------------------------------------------------------- */
/* ---------------------------------------------------------- */
/* ORGÂNICO — redes sociais e site pelo Reportei               */
/* ---------------------------------------------------------- */
const ORG = {
  instagram_business: { label: "Instagram", kpis: [
    ["followers", "Seguidores", "ig:current_followers_count", "int", true], ["newFollowers", "Novos seguidores", "ig:new_followers_count", "int"],
    ["reach", "Alcance", "ig:reach", "int"], ["views", "Visualizações", "ig:views", "int"], ["interactions", "Interações", "ig:post_total_interactions_count", "int"],
    ["rate", "Taxa de interação", "ig:post_interaction_rate", "pct"], ["profileViews", "Visitas ao perfil", "ig:profile_views", "int"], ["clicks", "Cliques no link", "ig:total_clicks", "int"],
    ["posts", "Posts", "ig:media_count", "int"], ["reels", "Reels", "ig:reels_count", "int"], ["stories", "Stories", "ig:stories_count", "int"]],
    trend: "ig:reach", posts: "ig:media_datatable" },
  facebook: { label: "Facebook", kpis: [
    ["followers", "Seguidores", "fb:page_follows", "int", true], ["newFollowers", "Novos seguidores", "fb:net_page_follows", "int"], ["reach", "Alcance", "fb:page_reach", "int"],
    ["interactions", "Engajamento", "fb:page_post_engagements", "int"], ["rate", "Taxa de engajamento", "fb:page_post_rate_engagements", "pct"], ["posts", "Posts", "fb:page_posts_count", "int"]],
    trend: "fb:page_reach", posts: "fb:page_posts" },
  linkedin: { label: "LinkedIn", kpis: [
    ["followers", "Seguidores", "li:followers_total", "int", true], ["newFollowers", "Novos seguidores", "li:followers", "int"], ["impressions", "Impressões", "li:impressions", "int"],
    ["reach", "Alcance", "li:reach", "int"], ["interactions", "Engajamento", "li:engagement", "int"], ["rate", "Taxa de engajamento", "li:engagement_rate", "pct"],
    ["clicks", "Cliques", "li:total_clicks", "int"], ["posts", "Posts", "li:posts_total", "int"]],
    posts: "li:posts" },
  google_analytics_4: { label: "Site (GA4)", kpis: [
    ["sessions", "Sessões", "google_analytics_4:all_sessions", "int"], ["users", "Usuários", "google_analytics_4:all_users", "int"], ["newUsers", "Novos usuários", "google_analytics_4:new_users", "int"],
    ["engagement", "Taxa de engajamento", "google_analytics_4:engagement_rate", "frac"], ["keyEvents", "Eventos-chave", "google_analytics_4:conversions_count", "int"]],
    channels: "google_analytics_4:session_default_channel_group_datatable" },
};
const POST_COLS = { // colunas das tabelas de posts quando o Reportei não manda cabeçalho
  "ig:media_datatable": ["post", "type", "reach", "views", "interactions", "rate", "likes", "comments", "saved", "follows", "profileVisits", "shares", "date"],
  "fb:page_posts": ["post", "type", "reach", "organicReach", "paidReach", "reactions", "comments", "shares", "videoViews", "date"],
  "li:posts": ["post", "impressions", "reach", "shares", "likes", "clicks", "comments", "rate", "date"],
};
const CHANNEL_PT = { "Organic Search": "Busca orgânica", "Organic Social": "Social orgânico", "Paid Search": "Busca paga", "Paid Social": "Social pago", Direct: "Direto", Referral: "Referência", Display: "Display", Email: "E-mail", "Organic Video": "Vídeo orgânico", "Paid Video": "Vídeo pago", "Cross-network": "Multirrede", Unassigned: "Não atribuído", "Paid Other": "Outros pagos", "Organic Shopping": "Shopping orgânico" };
const dayShift = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const valOf = (v) => { if (v == null) return null; const x = typeof v === "object" ? v.values : v; if (x == null || typeof x === "object") return null; const n = Number(x); return Number.isFinite(n) ? n : null; };
function postsOf(key, v) {
  if (!v || !Array.isArray(v.values)) return [];
  const cols = v.headers ? Object.keys(v.headers).map((h, i) => (i === 0 ? "post" : h === "engagement_rate" ? "rate" : h === "created_at" ? "date" : h)) : POST_COLS[key];
  if (!cols) return [];
  return v.values.map((row) => {
    const o = {}; cols.forEach((c, i) => { o[c] = row[i]; });
    const p = o.post && typeof o.post === "object" ? o.post : {};
    const num = (k) => (o[k] == null || o[k] === "" ? null : Number(o[k]));
    let rate = num("rate"); if (rate != null && key !== "fb:page_posts") rate *= 100; // IG e LinkedIn mandam fração por post (LinkedIn conta cliques, pode passar de 100%)
    const interactions = num("interactions") != null ? num("interactions") : (num("reactions") || 0) + (num("comments") || 0) + (num("shares") || 0) + (num("likes") || 0);
    return { text: p.text || "", image: p.cdn_image || p.image || null, url: p.url || null, type: o.type || null, date: o.date || null,
      reach: num("reach"), views: num("views"), impressions: num("impressions"), interactions, rate, likes: num("likes") != null ? num("likes") : num("reactions"), comments: num("comments"), shares: num("shares"), saved: num("saved"), clicks: num("clicks") };
  });
}
async function organicNetwork(integ, start, end) {
  const spec = ORG[integ.slug];
  const kpiKeys = spec.kpis.map((k) => k[2]);
  const keys = uniq([...kpiKeys, spec.posts, spec.channels].filter(Boolean));
  const days = Math.round((new Date(end) - new Date(start)) / 864e5) + 1;
  const [cur, prev] = await Promise.all([
    reporteiGet(integ.id, integ.slug, start, end, keys),
    reporteiGet(integ.id, integ.slug, dayShift(start, -days), dayShift(start, -1), kpiKeys).catch(() => ({})),
  ]);
  const kpis = spec.kpis.map(([id, label, key, fmt, stock]) => {
    let value = valOf(cur[key]); let before = valOf(prev[key]);
    if (fmt === "frac") { value = value != null ? value * 100 : null; before = before != null ? before * 100 : null; }
    return { id, label, fmt: fmt === "frac" ? "pct" : fmt, value, prev: before, stock: !!stock };
  }).filter((k) => k.value != null);
  const tr = spec.trend && cur[spec.trend] && cur[spec.trend].trend && cur[spec.trend].trend.data;
  const out = { slug: integ.slug, label: spec.label, name: integ.name, kpis, trend: Array.isArray(tr) && tr.length > 3 ? tr.map(Number) : null };
  if (spec.posts) out.posts = postsOf(spec.posts, cur[spec.posts]).sort((a, b) => (b.reach || b.impressions || 0) - (a.reach || a.impressions || 0));
  if (spec.channels) {
    const v = cur[spec.channels];
    if (v && Array.isArray(v.values) && v.headers) {
      const h = Object.keys(v.headers);
      out.channels = v.values.map((r) => { const o = {}; h.forEach((k, i) => { o[k] = r[i]; }); const ch = String(o.sessionDefaultChannelGroup || "");
        return { name: CHANNEL_PT[ch] || ch, organic: /^Organic/.test(ch), sessions: Number(o.sessions || 0), users: Number(o.totalUsers || 0), engaged: Number(o.engagedSessions || 0), engagementRate: Number(o.engagementRate || 0) * 100, keyEvents: Number(o.keyEvents || 0) }; })
        .sort((a, b) => b.sessions - a.sessions);
    }
  }
  return out;
}
async function organicData(c, start, end) {
  if (!c.reporteiId) return { networks: [], notes: ["Este cliente não está ligado a um projeto do Reportei."] };
  const ints = (await reporteiIntegrations(c.reporteiId)).filter((i) => ORG[i.slug]);
  const order = Object.keys(ORG);
  ints.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  const st = readStore(); const cc = st.clients.find((x) => x.key === c.key);
  if (cc) { cc.organico = ints.map((i) => ({ id: i.id, slug: i.slug, name: i.name })); writeStore(st); }
  const networks = []; const notes = [];
  await pool(ints, 4, async (i) => { try { networks.push(await organicNetwork(i, start, end)); } catch (e) { notes.push(`${ORG[i.slug].label} (${i.name}): ${e.message}`); } });
  networks.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  return { networks, notes, organico: cc ? cc.organico : [], at: new Date().toISOString() };
}

ipcMain.handle("data:platform", async (_e, { key, platform, start, end }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key);
  if (!c) throw new Error("cliente não encontrado");
  const s = st.settings; const accounts = []; const notes = [];
  if (platform === "organico") return organicData(c, start, end);
  if (platform === "meta") {
    const ids = c.meta || [];
    if (!ids.length) return { accounts, notes: ["Nenhuma conta de Meta vinculada a este cliente."] };
    for (const id of ids) {
      if (s.metaToken) {
        try { accounts.push({ source: "api", ...(await metaTree(id, start, end)) }); continue; }
        catch (e) { notes.push(`Meta ${id}: ${e.message}. Usando o Reportei como reserva.`); }
      }
      const integ = (c.integrations || []).find((i) => i.slug === "facebook_ads" && ("act_" + i.sourceId === id || i.sourceId === id));
      if (integ) { try { accounts.push(await metaReporteiTree(integ, start, end)); } catch (e) { notes.push(`Reportei (${integ.name}): ${e.message}`); } }
    }
  } else if (platform === "google") {
    for (const id of c.google || []) { try { accounts.push({ source: "api", ...(await googleTree(id, start, end)) }); } catch (e) { notes.push(`Google ${id}: ${e.message}`); } }
    if (!(c.google || []).length) notes.push("Nenhuma conta de Google Ads vinculada a este cliente.");
  } else if (platform === "linkedin") {
    const ints = (c.integrations || []).filter((i) => i.slug === "linkedin_ads");
    for (const id of c.linkedin || []) {
      if (s.linkedinToken) { try { accounts.push({ ...(await linkedinApiTree(id, start, end)), accountName: (ints.find((i) => i.sourceId === id) || {}).name || id }); continue; } catch (e) { notes.push(`LinkedIn API ${id}: ${e.message}. Usando o Reportei.`); } }
      const integ = ints.find((i) => i.sourceId === id);
      if (integ) { try { accounts.push(await linkedinReporteiTree(integ, start, end)); } catch (e) { notes.push(`LinkedIn (${integ.name}): ${e.message}`); } }
    }
    if (!(c.linkedin || []).length) notes.push("Nenhuma conta de LinkedIn vinculada a este cliente.");
  }
  return { accounts, notes, at: new Date().toISOString() };
});

/* ---------------------------------------------------------- */
/* ESTRATÉGIA — cofre Obsidian "Clientes P.O."                 */
/* ---------------------------------------------------------- */
function readSafe(p) { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function section(md, headingRe, level = 2) {
  if (!md) return null;
  const lines = md.split("\n"); const hashes = "#".repeat(level);
  const i = lines.findIndex((l) => l.startsWith(hashes + " ") && headingRe.test(l));
  if (i < 0) return null;
  let j = i + 1; while (j < lines.length && !(new RegExp(`^#{1,${level}} `).test(lines[j]))) j++;
  return lines.slice(i + 1, j).join("\n").replace(/<!--[\s\S]*?-->/g, "").trim();
}
function stripFront(md) { return md ? md.replace(/^---[\s\S]*?---\n/, "") : md; }
function vaultBundle(c) {
  const s = S(); if (!c.vaultFolder || !s.vaultPath) return null;
  const dir = path.join(s.vaultPath, "Clientes", c.vaultFolder);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const histFile = files.find((f) => /hist[oó]rico/i.test(f) && f.endsWith(".md"));
  const hist = histFile ? stripFront(readSafe(path.join(dir, histFile))) : null;
  const main = stripFront(readSafe(path.join(dir, c.vaultFolder + ".md")));
  const reunDir = path.join(dir, "Reuniões");
  const reunioes = fs.existsSync(reunDir) ? fs.readdirSync(reunDir).filter((f) => /^\d{4}-\d{2}-\d{2}/.test(f) && f.endsWith(".md")).sort().reverse() : [];
  const meetings = reunioes.slice(0, 6).map((f) => {
    const md = stripFront(readSafe(path.join(reunDir, f)));
    return { file: f, date: f.slice(0, 10), full: (md || "").slice(0, 7000), diagnostico: section(md, /Diagn[oó]stico/), plano: section(md, /Plano|Pr[oó]ximos passos|Combinados|Encaminhamentos/), resumo: (md || "").split("\n").find((l) => l.startsWith(">")) || null };
  });
  let weekly = null;
  if (hist) { const m = hist.split(/\n(?=## 📅 )/); weekly = m.length > 1 ? m[1].split(/\n---\n/)[0].trim() : null; }
  const others = files.filter((f) => f.endsWith(".md") && !/hist[oó]rico/i.test(f) && f !== c.vaultFolder + ".md").map((f) => ({ file: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime).slice(0, 6).map((x) => x.file);
  const mtimes = [histFile, ...reunioes.slice(0, 6).map((f) => "Reuniões/" + f)].filter(Boolean).map((f) => { try { return fs.statSync(path.join(dir, f)).mtimeMs; } catch { return 0; } });
  return {
    dir, histFile, visaoGeral: hist ? section(hist, /Vis[aã]o geral/) : null, ultimaSemana: weekly,
    emAberto: section(main, /Em aberto/), acompanhamento: section(main, /Acompanhamento/), meetings, otherNotes: others, stamp: Math.max(0, ...mtimes),
  };
}
/* ---------------------------------------------------------- */
/* REUNIÕES sem Obsidian: agenda + Docs do Google, ou ata colada */
/* ---------------------------------------------------------- */
const M = require("./meetings.cjs");
const isoDay = (d) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
async function googleMeetings(c) {
  const s = S(); const tok = await sheetsToken();
  if (!tok) return { ok: false, reason: "Conecte sua conta do Google em Configurações para ler as reuniões da agenda." };
  const H = { headers: { Authorization: `Bearer ${tok}` } };
  const since = new Date(Date.now() - 75 * 864e5).toISOString(), until = new Date(Date.now() + 864e5).toISOString();
  let events = [], pageToken = "";
  try {
    for (let i = 0; i < 5; i++) {
      const r = await httpJson("https://www.googleapis.com/calendar/v3/calendars/primary/events?" + new URLSearchParams({ timeMin: since, timeMax: until, singleEvents: "true", orderBy: "startTime", maxResults: "250", ...(pageToken ? { pageToken } : {}) }), H);
      events.push(...(r.items || [])); pageToken = r.nextPageToken; if (!pageToken) break;
    }
  } catch (e) {
    if (e.status === 403 || e.status === 401) {
      const off = /has not been used|is disabled|SERVICE_DISABLED/i.test(String(e.message));
      return { ok: false, needReconnect: !off, apiOff: off ? "calendar" : null, reason: off ? "Ative a API do Google Calendar no projeto do Google Cloud (veja o guia)." : "Reconecte o Google em Configurações para liberar a leitura da agenda e dos documentos." };
    }
    throw e;
  }
  const mine = events.filter((ev) => ev.status !== "cancelled" && M.eventMatchesClient(ev, c));
  const items = []; let docErr = null;
  for (const ev of mine) {
    const date = isoDay((ev.start && (ev.start.dateTime || ev.start.date)) || Date.now());
    if (date > isoDay(Date.now())) continue;
    for (const a of M.docAttachments(ev)) {
      try {
        const doc = await httpJson(`https://docs.googleapis.com/v1/documents/${a.id}?includeTabsContent=true`, H, 60000);
        const text = M.flattenDoc(doc); if (text.length < 80) continue;
        items.push({ id: a.id, date, title: ev.summary || doc.title || "Reunião", docTitle: doc.title || a.title, source: "google", kind: M.docKind(doc.title || a.title, text), text, url: `https://docs.google.com/document/d/${a.id}` });
      } catch (e) {
        if (e.status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(String(e.message))) return { ok: false, apiOff: "docs", reason: "Ative a API do Google Docs no projeto do Google Cloud (veja o guia)." };
        docErr = e.status === 403 || e.status === 404 ? "sem acesso a algum documento da reunião" : e.message;
      }
    }
  }
  return { ok: true, items, found: mine.length, docErr, fetchedAt: new Date().toISOString() };
}
function vaultMeetingItems(b) { return b ? b.meetings.map((m) => ({ id: "obs:" + m.file, date: m.date, title: m.file.replace(/\.md$/, ""), source: "obsidian", kind: "notas", text: m.full || [m.resumo, m.diagnostico, m.plano].filter(Boolean).join("\n") })) : []; }
function allMeetings(st, c, b) {
  const g = ((st.meetingsGoogle || {})[c.key] || {}).items || [];
  const man = ((st.manualMeetings || {})[c.key] || []).map((m) => ({ ...m, source: "manual", kind: "notas" }));
  return M.mergeMeetings([...vaultMeetingItems(b), ...g, ...man]);
}
const meetingsView = (list) => list.map((m) => ({ id: m.id, date: m.date, title: m.title, source: m.source, kind: m.kind, chars: m.text.length, url: m.url || null }));
ipcMain.handle("meetings:refresh", async (_e, { key }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key); if (!c) return { ok: false, reason: "cliente não encontrado" };
  const r = await googleMeetings(c);
  if (r.ok) { const st2 = readStore(); st2.meetingsGoogle = st2.meetingsGoogle || {}; st2.meetingsGoogle[key] = { items: r.items, fetchedAt: r.fetchedAt }; writeStore(st2); }
  return { ...r, items: undefined, count: (r.items || []).length };
});
ipcMain.handle("meetings:add", (_e, { key, date, title, text }) => {
  if (!text || String(text).trim().length < 80) throw new Error("Cole o texto da ata ou da transcrição (muito curto).");
  const st = readStore(); st.manualMeetings = st.manualMeetings || {}; const l = (st.manualMeetings[key] = st.manualMeetings[key] || []);
  l.push({ id: "man:" + Date.now(), date: /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : isoDay(Date.now()), title: String(title || "Reunião").slice(0, 120), text: String(text).slice(0, 120000) });
  writeStore(st); return true;
});
ipcMain.handle("meetings:remove", (_e, { key, id }) => { const st = readStore(); const l = (st.manualMeetings || {})[key]; if (l) st.manualMeetings[key] = l.filter((m) => m.id !== id); writeStore(st); return true; });
ipcMain.handle("strategy:get", (_e, { key }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key);
  if (!c) return null;
  const b = vaultBundle(c);
  const ml = allMeetings(st, c, b);
  const gm = (st.meetingsGoogle || {})[key];
  const meetings = { list: meetingsView(ml), googleOn: !!st.settings.googleSheetsRefreshToken, googleOk: !!st.settings.googleMeetingsOk, googleAt: gm ? gm.fetchedAt : null, hasVault: !!b };
  const stamp = String(b ? b.stamp : 0) + "|" + M.meetingsStamp(ml);
  const cache = (st.strategyCache || {})[key];
  return { available: true, bundle: b || { meetings: [] }, meetings, stamp, ai: cache && cache.stamp === stamp ? cache.data : null, aiStale: !!(cache && cache.stamp !== stamp), aiPrev: cache ? cache.data : null };
});
ipcMain.handle("strategy:ai", async (_e, { key, campaigns, recentAds }) => {
  const st = readStore(); const c = st.clients.find((x) => x.key === key);
  const s = st.settings; if (!s.geminiKey) throw new Error("Falta a chave do Gemini em Configurações.");
  const b = vaultBundle(c);
  try { const r = await googleMeetings(c); if (r.ok) { const sx = readStore(); sx.meetingsGoogle = sx.meetingsGoogle || {}; sx.meetingsGoogle[key] = { items: r.items, fetchedAt: r.fetchedAt }; writeStore(sx); } } catch {}
  const ml = allMeetings(readStore(), c, b); const stampNow = String(b ? b.stamp : 0) + "|" + M.meetingsStamp(ml);
  if (!ml.length && !(b && (b.visaoGeral || b.acompanhamento))) throw new Error("Este cliente ainda não tem reunião lida. Conecte o Google (agenda) ou cole a ata/transcrição da última reunião.");
  const hoje = new Date(); const hojeISO = hoje.toISOString().slice(0, 10); const dm = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "?");
  // o que foi feito na semana (Trello) = evidência datada de execução
  let feito = "";
  try {
    const td = await trelloDoneData(c, s);
    if (td.ok) feito = td.cards.map((k) => `- ${dm(k.due || k.last)} · ${k.name}${k.items.length ? ` (${k.items.filter((i) => i.done).length}/${k.items.length} itens)` : ""}${k.desc.trim() ? " — " + k.desc.replace(/\s+/g, " ").slice(0, 320) : ""}`).join("\n");
  } catch {}
  const novos = (recentAds || []).slice(0, 60).map((a) => `- ${a.plataforma} · ${a.campanha}${a.conjunto ? " > " + a.conjunto : ""}${a.anuncio ? " > " + a.anuncio : ""} · criado em ${dm(a.criadoEm)}${a.status ? " · " + a.status : ""}`).join("\n");
  const src = [
    b && b.visaoGeral && `## HISTÓRICO SEMANAL (gargalo por semana)\n${b.visaoGeral}`,
    b && b.ultimaSemana && `## ÚLTIMA SEMANA REGISTRADA\n${b.ultimaSemana.slice(0, 6000)}`,
    `## REUNIÕES EM ORDEM CRONOLÓGICA (da mais antiga para a mais nova)\n` + ml.map((m) => `### Reunião de ${m.date.split("-").reverse().join("/")} · ${m.title}${m.kind === "transcricao" ? " (TRANSCRIÇÃO BRUTA: extraia daqui os combinados, responsáveis e prazos)" : ""}\n${m.text}`).join("\n\n"),
    b && b.acompanhamento && `## ACOMPANHAMENTO ATUAL (tarefas no eKyte e combinados da última reunião)\n${b.acompanhamento.slice(0, 5000)}`,
    b && b.emAberto && `## EM ABERTO PARA A PRÓXIMA REUNIÃO\n${b.emAberto}`,
    feito && `## FEITO NA SEMANA (cards do Trello com a data da entrega)\n${feito}`,
    novos && `## ANÚNCIOS E CAMPANHAS CRIADOS RECENTEMENTE (data de criação na plataforma)\n${novos}`,
  ].filter(Boolean).join("\n\n");
  const prompt = `Você é a gestora de projetos de uma agência de mídia paga. Hoje é ${hojeISO.split("-").reverse().join("/")}. Leia as reuniões e o histórico do cliente "${c.name}" (podem ser notas já resumidas ou transcrições brutas com falas de várias pessoas; nas transcrições, descubra você mesma o que foi combinado, por quem e para quando) e devolva a leitura estratégica do que a equipe está ATACANDO, com a LINHA DO TEMPO de cada frente: quando foi combinada, quando entrou no ar e em que pé está hoje.

Como montar a linha do tempo:
- As reuniões vêm em ordem cronológica. Uma frente nasce na reunião em que o gargalo, a hipótese e a solução foram combinados. Siga a frente nas reuniões seguintes: foi executada? ajustada? deu resultado? foi abandonada?
- "combinadoEm" = data (DD/MM) da reunião em que a solução foi combinada.
- "ativadoEm" = data (DD/MM) em que a solução entrou no ar. Só preencha com EVIDÊNCIA: (a) uma nota de reunião diz que foi startada, subiu ou ativou; (b) um card do Trello em "FEITO NA SEMANA" registra a entrega (use a data do card); (c) há campanha ou anúncio criado nessa data em "CRIADOS RECENTEMENTE" que corresponde à solução. Sem evidência, deixe "" e marque a frente como "planejado".
- "eventos" = marcos em ordem cronológica (no máximo 5), cada um {"data":"DD/MM","rotulo":"Combinado|Ativado|Ajustado|Acompanhado|Resultado|Bloqueio","texto":"frase curta","fonte":"reunião DD/MM|Trello|Meta|eKyte"}.
- "situacao" = uma frase sobre onde está HOJE. Ex.: "No ar desde 16/11, ainda sem volume para avaliar a qualificação." ou "Combinado em 09/11, aguardando a aprovação das cópias pelo cliente." Diga com quem está a bola quando souber.
- "proximo" = o próximo passo concreto, com responsável e prazo se a nota trouxer (pode ser "").
- "status": "testando" (já está no ar), "planejado" (combinado e ainda não no ar), "validado" (há resultado positivo registrado), "descartado" (abandonada ou sem efeito).
- Rótulos dos marcos: "Combinado" SÓ no primeiro marco (a reunião em que a solução nasceu). Reuniões seguintes que apenas retomam o assunto, cobram ou acompanham = "Acompanhado"; se a solução mudou = "Ajustado". Nunca repita o mesmo rótulo na mesma data. "Ativado" no máximo uma vez.
- Nunca invente data, número ou resultado. Se a data não estiver nas notas, deixe "".

Outras regras:
- Cada frente = um gargalo concreto (etapa do funil ou problema operacional), a hipótese de por que acontece e a solução aplicada ou em teste.
- "campanhas": nomes EXATOS de campanha da lista abaixo que têm relação com a frente (pode ser vazio).
- "conjuntos": nomes EXATOS de conjunto/público/grupo da lista abaixo quando a frente é específica daquele público. Se vale para a campanha inteira, deixe vazio e use só "campanhas".
- Benchmarks para dizer se algo é gargalo: Meta CTR de link ≥ 1%; taxa de preenchimento ≥ 40% quando o lead vem de FORMULÁRIO NATIVO (Meta ou LinkedIn) e ≥ 10% quando vem de SITE/LP; Google pesquisa CTR ≥ 5% e taxa de conversão ≥ 10%; LinkedIn mensagens abertura ≥ 50% e cliques ≥ 1,5%. Se a nota usar outro benchmark, reavalie com estes.
- Campanhas ativas, com destino do lead e conjuntos: ${JSON.stringify((campaigns || []).slice(0, 60))}
- Português do Brasil, frases curtas e diretas. Sem traço como marcador. No máximo 7 frentes, as mais importantes primeiro.

Responda só JSON: {"resumo":"2 frases sobre o momento do projeto","frentes":[{"plataforma":"Meta|Google|LinkedIn|Geral","gargalo":"","hipotese":"","solucao":"","status":"testando|planejado|validado|descartado","combinadoEm":"DD/MM ou vazio","ativadoEm":"DD/MM ou vazio","situacao":"","eventos":[{"data":"DD/MM","rotulo":"","texto":"","fonte":""}],"proximo":"","evidencia":"o número ou fato da nota que sustenta","campanhas":[],"conjuntos":[]}],"proximos":["até 4 próximos passos"]}

NOTAS DO COFRE E EVIDÊNCIAS:
${src.slice(0, 280000)}`;
  const model = s.geminiModel || "gemini-2.5-flash";
  const r = await httpJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(s.geminiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } }),
  }, 120000);
  const text = (((r.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text).join("") || "{}";
  let data; try { data = JSON.parse(text); } catch { data = JSON.parse(text.replace(/^[^{]*/, "").replace(/[^}]*$/, "")); }
  data.geradoEm = new Date().toISOString(); data.v = 3;
  (data.frentes || []).forEach((f) => { if (!f.desde) f.desde = f.combinadoEm || ""; });
  const st2 = readStore(); st2.strategyCache = st2.strategyCache || {}; st2.strategyCache[key] = { stamp: stampNow, data }; writeStore(st2);
  return data;
});
ipcMain.handle("vault:open", (_e, { key, file }) => {
  const c = readStore().clients.find((x) => x.key === key); const s = S();
  if (!c || !c.vaultFolder) return;
  const vaultName = path.basename(s.vaultPath);
  const rel = path.join("Clientes", c.vaultFolder, file || c.vaultFolder + ".md").replace(/\.md$/, "");
  shell.openExternal(`obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(rel)}`);
});
ipcMain.handle("vault:pick", async () => {
  const r = await dialog.showOpenDialog({ title: "Pasta do cofre Clientes P.O.", properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  const st = readStore(); st.settings.vaultPath = r.filePaths[0]; writeStore(st); return r.filePaths[0];
});

/* ---------------------------------------------------------- */
/* LinkedIn: conectar pelo navegador (precisa do app com Advertising API) */
/* ---------------------------------------------------------- */
ipcMain.handle("linkedin:connect", async () => {
  const s = S(); const clientId = s.linkedinClientId, clientSecret = s.linkedinClientSecret;
  if (!clientId || !clientSecret) throw new Error("Faltam o Client ID e o Client Secret do app do LinkedIn.");
  const http = require("http"); const PORT = 42815; const redirectUri = `http://localhost:${PORT}`;
  const authUrl = "https://www.linkedin.com/oauth/v2/authorization?" + new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, state: "cc" + Date.now(), scope: "r_ads r_ads_reporting" }).toString();
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirectUri); const c = u.searchParams.get("code"); const err = u.searchParams.get("error_description") || u.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<html><body style="font-family:sans-serif;background:#0A0E14;color:#E8ECF3;text-align:center;padding-top:80px"><h2>${c ? "Conectado." : "Não conectou: " + (err || "cancelado")}</h2><p>Pode fechar esta aba e voltar para a Central de Campanhas.</p></body></html>`);
      server.close(); if (c) resolve(c); else reject(new Error(err || "autorização cancelada"));
    });
    server.on("error", (e) => reject(new Error(e.code === "EADDRINUSE" ? "a porta 42815 está ocupada (feche o Painel de Mídia Paga e tente de novo)" : e.message)));
    server.listen(PORT, () => shell.openExternal(authUrl));
    setTimeout(() => { try { server.close(); } catch {} reject(new Error("tempo esgotado, tente de novo")); }, 180000);
  });
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }) });
  const tok = await r.json().catch(() => ({}));
  if (!r.ok || !tok.access_token) throw new Error("O LinkedIn recusou: " + (tok.error_description || r.status));
  const st = readStore(); st.settings.linkedinToken = tok.access_token; st.settings.linkedinExpiresAt = tok.expires_in ? Math.floor(Date.now() / 1000) + tok.expires_in : 0; writeStore(st);
  return { ok: true, days: tok.expires_in ? Math.round(tok.expires_in / 86400) : null };
});

/* ---------------------------------------------------------- */
/* Teste de cada chave + conexão do Google + guia                  */
/* ---------------------------------------------------------- */
ipcMain.handle("keys:test", async (_e, { which }) => {
  const s = S();
  try {
    if (which === "reportei") {
      if (!s.reporteiToken) return { ok: false, msg: "Cole o token do Reportei primeiro." };
      const b = await httpJson(`${REPORTEI}/projects?per_page=100`, { headers: { Authorization: `Bearer ${s.reporteiToken}`, Accept: "application/json" } }, 25000);
      return { ok: true, msg: `Conectado ao Reportei: ${(b.data || []).length}${(b.data || []).length >= 100 ? "+" : ""} clientes visíveis.` };
    }
    if (which === "trello") {
      if (!s.trelloKey || !s.trelloToken) return { ok: false, msg: "Cole a API Key e o Token do Trello." };
      const r = await httpJson(`https://api.trello.com/1/members/me?fields=fullName,username&key=${encodeURIComponent(s.trelloKey)}&token=${encodeURIComponent(s.trelloToken)}`, {}, 20000);
      return { ok: true, msg: `Conectado ao Trello como ${r.fullName || r.username}.` };
    }
    if (which === "gemini") {
      if (!s.geminiKey) return { ok: false, msg: "Cole a chave do Gemini." };
      await httpJson(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(s.geminiKey)}`, {}, 20000);
      return { ok: true, msg: "Chave do Gemini válida." };
    }
    if (which === "meta") {
      if (!s.metaToken) return { ok: false, msg: "Cole o token do Meta." };
      const r = await httpJson(`${GRAPH}/debug_token?input_token=${encodeURIComponent(s.metaToken)}&access_token=${encodeURIComponent(s.metaToken)}`, {}, 20000);
      const d = r.data || {}; const st = readStore(); st.settings.metaExpiresAt = d.expires_at || 0; writeStore(st);
      if (!d.is_valid) return { ok: false, msg: "O Meta recusou este token (expirado ou inválido). Gere um novo no Explorador da Graph API." };
      const need = ["ads_read", "business_management", "pages_read_engagement", "pages_show_list"]; const miss = need.filter((x) => !(d.scopes || []).includes(x));
      const until = d.expires_at ? new Date(d.expires_at * 1000).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "sem vencimento";
      return { ok: !miss.length, msg: `Token válido até ${until}.${miss.length ? " Faltam permissões: " + miss.join(", ") + "." : ""}` };
    }
    if (which === "googleads") {
      if (!s.googleAdsDevToken || !s.googleAdsRefreshToken) return { ok: false, msg: "Falta o Developer Token ou a conexão com o Google (botão Conectar)." };
      _gat = null; const h = await gadsHeaders(); let last;
      for (const v of GADS_VERSIONS) {
        const r = await fetch(`https://googleads.googleapis.com/${v}/customers:listAccessibleCustomers`, { headers: h }); const txt = await r.text();
        if (r.ok) { const n = (JSON.parse(txt).resourceNames || []).length; return { ok: true, msg: `Google Ads conectado: ${n} conta(s) acessível(is).` }; }
        last = txt; if (r.status !== 404 && !/deprecat|blocked/i.test(txt)) break;
      }
      let msg = "O Google Ads recusou o acesso."; try { msg = JSON.parse(last).error.message || msg; } catch {}
      return { ok: false, msg: msg.slice(0, 220) };
    }
  } catch (e) { return { ok: false, msg: String(e.message || e).slice(0, 240) }; }
  return { ok: false, msg: "Teste desconhecido." };
});
// um único consentimento do Google libera Google Ads e a leitura de planilhas (cada pessoa usa a própria conta)
ipcMain.handle("google:connect", async () => {
  const s = S(); if (!s.googleAdsClientId || !s.googleAdsClientSecret) throw new Error("Preencha o Client ID e o Client Secret do Google antes de conectar.");
  const http = require("http"); const PORT = 42813; const redirectUri = `http://localhost:${PORT}`;
  const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({ client_id: s.googleAdsClientId, redirect_uri: redirectUri, response_type: "code", scope: "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/documents.readonly", access_type: "offline", prompt: "consent" }).toString();
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirectUri); const c = u.searchParams.get("code"); const err = u.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<html><body style="font-family:sans-serif;background:#0A0E14;color:#E8ECF3;text-align:center;padding-top:80px"><h2>${c ? "Conectado." : "Não conectou: " + (err || "cancelado")}</h2><p>Pode fechar esta aba e voltar para a Central de Campanhas.</p></body></html>`);
      server.close(); if (c) resolve(c); else reject(new Error(err === "access_denied" ? "O Google não liberou o acesso. Peça à Erik para adicionar seu e-mail como usuário de teste do app." : err || "autorização cancelada"));
    });
    server.on("error", (e) => reject(new Error(e.code === "EADDRINUSE" ? "a porta 42813 está ocupada (feche o Painel de Mídia Paga e tente de novo)" : e.message)));
    server.listen(PORT, () => shell.openExternal(authUrl));
    setTimeout(() => { try { server.close(); } catch {} reject(new Error("tempo esgotado, tente de novo")); }, 180000);
  });
  const tok = await httpJson("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ code, client_id: s.googleAdsClientId, client_secret: s.googleAdsClientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  if (!tok.refresh_token) throw new Error("O Google não devolveu a permissão; refaça a conexão.");
  const st = readStore(); st.settings.googleAdsRefreshToken = tok.refresh_token; st.settings.googleSheetsRefreshToken = tok.refresh_token; st.settings.googleMeetingsOk = /calendar\.readonly/.test(tok.scope || "") && /documents\.readonly/.test(tok.scope || ""); writeStore(st); _gat = null; _shAt = null;
  return { ok: true, meetings: !!st.settings.googleMeetingsOk };
});
// chaves da EQUIPE (sem nada pessoal): quem recebe conecta o próprio Meta, Trello e Google
ipcMain.handle("keys:exportTeam", async () => {
  const s = S(); const out = { _tipo: "central-campanhas-chaves", _escopo: "equipe", _gerado: new Date().toISOString() };
  ["reporteiToken", "geminiKey", "geminiModel", "googleAdsDevToken", "googleAdsClientId", "googleAdsClientSecret", "googleAdsLoginCustomerId", "metaAppId", "metaAppSecret"].forEach((k) => { if (s[k]) out[k] = s[k]; });
  const r = await dialog.showSaveDialog({ title: "Salvar arquivo de chaves da equipe", defaultPath: path.join(os.homedir(), "Desktop", "chaves-equipe-central-campanhas.json") });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, JSON.stringify(out, null, 2), { encoding: "utf8", mode: 0o600 });
  return { ok: true, path: r.filePath };
});
// abre o guia passo a passo (arquivo HTML que vai dentro do app) no navegador, já no passo da chave
ipcMain.handle("guide:open", (_e, anchor) => {
  const f = path.join(APP_ROOT, "src", "guia", "index.html");
  if (!fs.existsSync(f)) throw new Error("O guia não está instalado nesta versão.");
  return shell.openExternal(require("url").pathToFileURL(f).href + (anchor ? "#" + String(anchor).replace(/[^a-z0-9_-]/gi, "") : ""));
});

/* ---------------------------------------------------------- */
/* Atualização pelo GitHub (leve): baixa só os arquivos mudados,   */
/* confere o SHA-256 de cada um, troca tudo de uma vez e reinicia. */
/* ---------------------------------------------------------- */
const crypto = require("crypto");
const DEFAULT_UPDATE_URL = "https://raw.githubusercontent.com/erikedias/cc-update-7087f9/main";
const APP_ROOT = process.env.CC_APP_ROOT || path.join(__dirname, ".."); // onde moram electron/, src/ e package.json
const updBase = () => ((S().updateBaseUrl || "").trim() || DEFAULT_UPDATE_URL).replace(/\/+$/, "");
const backupDir = () => path.join(app.getPath("userData"), "update-backup");
function appVersion() { try { return JSON.parse(fs.readFileSync(path.join(APP_ROOT, "package.json"), "utf8")).version; } catch { return "0.0.0"; } }
const verNum = (v) => String(v || "0").split(".").map((n) => parseInt(n, 10) || 0);
function isNewer(a, b) { const x = verNum(a), y = verNum(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; }
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const safeRel = (rel) => typeof rel === "string" && !rel.includes("..") && !path.isAbsolute(rel) && (rel === "package.json" || /^(src|electron)\//.test(rel));
async function fetchManifest() {
  const m = await httpJson(`${updBase()}/update.json?t=${Date.now()}`, {}, 20000);
  if (!m || !m.version || !Array.isArray(m.files)) throw new Error("manifesto de atualização inválido");
  // formato antigo (lista de caminhos) também é aceito
  m.files = m.files.map((f) => (typeof f === "string" ? { path: f } : f)).filter((f) => safeRel(f.path));
  return m;
}
const localSha = (rel) => { try { return sha256(fs.readFileSync(path.join(APP_ROOT, rel))); } catch { return null; } };
ipcMain.handle("update:info", () => ({ version: appVersion(), packaged: app.isPackaged, canRollback: fs.existsSync(path.join(backupDir(), "meta.json")), base: updBase() }));
ipcMain.handle("update:check", async () => {
  // rodando do código-fonte (dev): nunca se atualiza sozinho, para não sobrescrever o trabalho
  if (!app.isPackaged && !process.env.CC_UPDATE_FORCE) return { dev: true, local: appVersion(), hasUpdate: false };
  const m = await fetchManifest(); const local = appVersion();
  return { local, latest: m.version, notes: m.notes || "", hasUpdate: isNewer(m.version, local), changed: m.files.filter((f) => !f.sha256 || f.sha256 !== localSha(f.path)).length };
});
ipcMain.handle("update:apply", async () => {
  if (!app.isPackaged && !process.env.CC_UPDATE_FORCE) throw new Error("Atualização desativada no modo de desenvolvimento.");
  const m = await fetchManifest(); const base = updBase();
  const todo = m.files.filter((f) => !f.sha256 || f.sha256 !== localSha(f.path));
  const tmp = path.join(app.getPath("userData"), "update-tmp"); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  // 1) baixa tudo para uma pasta temporária e confere o hash de cada arquivo
  for (const f of todo) {
    const res = await fetch(`${base}/${f.path.split("/").map(encodeURIComponent).join("/")}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`falhou ao baixar ${f.path} (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (f.sha256 && sha256(buf) !== f.sha256) throw new Error(`arquivo corrompido no download: ${f.path}`);
    const dest = path.join(tmp, f.path); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, buf);
  }
  // 2) guarda uma cópia do que vai ser trocado (para poder voltar atrás)
  const bk = backupDir(); fs.rmSync(bk, { recursive: true, force: true }); fs.mkdirSync(bk, { recursive: true });
  const had = [];
  for (const f of todo) { const cur = path.join(APP_ROOT, f.path); if (fs.existsSync(cur)) { const d = path.join(bk, f.path); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(cur, d); had.push(f.path); } }
  fs.writeFileSync(path.join(bk, "meta.json"), JSON.stringify({ from: appVersion(), to: m.version, had, added: todo.map((f) => f.path).filter((x) => !had.includes(x)) }));
  // 3) troca os arquivos (package.json por último: ele define a versão instalada)
  const order = [...todo.filter((f) => f.path !== "package.json"), ...todo.filter((f) => f.path === "package.json")];
  for (const f of order) { const dest = path.join(APP_ROOT, f.path); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.renameSync(path.join(tmp, f.path), dest + ".new"); fs.renameSync(dest + ".new", dest); }
  fs.rmSync(tmp, { recursive: true, force: true });
  reSignMac();
  if (!process.env.CC_UPDATE_FORCE) setTimeout(() => { app.relaunch(); app.quit(); }, 500);
  return { ok: true, count: todo.length, version: m.version };
});
ipcMain.handle("update:rollback", async () => {
  const bk = backupDir(); const mf = path.join(bk, "meta.json"); if (!fs.existsSync(mf)) throw new Error("Não há versão anterior guardada.");
  const meta = JSON.parse(fs.readFileSync(mf, "utf8"));
  for (const rel of meta.had || []) { const d = path.join(APP_ROOT, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(bk, rel), d); }
  for (const rel of meta.added || []) { try { fs.rmSync(path.join(APP_ROOT, rel)); } catch {} }
  fs.rmSync(bk, { recursive: true, force: true }); reSignMac();
  setTimeout(() => { app.relaunch(); app.quit(); }, 500);
  return { ok: true, version: meta.from };
});
// no Mac, trocar arquivos dentro do .app invalida a assinatura "ad-hoc": refaz (sem custo e sem senha)
function reSignMac() {
  if (process.platform !== "darwin" || !app.isPackaged) return;
  try { const appPath = path.resolve(process.execPath, "..", "..", ".."); if (/\.app$/.test(appPath)) require("child_process").execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], { stdio: "ignore", timeout: 60000 }); } catch (e) { console.warn("re-assinatura:", e.message); }
}

/* ---------------------------------------------------------- */
/* Janela                                                      */
/* ---------------------------------------------------------- */
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1080, minHeight: 640, backgroundColor: "#0A0E14", title: "Central de Campanhas",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: !process.env.CC_SHOT },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.loadFile(path.join(__dirname, "..", "src", "index.html"));
  // modo de conferência visual: CC_SHOT=passos.json roda JS, espera e salva prints, depois fecha
  if (process.env.CC_SHOT) {
    win.webContents.once("did-finish-load", async () => {
      const steps = JSON.parse(fs.readFileSync(process.env.CC_SHOT, "utf8"));
      for (const s of steps) {
        try {
          if (s.js) { const r = await win.webContents.executeJavaScript(s.js); if (s.log) console.log("[shot]", JSON.stringify(r)); }
          if (s.wait) await new Promise((r) => setTimeout(r, s.wait));
          if (s.shot) fs.writeFileSync(s.shot, (await win.webContents.capturePage()).toPNG());
        } catch (e) { console.log("[shot] erro:", e.message); }
      }
      app.quit();
    });
    win.webContents.on("console-message", (_e, level, msg) => { if (level >= 2) console.log("[renderer]", msg); });
  }
}
app.whenReady().then(() => {
  // primeira abertura no Mac da Erik: puxa as chaves do Painel automaticamente
  try {
    const st = readStore();
    if (fs.existsSync(painelStorePath())) {
      const src = JSON.parse(fs.readFileSync(painelStorePath(), "utf8")).settings || {};
      const missing = {}; KEY_FIELDS.forEach((k) => { if (!st.settings[k] && src[k]) missing[k] = src[k]; });
      if (Object.keys(missing).length) applyKeys(missing);
    }
  } catch (e) { console.warn("import painel:", e.message); }
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

// exposto para testes de linha de comando (node scripts/probe.cjs)
module.exports = { _test: { mapLeadTab, parseLeadDate, metaTree, googleTree, linkedinReporteiTree, vaultBundle, parseCreative } };
