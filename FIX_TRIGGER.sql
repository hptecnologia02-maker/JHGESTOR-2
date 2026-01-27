-- =====================================================
-- FIX DEFINITIVO - TRIGGER DE AUTO-CRIAÇÃO DE USUÁRIO
-- Este script cria um trigger que automaticamente
-- cria o registro em public.users quando alguém
-- se registra via Supabase Auth
-- =====================================================

-- PASSO 1: Criar a função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, owner_id, status, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'ADMIN'),
    NEW.id, -- owner_id = próprio ID (auto-referência)
    'ACTIVE',
    'FREE'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    owner_id = COALESCE(users.owner_id, EXCLUDED.owner_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 2: Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASSO 3: Criar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PASSO 4: Se você já tem usuários no Auth mas não no
-- public.users, rode isso para sincronizar:
-- =====================================================
INSERT INTO public.users (id, email, name, role, owner_id, status, plan)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(raw_user_meta_data->>'role', 'ADMIN'),
  id, -- owner_id = próprio ID
  'ACTIVE',
  'FREE'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  owner_id = COALESCE(users.owner_id, EXCLUDED.owner_id);

-- PASSO 5: Verificar se funcionou
SELECT 'Sincronização completa!' as status, COUNT(*) as total_users FROM public.users;
