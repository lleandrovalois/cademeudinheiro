import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, ensureDbInitialized } from '../../../../lib/db';
import { createSessionToken, AUTH_COOKIE_NAME } from '../../../../lib/auth-server';
import { DEFAULT_CATEGORIES } from '../../../../lib/mockData';

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const db = getDb();

    const { email, password, name } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'A senha deve conter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

    // Check if user already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [cleanEmail]
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Já existe uma conta cadastrada com este e-mail.' }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [userId, cleanEmail, cleanName, passwordHash, createdAt]
    });

    // Seed default categories for this user
    for (const cat of DEFAULT_CATEGORIES) {
      const catId = `cat-${crypto.randomUUID().slice(0, 8)}`;
      await db.execute({
        sql: 'INSERT INTO categories (id, user_id, name, icon, color, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [catId, userId, cat.name, cat.icon, cat.color, cat.type, createdAt]
      });
    }

    // Create session token
    const token = await createSessionToken({
      userId,
      email: cleanEmail,
      name: cleanName
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName,
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
    console.error('Erro na rota de registro:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}
