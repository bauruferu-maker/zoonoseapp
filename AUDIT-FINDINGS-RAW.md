# ZoonoseApp — Raw Audit Findings
**Date:** 2026-04-17
**Auditor:** G4 OS Technical Audit
**Scope:** Full codebase — Expo Router mobile app, Next.js web dashboard, Supabase schema, offline sync, environment config

---

## Project Structure Analysis

The repository contains **three overlapping versions** of the same application, creating a canonical ambiguity that is itself a critical issue:

| Directory | Description | Status |
|---|---|---|
| `/app/` + `/src/` | **Root Expo Router project** — the current primary mobile app (expo-router ~4.0, Expo ~52) | **CANONICAL MOBILE** |
| `/mobile/` | Older standalone React Navigation app (Expo ~55, React 19) with richer anti-fraud features | **LEGACY / ABANDONED?** |
| `/scaffold/` | Design scaffold with all planned features (hooks, upload, lookups) | **REFERENCE** |
| `/web/` | Active Next.js 15 web dashboard | **CANONICAL WEB** |
| `/scaffold/web/` | Design scaffold web with Sidebar, forgot-password, reset-password | **REFERENCE** |
| `/supabase/migrations/` | Root migrations — only 3 files (001–003) | **INCOMPLETE** |
| `/scaffold/supabase/migrations/` | Full migrations — 10 files (001–010) | **CANONICAL SCHEMA** |
| `/zoonoseapp-g4os-package-2026-03-23/` | Snapshot from 2026-03-23 — identical to current `/web/` and `/app/` | **SNAPSHOT / ARCHIVE** |

### Key Structural Problem
The root `/app/` (Expo Router) and `/mobile/` (React Navigation) are two different implementations of the same mobile app. They use different architectures, different Supabase client libraries, different versions of React/Expo, and different auth patterns. It is unclear which is intended for production. The root project (`/app/` + `/src/`) is more recent and uses Expo Router, but `/mobile/` has richer anti-fraud/offline features. Neither is complete.

The `(2)`, `(3)`, `(4)` suffixed files throughout the project are exact duplicates — confirmed by diffing. They are likely artifacts of copy-paste or file conflicts and should be deleted.

---

## Critical Breaks (P0 — blocks core flow)

### P0-01: Photo upload is completely missing in the root Expo Router app
- **Files:** `/src/hooks/useVisits.ts`, `/app/(app)/visit/new.tsx`
- **Description:** `useCreateVisit()` accepts `photos: string[]` but never uploads them to Supabase Storage. The photos array is stored in the `OfflineVisit.photos` array but the `sync()` function in `/src/store/sync.ts` also never uploads photos. Zero bytes reach the `evidences` bucket. The `evidences` table will always be empty.
- **Impact:** All photo evidence is silently discarded. The core audit trail of the product does not work.

### P0-02: `vw_work_queue` (migration 010) is missing `sector_id` and `priority_order` — QueueScreen breaks
- **Files:** `/scaffold/supabase/migrations/010_fixes_indexes_views.sql`, `/mobile/src/screens/QueueScreen.tsx` lines 78, 67
- **Description:** Migration 010 recreates `vw_work_queue` without `sector_id` (removed from SELECT) and without `priority_order`. `QueueScreen.tsx` queries `.eq('sector_id', profile.sector_id)` and `.order('priority_order')`. When migration 010 is applied, both of these PostgREST calls will fail or return wrong results (Supabase will error on unknown column).
- **Impact:** The entire work queue screen — the main screen for field agents in the `/mobile/` app — breaks after the latest migration is applied.

### P0-03: `vw_sector_coverage` (migration 010) references non-existent column `p.status`
- **File:** `/scaffold/supabase/migrations/010_fixes_indexes_views.sql` line 93
- **Code:** `COUNT(CASE WHEN p.status = 'fechado' THEN 1 END) AS closed_properties`
- **Description:** `p` refers to the `properties` table, which has no `status` column. `status` is on the `visits` table. This will cause a PostgreSQL syntax error, making migration 010 fail entirely.
- **Impact:** Migration 010 cannot be applied at all. All fixes it contains (indexes, view corrections, confidence score constraint) are blocked.

### P0-04: Root Expo Router app has no upload logic and no offline queue for photos
- **Files:** `/src/store/sync.ts`, `/src/types/index.ts`
- **Description:** `OfflineVisit` has `photos: string[]` field but `sync()` ignores it entirely — no upload, no insert into `evidences`. Even online visits in `useCreateVisit()` do not upload photos. The scaffold's `/scaffold/src/lib/upload.ts` and the mobile's `uploadPhoto()` function are not referenced anywhere in the root project.
- **Impact:** Complete feature regression. See P0-01.

### P0-05: Two parallel mobile codebases with different Expo/React versions — unresolvable build conflict
- **Files:** `/package.json` (expo ~52, react 18.2), `/mobile/package.json` (expo ~55, react 19.2)
- **Description:** The root project uses Expo 52 + React 18.2 + expo-router 4.0. The `/mobile/` project uses Expo 55 + React 19.2 + React Navigation 7. They cannot be built from the same `package.json`. The root `tsconfig.json` excludes the `mobile/` directory (`"exclude": ["web", "scaffold", "node_modules"]`). The canonical project is ambiguous.
- **Impact:** Developer cannot run a single `npm install` and build a complete app.

### P0-06: Root supabase migrations directory is 7 migrations behind scaffold
- **Files:** `/supabase/migrations/` (only 001–003), `/scaffold/supabase/migrations/` (001–010)
- **Description:** The operational migrations directory at `/supabase/` only contains the first 3 migrations. Migrations 004 (visit types, storage), 005 (daily routes), 006 (work queue view), 007 (anti-fraud columns), 008 (push token), 009 (text columns), 010 (indexes + view fixes) live only in `/scaffold/supabase/migrations/`. If anyone runs the canonical `/supabase/migrations/` directory, they get an incomplete schema missing `visit_types`, `focus_types`, `actions_taken`, `daily_routes`, `push_token`, anti-fraud columns, and all the performance indexes.
- **Impact:** A fresh deployment from `/supabase/` produces a non-functional app.

