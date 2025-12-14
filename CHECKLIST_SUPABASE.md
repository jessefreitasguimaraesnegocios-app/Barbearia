# ✅ Checklist - Criação do Banco de Dados no Supabase

## 📋 Status Atual

Analisei seu projeto e identifiquei o seguinte:

### ✅ O que JÁ ESTÁ PRONTO:

1. **Variáveis de Ambiente (.env)**
   - ✅ `VITE_SUPABASE_PROJECT_ID` configurado
   - ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` configurado
   - ✅ `VITE_SUPABASE_URL` configurado

2. **Arquivos de Migração SQL**
   - ✅ `001_create_schema.sql` - Criação completa do schema (ENUMs, tabelas, índices, triggers, RLS)
   - ✅ `002_convert_text_ids_to_uuid.sql` - Conversão opcional de IDs TEXT para UUID
   - ✅ `003_post_migration_checks.sql` - Verificações de integridade pós-migração
   - ✅ `001_drop_schema.sql` - Rollback completo (caso necessário)
   - ✅ `README.md` com instruções detalhadas

3. **Cliente Supabase**
   - ✅ `src/lib/supabase.ts` - Cliente configurado
   - ✅ `src/integrations/supabase/types.ts` - Types TypeScript
   - ✅ Funções de autenticação (signIn, signUp, signOut)

4. **Configuração do Projeto**
   - ✅ `supabase/config.toml` - Project ID configurado

---

## ⚠️ O que FALTA FAZER:

### 1. **EXECUTAR AS MIGRAÇÕES NO SUPABASE** (CRÍTICO)

O banco de dados no Supabase está **VAZIO**. Você precisa executar as migrações SQL.

#### Opção A: Via SQL Editor do Supabase (RECOMENDADO)

1. Acesse o [Supabase Dashboard](https://app.supabase.com/project/fknbbehqjcbcshjdhylg)
2. Vá em **SQL Editor** → **New Query**
3. Execute as migrações na ordem:

   **Passo 1:** Copie e execute `migrations/001_create_schema.sql`
   - Isso criará: 8 ENUMs, 13 tabelas, índices, triggers e RLS policies
   
   **Passo 2 (OPCIONAL):** Se quiser usar UUIDs em vez de TEXT para IDs:
   - Copie e execute `migrations/002_convert_text_ids_to_uuid.sql`
   - ⚠️ **ATENÇÃO:** Isso converterá todos os IDs de TEXT para UUID
   
   **Passo 3:** Verificação de integridade:
   - Copie e execute `migrations/003_post_migration_checks.sql`
   - Revise os resultados para garantir que tudo está OK

#### Opção B: Via Supabase CLI

```powershell
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar o projeto
supabase link --project-ref fknbbehqjcbcshjdhylg

