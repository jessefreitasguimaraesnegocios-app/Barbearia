# 🔴 CORREÇÃO URGENTE - Arquivo .env

## ❌ Problemas Encontrados

Seu arquivo `.env` tem os seguintes problemas:

1. **Nome da variável errado**: Usa `VITE_SUPABASE_ANON_KEY` mas deveria ser `VITE_SUPABASE_PUBLISHABLE_KEY`
2. **Espaço após o `=`**: `VITE_SUPABASE_URL= https://...` (deveria ser sem espaço)
3. **Variável cortada**: A chave pode estar incompleta

## ✅ Solução

### Opção 1: Editar manualmente

1. Abra o arquivo `.env` na raiz do projeto
2. **Substitua TODO o conteúdo** por:

```env
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bHZldmx4c3Jsc2J6YWFkcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTUwNjYsImV4cCI6MjA4MTkzMTA2Nn0.rOlcxCaJrDo-a1OSVTX1Ucv7hVPBIrdP6itrSjcEJZk
```

### Opção 2: Recriar o arquivo

1. Delete o arquivo `.env`
2. Crie um novo arquivo `.env` na raiz
3. Cole o conteúdo acima

## ⚠️ IMPORTANTE

1. **NÃO use aspas** nas variáveis
2. **NÃO deixe espaços** após o `=`
3. **NOME CORRETO**: `VITE_SUPABASE_PUBLISHABLE_KEY` (não `VITE_SUPABASE_ANON_KEY`)

## 🔄 Após corrigir

1. **Pare o servidor** (Ctrl+C)
2. **Reinicie**: `npm run dev`
3. **Recarregue a página** no navegador (F5)
4. **Verifique o console** - deve mostrar sincronização

## ✅ Verificação

No console do navegador (F12), você deve ver:

```
🔄 Sincronizando dados do Supabase...
✅ Dados sincronizados do Supabase: { barbershops: 6, services: 12, collaborators: 7 }
```

**NÃO** deve mais aparecer:
```
⚠️ Supabase não está configurado...
Supabase não configurado, pulando sincronização
```

