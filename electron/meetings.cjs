/* Reuniões sem Obsidian: funções puras (achatar Google Docs, casar evento da agenda com o cliente, montar o texto das reuniões) */
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Google Docs -> texto puro (com abas, tabelas e listas)
function flattenDoc(doc) {
  const out = [];
  const para = (p) => (p.elements || []).map((e) => (e.textRun ? e.textRun.content : e.person ? ((e.person.personProperties || {}).name || "") : "")).join("");
  const walk = (content) => {
    for (const el of content || []) {
      if (el.paragraph) out.push(para(el.paragraph).replace(/\u000b/g, "\n"));
      else if (el.table) for (const row of el.table.tableRows || []) out.push((row.tableCells || []).map((cell) => { const sub = []; const keep = out.length; walk(cell.content); const t = out.splice(keep).join("").replace(/\n+/g, " ").trim(); return t; }).join(" | ") + "\n");
    }
  };
  const tabs = (list) => { for (const t of list || []) { const body = t.documentTab && t.documentTab.body; if (body) { const title = t.tabProperties && t.tabProperties.title; if (title && (list.length > 1 || (t.childTabs || []).length)) out.push(`\n## ${title}\n`); walk(body.content); } tabs(t.childTabs); } };
  if (doc.tabs && doc.tabs.length) tabs(doc.tabs); else if (doc.body) walk(doc.body.content);
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

// a reunião é deste cliente? olha o título e os convidados
function eventMatchesClient(ev, client) {
  const title = " " + norm(ev.summary) + " ";
  if (!title.trim()) return false;
  const names = [client.name, client.reporteiName, client.vaultFolder, ...(client.meetingAliases || [])].filter(Boolean).map(norm).filter((n) => n.length >= 3);
  return names.some((n) => title.includes(" " + n + " "));
}

// anexos do evento que são Google Docs (notas do Gemini / transcrição)
function docAttachments(ev) {
  return (ev.attachments || []).filter((a) => a.mimeType === "application/vnd.google-apps.document" || /docs\.google\.com\/document/.test(a.fileUrl || "")).map((a) => ({
    id: a.fileId || ((/\/d\/([\w-]+)/.exec(a.fileUrl || "") || [])[1]), title: a.title || "",
  })).filter((a) => a.id);
}

// notas do Gemini ("Anotações") são melhores que a transcrição crua: marca o tipo
function docKind(title, text) {
  if (/anota[cç][oõ]es|notes by gemini|resumo/i.test(title) || /^(resumo|summary)\b/im.test((text || "").slice(0, 400))) return "notas";
  return /transcri/i.test(title) ? "transcricao" : "notas";
}

const MAX_PER = 40000, MAX_TOTAL = 220000;
// junta reuniões de todas as fontes; Obsidian vence quando há a mesma data; o mais recente tem prioridade no limite
function mergeMeetings(list) {
  const byDate = new Map();
  const rank = { obsidian: 3, google: 2, manual: 1 };
  for (const m of list) { if (!m.text || !m.date) continue; const k = m.date; const cur = byDate.get(k) || []; cur.push(m); byDate.set(k, cur); }
  const out = [];
  for (const [date, arr] of byDate) {
    const hasObs = arr.some((m) => m.source === "obsidian");
    const keep = hasObs ? arr.filter((m) => m.source === "obsidian" || m.source === "manual") : arr;
    keep.sort((a, b) => (rank[b.source] || 0) - (rank[a.source] || 0) || (a.kind === "notas" ? -1 : 1));
    out.push(...keep);
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  let total = 0; const picked = [];
  for (const m of out) { const t = m.text.slice(0, MAX_PER); if (total + t.length > MAX_TOTAL && picked.length) break; total += t.length; picked.push({ ...m, text: t }); }
  return picked.sort((a, b) => a.date.localeCompare(b.date)); // cronológico
}

function meetingsStamp(list) {
  const s = list.map((m) => `${m.source}|${m.date}|${m.text.length}|${m.text.slice(0, 40)}`).sort().join(";");
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return `${list.length}:${h}`;
}

module.exports = { flattenDoc, eventMatchesClient, docAttachments, docKind, mergeMeetings, meetingsStamp, norm };