# Aplicar migrações
supabase db push
```

---

### 2. **ATUALIZAR OS TYPES DO SUPABASE**

Após executar as migrações, você precisa gerar os types TypeScript atualizados:

```powershell
# Via Supabase CLI
supabase gen types typescript --project-id fknbbehqjcbcshjdhylg > src/integrations/supabase/types.ts
```

Atualmente, o arquivo `types.ts` está vazio (sem tabelas definidas). Após as migrações, ele terá todas as definições de tipos.

---

### 3. **CRIAR STORAGE BUCKET PARA RECIBOS** (OPCIONAL)

Se você vai usar upload de comprovantes de pagamento:

1. Acesse **Storage** no Supabase Dashboard
2. Clique em **Create a new bucket**
3. Nome: `receipts`
4. Configure as políticas RLS para permitir upload/download

---

### 4. **POPULAR DADOS INICIAIS** (RECOMENDADO)

Após criar o schema, você deve popular com dados iniciais:

- Barbershops
- Services (serviços oferecidos)
- Collaborators (barbeiros, atendentes, etc.)
- VIP Configs

Você pode fazer isso:
- Manualmente via Supabase Dashboard (Table Editor)
- Criando um script SQL de seed
- Via código da aplicação (primeira execução)

---

### 5. **AJUSTAR RLS POLICIES** (SE NECESSÁRIO)

As políticas RLS criadas assumem:
- `auth.uid()` para identificar usuários
- `auth.role()` para verificar autenticação
- Campo `is_admin` na tabela `profiles`

Se você tiver requisitos diferentes de permissão, ajuste as policies manualmente.

---

### 6. **TESTAR CONEXÃO DA APLICAÇÃO**

Após executar as migrações:

1. Verifique se o cliente Supabase está conectando:
   ```typescript
   import { supabase } from '@/lib/supabase';
   
   // Testar conexão
   const { data, error } = await supabase.from('barbershops').select('*');
   console.log(data, error);
   ```

2. Teste as operações CRUD básicas
3. Teste autenticação (se implementada)

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Passo 1: Backup (IMPORTANTE)
Antes de fazer qualquer coisa em produção, faça backup:
- Supabase Dashboard → Settings → Backups → Create a backup

### Passo 2: Executar Migrações
Siga a **Opção A** acima (SQL Editor)

### Passo 3: Verificar Integridade
Execute o script `003_post_migration_checks.sql`

### Passo 4: Gerar Types
```powershell
supabase gen types typescript --project-id fknbbehqjcbcshjdhylg > src/integrations/supabase/types.ts
```

### Passo 5: Popular Dados
Crie dados de teste ou migre dados existentes

### Passo 6: Testar Aplicação
Execute `npm run dev` e teste todas as funcionalidades

---

## 📊 ESTRUTURA DO BANCO DE DADOS

Após executar `001_create_schema.sql`, você terá:

### ENUMs (8)
- `collaborator_role`
- `payment_method`
- `promotion_scope`
- `vip_billing_cycle`
- `vip_payment_status`
- `barbershop_status`
- `expense_type`
- `product_category`

### Tabelas (13)
1. `profiles` - Perfis de usuários
2. `barbershops` - Barbearias
3. `collaborators` - Colaboradores (barbeiros, atendentes, etc.)
4. `services` - Serviços oferecidos
5. `store_products` - Produtos da loja
6. `consumables` - Consumíveis (estoque)
7. `vip_configs` - Configurações VIP
8. `vip_members` - Membros VIP
9. `bookings` - Reservas/Agendamentos
10. `appointments` - Compromissos específicos
11. `payments` - Pagamentos
12. `shop_sales` - Vendas da loja
13. `expenses` - Despesas/Investimentos

---

## ⚡ DECISÃO IMPORTANTE: TEXT vs UUID

Você precisa decidir:

- **Manter IDs como TEXT** (atual):
  - ✅ Mais fácil de debugar
  - ✅ Compatível com dados existentes
  - ❌ Menos performático em grandes volumes
  - **Ação:** Execute APENAS `001_create_schema.sql`

- **Converter para UUID**:
  - ✅ Melhor performance
  - ✅ Padrão da indústria
  - ✅ Mais seguro
  - ❌ Requer conversão de dados existentes
  - **Ação:** Execute `001_create_schema.sql` + `002_convert_text_ids_to_uuid.sql`

---

## 🆘 SUPORTE

Se encontrar erros durante as migrações:

1. Leia a mensagem de erro completa
2. Verifique se o schema já existe (pode precisar fazer DROP primeiro)
3. Use o arquivo `001_drop_schema.sql` para limpar e recomeçar
4. Consulte o `migrations/README.md` para instruções detalhadas

---

## 📝 RESUMO EXECUTIVO

**Status:** ✅ Tudo pronto para executar as migrações
**Ação Crítica:** Executar `001_create_schema.sql` no SQL Editor do Supabase
**Tempo Estimado:** 5-10 minutos
**Risco:** Baixo (ambiente vazio, sem dados para perder)

**Após as migrações, seu banco estará 100% operacional!** 🚀
