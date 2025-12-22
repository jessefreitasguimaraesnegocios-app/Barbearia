# Guia de Instalação do Banco de Dados - Supabase

Este guia explica como configurar o banco de dados do aplicativo Barbearia no Supabase.

## 📋 Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Acesso ao SQL Editor do seu projeto Supabase

## 🚀 Instalação

### Método 1: Via SQL Editor (Recomendado)

1. Acesse seu projeto no Supabase Dashboard
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Abra o arquivo `supabase_schema.sql`
5. Copie **TODO** o conteúdo do arquivo
6. Cole no SQL Editor
7. Clique em **Run** ou pressione `Ctrl+Enter`
8. Aguarde a execução (pode levar alguns segundos)

### Método 2: Via Supabase CLI

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Conectar ao projeto
supabase link --project-ref seu-project-ref

# Executar o schema
supabase db reset
```

## ✅ Verificação

Após executar o schema, verifique se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver as seguintes tabelas:
- profiles
- barbershops
- collaborators
- services
- store_products
- consumables
- vip_configs
- vip_members
- bookings
- appointments
- payments
- shop_sales
- expenses

## 📊 Estrutura do Banco

### Tabelas Principais

1. **profiles** - Perfis de usuários (vinculados ao auth.users)
2. **barbershops** - Dados das barbearias
3. **collaborators** - Colaboradores/barbeiros
4. **services** - Serviços oferecidos
5. **store_products** - Produtos da loja
6. **consumables** - Itens de consumo/estoque
7. **vip_configs** - Configurações do programa VIP
8. **vip_members** - Membros VIP
9. **bookings** - Agendamentos/reservas
10. **appointments** - Compromissos individuais dentro de um booking
11. **payments** - Pagamentos recebidos
12. **shop_sales** - Vendas da loja
13. **expenses** - Despesas/investimentos

## 🔒 Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado com políticas específicas:

- **Públicas**: barbershops, services, store_products, consumables, vip_configs, vip_members, shop_sales
- **Autenticadas**: bookings, appointments, payments
- **Admin/Owner**: profiles, expenses, barbershops (edição)

## 🔧 Configuração das Variáveis de Ambiente

Após criar o banco, configure as variáveis no arquivo `.env` na raiz do projeto:

### Passo a passo:

1. **Crie um arquivo `.env` na raiz do projeto** (mesmo nível do `package.json`)

2. **Copie o conteúdo abaixo e preencha com suas credenciais:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-anon-key
```

3. **Onde encontrar as credenciais:**
   - Acesse seu projeto no Supabase Dashboard
   - Vá em **Settings** > **API**
   - **Project URL** = `VITE_SUPABASE_URL`
   - **anon public** key = `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Após configurar, reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

### ⚠️ IMPORTANTE:
- O arquivo `.env` já está no `.gitignore` e **NÃO deve ser commitado**
- Para produção (Vercel/Netlify), configure as variáveis nas configurações do serviço
- Se você não vai usar Supabase agora, pode deixar as variáveis vazias - o app funcionará normalmente (autenticação local)

## 📝 Próximos Passos

1. Configure autenticação no Supabase (Authentication > Settings)
2. Crie usuários de teste ou configure autenticação social
3. Adicione dados iniciais (barbearias, serviços, etc.)
4. Teste as funcionalidades do aplicativo

## 🆘 Troubleshooting

### Erro: "relation already exists"
Se você já executou o schema antes, pode haver conflitos. Use:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
E então execute o schema novamente.

### Erro: "permission denied"
Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

### Erro: "extension does not exist"
O Supabase já vem com as extensões necessárias. Se ocorrer erro, verifique se está usando um projeto Supabase válido.

## 📚 Recursos

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Reference](https://supabase.com/docs/reference/javascript/introduction)

