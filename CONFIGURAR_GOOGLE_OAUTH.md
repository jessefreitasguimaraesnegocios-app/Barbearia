# 🔐 Configurar Autenticação com Google (OAuth)

## 📋 Pré-requisitos

1. ✅ Supabase configurado (`.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`)
2. ✅ Conta Google (para criar credenciais OAuth)

## 🚀 Passo a Passo

### 1. Criar Credenciais OAuth no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Se for a primeira vez, configure a **OAuth consent screen**:
   - Escolha **External** (para testes) ou **Internal** (para organização)
   - Preencha:
     - **App name**: BarberBook Pro (ou o nome que preferir)
     - **User support email**: Seu email
     - **Developer contact information**: Seu email
   - Clique em **Save and Continue**
   - Em **Scopes**, clique em **Save and Continue**
   - Em **Test users**, adicione emails de teste (opcional)
   - Clique em **Save and Continue** e depois **Back to Dashboard**

6. Agora crie o **OAuth client ID**:
   - **Application type**: Web application
   - **Name**: BarberBook Web Client (ou o nome que preferir)
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     https://seu-dominio.com
     ```
   - **Authorized redirect URIs**:
     ```
     https://zulvevlxsrlsbzaadqfu.supabase.co/auth/v1/callback
     http://localhost:5173/auth
     http://localhost:3000/auth
     ```
   - Clique em **Create**
   - **Copie o Client ID e Client Secret** (você precisará deles)

### 2. Configurar Google OAuth no Supabase

1. Acesse seu projeto no Supabase: https://app.supabase.com/project/zulvevlxsrlsbzaadqfu
2. Vá em **Authentication** > **Providers**
3. Encontre **Google** na lista
4. Clique para habilitar
5. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
6. Clique em **Save**

### 3. Configurar URL de Redirecionamento no Supabase

1. No Supabase, vá em **Authentication** > **URL Configuration**
2. Adicione as URLs autorizadas:
   - **Site URL**: `http://localhost:5173` (ou sua URL de produção)
   - **Redirect URLs**: 
     ```
     http://localhost:5173/auth
     http://localhost:5173/**
     https://seu-dominio.com/auth
     https://seu-dominio.com/**
     ```

### 4. Testar a Autenticação

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173/auth
3. Clique no botão **"Continuar com Google"**
4. Você será redirecionado para o Google para autorizar
5. Após autorizar, será redirecionado de volta para o app

## ⚠️ Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de redirecionamento no Google Cloud Console está exatamente igual à configurada no Supabase
- Certifique-se de incluir `https://zulvevlxsrlsbzaadqfu.supabase.co/auth/v1/callback` nas **Authorized redirect URIs**

### Erro: "Invalid client"
- Verifique se o Client ID e Client Secret estão corretos no Supabase
- Certifique-se de que o OAuth consent screen está configurado

### Erro: "Supabase não está configurado"
- Verifique se o arquivo `.env` está configurado corretamente (sem aspas!)
- Reinicie o servidor após alterar o `.env`

### O botão não funciona
- Verifique o console do navegador para erros
- Certifique-se de que o Supabase está configurado corretamente
- Verifique se o Google OAuth está habilitado no painel do Supabase

## 📝 Notas Importantes

- Em **produção**, você precisará adicionar sua URL de produção nas configurações do Google
- O OAuth consent screen precisa ser publicado para usuários externos (não apenas test users)
- Para produção, considere usar um domínio próprio e configurar corretamente as URLs

## ✅ Checklist

- [ ] Credenciais OAuth criadas no Google Cloud Console
- [ ] Client ID e Client Secret configurados no Supabase
- [ ] URLs de redirecionamento configuradas no Google
- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] `.env` configurado corretamente
- [ ] Servidor reiniciado
- [ ] Teste de login com Google realizado com sucesso


