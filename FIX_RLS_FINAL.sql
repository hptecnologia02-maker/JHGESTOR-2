-- =====================================================
-- FIX FINAL V2 - COM TYPE CAST CORRETO
-- Corrigido: auth.users.id é UUID, public.users.id é TEXT
-- =====================================================

-- PASSO 1: Sincronizar usuários do Auth para public.users (com cast)
INSERT INTO public.users (id, email, name, role, owner_id, status, plan)
SELECT 
  id::text,  -- Cast UUID para TEXT
  email,
  COALESCE(raw_user_meta_data->>'name', 'Usuário'),
  'ADMIN',
  id::text,  -- owner_id = próprio ID (cast)
  'ACTIVE',
  'FREE'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  owner_id = COALESCE(users.owner_id, users.id);

-- PASSO 2: Garantir que todos os usuários têm owner_id
UPDATE public.users SET owner_id = id WHERE owner_id IS NULL;

-- PASSO 3: Recriar função get_my_owner_id mais robusta
CREATE OR REPLACE FUNCTION get_my_owner_id() 
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT COALESCE(owner_id, id) INTO result 
  FROM public.users 
  WHERE id = auth.uid()::text 
  LIMIT 1;
  
  -- Se não encontrou o usuário, retorna o próprio auth.uid
  IF result IS NULL THEN
    result := auth.uid()::text;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Remover políticas antigas de clients
DROP POLICY IF EXISTS "clients_all" ON clients;
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
DROP POLICY IF EXISTS "Strict isolation for clients" ON clients;

-- PASSO 5: Criar novas políticas para clients
CREATE POLICY "clients_select" ON clients 
  FOR SELECT 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

CREATE POLICY "clients_insert" ON clients 
  FOR INSERT 
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

CREATE POLICY "clients_update" ON clients 
  FOR UPDATE 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

CREATE POLICY "clients_delete" ON clients 
  FOR DELETE 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- PASSO 6: Outras tabelas

-- TASKS
DROP POLICY IF EXISTS "tasks_all" ON tasks;
DROP POLICY IF EXISTS "Strict isolation for tasks" ON tasks;
CREATE POLICY "tasks_all" ON tasks 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- TRANSACTIONS
DROP POLICY IF EXISTS "transactions_all" ON transactions;
DROP POLICY IF EXISTS "Strict isolation for transactions" ON transactions;
CREATE POLICY "transactions_all" ON transactions 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- EVENTS
DROP POLICY IF EXISTS "events_all" ON events;
DROP POLICY IF EXISTS "Strict isolation for events" ON events;
CREATE POLICY "events_all" ON events 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR user_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR user_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- MESSAGES
DROP POLICY IF EXISTS "messages_all" ON messages;
DROP POLICY IF EXISTS "Strict isolation for messages" ON messages;
CREATE POLICY "messages_all" ON messages 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- CHAT GROUPS
DROP POLICY IF EXISTS "groups_all" ON chat_groups;
DROP POLICY IF EXISTS "Strict isolation for groups" ON chat_groups;
CREATE POLICY "groups_all" ON chat_groups 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- META CONFIGS
DROP POLICY IF EXISTS "meta_all" ON meta_configs;
DROP POLICY IF EXISTS "Strict isolation for meta" ON meta_configs;
CREATE POLICY "meta_all" ON meta_configs 
  FOR ALL 
  USING (owner_id = auth.uid()::text OR owner_id = get_my_owner_id())
  WITH CHECK (owner_id = auth.uid()::text OR owner_id = get_my_owner_id());

-- PASSO 7: Verificar resultado
SELECT 'RLS Corrigido!' as status, COUNT(*) as total_users FROM public.users;
