-- =====================================================
-- SCRIPT DE CORREÇÃO DE RLS V2 - JHGESTOR
-- Problema: Política atual não permite INSERT/UPDATE
-- Rode este script COMPLETO no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: Desabilitar RLS temporariamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Corrigir dados existentes
UPDATE users SET owner_id = id WHERE owner_id IS NULL;
UPDATE events SET owner_id = user_id WHERE owner_id IS NULL;

-- PASSO 3: Recriar função de segurança (mais robusta)
CREATE OR REPLACE FUNCTION get_my_owner_id() 
RETURNS TEXT AS $$
  SELECT COALESCE(owner_id, id) FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- PASSO 4: REMOVER TODAS AS POLÍTICAS ANTIGAS DA TABELA USERS
DROP POLICY IF EXISTS "Users can see teammates" ON users;
DROP POLICY IF EXISTS "Users can insert self" ON users;
DROP POLICY IF EXISTS "Users can update self" ON users;
DROP POLICY IF EXISTS "Users manage own data" ON users;
DROP POLICY IF EXISTS "Allow users to manage self" ON users;

-- PASSO 5: CRIAR POLÍTICAS SEPARADAS PARA CADA OPERAÇÃO

-- 5.1 SELECT: Ver próprio registro e colegas de equipe
CREATE POLICY "users_select_policy" ON users 
  FOR SELECT 
  USING (
    id = auth.uid()::text 
    OR owner_id = get_my_owner_id()
  );

-- 5.2 INSERT: Permitir usuário criar seu próprio registro
CREATE POLICY "users_insert_policy" ON users 
  FOR INSERT 
  WITH CHECK (
    id = auth.uid()::text
  );

-- 5.3 UPDATE: Permitir atualizar próprio registro
CREATE POLICY "users_update_policy" ON users 
  FOR UPDATE 
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 5.4 DELETE: Apenas admin pode deletar (bloqueado por padrão)
-- Não criamos política de DELETE - fica bloqueado

-- PASSO 6: Reativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- PASSO 7: Verificar se funcionou (deve retornar seu usuário)
SELECT id, email, owner_id FROM users WHERE id = auth.uid()::text;
