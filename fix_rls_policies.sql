-- ============================================
-- FIX RLS POLICIES - Permitir criação de usuários e profiles
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase
-- Este arquivo corrige as políticas RLS para permitir criação de usuários
-- ============================================

BEGIN;

-- ============================================
-- PROFILES - Permitir criação automática pelo trigger
-- ============================================
-- O trigger handle_new_user() já cria o profile automaticamente
-- A política deve permitir inserção pelo próprio trigger (SECURITY DEFINER)
-- A política atual já está correta, não precisa mudar

-- ============================================
-- BARBEARIAS - Permitir criação por usuários autenticados
-- ============================================
-- Atualizar política de inserção para permitir qualquer usuário autenticado
DROP POLICY IF EXISTS barbershops_insert_admin ON public.barbershops;
CREATE POLICY barbershops_insert_admin ON public.barbershops
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    OR (owner_id = auth.uid() AND auth.uid() IS NOT NULL)
    OR (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL) -- Permitir qualquer usuário autenticado
  );

-- Manter política de seleção pública (já existe)
-- Não precisa mudar, já permite SELECT para todos

-- Manter política de atualização (já permite owner ou admin)
-- Não precisa mudar

-- ============================================
-- SERVICES - Permitir criação por usuários autenticados
-- ============================================
-- Simplificar: permitir qualquer usuário autenticado criar serviços
DROP POLICY IF EXISTS services_insert_admin ON public.services;
CREATE POLICY services_insert_admin ON public.services
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    OR (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL)
  );

-- ============================================
-- STORE_PRODUCTS - Permitir criação por usuários autenticados
-- ============================================
-- Simplificar: permitir qualquer usuário autenticado criar produtos
DROP POLICY IF EXISTS store_products_insert_admin ON public.store_products;
CREATE POLICY store_products_insert_admin ON public.store_products
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    OR (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL)
  );

COMMIT;
