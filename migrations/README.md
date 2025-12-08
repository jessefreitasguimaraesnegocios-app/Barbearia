# Migrações - Barbearia

Arquivos de migração gerados automaticamente para o projeto Barbearia.

## Arquivos de Migração

| Arquivo | Descrição |
|---------|-----------|
| `001_create_schema.sql` | Criação inicial de tipos (ENUMs), tabelas, índices, triggers, RLS policies e função utilitária. |
| `002_convert_text_ids_to_uuid.sql` | (Opcional) Converte PKs e FKs de tipo TEXT para UUID, preservando relacionamentos. |
| `003_post_migration_checks.sql` | Verificações de integridade pós-migração: contagens, backup, PKs duplicadas, FKs órfãos. |
| `001_drop_schema.sql` | Rollback completo: remove objetos criados por `001_create_schema.sql`. |

---

## Guia Passo-a-Passo (Editor SQL do Supabase)

### Pré-requisitos
- ✅ Você tem acesso ao projeto Supabase (dashboard).
- ✅ Fez um **backup completo** do banco (Settings → Backups → Create a backup).
- ✅ Testou as migrações em um ambiente de staging (clone ou snapshot).

### Passo 1: Criar Schema Inicial

1. Abra o painel Supabase → **SQL Editor** → **New Query**.
2. Copie **todo** o conteúdo do arquivo `001_create_schema.sql`.
3. Cole na query e **execute** (botão "Execute" ou Ctrl+Enter).
4. Verifique o resultado:
   - Mensagem de sucesso: "Query executed successfully".
   - Se houver erro, leia a mensagem e revise a query (por exemplo, se algumas tabelas já existem).

**Esperado:** criação de 8 ENUMs, 13 tabelas, índices, triggers, RLS policies e 1 função utilitária.

---

### Passo 2: Verificar Integridade Pós-Criação

1. No SQL Editor, copie e execute o **início** de `003_post_migration_checks.sql` (as primeiras 50 linhas de contagem):

```sql
SELECT 'profiles' AS table_name, count(*) FROM public.profiles;
SELECT 'barbershops' AS table_name, count(*) FROM public.barbershops;
SELECT 'collaborators' AS table_name, count(*) FROM public.collaborators;
-- ... (e assim por diante para todas as 13 tabelas)
```

2. **Verifique:**
   - Todas as tabelas existem (count = 0 para tabelas vazias é OK).
   - Nenhuma coluna de backup `id_old_text` foi criada ainda (isto é, a `001` não tentou converter UUIDs).

**Se tudo OK:** prossiga para o Passo 3.

---

### Passo 3: Converter IDs TEXT para UUID (Opcional)

⚠️ **SOMENTE execute este passo se você quer UUIDs nas PKs. Se preferir manter TEXT, pule para o Passo 4.**

1. No SQL Editor, copie **todo** o conteúdo de `002_convert_text_ids_to_uuid.sql`.
2. Cole e **execute**.
3. A migração:
   - Cria colunas `id_new` (UUID) para cada tabela PK.
   - Popula `id_new` com `gen_random_uuid()`.
   - Copia dados de FKs para `*_id_new` nas tabelas dependentes.
   - Substitui PKs e FKs originais.
   - **Mantém coluna de backup `id_old_text`** com os IDs antigos em texto.

**Esperado:** mensagem de sucesso "COMMIT" ao final.

---

### Passo 4: Verificação Completa Pós-Migração

1. Execute o **arquivo completo** `003_post_migration_checks.sql`.
2. Revise os resultados:

| Check | O que procurar | Ação se erro |
|-------|---|---|
| Contagens por tabela | Nenhuma tabela desapareceu | Restaure backup e revise `001` ou `002` |
| `id_old_text` NULL | Deve ser 0 (nenhum NULL em TEXT coluna, ou não existir se pulou Passo 3) | Verifique migração `002` |
| PKs duplicadas | Nenhum resultado (query está vazia) | Revise dados-source; restaure backup |
| FKs órfãos | Listas vazias (ou apenas NULLs legítimos) | Corrija FK manualmente ou restaure dados pai |
| Bookings sem payments | Esperado ter alguns | OK (pagamentos não registrados manualmente) |

