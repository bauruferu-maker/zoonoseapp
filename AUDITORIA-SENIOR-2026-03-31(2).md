# Auditoria Senior — ZoonoseApp
**Data:** 31/03/2026
**Escopo:** Dashboard Web + Mobile App + Supabase Backend + Infraestrutura
**Total de achados:** 141 (15 CRITICAL, 31 HIGH, 39 MEDIUM, 56 LOW)

---

## Resumo Executivo

| Area | CRITICAL | HIGH | MEDIUM | LOW | Total |
|------|----------|------|--------|-----|-------|
| Dashboard Web | 5 | 11 | 11 | 23 | 50 |
| Mobile App | 6 | 11 | 13 | 20 | 50 |
| Supabase/Infra | 4 | 9 | 15 | 13 | 41 |
| **Total** | **15** | **31** | **39** | **56** | **141** |

---

## TOP 10 — Prioridade Imediata

### 1. CRITICAL — Service Role Key exposta em `.env.local`
- **Arquivo:** `scaffold/web/.env.local` (linha 3)
- **Problema:** `SUPABASE_SERVICE_ROLE_KEY` (god-mode, bypassa todo RLS) em arquivo que pode estar no git. Risco de comprometimento total do banco.
- **Fix:** Rotacionar a chave no painel Supabase. Remover do `.env.local`. Adicionar ao `.gitignore`. Verificar `git log` se foi commitada.

### 2. CRITICAL — Views Supabase bypassam RLS
- **Arquivo:** Migrations `003_views.sql`, `006_work_queue_view.sql`
- **Problema:** `vw_visit_summary`, `vw_sector_stats`, `vw_work_queue`, `vw_sector_coverage` rodam como owner do banco (postgres), ignorando TODAS as politicas RLS. Qualquer usuario autenticado ve dados de TODOS os setores/agentes.
- **Fix:** Adicionar `WITH (security_invoker = true)` a cada view ou mover para RPCs com validacao de role.

### 3. CRITICAL — Confidence score calculado 100% no client
- **Arquivo:** `mobile/src/screens/RegisterVisitScreen.tsx` (linhas 57-83)
- **Problema:** Score anti-fraude e um numero inteiro enviado pelo celular. Interceptar a request Supabase e trocar para 100 e trivial.
- **Fix:** Recalcular server-side (DB function ou Edge Function) com os mesmos inputs. Tratar score do client como advisory.

### 4. CRITICAL — Race condition no SQLite `getDb()` — crash no primeiro uso
- **Arquivo:** `mobile/src/lib/localDb.ts` (linhas 6-12)
- **Problema:** Duas chamadas simultaneas a `getDb()` inicializam o banco duas vezes em paralelo, corrompendo schema.
- **Fix:** Usar singleton com promise (ver detalhe abaixo).

### 5. CRITICAL — `cacheQueue` deleta dados sem transaction — perda offline
- **Arquivo:** `mobile/src/lib/localDb.ts` (linhas 142-158)
- **Problema:** DELETE all + INSERT um a um sem BEGIN/COMMIT. Crash entre as operacoes = perda total da fila offline.
- **Fix:** Envolver em transacao explicita.

### 6. HIGH — Password reset quebrado — rota `/reset-password` nao existe
- **Arquivos:** `login/page.tsx` (L42), `forgot-password/page.tsx` (L20)
- **Problema:** O redirect do email de reset vai para `/reset-password` que retorna 404, ou para `/dashboard` que nao processa o token.
- **Fix:** Criar `app/reset-password/page.tsx`.

### 7. HIGH — 'Denuncia' case mismatch quebra priorizacao
- **Arquivo:** `006_work_queue_view.sql` (L37)
- **Problema:** View busca `WHERE name = 'Denuncia'` (capital D) mas seed data insere `'denuncia'` (minuscula). Resultado: denuncias NUNCA sao priorizadas.
- **Fix:** Corrigir para `'denuncia'` ou usar `ILIKE`.

### 8. HIGH — Fotos offline podem ser perdidas permanentemente
- **Arquivos:** `SyncContext.tsx` (L101-139), `localDb.ts` (L44)
- **Problema:** Foto offline salva com URI temporaria do ImagePicker. OS pode limpar. Sync marca como concluido mesmo se foto nao subiu.
- **Fix:** Copiar foto para diretorio permanente. Nao marcar synced se upload falhou.

