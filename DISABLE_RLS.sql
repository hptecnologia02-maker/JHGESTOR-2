-- =====================================================
-- DIAGNÓSTICO: DESABILITAR RLS TEMPORARIAMENTE
-- Para testar se o app funciona sem as restrições
-- =====================================================

-- PASSO 1: Desabilitar RLS em TODAS as tabelas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE meta_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Sincronizar usuários
INSERT INTO public.users (id, email, name, role, owner_id, status, plan)
SELECT 
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Usuário'),
  'ADMIN',
  id::text,
  'ACTIVE',
  'FREE'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  owner_id = COALESCE(users.owner_id, users.id);

-- PASSO 3: Verificar
SELECT 'RLS DESABILITADO - Teste o app agora!' as status, COUNT(*) as total_users FROM public.users;
