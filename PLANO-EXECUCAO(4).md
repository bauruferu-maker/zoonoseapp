# ZoonoseApp — Plano de Execução Completo

**Atualizado:** 24 Mar 2026
**Status geral:** Scaffold ~40% do MVP real

---

## Perfis de Usuário

| Perfil | Onde usa | O que faz |
|--------|---------|-----------|
| **Agente de campo** | App mobile (Android) | Registra visitas, tira fotos, trabalha offline |
| **Coordenador** | Painel web | Gerencia agentes, define rotas, vê produtividade |
| **Gestor/Secretário** | Dashboard web | Vê indicadores, relatórios, toma decisões |
| **Admin** | Painel web | Gerencia tudo: setores, usuários, configurações |

---

## O que o MVP precisa ter (extraído do produto.md + plano CTO)

### APP MOBILE — Agente de Campo

| # | Funcionalidade | Status | Arquivo |
|---|---------------|--------|---------|
| A1 | Login com email + senha | PRONTO | `app/(auth)/login.tsx` |
| A2 | Home com stats do dia + visitas recentes | PRONTO | `app/(app)/index.tsx` |
| A3 | Formulário de nova visita (6 status) | PRONTO | `app/(app)/visit/new.tsx` |
| A4 | Buscar imóvel por endereço | PRONTO | `app/(app)/visit/new.tsx` |
| A5 | Captura de foto (câmera) | PARCIAL | Captura URI mas **não faz upload** |
| A6 | Geolocalização automática | PRONTO | `app/(app)/visit/new.tsx` |
| A7 | Modo offline (sync queue com MMKV) | PRONTO | `src/store/sync.ts` |
| A8 | Mapa com marcadores por status | PARCIAL | Coordenadas fixas, sem filtro |
| A9 | Histórico de visitas | PRONTO | `app/(app)/history.tsx` |
| A10 | Detalhe da visita | PRONTO | `app/(app)/visit/[id].tsx` |
| A11 | Perfil + sync manual + logout | PRONTO | `app/(app)/profile.tsx` |
| A12 | Lista de imóveis do setor | PRONTO | `app/(app)/properties/index.tsx` |
| A13 | Detalhe do imóvel | PRONTO | `app/(app)/properties/[id].tsx` |
| A14 | **Login com CPF + senha** | NÃO EXISTE | Login atual é email, MVP pede CPF |
| A15 | **Escanear QR code do imóvel** | NÃO EXISTE | Requisito core do produto |
| A16 | **Tipo de visita** (rotina/retorno/denúncia) | NÃO EXISTE | Campo obrigatório no formulário |
| A17 | **Tipo de foco** (caixa d'água, pneu, calha...) | NÃO EXISTE | Obrigatório quando status = "com achado" |
| A18 | **Ação tomada** (eliminado/tratado/pendente) | NÃO EXISTE | Obrigatório quando status = "com achado" |
| A19 | **Foto obrigatória quando há foco** | NÃO EXISTE | Regra de validação |
| A20 | **Histórico das últimas 3 visitas ao imóvel** | NÃO EXISTE | Mostrar no detalhe do imóvel |
| A21 | **Rota do dia** (lista de imóveis a visitar) | NÃO EXISTE | Definida pelo coordenador |
| A22 | **Marcar imóvel como visitado/ausente/recusou** | PARCIAL | Existe nos status mas sem rota associada |

### PAINEL WEB — Coordenador / Gestor

| # | Funcionalidade | Status | Arquivo |
|---|---------------|--------|---------|
| W1 | Login web (auth server-side) | PRONTO | `web/app/layout.tsx` |
| W2 | Dashboard com KPIs + gráfico por dia | PRONTO | `web/app/dashboard/page.tsx` |
| W3 | Filtro por setor | PRONTO | `web/components/DashboardClient.tsx` |
| W4 | **Mapa operacional** (status de cada imóvel, filtro agente/bairro/data) | NÃO EXISTE | Requisito MVP |
| W5 | **Gestão de imóveis** (cadastro, histórico, flag foco recorrente) | NÃO EXISTE | Requisito MVP |
| W6 | **Gestão de agentes** (cadastro, atribuição de setor, produtividade) | NÃO EXISTE | Requisito MVP |
| W7 | **Definição de rotas/setores** por agente | NÃO EXISTE | Requisito MVP |
| W8 | **Relatórios básicos** (visitas/período, focos/tipo, pendentes) | NÃO EXISTE | Requisito MVP |
| W9 | **Exportação CSV** | NÃO EXISTE | Requisito MVP |
| W10 | **Visualização de focos ativos em tempo real** | NÃO EXISTE | Requisito MVP |

### BACKEND / INFRA

| # | Item | Status |
|---|------|--------|
| B1 | Schema SQL (6 tabelas) | PRONTO (migration 001) |
| B2 | RLS por role | PRONTO (migration 002) |
| B3 | Views de dashboard | PRONTO (migration 003) |
| B4 | Projeto Supabase criado | NÃO FEITO |
| B5 | .env preenchido | NÃO FEITO |
| B6 | **Tabela `visit_types`** (rotina/retorno/denúncia) | NÃO EXISTE |
| B7 | **Tabela `focus_types`** (caixa d'água, pneu, calha...) | NÃO EXISTE |
| B8 | **Tabela `actions_taken`** (eliminado/tratado/pendente) | NÃO EXISTE |
| B9 | **Campo `visit_type_id` na tabela visits** | NÃO EXISTE |
| B10 | **Supabase Storage bucket** para fotos | NÃO EXISTE |
| B11 | **Tabela `daily_routes`** (rota do dia por agente) | NÃO EXISTE |
| B12 | Seed de imóveis (import CSV) | PRONTO (script existe) |
| B13 | QR code por imóvel (gerar + lógica de scan) | NÃO EXISTE |

---

## Plano de Execução — 7 Sprints

### SPRINT 0 — Fundação (1 dia)
> Sem isso nada roda.

- [ ] Criar projeto no Supabase
- [ ] Rodar as 3 migrations existentes
- [ ] Preencher `.env` no app e no web
- [ ] Testar login + inserção de visita via app
- [ ] Criar bucket `evidences` no Supabase Storage

### SPRINT 1 — Completar o Formulário de Visita (2–3 dias)
> O formulário atual está incompleto vs. o que o agente precisa no campo.

- [ ] **Migration 004:** tabelas `visit_types`, `focus_types`, `actions_taken`
- [ ] **Migration 005:** adicionar `visit_type_id`, `focus_type_id`, `action_taken_id` na tabela `visits`
- [ ] Atualizar `src/types/database.ts` com novos tipos
- [ ] Atualizar `visit/new.tsx`:
  - Seletor de tipo de visita (rotina/retorno/denúncia)
  - Seletor de tipo de foco (condicional: só aparece se status = "com achado")
  - Seletor de ação tomada (condicional: só aparece se status = "com achado")
  - Foto obrigatória quando há foco (validação)
- [ ] **Implementar upload de fotos** para Supabase Storage
- [ ] Atualizar hooks `useCreateVisit` para enviar novos campos + fotos
- [ ] Corrigir acentuação em todas as telas

### SPRINT 2 — QR Code + Histórico do Imóvel (2–3 dias)
> Requisito diferenciador do produto. Sem isso é "mais um app de formulário".

- [ ] Gerar QR code por imóvel (contendo `property_id`)
- [ ] Tela de scan QR no app (usando `expo-camera` ou `expo-barcode-scanner`)
- [ ] Ao escanear: carregar imóvel + histórico das últimas 3 visitas
- [ ] Atualizar `properties/[id].tsx` para mostrar histórico de visitas
- [ ] Script para gerar QR codes em lote (para imprimir nas placas)

### SPRINT 3 — Rota do Dia (2–3 dias)
> Agente precisa saber quais imóveis visitar hoje.

- [ ] **Migration 006:** tabela `daily_routes` (agent_id, date, property_ids[], completed_ids[])
- [ ] Tela "Minha Rota" no app (lista de imóveis do dia)
- [ ] Mapa da rota com pins numerados
- [ ] Marcar imóvel como visitado direto da rota
- [ ] No painel web: coordenador define rota por agente (seleciona imóveis no mapa ou por setor)

### SPRINT 4 — Painel Web do Coordenador (3–5 dias)
> Hoje o web tem só 1 tela. Coordenador precisa de gestão real.

- [ ] **Mapa operacional** — Mapbox/Leaflet com imóveis coloridos por status, filtro por agente/data/bairro
- [ ] **Gestão de agentes** — CRUD de agentes, atribuir setor, ver produtividade diária
- [ ] **Gestão de imóveis** — CRUD, histórico completo, flag de foco recorrente automático
- [ ] **Definição de rotas** — arrastar imóveis para a rota de cada agente
- [ ] **Lista de visitas** — tabela com filtros (data, agente, status), paginação

### SPRINT 5 — Relatórios + Exportação (2–3 dias)
> Secretário precisa de números para justificar o investimento.

- [ ] Total de visitas por período
- [ ] Total de focos por tipo (caixa d'água, pneu, etc.)
- [ ] Imóveis pendentes de visita (sem visita há X dias)
- [ ] Produtividade por agente (imóveis/dia)
- [ ] Exportação CSV de qualquer tabela/filtro
- [ ] Visualização de focos ativos em tempo real (mapa + lista)

### SPRINT 6 — Mapa do App + Polimento (2–3 dias)
> Ajustes finais antes da demo para o prefeito.

- [ ] Ajustar coordenadas do mapa para a cidade do piloto
- [ ] Filtro por status no mapa do app
- [ ] Tela de "Esqueci a senha"
- [ ] Loading states e empty states em todas as telas
- [ ] Testar sync offline end-to-end (avião mode → reconectar → dados sobem)
- [ ] Build APK de preview (`eas build -p android --profile preview`)

---

## Resumo Visual

```
PRONTO          ████████████░░░░░░░░░░  ~40%
APP (agente)    █████████░░░░░░░░░░░░░  ~45% (13 de 22 itens)
WEB (coord)     ███░░░░░░░░░░░░░░░░░░░  ~30% (3 de 10 itens)
BACKEND         ████████░░░░░░░░░░░░░░  ~38% (3 de 13 itens)
```

---

## O que NÃO entra no MVP (Fase 2+)

- Mapa de calor / heatmap
- Alertas automáticos (cluster de focos)
- Priorização automática de rotas
- Dashboard executivo avançado
- Score de risco por bairro
- Exportação SINAN
- App do cidadão
- Multi-endemia
- API aberta

---

## Ordem de impacto para demo com prefeito

1. **Sprint 0** — Sem banco não roda nada
2. **Sprint 1** — Formulário completo = agente pode trabalhar
3. **Sprint 2** — QR code = o diferencial visual na reunião
4. **Sprint 3** — Rota do dia = gestão real, não "só formulário"
5. **Sprint 4** — Painel web = coordenador controla tudo
6. **Sprint 5** — Relatórios = justifica investimento
7. **Sprint 6** — Polimento = "isso tá pronto pra usar"
