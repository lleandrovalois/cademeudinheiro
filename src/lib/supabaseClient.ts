import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (url && anonKey) return { url, anonKey };
    return null;
  }

  // Check localStorage first (user-entered in UI), then env vars
  const storedUrl = localStorage.getItem('fincontrol_supabase_url');
  const storedKey = localStorage.getItem('fincontrol_supabase_key');
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  if (url && anonKey && url.startsWith('http')) {
    return { url, anonKey };
  }

  return null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
    } catch (err) {
      console.error('Erro ao inicializar Supabase:', err);
      return null;
    }
  }

  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = null;
}
