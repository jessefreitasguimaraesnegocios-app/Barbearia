-- ============================================
-- SCHEMA COMPLETO PARA BARBEARIA - SUPABASE
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase
-- Ou através do CLI: supabase db reset
-- ============================================

BEGIN;

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (Tipos enumerados)
-- ============================================

-- Roles de colaboradores
DO $$ BEGIN
  CREATE TYPE public.collaborator_role AS ENUM (
    'barbeiro',
    'barbeiro-junior',
    'faxineira',
    'socio',
    'atendente',
    'socio-barbeiro',
    'dono-barbeiro',
    'dono',
    'socio-investidor'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Métodos de pagamento para colaboradores
DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM (
    'salario-fixo',
    'aluguel-cadeira-100',
    'aluguel-cadeira-50',
    'recebe-100-por-cliente',
    'recebe-50-por-cliente',
    'porcentagem'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Escopo de promoções de serviços
DO $$ BEGIN
  CREATE TYPE public.promotion_scope AS ENUM ('all', 'vip', 'none');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ciclo de cobrança VIP
DO $$ BEGIN
  CREATE TYPE public.vip_billing_cycle AS ENUM ('monthly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de pagamento VIP
DO $$ BEGIN
  CREATE TYPE public.vip_payment_status AS ENUM ('paid', 'pending', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status da barbearia
DO $$ BEGIN
  CREATE TYPE public.barbershop_status AS ENUM ('disponivel', 'indisponivel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo de despesa
DO $$ BEGIN
  CREATE TYPE public.expense_type AS ENUM ('despesa', 'investimento');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Categoria de produto
DO $$ BEGIN
  CREATE TYPE public.product_category AS ENUM (
    'produtos',
    'consumo',
    'bebidas',
    'estilo',
    'rascunho'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de pagamento
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELAS
-- ============================================

-- Perfis de usuários (integração com auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone text,
  role text DEFAULT 'user',
  is_admin boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin);

-- Barbearias
CREATE TABLE IF NOT EXISTS public.barbershops (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_barbershops_status ON public.barbershops (status);

-- Colaboradores
CREATE TABLE IF NOT EXISTS public.collaborators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  percentage_percentage integer CHECK (percentage_percentage >= 0 AND percentage_percentage <= 100),
  pix_key text,
  created_at timestamptz DEFAULT now(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collaborators_email ON public.collaborators (email);
CREATE INDEX IF NOT EXISTS idx_collaborators_cpf ON public.collaborators (cpf);
CREATE INDEX IF NOT EXISTS idx_collaborators_barbershop ON public.collaborators (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON public.collaborators (role);

-- Serviços
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration text,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  promotion_scope public.promotion_scope DEFAULT 'none',
  discount_percentage integer CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_title ON public.services (title);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services (price);
CREATE INDEX IF NOT EXISTS idx_services_barbershop ON public.services (barbershop_id);

-- Produtos da loja
CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id text,
  name text NOT NULL,
  description text,
  image_url text,
  rating numeric(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  price numeric(10,2) DEFAULT 0,
  quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  vip_discount integer DEFAULT 0 CHECK (vip_discount >= 0 AND vip_discount <= 100),
  vip_promotion_label text,
  created_at timestamptz DEFAULT now(),
  category public.product_category DEFAULT 'produtos',
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_products_barbershop ON public.store_products (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_store_products_external ON public.store_products (external_id);
CREATE INDEX IF NOT EXISTS idx_store_products_name ON public.store_products (name);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products (category);

-- Itens de consumo (estoque)
CREATE TABLE IF NOT EXISTS public.consumables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  image_url text,
  image_file_name text,
  quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  unit text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_consumables_barbershop ON public.consumables (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_consumables_name ON public.consumables (name);

-- Configurações VIP
CREATE TABLE IF NOT EXISTS public.vip_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE,
  price_monthly numeric(10,2) DEFAULT 0,
  price_annual numeric(12,2) DEFAULT 0,
  billing_cycle public.vip_billing_cycle DEFAULT 'monthly',
  benefits text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vip_configs_barbershop ON public.vip_configs (barbershop_id);

-- Membros VIP
CREATE TABLE IF NOT EXISTS public.vip_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  cpf text,
  billing_cycle public.vip_billing_cycle NOT NULL,
  payment_status public.vip_payment_status DEFAULT 'pending',
  joined_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vip_members_cpf ON public.vip_members (cpf);
CREATE INDEX IF NOT EXISTS idx_vip_members_email ON public.vip_members (email);
CREATE INDEX IF NOT EXISTS idx_vip_members_barbershop ON public.vip_members (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_vip_members_status ON public.vip_members (payment_status);

-- Agendamentos (Bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  customer_cpf text,
  is_vip boolean DEFAULT false,
  vip_member_id uuid REFERENCES public.vip_members(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_barbershop ON public.bookings (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_by ON public.bookings (created_by);
CREATE INDEX IF NOT EXISTS idx_bookings_timestamp ON public.bookings (timestamp);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_cpf ON public.bookings (customer_cpf);
CREATE INDEX IF NOT EXISTS idx_bookings_vip ON public.bookings (is_vip);

-- Compromissos (Appointments) - serviços agendados dentro de um booking
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  collaborator_id uuid REFERENCES public.collaborators(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration text,
  client_name text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_booking ON public.appointments (booking_id);
CREATE INDEX IF NOT EXISTS idx_appointments_collaborator ON public.appointments (collaborator_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON public.appointments (service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments (scheduled_at);

-- Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'BRL',
  method text DEFAULT 'pix',
  status public.payment_status DEFAULT 'pending',
  tx_id text,
  receipt_path text,
  receipt_url text,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_id ON public.payments (tx_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at);

-- Vendas da loja
CREATE TABLE IF NOT EXISTS public.shop_sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL,
  product_external_id text,
  product_name text,
  quantity integer DEFAULT 1,
  price numeric(10,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (quantity * price) STORED,
  timestamp timestamptz DEFAULT now(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_shop_sales_barbershop ON public.shop_sales (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_shop_sales_product ON public.shop_sales (product_id);
CREATE INDEX IF NOT EXISTS idx_shop_sales_timestamp ON public.shop_sales (timestamp);
CREATE INDEX IF NOT EXISTS idx_shop_sales_payment ON public.shop_sales (payment_id);

-- Despesas
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE SET NULL,
  description text,
  value numeric(12,2) DEFAULT 0,
  type public.expense_type DEFAULT 'despesa',
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_barbershop ON public.expenses (barbershop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses (type);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses (created_by);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Adicionar triggers onde existe coluna updated_at
DROP TRIGGER IF EXISTS trg_barbershops_updated_at ON public.barbershops;
CREATE TRIGGER trg_barbershops_updated_at
  BEFORE UPDATE ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_store_products_updated_at ON public.store_products;
CREATE TRIGGER trg_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_consumables_updated_at ON public.consumables;
CREATE TRIGGER trg_consumables_updated_at
  BEFORE UPDATE ON public.consumables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vip_configs_updated_at ON public.vip_configs;
CREATE TRIGGER trg_vip_configs_updated_at
  BEFORE UPDATE ON public.vip_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para buscar VIP por CPF
CREATE OR REPLACE FUNCTION public.find_vip_by_cpf(search_cpf text)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  cpf text,
  billing_cycle public.vip_billing_cycle,
  payment_status public.vip_payment_status,
  joined_at timestamptz,
  expires_at timestamptz,
  barbershop_id uuid
) LANGUAGE sql STABLE AS $$
  SELECT 
    id, 
    name, 
    email, 
    phone, 
    cpf, 
    billing_cycle, 
    payment_status, 
    joined_at, 
    expires_at, 
    barbershop_id
  FROM public.vip_members
  WHERE regexp_replace(cpf, '\D', '', 'g') = regexp_replace(search_cpf, '\D', '', 'g')
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Profiles: usuário pode ver/editar seu próprio perfil, admin vê tudo
DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
CREATE POLICY profiles_insert_authenticated ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT USING (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;
CREATE POLICY profiles_update_owner_or_admin ON public.profiles
  FOR UPDATE USING (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  ) WITH CHECK (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

-- Barbearias: públicas para leitura, admin/dono pode editar
DROP POLICY IF EXISTS barbershops_select_public ON public.barbershops;
CREATE POLICY barbershops_select_public ON public.barbershops 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS barbershops_insert_admin ON public.barbershops;
CREATE POLICY barbershops_insert_admin ON public.barbershops
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
    OR (owner_id = auth.uid())
  );

DROP POLICY IF EXISTS barbershops_update_admin ON public.barbershops;
CREATE POLICY barbershops_update_admin ON public.barbershops
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
    OR (owner_id = auth.uid())
  );

-- Serviços: públicos para leitura
DROP POLICY IF EXISTS services_select_public ON public.services;
CREATE POLICY services_select_public ON public.services 
  FOR SELECT USING (true);

-- Produtos da loja: públicos para leitura
DROP POLICY IF EXISTS store_products_select_public ON public.store_products;
CREATE POLICY store_products_select_public ON public.store_products 
  FOR SELECT USING (true);

-- Itens de consumo: públicos para leitura
DROP POLICY IF EXISTS consumables_select_public ON public.consumables;
CREATE POLICY consumables_select_public ON public.consumables 
  FOR SELECT USING (true);

-- Configurações VIP: públicas
DROP POLICY IF EXISTS vip_configs_select_public ON public.vip_configs;
CREATE POLICY vip_configs_select_public ON public.vip_configs 
  FOR SELECT USING (true);

-- Membros VIP: públicos
DROP POLICY IF EXISTS vip_members_select_public ON public.vip_members;
CREATE POLICY vip_members_select_public ON public.vip_members 
  FOR SELECT USING (true);

-- Bookings: usuário vê os próprios, admin vê todos
DROP POLICY IF EXISTS bookings_insert_authenticated ON public.bookings;
CREATE POLICY bookings_insert_authenticated ON public.bookings 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS bookings_select_owner_or_admin ON public.bookings;
CREATE POLICY bookings_select_owner_or_admin ON public.bookings 
  FOR SELECT USING (
    (created_by = auth.uid()) 
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

-- Appointments: autenticados podem inserir
DROP POLICY IF EXISTS appointments_insert_authenticated ON public.appointments;
CREATE POLICY appointments_insert_authenticated ON public.appointments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS appointments_select_authenticated ON public.appointments;
CREATE POLICY appointments_select_authenticated ON public.appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Payments: autenticados podem inserir
DROP POLICY IF EXISTS payments_insert_authenticated ON public.payments;
CREATE POLICY payments_insert_authenticated ON public.payments 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS payments_select_authenticated ON public.payments;
CREATE POLICY payments_select_authenticated ON public.payments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Vendas da loja: públicas
DROP POLICY IF EXISTS shop_sales_select_public ON public.shop_sales;
CREATE POLICY shop_sales_select_public ON public.shop_sales 
  FOR SELECT USING (true);

-- Despesas: admin/dono vê todas
DROP POLICY IF EXISTS expenses_select_admin ON public.expenses;
CREATE POLICY expenses_select_admin ON public.expenses 
  FOR SELECT USING (
    (created_by = auth.uid()) 
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  );

DROP POLICY IF EXISTS expenses_insert_authenticated ON public.expenses;
CREATE POLICY expenses_insert_authenticated ON public.expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGER para criar perfil automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- ============================================
-- FIM DO SCHEMA
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase
-- Para verificar: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- ============================================

