import { NextResponse } from 'next/server';
import { getDb, ensureDbInitialized } from '../../../../lib/db';
import { getAuthUserFromSession } from '../../../../lib/auth-server';

export async function POST(req: Request) {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const goal = await req.json();

    if (!goal || !goal.id || !goal.title || goal.targetAmount === undefined) {
      return NextResponse.json({ error: 'Dados da meta incompletos' }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO savings_goals (id, user_id, title, target_amount, current_amount, deadline, color, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        target_amount=excluded.target_amount,
        current_amount=excluded.current_amount,
        deadline=excluded.deadline,
        color=excluded.color,
        icon=excluded.icon;`,
      args: [
        goal.id,
        session.userId,
        goal.title,
        goal.targetAmount,
        goal.currentAmount || 0,
        goal.deadline || null,
        goal.color || '#10b981',
        goal.icon || 'ShieldCheck'
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    return NextResponse.json({ error: 'Erro ao salvar meta' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuthUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await ensureDbInitialized();
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await db.execute({
      sql: 'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
      args: [id, session.userId]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    return NextResponse.json({ error: 'Erro ao deletar meta' }, { status: 500 });
  }
}