---

## Major Issues (P1 — severely degrades product)

### P1-01: Web dashboard missing critical pages vs scaffold specification
- **Files:** Active `/web/app/dashboard/` (3 pages), scaffold `/scaffold/web/app/` (7 routes)
- **Description:** The active web app has only: `dashboard/page.tsx`, `dashboard/agentes/page.tsx`, `dashboard/imoveis/page.tsx`. The scaffold specification includes: `login/` (simpler version), `forgot-password/`, `reset-password/`, `dashboard/layout.tsx` (with Sidebar + auth check). The active web has **no sidebar**, **no forgot-password flow**, and **no reset-password flow**.
- **Missing:** Password reset functionality is entirely broken for web users. The Sidebar component (`/scaffold/web/components/Sidebar.tsx`) with role-based navigation is not deployed.
- **Impact:** Web users cannot recover passwords; navigation is ad-hoc links in a header; no role-based access control in the UI.

### P1-02: Web dashboard auth protection is server-side only on `/dashboard`, not on sub-pages
- **Files:** `/web/app/dashboard/page.tsx`, `/web/app/dashboard/agentes/page.tsx`, `/web/app/dashboard/imoveis/page.tsx`
- **Description:** `dashboard/page.tsx` uses `createClient()` (server-side) and `redirect('/login')`. However, `agentes/page.tsx` and `imoveis/page.tsx` also do this individually. This is correct. BUT the active web has no `dashboard/layout.tsx` — the scaffold's version uses client-side auth check with `useEffect`. Without the layout, there is no shared auth guard and each page must independently guard, which they do. However the active web also has no `forgot-password` or `reset-password` routes, so password recovery is 404.
- **Impact:** Password recovery is completely broken for all web users.

