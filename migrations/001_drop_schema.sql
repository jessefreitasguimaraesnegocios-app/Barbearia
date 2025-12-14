-- 001_drop_schema.sql
-- Rollback (down) para a migração 001
-- Este script remove objetos criados pelo 001_create_schema.sql

BEGIN;

-- Drop functions
DROP FUNCTION IF EXISTS public.find_vip_by_cpf(text) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Drop tables in order (dependents primeiro)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.shop_sales CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.vip_members CASCADE;
DROP TABLE IF EXISTS public.vip_configs CASCADE;
DROP TABLE IF EXISTS public.consumables CASCADE;
DROP TABLE IF EXISTS public.store_products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.collaborators CASCADE;
DROP TABLE IF EXISTS public.barbershops CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
    DROP TYPE public.product_category CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type') THEN
    DROP TYPE public.expense_type CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'barbershop_status') THEN
    DROP TYPE public.barbershop_status CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vip_payment_status') THEN
    DROP TYPE public.vip_payment_status CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vip_billing_cycle') THEN
    DROP TYPE public.vip_billing_cycle CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_scope') THEN
    DROP TYPE public.promotion_scope CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    DROP TYPE public.payment_method CASCADE;
  END IF;
END$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collaborator_role') THEN
    DROP TYPE public.collaborator_role CASCADE;
  END IF;
END$$;

COMMIT;

-- Fim do rollback 001
