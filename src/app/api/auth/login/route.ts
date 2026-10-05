import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, ensureDbInitialized } from '../../../../lib/db';
import { createSessionToken, AUTH_COOKIE_NAME } from '../../../../lib/auth-server';

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const db = getDb();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await db.execute({
      sql: 'SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1',
      args: [cleanEmail]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
    }

    const row = result.rows[0];
    const passwordHash = String(row.password_hash);
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
    }

    const userId = String(row.id);
    const name = String(row.name || cleanEmail.split('@')[0]);

    const token = await createSessionToken({
      userId,
      email: cleanEmail,
      name
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name,
        isGuest: false
      }
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json({ error: 'Erro interno ao realizar login.' }, { status: 500 });
  }
}
