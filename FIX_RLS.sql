-- SCRIPT DE CORREÇÃO URGENTE DE RLS E PERMISSÕES
-- Rode este script no Editor SQL do Supabase

-- 1. Desabilitar RLS temporariamente para corrigir dados
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Corrigir usuários sem owner_id (auto-assign)
UPDATE users SET owner_id = id WHERE owner_id IS NULL;

-- 3. Corrigir eventos sem owner_id (copiar do user_id)
UPDATE events SET owner_id = user_id WHERE owner_id IS NULL;
-- Opcional: Limpar eventos quebrados (sem user_id)
DELETE FROM events WHERE user_id IS NULL;

-- 4. Recriar Função de Segurança (Mais robusta)
CREATE OR REPLACE FUNCTION get_my_owner_id() 
RETURNS TEXT AS $$
  -- Retorna o owner_id do usuário atual, ou o próprio ID se for nulo
  SELECT COALESCE(owner_id, id) FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Recriar Política de Eventos com permissão de INSERT explícita
DROP POLICY IF EXISTS "Strict isolation for events" ON events;
DROP POLICY IF EXISTS "Users manage their own events" ON events;

CREATE POLICY "Users manage their own events" ON events 
  FOR ALL 
  USING (
    owner_id = get_my_owner_id() 
    OR 
    user_id = auth.uid()::text -- Permite ver/editar seus próprios eventos mesmo se o owner_id estiver desincronizado
  )
  WITH CHECK (
    owner_id = get_my_owner_id() 
    OR 
    user_id = auth.uid()::text
  );

-- 6. Recriar Política de Usuários
DROP POLICY IF EXISTS "Users can see teammates" ON users;
CREATE POLICY "Users can see teammates" ON users 
  FOR ALL 
  USING (
    id = auth.uid()::text 
    OR 
    owner_id = get_my_owner_id()
  );

-- 7. Reativar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
