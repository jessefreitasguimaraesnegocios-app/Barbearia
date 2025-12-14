-- 003_post_migration_checks.sql
-- Script de verificação pós-migração (executar após 001 e 002)
-- Ele gera relatórios e listas de possíveis problemas para revisão manual.

-- 1) Contagem de linhas por tabela
SELECT 'profiles' AS table_name, count(*) FROM public.profiles;
SELECT 'barbershops' AS table_name, count(*) FROM public.barbershops;
SELECT 'collaborators' AS table_name, count(*) FROM public.collaborators;
SELECT 'services' AS table_name, count(*) FROM public.services;
SELECT 'store_products' AS table_name, count(*) FROM public.store_products;
SELECT 'consumables' AS table_name, count(*) FROM public.consumables;
SELECT 'vip_configs' AS table_name, count(*) FROM public.vip_configs;
SELECT 'vip_members' AS table_name, count(*) FROM public.vip_members;
SELECT 'bookings' AS table_name, count(*) FROM public.bookings;
SELECT 'appointments' AS table_name, count(*) FROM public.appointments;
SELECT 'payments' AS table_name, count(*) FROM public.payments;
SELECT 'shop_sales' AS table_name, count(*) FROM public.shop_sales;
SELECT 'expenses' AS table_name, count(*) FROM public.expenses;

-- 2) Checar existência das colunas de backup id_old_text nas tabelas primárias
SELECT 'barbershops' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.barbershops;
SELECT 'collaborators' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.collaborators;
SELECT 'store_products' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.store_products;
SELECT 'vip_members' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.vip_members;
SELECT 'bookings' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.bookings;
SELECT 'appointments' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.appointments;
SELECT 'payments' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.payments;
SELECT 'shop_sales' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.shop_sales;
SELECT 'expenses' AS table_name, count(*) FILTER (WHERE id_old_text IS NULL) AS missing_old_text FROM public.expenses;

-- 3) Checar duplicatas de old_text (pode indicar problema de mapeamento)
SELECT 'barbershops' AS table_name, count(*) AS total, count(DISTINCT id_old_text) AS distinct_old_text FROM public.barbershops;
SELECT 'collaborators' AS table_name, count(*) AS total, count(DISTINCT id_old_text) AS distinct_old_text FROM public.collaborators;
SELECT 'store_products' AS table_name, count(*) AS total, count(DISTINCT id_old_text) AS distinct_old_text FROM public.store_products;
SELECT 'vip_members' AS table_name, count(*) AS total, count(DISTINCT id_old_text) AS distinct_old_text FROM public.vip_members;
SELECT 'bookings' AS table_name, count(*) AS total, count(DISTINCT id_old_text) AS distinct_old_text FROM public.bookings;

-- 4) Checar PKs duplicadas (deve retornar nenhum resultado)
SELECT 'barbershops' AS table_name, id, count(*) FROM public.barbershops GROUP BY id HAVING count(*) > 1;
SELECT 'collaborators' AS table_name, id, count(*) FROM public.collaborators GROUP BY id HAVING count(*) > 1;
SELECT 'store_products' AS table_name, id, count(*) FROM public.store_products GROUP BY id HAVING count(*) > 1;
SELECT 'vip_members' AS table_name, id, count(*) FROM public.vip_members GROUP BY id HAVING count(*) > 1;
SELECT 'bookings' AS table_name, id, count(*) FROM public.bookings GROUP BY id HAVING count(*) > 1;
SELECT 'appointments' AS table_name, id, count(*) FROM public.appointments GROUP BY id HAVING count(*) > 1;
SELECT 'payments' AS table_name, id, count(*) FROM public.payments GROUP BY id HAVING count(*) > 1;
SELECT 'shop_sales' AS table_name, id, count(*) FROM public.shop_sales GROUP BY id HAVING count(*) > 1;
SELECT 'expenses' AS table_name, id, count(*) FROM public.expenses GROUP BY id HAVING count(*) > 1;

