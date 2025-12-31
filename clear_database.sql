-- ============================================
-- SCRIPT PARA LIMPAR TODOS OS DADOS DO BANCO
-- ============================================
-- ⚠️ ATENÇÃO: Este script remove TODOS os dados das tabelas!
-- Use com cuidado. Este script NÃO remove a estrutura (tabelas, colunas, etc.)
-- Apenas remove os dados (registros).
-- ============================================

BEGIN;

-- ============================================
-- LIMPEZA EM ORDEM (respeitando foreign keys)
-- ============================================
-- A ordem importa! Remover primeiro as tabelas que dependem de outras

-- 1. Remover dados que dependem de outras tabelas (child tables)
DELETE FROM public.appointments;
DELETE FROM public.payments;
DELETE FROM public.bookings;
DELETE FROM public.shop_sales;
DELETE FROM public.expenses;

-- 2. Remover serviços (dependem de barbershops)
DELETE FROM public.services;

-- 3. Remover colaboradores (dependem de barbershops)
DELETE FROM public.collaborators;

-- 4. Remover produtos e consumíveis (dependem de barbershops)
DELETE FROM public.store_products;
DELETE FROM public.consumables;

-- 5. Remover membros VIP e configurações VIP (dependem de barbershops)
DELETE FROM public.vip_members;
DELETE FROM public.vip_configs;

-- 6. Remover barbearias
DELETE FROM public.barbershops;

-- 7. Remover perfis de usuários (opcional - se quiser limpar tudo)
-- ⚠️ Descomente a linha abaixo se quiser remover também os perfis
-- DELETE FROM public.profiles;

COMMIT;

-- ============================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================
-- Execute estas queries para verificar se os dados foram removidos:

-- SELECT COUNT(*) as total_appointments FROM public.appointments;
-- SELECT COUNT(*) as total_payments FROM public.payments;
-- SELECT COUNT(*) as total_bookings FROM public.bookings;
-- SELECT COUNT(*) as total_shop_sales FROM public.shop_sales;
-- SELECT COUNT(*) as total_expenses FROM public.expenses;
-- SELECT COUNT(*) as total_services FROM public.services;
-- SELECT COUNT(*) as total_collaborators FROM public.collaborators;
-- SELECT COUNT(*) as total_store_products FROM public.store_products;
-- SELECT COUNT(*) as total_consumables FROM public.consumables;
-- SELECT COUNT(*) as total_vip_members FROM public.vip_members;
-- SELECT COUNT(*) as total_vip_configs FROM public.vip_configs;
-- SELECT COUNT(*) as total_barbershops FROM public.barbershops;
-- SELECT COUNT(*) as total_profiles FROM public.profiles;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- ✅ Este script remove APENAS os dados (registros)
-- ✅ A estrutura das tabelas (colunas, tipos, constraints) permanece intacta
-- ✅ Índices e políticas RLS permanecem
-- ✅ Você pode executar o seed_database.sql novamente após limpar
--
-- ⚠️ Este script NÃO remove:
--    - Estrutura das tabelas
--    - Colunas
--    - Tipos ENUM
--    - Índices
--    - Políticas RLS
--    - Funções
--    - Triggers
--
-- 🔄 Para remover TUDO (incluindo estrutura), execute:
--    DROP SCHEMA public CASCADE;
--    CREATE SCHEMA public;
--    E depois execute o supabase_schema.sql novamente
-- ============================================

