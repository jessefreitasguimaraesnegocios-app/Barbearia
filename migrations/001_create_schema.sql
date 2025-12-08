-- 001_create_schema.sql
-- Migração inicial para criar o schema do aplicativo Barbearia
-- Rode este arquivo no SQL editor do Supabase ou via psql/supabase CLI

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collaborator_role') THEN
    CREATE TYPE public.collaborator_role AS ENUM (
      'barbeiro','barbeiro-junior','faxineira','socio','atendente','socio-barbeiro','dono-barbeiro','dono','socio-investidor'
    );
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM (
      'salario-fixo','aluguel-cadeira-100','aluguel-cadeira-50','recebe-100-por-cliente','recebe-50-por-cliente','porcentagem'
    );
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_scope') THEN
    CREATE TYPE public.promotion_scope AS ENUM ('all','vip','none');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vip_billing_cycle') THEN
    CREATE TYPE public.vip_billing_cycle AS ENUM ('monthly','annual');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vip_payment_status') THEN
    CREATE TYPE public.vip_payment_status AS ENUM ('paid','pending','overdue');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'barbershop_status') THEN
    CREATE TYPE public.barbershop_status AS ENUM ('disponivel','indisponivel');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type') THEN
    CREATE TYPE public.expense_type AS ENUM ('despesa','investimento');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
    CREATE TYPE public.product_category AS ENUM ('produtos','consumo','bebidas','estilo','rascunho');
  END IF;
END$$;

-- TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  role text DEFAULT 'user',
  is_admin boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin);