### 9. HIGH — Colunas duplicadas na tabela `properties` (lat/lng vs latitude/longitude)
- **Arquivo:** Migrations 001 vs 007
- **Problema:** Dois pares de coordenadas com tipos diferentes (NUMERIC vs DOUBLE PRECISION). Views usam `lat/lng`, app pode usar `latitude/longitude`.
- **Fix:** Escolher um par, migrar dados, dropar duplicatas.

### 10. HIGH — Colunas duplicadas na tabela `visits` (UUID FK vs TEXT)
- **Arquivo:** Migrations 004 vs 009
- **Problema:** `visit_type_id UUID` e `visit_type TEXT` coexistem. App mobile usa TEXT, lookup tables ficam orfas.
- **Fix:** Escolher uma abordagem e remover a outra.

---

## Dashboard Web — Todos os Achados

### CRITICAL

| # | Problema | Arquivo | Impacto |
|---|---------|---------|---------|
| W-C1 | Service role key em `.env.local` | `.env.local:3` | Acesso total ao banco |
| W-C2 | Auth apenas client-side (static export) | `dashboard/layout.tsx:12-17` | HTML do dashboard entregue antes do auth check |
| W-C3 | `output: 'export'` impede middleware/SSR | `next.config.js:3` | Sem protecao server-side |
| W-C4 | Sem enforcement de role nas rotas | Sidebar + todas as pages | URL direta acessa paginas restritas |
| W-C5 | Default role = 'coordinator' se profile falha | `Sidebar.tsx:64` | Escalacao de privilegio em caso de erro |

### HIGH

| # | Problema | Arquivo |
|---|---------|---------|
| W-H1 | Cliente Supabase criado a cada render (login) | `login/page.tsx:15-18` |
| W-H2 | Login usa cliente diferente do resto do app | `login/page.tsx` vs `supabase-browser.ts` |
| W-H3 | Auth check sem `.catch()` — spinner infinito | `dashboard/layout.tsx:12-16` |
| W-H4 | Password reset redirect para `/dashboard` | `login/page.tsx:42` |
| W-H5 | Rota `/reset-password` nao existe (404) | `forgot-password/page.tsx:20` |
| W-H6 | Supabase client fora do useEffect | `dashboard/layout.tsx:10` |
| W-H7 | Push enviado do browser (token exposure) | `pushNotification.ts:12` |
| W-H8 | Mapa busca TODOS os visits sem paginacao | `map/page.tsx:17` |
| W-H9 | Properties busca TODOS os visits | `properties/page.tsx:16` |
| W-H10 | Reports sem RBAC | `reports/page.tsx` |
| W-H11 | Push enviado 1 a 1 (N+1) | `pushNotification.ts:43-46` |

### MEDIUM

| # | Problema | Arquivo |
|---|---------|---------|
| W-M1 | `today` stale apos meia-noite | `dashboard/page.tsx:17` |
| W-M2 | Password reset duplicado (2 fluxos) | `login/page.tsx` + `forgot-password/page.tsx` |
| W-M3 | Sem Error Boundary | Todas as pages |
| W-M4 | StatCard crash se value undefined | `DashboardClient.tsx:265` |
| W-M5 | Date comparison como string | `VisitsClient.tsx:30-31` |
| W-M6 | Page nao reseta ao filtrar | `VisitsClient.tsx:80-108` |
| W-M7 | `formatDuration(0)` retorna '--' | `QualityClient.tsx:28-33` |
| W-M8 | Polling 30s mesmo com tab em background | `dashboard/page.tsx:75` |
| W-M9 | Race condition no upsert de rotas | `RoutesClient.tsx:109-175` |
| W-M10 | Non-null assertion em env vars | `supabase-browser.ts:5-6` |
| W-M11 | UTC vs timezone BR (3 paginas) | `dashboard/page.tsx:17`, `routes/page.tsx:15`, `agents/page.tsx:14` |

### LOW (23 achados)
- SVGs sem `aria-hidden` (Icons.tsx)
- Sidebar overlay sem `role="dialog"` e Escape key
- Loading nao reseta em refresh (dashboard)
- `lastVisit` nunca populado (properties)
- Limite hardcoded 200 visitas
- CSV sem guard de memoria
- `confirm()` nativo para logout
- Login loading nao limpa em erro
- Quality "sem acesso" baseado em dados, nao role
- Meta viewport ausente
- Toast re-render risk
- Date parsing pode gerar Invalid Date
- React 18 com Next.js 15 (mismatch)
- Supabase client nao singleton
- Sem rate limit no login
- `border-l-3` nao e classe Tailwind valida
- `sectors: any[]` sem tipagem
- Checkbox readOnly sem keyboard access
- Sem Suspense boundaries
- `lastUpdated` como Date object (fragil)
- Sem aria-label em filtros
- Duplicate key risk na cobertura
- Toast onClose cria re-render

