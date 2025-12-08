-- 002_convert_text_ids_to_uuid.sql
-- Migração para converter PKs/FKs tipo TEXT para UUID preservando relacionamentos
-- IMPORTANTE: faça backup do banco antes de executar.
-- Execute no SQL Editor do Supabase ou via psql.

-- Estratégia:
-- 1) Para cada tabela com PK text, criamos coluna temporária id_new UUID e colunas *_id_new para FKs.
-- 2) Populamos id_new com gen_random_uuid() e preenchemos os *_id_new nas tabelas dependentes via JOIN.
-- 3) Substituímos as colunas PK e FK originais pelas novas UUIDs (mantendo uma coluna *_old_text como backup).
-- 4) Recriamos constraints PK e FK para as novas colunas UUID.

BEGIN;

-- Verificações iniciais
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) BARBERSHOPS (pai)
ALTER TABLE IF EXISTS public.barbershops ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.barbershops SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.barbershops ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.barbershops SET id_old_text = id WHERE id_old_text IS NULL;

-- Add FK holders in dependent tables referencing barbershops
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collaborators' AND column_name='barbershop_id') THEN
    ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.collaborators c SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = c.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_products' AND column_name='barbershop_id') THEN
    ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.store_products sp SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = sp.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consumables' AND column_name='barbershop_id') THEN
    ALTER TABLE public.consumables ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.consumables c SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = c.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vip_configs' AND column_name='barbershop_id') THEN
    ALTER TABLE public.vip_configs ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.vip_configs v SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = v.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vip_members' AND column_name='barbershop_id') THEN
    ALTER TABLE public.vip_members ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.vip_members vm SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = vm.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='barbershop_id') THEN
    ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.bookings bk SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = bk.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shop_sales' AND column_name='barbershop_id') THEN
    ALTER TABLE public.shop_sales ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.shop_sales ss SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = ss.barbershop_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='barbershop_id') THEN
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS barbershop_id_new uuid;
    UPDATE public.expenses e SET barbershop_id_new = b.id_new FROM public.barbershops b WHERE b.id = e.barbershop_id;
  END IF;
END$$;

-- 2) Substituir PK de barbershops
-- Drop PK constraint if exists
ALTER TABLE public.barbershops DROP CONSTRAINT IF EXISTS barbershops_pkey;
-- remove old id after we keep id_old_text
ALTER TABLE public.barbershops DROP COLUMN IF EXISTS id;
ALTER TABLE public.barbershops RENAME COLUMN id_new TO id;
ALTER TABLE public.barbershops ADD PRIMARY KEY (id);

-- Replace FK columns referencing barbershops (rename *_new -> barbershop_id and recreate FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.collaborators DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.collaborators RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.collaborators ADD CONSTRAINT fk_collaborators_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_products' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.store_products DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.store_products RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.store_products ADD CONSTRAINT fk_store_products_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consumables' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.consumables DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.consumables RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.consumables ADD CONSTRAINT fk_consumables_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vip_configs' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.vip_configs DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.vip_configs RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.vip_configs ADD CONSTRAINT fk_vip_configs_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vip_members' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.vip_members DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.vip_members RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.vip_members ADD CONSTRAINT fk_vip_members_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.bookings DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.bookings RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.bookings ADD CONSTRAINT fk_bookings_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_sales' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.shop_sales DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.shop_sales RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.shop_sales ADD CONSTRAINT fk_shop_sales_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='barbershop_id_new') THEN
    ALTER TABLE public.expenses DROP COLUMN IF EXISTS barbershop_id;
    ALTER TABLE public.expenses RENAME COLUMN barbershop_id_new TO barbershop_id;
    ALTER TABLE public.expenses ADD CONSTRAINT fk_expenses_barbershop FOREIGN KEY (barbershop_id) REFERENCES public.barbershops(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 3) COLLABORATORS (pai para appointments)
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.collaborators SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.collaborators ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.collaborators SET id_old_text = id WHERE id_old_text IS NULL;

-- Populate appointments.collaborator_id_new
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='collaborator_id') THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS collaborator_id_new uuid;
    UPDATE public.appointments a SET collaborator_id_new = c.id_new FROM public.collaborators c WHERE c.id = a.collaborator_id;
  END IF;
END$$;

-- Replace PK on collaborators
ALTER TABLE public.collaborators DROP CONSTRAINT IF EXISTS collaborators_pkey;
ALTER TABLE public.collaborators DROP COLUMN IF EXISTS id;
ALTER TABLE public.collaborators RENAME COLUMN id_new TO id;
ALTER TABLE public.collaborators ADD PRIMARY KEY (id);

-- Replace FK on appointments -> collaborator_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='collaborator_id_new') THEN
    ALTER TABLE public.appointments DROP COLUMN IF EXISTS collaborator_id;
    ALTER TABLE public.appointments RENAME COLUMN collaborator_id_new TO collaborator_id;
    ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 4) STORE_PRODUCTS (pai para shop_sales)
ALTER TABLE IF EXISTS public.store_products ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.store_products SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.store_products ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.store_products SET id_old_text = id WHERE id_old_text IS NULL;

-- Populate shop_sales.product_id_new
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_sales' AND column_name='product_id') THEN
    ALTER TABLE public.shop_sales ADD COLUMN IF NOT EXISTS product_id_new uuid;
    UPDATE public.shop_sales ss SET product_id_new = sp.id_new FROM public.store_products sp WHERE sp.id = ss.product_id;
  END IF;
END$$;

