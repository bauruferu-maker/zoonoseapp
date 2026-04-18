# ZoonoseApp — Scaffold MVP

Sistema de Vigilância Epidemiológica para controle de zoonoses.
App mobile (Expo/React Native) para agentes de campo + Dashboard web (Next.js) para coordenadores.

**Stack:** Expo SDK 52 · React Native · Supabase · Next.js 15 · TypeScript

## Estrutura

```
scaffold/
├── app/                         # Expo Router — telas mobile
│   ├── _layout.tsx              # Root layout + QueryClient + AuthGuard
│   ├── (auth)/
│   │   ├── login.tsx            # Tela de login
│   │   └── forgot-password.tsx  # Recuperação de senha
│   └── (app)/
│       ├── index.tsx            # Home (stats + quick actions)
│       ├── route.tsx            # Rota do dia (progresso)
│       ├── scan.tsx             # Scanner QR Code
│       ├── map.tsx              # Mapa com filtro de status
│       ├── history.tsx          # Histórico de visitas
│       ├── profile.tsx          # Perfil + sync
│       ├── visit/new.tsx        # Formulário completo de visita
│       ├── visit/[id].tsx       # Detalhe da visita
│       ├── properties/index.tsx # Lista de imóveis
│       └── properties/[id].tsx  # Detalhe do imóvel
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # Client Supabase (MMKV storage)
│   │   └── upload.ts           # Upload de fotos (base64 → Storage)
│   ├── types/                   # TypeScript types + DB schema
│   ├── store/                   # Zustand stores (auth, sync)
│   ├── hooks/                   # React Query hooks
│   │   ├── useVisits.ts        # CRUD visitas
│   │   ├── useProperties.ts    # Busca imóveis
│   │   ├── useLookups.ts       # Tipos visita/foco/ação
│   │   └── useRoutes.ts        # Rota diária
│   └── components/
│       └── StateViews.tsx       # LoadingView, EmptyView, ErrorView
├── supabase/migrations/         # 5 migrations SQL
│   ├── 001_base_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_dashboard_views.sql
│   ├── 004_visit_metadata.sql   # Lookups + Storage bucket
│   └── 005_daily_routes.sql     # Rotas diárias
├── scripts/
│   ├── import-properties.js     # Import imóveis via CSV
│   ├── seed-data.js             # Seed de desenvolvimento
│   └── generate-qrcodes.js     # Gera QR codes por imóvel
├── web/                         # Next.js 15 — dashboard coordenador
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx         # KPIs + gráficos
│   │       ├── layout.tsx       # Sidebar + auth check
│   │       ├── visits/          # Tabela visitas + filtros + CSV
│   │       ├── agents/          # Cards de agentes
│   │       ├── properties/      # Tabela imóveis
│   │       ├── routes/          # Definição de rotas (com mutation)
│   │       ├── map/             # Mapa Leaflet operacional
│   │       └── reports/         # Relatórios + gráficos Recharts
│   ├── hooks/useCreateRoute.ts  # Mutation criar/atualizar rota
│   ├── components/Sidebar.tsx
│   └── lib/supabase-server.ts
├── app.json                     # Config Expo (scheme, splash, permissions)
├── eas.json                     # Build profiles (preview APK, production AAB)
├── .env.example
└── web/.env.example
```

## Setup Rápido

### 1. Supabase
- Crie projeto em [supabase.com](https://supabase.com)
- Execute as 5 migrations em ordem: `001` → `002` → `003` → `004` → `005`
- Copie URL + anon key para `.env`

### 2. App Expo
```bash
npm install
cp .env.example .env
# Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start
```

### 3. Dashboard Web
```bash
cd web
npm install
npm install react-leaflet leaflet    # Mapa operacional
cp .env.example .env.local
# Preencha as variáveis Supabase
npm run dev
```

### 4. Build APK Preview
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
# O APK será gerado na nuvem (~5min) e disponível para download
```

### 5. QR Codes dos Imóveis
```bash
node scripts/generate-qrcodes.js
# Gera um PNG por imóvel na pasta ./qrcodes/
```

## Variáveis de Ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Chave anon do Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | `web/.env.local` | Mesmo URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `web/.env.local` | Mesma chave |

## Status de Visita

| Status | Cor | Descrição |
|--------|-----|-----------|
| `visitado_sem_foco` | 🟢 | Visitado sem foco |
| `visitado_com_achado` | 🟠 | Visitado com foco encontrado |
| `fechado` | ⚫ | Imóvel fechado |
| `recusado` | 🔴 | Morador recusou acesso |
| `nao_localizado` | 🟡 | Imóvel não encontrado |
| `pendente_revisao` | 🟣 | Pendente de revisão |

## Roles

| Role | Acesso | Perfil |
|------|--------|--------|
| `agent` | App mobile | Agente de campo |
| `coordinator` | Web dashboard | Coordenador de setor |
| `manager` | Web dashboard | Gestor municipal |
| `admin` | Tudo | Administrador do sistema |

## Cidade Piloto

Coordenadas configuradas para **Bauru-SP** (-22.3246, -49.0871).
Para alterar, edite `INITIAL_REGION` em:
- `app/(app)/map.tsx` (mobile)
- `web/app/dashboard/map/MapClient.tsx` (web — constante `CENTER`)
