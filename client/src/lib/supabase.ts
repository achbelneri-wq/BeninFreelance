import { createClient, SupabaseClient } from '@supabase/supabase-js';

// On utilise les variables d'environnement exposées par Vite (VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Créer un client Supabase même si les clés sont manquantes (pour éviter les erreurs)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase URL et Key manquantes - fonctionnalités Supabase désactivées');
  // Créer un client factice pour éviter les erreurs
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    }
  } as unknown as SupabaseClient;
}

export { supabase };
