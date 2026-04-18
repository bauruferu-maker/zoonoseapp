-- ===========================================
-- Migration 010: Índices, fix case mismatch, fix views
-- ===========================================

-- 1. Indices de performance
CREATE INDEX IF NOT EXISTS idx_visits_property_visited ON public.visits(property_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON public.visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_daily_routes_date ON public.daily_routes(route_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);

-- 2. Confidence score check constraint
ALTER TABLE visits ADD CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 100);

-- 3. Fix current_user_role() para STABLE (permite cache no PostgreSQL)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Recrear vw_work_queue com fix de case (denuncia em vez de Denúncia)
DROP VIEW IF EXISTS public.vw_work_queue;
CREATE OR REPLACE VIEW public.vw_work_queue AS
WITH last_visit AS (
  SELECT DISTINCT ON (property_id)
    property_id,
    visited_at,
    status
  FROM visits
  ORDER BY property_id, visited_at DESC
),
visit_counts AS (
  SELECT
    property_id,
    COUNT(*) AS total_visits
  FROM visits
  WHERE visited_at > NOW() - INTERVAL '60 days'
  GROUP BY property_id
),
complaints AS (
  SELECT
    property_id,
    COUNT(*) AS open_complaints
  FROM visits
  WHERE visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)
    AND status IN ('pendente_revisao', 'visitado_com_achado')
    AND visited_at > NOW() - INTERVAL '30 days'
  GROUP BY property_id
)
SELECT
  p.id AS property_id,
  p.address,
  s.name AS sector_name,
  p.owner_name,
  COALESCE(vc.total_visits, 0) AS total_visits,
  lv.visited_at AS last_visited_at,
  lv.status AS last_status,
  COALESCE(c.open_complaints, 0) AS open_complaints,
  p.lat,
  p.lng,
  CASE
    WHEN c.open_complaints > 0 THEN 'alta'
    WHEN lv.status = 'visitado_com_achado' THEN 'alta'
    WHEN lv.visited_at IS NULL THEN 'media'
    WHEN lv.visited_at < NOW() - INTERVAL '30 days' THEN 'media'
    ELSE 'baixa'
  END AS priority,
  CASE
    WHEN c.open_complaints > 0 THEN 'Denúncia aberta'
    WHEN lv.status = 'visitado_com_achado' THEN 'Foco encontrado'
    WHEN lv.visited_at IS NULL THEN 'Nunca visitado'
    WHEN lv.visited_at < NOW() - INTERVAL '30 days' THEN 'Visita vencida (>30d)'
    ELSE 'Em dia'
  END AS priority_reason
FROM properties p
LEFT JOIN sectors s ON s.id = p.sector_id
LEFT JOIN last_visit lv ON lv.property_id = p.id
LEFT JOIN visit_counts vc ON vc.property_id = p.id
LEFT JOIN complaints c ON c.property_id = p.id;

-- 5. Recrear vw_sector_coverage com fix
DROP VIEW IF EXISTS public.vw_sector_coverage;
CREATE OR REPLACE VIEW public.vw_sector_coverage AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  COUNT(p.id) AS total_properties,
  COUNT(CASE WHEN lv.visited_at IS NOT NULL THEN 1 END) AS visited_properties,
  ROUND(
    (COUNT(CASE WHEN lv.visited_at IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(p.id), 0)) * 100,
    1
  ) AS coverage_pct,
  COUNT(CASE WHEN lv.visited_at IS NULL THEN 1 END) AS pending_properties,
  COUNT(CASE WHEN p.status = 'fechado' THEN 1 END) AS closed_properties,
  COUNT(CASE WHEN lv.status = 'visitado_com_achado' THEN 1 END) AS focus_properties,
  COUNT(CASE WHEN comp.has_complaint THEN 1 END) AS complaint_properties
FROM sectors s
LEFT JOIN properties p ON p.sector_id = s.id
LEFT JOIN LATERAL (
  SELECT visited_at, status
  FROM visits v
  WHERE v.property_id = p.id AND v.visited_at > NOW() - INTERVAL '60 days'
  ORDER BY v.visited_at DESC
  LIMIT 1
) lv ON true
LEFT JOIN LATERAL (
  SELECT true AS has_complaint
  FROM visits v
  WHERE v.property_id = p.id
    AND v.visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)
    AND v.status IN ('pendente_revisao', 'visitado_com_achado')
    AND v.visited_at > NOW() - INTERVAL '30 days'
  LIMIT 1
) comp ON true
GROUP BY s.id, s.name;

-- 6. Fix vw_visit_summary — substituir N+1 subquery por LEFT JOIN
DROP VIEW IF EXISTS public.vw_visit_summary;
CREATE OR REPLACE VIEW public.vw_visit_summary AS
SELECT
  v.id,
  v.property_id,
  p.address,
  p.owner_name,
  s.name AS sector_name,
  v.agent_id,
  pr.name AS agent_name,
  v.visited_at,
  v.status,
  v.notes,
  v.confidence_score,
  v.duration_seconds,
  v.lat_start,
  v.lng_start,
  v.lat_end,
  v.lng_end,
  v.visit_type,
  v.focus_type,
  v.action_taken,
  COALESCE(ec.evidence_count, 0) AS evidence_count
FROM visits v
LEFT JOIN properties p ON p.id = v.property_id
LEFT JOIN sectors s ON s.id = p.sector_id
LEFT JOIN profiles pr ON pr.id = v.agent_id
LEFT JOIN (
  SELECT visit_id, COUNT(*) AS evidence_count
  FROM evidences
  GROUP BY visit_id
) ec ON ec.visit_id = v.id;
