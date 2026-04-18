-- View: visits with computed fields for dashboard
create or replace view public.vw_visit_summary as
select
  v.id,
  v.status,
  v.visited_at,
  v.synced_at,
  p.address,
  p.sector_id,
  s.name as sector_name,
  s.code as sector_code,
  pr.name as agent_name,
  pr.role as agent_role,
  (select count(*) from public.evidences e where e.visit_id = v.id) as evidence_count
from public.visits v
join public.properties p on p.id = v.property_id
join public.sectors s on s.id = p.sector_id
join public.profiles pr on pr.id = v.agent_id;

-- View: daily stats per sector
create or replace view public.vw_sector_stats as
select
  s.id as sector_id,
  s.name as sector_name,
  s.code as sector_code,
  date_trunc('day', v.visited_at) as day,
  count(*) as total_visits,
  count(*) filter (where v.status = 'visitado_com_achado') as with_findings,
  count(*) filter (where v.status = 'visitado_sem_foco') as without_findings,
  count(*) filter (where v.status = 'recusado') as refused,
  count(*) filter (where v.status = 'fechado') as closed,
  count(*) filter (where v.status = 'nao_localizado') as not_found
from public.visits v
join public.properties p on p.id = v.property_id
join public.sectors s on s.id = p.sector_id
where v.visited_at is not null
group by s.id, s.name, s.code, date_trunc('day', v.visited_at);
