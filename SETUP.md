# 🚀 Guia de Configuração do BarberBook Pro

## 📋 Pré-requisitos

- Node.js instalado
- Conta no Supabase
- Conta no Vercel (para deploy)

## 🔧 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

**⚠️ IMPORTANTE:** 
- Não use aspas nas variáveis
- Não commit o arquivo `.env` (já está no .gitignore)

### 3. Configurar Banco de Dados (Supabase)

1. Acesse: https://app.supabase.com
2. Crie um novo projeto
3. Vá em **SQL Editor** → **New Query**
4. Execute o arquivo `supabase_schema.sql` (cria toda a estrutura com políticas RLS corretas)
5. Execute o arquivo `seed_database.sql` (popula com dados de exemplo - opcional)

### 4. Executar o Projeto

```bash
npm run dev
```

## 🌐 Deploy no Vercel

### Passo 1: Configurar Variáveis de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto → **Settings** → **Environment Variables**
3. Adicione as variáveis:

   **Variável 1:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://seu-projeto.supabase.co`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Clique em **Save**

   **Variável 2:**
   - **Key:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** `sua-chave-publica-aqui`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Clique em **Save**

### Passo 2: Fazer Redeploy

⚠️ **IMPORTANTE:** Após adicionar as variáveis, você PRECISA fazer um novo deploy:

1. Vá na aba **Deployments**
2. Clique nos três pontos (⋯) do último deployment
3. Clique em **Redeploy**
4. Ou faça um novo commit e push para o repositório

### Passo 3: Configurar URLs no Supabase (se usar OAuth)

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Configure:

   **Site URL:**
   ```
   https://seu-dominio.vercel.app
   ```

   **Redirect URLs:**
   ```
   https://seu-dominio.vercel.app/**
   https://seu-dominio.vercel.app/auth
   ```

## 🔐 Autenticação com Google (Opcional)

Para habilitar login com Google:

### 1. Criar Credenciais OAuth no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Se for a primeira vez, configure a **OAuth consent screen**:
   - Escolha **External** (para testes) ou **Internal** (para organização)
   - Preencha: App name, User support email, Developer contact information
   - Clique em **Save and Continue** em cada etapa
6. Crie o **OAuth client ID**:
   - **Application type**: Web application
   - **Name**: BarberBook Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://seu-dominio.vercel.app
     https://zulvevlxsrlsbzaadqfu.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     https://zulvevlxsrlsbzaadqfu.supabase.co/auth/v1/callback
     ```
   - Clique em **Create**
7. Copie o **Client ID** e **Client Secret**

### 2. Configurar no Supabase

1. No Supabase, vá em **Authentication** → **Providers** → **Google**
2. Ative o provider Google
3. Cole o **Client ID** e **Client Secret**
4. Clique em **Save**

### 3. Configurar URLs de Redirecionamento

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Configure:

   **Site URL:**
   ```
   https://seu-dominio.vercel.app
   ```

   **Redirect URLs:**
   ```
   https://seu-dominio.vercel.app/**
   https://seu-dominio.vercel.app/auth
   ```

## 📊 Scripts SQL Disponíveis

- **`supabase_schema.sql`** - Cria toda a estrutura do banco
- **`supabase_schema_corrigido.sql`** - Corrige políticas RLS
- **`seed_database.sql`** - Popula o banco com dados de exemplo
- **`clear_database.sql`** - Remove todos os dados (mantém estrutura)

## 🔑 Senhas Padrão (Seed)

Se você executou o `seed_database.sql`, pode fazer login com:

- **Email:** miguel.santos@barberbook.com
- **Senha:** senha123

Ou qualquer outro colaborador do seed.

## ⚠️ Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Certifique-se de que não há aspas nas variáveis
- Reinicie o servidor após configurar o `.env`

### Erro ao executar SQL
- Execute os scripts na ordem: schema → corrigido → seed
- Verifique se não há conflitos de dados

### Problemas de RLS (Row Level Security)
- Execute o `supabase_schema_corrigido.sql`
- Verifique se as políticas foram criadas corretamente

