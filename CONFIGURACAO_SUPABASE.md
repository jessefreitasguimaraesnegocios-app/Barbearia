# 🔧 Configuração do Supabase

## Erro: "Invalid API key"

Se você está vendo o erro **"Invalid API key"**, significa que as variáveis de ambiente do Supabase não estão configuradas.

## ✅ Solução Rápida

### Opção 1: Configurar Supabase (Recomendado para produção)

1. **Crie um arquivo `.env` na raiz do projeto** (mesmo nível do `package.json`)

2. **Adicione as seguintes variáveis:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

3. **Onde encontrar as credenciais:**
   - Acesse: https://app.supabase.com
   - Selecione seu projeto
   - Vá em **Settings** (⚙️) > **API**
   - Copie:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

### Opção 2: Usar sem Supabase (Desenvolvimento local)

Se você **não quer usar Supabase agora**, o aplicativo funciona normalmente com autenticação local (localStorage). O erro não afeta o funcionamento básico.

Para remover o aviso, crie um arquivo `.env` com valores vazios:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## 🚀 Próximos Passos

1. Execute o arquivo `supabase_schema.sql` no SQL Editor do Supabase
2. Configure as variáveis de ambiente no `.env`
3. Reinicie o servidor de desenvolvimento
4. Teste o aplicativo

## 📝 Verificação

Para verificar se está funcionando, abra o console do navegador (F12). Você deve ver:
- ✅ **Se configurado:** Nenhum erro relacionado ao Supabase
- ⚠️ **Se não configurado:** Um aviso (não é erro crítico)

## 🆘 Ainda com problemas?

1. Verifique se o arquivo `.env` está na raiz do projeto
2. Verifique se as variáveis começam com `VITE_`
3. Certifique-se de reiniciar o servidor após criar/editar o `.env`
4. Verifique se as credenciais estão corretas (sem espaços extras)

