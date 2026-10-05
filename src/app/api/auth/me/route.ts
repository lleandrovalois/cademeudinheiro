import { NextResponse } from 'next/server';
import { getAuthUserFromSession } from '../../../../lib/auth-server';

export async function GET() {
  try {
    const session = await getAuthUserFromSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        isGuest: false
      }
    });
  } catch (error) {
    console.error('Erro ao verificar sessão do usuário:', error);
    return NextResponse.json({ user: null });
  }
}
