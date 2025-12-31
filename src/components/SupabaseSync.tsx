/**
 * Componente para sincronizar dados do Supabase na inicialização
 */
import { useEffect } from 'react';
import { syncAllFromSupabase } from '@/lib/sync-supabase';
import { isSupabaseReady } from '@/integrations/supabase/client';

export const SupabaseSync = () => {
  useEffect(() => {
    const syncData = async () => {
      if (!isSupabaseReady()) {
        console.log('Supabase não configurado, pulando sincronização');
        return;
      }

      try {
        console.log('🔄 Sincronizando dados do Supabase...');
        const result = await syncAllFromSupabase();
        
        if (result.barbershops || result.services || result.collaborators) {
          console.log('✅ Dados sincronizados do Supabase:', {
            barbershops: result.barbershops?.length || 0,
            services: result.services?.length || 0,
            collaborators: result.collaborators?.length || 0,
          });
          
          // Disparar evento para atualizar componentes
          window.dispatchEvent(new Event('storage'));
        } else {
          console.log('⚠️ Nenhum dado encontrado no Supabase');
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar dados:', error);
      }
    };

    syncData();
  }, []);

  return null; // Componente não renderiza nada
};

