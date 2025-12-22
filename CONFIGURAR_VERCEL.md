# 🚀 Configurar Variáveis de Ambiente no Vercel

## ❌ Problema

O app funciona localmente, mas no Vercel aparecem erros 401/404 porque as variáveis de ambiente do Supabase não estão configuradas na plataforma.

## ✅ Solução: Configurar Environment Variables no Vercel

### Passo 1: Acessar as Configurações do Projeto

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **Barbearia** (ou o nome do seu projeto)
3. Vá em **Settings** (Configurações)
4. Clique em **Environment Variables** (Variáveis de Ambiente) no menu lateral

### Passo 2: Adicionar as Variáveis do Supabase

Adicione as seguintes variáveis de ambiente:

#### Variável 1: `VITE_SUPABASE_URL`
- **Key (Chave)**: `VITE_SUPABASE_URL`
- **Value (Valor)**: `https://zulvevlxsrlsbzaadqfu.supabase.co`
- **Environment (Ambiente)**: Selecione **Production**, **Preview** e **Development** (todas as três)
- Clique em **Save**

#### Variável 2: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Key (Chave)**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value (Valor)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bHZldmx4c3Jsc2J6YWFkcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTUwNjYsImV4cCI6MjA4MTkzMTA2Nn0.rOlcxCaJrDo-a1OSVTX1Ucv7hVPBIrdP6itrSjcEJZk`
- **Environment (Ambiente)**: Selecione **Production**, **Preview** e **Development** (todas as três)
- Clique em **Save**

### Passo 3: Verificar as Configurações

Certifique-se de que:
- ✅ Ambas as variáveis estão marcadas para **Production**, **Preview** e **Development**
- ✅ Os valores estão corretos (sem aspas!)
- ✅ Não há espaços extras antes ou depois dos valores

### Passo 4: Fazer Redeploy

**IMPORTANTE:** Após adicionar as variáveis, você PRECISA fazer um novo deploy:

1. Vá na aba **Deployments** (Implantações)
2. Clique nos três pontos (⋯) do último deployment
3. Clique em **Redeploy**
4. Ou faça um novo commit e push para o seu repositório

> ⚠️ **Atenção:** Apenas adicionar as variáveis não é suficiente! Você precisa fazer um novo deploy para que elas sejam aplicadas.

### Passo 5: Configurar URLs de Redirecionamento no Supabase

1. Acesse: https://app.supabase.com/project/zulvevlxsrlsbzaadqfu
2. Vá em **Authentication** > **URL Configuration**
3. Adicione sua URL do Vercel:

   **Site URL:**
   ```
   https://barbeariia.vercel.app
   ```

   **Redirect URLs:**
   ```
   https://barbeariia.vercel.app/**
   https://barbeariia.vercel.app/auth
   ```

4. Clique em **Save**

### Passo 6: Verificar se Funcionou

1. Após o redeploy, acesse: https://barbeariia.vercel.app/auth
2. Tente fazer login
3. Abra o Console do navegador (F12)
4. Os erros 401/404 devem desaparecer

## 🔍 Verificação Rápida

Para verificar se as variáveis estão sendo carregadas:

1. No Vercel, vá em **Deployments**
2. Clique no deployment mais recente
3. Vá na aba **Functions** ou **Build Logs**
4. Procure por logs que mostram as variáveis sendo usadas

Ou adicione temporariamente este código para debug:

```typescript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✅ Configurado' : '❌ Não configurado');
```

## ⚠️ Problemas Comuns

### Erro persiste após configurar
- ✅ Certifique-se de que fez um **Redeploy** após adicionar as variáveis
- ✅ Verifique se as variáveis estão marcadas para **Production**
- ✅ Confirme que os valores não têm aspas ou espaços extras

### Variáveis não aparecem no build
- ✅ Verifique se o prefixo é `VITE_` (importante para Vite)
- ✅ Certifique-se de que está fazendo o redeploy correto

### Ainda aparecem erros 401/404
- ✅ Verifique se as URLs de redirecionamento estão configuradas no Supabase
- ✅ Confirme que a URL do site no Supabase está correta
- ✅ Verifique o console do navegador para mais detalhes

## 📝 Checklist Final

- [ ] Variável `VITE_SUPABASE_URL` adicionada no Vercel
- [ ] Variável `VITE_SUPABASE_PUBLISHABLE_KEY` adicionada no Vercel
- [ ] Ambas marcadas para Production, Preview e Development
- [ ] Redeploy realizado no Vercel
- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] Site URL configurado no Supabase
- [ ] Teste de login realizado com sucesso

## 🎯 Próximos Passos

Após configurar:
1. O login local (email/senha) deve funcionar normalmente
2. O login com Google deve funcionar (se estiver configurado)
3. Não devem mais aparecer erros 401/404 no console

