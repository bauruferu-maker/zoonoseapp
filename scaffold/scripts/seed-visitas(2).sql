-- =============================================
-- SEED: Dados de teste — ZoonoseApp (Bauru-SP)
-- Execute APÓS as 5 migrations
-- =============================================

-- 1. Setores de Bauru
INSERT INTO public.sectors (name, code) VALUES
  ('Setor Norte — Vila Industrial', 'SN-01'),
  ('Setor Sul — Jd. Bela Vista', 'SS-01'),
  ('Setor Centro — Centro', 'SC-01'),
  ('Setor Leste — Jd. Europa', 'SL-01');

-- 2. Imóveis com coordenadas reais de Bauru
INSERT INTO public.properties (address, sector_id, lat, lng, owner_name, owner_phone) VALUES
  -- Setor Norte
  ('Rua Gerson França, 123', (SELECT id FROM public.sectors WHERE code = 'SN-01'), -22.3150, -49.0780, 'Maria da Silva', '(14) 99876-5432'),
  ('Rua Araújo Leite, 456', (SELECT id FROM public.sectors WHERE code = 'SN-01'), -22.3155, -49.0795, 'João Santos', '(14) 99765-4321'),
  ('Rua Primeiro de Agosto, 89', (SELECT id FROM public.sectors WHERE code = 'SN-01'), -22.3160, -49.0810, 'Ana Oliveira', '(14) 99654-3210'),
  ('Av. Rodrigues Alves, 1200', (SELECT id FROM public.sectors WHERE code = 'SN-01'), -22.3140, -49.0830, 'Carlos Ferreira', NULL),
  ('Rua Gustavo Maciel, 55', (SELECT id FROM public.sectors WHERE code = 'SN-01'), -22.3170, -49.0770, NULL, NULL),
  -- Setor Sul
  ('Rua Virgílio Malta, 321', (SELECT id FROM public.sectors WHERE code = 'SS-01'), -22.3350, -49.0850, 'Pedro Souza', '(14) 99543-2109'),
  ('Rua Batista de Carvalho, 700', (SELECT id FROM public.sectors WHERE code = 'SS-01'), -22.3345, -49.0870, 'Lucia Mendes', '(14) 99432-1098'),
  ('Rua Antonio Alves, 88', (SELECT id FROM public.sectors WHERE code = 'SS-01'), -22.3360, -49.0840, NULL, NULL),
  ('Rua São Paulo, 155', (SELECT id FROM public.sectors WHERE code = 'SS-01'), -22.3370, -49.0860, 'Roberto Lima', '(14) 99321-0987'),
  -- Setor Centro
  ('Rua Azarias Leite, 500', (SELECT id FROM public.sectors WHERE code = 'SC-01'), -22.3246, -49.0871, 'Fernanda Costa', '(14) 99210-9876'),
  ('Praça Rui Barbosa, 10', (SELECT id FROM public.sectors WHERE code = 'SC-01'), -22.3240, -49.0880, 'Prefeitura Municipal', NULL),
  ('Rua Rio Branco, 290', (SELECT id FROM public.sectors WHERE code = 'SC-01'), -22.3250, -49.0860, 'Teresa Almeida', '(14) 99109-8765'),
  -- Setor Leste
  ('Rua Aviador Gomes Ribeiro, 80', (SELECT id FROM public.sectors WHERE code = 'SL-01'), -22.3200, -49.0700, 'Marcos Pereira', '(14) 98998-7654'),
  ('Av. Nações Unidas, 1500', (SELECT id FROM public.sectors WHERE code = 'SL-01'), -22.3210, -49.0710, NULL, NULL),
  ('Rua Henrique Savi, 42', (SELECT id FROM public.sectors WHERE code = 'SL-01'), -22.3190, -49.0720, 'Camila Rocha', '(14) 98887-6543');

-- =============================================
-- NOTA: Usuários de teste devem ser criados via
-- Supabase Dashboard > Authentication > Users
--
-- Sugestão:
--   agente1@teste.com  / senha: Teste123!  (role: agent, Setor Norte)
--   agente2@teste.com  / senha: Teste123!  (role: agent, Setor Sul)
--   coord@teste.com    / senha: Teste123!  (role: coordinator, Setor Norte)
--   gestor@teste.com   / senha: Teste123!  (role: manager)
--
-- Após criar, atualize roles e sector_id na tabela profiles:
--
-- UPDATE profiles SET role = 'coordinator', sector_id = (SELECT id FROM sectors WHERE code = 'SN-01')
-- WHERE email = 'coord@teste.com';
--
-- UPDATE profiles SET sector_id = (SELECT id FROM sectors WHERE code = 'SN-01')
-- WHERE email = 'agente1@teste.com';
--
-- UPDATE profiles SET sector_id = (SELECT id FROM sectors WHERE code = 'SS-01')
-- WHERE email = 'agente2@teste.com';
--
-- UPDATE profiles SET role = 'manager'
-- WHERE email = 'gestor@teste.com';
-- =============================================
