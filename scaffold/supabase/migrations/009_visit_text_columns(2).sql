-- Migration 009: Colunas TEXT para visit_type, focus_type e action_taken
-- O mobile envia strings descritivas; as colunas UUID (_id) são para lookup futuro
-- Adicionar colunas TEXT para compatibilidade imediata

ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_type TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS focus_type TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS action_taken TEXT;
