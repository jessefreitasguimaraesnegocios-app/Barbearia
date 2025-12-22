# ✅ Checklist de Configuração do Supabase

## 1. ✅ Arquivo .env configurado
- [x] Arquivo `.env` criado na raiz do projeto
- [x] Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` definidas

**⚠️ IMPORTANTE:** Remova as aspas das variáveis se estiverem presentes!

O arquivo `.env` deve estar assim:
```env
VITE_SUPABASE_URL=https://zulvevlxsrlsbzaadqfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**NÃO use aspas:**
```env
# ❌ ERRADO
VITE_SUPABASE_URL="https://..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."

# ✅ CORRETO
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

## 2. ⚠️ Executar o Schema SQL no Supabase

Você precisa executar o arquivo `supabase_schema.sql` no Supabase:

1. Acesse: https://app.supabase.com/project/zulvevlxsrlsbzaadqfu
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New Query**
4. Abra o arquivo `supabase_schema.sql` do projeto
5. Copie **TODO** o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Aguarde a execução (pode levar alguns segundos)

## 3. ⚠️ Reiniciar o servidor de desenvolvimento

Após configurar o `.env`, você **DEVE** reiniciar o servidor:

```bash
# Parar o servidor atual (Ctrl+C no terminal)
# Depois iniciar novamente:
npm run dev
```

As variáveis de ambiente do Vite só são carregadas quando o servidor inicia!

## 4. ✅ Verificar se está funcionando

Após reiniciar, verifique:

1. **Console do navegador (F12):**
   - ✅ Não deve aparecer o erro "Invalid API key"
   - ⚠️ Pode aparecer um aviso sobre Supabase não configurado (se ainda não executou o SQL)

2. **Teste básico:**
   - Acesse a página de login (`/auth`)
   - Tente fazer login com um colaborador
   - Não deve aparecer erros relacionados ao Supabase

## 5. 📋 Próximos Passos (Opcionais)

Depois que tudo estiver funcionando:

- [ ] Migrar dados do localStorage para Supabase
- [ ] Implementar sincronização de dados
- [ ] Configurar autenticação com Supabase Auth (opcional, o app funciona com auth local)

## 🆘 Problemas Comuns

### "Invalid API key" ainda aparece
- ✅ Verifique se removeu as aspas do `.env`
- ✅ Reinicie o servidor (`npm run dev`)
- ✅ Verifique se as credenciais estão corretas

### Erro ao executar o SQL
- Verifique se está usando o SQL Editor correto
- Certifique-se de copiar TODO o conteúdo do arquivo
- Veja o arquivo `README_DATABASE.md` para mais detalhes

### Variáveis não são carregadas
- Certifique-se que o arquivo está na raiz (mesmo nível do `package.json`)
- Certifique-se que as variáveis começam com `VITE_`
- Reinicie o servidor após criar/editar o `.env`

