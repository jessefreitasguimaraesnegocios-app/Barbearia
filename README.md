# 💈 BarberBook Pro

Sistema completo de gestão para barbearias com agendamento, loja virtual, controle financeiro e muito mais.

## ✨ Funcionalidades

- 📅 **Agendamento Online** - Sistema completo de reservas
- 🛒 **Loja Virtual** - Venda de produtos para clientes
- 👥 **Gestão de Colaboradores** - Controle de barbeiros e funcionários
- 💰 **Controle Financeiro** - Receitas, despesas e relatórios
- 🎯 **Programa VIP** - Clientes premium com benefícios
- 📦 **Controle de Estoque** - Produtos e consumíveis
- 💳 **Pagamento PIX** - Integração com validação automática de comprovantes
- 🔐 **Autenticação** - Login seguro com Google OAuth

## 🚀 Começando

### Instalação

```bash
# Clonar repositório
git clone https://github.com/jessefreitasguimaraesnegocios-app/Barbearia.git

# Instalar dependências
npm install

# Configurar variáveis de ambiente (ver SETUP.md)
# Criar arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

# Executar projeto
npm run dev
```

### Configuração Completa

Para instruções detalhadas de configuração, consulte: **[SETUP.md](./SETUP.md)**

## 📚 Documentação

- **[SETUP.md](./SETUP.md)** - Guia completo de configuração (inclui deploy no Vercel e OAuth Google)

## 🗄️ Banco de Dados

### Scripts SQL

1. **`supabase_schema.sql`** - Cria a estrutura completa do banco
2. **`supabase_schema_corrigido.sql`** - Corrige políticas RLS
3. **`seed_database.sql`** - Popula com dados de exemplo
4. **`clear_database.sql`** - Limpa todos os dados

### Ordem de Execução

```sql
-- 1. Criar estrutura
-- Execute: supabase_schema.sql

-- 2. Corrigir RLS
-- Execute: supabase_schema_corrigido.sql

-- 3. Popular dados (opcional)
-- Execute: seed_database.sql
```

## 🛠️ Tecnologias

- **React** + **TypeScript**
- **Vite** - Build tool
- **Supabase** - Backend (PostgreSQL + Auth)
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Vercel** - Deploy

## 📝 Estrutura do Projeto

```
Barbearia/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Serviços (PIX, validação, etc.)
│   ├── lib/            # Utilitários e storage
│   ├── data/           # Dados padrão
│   └── integrations/   # Integrações (Supabase)
├── supabase_schema.sql      # Schema do banco
├── supabase_schema_corrigido.sql  # Correções RLS
├── seed_database.sql         # Dados de exemplo
└── clear_database.sql        # Limpar dados
```

## 🔐 Autenticação

O sistema suporta:
- ✅ Login com email/senha (localStorage)
- ✅ Login com Google (Supabase OAuth)

## 📄 Licença

Este projeto é privado.

## 🤝 Suporte

Para dúvidas ou problemas, consulte a documentação em `SETUP.md` ou abra uma issue no repositório.
