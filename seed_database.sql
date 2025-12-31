-- ============================================
-- SCRIPT DE POPULAÇÃO DO BANCO DE DADOS
-- ============================================
-- Execute este arquivo APÓS executar o supabase_schema.sql
-- Este script preenche o banco com dados de exemplo:
-- - Barbearias
-- - Colaboradores/Funcionários
-- - Serviços
-- ============================================

BEGIN;

-- ============================================
-- LIMPAR DADOS EXISTENTES (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo se quiser limpar os dados antes de inserir
-- DELETE FROM public.appointments;
-- DELETE FROM public.payments;
-- DELETE FROM public.bookings;
-- DELETE FROM public.shop_sales;
-- DELETE FROM public.expenses;
-- DELETE FROM public.services;
-- DELETE FROM public.collaborators;
-- DELETE FROM public.store_products;
-- DELETE FROM public.consumables;
-- DELETE FROM public.vip_members;
-- DELETE FROM public.vip_configs;
-- DELETE FROM public.barbershops;

-- ============================================
-- 1. BARBEARIAS
-- ============================================

-- Barbearia 1: BarberBook Premium Center
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  'BarberBook Premium Center',
  4.9,
  'Av. Paulista, 1000 - Bela Vista, São Paulo, SP',
  '11900000001',
  'Seg à Sáb • 09h às 21h',
  true,
  'premium.center@barberbook.com',
  'premium.center@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Barbearia 2: Barbearia Elite Jardins
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7c',
  'Barbearia Elite Jardins',
  4.8,
  'Rua Oscar Freire, 450 - Jardins, São Paulo, SP',
  '11933330002',
  'Seg à Sáb • 10h às 20h',
  true,
  'elite.jardins@barberbook.com',
  'elite.jardins@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Barbearia 3: Studio BarberBook Moema
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7d',
  'Studio BarberBook Moema',
  5.0,
  'Alameda dos Anapurus, 320 - Moema, São Paulo, SP',
  '11955550003',
  'Seg à Dom • 08h às 22h',
  true,
  'studio.moema@barberbook.com',
  'studio.moema@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Barbearia 4: Barbearia Clube Alphaville
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b4e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7e',
  'Barbearia Clube Alphaville',
  4.7,
  'Alameda Rio Negro, 120 - Alphaville, Barueri, SP',
  '11988880004',
  'Seg à Sáb • 09h às 19h',
  false,
  'clube.alphaville@barberbook.com',
  'clube.alphaville@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Barbearia 5: BarberBook Vila Olímpia
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b5e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7f',
  'BarberBook Vila Olímpia',
  4.9,
  'Rua Funchal, 500 - Vila Olímpia, São Paulo, SP',
  '11977770005',
  'Seg à Dom • 08h às 21h',
  true,
  'vila.olimpia@barberbook.com',
  'vila.olimpia@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Barbearia 6: Barbearia Concept Pinheiros
INSERT INTO public.barbershops (id, name, rating, address, phone, hours, is_open, email, pix_key, status, created_at, updated_at)
VALUES (
  'b6e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a80',
  'Barbearia Concept Pinheiros',
  4.8,
  'Rua dos Pinheiros, 620 - Pinheiros, São Paulo, SP',
  '11944440006',
  'Seg à Sáb • 09h às 20h',
  true,
  'concept.pinheiros@barberbook.com',
  'concept.pinheiros@barberbook.com',
  'disponivel',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. COLABORADORES/FUNCIONÁRIOS
-- ============================================

-- Colaborador 1: Miguel Santos - Barbeiro (Barbearia 1)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty, 
  payment_method, barbershop_id, created_at
)
VALUES (
  'c1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a91',
  'Miguel Santos',
  '11999991234',
  'miguel.santos@barberbook.com',
  '12345678900',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'barbeiro',
  'Cortes clássicos e barbas',
  'aluguel-cadeira-100',
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 2: Ana Oliveira - Sócio (Barbearia 1)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, salary, barbershop_id, created_at
)
VALUES (
  'c2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a92',
  'Ana Oliveira',
  '11988885678',
  'ana.oliveira@barberbook.com',
  '98765432100',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'socio',
  'Gestão administrativa',
  'salario-fixo',
  5000.00,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 3: Carlos Silva - Barbeiro (Barbearia 2)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, barbershop_id, created_at
)
VALUES (
  'c3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a93',
  'Carlos Silva',
  '11977774567',
  'carlos.silva@barberbook.com',
  '11122233344',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'barbeiro',
  'Cortes modernos e coloração',
  'aluguel-cadeira-50',
  'b2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7c',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 4: Roberto Lima - Dono/Barbeiro (Barbearia 3)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, barbershop_id, created_at
)
VALUES (
  'c4e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a94',
  'Roberto Lima',
  '11966663456',
  'roberto.lima@barberbook.com',
  '55566677788',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'dono-barbeiro',
  'Cortes premium e design de barba',
  'recebe-100-por-cliente',
  'b3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7d',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 5: Juliana Costa - Atendente (Barbearia 1)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, salary, barbershop_id, created_at
)
VALUES (
  'c5e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a95',
  'Juliana Costa',
  '11955552345',
  'juliana.costa@barberbook.com',
  '22233344455',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'atendente',
  'Atendimento ao cliente',
  'salario-fixo',
  2500.00,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 6: Fernando Alves - Barbeiro Júnior (Barbearia 4)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, barbershop_id, created_at
)
VALUES (
  'c6e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a96',
  'Fernando Alves',
  '11944441234',
  'fernando.alves@barberbook.com',
  '33344455566',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'barbeiro-junior',
  'Cortes básicos',
  'aluguel-cadeira-50',
  'b4e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7e',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Colaborador 7: Lucas Pereira - Sócio/Barbeiro (Barbearia 5)
INSERT INTO public.collaborators (
  id, name, phone, email, cpf, password_hash, role, specialty,
  payment_method, percentage_percentage, barbershop_id, created_at
)
VALUES (
  'c7e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a97',
  'Lucas Pereira',
  '11933330123',
  'lucas.pereira@barberbook.com',
  '44455566677',
  '$2b$10$KIXqJZqMqZqMqZqMqZqMqOuZqMqZqMqZqMqZqMqZqMqZqMqZqMqZ', -- hash de "senha123"
  'socio-barbeiro',
  'Cortes modernos e sobrancelhas',
  'porcentagem',
  30,
  'b5e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7f',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. SERVIÇOS
-- ============================================

-- Serviços para Barbearia 1
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
-- Serviço 1: Corte Clássico
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Clássico',
  45.00,
  '30 min',
  'Corte tradicional com máquina e tesoura, acabamento impecável.',
  '["Lavagem dos cabelos", "Finalização com cera", "Massagem relaxante"]'::jsonb,
  'all',
  10,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
),
-- Serviço 2: Corte + Barba
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b02',
  'Corte + Barba',
  70.00,
  '50 min',
  'Combo completo: corte moderno e barba desenhada.',
  '["Lavagem dos cabelos", "Design de barba", "Toalha quente", "Hidratação facial"]'::jsonb,
  'vip',
  15,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
),
-- Serviço 3: Barba Completa
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b03',
  'Barba Completa',
  35.00,
  '25 min',
  'Desenho e acabamento profissional da barba.',
  '["Toalha quente", "Navalha tradicional", "Hidratação pós-barba"]'::jsonb,
  'all',
  5,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
),
-- Serviço 4: Corte Premium
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b04',
  'Corte Premium',
  65.00,
  '45 min',
  'Corte sofisticado com técnicas avançadas e consultoria de estilo.',
  '["Análise capilar", "Lavagem premium", "Finalização profissional", "Produtos importados"]'::jsonb,
  'vip',
  20,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
),
-- Serviço 5: Platinado/Luzes
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b05',
  'Platinado/Luzes',
  150.00,
  '90 min',
  'Coloração profissional com produtos de alta qualidade.',
  '["Descoloração", "Tonalização", "Tratamento capilar", "Finalização"]'::jsonb,
  'vip',
  25,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
),
-- Serviço 6: Sobrancelha
(
  'a1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b06',
  'Sobrancelha',
  20.00,
  '15 min',
  'Design e acabamento das sobrancelhas.',
  '["Design personalizado", "Acabamento com navalha"]'::jsonb,
  'none',
  NULL,
  'b1e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7b',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Serviços para Barbearia 2 (mesmos serviços, mas com preços diferentes)
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
(
  'a2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Clássico',
  50.00,
  '30 min',
  'Corte tradicional com máquina e tesoura, acabamento impecável.',
  '["Lavagem dos cabelos", "Finalização com cera", "Massagem relaxante"]'::jsonb,
  'all',
  10,
  'b2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7c',
  now(),
  now()
),
(
  'a2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b02',
  'Corte + Barba',
  75.00,
  '50 min',
  'Combo completo: corte moderno e barba desenhada.',
  '["Lavagem dos cabelos", "Design de barba", "Toalha quente", "Hidratação facial"]'::jsonb,
  'vip',
  15,
  'b2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7c',
  now(),
  now()
),
(
  'a2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b03',
  'Barba Completa',
  40.00,
  '25 min',
  'Desenho e acabamento profissional da barba.',
  '["Toalha quente", "Navalha tradicional", "Hidratação pós-barba"]'::jsonb,
  'all',
  5,
  'b2e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7c',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Serviços para Barbearia 3 (serviços premium)
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
(
  'a3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Premium',
  80.00,
  '45 min',
  'Corte sofisticado com técnicas avançadas e consultoria de estilo.',
  '["Análise capilar", "Lavagem premium", "Finalização profissional", "Produtos importados"]'::jsonb,
  'vip',
  20,
  'b3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7d',
  now(),
  now()
),
(
  'a3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b02',
  'Corte + Barba Premium',
  120.00,
  '60 min',
  'Combo premium completo com todos os serviços de luxo.',
  '["Análise capilar e facial", "Lavagem premium", "Design de barba", "Tratamento facial", "Toalha quente", "Produtos importados"]'::jsonb,
  'vip',
  25,
  'b3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7d',
  now(),
  now()
),
(
  'a3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b03',
  'Platinado/Luzes Premium',
  200.00,
  '120 min',
  'Coloração profissional premium com produtos de alta qualidade.',
  '["Descoloração", "Tonalização", "Tratamento capilar intensivo", "Finalização profissional"]'::jsonb,
  'vip',
  30,
  'b3e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7d',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Serviços para Barbearia 4
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
(
  'a4e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Clássico',
  45.00,
  '30 min',
  'Corte tradicional com máquina e tesoura, acabamento impecável.',
  '["Lavagem dos cabelos", "Finalização com cera"]'::jsonb,
  'all',
  10,
  'b4e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7e',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Serviços para Barbearia 5
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
(
  'a5e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Clássico',
  45.00,
  '30 min',
  'Corte tradicional com máquina e tesoura, acabamento impecável.',
  '["Lavagem dos cabelos", "Finalização com cera"]'::jsonb,
  'all',
  10,
  'b5e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a7f',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Serviços para Barbearia 6
INSERT INTO public.services (id, title, price, duration, description, features, promotion_scope, discount_percentage, barbershop_id, created_at, updated_at)
VALUES 
(
  'a6e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6b01',
  'Corte Clássico',
  45.00,
  '30 min',
  'Corte tradicional com máquina e tesoura, acabamento impecável.',
  '["Lavagem dos cabelos", "Finalização com cera"]'::jsonb,
  'all',
  10,
  'b6e8a9c0-4f3d-4e5f-8a2b-1c3d4e5f6a80',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================
-- Execute as queries abaixo para verificar se os dados foram inseridos corretamente:

-- SELECT COUNT(*) as total_barbearias FROM public.barbershops;
-- SELECT COUNT(*) as total_colaboradores FROM public.collaborators;
-- SELECT COUNT(*) as total_servicos FROM public.services;

-- SELECT b.name, COUNT(c.id) as total_colaboradores 
-- FROM public.barbershops b 
-- LEFT JOIN public.collaborators c ON c.barbershop_id = b.id 
-- GROUP BY b.id, b.name;

-- SELECT b.name, COUNT(s.id) as total_servicos 
-- FROM public.barbershops b 
-- LEFT JOIN public.services s ON s.barbershop_id = b.id 
-- GROUP BY b.id, b.name;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. As senhas dos colaboradores estão como hash de exemplo
--    Para usar no app, você precisa gerar o hash correto usando a função hashPassword
--    Senha padrão usada: "senha123"
--
-- 2. Os IDs são UUIDs fixos para facilitar referências
--    Em produção, você pode usar uuid_generate_v4() para IDs únicos
--
-- 3. Os CPFs são apenas para exemplo - use CPFs válidos em produção
--
-- 4. Os números de telefone estão sem formatação (apenas dígitos)
--    O app formata automaticamente na interface
--
-- 5. Para adicionar mais dados, siga o mesmo padrão dos INSERTs acima
-- ============================================

