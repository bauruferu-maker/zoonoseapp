-- Seed: test sectors
insert into public.sectors (name, code) values
  ('Setor Norte', 'SN-01'),
  ('Setor Sul', 'SS-01'),
  ('Setor Centro', 'SC-01');

-- Seed: test properties (replace sector_id with real UUIDs after running above)
insert into public.properties (address, sector_id, lat, lng) values
  ('Rua das Flores, 123', (select id from public.sectors where code = 'SN-01'), -22.9045, -47.0678),
  ('Av. Brasil, 456', (select id from public.sectors where code = 'SN-01'), -22.9051, -47.0690),
  ('Rua XV de Novembro, 789', (select id from public.sectors where code = 'SS-01'), -22.9100, -47.0720),
  ('Rua das Pedras, 10', (select id from public.sectors where code = 'SC-01'), -22.9070, -47.0640);