### P1-03: All views bypass RLS (no `security_invoker`)
- **Files:** All views in migrations 003, 006, 010
- **Description:** PostgreSQL views created without `WITH (security_invoker = true)` run as the view owner (postgres superuser), bypassing all RLS policies. Any authenticated user can call `vw_visit_summary`, `vw_sector_stats`, `vw_work_queue`, `vw_sector_coverage` and see ALL data across ALL sectors and agents. This was identified in the previous audit (S-C2 / #2 in TOP 10) and has NOT been fixed.
- **Impact:** Complete data isolation failure — an agent in Sector Norte can see all visits from Sector Sul.

### P1-04: `confidence_score` is calculated and submitted entirely from the client
- **Files:** `/mobile/src/screens/RegisterVisitScreen.tsx` lines 57–83, `/mobile/src/contexts/SyncContext.tsx` line 89
- **Description:** The anti-fraud score is computed on the device and inserted directly into the `visits` table. Any attacker can intercept the Supabase REST call and replace `confidence_score: 0` with `confidence_score: 100`. Migration 010 adds a CHECK constraint (0–100) but no server-side recalculation.
- **Impact:** Anti-fraud scoring is decorative, not functional.

### P1-05: `complaint_prioritization` is broken because visit_type_id is never set by the mobile app
- **Files:** `/mobile/src/screens/RegisterVisitScreen.tsx` line 245, `/scaffold/supabase/migrations/010_fixes_indexes_views.sql` lines 44–48
- **Description:** The `complaints` CTE in `vw_work_queue` filters `WHERE visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)`. However, the mobile `RegisterVisitScreen.tsx` only sets `visit_type: 'rotina'` (TEXT column) and never sets `visit_type_id` (UUID FK). Since `visit_type_id` is always NULL for mobile-entered visits, the complaints subquery returns zero rows. Dengue complaint properties are never marked as high-priority.
- **Impact:** The core prioritization logic — the product's main differentiator — is silently broken for all mobile-entered visits.

### P1-06: Offline sync (root project) silently discards photos and all new fields
- **Files:** `/src/store/sync.ts` lines 53–66
- **Description:** The `sync()` function in the root project inserts only: `property_id, agent_id, status, notes, lat, lng, visited_at, synced_at`. It discards: `visit_type`, `focus_type`, `action_taken`, `visit_type_id`, `focus_type_id`, `action_taken_id`, `photo_uri`, all anti-fraud columns (`lat_start`, `lng_start`, `lat_end`, `lng_end`, `accuracy_meters`, `started_at`, `duration_seconds`, `confidence_score`). Any visit queued offline loses 12+ fields on sync.
- **Impact:** Offline visits are stored with incomplete data, undermining the entire offline-first value proposition.

### P1-07: Storage bucket name mismatch between mobile and scaffold
- **Files:** `/mobile/src/screens/RegisterVisitScreen.tsx` line 182 (`'visit-photos'`), `/mobile/src/contexts/SyncContext.tsx` line 109 (`'visit-photos'`), `/scaffold/src/lib/upload.ts` line 5 (`'evidences'`), `/scaffold/supabase/migrations/004_visit_metadata.sql` line 81 (bucket name `'evidences'`)
- **Description:** The mobile app uses bucket `'visit-photos'` but migration 004 creates bucket `'evidences'` and the scaffold upload lib uses `'evidences'`. The `'visit-photos'` bucket likely does not exist. All photo uploads in `/mobile/` will fail with a bucket not found error.
- **Impact:** Photo uploads silently fail for all visits in the `/mobile/` app.

### P1-08: `handle_new_user()` trigger is SECURITY DEFINER without input validation
- **File:** `/scaffold/supabase/migrations/001_initial_schema.sql` lines 89–100
- **Description:** The trigger function runs as postgres superuser. It blindly inserts `new.email`, `coalesce(new.raw_user_meta_data->>'name', ...)` into `profiles`. There is no validation that `new.email` is not null or that `raw_user_meta_data` is safe. A carefully crafted auth signup could inject data into the profiles table. Previous audit noted this (S-C4) and it remains unfixed.
- **Impact:** Potential data injection via the signup trigger.

### P1-09: Real Supabase credentials (anon key + project URL) committed in `.env` files
- **Files:** `/mobile/.env`, `/scaffold/.env`, `/scaffold/web/.env.local`
- **Description:** All three files contain the real Supabase project URL (`myjvoilyyjoqrcilwlpx.supabase.co`) and the anon JWT key. While the root `.gitignore` does list these files, the fact that they contain real credentials in tracked-candidate files is dangerous. The `scaffold/seed-visits.js` file also contains the **SERVICE ROLE KEY** hardcoded on line 5.
- **Impact:** Service role key in `seed-visits.js` bypasses all RLS. If this file is ever committed, complete database compromise is possible.

### P1-10: `fetchProfile` finally block resets `loading = false` before retry completes
- **File:** `/mobile/src/contexts/AuthContext.tsx` lines 54–63
- **Description:** The `finally { setLoading(false) }` block executes before the recursive `return fetchProfile(userId, retries - 1)` call resolves. This means loading is set to false while a retry is still in flight, causing the app to briefly render authenticated state with a null profile.
- **Impact:** Race condition — app may navigate to a screen that expects a profile while profile is still null, causing crashes or blank screens.

---

## Moderate Issues (P2 — incomplete features)

### P2-01: Root Expo Router app has no `visit_type`, `focus_type`, or `action_taken` fields
- **Files:** `/app/(app)/visit/new.tsx`, `/src/hooks/useVisits.ts`, `/src/types/database.ts`
- **Description:** The `NewVisitScreen` in the root project has no type-of-visit selector (rotina/retorno/denúncia), no focus type selector, and no action-taken selector. These fields are required by the product spec (PLANO-EXECUCAO.md items A16–A18) and exist in migrations 004 and 009. The scaffold has `useLookups.ts` for fetching these, but it is not referenced by the root app.
- **Impact:** Visit registration is missing 3 required fields.

### P2-02: Map screen uses hardcoded coordinates (Campinas, not Bauru)
- **File:** `/app/(app)/map.tsx` line 25
- **Code:** `initialRegion={{ latitude: -22.9068, longitude: -47.0626, ... }}` — this is Campinas, SP
- **Description:** The seed data uses Bauru, SP properties, but the map opens centered on Campinas. Bauru is at approximately -22.3154, -49.0609.
- **Impact:** The map shows an empty view until the user pans to the correct city.

### P2-03: `today` computed at render time — becomes stale after midnight without refresh
- **Files:** `/app/(app)/index.tsx` line 22, `/mobile/src/screens/QueueScreen.tsx` line 39
- **Description:** `new Date().toISOString().slice(0,10)` is evaluated once at render, not reactively. If the app stays open past midnight, "today's visits" shows yesterday's data.
- **Impact:** Incorrect stats display for agents working through midnight shifts.

### P2-04: No Error Boundaries anywhere in the mobile or web app
- **Files:** `/app/_layout.tsx`, `/mobile/App.tsx`, all web pages
- **Description:** Any uncaught JavaScript error in any component will crash the entire app with a white screen (mobile) or blank page (web). React Error Boundaries are not implemented anywhere.
- **Impact:** Poor UX and lost work on crashes.

### P2-05: `useMyVisits` sorts by `created_at` instead of `visited_at`
- **File:** `/src/hooks/useVisits.ts` line 34
- **Code:** `.order('created_at', { ascending: false })`
- **Description:** The visit history should be sorted by when the visit happened (`visited_at`), not when the record was created. For offline visits synced later, `created_at` will be the sync date, not the field visit date, resulting in wrong ordering.
- **Impact:** History screen shows visits in wrong chronological order for offline-synced visits.

### P2-06: `useCreateVisit` mutation does not set `visited_at` using device timezone
- **Files:** `/src/hooks/useVisits.ts` line 103, `/app/(app)/visit/new.tsx`
- **Description:** `visited_at: new Date().toISOString()` uses UTC. The dashboard views compare dates using `date_trunc('day', v.visited_at)` which respects the stored timezone. But the seed data and migrations use `America/Sao_Paulo`. An agent in UTC-3 visiting at 11 PM local time will have a visit recorded as midnight UTC = next day.
- **Impact:** Daily stats are off by 1 day for visits near midnight.

### P2-07: `useProperty` called with empty string when `preselectedPropertyId` is undefined
- **File:** `/app/(app)/visit/new.tsx` line 30
- **Code:** `useProperty(preselectedPropertyId ?? '')`
- **Description:** When `enabled: !!propertyId` is evaluated with `''`, it is falsy, so the query won't fire. But this causes a query key `['properties', 'detail', '']` to be registered in React Query's cache permanently.
- **Impact:** Minor cache pollution; harmless but indicates defensive coding gap.

### P2-08: Web export API (`/api/export`) fetches `vw_visit_summary` without RLS enforcement
- **File:** `/web/app/api/export/route.ts`
- **Description:** The export uses `supabase.from('vw_visit_summary').select('*')`. Since the view lacks `security_invoker = true` (see P1-03), any authenticated user (agent, coordinator, or manager) can export ALL visits from ALL sectors. There is also no RBAC check — any authenticated user hits `/api/export` and gets everything.
- **Impact:** Data exfiltration risk — a field agent can export all visit data for all cities.

### P2-09: `NetInfo.isInternetReachable` may be null on initial state, defaults to `online`
- **Files:** `/src/store/sync.ts` line 79, `/mobile/src/contexts/SyncContext.tsx` line 39
- **Description:** `state.isInternetReachable` can be `null` when the state is not yet determined. The expression `!!(state.isConnected && state.isInternetReachable !== false)` treats `null` as "reachable" (online). On app first launch, the app assumes online and may attempt Supabase calls while connectivity is truly unknown.
- **Impact:** Spurious network failures on app startup.

### P2-10: `usePropertiesBySector` returns empty list when user has no `sector_id`
- **File:** `/app/(app)/properties/index.tsx` line 9
- **Code:** `usePropertiesBySector(user?.sector_id ?? '')`
- **Description:** If a user (admin or manager without sector assignment) has `sector_id = null`, the query is called with `''` and `enabled: !!sectorId` is false, so the hook never fetches and the list stays empty with the "no properties found" empty state — no indication why.
- **Impact:** Managers/admins see empty property list with confusing empty state message.

### P2-11: Photo URI stored in offline queue is a temporary device path
- **Files:** `/mobile/src/screens/RegisterVisitScreen.tsx` line 290, `/mobile/src/contexts/SyncContext.tsx` line 105
- **Description:** `photo_uri` is the temporary path from `ImagePicker` (e.g., `file:///data/user/0/.../Cache/...`). Android and iOS may clean the cache directory. If the app is force-quit and reopened, the cached photo may no longer exist when sync runs.
- **Impact:** Photo upload during sync silently fails with a `fetch` error, visit is still marked synced without photo evidence.

### P2-12: Missing screens: HistoryScreen and ProfileScreen in `/mobile/` navigation
- **File:** `/mobile/App.tsx` (not inspected — exists per previous audit and mobile dir structure)
- **Description:** The `/mobile/` project's React Navigation stack only shows QueueScreen and RegisterVisitScreen. History and Profile screens referenced in PLANO-EXECUCAO items A9–A11 are not implemented in the mobile app.
- **Impact:** Agents cannot view their visit history or manage their profile in the `/mobile/` version.

### P2-13: `vw_work_queue` (migration 010) still uses `visit_type_id` FK for complaint detection — will always return 0 complaints
- **Files:** `/scaffold/supabase/migrations/010_fixes_indexes_views.sql` lines 44–48
- **Description:** Even after the "fix" in migration 010, complaint detection uses `visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)`. Since the mobile app inserts `visit_type TEXT = 'rotina'` and never sets `visit_type_id`, this subquery always returns 0 rows. The fix should use `OR visit_type = 'denuncia'` to cover text-based entries.
- **Impact:** Complaint-based prioritization never triggers.

### P2-14: No `DELETE` policies exist on any table
- **File:** `/scaffold/supabase/migrations/002_rls_policies.sql`
- **Description:** RLS is enabled on all tables but no `FOR DELETE` policies are defined. By default, Supabase denies all unmatched operations, so deletes are blocked for all users. However, this means neither agents nor managers can delete mistaken visits, duplicate entries, or test data.
- **Impact:** No legitimate delete path exists; data correction requires service role access.

### P2-15: `properties` table has duplicate coordinate columns with different types
- **Files:** Migration 001 (`lat NUMERIC(10,7), lng NUMERIC(10,7)`), Migration 007 (`latitude DOUBLE PRECISION, longitude DOUBLE PRECISION`)
- **Description:** Migration 007 adds `latitude` and `longitude` (DOUBLE PRECISION) to `properties`, which already had `lat` and `lng` (NUMERIC(10,7)). The views and app code all use `lat`/`lng`. The `latitude`/`longitude` columns are never populated and never read.
- **Impact:** Schema debt — dead columns, potential confusion for future developers.

### P2-16: `visits` table has duplicate type columns: UUID FKs and TEXT fields
- **Files:** Migration 004 (`visit_type_id UUID`, `focus_type_id UUID`, `action_taken_id UUID`), Migration 009 (`visit_type TEXT`, `focus_type TEXT`, `action_taken TEXT`)
- **Description:** Two parallel type systems coexist. Migration 004 adds UUID FK columns (referencing lookup tables). Migration 009 adds TEXT columns for "compatibility". The app uses TEXT columns; the FK columns are always NULL. The views use the TEXT columns. The lookup tables are populated but never used via FK.
- **Impact:** Referential integrity is not enforced. Lookup tables are effectively dead code.

---

## Minor Issues (P3 — quality/consistency)

### P3-01: All `(2)`, `(3)`, `(4)` suffixed files are exact duplicates and should be deleted
- **Files:** Every file in `/app/`, `/src/`, `/scaffold/`, `/web/` with numbered suffixes
- **Description:** Confirmed by `diff` — all `(2)` and `(3)` variants are byte-for-byte identical to their canonical counterparts. They appear to be artifacts of file system conflicts or copy-paste errors. They inflate the apparent codebase size and create confusion.
- **Impact:** Developer confusion; any editor will show all variants as valid files.

### P3-02: `eas.json` at root level has no `projectId` — EAS build will fail
- **File:** `/eas.json`
- **Description:** The `eas.json` has build profiles (`preview`, `production`) but the `app.json` at root has no `expo.extra.eas.projectId`. Without a linked Expo project ID, `eas build` will prompt for project selection or fail in CI.
- **Impact:** `npm run build:apk` will not complete without manual intervention.

### P3-03: `app.json` at root is missing `expo-sqlite` plugin
- **File:** `/app.json`
- **Description:** The root `app.json` lists plugins: `expo-router`, `expo-camera`, `expo-image-picker`, `expo-location`, `expo-asset`. It does NOT include `expo-sqlite`. The `/mobile/app.json` correctly includes `expo-sqlite`. Since the root project uses MMKV (not SQLite), this is acceptable — but if any SQLite usage is added (e.g., from scaffold code), it will fail at build time.
- **Impact:** Low risk currently, but a trap for future development.

### P3-04: `borderLeftWidth: 3` is valid React Native but `border-l-3` is not a valid Tailwind class
- **File:** `/scaffold/web/app/forgot-password/page.tsx` line 62
- **Code:** `className="bg-red-50 border-l-3 border-red-500 ..."`
- **Description:** Tailwind CSS does not have a `border-l-3` class. The standard is `border-l` (1px), `border-l-2` (2px), `border-l-4` (4px). This error border will not render.
- **Impact:** Visual only — error message box missing its left accent.

### P3-05: Login screen uses emoji `🦟` which may not render on all Android versions
- **File:** `/app/(auth)/login.tsx` line 31
- **Description:** The mosquito emoji depends on system font support. Some older Android devices and Xiaomi ROMs display a box instead.
- **Impact:** Visual only, but bad first impression.

### P3-06: `StatCard` in web `DashboardClient` crashes if `value` is NaN
- **File:** `/web/components/DashboardClient.tsx` line 148
- **Description:** `value.toLocaleString('pt-BR')` — if `totals.total` is NaN (e.g., `vw_sector_stats` returns a row with null `total_visits`), this throws `TypeError: Cannot read properties of undefined`. No null check on `item.total_visits` in the reduce.
- **Impact:** Dashboard crashes with a blank screen if any stats row has a null value.

### P3-07: `supabase.auth.getUser()` called on every sync item during offline sync (N+1)
- **File:** `/src/store/sync.ts` line 57
- **Code:** `agent_id: (await supabase.auth.getUser()).data.user!.id`
- **Description:** This is called inside the `for (const item of q.pending)` loop. For 50 pending visits, it makes 50 `getUser()` calls. While Supabase caches this locally, it is inefficient and the `!.id` will throw if user is null (e.g., session expired mid-sync).
- **Impact:** Sync will crash with `TypeError: Cannot read properties of undefined` if session expires during a large sync batch.

### P3-08: `@supabase/ssr` version 0.1.0 is severely outdated
- **File:** `/web/package.json`
- **Description:** `@supabase/ssr: "^0.1.0"` — current stable is 0.5.x, which includes critical fixes for session handling, cookie serialization, and middleware compatibility with Next.js 15. The 0.1.x API is partially incompatible with Next.js 15's async `cookies()`.
- **Impact:** Potential session handling bugs; cookie serialization errors possible on production.

### P3-09: `@supabase/supabase-js` version mismatch between mobile and web
- **Files:** `/mobile/package.json` (`^2.100.0`), `/package.json` + `/web/package.json` (`^2.39.0`)
- **Description:** The `/mobile/` project uses supabase-js 2.100.x while the root project uses 2.39.x. These have different API signatures and behavior. If the projects are ever merged, this will cause issues.
- **Impact:** Inconsistent behavior between `/mobile/` and root app.

### P3-10: `handle_new_user()` trigger always assigns `role = 'agent'`
- **File:** `/scaffold/supabase/migrations/001_initial_schema.sql` line 93
- **Description:** Every new sign-up gets role `'agent'`. There is no way to create coordinators or managers through the standard signup flow. Admin users must be manually updated in the database. There is no documentation for this.
- **Impact:** Onboarding friction — every new user requires a manual DB update to set their role.

### P3-11: Web `DashboardClient` filters sectors by `sector_name` string, not `sector_id`
- **File:** `/web/components/DashboardClient.tsx` lines 27, 108
- **Code:** `stats.filter((item) => item.sector_name === selectedSector)` and sector option value is `sector.name`
- **Description:** Filtering by `sector_name` (a text string) is fragile. If two sectors share a name prefix or if names have trailing spaces, filtering will produce wrong results. The correct approach is to filter by `sector_id`.
- **Impact:** Edge case data display bug.

### P3-12: Web agents page fetches ALL visits without filtering by role or pagination
- **File:** `/web/app/dashboard/agentes/page.tsx` line 16
- **Code:** `supabase.from('visits').select('id, agent_id, status')`
- **Description:** This query fetches every visit in the database to build per-agent stats in JavaScript memory. For a city with 10,000 visits, this is a memory and performance problem.
- **Impact:** Performance degradation at scale; potential OOM in serverless function.

---

## Security Findings

### SEC-01: Service Role Key hardcoded in `seed-visits.js`
- **File:** `/scaffold/seed-visits.js` line 5
- **Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15anZvaWx5eWpvcXJjaWx3bHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM3ODcyMywiZXhwIjoyMDg5OTU0NzIzfQ.TxZ4IqcS3g9bYplUJ5Gnz8hRNcI63BUmKy6PoXHsfVI`
- **Description:** The Supabase service role key (God-mode, bypasses all RLS) is hardcoded in a JavaScript file in the scaffold directory. This file is not in `.gitignore`. If this directory is ever committed to a public or semi-public repository, the entire Supabase project is compromised.
- **Recommended action:** Rotate the service role key IMMEDIATELY in the Supabase dashboard. Remove from all files. Add `scaffold/seed-visits*.js` to `.gitignore`.

### SEC-02: Real anon JWT key in 3 env files — no .gitignore in scaffold/
- **Files:** `/mobile/.env`, `/scaffold/.env`, `/scaffold/web/.env.local`
- **Description:** All three files contain the real anon JWT for project `myjvoilyyjoqrcilwlpx.supabase.co`. The root `.gitignore` covers `mobile/.env` and `scaffold/web/.env.local` but NOT `scaffold/.env`. Additionally, there is no `.gitignore` inside `/scaffold/`, meaning `scaffold/.env` would be committed.
- **Recommended action:** Add `.gitignore` to `/scaffold/` directory. Rotate anon key if any of these files were committed.

### SEC-03: All views bypass RLS (repeated from P1-03)
- **Files:** Migrations 003, 006, 010 — all `CREATE OR REPLACE VIEW` statements
- **Description:** None of the views have `WITH (security_invoker = true)`. This is a critical security bypass. Any authenticated user can call these views and access all data.
- **Recommended action:** Add `WITH (security_invoker = true)` to `vw_visit_summary`, `vw_sector_stats`, `vw_work_queue`, `vw_sector_coverage`.

### SEC-04: Storage bucket `evidences` is public with no path scope enforcement
- **File:** `/scaffold/supabase/migrations/004_visit_metadata.sql` lines 81–104
- **Description:** The storage bucket policy allows any authenticated user to INSERT any object into `evidences`. There is no restriction on the path (e.g., `visits/{agent_id}/...`). An agent could overwrite another agent's photos by using a known path.
- **Recommended action:** Change INSERT policy to `bucket_id = 'evidences' AND (storage.foldername(name))[1] = auth.uid()::text`.

### SEC-05: No INSERT RLS on `visit_types`, `focus_types`, `actions_taken` tables
- **File:** `/scaffold/supabase/migrations/004_visit_metadata.sql` lines 57–69
- **Description:** RLS is enabled on these tables with only SELECT policies. There are no INSERT, UPDATE, or DELETE policies. By default Supabase denies all unmatched operations, so this is currently safe — but there is also no admin path to modify these tables from the application. Any data modification requires service role.

### SEC-06: `notes` field is not sanitized — potential XSS in web dashboard
- **File:** `/app/(app)/visit/new.tsx` line 157 (textarea), `/mobile/src/screens/RegisterVisitScreen.tsx` line 246
- **Description:** The `notes` field accepts arbitrary text from the mobile app with no sanitization. If the web dashboard ever renders `notes` as HTML (using `dangerouslySetInnerHTML`), XSS is possible. Currently the web renders it as text, but this is a latent risk.

### SEC-07: Timestamps are fully forgeable by device clock
- **Files:** `/src/hooks/useVisits.ts` line 103, `/mobile/src/screens/RegisterVisitScreen.tsx` line 241
- **Description:** `visited_at: new Date().toISOString()` uses the device system clock. Agents can set their device clock to any time and register visits with arbitrary timestamps. There is no server-side timestamp validation.

---

## Schema Analysis

### Total migrations: 10 (001–010), all in `/scaffold/supabase/migrations/`
### Canonical deployable migrations: only 3 (001–003) in `/supabase/migrations/`

| Migration | Status | Issues |
|---|---|---|
| 001_initial_schema | Correct | `handle_new_user()` lacks input validation; `lat/lng` as NUMERIC(10,7) |
| 002_rls_policies | Correct | No DELETE policies anywhere; coordinators can't see profiles of their sector |
| 003_views | Correct | Views missing `security_invoker = true` — RLS bypass |
| 004_visit_metadata | Correct | Storage bucket `evidences` without path scope; lookup tables INSERT/UPDATE/DELETE blocked |
| 005_daily_routes | Correct | Uses `UUID[]` arrays instead of junction table — joins are harder |
| 006_work_queue_view | Has issues | `'Denúncia'` case mismatch fixed in 010; views bypass RLS; old priority_order logic |
| 007_antifraud_columns | Correct | Adds duplicate coordinate columns (`latitude`/`longitude`) to properties |
| 008_push_token | Correct | Trivial |
| 009_visit_text_columns | Correct | Creates parallel TEXT columns alongside UUID FK columns — schema debt |
| 010_fixes_indexes_views | **BROKEN** | `p.status` bug in `vw_sector_coverage` breaks this entire migration; `vw_work_queue` missing `sector_id` and `priority_order` needed by QueueScreen |

### Key schema issues not yet addressed:
- No `updated_at` column on any table — change tracking is impossible
- `sector_id` in `profiles` is nullable with no documentation of intent
- `entity_id` in `activity_logs` is TEXT instead of UUID — type inconsistency
- `daily_routes` uses `UUID[]` arrays — no referential integrity on property IDs
- `geometry` in `sectors` is JSONB — should be PostGIS `geometry` type
- No `ON DELETE CASCADE` or `ON DELETE SET NULL` on most FKs (except `evidences → visits`)
- No composite unique constraint preventing duplicate visits to same property on same day
- `confidence_score` constraint in migration 010 will silently fail to apply (migration 010 is broken)

---

## Offline Sync Analysis

### Root project (`/src/store/sync.ts`) — MMKV-based sync
- **Architecture:** Zustand store + MMKV for queue persistence
- **What works:** Queue persists across app restarts; auto-sync on connectivity restore; retry on failure
- **Critical issues:**
  - Discards `photos`, `visit_type`, `focus_type`, `action_taken`, and all 8 anti-fraud columns during sync
  - `getUser()` called in a loop (N+1 auth calls)
  - `isInternetReachable` null-treated-as-online on startup
  - No exponential backoff — failed items retry immediately on next connectivity event
  - Queue is not atomic: if app crashes during `saveQueue()`, state may be corrupted (MMKV writes are atomic for single values, so this risk is low but not zero)

### Mobile project (`/mobile/src/`) — SQLite + Context-based sync
- **Architecture:** `SyncContext` + SQLite `localDb.ts` for queue + `SyncContext` for upload
- **What works:** Full anti-fraud field preservation; transaction-wrapped `cacheQueue()`; debounced auto-sync (30s minimum between auto-syncs); photo upload with graceful fallback to notes
- **Critical issues:**
  - Photo URI is a temporary cache path — may be deleted by OS before sync
  - Bucket name `'visit-photos'` doesn't match the created bucket `'evidences'`
  - `visit_type_id` is never set, breaking complaint prioritization in views
  - `signOut()` in `AuthContext` does NOT call `clearLocalData()` — offline data persists across user sessions
  - `fetchProfile finally` sets loading=false before retry completes
  - `getDb()` is now a singleton with promise (previous audit issue M-C5 appears fixed)
  - `cacheQueue()` now uses BEGIN/COMMIT transaction (previous audit issue M-C6 appears fixed)

---

## Web Dashboard Analysis

### Active web app (`/web/`)
| Page | Status | Issues |
|---|---|---|
| `/login` | Working | Missing "forgot password" link; no rate limiting |
| `/dashboard` | Working | Server-side auth correct; reads from views bypassing RLS |
| `/dashboard/agentes` | Working | No pagination; fetches all visits in memory |
| `/dashboard/imoveis` | Working | Hardcoded `limit(200)`; link to `/dashboard/imoveis/${id}` leads to 404 |
| `/api/export` | Working | No RBAC check; any user can export all data |

### Missing pages in active web vs scaffold spec:
- `/forgot-password` — does not exist → password reset broken
- `/reset-password` — does not exist → reset link from email returns 404
- `/dashboard/layout.tsx` — does not exist → no sidebar, no role-based navigation
- `/dashboard/visits` — does not exist
- `/dashboard/map` — does not exist
- `/dashboard/routes` — does not exist
- `/dashboard/reports` — does not exist
- `/dashboard/quality` — does not exist
- `/dashboard/imoveis/[id]` — linked from imoveis page but does not exist → 404

### `DashboardClient.tsx` differences (active vs scaffold):
- Active `/web/components/DashboardClient.tsx`: simpler, has bar chart + sector cards, no sidebar, no coverage data, no route progress
- Scaffold `/scaffold/web/components/DashboardClient.tsx`: full featured with coverage bars, day progress, agent cards, role filtering, timezone-aware date formatting (`America/Sao_Paulo`), visibility-paused polling

### API routes:
- Only one API route exists: `/api/export/route.ts`
- No API routes for: push notifications, webhook handling, report generation, or SINAN export

---

## Environment/Config Analysis

| File | Contains Real Credentials? | In .gitignore? |
|---|---|---|
| `/.env` | No (placeholder values) | Yes |
| `/web/.env.local` | No (placeholder values) | Yes |
| `/mobile/.env` | YES — real anon key | Yes |
| `/scaffold/.env` | YES — real anon key | **NO — no .gitignore in scaffold/** |
| `/scaffold/web/.env.local` | YES — real anon key | Yes (root .gitignore) |
| `/scaffold/seed-visits.js` | **YES — real SERVICE ROLE KEY** | **NO — not in any .gitignore** |

### app.json issues:
- Root `/app.json`: missing `expo.extra.eas.projectId`; missing `scheme`; no `splash` image
- Mobile `/mobile/app.json`: `ACCESS_FINE_LOCATION` missing from permissions (only `CAMERA`, `READ_EXTERNAL_STORAGE`, etc.); `supportsTablet: false` (limits market); EAS `projectId` is the string `"zoonoseapp"` not a real UUID
- Scaffold `/scaffold/app.json`: has `scheme: "zoonoseapp"` for deep linking; has full splash config; has proper iOS `NSLocationWhenInUseUsageDescription`

### Version matrix:

| Component | Root Project | Mobile Project | Scaffold |
|---|---|---|---|
| Expo | ~52.0.0 | ~55.0.8 | ~55 (from scaffold) |
| React | 18.2.0 | 19.2.0 | — |
| React Native | 0.76.0 | 0.83.2 | — |
| expo-router | ~4.0.0 | N/A | — |
| @supabase/supabase-js | ^2.39.0 | ^2.100.0 | ^2.39.0 |
| @supabase/ssr | N/A | N/A | ^0.1.0 |
| Next.js | N/A | N/A | 15.0.0 |

---

## What Actually Exists vs Scaffold Spec

### APP MOBILE — Feature completion assessment

| Feature | Scaffold Status | Root App (`/app/`) | Mobile App (`/mobile/`) |
|---|---|---|---|
| Login | PRONTO | ✅ Works | ✅ Works |
| Home with stats | PRONTO | ✅ Works (no offline queue count fix) | N/A (QueueScreen instead) |
| New visit form (basic) | PRONTO | ✅ Basic only | ✅ Full anti-fraud |
| Visit type selector | NÃO EXISTE | ❌ Missing | ✅ Hardcoded list (not from DB) |
| Focus type selector | NÃO EXISTE | ❌ Missing | ✅ Hardcoded list |
| Action taken selector | NÃO EXISTE | ❌ Missing | ✅ Hardcoded list |
| Photo capture | PARCIAL | ✅ Captures URI only, no upload | ✅ Captures + uploads (wrong bucket) |
| Photo upload | NÃO EXISTE | ❌ Missing | ✅ Partially works (wrong bucket) |
| Geolocation | PRONTO | ✅ Works | ✅ Works + anti-fraud |
| Offline mode | PRONTO | ✅ Basic (loses 12 fields on sync) | ✅ Full (with photo retry) |
| Work queue / route | NÃO EXISTE | ❌ Missing | ✅ Full implementation |
| Property list | PRONTO | ✅ Works | N/A |
| Property detail | PRONTO | ✅ Works | N/A |
| Visit history | PRONTO | ✅ Works | ❌ Missing |
| Profile screen | PRONTO | ✅ Works | ❌ Missing |
| Map | PARCIAL | ✅ Wrong city coords | N/A |
| QR code scan | NÃO EXISTE | ❌ Missing | ❌ Missing |
| Forgot password | NÃO EXISTE | ❌ Missing | ❌ Missing |

### PAINEL WEB — Feature completion assessment

| Feature | Planned | Active Web | Notes |
|---|---|---|---|
| Login | PRONTO | ✅ Works | No password reset |
| Dashboard KPIs | PRONTO | ✅ Basic version | No coverage bars, no route progress |
| Sector filter | PRONTO | ✅ Works | Filters by name not ID |
| Map operacional | NÃO EXISTE | ❌ Missing | Route exists in sidebar spec |
| Agents page | PRONTO | ✅ Basic | No pagination, N+1 data load |
| Properties page | PRONTO | ✅ Basic | Detail link is 404 |
| Routes/work queue | NÃO EXISTE | ❌ Missing | — |
| Reports | NÃO EXISTE | ❌ Missing | — |
| CSV export | PRONTO | ✅ Works | No RBAC check |
| Forgot password | NÃO EXISTE | ❌ Missing | 404 |
| Reset password | NÃO EXISTE | ❌ Missing | 404 |
| Sidebar navigation | PRONTO (scaffold) | ❌ Missing | Scaffold has full Sidebar.tsx |
| Push notifications | PRONTO (claimed) | ❌ Not in web | — |

---

## Files Inspected

**Previous Audit / Planning:**
- `/Users/lukasalbanesi/Downloads/zoonoseapp/AUDITORIA-SENIOR-2026-03-31.md`
- `/Users/lukasalbanesi/Downloads/zoonoseapp/PLANO-EXECUCAO.md`
- `/Users/lukasalbanesi/Downloads/zoonoseapp/ROADMAP-EXECUCAO.md`

**Root Expo Router App:**
- `/app/_layout.tsx`
- `/app/(auth)/_layout.tsx`
- `/app/(auth)/login.tsx`
- `/app/(app)/_layout.tsx`
- `/app/(app)/index.tsx`
- `/app/(app)/history.tsx`
- `/app/(app)/map.tsx`
- `/app/(app)/profile.tsx`
- `/app/(app)/visit/new.tsx`
- `/app/(app)/visit/[id].tsx`
- `/app/(app)/properties/index.tsx`
- `/app/(app)/properties/[id].tsx`

**Root src/ (shared logic for Expo Router app):**
- `/src/lib/supabase.ts`
- `/src/store/auth.ts`
- `/src/store/sync.ts`
- `/src/hooks/useVisits.ts`
- `/src/hooks/useProperties.ts`
- `/src/types/index.ts`
- `/src/types/database.ts`

**Mobile React Navigation App:**
- `/mobile/src/lib/supabase.ts`
- `/mobile/src/lib/localDb.ts`
- `/mobile/src/contexts/AuthContext.tsx`
- `/mobile/src/contexts/SyncContext.tsx`
- `/mobile/src/screens/RegisterVisitScreen.tsx`
- `/mobile/src/screens/QueueScreen.tsx` (partial)

**Web Next.js App:**
- `/web/app/layout.tsx`
- `/web/app/page.tsx`
- `/web/app/login/page.tsx`
- `/web/app/dashboard/page.tsx`
- `/web/app/dashboard/agentes/page.tsx`
- `/web/app/dashboard/imoveis/page.tsx`
- `/web/app/api/export/route.ts`
- `/web/components/DashboardClient.tsx`
- `/web/lib/supabase-server.ts`
- `/web/lib/supabase-browser.ts`
- `/web/package.json`
- `/web/tailwind.config.ts`

**Scaffold (reference implementation):**
- `/scaffold/supabase/migrations/001_initial_schema.sql`
- `/scaffold/supabase/migrations/002_rls_policies.sql`
- `/scaffold/supabase/migrations/003_views.sql`
- `/scaffold/supabase/migrations/004_visit_metadata.sql`
- `/scaffold/supabase/migrations/005_daily_routes.sql`
- `/scaffold/supabase/migrations/006_work_queue_view.sql`
- `/scaffold/supabase/migrations/007_antifraud_columns.sql`
- `/scaffold/supabase/migrations/008_push_token.sql`
- `/scaffold/supabase/migrations/009_visit_text_columns.sql`
- `/scaffold/supabase/migrations/010_fixes_indexes_views.sql`
- `/scaffold/src/lib/supabase.ts`
- `/scaffold/src/lib/upload.ts`
- `/scaffold/src/hooks/useVisits.ts`
- `/scaffold/src/hooks/useProperties.ts`
- `/scaffold/src/hooks/useLookups.ts`
- `/scaffold/src/hooks/useRoutes.ts`
- `/scaffold/src/store/auth.ts`
- `/scaffold/src/store/sync.ts`
- `/scaffold/src/types/index.ts`
- `/scaffold/src/types/database.ts`
- `/scaffold/web/app/login/page.tsx`
- `/scaffold/web/app/forgot-password/page.tsx`
- `/scaffold/web/app/reset-password/page.tsx`
- `/scaffold/web/app/dashboard/layout.tsx`
- `/scaffold/web/app/dashboard/page.tsx`
- `/scaffold/web/components/DashboardClient.tsx`
- `/scaffold/web/components/Sidebar.tsx`
- `/scaffold/web/next.config.js`
- `/scaffold/seed-visits.js` (partial)
- `/scaffold/package.json`

**Config files:**
- `/app.json`
- `/mobile/app.json`
- `/scaffold/app.json`
- `/eas.json`
- `/package.json`
- `/mobile/package.json`
- `/babel.config.js`
- `/tsconfig.json`

**Environment files:**
- `/.env`
- `/.env.example`
- `/web/.env.local`
- `/web/.env.example`
- `/mobile/.env`
- `/scaffold/.env`
- `/scaffold/web/.env.local`

**Snapshot comparison:**
- `/zoonoseapp-g4os-package-2026-03-23/web/` (diff vs `/web/`)
- `/zoonoseapp-g4os-package-2026-03-23/app/` (file listing)

**Root supabase migrations (incomplete):**
- `/supabase/migrations/001_initial_schema.sql`
- `/supabase/migrations/002_rls_policies.sql`
- `/supabase/migrations/003_views.sql`

---

## Priority Fix Order (for subsequent correction pass)

### Immediate (blocks security or data integrity):
1. **Rotate service role key** — `scaffold/seed-visits.js` line 5 contains the live service role key
2. **Add `.gitignore` to `/scaffold/`** — prevent future commit of credentials
3. **Fix `vw_sector_coverage` `p.status` bug** (migration 010 line 93) — unblocks all indexes and view fixes
4. **Add `security_invoker = true`** to all 4 views — fixes RLS bypass

### High priority (blocks core product flow):
5. **Implement photo upload in root `/src/hooks/useVisits.ts`** — photos are silently discarded
6. **Fix sync store** to preserve all fields (visit_type, anti-fraud columns, photos)
7. **Resolve canonical mobile app** — decide between `/app/` (Expo Router) and `/mobile/` (React Navigation)
8. **Add `sector_id` and `priority_order` back to `vw_work_queue`** (migration 010) — fixes QueueScreen
9. **Fix complaint detection** to use `visit_type = 'denuncia' OR visit_type_id = ...`
10. **Add `/forgot-password` and `/reset-password` pages to web**

### Medium priority (product completeness):
11. Copy `Sidebar.tsx` from scaffold to active web
12. Add `dashboard/layout.tsx` with auth check to active web
13. Fix map initial region to Bauru coordinates
14. Add visit type / focus type / action taken selectors to root app form
15. Fix bucket name from `'visit-photos'` to `'evidences'` in `/mobile/`
16. Add `clearLocalData()` call in `signOut()` in mobile `AuthContext.tsx`
17. Fix `fetchProfile` finally/retry race condition
18. Add Error Boundaries to web and mobile

### Technical debt / schema cleanup:
19. Consolidate `lat/lng` vs `latitude/longitude` on properties table
20. Consolidate `visit_type_id` (UUID) vs `visit_type` (TEXT) on visits table
21. Add `updated_at` columns to all tables
22. Copy migrations 004–010 to `/supabase/migrations/` (canonical location)
23. Delete all `(2)`, `(3)`, `(4)` duplicate files
