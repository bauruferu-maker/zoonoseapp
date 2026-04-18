# ZoonoseApp - Sistema Digital de Controle de Zoonoses

**Status:** Ideacao / Pre-MVP  
**Responsavel:** Leonardo  
**Iniciado em:** Marco 2026

---

## O que e

SaaS para prefeituras municipais que digitaliza o controle de zoonoses e o combate a dengue. Substitui o cartao fisico de visita por um sistema integrado de campo (app mobile) e gestao (painel web), com identificacao de imoveis por QR code permanente.

## Documentos do projeto

| Arquivo | Descricao |
|---------|-----------|
| [pitch.md](./pitch.md) | Apresentacao para Secretaria de Saude |
| [modelo-financeiro.md](./modelo-financeiro.md) | Custos, receitas e ROI |
| [produto.md](./produto.md) | Funcionalidades, stack e roadmap |
| [go-to-market.md](./go-to-market.md) | Estrategia de entrada no mercado |
| [mvp-plano-cto.html](./mvp-plano-cto.html) | Plano tecnico e escopo MVP |

## Hipotese central

> Prefeituras gastam valores muito altos com dengue e resposta tardia a focos. Um sistema de controle vetorial com operacao digital e resposta mais rapida pode reduzir casos graves, melhorar rastreabilidade e gerar economia relevante para o municipio.

## Base tecnica no repositorio

O repositorio agora inclui uma base inicial para:

- `app/` - app mobile com Expo Router
- `src/` - client Supabase, types, Zustand e hooks React Query
- `supabase/migrations/` - schema, trigger de auth, RLS e views
- `scripts/` - importador CSV e seed SQL
- `web/` - dashboard Next.js 15 com Recharts e login

### Telas mobile

- Login
- Home
- Mapa
- Nova visita
- Historico
- Perfil
- Detalhe da visita
- Lista de imoveis
- Detalhe do imovel

## Setup de desenvolvimento

### 1. Supabase

Execute as migrations nesta ordem:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_views.sql`

### 2. App mobile

```bash
npm install
cp .env.example .env
npx expo start
```

Preencha no `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. Dashboard web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Preencha no `web/.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Proximos passos imediatos

- [ ] Validar acesso a Secretaria de Saude de Uberlandia
- [ ] Identificar CTO ou socio tecnico
- [ ] Pesquisar concorrentes diretos
- [ ] Rodar bootstrap tecnico do app mobile e dashboard
- [ ] Conectar a base a um projeto real do Supabase
