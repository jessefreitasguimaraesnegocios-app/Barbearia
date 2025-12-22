# 🚨 EXECUTAR MIGRAÇÃO URGENTE - Erros 500 no Console

## ⚠️ PROBLEMA ATUAL

Os erros **500 (Internal Server Error)** no console indicam que a RLS policy ainda está causando recursão infinita. A migração SQL precisa ser executada **AGORA** no Supabase.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Acessar Supabase Dashboard

1. Acesse: https://app.supabase.com/project/hnpevqcqiydbrodukaax
2. Faça login se necessário

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (ou use o botão "+")

### Passo 3: Copiar e Colar o SQL

Copie **TODO** o conteúdo abaixo e cole no editor:

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

### Passo 4: Executar

1. Clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. Aguarde a mensagem: **"Success. No rows returned"**

### Passo 5: Verificar

1. Recarregue a página do app (`barbeariia.vercel.app`)
2. Abra o console (F12)
3. Os erros 500 devem desaparecer

---

## 🔍 VERIFICAÇÃO

Após executar, verifique se funcionou:

1. **No Supabase Dashboard:**
   - Vá em **Authentication** → **Policies**
   - Verifique se as policies antigas foram removidas
   - Verifique se as novas policies foram criadas

2. **No Console do Navegador:**
   - Não deve mais aparecer erro 500
   - Não deve mais aparecer "infinite recursion"
   - O app deve funcionar normalmente

---

## ⚠️ SE AINDA HOUVER ERROS

Se após executar a migração ainda houver erros:

1. **Verificar se a migração foi aplicada:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. **Limpar todas as policies manualmente:**
   ```sql
   DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
   DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;
   DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
   DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
   DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
   DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
   ```
   
   Depois execute novamente a migração completa.

---

## 📞 IMPORTANTE

**Esta migração é CRÍTICA** - sem ela, o app não funciona corretamente. Execute o mais rápido possível!