-- Replace PK on store_products
ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_pkey;
ALTER TABLE public.store_products DROP COLUMN IF EXISTS id;
ALTER TABLE public.store_products RENAME COLUMN id_new TO id;
ALTER TABLE public.store_products ADD PRIMARY KEY (id);

-- Replace FK on shop_sales -> product_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_sales' AND column_name='product_id_new') THEN
    ALTER TABLE public.shop_sales DROP COLUMN IF EXISTS product_id;
    ALTER TABLE public.shop_sales RENAME COLUMN product_id_new TO product_id;
    ALTER TABLE public.shop_sales ADD CONSTRAINT fk_shop_sales_product FOREIGN KEY (product_id) REFERENCES public.store_products(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 5) VIP_MEMBERS (pai para bookings.vip_member_id)
ALTER TABLE IF EXISTS public.vip_members ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.vip_members SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.vip_members ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.vip_members SET id_old_text = id WHERE id_old_text IS NULL;

-- Populate bookings.vip_member_id_new
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='vip_member_id') THEN
    ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vip_member_id_new uuid;
    UPDATE public.bookings bk SET vip_member_id_new = vm.id_new FROM public.vip_members vm WHERE vm.id = bk.vip_member_id;
  END IF;
END$$;

-- Replace PK on vip_members
ALTER TABLE public.vip_members DROP CONSTRAINT IF EXISTS vip_members_pkey;
ALTER TABLE public.vip_members DROP COLUMN IF EXISTS id;
ALTER TABLE public.vip_members RENAME COLUMN id_new TO id;
ALTER TABLE public.vip_members ADD PRIMARY KEY (id);

-- Replace FK on bookings->vip_member_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='vip_member_id_new') THEN
    ALTER TABLE public.bookings DROP COLUMN IF EXISTS vip_member_id;
    ALTER TABLE public.bookings RENAME COLUMN vip_member_id_new TO vip_member_id;
    ALTER TABLE public.bookings ADD CONSTRAINT fk_bookings_vip_member FOREIGN KEY (vip_member_id) REFERENCES public.vip_members(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 6) BOOKINGS (pai para appointments, payments)
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.bookings SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.bookings SET id_old_text = id WHERE id_old_text IS NULL;

-- Populate appointments.booking_id_new and payments.booking_id_new
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='booking_id') THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_id_new uuid;
    UPDATE public.appointments a SET booking_id_new = b.id_new FROM public.bookings b WHERE b.id = a.booking_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='booking_id') THEN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS booking_id_new uuid;
    UPDATE public.payments p SET booking_id_new = b.id_new FROM public.bookings b WHERE b.id = p.booking_id;
  END IF;
END$$;

-- Replace PK on bookings
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS id;
ALTER TABLE public.bookings RENAME COLUMN id_new TO id;
ALTER TABLE public.bookings ADD PRIMARY KEY (id);

-- Replace FK on appointments -> booking_id and payments -> booking_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='booking_id_new') THEN
    ALTER TABLE public.appointments DROP COLUMN IF EXISTS booking_id;
    ALTER TABLE public.appointments RENAME COLUMN booking_id_new TO booking_id;
    ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='booking_id_new') THEN
    ALTER TABLE public.payments DROP COLUMN IF EXISTS booking_id;
    ALTER TABLE public.payments RENAME COLUMN booking_id_new TO booking_id;
    ALTER TABLE public.payments ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 7) APPOINTMENTS (already handled collaborator and booking)
-- Ensure appointments PK converted
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.appointments SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.appointments ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.appointments SET id_old_text = id WHERE id_old_text IS NULL;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS id;
ALTER TABLE public.appointments RENAME COLUMN id_new TO id;
ALTER TABLE public.appointments ADD PRIMARY KEY (id);

-- 8) PAYMENTS: convert PK
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.payments SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.payments SET id_old_text = id WHERE id_old_text IS NULL;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE public.payments DROP COLUMN IF EXISTS id;
ALTER TABLE public.payments RENAME COLUMN id_new TO id;
ALTER TABLE public.payments ADD PRIMARY KEY (id);

-- 9) SHOP_SALES: convert PK
ALTER TABLE IF EXISTS public.shop_sales ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.shop_sales SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.shop_sales ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.shop_sales SET id_old_text = id WHERE id_old_text IS NULL;

ALTER TABLE public.shop_sales DROP CONSTRAINT IF EXISTS shop_sales_pkey;
ALTER TABLE public.shop_sales DROP COLUMN IF EXISTS id;
ALTER TABLE public.shop_sales RENAME COLUMN id_new TO id;
ALTER TABLE public.shop_sales ADD PRIMARY KEY (id);

-- 10) EXPENSES: convert PK
ALTER TABLE IF EXISTS public.expenses ADD COLUMN IF NOT EXISTS id_new uuid;
UPDATE public.expenses SET id_new = gen_random_uuid() WHERE id_new IS NULL;
ALTER TABLE IF EXISTS public.expenses ADD COLUMN IF NOT EXISTS id_old_text text;
UPDATE public.expenses SET id_old_text = id WHERE id_old_text IS NULL;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS id;
ALTER TABLE public.expenses RENAME COLUMN id_new TO id;
ALTER TABLE public.expenses ADD PRIMARY KEY (id);

-- Observação: mantivemos colunas *_old_text como backup. Se desejar removê-las após verificação, pode executar
-- ALTER TABLE ... DROP COLUMN id_old_text; para cada tabela.

COMMIT;

-- FIM da migração 002

-- AVISO: Após rodar, verifique os relacionamentos e índices. Teste suas operações CRUD no ambiente de staging antes de aplicar em produção.
