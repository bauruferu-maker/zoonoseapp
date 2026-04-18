-- Migration 011: Add security_invoker = true to all views to enforce RLS
-- Fixes: All views were running as postgres superuser, bypassing Row Level Security
-- All authenticated users could previously see data from all sectors

-- -------------------------------------------------------
-- vw_visit_summary (originally from 003, optimized in 010)
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.vw_visit_summary;
CREATE OR REPLACE VIEW public.vw_visit_summary WITH (security_invoker = true) AS
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

-- -------------------------------------------------------
-- vw_sector_stats (originally from 003)
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.vw_sector_stats;
CREATE OR REPLACE VIEW public.vw_sector_stats WITH (security_invoker = true) AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  s.code AS sector_code,
  date_trunc('day', v.visited_at) AS day,
  count(*) AS total_visits,
  count(*) FILTER (WHERE v.status = 'visitado_com_achado') AS with_findings,
  count(*) FILTER (WHERE v.status = 'visitado_sem_foco') AS without_findings,
  count(*) FILTER (WHERE v.status = 'recusado') AS refused,
  count(*) FILTER (WHERE v.status = 'fechado') AS closed,
  count(*) FILTER (WHERE v.status = 'nao_localizado') AS not_found
FROM public.visits v
JOIN public.properties p ON p.id = v.property_id
JOIN public.sectors s ON s.id = p.sector_id
WHERE v.visited_at IS NOT NULL
GROUP BY s.id, s.name, s.code, date_trunc('day', v.visited_at);

-- -------------------------------------------------------
-- vw_work_queue (fixed in 010: sector_id, priority_order, complaint fallback)
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.vw_work_queue;
CREATE OR REPLACE VIEW public.vw_work_queue WITH (security_invoker = true) AS
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
  WHERE (
      visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)
      OR visit_type = 'denuncia'
    )
    AND status IN ('pendente_revisao', 'visitado_com_achado')
    AND visited_at > NOW() - INTERVAL '30 days'
  GROUP BY property_id
)
SELECT
  p.id AS property_id,
  p.address,
  s.id AS sector_id,
  s.name AS sector_name,
  p.owner_name,
  COALESCE(vc.total_visits, 0) AS total_visits,
  lv.visited_at AS last_visited_at,
  lv.status AS last_status,
  COALESCE(c.open_complaints, 0) AS complaint_count,
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
  END AS priority_reason,
  ROW_NUMBER() OVER (ORDER BY
    CASE WHEN lv.status IS NULL THEN 0 ELSE 1 END,
    CASE WHEN c.open_complaints > 0 THEN 0 ELSE 1 END,
    lv.visited_at ASC NULLS FIRST
  ) AS priority_order
FROM properties p
LEFT JOIN sectors s ON s.id = p.sector_id
LEFT JOIN last_visit lv ON lv.property_id = p.id
LEFT JOIN visit_counts vc ON vc.property_id = p.id
LEFT JOIN complaints c ON c.property_id = p.id;

-- -------------------------------------------------------
-- vw_sector_coverage (fixed in 010: lv.last_status replaces p.status)
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.vw_sector_coverage;
CREATE OR REPLACE VIEW public.vw_sector_coverage WITH (security_invoker = true) AS
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
  COUNT(CASE WHEN lv.last_status = 'fechado' THEN 1 END) AS closed_properties,
  COUNT(CASE WHEN lv.last_status = 'visitado_com_achado' THEN 1 END) AS focus_properties,
  COUNT(CASE WHEN comp.has_complaint THEN 1 END) AS complaint_properties
FROM sectors s
LEFT JOIN properties p ON p.sector_id = s.id
LEFT JOIN LATERAL (
  SELECT visited_at, status AS last_status
  FROM visits v
  WHERE v.property_id = p.id AND v.visited_at > NOW() - INTERVAL '60 days'
  ORDER BY v.visited_at DESC
  LIMIT 1
) lv ON true
LEFT JOIN LATERAL (
  SELECT true AS has_complaint
  FROM visits v
  WHERE v.property_id = p.id
    AND (
      v.visit_type_id = (SELECT id FROM visit_types WHERE name = 'denuncia' LIMIT 1)
      OR v.visit_type = 'denuncia'
    )
    AND v.status IN ('pendente_revisao', 'visitado_com_achado')
    AND v.visited_at > NOW() - INTERVAL '30 days'
  LIMIT 1
) comp ON true
GROUP BY s.id, s.name;
