# ⚙️ Configurar Variáveis de Ambiente

## 🔴 Problema Detectado

O console mostra: **"Supabase não configurado, pulando sincronização"**

Isso significa que o arquivo `.env` não está configurado ou as variáveis não estão corretas.

## ✅ Solução

### Passo 1: Criar arquivo `.env`

Crie um arquivo chamado `.env` na **raiz do projeto** (mesmo nível do `package.json`).

### Passo 2: Adicionar as variáveis

Adicione estas linhas no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
```

### Passo 3: Obter suas credenciais do Supabase

1. Acesse: https://app.supabase.com/project/zulvevlxsrlsbzaadqfu
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### Passo 4: Formato correto

⚠️ **IMPORTANTE**: 
- **NÃO use aspas** nas variáveis
- **NÃO deixe espaços** antes ou depois do `=`

✅ **CORRETO:**
```env
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

❌ **ERRADO:**
```env
VITE_SUPABASE_URL="https://zulvevlxsrlsbzaadqfu.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Passo 5: Reiniciar o servidor

**OBRIGATÓRIO**: Após criar/editar o `.env`, você DEVE reiniciar o servidor:

1. Pare o servidor atual (Ctrl+C no terminal)
2. Inicie novamente: `npm run dev`
3. Recarregue a página no navegador (F5)

## 🔍 Verificar se funcionou

Após reiniciar, no console do navegador (F12) você deve ver:

✅ **Antes (erro):**
```
⚠️ Supabase não está configurado...
Supabase não configurado, pulando sincronização
```

✅ **Depois (correto):**
```
🔄 Sincronizando dados do Supabase...
✅ Dados sincronizados do Supabase: { barbershops: 6, services: 12, collaborators: 7 }
```

## 📝 Exemplo Completo

Seu arquivo `.env` deve ficar assim:

```env
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bHZldmx4c3Jsc2J6YWFkcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTUwNjYsImV4cCI6MjA4MTkzMTA2Nn0.rOlcxCaJrDo-a1OSVTX1Ucv7hVPBIrdP6itrSjcEJZk
```

## ⚠️ Problemas Comuns

### "Invalid API key" ainda aparece
- Verifique se removeu as aspas
- Verifique se não há espaços extras
- Reinicie o servidor

### Variáveis não são carregadas
- Certifique-se que o arquivo está na raiz (mesmo nível do `package.json`)
- Certifique-se que as variáveis começam com `VITE_`
- Reinicie o servidor após criar/editar

### Sincronização ainda não funciona
- Verifique se o Supabase está acessível
- Verifique se executou o `supabase_schema.sql` no banco
- Verifique se executou o `seed_database.sql` no banco
- Verifique o console para erros específicos

## 🎯 Próximos Passos

Depois de configurar o `.env` e reiniciar:

1. ✅ Console deve mostrar sincronização
2. ✅ Dados devem aparecer no app
3. ✅ localStorage deve estar populado
4. ✅ Páginas devem mostrar barbearias, serviços, etc.

