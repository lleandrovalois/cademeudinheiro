import { getSupabaseClient } from './supabaseClient';
import { AuthUser } from '../types/finance';

const GUEST_STORAGE_KEY = 'cademeudinheiro_guest_user';

export async function getCurrentUser(): Promise<AuthUser | null> {
  // 1. Check Supabase session first
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
          isGuest: false
        };
      }
    } catch (err) {
      console.error('Erro ao verificar sessão Supabase:', err);
    }
  }

  // 2. Check Guest user in localStorage
  if (typeof window !== 'undefined') {
    const guestData = localStorage.getItem(GUEST_STORAGE_KEY);
    if (guestData) {
      try {
        return JSON.parse(guestData) as AuthUser;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function signUpWithEmail(email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      error: 'Supabase não está configurado. Conecte sua URL e Chave Anon nas Configurações da Nuvem ou use o Modo Convidado.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name?.trim() || email.split('@')[0] }
      }
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Clear any guest session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: name?.trim() || data.user.email?.split('@')[0],
          isGuest: false
        },
        error: null
      };
    }

    return { user: null, error: 'Confirmação enviada por e-mail, verifique sua caixa de entrada.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
    return { user: null, error: msg };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      error: 'Supabase não está configurado. Conecte sua URL e Chave Anon nas Configurações da Nuvem ou use o Modo Convidado.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Clear any guest session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          isGuest: false
        },
        error: null
      };
    }

    return { user: null, error: 'Usuário não encontrado' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao realizar login';
    return { user: null, error: msg };
  }
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao deslogar do Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
}

export function loginAsGuest(guestName = 'Convidado'): AuthUser {
  const guestUser: AuthUser = {
    id: 'guest_user_demo',
    email: 'convidado@cademeudinheiro.local',
    name: guestName,
    isGuest: true
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
  }

  return guestUser;
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao recuperar senha';
    return { success: false, error: msg };
  }
}
