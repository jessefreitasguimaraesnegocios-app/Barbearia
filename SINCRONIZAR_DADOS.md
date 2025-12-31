# 🔄 Como Sincronizar Dados do Supabase

## ✅ O que foi implementado

O app agora sincroniza automaticamente os dados do Supabase para o localStorage na inicialização.

## 🔧 Como funciona

1. **Na inicialização do app**: O componente `SupabaseSync` busca dados do Supabase
2. **Conversão de dados**: Converte do formato do banco para o formato do app
3. **Armazenamento local**: Salva no localStorage para uso offline
4. **Atualização automática**: Dispara eventos para atualizar componentes

## 📋 Dados sincronizados

- ✅ **Barbearias** (`barbershops`)
- ✅ **Serviços** (`services`)  
- ✅ **Colaboradores** (`collaborators`)

## ⚠️ Importante

- A sincronização acontece **automaticamente** ao abrir o app
- Os dados são sincronizados **a cada 5 minutos** (cache)
- Se o Supabase não estiver configurado, usa apenas localStorage
- Os dados do Supabase **substituem** os do localStorage

## 🐛 Troubleshooting

### Dados não aparecem no app

1. **Verifique o console do navegador** (F12):
   - Deve mostrar mensagens de sincronização
   - Procure por erros de RLS ou conexão

2. **Verifique se o Supabase está configurado**:
   - Arquivo `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Reinicie o servidor após configurar

3. **Verifique as políticas RLS**:
   - Execute `supabase_schema.sql` no Supabase
   - Verifique se as políticas permitem SELECT público

4. **Verifique se os dados existem no banco**:
   - No Supabase SQL Editor, execute:
   ```sql
   SELECT COUNT(*) FROM barbershops;
   SELECT COUNT(*) FROM services;
   SELECT COUNT(*) FROM collaborators;
   ```

### Forçar nova sincronização

1. **Limpar cache do localStorage**:
   - Abra o Console do navegador (F12)
   - Execute:
   ```javascript
   localStorage.removeItem('barberbook_admin_barbershops_last_sync');
   localStorage.removeItem('barberbook_admin_services_last_sync');
   localStorage.removeItem('barberbook_admin_collaborators_last_sync');
   ```
   - Recarregue a página

2. **Ou limpar tudo e recarregar**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## 📝 Logs

O componente `SupabaseSync` mostra logs no console:

- `🔄 Sincronizando dados do Supabase...` - Iniciando
- `✅ Dados sincronizados do Supabase: { ... }` - Sucesso
- `⚠️ Nenhum dado encontrado no Supabase` - Banco vazio
- `❌ Erro ao sincronizar dados:` - Erro

## 🔍 Verificar se sincronizou

1. Abra o Console (F12)
2. Procure por mensagens de sincronização
3. Verifique o localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('barberbook_admin_barbershops')).length
   ```

## 💡 Notas

- A sincronização é **unidirecional** (Supabase → localStorage)
- Mudanças no app ainda vão para localStorage primeiro
- Para salvar no Supabase, use os serviços (`barbershopsService`, etc.)