---

## Mobile App — Todos os Achados

### CRITICAL

| # | Problema | Arquivo | Impacto |
|---|---------|---------|---------|
| M-C1 | `.env` pode nao estar no `.gitignore` | `mobile/.env` | Credenciais expostas |
| M-C2 | Sem RLS no INSERT de visits (agent_id forgeable) | `RegisterVisitScreen.tsx:243` | Agente frauda visita de outro |
| M-C3 | Sem check de role — qualquer user acessa tudo | `AuthContext.tsx` + `App.tsx` | Admin/coord usa tela de agente |
| M-C4 | ALTER TABLE antes de CREATE TABLE | `localDb.ts:14-31` | Crash silencioso no 1o uso |
| M-C5 | Race condition em `getDb()` | `localDb.ts:6-12` | SQLite corrompido |
| M-C6 | `cacheQueue` DELETE sem transaction | `localDb.ts:142-158` | Perda da fila offline |

### HIGH

| # | Problema | Arquivo |
|---|---------|---------|
| M-H1 | Foto offline com URI temporaria | `SyncContext.tsx:101-136` |
| M-H2 | Visit marcado synced mesmo sem foto | `SyncContext.tsx:134-139` |
| M-H3 | `today` stale apos meia-noite | `QueueScreen.tsx:40` |
| M-H4 | Notes sem sanitizacao (XSS no dashboard) | `RegisterVisitScreen.tsx:248` |
| M-H5 | Sem prevencao de visita duplicada | `RegisterVisitScreen.tsx:261` |
| M-H6 | `fetchProfile` finally reseta loading antes do retry | `AuthContext.tsx:45-63` |
| M-H7 | `signOut` nao limpa SQLite local | `AuthContext.tsx:71-75` |
| M-H8 | Auto-sync sem backoff (loop infinito) | `SyncContext.tsx:166-170` |
| M-H9 | `profile?.id ?? ''` cria visit com agent_id vazio | `RegisterVisitScreen.tsx:243,280` |
| M-H10 | Confidence score manipulavel | `RegisterVisitScreen.tsx:57-83` |
| M-H11 | Timestamps forgeavel pelo relogio do device | `RegisterVisitScreen.tsx:105,254` |

### MEDIUM

| # | Problema | Arquivo |
|---|---------|---------|
| M-M1 | GPS Accuracy.High = battery drain | `useLocation.ts:34-36` |
| M-M2 | `refresh` retorna location stale no catch | `useLocation.ts:50-66` |
| M-M3 | useFocusEffect nao reseta form fields | `RegisterVisitScreen.tsx:108-117` |
| M-M4 | Toast autoBack 2s vs duration 3s (unmount) | `RegisterVisitScreen.tsx:140-145` |
| M-M5 | Toast onHide deps causa re-render fragil | `Toast.tsx:32` |
| M-M6 | `completed_ids` update nao atomico (race) | `RegisterVisitScreen.tsx:277-284` |
| M-M7 | Sem timeout em requests Supabase | Todos os arquivos |
| M-M8 | Foto blob em memoria (OOM em devices baratos) | `RegisterVisitScreen.tsx:178-179` |
| M-M9 | Falta permissao ACCESS_FINE_LOCATION | `app.json:27-35` |
| M-M10 | HistoryScreen e ProfileScreen nao existem | (ausentes) |
| M-M11 | `cacheRoute` nao salva agent_id/route_date | `localDb.ts:168-177` |
| M-M12 | `cached_queue` sem colunas lat/lng | `localDb.ts:57-67` |
| M-M13 | Sem Error Boundary | `App.tsx` |

### LOW (20 achados)
- Push token nao atualiza em rotacao
- Notification response e no-op
- Navegacao sem type params
- KeyboardAvoidingView buggy Android
- Password em state apos login
- handleLogin sem try/catch
- handleResetPassword sem try/catch
- paddingTop hardcoded (sem safe area)
- FlatList style inline (re-render)
- statusBtn width como string %
- GPS sem timeout/feedback
- syncProgress limpo antes do user ver
- NetInfo initial state null = online
- localDb retorna any[] sem tipos
- photo_url fallback silencia erro real
- EAS projectId placeholder
- Permissoes deprecated Android 13+
- signOut sem error handling
- ScrollView sem keyboardDismissMode
- fetchQueue catch pode re-throw