3. **Se encontrar FKs órfãos**, liste-os e decida:
   - (a) Deletar filhos órfãos: `DELETE FROM child_table WHERE parent_id IS NOT NULL AND parent_id NOT IN (SELECT id FROM parent_table);`
   - (b) Restaurar pais deletados por acidente: restaure backup e re-aplique migrações.

**Se tudo OK:** schema pronto para uso!

---

### Passo 5: Limpeza (Opcional - Remover Backup Columns)

Se você rodou a migração `002` e confirmou que tudo está OK, pode remover as colunas de backup `*_old_text` para economizar espaço:

```sql
ALTER TABLE public.barbershops DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.collaborators DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.store_products DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.vip_members DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.payments DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.shop_sales DROP COLUMN IF EXISTS id_old_text;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS id_old_text;
```

---

## Alternativa: Execução via CLI (psql ou supabase)

Se preferir usar linha de comando (PowerShell):

### Via psql direto
```powershell
$env:CONN="postgresql://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/<DB_NAME>?sslmode=require"

# Fazer backup
pg_dump $env:CONN --format=custom --file="backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"

# Aplicar migrações na ordem
psql $env:CONN -f .\migrations\001_create_schema.sql
psql $env:CONN -f .\migrations\002_convert_text_ids_to_uuid.sql
psql $env:CONN -f .\migrations\003_post_migration_checks.sql
```

### Via Supabase CLI
```powershell
# (Opcional) Configurar remote
supabase db remote set "postgresql://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/<DB_NAME>?sslmode=require"

# Aplicar migrações
supabase migration up
```

---

## Rollback (Reverter Tudo)

⚠️ **Cuidado:** isto **remove todos os objetos criados**.

1. No SQL Editor, copie e execute **todo** o conteúdo de `001_drop_schema.sql`.
2. Verifique: todas as tabelas, tipos e funções foram removidas.

**Use somente em caso de erro crítico ou se você quer fazer tudo de novo.**

---

## Observações Importantes

1. **Backup obrigatório:** Supabase oferece snapshots automáticos, mas faça um backup manual via `pg_dump` ou snapshot antes de migrar em produção.

2. **IDs TEXT vs UUID:** 
   - Atualmente o projeto usa localStorage com IDs text (ex: "c1", "prod-1", "bookingConfirmation_...").
   - A migração `002` converte para UUID. Se você quer manter TEXT, **não execute `002`**.
   - Manter TEXT é OK — aplicações modernas suportam ambos.

3. **RLS Policies:**
   - As políticas criadas em `001` assumem `auth.uid()` e `auth.role()` do Supabase Auth.
   - Se você usa claims customizadas no JWT (ex: `request.jwt.claims.is_admin`), ajuste as policies manualmente.

4. **Storage Buckets:**
   - Se o editor SQL não criar o bucket "receipts" (função `storage.create_bucket` pode não existir), crie-o manualmente no painel Storage → Create a new bucket.

5. **Integrações Externas:**
   - Se você tem webhooks, jobs agendados ou scripts que assumem IDs text, adapte-os após migrar para UUID ou mantenha o mapeamento via coluna `*_old_text`.

---

## Próximos Passos

Após as migrações:

1. ✅ Populate dados iniciais (barbershops, services, collaborators) — veja `src/data/*` para exemplos.
2. ✅ Ajuste políticas RLS se necessário (ex: adicione suporte para donos de barbearias).
3. ✅ Configure Storage bucket "receipts" e crie políticas RLS para upload de comprovantes.
4. ✅ Teste fluxos CRUD no app (booking, payment, loja, VIP) em staging antes de produção.
5. ✅ Monitore performance e crie índices adicionais se necessário (ex: índice funcional em `regexp_replace(cpf, '\\D', '', 'g')` para buscas por CPF sem caracteres).
