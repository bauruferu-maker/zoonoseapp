# ZoonoseApp — Roadmap de Execucao

> Criado: 2026-03-25 | Status: ATIVO
> Meta: Produto SaaS completo de vigilância em zoonoses — dashboard web + app mobile — pronto para venda a prefeituras

---

## Fase 1 — Dashboard Web MVP
> Painel web para coordenadores e gestores

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| ~~1.1~~ | ~~Schema Supabase (5 migrations)~~ | Media | 4h | FEITO 2026-03-25 |
| ~~1.2~~ | ~~4 setores + 15 imoveis de Bauru com coordenadas reais~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~1.3~~ | ~~4 usuarios de teste com roles~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~1.4~~ | ~~97 visitas seed distribuidas realisticamente~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~1.5~~ | ~~Dashboard com KPIs + cobertura por setor + grafico~~ | Media | 6h | FEITO 2026-03-25 |
| ~~1.6~~ | ~~Mapa Operacional com Leaflet (15 pins coloridos por status)~~ | Media | 6h | FEITO 2026-03-25 |
| ~~1.7~~ | ~~Pagina de Visitas (filtros, badges coloridos, export CSV)~~ | Media | 4h | FEITO 2026-03-25 |
| ~~1.8~~ | ~~Pagina de Imoveis (busca, filtro setor, foco recorrente)~~ | Media | 4h | FEITO 2026-03-25 |
| ~~1.9~~ | ~~Pagina de Agentes (cards com setor e visitas)~~ | Baixa | 3h | FEITO 2026-03-25 |
| ~~1.10~~ | ~~Pagina de Relatorios (7d/14d/30d, graficos, produtividade)~~ | Media | 6h | FEITO 2026-03-25 |
| ~~1.11~~ | ~~Sidebar dinamica por role + logout~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~1.12~~ | ~~Login generico ("Painel de Vigilancia em Zoonoses")~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~1.13~~ | ~~Deploy Netlify em producao~~ | Baixa | 1h | FEITO 2026-03-25 |

**Status: CONCLUIDA**

---

## Fase 2 — Fila de Trabalho
> Priorizacao automatica de imoveis para visita

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| ~~2.1~~ | ~~View vw_work_queue (priorizacao automatica)~~ | Media | 4h | FEITO 2026-03-25 |
| ~~2.2~~ | ~~View vw_sector_coverage (cobertura do ciclo)~~ | Media | 3h | FEITO 2026-03-25 |
| ~~2.3~~ | ~~Pagina de Fila de Trabalho com checkboxes, filtros, criar fila~~ | Alta | 8h | FEITO 2026-03-25 |
| ~~2.4~~ | ~~Dashboard mostra cobertura por setor~~ | Baixa | 2h | FEITO 2026-03-25 |

**Status: CONCLUIDA**

---

## Fase 3 — Validacao e Polimento
> Testes funcionais e melhorias de UX

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| ~~3.1~~ | ~~Testar login como gestor — OK~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~3.2~~ | ~~Testar fluxo completo: selecionar imoveis → criar fila → verificar se salvou — OK~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~3.3~~ | ~~Testar export CSV na pagina de Visitas — OK~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~3.4~~ | ~~Testar filtros (setor na Fila de Trabalho) — OK~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~3.5~~ | ~~Ordenar visitas por `visited_at` em vez de `created_at`~~ | Baixa | 1h | FEITO 2026-03-25 |

**Status: CONCLUIDA**

---

