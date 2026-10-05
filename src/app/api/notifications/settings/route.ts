import { NextResponse } from 'next/server';
import { getAuthUserFromSession } from '../../../../lib/auth-server';
import { getDb, ensureDbInitialized } from '../../../../lib/db';

export async function GET() {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();

    const res = await db.execute({
      sql: 'SELECT email_notifications_enabled FROM users WHERE id = ? LIMIT 1',
      args: [session.userId],
    });

    const isSmtpConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );

    let enabled = true;
    if (res.rows.length > 0 && res.rows[0].email_notifications_enabled !== undefined) {
      enabled = Number(res.rows[0].email_notifications_enabled) !== 0;
    }

    return NextResponse.json({
      enabled,
      isSmtpConfigured,
      smtpHost: process.env.SMTP_HOST || 'Não configurado',
      smtpUser: process.env.SMTP_USER ? maskEmail(process.env.SMTP_USER) : 'Não configurado',
    });
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const { enabled } = await req.json();

    await db.execute({
      sql: 'UPDATE users SET email_notifications_enabled = ? WHERE id = ?',
      args: [enabled ? 1 : 0, session.userId],
    });

    return NextResponse.json({ success: true, enabled: Boolean(enabled) });
  } catch (error) {
    console.error('Erro ao salvar preferências de notificação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar preferências' }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 3 ? `${name.slice(0, 3)}***` : name;
  return `${maskedName}@${domain}`;
}
