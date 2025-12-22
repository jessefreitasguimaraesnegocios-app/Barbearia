# 🚨 SOLUÇÃO RÁPIDA - Erros 500 no Console

## ⚠️ PROBLEMA

Os erros **500 (Internal Server Error)** que aparecem no console são causados pela **recursão infinita na RLS policy** do Supabase. A migração SQL precisa ser executada **URGENTEMENTE**.

---

## ✅ SOLUÇÃO EM 3 PASSOS

### 1️⃣ Acesse o Supabase Dashboard

👉 **https://app.supabase.com/project/hnpevqcqiydbrodukaax**

### 2️⃣ Execute o SQL

1. Clique em **SQL Editor** (menu lateral)
2. Clique em **New Query** (botão verde)
3. **Copie e cole** o código abaixo:

```sql
BEGIN;

-- Remover policies problemáticas
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;

-- Nova policy SELECT (sem recursão)
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT 
  USING (id = auth.uid());

-- Nova policy UPDATE (sem recursão)
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Nova policy INSERT (sem recursão)
DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND id = auth.uid());

COMMIT;
```

4. Clique em **Run** (ou `Ctrl+Enter`)
5. Aguarde: **"Success. No rows returned"**

### 3️⃣ Recarregue o App

1. Volte para `barbeariia.vercel.app`
2. Pressione **F5** para recarregar
3. Os erros 500 devem desaparecer ✅

---

## ✅ VERIFICAÇÃO

Após executar, verifique:

- ✅ Console sem erros 500
- ✅ App carrega normalmente
- ✅ Login funciona
- ✅ Admin funciona

---

## ⚠️ SE NÃO FUNCIONAR

Execute este SQL para limpar tudo e tentar novamente:

```sql
-- Limpar todas as policies
DROP POLICY IF EXISTS profiles_select_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_owner_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- Recriar policies corretas
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IS NOT NULL AND id = auth.uid());
```

---

**⏱️ Tempo estimado: 2 minutos**

