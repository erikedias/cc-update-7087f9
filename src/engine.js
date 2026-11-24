/* Métricas, benchmarks e gargalo — mesmas regras do Painel de Mídia Paga.
 * Taxa = (métrica × 100) ÷ base. Gargalo = primeira taxa abaixo do benchmark descendo o funil. */
(function (root) {
  const pct = (a, b) => (a == null || !b ? null : (a * 100) / b);
  const div = (a, b) => (a == null || !b ? null : a / b);

  const OBJ = {
    OUTCOME_LEADS: "Cadastros", LEAD_GENERATION: "Cadastros", OUTCOME_SALES: "Vendas", CONVERSIONS: "Vendas", OUTCOME_TRAFFIC: "Tráfego", LINK_CLICKS: "Tráfego",
    OUTCOME_ENGAGEMENT: "Engajamento", OUTCOME_AWARENESS: "Reconhecimento", REACH: "Alcance", OUTCOME_APP_PROMOTION: "App", MESSAGES: "Mensagens", VIDEO_VIEWS: "Visualizações",
  };
  const CHANNEL = { SEARCH: "Pesquisa", PERFORMANCE_MAX: "Performance Max", DISPLAY: "Display", VIDEO: "Vídeo", DEMAND_GEN: "Demand Gen", SHOPPING: "Shopping", MULTI_CHANNEL: "App" };

  // taxa de preenchimento: formulário nativo ≥ 40% · site/LP ≥ 10%
  const FILL = { native: 40, site: 10 };
  const FORM_LABEL = { native: "formulário nativo", site: "site/LP" };
  const fillBench = (t) => FILL[t] || FILL.site;
  // qual "resultado" faz sentido para cada objetivo do Meta
  function metaResult(m, objective) {
    if (!m) return { key: "leads", label: "Leads", value: null };
    const o = objective || "";
    if (/SALES|CONVERSIONS/.test(o) && m.purchases) return { key: "purchases", label: "Compras", value: m.purchases };
    if (/ENGAGEMENT|MESSAGES/.test(o) && m.conversations) return { key: "conversations", label: "Conversas", value: m.conversations };
    if (/TRAFFIC|LINK/.test(o) && !m.leads) return { key: "lpv", label: "Visitas na página", value: m.lpv || m.linkClicks };
    return { key: "leads", label: "Leads", value: m.leads };
  }

  /* funil de cada plataforma: etapas + taxas com benchmark */
  function funnel(platform, m, ctx) {
    ctx = ctx || {};
    if (!m) return [];
    if (platform === "meta") {
      const r = metaResult(m, ctx.objective);
      return [
        { label: "Investimento", value: m.spend, money: true },
        { label: "Impressões", value: m.impressions },
        { label: "Cliques no link", value: m.linkClicks, rate: { label: "CTR", value: pct(m.linkClicks, m.impressions), bench: 1, base: m.impressions, min: 500 } },
        { label: r.label, value: r.value, rate: r.key === "leads" ? { label: "Tx. preench.", value: pct(m.leads, m.linkClicks), bench: fillBench(ctx.formType), note: FORM_LABEL[ctx.formType || "site"], base: m.linkClicks, min: 30 } : { label: "Conversão", value: pct(r.value, m.linkClicks), base: m.linkClicks } },
      ];
    }
    if (platform === "google") {
      const search = !ctx.channel || ctx.channel === "SEARCH" || ctx.mixedSearch;
      return [
        { label: "Investimento", value: m.spend, money: true },
        { label: "Impressões", value: m.impressions },
        { label: "Cliques", value: m.clicks, rate: { label: "CTR", value: pct(m.clicks, m.impressions), bench: search ? 5 : null, base: m.impressions, min: 300 } },
        { label: "Conversões", value: m.conversions, rate: { label: "Tx. conversão", value: pct(m.conversions, m.clicks), bench: search ? 10 : null, base: m.clicks, min: 30 } },
      ];
    }
    if (platform === "linkedin") {
      if (m.sends) {
        const steps = [
          { label: "Investimento", value: m.spend, money: true },
          { label: "Envios", value: m.sends },
          { label: "Aberturas", value: m.opens, rate: { label: "Tx. abertura", value: pct(m.opens, m.sends), bench: 50, base: m.sends, min: 100 } },
          { label: "Cliques no formulário", value: m.actionClicks, rate: { label: "Tx. cliques", value: pct(m.actionClicks, m.opens), bench: 1.5, base: m.opens, min: 50 } },
        ];
        if (m.leads != null && ctx.withLeads !== false) steps.push({ label: "Leads", value: m.leads, rate: { label: "Tx. preench.", value: pct(m.leads, m.actionClicks), bench: 40, note: "formulário nativo", base: m.actionClicks, min: 5 } });
        return steps;
      }
      const steps = [
        { label: "Investimento", value: m.spend, money: true },
        { label: "Impressões", value: m.impressions },
        { label: "Cliques", value: m.clicks, rate: { label: "CTR", value: pct(m.clicks, m.impressions), base: m.impressions } },
      ];
      if (m.formOpens) steps.push({ label: "Aberturas do formulário", value: m.formOpens, rate: { label: "Tx. abert. form.", value: pct(m.formOpens, m.clicks), base: m.clicks } });
      if (m.leads != null && ctx.withLeads !== false && (m.leads || m.formOpens)) steps.push({ label: "Leads", value: m.leads, rate: { label: "Tx. preench.", value: pct(m.leads, m.formOpens || m.clicks), bench: 40, note: "formulário nativo", base: m.formOpens || m.clicks, min: 5 } });
      else if (m.conversions) steps.push({ label: "Conversões no site", value: m.conversions, rate: { label: "Tx. conversão", value: pct(m.conversions, m.clicks), bench: 10, note: "site/LP", base: m.clicks, min: 30 } });
      return steps;
    }
    return [];
  }

  function bottleneck(steps) {
    for (const s of steps) {
      const r = s.rate; if (!r || r.bench == null || r.value == null) continue;
      if (r.min && (r.base || 0) < r.min) continue;
      if (r.value < r.bench) return { step: s.label, rate: r.label, value: r.value, bench: r.bench };
    }
    return null;
  }
  // gargalo com sinal de "volume baixo" quando não dá pra afirmar
  function diagnose(platform, m, ctx) {
    const steps = funnel(platform, m, ctx);
    const g = bottleneck(steps);
    if (g) return { kind: "bad", ...g, steps };
    const rated = steps.filter((s) => s.rate && s.rate.bench != null && s.rate.value != null);
    if (!rated.length) return { kind: "none", steps };
    const lowVol = rated.some((s) => s.rate.min && (s.rate.base || 0) < s.rate.min);
    return { kind: lowVol ? "low" : "ok", steps };
  }

  /* colunas da tabela de campanhas */
  function columns(platform, ctx) {
    ctx = ctx || {};
    if (platform === "meta") return [
      { k: "spend", label: "Invest.", fmt: "money" },
      { k: "impressions", label: "Impr.", fmt: "int" },
      { k: "linkClicks", label: "Cliques", fmt: "int" },
      { k: "_ctr", label: "CTR", fmt: "pct", bench: 1, get: (m) => pct(m.linkClicks, m.impressions) },
      { k: "_res", label: "Result.", fmt: "int", get: (m, row) => metaResult(m, row.objective).value },
      { k: "_cpr", label: "Custo/res.", fmt: "money", get: (m, row) => div(m.spend, metaResult(m, row.objective).value) },
      { k: "_fill", label: "Tx. preench.", fmt: "pct", bench: (row) => fillBench(row.formType), get: (m, row) => (metaResult(m, row.objective).key === "leads" ? pct(m.leads, m.linkClicks) : null) },
      { k: "frequency", label: "Freq.", fmt: "dec" },
    ];
    if (platform === "google") return [
      { k: "spend", label: "Invest.", fmt: "money" },
      { k: "impressions", label: "Impr.", fmt: "int" },
      { k: "clicks", label: "Cliques", fmt: "int" },
      { k: "_ctr", label: "CTR", fmt: "pct", bench: 5, searchOnly: true, get: (m) => pct(m.clicks, m.impressions) },
      { k: "_cpc", label: "CPC", fmt: "money", get: (m) => div(m.spend, m.clicks) },
      { k: "conversions", label: "Conv.", fmt: "dec1" },
      { k: "_cr", label: "Tx. conv.", fmt: "pct", bench: 10, searchOnly: true, get: (m) => pct(m.conversions, m.clicks) },
      { k: "_cpa", label: "Custo/conv.", fmt: "money", get: (m) => div(m.spend, m.conversions) },
      { k: "impressionShare", label: "Parcela impr.", fmt: "share" },
    ];
    if (platform === "linkedin") {
      // leads de formulário nativo do LinkedIn: preenchimento = leads ÷ aberturas do formulário (ou cliques no formulário da mensagem), meta 40%
      const fillBase = (m) => (m.sends ? m.actionClicks : m.formOpens) || null; // mensagens: leads ÷ cliques no formulário (regra do Painel)
      const tail = [
        { k: "leads", label: "Leads", fmt: "int" },
        { k: "_fill", label: "Tx. preench.", fmt: "pct", bench: 40, get: (m) => pct(m.leads, fillBase(m)) },
        { k: "_cpl", label: "CPL", fmt: "money", get: (m) => div(m.spend, m.leads) },
      ];
      return ctx.messages ? [
        { k: "spend", label: "Invest.", fmt: "money" },
        { k: "sends", label: "Envios", fmt: "int" },
        { k: "_or", label: "Tx. abert.", fmt: "pct", bench: 50, get: (m) => (m.sends ? pct(m.opens, m.sends) : null) },
        { k: "actionClicks", label: "Cliq. form.", fmt: "int" },
        { k: "_cr", label: "Tx. cliques", fmt: "pct", bench: 1.5, get: (m) => (m.sends ? pct(m.actionClicks, m.opens) : null) },
        ...tail,
        { k: "impressions", label: "Impr.", fmt: "int" },
      ] : [
        { k: "spend", label: "Invest.", fmt: "money" },
        { k: "impressions", label: "Impr.", fmt: "int" },
        { k: "clicks", label: "Cliques", fmt: "int" },
        { k: "_ctr", label: "CTR", fmt: "pct", get: (m) => pct(m.clicks, m.impressions) },
        { k: "formOpens", label: "Abert. form.", fmt: "int" },
        ...tail,
      ];
    }
    return [];
  }

  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function fmt(v, kind, cur) {
    if (v == null || Number.isNaN(v)) return "—";
    switch (kind) {
      case "money": return (cur && cur !== "BRL" ? cur + " " : "R$ ") + (Math.abs(v) >= 10000 ? nf0.format(v) : nf2.format(v));
      case "int": return Math.abs(v) >= 100000 ? nf1.format(v / 1000) + " mil" : nf0.format(v);
      case "pct": return nf2.format(v) + "%";
      case "share": return v ? nf0.format(v * 100) + "%" : "—";
      case "dec": return nf2.format(v);
      case "dec1": return nf1.format(v);
      default: return String(v);
    }
  }


  /* ---------- campanhas de engajamento (sem benchmark: o que importa é volume, taxa e custo) ---------- */
  const isEngage = (cp) => !!cp && cp.kind === "engage";
  function columnsEngage(platform, agg) {
    const has = (k) => k && (agg ? (agg[k] || 0) > 0 : true);
    const cpe = { k: "_cpe", label: "Custo/engaj.", fmt: "money", get: (m) => div(m.spend, m.engagements) };
    const er = { k: "_er", label: "Tx. engaj.", fmt: "pct", get: (m) => pct(m.engagements, m.impressions) };
    const sets = {
      meta: [
        { k: "spend", label: "Invest.", fmt: "money" }, { k: "impressions", label: "Impr.", fmt: "int" },
        { k: "reach", label: "Alcance", fmt: "int", opt: "reach" },
        { k: "engagements", label: "Engaj.", fmt: "int" }, er, cpe,
        { k: "reactions", label: "Reações", fmt: "int", opt: "reactions" }, { k: "comments", label: "Coment.", fmt: "int", opt: "comments" },
        { k: "shares", label: "Compart.", fmt: "int", opt: "shares" }, { k: "saves", label: "Salvam.", fmt: "int", opt: "saves" },
        { k: "pageLikes", label: "Curtidas pág.", fmt: "int", opt: "pageLikes" },
        { k: "video3s", label: "Views 3s", fmt: "int", opt: "video3s" }, { k: "thruplay", label: "ThruPlay", fmt: "int", opt: "thruplay" },
        { k: "_cpt", label: "Custo/ThruPlay", fmt: "money", opt: "thruplay", get: (m) => div(m.spend, m.thruplay) },
        { k: "frequency", label: "Freq.", fmt: "dec" },
      ],
      linkedin: [
        { k: "spend", label: "Invest.", fmt: "money" }, { k: "impressions", label: "Impr.", fmt: "int" }, { k: "clicks", label: "Cliques", fmt: "int" },
        { k: "engagements", label: "Engaj.", fmt: "int" }, er, cpe,
        { k: "reactions", label: "Reações", fmt: "int", opt: "reactions" }, { k: "comments", label: "Coment.", fmt: "int", opt: "comments" },
        { k: "shares", label: "Compart.", fmt: "int", opt: "shares" }, { k: "follows", label: "Seguid.", fmt: "int", opt: "follows" },
        { k: "videoViews", label: "Views vídeo", fmt: "int", opt: "videoViews" },
        { k: "_vr", label: "Tx. view", fmt: "pct", opt: "videoViews", get: (m) => pct(m.videoViews, m.impressions) },
        { k: "_cpv", label: "Custo/view", fmt: "money", opt: "videoViews", get: (m) => div(m.spend, m.videoViews) },
        { k: "videoCompletions", label: "Concl. vídeo", fmt: "int", opt: "videoCompletions" },
      ],
      google: [
        { k: "spend", label: "Invest.", fmt: "money" }, { k: "impressions", label: "Impr.", fmt: "int" }, { k: "clicks", label: "Cliques", fmt: "int" },
        { k: "videoViews", label: "Views vídeo", fmt: "int", opt: "videoViews" },
        { k: "_vr", label: "Tx. view", fmt: "pct", opt: "videoViews", get: (m) => pct(m.videoViews, m.impressions) },
        { k: "_cpv", label: "CPV", fmt: "money", opt: "videoViews", get: (m) => div(m.spend, m.videoViews) },
        { k: "engagements", label: "Engaj.", fmt: "int", opt: "engagements" },
        { k: "interactions", label: "Interações", fmt: "int", opt: "interactions" },
        { k: "_ir", label: "Tx. interação", fmt: "pct", opt: "interactions", get: (m) => pct(m.interactions, m.impressions) },
        { k: "_cpm", label: "CPM", fmt: "money", get: (m) => (m.impressions ? (m.spend * 1000) / m.impressions : null) },
      ],
    };
    return (sets[platform] || []).filter((c) => !c.opt || has(c.opt));
  }
  // resumo da conta/anúncio: investimento → impressões → engajamentos → vídeo → custos
  function funnelEngage(platform, m) {
    if (!m) return [];
    const steps = [{ label: "Investimento", value: m.spend, money: true }, { label: "Impressões", value: m.impressions }];
    const eng = platform === "google" ? (m.engagements || m.interactions) : m.engagements;
    if (eng || platform !== "google") steps.push({ label: platform === "google" && !m.engagements ? "Interações" : "Engajamentos", value: eng, rate: { label: "Tx. engaj.", value: pct(eng, m.impressions), base: m.impressions } });
    const views = platform === "meta" ? m.thruplay : m.videoViews;
    if (views) steps.push({ label: platform === "meta" ? "ThruPlay" : "Views de vídeo", value: views, rate: { label: platform === "meta" ? "ThruPlay ÷ impr." : "Tx. view", value: pct(views, m.impressions), base: m.impressions } });
    if (eng) steps.push({ label: "Custo/engaj.", value: div(m.spend, eng), money: true });
    if (views) steps.push({ label: platform === "meta" ? "Custo/ThruPlay" : "Custo/view", value: div(m.spend, views), money: true });
    return steps;
  }
  // detalhes que explicam o engajamento (só os que têm valor)
  function engageBreakdown(platform, m) {
    if (!m) return [];
    const l = platform === "meta"
      ? [["Reações", m.reactions], ["Comentários", m.comments], ["Compartilhamentos", m.shares], ["Salvamentos", m.saves], ["Curtidas na página", m.pageLikes], ["Views de 3s", m.video3s], ["Alcance", m.reach]]
      : platform === "linkedin"
        ? [["Reações", m.reactions], ["Comentários", m.comments], ["Compartilhamentos", m.shares], ["Novos seguidores", m.follows], ["Conclusões de vídeo", m.videoCompletions], ["Cliques", m.clicks]]
        : [["Interações", m.interactions], ["Cliques", m.clicks]];
    return l.filter(([, v]) => v).map(([label, value]) => ({ label, value }));
  }

  const api = { isEngage, columnsEngage, funnelEngage, engageBreakdown, FILL, FORM_LABEL, fillBench, pct, div, funnel, diagnose, bottleneck, columns, fmt, metaResult, OBJ, CHANNEL };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== "undefined" ? window : globalThis);
