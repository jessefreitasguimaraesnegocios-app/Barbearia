-- 004_fix_profiles_rls_recursion.sql
-- Corrige recursão infinita na RLS policy da tabela profiles
-- O problema: a policy tentava verificar is_admin consultando a própria tabela profiles

BEGIN;

-- Remover policies problemáticas
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;

-- Nova policy SELECT: permite usuário ler seu próprio profile
-- Não verifica is_admin dentro da policy para evitar recursão
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT 
  USING (id = auth.uid());

-- Nova policy UPDATE: permite usuário atualizar seu próprio profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy para INSERT: usuário autenticado pode criar seu próprio profile
-- (já existe, mas garantindo que está correta)
DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND id = auth.uid());

COMMIT;

