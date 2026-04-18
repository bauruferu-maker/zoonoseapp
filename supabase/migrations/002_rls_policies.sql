-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.sectors enable row level security;
alter table public.properties enable row level security;
alter table public.visits enable row level security;
alter table public.evidences enable row level security;
alter table public.activity_logs enable row level security;

-- Helper: get current user role
create or replace function public.current_user_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

-- PROFILES
create policy "Users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "Managers can view all profiles" on public.profiles for select using (public.current_user_role() in ('manager','admin'));
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid());

-- SECTORS
create policy "All authenticated can view sectors" on public.sectors for select using (auth.role() = 'authenticated');
create policy "Managers can manage sectors" on public.sectors for all using (public.current_user_role() in ('manager','admin'));

-- PROPERTIES
create policy "Agents can view properties in their sector" on public.properties for select using (
  sector_id in (select sector_id from public.profiles where id = auth.uid())
  or public.current_user_role() in ('coordinator','manager','admin')
);
create policy "Managers can manage properties" on public.properties for all using (public.current_user_role() in ('manager','admin'));

-- VISITS
create policy "Agents can create visits" on public.visits for insert with check (agent_id = auth.uid());
create policy "Agents can view own visits" on public.visits for select using (agent_id = auth.uid());
create policy "Coordinators can view sector visits" on public.visits for select using (
  property_id in (
    select p.id from public.properties p
    join public.profiles pr on pr.sector_id = p.sector_id
    where pr.id = auth.uid() and pr.role = 'coordinator'
  )
);
create policy "Managers can view all visits" on public.visits for select using (public.current_user_role() in ('manager','admin'));
create policy "Managers can update visits" on public.visits for update using (public.current_user_role() in ('manager','admin'));

-- EVIDENCES
create policy "Agents can insert evidences on own visits" on public.evidences for insert with check (
  visit_id in (select id from public.visits where agent_id = auth.uid())
);
create policy "All authenticated can view evidences" on public.evidences for select using (
  visit_id in (select id from public.visits where agent_id = auth.uid())
  or public.current_user_role() in ('coordinator','manager','admin')
);

-- ACTIVITY LOGS
create policy "Users can insert own logs" on public.activity_logs for insert with check (user_id = auth.uid());
create policy "Managers can view all logs" on public.activity_logs for select using (public.current_user_role() in ('manager','admin'));