---

## Supabase/Infra — Todos os Achados

### CRITICAL

| # | Problema | Arquivo |
|---|---------|---------|
| S-C1 | Service role key em disco | `.env.local` |
| S-C2 | Anon keys em multiplos `.env` sem gitignore | `scaffold/.env`, `mobile/.env` |
| S-C3 | Lookup tables sem INSERT/UPDATE/DELETE policies | `004_visit_metadata.sql:62-69` |
| S-C4 | `handle_new_user()` SECURITY DEFINER sem validacao | `001_initial_schema.sql:89-100` |

### HIGH

| # | Problema | Arquivo |
|---|---------|---------|
| S-H1 | `current_user_role()` SECURITY DEFINER chamado em todo RLS check (perf) | `002_rls_policies.sql:10-13` |
| S-H2 | Views bypassam RLS (ver #2 acima) | `003_views.sql` |
| S-H3 | `vw_visit_summary` N+1 subquery (evidence_count) | `003_views.sql:14` |
| S-H4 | Colunas duplicadas properties (lat/lng + latitude/longitude) | 001 vs 007 |
| S-H5 | Colunas duplicadas visits (UUID FK + TEXT) | 004 vs 009 |
| S-H6 | Storage bucket `evidences` public sem path scope | `004_visit_metadata.sql:81-104` |
| S-H7 | Zero DELETE policies em todo o schema | `002_rls_policies.sql` |
| S-H8 | Coordinators nao podem ver profiles do setor | `002_rls_policies.sql:16-18` |
| S-H9 | 'Denuncia' case mismatch (priorizacao quebrada) | `006_work_queue_view.sql:37` |

### MEDIUM (15 achados)
- `visited_at` permite NULL mas e critico para views
- Falta indice composto `visits(property_id, visited_at DESC)`
- Falta indice em `visits.visited_at`
- Falta indice em `daily_routes(route_date)`
- Falta indice em `activity_logs(created_at)`
- `daily_routes` usa UUID arrays em vez de junction table
- Geometria em JSONB em vez de PostGIS
- Tipos mistos de coordenadas (NUMERIC vs DOUBLE PRECISION)
- `confidence_score` sem CHECK constraint
- `output: 'export'` impede SSR
- Push do client (seguranca)
- React 18 vs 19 mismatch
- `@supabase/ssr` muito desatualizado (0.1.x)
- Next.js 15.0.0 pinado (sem patches)
- Password reset redirect incorreto

### LOW (13 achados)
- Sem `updated_at` em nenhuma tabela
- Enum `visit_status` dificil de alterar
- `sector_id` nullable sem documentacao
- `owner_phone` sem formato
- `evidences.url` sem validacao
- `activity_logs.entity_id` TEXT ao inves de UUID
- `supportsTablet: false`
- Permissoes Android deprecated
- `expo-sqlite` plugin sem config
- Tailwind sem design tokens
- EAS projectId placeholder
- Supabase-js version mismatch (2.39 vs 2.100)
- Sem ON DELETE cascade

---

## Proximos Passos Recomendados

**Sprint 1 (Urgente — Seguranca):**
1. Rotacionar service_role key
2. Adicionar `security_invoker = true` nas views
3. Criar RLS para INSERT em visits (`agent_id = auth.uid()`)
4. Remover service_role key do `.env.local`
5. Corrigir `.gitignore` para cobrir todos os `.env`

**Sprint 2 (Alto — Estabilidade):**
1. Fix SQLite `getDb()` singleton + migration order
2. Fix `cacheQueue` com transaction
3. Fix foto offline (copiar para diretorio permanente)
4. Fix case mismatch 'denuncia' na view
5. Criar rota `/reset-password`
6. Resolver colunas duplicadas (properties + visits)

**Sprint 3 (Medio — Qualidade):**
1. Mover confidence score para server-side
2. Adicionar indices no banco
3. Fix timezone UTC -> America/Sao_Paulo
4. Adicionar Error Boundaries (web + mobile)
5. Implementar HistoryScreen e ProfileScreen
6. Fix offline mode (lat/lng em cached_queue, agent_id em cacheRoute)
