import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { getLoginUrl } from "@/const";

// ✅ INTERFACE STRICTE basée sur votre schema.sql
export interface UserProfile {
  id: number;              // SERIAL PRIMARY KEY
  auth_id: string;         // UUID de Supabase Auth
  name: string;
  email: string;
  bio: string | null;
  phone: string | null;
  city: string | null;
  skills: string | null;
  languages: string | null;
  response_time: string | null;
  avatar_url: string | null;
  is_seller: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  // Données fusionnées pour rétrocompatibilité
  name?: string;
  bio?: string;
  phone?: string;
  city?: string;
  skills?: string;
  languages?: string;
  response_time?: string;
  avatar_url?: string;
  is_seller?: boolean;
}

export function useAuth(options: { 
  redirectOnUnauthenticated?: boolean; 
  redirectPath?: string 
} = {}) {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null); // ✅ État séparé
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ✅ RÉCUPÉRATION CORRECTE avec auth_id (UUID)
    async function fetchProfile(authUser: User) {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)  // ✅ CORRECT : auth_id = UUID
          .single();

        if (error) {
          console.error("❌ Erreur fetch profil:", error.message);
          if (mounted) {
            setProfile(null);
            setUser(authUser); // Fallback : données Auth uniquement
          }
          return;
        }

        if (mounted && profile) {
          setProfile(profile); // ✅ Sauvegarde du profil complet
          
          // Fusion pour rétrocompatibilité
          setUser({
            ...authUser,
            ...profile,          // Écrase avec données DB
            id: authUser.id,     // Garde UUID de Auth
            name: profile.name,  // ✅ Depuis DB uniquement
            avatar_url: profile.avatar_url, // ✅ Colonne correcte
          });
        }
      } catch (err) {
        console.error("❌ Erreur inattendue:", err);
        if (mounted) setUser(authUser);
      }
    }

    // Initialisation
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Écouteur de changements
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setLoading(true);

        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Redirection
  useEffect(() => {
    if (options.redirectOnUnauthenticated && !loading && !session?.user) {
      window.location.href = options.redirectPath || getLoginUrl();
    }
  }, [loading, session, options]);

  return {
    user,        // Données Auth + fusion (rétrocompatibilité)
    profile,     // ✅ DONNÉES BRUTES DE public.users
    session,
    loading,
    isAuthenticated: !!session?.user,
    logout: () => supabase.auth.signOut(),
  };
}
