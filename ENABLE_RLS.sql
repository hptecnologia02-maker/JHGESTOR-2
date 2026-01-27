-- =====================================================
-- RLS PERMISSIVO PARA TODOS OS ROLES
-- Funciona para anon e authenticated
-- =====================================================

-- PASSO 1: Desabilitar RLS primeiro
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE meta_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- PASSO 3: Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar políticas para TODOS (anon + authenticated)
CREATE POLICY "users_public" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "clients_public" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_public" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "comments_public" ON task_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "transactions_public" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "events_public" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "meta_public" ON meta_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "groups_public" ON chat_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "messages_public" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Verificar políticas criadas
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
</Parameter>
<parameter name="Complexity">2
