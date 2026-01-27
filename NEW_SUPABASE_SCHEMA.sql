-- =====================================================
-- SCHEMA COMPLETO JHGESTOR - NOVO BANCO SUPABASE
-- Projeto: lizqksnnzwmnqvmtkgnt
-- Rode este script COMPLETO no SQL Editor do Supabase
-- =====================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Usuário',
  email TEXT UNIQUE,
  role TEXT DEFAULT 'ADMIN',
  owner_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  plan TEXT DEFAULT 'FREE',
  password TEXT,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_access_token TEXT,
  google_token_expiry BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- 2. FUNÇÃO DE SEGURANÇA (Evita recursão infinita no RLS)
-- =====================================================
CREATE OR REPLACE FUNCTION get_my_owner_id() 
RETURNS TEXT AS $$
  SELECT COALESCE(owner_id, id) FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 3. DEMAIS TABELAS
-- =====================================================
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

-- =====================================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. POLÍTICAS RLS - TABELA USERS (CORRIGIDAS!)
-- =====================================================

-- SELECT: Ver próprio registro e colegas de equipe
CREATE POLICY "users_select" ON users 
  FOR SELECT 
  USING (
    id = auth.uid()::text 
    OR owner_id = get_my_owner_id()
  );

-- INSERT: Permitir criar próprio registro
CREATE POLICY "users_insert" ON users 
  FOR INSERT 
  WITH CHECK (id = auth.uid()::text);

-- UPDATE: Permitir atualizar próprio registro
CREATE POLICY "users_update" ON users 
  FOR UPDATE 
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- =====================================================
-- 6. POLÍTICAS RLS - DEMAIS TABELAS
-- =====================================================

-- CLIENTS
CREATE POLICY "clients_all" ON clients 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- TASKS
CREATE POLICY "tasks_all" ON tasks 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- TASK COMMENTS
CREATE POLICY "comments_all" ON task_comments 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.owner_id = get_my_owner_id()));

-- TRANSACTIONS
CREATE POLICY "transactions_all" ON transactions 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- EVENTS
CREATE POLICY "events_all" ON events 
  FOR ALL 
  USING (owner_id = get_my_owner_id() OR user_id = auth.uid()::text)
  WITH CHECK (owner_id = get_my_owner_id() OR user_id = auth.uid()::text);

-- META CONFIGS
CREATE POLICY "meta_all" ON meta_configs 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- CHAT GROUPS
CREATE POLICY "groups_all" ON chat_groups 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- MESSAGES
CREATE POLICY "messages_all" ON messages 
  FOR ALL 
  USING (owner_id = get_my_owner_id())
  WITH CHECK (owner_id = get_my_owner_id());

-- =====================================================
-- PRONTO! Agora vá na aba Authentication > Settings e:
-- 1. Adicione o Site URL: https://jhgestor-2.vercel.app
-- 2. Adicione nos Redirect URLs: https://jhgestor-2.vercel.app/*
-- =====================================================
