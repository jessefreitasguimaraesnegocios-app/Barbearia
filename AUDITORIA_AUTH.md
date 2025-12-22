# 🔍 AUDITORIA - Fluxo de Autenticação Supabase

## ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **DESCONEXÃO TOTAL ENTRE Auth.tsx E SUPABASE**
**Arquivo:** `src/pages/Auth.tsx`
**Linhas:** 136-182 (handleLogin), 184-353 (handleSignup)

**Problema:**
- `handleLogin` usa sistema LOCAL (localStorage + verificação de senha local)
- `handleSignup` salva colaborador em localStorage, NÃO no Supabase
- NÃO chama `supabase.auth.signUp()` ou `supabase.auth.signInWithPassword()`
- NÃO cria registro na tabela `profiles` do Supabase

**Impacto:** Usuário consegue "logar" localmente, mas Supabase não tem sessão → `ProtectedRoute` redireciona para `/auth`

---

### 2. **PROFILE NÃO É CRIADO APÓS SIGNUP**
**Arquivo:** `src/pages/Auth.tsx` (linha 184-353)

**Problema:**
- Após `signUp` no Supabase, não há código que cria registro em `profiles`
- Não há trigger no banco que cria profile automaticamente
- RLS policy exige `auth.uid()` mas profile não existe → leitura falha

**Impacto:** Mesmo se signUp funcionar, `RequireAdmin` não consegue ler `is_admin` porque profile não existe

---

### 3. **RequireAdmin USA LOCALSTORAGE, NÃO SUPABASE**
**Arquivo:** `src/components/RequireAdmin.tsx`
**Linhas:** 11-16

**Problema:**
```typescript
const stored = localStorage.getItem("activeCollaborator");
if (stored) {
  const parsed = JSON.parse(stored) as { role?: string };
  isAdmin = parsed.role === "socio" || parsed.role === "dono";
}
```

**Impacto:** Verifica localStorage em vez de Supabase `profiles.is_admin`

---

### 4. **useAuth PODE REDIRECIONAR ANTES DA SESSÃO CARREGAR**
**Arquivo:** `src/hooks/useAuth.tsx`
**Linhas:** 26-29

**Problema:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setLoading(false); // ⚠️ Pode setar false antes de getSession() completar
});
```

**Impacto:** Race condition - `loading` pode ser `false` antes de `getSession()` terminar

---

### 5. **ProtectedRoute REDIRECIONA MUITO CEDO**
**Arquivo:** `src/App.tsx`
**Linhas:** 41-53

**Problema:**
```typescript
if (loading) {
  return <div>Carregando...</div>; // ✅ OK
}

if (!isAuthenticated) {
  return <Navigate to="/auth" replace />; // ⚠️ Redireciona se loading=false mas user=null
}
```

**Linha exata do problema:** Linha 48-49

**Impacto:** Se `loading` for `false` mas `user` ainda `null` (race condition), redireciona incorretamente

---

## ✅ CORREÇÕES NECESSÁRIAS

### Correção 1: Auth.tsx - Integrar Supabase
- Substituir `handleLogin` para usar `useAuthContext().signIn()`
- Substituir `handleSignup` para usar `useAuthContext().signUp()`
- Após signUp bem-sucedido, criar profile no Supabase
- Após signIn bem-sucedido, aguardar sessão antes de redirecionar

### Correção 2: Criar Profile após SignUp
- Após `supabase.auth.signUp()` bem-sucedido, inserir em `profiles`
- Definir `is_admin = true` para primeiro usuário ou conforme regra de negócio

### Correção 3: RequireAdmin - Usar Supabase
- Buscar profile do Supabase usando `auth.uid()`
- Verificar `is_admin` da tabela `profiles`

### Correção 4: useAuth - Aguardar Sessão
- Garantir que `loading` só seja `false` após `getSession()` completar
- Evitar race condition entre `getSession()` e `onAuthStateChange`

### Correção 5: ProtectedRoute - Aguardar Loading
- Já está correto, mas garantir que `loading` funciona corretamente

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] 1. Após signUp, usuário é salvo em `profiles`?
- [ ] 2. Após signIn, sessão é criada no Supabase?
- [ ] 3. App aguarda sessão carregar antes de redirecionar?
- [ ] 4. `onAuthStateChange` funciona corretamente?
- [ ] 5. Não há loop de redirect em rotas protegidas?
- [ ] 6. RLS permite leitura de `profiles` para usuário autenticado?
- [ ] 7. `RequireAdmin` verifica `profiles.is_admin` do Supabase?

---

## 🎯 LINHA EXATA DO PROBLEMA

**Arquivo:** `src/App.tsx`
**Linha 48-49:**
```typescript
if (!isAuthenticated) {
  return <Navigate to="/auth" replace />; // ⚠️ Redireciona quando não deveria
}
```

**Causa raiz:** `Auth.tsx` não cria sessão Supabase, então `isAuthenticated` sempre `false`

