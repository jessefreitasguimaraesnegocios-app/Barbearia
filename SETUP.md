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
4. Execute o arquivo `supabase_schema.sql` (cria a estrutura)
5. Execute o arquivo `supabase_schema_corrigido.sql` (corrige políticas RLS)
6. Execute o arquivo `seed_database.sql` (popula com dados de exemplo - opcional)

### 4. Executar o Projeto

```bash
npm run dev
```

## 🌐 Deploy no Vercel

### Configurar Variáveis de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto → **Settings** → **Environment Variables**
3. Adicione:

   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://seu-projeto.supabase.co`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

   - **Key:** `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value:** `sua-chave-publica-aqui`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

4. **Fazer Redeploy** (obrigatório após adicionar variáveis)

### Configurar URLs de Redirecionamento no Supabase

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

1. Crie credenciais OAuth no Google Cloud Console
2. No Supabase, vá em **Authentication** → **Providers** → **Google**
3. Configure o Client ID e Client Secret
4. Adicione as URLs de redirecionamento

Veja o guia completo: `CONFIGURAR_GOOGLE_OAUTH.md`

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

