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
    const bill = await req.json();

    if (!bill || !bill.id || !bill.title || bill.amount === undefined) {
      return NextResponse.json({ error: 'Dados da conta fixa incompletos' }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO recurring_bills (
        id, user_id, title, amount, category, due_day, frequency, active, notes, paid_months, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        amount=excluded.amount,
        category=excluded.category,
        due_day=excluded.due_day,
        frequency=excluded.frequency,
        active=excluded.active,
        notes=excluded.notes,
        paid_months=excluded.paid_months;`,
      args: [
        bill.id,
        session.userId,
        bill.title,
        bill.amount,
        bill.category,
        bill.dueDay,
        bill.frequency || 'monthly',
        bill.active ? 1 : 0,
        bill.notes || null,
        JSON.stringify(bill.paidMonths || []),
        bill.createdAt || new Date().toISOString()
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar conta fixa:', error);
    return NextResponse.json({ error: 'Erro ao salvar conta fixa' }, { status: 500 });
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
      sql: 'DELETE FROM recurring_bills WHERE id = ? AND user_id = ?',
      args: [id, session.userId]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar conta fixa:', error);
    return NextResponse.json({ error: 'Erro ao deletar conta fixa' }, { status: 500 });
  }
}
