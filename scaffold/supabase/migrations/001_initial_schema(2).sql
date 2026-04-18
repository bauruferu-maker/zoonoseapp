-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('agent','coordinator','manager','admin')) default 'agent',
  sector_id uuid,
  created_at timestamptz default now()
);

-- SECTORS
create table public.sectors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  coordinator_id uuid references public.profiles(id),
  geometry jsonb,
  created_at timestamptz default now()
);

alter table public.profiles add constraint fk_sector foreign key (sector_id) references public.sectors(id);

-- PROPERTIES
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  address text not null,
  sector_id uuid not null references public.sectors(id),
  lat numeric(10,7),
  lng numeric(10,7),
  owner_name text,
  owner_phone text,
  created_at timestamptz default now()
);
create index idx_properties_sector on public.properties(sector_id);

-- VISITS
create type visit_status as enum (
  'visitado_sem_foco',
  'visitado_com_achado',
  'fechado',
  'recusado',
  'nao_localizado',
  'pendente_revisao'
);

create table public.visits (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id),
  agent_id uuid not null references public.profiles(id),
  status visit_status not null default 'pendente_revisao',
  notes text,
  lat numeric(10,7),
  lng numeric(10,7),
  visited_at timestamptz,
  synced_at timestamptz,
  created_at timestamptz default now()
);
create index idx_visits_agent on public.visits(agent_id);
create index idx_visits_property on public.visits(property_id);
create index idx_visits_status on public.visits(status);

-- EVIDENCES
create table public.evidences (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  type text not null check (type in ('photo','video')) default 'photo',
  url text not null,
  thumbnail_url text,
  created_at timestamptz default now()
);
create index idx_evidences_visit on public.evidences(visit_id);

-- ACTIVITY LOGS
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index idx_activity_logs_user on public.activity_logs(user_id);

-- Trigger: create profile on auth.user insert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), 'agent');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
