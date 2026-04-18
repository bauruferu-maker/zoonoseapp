$out = "C:/Users/leoal/Baurufer/projects/active/zoonoseapp/mvp-plano-cto.html"

$part1 = @'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ZoonoseApp — Plano MVP · CTO Fracionário</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a1628; --surface: #111d35; --surface2: #162240;
    --blue: #3b82f6; --green: #10b981; --red: #ef4444;
    --orange: #f97316; --yellow: #f59e0b;
    --text: #e2e8f0; --muted: #94a3b8; --border: #1e3a5f;
    --mono: 'JetBrains Mono', monospace;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; line-height: 1.7; font-size: 15px; }
  a { color: var(--blue); text-decoration: none; }
  h1, h2, h3, h4 { line-height: 1.3; }

  /* HEADER */
  .site-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .site-header .logo { font-size: 13px; font-weight: 600; color: var(--blue); letter-spacing: .05em; text-transform: uppercase; }
  .site-header .subtitle { font-size: 12px; color: var(--muted); }
  .site-header .badge-version { background: #1e3a5f; color: var(--blue); font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

  /* HERO */
  .hero { padding: 64px 32px 48px; max-width: 900px; margin: 0 auto; }
  .hero-label { font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: var(--green); font-weight: 600; margin-bottom: 16px; }
  .hero h1 { font-size: 40px; font-weight: 700; background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; }
  .hero p { color: var(--muted); font-size: 16px; max-width: 640px; margin-bottom: 32px; }
  .hero-meta { display: flex; gap: 24px; flex-wrap: wrap; }
  .hero-meta span { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .hero-meta span b { color: var(--text); }

  /* INDEX */
  .index-nav { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; margin: 0 32px 48px; max-width: 900px; margin-left: auto; margin-right: auto; padding: 24px 32px; }
  .index-nav h3 { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 16px; }
  .index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
  .index-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; transition: background .15s; font-size: 13px; color: var(--text); }
  .index-item:hover { background: var(--surface2); }
  .index-item .num { color: var(--blue); font-weight: 700; font-size: 11px; min-width: 22px; font-family: var(--mono); }

  /* CONTENT */
  .content { max-width: 900px; margin: 0 auto; padding: 0 32px 80px; }

  /* BLOCK */
  .block { margin-bottom: 64px; }
  .block-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
  .block-num { font-size: 52px; font-weight: 800; background: linear-gradient(135deg, var(--blue), var(--green)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; font-family: var(--mono); min-width: 80px; }
  .block-title { flex: 1; }
  .block-title h2 { font-size: 22px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .block-title .block-desc { color: var(--muted); font-size: 14px; }

  /* CARD */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
  .card h4 { font-size: 13px; font-weight: 600; color: var(--blue); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
  .card p, .card li { font-size: 14px; color: var(--text); }
  .card ul { padding-left: 18px; }
  .card ul li { margin-bottom: 6px; }

  /* CALLOUT */
  .callout { border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; font-size: 14px; border-left: 3px solid; }
  .callout.red { background: rgba(239,68,68,.08); border-color: var(--red); color: #fca5a5; }
  .callout.green { background: rgba(16,185,129,.08); border-color: var(--green); color: #6ee7b7; }
  .callout.blue { background: rgba(59,130,246,.08); border-color: var(--blue); color: #93c5fd; }
  .callout.yellow { background: rgba(245,158,11,.08); border-color: var(--yellow); color: #fcd34d; }
  .callout strong { display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .1em; opacity: .7; }

  /* BADGE */
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: .08em; text-transform: uppercase; }
  .badge.critico { background: rgba(239,68,68,.15); color: var(--red); border: 1px solid rgba(239,68,68,.3); }
  .badge.alto { background: rgba(249,115,22,.15); color: var(--orange); border: 1px solid rgba(249,115,22,.3); }
  .badge.medio { background: rgba(59,130,246,.15); color: var(--blue); border: 1px solid rgba(59,130,246,.3); }
  .badge.baixo { background: rgba(100,116,139,.15); color: var(--muted); border: 1px solid rgba(100,116,139,.3); }
  .badge.p0 { background: rgba(239,68,68,.15); color: var(--red); border: 1px solid rgba(239,68,68,.3); }
  .badge.p1 { background: rgba(249,115,22,.15); color: var(--orange); border: 1px solid rgba(249,115,22,.3); }
  .badge.p2 { background: rgba(100,116,139,.15); color: var(--muted); border: 1px solid rgba(100,116,139,.3); }
  .badge.sim { background: rgba(16,185,129,.15); color: var(--green); border: 1px solid rgba(16,185,129,.3); }
  .badge.nao { background: rgba(239,68,68,.15); color: var(--red); border: 1px solid rgba(239,68,68,.3); }

  /* TABLE */
  .tbl-wrap { overflow-x: auto; margin-bottom: 20px; border-radius: 10px; border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { background: var(--surface2); }
  th { padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 600; white-space: nowrap; }
  td { padding: 10px 14px; border-top: 1px solid var(--border); color: var(--text); vertical-align: top; }
  tr:hover td { background: rgba(30,58,95,.3); }

  /* CODE */
  pre { background: #0f172a; border: 1px solid var(--border); border-radius: 10px; padding: 20px; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.6; margin-bottom: 20px; color: #e2e8f0; }
  code { font-family: var(--mono); font-size: 12px; background: rgba(30,58,95,.5); padding: 1px 6px; border-radius: 4px; color: #93c5fd; }

  /* GRID */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 16px; }
  @media (max-width: 700px) { .grid2, .grid3 { grid-template-columns: 1fr; } }

  /* STEP */
  .step { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
  .step-num { background: linear-gradient(135deg, var(--blue), var(--green)); color: #fff; font-size: 12px; font-weight: 700; min-width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-body h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .step-body p { font-size: 13px; color: var(--muted); }

  /* TAG */
  .tag { display: inline-block; font-size: 11px; background: var(--surface2); border: 1px solid var(--border); padding: 2px 8px; border-radius: 6px; color: var(--muted); margin: 2px; }

  /* HIGHLIGHT BOX */
  .highlight-box { background: linear-gradient(135deg, rgba(59,130,246,.1), rgba(16,185,129,.1)); border: 1px solid rgba(59,130,246,.3); border-radius: 12px; padding: 24px 28px; margin-bottom: 24px; }
  .highlight-box p { font-size: 15px; color: var(--text); font-style: italic; }
  .highlight-box .author { font-size: 12px; color: var(--muted); margin-top: 10px; font-style: normal; }

  /* FOOTER */
  footer { border-top: 1px solid var(--border); padding: 24px 32px; text-align: center; font-size: 12px; color: var(--muted); }

  /* PRINT */
  @media print {
    body { background: #fff; color: #000; }
    .site-header { position: static; background: #fff; border-bottom: 1px solid #ccc; }
    .block { page-break-inside: avoid; }
    pre { border: 1px solid #ccc; background: #f8f8f8; color: #000; }
    .card { background: #f8f8f8; border: 1px solid #ccc; }
  }
</style>
</head>
<body>

<header class="site-header">
  <div>
    <div class="logo">ZoonoseApp</div>
    <div class="subtitle">Plano MVP · CTO Fracionário</div>
  </div>
  <span class="badge-version">v1.0 · Março 2026</span>
</header>

<div class="hero">
  <div class="hero-label">Plano de Execução</div>
  <h1>MVP do ZoonoseApp</h1>
  <p>Plano completo de produto, arquitetura, backlog e execução para founders não técnicos que precisam tirar um MVP do papel em tempo real — sem overengineering, sem equipe grande, sem hype.</p>
  <div class="hero-meta">
    <span>📱 <b>Android-first</b></span>
    <span>🏗️ <b>Expo + Supabase + Next.js</b></span>
    <span>⏱️ <b>4–5 semanas até demo</b></span>
    <span>💰 <b>R$ 8–15k investimento</b></span>
    <span>📋 <b>14 blocos · decisões reais</b></span>
  </div>
</div>

<nav class="index-nav">
  <h3>Índice</h3>
  <div class="index-grid">
    <a href="#b1" class="index-item"><span class="num">01</span> Decisão Central</a>
    <a href="#b2" class="index-item"><span class="num">02</span> Definição do MVP</a>
    <a href="#b3" class="index-item"><span class="num">03</span> Arquitetura</a>
    <a href="#b4" class="index-item"><span class="num">04</span> Modelagem do Sistema</a>
    <a href="#b5" class="index-item"><span class="num">05</span> Fluxos e Telas</a>
    <a href="#b6" class="index-item"><span class="num">06</span> Passo a Passo de Execução</a>
    <a href="#b7" class="index-item"><span class="num">07</span> Backlog Técnico Atômico</a>
    <a href="#b8" class="index-item"><span class="num">08</span> O que Founders Fazem Sozinhos</a>
    <a href="#b9" class="index-item"><span class="num">09</span> O que Vale Terceirizar</a>
    <a href="#b10" class="index-item"><span class="num">10</span> Cronograma</a>
    <a href="#b11" class="index-item"><span class="num">11</span> Prompts para Subagentes</a>
    <a href="#b12" class="index-item"><span class="num">12</span> Critérios de Demo</a>
    <a href="#b13" class="index-item"><span class="num">13</span> O que NÃO Fazer Agora</a>
    <a href="#b14" class="index-item"><span class="num">14</span> Recomendação Final</a>
  </div>
</nav>

<main class="content">
'@

Set-Content -Path $out -Value $part1 -Encoding UTF8
Write-Output "part1 done"
