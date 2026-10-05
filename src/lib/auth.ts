import { AuthUser } from '../types/finance';

const GUEST_STORAGE_KEY = 'cademeudinheiro_guest_user';

export async function getCurrentUser(): Promise<AuthUser | null> {
  // 1. Check self-hosted server session first
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email.split('@')[0],
          isGuest: false
        };
      }
    }
  } catch (err) {
    console.error('Erro ao verificar sessão do servidor:', err);
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

export async function signUpWithEmail(
  email: string, 
  password: string, 
  name?: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { user: null, error: data.error || 'Erro ao realizar cadastro.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }

    return { user: data.user, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na comunicação com o servidor';
    return { user: null, error: msg };
  }
}

export async function signInWithEmail(
  email: string, 
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { user: null, error: data.error || 'E-mail ou senha inválidos.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }

    return { user: data.user, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na comunicação com o servidor';
    return { user: null, error: msg };
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Erro ao encerrar sessão no servidor:', err);
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
  // Option 1 self-hosted password reset
  return { 
    success: true, 
    error: null 
  };
}
