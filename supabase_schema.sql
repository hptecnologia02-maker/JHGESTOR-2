-- SQL SCHEMA DEFINITIVO JHGESTOR (SUPABASE)
-- Corrigido: 25/01/2026 às 01:07 (Fim de Recursão e RLS Real)

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'USER',
  owner_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  plan TEXT DEFAULT 'FREE',
  password TEXT,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_access_token TEXT,
  google_token_expiry BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Forçar colunas de migração
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id TEXT;

-- 2. FUNÇÃO DE SEGURANÇA (O segredo para evitar Recursão Infinite)
-- Esta função busca o owner_id sem disparar as regras de RLS da própria tabela users
CREATE OR REPLACE FUNCTION get_my_owner_id() 
RETURNS TEXT AS $$
  SELECT owner_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. DEMAIS TABELAS
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING',
  responsible_id TEXT REFERENCES users(id),
  deadline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  description TEXT,
  amount DECIMAL(12,2),
  type TEXT,
  date TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  is_google_event BOOLEAN DEFAULT FALSE,
  google_event_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Garantir colunas da agenda
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_google_event BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS meta_configs (
  owner_id TEXT PRIMARY KEY REFERENCES users(id),
  access_token TEXT,
  ad_account_id TEXT,
  ad_account_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS chat_groups (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES users(id),
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id),
  sender_id TEXT REFERENCES users(id),
  sender_name TEXT,
  receiver_id TEXT,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Limpar e Criar Políticas Reais
DROP POLICY IF EXISTS "Users can see teammates" ON users;
CREATE POLICY "Users can see teammates" ON users 
  FOR ALL USING (id = auth.uid()::text OR owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for clients" ON clients;
CREATE POLICY "Strict isolation for clients" ON clients 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for tasks" ON tasks;
CREATE POLICY "Strict isolation for tasks" ON tasks 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for comments" ON task_comments;
CREATE POLICY "Strict isolation for comments" ON task_comments 
  FOR ALL USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.owner_id = get_my_owner_id()));

DROP POLICY IF EXISTS "Strict isolation for transactions" ON transactions;
CREATE POLICY "Strict isolation for transactions" ON transactions 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for events" ON events;
CREATE POLICY "Strict isolation for events" ON events 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for suppliers" ON suppliers;
CREATE POLICY "Strict isolation for suppliers" ON suppliers 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for groups" ON chat_groups;
CREATE POLICY "Strict isolation for groups" ON chat_groups 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for messages" ON messages;
CREATE POLICY "Strict isolation for messages" ON messages 
  FOR ALL USING (owner_id = get_my_owner_id());

DROP POLICY IF EXISTS "Strict isolation for meta" ON meta_configs;
CREATE POLICY "Strict isolation for meta" ON meta_configs 
  FOR ALL USING (owner_id = get_my_owner_id());
