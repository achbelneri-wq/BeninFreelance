import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';
// Assure-toi que ce type User correspond bien à ta table SQL
import { User } from '@/lib/supabase-client'; 

export function useSupabaseAuth() {
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction utilitaire pour récupérer le profil
  const fetchProfile = async (userId: string) => {
    try {
      // ⚠️ IMPORTANT : Vérifie si ta colonne s'appelle 'auth_id' ou juste 'id' dans ta table 'users'
      // Si c'est la clé primaire liée à auth.users, c'est souvent 'id'.
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId) // J'ai mis 'id' par défaut (plus courant), remets 'auth_id' si c'est ton choix
        .single();

      if (error && error.code !== 'PGRST116') { // Ignorer erreur "introuvable"
        console.error('Profile fetch error:', error);
      }
      return data as User | null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Session Auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user && mounted) {
          setAuthUser(session.user);
          // 2. Profil DB
          const profile = await fetchProfile(session.user.id);
          if (mounted) setDbUser(profile);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 3. Écouteur
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setAuthUser(session.user);
        
        // Optimisation : ne re-fetch pas si on a déjà le bon user
        if (!dbUser || dbUser.id !== session.user.id) {
           const profile = await fetchProfile(session.user.id);
           if (mounted) setDbUser(profile);
        }
      } else {
        setAuthUser(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // ✅ CORRECTION CRUCIALE ICI :
          // On redirige vers le dashboard car '/auth/callback' n'existe pas dans ton App.tsx
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthUser(null);
      setDbUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  };

  return {
    authUser, // L'user technique (Supabase Auth)
    dbUser,   // L'user business (Ta table 'users')
    // On combine les deux pour l'app
    user: dbUser ? { ...dbUser, email: authUser?.email } : (authUser ? { id: authUser.id, email: authUser.email } : null),
    loading,
    error,
    isAuthenticated: !!authUser,
    signInWithOAuth,
    signOut,
  };
}
