# Setup Supabase — ZoonoseApp

Guia passo-a-passo para colocar o backend rodando.

## 1. Criar o Projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New Project**
3. Preencha:
   - **Name:** `zoonoseapp`
   - **Database Password:** guarde essa senha!
   - **Region:** South America (São Paulo)
4. Aguarde ~2 minutos para o projeto ser criado

## 2. Copiar Credenciais

No painel do projeto, vá em **Settings > API**:

| Campo | Onde copiar |
|-------|------------|
| **Project URL** | `EXPO_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` (somente web/.env.local) |

### App Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Web Dashboard (web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 3. Executar Migrations

No painel do Supabase, vá em **SQL Editor** e execute cada arquivo na ordem:

| Ordem | Arquivo | O que faz |
|-------|---------|-----------|
| 1 | `001_initial_schema.sql` | Tabelas base + trigger de criação de perfil |
| 2 | `002_rls_policies.sql` | Row Level Security por role |
| 3 | `003_views.sql` | Views para dashboard (vw_visit_summary, vw_sector_stats) |
| 4 | `004_visit_metadata.sql` | Lookups (tipo visita/foco/ação) + bucket Storage |
| 5 | `005_daily_routes.sql` | Tabela de rotas diárias |

**Copie o conteúdo de cada arquivo** em `supabase/migrations/` e cole no SQL Editor. Execute um por vez.

## 4. Verificar Storage

Após a migration 004, confirme que o bucket foi criado:

1. Vá em **Storage** no painel
2. Deve existir o bucket **evidences** (público, 5MB, jpeg/png)
3. Se não existir, crie manualmente com essas configurações

## 5. Seed de Dados de Teste

Execute o arquivo `scripts/seed-visitas.sql` no SQL Editor.

Isso cria:
- 4 setores de Bauru-SP
- 15 imóveis com coordenadas reais, nomes e telefones

## 6. Criar Usuários de Teste

No painel, vá em **Authentication > Users > Add User**:

| Email | Senha | Depois atualizar |
|-------|-------|-----------------|
| `agente1@teste.com` | `Teste123!` | role=agent, sector=SN-01 |
| `agente2@teste.com` | `Teste123!` | role=agent, sector=SS-01 |
| `coord@teste.com` | `Teste123!` | role=coordinator, sector=SN-01 |
| `gestor@teste.com` | `Teste123!` | role=manager |

Após criar cada usuário, execute no SQL Editor:

```sql
-- Coordenador
UPDATE profiles SET role = 'coordinator',
  sector_id = (SELECT id FROM sectors WHERE code = 'SN-01')
WHERE email = 'coord@teste.com';

-- Agente 1 (Norte)
UPDATE profiles SET
  sector_id = (SELECT id FROM sectors WHERE code = 'SN-01')
WHERE email = 'agente1@teste.com';

-- Agente 2 (Sul)
UPDATE profiles SET
  sector_id = (SELECT id FROM sectors WHERE code = 'SS-01')
WHERE email = 'agente2@teste.com';

-- Gestor
UPDATE profiles SET role = 'manager'
WHERE email = 'gestor@teste.com';
```

## 7. Testar

### Mobile
```bash
cd scaffold
cp .env.example .env
# Preencha .env com suas credenciais
npm install
npx expo start
```

Login com `agente1@teste.com` / `Teste123!`

### Web
```bash
cd scaffold/web
cp .env.example .env.local
# Preencha .env.local com suas credenciais
npm install
npm install react-leaflet leaflet
npm run dev
```

Login com `coord@teste.com` / `Teste123!`

## 8. Build APK (quando pronto)

```bash
npm install -g eas-cli
eas login
# Edite app.json > extra > eas > projectId com o ID do seu projeto EAS
eas build -p android --profile preview
```

O APK será gerado na nuvem e disponível para download em ~5 minutos.
