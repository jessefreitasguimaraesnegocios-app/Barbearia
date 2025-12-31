# 🧪 Como Testar o App

## ✅ Checklist de Teste

### 1. Servidor de Desenvolvimento

O servidor deve estar rodando. Acesse:
- **URL local**: http://localhost:5173
- Verifique se a página carrega sem erros

### 2. Console do Navegador (F12)

Abra o Console (F12) e verifique:

#### Sincronização do Supabase
Você deve ver mensagens como:
```
🔄 Sincronizando dados do Supabase...
✅ Dados sincronizados do Supabase: { barbershops: 6, services: 12, collaborators: 7 }
```

Ou, se não houver dados:
```
⚠️ Nenhum dado encontrado no Supabase
```

#### Erros a verificar
- ❌ `Invalid API key` → Verifique o `.env`
- ❌ `401 Unauthorized` → Verifique RLS policies
- ❌ `Network error` → Verifique conexão

### 3. Dados Visíveis no App

#### Página Principal (`/`)
- Deve mostrar barbearias cadastradas
- Se não aparecer nada, os dados não sincronizaram

#### Página de Barbearias (`/barbearias`)
- Deve listar todas as barbearias do seed
- Verifique se aparecem:
  - BarberBook Premium Center
  - Barbearia Elite Jardins
  - Studio BarberBook Moema
  - etc.

#### Página de Serviços (`/services`)
- Deve mostrar serviços disponíveis
- Verifique se aparecem os serviços cadastrados

#### Admin (`/admin`)
- Faça login com um colaborador do seed:
  - Email: `miguel.santos@barberbook.com`
  - Senha: `senha123`
- Deve mostrar dados no dashboard

### 4. Verificar localStorage

No Console (F12), execute:

```javascript
// Verificar barbearias
JSON.parse(localStorage.getItem('barberbook_admin_barbershops')).length
// Deve retornar: 6 (ou o número de barbearias no seed)

// Verificar serviços
JSON.parse(localStorage.getItem('barberbook_admin_services')).length
// Deve retornar o número de serviços

// Verificar colaboradores
JSON.parse(localStorage.getItem('barberbook_admin_collaborators')).length
// Deve retornar: 7 (ou o número de colaboradores no seed)
```

### 5. Verificar Sincronização Manual

Se os dados não aparecerem, force uma nova sincronização:

1. No Console (F12), execute:
```javascript
localStorage.removeItem('barberbook_admin_barbershops_last_sync');
localStorage.removeItem('barberbook_admin_services_last_sync');
localStorage.removeItem('barberbook_admin_collaborators_last_sync');
```

2. Recarregue a página (F5)

3. Verifique o console novamente

### 6. Verificar Banco de Dados

No Supabase SQL Editor, execute:

```sql
-- Verificar se os dados existem
SELECT COUNT(*) as total_barbearias FROM barbershops;
SELECT COUNT(*) as total_servicos FROM services;
SELECT COUNT(*) as total_colaboradores FROM collaborators;

-- Verificar dados específicos
SELECT name, email FROM barbershops LIMIT 5;
SELECT title, price FROM services LIMIT 5;
SELECT name, email, role FROM collaborators LIMIT 5;
```

### 7. Problemas Comuns

#### Dados não aparecem
1. ✅ Verifique se executou o `seed_database.sql` no Supabase
2. ✅ Verifique o console para erros
3. ✅ Verifique se o `.env` está configurado
4. ✅ Verifique as políticas RLS

#### Erro 401/403
- As políticas RLS podem estar bloqueando
- Execute: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- Verifique se há políticas de SELECT públicas

#### Sincronização não acontece
- Verifique se `SupabaseSync` está no `App.tsx`
- Verifique se `isSupabaseReady()` retorna `true`
- Verifique o console para erros de conexão

## 🎯 Teste Completo

1. **Limpar localStorage** (opcional, para teste limpo):
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Recarregar a página**

3. **Verificar console** - Deve mostrar sincronização

4. **Verificar dados** - Devem aparecer no app

5. **Testar funcionalidades**:
   - Navegar entre páginas
   - Fazer login
   - Acessar admin
   - Ver barbearias e serviços

## ✅ Resultado Esperado

Após executar o seed e abrir o app:

- ✅ Console mostra sincronização bem-sucedida
- ✅ localStorage contém os dados
- ✅ Páginas mostram barbearias, serviços e colaboradores
- ✅ Admin funciona com login dos colaboradores do seed
- ✅ Nenhum erro no console

## 🐛 Se algo não funcionar

1. Verifique o console do navegador
2. Verifique o terminal onde o servidor está rodando
3. Verifique se o `.env` está correto
4. Verifique se o Supabase está acessível
5. Consulte `SINCRONIZAR_DADOS.md` para mais detalhes

