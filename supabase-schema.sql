-- NitroCopy — schema Supabase
-- Execute no SQL Editor do Supabase

-- Tabela de configurações por usuário
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_api_key TEXT,
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  venice_balance_usd NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Migração (se a tabela já existir):
-- ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'openai';
-- ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS venice_balance_usd NUMERIC;

-- Tabela de treinamento (DNA do usuário)
CREATE TABLE IF NOT EXISTS training_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('native', 'ads', 'vsl')),
  content TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico de gerações
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('native', 'ads', 'vsl')),
  mode TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their training"
  ON training_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their generations"
  ON generations FOR ALL USING (auth.uid() = user_id);
