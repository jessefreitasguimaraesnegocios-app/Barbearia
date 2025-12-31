-- ============================================
-- CORREÇÕES CRÍTICAS NO SCHEMA
-- ============================================
-- Este arquivo corrige os problemas de RLS encontrados
-- Execute APENAS as seções que precisam de correção
-- OU substitua as políticas problemáticas no arquivo original
-- ============================================

BEGIN;

-- ============================================
-- CORREÇÃO 1: Políticas RLS de Profiles (Recursão Infinita)
-- ============================================

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;

-- Criar função helper para verificar se é admin (evita recursão)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id),
    false
  );
$$;

-- Nova política SELECT para profiles (sem recursão)
CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT USING (
    (id = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- Nova política UPDATE para profiles (sem recursão)
CREATE POLICY profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE USING (
    (id = auth.uid())
    OR (public.is_admin(auth.uid()))
  ) WITH CHECK (
    (id = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- ============================================
-- CORREÇÃO 2: Políticas RLS para Collaborators (Faltavam!)
-- ============================================

-- SELECT: Admin vê todos, usuário autenticado vê todos (colaboradores são públicos para o sistema)
CREATE POLICY collaborators_select_authenticated ON public.collaborators
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: Apenas admin pode inserir
CREATE POLICY collaborators_insert_admin ON public.collaborators
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- UPDATE: Apenas admin pode atualizar
CREATE POLICY collaborators_update_admin ON public.collaborators
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Apenas admin pode deletar
CREATE POLICY collaborators_delete_admin ON public.collaborators
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 3: Políticas INSERT/UPDATE/DELETE para Services
-- ============================================

-- INSERT: Admin pode inserir
CREATE POLICY services_insert_admin ON public.services
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- UPDATE: Admin pode atualizar
CREATE POLICY services_update_admin ON public.services
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY services_delete_admin ON public.services
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 4: Políticas INSERT/UPDATE/DELETE para Store Products
-- ============================================

-- INSERT: Admin pode inserir
CREATE POLICY store_products_insert_admin ON public.store_products
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- UPDATE: Admin pode atualizar
CREATE POLICY store_products_update_admin ON public.store_products
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY store_products_delete_admin ON public.store_products
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 5: Políticas INSERT/UPDATE/DELETE para Consumables
-- ============================================

-- INSERT: Admin pode inserir
CREATE POLICY consumables_insert_admin ON public.consumables
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- UPDATE: Admin pode atualizar
CREATE POLICY consumables_update_admin ON public.consumables
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY consumables_delete_admin ON public.consumables
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 6: Políticas INSERT/UPDATE/DELETE para VIP Configs
-- ============================================

-- INSERT: Admin pode inserir
CREATE POLICY vip_configs_insert_admin ON public.vip_configs
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
  );

-- UPDATE: Admin pode atualizar
CREATE POLICY vip_configs_update_admin ON public.vip_configs
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY vip_configs_delete_admin ON public.vip_configs
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 7: Políticas INSERT/UPDATE/DELETE para VIP Members
-- ============================================

-- INSERT: Admin pode inserir, usuários autenticados também (para cadastro de clientes)
CREATE POLICY vip_members_insert_authenticated ON public.vip_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Admin pode atualizar
CREATE POLICY vip_members_update_admin ON public.vip_members
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY vip_members_delete_admin ON public.vip_members
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 8: Políticas INSERT para Shop Sales
-- ============================================

-- INSERT: Usuários autenticados podem criar vendas (para registrar compras)
CREATE POLICY shop_sales_insert_authenticated ON public.shop_sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Admin pode atualizar
CREATE POLICY shop_sales_update_admin ON public.shop_sales
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY shop_sales_delete_admin ON public.shop_sales
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 9: Políticas UPDATE/DELETE para Appointments
-- ============================================

-- UPDATE: Admin pode atualizar, ou o criador do booking relacionado
CREATE POLICY appointments_update_authenticated ON public.appointments
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = appointments.booking_id 
        AND b.created_by = auth.uid()
      )
    )
  ) WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = appointments.booking_id 
        AND b.created_by = auth.uid()
      )
    )
  );

-- DELETE: Admin pode deletar, ou o criador do booking relacionado
CREATE POLICY appointments_delete_authenticated ON public.appointments
  FOR DELETE USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = appointments.booking_id 
      AND b.created_by = auth.uid()
    )
  );

-- ============================================
-- CORREÇÃO 10: Políticas UPDATE para Payments
-- ============================================

-- UPDATE: Admin pode atualizar (para confirmar pagamentos)
CREATE POLICY payments_update_admin ON public.payments
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
  );

-- DELETE: Admin pode deletar
CREATE POLICY payments_delete_admin ON public.payments
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 11: Políticas UPDATE/DELETE para Bookings
-- ============================================

-- UPDATE: Admin ou criador pode atualizar
CREATE POLICY bookings_update_owner_or_admin ON public.bookings
  FOR UPDATE USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  ) WITH CHECK (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- DELETE: Admin ou criador pode deletar
CREATE POLICY bookings_delete_owner_or_admin ON public.bookings
  FOR DELETE USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- ============================================
-- CORREÇÃO 12: Políticas UPDATE/DELETE para Expenses
-- ============================================

-- UPDATE: Admin ou criador pode atualizar
CREATE POLICY expenses_update_owner_or_admin ON public.expenses
  FOR UPDATE USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  ) WITH CHECK (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- DELETE: Admin ou criador pode deletar
CREATE POLICY expenses_delete_owner_or_admin ON public.expenses
  FOR DELETE USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- ============================================
-- CORREÇÃO 13: Políticas UPDATE/DELETE para Barbershops (Corrigir recursão)
-- ============================================

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS barbershops_insert_admin ON public.barbershops;
DROP POLICY IF EXISTS barbershops_update_admin ON public.barbershops;

-- Nova política INSERT (sem recursão)
CREATE POLICY barbershops_insert_admin ON public.barbershops
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
    OR (owner_id = auth.uid())
  );

-- Nova política UPDATE (sem recursão)
CREATE POLICY barbershops_update_admin ON public.barbershops
  FOR UPDATE USING (
    public.is_admin(auth.uid())
    OR (owner_id = auth.uid())
  ) WITH CHECK (
    public.is_admin(auth.uid())
    OR (owner_id = auth.uid())
  );

-- DELETE: Apenas admin pode deletar
CREATE POLICY barbershops_delete_admin ON public.barbershops
  FOR DELETE USING (
    public.is_admin(auth.uid())
  );

-- ============================================
-- CORREÇÃO 14: Corrigir políticas de Bookings e Expenses (remover recursão)
-- ============================================

-- Remover políticas antigas de bookings
DROP POLICY IF EXISTS bookings_select_owner_or_admin ON public.bookings;

-- Nova política SELECT (sem recursão)
CREATE POLICY bookings_select_owner_or_admin ON public.bookings
  FOR SELECT USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

-- Remover políticas antigas de expenses
DROP POLICY IF EXISTS expenses_select_admin ON public.expenses;

-- Nova política SELECT (sem recursão)
CREATE POLICY expenses_select_admin ON public.expenses
  FOR SELECT USING (
    (created_by = auth.uid())
    OR (public.is_admin(auth.uid()))
  );

COMMIT;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. A função is_admin() usa SECURITY DEFINER para evitar recursão
-- 2. Todas as políticas agora têm INSERT/UPDATE/DELETE completos
-- 3. Collaborators agora tem políticas definidas
-- 4. Execute este script APÓS executar o supabase_schema.sql original
-- ============================================

