-- ===========================================
-- Migration 005: Rotas diárias por agente
-- ===========================================

CREATE TABLE daily_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id),
  route_date DATE NOT NULL,
  property_ids UUID[] NOT NULL DEFAULT '{}',
  completed_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, route_date)
);

ALTER TABLE daily_routes ENABLE ROW LEVEL SECURITY;

-- Agentes veem suas próprias rotas
CREATE POLICY "Agente vê sua rota" ON daily_routes
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'manager', 'admin')
    )
  );

-- Coordenadores e acima podem criar rotas
CREATE POLICY "Coordenador cria rotas" ON daily_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'manager', 'admin')
    )
  );

-- Agente pode atualizar completed_ids da sua própria rota
CREATE POLICY "Agente atualiza progresso" ON daily_routes
  FOR UPDATE USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'manager', 'admin')
    )
  );
