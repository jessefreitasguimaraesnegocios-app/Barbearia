import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let sessionChecked = false;

    // Verificar se há uma sessão ativa ao carregar o hook
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          sessionChecked = true;
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) {
          setUser(null);
          sessionChecked = true;
        }
      } finally {
        if (mounted && sessionChecked) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // Ouvir mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Aguardar getSession completar antes de processar onAuthStateChange
      if (!sessionChecked) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Limpar a inscrição quando o componente for desmontado
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
    }
    return { error };
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
};

export default useAuth;
