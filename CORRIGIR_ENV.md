# 🔧 Correção do arquivo .env

## ❌ Problema Atual

Seu arquivo `.env` está assim (COM ASPAS - ERRADO):
```env
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://zulvevlxsrlsbzaadqfu.supabase.co"
```

## ✅ Correção Necessária

Remova as aspas! Deve ficar assim:

```env
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bHZldmx4c3Jsc2J6YWFkcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTUwNjYsImV4cCI6MjA4MTkzMTA2Nn0.rOlcxCaJrDo-a1OSVTX1Ucv7hVPBIrdP6itrSjcEJZk
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
```

## 📝 Passos para Corrigir

1. Abra o arquivo `.env` na raiz do projeto
2. Remova as aspas (`"`) de ambas as linhas
3. Salve o arquivo
4. **IMPORTANTE:** Reinicie o servidor (`npm run dev`)

## ⚠️ IMPORTANTE

No Vite, variáveis de ambiente **NÃO devem ter aspas**. As aspas serão incluídas como parte do valor, causando erros de autenticação.

