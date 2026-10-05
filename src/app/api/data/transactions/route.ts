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
    const tx = await req.json();

    if (!tx || !tx.id || !tx.description || tx.amount === undefined) {
      return NextResponse.json({ error: 'Dados da transação incompletos' }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO transactions (
        id, user_id, description, amount, type, category, date, 
        payment_method, status, notes, installment_id, recurring_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        description=excluded.description,
        amount=excluded.amount,
        type=excluded.type,
        category=excluded.category,
        date=excluded.date,
        payment_method=excluded.payment_method,
        status=excluded.status,
        notes=excluded.notes,
        installment_id=excluded.installment_id,
        recurring_id=excluded.recurring_id;`,
      args: [
        tx.id,
        session.userId,
        tx.description,
        tx.amount,
        tx.type,
        tx.category,
        tx.date,
        tx.paymentMethod,
        tx.status,
        tx.notes || null,
        tx.installmentId || null,
        tx.recurringId || null,
        tx.createdAt || new Date().toISOString()
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
    return NextResponse.json({ error: 'Erro ao salvar transação' }, { status: 500 });
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

    if (id === 'all') {
      await db.execute({
        sql: 'DELETE FROM transactions WHERE user_id = ?',
        args: [session.userId]
      });
      return NextResponse.json({ success: true, message: 'Todos os lançamentos foram removidos' });
    }

    await db.execute({
      sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      args: [id, session.userId]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return NextResponse.json({ error: 'Erro ao deletar transação' }, { status: 500 });
  }
}
