# Central de Campanhas

Visão do que está ativo em Meta, Google e LinkedIn, cliente por cliente: campanha → conjunto → criativo, com as métricas e o gargalo pelos benchmarks do Painel de Mídia Paga. No Mac da Erik também mostra "O que estamos atacando" (gargalo, hipótese e solução), lido do cofre Clientes P.O.

## Instalar (time)
✅ Mac com chip M1/M2/M3: `Instaladores/Central de Campanhas-0.1.0-arm64.dmg`
✅ Mac Intel: `Instaladores/Central de Campanhas-0.1.0.dmg`
✅ Windows: `Instaladores/Central de Campanhas Setup 0.1.0.exe`

No Mac, na primeira vez: botão direito no app → Abrir (o app não tem certificado pago da Apple).

## Chaves
A Erik abre Configurações → **Exportar arquivo de chaves** e manda o arquivo em privado. A pessoa abre Configurações → **Importar arquivo de chaves** → **Sincronizar carteira**. Apague o arquivo depois de importar.

## De onde vem cada dado
| Plataforma | Fonte | O que aparece |
|---|---|---|
| Meta | API do Meta (token) · reserva: Reportei | campanhas, conjuntos com segmentação, criativos (imagem, vídeo tocando, carrossel), todas as variações de texto, botão e destino |
| Google | API do Google Ads | campanhas, grupos, anúncios de pesquisa em prévia, display, vídeo do YouTube, grupos de recursos da PMax |
| LinkedIn | Reportei · API do LinkedIn quando conectada | campanhas, funil de mensagens (envios → aberturas → cliques → leads), anúncios com métricas; a copy só aparece com a API do LinkedIn conectada |

## Token do Meta
O token colado no Graph Explorer dura poucas horas. Em Configurações → "Estender o token do Meta para 60 dias", cole o App Secret do app "Assistente de Campanhas" e clique em Estender.

## Desenvolvimento
`npm start` abre o app. `node scripts/probe.cjs meta act_XXX` testa um coletor sem abrir a janela. `npx electron-builder --mac --win nsis --x64` gera os instaladores.