-- 5) Orfãos FK: child -> parent mismatches
-- collaborators.barbershop_id -> barbershops.id
SELECT 'collaborators.barbershop_id' AS fk, c.id AS child_id, c.barbershop_id AS fk_value
FROM public.collaborators c
LEFT JOIN public.barbershops b ON c.barbershop_id = b.id
WHERE c.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- store_products.barbershop_id -> barbershops.id
SELECT 'store_products.barbershop_id' AS fk, sp.id AS child_id, sp.barbershop_id AS fk_value
FROM public.store_products sp
LEFT JOIN public.barbershops b ON sp.barbershop_id = b.id
WHERE sp.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- consumables.barbershop_id -> barbershops.id
SELECT 'consumables.barbershop_id' AS fk, c.id AS child_id, c.barbershop_id AS fk_value
FROM public.consumables c
LEFT JOIN public.barbershops b ON c.barbershop_id = b.id
WHERE c.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- vip_configs.barbershop_id -> barbershops.id
SELECT 'vip_configs.barbershop_id' AS fk, v.id AS child_id, v.barbershop_id AS fk_value
FROM public.vip_configs v
LEFT JOIN public.barbershops b ON v.barbershop_id = b.id
WHERE v.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- vip_members.barbershop_id -> barbershops.id
SELECT 'vip_members.barbershop_id' AS fk, vm.id AS child_id, vm.barbershop_id AS fk_value
FROM public.vip_members vm
LEFT JOIN public.barbershops b ON vm.barbershop_id = b.id
WHERE vm.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- bookings.barbershop_id -> barbershops.id
SELECT 'bookings.barbershop_id' AS fk, bk.id AS child_id, bk.barbershop_id AS fk_value
FROM public.bookings bk
LEFT JOIN public.barbershops b ON bk.barbershop_id = b.id
WHERE bk.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- shop_sales.barbershop_id -> barbershops.id
SELECT 'shop_sales.barbershop_id' AS fk, ss.id AS child_id, ss.barbershop_id AS fk_value
FROM public.shop_sales ss
LEFT JOIN public.barbershops b ON ss.barbershop_id = b.id
WHERE ss.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- expenses.barbershop_id -> barbershops.id
SELECT 'expenses.barbershop_id' AS fk, e.id AS child_id, e.barbershop_id AS fk_value
FROM public.expenses e
LEFT JOIN public.barbershops b ON e.barbershop_id = b.id
WHERE e.barbershop_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- appointments.booking_id -> bookings.id
SELECT 'appointments.booking_id' AS fk, a.id AS child_id, a.booking_id AS fk_value
FROM public.appointments a
LEFT JOIN public.bookings b ON a.booking_id = b.id
WHERE a.booking_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- payments.booking_id -> bookings.id
SELECT 'payments.booking_id' AS fk, p.id AS child_id, p.booking_id AS fk_value
FROM public.payments p
LEFT JOIN public.bookings b ON p.booking_id = b.id
WHERE p.booking_id IS NOT NULL AND b.id IS NULL
LIMIT 100;

-- appointments.collaborator_id -> collaborators.id
SELECT 'appointments.collaborator_id' AS fk, a.id AS child_id, a.collaborator_id AS fk_value
FROM public.appointments a
LEFT JOIN public.collaborators c ON a.collaborator_id = c.id
WHERE a.collaborator_id IS NOT NULL AND c.id IS NULL
LIMIT 100;

-- appointments.service_id -> services.id
SELECT 'appointments.service_id' AS fk, a.id AS child_id, a.service_id AS fk_value
FROM public.appointments a
LEFT JOIN public.services s ON a.service_id = s.id
WHERE a.service_id IS NOT NULL AND s.id IS NULL
LIMIT 100;

-- shop_sales.product_id -> store_products.id
SELECT 'shop_sales.product_id' AS fk, ss.id AS child_id, ss.product_id AS fk_value
FROM public.shop_sales ss
LEFT JOIN public.store_products sp ON ss.product_id = sp.id
WHERE ss.product_id IS NOT NULL AND sp.id IS NULL
LIMIT 100;

-- bookings.vip_member_id -> vip_members.id
SELECT 'bookings.vip_member_id' AS fk, bk.id AS child_id, bk.vip_member_id AS fk_value
FROM public.bookings bk
LEFT JOIN public.vip_members vm ON bk.vip_member_id = vm.id
WHERE bk.vip_member_id IS NOT NULL AND vm.id IS NULL
LIMIT 100;

-- 6) Servicos: checar se appointments.service_id foi mantido consistente
SELECT a.service_id, count(*) AS uses FROM public.appointments a LEFT JOIN public.services s ON a.service_id = s.id WHERE s.id IS NULL GROUP BY a.service_id ORDER BY uses DESC LIMIT 50;

-- 7) Checagens de integridade adicionais: índices funcionais sugeridos
-- Verificar se há entradas com cpf sem dígitos
SELECT id, cpf FROM public.vip_members WHERE regexp_replace(coalesce(cpf,''), '\\D', '', 'g') = '' LIMIT 50;

-- 8) Listar top 20 bookings sem payments (pode indicar pagamentos não registrados)
SELECT bk.id, bk.timestamp, bk.customer_name FROM public.bookings bk LEFT JOIN public.payments p ON bk.id = p.booking_id WHERE p.id IS NULL ORDER BY bk.timestamp DESC LIMIT 20;

-- 9) Queries para auditoria/follow-up: exibir os primeiros 50 valores de cada tabela para inspeção manual
SELECT * FROM public.barbershops LIMIT 50;
SELECT * FROM public.collaborators LIMIT 50;
SELECT * FROM public.bookings LIMIT 50;
SELECT * FROM public.appointments LIMIT 50;

-- Fim do script de verificação