## Fase 4 — App Mobile
> Agente de campo usa o app para registrar visitas

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| ~~4.1~~ | ~~Projeto Expo + TypeScript criado (mobile/)~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~4.2~~ | ~~Dependencias: @supabase/supabase-js, @react-navigation, AsyncStorage, url-polyfill~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~4.3~~ | ~~Supabase client configurado com .env~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~4.4~~ | ~~AuthContext (login, logout, perfil persistido)~~ | Media | 3h | FEITO 2026-03-25 |
| ~~4.5~~ | ~~Tela de Login (email/senha, visual verde ZoonoseApp)~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~4.6~~ | ~~Tela "Minha Fila do Dia" (busca daily_routes, progresso, lista priorizada)~~ | Media | 6h | FEITO 2026-03-25 |
| ~~4.7~~ | ~~Tela "Registrar Visita" (5 status, tipo foco, acao, observacao)~~ | Media | 6h | FEITO 2026-03-25 |
| ~~4.8~~ | ~~Navegacao: Login → Fila → Registrar Visita (auto-redirect)~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~4.9~~ | ~~Camera/foto (expo-image-picker + upload Supabase Storage)~~ | Media | 4h | FEITO 2026-03-25 |
| ~~4.10~~ | ~~Modo offline (expo-sqlite localDb.ts + SyncContext via NetInfo)~~ | Alta | 10h | FEITO 2026-03-25 |
| ~~4.11~~ | ~~Indicadores online/offline (barra verde/vermelha + badge pendentes)~~ | Baixa | 2h | FEITO 2026-03-25 |
| ~~4.12~~ | ~~Dashboard com auto-refresh 30s + Progresso do Dia por agente~~ | Media | 4h | FEITO 2026-03-25 |
| ~~4.13~~ | ~~Exportacao PDF nos relatorios (window.print + @media print CSS)~~ | Media | 3h | FEITO 2026-03-25 |
| ~~4.14~~ | ~~app.json configurado (branding, permissoes, plugins)~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~4.15~~ | ~~eas.json criado (perfis preview APK + production AAB)~~ | Baixa | 1h | FEITO 2026-03-25 |
| 4.16 | Executar `eas build` para gerar APK de teste | Media | 3h | PENDENTE — requer Lukas |
| ~~4.17~~ | ~~Adicionar coluna `photo_url` + colunas anti-fraude na tabela `visits` (migration 007)~~ | Baixa | 1h | FEITO 2026-03-25 |
| ~~4.18~~ | ~~Push notifications (Expo Notifications + Expo Push API)~~ | Alta | 8h | FEITO 2026-03-25 |
| 4.19 | Publicar na Play Store | Media | 4h | PENDENTE — requer Lukas |
| ~~4.20~~ | ~~Auditoria completa anti-fraude: 14 bugs corrigidos (C1-C5, A1-A4, M1-M5)~~ | Alta | 6h | FEITO 2026-03-25 |
| ~~4.21~~ | ~~Migration 009: colunas TEXT visit_type/focus_type/action_taken~~ | Baixa | 1h | FEITO 2026-03-25 |

**Status: QUASE CONCLUIDA (2 pendentes — ambas requerem Lukas)**

---

## Fase 5 — Producao Real
> Primeiro cliente prefeitura

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| 5.1 | Onboarding de prefeitura parceira (coletar dados reais) | Media | 4h | PENDENTE |
| 5.2 | Migrar seed de Bauru para dados reais da prefeitura | Media | 4h | PENDENTE |
| 5.3 | Treinamento de usuarios (agentes, coordenadores, gestores) | Baixa | 4h | PENDENTE |
| 5.4 | Integracao com SINAN/LIRAa (sistemas do SUS) | Alta | 16h | PENDENTE |
| 5.5 | Monitoramento em producao (logs, alertas de erro) | Media | 6h | PENDENTE |
| 5.6 | SLA de suporte definido + contrato assinado | Baixa | 2h | PENDENTE |

**Status: FUTURA**

---

## Fase 6 — Monetizacao SaaS
> Transformar em produto comercial multi-prefeitura

| # | Tarefa | Complexidade | Tempo | Status |
|---|--------|-------------|-------|--------|
| 6.1 | Multi-tenant: isolamento de dados por prefeitura (RLS por org) | Alta | 12h | PENDENTE |
| 6.2 | Pagina de precos + planos para prefeituras | Media | 6h | PENDENTE |
| 6.3 | Onboarding self-service (nova prefeitura cria conta sozinha) | Alta | 10h | PENDENTE |
| 6.4 | Cobranca via Asaas ou boleto (prefeituras pagam por licitacao) | Alta | 8h | PENDENTE |
| 6.5 | White-label (logo da prefeitura no painel) | Media | 6h | PENDENTE |
| 6.6 | Relatorio mensal automatico para secretaria de saude | Media | 6h | PENDENTE |

**Status: FUTURA**

---

## RESUMO GERAL

| Fase | Foco | Status | Pendentes |
|------|------|--------|-----------|
| 1 | Dashboard Web MVP | **CONCLUIDA** | 0 |
| 2 | Fila de Trabalho | **CONCLUIDA** | 0 |
| 3 | Validacao e Polimento | **CONCLUIDA** | 0 |
| 4 | App Mobile | **QUASE CONCLUIDA** | 2 (ambas requerem Lukas) |
| 5 | Producao Real | FUTURA | 6 |
| 6 | Monetizacao SaaS | FUTURA | 6 |

**Proximo passo imediato**: 4.16 — `eas build` (requer Lukas) e 4.19 — Play Store (requer Lukas)

---

## Regras de Execucao

1. **Uma tarefa por vez** — nao pular, nao agrupar
2. **Nao quebrar o que funciona** — sempre ler o codigo antes de editar
3. **Migrations SQL em arquivos separados** — nunca editar o schema direto
4. **Codigo limpo** — sem console.log desnecessario, sem TODO, sem dead code
5. **Marcar no ROADMAP** com `~~texto~~` e data ao concluir
6. **Tarefas que requerem Lukas** — documentar e pular para a proxima executavel
7. **Prioridade**: Fase 3 CRITICA → Fase 4 → Fase 5 → Fase 6
8. **Build e deploy** apos cada mudanca no dashboard web