CREATE TABLE IF NOT EXISTS public.barbershops (
  id text PRIMARY KEY,
  name text NOT NULL,
  rating numeric(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  address text,
  phone text,
  hours text,
  is_open boolean DEFAULT false,
  email text,
  pix_key text,
  status public.barbershop_status DEFAULT 'disponivel',
  data_pagamento date,
  data_vencimento date,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barbershops_name ON public.barbershops (name);
CREATE INDEX IF NOT EXISTS idx_barbershops_owner ON public.barbershops (owner_id);

CREATE TABLE IF NOT EXISTS public.collaborators (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  cpf text,
  password_hash text,
  role public.collaborator_role NOT NULL,
  specialty text DEFAULT '',
  payment_method public.payment_method,
  photo_url text,
  experience text,
  work_schedule text,
  chair_rental_amount numeric(10,2),
  salary numeric(12,2),
  percentage_percentage integer,
  pix_key text,
  created_at timestamptz DEFAULT now(),
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collaborators_email ON public.collaborators (email);
CREATE INDEX IF NOT EXISTS idx_collaborators_cpf ON public.collaborators (cpf);
CREATE INDEX IF NOT EXISTS idx_collaborators_barbershop ON public.collaborators (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON public.collaborators (role);

CREATE TABLE IF NOT EXISTS public.services (
  id text PRIMARY KEY,
  title text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration text,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  promotion_scope public.promotion_scope DEFAULT 'none',
  discount_percentage integer
);

CREATE INDEX IF NOT EXISTS idx_services_title ON public.services (title);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services (price);

CREATE TABLE IF NOT EXISTS public.store_products (
  id text PRIMARY KEY,
  external_id text,
  name text NOT NULL,
  description text,
  image_url text,
  rating numeric(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  price numeric(10,2) DEFAULT 0,
  quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  vip_discount integer DEFAULT 0,
  vip_promotion_label text,
  created_at timestamptz DEFAULT now(),
  category public.product_category DEFAULT 'produtos',
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_products_barbershop ON public.store_products (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_products_external ON public.store_products (external_id);
CREATE INDEX IF NOT EXISTS idx_store_products_name ON public.store_products (name);

CREATE TABLE IF NOT EXISTS public.consumables (
  id text PRIMARY KEY,
  name text NOT NULL,
  image_url text NULL,
  image_file_name text NULL,
  quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  unit text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consumables_barbershop ON public.consumables (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_consumables_name ON public.consumables (name);

CREATE TABLE IF NOT EXISTS public.vip_configs (
  id text PRIMARY KEY,
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE CASCADE,
  price_monthly numeric(10,2) DEFAULT 0,
  price_annual numeric(12,2) DEFAULT 0,
  billing_cycle public.vip_billing_cycle DEFAULT 'monthly',
  benefits text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_configs_barbershop ON public.vip_configs (barbershop_id);

CREATE TABLE IF NOT EXISTS public.vip_members (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  cpf text,
  billing_cycle public.vip_billing_cycle NOT NULL,
  payment_status public.vip_payment_status DEFAULT 'pending',
  joined_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vip_members_cpf ON public.vip_members (cpf);
CREATE INDEX IF NOT EXISTS idx_vip_members_email ON public.vip_members (email);
CREATE INDEX IF NOT EXISTS idx_vip_members_barbershop ON public.vip_members (barbershop_id);

CREATE TABLE IF NOT EXISTS public.bookings (
  id text PRIMARY KEY,
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  customer_cpf text,
  is_vip boolean DEFAULT false,
  vip_member_id text REFERENCES public.vip_members(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_barbershop ON public.bookings (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON public.bookings (created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_timestamp ON public.bookings (timestamp);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_cpf ON public.bookings (customer_cpf);

CREATE TABLE IF NOT EXISTS public.appointments (
  id text PRIMARY KEY,
  booking_id text REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id text REFERENCES public.services(id) ON DELETE SET NULL,
  collaborator_id text REFERENCES public.collaborators(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration text,
  client_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_booking ON public.appointments (booking_id);
CREATE INDEX IF NOT EXISTS idx_appointments_collaborator ON public.appointments (collaborator_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON public.appointments (service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments (scheduled_at);

CREATE TABLE IF NOT EXISTS public.payments (
  id text PRIMARY KEY,
  booking_id text REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  method text DEFAULT 'pix',
  status text DEFAULT 'pending',
  tx_id text,
  receipt_path text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_id ON public.payments (tx_id);

CREATE TABLE IF NOT EXISTS public.shop_sales (
  id text PRIMARY KEY,
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE SET NULL,
  product_id text REFERENCES public.store_products(id) ON DELETE SET NULL,
  product_external_id text,
  product_name text,
  quantity integer DEFAULT 1,
  price numeric(10,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * price) STORED,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_shop_sales_barbershop ON public.shop_sales (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_shop_sales_product ON public.shop_sales (product_id);

CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY,
  barbershop_id text REFERENCES public.barbershops(id) ON DELETE SET NULL,
  description text,
  value numeric(12,2) DEFAULT 0,
  type public.expense_type DEFAULT 'despesa',
  date date DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_barbershop ON public.expenses (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date);

-- Trigger helper: atualiza updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Adiciona triggers onde existe coluna updated_at
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='barbershops' AND column_name='updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_barbershops_updated_at') THEN
      CREATE TRIGGER trg_barbershops_updated_at
      BEFORE UPDATE ON public.barbershops
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_products' AND column_name='updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_products_updated_at') THEN
      CREATE TRIGGER trg_store_products_updated_at
      BEFORE UPDATE ON public.store_products
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='consumables' AND column_name='updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_consumables_updated_at') THEN
      CREATE TRIGGER trg_consumables_updated_at
      BEFORE UPDATE ON public.consumables
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vip_configs' AND column_name='updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vip_configs_updated_at') THEN
      CREATE TRIGGER trg_vip_configs_updated_at
      BEFORE UPDATE ON public.vip_configs
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
    END IF;
  END IF;
END; $$;

-- RLS policies (padrão inicial)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS profiles_insert_authenticated ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS profiles_select_owner_or_admin ON public.profiles
  FOR SELECT USING (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

CREATE POLICY IF NOT EXISTS profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE USING (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  ) WITH CHECK (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

-- Activate RLS and basic policies for other tables
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS barbershops_select_public ON public.barbershops FOR SELECT USING (true);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS services_select_public ON public.services FOR SELECT USING (true);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS store_products_select_public ON public.store_products FOR SELECT USING (true);

ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS consumables_select_public ON public.consumables FOR SELECT USING (true);

ALTER TABLE public.vip_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS vip_configs_select_public ON public.vip_configs FOR SELECT USING (true);

ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS vip_members_select_public ON public.vip_members FOR SELECT USING (true);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS bookings_insert_authenticated ON public.bookings FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS bookings_select_owner_or_admin ON public.bookings FOR SELECT USING ((created_by = auth.uid()) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)));

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS appointments_insert_authenticated ON public.appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS payments_insert_authenticated ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

ALTER TABLE public.shop_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS shop_sales_select_public ON public.shop_sales FOR SELECT USING (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS expenses_select_owner_or_admin ON public.expenses FOR SELECT USING ((created_by = auth.uid()) OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)));

-- Utilitários opcionais
CREATE OR REPLACE FUNCTION public.find_vip_by_cpf(search_cpf text)
RETURNS TABLE(
  id text,
  name text,
  email text,
  phone text,
  cpf text,
  billing_cycle public.vip_billing_cycle,
  payment_status public.vip_payment_status,
  joined_at timestamptz,
  expires_at timestamptz,
  barbershop_id text
) LANGUAGE sql STABLE AS $$
  SELECT id, name, email, phone, cpf, billing_cycle, payment_status, joined_at, expires_at, barbershop_id
  FROM public.vip_members
  WHERE regexp_replace(cpf, '\\D', '', 'g') = regexp_replace(search_cpf, '\\D', '', 'g')
  LIMIT 1;
$$;

COMMIT;

-- Fim da migração 001
