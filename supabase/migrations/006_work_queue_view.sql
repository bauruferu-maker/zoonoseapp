-- Migration 006: View de Fila de Trabalho com prioridade automática
-- Calcula prioridade de cada imóvel baseada em:
-- 1. Foco recente (últimos 30 dias) → ALTA
-- 2. Fechado 3+ vezes → ALTA
-- 3. Denúncia sem visita → ALTA
-- 4. Sem visita há mais de 60 dias → MÉDIA
-- 5. Demais imóveis → BAIXA (rotina)

DROP VIEW IF EXISTS vw_work_queue;

CREATE OR REPLACE VIEW vw_work_queue AS
WITH last_visit AS (
  SELECT DISTINCT ON (property_id)
    property_id,
    status,
    visited_at,
    agent_id,
    visit_type_id
  FROM visits
  ORDER BY property_id, visited_at DESC
),
visit_counts AS (
  SELECT
    property_id,
    COUNT(*) AS total_visits,
    COUNT(*) FILTER (WHERE status = 'visitado_com_achado') AS focus_count,
    COUNT(*) FILTER (WHERE status = 'fechado') AS closed_count,
    MAX(visited_at) AS last_visited_at
  FROM visits
  GROUP BY property_id
),
complaints AS (
  SELECT
    property_id,
    COUNT(*) AS open_complaints
  FROM visits
  WHERE visit_type_id = (SELECT id FROM visit_types WHERE name = 'Denúncia' LIMIT 1)
    AND status IN ('pendente_revisao', 'visitado_com_achado')
    AND visited_at > NOW() - INTERVAL '30 days'
  GROUP BY property_id
)
SELECT
  p.id AS property_id,
  p.address,
  p.sector_id,
  s.name AS sector_name,
  p.owner_name,
  p.lat,
  p.lng,
  COALESCE(vc.total_visits, 0) AS total_visits,
  COALESCE(vc.focus_count, 0) AS focus_count,
  COALESCE(vc.closed_count, 0) AS closed_count,
  COALESCE(c.open_complaints, 0) AS open_complaints,
  lv.status AS last_status,
  lv.visited_at AS last_visited_at,
  CASE
    -- Foco encontrado nos últimos 30 dias
    WHEN lv.status = 'visitado_com_achado' AND lv.visited_at > NOW() - INTERVAL '30 days'
      THEN 'alta'
    -- Fechado 3 ou mais vezes
    WHEN COALESCE(vc.closed_count, 0) >= 3
      THEN 'alta'
    -- Denúncia aberta recente
    WHEN COALESCE(c.open_complaints, 0) > 0
      THEN 'alta'
    -- Sem visita há mais de 60 dias ou nunca visitado
    WHEN lv.visited_at IS NULL OR lv.visited_at < NOW() - INTERVAL '60 days'
      THEN 'media'
    -- Demais
    ELSE 'baixa'
  END AS priority,
  CASE
    WHEN lv.status = 'visitado_com_achado' AND lv.visited_at > NOW() - INTERVAL '30 days'
      THEN 'Foco recente'
    WHEN COALESCE(vc.closed_count, 0) >= 3
      THEN 'Fechado ' || vc.closed_count || 'x'
    WHEN COALESCE(c.open_complaints, 0) > 0
      THEN 'Denúncia aberta'
    WHEN lv.visited_at IS NULL
      THEN 'Nunca visitado'
    WHEN lv.visited_at < NOW() - INTERVAL '60 days'
      THEN 'Sem visita há ' || EXTRACT(DAY FROM NOW() - lv.visited_at)::int || ' dias'
    ELSE 'Rotina'
  END AS priority_reason,
  CASE
    WHEN lv.status = 'visitado_com_achado' AND lv.visited_at > NOW() - INTERVAL '30 days' THEN 1
    WHEN COALESCE(vc.closed_count, 0) >= 3 THEN 2
    WHEN COALESCE(c.open_complaints, 0) > 0 THEN 3
    WHEN lv.visited_at IS NULL THEN 4
    WHEN lv.visited_at < NOW() - INTERVAL '60 days' THEN 5
    ELSE 6
  END AS priority_order
FROM properties p
JOIN sectors s ON s.id = p.sector_id
LEFT JOIN last_visit lv ON lv.property_id = p.id
LEFT JOIN visit_counts vc ON vc.property_id = p.id
LEFT JOIN complaints c ON c.property_id = p.id
ORDER BY priority_order, p.address;

-- View de cobertura por setor (para o dashboard)
DROP VIEW IF EXISTS vw_sector_coverage;

CREATE OR REPLACE VIEW vw_sector_coverage AS
SELECT
  s.id AS sector_id,
  s.name AS sector_name,
  COUNT(p.id) AS total_properties,
  COUNT(v.property_id) AS visited_properties,
  ROUND(
    COUNT(v.property_id)::numeric / NULLIF(COUNT(p.id), 0) * 100, 1
  ) AS coverage_pct,
  COUNT(p.id) - COUNT(v.property_id) AS pending_properties,
  COUNT(*) FILTER (WHERE latest.status = 'fechado') AS closed_properties,
  COUNT(*) FILTER (WHERE latest.status = 'visitado_com_achado') AS focus_properties,
  COUNT(*) FILTER (WHERE comp.open_complaints > 0) AS complaint_properties
FROM sectors s
LEFT JOIN properties p ON p.sector_id = s.id
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (property_id) property_id, visited_at
  FROM visits
  WHERE visits.property_id = p.id
    AND visited_at > NOW() - INTERVAL '60 days'
  ORDER BY property_id, visited_at DESC
  LIMIT 1
) v ON true
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (property_id) property_id, status
  FROM visits
  WHERE visits.property_id = p.id
  ORDER BY property_id, visited_at DESC
  LIMIT 1
) latest ON true
LEFT JOIN LATERAL (
  SELECT property_id, COUNT(*) AS open_complaints
  FROM visits
  WHERE visits.property_id = p.id
    AND visit_type_id = (SELECT id FROM visit_types WHERE name = 'Denúncia' LIMIT 1)
    AND status IN ('pendente_revisao', 'visitado_com_achado')
    AND visited_at > NOW() - INTERVAL '30 days'
  GROUP BY property_id
) comp ON true
GROUP BY s.id, s.name
ORDER BY coverage_pct ASC;
