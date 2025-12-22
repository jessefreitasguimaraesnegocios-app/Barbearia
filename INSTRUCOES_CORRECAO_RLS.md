# 🔧 INSTRUÇÕES - Correção de RLS (Recursão Infinita)

## ⚠️ PROBLEMA IDENTIFICADO

O erro **"infinite recursion detected in policy for relation 'profiles'"** ocorre porque a RLS policy tenta verificar `is_admin` consultando a própria tabela `profiles` dentro da policy, criando um loop infinito.

## ✅ SOLUÇÃO

Execute a migração SQL `004_fix_profiles_rls_recursion.sql` no Supabase para corrigir as policies.

---

## 📋 PASSO A PASSO

### 1. Acessar Supabase Dashboard

1. Acesse: https://app.supabase.com/project/hnpevqcqiydbrodukaax
2. Vá em **SQL Editor** → **New Query**

### 2. Executar Migração

Copie e cole o conteúdo do arquivo `migrations/004_fix_profiles_rls_recursion.sql`:

```sql
-- 004_fix_profiles_rls_recursion.sql
-- Corrige recursão infinita na RLS policy da tabela profiles

BEGIN;

-- Remover policies problemáticas
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;

-- Nova policy SELECT: permite usuário ler seu próprio profile
-- Não verifica is_admin dentro da policy para evitar recursão
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT 
  USING (id = auth.uid());

-- Nova policy UPDATE: permite usuário atualizar seu próprio profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy para INSERT: usuário autenticado pode criar seu próprio profile
DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND id = auth.uid());

COMMIT;
```

### 3. Executar Query

Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 4. Verificar Sucesso

Você deve ver a mensagem: **"Success. No rows returned"**

---

## 🔍 O QUE FOI CORRIGIDO

### ❌ ANTES (Com Recursão):
```sql
CREATE POLICY profiles_select_owner_or_admin ON public.profiles
  FOR SELECT USING (
    (id = auth.uid())
    OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
    -- ⚠️ Isso causa recursão infinita!
  );
```

### ✅ DEPOIS (Sem Recursão):
```sql
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT 
  USING (id = auth.uid());
  -- ✅ Simples: usuário só pode ler seu próprio profile
```

---

## 📝 NOTAS IMPORTANTES

1. **Segurança:** A nova policy permite que usuários autenticados leiam apenas seu próprio profile. Isso é seguro porque:
   - Cada usuário só pode ver seus próprios dados
   - A verificação de `is_admin` é feita no código da aplicação (RequireAdmin.tsx), não na policy

2. **Verificação de Admin:** O componente `RequireAdmin` agora:
   - Lê o próprio profile (permitido pela RLS)
   - Verifica `is_admin` no código
   - Não causa recursão

3. **Primeiro Usuário:** O primeiro usuário cadastrado recebe `is_admin = true` automaticamente

---

## 🧪 TESTE APÓS CORREÇÃO

1. **Fazer Login:**
   - Acesse `/auth`
   - Faça login com uma conta existente
   - Deve redirecionar para `/menu` (não `/admin`)

2. **Acessar Admin (se for admin):**
   - Se seu profile tem `is_admin = true`, você pode acessar `/admin`
   - Se não for admin, será redirecionado para `/`

3. **Verificar Console:**
   - Não deve mais aparecer erro de "infinite recursion"
   - Não deve mais aparecer erro 500 ao consultar profiles

---

## ⚠️ SE AINDA HOUVER PROBLEMAS

Se após executar a migração ainda houver erros:

1. **Verificar se a migração foi aplicada:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. **Verificar se há outras policies conflitantes:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

3. **Limpar todas as policies e recriar:**
   ```sql
   DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
   DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
   DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
   ```
   
   Depois execute novamente a migração `004_fix_profiles_rls_recursion.sql`

---

## 📞 SUPORTE

Se o problema persistir, verifique:
- Se o Supabase está acessível
- Se as variáveis de ambiente estão corretas
- Se o usuário está autenticado (sessão válida)

