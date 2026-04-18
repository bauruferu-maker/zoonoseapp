-- ===========================================
-- Migration 004: Tipos de visita, foco e ação
-- ===========================================

-- Tipo de visita (rotina, retorno, denúncia)
CREATE TABLE visit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO visit_types (name, description) VALUES
  ('rotina', 'Visita de rotina programada'),
  ('retorno', 'Retorno a imóvel visitado anteriormente'),
  ('denuncia', 'Visita motivada por denúncia');

-- Tipo de foco encontrado
CREATE TABLE focus_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO focus_types (name, description) VALUES
  ('caixa_dagua', 'Caixa d''água destampada ou com foco'),
  ('pneu', 'Pneu acumulando água'),
  ('calha', 'Calha entupida ou com acúmulo'),
  ('vaso_planta', 'Vaso de planta com água parada'),
  ('lixo', 'Lixo ou entulho acumulando água'),
  ('piscina', 'Piscina sem tratamento'),
  ('ralo', 'Ralo sem vedação'),
  ('outros', 'Outro tipo de criadouro');

-- Ação tomada pelo agente
CREATE TABLE actions_taken (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO actions_taken (name, description) VALUES
  ('eliminado', 'Foco eliminado no local'),
  ('tratado', 'Aplicado larvicida ou tratamento'),
  ('orientacao', 'Morador orientado para eliminação'),
  ('pendente', 'Foco não pôde ser eliminado — requer retorno'),
  ('encaminhado', 'Encaminhado para equipe especializada');

-- Adicionar campos na tabela visits
ALTER TABLE visits
  ADD COLUMN visit_type_id UUID REFERENCES visit_types(id),
  ADD COLUMN focus_type_id UUID REFERENCES focus_types(id),
  ADD COLUMN action_taken_id UUID REFERENCES actions_taken(id);

-- RLS para novas tabelas (leitura pública para usuários autenticados)
ALTER TABLE visit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tipos de visita são públicos" ON visit_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tipos de foco são públicos" ON focus_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Ações tomadas são públicas" ON actions_taken
  FOR SELECT USING (auth.role() = 'authenticated');

-- ===========================================
-- Storage bucket para evidências fotográficas
-- ===========================================
-- NOTA: Criar via Supabase Dashboard > Storage > New Bucket:
--   Nome: evidences
--   Público: sim
--   Tamanho máximo: 5MB
--   Tipos permitidos: image/jpeg, image/png
--
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidences',
  'evidences',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png']
);

-- Policy: agentes autenticados podem fazer upload
CREATE POLICY "Agentes podem fazer upload de evidências"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidences'
    AND auth.role() = 'authenticated'
  );

-- Policy: qualquer autenticado pode visualizar
CREATE POLICY "Evidências são visualizáveis por autenticados"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidences'
    AND auth.role() = 'authenticated'
  );
